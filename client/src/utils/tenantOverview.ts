import type { MaintenanceRequest, Payment } from '../types/types';

function newestFirst<T>(records: T[], date: (record: T) => string) {
    const time = (record: T) => {
        const value = new Date(date(record)).getTime();
        return Number.isFinite(value) ? value : -Infinity;
    };
    return [...records].sort((a, b) => time(a) === time(b) ? 0 : time(a) > time(b) ? -1 : 1);
}

export function tenantOverview(payments: Payment[], requests: MaintenanceRequest[]) {
    const recentPayment = newestFirst(payments, payment => payment.datePaid)[0];
    const recordedTime = recentPayment ? new Date(recentPayment.datePaid).getTime() : NaN;
    const sameDateCount = Number.isFinite(recordedTime) ? payments.filter(payment => new Date(payment.datePaid).getTime() === recordedTime).length : 0;
    // Date-only payment records cannot establish submission order within a tied date.
    const attentionPayment = sameDateCount === 1 && recentPayment?.status === 'Rejected' ? recentPayment : null;
    const active = newestFirst(requests.filter(request => request.status === 'Pending' || request.status === 'In Progress'), request => request.dateSubmitted);
    return { recentPayment, sameDateCount, attentionPayment, active,
        pending: active.filter(request => request.status === 'Pending').length,
        inProgress: active.filter(request => request.status === 'In Progress').length };
}

export function overviewDate(value: string) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable';
}
