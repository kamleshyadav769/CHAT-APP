import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "FOUND" : "MISSING");
const sendEmail = async function (email, subject, message) {
    try{
    const data = await resend.emails.send({
        from: 'onboarding@resend.dev', 
        to: 'yadavkamlesh5251@gmail.com',                   // email, can only send to verified emails in resend account for any email email we have to go with subsription plan of resend. So, I have to use brevo api to send email. acccount creation is rejected by brevo. So, I have to use resend api to send email.
        subject: subject,
        html: message
    });
        console.log("RESEND RESPONSE:", data); // 🔥 ADD THIS
    return data;
} catch (error) {
    console.error("Error sending email:", error);
    throw error;
}
};

export default sendEmail;