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
  Sun,
  Moon,
} from 'lucide-react';
import { ToastContainer } from './expense/ToastContainer';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { isUserAdmin } from '../services/expenseService';

interface LayoutProps {
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(true);
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="flex h-screen overflow-hidden bg-[#F4F5F7] dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 transition-colors duration-200">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 sm:w-64 flex flex-col
          bg-white dark:bg-zinc-900 border-r border-gray-200/80 dark:border-zinc-800/80 shadow-xl md:shadow-none
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 sm:py-5 border-b border-gray-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm font-bold">
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-none">SKS DM Platform</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1 leading-none font-medium">Lending & Expense Manager</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">
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
                    flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm font-bold dark:bg-emerald-600/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/70'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} className={isActive ? 'text-white dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'} />
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-white dark:bg-emerald-400" />
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
              className="w-full flex items-center justify-between px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-zinc-400 transition-colors"
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
                      flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-semibold
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm font-bold dark:bg-emerald-600/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/70'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={16}
                          className={isActive ? 'text-white dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'}
                        />
                        <span>{item.name}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white dark:bg-emerald-400" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* Theme Toggle & User Info & Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-zinc-800/80 space-y-2">
          {/* Theme Switcher Toggle Pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-gray-100 dark:bg-zinc-950/80 border border-gray-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              {theme === 'light' ? (
                <Sun size={15} className="text-amber-500" />
              ) : (
                <Moon size={15} className="text-indigo-400" />
              )}
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                {theme === 'light' ? 'Light Bento' : 'Dark Mode'}
              </span>
            </div>
            <button
              onClick={(e) => toggleTheme(e)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none bg-gray-300 dark:bg-zinc-700 p-0.5"
              title="Toggle between Light Bento and Dark Mode"
              aria-label="Toggle theme"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                  theme === 'light' ? 'translate-x-0' : 'translate-x-5'
                }`}
              />
            </button>
          </div>

          {currentUser && (
            <div className="px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-zinc-950/80 border border-gray-200/80 dark:border-zinc-800 flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${isAdmin ? 'bg-[#A3E635] shadow-[0_0_8px_#A3E635]' : 'bg-blue-400'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{currentUser.email}</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate font-medium">
                  {isAdmin ? 'Primary Admin Workspace' : 'Personal Workspace'}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl
              text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400
              hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200 group"
          >
            <LogOut size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Sign Out</span>
          </button>

          <div className="px-3 py-0.5">
            <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-600 text-center">
              SKS DM • Modern Finance Suite
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-gray-200/80 dark:border-zinc-800/80 z-20 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
              <TrendingUp size={16} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
              {isExpenseActive ? 'Expense Manager' : 'SKS DM Lending'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => toggleTheme(e)}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F4F5F7] dark:bg-zinc-950 p-3 sm:p-5 md:p-7 transition-colors duration-200">
          <div className="max-w-7xl mx-auto pb-10">
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
