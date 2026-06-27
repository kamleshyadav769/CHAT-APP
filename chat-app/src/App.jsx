import React, { useEffect } from 'react'
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom'
import './App.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

//import Login from './Pages/user-login/Login'
import Register from './Pages/user-login/Register'
import { ProtectedRoute, PublicRoute } from './Protected'
import HomePage from './Components/HomePage'
import useUserStore from './Store/useUserStore'
import { disconnectSocket, initializeSocket } from './services/chatService'
import { useChatStore } from './Store/chatStore'
import Setting from './Pages/SettingSection/Setting'


function App() {
  const {user}=useUserStore();
const{setCurrentUser,initsocketListeners,cleanup}=useChatStore();

  useEffect(()=>{
    if(user?._id){
        const socket=initializeSocket();

        if(socket){
          setCurrentUser(user);
            initsocketListeners(socket);
        }
    }

        
  
  return()=>{
    cleanup(); // Clean up socket listeners on component unmount
    //disconnect socket when user logs out or component unmounts
        disconnectSocket();

  }
  },[user, setCurrentUser, initsocketListeners, cleanup]);

  return (
    <>
    <ToastContainer position='top-right' autoClose={3000}/>
    <Router>
      <Routes>
        <Route element={<PublicRoute/>}>
            <Route path='/user-login' element={<Register />} />
       </Route> 
       
       <Route element={<ProtectedRoute/>}>
        <Route path='/' element={<HomePage/>}/>
        <Route path="/setting" element={<Setting/>}/>
        </Route>
      
      </Routes>
    </Router>
    </>
    
  )
}

export default App
