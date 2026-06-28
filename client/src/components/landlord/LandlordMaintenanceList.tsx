// client/src/components/landlord/LandlordMaintenanceList.tsx
import React from 'react';
import { 
    Clock, CheckCircle, AlertTriangle, 
    FileText, MapPin, MoreHorizontal, ArrowRight, Wrench 
} from 'lucide-react';
import { useAuth } from '../UserContext';
import { useMaintenance } from '../../hooks/useMaintenance';

export const LandlordMaintenanceList: React.FC = () => {
    const { user } = useAuth();
    
    // FETCH LIVE TELEMETRY LOGIC VIA SYSTEM HOOK
    const { requests, isLoading, changeStatus } = useMaintenance(user?.id, user?.role || 'landlord');

    // LOW-CONTRAST BALANCED PRIORITY TAG MAPPINGS
    const getUrgencyBadge = (urgency: string) => {
        if (urgency === 'Emergency') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200/60">
                    <AlertTriangle size={10} className="mr-1"/> Emergency
                </span>
            );
        }
        if (urgency === 'High') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200/60">
                    High
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-slate-500 border border-gray-200/60">
                {urgency}
            </span>
        );
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400 text-sm font-medium">Loading complaints structure...</div>;
    }

    const pendingCount = requests.filter(r => r.status === 'Pending').length;

    return (
        <div className="min-h-screen bg-[#f8f9f5] p-4 sm:p-8 animate-fade-in text-slate-800">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* PAGE TYPOGRAPHY HEADER */}
                <div className="border-b border-gray-200/60 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-serif text-slate-800 mb-1">Maintenance Triage</h1>
                        <p className="text-slate-500 text-sm">Review, authorize, and archive incoming tenant infrastructure tickets.</p>
                    </div>
                    <div className="shrink-0 self-start sm:self-auto">
                        <span className={`px-4 py-2 text-xs font-bold rounded-full uppercase tracking-wider border transition-all shadow-xs
                            ${pendingCount > 0 
                                ? 'bg-[#fdf2e3] text-[#b97a26] border-[#f5ead0]' 
                                : 'bg-[#e7efdb] text-[#5c6e4e] border-[#d3e0c0]'}`}
                        >
                            {pendingCount} Pending Actions
                        </span>
                    </div>
                </div>

                {/* CORE COMPLAINTS LEDGER WRAPPER */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                            <Wrench size={18} className="text-[#657655]" /> Ticket Queue
                        </h2>
                        <span className="text-xs text-slate-400 font-medium">{requests.length} Total Requests Logged</span>
                    </div>

                    {/* SOFT CARD VIEWS REPLACING RAW TABLE CONTAINER GRIDS */}
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {requests.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-sm font-medium">No maintenance requests found.</div>
                        ) : (
                            requests.map((request) => {
                                const isCritical = request.urgency === 'Emergency' || request.urgency === 'High';
                                const isPending = request.status === 'Pending';
                                
                                return (
                                    <div 
                                        key={request.id} 
                                        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border transition-all
                                            ${isCritical && isPending ? 'bg-[#fff7f7] border-[#fce8e8]' : 'bg-[#f8f9f5] border-gray-200/50 hover:bg-[#f4f7f4]'}
                                        `}
                                    >
                                        {/* PROFILE SECTION METRIC COLUMN */}
                                        <div className="flex items-center gap-4 min-w-[200px] max-w-xs">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs shrink-0 border
                                                ${isCritical && isPending ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white border-gray-200 text-slate-600'}`}
                                            >
                                                {request.tenantName ? request.tenantName.charAt(0) : '?'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800 text-sm truncate">{request.tenantName}</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                                                    <MapPin size={12} className="text-slate-400 shrink-0" /> Unit {request.roomNumber || "N/A"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* DETAIL LOG EXPOSURE SECTOR */}
                                        <div className="flex-1 md:px-4 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-slate-800 text-xs">{request.issueType}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">• {new Date(request.dateSubmitted).toLocaleDateString()}</span>
                                                {getUrgencyBadge(request.urgency)}
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 md:max-w-md">{request.description}</p>
                                        </div>

                                        {/* STATE BADGE INDICATOR COLUMN */}
                                        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-none border-gray-200/40">
                                            <div className="min-w-[100px]">
                                                {request.status === 'Pending' && (
                                                    <span className="inline-flex items-center text-amber-700 text-xs font-medium"><Clock size={12} className="mr-1"/> Open Ticket</span>
                                                )}
                                                {request.status === 'In Progress' && (
                                                    <span className="inline-flex items-center text-blue-600 text-xs font-medium"><MoreHorizontal size={12} className="mr-1"/> In Progress</span>
                                                )}
                                                {request.status === 'Completed' && (
                                                    <span className="inline-flex items-center text-[#5c6e4e] text-xs font-semibold"><CheckCircle size={12} className="mr-1"/> Resolved</span>
                                                )}
                                            </div>

                                            {/* CONTEXTUAL ADMINISTRATIVE QUICK ACTIONS */}
                                            <div className="min-w-[110px] text-right">
                                                {request.status === 'Pending' && (
                                                    <button 
                                                        onClick={() => changeStatus(request.id, 'In Progress')}
                                                        className="px-3 py-1.5 bg-white border border-gray-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-xs inline-flex items-center gap-1 outline-none"
                                                    >
                                                        Accept <ArrowRight size={12} className="text-slate-400" />
                                                    </button>
                                                )}
                                                {request.status === 'In Progress' && (
                                                    <button 
                                                        onClick={() => changeStatus(request.id, 'Completed')}
                                                        className="px-3 py-1.5 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold rounded-lg transition-colors shadow-xs inline-flex items-center gap-1 outline-none"
                                                    >
                                                        Resolve <CheckCircle size={12} />
                                                    </button>
                                                )}
                                                {request.status === 'Completed' && (
                                                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider select-none bg-gray-50 border border-gray-100 px-2 py-1 rounded">Archived</span>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};