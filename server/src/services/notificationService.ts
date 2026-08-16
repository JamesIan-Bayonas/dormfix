import nodemailer from 'nodemailer';

const hasEmailConfig = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = hasEmailConfig
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })
    : null;

export const notificationService = {
    sendLandlordAlert: async (subject: string, message: string) => {
        if (!transporter || !process.env.LANDLORD_EMAIL) {
            console.log(`⚠️ SMTP Alert Skipped (Email credentials not configured in .env): [${subject}]`);
            return;
        }
        try {
            console.log(`📩 Sending Landlord Alert: ${subject}`);
            await transporter.sendMail({
                from: `"DormFix System" <${process.env.EMAIL_USER}>`,
                to: process.env.LANDLORD_EMAIL, 
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

    sendEmergencySMS: async (message: string) => {
        console.log(`📱 SMS TRIGGERED: ${message}`);
    }
};