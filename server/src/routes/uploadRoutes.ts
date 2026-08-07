import express from 'express';
import { upload } from '../middleware/uploadMiddleware';
import { uploadFile } from '../controllers/uploadController';

const router = express.Router();

// Route: POST /api/upload
// Accepts a single file with the form field name "image"
router.post('/', upload.single('image'), uploadFile);

export default router;