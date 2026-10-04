import { useEffect, useRef, useState } from 'react';
import type { HouseRule } from '../../services/ruleService';
import type { RuleFields } from '../../utils/rulesPresentation';
import { ruleScope } from '../../utils/rulesPresentation';
import { useRecordAction } from '../../hooks/useRecordAction';
import { RulesCollection } from './RulesCollection';
import { RuleForm } from './RuleForm';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { ErrorMessage } from '../ui/Feedback';
import { PageHeader, Panel } from '../ui/Layout';

interface Props {
    rules: HouseRule[]; loading: boolean; error: string | null; rooms: { room_number: string }[]; roomsLoading: boolean; roomsError: string | null;
    onRetry: () => void; onRetryRooms: () => void; onAdd: (fields: RuleFields) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>;
}
export function RulesWorkspace({ rules, loading, error, rooms, roomsLoading, roomsError, onRetry, onRetryRooms, onAdd, onDelete }: Props) {
    const [deleting, setDeleting] = useState<HouseRule | null>(null);
    const [notice, setNotice] = useState('');
    const noticeRef = useRef<HTMLParagraphElement>(null);
    useEffect(() => { if (notice) noticeRef.current?.focus(); }, [notice]);
    const action = useRecordAction();
    const canDelete = !!deleting && !loading && !error && rules.some(rule => rule.id === deleting.id);
    async function remove() {
        if (!deleting || !canDelete) return;
        if (await action.run(deleting.id, () => onDelete(deleting.id), 'Deletion could not be confirmed. Refresh rules before retrying.')) { setDeleting(null); setNotice('Rule deleted from the published list.'); }
    }
    return <div className="space-y-6">
        <PageHeader title="House rules" description="Publish clear instructions for every room or a specific room. Priority rules appear first." />
        <p ref={noticeRef} tabIndex={-1} role="status" className="text-sm text-success">{notice}</p>
        <div className="grid items-start gap-6 xl:grid-cols-3">
            <Panel><RuleForm rooms={rooms} roomsLoading={roomsLoading} roomsError={roomsError} onRetryRooms={onRetryRooms} onAdd={onAdd} /></Panel>
            <div className="min-w-0 xl:col-span-2"><RulesCollection landlord rules={rules} loading={loading} error={error} onRetry={onRetry} busy={action.busy} onDelete={rule => { setDeleting(rule); action.clearError(rule.id); setNotice(''); }} /></div>
        </div>
        <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete house rule?" busy={deleting ? action.busy[deleting.id] : false}>
            <p className="text-sm text-muted">This removes the rule from the published list for {deleting && ruleScope(deleting).toLowerCase()}. It cannot be restored through DormFix.</p>
            <p className="whitespace-pre-wrap text-sm font-semibold">{deleting?.rule_text}</p>
            {deleting && action.errors[deleting.id] && <ErrorMessage>{action.errors[deleting.id]} <Button variant="quiet" onClick={onRetry}>Refresh rules</Button></ErrorMessage>}
            {!canDelete && <p role="status" className="text-sm text-warning">The rule is unavailable or no longer in the loaded list. Refresh before proceeding.</p>}
            <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" data-autofocus disabled={!!deleting && action.busy[deleting.id]} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" loading={!!deleting && action.busy[deleting.id]} loadingText="Deleting…" disabled={!canDelete} onClick={remove}>Delete rule</Button></div>
        </Dialog>
    </div>;
}
