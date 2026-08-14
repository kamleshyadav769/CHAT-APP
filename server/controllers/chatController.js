
import Conversation from '../Modals/conversation.js';
import Message from '../Modals/messages.js';
import response from '../utils/resposeHandler.js';
import cloudinary from "cloudinary";


const sendMessage = async (req, res) => {
    try{
        const senderId = req.user.userId;
        const { receiverId, content,messageStatus} = req.body;



        const participants = [senderId, receiverId].sort();

// Check if conversation already exists
        let conversation = await Conversation.findOne({ participants:participants });
        if (!conversation) {
            conversation = new Conversation({ participants:participants });
            await conversation.save();
        }

let mediaUrl=null;
let contentType=null;
         // Run only if user sends a file
            if (req.file) {
                console.log('File received:', req.file);
                try {
                    const result = await cloudinary.v2.uploader.upload(req.file.path, {
                        folder: 'uploads', // Save files in a folder named uploads
                        width: 250,
                        height: 250,
                        gravity: 'faces', // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
                        crop: 'fill',
                    });
                    // If success
                    if (result) {
                        // Set the public_id and secure_url in DB
                        /*user.avatar.public_id = result.public_id;
                        user.avatar.secure_url = result.secure_url;*/

                       mediaUrl=result.secure_url;

                        if(req.file.mimetype.startsWith('image')){
                            contentType='image';
                        }else if(req.file.mimetype.startsWith('video')){
                            contentType='video';
                        }else{
                            return response(res, 400, 'Unsupported file type, only image and video are allowed');
                        }

                       /* await user.save();  // ⭐ THIS WAS MISSING  (this  save image url and public id in database)

                        // After successful upload remove the file from local storage
                        fs.rm(`uploads/${req.file.filename}`);*/
                    }
                
                } catch (error) {
                    console.error('file upload Error:', error);
                    return response(res, 500, 'File not uploaded, please try again');

                }
            }else if(content.trim()){
                contentType='text';
            }else{
                return response(res, 400, 'Message content is required ');
            }

        const message = new Message({
            conversation: conversation._id,
            sender: senderId,
           receiver: receiverId,
            content,
           mediaUrl,
            contentType,
            messageStatus:"send"
        });
        await message.save();

// Update last message and unread count in conversation
if(message?.content){
        conversation.lastMessage = message._id;
}
        // conversation.unreadCount += 1;
        // await conversation.save();
        const currentUnread =
            conversation.unreadCount.get(receiverId.toString()) || 0;

        conversation.unreadCount.set(
            receiverId.toString(),
            currentUnread + 1
        );

        await conversation.save();

        // Check if receiver is online
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(receiverId.toString());

            if (receiverSocketId) {
                // Receiver is online, so mark message as delivered
                message.messageStatus = "delivered";
                await message.save();
            }
        }


 const populatedMessage = await Message.findById(message._id).populate('sender', 'username avatar').populate('receiver', 'username avatar');


 // Emit socket event to notify the receiver of the new message
 if(req.io && req.socketUserMap){
    const receiverSocketId = req.socketUserMap.get(receiverId.toString());

    if (receiverSocketId) {
        req.io.to(receiverSocketId).emit('receive_message',{message: populatedMessage});
       // message.messageStatus = "read";//delivered
        //await message.save();
    }
 }



        // Notify sender that message was sent/delivered
        if (req.socketUserMap && req.io) {

            const senderSocketId =
                req.socketUserMap.get(senderId.toString());

            if (senderSocketId) {
                req.io.to(senderSocketId).emit(
                    "message_send",
                    {
                        message: populatedMessage
                    }
                );
            }
        }



  return response(res, 200, 'Message sent successfully', populatedMessage);

    }catch (error) {
        console.error('sendMessage  Error:', error);
        return response(res, 500, 'Internal server error',error);
    }


};



// get all conversations of a user
const getConversations = async (req, res) => {
    const userId = req.user.userId;
try {
    const conversations = await Conversation.find({ participants: userId })
    .populate("participants","username avatar isOnline lastSeen")
    .populate({
        path: "lastMessage",
        populate: {
            path: "sender receiver",
            select: "username avatar"
        }

    }).sort({ updatedAt: -1 });

    const formattedConversations = conversations.map(
        (conversation) => {
            const conversationObject =
                conversation.toObject();

            conversationObject.unreadCount =
                conversation.unreadCount.get(
                    userId.toString()
                ) || 0;

            return conversationObject;
        }
    );

    return response(
        res,
        200,
        "Conversations fetched successfully",
        formattedConversations
    );

   // return response(res, 200, 'Conversations fetched successfully', conversations);

}catch (error) {
    console.error('Error fetching conversations:', error);
    return response(res, 500, 'Internal server error');
}

}


// get messages of a  specificconversation
const getMessages = async (req, res) => {
    const userId = req.user.userId;
    const {conversationId}=req.params;
try{
    const conversation = await Conversation.findById(conversationId);
  if(!conversation){
    return response(res,404,'Conversation not found');
  }
if(!conversation.participants.includes(userId)){
    return response(res,403,'You are not authorized to view this conversation');
}
  

    // Get messages that are going to be marked as read
     const unreadMessages = await Message.find({
        conversation: conversationId,
         receiver: userId,
         messageStatus: { $in: ['send', 'delivered'] }
     });


     await Message.updateMany({ conversation: conversationId, receiver: userId, messageStatus: { $in: ['send', 'delivered'] } }, { $set: { messageStatus: 'read' } });
    //  conversation.unreadCount=0;
    conversation.unreadCount.set(userId.toString(), 0);
     await conversation.save();

    //update first then fetch messages to ensure the latest status is retrieved
    const messages = await Message.find({ conversation: conversationId })
        .populate('sender', 'username avatar')
        .populate('receiver', 'username avatar')
        .sort({ createdAt: 1 });////"createdAt" 

    // // Notify senders in real time
     if (req.io && req.socketUserMap) {
        for (const message of unreadMessages) {
            const senderSocketId = req.socketUserMap.get(
                message.sender.toString()
             );

            if (senderSocketId) {
                 req.io.to(senderSocketId).emit('message_read', {
                     messageId: message._id.toString(),                   // _id: message._id,
                    conversation: conversationId,
                    messageStatus: 'read'
               });
            }
    }
     }

    return response(res, 200, 'Messages fetched successfully', {messages,conversation});

}catch (error) {
    console.error('Error fetching messages:', error);
    return response(res, 500, 'Internal server error');

}

}

// mark a message as read
const markAsRead = async (req, res) => {
    const userId = req.user.userId;
    const {messageIds}=req.body;
try{
//get relevant messages to determine senders
const messages = await Message.find({ _id: { $in: messageIds }, receiver: userId,  });

await Message.updateMany({ _id: { $in: messageIds }, receiver: userId },{ $set: { messageStatus: 'read' } });
    const conversationIds = [
        ...new Set(
            messages.map((message) =>
                message.conversation.toString()
            )
        )
    ];

    for (const conversationId of conversationIds) {
        const conversation =
            await Conversation.findById(conversationId);

        if (conversation) {
            conversation.unreadCount.set(
                userId.toString(),
                0
            );

            await conversation.save();
        }
    }

//notify to original senders about read status
if(req.io && req.socketUserMap){
    for(const message of messages){
        const senderSocketId = req.socketUserMap.get(message.sender.toString());
        console.log("👤 Sender ID:", message.sender.toString());
        console.log("🔌 Sender Socket ID:", senderSocketId);

        if(senderSocketId){
            console.log("📖 Sending message_read to sender");
            const updatedMessage ={
                messageId: message._id.toString(),  // _id: message._id,
                messageStatus: 'read'
            };
            req.io.to(senderSocketId).emit('message_read', updatedMessage);
        // await Message.updateOne({ _id: message._id }, { $set: { messageStatus: 'read' } });
        }
    }
}
    

return response(res, 200, 'Messages marked as read successfully', messages);

}catch (error) {
    console.error('Error marking messages as read:', error);
    return response(res, 500, 'Internal server error');
}
}


//delete a message
const deleteMessage = async (req, res) => {
    const userId = req.user.userId;
    const {messageId}=req.params;
try{
    const message = await Message.findById(messageId);
    if(!message){
        return response(res,404,'Message not found');
    }
    if(message.sender.toString() !== userId){
        return response(res,403,'You are not authorized to delete this message');
    }
    await Message.deleteOne({ _id: messageId });
    
    const conversationId = message.conversation;
    const receiverId = message.receiver;
    // Find the newest remaining message
    const latestMessage = await Message.findOne({
        conversation: conversationId
    })
        .sort({ createdAt: -1 });

    // Update conversation.lastMessage
    const conversation = await Conversation.findById(conversationId);

    if (conversation) {
        conversation.lastMessage = latestMessage
            ? latestMessage._id
            : null;

        await conversation.save();
    }

    
    // Emit socket event to notify the receiver of the deleted message
    if(req.io && req.socketUserMap){
        const receiverSocketId = req.socketUserMap.get(message.receiver.toString());
        if(receiverSocketId){
            req.io.to(receiverSocketId).emit('message_deleted', {
                deletedMessageId: messageId.toString()
            });  //  messageId
        }
    }

    return response(res, 200, 'Message deleted successfully');

}catch (error) {
    console.error('Error deleting message:', error);
    return response(res, 500, 'Internal server error');
}
}


export {sendMessage,getConversations,getMessages,markAsRead,deleteMessage};
    