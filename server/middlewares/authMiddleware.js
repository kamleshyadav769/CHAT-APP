import jwt from 'jsonwebtoken';
import response from '../utils/resposeHandler.js';

const authMiddleware= async (req, res, next) => {
    const { auth_token } = req.cookies;
    if (!auth_token) {
        return response(res, 401,'Unauthenticated,please login again');

    }

    const userDetails = await jwt.verify(auth_token, process.env.JWT_SECRET);
    req.user = userDetails;
    next();
}
export default authMiddleware;