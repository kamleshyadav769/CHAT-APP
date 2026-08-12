import { config } from "dotenv";
config();
import app from"./app.js";
import{v2} from "cloudinary"
import connectionToDB from "./Config/dbConnection.js";

 








// Cloudinary configuration
v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
 



const PORT=process.env.PORT||5000;


/*app.listen(PORT,async()=>{ 

    await connectionToDB();
    console.log(`app is running on at http://localhost:${PORT}`);
});*/

// after coonecting http server user server  instead of app to allow socket connections because socket.io uses the http server not express sever
server.listen(PORT,async()=>{

    await connectionToDB();
    console.log(`Server is running on at http://localhost:${PORT}`);
});