import { create } from "zustand";
import { getSocket } from "../services/chatService";
import  axiosInstance  from "../services/urlService";




export const useChatStore=create((set,get)=>({
    conversations:[],//list of conversations for the logged in user
    currentConversation:null,//the conversation that is currently open in the chat window
    messages:[],//list of messages for the current conversation
    loading:false,//loading state for fetching conversations and messages
    error:null,//error state for fetching conversations and messages
    onlineUsers:new Map(),//map of online users with their socket ids
    typingUsers:new Map(),//map to track which users are currently typing in which conversations



    //socket event listener setup
    initsocketListeners:()=>{
        const socket=getSocket();
        if(!socket) return;

        //remove existing listeners to prevent duplicate event handling
        socket.off("receive_message");
        socket.off("user_typing");
        socket.off("user_status");
        socket.off("message_send");
        socket.off("message_error");
        socket.off("message_deleted");


        //listen for incoming messages
        socket.on("receive_message",({message})=>{
            get().receiveMessage(message);
        });


        //confirmation of message sent or delivery
        socket.on("message_send",({message})=>{
    set(state=>({
    messages:state.messages.map(msg=>msg._id===message._id?{...msg}:msg)

    }));
        });
    

        //upadate message status
        socket.on("message_status_update",({messageId,messageStatus})=>{
    set((state)=>({
           messages:state.messages.map(msg=>msg._id===messageId?{...msg,messageStatus}:msg)
        }));
        });

       // handle reactions on messages
         socket.on("reaction_update",({messageId,reactions})=>{
    set((state)=>({
           messages:state.messages.map(msg=>msg._id===messageId?{...msg,reactions}:msg)
        }));
         });

        // handle remove message from local state when deleted
        socket.on("message_deleted",({deletedMessageId})=>{
    set((state)=>({
           messages:state.messages.filter(msg=>msg._id!==deletedMessageId)
        }));
         });

         //handle any message sending errors
         socket.on("message_error",({error})=>{
             console.error("Message sending error:",error);
         });

         //listen for typing indicators
        socket.on("user_typing", ({ userId,conversationId,isTyping})=>{
    set((state)=>{
        // typingUsers:state.typingUsers.set(`${conversationId}-${userId}`,isTyping)
        const newTyingUsers=new Map(state.typingUsers);
        if(!newTyingUsers.has(conversationId)){
            newTyingUsers.set(conversationId, new Set());
        }

       const typingSet= newTyingUsers.get(conversationId);
       if(isTyping){
           typingSet.add(userId);
       }else{
           typingSet.delete(userId);
       }
         return {typingUsers:newTyingUsers};
    });
         });

         //track online/offline status of users
            socket.on("user_status",({userId,isOnline,lastSeen})=>{
    set((state)=>{
        const newOnlineUsers=new Map(state.onlineUsers);
        newOnlineUsers.set(userId,{isOnline,lastSeen});
        return {onlineUsers:newOnlineUsers};
    });
            });

            //emit status check for all users when socket connects
            const {conversations}=get();
            if(conversations?.data?.length>0){
                conversations.data?.forEach(conv=>{
                    const otherUser=conv.participants.find(p=>p._id!==get().currentUser._id);


                    if(otherUser._id){
                        socket.emit("get_online_status",otherUser._id,(status)=>{
                            set((state)=>{
                                const newOnlineUsers=new Map(state.onlineUsers);
                                newOnlineUsers.set(status.userId,{
                                    isOnline:status.isOnline,
                                    lastSeen:status.lastSeen
                                });
                                return {onlineUsers:newOnlineUsers};
                            });
                        });

                    }
                });
            }

    },


    setCurrentUser:(user)=>set({currentUser:user}),

    fetchConversations:async()=>{
        set({loading:true,error:null});
        try{
            const {data}= await axiosInstance.get("/chats/conversations");
            set({conversations:data,loading:false});
            get().initsocketListeners();//initialize socket listeners after fetching conversations to ensure we have the necessary context for online status and typing indicators
            return data;
        } catch (error) {
            set({
                error:error?.response?.data?.message || error?.message,
                loading:false
            });
            return null;
        } 
        },
//fetch messages for a specific conversation
        fetchMessages:async(conversationId)=>{
if(!conversationId) return;

set({loading:true,error:null});
try{
    const {data}= await axiosInstance.get(`/chats/conversations/${conversationId}/messages`);
   const messageArray= data.data || data ||[];
    set({messages:messageArray,
        currentConversation:conversationId,
        loading:false
    });

//after fetching messages, we can also check the online status of participants in this conversation(mark unread messages as read and update online status)
const{markMessagesAsRead}=get();
markMessagesAsRead();

    return messageArray;


}catch(error){
    set({
        error:error?.response?.data?.message || error?.message,
        loading:false
    });
    return [];
}
        },



        //send a new message in a conversation in real time using socket.io and also update the local state optimistically for better user experience
        sendMessage:async(formData)=>{
            const senderId=formData.get("senderId");
            const receiverId=formData.get("receiverId");
            const media=formData.get("media");
            const content=formData.get("content");
            const messageStatus=formData.get("messageStatus");

            const socket=getSocket();

            const {conversations}=get();

            let conversationId=null;
            if(conversations?.data?.length>0){
                const conversation=conversations.data.find(conv=>
                    conv.participants.some(p=>p._id===senderId)&&
                    conv.participants.some(p=>p._id===receiverId));

                if(conversation){
                    conversationId=conversation._id;
                    set({currentConversation:conversationId});
                }
            }

            // temporarily create a message object with a temporary id for optimistic UI update
            const tempId=`temp-${Date.now()}`;

            const optimisticMessage={
                _id:tempId,
                sender:{_id:senderId},
                receiver:{_id:receiverId},
                conversation:conversationId,
                imageOrVideoUrl:media&& typeof media !== "string" ? URL.createObjectURL(media):null,
                content:content,
                conntentType:media? media.type.startsWith("image")?"image":"video":"text",
               createdAt:new Date().toISOString(),
               messageStatus:messageStatus
            };

            set(state=>({
                messages:[...state.messages,optimisticMessage]
             }));

try{
    const {data}= await axiosInstance.post("/chats/send-message",formData,{headers:{"Content-Type":"multipart/form-data"}});
    const messageData=data.data || data;

    //replace the optimistic message with the actual message from the server
    set(state=>({
        messages:state.messages.map(msg=>msg._id===tempId?messageData:msg)
     }));
     return messageData;
}catch(error){
    console.error("Error sending message:",error);
    set(state=>({
        messages:state.messages.map(msg=>msg._id===tempId?{...msg,messageStatus:"failed"}:msg),
        error: error?.response?.data?.message || error?.message
     }));
     
     throw error;
    }

},


        receiveMessage:(message)=>{
            if(!message) return;

            const {currentConversation,currentUser,messages}=get();

            const messageExists=messages.some(msg=>msg._id===message._id);
            if(messageExists) return;//avoid duplicate messages

            if(message.conversation===currentConversation){
                set(state=>({
                    messages:[...state.messages,message]
                }));
            //automatically mark the message as read if it's for the current conversation and the receiver is the logged in user
                if(message?.receiver?._id===currentUser?._id){
                    get().markMessagesAsRead();
                }

            }
            console.log("currentUser", currentUser?._id);
            console.log("receiver", message?.receiver?._id);
            console.log("sender", message?.sender?._id);
//update conversation preview and unread count
            set((state)=>{
                const updatedConversations=state.conversations?.data?.map(conv=>{
                    if(conv._id===message.conversation){
                        return {
                            ...conv,
                            lastMessage:message,
                            unreadCount:message?.receiver?._id===currentUser._id?(conv.unreadCount||0)+1:conv.unreadCount||0
                        }
                    }
                    return conv;
                });
                return {
                    conversations:{
                        ...state.conversations,
                        data:updatedConversations
                    }
                };
            });
        
        },

       // mark messages as read when the user opens a conversation and update the local state and also emit a socket event to notify the sender about the read status 
   markMessagesAsRead:async()=>{
    const {messages,currentUser}=get();
    if(!messages.length||!currentUser) return;

    const unreadMessageIds=messages.filter(msg=>msg.messageStatus!=="read"&&msg.receiver?._id===currentUser._id).map(msg=>msg._id).filter(Boolean);

    if(unreadMessageIds.length===0) return;

    try{

        const {data}= await axiosInstance.put("/chats/messages/read",{messageIds:unreadMessageIds});
        console.log("Messages marked as read:",data);
        set(state=>({
            messages:state.messages.map(msg=>unreadMessageIds.includes(msg._id)?{...msg,messageStatus:"read"}:msg)
        }));
        //emit socket event to notify sender about read status update
        const socket=getSocket();
        if(socket){
            socket.emit("message_read",{
               messageIds: unreadMessageIds,
               senderId:messages[0]?.sender?._id
            });
        }
    }catch(error){
        console.error("failed to mark messages as read:",error);
    }
    
   },

   deleteMessage:async(messageId)=>{
    if(!messageId) return;
    try{
        await axiosInstance.delete(`/chats/messages/${messageId}`);
        set(state=>({
            messages:state.messages.filter(msg=>msg._id!==messageId)
        }));
        return true;
    }catch(error){
        console.error("Failed to delete message:",error);
        set({error:error?.response?.data?.message || error?.message});
        return false;
    }
   },

   //add reaction to a message
   addReaction:async(messageId,emoji)=>{
  const socket=getSocket();
  const {currentUser}=get();
    if(socket||currentUser) {
        socket.emit("add_reaction",{
            messageId,
            emoji,
            userId:currentUser?._id
        });
    }
},

startTyping:(receiverId)=>{
    const {currentConversation}=get();
    const socket=getSocket();
    if(socket&&currentConversation&&receiverId){
        socket.emit("typing_start",{
            conversationId:currentConversation,
            receiverId});
    }

},
    stopTyping: (receiverId) => {
        const { currentConversation } = get();
        const socket = getSocket();
        if (socket && currentConversation && receiverId) {
            socket.emit("typing_stop", {
                conversationId: currentConversation,
                receiverId
            });
        }

    },

    isUserTyping:(userId)=>{
        const {currentConversation,typingUsers}=get();
        if(!currentConversation||!typingUsers.has(currentConversation)||!userId) {
            return false;
        }
        return typingUsers.get(currentConversation).has(userId);
        
    },
    isUserOnline:(userId)=>{
        if(!userId) return null;
        const {onlineUsers}=get();
        return onlineUsers.get(userId)?.isOnline||false;
    },
    getUserLastSeen:(userId)=>{
        if(!userId) return null;
        const {onlineUsers}=get();
        return onlineUsers.get(userId)?.lastSeen||null;
    },
//means to reset the chat store to its initial state, useful when user logs out or when the component unmounts to prevent memory leaks and stale data so that when a different user logs in, they don't see the previous user's conversations and messages
    cleanup:()=>{//cleanup function to reset the chat store when user logs out or when the component unmounts to prevent memory leaks and stale data
        set({
            conversations:[],
            currentConversation:null,
            messages:[],
            onlineUsers:new Map(),
            typingUsers:new Map(),
          
    });
},

}));