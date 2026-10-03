import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton, Button } from './Button';
import { ErrorMessage } from './Feedback';

interface DialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    busy?: boolean;
    drawer?: boolean;
    wide?: boolean;
    dismissOnBackdrop?: boolean;
}

export function Dialog({ open, onClose, title, description, children, busy = false,
    drawer = false, wide = false, dismissOnBackdrop = false }: DialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!open || !dialog) return;
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (!dialog.open) dialog.showModal();
        dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
        return () => {
            dialog.close();
            if (previousFocus?.isConnected) previousFocus.focus();
            else document.querySelector<HTMLElement>('[data-focus-fallback]')?.focus();
        };
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (open && dialog?.open && (document.activeElement === document.body || document.activeElement === dialog)) {
            if (busy) { dialog.focus(); return; }
            const recoveryTarget = dialog.querySelector<HTMLElement>('[role="alert"]') ?? dialog.querySelector<HTMLElement>('button:not(:disabled)');
            recoveryTarget?.focus();
        }
    }, [open, busy]);

    return (
        <dialog ref={dialogRef} tabIndex={-1} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
            aria-modal="true" aria-busy={busy || undefined} className={`df-dialog ${drawer ? 'df-dialog--drawer' : ''} ${wide ? 'df-dialog--wide' : ''}`}
            onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
            onKeyDown={(event) => {
                if (event.key !== 'Tab') return;
                const dialog = event.currentTarget;
                const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex]'))
                    .filter(control => control.tabIndex >= 0 && !control.matches(':disabled') && control.getClientRects().length > 0);
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (!first || !last) { event.preventDefault(); dialog.focus(); }
                else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
            }}
            onClick={(event) => {
                if (!dismissOnBackdrop || busy || event.target !== event.currentTarget) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
            }}>
            <header className="flex items-start justify-between gap-3 border-b border-divider p-4 sm:p-6">
                <div className="min-w-0 space-y-2">
                    <h2 id={titleId} className="df-section-title">{title}</h2>
                    {description && <p id={descriptionId} className="text-sm leading-relaxed text-muted">{description}</p>}
                </div>
                <IconButton label={`Close ${title}`} onClick={onClose} disabled={busy}><X size={20} /></IconButton>
            </header>
            <div className="df-dialog-content space-y-4 p-4 sm:p-6">{open && children}</div>
        </dialog>
    );
}

export function Drawer(props: Omit<DialogProps, 'drawer'>) {
    return <Dialog {...props} drawer dismissOnBackdrop />;
}

interface ConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: ReactNode;
    confirmLabel: string;
    busy?: boolean;
    error?: string | null;
    destructive?: boolean;
}

export function ConfirmationDialog({ open, onClose, onConfirm, title, children, confirmLabel,
    busy = false, error, destructive = true }: ConfirmationDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} title={title} busy={busy}>
            <div className="text-sm leading-relaxed text-muted">{children}</div>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={onClose} disabled={busy} data-autofocus>Cancel</Button>
                <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={busy} loadingText="Saving…">{confirmLabel}</Button>
            </div>
        </Dialog>
    );
}
