import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  TrendingUp,
  WalletCards,
  ArrowLeftRight,
  Coins,
  Target,
  BarChart3,
  Tags,
  Landmark,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ToastContainer } from './expense/ToastContainer';
import { useAuth } from '../contexts/AuthContext';
import { isUserAdmin } from '../services/expenseService';

interface LayoutProps {
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(true);
  const { currentUser } = useAuth();
  const isAdmin = isUserAdmin(currentUser?.email);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const lendingNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Borrowers', icon: Users, path: '/borrowers' },
  ];

  const expenseNavItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/expense', exact: true },
    { name: 'Transactions', icon: ArrowLeftRight, path: '/expense/transactions' },
    { name: 'Monthly Salary', icon: Coins, path: '/expense/salary' },
    { name: 'Budgets', icon: Target, path: '/expense/budgets' },
    { name: 'Analytics', icon: BarChart3, path: '/expense/analytics' },
    { name: 'Categories', icon: Tags, path: '/expense/categories' },
    { name: 'Accounts', icon: Landmark, path: '/expense/accounts' },
  ];

  const isExpenseActive = location.pathname.startsWith('/expense');

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-200">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 sm:w-64 flex flex-col
          bg-zinc-900 border-r border-zinc-800/80 shadow-2xl md:shadow-none
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 sm:py-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100 leading-none">SKS DM Platform</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-none">Lending & Expense Manager</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Section 1: Lending Management */}
          <div>
            <div className="px-3 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Lending Management
              </p>
            </div>
            <nav className="space-y-1">
              {lendingNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={closeSidebar}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 border border-transparent'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} className={isActive ? 'text-emerald-400' : 'text-zinc-500'} />
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Section 2: Personal Expense Manager */}
          <div>
            <button
              onClick={() => setIsExpenseOpen(!isExpenseOpen)}
              className="w-full flex items-center justify-between px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <span>Expense Manager</span>
              {isExpenseOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {isExpenseOpen && (
              <nav className="space-y-1">
                {expenseNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={closeSidebar}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 border border-transparent'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={16}
                          className={isActive ? 'text-emerald-400' : 'text-zinc-500'}
                        />
                        <span>{item.name}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* Logout & Footer */}
        <div className="p-3 border-t border-zinc-800/80 space-y-2">
          {currentUser && (
            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-200 truncate">{currentUser.email}</p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {isAdmin ? 'Primary Admin Workspace' : 'Personal Workspace'}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl
              text-sm font-medium text-zinc-400 hover:text-rose-400
              hover:bg-rose-500/10 transition-all duration-200 group"
          >
            <LogOut size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Sign Out</span>
          </button>

          <div className="px-3 py-1">
            <p className="text-[10px] font-medium text-zinc-600 text-center">
              SKS DM • Lending & Expense Platform
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800/80 z-20 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <span className="font-bold text-zinc-100 text-sm">
              {isExpenseActive ? 'Expense Manager' : 'SKS DM Lending'}
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-950 p-3 sm:p-5 md:p-7">
          <div className="max-w-7xl mx-auto pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default Layout;
