// server/src/services/notificationService.ts
import nodemailer from 'nodemailer';
import dns from 'dns';

// Force Node.js DNS lookups to prioritize IPv4 to resolve ENETUNREACH in container runtimes
dns.setDefaultResultOrder('ipv4first');

const hasEmailConfig = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = hasEmailConfig
    ? nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS on port 587 to prevent cloud container port 465 timeouts
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    })
    : null;

const hasSMSConfig = Boolean(process.env.SEMAPHORE_API_KEY || process.env.SMS_API_KEY);

export const notificationService = {
        sendLandlordAlert: async (landlordEmail: string, subject: string, message: string) => {
        if (!transporter || !landlordEmail) {
            console.log(`⚠️ SMTP Alert Skipped...`);
            return;
        }
        try {
            console.log(`📩 Sending Landlord Alert to ${landlordEmail}: ${subject}`);
            await transporter.sendMail({
                from: `"DormFix System" <${process.env.EMAIL_USER}>`,
                to: landlordEmail,  // <── Dynamically receives the queried landlord's email
                subject: `[DormFix Alert] ${subject}`,
                text: message,
            });
        } catch (error) {
            console.error("Notification Service: Email failed", error);
        }
    },

    sendTenantUpdate: async (tenantEmail: string, status: string, reason?: string) => {
        if (!transporter) {
            console.log(`⚠️ SMTP Tenant Update Skipped (Email credentials not configured in .env): [${status}] to ${tenantEmail}`);
            return;
        }
        try {
            const message = status === 'Verified' 
                ? "Your payment has been successfully cleared."
                : `Your payment was rejected. Reason: ${reason || 'Contact management.'}`;

            await transporter.sendMail({
                from: `"DormFix Management" <${process.env.EMAIL_USER}>`,
                to: tenantEmail,
                subject: `Payment Update: ${status}`,
                text: message,
            });
        } catch (error) {
            console.error("Notification Service: Tenant email failed", error);
        }
    },

    sendEmergencySMS: async (message: string, recipientNumber?: string): Promise<boolean> => {
        const apiKey = process.env.SEMAPHORE_API_KEY || process.env.SMS_API_KEY;
        const targetNumber = recipientNumber || process.env.LANDLORD_PHONE_NUMBER || process.env.EMERGENCY_SMS_RECIPIENT;
        const senderName = process.env.SEMAPHORE_SENDER_NAME || process.env.SMS_SENDER_NAME;

        if (!hasSMSConfig || !apiKey || !targetNumber) {
            console.log(`⚠️ SMS Gateway Skipped (API key or recipient phone number not configured in .env): "${message}"`);
            return false;
        }

        try {
            console.log(`📱 Dispatching Emergency SMS to ${targetNumber}...`);
            
            const response = await fetch('https://api.semaphore.co/api/v4/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apikey: apiKey,
                    number: targetNumber,
                    message: message,
                    ...(senderName ? { sendername: senderName } : {})
                }),
            });

            if (!response.ok) {
                const errorPayload = await response.text().catch(() => 'Unknown network error');
                console.error(`❌ SMS Gateway Error [HTTP ${response.status}]:`, errorPayload);
                return false;
            }

            console.log(`✅ Emergency SMS successfully dispatched to ${targetNumber}`);
            return true;
        } catch (error) {
            console.error("Notification Service: SMS network dispatch failed:", error);
            return false;
        }
    }
};