import type { Room, Payment, LandlordMaintenanceRequest } from '../types/types';

export interface OverviewTenant {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string | null;
    roomNumber?: string;
    isApproved: boolean;
    createdAt?: string;
}

export function summarizeOverview(rooms: Room[], tenants: OverviewTenant[], payments: Payment[], requests: LandlordMaintenanceRequest[], now = new Date()) {
    const activeRequests = requests.filter(request => request.status === 'Pending' || request.status === 'In Progress');
    const verifiedThisMonth = payments.filter(payment => {
        const date = new Date(payment.datePaid);
        return payment.status === 'Verified' && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
    return {
        pendingApplicants: tenants.filter(tenant => !tenant.isApproved).length,
        unassignedTenants: tenants.filter(tenant => tenant.isApproved && (!tenant.roomNumber || tenant.roomNumber === 'Unassigned')).length,
        assignedTenants: tenants.filter(tenant => tenant.isApproved && tenant.roomNumber && tenant.roomNumber !== 'Unassigned').length,
        availablePlaces: rooms.reduce((sum, room) => sum + Math.max(0, room.capacity - room.currentOccupants), 0),
        occupiedPlaces: rooms.reduce((sum, room) => sum + room.currentOccupants, 0),
        totalCapacity: rooms.reduce((sum, room) => sum + room.capacity, 0),
        receiptsToReview: payments.filter(payment => payment.status === 'Pending' || payment.status === 'Anomalous').length,
        activeRequests: activeRequests.length,
        urgentRequests: activeRequests.filter(request => request.urgency === 'High' || request.urgency === 'Emergency').length,
        verifiedAmount: verifiedThisMonth.reduce((sum, payment) => sum + Number(payment.amount), 0),
    };
}

export function filterOverviewRooms<T extends { room_number: string; occupants: { name: string }[] }>(rooms: T[], query: string): T[] {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return rooms;
    return rooms.filter(room => room.room_number.toLocaleLowerCase().includes(normalized) || room.occupants.some(tenant => tenant.name.toLocaleLowerCase().includes(normalized)));
}

export function overviewActivity(tenants: OverviewTenant[], payments: Payment[], requests: LandlordMaintenanceRequest[]) {
    const entries = [
        ...payments.map(payment => ({ id: `payment-${payment.id}`, title: `Payment proof: ${payment.tenantName || 'Tenant'}`, status: payment.status, date: payment.datePaid, path: '/payments' })),
        ...requests.map(request => ({ id: `request-${request.id}`, title: `${request.issueType} · Room ${request.roomNumber}`, status: request.status, date: request.dateSubmitted, path: '/maintenance' })),
        ...tenants.map(tenant => ({ id: `tenant-${tenant.id}`, title: `Application: ${tenant.name}`, status: tenant.isApproved ? 'Approved' : 'Pending approval', date: tenant.createdAt || '', path: '/tenants' })),
    ];
    return entries.filter(entry => entry.date && Number.isFinite(new Date(entry.date).getTime()))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
}
