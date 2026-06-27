import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup"
import { useForm } from "react-hook-form";
import { useState ,useEffect} from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../Store/useUserStore";

import usethemeStore  from "../../Store/themeStore";
import { FaArrowLeft, FaChevronDown, FaPlus, FaUser, FaWhatsapp, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

import { signUp, signIn, updateUserProfile } from "../../services/userService";

import useLoginStore from "../../Store/useLoginStore";
import { motion } from "framer-motion";
import Spinner from "../../utils/Spinner"


const signUpValidationSchema = yup.object().shape({
    email: yup.string().transform((value, originalValue) => originalValue.trim()).email("Invalid email").required("Email is required"),
    password: yup.string().transform((value, originalValue) => originalValue.trim()).matches(
        /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
        "Password must be at least 8 characters and contain at least one special character"
    ).required("Password is required"),
    confirmPassword: yup.string().transform((value, originalValue) => originalValue.trim()).oneOf([yup.ref("password"), null], "Passwords must match").required("Confirm Password is required")
});

const signInValidationSchema = yup.object().shape({
    email: yup.string().transform((value, originalValue) => originalValue.trim()).email("Invalid email").required("Email is required"),
    password: yup.string().transform((value, originalValue) => originalValue.trim()).matches(
        /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
        "Password must be at least 8 characters and contain at least one special character"
    ).required("Password is required"),
});
const profileValidationSchema = yup.object().shape({
    username: yup.string().required("username is required"),
    agreed: yup.bool().oneOf([true], "you must agree to the terms")
});

const avatars = [
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe',
];


const Register = () => {
    
    const { step, setStep, UserPhoneData, setUserPhoneData, resetLoginState } = useLoginStore();
    console.log("Current step:", step);
    useEffect(() => {
        console.log("STATE:", step);
    }, [step]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
     const [selectedAvatar, setSelectedAvatar] = useState(avatars);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { setUser } = useUserStore();
    const { theme, setTheme } = usethemeStore();
const navigate = useNavigate();
    const {
        register: signUpRegister,
        handleSubmit: handleSignUpSubmit,
        formState: { errors: signUpErrors },
        } = useForm({
            resolver: yupResolver(signUpValidationSchema)
        });
    
        const {
             register: signInRegister,
            handleSubmit: handleSignInSubmit,
            formState: { errors: signInErrors },
        } = useForm({
            resolver: yupResolver(signInValidationSchema)
        });
    
        const {
            register: profileRegister,
            handleSubmit: handleProfileSubmit,
            formState: { errors: profileErrors },
            watch,
        } = useForm({
            resolver: yupResolver(profileValidationSchema)
        })

    const ProgressBar = () => {
        return (
            <div className={`w-full  ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2.5 mb-6`}>
                <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(step / 3) * 100}%` }} >
                </div>
            </div>
        );
    }
    const onSignUpSubmit = async () => {
        // console.log("API CALL TRIGGERED");
        try {

            setLoading(true);
          
                const response = await signUp( email, password, confirmPassword );
                if (response.status === "success") {
                    toast.info("Account created successfully");
                    setUserPhoneData({ email, password, confirmPassword });
                    setStep(2);
            }
        } catch (error) {
            console.log(error);
            setError(error.message || "failed to send otp")
        } finally {
            setLoading(false);
        }
    }

    const onSignInSubmit = async () => {
        try {
            setLoading(true);
            if (!UserPhoneData) {
                throw new Error("phone or email data is missing");
            }
          
            const response = await signIn(UserPhoneData?.email,
                UserPhoneData?.password );
            if (response.status === "success") {
                toast.success("Signed in successfully");

                console.log("FULL RESPONSE:", response);
                console.log("USER EXTRACTED:", response.data?.user);
                const user = response.data?.user;
                // ✅ ALWAYS store user
                setUser(user);
            
             if (user?.username && user?.avatar?.secure_url) {
                    console.log("username", user.username);
                    console.log("avatar", user.avatar?.secure_url);
                    // setUser(user);
                    toast.success("welcome back to whatsapp");
                    navigate('/');
                    resetLoginState();
                } else {
                  /*  console.log("step3 executed");
                    console.log("Current step:", step);
                    setStep(3);
                    console.log("Current next step:", step);*/
                 console.log("BEFORE:", useLoginStore.getState().step);

             

                 setTimeout(async() => {
                     await setStep(3);
                     console.log("AFTER:", useLoginStore.getState().step);
                 }, 0);
                }

            }
        } catch (error) {
            console.log(error);
            setError(error.message || "failed to verify otp")
        } finally {
            setLoading(false); // THIS FIXES YOUR ISSUE
        }
    }   

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePictureFile(file);
            setProfilePicture(URL.createObjectURL(file));

        }
    }

    const onProfileSubmit = async (data) => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("username", data.username);
            formData.append("agreed", data.agreed);
            if (profilePictureFile) {
                formData.append("avatar", profilePictureFile);
            } else {
                formData.append("profilePicture", selectedAvatar);
            }
            await updateUserProfile(formData);
            toast.success("welcome back to what's app");
            navigate('/');
            resetLoginState();

        } catch (error) {
            console.log(error);
            setError(error.message || "failed to update user profile");
        }
    }
    return (
        <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-linear-to-br from-green-400 to-blue-500"} flex items-center justify-center p-4 overflow-hidden`}>

            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={` ${theme === "dark" ? "bg-gray-800 " : "bg-white "} p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 260, damping: 20 }}
                    className={"w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center"}
                >
                    <FaWhatsapp className="w-16 h-16 text-white" />

                </motion.div>
                <h1 className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                    what'sapp login
                </h1>
                <ProgressBar />
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                {step === 1 && (
                    <form className="space-y-4" onSubmit={handleSignUpSubmit(onSignUpSubmit)} >
                        {/* Email input box */}
                        <div className={`flex items-center border rounded-md px-3 py-2 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`} >

                            <FaUser className={`mr-2 text-gray-400 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                            <input type="email"
                                {...signUpRegister('email')}
                                value={email}
                                placeholder="email "
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full bg-transparent focus:outline-none ${theme === "dark" ? "text-white" : "text-black"} ${signUpErrors.email ? "border-red-500" : ""} `}
                            />
                          
                        </div>
                        {signUpErrors.email && (
                            <p className="text-red-500 text-sm">{signUpErrors.email.message}</p>
                        )}
                        <div
                            className={`flex items-center border rounded-md px-3 py-2 ${theme === "dark"
                                    ? "bg-gray-700 border-gray-600"
                                    : "bg-white border-gray-300"
                                }`}
                        >
                            <FaLock
                                className={`mr-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                    }`}
                            />

                            <input
                                type={showPassword ? "text" : "password"}
                                {...signUpRegister("password")}
                                placeholder="Password"
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full bg-transparent focus:outline-none ${theme === "dark" ? "text-white" : "text-black"
                                    }`}
                            />

                            <div
                                onClick={() => setShowPassword(!showPassword)}
                                className="cursor-pointer ml-2"
                            >
                                {showPassword ? (
                                    <FaEyeSlash className="text-gray-500" />
                                ) : (
                                    <FaEye className="text-gray-500" />
                                )}
                            </div>
                        </div>

                        {signUpErrors.password && (
                            <p className="text-red-500 text-sm mt-1">
                                {signUpErrors.password.message}
                            </p>
                        )}

                        <div
                            className={`flex items-center border rounded-md px-3 py-2 ${theme === "dark"
                                    ? "bg-gray-700 border-gray-600"
                                    : "bg-white border-gray-300"
                                }`}
                        >
                            <FaLock
                                className={`mr-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                    }`}
                            />

                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                {...signUpRegister("confirmPassword")}
                                placeholder="Confirm Password"
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full bg-transparent focus:outline-none ${theme === "dark" ? "text-white" : "text-black"
                                    }`}
                            />

                            <div
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="cursor-pointer ml-2"
                            >
                                {showConfirmPassword ? (
                                    <FaEyeSlash className="text-gray-500" />
                                ) : (
                                    <FaEye className="text-gray-500" />
                                )}
                            </div>
                        </div>

                        {signUpErrors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">
                                {signUpErrors.confirmPassword.message}
                            </p>
                        )}

                         <button
                                                    type="submit"
                                                    className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition">
                                                    {loading ? <Spinner /> : "Register"}
                                                </button>
                        
                    </form>
                )}
                {step === 2 && (
                    <form className="space-y-4" onSubmit={handleSignInSubmit(onSignInSubmit)} >

                        {/* Email input box */}
                        <div className={`flex items-center border rounded-md px-3 py-2 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`} >

                            <FaUser className={`mr-2 text-gray-400 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                            <input type="email"
                                {...signInRegister('email')}
                                value={email}
                                placeholder="email (optional)"
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full bg-transparent focus:outline-none ${theme === "dark" ? "text-white" : "text-black"}${signInErrors.email ? "border-red-500" : ""} `}
                            />

                            {signInErrors.email && (
                                <p className="text-red-500 text-sm">{signInErrors.email.message}</p>
                            )}
                        </div>
                        <div
                            className={`flex items-center border rounded-md px-3 py-2 ${theme === "dark"
                                ? "bg-gray-700 border-gray-600"
                                : "bg-white border-gray-300"
                                }`}
                        >
                            <FaLock
                                className={`mr-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                    }`}
                            />

                            <input
                                type={showPassword ? "text" : "password"}
                                {...signInRegister("password")}
                                placeholder="Password"
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full bg-transparent focus:outline-none ${theme === "dark" ? "text-white" : "text-black"
                                    }`}
                            />

                            <div
                                onClick={() => setShowPassword(!showPassword)}
                                className="cursor-pointer ml-2"
                            >
                                {showPassword ? (
                                    <FaEyeSlash className="text-gray-500" />
                                ) : (
                                    <FaEye className="text-gray-500" />
                                )}
                            </div>
                        </div>

                        {signInErrors.password && (
                            <p className="text-red-500 text-sm mt-1">
                                {signInErrors.password.message}
                            </p>
                        )}
                          <button
                                                    type="submit"
                                                    className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition">
                                                    {loading ? <Spinner /> : "login"}
                                                </button>
                    </form>
                )}
               
                       {step === 3 && (
                                        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                                            <div className="flex flex-col items-center mb-4">
                                                <div className="relative w-24 h-24 mb-2">
                                                    <img
                                                        src={profilePicture || selectedAvatar}
                                                        alt="profile"
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                    
                    
                                                    <label
                                                        htmlFor="profile-picture"
                                                        className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition duration-300" >
                                                        <FaPlus className="w-4 h-4" />
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id="profile-picture"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                    />
                                                </div>
                                                <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}mb-2`}>
                                                    Choose an avatar
                                                </p>
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    {avatars.map((avatar, index) => (
                                                        <img
                                                            key={index}
                                                            src={avatar}
                                                            alt={`Avatar ${index + 1}`}
                                                            className={`w-12 h-12 rounded-full cursor-pointer transition duration-300 ease-in-out transform hover:scale-110 ${selectedAvatar === avatar ? "ring-2 ring-green-500" : ""}`}
                                                            onClick={() => setSelectedAvatar(avatar)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                    
                                            <div className="relative">
                                                <FaUser
                                                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`}
                                                />
                                                <input
                                                    {...profileRegister("username")}
                                                    type="text"
                                                    placeholder="Username"
                                                    className={`w-full pl-10 pr-3 py-2 border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-lg`}
                                                />
                                                {profileErrors.username && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {profileErrors.username.message}
                                                    </p>
                                                )}
                                            </div>
                    
                    
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    {...profileRegister("agreed")}
                                                    type="checkbox"
                                                    id="terms"
                                                    className={`rounded ${theme === "dark" ? "text-green-500 bg-gray-700" : "text-green-500"} focus:ring-green-500`}
                                                />
                                                <label
                                                    htmlFor="terms"
                                                    className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                                                >
                                                    I agree to the {" "}
                                                    <a href="#" className="text-red-500 hover:underline">
                                                        Terms and Conditions
                                                    </a>
                                                </label>
                    
                                                {profileErrors.agreed && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {profileErrors.agreed.message}
                                                    </p>
                                                )}
                                            </div>
                    
                    
                    
                                            <button
                                                type="submit"
                                                disabled={!watch("agreed") || loading}
                                                className={`w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
                    
                                                {loading ? <Spinner /> : "Create Profile"}
                                            </button>
                                        </form>
                                    )}
            </motion.div>
        </div>
    )
    
};
export default Register;