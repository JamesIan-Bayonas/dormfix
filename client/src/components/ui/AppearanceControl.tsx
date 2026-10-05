import { useId, useState, useSyncExternalStore } from 'react';
import { ChevronDown, SunMoon } from 'lucide-react';

type Appearance = 'light' | 'dark';
declare global {
    interface Window {
        DormFixAppearance: {
            getPreference: () => Appearance;
            subscribe: (listener: () => void) => () => void;
            setPreference: (value: Appearance) => void;
        };
    }
}
const labels = { light: 'Light', dark: 'Dark' };
const serverPreference = () => 'light' as const;

export function AppearanceControl() {
    const id = useId();
    const preference = useSyncExternalStore(window.DormFixAppearance.subscribe, window.DormFixAppearance.getPreference, serverPreference);
    const [announcement, setAnnouncement] = useState('');
    return <div className="inline-flex shrink-0 items-center gap-2">
        <label htmlFor={id} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm leading-5 text-muted">
            <SunMoon size={18} className="shrink-0" aria-hidden="true" /><span className="sr-only sm:not-sr-only">Appearance</span>
        </label>
        <div className="relative shrink-0">
            <select id={id} className="df-control df-appearance-select" value={preference} onChange={event => {
                const next = event.target.value as Appearance;
                window.DormFixAppearance.setPreference(next);
                setAnnouncement(`${labels[next]} appearance selected.`);
            }}>
                <option value="light">Light</option><option value="dark">Dark</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        </div>
        <span role="status" className="sr-only">{announcement}</span>
    </div>;
}
