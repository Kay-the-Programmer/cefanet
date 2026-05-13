import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  Sun,
  Moon,
  Shield,
  GraduationCap,
  HandCoins,
  TrendingUp,
  Activity,
  CalendarCheck2,
  Users2,
  LineChart,
  Map,
  Target
} from 'lucide-react';
import { useAuth } from '../../../modules/auth/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import { UserRole } from '../../types/auth';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  key?: string;
  to: string;
  icon: any;
  label: string;
  collapsed: boolean;
}

const SidebarItem = ({ 
  to, 
  icon: Icon, 
  label, 
  collapsed 
}: SidebarItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      // Responsive padding & text size
      "flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg transition-all duration-200 group relative text-sm",
      isActive 
        ? "bg-primary text-white" 
        : "text-neutral-400 hover:text-white hover:bg-white/5"
    )}
  >
    {/* Icon scales slightly on smaller viewports */}
    <Icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
    {!collapsed && (
      <span className="font-medium whitespace-nowrap overflow-hidden text-sm md:text-sm">
        {label}
      </span>
    )}
    {collapsed && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-secondary text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </NavLink>
);

import { NotificationBell } from '../notifications/NotificationBell';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, idleSecondsLeft } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout('user');
    navigate('/');
  };

  // FR-AUTH-005: warn user when < 2 minutes remain
  const idleWarning = idleSecondsLeft !== null && idleSecondsLeft <= 120 && idleSecondsLeft > 0;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/bursaries', icon: GraduationCap, label: 'Bursaries', roles: [UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.FINANCE_OFFICER, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER, UserRole.AUDITOR, UserRole.BENEFICIARY] },
    { to: '/loans', icon: HandCoins, label: 'Loans & Grants', roles: [UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.FINANCE_OFFICER, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER, UserRole.AUDITOR] },
    { to: '/beneficiaries', icon: Users, label: 'Beneficiaries', roles: [UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.COUNCIL_OFFICER, UserRole.FIELD_OFFICER, UserRole.AUDITOR] },
    { to: '/monitoring', icon: TrendingUp, label: 'Business Monitoring', roles: [UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER] },
    { to: '/field-monitoring', icon: CalendarCheck2, label: 'Field Visits', roles: [UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER] },
    { to: '/engagement', icon: Users2, label: 'Community Engagement', roles: [UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER] },
    { to: '/community-projects', icon: Users2, label: 'Community Projects', roles: [UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER] },
    { to: '/efficiency', icon: Activity, label: 'Operational Efficiency', roles: [UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.AUDITOR] },
    { to: '/me-analytics', icon: LineChart, label: 'M&E Analytics', roles: [UserRole.ADMIN, UserRole.ME_OFFICER] },
    { to: '/reports', icon: BarChart3, label: 'Reports', roles: [UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.COUNCIL_OFFICER, UserRole.AUDITOR] },
    { to: '/quarterly-reports', icon: CalendarCheck2, label: 'Quarterly Reports', roles: [UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.ME_OFFICER, UserRole.AUDITOR] },
    { to: '/sdg-targets', icon: Target, label: 'SDG Targets', roles: [UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.AUDITOR] },
    { to: '/audit-logs', icon: ShieldCheck, label: 'Audit Trail', roles: [UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.AUDITOR] },
    { to: '/users', icon: Shield, label: 'User Management', roles: [UserRole.ADMIN] },
    { to: '/constituencies', icon: Map, label: 'Constituencies', roles: [UserRole.ADMIN] },
  ];

  const getHeaderTitle = () => {
    switch (user?.role) {
      case UserRole.ADMIN:           return 'CDF Administration';
      case UserRole.ME_OFFICER:      return 'M&E Oversight';
      case UserRole.COUNCIL_OFFICER: return 'Constituency Portal';
      case UserRole.FINANCE_OFFICER: return 'Finance Portal';
      case UserRole.FIELD_OFFICER:   return 'Field Monitoring';
      case UserRole.AUDITOR:         return 'Audit & Compliance';
      case UserRole.BENEFICIARY:     return 'Beneficiary Portal';
      case UserRole.PUBLIC_USER:     return 'Public View';
      default:                       return 'CDF Platform';
    }
  };

  const filteredNavItems = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="h-screen bg-background flex overflow-hidden">

      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-[#141414] text-white transition-all duration-300 ease-in-out border-r border-zinc-800",
          // Collapsed: icon-only rail; expanded: comfortable width
          collapsed ? "w-[4.5rem]" : "w-56 lg:w-60"
        )}
      >
        {/* Logo */}
        <div className="p-4 md:p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-[#F27D26] rounded flex items-center justify-center shrink-0">
              <span className="font-bold text-white text-[10px] md:text-xs">CDF</span>
            </div>
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold tracking-tight text-white whitespace-nowrap text-sm md:text-base"
              >
                Transpara<span className="text-[#F27D26]">ZAM</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 md:px-3 space-y-0.5 mt-4 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              to={item.to} 
              icon={item.icon} 
              label={item.label} 
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* User block + collapse toggle */}
        <div className="p-3 md:p-4 border-t border-zinc-800 mt-auto">
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#F27D26] border border-white flex items-center justify-center text-[10px] md:text-xs font-bold shrink-0">
              {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '??'}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-wider truncate text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[9px] md:text-[10px] text-zinc-500 truncate">
                  {user?.role.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-2 px-1 py-2 text-zinc-500 hover:text-white transition-colors"
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4 md:w-5 md:h-5 mx-auto" />
              : (
                <>
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                    Collapse View
                  </span>
                </>
              )
            }
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Navbar */}
        <header className="h-14 md:h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger – mobile only */}
            <button 
              className="md:hidden p-1.5 text-muted-foreground flex-shrink-0"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Title: smaller on mobile, truncates gracefully */}
            <h1 className="
              text-xs sm:text-sm md:text-base lg:text-lg
              font-bold uppercase tracking-widest text-foreground
              truncate
            ">
              {getHeaderTitle()}
            </h1>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <button 
              onClick={toggleTheme}
              className="p-1.5 md:p-2 text-muted-foreground hover:bg-muted transition-colors rounded"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light'
                ? <Moon className="w-4 h-4 md:w-5 md:h-5" />
                : <Sun  className="w-4 h-4 md:w-5 md:h-5" />
              }
            </button>

            <NotificationBell />

            <button 
              onClick={handleLogout}
              className="p-1.5 md:p-2 text-muted-foreground hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        {idleWarning && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-amber-600">
            Session expires in {Math.floor(idleSecondsLeft! / 60)}:{(idleSecondsLeft! % 60).toString().padStart(2, '0')} — move the cursor or tap to stay logged in
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* ── Mobile Slide-out Menu ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />

            {/* Drawer – caps at 85 vw so it never takes the full screen */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[75vw] max-w-[18rem] bg-secondary text-white z-50 flex flex-col md:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-primary rounded flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-white text-base italic">Z</span>
                  </div>
                  <div className="font-bold text-base sm:text-lg tracking-tight">CDF ZAMBIA</div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav items */}
              <div className="flex-1 space-y-0.5 overflow-y-auto p-3 sm:p-4">
                {filteredNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
                      isActive
                        ? "bg-primary text-white"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </div>

              {/* Logout */}
              <div className="p-3 sm:p-4 border-t border-white/10">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 transition-colors w-full rounded-lg hover:bg-white/5 text-sm"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};