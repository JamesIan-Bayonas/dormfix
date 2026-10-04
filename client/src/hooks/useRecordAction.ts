import { useRef, useState } from 'react';

/* Duplicate prevention and feedback belong to the affected record, not the entire list. */
export function useRecordAction() {
    const active = useRef(new Set<string>());
    const [busy, setBusy] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    async function run(id: string, operation: () => Promise<boolean>, failure: string) {
        if (active.current.has(id)) return false;
        active.current.add(id);
        setBusy(current => ({ ...current, [id]: true }));
        setErrors(current => ({ ...current, [id]: undefined }));
        try {
            const saved = await operation();
            if (!saved) setErrors(current => ({ ...current, [id]: failure }));
            return saved;
        } catch (error) {
            setErrors(current => ({ ...current, [id]: error instanceof Error ? error.message : failure }));
            return false;
        } finally {
            active.current.delete(id);
            setBusy(current => ({ ...current, [id]: false }));
        }
    }
    return { busy, errors, run, clearError: (id: string) => setErrors(current => ({ ...current, [id]: undefined })) };
}
