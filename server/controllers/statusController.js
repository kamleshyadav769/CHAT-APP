
import Status from '../Modals/statusModel.js';
import response from '../utils/resposeHandler.js';

const createStatus = async (req, res) => {
    try{
        const userId = req.user.userId;
        const { Content, ContentType } = req.body;

let mediaUrl=null;
let finalContentType= ContentType ||'text';

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

                  /*  imageOrvideoUrl = result.secure_url;*/

                    mediaUrl=result.secure_url;

                    if (req.file.mimetype.startsWith('image')) {
                        finalContentType= 'image';
                    } else if (req.file.mimetype.startsWith('video')) {
                        finalContentType = 'video';
                    } else {
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
        } else if (Content.trim()) {
            finalContentType = 'text';
        } else {
            return response(res, 400, 'Message content is required ');
        }

      //  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expires after 24 hours
                  //or
      const expiresAt =new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Set expiration time to 24 hours from now


        const status = new Status({
            user: userId,
            Content: mediaUrl || Content,
            ContentType: finalContentType,
            expiresAt
        });
        await status.save();

        const populatedStatus = await Status.findOne(status._id)
        .populate('user', 'username avatar') // Populate user details
        .populate('viewers', 'username avatar'); // Populate viewers details


        // implemrent socket event to notify all connected clients about the new status
        if(req.io && req.socketUserMap){
            // broadcast the new status to all connected clients except the one who created it
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit('new_status', populatedStatus);
                }
            }
        }


        return response(res, 201, 'Status created successfully', populatedStatus);
    }catch (error) {
        console.error('createStatus Error:', error);
        return response(res, 500, 'Internal server error');
    }
}


const getStatuses = async (req, res) => {
try{
    const  statuses = await Status.find({ expiresAt: { $gt: new Date() } }) // Get only non-expired statuses
    .populate('user', 'username avatar') // Populate user details
    .populate('viewers', 'username avatar') // Populate viewers details
    .sort({ createdAt: -1 }); // Sort by most recent

    return response(res, 200, 'Statuses retrieved successfully', statuses);
}catch (error) {
    console.error('getStatuses Error:', error);
    return response(res, 500, 'Internal server error');


}
}

const viewStatus = async (req, res) => {
   
        const userId = req.user.userId;
        const{statusId} = req.params;
    try {
const status = await Status.findById(statusId);
if(!status){
    return response(res, 404, 'Status not found');
}
// Check if user has already viewed the status
if(!status.viewers.includes(userId)){
    // Add user to viewers list
    status.viewers.push(userId);
    await status.save();

    const updatedStatus = await Status.findById(statusId)
    .populate('user', 'username avatar') // Populate user details
    .populate('viewers', 'username avatar'); // Populate viewers details


   // Emit socket event to notify the status owner that their status has been viewed
    if (req.io && req.socketUserMap) {
        // broadcast the new status to all connected clients except the one who created it
        const statusOwnerSocketId = req.socketUserMap.get(status.user._id.toString());
        if (statusOwnerSocketId) {
           const viewData ={
                statusId,
                viewerId: userId,
                totalViewers: updatedStatus.viewers.length,
                viewers: updatedStatus.viewers // You can send the list of viewers if needed
           }
            req.io.to(statusOwnerSocketId).emit('status_viewed', viewData);
        }
        else{
            console.log('Status owner is not connected via socket');
        }
    }

}else{
    console.log('User has already viewed this status');
}

        return response(res, 200, 'Status viewed successfully');     
    }catch (error) {
        console.error('viewStatus Error:', error);
        return response(res, 500, 'Internal server error');
    }
}

const deleteStatus = async (req, res) => {
    const userId = req.user.userId;
    const { statusId } = req.params;
try{
    const status = await Status.findById(statusId);
    if(!status){
        return response(res, 404, 'Status not found');
    }
    if(status.user.toString() !== userId){
        return response(res, 403, 'You are not authorized to delete this status');
    }
   await status.deleteOne();

   // Emit socket event to notify all connected clients that a status has been deleted
   if(req.io && req.socketUserMap){
    // broadcast the deleted status id to all connected clients
    for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
        req.io.to(socketId).emit('status_deleted',  statusId );
    }
   }
}
    return response(res, 200, 'Status deleted successfully');


}catch (error) {
    console.error('deleteStatus Error:', error);
    return response(res, 500, 'Internal server error');

}
}

export { createStatus, getStatuses, viewStatus, deleteStatus };