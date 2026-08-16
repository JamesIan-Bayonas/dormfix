export const formatLastSeen = (lastSeenDate: string | Date | null | undefined, isOnline: boolean): string => {
    if (isOnline) {
        return 'Active now';
    }

    if (!lastSeenDate) {
        return 'Offline';
    }

    const now = new Date();
    const past = new Date(lastSeenDate);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) {
        return 'Active just now';
    }
    if (diffMin < 60) {
        return `Active ${diffMin}m ago`;
    }
    if (diffHours < 24) {
        return `Active ${diffHours}h ago`;
    }
    if (diffDays === 1) {
        return 'Active 1d ago';
    }
    if (diffDays < 7) {
        return `Active ${diffDays}d ago`;
    }
    return `Active ${past.toLocaleDateString()}`;
};