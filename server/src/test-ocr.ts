// server/src/test-ocr.ts
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env') });

import { analyzePaymentImage } from './services/aiService';

async function runTest() {
    const uploadsDir = path.join(process.cwd(), 'uploads');

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let targetImage = path.join(uploadsDir, 'test-receipt.jpg');

    // If 'test-receipt.jpg' does not exist, grab any existing image in uploads
    if (!fs.existsSync(targetImage)) {
        const files = fs.readdirSync(uploadsDir)
            .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
            .map(f => ({ name: f, time: fs.statSync(path.join(uploadsDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 0) {
            targetImage = path.join(uploadsDir, files[0].name);
            console.log(`[AEGIS Verification] 'test-receipt.jpg' not found. Testing with newest image: ${files[0].name}`);
        } else {
            console.error(`\n❌ No images found in '${uploadsDir}'.`);
            console.error(`👉 Copy any receipt image (.jpg or .png) into that directory and re-run this command.\n`);
            return;
        }
    }

    console.log(`[AEGIS Verification] Analyzing image at: ${targetImage}`);
    console.log(`[AEGIS Verification] Gemini Key Status: ${process.env.GEMINI_API_KEY ? 'CONFIGURED (ends with ' + process.env.GEMINI_API_KEY.slice(-4) + ')' : 'MISSING'}`);

    try {
        const result = await analyzePaymentImage(targetImage);
        console.log('\n=== OCR MULTIMODAL EXTRACTION RESULT ===');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Execution failure:', error);
    }
}

runTest();