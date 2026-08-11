import jwt from 'jsonwebtoken';
import response from '../utils/resposeHandler.js';

const socketMiddleware = async (socket, next) => {

    const token = socket.handshake.auth?.token|| socket.handshake.headers['authorization']?.split(' ')[1];
    if (!token) {
        return next(new Error('authorization token missing , please provide token'));
    }

    try {
        const userDetails = await jwt.verify(token, process.env.JWT_SECRET);
        socket.user = userDetails;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return next(new Error('invalid or expired token, please login again'));
    }
}


export default socketMiddleware;