
import useLoginStore from "../../Store/useLoginStore";
import { useState } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup"
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import * as Flags from "country-flag-icons/react/3x2";

//explore react librsary react useform hook for form handling and validation in login page
/*
npm install react-hook-form   // for form handling and validation we have to install this library

for schema validation we have to install these libraries
npm install @hookform/resolvers  // for integrating yup with react-hook-form
npm install yup  // for schema validation*/

import countries from "../../utils/countries"; // Assuming you have a list of countries in this file
import { useNavigate } from "react-router-dom";
import useUserStore from "../../Store/useUserStore";
import usethemeStore from "../../Store/themeStore";
import { FaArrowLeft, FaChevronDown, FaPlus, FaUser, FaWhatsapp } from "react-icons/fa";
import Spinner from "../../utils/Spinner"
import { sendOtp, updateUserProfile, verifyOtp } from "../../services/userService";
import { toast } from "react-toastify";



// here we define  login validation schema  using yup validator
const loginValidationSchema = yup.object().shape({
    phoneNumber: yup.string().nullable().notRequired().matches(/^\d+$/, "phone number be digit").transform((value, originalValue) =>
        originalValue.trim() === "" ? null : value
    ),
    email: yup.string().nullable().notRequired().email("please enter valid email").transform((value, originalValue) =>
        originalValue.trim() === "" ? null : value
    ).test(
        "at-least-one",
        "Either email or phone number is required",
        /* function(value){
             return !!(value.phoneNumber||value.email)
         }*/
        function () {
            const { phoneNumber, email } = this.parent;
            return !!(phoneNumber || email);
        }
    )
});


const otpValidationSchema = yup.object().shape({
    otp: yup.string().length(6, "Otp must be exactly 6 digits").required("otp is required")
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

const Login = () => {
    const { step, setStep, UserPhoneData, setUserPhoneData, resetLoginState } = useLoginStore();

    const [phoneNumber, setPhoneNumber] = useState("");
    const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to the first country in the list
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [email, setEmail] = useState("");
    const [profilePicture, setProfilePicture] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState(avatars);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setUser } = useUserStore();
    const { theme, setTheme } = usethemeStore();
    const [loading, setLoading] = useState(false)


    const {
        register: loginRegister,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors },
    } = useForm({
        resolver: yupResolver(loginValidationSchema)
    });

    const {

        handleSubmit: handleOtpSubmit,
        formState: { errors: otpErrors },
        setValue
    } = useForm({
        resolver: yupResolver(otpValidationSchema)
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

    const SelectedFlag = Flags[selectedCountry.alpha2];

    const filterCountries = countries.filter((country) =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) || country.dialCode.includes(searchTerm)

    )

    const onLoginSubmit = async () => {
       // console.log("API CALL TRIGGERED");
        try {

            setLoading(true);
            if (email) {
                const response = await sendOtp(null, null, email);
                if (response.status === "success") {
                    toast.info("OTP is send to your email");
                    setUserPhoneData({ email });
                    setStep(2);

                }
            } else {
                const response = await sendOtp(phoneNumber, selectedCountry.dialCode);
                if (response.status === "success") {
                    toast.info("OTP is send to your phone number");
                    setUserPhoneData({ phoneNumber, phonesuffix: selectedCountry.dialCode });
                    setStep(2);

                }
            }
        } catch (error) {
            console.log(error);
            setError(error.message || "failed to send otp")
        } finally {
            setLoading(false);
        }
    }

    const onOtpSubmit = async () => {
        try {
            setLoading(true);
            if (!UserPhoneData) {
                throw new Error("phone or email data is missing");
            }
            const otpString = otp.join("");
            let response;
            if (UserPhoneData?.email) {
                response = await verifyOtp(null, null, UserPhoneData?.email, otpString);
            } else {
                response = await verifyOtp(UserPhoneData?.phoneNumber, UserPhoneData?.phonesuffix, null, otpString,)
            }
            if (response.status === "success") {
                toast.success("OTP verify succesfully");
               
                 console.log("FULL RESPONSE:", response);
                console.log("USER EXTRACTED:", response.data?.user);
                const user = response.data?.user;
                // ✅ ALWAYS store user
                setUser(user);

                if (user?.username && user?.avatar?.secure_url) {
                   // setUser(user);
                    toast.success("welcome back to whatsapp");
                    navigate('/');
                    resetLoginState();
                } else {
                    setStep(3);
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

    const handleOtpChange = (index, value) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setValue("otp", newOtp.join(""));
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    }

    const handleBack = () => {
        setStep(1);
        setUserPhoneData(null);
        setOtp(["", "", "", "", "", ""]);
        setError("");

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
                    <form className="space-y-4" onSubmit={handleLoginSubmit(onLoginSubmit)} >
                        <p className={`text-center mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-4`}>
                            Enter your phone number to recieve otp
                        </p>
                        <div className="relative">
                            <div className="flex">
                                <div className="relative w-1/3">
                                    <button
                                        type="button"
                                        className={`shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm text-center ${theme === "dark" ? " text-white bg-gray-700 border-gray-600" : " text-gray-900 bg-gray-100 border-gray-300"} border rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100`}
                                        onClick={() => setShowDropdown(!showDropdown)}
                                    >
                                        <span className="flex items-center gap-2">
                                            {SelectedFlag && <SelectedFlag className="w-5 h-4" />}
                                            {selectedCountry.dialCode}
                                        </span>


                                        <FaChevronDown className="ml-2" />
                                    </button>

                                    {showDropdown && (
                                        <div className={`absolute z-10 mt-1 min-w-full ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border rounded-md shadow-lg max-h-60 overflow-auto`}>
                                            <div className={`sticky top-0 ${theme === "dark" ? "bg-gray-700" : "bg-white"} p-2`}>
                                                <input
                                                    type="text"
                                                    placeholder="search countries ...."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className={`w-full px-2 py-1 ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 `}
                                                />
                                            </div>


                                            {filterCountries.map((country) => {
                                                const Flag = Flags[country.alpha2];

                                                return (
                                                    <button
                                                        key={country.alpha2}
                                                        type="button"
                                                        className={`w-full flex items-center gap-2 px-3 py-2 ${theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-100"
                                                            }`}
                                                        onClick={() => {
                                                            setSelectedCountry(country);
                                                            setShowDropdown(false);
                                                        }}
                                                    >
                                                        {Flag && <Flag className="w-5 h-4" />}
                                                        ({country.dialCode}) {country.name}
                                                    </button>
                                                );

                                            })}
                                        </div>
                                    )}
                                </div>
                                <input type="text"
                                    {...loginRegister('phoneNumber')}
                                    value={phoneNumber}
                                    placeholder="phone number"
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className={`w-2/3 px-4 py-2 border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} rounded-md  focus:outline-none focus:ring-2 focus:ring-green-500 ${loginErrors.phoneNumber ? "border-red-500" : ""} `}
                                />
                            </div>
                            {loginErrors.phoneNumber && (
                                <p className="text-red-500 text-sm">{loginErrors.phoneNumber.message}</p>
                            )}
                        </div>
                        {/* divider with or */}
                        <div className="flex items-center my-4" >
                            <div className="grow h-px bg-gray-300 " />
                            <span className="mx-3 text-gray-500 text-sm font-medium" >Or</span>
                            <div className="grow h-px bg-gray-300 " />
                        </div>

                        {/* Email input box */}
                        <div className={`flex items-center border rounded-md px-3 py-2 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`} >

                            <FaUser className={`mr-2 text-gray-400 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                            <input type="email"
                                {...loginRegister('email')}
                                value={email}
                                placeholder="email (optional)"
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full bg-transparent focus:outline-none ${theme === "dark" ? "text-white" : "text-black"}${loginErrors.email ? "border-red-500" : ""} `}
                            />

                            {loginErrors.email && (
                                <p className="text-red-500 text-sm">{loginErrors.email.message}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition">
                            {loading ? <Spinner /> : "Send Otp"}
                        </button>

                    </form>
                )}

                {step == 2 && (
                    <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
                        <p className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-4`}>
                            please enter the 6-digit OTP to your {UserPhoneData ? UserPhoneData?.phonesuffix : "Email"} {" "}
                            {UserPhoneData?.phoneNumber}
                        </p>

                        <div className="flex justify-between">
                            {otp.map((digit, index) => (
                                <input

                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"

                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    className={`w-12 h-12 text-center border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${otpErrors.otp ? "border-red-500" : ""} `}

                                />
                            ))}


                        </div>
                        {otpErrors.otp && (
                            <p className="text-red-500 text-sm">{otpErrors.otp.message}</p>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition">
                            {loading ? <Spinner /> : "verify OTP"}
                        </button>

                        <button type="button"
                            onClick={handleBack}
                            className={`w-full mt-2 ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} py-2 rounded-md hover:bg-gray-300 transition flex items-center justify-center`}
                        >
                            <FaArrowLeft className="mr-2" />
                            Wrong number ?go back
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


    );
}

export default Login;