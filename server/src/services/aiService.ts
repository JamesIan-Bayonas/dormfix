import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import Tesseract from 'tesseract.js'; 

// Setup the Connection to Local Ollama
const openai = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama', 
});

// Define the Output Structure for Payments
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
                    1. Extract the exact Amount. Look for "Total Amount Due:", "AMOUNT", or numbers near "PHP" or "$". 
                    CRITICAL: You must remove all commas from the number before returning it. For example, if you see "18,200.00", return the number 18200.00. Do NOT return 18.2.
                    2. Extract the Date.
                    3. Extract the Account Number or Referece Number.
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

// Define the Output Structure for Maintenance

const MaintenanceAnalysisSchema = z.object({
    category: z.enum(["Plumbing", "Electrical", "HVAC", "Appliance", "Pest Control", "Other"]),
    priority: z.enum(["Low", "Medium", "High", "Emergency"]),
    landlord_summary: z.string(),
    tenant_auto_reply: z.string()
});

export const analyzeMaintenanceRequest = async (tenantMessage: string) => {
    try {
        console.log("🤖 Asking AI to triage maintenance request...");
        
        const response = await openai.chat.completions.create({
            model: 'llava', 
            temperature: 0.2, // Slightly higher so it can write a friendly auto-reply
            messages: [
                {
                    role: "system",
                    content: `You are an expert Property Manager assistant. A tenant will give you a raw, often panicked maintenance request. 
                    
                    Your job is to:
                    1. Categorize the issue strictly.
                    2. Determine the priority. (Water leaks or electrical sparks are Emergency. A broken cabinet is Low).
                    3. Write a short, 1-sentence summary for the landlord.
                    4. Write a polite, calming 2-sentence auto-reply to the tenant with a basic safety/troubleshooting tip (e.g., "Turn off the water valve").`
                },
                {
                    role: "user",
                    content: `Tenant Request: "${tenantMessage}"` 
                }
            ],
            response_format: zodResponseFormat(MaintenanceAnalysisSchema, "maintenance_analysis"),
        });

        const content = response.choices[0].message.content;
        if (!content) return null;

        return JSON.parse(content);

    } catch (error) {
        console.error("Maintenance Triage Failed:", error);
        return null; 
    }
};