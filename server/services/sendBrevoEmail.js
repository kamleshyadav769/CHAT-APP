import axios from "axios";

const sendEmail = async (email, subject, message) => {
    try {
        console.log("BREVO_API_KEY:", process.env.BREVO_API_KEY ? "FOUND" : "MISSING");
        console.log("BREVO_SENDER_NAME:", process.env.BREVO_SENDER_NAME);
        console.log("BREVO_SENDER_EMAIL:", process.env.BREVO_SENDER_EMAIL);
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: {
                    name: process.env.BREVO_SENDER_NAME,
                    email: process.env.BREVO_SENDER_EMAIL,
                },
                to: [
                    {
                        email,
                    },
                ],
                subject,
                htmlContent: message,
            },
            {
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                },
            }
        );

        console.log("✅ Email sent");
        console.log(response.data);
        console.log("Status:", response.status);
        console.log("Headers:", response.headers);
        console.log("Response:", response.data);
    } catch (error) {
        console.error("❌ Email error");

        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }

        throw error;
    }
};

export default sendEmail;