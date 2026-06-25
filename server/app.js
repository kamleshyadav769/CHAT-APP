import { config } from "dotenv";
config();
import express from "express";
import cors from "cors";
import cookieParser  from "cookie-parser";
import morgan from "morgan";
import authroute from "./routes/userRoute.js";
import chatRoute from "./routes/chatRoute.js";
import statusRoute from "./routes/statusRoute.js";
import net from "net";

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
app.get("/version", (req, res) => {
      res.send("DNS TEST VERSION");
});

app.get("/dns-test", async (req, res) => {
      const dnsPromises = await import("node:dns/promises");

      const records = await dnsPromises.lookup(
            "smtp.gmail.com",
            { all: true }
      );

      console.log(records);

      res.json(records);
});


app.get("/smtp-test", (req, res) => {

      const socket = net.createConnection({
            host: "74.125.68.109",
            port: 587
      });

      socket.setTimeout(10000);

      socket.on("connect", () => {
            res.send("SMTP PORT OPEN");
            socket.destroy();
      });

      socket.on("timeout", () => {
            res.send("SMTP TIMEOUT");
            socket.destroy();
      });

      socket.on("error", (err) => {
            res.send(err.message);
      });

});
app.use('/api/auth',authroute);
app.use('/api/chats',chatRoute);
app.use('/api/status',statusRoute);






app.get("/", (req, res) => {
      res.send("SERVER VERSION FB72CE4");
});
 app.use((req,res)=>{
    res.status(404).send('OOPS! 404 page not found');
 });


 export default app;