import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Smartphone, Landmark, AlertCircle, PiggyBank, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useExpense } from '../../contexts/ExpenseContext';
import { ExpenseAccount, AccountType } from '../../types/expense';
import { formatIndianNumber, parseIndianNumber } from '../../utils/expenseCalculations';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ExpenseAccount | null;
}

const PRESET_COLORS = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#14B8A6', // teal
  '#71717A', // zinc
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { currentUser } = useAuth();
  const { handleAddAccount, handleEditAccount } = useExpense();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('upi');
  const [isSavings, setIsSavings] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setIsSavings(
        typeof initialData.isSavings === 'boolean'
          ? initialData.isSavings
          : /saving|emergency|deposit|fd|rd|vault|federal/i.test(initialData.name)
      );
      setOpeningBalance(initialData.openingBalance ? formatIndianNumber(initialData.openingBalance) : '0');
      setColor(initialData.color || PRESET_COLORS[0]);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setType('upi');
      setIsSavings(false);
      setOpeningBalance('0');
      setColor(PRESET_COLORS[0]);
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide an account name.');
      return;
    }

    const numBalance = parseIndianNumber(openingBalance);
    if (isNaN(numBalance)) {
      setError('Please provide a valid opening balance (e.g. 0).');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        userId: currentUser?.uid || '',
        name: name.trim(),
        type,
        isSavings,
        openingBalance: numBalance,
        color,
        notes: notes.trim() || undefined,
      };

      if (initialData) {
        await handleEditAccount({ ...initialData, ...payload });
      } else {
        await handleAddAccount(payload);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {initialData ? 'Edit Account' : 'Add New Account'}
              </h2>
              <p className="text-xs text-zinc-500">
                Manage your Cash, UPI, and bank balances
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

            <div>
              <label className="label-base">Account Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. My UPI (GPay), Cash Wallet, HDFC"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="label-base">Account Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'upi', 'bank'] as AccountType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      type === t
                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t === 'cash' && <Banknote size={14} />}
                    {t === 'upi' && <Smartphone size={14} />}
                    {t === 'bank' && <Landmark size={14} />}
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Purpose / Role */}
            <div>
              <label className="label-base">Account Purpose & Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsSavings(false)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    !isSavings
                      ? 'bg-emerald-600/15 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-200">
                    <Wallet size={14} className={!isSavings ? 'text-emerald-400' : 'text-zinc-500'} />
                    <span>Daily Spending</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                    Liquid account for day-to-day spending. Included in spendable balance.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSavings(true)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSavings
                      ? 'bg-purple-600/15 text-purple-300 border-purple-500/40 ring-1 ring-purple-500/30'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-200">
                    <PiggyBank size={14} className={isSavings ? 'text-purple-400' : 'text-zinc-500'} />
                    <span>Savings Vault</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                    Dedicated savings or emergency vault. Kept safe from spendable cash.
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="label-base">Opening Balance (₹) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-semibold">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(formatIndianNumber(e.target.value))}
                  className="input-base pl-8 font-semibold tabular-nums"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Enter your starting balance or reconcile anytime. Real inflows & outflows will adjust the current balance.
              </p>
            </div>

            {/* Color Accent */}
            <div>
              <label className="label-base">Color Theme</label>
              <div className="flex items-center gap-2 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="label-base">Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Account details, bank branch or UPI ID..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-base resize-none"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Account'}
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
