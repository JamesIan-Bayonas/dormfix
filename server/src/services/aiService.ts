import fs from 'fs';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

// 1. Setup the Connection to Local Ollama
// Ollama runs on port 11434 by default
const openai = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama', // Required but unused for local
});

// 2. Define the Output Structure (Schema)
// We want the AI to return strictly this format
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
        // 3. Prepare the Image
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        // 4. Send to AI (Llava or Llama 3.2 Vision)
        const response = await openai.chat.completions.create({
            model: 'llava', // Make sure you ran 'ollama run llava'
            messages: [
                {
                    role: "system",
                    content: "You are a payment auditor. Analyze the image to verify if it is a valid proof of payment (like a bank receipt or GCash screenshot). Extract the amount, date, and reference number."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this payment receipt." },
                        {
                            type: "image_url",
                            image_url: { url: dataUrl }
                        }
                    ]
                }
            ],
            // 5. Enforce JSON Format (Structured Output)
            response_format: zodResponseFormat(PaymentAnalysisSchema, "payment_analysis"),
        });

        // 6. Parse the Result
        const content = response.choices[0].message.content;
        if (!content) return null;

        return JSON.parse(content);

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        return null; // Fail gracefully if AI is down
    }
};