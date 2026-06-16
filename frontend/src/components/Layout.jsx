import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Home, CalendarDays, BookOpen, LogOut, Menu, Globe, ExternalLink, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout, toggleLanguage } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isRtl = i18n.language === 'ar';

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: t('dashboard'), end: true },
    { to: '/admin/houses', icon: Home, label: t('myHouses') },
    { to: '/admin/bookings', icon: BookOpen, label: t('bookings') },
    { to: '/admin/calendar', icon: CalendarDays, label: t('calendar') },
  ];

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  const Sidebar = ({ onClose }) => (
    <aside className="flex flex-col w-64 bg-sidebar-grad text-white shrink-0 h-full">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gold-grad flex items-center justify-center shadow-glow shrink-0">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-playfair text-xl font-bold tracking-tight text-white">GesLoc</span>
        </div>
        <p className="text-white/40 text-xs mt-3 pl-0.5">{t('siteManagement')}</p>
      </div>

      <div className="mx-6 h-px bg-white/8 mb-4" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium group ${
                isActive
                  ? 'bg-gold-grad text-white shadow-sm nav-active-glow'
                  : 'text-white/55 hover:bg-white/8 hover:text-white/90'
              } ${isRtl ? 'flex-row-reverse' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/8 p-4 space-y-3">

        {/* User card */}
        <div className="flex items-center gap-3 bg-white/6 rounded-2xl px-3 py-2.5">
          <div className="w-9 h-9 rounded-full bg-gold-grad flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-glow">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">{user?.name}</p>
            <p className="text-white/40 text-[11px] truncate mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Client link */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-gold/12 hover:bg-gold/22 border border-gold/20 transition group"
        >
          <span className="text-gold text-xs font-semibold">{t('clientPage')}</span>
          <ExternalLink size={13} className="text-gold/60 group-hover:text-gold transition" />
        </a>

        {/* Settings */}
        <NavLink
          to="/admin/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl transition text-xs font-medium ${
              isActive
                ? 'bg-gold/15 text-gold'
                : 'bg-white/8 hover:bg-white/14 text-white/65 hover:text-white'
            }`
          }
        >
          <Settings size={13} className="shrink-0" />
          {t('settings')}
        </NavLink>

        {/* Language + Logout */}
        <div className="space-y-1.5">
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/14 transition text-xs font-medium text-white/65 hover:text-white"
          >
            <Globe size={13} className="shrink-0" />
            {i18n.language === 'fr' ? 'العربية' : 'Français'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 hover:bg-red-500/20 hover:text-red-300 transition text-xs font-medium text-white/65"
          >
            <LogOut size={13} className="shrink-0" />
            {t('logout')}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className={`flex h-screen overflow-hidden bg-parchment ${isRtl ? 'flex-row-reverse' : ''}`}>
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: isRtl ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className={`fixed top-0 ${isRtl ? 'right-0' : 'left-0'} h-full z-50 lg:hidden`}
            >
              <Sidebar onClose={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header
          className="lg:hidden text-white px-4 flex items-center justify-between shrink-0"
          style={{
            background: 'linear-gradient(135deg, #0D1117 0%, #1C2333 100%)',
            borderBottom: '1px solid rgba(201,147,58,0.15)',
            boxShadow: '0 2px 20px rgba(0,0,0,0.35)',
            height: 56,
          }}
        >
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-glow"
              style={{ background: 'linear-gradient(135deg, #C9933A, #E8B96A)' }}>
              <span className="text-white font-bold text-xs">R</span>
            </div>
            <span className="font-playfair text-base font-bold tracking-tight">GesLoc</span>
          </div>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `w-9 h-9 rounded-xl flex items-center justify-center transition ${isActive ? 'bg-gold/20 text-gold' : 'text-white/70 hover:text-white'}`
            }
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Settings size={17} />
          </NavLink>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'linear-gradient(180deg, #111827 0%, #0D1117 100%)',
          borderTop: '1px solid rgba(201,147,58,0.12)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 min-h-[58px] relative"
            >
              {({ isActive }) => (
                <>
                  {/* Active pill indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavPill"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gold"
                    />
                  )}
                  <div className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-gold/15' : 'bg-transparent'
                  }`}>
                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2.2 : 1.7}
                      className={isActive ? 'text-gold' : 'text-white/35'}
                    />
                  </div>
                  <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-gold' : 'text-white/35'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
