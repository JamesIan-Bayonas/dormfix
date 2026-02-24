import React, { useState } from 'react';
import { Upload, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../UserContext';

interface PaymentFormProps {
    landlordId: string; // Type this for tenant needs to know who to pay
    onSuccess?: () => void;
}

export const TenantPaymentForm: React.FC<PaymentFormProps> = ({ landlordId, onSuccess }) => {
    const { user } = useAuth();
    
    // Form State
    const [amount, setAmount] = useState('');
    const [paymentType, setPaymentType] = useState('Rent');
    const [datePaid, setDatePaid] = useState(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState(''); 
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    // --- 🛡️ NEW: ZERO TRUST SECURITY STATE ---
    const [paymentStatus, setPaymentStatus] = useState<'Idle' | 'Verified' | 'Anomalous' | 'Rejected'>('Idle');
    const [alertMessages, setAlertMessages] = useState<string[]>([]);

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            // Reset the security status when a new file is chosen
            setPaymentStatus('Idle');
            setAlertMessages([]);
            setMessage(null);
        }
    };

    // Handle Submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user?.id || !landlordId || !selectedFile) {
            setMessage({ type: 'error', text: "Please fill in all fields and attach proof." });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);
        setPaymentStatus('Idle'); // Reset before new scan

        try {
            const formData = new FormData();
            formData.append('tenantId', user.id);
            formData.append('landlordId', landlordId);
            formData.append('amount', amount);
            formData.append('paymentType', paymentType);
            formData.append('datePaid', datePaid);
            formData.append('remarks', remarks);
            formData.append('proof', selectedFile);

            const response = await fetch('http://localhost:5000/api/payments', {
                method: 'POST',
                body: formData, 
            });

            const data = await response.json();

            if (response.ok) {
                // --- 🛡️ NEW: INTERCEPTING THE AI AUDIT VERDICT ---
                // We extract the exact status and warnings sent by your paymentController
                const finalStatus = data.status || 'Verified'; // Fallback just in case
                const systemWarnings = data.warnings || [];
                
                setPaymentStatus(finalStatus);
                setAlertMessages(systemWarnings);

                // If it's a completely clean, perfect payment, we show the success message
                if (finalStatus === 'Verified') {
                    setMessage({ type: 'success', text: "Payment submitted and verified by AI successfully!" });
                    
                    // Reset form fields
                    setAmount('');
                    setRemarks('');
                    setSelectedFile(null);
                    
                    // Wait so the user can see the green success message before closing the modal
                    setTimeout(() => {
                        if (onSuccess) onSuccess();
                    }, 2000);
                } 
                // If it is anomalous, we DO NOT close the modal immediately. 
                // We leave it open so the tenant is forced to read the red warning boxes.

            } else {
                setMessage({ type: 'error', text: data.error || data.message || "Upload failed." });
            }

        } catch (error) {
            console.error("Payment error:", error);
            setMessage({ type: 'error', text: "Server error. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <DollarSign className="text-emerald-600" /> Make a Payment
            </h2>

            {/* General System Messages */}
            {message && paymentStatus === 'Idle' && (
                <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm font-medium ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                    {message.text}
                </div>
            )}

            {/* --- 🛡️ NEW: ZERO TRUST UI FEEDBACK --- */}
            {paymentStatus === 'Verified' && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg mb-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <CheckCircle size={18} /> Payment Verified!
                    </div>
                    <p className="text-sm text-emerald-600">
                        Our AI confirmed your receipt matches your declared amount. It is now pending final landlord clearance.
                    </p>
                </div>
            )}

            {paymentStatus === 'Anomalous' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
                    <h4 className="text-red-700 font-bold flex items-center gap-2">
                        <AlertCircle size={18} /> Action Required
                    </h4>
                    <p className="text-sm text-red-600 mt-1 mb-2">
                        Our system scanned a valid receipt, but found the following mismatches against our records:
                    </p>
                    <ul className="list-disc ml-5 mb-2">
                        {alertMessages.map((msg, index) => (
                            <li key={index} className="text-red-600 text-sm font-semibold">{msg}</li>
                        ))}
                    </ul>
                    <p className="text-xs text-red-500 italic mt-2">
                        Your payment has been logged but flagged for manual review by the landlord. If this was a mistake, please cancel and re-upload the correct receipt.
                    </p>
                </div>
            )}

            {paymentStatus === 'Rejected' && (
                <div className="bg-slate-100 border-l-4 border-slate-600 p-4 rounded-lg mb-4">
                    <h4 className="text-slate-800 font-bold flex items-center gap-2">
                        <AlertCircle size={18} /> Payment Rejected
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">{alertMessages[0] || "Fraud detection triggered. This receipt cannot be used."}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount & Date Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400">₱</span>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full pl-8 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                        <input 
                            type="date" 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={datePaid}
                            onChange={e => setDatePaid(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Payment Type */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment For</label>
                    <select 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        value={paymentType}
                        onChange={e => setPaymentType(e.target.value)}
                    >
                        <option value="Rent">Monthly Rent</option>
                        <option value="Water">Water Bill</option>
                        <option value="Electric">Electric Bill</option>
                        <option value="Maintenance">Maintenance Fee</option>
                        <option value="Deposit">Security Deposit</option>
                    </select>
                </div>

                {/* File Upload Area */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proof of Payment (Image)</label>
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        selectedFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 hover:bg-slate-50'
                    }`}>
                        <input 
                            type="file" 
                            id="proof-upload" 
                            accept="image/*"
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        <label htmlFor="proof-upload" className="cursor-pointer block">
                            {selectedFile ? (
                                <div className="flex flex-col items-center text-emerald-700">
                                    <FileText size={32} className="mb-2" />
                                    <span className="text-sm font-bold truncate max-w-xs">{selectedFile.name}</span>
                                    <span className="text-xs opacity-75">Click to change</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-slate-400">
                                    <Upload size={32} className="mb-2" />
                                    <span className="text-sm font-medium text-slate-600">Click to upload receipt</span>
                                    <span className="text-xs">JPG, PNG supported</span>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Remarks */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remarks (Optional)</label>
                    <textarea 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        placeholder="e.g. GCash Ref #123456789"
                        rows={2}
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                    />
                </div>

                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={isSubmitting || !selectedFile || !amount}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            🤖 AI is auditing receipt...
                        </>
                    ) : (
                        'Submit Payment'
                    )}
                </button>
            </form>
        </div>
    );
};