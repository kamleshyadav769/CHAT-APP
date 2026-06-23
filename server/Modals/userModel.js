import { Schema, model } from "mongoose";



const userSchema = new Schema({
    username:{
        type: String,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        default: undefined,
        lowercase: true,
        trim: true,
        match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "Please provide a valid email address"]
    },


    avatar: {
        public_id: {
            type: String,
        },
        secure_url: {
            type: String
        }
    },
  
    // profilePicture: { // if i do not want to upload profilephoto then you can select dummy avatar for this purpose  profilePicture field is created
    // type: String,
    // },  for this i update avatar

    about : {
        type : String,
    },

    lastseen:Date,

    
    isOnline:{
        type : Boolean,
        default: false,
    },
    agreed:{
        type: Boolean,
        default: false,
    },
   
    isVerified: {
        type: Boolean,
        default: false,
    },
    //for email verification code
    emailOtp : String,
    emailOtpExpiry: Date,



  phoneNumber: {
        type: String,
        unique: true,
        sparse: true,
      default: undefined,
    },
    phonesuffix: {
        type: String,
        unique: false,
        default: undefined,
    },






}, {
    timestamps: true
});





const User = model("User", userSchema);
export default User;