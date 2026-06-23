// server.io do not have default export, so we can import it by named export
//import Server from 'socket.io';
import { Server } from 'socket.io';// correct way to import Server from socket.io in ES6 module syntax
import User from '../Modals/userModel.js';
import Message from '../Modals/messages.js';


//Map to store online users {ye do cheeze lega userId and socketId}
const onlineUsers = new Map();

//Map to track typing status of users {ye do cheeze lega userId and boolean value}
const typingUsers = new Map();

const initializeSocket = (server) => {

    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL, // Frontend URL
            Credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
        },
        pingTimeout: 60000, // DISCONNECT  inactive users(or sockets) after 60 seconds
     });


     //when a new socket (client) connects to the socket server(when a new socket connection is established), this callback function will be executed.
     io.on('connection', (socket) => {
         console.log(`User connected: ${socket.id}`);

        


     let userId= null;
     // handle user connection and marking them as online in database

socket.on("user_connected", async (connectingUserId) => {
    try{
    userId = connectingUserId;
    onlineUsers.set(userId, socket.id);
    socket.join(userId); // join a personal room for the user (this will help in sending messages to specific users)

    // Update user's online status in the database
    await User.findByIdAndUpdate(userId, { 
        isOnline: true ,
        lastSeen: new Date()  //this will update the last seen time to current time when user connects
        });

       
                   
        //NOTIFY ALL OTHER USERS THAT THIS USER IS ONLINE (this will help in real-time updates of online status of this user in the frontend)
    
        io.emit('user_status', { userId, isOnline: true, });//lastSeen: new Date()  // Emit to all clients that this user is online (you can also emit the last seen time if needed)

    } catch (error) {
        console.error('Error marking user as online:', error);
    }
});

//return online status of requested users (this will be used in frontend to show online status of users in the user list)
socket.on("get_online_status", async (requestedUserId, callback) => {
   const isOnline=onlineUsers.has(requestedUserId) ;
    callback({ userId: requestedUserId,
         isOnline ,
         lastSeen:isOnline? new Date():null,

        }); // Send the online status back to the requesting client
    });


// forward message to reciever if online
socket.on("send_message",async(message)=>{
    try{
        const receiverSocketId=onlineUsers.get(message.receiver._id);
        if (receiverSocketId){
            io.to(receiverSocketId).emit("receive_message",message)
        }

    }catch(error){
console.log ("Error in Sending message",error)
socket.emit("message_error",{error:"Failed to send message"});
    }
})

//update messages as read and notify sender
socket.on("message_read",async({messageIds,senderId})=>{
    try{
        await Message.updateMany(
            {_id:{$in:messageIds}},
            { $set: { messageStatus: "read" }});

        const senderSocketId=onlineUsers.get(senderId);
        if (senderSocketId){
            messageIds.forEach(messageId=>{
                io.to(senderSocketId).emit("message_status_update",{
                    messageId,
                    messageStatus:"read"
                })
             });
        }

    }catch(error){
console.log ("Error in updating message read status",error);

    }
});

// handle typing start event and auto stop typing after 3 seconds of inactivity
socket.on("typing_start",({conversationId,receiverId})=>{

    if((!userId)||(!conversationId)||(!receiverId)) return;
    
      if(!typingUsers.has(userId)) typingUsers.set(userId,{});

    const userTyping=typingUsers.get(userId);


    userTyping[conversationId]=true; // Mark the user as typing in this conversation

    //clear any existing timeout for this user and conversation
    if(userTyping[`${conversationId}_timeout`]){
        clearTimeout(userTyping[`${conversationId}_timeout`]);
    }

    //auto stop typing after 3 seconds of inactivity
    userTyping[`${conversationId}_timeout`]=setTimeout(()=>{
        userTyping[conversationId]=false; // Mark the user as not typing in this conversation
       socket.to(receiverId).emit("user_typing",{
        conversationId,
        userId,
    isTyping:false
    }); 
    },3000);


//notify the receiver that this user is typing
socket.to(receiverId).emit("user_typing",{
    conversationId,
    userId,
    isTyping:true
    });

});

socket.on("typing_stop",({conversationId,receiverId})=>{

    if((!userId)||(!conversationId)||(!receiverId)) return;

         if (typingUsers.has(userId)){
                const userTyping=typingUsers.get(userId);
                userTyping[conversationId]=false; // Mark the user as not typing in this conversation

                //clear any existing timeout for this user and conversation
                if(userTyping[`${conversationId}_timeout`]){
                    clearTimeout(userTyping[`${conversationId}_timeout`]);
                    delete userTyping[`${conversationId}_timeout`];
                }
         };
         socket.to(receiverId).emit("user_typing",{
            conversationId,
            userId,
            isTyping:false
         });


        });

         // add or update reaction on a message and notify the receiver about the reaction update
socket.on("add_reaction",async({messageId,emoji,userId:reactionUserId})=>{
    try{
        const message=await Message.findById(messageId);
        if(!message) {
         //   socket.emit("reaction_error",{error:"Message not found"});
            return;
        }

        const existingReactionIndex=message.reactions.findIndex(
            (r)=>r.user.toString()===reactionUserId );

            if(existingReactionIndex>-1){
                const existingReaction=message.reactions[existingReactionIndex];
                if(existingReaction.emoji===emoji){
                    //same reaction already exists, so remove it (toggle off)
                    message.reactions.splice(existingReactionIndex,1);
                } else {
                    //update to new reaction
                    message.reactions[existingReactionIndex].emoji=emoji;
                }
            } else {
                //add new reaction
                message.reactions.push({user:reactionUserId,emoji});
            }

        await message.save();
        //console.log("Before populate");
        const populatedMessage=await Message.findById(message._id)
        .populate("sender","username avatar")
        .populate("receiver","username avatar")
        .populate("reactions.user","username ")
       // console.log("After populate");
        const reactionUpdated={
          messageId,
         reactions:populatedMessage.reactions,
        }

        const senderSocket=onlineUsers.get(populatedMessage.sender._id.toString());
        const receiverSocket=onlineUsers.get(populatedMessage.receiver._id.toString());

        if(senderSocket){
            io.to(senderSocket).emit("reaction_update",reactionUpdated);
        }
        if(receiverSocket){
            io.to(receiverSocket).emit("reaction_update",reactionUpdated);
        }
        
        }catch(error){
            console.log("Error in adding reaction",error);
           // socket.emit("reaction_error",{error:"Failed to add reaction"});
        }
});



         //handle iser disconnection and marking them as offline in database
         const handleDisconnected = async () => {
            if (!userId) return; // If userId is not set, do nothing

           try {
            onlineUsers.delete(userId); // Remove the user from the online users map

            // claer all typing timeouts
            if (typingUsers.has(userId)) {
                const userTyping=typingUsers.get(userId);
                Object.keys(userTyping).forEach(key => {
                    if (key.endsWith('_timeout')) {
                        clearTimeout(userTyping[key]);
                    }
                });


                typingUsers.delete(userId); // Remove the user from the typing users map

            }

          await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date() // Update last seen time to current time when user disconnects
            });

           io.emit('user_status', {
             userId, 
             isOnline: false, 
             lastSeen: new Date() 
            }); // Emit to all clients that this user is offline with last seen time 

        socket.leave(userId); // Leave the personal room

        console.log(`User disconnected: ${socket.id}, userId: ${userId}`);

         }catch (error) {
            console.error('Error in handling user disconnection:', error);
        }
    }


// Listen for the disconnect event on the socket to the disconnect event on the socket
            socket.on('disconnect', handleDisconnected);
     });

//attach the onlineUsers map to the socket server for other modules to use (like in controllers to check online status)
io.socketUserMap=onlineUsers; // Expose the onlineUsers map for other modules to use (like in controllers to check online status)


return io;

}


export default initializeSocket;