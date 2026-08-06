// client/src/components/landlord/LandlordPaymentHistory.tsx
import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, DollarSign, Calendar, MessageSquare, AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../UserContext';
import { usePayments } from '../../hooks/usePayments';

interface Props {
    onBack: () => void;
}

// Helper to format raw Zero-Trust AI audit messages into clean UI metrics
const parseAiRemarks = (rawRemarks?: string) => {
    if (!rawRemarks) return { tenantRemarks: 'None', aiAudit: null };

    const auditMatch = rawRemarks.match(/\[AI Audit:\s*(.*?)\]/);
    const extractedMatch = rawRemarks.match(/\[AI Extracted:\s*(.*?)\]/);
    const refMatch = rawRemarks.match(/\[Ref No:\s*(.*?)\]/);
    const warningsMatch = rawRemarks.match(/\[Warnings:\s*(.*?)\]/);
    const tenantPart = rawRemarks.split('Tenant Remarks:');

    return {
        tenantRemarks: tenantPart[1] ? tenantPart[1].trim() : 'None',
        aiAudit: auditMatch ? {
            status: auditMatch[1],
            extracted: extractedMatch ? extractedMatch[1] : 'N/A',
            refNo: refMatch ? refMatch[1] : 'N/A',
            warnings: warningsMatch && warningsMatch[1] !== 'None' ? warningsMatch[1] : null
        } : null
    };
};

export const LandlordPaymentHistory: React.FC<Props> = ({ onBack }) => {
    const { user } = useAuth();
    const { payments, isLoading, verifyPayment } = usePayments(user?.id);
    const [viewImage, setViewImage] = useState<string | null>(null);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400 text-sm font-medium">Loading ledger records...</div>;
    }

    return (
        <div className="min-h-screen bg-[#f8f9f5] p-4 sm:p-8 animate-fade-in text-slate-800">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* ELEGANT BACK NAVIGATION TRACK */}
                <button 
                    onClick={onBack} 
                    className="group flex items-center gap-2 text-xs font-bold text-[#5c6e4e] uppercase tracking-wider hover:text-[#425042] transition-colors outline-none"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
                </button>

                {/* PAGE TYPOGRAPHY HEADER */}
                <div className="border-b border-gray-200/60 pb-4">
                    <h1 className="text-4xl font-serif text-slate-800 mb-1">Payment Verification</h1>
                    <p className="text-slate-500 text-sm">Audit incoming transactional digital receipts and verify against matching ledgers.</p>
                </div>

                {/* CORE PAYMENTS PANEL QUEUE */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                            <DollarSign size={18} className="text-[#657655]" /> Transaction Audits
                        </h2>
                        <span className="text-xs text-slate-400 font-medium">{payments.length} Records Loaded</span>
                    </div>

                    {/* SOFT LEDGER CARDS REPLACING PRAGMATIC FIXED TABLES */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {payments.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-sm font-medium">No payment logs found.</div>
                        ) : (
                            payments.map(payment => {
                                const { tenantRemarks, aiAudit } = parseAiRemarks(payment.remarks);
                                const isPending = payment.status === 'Pending' || payment.status === 'Anomalous';

                                return (
                                    <div 
                                        key={payment.id} 
                                        className={`flex flex-col p-5 rounded-2xl border transition-all gap-4 bg-[#f8f9f5] border-gray-200/50 hover:bg-[#f4f7f4]
                                            ${payment.status === 'Anomalous' ? 'bg-[#fffbf2] border-amber-200/70' : ''}
                                        `}
                                    >
                                        {/* HEADER SUMMARY CONTAINER */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-200/40">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-white border border-gray-200 text-slate-600 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                                    {payment.tenantName ? payment.tenantName.charAt(0) : '?'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800 text-sm">{payment.tenantName}</div>
                                                    <div className="text-[11px] text-slate-400 font-medium">Unit {payment.roomNumber} • {payment.paymentType}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-sm font-serif font-bold text-slate-800">₱{payment.amount.toFixed(2)}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 justify-end mt-0.5">
                                                        <Calendar size={10} /> {new Date(payment.datePaid).toLocaleDateString()}
                                                    </div>
                                                </div>

                                                {/* TONE-MATCHED SECTOR SYSTEM STATUS TAGS */}
                                                <div className="min-w-[90px] text-right">
                                                    {payment.status === 'Pending' && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">Pending</span>
                                                    )}
                                                    {payment.status === 'Anomalous' && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60">Anomalous</span>
                                                    )}
                                                    {payment.status === 'Verified' && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e7efdb] text-[#5c6e4e] border border-[#d3e0c0]">Verified</span>
                                                    )}
                                                    {payment.status === 'Rejected' && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200/60">Rejected</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* REMARKS AND INTEGRATED ZERO-TRUST DECODED FEED */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                            {/* Tenant Input Context */}
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tenant Notes</span>
                                                <p className="text-slate-600 bg-white/60 p-3 rounded-xl border border-gray-100 italic">
                                                    "{tenantRemarks}"
                                                </p>
                                            </div>

                                            {/* AI Triage Decoded Parameters */}
                                            {aiAudit && (
                                                <div className="space-y-1.5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Zero-Trust AI Audit Matrix</span>
                                                    <div className="bg-white/80 p-3 rounded-xl border border-gray-200/60 space-y-1">
                                                        <div className="flex justify-between items-center text-[11px]">
                                                            <span className="text-slate-400 font-medium">Scanned Total:</span>
                                                            <span className="font-semibold text-slate-700">{aiAudit.extracted}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[11px]">
                                                            <span className="text-slate-400 font-medium">Reference Code:</span>
                                                            <span className="font-mono font-medium text-slate-600">{aiAudit.refNo}</span>
                                                        </div>
                                                        {aiAudit.warnings && (
                                                            <div className="text-[10px] font-medium text-red-600 bg-red-50/50 p-1.5 rounded-lg border border-red-100/40 mt-1 flex items-start gap-1">
                                                                <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                                                                <span>{aiAudit.warnings}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* ADMINISTRATIVE INTERACTIVE ACTIONS BAR */}
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-200/20">
                                            <button 
                                                onClick={() => setViewImage(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${payment.proofImage}`)}
                                                className="text-xs text-[#5c6e4e] font-semibold hover:text-[#425042] inline-flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors shadow-xs outline-none"
                                            >
                                                <Eye size={12} /> View Document
                                            </button>

                                            {isPending && (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => verifyPayment(payment.id, 'Rejected')} 
                                                        className="px-3 py-1.5 bg-white text-red-600 text-xs font-bold rounded-xl border border-red-100 hover:bg-red-50/40 transition-colors outline-none"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button 
                                                        onClick={() => verifyPayment(payment.id, 'Verified')} 
                                                        className="px-4 py-1.5 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold rounded-xl shadow-xs transition-colors outline-none"
                                                    >
                                                        Verify Clear
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* LIGHTBOX RECEIPTS IMAGES VIEWER PANEL */}
            {viewImage && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick={() => setViewImage(null)}>
                    <div className="relative max-w-2xl max-h-[85vh] animate-in zoom-in-95 duration-150">
                        <img 
                            src={viewImage} 
                            alt="Receipt Proof Log" 
                            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border-4 border-white object-contain" 
                        />
                         <button 
                            type="button"
                            className="absolute -top-10 right-0 text-white hover:text-gray-200 text-xs font-bold bg-[#425042] px-3 py-1.5 rounded-full shadow-md"
                            onClick={() => setViewImage(null)}
                        >
                            Close Overlay [X]
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};