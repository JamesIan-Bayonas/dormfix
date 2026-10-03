import type { ReactNode } from 'react';
import { Circle, Info, CheckCircle2, Clock3, AlertCircle } from 'lucide-react';

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';
const icons = { neutral: Circle, info: Info, success: CheckCircle2, warning: Clock3, error: AlertCircle };
interface StatusBadgeProps { tone?: StatusTone; children: ReactNode; className?: string }
/* Supply a truthful label at the call site; never rewrite API status values here. */
export function StatusBadge({ tone = 'neutral', children, className = '' }: StatusBadgeProps) {
    const Icon = icons[tone];
    return (
        <span className={`df-status df-status--${tone} ${className}`}>
            <Icon size={14} aria-hidden="true" className="shrink-0" />{children}
        </span>
    );
}
