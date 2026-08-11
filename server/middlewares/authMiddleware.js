import jwt from 'jsonwebtoken';
import response from '../utils/resposeHandler.js';

const authMiddleware= async (req, res, next) => {
    // const  auth_token  = req.cookies?.auth_token;
    // if (!auth_token) {
    //     return response(res, 401,'Unauthenticated,please login again');

    // }

  const authHeader = req.headers['authorization'];
if (!authHeader|| !authHeader.startsWith('Bearer ')) {
    return response(res, 401,'authorization token missing , please provide token');
}
const token=authHeader.split(' ')[1];


try {
    const userDetails = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = userDetails;
    next();
}catch (error) {
    console.error('Error verifying token:', error);
    return response(res, 401,'invalid or expired token, please login again');
}
}


export default authMiddleware;