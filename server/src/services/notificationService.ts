// server/src/services/notificationService.ts

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.EMAIL_USER || 'onboarding@resend.dev';
const hasSMSConfig = Boolean(process.env.SEMAPHORE_API_KEY || process.env.SMS_API_KEY);

// Helper for HTTPS REST-based email dispatch over standard Port 443 (Bypasses SMTP port blocking)
const sendEmailViaRest = async (to: string, subject: string, text: string): Promise<boolean> => {
    if (!RESEND_API_KEY) {
        console.log(`⚠️ Email Skipped: RESEND_API_KEY is not configured in .env. Target: ${to}`);
        return false;
    }

    try {
        console.log(`📩 Dispatching HTTPS Email to ${to}: ${subject}`);
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `DormFix System <${SENDER_EMAIL}>`,
                to: [to],
                subject: subject,
                text: text,
            }),
        });

        if (!response.ok) {
            const errorPayload = await response.text().catch(() => 'Unknown error');
            console.error(`❌ Email API Error [HTTP ${response.status}]:`, errorPayload);
            return false;
        }

        console.log(`✅ Email successfully delivered to ${to}`);
        return true;
    } catch (error) {
        console.error("Notification Service: HTTPS Email dispatch failed:", error);
        return false;
    }
};

export const notificationService = {
    sendLandlordAlert: async (landlordEmail: string, subject: string, message: string) => {
        if (!landlordEmail) {
            console.log(`⚠️ Landlord Alert Skipped: No recipient email provided.`);
            return;
        }
        await sendEmailViaRest(landlordEmail, `[DormFix Alert] ${subject}`, message);
    },

    sendTenantUpdate: async (tenantEmail: string, status: string, reason?: string) => {
        if (!tenantEmail) {
            console.log(`⚠️ Tenant Update Skipped: No recipient email provided.`);
            return;
        }
        const message = status === 'Verified'
            ? "Your payment has been successfully cleared."
            : `Your payment was rejected. Reason: ${reason || 'Contact management.'}`;

        await sendEmailViaRest(tenantEmail, `Payment Update: ${status}`, message);
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