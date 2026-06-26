//import sendEmail from "./sendEmail.js"; this is for nodemailer but in production it is not working because of connection timeout error. So, I have to use brevo api to send email.
//import sendEmail from "./sendBrevoEmail.js"; // this is for brevo api to send email. acccount creation is rejected by brevo. So, I have to use resend api to send email.
import sendEmail from "./sendResendEmail.js"; // this is for resend api to send email. acccount creation is rejected by brevo. So, I have to use resend api to send email.
 import { EMAIL_OTP_FORMATE } from "./emailOtpFormate.js";

const sendOtptoEmail=async(email,otp)=>{
  
    const subject ='chat verification code';
    const message=EMAIL_OTP_FORMATE.replace(`{otp}`,otp);
console.log("Sending OTP to email:", email);
    await sendEmail(email,subject,message);
    console.log("OTP sent to email:", email);
    
}
 
export default sendOtptoEmail;