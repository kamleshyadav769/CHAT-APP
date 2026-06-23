import { config } from "dotenv";
config();
import express from "express";
import cors from "cors";
import cookieParser  from "cookie-parser";
import morgan from "morgan";
import authroute from "./routes/userRoute.js";
import chatRoute from "./routes/chatRoute.js";
import statusRoute from "./routes/statusRoute.js";


 const app=express();

console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
app.use(cors({
      origin:process.env.FRONTEND_URL,
      credentials:true
}));
//middlewares
 app.use(express.json()); 
app.use(express.urlencoded({extended:true}));
 app.use(cookieParser());  
app.use(morgan("dev"));



app.use('/api/auth',authroute);
app.use('/api/chats',chatRoute);
app.use('/api/status',statusRoute);







 app.use((req,res)=>{
    res.status(404).send('OOPS! 404 page not found');
 });


 export default app;