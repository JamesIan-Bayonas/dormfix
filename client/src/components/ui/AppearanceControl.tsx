import { useState, useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';

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
    const preference = useSyncExternalStore(window.DormFixAppearance.subscribe, window.DormFixAppearance.getPreference, serverPreference);
    const [announcement, setAnnouncement] = useState('');
    const next = preference === 'dark' ? 'light' : 'dark';
    const Icon = next === 'light' ? Sun : Moon;
    return <div className="inline-flex shrink-0 items-center gap-2">
        <span className="hidden whitespace-nowrap text-sm text-muted sm:inline">Appearance</span>
        <button type="button" aria-label={`Use ${next} mode`} title={`Current theme: ${labels[preference]}. Change to ${labels[next]} mode.`}
            className="df-button df-button--secondary min-w-[8rem]" onClick={() => {
                window.DormFixAppearance.setPreference(next);
                setAnnouncement(`${labels[next]} appearance selected.`);
            }}><Icon size={17} aria-hidden="true" />{labels[next]} mode</button>
        <span role="status" className="sr-only">{announcement}</span>
    </div>;
}
