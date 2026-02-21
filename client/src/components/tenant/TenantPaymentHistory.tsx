import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useAuth } from '../UserContext';
import { useMyPayments } from '../../hooks/useMyPayments';

interface Props {
    onBack: () => void;
}

// 1. Parses the AI string

const parseRemarks = (rawRemarks?: string) => {
    if (!rawRemarks) return { userRemarks: '', aiData: null };

    if (!rawRemarks.includes('[AI Verified:')) {
        return { userRemarks: rawRemarks, aiData: null };
    }

    const parts = rawRemarks.split('[AI Verified:');
    const userRemarks = parts[0].trim();
    const aiString = '[AI Verified:' + parts[1];

    const isVerified = aiString.includes('[AI Verified: YES]');
    const amountMatch = aiString.match(/\[Extracted Amount: (.*?)\]/);
    const refMatch = aiString.match(/\[Ref: (.*?)\]/);

    return {
        userRemarks,
        aiData: {
            isVerified,
            amount: amountMatch ? amountMatch[1] : 'N/A',
            ref: refMatch ? refMatch[1] : 'N/A'
        }
    };
};

export const TenantPaymentHistory: React.FC<Props> = ({ onBack }) => {
    const { user } = useAuth();
    const { payments, isLoading } = useMyPayments(user?.id);
    
    // Tracks which image to show in the modal
    const [viewImage, setViewImage] = useState<string | null>(null);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="text-indigo-600" size={20} /> Payment History
                </h3>
                <button onClick={onBack} className="text-sm text-indigo-600 hover:underline">
                    Close History
                </button>
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-slate-500">Loading your transactions...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Amount</th>
                    
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Remarks / AI Notes</th>
                                
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Proof</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                                        No payments found.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {new Date(payment.datePaid).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {payment.paymentType}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                                            ₱{payment.amount.toFixed(2)}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(() => {
                                                const { userRemarks, aiData } = parseRemarks(payment.remarks);

                                                return (
                                                    <div className="flex flex-col gap-2">
                                                        {userRemarks && (
                                                            <span className="text-sm text-slate-700 whitespace-normal max-w-xs">{userRemarks}</span>
                                                        )}
                                                        
                                                        {aiData && (
                                                            <div className="flex flex-col gap-1 mt-1 p-2 bg-slate-50 rounded border border-slate-200 w-max">
                                                                <div className="flex items-center gap-1.5">
                                                                    {aiData.isVerified ? (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                        AI Verified
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                                                        AI Flagged
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] text-slate-500">
                                                                    Scanned Amount: <span className="font-semibold">₱{aiData.amount}</span>
                                                                </div>
                                                                {aiData.ref !== 'null' && aiData.ref !== 'N/A' && (
                                                                    <div className="text-[11px] text-slate-500">
                                                                        Ref: <span className="font-mono">{aiData.ref}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {!userRemarks && !aiData && <span className="text-slate-400 text-xs italic">No remarks</span>}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {payment.status === 'Pending' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 gap-1">
                                                    <Clock size={12} /> Pending
                                                </span>
                                            )}
                                            {payment.status === 'Verified' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 gap-1">
                                                    <CheckCircle size={12} /> Verified
                                                </span>
                                            )}
                                            {payment.status === 'Rejected' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 gap-1">
                                                    <XCircle size={12} /> Rejected
                                                </span>
                                            )}
                                        </td>
                                        
                                        {/* View Proof Button */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button 
                                                onClick={() => setViewImage(`http://localhost:5000${payment.proofImage}`)}
                                                className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" 
                                                title="View Receipt"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* The Lightbox overlay */}
            {viewImage && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" 
                    onClick={() => setViewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img 
                            src={viewImage} 
                            alt="Payment Proof" 
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border-4 border-white" 
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