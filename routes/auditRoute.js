import express from 'express';
import { getAuditTrail } from '../controllers/auditController.js';
import userAuth from '../middleware/userAuth.js';

const router = express.Router();

router.get('/:fileId', userAuth, getAuditTrail);

export default router;