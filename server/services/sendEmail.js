import nodemailer from "nodemailer";

// async..await is not allowed in global scope, must use a wrapper
const sendEmail = async function (email, subject, message) {
    // create reusable transporter object using the default SMTP transport

    console.log(process.env.SMTP_USERNAME);
    console.log("SMTP_USERNAME:", process.env.SMTP_USERNAME);
    console.log(
        "SMTP_PASSWORD:",
        process.env.SMTP_PASSWORD ? "FOUND" : "MISSING"
    );
    console.log("SMTP_FROM_EMAIL:", process.env.SMTP_FROM_EMAIL);
   
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,                        //  "smtp.gmail.com"  ,                                 //
        port:Number(process.env.SMTP_PORT),                        //465,                    //
        secure: Number(process.env.SMTP_PORT) === 465,             //false,              //true, // true for 465, false for other ports
         
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    try {
        await transporter.verify();
        console.log("✅ SMTP working");
    } catch (err) {
        console.log("❌ ERROR:", err.message);
    }

    // send mail with defined transport object
    await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL, // sender address
        to: email, // user email
        subject: subject, // Subject line
        html: message, // html body
    });
};

export default sendEmail;