import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    loading?: boolean;
    loadingText?: string;
    children: ReactNode;
}

export function Button({ variant = 'primary', loading = false, loadingText, disabled,
    type = 'button', className = '', children, ...props }: ButtonProps) {
    return (
        <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
            className={`df-button df-button--${variant} ${className}`}>
            {loading && <LoaderCircle size={18} className="shrink-0 animate-spin" aria-hidden="true" />}
            {loading && loadingText ? loadingText : children}
        </button>
    );
}

interface IconButtonProps extends Omit<ButtonProps, 'children' | 'loadingText'> {
    label: string;
    children: ReactNode;
}
export function IconButton({ label, variant = 'quiet', className = '', children, ...props }: IconButtonProps) {
    return (
        <Button {...props} variant={variant} aria-label={label} className={`h-11 w-11 shrink-0 px-0 ${className}`}>
            <span aria-hidden="true">{children}</span>
        </Button>
    );
}
