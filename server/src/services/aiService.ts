// server/src/services/aiService.ts
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface PaymentAnalysisResult {
    is_valid_receipt: boolean;
    extracted_amount: number | null;
    extracted_date: string | null;
    reference_number: string | null;
    confidence_score: number;
    analysis_notes: string;
}

export interface MaintenanceTriageResult {
    category: 'Plumbing' | 'Electrical' | 'HVAC' | 'Appliance' | 'Pest Control' | 'Other';
    priority: 'Low' | 'Medium' | 'High' | 'Emergency';
    landlord_summary: string;
    tenant_auto_reply: string;
}

export class AIServiceError extends Error {
    public readonly stage: 'CONFIG' | 'INGESTION' | 'OCR' | 'LLM_PARSING';

    constructor(message: string, stage: 'CONFIG' | 'INGESTION' | 'OCR' | 'LLM_PARSING', public readonly originalError?: unknown) {
        super(message);
        this.name = 'AIServiceError';
        this.stage = stage;
    }
}

const getClient = (): GoogleGenerativeAI => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new AIServiceError('GEMINI_API_KEY is not configured in production environment variables.', 'CONFIG');
    }
    return new GoogleGenerativeAI(apiKey);
};

const resolveGenerativePart = (input: string | Buffer, explicitMimeType?: string) => {
    if (Buffer.isBuffer(input)) {
        return {
            inlineData: {
                data: input.toString('base64'),
                mimeType: explicitMimeType || 'image/jpeg',
            },
        };
    }

    const resolvedPath = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);

    if (!fs.existsSync(resolvedPath)) {
        throw new AIServiceError(`Image file not found on disk at resolved path: ${resolvedPath}`, 'INGESTION');
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const mimeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
    };
    const mimeType = explicitMimeType || mimeMap[ext] || 'image/jpeg';

    return {
        inlineData: {
            data: fs.readFileSync(resolvedPath).toString('base64'),
            mimeType,
        },
    };
};

export const analyzePaymentImage = async (
    input: string | Buffer,
    mimeType?: string
): Promise<PaymentAnalysisResult | null> => {
    try {
        const genAI = getClient();
        const imagePart = resolveGenerativePart(input, mimeType);

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: 'application/json',
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
                    required: ['is_valid_receipt', 'confidence_score', 'analysis_notes']
                },
                temperature: 0.0
            }
        });

        const prompt = `You are an expert Zero-Trust financial transaction auditor specializing in Philippine e-wallets (GCash, Maya, ShopeePay), bank transfers (InstaPay, PESONet), and utility receipts.
            Analyze this image and execute the following extraction rules strictly:
            1. is_valid_receipt: Set true if this is a genuine payment confirmation or receipt slip. Set false if it is unrelated or corrupted.
            2. extracted_amount: Extract the exact total numeric value paid. Remove currency signs (₱, PHP, $) and comma separators (e.g., '₱2,000.00' -> 2000, '1,500' -> 1500).
            3. extracted_date: Normalize the payment execution date to 'YYYY-MM-DD'. If time is present without a full year, assume the current calendar year.
            4. reference_number: Extract the complete transaction/reference/control number. Remove all internal whitespace (e.g., 'Ref No. 8011 9196 6111 2' -> '8011919661112').
            5. confidence_score: Floating point from 0.0 to 1.0 indicating visual legibility.
            6. analysis_notes: Brief description of the detected issuer (e.g., 'GCash Express Send confirmation') and any observed anomalies.

            If any field is missing or unreadable, return null for that field. Never fabricate values.`;

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        if (!responseText) {
            return null;
        }

        return JSON.parse(responseText) as PaymentAnalysisResult;

    } catch (error: any) {
        if (error instanceof AIServiceError) {
            console.error(`❌ [AI Service Error | Stage: ${error.stage}]: ${error.message}`);
        } else {
            console.error('❌ [AI Service Vision Pipeline Exception]:', error?.message || error);
        }
        return null;
    }
};

export const analyzeMaintenanceRequest = async (
    description: string
): Promise<MaintenanceTriageResult | null> => {
    try {
        const genAI = getClient();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        category: {
                            type: SchemaType.STRING,
                            format: 'enum',
                            enum: ['Plumbing', 'Electrical', 'HVAC', 'Appl  iance', 'Pest Control', 'Other']
                        },
                        priority: {
                            type: SchemaType.STRING,
                            format: 'enum',
                            enum: ['Low', 'Medium', 'High', 'Emergency']
                        },
                        landlord_summary: { type: SchemaType.STRING },
                        tenant_auto_reply: { type: SchemaType.STRING }
                    },
                    required: ['category', 'priority', 'landlord_summary', 'tenant_auto_reply']
                },
                temperature: 0.1
            }
        });

        const prompt = `Analyze this dormitory maintenance request issue description:
"${description}"

Strictly perform the following triage:
1. category: Classify under 'Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Pest Control', or 'Other'.
2. priority: Evaluate urgency as 'Low', 'Medium', 'High', or 'Emergency' (e.g., live sparking wires or active flooding must be marked Emergency).
3. landlord_summary: High-density actionable summary for property management dispatch.
4. tenant_auto_reply: Direct, reassuring first-step instruction acknowledging the ticket.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (!responseText) {
            return null;
        }

        return JSON.parse(responseText) as MaintenanceTriageResult;
    } catch (error: any) {
        console.error('❌ [AI Service Maintenance Pipeline Exception]:', error?.message || error);
        return null;
    }
};