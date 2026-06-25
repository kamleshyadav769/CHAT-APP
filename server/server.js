import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

import { config } from "dotenv";
config();

import { config } from "dotenv";
config();
import app from"./app.js";
import{v2} from "cloudinary"
import connectionToDB from "./Config/dbConnection.js";
import initializeSocket from "./services/socketService.js";
import http from "http";
 


//create http server and pass the express app to it, this will allow us to use the same server for both http requests and socket connections
const server=http.createServer(app);
const io=initializeSocket(server);

// apply socket.io middleware before starting routes to ensure that socket.io is initialized and ready to handle connections before any routes are accessed. This way, any route that needs to use socket.io can do so without issues.
app.use((req, res, next) => {
    req.io = io; // Attach the socket.io instance to the request object for use in routes
    req.socketUserMap = io.socketUserMap; // Attach the onlineUsers map to the request object for use in routes
    next();
});





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