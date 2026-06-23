
import {io} from 'socket.io-client';
import useUserStore from '../Store/useUserStore';

let socket=null;

export const initializeSocket=()=>{
    if(socket) return socket;

    const user=useUserStore.getState().user;

    const BACKEND_URL=import.meta.env.VITE_API_URL;
    console.log("BACKEND_URL:", import.meta.env.VITE_API_URL);
     socket=io(BACKEND_URL,{
        withCredentials:true,
        transports:["websocket","polling"],
        reconnectionAttempts:5,
        reconnectionDelay:1000,
     });
     // Handle connection events
     socket.on('connect',()=>{
        console.log('Connected to Socket.IO server',socket.id);
        // Emit an event to identify the user
        socket.emit('user_connected', user._id);
     });

     socket.on("connect_error",(error)=>{
        console.error('socket connection error:',error);
     });

     socket.on('disconnect', (reason) => {
        console.log('Disconnected from Socket.IO server:', reason);
     });

   return socket;


}


export const getSocket=()=>{
    if(!socket){
        return initializeSocket();
    }
    return socket;
}

export const disconnectSocket=()=>{
    if(socket){
        socket.disconnect();
        socket=null;
    }
}

//AFTER THIS WE WILL GO TO APP.jsx and initialize the socket connection when user logs in and disconnect it when user logs out. We will also create a custom hook to use the socket connection in our components.