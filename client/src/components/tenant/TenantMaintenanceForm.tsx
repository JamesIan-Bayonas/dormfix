import { useAuth } from '../UserContext';
import { MaintenanceRequestForm } from '../maintenance/MaintenanceRequestForm';
import { maintenanceBody, type MaintenanceFields } from '../../utils/maintenancePresentation';

interface Props { assigned: boolean; onDone: () => void; onSaved: () => void; onBusyChange: (busy: boolean) => void }
export function TenantMaintenanceForm({ assigned, onDone, onSaved, onBusyChange }: Props) {
    const { user } = useAuth();
    async function submit(fields: MaintenanceFields) {
        if (!user?.id || !assigned) throw new Error('A room assignment is required.');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/maintenance`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(maintenanceBody(user.id, fields)),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'The report submission could not be confirmed.');
        return data;
    }
    return <MaintenanceRequestForm onSubmit={submit} onDone={onDone} onSaved={onSaved} onBusyChange={onBusyChange} unavailable={!user?.id || !assigned} />;
}
