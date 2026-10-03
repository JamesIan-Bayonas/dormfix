import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface ControlDescription {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
}
interface FormFieldProps {
    id?: string;
    label: string;
    optional?: boolean;
    hint?: ReactNode;
    error?: string;
    children: (description: ControlDescription) => ReactNode;
}
export function FormField({ id, label, optional, hint, error, children }: FormFieldProps) {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const hintId = hint ? `${controlId}-hint` : undefined;
    const errorId = error ? `${controlId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
    return (
        <div className="space-y-2">
            <label htmlFor={controlId} className="block text-sm font-semibold text-ink">
                {label}{optional && <span className="ml-2 font-normal text-muted">(optional)</span>}
            </label>
            {children({ id: controlId, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
            {hint && <p id={hintId} className="text-sm leading-relaxed text-muted">{hint}</p>}
            {error && <p id={errorId} role="alert" className="text-sm leading-relaxed text-error">{error}</p>}
        </div>
    );
}
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    leadingIcon?: ReactNode;
    trailingAction?: ReactNode;
}
export function Input({ leadingIcon, trailingAction, className = '', ...props }: InputProps) {
    return (
        <div className="relative">
            {leadingIcon && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{leadingIcon}</span>}
            <input {...props} className={`df-control ${leadingIcon ? 'pl-10' : ''} ${trailingAction ? 'pr-12' : ''} ${className}`} />
            {trailingAction && <span className="absolute inset-y-0 right-0 flex items-center">{trailingAction}</span>}
        </div>
    );
}
export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} className={`df-control ${className}`} />;
}
export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={`df-control min-h-28 resize-y ${className}`} />;
}
