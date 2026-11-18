import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Target,
  ArrowRight,
  Plus,
  Coins,
  ArrowRightLeft,
  RotateCcw,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  EyeOff,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useExpense } from '../../contexts/ExpenseContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ExpenseNav } from '../../components/expense/ExpenseNav';
import { CategoryIcon } from '../../components/expense/CategoryIcon';
import { ReceiptViewerModal } from '../../components/expense/ReceiptViewerModal';
import { BudgetModal } from '../../components/expense/BudgetModal';
import { TransactionModal } from '../../components/expense/TransactionModal';
import {
  formatINR,
  formatMonthYear,
  getBudgetAlertStatus,
  calculateMonthlySummary,
} from '../../utils/expenseCalculations';
import { ExpenseTransaction, TransactionType } from '../../types/expense';

const PIE_COLORS = [
  '#10B981', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EC4899',
  '#EF4444', '#06B6D4', '#14B8A6', '#6366F1', '#D946EF', '#71717A'
];

export const ExpenseOverview: React.FC = () => {
  const {
    accounts,
    categories,
    transactions,
    salaryRecords,
    budgets,
    selectedMonthYear,
    setSelectedMonthYear,
    monthlySummary,
    accountSummaries,
    totalAvailableBalance,
    liquidSpendableBalance,
    dedicatedSavingsBalance,
    totalNetWorth,
  } = useExpense();

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [filterPeriod, setFilterPeriod] = useState<
    'current_month' | 'prev_month' | 'last_3_months' | 'last_6_months' | 'current_year'
  >('current_month');

  const [showBalance, setShowBalance] = useState(true);
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);
  const [activeReceiptName, setActiveReceiptName] = useState<string>('');
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Quick action modal state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('expense');

  const openTx = (type: TransactionType) => {
    setTxModalType(type);
    setIsTxModalOpen(true);
  };

  const tooltipStyle = isLight
    ? {
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        color: '#0F172A',
        boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.08)',
        padding: '10px 14px',
      }
    : {
        borderRadius: '16px',
        border: '1px solid rgba(63,63,70,0.8)',
        backgroundColor: 'rgba(24,24,27,0.95)',
        backdropFilter: 'blur(12px)',
        color: '#e4e4e7',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        padding: '10px 14px',
      };

  // Quick switch handler for time filters
  const handlePeriodChange = (period: typeof filterPeriod) => {
    setFilterPeriod(period);
    const now = new Date();
    if (period === 'current_month') {
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonthYear(ym);
    } else if (period === 'prev_month') {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const ym = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonthYear(ym);
    }
  };

  // Recent transactions (last 5 for crisp Bento layout)
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // Income vs Expense trend (last 6 months)
  const monthlyTrendData = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleString('en-IN', { month: 'short' });
      const b = budgets.find((item) => item.monthYear === ym) || null;
      const summary = calculateMonthlySummary(ym, transactions, salaryRecords, b);
      list.push({
        month: name,
        monthYear: ym,
        Income: summary.totalIncome,
        Expenses: summary.netExpenses,
        Savings: summary.monthlySavings,
      });
    }
    return list;
  }, [transactions, salaryRecords, budgets]);

  // Category Breakdown for the selected month
  const categoryPieData = useMemo(() => {
    const list = categories
      .map((cat) => {
        const spent = monthlySummary.categorySpending[cat.id] || 0;
        return {
          name: cat.name,
          value: Math.max(0, spent),
          color: cat.color || '#10B981',
          icon: cat.icon,
        };
      })
      .filter((item) => item.value > 0);

    // Include any spending where category ID is not in categories array (e.g. cat_sip)
    Object.entries(monthlySummary.categorySpending).forEach(([catId, spent]) => {
      if (spent > 0 && !categories.some((c) => c.id === catId)) {
        list.push({
          name: catId === 'cat_sip' ? 'Investments & SIP' : catId,
          value: spent,
          color: '#8B5CF6',
          icon: 'TrendingUp',
        });
      }
    });

    return list;
  }, [categories, monthlySummary.categorySpending]);

  // Daily spending data for current selected month
  const dailySpendingData = useMemo(() => {
    const dayMap: Record<string, number> = {};
    const [year, month] = selectedMonthYear.split('-');
    const daysInMonth = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${selectedMonthYear}-${String(i).padStart(2, '0')}`;
      dayMap[dStr] = 0;
    }

    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.date.startsWith(selectedMonthYear)) {
        const d = tx.date.slice(0, 10);
        dayMap[d] = (dayMap[d] || 0) + tx.amount;
      }
    });

    return Object.entries(dayMap).map(([date, amount]) => ({
      day: parseInt(date.slice(8, 10), 10),
      date,
      amount,
    }));
  }, [selectedMonthYear, transactions]);

  // Budget status info
  const budgetAlert = getBudgetAlertStatus(
    monthlySummary.netExpenses,
    monthlySummary.overallBudget
  );

  // Spendable balance calculation
  const spendableAmt = dedicatedSavingsBalance > 0 ? liquidSpendableBalance : totalAvailableBalance;

  // Highest spending category name for pill badge
  const topCategory = categoryPieData.length > 0 ? categoryPieData[0] : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <ExpenseNav />

      {/* ── Filter / Time Switcher Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-white/80 dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 text-xs overflow-x-auto scrollbar-none shadow-sm">
          {[
            { id: 'current_month', label: 'Current Month' },
            { id: 'prev_month', label: 'Prev Month' },
            { id: 'last_3_months', label: '3 Months' },
            { id: 'last_6_months', label: '6 Months' },
            { id: 'current_year', label: 'This Year' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handlePeriodChange(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
                filterPeriod === tab.id
                  ? 'bg-[#A3E635] text-[#0D2A18] shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium">
          Period: <span className="text-slate-800 dark:text-zinc-200 font-bold">{formatMonthYear(selectedMonthYear)}</span>
        </p>
      </div>

      {/* ── BENTO TOP ROW: Hero Active Balance + Priority Savings Vault ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Hero Card: Active Balance (7 cols) */}
        <div className="lg:col-span-7 glass-card p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden group">
          {/* Top Chips Row */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#A3E635]/20 text-[#0D2A18] dark:text-[#A3E635] border border-[#A3E635]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#65A30D] dark:bg-[#A3E635]" />
                  INR ₹
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  Cash + UPI
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">
                  Active Account
                </p>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                  sks-dm-lending <ShieldCheck size={12} className="text-[#65A30D] dark:text-[#A3E635]" />
                </p>
              </div>
            </div>

            {/* Active Balance Header & Big Amount */}
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Active Spendable Balance
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {showBalance ? formatINR(spendableAmt) : '••••••••'}
              </h2>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-all"
                title={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
              Total liquid funds ready for transactions & daily outflow
            </p>
          </div>

          {/* Bottom Action Row */}
          <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => openTx('transfer')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0D2A18] hover:bg-[#163821] text-[#A3E635] text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <ArrowRightLeft size={14} />
                <span>Transfer Balance</span>
              </button>
              <button
                onClick={() => openTx('expense')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <Plus size={14} />
                <span>Record Outflow</span>
              </button>
            </div>

            {/* Floating Circular Lime Action Button with ↗ */}
            <button
              onClick={() => openTx('income')}
              className="w-11 h-11 rounded-full bg-[#A3E635] hover:bg-[#bef264] text-[#0D2A18] flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-90 flex-shrink-0"
              title="Add Inflow / Income"
            >
              <ArrowUpRight size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Right Bento Card: Priority Savings Vault (5 cols) */}
        <div className="lg:col-span-5 bento-highlight-card p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle 4-pointed Star Watermark SVG */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 opacity-15 pointer-events-none text-[#0D2A18]">
            <svg viewBox="0 0 200 200" fill="currentColor">
              <path d="M100 0 C100 55 145 100 200 100 C145 100 100 145 100 200 C100 145 55 100 0 100 C55 100 100 55 100 0 Z" />
            </svg>
          </div>

          {/* Top Row: Priority Pill */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#0D2A18] text-[#A3E635] shadow-sm">
                PRIORITY
                <Sparkles size={12} />
              </span>
              <span className="text-[11px] font-bold text-[#0D2A18]/80 uppercase tracking-wider">
                Vault Status
              </span>
            </div>

            <p className="text-xs font-bold text-[#0D2A18]/80 uppercase tracking-wider">
              Dedicated Savings & Vault
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-3xl sm:text-4xl font-black text-[#0D2A18] tabular-nums tracking-tight">
                {formatINR(monthlySummary.dedicatedSavings > 0 ? monthlySummary.dedicatedSavings : monthlySummary.monthlySavings)}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white/70 text-[#0D2A18] border border-white/80">
                {monthlySummary.savingsRate}% rate
              </span>
            </div>
            <p className="text-xs text-[#0D2A18]/80 mt-1 font-semibold">
              Protected balance insulated from daily spontaneous outflow
            </p>
          </div>

          {/* Two Inner Rounded Capsules at Bottom */}
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            {/* Capsule 1: Dedicated Vault */}
            <div className="bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-white/60 text-[#0D2A18]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">Vault Bank</span>
                <PiggyBank size={13} className="text-[#0D2A18]" />
              </div>
              <p className="text-sm sm:text-base font-black mt-1 tabular-nums">
                {formatINR(dedicatedSavingsBalance)}
              </p>
              <p className="text-[10px] font-semibold text-[#0D2A18]/70">Federal Bank</p>
            </div>

            {/* Capsule 2: Unspent Liquid Cash */}
            <div className="bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-white/60 text-[#0D2A18]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">Unspent Cash</span>
                <Wallet size={13} className="text-[#0D2A18]" />
              </div>
              <p className="text-sm sm:text-base font-black mt-1 tabular-nums">
                {formatINR(monthlySummary.spendableBalance)}
              </p>
              <p className="text-[10px] font-semibold text-[#0D2A18]/70">Carried Liquid</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BENTO MIDDLE ROW: Donut Arc + Earnings Breakdown + Recent Transactions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Bento 1: Spending Donut Gauge (4 cols) */}
        <div className="lg:col-span-4 glass-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Spending</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Total net expenses</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                {formatMonthYear(selectedMonthYear)}
              </span>
            </div>

            {/* Donut Chart with Centered Value */}
            <div className="relative h-44 sm:h-48 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData.length > 0 ? categoryPieData : [{ name: 'None', value: 1, color: '#e2e8f0' }]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={3}
                  >
                    {categoryPieData.length > 0 ? (
                      categoryPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))
                    ) : (
                      <Cell fill={isLight ? '#e2e8f0' : '#27272a'} />
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [formatINR(Number(val)), 'Spent']}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Spent Amount Label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {formatINR(monthlySummary.netExpenses)}
                </p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Outflow
                </p>
              </div>
            </div>

            {/* Dynamic Alert Banner */}
            {topCategory && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-2 mb-3">
                <Sparkles size={14} className="flex-shrink-0" />
                <span className="truncate">
                  Top spend: <strong className="font-bold">{topCategory.name}</strong> ({formatINR(topCategory.value)})
                </span>
              </div>
            )}
          </div>

          {/* Mini Category Items */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
            {categoryPieData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 truncate">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate font-medium">{item.name}</span>
                <span className="font-bold text-slate-900 dark:text-zinc-200 ml-auto tabular-nums">
                  {formatINR(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento 2: Earnings & Inflow Breakdown (4 cols) */}
        <div className="lg:col-span-4 glass-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#A3E635]/20 text-[#0D2A18] dark:text-[#A3E635] flex items-center justify-center font-bold">
                  <Coins size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Earnings</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Inflow & Salary sources</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-[#A3E635] text-[#0D2A18]">
                {monthlySummary.savingsRate}% saved
              </span>
            </div>

            <div className="mt-3">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatINR(monthlySummary.totalIncome)}
              </h2>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                + Inflow recorded for {formatMonthYear(selectedMonthYear)}
              </p>
            </div>

            {/* Segmented Progress Bars with Pill Percentage Badges */}
            <div className="space-y-3.5 mt-5">
              {/* Base Salary */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-zinc-300">Base Salary</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatINR(monthlySummary.salaryIncome)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-3 rounded-full overflow-hidden flex items-center">
                  <div
                    className="bg-[#65A30D] dark:bg-[#A3E635] h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((monthlySummary.salaryIncome / (monthlySummary.totalIncome || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Bonus / Incentive */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-zinc-300">Bonus & Incentives</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatINR(monthlySummary.bonusIncome + monthlySummary.incentiveIncome)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(((monthlySummary.bonusIncome + monthlySummary.incentiveIncome) / (monthlySummary.totalIncome || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Dedicated Savings Vault */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-zinc-300">Dedicated Savings</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                    {formatINR(monthlySummary.dedicatedSavings)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((monthlySummary.dedicatedSavings / (monthlySummary.totalIncome || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 mt-4">
            <Link
              to="/expense/salary"
              className="text-xs font-bold text-[#65A30D] dark:text-[#A3E635] hover:underline flex items-center justify-between"
            >
              <span>Manage Salary Records</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Bento 3: Clean Transactions Feed (4 cols) */}
        <div className="lg:col-span-4 glass-card p-5 sm:p-6 flex flex-col justify-between md:col-span-2 lg:col-span-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Transactions</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Recent recorded events</p>
                </div>
              </div>
              <Link
                to="/expense/transactions"
                className="text-xs font-bold text-[#65A30D] dark:text-[#A3E635] hover:underline flex items-center gap-1"
              >
                View all ({transactions.length})
              </Link>
            </div>

            {/* Transactions Feed List */}
            {recentTransactions.length > 0 ? (
              <div className="space-y-2 mt-3">
                {recentTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';
                  const isRefund = tx.type === 'refund';

                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-2xl bg-gray-50/80 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/80 flex items-center justify-between gap-3 hover:border-gray-300 dark:hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${isIncome ? '#10B981' : cat?.color || '#10B981'}15`,
                            color: isIncome ? '#10B981' : cat?.color || '#10B981',
                          }}
                        >
                          <CategoryIcon name={isIncome ? 'TrendingUp' : cat?.icon || 'Tag'} size={15} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200 truncate">
                            {tx.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-500 truncate">
                            {tx.date} • {cat?.name || (isIncome ? 'Income' : 'General')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-xs font-bold tabular-nums ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : isRefund
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }`}
                        >
                          {isIncome && '+'}
                          {isExpense && '-'}
                          {isRefund && '+'}
                          {formatINR(tx.amount)}
                        </p>
                        {tx.receiptUrl && (
                          <button
                            onClick={() => {
                              setActiveReceiptUrl(tx.receiptUrl || '');
                              setActiveReceiptName(tx.receiptName || 'Receipt');
                            }}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 justify-end ml-auto mt-0.5"
                          >
                            <FileText size={10} /> Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500 dark:text-zinc-500">No transactions recorded yet.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 mt-4">
            <button
              onClick={() => openTx('expense')}
              className="w-full py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all"
            >
              + Quick Add Outflow
            </button>
          </div>
        </div>
      </div>

      {/* ── BENTO BOTTOM ROW: Monthly Trends Bar Chart + Tracked Accounts Showcase ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Income vs Expenses Bar Chart (8 cols) */}
        <div className="lg:col-span-8 glass-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Monthly Spending & Income Trends
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Comparison across the last 6 months
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
              </span>
              <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Savings
              </span>
            </div>
          </div>

          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E5E7EB' : '#27272a'} />
                <XAxis dataKey="month" stroke={isLight ? '#94A3B8' : '#71717a'} tick={{ fontSize: 11 }} />
                <YAxis
                  stroke={isLight ? '#94A3B8' : '#71717a'}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [formatINR(Number(val)), '']}
                />
                <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Savings" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tracked Accounts Showcase (4 cols) */}
        <div className="lg:col-span-4 glass-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Tracked Accounts</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Live multi-account balance state</p>
              </div>
              <Link
                to="/expense/accounts"
                className="text-xs font-bold text-[#65A30D] dark:text-[#A3E635] hover:underline flex items-center gap-1"
              >
                Manage <ArrowRight size={13} />
              </Link>
            </div>

            <div className="space-y-2.5 mt-4">
              {accountSummaries.map((summary) => {
                const isSavingsVault = summary.isSavings || summary.account.isSavings;
                return (
                  <div
                    key={summary.account.id}
                    className="p-3 rounded-2xl bg-gray-50/80 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
                        style={{
                          backgroundColor: `${summary.account.color || '#10B981'}15`,
                          borderColor: `${summary.account.color || '#10B981'}30`,
                          color: summary.account.color || '#10B981',
                        }}
                      >
                        {summary.account.type === 'cash' ? (
                          <Banknote size={17} />
                        ) : summary.account.type === 'upi' ? (
                          <Smartphone size={17} />
                        ) : (
                          <CreditCard size={17} />
                        )}
                      </div>
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-200 truncate">
                            {summary.account.name}
                          </p>
                          {isSavingsVault ? (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/25">
                              Vault
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#A3E635]/20 text-[#0D2A18] dark:text-[#A3E635] border border-[#A3E635]/30">
                              Spend
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 capitalize">
                          {summary.account.type}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 tabular-nums">
                        {formatINR(summary.currentBalance)}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                        Open: {formatINR(summary.account.openingBalance)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 mt-4">
            <Link
              to="/expense/budgets"
              className="text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-between"
            >
              <span>Monthly Budget: {monthlySummary.overallBudget > 0 ? formatINR(monthlySummary.overallBudget) : 'Not configured'}</span>
              <Target size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Receipt Viewer Modal */}
      {activeReceiptUrl && (
        <ReceiptViewerModal
          url={activeReceiptUrl}
          fileName={activeReceiptName}
          onClose={() => setActiveReceiptUrl(null)}
        />
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />

      {/* Quick Action Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        defaultType={txModalType}
      />
    </div>
  );
};
