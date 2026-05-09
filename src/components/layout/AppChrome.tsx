import { BriefcaseBusiness, FileText, LayoutTemplate, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/cn';
import { initials } from '../../lib/validators';
import { useResumeStore } from '../../lib/resumeStore';
import { Button } from '../ui/Button';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BriefcaseBusiness },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppChrome() {
  const navigate = useNavigate();
  const { profile } = useResumeStore();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--surface)]/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            className="flex items-center gap-3 rounded-sm text-left transition-transform duration-200 ease-expo hover:-translate-y-0.5"
            onClick={() => navigate('/dashboard')}
          >
            <span className="grid h-10 w-10 place-items-center rounded-sm bg-brand-500 text-white shadow-lg shadow-brand-500/30">
              <FileText className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display text-base font-bold">AI Resume Builder</span>
              <span className="block text-xs text-[color:var(--muted)]">Ethical ATS studio</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold transition-all duration-200 ease-expo',
                    isActive
                      ? 'bg-brand-500/15 text-brand-100'
                      : 'text-[color:var(--muted)] hover:bg-white/8 hover:text-[color:var(--text)]',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="h-10 w-10 px-0"
              aria-label="Toggle theme"
              title="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <div className="hidden items-center gap-2 rounded-sm border border-[color:var(--border)] bg-white/5 px-2 py-1.5 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-sm bg-brand-500/20 text-xs font-bold text-brand-100">
                {initials(profile.fullName)}
              </span>
              <span className="max-w-28 truncate text-sm font-semibold">{profile.fullName}</span>
            </div>
            <Button variant="ghost" className="h-10 w-10 px-0" title="Sign out" onClick={() => navigate('/login')}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
