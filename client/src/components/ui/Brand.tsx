import { Home } from 'lucide-react';

export function Brand() {
    return <span className="inline-flex items-center gap-2.5 text-primary">
        <span className="df-brand-mark"><Home size={20} strokeWidth={1.75} aria-hidden="true" /></span>
        <span className="font-serif text-xl font-semibold tracking-tight">DormFix</span>
    </span>;
}
