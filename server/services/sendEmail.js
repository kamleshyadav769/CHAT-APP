import nodemailer from "nodemailer";
import dns from "node:dns/promises";


// async..await is not allowed in global scope, must use a wrapper
const sendEmail = async function (email, subject, message) {
    // create reusable transporter object using the default SMTP transport

    console.log("SMTP_USERNAME:", process.env.SMTP_USERNAME);
    console.log(
        "SMTP_PASSWORD:",
        process.env.SMTP_PASSWORD ? "FOUND" : "MISSING"
    );
    console.log("SMTP_FROM_EMAIL:", process.env.SMTP_FROM_EMAIL);
  
    const records = await dns.lookup("smtp.gmail.com", { all: true });
    console.log("SMTP DNS Records:", records);

    let transporter = nodemailer.createTransport({
       // host: "smtp.gmail.com",
        host: "74.125.142.108",                         //process.env.SMTP_HOST,
        // Keeps forcing IPv4 to skip Render's IPv6 issue
       // host: process.env.SMTP_HOST === "smtp.gmail.com" ? "74.125.142.108" : process.env.SMTP_HOST,                     //  "smtp.gmail.com"  ,                                 //
        port:587,// 465,                  //Number(process.env.SMTP_PORT),                        //465,                    //
        secure: false,     //true,                         // Number(process.env.SMTP_PORT) === 465,             //false,              //true, // true for 465, false for other ports
       
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD,
        },
        // Force STARTTLS configurations
        tls: {
            servername: "smtp.gmail.com",
            rejectUnauthorized: false,
            // minVersion: "TLSv1.2"
        },
        // 2. FORCE Node.js to resolve 'smtp.gmail.com' to an IPv4 address safely
        lookup: (hostname, options, callback) => {
            dns.lookup(hostname, { family: 4 }, (err, address, family) => {
                console.log("FORCED IPv4:", address, family);
                callback(err, address, family);
            });
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        
        
        
    });

    try {
        await transporter.verify();
        console.log("✅ SMTP working");
    } catch (err) {
        console.log("❌ ERROR:", err.message);
        throw err; // stop execution
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