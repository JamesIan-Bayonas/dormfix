import type { ReactNode } from 'react';
import { Home } from 'lucide-react';

interface AuthLayoutProps { title: string; description: string; children: ReactNode; brandPosition?: 'left' | 'right' }
export function AuthLayout({ title, description, children, brandPosition = 'left' }: AuthLayoutProps) {
    return (
        <main className="df-auth">
            <aside className={`df-auth-brand ${brandPosition === 'right' ? 'lg:order-2' : ''}`} aria-label="DormFix">
                <img src={`${import.meta.env.BASE_URL}dormitory.jpg`} alt="" aria-hidden="true" width={1600} height={1068}
                    decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                <div aria-hidden="true" className="absolute inset-0 bg-primary/80" />
                <div className="relative max-w-sm space-y-6 text-center">
                    <Home size={36} strokeWidth={1.5} className="mx-auto" aria-hidden="true" />
                    <p className="font-serif text-4xl">DormFix</p>
                    <p className="text-base leading-relaxed text-primary-content">Room assignments, payment records, and maintenance in one place.</p>
                </div>
            </aside>
            <section className="df-auth-form" aria-labelledby="auth-title">
                <div className="w-full max-w-form space-y-6">
                    <header className="space-y-2 border-b border-divider pb-6">
                        <p className="text-sm font-semibold text-primary lg:hidden">DormFix</p>
                        <h1 id="auth-title" className="df-page-title">{title}</h1>
                        <p className="text-sm leading-relaxed text-muted">{description}</p>
                    </header>
                    {children}
                </div>
            </section>
        </main>
    );
}
