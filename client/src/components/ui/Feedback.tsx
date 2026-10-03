import type { ReactNode } from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';

interface MessageProps { children: ReactNode; className?: string }
export function ErrorMessage({ children, className = '' }: MessageProps) {
    return (
        <div role="alert" tabIndex={-1} className={`flex items-start gap-2 rounded-control border border-error/30 bg-error-soft p-3 text-sm leading-relaxed text-error ${className}`}>
            <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0" /><div className="min-w-0">{children}</div>
        </div>
    );
}
export function LoadingState({ children, className = '' }: MessageProps) {
    return (
        <div role="status" className={`flex items-center justify-center gap-3 p-6 text-sm text-muted ${className}`}>
            <LoaderCircle size={20} aria-hidden="true" className="shrink-0 animate-spin" /><span>{children}</span>
        </div>
    );
}
interface StateProps { title: string; description: ReactNode; action?: ReactNode }
export function EmptyState({ title, description, action }: StateProps) {
    return (
        <div className="space-y-3 px-4 py-8 text-center">
            <h2 className="df-section-title">{title}</h2>
            <p className="mx-auto max-w-prose text-sm leading-relaxed text-muted">{description}</p>
            {action && <div className="pt-1">{action}</div>}
        </div>
    );
}
export function ErrorState({ title, description, action }: StateProps) {
    return (
        <div className="space-y-4 p-4 sm:p-6">
            <ErrorMessage><h2 className="font-semibold">{title}</h2><p className="mt-1">{description}</p></ErrorMessage>{action}
        </div>
    );
}
