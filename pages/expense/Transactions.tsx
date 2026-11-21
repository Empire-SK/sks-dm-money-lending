import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Download,
  FileDown,
  Edit2,
  Trash2,
  Copy,
  FileText,
  Eye,
  CheckCircle,
  X,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  RotateCcw,
  Calendar,
} from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { useExpense } from '../../contexts/ExpenseContext';
import { ExpenseNav } from '../../components/expense/ExpenseNav';
import { CategoryIcon } from '../../components/expense/CategoryIcon';
import { TransactionModal } from '../../components/expense/TransactionModal';
import { ReceiptViewerModal } from '../../components/expense/ReceiptViewerModal';
import { ExpenseTransaction, TransactionType } from '../../types/expense';
import { formatINR } from '../../utils/expenseCalculations';

export const Transactions: React.FC = () => {
  const {
    accounts,
    categories,
    transactions,
    handleDeleteTransaction,
    handleDuplicateTransaction,
  } = useExpense();

  /* ── Filter & Search State ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  /* ── Modal State ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<ExpenseTransaction | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [viewingReceiptName, setViewingReceiptName] = useState<string>('');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        tx.title.toLowerCase().includes(search) ||
        (tx.description && tx.description.toLowerCase().includes(search)) ||
        (tx.subcategory && tx.subcategory.toLowerCase().includes(search));

      // Type
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;

      // Category
      const matchesCategory =
        categoryFilter === 'all' ||
        tx.categoryId === categoryFilter ||
        (categoryFilter === 'salary' && tx.categoryId === 'salary');

      // Account
      const matchesAccount =
        accountFilter === 'all' ||
        tx.accountId === accountFilter ||
        tx.toAccountId === accountFilter;

      // Date Range
      const matchesStart = !startDate || tx.date >= startDate;
      const matchesEnd = !endDate || tx.date <= endDate;

      return matchesSearch && matchesType && matchesCategory && matchesAccount && matchesStart && matchesEnd;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter, accountFilter, startDate, endDate]);

  // Sorted transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [filteredTransactions, sortBy]);

  // Paginated transactions
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(start, start + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  const handleDelete = async (tx: ExpenseTransaction) => {
    if (window.confirm(`Are you sure you want to delete "${tx.title}"?`)) {
      await handleDeleteTransaction(tx.id);
    }
  };

  const handleEdit = (tx: ExpenseTransaction) => {
    setEditingTx(tx);
    setIsModalOpen(true);
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Date', 'Title', 'Type', 'Category', 'Subcategory', 'Account', 'Amount', 'Description'];
    const rows = sortedTransactions.map((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const acc = accounts.find((a) => a.id === tx.accountId);
      return [
        tx.date,
        `"${tx.title.replace(/"/g, '""')}"`,
        tx.type.toUpperCase(),
        `"${(tx.categoryId === 'salary' ? 'Salary' : cat?.name || 'Uncategorized').replace(/"/g, '""')}"`,
        `"${(tx.subcategory || '').replace(/"/g, '""')}"`,
        `"${(acc?.name || 'Account').replace(/"/g, '""')}"`,
        tx.amount,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SKS_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const exportToPDF = () => {
    const element = document.getElementById('transactions-export-table');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `SKS_Transactions_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#09090b' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ExpenseNav />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">Transaction History</h2>
          <p className="text-[11px] sm:text-xs text-slate-700 dark:text-zinc-400 font-semibold">
            Showing {filteredTransactions.length} of {transactions.length} total entries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="btn-secondary text-xs py-2 px-2.5 sm:px-3 hover:text-emerald-400"
            title="Export CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={exportToPDF}
            className="btn-secondary text-xs py-2 px-2.5 sm:px-3 hover:text-sky-400"
            title="Download PDF"
          >
            <FileDown size={14} />
            <span className="hidden sm:inline">PDF Report</span>
          </button>
          <button
            onClick={() => {
              setEditingTx(null);
              setIsModalOpen(true);
            }}
            className="btn-primary text-xs py-2 px-3"
          >
            <Plus size={14} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="glass-card p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 sm:gap-2.5">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input
              type="text"
              placeholder="Search title, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base pl-9 text-xs py-2"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="input-base text-xs py-2"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
              <option value="transfer">Transfers Only</option>
              <option value="refund">Refunds Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-base text-xs py-2"
            >
              <option value="all">All Categories</option>
              <option value="salary">Salary</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="input-base text-xs py-2"
            >
              <option value="all">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Date range & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200/80 dark:border-zinc-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-slate-600 dark:text-zinc-400 font-bold text-[11px]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base py-1 px-2 text-xs w-32 sm:w-36 font-semibold"
            />
            <span className="text-slate-600 dark:text-zinc-400 font-bold text-[11px]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-base py-1 px-2 text-xs w-32 sm:w-36 font-semibold"
            />
            {(startDate || endDate || searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' || accountFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setCategoryFilter('all');
                  setAccountFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-emerald-700 dark:text-emerald-400 hover:underline text-xs font-bold ml-1"
              >
                Reset
              </button>
            )}
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5 justify-between sm:justify-end">
            <span className="text-slate-600 dark:text-zinc-400 font-bold text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-base py-1 px-2 text-xs w-36 sm:w-40 font-semibold"
            >
              <option value="date_desc">Latest Date</option>
              <option value="date_asc">Oldest Date</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Container */}
      <div className="glass-card overflow-hidden" id="transactions-export-table">
        {/* Mobile View: Card-based list (md:hidden) */}
        <div className="md:hidden divide-y divide-zinc-800/60">
          {paginatedTransactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const acc = accounts.find((a) => a.id === tx.accountId);
            const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';
            const isRefund = tx.type === 'refund';
            const isDedicatedSavingsTransfer = isTransfer && (
              tx.isDedicatedSavings ||
              tx.transferCategory === 'savings' ||
              tx.transferCategory === 'emergency' ||
              tx.transferCategory === 'investment' ||
              /saving|emergency|invest|deposit|vault/i.test(tx.title + ' ' + (tx.description || '') + ' ' + (tx.notes || ''))
            );
            const transferLabel =
              tx.transferCategory === 'emergency'
                ? 'Emergency Fund'
                : tx.transferCategory === 'investment'
                ? 'Investment'
                : isDedicatedSavingsTransfer
                ? 'Savings'
                : 'Transfer';

            return (
              <div key={tx.id} className="p-3.5 space-y-2 hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                {/* Top Row: Category & Amount */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${isIncome ? '#10B981' : isDedicatedSavingsTransfer ? '#8B5CF6' : isTransfer ? '#3B82F6' : cat?.color || '#10B981'}15`,
                        color: isIncome ? '#10B981' : isDedicatedSavingsTransfer ? '#8B5CF6' : isTransfer ? '#3B82F6' : cat?.color || '#10B981',
                      }}
                    >
                      <CategoryIcon
                        name={isIncome ? 'TrendingUp' : isDedicatedSavingsTransfer ? 'PiggyBank' : isTransfer ? 'ArrowRightLeft' : cat?.icon || 'Tag'}
                        size={14}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate">
                      {tx.categoryId === 'salary' ? 'Salary' : isTransfer ? transferLabel : isIncome ? 'Income' : cat?.name || 'General'}
                    </span>
                    {tx.subcategory && !isIncome && !isTransfer && (
                      <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-semibold truncate">
                        • {tx.subcategory}
                      </span>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-sm font-black tabular-nums ${
                        isIncome
                          ? 'text-emerald-700 dark:text-emerald-400'
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
                    </span>
                  </div>
                </div>

                {/* Middle Row: Title & Notes */}
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">{tx.title}</p>
                  {tx.description && (
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 line-clamp-2 font-medium">
                      {tx.description}
                    </p>
                  )}
                </div>

                {/* Bottom Row: Metadata & Quick Actions */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-medium">{tx.date}</span>
                    <span>•</span>
                    <span className="text-slate-800 dark:text-zinc-200 font-bold truncate">
                      {isTransfer ? `${acc?.name || 'Src'} → ${toAcc?.name || 'Dest'}` : acc?.name || 'Account'}
                    </span>
                    {tx.receiptUrl && (
                      <button
                        onClick={() => {
                          setViewingReceiptUrl(tx.receiptUrl || '');
                          setViewingReceiptName(tx.receiptName || 'Receipt');
                        }}
                        className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 ml-1 font-bold"
                      >
                        <FileText size={11} /> Receipt
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDuplicateTransaction(tx)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => handleEdit(tx)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(tx)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {paginatedTransactions.length === 0 && (
            <div className="py-10 text-center text-xs text-zinc-500">
              No transactions found matching your criteria.
            </div>
          )}
        </div>

        {/* Desktop View: Full Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-slate-700 dark:text-zinc-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Receipt</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {paginatedTransactions.map((tx) => {
                const cat = categories.find((c) => c.id === tx.categoryId);
                const acc = accounts.find((a) => a.id === tx.accountId);
                const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;

                const isExpense = tx.type === 'expense';
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';
                const isRefund = tx.type === 'refund';
                const isDedicatedSavingsTransfer = isTransfer && (
                  tx.isDedicatedSavings ||
                  tx.transferCategory === 'savings' ||
                  tx.transferCategory === 'emergency' ||
                  tx.transferCategory === 'investment' ||
                  /saving|emergency|invest|deposit|vault/i.test(tx.title + ' ' + (tx.description || '') + ' ' + (tx.notes || ''))
                );
                const transferLabel =
                  tx.transferCategory === 'emergency'
                    ? 'Emergency Fund'
                    : tx.transferCategory === 'investment'
                    ? 'Investment'
                    : isDedicatedSavingsTransfer
                    ? 'Savings'
                    : 'Transfer';

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 text-slate-600 dark:text-zinc-400 whitespace-nowrap font-medium">
                      {tx.date}
                    </td>

                    {/* Title & Notes */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-zinc-100">{tx.title}</div>
                      {tx.description && (
                        <div className="text-[11px] text-slate-500 dark:text-zinc-500 truncate max-w-xs mt-0.5">
                          {tx.description}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                          isDedicatedSavingsTransfer
                            ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300'
                            : 'bg-slate-100 dark:bg-zinc-800/80 border-slate-200/90 dark:border-zinc-700/50 text-slate-800 dark:text-zinc-300 shadow-sm dark:shadow-none'
                        }`}
                      >
                        <CategoryIcon
                          name={
                            isIncome
                              ? 'TrendingUp'
                              : isDedicatedSavingsTransfer
                              ? 'PiggyBank'
                              : isTransfer
                              ? 'ArrowRightLeft'
                              : cat?.icon || 'Tag'
                          }
                          size={13}
                        />
                        <span>
                          {tx.categoryId === 'salary'
                            ? 'Salary'
                            : isTransfer
                            ? transferLabel
                            : isIncome
                            ? 'Income'
                            : cat?.name || 'General'}
                        </span>
                        {tx.subcategory && !isIncome && !isTransfer && (
                          <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-medium">
                            • {tx.subcategory}
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isIncome && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <TrendingUp size={11} /> Income
                        </span>
                      )}
                      {isExpense && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <TrendingDown size={11} /> Expense
                        </span>
                      )}
                      {isTransfer && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <ArrowRightLeft size={11} /> Transfer
                        </span>
                      )}
                      {isRefund && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <RotateCcw size={11} /> Refund
                        </span>
                      )}
                    </td>

                    {/* Payment Account */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-800 dark:text-zinc-300 font-semibold">
                      {isTransfer ? (
                        <span>
                          {acc?.name || 'Src'} → {toAcc?.name || 'Dest'}
                        </span>
                      ) : (
                        acc?.name || 'Account'
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-sm">
                      <span
                        className={
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : isRefund
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }
                      >
                        {isIncome && '+'}
                        {isExpense && '-'}
                        {isRefund && '+'}
                        {formatINR(tx.amount)}
                      </span>
                    </td>

                    {/* Receipt Preview Icon */}
                    <td className="py-3 px-4 text-center">
                      {tx.receiptUrl ? (
                        <button
                          onClick={() => {
                            setViewingReceiptUrl(tx.receiptUrl || '');
                            setViewingReceiptName(tx.receiptName || 'Receipt');
                          }}
                          className="p-1 rounded text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                          title="View Receipt"
                        >
                          <FileText size={16} />
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-600">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDuplicateTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors"
                          title="Duplicate transaction"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-3 sm:p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary py-1 px-2.5 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 2), currentPage + 1)
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-semibold ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary py-1 px-2.5 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        initialData={editingTx}
      />

      {/* Receipt Viewer Modal */}
      {viewingReceiptUrl && (
        <ReceiptViewerModal
          url={viewingReceiptUrl}
          fileName={viewingReceiptName}
          onClose={() => setViewingReceiptUrl(null)}
        />
      )}
    </div>
  );
};
