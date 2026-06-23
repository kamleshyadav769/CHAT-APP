import sendEmail from "./sendEmail.js";
 import { EMAIL_OTP_FORMATE } from "./emailOtpFormate.js";

const sendOtptoEmail=async(email,otp)=>{
  
    const subject ='chat verification code';
    const message=EMAIL_OTP_FORMATE.replace(`{otp}`,otp);

    await sendEmail(email,subject,message);
    
}
 
export default sendOtptoEmail;