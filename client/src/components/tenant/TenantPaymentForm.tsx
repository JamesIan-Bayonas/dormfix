// client/src/components/tenant/TenantPaymentForm.tsx
import React, { useState } from 'react';
import { Upload, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../UserContext';
import toast from 'react-hot-toast';

interface PaymentFormProps {
    landlordId: string; 
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

    // UI & Security State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'Idle' | 'Verified' | 'Anomalous' | 'Rejected'>('Idle');
    const [alertMessages, setAlertMessages] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setPaymentStatus('Idle');
            setAlertMessages([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user?.id || !landlordId || !selectedFile) {
            toast.error("Please fill in all fields and attach proof."); 
            return;
        }

        setIsSubmitting(true);
        setPaymentStatus('Idle'); 

        try {
            const formData = new FormData();
            formData.append('tenantId', user.id);
            formData.append('landlordId', landlordId);
            formData.append('amount', amount);
            formData.append('paymentType', paymentType);
            formData.append('datePaid', datePaid);
            formData.append('remarks', remarks);
            formData.append('proof', selectedFile);

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments`, {
                method: 'POST',
                body: formData, 
            });

            const data = await response.json();

            if (response.ok) {
                const finalStatus = data.status || 'Verified'; 
                const systemWarnings = data.warnings || [];
                
                setPaymentStatus(finalStatus);
                setAlertMessages(systemWarnings);

                if (finalStatus === 'Verified') {
                    toast.success("Payment submitted and verified by AI successfully!"); 
                    setAmount('');
                    setRemarks('');
                    setSelectedFile(null);
                    
                    setTimeout(() => {
                        if (onSuccess) onSuccess();
                    }, 2000);
                } 
            } else {
                toast.error(data.error || data.message || "Upload failed."); 
            }

        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Server error. Please try again."); 
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl max-w-lg mx-auto text-slate-800 animate-fade-in">
            <h2 className="text-xl font-serif text-slate-800 mb-6 flex items-center gap-2">
                <DollarSign className="text-[#5c6e4e]" size={22} /> Make a Payment
            </h2>

            {/* --- ZERO TRUST TELEMETRY REAL-TIME UI NOTIFICATIONS --- */}
            {paymentStatus === 'Verified' && (
                <div className="bg-[#e7efdb] border border-[#d3e0c0] p-4 rounded-xl mb-5 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[#3a4731] font-bold text-sm">
                        <CheckCircle size={16} /> Receipt Read Successfully!
                    </div>
                    <p className="text-xs text-[#5c6e4e] leading-relaxed">
                        Our AI engine has matched your documentation parameters successfully. It is now awaiting final confirmation from the property manager.
                    </p>
                </div>
            )}

            {paymentStatus === 'Anomalous' && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl mb-5">
                    <h4 className="text-red-700 font-bold text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> Audit Discrepancy Flagged
                    </h4>
                    <p className="text-xs text-red-600 mt-1 mb-2 leading-relaxed">
                        A valid image file was uploaded, but our Zero-Trust audit identified conflicts against current property parameters:
                    </p>
                    <ul className="list-disc ml-5 mb-2 space-y-0.5">
                        {alertMessages.map((msg, index) => (
                            <li key={index} className="text-red-700 text-xs font-semibold">{msg}</li>
                        ))}
                    </ul>
                    <p className="text-[10px] text-red-500 italic mt-2 leading-tight">
                        Your transaction data has been logged but queued for manual overview. If this was a mistake, please clear fields and re-attach the correct file.
                    </p>
                </div>
            )}

            {paymentStatus === 'Rejected' && (
                <div className="bg-[#f8f9f5] border border-gray-200 p-4 rounded-xl mb-5">
                    <h4 className="text-slate-800 font-bold text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> Transaction Denied
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{alertMessages[0] || "Security system exception. The uploaded document cannot be verified."}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Amount & Date Grid Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Amount</label>
                        <div className="relative group">
                            <span className="absolute left-3.5 top-3.5 text-slate-400 text-xs font-medium">₱</span>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full pl-8 p-3 border border-gray-200 rounded-xl bg-[#f8f9f5] text-xs font-medium text-slate-700 focus:bg-white focus:ring-1 focus:ring-[#425042] outline-none transition-all shadow-xs"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Paid</label>
                        <input 
                            type="date" 
                            className="w-full p-3 border border-gray-200 rounded-xl bg-[#f8f9f5] text-xs font-medium text-slate-700 focus:bg-white focus:ring-1 focus:ring-[#425042] outline-none transition-all shadow-xs"
                            value={datePaid}
                            onChange={e => setDatePaid(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Payment Allocation Type */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Allocation</label>
                    <select 
                        className="w-full p-3 border border-gray-200 rounded-xl bg-[#f8f9f5] text-xs font-medium text-slate-700 focus:bg-white focus:ring-1 focus:ring-[#425042] outline-none transition-all bg-no-repeat shadow-xs"
                        value={paymentType}
                        onChange={e => setPaymentType(e.target.value)}
                    >
                        <option value="Rent">Monthly Rental Spot</option>
                        <option value="Water">Utility Balance: Water</option>
                        <option value="Electric">Utility Balance: Electric</option>
                        <option value="Maintenance">Maintenance Surcharge</option>
                        <option value="Deposit">Security Advance Deposit</option>
                    </select>
                </div>

                {/* Refactored Tactile Sage Dropzone */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Proof of Payment Document</label>
                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
                        selectedFile 
                            ? 'border-[#c2ceae] bg-[#f4f7f4]' 
                            : 'border-gray-200 bg-[#f8f9f5] hover:bg-[#f4f7f4] hover:border-slate-300'
                    }`}>
                        <input 
                            type="file" 
                            id="proof-upload" 
                            accept="image/*"
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        <label htmlFor="proof-upload" className="cursor-pointer block select-none">
                            {selectedFile ? (
                                <div className="flex flex-col items-center text-[#5c6e4e]">
                                    <FileText size={28} className="mb-2 text-[#657655]" />
                                    <span className="text-xs font-semibold truncate max-w-[220px]">{selectedFile.name}</span>
                                    <span className="text-[10px] opacity-60 font-medium mt-0.5">Click to swap attachment</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-slate-400">
                                    <Upload size={28} className="mb-2 text-slate-400 group-hover:text-slate-500" />
                                    <span className="text-xs font-medium text-slate-600">Attach digital transactional receipt</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5 font-medium">PNG, JPG formats verified via AI OCR</span>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Remarks Field */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Audit Remarks (Optional)</label>
                    <textarea 
                        className="w-full p-3 border border-gray-200 rounded-xl bg-[#f8f9f5] text-xs font-medium text-slate-700 focus:bg-white focus:ring-1 focus:ring-[#425042] outline-none transition-all shadow-xs min-h-[60px] leading-relaxed"
                        placeholder="e.g. GCash Transaction Reference Number..."
                        rows={2}
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                    />
                </div>

                {/* Submit Action Trigger Button */}
                <button 
                    type="submit" 
                    disabled={isSubmitting || !selectedFile || !amount}
                    className="w-full py-3.5 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-xs outline-none select-none cursor-pointer"
                >
                    {isSubmitting ? (
                        <>
                            <span className="animate-spin text-xs">⏳</span>
                            <span>🤖 Zero-Trust System is auditing receipt...</span>
                        </>
                    ) : (
                        'Submit Operational Payment'
                    )}
                </button>
            </form>
        </div>
    );
};