// client/src/components/landlord/LandlordRoomList.tsx
import React, { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../UserContext';
import { useRooms } from '../../hooks/useRooms';
import { AddRoomDialog } from './AddRoomDialog';
import { Button } from '../ui/Button';
import { ErrorState, EmptyState, LoadingState } from '../ui/Feedback';
import toast from 'react-hot-toast';
import { PageHeader, Panel } from '../ui/Layout';
import { RoomOccupancy } from './RoomOccupancy';

interface RoomListProps {
    onBack: () => void;
}

export const LandlordRoomList: React.FC<RoomListProps> = ({ onBack }) => {
    const { user } = useAuth();
    const { rooms, isLoading, error, addError, addRoom, refreshRooms } = useRooms(user?.id);

    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <div className="space-y-6 text-ink">
            <Button variant="quiet" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />Back to overview</Button>
            <PageHeader title="Rooms" description="Review capacity and room assignments." action={<Button onClick={() => setIsModalOpen(true)}><Plus size={18} aria-hidden="true" />Add room</Button>} />
            {isLoading ? <LoadingState>Loading rooms…</LoadingState> : error ?
                <ErrorState title="Rooms could not be loaded" description={error} action={<Button variant="secondary" onClick={refreshRooms}>Try again</Button>} /> : rooms.length === 0 ?
                <Panel><EmptyState title="No rooms yet" description="Add a room before assigning tenants." action={<Button onClick={() => setIsModalOpen(true)}>Add room</Button>} /></Panel> :
                <RoomOccupancy rooms={rooms} />}
            <AddRoomDialog open={isModalOpen} onClose={() => setIsModalOpen(false)} error={addError}
                onSave={async (roomNumber, capacity) => {
                    const saved = await addRoom(roomNumber, capacity);
                    if (saved) toast.success('Room added successfully.');
                    return saved;
                }} />
        </div>
    );
};
