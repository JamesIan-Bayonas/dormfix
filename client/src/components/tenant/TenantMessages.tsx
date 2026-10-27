import { useAuth } from '../UserContext';
import { Link } from 'react-router-dom';
import { Conversation } from '../messages/Conversation';
import { Button } from '../ui/Button';
import { PageHeader } from '../ui/Layout';
import { EmptyState, ErrorState, LoadingState } from '../ui/Feedback';
import type { HousingSummary } from './TenantHome';

interface Props { userId: string; housing: HousingSummary | null; loading: boolean; error: string | null; onRetry: () => void }
export function TenantMessages({ userId, housing, loading, error, onRetry }: Props) {
    const { globalSocket: socket } = useAuth();
    const landlordId = housing?.landlordId;
    return <div className="w-full min-w-0 space-y-6">
        <Link to="/" className="df-button df-button--quiet">Back to home</Link>
        <PageHeader title="Message landlord" description="Contact your landlord about your dormitory." />
        {loading ? <LoadingState>Loading landlord details…</LoadingState> : error ? <ErrorState title="Landlord details unavailable" description={error} action={<Button variant="secondary" onClick={onRetry}>Retry details</Button>} /> : !landlordId ?
            <EmptyState title="Landlord unavailable" description="Your housing record does not currently identify a landlord. Check your housing details before messaging." /> :
            <Conversation key={`${userId}:${landlordId}`} roomId={`${landlordId}-${userId}`} userId={userId} peerId={landlordId} role="tenant" name={housing?.landlordName || 'Landlord'} phone={housing?.landlordPhone} socket={socket} />}
    </div>;
}
