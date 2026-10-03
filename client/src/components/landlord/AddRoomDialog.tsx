import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { FormField, Input } from '../ui/FormField';
import { ErrorMessage } from '../ui/Feedback';

interface Props {
    open: boolean;
    onClose: () => void;
    onSave: (roomNumber: string, capacity: number) => Promise<boolean>;
    error?: string | null;
}

export function AddRoomDialog({ open, onClose, onSave, error }: Props) {
    const [roomNumber, setRoomNumber] = useState('');
    const [capacity, setCapacity] = useState('1');
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    const pending = useRef(false);

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        setFailed(false);
        try {
            const saved = await onSave(roomNumber, Number(capacity));
            if (saved) {
                setRoomNumber('');
                setCapacity('1');
                onClose();
            } else setFailed(true);
        } catch {
            setFailed(true);
        } finally {
            pending.current = false;
            setBusy(false);
        }
    }

    return (
        <Dialog open={open} onClose={onClose} title="Add room" busy={busy}>
            <form onSubmit={submit} className="space-y-6" aria-busy={busy}>
                <FormField id="new-room-number" label="Room name or number">
                    {(field) => <Input {...field} required data-autofocus value={roomNumber} disabled={busy}
                        placeholder="e.g. 108" onChange={(event) => setRoomNumber(event.target.value)} />}
                </FormField>
                <FormField id="new-room-capacity" label="Capacity" hint="Maximum number of tenants this room can accommodate.">
                    {(field) => <Input {...field} required type="number" min="1" disabled={busy} value={capacity}
                        onChange={(event) => setCapacity(event.target.value)} />}
                </FormField>
                {failed && <ErrorMessage>{error || 'The room could not be saved. Your entries are retained; try again.'}</ErrorMessage>}
                <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={busy} loadingText="Saving room…">Save room</Button>
                </div>
            </form>
        </Dialog>
    );
}
