//npm install @sendgrid/mail

import sgMail from "@sendgrid/mail";

const sendEmail = async function (email, subject, message) {
    console.log("SENDGRID_API_KEY:", process.env.SENDGRID_API_KEY ? "FOUND" : "MISSING");
    console.log("SENDGRID_FROM_EMAIL:", process.env.SENDGRID_FROM_EMAIL);

    // 1. Initialize SendGrid with API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // 2. Prepare the email object
    const msg = {
        to: email,                           // Recipient user email
        from: process.env.SENDGRID_FROM_EMAIL,   // Sender email (Must be verified in SendGrid)
        subject: subject,                    // Subject line
        html: message,                       // HTML body
    };

    try {
        // 3. Send email over HTTPS (Port 443) - avoids timeout issue completely
        await sgMail.send(msg);
        console.log("✅ Email sent successfully via SendGrid");
    } catch (err) {
        // SendGrid provides rich error details in err.response.body
        const errorMessage = err.response ? JSON.stringify(err.response.body) : err.message;
        console.log("❌ ERROR:", errorMessage);
        throw new Error(errorMessage); // stop execution
    }
};

export default sendEmail;