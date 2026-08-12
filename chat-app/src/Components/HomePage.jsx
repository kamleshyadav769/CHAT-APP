import ChatList from "../Pages/chatSection/ChatList";
import Layout from "./Layout";
import useLayoutStore from "../Store/layoutStore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAllUsers,getUserProfile } from "../services/userService";
import useUserStore from "../Store/useUserStore";
import { useChatStore } from "../Store/chatStore";
import { useMemo } from "react";

const HomePage = () => {
   
    const [allUsers,setAllUsers]=useState([]);
    const user = useUserStore(state => state.user);
    const setUser = useUserStore(state => state.setUser);
    // Get conversations DIRECTLY from Zustand
    const conversations = useChatStore(state => state.conversations);

    const fetchConversations = useChatStore(
        state => state.fetchConversations
    );

    const setCurrentUser = useChatStore(
        state => state.setCurrentUser
    );
    useEffect(()=>{
        const fetchAllUsers = async () => {
            try {

                // FETCH LOGGED IN USER
                const profile = await getUserProfile();

                if (profile?.isAuthenticated) {
                    setUser(profile.user);
                    setCurrentUser(profile.user);

                }

                // FETCH ALL USERS

                const result = await getAllUsers();
                if (result.status === 'success') {
                    setAllUsers(result.data);

                }

                await fetchConversations();
            } catch (error) {
                console.log(error);
            }
        }
        fetchAllUsers();

    },[setUser, setCurrentUser, fetchConversations]);
    // console.log("list of all users are ",allUsers)

    // --------------------------------------------------
    // MERGE USERS + CONVERSATIONS
    // --------------------------------------------------

    const contactsWithConversations = useMemo(() => {

        const conversationArray =
            conversations?.data || [];

        if (!user) {
            return allUsers;
        }


        return allUsers
            // Don't show yourself in chat list
            .filter(contact =>
                contact?._id !== user?._id
            )

            .map(contact => {

                // Find conversation between logged-in user
                // and this contact

                const conversation =
                    conversationArray.find(conv => {

                        const participants =
                            conv?.participants || [];

                        const hasCurrentUser =
                            participants.some(
                                participant =>
                                    participant?._id?.toString() ===
                                    user?._id?.toString()
                            );

                        const hasContact =
                            participants.some(
                                participant =>
                                    participant?._id?.toString() ===
                                    contact?._id?.toString()
                            );

                        return hasCurrentUser && hasContact;

                    });


                return {
                    ...contact,

                    // Existing conversation or null
                    conversation: conversation || null
                };

            });

    }, [
        allUsers,
        conversations,
        user
    ]);

    return (
       <Layout>
<motion.div
initial={{opacity:0}}
animate={{opacity:1}}
transition={{duration:0.5}}
className="h-full">
     <ChatList contacts={contactsWithConversations} /> 
   
</motion.div>
       </Layout>


    )
}
export default HomePage;