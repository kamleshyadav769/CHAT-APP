import express from 'express';
import {signup,signin, sendOtp,verifyOtp ,updateProfile,logout,getProfile,getAllUsers} from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import upload from '../middlewares/multerMiddleware.js';



const router =express.Router();

// router.post('/send-otp',sendOtp);
// router.post('/verify-otp', verifyOtp);

router.post('/signup',signup);
router.post('/signin',signin);


router.get('/get-profile',authMiddleware,getProfile);
router.put('/update-profile',authMiddleware,upload.single("avatar"),updateProfile);
router.get('/logout',logout);
router.get('/all-users',authMiddleware,getAllUsers);
export default router;
