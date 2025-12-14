import React, { useState } from 'react';
import { Upload, DollarSign, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../UserContext'; // Assuming you have this context

interface PaymentFormProps {
    landlordId: string; // We pass this in because the tenant needs to know who to pay
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

    // 1. Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // 2. Handle Submission (The "Envelope" Logic)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user?.id || !landlordId || !selectedFile) {
            setMessage({ type: 'error', text: "Please fill in all fields and attach proof." });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            // --- CRITICAL STEP: Create FormData ---
            // We cannot use JSON.stringify here. We must use FormData.
            const formData = new FormData();
            formData.append('tenantId', user.id);
            formData.append('landlordId', landlordId);
            formData.append('amount', amount);
            formData.append('paymentType', paymentType);
            formData.append('datePaid', datePaid);
            formData.append('remarks', remarks);
            
            // Append the actual binary file
            // 'proofImage' must match the name used in multer: upload.single('proofImage')
            formData.append('proofImage', selectedFile);

            // --- Send to Backend ---
            const response = await fetch('http://localhost:5000/api/payments/submit', {
                method: 'POST',
                // NOTE: Do NOT set 'Content-Type': 'application/json'
                // The browser sets the correct multipart boundary automatically.
                body: formData, 
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: "Payment submitted successfully!" });
                // Reset form
                setAmount('');
                setRemarks('');
                setSelectedFile(null);
                if (onSuccess) onSuccess();
            } else {
                setMessage({ type: 'error', text: data.message || "Upload failed." });
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

            {message && (
                <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm font-medium ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                    {message.text}
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
                    {isSubmitting ? 'Uploading...' : 'Submit Payment'}
                </button>
            </form>
        </div>
    );
};