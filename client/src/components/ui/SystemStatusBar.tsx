/**
 * SystemStatusBar — a slim banner rendered at the top of the Overview.
 * Shows "All clear" when there are no urgent items, or a summary of
 * outstanding actions when there are. Purely presentational — reads
 * pre-computed counts from props.
 */
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface SystemStatusBarProps {
    urgentMaintenance: number;
    pendingApplications: number;
    receiptsToReview: number;
}

export function SystemStatusBar({ urgentMaintenance, pendingApplications, receiptsToReview }: SystemStatusBarProps) {
    const total = urgentMaintenance + pendingApplications + receiptsToReview;

    if (total === 0) {
        return (
            <div className="df-status-bar df-status-bar--clear" role="status" aria-live="polite">
                <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
                <span className="font-medium">All systems clear</span>
                <span className="text-success/80">— No urgent items require your attention.</span>
            </div>
        );
    }

    const parts: string[] = [];
    if (urgentMaintenance > 0) parts.push(`${urgentMaintenance} urgent maintenance request${urgentMaintenance !== 1 ? 's' : ''}`);
    if (pendingApplications > 0) parts.push(`${pendingApplications} pending application${pendingApplications !== 1 ? 's' : ''}`);
    if (receiptsToReview > 0) parts.push(`${receiptsToReview} receipt${receiptsToReview !== 1 ? 's' : ''} to review`);

    return (
        <div className="df-status-bar df-status-bar--action" role="status" aria-live="polite">
            <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
            <span className="font-medium">Action required</span>
            <span className="text-warning/80">— {parts.join(', ')}.</span>
        </div>
    );
}
