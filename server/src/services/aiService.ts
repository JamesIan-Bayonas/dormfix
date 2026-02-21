import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import Tesseract from 'tesseract.js'; 

// Setup the Connection to Local Ollama
const openai = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama', 
});

// Define the Output Structure
const PaymentAnalysisSchema = z.object({
    is_valid_receipt: z.boolean(),
    extracted_amount: z.number().nullable(),
    extracted_date: z.string().nullable(),
    reference_number: z.string().nullable(),
    confidence_score: z.number().min(0).max(100),
    analysis_notes: z.string()
});

export const analyzePaymentImage = async (filePath: string) => {
    try {
        
        // EXACT TEXT EXTRACTION (OCR)
        console.log("Step 1: Running OCR to extract raw text...");
        // Tesseract scans the image and pulls out the exact characters
        const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
        
        console.log("Extracted Text Preview:\n", text.substring(0, 200) + "...\n");

        // AI DATA PARSING 
        console.log("Step 2: Asking AI to organize the text...");
        
        const response = await openai.chat.completions.create({
            model: 'llava', // We use the same model, but only feed it text now
            temperature: 0.0, // Strict, no-guessing mode
            messages: [
                {
                    role: "system",
                    content: `You are a strict data parsing algorithm. I will provide you with raw, messy text scanned from a utility bill, a bank receipt, or an e-wallet screenshot.
                    
                    RULES:
                    1. Extract the exact Amount. Look for "Total Amount Due:", "AMOUNT", or numbers near "PHP".
                    2. Extract the Date.
                    3. Extract the Account Number or Reference Number.
                    4. Do NOT invent data. If a field is completely missing, return null.
                    5. Ignore background noise text.`
                },
                {
                    role: "user",
                    // NOTE: We send the raw TEXT here, not the image URL!
                    content: `Here is the raw text scanned from the document:\n\n${text}` 
                }
            ],
            response_format: zodResponseFormat(PaymentAnalysisSchema, "payment_analysis"),
        });

        // Parse the Result
        const content = response.choices[0].message.content;
        if (!content) return null;

        return JSON.parse(content);

    } catch (error) {
        console.error("Analysis Pipeline Failed:", error);
        return null; 
    }
};