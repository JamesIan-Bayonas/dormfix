// src/components/LandlordMaintenanceList.tsx
import React, { useState } from 'react';
import { 
    Clock, CheckCircle, AlertTriangle, 
    FileText, MapPin, MoreHorizontal, ArrowRight 
} from 'lucide-react';
import type { MaintenanceRequest, MaintenanceStatus } from '../types/types';

// MOCK DATA
const INITIAL_REQUESTS: (MaintenanceRequest & { tenantName: string, roomNumber: string })[] = [
    {
        id: 'MR-2025-005',
        tenantId: 'T102',
        tenantName: 'John Doe',
        roomNumber: '101-A',
        dateSubmitted: '2025-10-26',
        issueType: 'Plumbing',
        description: 'Major pipe burst in the common CR. Water is flooding.',
        urgency: 'Emergency',
        status: 'Pending',
    },
    {
        id: 'MR-2025-001',
        tenantId: 'T101',
        tenantName: 'Maria Santos',
        roomNumber: '304-B',
        dateSubmitted: '2025-10-24',
        issueType: 'Plumbing',
        description: 'The sink in the shared bathroom is leaking water continuously.',
        urgency: 'High',
        status: 'In Progress',
        adminRemarks: 'Plumber scheduled for tomorrow morning.',
    },
    {
        id: 'MR-2025-004',
        tenantId: 'T105',
        tenantName: 'Sarah Lee',
        roomNumber: '202-C',
        dateSubmitted: '2025-10-25',
        issueType: 'Electrical',
        description: 'Hallway light is flickering.',
        urgency: 'Low',
        status: 'Pending',
    },
];

// 🛑 THIS LINE IS THE FIX: Ensure 'export' is written before 'const'
export const LandlordMaintenanceList: React.FC = () => {
    const [requests, setRequests] = useState(INITIAL_REQUESTS);

    const updateStatus = (id: string, newStatus: MaintenanceStatus) => {
        setRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: newStatus } : req
        ));
        alert(`Request ${id} updated to ${newStatus}`);
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
                </span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Urgency</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant / Room</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Details</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Current Status</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {requests.map((request) => (
                            <tr key={request.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getUrgencyBadge(request.urgency)}
                                    <div className="text-xs text-slate-400 mt-2">{request.dateSubmitted}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                            {request.tenantName.charAt(0)}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-slate-900">{request.tenantName}</div>
                                            <div className="text-xs text-slate-500 flex items-center mt-0.5">
                                                <MapPin size={10} className="mr-1"/> Room {request.roomNumber}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-800">{request.issueType}</div>
                                    <div className="text-sm text-slate-600 mt-1 line-clamp-2">{request.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(request.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};