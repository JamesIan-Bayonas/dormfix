export function paymentStatus(status: string | undefined) {
    switch (status) {
        case 'Pending': return { label: 'Awaiting landlord review', tone: 'info' as const, detail: 'The receipt is recorded. The landlord has not verified it yet.' };
        case 'Anomalous': return { label: 'Needs review', tone: 'warning' as const, detail: 'The receipt is recorded with scan warnings and needs landlord review.' };
        case 'Verified': return { label: 'Verified by landlord', tone: 'success' as const, detail: 'The landlord marked this receipt as verified.' };
        case 'Rejected': return { label: 'Rejected by landlord', tone: 'error' as const, detail: 'Review the reason below and contact your landlord if you need clarification.' };
        default: return { label: 'Status unavailable', tone: 'neutral' as const, detail: 'Refresh the history to check the current status. No approval can be inferred.' };
    }
}

export function isReviewable(status: string) { return status === 'Pending' || status === 'Anomalous'; }

/* Presentation-only adapter for current tagged remarks, legacy scan tags, and plain notes. */
export function parsePaymentRemarks(raw = '') {
    const tags = 'AI Audit|AI Extracted|Ref No|Warnings|AI Verified|Extracted Amount|Ref|Landlord Verification Verdict|Rejection Reason';
    const matcher = new RegExp(`\\[(${tags}):`, 'g');
    const matches = [...raw.matchAll(matcher)];
    const metadata: Record<string, string> = {};
    const noteMarker = /Tenant Remarks:\s*/.exec(raw);
    for (let index = 0; index < matches.length; index++) {
        const match = matches[index];
        if (noteMarker && match.index > noteMarker.index && match[1] !== 'Landlord Verification Verdict' && match[1] !== 'Rejection Reason') continue;
        const start = match.index + match[0].length;
        let end = matches[index + 1]?.index ?? raw.length;
        if (noteMarker && noteMarker.index > start && noteMarker.index < end) end = noteMarker.index;
        const chunk = raw.slice(start, end).trim();
        const close = chunk.lastIndexOf(']');
        if (close >= 0) metadata[match[1]] = chunk.slice(0, close).trim();
    }
    let notes = '';
    if (noteMarker) {
        const start = noteMarker.index + noteMarker[0].length;
        const verdictStart = matches.find(match => match.index >= start && (match[1] === 'Landlord Verification Verdict' || match[1] === 'Rejection Reason'))?.index ?? raw.length;
        notes = raw.slice(start, verdictStart).trim();
    } else notes = raw.slice(0, matches[0]?.index ?? raw.length).trim();
    if (notes === 'None' || notes === '""') notes = '';
    const warnings = metadata.Warnings && metadata.Warnings !== 'None' ? metadata.Warnings.split(/\s*\|\s*/).filter(Boolean) : [];
    const scan = metadata['AI Audit'] || (metadata['AI Verified'] === 'YES' ? 'Verified' : metadata['AI Verified'] ? 'Anomalous' : null);
    return { notes, scan, amount: metadata['AI Extracted'] || metadata['Extracted Amount'] || null,
        reference: metadata['Ref No'] || metadata.Ref || null, warnings,
        rejectionReason: metadata['Rejection Reason'] || null, verdict: metadata['Landlord Verification Verdict'] || null };
}

export function submissionResult(data: unknown) {
    const record = data && typeof data === 'object' ? data as Record<string, unknown> : {};
    return { scanStatus: typeof record.status === 'string' ? record.status : null,
        warnings: Array.isArray(record.warnings) ? record.warnings.filter((warning): warning is string => typeof warning === 'string') : [] };
}

export function verdictRemarks(remarks: string | undefined, status: 'Verified' | 'Rejected', reason?: string) {
    return `${remarks || ''}\n[Landlord Verification Verdict: ${status}]${reason ? `\n[Rejection Reason: ${reason}]` : ''}`;
}

export function receiptUrl(path: string | undefined, base: string) {
    return path ? `${base}${path}` : null;
}
