import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { Dialog, Drawer, ConfirmationDialog } from '../../src/components/ui/Dialog';
import { ImageLightbox } from '../../src/components/ui/ImageLightbox';
import { Button } from '../../src/components/ui/Button';
import { AddRoomDialog } from '../../src/components/landlord/AddRoomDialog';

/* Development-only fixture: imports real UI components, never calls an API or auth provider. */
export default function OverlayFixture() {
    const [roomOpen, setRoomOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [longOpen, setLongOpen] = useState(false);
    const [imageOpen, setImageOpen] = useState(false);
    const [saved, setSaved] = useState(0);
    const [confirmationError, setConfirmationError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [lastPayload, setLastPayload] = useState('None');
    const attempts = useRef(0);
    const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="640"><rect width="320" height="640" fill="#f8f9f5"/><text x="20" y="60" font-size="20">Fixture receipt</text><text x="20" y="600" font-size="20">Bottom stays visible</text></svg>');
    return (
        <main className="df-page space-y-6">
            <h1 className="df-page-title" tabIndex={-1} data-focus-fallback>Overlay and recovery verification</h1>
            <p className="max-w-prose text-muted">Isolated frontend fixture. All operations are simulated; no accounts, records, or backend requests are involved.</p>
            <div className="flex flex-wrap gap-3">
                <Button onClick={() => setRoomOpen(true)}>Add room fixture</Button>
                <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open drawer fixture</Button>
                <Button variant="secondary" onClick={() => setLongOpen(true)}>Open long dialog</Button>
                <Button variant="secondary" onClick={() => setImageOpen(true)}>Open receipt fixture</Button>
            </div>
            <p role="status">Rooms saved in fixture: {saved}. Last submitted payload: {lastPayload}.</p>
            <AddRoomDialog open={roomOpen} onClose={() => setRoomOpen(false)} onSave={async (roomNumber, capacity) => {
                attempts.current += 1;
                const attempt = attempts.current;
                setLastPayload(JSON.stringify({ roomNumber, capacity }));
                await new Promise(resolve => setTimeout(resolve, 1500));
                if (attempt === 1) return false;
                setSaved(count => count + 1);
                return true;
            }} />
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Room fixture">
                <p className="text-sm text-muted">Use Tab/Shift+Tab to verify containment. The nested confirmation should return focus here.</p>
                <Button variant="danger" onClick={() => { setConfirmationError(null); setConfirmationOpen(true); }}>Remove fixture tenant</Button>
                <Button variant="secondary" onClick={() => setImageOpen(true)}>View fixture receipt</Button>
            </Drawer>
            <ConfirmationDialog open={confirmationOpen} onClose={() => setConfirmationOpen(false)} title="Remove fixture tenant?" confirmLabel="Remove tenant" busy={busy} error={confirmationError} onConfirm={async () => {
                setBusy(true);
                await new Promise(resolve => setTimeout(resolve, 1500));
                setConfirmationError('Simulated failure. No records were deleted.');
                setBusy(false);
            }}>
                Room assignment, payment records, and maintenance requests would be deleted in the real workflow. This fixture performs no deletion.
            </ConfirmationDialog>
            <Dialog open={longOpen} onClose={() => setLongOpen(false)} title="Long content fixture">
                {Array.from({length: 24}, (_, index) => <p key={index}>Example paragraph {index + 1}: long content must scroll inside a bounded dialog at mobile and short-screen sizes.</p>)}
                <Button onClick={() => setLongOpen(false)}>Finish reading</Button>
            </Dialog>
            <ImageLightbox src={imageOpen ? image : null} onClose={() => setImageOpen(false)} />
        </main>
    );
}
createRoot(document.getElementById('root')!).render(<StrictMode><OverlayFixture /></StrictMode>);
