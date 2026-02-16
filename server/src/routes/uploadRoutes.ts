import express from 'express';
import { upload } from '../middleware/uploadMiddleware.ts';
import { uploadFile } from '../controllers/uploadController.ts';

const router = express.Router();

// Route: POST /api/upload
// Accepts a single file with the form field name "image"
router.post('/', upload.single('image'), uploadFile);

export default router;