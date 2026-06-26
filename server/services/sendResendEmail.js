import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const sendEmail = async function (email, subject, message) {
    try{
    const data = await resend.emails.send({
        from: "Chat App <onboarding@resend.dev>",
        to: email,
        subject: subject,
        html: message
    });
    return data;
} catch (error) {
    console.error("Error sending email:", error);
    throw error;
}
};

export default sendEmail;