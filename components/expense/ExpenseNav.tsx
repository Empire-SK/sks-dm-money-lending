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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 glass-card p-3.5 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Personal Finance
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-zinc-100 tracking-tight mt-1">
            Expense Manager
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Track salaries, daily expenses, savings, budgets, and accounts
          </p>
        </div>

        {/* Controls: Month Switcher & Quick Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
          {/* Month Selector */}
          <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-emerald-400 flex-shrink-0" />
              <span className="text-[11px] text-zinc-500 font-medium sm:hidden">Month:</span>
            </div>
            <input
              type="month"
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="bg-transparent border-none text-zinc-200 text-xs focus:outline-none cursor-pointer font-semibold"
            />
          </div>

          {/* Quick Action Buttons Grid on mobile */}
          <div className="grid grid-cols-4 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              onClick={() => openTx('expense')}
              className="btn-primary text-xs py-2 px-2 bg-rose-600 hover:bg-rose-500 shadow-rose-950/30 flex items-center justify-center gap-1"
            >
              <Plus size={13} />
              <span className="truncate">Expense</span>
            </button>

            <button
              onClick={() => openTx('income')}
              className="btn-primary text-xs py-2 px-2 flex items-center justify-center gap-1"
            >
              <Plus size={13} />
              <span className="truncate">Income</span>
            </button>

            <button
              onClick={() => openTx('transfer')}
              className="btn-secondary text-xs py-2 px-2 hover:text-blue-400 hover:border-blue-500/30 flex items-center justify-center gap-1"
            >
              <ArrowLeftRight size={13} />
              <span className="truncate">Transfer</span>
            </button>

            <button
              onClick={() => setIsSalaryModalOpen(true)}
              className="btn-secondary text-xs py-2 px-2 hover:text-emerald-400 hover:border-emerald-500/30 flex items-center justify-center gap-1"
            >
              <Coins size={13} />
              <span className="truncate">Salary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-800/80 -mx-3 px-3 sm:mx-0 sm:px-0">
        {navLinks.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `
              flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0
              ${
                isActive
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
              }
            `}
          >
            <item.icon size={15} />
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
