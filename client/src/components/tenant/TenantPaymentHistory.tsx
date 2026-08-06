// client/src/components/tenant/TenantPaymentHistory.tsx
import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert, AlertTriangle, FileText, Info, Eye, Clock } from 'lucide-react';
import { useAuth } from '../UserContext';
import { useMyPayments } from '../../hooks/useMyPayments';

interface Props {
    onBack: () => void;
}

// Robust Parser to extract raw data logs into a pristine UI dashboard object
const parseRemarks = (rawRemarks?: string) => {
    if (!rawRemarks) return { userRemarks: '', aiData: null };

    if (!rawRemarks.includes('[AI Audit:') && !rawRemarks.includes('[AI Verified:')) {
        return { userRemarks: rawRemarks, aiData: null };
    }

    const auditMatch = rawRemarks.match(/\[AI Audit:\s*(.*?)\]/);
    const extractedMatch = rawRemarks.match(/\[AI Extracted:\s*₱?(.*?)\]/);
    const refMatch = rawRemarks.match(/\[Ref No:\s*(.*?)\]/);
    const warningsMatch = rawRemarks.match(/\[Warnings:\s*(.*?)\]/);
    
    const fallbackVerified = rawRemarks.includes('[AI Verified: YES]');
    const fallbackAmount = rawRemarks.match(/\[Extracted Amount:\s*₱?(.*?)\]/);
    const fallbackRef = rawRemarks.match(/\[Ref:\s*(.*?)\]/);

    const parts = rawRemarks.split(/\[AI Audit:|\[AI Verified:/);
    const userRemarks = parts[0].trim().replace(/Tenant Remarks:\s*/g, '');

    const isAnomalousOrRejected = auditMatch 
        ? auditMatch[1] === 'Anomalous' || auditMatch[1] === 'Rejected'
        : !fallbackVerified && (fallbackAmount !== null);

    return {
        userRemarks: userRemarks === 'None' || userRemarks === '""' ? '' : userRemarks,
        aiData: {
            status: auditMatch ? auditMatch[1] : (fallbackVerified ? 'Verified' : 'Anomalous'),
            isAnomalous: isAnomalousOrRejected,
            amount: extractedMatch ? extractedMatch[1] : (fallbackAmount ? fallbackAmount[1] : 'N/A'),
            ref: refMatch ? refMatch[1] : (fallbackRef ? fallbackRef[1] : 'N/A'),
            warnings: warningsMatch && warningsMatch[1] !== 'None' ? warningsMatch[1] : null
        }
    };
};

export const TenantPaymentHistory: React.FC<Props> = ({ onBack }) => {
    const { user } = useAuth();
    const { payments, isLoading } = useMyPayments(user?.id);
    const [viewImage, setViewImage] = useState<string | null>(null);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400 text-sm font-medium">Loading digital ledger logs...</div>;
    }

    return (
        <div className="space-y-6 text-slate-800 font-sans">
            
            {/* ELEGANT BACK NAVIGATION TRACK */}
            <button 
                onClick={onBack} 
                className="group flex items-center gap-2 text-xs font-bold text-[#5c6e4e] uppercase tracking-wider hover:text-[#425042] transition-colors outline-none"
            >
                <ArrowLeft size={14} /> Close Transaction History
            </button>

            {/* PAGE TITLE COMPONENT */}
            <div>
                <h1 className="text-4xl font-serif text-slate-800 mb-1">My Payment History</h1>
                <p className="text-slate-500 text-sm">Review real-time verification logs and local Zero-Trust AI accounting audits.</p>
            </div>

            {/* THE SYSTEM LEDGER CONTROL WRAPPER */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-transparent">
                    <h3 className="font-semibold text-base text-slate-800 flex items-center gap-2">
                        <FileText className="text-[#657655]" size={16} /> Transaction Statements
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">{payments.length} Remittances Lodged</span>
                </div>

                {/* THE LEDGER TIMELINE STACK VIEW */}
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {payments.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-sm font-medium">
                            No rental statements or receipts have been recorded yet.
                        </div>
                    ) : (
                        payments.map((payment) => {
                            const { userRemarks, aiData } = parseRemarks(payment.remarks);
                            return (
                                <div key={payment.id} className="p-6 space-y-4 hover:bg-[#f4f7f4]/20 transition-colors">
                                    
                                    {/* CORE META DATA DATA LINE */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{payment.paymentType} Statement</div>
                                            <div className="text-sm font-semibold text-slate-700 flex items-center gap-2 mt-0.5">
                                                <span>Remitted on {new Date(payment.datePaid).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* RENDER PRECISE NUMBERS */}
                                            <div className="text-left sm:text-right">
                                                <div className="text-base font-serif font-bold text-slate-800">₱{payment.amount.toFixed(2)}</div>
                                            </div>
                                            
                                            {/* SYSTEM STATE INDICATION TAGS */}
                                            <div className="min-w-[90px] text-right">
                                                {payment.status === 'Pending' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                                                        Pending
                                                    </span>
                                                )}
                                                {payment.status === 'Verified' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e7efdb] text-[#5c6e4e] border border-[#d3e0c0]">
                                                        Verified
                                                    </span>
                                                )}
                                                {payment.status === 'Rejected' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200/60">
                                                        Rejected
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* COMPREHENSIVE INTELLIGENT TELEMETRY CARD PANEL */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#f8f9f5] p-4 rounded-xl border border-gray-200/50 text-xs">
                                        
                                        {/* Left Side: Tenant's Submission Notes */}
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                <Info size={10}/> Attached Memo
                                            </span>
                                            <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-gray-100 font-medium">
                                                {userRemarks ? `"${userRemarks}"` : <span className="text-slate-400 italic">No custom remarks attached</span>}
                                            </p>
                                        </div>

                                        {/* Right Side: Robust AI Optical Breakdown */}
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Zero-Trust Auditing Diagnostic</span>
                                            
                                            {aiData ? (
                                                <div className="bg-white p-2.5 rounded-lg border border-gray-200/60 space-y-1">
                                                    <div className="flex justify-between items-center text-[11px]">
                                                        <span className="text-slate-400">Scanned Receipt Value:</span>
                                                        <span className={`font-semibold ${aiData.isAnomalous ? 'text-amber-700' : 'text-[#5c6e4e]'}`}>
                                                            ₱{Number(aiData.amount) ? Number(aiData.amount).toLocaleString(undefined, {minimumFractionDigits: 2}) : aiData.amount}
                                                        </span>
                                                    </div>
                                                    
                                                    {aiData.ref && aiData.ref !== 'null' && aiData.ref !== 'N/A' && (
                                                        <div className="flex justify-between items-center text-[11px]">
                                                            <span className="text-slate-400">Network Reference:</span>
                                                            <span className="font-mono text-slate-600 font-medium">{aiData.ref}</span>
                                                        </div>
                                                    )}

                                                    {/* Robust Discrepancy Highlight Mechanism */}
                                                    {aiData.warnings && (
                                                        <div className="text-[10px] font-medium text-red-700 bg-red-50 p-2 rounded-lg border border-red-100/60 mt-1 flex items-start gap-1">
                                                            <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                                                            <span className="leading-tight">{aiData.warnings}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-white p-2.5 rounded-lg border border-dashed border-gray-200 text-center py-4 text-slate-400 text-[11px] font-medium">
                                                    Standard submission logged. Awaiting AI background text scanning.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* INTERACTIVE ACTIONS SECTOR FOOTER */}
                                    <div className="flex justify-between items-center">
                                        <button 
                                            onClick={() => setViewImage(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${payment.proofImage}`)}
                                            className="text-xs text-[#5c6e4e] font-semibold hover:text-[#425042] inline-flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-xs outline-none"
                                        >
                                            <Eye size={12} /> Inspect Uploaded Proof
                                        </button>

                                        {payment.status === 'Rejected' && (
                                            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-100 flex items-center gap-1">
                                                <AlertTriangle size={10}/> Action Required: Please re-upload verified statement
                                            </span>
                                        )}
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* LIGHTBOX POPUP CONTAINER */}
            {viewImage && (
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" 
                    onClick={() => setViewImage(null)}
                >
                    <div className="relative max-w-2xl max-h-[85vh] animate-in zoom-in-95 duration-150">
                        <img 
                            src={viewImage} 
                            alt="Payment Proof Statement Document" 
                            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border-4 border-white object-contain" 
                        />
                        <button 
                            type="button"
                            className="absolute -top-10 right-0 text-white hover:text-gray-200 text-xs font-bold bg-[#425042] px-3 py-1.5 rounded-full shadow-md"
                            onClick={() => setViewImage(null)}
                        >
                            Close View [X]
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};