import sendEmail from "./sendEmail.js";
 import { EMAIL_OTP_FORMATE } from "./emailOtpFormate.js";

const sendOtptoEmail=async(email,otp)=>{
  
    const subject ='chat verification code';
    const message=EMAIL_OTP_FORMATE.replace(`{otp}`,otp);
console.log("Sending OTP to email:", email);
    await sendEmail(email,subject,message);
    console.log("OTP sent to email:", email);
    
}
 
export default sendOtptoEmail;