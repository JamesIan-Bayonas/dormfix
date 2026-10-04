import type { Payment } from '../../types/types';
import { parsePaymentRemarks } from '../../utils/paymentPresentation';
import { StatusBadge } from '../ui/StatusBadge';

export function PaymentDetails({ payment }: { payment: Payment }) {
    const detail = parsePaymentRemarks(payment.remarks);
    const rejection = payment.rejectionReason || detail.rejectionReason;
    return <div className="space-y-4 text-sm">
        {payment.status === 'Rejected' && <div className="space-y-2 rounded-control border border-error/30 bg-error-soft p-4 text-error">
            <h3 className="font-semibold">Landlord's rejection reason</h3>
            <p className="whitespace-pre-wrap">{rejection || 'No reason was included. Contact your landlord for clarification.'}</p>
        </div>}
        <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><h3 className="font-semibold">Tenant notes</h3><p className="whitespace-pre-wrap text-muted">{detail.notes || 'No notes provided.'}</p></div>
            <div className="space-y-3"><h3 className="font-semibold">Receipt scan</h3>
                {detail.scan || detail.amount || detail.reference || detail.warnings.length ? <>
                    {detail.scan && <StatusBadge tone={detail.scan === 'Verified' ? 'neutral' : 'warning'}>{detail.scan === 'Verified' ? 'Receipt read' : detail.scan === 'Anomalous' ? 'Scan warnings' : `Scan result: ${detail.scan}`}</StatusBadge>}
                    <p className="text-muted">Scan details are separate from the landlord's verdict.</p>
                    <dl className="space-y-2 text-muted"><div><dt className="font-semibold">Extracted amount</dt><dd>{detail.amount || 'Not available'}</dd></div><div><dt className="font-semibold">Receipt reference</dt><dd className="break-all">{detail.reference || 'Not available'}</dd></div></dl>
                </> : <p className="text-muted">No scan details are available for this record.</p>}
            </div>
        </div>
        {detail.warnings.length > 0 && <div className="space-y-2 rounded-control border border-warning/30 bg-warning-soft p-4 text-warning"><h3 className="font-semibold">Scan warnings</h3><ul className="list-disc space-y-2 pl-5">{detail.warnings.map((warning, index) => <li key={index} className="whitespace-pre-wrap">{warning}</li>)}</ul></div>}
    </div>;
}
