import express from 'express';

import authMiddleware from '../middlewares/authMiddleware.js';
import upload from '../middlewares/multerMiddleware.js';
import { sendMessage, getConversations, getMessages, markAsRead, deleteMessage } from '../controllers/chatController.js';



const router = express.Router();

router.post('/send-message',authMiddleware,upload.single("media"), sendMessage);
router.get('/conversations', authMiddleware, getConversations);
router.get('/conversations/:conversationId/messages', authMiddleware, getMessages);
router.put('/messages/read', authMiddleware, markAsRead);
router.delete('/messages/:messageId', authMiddleware, deleteMessage);


export default router;
