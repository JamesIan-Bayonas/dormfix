import React, { useState, useEffect } from 'react';
import { 
    Clock, CheckCircle, AlertTriangle, 
    FileText, MapPin, MoreHorizontal, ArrowRight 
} from 'lucide-react';
import { useAuth } from '../UserContext';
import type { MaintenanceRequest, MaintenanceStatus } from '../../types/types';

// We extend the type because our API returns extra details like "tenantName"
interface ExtendedRequest extends MaintenanceRequest {
    tenantName: string;
    roomNumber: string;
}

export const LandlordMaintenanceList: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<ExtendedRequest[]>([]); // Holds fetched requests via tenant complaints issues
    const [isLoading, setIsLoading] = useState(true);

    // 1. FETCH REAL DATA
    useEffect(() => {
        if (user?.id) {
            // passing ?role=landlord so the backend knows to run the JOIN query
            fetch(`http://localhost:5000/api/maintenance/${user.id}?role=landlord`)
                .then(res => res.json())
                .then(data => {
                    setRequests(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch maintenance requests", err);
                    setIsLoading(false);
                });
        }
    }, [user?.id]);

    // 2. UPDATE STATUS ACTION (Now Fully Connected)
    const updateStatus = async (id: string, newStatus: MaintenanceStatus) => {
        // 1. Optimistic Update (Instant feedback for user)
        setRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: newStatus } : req
        ));

        try {
            // 2. Network Request (Permanent Save)
            const response = await fetch(`http://localhost:5000/api/maintenance/status/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to save to database");
            }
            console.log("Saved to database successfully");

        } catch (error) {
            console.error("Save failed:", error);
            // Optional: Revert the change if the server fails (Undo the optimistic update)
            alert("Failed to save changes. Please check your connection.");
            // You could trigger a re-fetch here to reset the UI to the truth
        }
    };

    const getUrgencyBadge = (urgency: string) => {
        if (urgency === 'Emergency') return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center w-fit"><AlertTriangle size={12} className="mr-1"/> EMERGENCY</span>;
        if (urgency === 'High') return <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium w-fit">High</span>;
        return <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium w-fit">{urgency}</span>;
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'Pending': return <span className="text-yellow-600 font-medium text-sm flex items-center"><Clock size={14} className="mr-1"/> Pending</span>;
            case 'In Progress': return <span className="text-blue-600 font-medium text-sm flex items-center"><MoreHorizontal size={14} className="mr-1"/> In Progress</span>;
            case 'Completed': return <span className="text-green-600 font-medium text-sm flex items-center"><CheckCircle size={14} className="mr-1"/> Fixed</span>;
            default: return <span>{status}</span>;
        }
    };
                                                                                   {/*Loading Logic*/}
    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading complaints...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileText size={20} className="text-indigo-600"/> 
                        Incoming Complaints
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Manage and triage tenant maintenance reports.</p>
                </div>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                    {requests.filter(r => r.status === 'Pending').length} Pending Actions
                </span>                                                            {/*Pending Action Message*/}
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-white">
                        <tr>                                                       {/*Header Rows*/}
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Urgency</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant / Room</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Details</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Current Status</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                                    No maintenance requests found.
                                </td>
                            </tr>
                        ) : (
                            requests.map((request) => (
                                <tr key={request.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">   {/* Urgency*/}
                                        {getUrgencyBadge(request.urgency)}
                                        <div className="text-xs text-slate-400 mt-2">
                                            {new Date(request.dateSubmitted).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">   {/* Tenant Room Info */}
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {request.tenantName ? request.tenantName.charAt(0) : '?'}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-slate-900">{request.tenantName}</div>
                                                <div className="text-xs text-slate-500 flex items-center mt-0.5">
                                                    <MapPin size={10} className="mr-1"/> Room {request.roomNumber || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">                      {/* Issue Details */}
                                        <div className="text-sm font-bold text-slate-800">{request.issueType}</div>
                                        <div className="text-sm text-slate-600 mt-1 line-clamp-2">{request.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">    {/* Current Status */}
                                        {getStatusBadge(request.status)}
                                    </td>                                           
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                                    {/* Quick Actions */}
                                        {request.status === 'Pending' && (
                                            <button 
                                                onClick={() => updateStatus(request.id, 'In Progress')}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors text-xs font-semibold flex items-center gap-1 ml-auto"
                                            >
                                                Accept <ArrowRight size={12}/>
                                            </button>
                                        )}
                                        {request.status === 'In Progress' && (
                                            <button 
                                                onClick={() => updateStatus(request.id, 'Completed')}
                                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors text-xs font-semibold flex items-center gap-1 ml-auto"
                                            >
                                                Mark Done <CheckCircle size={12}/>
                                            </button>
                                        )}
                                        {request.status === 'Completed' && (
                                            <span className="text-slate-400 text-xs">Archived</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};