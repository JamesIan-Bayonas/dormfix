import type { Request, Response } from 'express';

// 1. DEFINE THE SHAPE MANUALLY (The "Manual Override")
// We create our own interface so we don't rely on the global namespace working perfectly.
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}

// 2. USE IT IN THE REQUEST
export const uploadFile = (req: Request & { file?: MulterFile }, res: Response) => {
    try {
        // Now TypeScript knows exactly what 'file' looks like
        if (!req.file) {
             res.status(400).json({ error: "No file uploaded" });
             return;
        }
        
        const filePath = `/uploads/${req.file.filename}`;
        res.json({ url: filePath });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "File upload failed" });
    }
};