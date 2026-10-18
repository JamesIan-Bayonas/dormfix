import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileOwnerPrefix } from './privateFiles';

// Ensuring uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, fileOwnerPrefix(req.res!.locals.actor.id) + crypto.randomUUID() + path.extname(file.originalname).toLowerCase());
    }
});

// Export the "upload" tool to be used in routes
export const upload = multer({ storage, limits:{fileSize:8*1024*1024,files:1,fields:12,fieldSize:20000},fileFilter:(_req,file,cb)=>{
    if (!['image/png','image/jpeg','image/gif','image/webp'].includes(file.mimetype) || !/\.(png|jpe?g|gif|webp)$/i.test(file.originalname)) { cb(new Error('Choose a PNG, JPEG, GIF, or WebP image.'));return; }
    cb(null,true);
} });
