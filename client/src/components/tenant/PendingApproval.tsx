import { LogOut } from 'lucide-react';
import { useAuth } from '../UserContext';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Layout';
import { StatusBadge } from '../ui/StatusBadge';

export function PendingApproval() {
    const { logout, user } = useAuth();
    return (
        <main className="flex min-h-dvh items-center justify-center bg-canvas p-4 sm:p-6">
            <Panel className="w-full max-w-form space-y-6">
                <StatusBadge tone="warning">Awaiting landlord approval</StatusBadge>
                <div className="space-y-3">
                    <h1 className="df-page-title">Your request is pending</h1>
                    <p className="text-base leading-relaxed text-muted">
                        Hello <span className="font-semibold text-ink">{user?.name}</span>. Your landlord needs to approve your request before you can access your tenant workspace.
                    </p>
                </div>
                <div className="rounded-control border border-divider bg-canvas p-4">
                    <h2 className="text-sm font-semibold text-ink">What happens next?</h2>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
                        <li>Your landlord can review your request in their tenant list.</li>
                        <li>After approval, sign in again to access your workspace.</li>
                        <li>If the dorm code was incorrect, contact your landlord for help.</li>
                    </ul>
                </div>
                <Button onClick={logout} className="w-full"><LogOut size={18} aria-hidden="true" />Sign out and check later</Button>
            </Panel>
        </main>
    );
}
