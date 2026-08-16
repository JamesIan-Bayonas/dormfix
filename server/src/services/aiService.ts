import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import Tesseract from 'tesseract.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const analyzePaymentImage = async (filePath: string) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is not configured in .env");
            return null;
        }

        // STEP 1: Running OCR to extract raw text
        console.log("Step 1: Running OCR to extract raw text...");
        const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
        console.log("Extracted Text Preview:\n", text.substring(0, 200) + "...\n");

        // STEP 2: Asking Gemini to organize and audit structured parameters
        console.log("Step 2: Asking Gemini AI to structure and audit payment receipt...");

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        is_valid_receipt: { type: SchemaType.BOOLEAN },
                        extracted_amount: { type: SchemaType.NUMBER, nullable: true },
                        extracted_date: { type: SchemaType.STRING, nullable: true },
                        reference_number: { type: SchemaType.STRING, nullable: true },
                        confidence_score: { type: SchemaType.NUMBER },
                        analysis_notes: { type: SchemaType.STRING }
                    },
                    required: ["is_valid_receipt", "confidence_score", "analysis_notes"]
                },
                temperature: 0.0
            }
        });

        const prompt = `You are a strict data parsing algorithm. I will provide you with raw text scanned via OCR from a utility bill, bank receipt, or e-wallet screenshot (e.g. GCash, Maya).

RULES:
1. Extract the exact Amount. Look for "Total Amount Sent", "Total Amount Due", "Amount", or numbers near PHP/₱/$.
CRITICAL: Convert commas to pure numbers. If you see "10,000.00", return 10000.
2. Extract the Date in YYYY-MM-DD format if identifiable.
3. Extract the Reference Number or Account Number (e.g., "Ref No. 2012 202 833553" -> "2012202833553" or formatted string).
4. Do NOT invent data. If a field is missing, return null.

Here is the raw text from the document:
${text}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (!responseText) return null;
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Analysis Pipeline Failed:", error);
        return null; 
    }
};

export const analyzeMaintenanceRequest = async (tenantMessage: string) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is not configured in .env");
            return null;
        }

        console.log("🤖 Asking Gemini AI to triage maintenance request...");
        
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        category: { 
                            type: SchemaType.STRING, 
                            format: "enum",
                            enum: ["Plumbing", "Electrical", "HVAC", "Appliance", "Pest Control", "Other"] 
                        },
                        priority: { 
                            type: SchemaType.STRING, 
                            format: "enum",
                            enum: ["Low", "Medium", "High", "Emergency"] 
                        },
                        landlord_summary: { type: SchemaType.STRING },
                        tenant_auto_reply: { type: SchemaType.STRING }
                    },
                    required: ["category", "priority", "landlord_summary", "tenant_auto_reply"]
                },
                temperature: 0.2
            }
        });

        const prompt = `You are an expert Property Manager assistant. Triage this tenant maintenance request:
1. Categorize the issue strictly.
2. Determine priority (Water leaks or exposed electrical wires are Emergency. Minor cosmetics are Low).
3. Provide a concise 1-sentence landlord summary.
4. Provide a polite 2-sentence auto-reply with immediate safety advice for the tenant.

Tenant Request: "${tenantMessage}"`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (!responseText) return null;
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Maintenance Triage Failed:", error);
        return null; 
    }
};