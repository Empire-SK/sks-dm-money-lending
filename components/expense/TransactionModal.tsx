import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Upload,
  FileText,
  Trash2,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  RotateCcw,
  AlertCircle,
  Eye,
  PiggyBank,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useExpense } from '../../contexts/ExpenseContext';
import { ExpenseTransaction, TransactionType, TransferCategory } from '../../types/expense';
import { uploadReceiptFile } from '../../services/receiptService';
import {
  formatIndianNumber,
  parseIndianNumber,
} from '../../utils/expenseCalculations';
import { AccountModal } from './AccountModal';
import {
  getInitializedDefaultAccounts,
  getInitializedDefaultCategories,
} from '../../utils/defaultExpenseData';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ExpenseTransaction | null;
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialData,
  defaultType = 'expense',
}) => {
  const { currentUser } = useAuth();
  const {
    accounts,
    categories,
    transactions,
    handleAddTransaction,
    handleEditTransaction,
  } = useExpense();

  // Robust active categories & accounts: NEVER empty
  const fallbackCategories = useMemo(() => getInitializedDefaultCategories(), []);
  const fallbackAccounts = useMemo(() => getInitializedDefaultAccounts(), []);

  const activeCategories = useMemo(() => {
    return categories && categories.length > 0 ? categories : fallbackCategories;
  }, [categories, fallbackCategories]);

  const activeAccounts = useMemo(() => {
    return accounts && accounts.length > 0 ? accounts : fallbackAccounts;
  }, [accounts, fallbackAccounts]);

  const [type, setType] = useState<TransactionType>(defaultType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferCategory, setTransferCategory] = useState<TransferCategory>('savings');
  const [originalTxId, setOriginalTxId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [error, setError] = useState('');

  // Populate initial data when editing or opening
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setAmount(initialData.amount ? formatIndianNumber(initialData.amount) : '');
      setCategoryId(initialData.categoryId || activeCategories[0]?.id || '');
      setSubcategory(initialData.subcategory || '');
      setAccountId(initialData.accountId || activeAccounts[0]?.id || '');
      setToAccountId(initialData.toAccountId || activeAccounts[1]?.id || '');
      setTransferCategory(
        initialData.transferCategory ||
        (initialData.isDedicatedSavings || /saving|emergency|invest|deposit|vault/i.test(initialData.title) ? 'savings' : 'general')
      );
      setOriginalTxId(initialData.originalTransactionId || '');
      setDate(initialData.date ? initialData.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');
      setReceiptUrl(initialData.receiptUrl || '');
      setReceiptName(initialData.receiptName || '');
    } else {
      setType(defaultType);
      setTitle(defaultType === 'transfer' ? 'Savings' : '');
      setAmount('');
      setCategoryId(activeCategories[0]?.id || '');
      setSubcategory('');
      setAccountId(activeAccounts[0]?.id || '');
      setToAccountId(activeAccounts[1]?.id || activeAccounts[0]?.id || '');
      setTransferCategory('savings');
      setOriginalTxId('');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setNotes('');
      setReceiptUrl('');
      setReceiptName('');
    }
    setError('');
  }, [initialData, defaultType, isOpen, activeCategories, activeAccounts]);

  // Selected category subcategories
  const selectedCategoryObj = activeCategories.find((c) => c.id === categoryId) || activeCategories[0];
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError('');
      const uid = currentUser?.uid || '';
      const result = await uploadReceiptFile(uid, file);
      setReceiptUrl(result.url);
      setReceiptName(result.fileName);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload receipt');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptUrl('');
    setReceiptName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseIndianNumber(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const effectiveAccountId = accountId || activeAccounts[0]?.id;
    if (!effectiveAccountId) {
      setError('Please select an account.');
      return;
    }

    if (type === 'transfer') {
      const effectiveToAccountId = toAccountId || activeAccounts[1]?.id || activeAccounts[0]?.id;
      if (!effectiveToAccountId) {
        setError('Please select a destination account for transfer.');
        return;
      }
      if (effectiveAccountId === effectiveToAccountId) {
        setError('Source and destination accounts must be different.');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const isDedicated = type === 'transfer' ? transferCategory !== 'general' : false;
      const effectiveCategoryId =
        type === 'transfer'
          ? (transferCategory || 'savings')
          : type === 'income'
          ? 'income'
          : (categoryId || activeCategories[0]?.id || 'cat_default_1');

      const txPayload = {
        userId: currentUser?.uid || '',
        type,
        title: title.trim() || (type === 'transfer' && transferCategory === 'savings' ? 'Savings' : `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`),
        amount: numAmount,
        categoryId: effectiveCategoryId,
        subcategory: (type === 'transfer' || type === 'income') ? undefined : subcategory.trim() || undefined,
        accountId: effectiveAccountId,
        toAccountId: type === 'transfer' ? (toAccountId || activeAccounts[1]?.id) : undefined,
        transferCategory: type === 'transfer' ? transferCategory : undefined,
        isDedicatedSavings: type === 'transfer' ? isDedicated : undefined,
        originalTransactionId: type === 'refund' && originalTxId ? originalTxId : undefined,
        date,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        receiptUrl: receiptUrl || undefined,
        receiptName: receiptName || undefined,
      };

      if (initialData) {
        await handleEditTransaction({ ...initialData, ...txPayload });
      } else {
        await handleAddTransaction(txPayload);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box max-w-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                type === 'expense'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : type === 'income'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : type === 'transfer'
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
              }`}
            >
              {type === 'expense' && <DollarSign size={18} />}
              {type === 'income' && <TrendingUp size={18} />}
              {type === 'transfer' && <ArrowRightLeft size={18} />}
              {type === 'refund' && <RotateCcw size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {initialData ? 'Edit Transaction' : 'Record Transaction'}
              </h2>
              <p className="text-xs text-zinc-500">
                {type === 'expense' && 'Track personal outflow'}
                {type === 'income' && 'Record earnings or gifts'}
                {type === 'transfer' && 'Move funds between accounts'}
                {type === 'refund' && 'Credit money and reduce net expense'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="modal-body space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Transaction Type Tabs */}
            <div>
              <label className="label-base">Transaction Type</label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all text-center truncate px-1 ${
                    type === 'expense'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all text-center truncate px-1 ${
                    type === 'income'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setType('transfer')}
                  className={`py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all text-center truncate px-1 ${
                    type === 'transfer'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setType('refund')}
                  className={`py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all text-center truncate px-1 ${
                    type === 'refund'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Refund
                </button>
              </div>
            </div>

            {/* Amount and Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-semibold">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(formatIndianNumber(e.target.value))}
                    className="input-base pl-8 text-base font-bold tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="label-base">Transaction Title *</label>
                <input
                  type="text"
                  required
                  placeholder={
                    type === 'expense'
                      ? 'e.g. Grocery store'
                      : type === 'income'
                      ? 'e.g. Freelance project'
                      : type === 'transfer'
                      ? 'e.g. ATM withdrawal to cash'
                      : 'e.g. Refund for returned item'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-base"
                />
              </div>
            </div>

            {/* Accounts & Category Selection */}
            {type === 'transfer' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <label className="label-base !mb-0">From Account *</label>
                      <button
                        type="button"
                        onClick={() => setIsAddAccountOpen(true)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-0.5"
                      >
                        <Plus size={12} /> New Bank / UPI
                      </button>
                    </div>
                    <select
                      value={accountId || activeAccounts[0]?.id || ''}
                      onChange={(e) => {
                        const newFrom = e.target.value;
                        setAccountId(newFrom);
                        if (toAccountId === newFrom) {
                          const alt = activeAccounts.find((a) => a.id !== newFrom);
                          if (alt) setToAccountId(alt.id);
                        }
                      }}
                      required
                      className="input-base"
                    >
                      {activeAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id} className="bg-zinc-900 text-zinc-100 py-1">
                          {acc.name} ({acc.type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <label className="label-base !mb-0">To Account *</label>
                      <button
                        type="button"
                        onClick={() => setIsAddAccountOpen(true)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-0.5"
                      >
                        <Plus size={12} /> New Bank / UPI
                      </button>
                    </div>
                    <select
                      value={toAccountId || activeAccounts[1]?.id || activeAccounts[0]?.id || ''}
                      onChange={(e) => {
                        const newTo = e.target.value;
                        setToAccountId(newTo);
                        if (accountId === newTo) {
                          const alt = activeAccounts.find((a) => a.id !== newTo);
                          if (alt) setAccountId(alt.id);
                        }
                      }}
                      required
                      className="input-base"
                    >
                      {activeAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id} className="bg-zinc-900 text-zinc-100 py-1">
                          {acc.name} ({acc.type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Transfer Purpose / Category Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <label className="label-base !mb-0">Transfer Category / Purpose *</label>
                      {transferCategory !== 'general' && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/25 inline-flex items-center gap-1">
                          <PiggyBank size={12} /> Savings
                        </span>
                      )}
                    </div>
                    <select
                      value={transferCategory}
                      onChange={(e) => {
                        const val = e.target.value as TransferCategory;
                        setTransferCategory(val);
                        if (!title || title === 'Transfer' || title === 'Savings' || title === 'Emergency Fund' || title === 'Investment') {
                          if (val === 'savings') setTitle('Savings');
                          else if (val === 'emergency') setTitle('Emergency Fund');
                          else if (val === 'investment') setTitle('Investment');
                          else setTitle('Account Transfer');
                        }
                      }}
                      required
                      className="input-base font-semibold"
                    >
                      <option value="savings" className="bg-zinc-900 text-zinc-100 py-1">
                        💰 Savings (Dedicated Savings Vault)
                      </option>
                      <option value="emergency" className="bg-zinc-900 text-zinc-100 py-1">
                        🛡️ Emergency Fund
                      </option>
                      <option value="investment" className="bg-zinc-900 text-zinc-100 py-1">
                        📈 Investment / Mutual Funds
                      </option>
                      <option value="general" className="bg-zinc-900 text-zinc-100 py-1">
                        🔄 General Transfer (Between Regular Accounts)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="label-base">Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="input-base"
                    />
                  </div>
                </div>

                {/* Savings Callout / Guidance */}
                {transferCategory !== 'general' ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-start gap-2.5">
                    <PiggyBank size={16} className="flex-shrink-0 text-emerald-400 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-semibold text-emerald-200">Deducted from Spendable Available Balance:</span> This transfer is marked as <strong className="text-emerald-300 capitalize">{transferCategory}</strong>. It will be deducted from your liquid spendable balance and counted separately as your <strong>Monthly Savings</strong>.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs flex items-start gap-2.5">
                    <ArrowRightLeft size={16} className="flex-shrink-0 text-blue-400 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-semibold text-blue-200">Regular Account Transfer:</span> Moves liquidity between your spendable accounts without affecting your monthly savings or spendable balance.
                    </div>
                  </div>
                )}
              </div>
            ) : type === 'income' ? (
              /* Income: only Credited To Account and Date (no unnecessary expense category!) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                    <label className="label-base !mb-0">Credited To Account *</label>
                    <button
                      type="button"
                      onClick={() => setIsAddAccountOpen(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-0.5"
                    >
                      <Plus size={12} /> New Account
                    </button>
                  </div>
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
                </div>

                <div>
                  <label className="label-base">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-base"
                  />
                </div>
              </div>
            ) : (
              /* Expense & Refund */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <label className="label-base !mb-0">
                        {type === 'expense' ? 'Paid From Account *' : 'Refund To Account *'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddAccountOpen(true)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-0.5"
                      >
                        <Plus size={12} /> New Account
                      </button>
                    </div>
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
                  </div>

                  <div>
                    <label className="label-base">
                      {type === 'expense' ? 'Category *' : 'Refund Category *'}
                    </label>
                    <select
                      value={categoryId || activeCategories[0]?.id || ''}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setSubcategory('');
                      }}
                      required
                      className="input-base"
                    >
                      {activeCategories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-zinc-900 text-zinc-100 py-1">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subcategory & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label-base">Subcategory (Optional)</label>
                    {availableSubcategories.length > 0 ? (
                      <select
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="input-base"
                      >
                        <option value="" className="bg-zinc-900 text-zinc-400">General / None</option>
                        {availableSubcategories.map((sub, i) => (
                          <option key={i} value={sub} className="bg-zinc-900 text-zinc-100">
                            {sub}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Cafe, Taxi, Shoes"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="input-base"
                      />
                    )}
                  </div>

                  <div>
                    <label className="label-base">Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="input-base"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Refund Original Reference (if type == refund) */}
            {type === 'refund' && (
              <div>
                <label className="label-base">Original Transaction (Optional)</label>
                <select
                  value={originalTxId}
                  onChange={(e) => setOriginalTxId(e.target.value)}
                  className="input-base"
                >
                  <option value="" className="bg-zinc-900 text-zinc-400">Standalone refund (no linked purchase)</option>
                  {transactions
                    .filter((t) => t.type === 'expense')
                    .slice(0, 20)
                    .map((t) => (
                      <option key={t.id} value={t.id} className="bg-zinc-900 text-zinc-100">
                        {t.title} - ₹{t.amount} ({t.date})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Description / Notes */}
            <div>
              <label className="label-base">Description / Notes</label>
              <textarea
                rows={2}
                placeholder="Optional notes or details about this transaction..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-base resize-none"
              />
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="label-base">Receipt / Bill Attachment (Optional)</label>
              {receiptUrl ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FileText size={16} />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-medium text-zinc-200 truncate">
                        {receiptName || 'Receipt file'}
                      </p>
                      <p className="text-[10px] text-zinc-500">Attached</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                      title="View file"
                    >
                      <Eye size={15} />
                    </a>
                    <button
                      type="button"
                      onClick={handleRemoveReceipt}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                      title="Remove attachment"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    id="receipt-file-input"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <label
                    htmlFor="receipt-file-input"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-800 hover:border-emerald-500/40 rounded-xl cursor-pointer bg-zinc-950/40 hover:bg-zinc-900/50 transition-colors group"
                  >
                    <Upload
                      size={20}
                      className="text-zinc-500 group-hover:text-emerald-400 transition-colors mb-1.5"
                    />
                    <p className="text-xs text-zinc-400 font-medium">
                      {isUploading ? 'Uploading receipt...' : 'Click to upload receipt or bill'}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      JPG, PNG, WEBP, or PDF up to 5MB
                    </p>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Record Transaction'}
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

      {/* Quick Add Account Modal */}
      {isAddAccountOpen && (
        <AccountModal
          isOpen={isAddAccountOpen}
          onClose={() => setIsAddAccountOpen(false)}
        />
      )}
    </div>
  );
};
