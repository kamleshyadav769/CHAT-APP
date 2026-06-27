import cloudinary from "cloudinary";
import fs from 'fs/promises';

import mongoose from "mongoose";
import bcrypt from "bcrypt";
//import emailValidator from "email-validator";

import User from "../Modals/userModel.js";
import sendOtptoEmail from "../services/emailServices.js";
import { sendOtpToPhoneNumber,verifyOtpPhoneNumber } from "../services/twilloService.js";
import OtpGenerate from "../utils/OtpGenerator.js";
import response from "../utils/resposeHandler.js";
import generateToken from "../utils/generateToken.js";
import  Conversation from "../Modals/conversation.js";

//const bcrypt = require('bcrypt')//MODULE FOR ENCRYPTED DATA
//const userModel = require("../database/userschema");
const signup = async function (req, res, next) {
    const {  email, password, confirmPassword } = req.body;
    console.log( email, password, confirmPassword);

    if ( !email || !password || !confirmPassword) {
        return response(res, 400, 'every field is required');
       
    }
  
    // const validemail = emailValidator.validate(email);
    // if (!validemail) {
    //     return response(res, 400, 'Please provide a valid email id');
    // }

    // checking user dwara diya gya password aur conformpassword  nhi hai to ye execute hoga
    if (password !== confirmPassword) {
        return response(res, 400, 'password and confirmPassword do not match');
       
    }


    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userInfo = new User({ ...req.body, password: hashedPassword });
        const result = await userInfo.save();
        return response(res, 200, 'user created successfully', result);
    } catch (err) {
    return response(res, 400, err.message);
       
    }
}


//CREATING SIGNIN (LOGIN) FUNCTION FOR USER 
/*1 what type of input it takes form user (EMAIL AND PASSWORD)
2 validation (checking user koi input dena bhul to nhi gya) 






*/
const signin = async function (req, res) {
    //taking input from user ( why we we curly bracket{} because it is used to import variable (take input)
    //from the user
    const { email, password } = req.body;
    // checking user  password aur email me se koi ek bhi nhi diya hai to ye execute hoga
    if (!email || !password) {
        return response(res, 400, 'every field is mandatory');
    }
    try {
        const user = await User.findOne({ email }).select('+password');
        console.log("User found:", user);
        if(!user||user.password !== password){//COMPARING PLAIN TEXT WITH PLAIN TEXT
       //if (!user || !(await bcrypt.compare(password, user.password))) {//COMPARING PLAIN TEXT WITH ENCRYPTED DATA
            return response(res, 400, 'invalid credentials');
        }
        const token = generateToken(user._id);
    
        user.password = undefined;
        //  user.confirmpassword = undefined;
        const cookieOption = {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
             secure: true,
            sameSite: "none",
        };
        res.cookie("auth_token", token, cookieOption);
        return response(res, 200, 'user logged in successfully', { token, user });
      
    } catch (e) {
        return response(res, 400, e.message);
      
    }
}


const sendOtp = async (req, res) => {
    const { phoneNumber, phonesuffix, email } = req.body;
    const otp = OtpGenerate();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    try {
        let user;
        // EMAIL FLOW ✅
        if (email) {

            console.log('Email OTP:', otp);
            await sendOtptoEmail(email, otp);
            console.log("SMTP_PORT =", process.env.SMTP_PORT);
            

            user = await User.findOne({ email });
          /*  if (!user) {
                user = new User({ email });
            }*/
            if (!user) {
                // Create new user - IGNORE duplicate errors
                user = await User.create({ email });
                console.log("New user created");
            } else {
                console.log("Existing user");
            }
            user.emailOtp = otp;
            user.emailOtpExpiry = expiry;
            await user.save();

          
            return response(res, 200, 'OTP sent to email', { email });
        }

        // PHONE FLOW ✅
        if (!phoneNumber || !phonesuffix) {
            return response(res, 400, 'Phone number and phone suffix required');
        }
        const fullPhoneNumber = `${phonesuffix}${phoneNumber}`;
        await sendOtpToPhoneNumber(fullPhoneNumber);

        // Find existing user by phoneNumber
        user = await User.findOne({ phoneNumber, phonesuffix });

        if (!user) {
            // Create new user - IGNORE duplicate errors
            user = await User.create({ phoneNumber, phonesuffix });
            console.log("New user created");
        } else {
            console.log("Existing user");
        }

        return response(res, 200, 'OTP sent to phone', user);

    } catch (error) {
        console.error('Send OTP Error:', error);
        return response(res, 500, 'Internal server error');
    }
};

// VERIFY OTP (also updated for consistency)
const verifyOtp = async (req, res) => {
    const { phoneNumber, phonesuffix, email, otp } = req.body;

    try {
        let user;

        if (email) {
            user = await User.findOne({ email });
            if (!user) return response(res, 404, 'User not found');

            const now = new Date();
            if (!user.emailOtp ||
                String(user.emailOtp) !== String(otp) ||
                now > new Date(user.emailOtpExpiry)) {
                return response(res, 400, 'Invalid or expired OTP');
            }

            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpiry = null;
            await user.save();
        } else {
            if (!phoneNumber || !phonesuffix) {
                return response(res, 400, 'Phone number and suffix required');
            }

            user = await User.findOne({ phoneNumber ,phonesuffix});
            if (!user) return response(res, 404, 'User not found');

            const fullPhoneNumber = `${phonesuffix}${phoneNumber}`;
            const result = await verifyOtpPhoneNumber(fullPhoneNumber, otp);

            if (result.status !== 'approved') {
                return response(res, 400, 'Invalid OTP');
            }

            user.isVerified = true;
            await user.save();
        }

        const token = generateToken(user._id);
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 365 * 24 * 60 * 60 * 1000
        });

        return response(res, 200, 'OTP verified successfully', { token, user });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        return response(res, 500, 'Internal server error');
    }
};

const getProfile=async(req,res)=>{
    try{
        const userId=req.user.userId;
        if(!userId){
            return response(res, 401, 'Unauthenticated,please login again');
        }
        const user = await User.findById(userId);
        if(!user){
            return response(res, 401, 'user not found');
        }

        return response(res, 200, 'user retrieved and allow to do chat ',user);

    } catch (error) {
        console.error('profile   Error:', error);
        return response(res, 500, 'Internal server error');
    }

}




const updateProfile =async (req,res)=>{
    const {username,agreed,about}=req.body;
    const userId =req.user.userId;
    try{
        const user =await User.findById(userId);
        
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
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_url = result.secure_url;

                    await user.save();  // ⭐ THIS WAS MISSING  (this  save image url and public id in database)

                    // After successful upload remove the file from local storage
                    fs.rm(`uploads/${req.file.filename}`);
                
                }
            } catch (error) {
                console.error('file upload Error:', error);
                return response(res, 500, 'File not uploaded, please try again');
                
            }
        } else if (req.body.profilePicture) {// if user do not want to upload profilephoto file then set 
            user.avatar.secure_url = req.body.profilePicture ;
    }

    if(username) user.username=username;
     if (agreed) user.agreed = agreed;
    if (about) user.about = about;
    
       await user.save();
return response(res,200,'Usser profile updated succesfully',user);
    } catch (error) {
        console.error('update profile  Error:', error);
        return response(res, 500, 'Internal server error');
    }
}

const logout = (req, res) => {
    console.log("Logging out user");
    try {
        res.cookie('auth_token', null, {
            secure: true,
            maxAge: 0,
            httpOnly: true
        });


        res.status(200).json({
            success: true,
            message: 'User logged out successfully'

        })
    } catch (error) {
        console.error('logout   Error:', error);
        return response(res, 500, 'Internal server error');
    }

};

const getAllUsers = async (req ,res)=>{
    const loggedInUser = req.user.userId;
    try{
        const users=await User.find({_id:{$ne:loggedInUser}}).select("username avatar about isOnline lastseen").lean();
         const userWithConversation =await Promise.all(  users.map(async(user)=>{

             // 👉 ADD DEBUG LOGS HERE
             console.log("loggedInUser:", loggedInUser);
             console.log("loggedInUser type:", typeof loggedInUser);

             console.log("user._id:", user._id);
             console.log("user._id type:", typeof user._id);


                                        const conversation=await Conversation.findOne({
                                      participants : {$all :[loggedInUser, user?._id]}
                                       }).populate({
                                                  path:"lastMessage",
                                                 select:"content createdAt sender receiver",
                                               }).lean();
                                    
                                      return {
                                              ...user,
                                               conversation: conversation || null
                                           }
            })
         )
         console.log("userWithConversation",userWithConversation);

return response(res,200,'all users retrieved successfully',userWithConversation);

    } catch (error) {
        console.error('getAllUser  Error:', error);
        return response(res, 500, 'Internal server error');
    }
}

export {signup,signin, sendOtp, verifyOtp ,updateProfile,logout,getProfile,getAllUsers};