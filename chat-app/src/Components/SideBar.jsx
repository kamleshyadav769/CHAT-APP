import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import usethemeStore from "../Store/themeStore";
import useUserStore from "../Store/useUserStore";
import useLayoutStore from "../Store/layoutStore";
import { FaCog, FaUserCircle, FaWhatsapp } from "react-icons/fa";
import { MdRadioButtonChecked } from "react-icons/md";

import { motion } from "framer-motion";

const Sidebar = () => {
    const location = useLocation(); //ye btaata hai ki aappp currently kis route pr ho
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const { theme, setTheme } = usethemeStore();
    const { user } = useUserStore();
    const { activeTab, setActiveTab, selectedContact } = useLayoutStore();


    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize)
    }, []);

    useEffect(() => {
        if (location.pathname == '/') {
            setActiveTab("chats")
        } else if (location.pathname === 'status') {
            setActiveTab("status")
        } else if (location.pathname === '/user-profile') {
            setActiveTab("profile")
        } else if (location.pathname === '/setting')
            setActiveTab("setting")
    }, [location, setActiveTab])

    if (isMobile && selectedContact) {
        return null;
    }

    const SidebarContent = (<>
        <Link
            to='/'
            className={`${isMobile ? " " : "mb-8"} ${activeTab === "chats" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
        >
            <FaWhatsapp
                className={`h-6 w-6 ${activeTab === "chats" ? theme === "dark" ? "text-gray-800" : "" : theme === "dark" ? "text-gray-300" : "text-gray-800"}`}
            />
        </Link>



        <Link
            to='/status'
            className={`${isMobile ? " " : "mb-8"} ${activeTab === "status" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
        >
            <MdRadioButtonChecked
                className={`h-6 w-6 ${activeTab === "status" ? theme === "dark" ? "text-gray-800" : "" : theme === "dark" ? "text-gray-300" : "text-gray-800"}`}
            />
        </Link>
        {!isMobile && <div className="grow"></div>}

        <Link
            to='/user-profile'
            className={`${isMobile ? " " : "mb-8"} ${activeTab === "profile" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
        >
            {user?.profilePicture ? (
                <img
                    src={user.profilePicture}
                    alt="user"
                    className="h-6 w-6 rounded-full"
                />
            ) : (
                <FaUserCircle
                    className={`h-6 w-6 ${activeTab === "profile" ? theme === "dark" ? "text-gray-800" : "" : theme === "dark" ? "text-gray-300" : "text-gray-800"}`}
                />
            )}
        </Link>

        
        <Link
            to='/setting'
            className={`${isMobile ? " " : "mb-8"} ${activeTab === "setting" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
        >
            <FaCog
                className={`h-6 w-6 ${activeTab === "setting" ? theme === "dark" ? "text-gray-800" : "" : theme === "dark" ? "text-gray-300" : "text-gray-800"}`}
            />
        </Link>
    </>
    )


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`${isMobile ? "fixed bottom-0 left-0 right-0 h-16" : "w-16 h-screen border-right-2"} ${theme === "dark" ? "bg-gray-800 border-gray-300" : "bg-[rgb(239,242,245)]"} bg-opacity-90 flex items-center py-4 shadow-lg
       ${isMobile ? "flex-row justify-around" : "flex-col justify-between"}
       `}
        >
            {SidebarContent}
        </motion.div>
    )

}
export default Sidebar;