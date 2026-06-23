import ChatList from "../Pages/chatSection/ChatList";
import Layout from "./Layout";
import useLayoutStore from "../Store/layoutStore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAllUsers,getUserProfile } from "../services/userService";
import useUserStore from "../Store/useUserStore";

const HomePage = () => {
   
    const [allUsers,setAllUsers]=useState([]);
    const setUser = useUserStore(state => state.setUser);

    useEffect(()=>{
        const fetchAllUsers = async () => {
            try {

                // FETCH LOGGED IN USER
                const profile = await getUserProfile();

                if (profile?.isAuthenticated) {
                    setUser(profile.user);
                }

                // FETCH ALL USERS

                const result = await getAllUsers();
                if (result.status === 'success') {
                    setAllUsers(result.data);

                }
            } catch (error) {
                console.log(error);
            }
        }
        fetchAllUsers();

    },[setUser])
    console.log("list of all users are ",allUsers)
    return (
       <Layout>
<motion.div
initial={{opacity:0}}
animate={{opacity:1}}
transition={{duration:0.5}}
className="h-full">
     <ChatList contacts={allUsers} /> 
   
</motion.div>
       </Layout>


    )
}
export default HomePage;