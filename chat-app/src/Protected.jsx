import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom"
import useUserStore from "./Store/useUserStore";
import { getUserProfile } from "./services/userService";
import Loader from "./utils/Loader";


const ProtectedRoute = () => {
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const { isAuthenticated, setUser, clearUser } = useUserStore();


    useEffect(() => {
       
       
        const verifyAuth = async () => {
            try {
                const result = await getUserProfile();
                if (result?.isAuthenticated) {
                    setUser(result.user);
                } else {
                    clearUser();
                }

            } catch (error) {
                console.log(error);

            } finally {
                setIsChecking(false);
            }
        }
        verifyAuth();

    }, [setUser, clearUser])

    if (isChecking) {
        return <Loader />
    }
    if (!isAuthenticated) {
        return <Navigate to="/user-login" state={{ from: location }} replace />
        
    }

    //user is authenticated then render the protected route
    return <Outlet />
}

const PublicRoute = () => {
    const isAuthenticated = useUserStore(state => state.isAuthenticated);
    
    if (isAuthenticated) {
        return <Navigate to='/' replace />
    }
    return <Outlet />
}
export { ProtectedRoute, PublicRoute };

