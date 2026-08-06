import nodemailer from 'nodemailer';

// Configure the email transporter using environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const notificationService = {
    // 1. Alert Landlord about AI findings (Anomalies or Emergencies)
    sendLandlordAlert: async (subject: string, message: string) => {
        try {
            console.log(`📩 Sending Landlord Alert: ${subject}`);
            await transporter.sendMail({
                from: '"DormFix System" <`system@dormfix.com>',
                to: process.env.LANDLORD_EMAIL, 
                subject: `[DormFix Alert] ${subject}`,
                text: message,
            });
        } catch (error) {
            console.error("Notification Service: Email failed", error);
        }
    },

    // 2. Notify Tenant when status is updated (Verified/Rejected)
    sendTenantUpdate: async (tenantEmail: string, status: string, reason?: string) => {
        try {
            const message = status === 'Verified' 
                ? "Your payment has been successfully cleared."
                : `Your payment was rejected. Reason: ${reason || 'Contact management.'}`;

            await transporter.sendMail({
                from: '"DormFix Management" <support@dormfix.com>',
                to: tenantEmail,
                subject: `Payment Update: ${status}`,
                text: message,
            });
        } catch (error) {
            console.error("Notification Service: Tenant email failed", error);
        }
    },

    // 3. SMS Placeholder for Emergency Alerts
    sendEmergencySMS: async (message: string) => {
        console.log(`📱 SMS TRIGGERED: ${message}`);
        // Future: Integration with Semaphore API
    }
};  