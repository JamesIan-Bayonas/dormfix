import { AppearanceControl } from './AppearanceControl';
import { Brand } from './Brand';

export function AppearanceHeader() {
    return <div className="flex flex-wrap items-center justify-between gap-3"><Brand /><AppearanceControl /></div>;
}
