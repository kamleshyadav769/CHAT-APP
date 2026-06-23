import mongoose from "mongoose";
mongoose.set("strictQuery", false);

const connectionToDB = async () => {
    try {
        const { connection } = await mongoose.connect(process.env.MONGODB_URL || "mongodb://localhost:27017/chatapplication");  
        if (connection) {
            console.log(`MongoDB connected: ${connection.host}`);
        }
    }
    catch (error) {
        console.log("Error connecting to MongoDB: ", error.message);
        process.exit(1);
    }
}
export default connectionToDB;