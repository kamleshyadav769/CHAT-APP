import dotenv from "dotenv";
dotenv.config();


import twillo from 'twilio'

// taking twillo credentials from env
const accountSid = process.env.TWILLO_ACCOUNT_SID;
const authToken = process.env.TWILLO_AUTH_TOKEN;
const serviceSid = process.env.TWILLO_SERVICE_SID;



const client=twillo(accountSid,authToken);//twillo package is setuped in your project ye do argument lga pehla account sid aur authtoken 


//send otp to phone number

const sendOtpToPhoneNumber=async(phoneNumber)=>{
    try{
     console.log('sending otp to this number',phoneNumber);
     if(!phoneNumber){
        throw new Error('phone number is required');
     }
        console.log('servise id is', serviceSid);
     const response =await client.verify.v2.services(serviceSid).verifications.create({
        to:phoneNumber,
        channel:'sms'
     });
     console.log('this is my otp response',response);
     
     return response;

    }catch(e){
        console.log(e);
        throw new Error('failed to send otp');

    }
}


const verifyOtpPhoneNumber = async (phoneNumber,otp) => {
    try {
        console.log(' this number', phoneNumber);
        console.log ('this is my otp',otp);
        const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
            to: phoneNumber,
            code: otp
        });
        console.log('this is my otp response', response);

        return response;

    } catch (e) {
        console.log(e);
        throw new Error('failed to verify otp');

    }
}

export {sendOtpToPhoneNumber,verifyOtpPhoneNumber};
