import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Wrench, Users, BedDouble, MessageSquare, ShieldCheck, Menu, LogOut, UserRound } from 'lucide-react';
import type { User } from '../../types/types';
import { Drawer } from './Dialog';
import { Button, IconButton } from './Button';
import { AppearanceControl } from './AppearanceControl';
import { Brand } from './Brand';

const landlordNavigation = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/tenants', label: 'Tenants', icon: Users },
    { path: '/rooms', label: 'Rooms', icon: BedDouble },
    { path: '/chat', label: 'Messages', icon: MessageSquare },
    { path: '/rules', label: 'House rules', icon: ShieldCheck },
];

function LandlordNavigation({ onNavigate }: { onNavigate?: () => void }) {
    return <nav aria-label="Landlord navigation" className="space-y-1">
        {landlordNavigation.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} onClick={onNavigate}
            className={({ isActive }) => `df-nav-link ${isActive ? 'df-nav-link--active' : ''}`}>
            <Icon size={20} aria-hidden="true" /><span>{label}</span>
        </NavLink>)}
    </nav>;
}

interface Props {
    role: 'landlord' | 'tenant';
    user: Pick<User, 'name' | 'dormFixId'>;
    onLogout: () => void;
    onEditProfile?: () => void;
    children: ReactNode;
}

export function WorkspaceShell({ role, user, onLogout, onEditProfile, children }: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const previousPath = useRef(location.pathname);
    const routeFocusPending = useRef(false);
    const mainRef = useRef<HTMLElement>(null);
    const title = role === 'landlord' ? landlordNavigation.find(item => item.path === location.pathname)?.label ?? 'Workspace' : 'Tenant workspace';

    useEffect(() => {
        if (previousPath.current !== location.pathname) {
            previousPath.current = location.pathname;
            routeFocusPending.current = true;
            setMenuOpen(false);
        }
        if (!menuOpen && routeFocusPending.current) {
            mainRef.current?.focus();
            routeFocusPending.current = false;
        }
    }, [location.pathname, menuOpen]);

    useEffect(() => {
        const desktop = matchMedia('(min-width: 1024px)');
        const closeOnDesktop = () => {
            if (desktop.matches && menuOpen) {
                routeFocusPending.current = true;
                setMenuOpen(false);
            }
        };
        desktop.addEventListener('change', closeOnDesktop);
        return () => desktop.removeEventListener('change', closeOnDesktop);
    }, [menuOpen]);

    const account = <div className="space-y-3 border-t border-divider pt-4">
        <div className="min-w-0 space-y-1 text-sm">
            <p className="font-semibold text-ink break-words">{user.name}</p>
            <p className="text-muted break-all">Dorm code: <span className="font-mono">{user.dormFixId}</span></p>
        </div>
        <Button variant="secondary" onClick={onLogout}><LogOut size={18} aria-hidden="true" />Sign out</Button>
    </div>;

    return <div className={`min-h-dvh bg-canvas text-ink ${role === 'landlord' ? 'lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]' : ''}`}>
        <a href="#workspace-main" className="df-skip-link" onClick={event => { event.preventDefault(); mainRef.current?.focus(); mainRef.current?.scrollIntoView({ block: 'start' }); }}>Skip to main content</a>
        {role === 'landlord' && <>
            <aside aria-label="Landlord workspace" className="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-r border-divider bg-sidebar p-5 lg:flex">
                <Link to="/" aria-label="DormFix overview" className="flex min-h-11 items-center"><Brand /></Link>
                <LandlordNavigation />
                <div className="mt-auto">{account}</div>
            </aside>
            <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Navigation">
                <LandlordNavigation onNavigate={() => setMenuOpen(false)} />{account}
            </Drawer>
        </>}
        <div className="min-w-0">
            <header className="border-b border-divider bg-surface">
                <div className={`mx-auto flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 ${role === 'tenant' ? 'max-w-5xl' : 'max-w-workspace'}`}>
                    <div className="flex min-w-0 items-center gap-3">
                        {role === 'landlord' ? <>
                            <IconButton label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="lg:hidden"><Menu size={20} /></IconButton>
                            <span className="font-semibold">{title}</span>
                        </> : <Link to="/" className="flex min-h-11 flex-wrap items-center gap-3" aria-label="DormFix home"><Brand /><span className="hidden text-sm font-normal text-muted md:inline">Tenant workspace</span></Link>}
                    </div>
                    {role === 'tenant' ? <div className="flex flex-wrap items-center gap-2">
                        <AppearanceControl />
                        {onEditProfile && <IconButton label="Edit profile" onClick={onEditProfile}><UserRound size={20} /></IconButton>}
                        <Button variant="quiet" onClick={onLogout}><LogOut size={18} aria-hidden="true" /><span>Sign out</span></Button>
                    </div> : <div className="flex flex-wrap items-center gap-4"><span className="hidden text-sm text-muted xl:inline">Landlord workspace</span><AppearanceControl /></div>}
                </div>
            </header>
            <main ref={mainRef} id="workspace-main" tabIndex={-1} className={`df-page min-w-0 ${role === 'tenant' ? 'max-w-5xl' : ''}`}>{children}</main>
        </div>
    </div>;
}
