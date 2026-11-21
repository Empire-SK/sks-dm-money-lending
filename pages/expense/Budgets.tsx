import React, { useState, useMemo } from 'react';
import {
  Target,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { useExpense } from '../../contexts/ExpenseContext';
import { ExpenseNav } from '../../components/expense/ExpenseNav';
import { CategoryIcon } from '../../components/expense/CategoryIcon';
import { BudgetModal } from '../../components/expense/BudgetModal';
import {
  formatINR,
  formatMonthYear,
  getBudgetAlertStatus,
  roundCurrency,
} from '../../utils/expenseCalculations';

export const Budgets: React.FC = () => {
  const {
    categories,
    budgets,
    selectedMonthYear,
    monthlySummary,
  } = useExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Active budget configuration for current selected month
  const activeBudget = useMemo(() => {
    return budgets.find((b) => b.monthYear === selectedMonthYear) || null;
  }, [budgets, selectedMonthYear]);

  // Overall budget metrics
  const overallBudget = roundCurrency(activeBudget?.overallBudget || 0);
  const overallSpent = monthlySummary.netExpenses;
  const overallRemaining = roundCurrency(overallBudget - overallSpent);
  const overallAlert = getBudgetAlertStatus(overallSpent, overallBudget);

  // Category breakdown list
  const categoryBudgetRows = useMemo(() => {
    const map = activeBudget?.categoryBudgets || {};
    return categories.map((cat) => {
      const budgetVal = roundCurrency(map[cat.id] || 0);
      const spentVal = roundCurrency(monthlySummary.categorySpending[cat.id] || 0);
      const remainingVal = roundCurrency(budgetVal - spentVal);
      const alert = getBudgetAlertStatus(spentVal, budgetVal);
      const progressPercent = budgetVal > 0 ? Math.min(100, Math.round((spentVal / budgetVal) * 100)) : 0;

      return {
        category: cat,
        budget: budgetVal,
        spent: spentVal,
        remaining: remainingVal,
        percent: progressPercent,
        alert,
      };
    });
  }, [categories, activeBudget, monthlySummary.categorySpending]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <ExpenseNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
            Monthly Budget Management ({formatMonthYear(selectedMonthYear)})
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-700 dark:text-zinc-400 font-semibold">
            Set and track spending limits across categories to control your outflow
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary text-xs py-2 px-3 self-start sm:self-auto"
        >
          <Edit2 size={14} />
          <span>{activeBudget ? 'Edit Budget Settings' : 'Set Monthly Budget'}</span>
        </button>
      </div>

      {/* ── Section A: Overall Budget Card ── */}
      <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-400">
                Overall Spending Limit
              </span>
              {overallBudget > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${overallAlert.badgeClass}`}>
                  {overallAlert.label} ({overallAlert.percentage}%)
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 sm:gap-3 mt-1.5 sm:mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tabular-nums">
                {overallBudget > 0 ? formatINR(overallBudget) : 'No Budget Set'}
              </span>
              <span className="text-xs text-slate-600 dark:text-zinc-400 font-semibold">monthly maximum</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-zinc-950 rounded-full h-3 mt-3 sm:mt-4 p-0.5 border border-slate-300 dark:border-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallAlert.status === 'exceeded'
                    ? 'bg-rose-500'
                    : overallAlert.status === 'high_warning'
                    ? 'bg-amber-500'
                    : overallAlert.status === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, overallAlert.percentage || 0)}%` }}
              />
            </div>

            {/* Sub-metrics */}
            <div className="grid grid-cols-3 gap-2 mt-3 sm:mt-4 text-xs">
              <div>
                <p className="text-slate-600 dark:text-zinc-400 text-[11px] font-bold">Spent</p>
                <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                  {formatINR(overallSpent)}
                </p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-zinc-400 text-[11px] font-bold">Remaining</p>
                <p
                  className={`text-xs sm:text-sm font-bold tabular-nums mt-0.5 ${
                    overallRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatINR(overallRemaining)}
                </p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-zinc-400 text-[11px] font-bold">Used</p>
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-zinc-200 tabular-nums mt-0.5">
                  {overallBudget > 0 ? `${overallAlert.percentage}%` : '0%'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center min-w-[180px] shadow-sm dark:shadow-none">
            <Target size={26} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-900 dark:text-zinc-300">Monthly Reset Rule</p>
            <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 font-medium">
              Budgets reset cleanly each month with independent limits.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section B: Category-wise Budgets ── */}
      <div className="glass-card overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-zinc-800/80">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">Category-Wise Spending Limits</h3>
          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-zinc-400 font-semibold">Refunds automatically reduce category net spending</p>
        </div>

        {/* Mobile View: Card-based list (md:hidden) */}
        <div className="md:hidden divide-y divide-zinc-800/60">
          {categoryBudgetRows.map((row) => (
            <div key={row.category.id} className="p-3.5 space-y-2 hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${row.category.color}15`,
                      color: row.category.color,
                    }}
                  >
                    <CategoryIcon name={row.category.icon} size={14} />
                  </div>
                  <span className="text-xs font-bold text-zinc-200">{row.category.name}</span>
                </div>

                {row.budget > 0 ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${row.alert.badgeClass}`}>
                    {row.alert.label}
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-600">No Limit</span>
                )}
              </div>

              {row.budget > 0 && (
                <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      row.alert.status === 'exceeded'
                        ? 'bg-rose-500'
                        : row.alert.status === 'high_warning'
                        ? 'bg-amber-500'
                        : row.alert.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, row.alert.percentage)}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-zinc-500">
                  Spent: <span className="font-semibold text-rose-400">{formatINR(row.spent)}</span>
                </span>
                <span className="text-zinc-500">
                  Budget: <span className="font-semibold text-zinc-300">{row.budget > 0 ? formatINR(row.budget) : '—'}</span>
                </span>
                <span className="text-zinc-500">
                  Left: <span className={`font-semibold ${row.budget > 0 ? (row.remaining >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-zinc-500'}`}>
                    {row.budget > 0 ? formatINR(row.remaining) : '—'}
                  </span>
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
                <th className="py-3 px-4 text-right">Budget Limit</th>
                <th className="py-3 px-4 text-right">Spent</th>
                <th className="py-3 px-4 text-right">Remaining</th>
                <th className="py-3 px-4 text-center">Progress</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {categoryBudgetRows.map((row) => (
                <tr key={row.category.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${row.category.color}15`,
                          color: row.category.color,
                        }}
                      >
                        <CategoryIcon name={row.category.icon} size={15} />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-zinc-200">{row.category.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap text-slate-900 dark:text-zinc-300 font-bold">
                    {row.budget > 0 ? formatINR(row.budget) : <span className="text-slate-500 dark:text-zinc-500 font-normal">No Limit</span>}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">
                    {formatINR(row.spent)}
                  </td>

                  <td
                    className={`py-3 px-4 text-right whitespace-nowrap font-bold ${
                      row.budget > 0
                        ? row.remaining >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500 dark:text-zinc-500'
                    }`}
                  >
                    {row.budget > 0 ? formatINR(row.remaining) : '-'}
                  </td>

                  <td className="py-3 px-4 min-w-[140px]">
                    {row.budget > 0 ? (
                      <div className="w-full bg-slate-200 dark:bg-zinc-950 rounded-full h-2 border border-slate-300 dark:border-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.alert.status === 'exceeded'
                              ? 'bg-rose-500'
                              : row.alert.status === 'high_warning'
                              ? 'bg-amber-500'
                              : row.alert.status === 'warning'
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, row.alert.percentage)}%` }}
                        />
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 dark:text-zinc-600">-</div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {row.budget > 0 ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${row.alert.badgeClass}`}>
                        {row.alert.label}
                      </span>
                    ) : (
                      <span className="text-zinc-600">Unrestricted</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetMonthYear={selectedMonthYear}
      />
    </div>
  );
};
