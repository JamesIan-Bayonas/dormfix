// LandlordPaymentHistory.tsx
import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, DollarSign, Calendar, MessageSquare, AlertTriangle } from 'lucide-react';
import { useAuth } from '../UserContext';
import { usePayments } from '../../hooks/usePayments';

interface Props {
    onBack: () => void;
}

export const LandlordPaymentHistory: React.FC<Props> = ({ onBack }) => {
    const { user } = useAuth();
    const { payments, isLoading, verifyPayment } = usePayments(user?.id);
    const [viewImage, setViewImage] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto"> {/* Increased width to fit Remarks column */}
                <button onClick={onBack} className="text-sm text-slate-500 hover:text-indigo-600 mb-4 font-medium">
                    ← Back to Dashboard
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <DollarSign className="text-emerald-600"/> Payment Verification
                        </h2>
                    </div>

                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading payments...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tenant</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
                                        {/* NEW COLUMN */}
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Remarks</th> 
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                                                No payment records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        payments.map(payment => (
                                            <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{payment.tenantName}</div>
                                                    <div className="text-xs text-slate-500">Room {payment.roomNumber}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                                    ₱{payment.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-900">{payment.paymentType}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Calendar size={10} /> {new Date(payment.datePaid).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                
                                                {/* REMARKS DATA */}
                                                <td className="px-6 py-4 max-w-xs">
                                                    {payment.remarks ? (
                                                        <div className="text-sm text-slate-600 flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                                                            <MessageSquare size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                                            <span className="italic">"{payment.remarks}"</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {payment.status === 'Pending' && (
                                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">Pending (AI Cleared)</span>
                                                    )}
                                                    {payment.status === 'Anomalous' && (
                                                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 w-max">
                                                            <AlertTriangle size={12} /> Anomalous
                                                        </span>
                                                    )}
                                                    {payment.status === 'Verified' && (
                                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Verified</span>
                                                    )}
                                                    {payment.status === 'Rejected' && (
                                                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">Rejected</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end">
                                                    <button 
                                                        onClick={() => setViewImage(`http://localhost:5000${payment.proofImage}`)}
                                                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="View Proof"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    
                                                    {/* The landlord should be able to verify/reject whether it's Pending OR Anomalous */}
                                                    {(payment.status === 'Pending' || payment.status === 'Anomalous') && (
                                                        <>
                                                            <button onClick={() => verifyPayment(payment.id, 'Verified')} className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors" title="Approve">
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button onClick={() => verifyPayment(payment.id, 'Rejected')} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Reject">
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* IMAGE PREVIEW MODAL */}
            {viewImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setViewImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img 
                            src={viewImage} 
                            alt="Proof" 
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border-4 border-white" 
                        />
                         <button 
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold"
                            onClick={() => setViewImage(null)}
                        >
                            Close [X]
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};