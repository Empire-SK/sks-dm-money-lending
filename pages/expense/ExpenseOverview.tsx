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
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
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
import { ExpenseNav } from '../../components/expense/ExpenseNav';
import { CategoryIcon } from '../../components/expense/CategoryIcon';
import { ReceiptViewerModal } from '../../components/expense/ReceiptViewerModal';
import { BudgetModal } from '../../components/expense/BudgetModal';
import {
  formatINR,
  formatMonthYear,
  getBudgetAlertStatus,
  calculateMonthlySummary,
} from '../../utils/expenseCalculations';
import { ExpenseTransaction } from '../../types/expense';

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid rgba(63,63,70,0.8)',
  backgroundColor: 'rgba(24,24,27,0.95)',
  backdropFilter: 'blur(12px)',
  color: '#e4e4e7',
  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
  padding: '8px 12px',
};

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

  const [filterPeriod, setFilterPeriod] = useState<
    'current_month' | 'prev_month' | 'last_3_months' | 'last_6_months' | 'current_year'
  >('current_month');

  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);
  const [activeReceiptName, setActiveReceiptName] = useState<string>('');
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

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

  // Recent transactions (last 6)
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 6);
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <ExpenseNav />

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs overflow-x-auto scrollbar-none -mx-1 px-1">
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
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap text-xs ${
                filterPeriod === tab.id
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-[11px] sm:text-xs text-zinc-500 font-medium">
          Data for <span className="text-zinc-300 font-semibold">{formatMonthYear(selectedMonthYear)}</span>
        </p>
      </div>

      {/* ── Financial Summary Cards (Section 3.A) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* 1. Monthly Income */}
        <div className="glass-card p-3.5 sm:p-5 relative overflow-hidden group hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider truncate">
                Monthly Income
              </p>
              <p className="text-lg sm:text-2xl font-bold mt-1 text-emerald-400 tabular-nums truncate">
                {formatINR(monthlySummary.totalIncome)}
              </p>
              <div className="mt-1.5 text-[10px] sm:text-[11px] text-zinc-400 space-y-0.5 hidden sm:block">
                <p>Base: {formatINR(monthlySummary.salaryIncome)}</p>
                {(monthlySummary.bonusIncome > 0 || monthlySummary.incentiveIncome > 0) && (
                  <p>Bonus: {formatINR(monthlySummary.bonusIncome + monthlySummary.incentiveIncome)}</p>
                )}
              </div>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-xl border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex-shrink-0 ml-1.5">
              <Coins size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>

        {/* 2. Total Expenses */}
        <div className="glass-card p-3.5 sm:p-5 relative overflow-hidden group hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider truncate">
                Net Expenses
              </p>
              <p className="text-lg sm:text-2xl font-bold mt-1 text-rose-400 tabular-nums truncate">
                {formatINR(monthlySummary.netExpenses)}
              </p>
              <div className="mt-1.5 text-[10px] sm:text-[11px] text-zinc-400 space-y-0.5 hidden sm:block">
                <p>Gross: {formatINR(monthlySummary.totalExpenses)}</p>
                {monthlySummary.totalRefunds > 0 && (
                  <p className="text-purple-400">Refunds: -{formatINR(monthlySummary.totalRefunds)}</p>
                )}
              </div>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-xl border bg-rose-500/10 text-rose-400 border-rose-500/20 flex-shrink-0 ml-1.5">
              <TrendingDown size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>

        {/* 3. Available Balance across accounts */}
        <div className="glass-card p-3.5 sm:p-5 relative overflow-hidden group hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider truncate">
                Available to Spend
              </p>
              <p className="text-lg sm:text-2xl font-bold mt-1 text-sky-400 tabular-nums truncate">
                {formatINR(dedicatedSavingsBalance > 0 ? liquidSpendableBalance : totalAvailableBalance)}
              </p>
              <div className="mt-1.5 text-[10px] sm:text-[11px] text-zinc-400 space-y-0.5 hidden sm:block truncate">
                {dedicatedSavingsBalance > 0 ? (
                  <p title={`Total across all accounts: ${formatINR(totalNetWorth)}`}>
                    Liquid Cash & Bank <span className="text-zinc-500 text-[10px]">(Total: {formatINR(totalNetWorth)})</span>
                  </p>
                ) : (
                  <p>Cash + UPI</p>
                )}
              </div>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-xl border bg-sky-500/10 text-sky-400 border-sky-500/20 flex-shrink-0 ml-1.5">
              <Wallet size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>

        {/* 4. Monthly Savings */}
        <div className="glass-card p-3.5 sm:p-5 relative overflow-hidden group hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider truncate">
                  Monthly Savings
                </p>
                {monthlySummary.dedicatedSavings > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                    Vault
                  </span>
                )}
              </div>
              <p
                className={`text-lg sm:text-2xl font-bold mt-1 tabular-nums truncate ${
                  monthlySummary.monthlySavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {monthlySummary.dedicatedSavings > 0
                  ? formatINR(monthlySummary.dedicatedSavings)
                  : formatINR(monthlySummary.monthlySavings)}
              </p>
              <div className="mt-1.5 text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block">
                {monthlySummary.dedicatedSavings > 0 ? (
                  <p className="text-purple-300/90 text-[10px] truncate" title={`Dedicated Vault: ${formatINR(monthlySummary.dedicatedSavings)} + Unspent Balance: ${formatINR(monthlySummary.spendableBalance)}`}>
                    + {formatINR(monthlySummary.spendableBalance)} unspent (Total: {formatINR(monthlySummary.monthlySavings)})
                  </p>
                ) : (
                  <p>Rate: <span className="font-semibold text-emerald-400">{monthlySummary.savingsRate}%</span></p>
                )}
              </div>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-xl border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex-shrink-0 ml-1.5">
              <PiggyBank size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>

        {/* 5. Budget Remaining */}
        <div className="glass-card p-3.5 sm:p-5 relative overflow-hidden group hover:border-zinc-700/80 transition-all col-span-2 lg:col-span-1">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider truncate">
                Budget Remaining
              </p>
              <p
                className={`text-lg sm:text-2xl font-bold mt-1 tabular-nums truncate ${
                  monthlySummary.overallBudget > 0
                    ? monthlySummary.budgetRemaining >= 0
                      ? 'text-amber-400'
                      : 'text-rose-400'
                    : 'text-zinc-500'
                }`}
              >
                {monthlySummary.overallBudget > 0
                  ? formatINR(monthlySummary.budgetRemaining)
                  : 'No Limit'}
              </p>
              <div className="mt-1">
                {monthlySummary.overallBudget > 0 ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${budgetAlert.badgeClass}`}
                  >
                    {budgetAlert.label} ({monthlySummary.budgetUtilization}%)
                  </span>
                ) : (
                  <button
                    onClick={() => setIsBudgetModalOpen(true)}
                    className="text-[10px] sm:text-[11px] text-emerald-400 hover:underline"
                  >
                    Set monthly budget
                  </button>
                )}
              </div>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-xl border bg-amber-500/10 text-amber-400 border-amber-500/20 flex-shrink-0 ml-1.5">
              <Target size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Account Balance Quick Cards (Section 8) ── */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100">Tracked Accounts</h3>
            <p className="text-[10px] sm:text-xs text-zinc-500">Live balances carried forward across months</p>
          </div>
          <Link
            to="/expense/accounts"
            className="text-[11px] sm:text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            Manage <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {accountSummaries.map((summary) => {
            const isSavingsVault = summary.isSavings || summary.account.isSavings;
            return (
              <div
                key={summary.account.id}
                className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white border flex-shrink-0"
                    style={{
                      backgroundColor: `${summary.account.color || '#10B981'}15`,
                      borderColor: `${summary.account.color || '#10B981'}30`,
                      color: summary.account.color || '#10B981',
                    }}
                  >
                    {summary.account.type === 'cash' ? (
                      <Banknote size={16} />
                    ) : summary.account.type === 'upi' ? (
                      <Smartphone size={16} />
                    ) : (
                      <CreditCard size={16} />
                    )}
                  </div>
                  <div className="truncate min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{summary.account.name}</p>
                      {isSavingsVault ? (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                          Vault
                        </span>
                      ) : (
                        <span className="px-1 py-0.2 rounded text-[8px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Spending
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 capitalize">{summary.account.type}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm font-bold text-zinc-100 tabular-nums">
                    {formatINR(summary.currentBalance)}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Open: {formatINR(summary.account.openingBalance)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Charts Grid (Section 3.B) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 glass-card p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100">Monthly Spending & Income Trends</h3>
              <p className="text-[10px] sm:text-xs text-zinc-500">Comparison across the last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] sm:text-xs">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Expenses
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Savings
              </span>
            </div>
          </div>

          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" stroke="#71717a" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="#71717a"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [formatINR(Number(val)), '']}
                />
                <Bar dataKey="Income" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Expenses" fill="#EF4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Savings" fill="#0EA5E9" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100">Category Breakdown</h3>
              <p className="text-[10px] sm:text-xs text-zinc-500">Net expenses for {formatMonthYear(selectedMonthYear)}</p>
            </div>
          </div>

          {categoryPieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="h-44 sm:h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val: any) => [formatINR(Number(val)), 'Spent']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Category List */}
              <div className="w-full space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                {categoryPieData.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-semibold text-zinc-200 tabular-nums">
                      {formatINR(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs text-zinc-500">No expenses recorded for this month.</p>
              <p className="text-[11px] text-zinc-600 mt-1">
                Add an expense to view category distribution.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Spending Trend Chart */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100">Daily Spending Trend</h3>
            <p className="text-[10px] sm:text-xs text-zinc-500">Daily outflow in {formatMonthYear(selectedMonthYear)}</p>
          </div>
        </div>

        <div className="h-44 sm:h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySpendingData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis
                stroke="#71717a"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: any) => [formatINR(Number(val)), 'Spent']}
                labelFormatter={(label) => `Day ${label}`}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 1.5, fill: '#10B981' }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Transactions (Section 3.C) ── */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100">Recent Transactions</h3>
            <p className="text-[10px] sm:text-xs text-zinc-500">Latest recorded income, expenses, and transfers</p>
          </div>
          <Link
            to="/expense/transactions"
            className="text-[11px] sm:text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            View All ({transactions.length}) <ArrowRight size={13} />
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <>
            {/* Mobile Card Feed (md:hidden) */}
            <div className="md:hidden space-y-2.5">
              {recentTransactions.map((tx) => {
                const cat = categories.find((c) => c.id === tx.categoryId);
                const acc = accounts.find((a) => a.id === tx.accountId);
                const isExpense = tx.type === 'expense';
                const isIncome = tx.type === 'income';
                const isRefund = tx.type === 'refund';

                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${isIncome ? '#10B981' : cat?.color || '#10B981'}15`,
                          color: isIncome ? '#10B981' : cat?.color || '#10B981',
                        }}
                      >
                        <CategoryIcon name={isIncome ? 'TrendingUp' : cat?.icon || 'Tag'} size={15} />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-zinc-200 truncate">{tx.title}</p>
                        <p className="text-[10px] text-zinc-500">
                          {tx.date} • {acc?.name || 'Account'} •{' '}
                          <span className="text-zinc-400">
                            {tx.categoryId === 'salary' ? 'Salary' : isIncome ? 'Income' : cat?.name || 'General'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-xs font-bold tabular-nums ${
                          isIncome
                            ? 'text-emerald-400'
                            : isExpense
                            ? 'text-rose-400'
                            : isRefund
                            ? 'text-purple-400'
                            : 'text-blue-400'
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
                          className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 justify-end mt-0.5 ml-auto"
                        >
                          <FileText size={10} /> Receipt
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {recentTransactions.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.categoryId);
                    const acc = accounts.find((a) => a.id === tx.accountId);
                    const isExpense = tx.type === 'expense';
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    const isRefund = tx.type === 'refund';

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-zinc-800/40 transition-colors group"
                      >
                        <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-zinc-200">{tx.title}</div>
                          {tx.description && (
                            <div className="text-[10px] text-zinc-500 truncate max-w-xs">
                              {tx.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 text-[11px]">
                            <CategoryIcon name={isIncome ? 'TrendingUp' : cat?.icon || 'Tag'} size={12} />
                            <span>
                              {tx.categoryId === 'salary'
                                ? 'Salary'
                                : isIncome
                                ? 'Income'
                                : cat?.name || 'General'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                          {acc?.name || 'Account'}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-bold">
                          <span
                            className={
                              isIncome
                                ? 'text-emerald-400'
                                : isExpense
                                ? 'text-rose-400'
                                : isRefund
                                ? 'text-purple-400'
                                : 'text-blue-400'
                            }
                          >
                            {isIncome && '+'}
                            {isExpense && '-'}
                            {isRefund && '+'}
                            {formatINR(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {tx.receiptUrl ? (
                            <button
                              onClick={() => {
                                setActiveReceiptUrl(tx.receiptUrl || '');
                                setActiveReceiptName(tx.receiptName || 'Receipt');
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-emerald-400 transition-colors"
                              title="View receipt"
                            >
                              <FileText size={15} />
                            </button>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <p className="text-xs text-zinc-500">No transactions recorded yet.</p>
          </div>
        )}
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
    </div>
  );
};
