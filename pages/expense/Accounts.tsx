import React, { useState } from 'react';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useExpense } from '../../contexts/ExpenseContext';
import { ExpenseNav } from '../../components/expense/ExpenseNav';
import { AccountModal } from '../../components/expense/AccountModal';
import { ExpenseAccount } from '../../types/expense';
import { formatINR, formatIndianNumber, parseIndianNumber } from '../../utils/expenseCalculations';

export const Accounts: React.FC = () => {
  const {
    accounts,
    accountSummaries,
    totalAvailableBalance,
    liquidSpendableBalance,
    dedicatedSavingsBalance,
    totalNetWorth,
    transactions,
    handleDeleteAccount,
    handleEditAccount,
  } = useExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ExpenseAccount | null>(null);
  const [reconcilingAccount, setReconcilingAccount] = useState<ExpenseAccount | null>(null);
  const [newReconciledBalance, setNewReconciledBalance] = useState('');

  const handleDelete = async (account: ExpenseAccount) => {
    const hasTx = transactions.some((t) => t.accountId === account.id || t.toAccountId === account.id);
    if (hasTx) {
      alert(`Cannot delete account "${account.name}" because it contains transaction history. Delete or reassign those transactions first.`);
      return;
    }

    if (window.confirm(`Delete account "${account.name}"?`)) {
      await handleDeleteAccount(account.id);
    }
  };

  const handleEdit = (account: ExpenseAccount) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleOpenReconcile = (account: ExpenseAccount, currentBalance: number) => {
    setReconcilingAccount(account);
    setNewReconciledBalance(formatIndianNumber(currentBalance));
  };

  const handleSaveReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcilingAccount) return;

    const targetBalance = parseIndianNumber(newReconciledBalance);
    if (isNaN(targetBalance)) return;

    // To reconcile: adjust opening balance such that current balance equals target balance
    const summary = accountSummaries.find((s) => s.account.id === reconcilingAccount.id);
    const curBal = summary ? summary.currentBalance : reconcilingAccount.openingBalance;
    const diff = targetBalance - curBal;
    const newOpening = (reconcilingAccount.openingBalance || 0) + diff;

    await handleEditAccount({
      ...reconcilingAccount,
      openingBalance: newOpening,
    });

    setReconcilingAccount(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ExpenseNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100">Account Management</h2>
          <p className="text-[11px] sm:text-xs text-zinc-500">
            Track and reconcile real money balances in Cash, UPI, and Bank accounts
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAccount(null);
            setIsModalOpen(true);
          }}
          className="btn-primary text-xs py-2 px-3 self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Add Account</span>
        </button>
      </div>

      {/* Total Balance Banner */}
      <div className="glass-card p-4 sm:p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Available Spendable Balance (Liquid)
            </p>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <span className="text-2xl sm:text-4xl font-extrabold text-zinc-100 tabular-nums">
                {formatINR(liquidSpendableBalance)}
              </span>
              {dedicatedSavingsBalance > 0 && (
                <span className="text-xs sm:text-sm font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                  + {formatINR(dedicatedSavingsBalance)} Dedicated Savings
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-1.5">
              Spendable cash & primary accounts. Total combined wealth across all accounts: <strong className="text-zinc-300 font-bold">{formatINR(totalNetWorth)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] sm:text-xs font-semibold">
              <ShieldCheck size={15} /> Reconciled & Isolated
            </span>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {accountSummaries.map((item) => {
          const acc = item.account;
          const isCash = acc.type === 'cash';
          const isUpi = acc.type === 'upi';
          const isSavingsVault = item.isSavings || acc.isSavings;

          return (
            <div
              key={acc.id}
              className="glass-card p-4 sm:p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white border shadow-md flex-shrink-0"
                      style={{
                        backgroundColor: `${acc.color || '#10B981'}15`,
                        borderColor: `${acc.color || '#10B981'}30`,
                        color: acc.color || '#10B981',
                      }}
                    >
                      {isCash ? (
                        <Banknote size={20} />
                      ) : isUpi ? (
                        <Smartphone size={20} />
                      ) : (
                        <Landmark size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                          {acc.name}
                        </h3>
                        {isSavingsVault ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                            Savings Vault
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Spending
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-zinc-500 capitalize">{acc.type} Account</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleEdit(acc)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      title="Edit account"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(acc)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Balance display */}
                <div className="mt-4 sm:mt-5 p-3 sm:p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Current Balance
                  </p>
                  <p className="text-xl sm:text-2xl font-extrabold text-zinc-100 mt-0.5 tabular-nums">
                    {formatINR(item.currentBalance)}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Opening: {formatINR(acc.openingBalance)}
                  </p>
                </div>

                {/* Flow Details */}
                <div className="mt-3 sm:mt-4 space-y-1.5 text-[11px] sm:text-xs text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>Total Income Credited:</span>
                    <span className="text-emerald-400 font-semibold tabular-nums">
                      +{formatINR(item.totalIncome)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Outflow (Expenses):</span>
                    <span className="text-rose-400 font-semibold tabular-nums">
                      -{formatINR(item.totalExpenses)}
                    </span>
                  </div>
                  {item.totalRefunds > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Total Refunds Received:</span>
                      <span className="text-purple-400 font-semibold tabular-nums">
                        +{formatINR(item.totalRefunds)}
                      </span>
                    </div>
                  )}
                  {(item.transfersIn > 0 || item.transfersOut > 0) && (
                    <div className="flex items-center justify-between">
                      <span>Transfers (In / Out):</span>
                      <span className="text-blue-400 font-semibold tabular-nums">
                        +{formatINR(item.transfersIn)} / -{formatINR(item.transfersOut)}
                      </span>
                    </div>
                  )}
                </div>

                {acc.notes && (
                  <p className="text-[10px] sm:text-[11px] text-zinc-500 italic mt-2.5 pt-2 border-t border-zinc-800/80">
                    "{acc.notes}"
                  </p>
                )}
              </div>

              {/* Footer action */}
              <div className="mt-4 sm:mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-600">
                  Created {acc.createdAt ? acc.createdAt.slice(0, 10) : ''}
                </span>
                <button
                  onClick={() => handleOpenReconcile(acc, item.currentBalance)}
                  className="text-[11px] sm:text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline"
                >
                  Reconcile Balance
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Edit Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAccount(null);
        }}
        initialData={editingAccount}
      />

      {/* Balance Reconciliation Modal */}
      {reconcilingAccount && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setReconcilingAccount(null)} />
          <div className="modal-box max-w-sm">
            <div className="modal-header">
              <h3 className="text-sm font-bold text-zinc-100">
                Reconcile Balance: {reconcilingAccount.name}
              </h3>
              <button
                onClick={() => setReconcilingAccount(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveReconciliation}>
              <div className="modal-body space-y-3">
                <p className="text-xs text-zinc-400">
                  Enter your verified actual balance in this account. The opening balance will be calibrated so the calculated balance matches your real money exactly.
                </p>
                <div>
                  <label className="label-base">Actual Verified Balance (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={newReconciledBalance}
                    onChange={(e) => setNewReconciledBalance(formatIndianNumber(e.target.value))}
                    className="input-base font-bold text-base tabular-nums"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-primary text-xs">
                  Save Reconciled Balance
                </button>
                <button
                  type="button"
                  onClick={() => setReconcilingAccount(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
