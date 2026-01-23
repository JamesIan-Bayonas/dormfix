import React, { useState } from 'react';
import { 
    X, User, CreditCard, Wrench, CheckCircle2, 
    AlertTriangle, FileX, Check, Eye, ArrowRight 
} from 'lucide-react';

// Define the shape of data this drawer expects (Extracted from your matrix logic)
export interface RoomDetailData {
    id: string;
    room_number: string;
    status: 'vacant' | 'occupied' | 'maintenance';
    currentOccupants: number;
    capacity: number;
    occupants: any[]; // Ideally strict typed from your types.ts
    occupantPaymentStatus: any[];
    activeIssues: any[];
    hasIssue: boolean;
    isCritical: boolean;
}

interface RoomDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    roomData: RoomDetailData | null;
    onVerifyPayment: (paymentId: string, status: 'Verified' | 'Rejected') => void;
    onResolveIssue: (issueId: string) => void;
}

// React.memo optimizes performance by preventing unnecessary re-renders
export const RoomDetailDrawer: React.FC<RoomDetailDrawerProps> = React.memo(({ 
    isOpen, onClose, roomData, onVerifyPayment, onResolveIssue 
}) => {
    const [reviewPaymentId, setReviewPaymentId] = useState<string | null>(null);

    if (!roomData) return null;

    // Helper to format dates safely
    const formatDate = (d: string) => { 
        try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } 
        catch { return d; }
    };

    return (
        <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
            
            {/* 1. The Backdrop (Click to close) - GPU Optimized opacity transition */}
            <div 
                className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
                onClick={onClose}
            />

            {/* 2. The Slide-Over Panel - GPU Optimized translate transition */}
            <div className={`absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white">
                    <div>
                        <h2 className="text-xl font-display font-bold text-gray-800">Room {roomData.room_number}</h2>
                        <p className={`text-xs font-bold uppercase tracking-wider ${roomData.status === 'vacant' ? 'text-gray-400' : 'text-emerald-600'}`}>
                            {roomData.status} • {roomData.currentOccupants}/{roomData.capacity} Occupied
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 h-[calc(100vh-4rem)]">
                    
                    {/* SECTION: OCCUPANTS & PAYMENTS */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User size={16}/> Occupants
                        </h3>
                        
                        {roomData.occupants.length > 0 ? (
                            <div className="space-y-3">
                                {roomData.occupantPaymentStatus.map((occ, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                                    {occ.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{occ.name}</p>
                                                    <p className="text-xs text-gray-500">Joined {formatDate(occ.joinedDate || new Date().toISOString())}</p>
                                                </div>
                                            </div>
                                            {/* Status Badge */}
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${occ.hasPendingPayment ? 'bg-violet-100 text-violet-700' : 'bg-gray-200 text-gray-500'}`}>
                                                {occ.status}
                                            </div>
                                        </div>

                                        {/* Payment Action Area */}
                                        {occ.hasPendingPayment ? (
                                            <div className="bg-white p-3 rounded-lg border border-violet-100 shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-violet-600 flex items-center gap-1">
                                                        <CreditCard size={12}/> Pending Payment
                                                    </span>
                                                    <span className="text-xs font-bold">₱{occ.paymentAmount}</span>
                                                </div>
                                                
                                                {reviewPaymentId === occ.paymentId ? (
                                                    // EXPANDED PAYMENT REVIEW (Inline)
                                                    <div className="mt-3 pt-3 border-t border-gray-100 animate-fade-in">
                                                        <div className="aspect-video bg-gray-100 rounded mb-3 overflow-hidden">
                                                             <img src={occ.paymentProof || "https://placehold.co/600x400"} alt="Proof" className="w-full h-full object-cover"/>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => onVerifyPayment(occ.paymentId, 'Rejected')} className="flex-1 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded hover:bg-red-100 border border-red-200">Reject</button>
                                                            <button onClick={() => onVerifyPayment(occ.paymentId, 'Verified')} className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700">Verify</button>
                                                        </div>
                                                        <button onClick={() => setReviewPaymentId(null)} className="w-full mt-2 text-[10px] text-gray-400 hover:text-gray-600">Cancel Review</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setReviewPaymentId(occ.paymentId)} className="w-full py-2 bg-violet-600 text-white text-xs font-bold rounded hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">
                                                        <Eye size={14}/> Review Receipt
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                           <div className="text-xs text-gray-400 text-center py-1">No pending payments</div> 
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 text-sm">Room is empty.</p>
                            </div>
                        )}
                    </div>

                    {/* SECTION: MAINTENANCE ISSUES */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Wrench size={16}/> Active Issues
                        </h3>
                        
                        {roomData.activeIssues.length > 0 ? (
                            <div className="space-y-3">
                                {roomData.activeIssues.map(issue => (
                                    <div key={issue.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${
                                        issue.urgency === 'High' || issue.urgency === 'Emergency' 
                                        ? 'bg-red-50 border-red-200' 
                                        : 'bg-amber-50 border-amber-200'
                                    }`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${
                                                    issue.urgency === 'High' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                                                }`}>
                                                    {issue.urgency}
                                                </span>
                                                <h4 className="text-sm font-bold text-gray-900">{issue.issueType}</h4>
                                            </div>
                                            <button onClick={() => onResolveIssue(issue.id)} className="p-2 bg-white rounded-lg shadow-sm hover:text-emerald-600 transition-colors" title="Mark Complete">
                                                <CheckCircle2 size={18}/>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-600 bg-white/50 p-2 rounded">{issue.description}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                                <CheckCircle2 size={16} />
                                <span className="text-sm font-bold">No active issues</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
});