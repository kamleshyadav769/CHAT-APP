import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
 user :{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
 },
  Content: {
    type: String,
    required: true
    },
    ContentType: {
        type: String,
        enum: ['text', 'image', 'video'],
        default: 'text'
    },
    viewers:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    expiresAt: {
        type: Date,
        required: true,
              // we do this status controller function   default: () => Date.now() + 24 * 60 * 60 * 1000 // Expires after 24 hours
    }
}, { 
    timestamps: true 
});

const Status = mongoose.model('Status', statusSchema);
export default Status;

