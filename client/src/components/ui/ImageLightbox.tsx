import { useEffect, useState } from 'react';
import { isPrivateReceipt, sessionFetch } from '../../api/session';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { ErrorMessage, LoadingState } from './Feedback';

interface Props { src: string | null; onClose: () => void; title?: string }

export function ReceiptPreview({ src, alt = 'Submitted payment receipt' }: { src: string; alt?: string }) {
    const [failed, setFailed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [revision, setRevision] = useState(0);
    const [privateSource, setPrivateSource] = useState<string | null>(null);
    const protectedImage = isPrivateReceipt(src);
    useEffect(() => {
        if (!protectedImage) return;
        const controller = new AbortController();
        let objectUrl: string | null = null;
        sessionFetch(src, { signal: controller.signal }).then(async response => {
            if (!response.ok) throw new Error('Receipt unavailable');
            const blob = await response.blob();
            if (controller.signal.aborted) return;
            objectUrl = URL.createObjectURL(blob); setPrivateSource(objectUrl);
        }).catch(() => { if (!controller.signal.aborted) { setLoading(false); setFailed(true); } });
        return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [src, protectedImage, revision]);
    return failed ? (
        <ErrorMessage>The receipt image could not be loaded or you do not have access. <Button variant="quiet" onClick={() => { setLoading(true); setFailed(false); setPrivateSource(null); setRevision(value => value + 1); }}>Try again</Button></ErrorMessage>
    ) : (
        <div className="space-y-3">
            {loading && <LoadingState>Loading receipt image…</LoadingState>}
            {(!protectedImage || privateSource) && <img src={protectedImage ? privateSource! : src} alt={alt} className="max-h-[70dvh] w-full rounded-control bg-surface-muted p-2 object-contain"
                onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />}
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
