import axoisInstance from "./urlService"

const sendOtp=async (phoneNumber,phonesuffix,email)=>{
try{
    const response = await axoisInstance.post("/auth/send-otp",{
        phoneNumber,
        phonesuffix,
        email
    });
    return response.data;

}catch(error){
    throw error.response ? error.response.data :error.message;
}
}

const verifyOtp = async (phoneNumber, phonesuffix, email, otp) => {
    try {
        const response = await axoisInstance.post("/auth/verify-otp", {
            phoneNumber,
            phonesuffix,
            email,
            otp
        });
        return response.data;

    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}

const updateUserProfile = async (updateData) => {
    try {
        const response = await axoisInstance.put("/auth/update-profile", updateData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}
const getUserProfile = async () => {
    try {
        console.log("Fetching user profile...");
        const response = await axoisInstance.get("/auth/get-profile");
        console.log("Profile API response:", response.data);
        
        if(response.data.status === "success"){
            console.log("Profile fetch success, user:", response?.data?.data);
            return {isAuthenticated: true, user: response?.data?.data};
        }else if(response.data.status === "error"){
            console.warn("Profile fetch returned error status:", response.data);
            return {isAuthenticated: false, user: null};
        }
    } catch (error) {
        console.error("Error fetching profile:", error.response?.data || error.message);
        throw error.response ? error.response.data : error.message;
    }
}


const logoutUser = async () => {
    try {
        const response = await axoisInstance.get("/auth/logout");
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}

const getAllUsers = async () => {
    try {
        const response = await axoisInstance.get("/auth/all-users");
        console.log("getAllUsers response:", response.data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}


export{sendOtp, verifyOtp, updateUserProfile, getUserProfile, logoutUser, getAllUsers};