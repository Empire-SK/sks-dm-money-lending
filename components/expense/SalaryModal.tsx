import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Calendar, AlertCircle, Coins, Award, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useExpense } from '../../contexts/ExpenseContext';
import { SalaryRecord } from '../../types/expense';
import { formatINR, roundCurrency } from '../../utils/expenseCalculations';
import { getInitializedDefaultAccounts } from '../../utils/defaultExpenseData';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SalaryRecord | null;
}

export const SalaryModal: React.FC<SalaryModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { currentUser } = useAuth();
  const {
    accounts,
    salaryRecords,
    selectedMonthYear,
    handleAddSalary,
    handleEditSalary,
  } = useExpense();

  const fallbackAccounts = useMemo(() => getInitializedDefaultAccounts(), []);
  const activeAccounts = useMemo(() => {
    return accounts && accounts.length > 0 ? accounts : fallbackAccounts;
  }, [accounts, fallbackAccounts]);

  const [monthYear, setMonthYear] = useState(selectedMonthYear);
  const [baseSalary, setBaseSalary] = useState('');
  const [bonus, setBonus] = useState('');
  const [incentive, setIncentive] = useState('');
  const [otherIncome, setOtherIncome] = useState('');
  const [accountId, setAccountId] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setMonthYear(initialData.monthYear);
      setBaseSalary(String(initialData.baseSalary || ''));
      setBonus(initialData.bonus ? String(initialData.bonus) : '');
      setIncentive(initialData.incentive ? String(initialData.incentive) : '');
      setOtherIncome(initialData.otherIncome ? String(initialData.otherIncome) : '');
      setAccountId(initialData.accountId || (activeAccounts[0]?.id ?? ''));
      setReceivedDate(initialData.receivedDate || new Date().toISOString().slice(0, 10));
      setNote(initialData.note || '');
    } else {
      setMonthYear(selectedMonthYear);
      setBaseSalary('');
      setBonus('');
      setIncentive('');
      setOtherIncome('');
      setAccountId(activeAccounts[0]?.id ?? '');
      setReceivedDate(new Date().toISOString().slice(0, 10));
      setNote('');
    }
    setError('');
  }, [initialData, selectedMonthYear, isOpen, activeAccounts]);

  // Calculated live total
  const calculatedTotal = roundCurrency(
    (parseFloat(baseSalary) || 0) +
    (parseFloat(bonus) || 0) +
    (parseFloat(incentive) || 0) +
    (parseFloat(otherIncome) || 0)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const baseNum = parseFloat(baseSalary);
    if (isNaN(baseNum) || baseNum < 0) {
      setError('Please enter a valid base salary (0 or greater).');
      return;
    }

    const effectiveAccountId = accountId || activeAccounts[0]?.id;
    if (!effectiveAccountId) {
      setError('Please select an account where salary was credited.');
      return;
    }

    if (!monthYear) {
      setError('Please select month and year.');
      return;
    }

    // Check duplicate month unless editing
    if (!initialData) {
      const isDuplicate = salaryRecords.some((s) => s.monthYear === monthYear);
      if (isDuplicate) {
        setError(`A salary entry for ${monthYear} already exists. Please edit that record or change the month.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const payload = {
        userId: currentUser?.uid || 'default',
        monthYear,
        baseSalary: baseNum,
        bonus: parseFloat(bonus) || 0,
        incentive: parseFloat(incentive) || 0,
        otherIncome: parseFloat(otherIncome) || 0,
        accountId: effectiveAccountId,
        receivedDate,
        note: note.trim() || undefined,
      };

      if (initialData) {
        await handleEditSalary({ ...initialData, ...payload, totalIncome: calculatedTotal });
      } else {
        await handleAddSalary(payload);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save salary record.');
    } finally {
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
              <Coins size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {initialData ? 'Edit Salary Record' : 'Record Monthly Salary'}
              </h2>
              <p className="text-xs text-zinc-500">
                Track base salary, bonuses, incentives, and other earnings
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

            {/* Total Income Preview Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-zinc-900 border border-emerald-500/25 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/80">
                  Total Monthly Income
                </p>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {formatINR(calculatedTotal)}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <Sparkles size={22} />
              </div>
            </div>

            {/* Month & Received Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Salary Month (YYYY-MM) *</label>
                <input
                  type="month"
                  required
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="label-base">Received Date *</label>
                <input
                  type="date"
                  required
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="input-base"
                />
              </div>
            </div>

            {/* Base Salary & Bonus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Base Salary (₹) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="25000"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="input-base pl-8 font-semibold text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="label-base">Bonus (₹)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    className="input-base pl-8 font-semibold text-zinc-100"
                  />
                </div>
              </div>
            </div>

            {/* Incentive & Other Income */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Incentives (₹)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={incentive}
                    onChange={(e) => setIncentive(e.target.value)}
                    className="input-base pl-8 font-semibold text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="label-base">Other Income (₹)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={otherIncome}
                    onChange={(e) => setOtherIncome(e.target.value)}
                    className="input-base pl-8 font-semibold text-zinc-100"
                  />
                </div>
              </div>
            </div>

            {/* Destination Account */}
            <div>
              <label className="label-base">Credited Account (e.g. UPI / Cash) *</label>
              <select
                value={accountId || activeAccounts[0]?.id || ''}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="input-base"
              >
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-zinc-900 text-zinc-100 py-1">
                    {acc.name} ({acc.type.toUpperCase()})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 mt-1">
                The total income will be credited to this account balance.
              </p>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="label-base">Additional Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Annual performance bonus included, project incentives..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input-base resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Salary' : 'Save Salary'}
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
