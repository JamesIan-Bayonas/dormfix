import { useAuth } from '../UserContext';
import { useMaintenance } from '../../hooks/useMaintenance';
import { MaintenanceRequests } from '../maintenance/MaintenanceRequests';

export function LandlordMaintenanceList() {
    const { user } = useAuth();
    const { requests, isLoading, error, refresh, changeStatus } = useMaintenance(user?.id, user?.role || 'landlord');
    return <MaintenanceRequests role="landlord" requests={requests} loading={isLoading} error={error} onRetry={refresh} onChangeStatus={changeStatus} />;
}
