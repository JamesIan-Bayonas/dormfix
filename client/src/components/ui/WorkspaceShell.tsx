import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Wrench, Users, BedDouble, MessageSquare, ShieldCheck, Menu, LogOut, UserRound, Megaphone } from 'lucide-react';
import type { User } from '../../types/types';
import { Drawer } from './Dialog';
import { Button, IconButton } from './Button';
import { AppearanceControl } from './AppearanceControl';
import { Brand } from './Brand';

/** Nav items split into labelled groups for visual hierarchy. */
const NAV_GROUPS = [
    {
        label: 'Manage',
        items: [
            { path: '/', label: 'Overview', icon: LayoutDashboard },
            { path: '/tenants', label: 'Tenants', icon: Users },
            { path: '/rooms', label: 'Rooms', icon: BedDouble },
            { path: '/payments', label: 'Payments', icon: CreditCard },
            { path: '/maintenance', label: 'Maintenance', icon: Wrench },
        ],
    },
    {
        label: 'Communicate',
        items: [
            { path: '/chat', label: 'Messages', icon: MessageSquare },
            { path: '/announcements', label: 'Announcements', icon: Megaphone },
            { path: '/rules', label: 'House rules', icon: ShieldCheck },
        ],
    },
];

const TENANT_NAV = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/chat', label: 'Messages', icon: MessageSquare },
    { path: '/announcements', label: 'Announcements', icon: Megaphone },
];

function tenantActivePath(pathname: string) {
    if (['/history', '/pay'].includes(pathname)) return '/payments';
    if (pathname === '/report') return '/maintenance';
    return pathname;
}

function WorkspaceNavigation({ role, onNavigate }: { role: Props['role']; onNavigate?: () => void }) {
    const { pathname } = useLocation();
    const activePath = role === 'tenant' ? tenantActivePath(pathname) : pathname;
    const groups = role === 'landlord' ? NAV_GROUPS : [
        { label: 'My dormitory', items: TENANT_NAV.slice(0, 3) },
        { label: 'Communicate', items: TENANT_NAV.slice(3) },
    ];
    return (
        <nav aria-label={role === 'landlord' ? 'Landlord navigation' : 'Tenant navigation'} className="space-y-5">
            {groups.map(group => (
                <div key={group.label}>
                    <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted/70 select-none">
                        {group.label}
                    </p>
                    <ul className="space-y-0.5" role="list">
                        {group.items.map(({ path, label, icon: Icon }) => (
                            <li key={path}>
                                <Link
                                    to={path}
                                    onClick={onNavigate}
                                    aria-current={activePath === path || path !== '/' && activePath.startsWith(`${path}/`) ? 'page' : undefined}
                                    className={`df-nav-link ${activePath === path || path !== '/' && activePath.startsWith(`${path}/`) ? 'df-nav-link--active' : ''}`}
                                >
                                    <Icon size={20} aria-hidden="true" />
                                    <span>{label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
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
    const headerRef = useRef<HTMLElement>(null);
    const title = (role === 'landlord' ? NAV_GROUPS.flatMap(g => g.items) : TENANT_NAV).find(item => item.path === (role === 'tenant' ? tenantActivePath(location.pathname) : location.pathname))?.label ?? 'Workspace';

    useEffect(() => {
        const header = headerRef.current;
        if (!header) return;
        const root = document.documentElement;
        const property = '--df-workspace-header-height';
        const previousHeight = root.style.getPropertyValue(property);
        const updateHeight = () => root.style.setProperty(property, `${header.getBoundingClientRect().height}px`);
        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(header);
        return () => {
            observer.disconnect();
            if (previousHeight) root.style.setProperty(property, previousHeight);
            else root.style.removeProperty(property);
        };
    }, []);

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
            {user.dormFixId && <p className="text-muted break-all">Dorm code: <span className="font-mono">{user.dormFixId}</span></p>}
        </div>
        <Button variant="secondary" onClick={onLogout}><LogOut size={18} aria-hidden="true" />Sign out</Button>
    </div>;

    return <div className="min-h-dvh bg-canvas text-ink lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <a href="#workspace-main" className="df-skip-link" onClick={event => { event.preventDefault(); mainRef.current?.focus(); mainRef.current?.scrollIntoView({ block: 'start' }); }}>Skip to main content</a>
        <>
            <aside
                aria-label={role === 'landlord' ? 'Landlord workspace' : 'Tenant workspace'}
                className="df-sidebar-shadow sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-r border-divider bg-sidebar p-5 lg:flex"
            >
                {/* Brand + role label */}
                <div className="space-y-1.5">
                    <Link to="/" aria-label={role === 'landlord' ? 'DormFix overview' : 'DormFix home'} className="flex min-h-11 items-center">
                        <Brand />
                    </Link>
                    <p className="pl-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted/60 select-none">
                        {role === 'landlord' ? 'Landlord Portal' : 'Tenant Portal'}
                    </p>
                </div>
                <WorkspaceNavigation role={role} />
                <div className="mt-auto">{account}</div>
            </aside>
            <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Navigation">
                <WorkspaceNavigation role={role} onNavigate={() => setMenuOpen(false)} />{account}
            </Drawer>
        </>
        <div className="min-w-0">
            <header ref={headerRef} className="sticky top-0 z-20 border-b border-divider bg-surface">
                <div className="mx-auto flex min-h-16 max-w-workspace flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                            <IconButton label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="lg:hidden"><Menu size={20} /></IconButton>
                            <span className="font-semibold">{title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className="hidden text-sm text-muted xl:inline">{role === 'landlord' ? 'Landlord workspace' : 'Tenant workspace'}</span>
                        <AppearanceControl />
                        {role === 'tenant' && onEditProfile && <IconButton label="Edit profile" onClick={onEditProfile}><UserRound size={20} /></IconButton>}
                    </div>
                </div>
            </header>
            <main ref={mainRef} id="workspace-main" tabIndex={-1} className="df-page min-w-0">{children}</main>
        </div>
    </div>;
}
