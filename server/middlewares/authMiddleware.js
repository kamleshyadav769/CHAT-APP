import jwt from 'jsonwebtoken';
import response from '../utils/resposeHandler.js';

/*const authMiddleware= async (req, res, next) => {
    const { auth_token } = req.cookies;
    if (!auth_token) {
        return response(res, 401,'Unauthenticated,please login again');

    }

    const userDetails = await jwt.verify(auth_token, process.env.JWT_SECRET);
    req.user = userDetails;
    next();
}

*/
const authMiddleware = async (req, res, next) => {
    try {
        console.log("========== AUTH ==========");
        console.log("Origin:", req.headers.origin);
        console.log("Cookies:", req.cookies);

        const auth_token = req.cookies?.auth_token;

        console.log("Auth token exists:", !!auth_token);

        if (!auth_token) {
            console.log("❌ AUTH TOKEN NOT FOUND");

            return response(
                res,
                401,
                "Unauthenticated, please login again"
            );
        }

        const userDetails = jwt.verify(
            auth_token,
            process.env.JWT_SECRET
        );

        console.log("✅ JWT:", userDetails);

        req.user = userDetails;

        next();

    } catch (error) {
        console.error("❌ JWT ERROR:", error.message);

        return response(
            res,
            401,
            "Invalid or expired authentication token"
        );
    }
};
export default authMiddleware;