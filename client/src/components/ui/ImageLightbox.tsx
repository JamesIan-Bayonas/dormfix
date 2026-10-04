import { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { ErrorMessage, LoadingState } from './Feedback';

interface Props { src: string | null; onClose: () => void; title?: string }

export function ReceiptPreview({ src, alt = 'Submitted payment receipt' }: { src: string; alt?: string }) {
    const [failed, setFailed] = useState(false);
    const [loading, setLoading] = useState(true);
    return failed ? (
        <ErrorMessage>The receipt image could not be loaded. <Button variant="quiet" onClick={() => { setLoading(true); setFailed(false); }}>Try again</Button></ErrorMessage>
    ) : (
        <div className="space-y-3">
            {loading && <LoadingState>Loading receipt image…</LoadingState>}
            <img src={src} alt={alt} className="max-h-[70dvh] w-full object-contain"
                onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />
        </div>
    );
}

export function ImageLightbox({ src, onClose, title = 'Payment receipt' }: Props) {
    return (
        <Dialog open={!!src} onClose={onClose} title={title} wide dismissOnBackdrop>
            {src && <ReceiptPreview key={src} src={src} />}
        </Dialog>
    );
}
