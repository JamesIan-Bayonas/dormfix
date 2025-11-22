// src/components/MaintenanceList.tsx
import React from 'react';
import { Clock, CheckCircle, AlertTriangle, XCircle, FileText } from 'lucide-react';
import type { MaintenanceRequest, MaintenanceStatus } from '../types/types';

// Mock Data (Simulating database records)
const MOCK_REQUESTS: MaintenanceRequest[] = [
    {
        id: 'MR-2025-001',
        tenantId: 'T101',
        dateSubmitted: '2025-10-24',
        issueType: 'Plumbing',
        description: 'The sink in the shared bathroom is leaking water continuously.',
        urgency: 'High',
        status: 'In Progress',
        adminRemarks: 'Plumber scheduled for tomorrow morning.',
    },
    {
        id: 'MR-2025-002',
        tenantId: 'T101',
        dateSubmitted: '2025-10-20',
        issueType: 'Electrical',
        description: 'Study lamp outlet is not working.',
        urgency: 'Medium',
        status: 'Pending',
    },
    {
        id: 'MR-2025-003',
        tenantId: 'T101',
        dateSubmitted: '2025-09-15',
        issueType: 'Appliance',
        description: 'Air conditioner filter cleaning.',
        urgency: 'Low',
        status: 'Completed',
        adminRemarks: 'Cleaned by maintenance staff on Sep 16.',
    },
];

// Helper to get status badge color and icon
const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
        case 'Pending':
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1"/> Pending</span>;
        case 'In Progress':
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock size={12} className="mr-1"/> In Progress</span>;
        case 'Completed':
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1"/> Completed</span>;
        case 'Rejected':
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} className="mr-1"/> Rejected</span>;
        default:
            return null;
    }
};

export const MaintenanceList: React.FC = () => {
    // In a real app, you would filter MOCK_REQUESTS by the logged-in user's ID here.
    const myRequests = MOCK_REQUESTS; 

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FileText size={20} className="text-indigo-600"/> 
                    Recent Maintenance Requests
                </h3>
            </div>
            
            <div className="overflow-x-auto">
                {myRequests.length > 0 ? (
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Issue</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Admin Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {myRequests.map((request) => (
                                <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {request.dateSubmitted}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-900">{request.issueType}</div>
                                        <div className="text-sm text-slate-500 truncate max-w-xs">{request.description}</div>
                                        {request.urgency === 'High' || request.urgency === 'Emergency' ? (
                                            <span className="text-xs text-red-600 font-bold flex items-center mt-1">
                                                <AlertTriangle size={10} className="mr-1"/> High Urgency
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(request.status)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {request.adminRemarks || <span className="text-slate-400 italic">No remarks yet</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        No maintenance requests found. Good news!
                    </div>
                )}
            </div>
        </div>
    );
};