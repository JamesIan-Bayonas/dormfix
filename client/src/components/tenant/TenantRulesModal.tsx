import { TenantRules } from './TenantRules';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
interface Props { isOpen: boolean; onClose: () => void; landlordId: string; roomNumber?: string }
export function TenantRulesModal({ isOpen, onClose, landlordId, roomNumber }: Props) {
    return <Dialog open={isOpen} onClose={onClose} title="House rules" description="Rules that apply to your dormitory and room.">
        {isOpen && <TenantRules landlordId={landlordId} roomNumber={roomNumber} />}
        <div className="flex justify-end"><Button onClick={onClose}>Close house rules</Button></div>
    </Dialog>;
}
