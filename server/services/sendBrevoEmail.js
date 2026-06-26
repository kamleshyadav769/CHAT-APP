import axios from "axios";

const sendEmail = async (email, subject, message) => {
    try {
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