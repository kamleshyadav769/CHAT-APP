import express from 'express';

import authMiddleware from '../middlewares/authMiddleware.js';
import upload from '../middlewares/multerMiddleware.js';
import { createStatus, getStatuses, viewStatus,deleteStatus } from '../controllers/statusController.js';


const router = express.Router();

router.post('/', authMiddleware, upload.single("mediaUrl"), createStatus);
router.get('/', authMiddleware, getStatuses);

router.put('/:statusId/view', authMiddleware, viewStatus);
router.delete('/:statusId', authMiddleware, deleteStatus);


export default router;