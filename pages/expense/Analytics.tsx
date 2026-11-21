import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  FileDown,
  PieChart as PieIcon,
  Flame,
  ShieldCheck,
  Percent,
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
  Legend,
} from 'recharts';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { useExpense } from '../../contexts/ExpenseContext';
import { ExpenseNav } from '../../components/expense/ExpenseNav';
import { CategoryIcon } from '../../components/expense/CategoryIcon';
import {
  formatINR,
  formatMonthYear,
  calculateMonthlySummary,
  roundCurrency,
} from '../../utils/expenseCalculations';

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid rgba(63,63,70,0.8)',
  backgroundColor: 'rgba(24,24,27,0.95)',
  backdropFilter: 'blur(12px)',
  color: '#e4e4e7',
  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
  padding: '8px 12px',
};

export const Analytics: React.FC = () => {
  const {
    categories,
    transactions,
    salaryRecords,
    budgets,
    selectedMonthYear,
    monthlySummary,
  } = useExpense();

  // Previous Month's MonthYear
  const prevMonthYear = useMemo(() => {
    const [year, month] = selectedMonthYear.split('-');
    const prevDate = new Date(parseInt(year, 10), parseInt(month, 10) - 2, 1);
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonthYear]);

  // Previous month summary
  const prevMonthlySummary = useMemo(() => {
    const prevBudget = budgets.find((b) => b.monthYear === prevMonthYear) || null;
    return calculateMonthlySummary(prevMonthYear, transactions, salaryRecords, prevBudget);
  }, [prevMonthYear, transactions, salaryRecords, budgets]);

  // Month-over-month differences
  const momDiff = useMemo(() => {
    const incomeDiff = roundCurrency(monthlySummary.totalIncome - prevMonthlySummary.totalIncome);
    const expenseDiff = roundCurrency(monthlySummary.netExpenses - prevMonthlySummary.netExpenses);
    const savingsDiff = roundCurrency(monthlySummary.monthlySavings - prevMonthlySummary.monthlySavings);

    const incomePercent = prevMonthlySummary.totalIncome > 0
      ? roundCurrency((incomeDiff / prevMonthlySummary.totalIncome) * 100)
      : 0;
    const expensePercent = prevMonthlySummary.netExpenses > 0
      ? roundCurrency((expenseDiff / prevMonthlySummary.netExpenses) * 100)
      : 0;

    return {
      incomeDiff,
      incomePercent,
      expenseDiff,
      expensePercent,
      savingsDiff,
    };
  }, [monthlySummary, prevMonthlySummary]);

  // Days in selected month
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonthYear.split('-');
    return new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
  }, [selectedMonthYear]);

  // Average daily spending
  const avgDailySpending = roundCurrency(
    daysInMonth > 0 ? monthlySummary.netExpenses / daysInMonth : 0
  );

  // Category breakdown table with count, percentage, and mom comparison
  const categoryAnalytics = useMemo(() => {
    const monthTx = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(selectedMonthYear)
    );

    return categories.map((cat) => {
      const currentSpent = monthlySummary.categorySpending[cat.id] || 0;
      const prevSpent = prevMonthlySummary.categorySpending[cat.id] || 0;
      const txCount = monthTx.filter((t) => t.categoryId === cat.id).length;
      const percentOfTotal =
        monthlySummary.netExpenses > 0
          ? roundCurrency((currentSpent / monthlySummary.netExpenses) * 100)
          : 0;
      const diff = roundCurrency(currentSpent - prevSpent);

      return {
        category: cat,
        currentSpent,
        prevSpent,
        txCount,
        percentOfTotal,
        diff,
      };
    }).sort((a, b) => b.currentSpent - a.currentSpent);
  }, [categories, monthlySummary, prevMonthlySummary, transactions, selectedMonthYear]);

  // Highest and lowest spending categories
  const activeCategories = categoryAnalytics.filter((c) => c.currentSpent > 0);
  const highestCategory = activeCategories[0] || null;
  const lowestCategory = activeCategories.length > 1 ? activeCategories[activeCategories.length - 1] : null;

  // 6 Month Trend chart
  const sixMonthTrend = useMemo(() => {
    const list = [];
    const [curYear, curMonth] = selectedMonthYear.split('-');
    const curDate = new Date(parseInt(curYear, 10), parseInt(curMonth, 10) - 1, 1);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(curDate.getFullYear(), curDate.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleString('en-IN', { month: 'short' });
      const b = budgets.find((item) => item.monthYear === ym) || null;
      const s = calculateMonthlySummary(ym, transactions, salaryRecords, b);
      list.push({
        month: name,
        Income: s.totalIncome,
        Expenses: s.netExpenses,
        Savings: s.monthlySavings,
      });
    }
    return list;
  }, [selectedMonthYear, transactions, salaryRecords, budgets]);

  // PDF Export
  const handleExportPDF = () => {
    const element = document.getElementById('analytics-report-container');
    if (!element) return;

    const opt = {
      margin: 8,
      filename: `SKS_Financial_Analytics_${selectedMonthYear}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#09090b' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    };

    html2pdf().set(opt).from(element).save();
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Category', 'Current Month Spent', 'Previous Month Spent', 'Difference', '% of Total', 'Transactions'];
    const rows = categoryAnalytics.map((c) => [
      `"${c.category.name.replace(/"/g, '""')}"`,
      c.currentSpent,
      c.prevSpent,
      c.diff,
      `${c.percentOfTotal}%`,
      c.txCount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SKS_Category_Report_${selectedMonthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ExpenseNav />

      {/* Header and export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
            Financial Analytics & Spending Trends
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-700 dark:text-zinc-400 font-semibold">
            Comparing {formatMonthYear(selectedMonthYear)} vs {formatMonthYear(prevMonthYear)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="btn-secondary text-xs py-2 px-2.5 sm:px-3 hover:text-emerald-400"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="btn-primary text-xs py-2 px-3"
          >
            <FileDown size={14} />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      <div id="analytics-report-container" className="space-y-4 sm:space-y-6">
        {/* ── Key Metrics Overview ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="glass-card p-3.5 sm:p-4">
            <p className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              Avg Daily Spending
            </p>
            <p className="text-lg sm:text-2xl font-black mt-1 text-slate-900 dark:text-zinc-100 tabular-nums truncate">
              {formatINR(avgDailySpending)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate font-medium">{daysInMonth} days in month</p>
          </div>

          <div className="glass-card p-3.5 sm:p-4">
            <p className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              Top Category
            </p>
            <p className="text-sm sm:text-lg font-bold mt-1 text-rose-600 dark:text-rose-400 truncate">
              {highestCategory ? highestCategory.category.name : 'None'}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate font-medium">
              {highestCategory ? `${formatINR(highestCategory.currentSpent)} (${highestCategory.percentOfTotal}%)` : 'No data'}
            </p>
          </div>

          <div className="glass-card p-3.5 sm:p-4">
            <p className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              Lowest Category
            </p>
            <p className="text-sm sm:text-lg font-bold mt-1 text-emerald-600 dark:text-emerald-400 truncate">
              {lowestCategory ? lowestCategory.category.name : 'None'}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate font-medium">
              {lowestCategory ? `${formatINR(lowestCategory.currentSpent)} (${lowestCategory.percentOfTotal}%)` : 'No data'}
            </p>
          </div>

          <div className="glass-card p-3.5 sm:p-4">
            <p className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              Savings Rate
            </p>
            <p className="text-lg sm:text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
              {monthlySummary.savingsRate}%
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate font-medium">
              {formatINR(monthlySummary.monthlySavings)} saved
            </p>
          </div>
        </div>

        {/* ── Month-over-Month Comparison Cards ── */}
        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 mb-3">
            Month-over-Month Comparison ({formatMonthYear(selectedMonthYear)} vs {formatMonthYear(prevMonthYear)})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Income MoM */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-zinc-400 font-bold uppercase">Income Change</p>
              <div className="flex items-baseline justify-between mt-1.5">
                <p className="text-base sm:text-xl font-black text-slate-900 dark:text-zinc-100 tabular-nums">
                  {formatINR(monthlySummary.totalIncome)}
                </p>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                    momDiff.incomeDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {momDiff.incomeDiff >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {formatINR(Math.abs(momDiff.incomeDiff))} ({momDiff.incomePercent}%)
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 font-medium">Previous: {formatINR(prevMonthlySummary.totalIncome)}</p>
            </div>

            {/* Expenses MoM */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-zinc-400 font-bold uppercase">Expense Change</p>
              <div className="flex items-baseline justify-between mt-1.5">
                <p className="text-base sm:text-xl font-black text-slate-900 dark:text-zinc-100 tabular-nums">
                  {formatINR(monthlySummary.netExpenses)}
                </p>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                    momDiff.expenseDiff <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {momDiff.expenseDiff > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {formatINR(Math.abs(momDiff.expenseDiff))} ({momDiff.expensePercent}%)
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 font-medium">Previous: {formatINR(prevMonthlySummary.netExpenses)}</p>
            </div>

            {/* Savings MoM */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-zinc-400 font-bold uppercase">Savings Change</p>
              <div className="flex items-baseline justify-between mt-1.5">
                <p className="text-base sm:text-xl font-black text-slate-900 dark:text-zinc-100 tabular-nums">
                  {formatINR(monthlySummary.monthlySavings)}
                </p>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                    momDiff.savingsDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {momDiff.savingsDiff >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {formatINR(Math.abs(momDiff.savingsDiff))}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 font-medium">Previous: {formatINR(prevMonthlySummary.monthlySavings)}</p>
            </div>
          </div>
        </div>

        {/* ── 6-Month Comparison Chart ── */}
        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-100 mb-3 sm:mb-4">6-Month Trend Overview</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sixMonthTrend} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
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
                <Legend />
                <Line type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="Expenses" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Savings" stroke="#0EA5E9" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Category Detailed Analytics Table ── */}
        <div className="glass-card overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-zinc-800/80">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100">Category Analytics & Breakdown</h3>
          </div>

          {/* Mobile View: Card List (md:hidden) */}
          <div className="md:hidden divide-y divide-zinc-800/60">
            {categoryAnalytics.map((c) => (
              <div key={c.category.id} className="p-3.5 space-y-1.5 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${c.category.color}15`,
                        color: c.category.color,
                      }}
                    >
                      <CategoryIcon name={c.category.icon} size={14} />
                    </div>
                    <span className="text-xs font-bold text-zinc-200 truncate">{c.category.name}</span>
                  </div>

                  <span className="text-xs font-extrabold text-zinc-100 tabular-nums">
                    {formatINR(c.currentSpent)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Prev: {formatINR(c.prevSpent)}</span>
                  <span>Share: <strong className="text-zinc-300">{c.percentOfTotal}%</strong></span>
                  <span className={c.diff > 0 ? 'text-rose-400 font-semibold' : c.diff < 0 ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
                    {c.diff > 0 ? '+' : ''}{c.diff !== 0 ? formatINR(c.diff) : '0'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Full Table (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-slate-700 dark:text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Current Month</th>
                  <th className="py-3 px-4 text-right">Previous Month</th>
                  <th className="py-3 px-4 text-right">Change</th>
                  <th className="py-3 px-4 text-right">% of Total</th>
                  <th className="py-3 px-4 text-center">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {categoryAnalytics.map((c) => (
                  <tr key={c.category.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${c.category.color}15`,
                            color: c.category.color,
                          }}
                        >
                          <CategoryIcon name={c.category.icon} size={15} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-zinc-200">{c.category.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-black text-slate-900 dark:text-zinc-100">
                      {formatINR(c.currentSpent)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap text-slate-700 dark:text-zinc-400 font-medium">
                      {formatINR(c.prevSpent)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {c.diff !== 0 ? (
                        <span
                          className={`font-bold inline-flex items-center gap-0.5 ${
                            c.diff > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {c.diff > 0 ? '+' : ''}
                          {formatINR(c.diff)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-600">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-800 dark:text-zinc-300">
                      {c.percentOfTotal}%
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap text-slate-700 dark:text-zinc-400 font-semibold">
                      {c.txCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
