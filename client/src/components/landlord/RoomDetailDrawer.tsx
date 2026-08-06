// client/src/components/landlord/RoomDetailDrawer.tsx
import React, { useState } from 'react';
import { 
    X, User, CreditCard, Wrench, CheckCircle2, 
    AlertTriangle, Eye
} from 'lucide-react';

export interface RoomDetailData {
    id: string;
    room_number: string;
    status: 'vacant' | 'occupied' | 'maintenance';
    currentOccupants: number;
    capacity: number;
    occupants: any[]; 
    occupantPaymentStatus: any[];
    activeIssues: any[];
    hasIssue: boolean;  
    isCritical: boolean;
}

interface RoomDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    roomData: RoomDetailData | null;
    onVerifyPayment: (paymentId: string, status: 'Verified' | 'Rejected', reason?: string) => void;
    onResolveIssue: (issueId: string) => void;
}

export const RoomDetailDrawer: React.FC<RoomDetailDrawerProps> = React.memo(({ 
    isOpen, onClose, roomData, onVerifyPayment, onResolveIssue 
}) => {
    const [reviewPaymentId, setReviewPaymentId] = useState<string | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [paymentToReject, setPaymentToReject] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string>('Screenshot is blurry / unreadable');
    const [customReason, setCustomReason] = useState('');

    if (!roomData) return null;

    const formatDate = (d: string) => { 
        try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } 
        catch { return d; }
    };

    const handleRejectClick = (paymentId: string) => {
        setPaymentToReject(paymentId);
        setIsRejectModalOpen(true);
        setRejectionReason('Screenshot is blurry / unreadable');
        setCustomReason('');
    };

    const confirmRejection = () => {
        if (paymentToReject) {
            const finalReason = rejectionReason === 'Other' ? customReason : rejectionReason;
            onVerifyPayment(paymentToReject, 'Rejected', finalReason);
            setIsRejectModalOpen(false);
            setPaymentToReject(null);
            setReviewPaymentId(null);
        }
    };

    return (
        <>
            {/* BACKGROUND CANVAS OVERLAY */}
            <div className={`fixed inset-0 z-40 overflow-hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
                <div 
                    className={`absolute inset-0 bg-black/10 backdrop-blur-[1px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
                    onClick={onClose}
                />
                
                {/* SLIDING PANEL CONTAINER */}
                <div className={`absolute inset-y-0 right-0 w-full max-w-md bg-[#f8f9f5] border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    
                    {/* PREMIUM DRAWER HEADER */}
                    <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200 bg-white">
                        <div>
                            <h2 className="text-xl font-serif text-slate-800">Room {roomData.room_number}</h2>
                            <p className="text-[11px] font-bold text-[#5c6e4e] uppercase tracking-wider mt-0.5">
                                {roomData.status} • {roomData.currentOccupants}/{roomData.capacity} Occupied
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* INTERFACE CONTENT AREA */}
                    <div className="overflow-y-auto p-6 space-y-8 h-[calc(100vh-5rem)] custom-scrollbar">
                        
                        {/* OCCUPANTS & PROPERTY LEDGER SECTION */}
                        <div>
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User size={14} className="text-slate-400" /> Occupants
                            </h3>
                            
                            {roomData.occupants.length > 0 ? (
                                <div className="space-y-3">
                                    {roomData.occupantPaymentStatus.map((occ, idx) => (
                                        <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-[#e7efdb] text-[#3a4731] flex items-center justify-center font-bold text-xs">
                                                        {occ.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{occ.name}</p>
                                                        <p className="text-[11px] text-slate-400 font-medium">Joined {formatDate(occ.joinedDate || new Date().toISOString())}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${occ.hasPendingPayment ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-slate-500'}`}>
                                                    {occ.status}
                                                </div>
                                            </div>

                                            {/* PAYMENT ACTION DRAWER LINK */}
                                            {occ.hasPendingPayment ? (
                                                <div className="mt-3 pt-3 border-t border-gray-100 bg-[#fef9eb] border border-[#f5ead0] p-3 rounded-xl">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[11px] font-bold text-[#8b7235] uppercase tracking-wider flex items-center gap-1">
                                                            <CreditCard size={12}/> Pending Payment
                                                        </span>
                                                        <span className="text-sm font-serif font-bold text-[#5c4b22]">₱{occ.paymentAmount}</span>
                                                    </div>
                                                    
                                                    {reviewPaymentId === occ.paymentId ? (
                                                        <div className="mt-3 pt-2 border-t border-gray-200/60">
                                                            <div className="aspect-video bg-gray-100 rounded-xl mb-3 overflow-hidden relative border border-gray-200">
                                                                <img 
                                                                    src={occ.paymentProof ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${occ.paymentProof}` : "https://placehold.co/600x400"}
                                                                    alt="Proof" 
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Receipt+Image+Not+Found"; }}
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => handleRejectClick(occ.paymentId)} 
                                                                    className="flex-1 py-2 bg-white text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 border border-red-200 transition-colors"
                                                                >
                                                                    Reject
                                                                </button>
                                                                <button 
                                                                    onClick={() => onVerifyPayment(occ.paymentId, 'Verified')} 
                                                                    className="flex-1 py-2 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold rounded-xl transition-colors"
                                                                >
                                                                    Verify
                                                                </button>
                                                            </div>
                                                            <button type="button" onClick={() => setReviewPaymentId(null)} className="w-full mt-2.5 text-[10px] text-gray-400 hover:text-gray-600 font-medium">Cancel Review</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setReviewPaymentId(occ.paymentId)} className="w-full mt-2 py-2 bg-white border border-gray-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                                            <Eye size={14}/> Review Receipt
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                               <div className="text-xs text-slate-400 text-center py-1 font-medium">No pending payments</div> 
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-sm font-medium">Room is vacant.</p>
                                </div>
                            )}
                        </div>

                        {/* MAINTENANCE ISSUES */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Wrench size={16}/> Active Issues
                            </h3>
                            
                            {roomData.activeIssues.length > 0 ? (
                                <div className="space-y-3">
                                    {roomData.activeIssues.map(issue => (
                                        <div key={issue.id} className={`p-5 rounded-2xl border flex flex-col gap-3 transition-colors ${
                                            issue.urgency === 'High' || issue.urgency === 'Emergency' 
                                                ? 'bg-[#fff7f7] border-[#fce8e8]' 
                                                : 'bg-[#faf8f4] border border-[#f0ebd9]'
                                        }`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase mb-1.5 ${
                                                        issue.urgency === 'High' || issue.urgency === 'Emergency' ? 'bg-red-100 text-red-700' : 'bg-[#fdf2e3] text-[#b97a26]'
                                                    }`}>
                                                        {issue.urgency}
                                                    </span>
                                                    <h4 className="text-sm font-medium text-slate-800">{issue.issueType}</h4>
                                                </div>
                                                <button onClick={() => onResolveIssue(issue.id)} className="p-2 bg-white border border-gray-200 rounded-xl shadow-xs hover:text-[#5c6e4e] hover:border-[#c2ceae] transition-colors">
                                                    <CheckCircle2 size={16}/>
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-600 bg-white/60 p-3 rounded-xl border border-gray-100/40 leading-relaxed">{issue.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-[#5c6e4e] bg-[#e7efdb] px-4 py-3 rounded-xl border border-[#d3e0c0]">
                                    <CheckCircle2 size={14} />
                                    <span className="text-xs font-semibold">No active units issues logged</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* REJECTION REASON MODAL BLOCK */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[1px]">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 border border-gray-100">
                        <div className="flex items-center gap-3 text-[#cc4747] mb-4">
                            <div className="p-2 bg-red-50 rounded-full">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-lg font-medium text-slate-800">Reject Payment Entry</h3>
                        </div>
                        
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Please select a reason for rejection. This audit will log directly to the tenant's transaction views.</p>

                        <div className="space-y-2 mb-6">
                            {[
                                "Screenshot is blurry / unreadable",
                                "Payment not received in account",
                                "Incorrect amount / reference",
                                "Other"
                            ].map((reason) => (
                                <label key={reason} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                                    <input 
                                        type="radio" 
                                        name="rejectionReason" 
                                        value={reason}
                                        checked={rejectionReason === reason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="checkbox checkbox-xs text-[#425042]"
                                    />
                                    <span className="text-xs font-medium text-slate-600">{reason}</span>
                                </label>
                            ))}

                            {rejectionReason === 'Other' && (
                                <textarea
                                    className="w-full mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-[#425042] outline-none min-h-[70px]"
                                    placeholder="State precise reason manually..."
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                />
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => setIsRejectModalOpen(false)}
                                className="flex-1 py-2 bg-gray-50 border border-gray-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={confirmRejection}
                                className="flex-1 py-2 bg-[#cc4747] hover:bg-[#b03a3a] text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});