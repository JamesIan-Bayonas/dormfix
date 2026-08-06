// client/src/components/MaintenanceList.tsx
import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, MoreHorizontal, Wrench, Calendar, MapPin } from 'lucide-react';
import { useAuth } from './UserContext';

interface MaintenanceRequest {
    id: string;
    issueType: string;
    urgency: string;
    description: string;
    status: string;
    dateSubmitted: string;
    roomNumber?: string;
}

export const MaintenanceList: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            // FIX: Point the API string to the true backend target path
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/maintenance/${user.id}`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    setRequests(data);
                })
                .catch(err => console.error("Failed to load requests", err))
                .finally(() => setIsLoading(false));
        }
    }, [user?.id]);

    const getUrgencyBadge = (urgency: string) => {
        if (urgency === 'Emergency') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200/60 animate-pulse">
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
        return (
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
                <div className="skeleton h-6 w-48 bg-slate-200 rounded-lg"></div>
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-20 bg-slate-100 rounded-2xl border border-gray-200/40 skeleton"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                    <Wrench size={18} className="text-[#657655]" /> Ticket History
                </h2>
                <span className="text-xs text-slate-400 font-medium">{requests.length} Requests Filed</span>
            </div>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                {requests.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm font-medium">
                        No maintenance tickets logged under your profile.
                    </div>
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
                                <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-slate-800 text-xs">{request.issueType}</span>
                                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                            <Calendar size={10}/> {new Date(request.dateSubmitted).toLocaleDateString()}
                                        </span>
                                        {getUrgencyBadge(request.urgency)}
                                        {request.roomNumber && (
                                            <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded flex items-center gap-0.5 text-slate-500 font-medium">
                                                <MapPin size={10}/> Unit {request.roomNumber}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed md:max-w-xl">{request.description}</p>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-none border-gray-200/40 min-w-[140px]">
                                    <div className="text-left md:text-right w-full">
                                        {request.status === 'Pending' && (
                                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-xl border border-amber-200/50">
                                                <Clock size={12} className="mr-1"/> Awaiting Review
                                            </span>
                                        )}
                                        {request.status === 'In Progress' && (
                                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-xl border border-blue-200/50">
                                                <MoreHorizontal size={12} className="mr-1"/> Handyman Dispatched
                                            </span>
                                        )}
                                        {request.status === 'Completed' && (
                                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-[#5c6e4e] bg-[#e7efdb] rounded-xl border border-[#d3e0c0]">
                                                <CheckCircle size={12} className="mr-1"/> Ticket Resolved
                                            </span>
                                        )}
                                    </div>
                                </div>

                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};