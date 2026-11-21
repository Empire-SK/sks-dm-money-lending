import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Target, AlertCircle, Sparkles } from 'lucide-react';
import { useExpense } from '../../contexts/ExpenseContext';
import { MonthlyBudget } from '../../types/expense';
import { CategoryIcon } from './CategoryIcon';
import {
  formatINR,
  roundCurrency,
  formatIndianNumber,
  parseIndianNumber,
} from '../../utils/expenseCalculations';
import { getInitializedDefaultCategories } from '../../utils/defaultExpenseData';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMonthYear?: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  targetMonthYear,
}) => {
  const {
    categories,
    budgets,
    selectedMonthYear,
    monthlySummary,
    handleSaveBudget,
  } = useExpense();

  const activeMonthYear = targetMonthYear || selectedMonthYear;

  const fallbackCategories = useMemo(() => getInitializedDefaultCategories(), []);
  const activeCategories = useMemo(() => {
    return categories && categories.length > 0 ? categories : fallbackCategories;
  }, [categories, fallbackCategories]);

  const [overallBudget, setOverallBudget] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const existing = budgets.find((b) => b.monthYear === activeMonthYear);
    if (existing) {
      setOverallBudget(existing.overallBudget ? formatIndianNumber(existing.overallBudget) : '');
      const strMap: Record<string, string> = {};
      Object.entries(existing.categoryBudgets || {}).forEach(([catId, val]) => {
        strMap[catId] = val ? formatIndianNumber(val as number) : '';
      });
      setCategoryBudgets(strMap);
    } else {
      setOverallBudget('');
      setCategoryBudgets({});
    }
    setError('');
  }, [activeMonthYear, budgets, isOpen]);

  const handleCategoryBudgetChange = (catId: string, val: string) => {
    setCategoryBudgets((prev) => ({
      ...prev,
      [catId]: formatIndianNumber(val),
    }));
  };

  const totalCategoryAllocated = Object.values(categoryBudgets).reduce<number>((sum, val) => {
    return sum + parseIndianNumber(val as string);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSubmittingRef.current) return;
    setError('');

    const overallNum = parseIndianNumber(overallBudget);
    if (overallNum < 0) {
      setError('Please provide a valid overall budget amount.');
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      const parsedCatBudgets: Record<string, number> = {};
      Object.entries(categoryBudgets).forEach(([catId, val]) => {
        const num = parseIndianNumber(val as string);
        if (!isNaN(num) && num > 0) {
          parsedCatBudgets[catId] = roundCurrency(num);
        }
      });

      await handleSaveBudget(activeMonthYear, overallNum, parsedCatBudgets);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save budget settings.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Configure Budget ({activeMonthYear})
              </h2>
              <p className="text-xs text-zinc-500">
                Set overall monthly limit and individual category limits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="modal-body space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Overall Monthly Budget */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <label className="label-base text-emerald-400">Total Monthly Spending Budget (₹) *</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-semibold">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="e.g. 15,000"
                  value={overallBudget}
                  onChange={(e) => setOverallBudget(formatIndianNumber(e.target.value))}
                  className="input-base pl-8 text-lg font-bold tabular-nums"
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-500">
                <span>Sum of category limits: {formatINR(totalCategoryAllocated)}</span>
                <span>Current net expenses: {formatINR(monthlySummary.netExpenses)}</span>
              </div>
            </div>

            {/* Category Budgets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label-base">Category Spending Limits (Optional)</label>
                <span className="text-[10px] text-zinc-500">Limits apply to {activeMonthYear}</span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {activeCategories.map((cat) => {
                  const spent = monthlySummary.categorySpending[cat.id] || 0;
                  const currentVal = categoryBudgets[cat.id] || '';

                  return (
                    <div
                      key={cat.id}
                      className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${cat.color || '#10B981'}15`,
                            color: cat.color || '#10B981',
                          }}
                        >
                          <CategoryIcon name={cat.icon} size={15} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-zinc-200 truncate">
                            {cat.name}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            Spent so far: <span className="text-zinc-300 font-medium">{formatINR(spent)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="w-28 flex-shrink-0 relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs text-zinc-600 font-semibold">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Limit"
                          value={currentVal}
                          onChange={(e) => handleCategoryBudgetChange(cat.id, e.target.value)}
                          className="input-base pl-6 py-1.5 text-xs text-right font-medium tabular-nums"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : 'Save Budget'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
