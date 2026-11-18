import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Coins,
  Target,
  BarChart3,
  Tags,
  Landmark,
  Plus,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useExpense } from '../../contexts/ExpenseContext';
import { TransactionModal } from './TransactionModal';
import { SalaryModal } from './SalaryModal';
import { BudgetModal } from './BudgetModal';
import { TransactionType } from '../../types/expense';

export const ExpenseNav: React.FC = () => {
  const location = useLocation();
  const { selectedMonthYear, setSelectedMonthYear } = useExpense();

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('expense');
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const openTx = (type: TransactionType) => {
    setTxModalType(type);
    setIsTxModalOpen(true);
  };

  const navLinks = [
    { name: 'Overview', path: '/expense', icon: LayoutDashboard, exact: true },
    { name: 'Transactions', path: '/expense/transactions', icon: ArrowLeftRight },
    { name: 'Monthly Salary', path: '/expense/salary', icon: Coins },
    { name: 'Budgets', path: '/expense/budgets', icon: Target },
    { name: 'Analytics', path: '/expense/analytics', icon: BarChart3 },
    { name: 'Categories', path: '/expense/categories', icon: Tags },
    { name: 'Accounts', path: '/expense/accounts', icon: Landmark },
  ];

  return (
    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
      {/* Top Banner: Module Title, Month Filter & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 glass-card p-4 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#0D2A18] bg-[#A3E635] px-2.5 py-0.5 rounded-full shadow-sm">
              Personal Finance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight mt-1.5">
            Expense Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
            Track salaries, daily expenses, savings, budgets, and accounts
          </p>
        </div>

        {/* Controls: Month Switcher & Quick Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
          {/* Month Selector */}
          <div className="flex items-center justify-between sm:justify-start gap-2 px-3.5 py-2 rounded-2xl bg-gray-100/90 dark:bg-zinc-950/80 border border-gray-200/80 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 w-full sm:w-auto shadow-sm">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#65A30D] dark:text-emerald-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold sm:hidden">Month:</span>
            </div>
            <input
              type="month"
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="bg-transparent border-none text-slate-800 dark:text-zinc-200 text-xs focus:outline-none cursor-pointer font-bold"
            />
          </div>

          {/* Quick Action Buttons Grid on mobile */}
          <div className="grid grid-cols-4 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              onClick={() => openTx('expense')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-all duration-200 active:scale-95"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="truncate">Expense</span>
            </button>

            <button
              onClick={() => openTx('income')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#A3E635] hover:bg-[#bef264] text-[#0D2A18] text-xs font-black shadow-sm transition-all duration-200 active:scale-95"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="truncate">Income</span>
            </button>

            <button
              onClick={() => openTx('transfer')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all duration-200 active:scale-95"
            >
              <ArrowLeftRight size={13} strokeWidth={2.5} />
              <span className="truncate">Transfer</span>
            </button>

            <button
              onClick={() => setIsSalaryModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all duration-200 active:scale-95"
            >
              <Coins size={13} strokeWidth={2.5} />
              <span className="truncate">Salary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none border-b border-gray-200/60 dark:border-zinc-800/80 -mx-3 px-3 sm:mx-0 sm:px-0">
        {navLinks.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `
              flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0
              ${
                isActive
                  ? 'bg-[#A3E635] text-[#0D2A18] shadow-sm dark:bg-emerald-600/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-gray-200/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60 border border-transparent'
              }
            `}
          >
            <item.icon size={15} strokeWidth={2.2} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Global Modals for Expense Nav */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        defaultType={txModalType}
      />
      <SalaryModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
      />
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />
    </div>
  );
};
