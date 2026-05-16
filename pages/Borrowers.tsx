import React, { useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, DollarSign, Phone,
  PlusCircle, FileText, Download, FileDown, Clock,
  Share2, CheckCircle, X, TrendingUp, TrendingDown, Filter
} from 'lucide-react';
import { Borrower } from '../types';

interface BorrowersProps {
  borrowers: Borrower[];
  onAdd: (b: Omit<Borrower, 'id' | 'repaidAmount' | 'status' | 'history'>) => void;
  onEdit: (b: Borrower) => void;
  onDelete: (id: string) => void;
  onRepay: (id: string, amount: number, note?: string) => void;
  onTopUp: (id: string, amount: number, note?: string) => void;
  onDeleteHistory: (borrowerId: string, historyItemId: string) => void;
}

/* ─── Modal Shell — slides up from bottom on mobile, centered on sm+ ─── */
const Modal: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ onClose, children, maxWidth = 'max-w-lg' }) => (
  <div className="modal-overlay">
    <div className="modal-backdrop" onClick={onClose} />
    <div className={`modal-box ${maxWidth} w-full`}>{children}</div>
  </div>
);

/* ─── Color-coded avatar initial ─── */
const AVATAR_COLORS = [
  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'bg-violet-500/15 text-violet-400 border-violet-500/25',
  'bg-sky-500/15 text-sky-400 border-sky-500/25',
  'bg-amber-500/15 text-amber-400 border-amber-500/25',
  'bg-rose-500/15 text-rose-400 border-rose-500/25',
];

const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const sz = size === 'sm' ? 'w-8 h-8 text-sm' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-base';
  return (
    <div className={`${sz} rounded-full border flex items-center justify-center font-bold flex-shrink-0 ${AVATAR_COLORS[idx]}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

/* ─── Small icon action button ─── */
type BtnColor = 'emerald' | 'violet' | 'sky' | 'rose' | 'amber' | 'zinc' | 'red';
const COLOR_CLASSES: Record<BtnColor, string> = {
  emerald: 'text-emerald-400 hover:bg-emerald-500/10',
  violet:  'text-violet-400 hover:bg-violet-500/10',
  sky:     'text-sky-400 hover:bg-sky-500/10',
  rose:    'text-rose-400 hover:bg-rose-500/10',
  amber:   'text-amber-400 hover:bg-amber-500/10',
  zinc:    'text-zinc-400 hover:bg-zinc-700/50',
  red:     'text-red-400 hover:bg-red-500/10',
};
const ActionBtn: React.FC<{ icon: React.ReactNode; title: string; color: BtnColor; onClick: () => void }> = ({
  icon, title, color, onClick,
}) => (
  <button title={title} onClick={onClick} className={`p-1.5 rounded-lg transition-colors duration-150 ${COLOR_CLASSES[color]}`}>
    {icon}
  </button>
);

/* ═══════════════════════════════════════════════════════ */

const Borrowers: React.FC<BorrowersProps> = ({
  borrowers, onAdd, onEdit, onDelete, onRepay, onTopUp, onDeleteHistory,
}) => {
  /* ── UI State ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyBorrowerId, setHistoryBorrowerId] = useState<string | null>(null);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [repayingId, setRepayingId] = useState<string | null>(null);
  const [topUpId, setTopUpId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  type SortOption = 'recent_activity' | 'highest_pending' | 'status' | 'name';
  const [sortBy, setSortBy] = useState<SortOption>('recent_activity');

  /* ── Form State ── */
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', loanAmount: '', startDate: '', note: '' });
  const [repayAmount, setRepayAmount] = useState('');
  const [repayNote, setRepayNote] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpNote, setTopUpNote] = useState('');

  /* Derive history borrower live from props so modal auto-updates after delete */
  const historyBorrower = borrowers.find(b => b.id === historyBorrowerId) ?? null;

  const filteredBorrowers = borrowers.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.phone.includes(searchTerm) ||
    (b.note && b.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedBorrowers = [...filteredBorrowers].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'recent_activity') {
      const latestA = a.history.length > 0 
        ? Math.max(...a.history.map(h => new Date(h.date).getTime())) 
        : new Date(a.startDate).getTime();
      const latestB = b.history.length > 0 
        ? Math.max(...b.history.map(h => new Date(h.date).getTime())) 
        : new Date(b.startDate).getTime();
      return latestB - latestA;
    }
    if (sortBy === 'highest_pending') {
      const pendingA = a.totalPayable - a.repaidAmount;
      const pendingB = b.totalPayable - b.repaidAmount;
      return pendingB - pendingA;
    }
    if (sortBy === 'status') {
      if (a.status === b.status) return 0;
      return a.status === 'Active' ? -1 : 1;
    }
    return 0;
  });

  /* ── Handlers ── */
  const handleOpenHistory = (b: Borrower) => { setHistoryBorrowerId(b.id); setIsHistoryOpen(true); };

  const handleShareStatement = (b: Borrower) => {
    const url = `${window.location.origin}/#/statement/${b.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(b.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => prompt('Copy this link:', url));
  };

  const handleDownloadCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Start Date', 'Lent Amount', 'Repaid Amount', 'Outstanding', 'Status', 'Note'];
    const rows = sortedBorrowers.map(b => [
      `"${b.name}"`, `"${b.phone}"`, `"${b.email}"`, `"${b.startDate}"`,
      b.loanAmount, b.repaidAmount, b.totalPayable - b.repaidAmount,
      `"${b.status}"`, `"${(b.note || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sks_lending_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleDownloadStatement = (b: Borrower) => {
    const rows = [
      `"Borrower Name","${b.name}"`, `"Phone","${b.phone}"`, `"Email","${b.email}"`,
      `"Start Date","${b.startDate}"`, `"Total Lent","${b.loanAmount}"`,
      `"Total Repaid","${b.repaidAmount}"`, `"Outstanding","${b.totalPayable - b.repaidAmount}"`,
      `"Status","${b.status}"`, `"Note","${(b.note || '').replace(/"/g, '""')}"`
    ];
    const histRows = b.history.map(h =>
      `"${new Date(h.date).toLocaleDateString()}","${h.type === 'loan' ? 'Top Up' : 'Payment'}","${h.amount}"`
    );
    const csv = ['--- Borrower Details ---', ...rows, '', '--- Payment History ---',
      '"Date","Type","Amount"', ...histRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Statement_${b.name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', email: '', loanAmount: '', startDate: new Date().toISOString().split('T')[0], note: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Borrower) => {
    setEditingId(b.id);
    const phone = b.phone.startsWith('+91') ? b.phone.substring(3).trim() : b.phone;
    setFormData({ name: b.name, phone, email: b.email, loanAmount: b.loanAmount.toString(), startDate: b.startDate, note: b.note || '' });
    setIsModalOpen(true);
  };

  const handleOpenRepay = (b: Borrower) => { setRepayingId(b.id); setRepayAmount(''); setRepayNote(''); setIsRepayModalOpen(true); };
  const handleOpenTopUp = (b: Borrower) => { setTopUpId(b.id); setTopUpAmount(''); setTopUpNote(''); setIsTopUpModalOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name, phone: `+91 ${formData.phone}`, email: formData.email,
      loanAmount: Number(formData.loanAmount), totalPayable: Number(formData.loanAmount),
      startDate: formData.startDate, note: formData.note,
    };
    if (editingId) {
      const original = borrowers.find(b => b.id === editingId);
      if (original) onEdit({ ...original, ...payload });
    } else {
      onAdd(payload);
    }
    setIsModalOpen(false);
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repayingId && repayAmount) {
      onRepay(repayingId, Number(repayAmount), repayNote);
      setIsRepayModalOpen(false); setRepayingId(null); setRepayAmount(''); setRepayNote('');
    }
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpId && topUpAmount) {
      onTopUp(topUpId, Number(topUpAmount), topUpNote);
      setIsTopUpModalOpen(false); setTopUpId(null); setTopUpAmount(''); setTopUpNote('');
    }
  };

  const repayingBorrower = borrowers.find(b => b.id === repayingId);
  const topUpBorrower = borrowers.find(b => b.id === topUpId);

  return (
    <>
      <div className="space-y-5 animate-fadeIn">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Borrowers</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {borrowers.length} total &middot; {borrowers.filter(b => b.status === 'Active').length} active
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadCSV} className="btn-secondary">
            <Download size={15} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus size={15} /> Add Borrower
          </button>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={15} className="text-zinc-600" />
          </div>
          <input
            type="text"
            placeholder="Search by name, phone or note..."
            className="input-base pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-600 hover:text-zinc-400">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="relative sm:w-56 flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Filter size={15} className="text-zinc-600" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input-base pl-10 w-full appearance-none cursor-pointer bg-zinc-900/60 text-sm"
          >
            <option value="recent_activity">Recent Activity First</option>
            <option value="highest_pending">Highest Pending First</option>
            <option value="status">Active Status First</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/40">
                {['Borrower', 'Loan Amount', 'Repayment Progress', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {sortedBorrowers.map((borrower) => {
                const pct = Math.min(100, borrower.totalPayable > 0 ? (borrower.repaidAmount / borrower.totalPayable) * 100 : 0);
                const remaining = borrower.totalPayable - borrower.repaidAmount;

                return (
                  <tr key={borrower.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={borrower.name} />
                        <div>
                          <p className="text-sm font-semibold text-zinc-100">{borrower.name}</p>
                          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5"><Phone size={11} /> {borrower.phone}</div>
                          {borrower.note && (
                            <div className="flex items-center gap-1 text-xs text-zinc-600 italic mt-1 max-w-[200px]">
                              <FileText size={10} className="flex-shrink-0" /><span className="truncate">{borrower.note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-zinc-100">₹{borrower.loanAmount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        Since {new Date(borrower.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-40">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-emerald-400">₹{borrower.repaidAmount.toLocaleString('en-IN')}</span>
                          <span className="text-zinc-500">₹{remaining.toLocaleString('en-IN')} left</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${borrower.status === 'Completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1">{Math.round(pct)}% repaid</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={borrower.status === 'Active' ? 'badge-active' : 'badge-completed'}>{borrower.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-0.5">
                        <ActionBtn title="Top Up" color="violet" onClick={() => handleOpenTopUp(borrower)} icon={<PlusCircle size={16} />} />
                        {borrower.status === 'Active' && (
                          <ActionBtn title="Record Payment" color="emerald" onClick={() => handleOpenRepay(borrower)} icon={<DollarSign size={16} />} />
                        )}
                        <ActionBtn title="History" color="sky" onClick={() => handleOpenHistory(borrower)} icon={<Clock size={16} />} />
                        <ActionBtn
                          title={copiedId === borrower.id ? 'Copied!' : 'Share'}
                          color="rose"
                          onClick={() => handleShareStatement(borrower)}
                          icon={copiedId === borrower.id ? <CheckCircle size={16} /> : <Share2 size={16} />}
                        />
                        <ActionBtn title="Download" color="zinc" onClick={() => handleDownloadStatement(borrower)} icon={<FileDown size={16} />} />
                        <ActionBtn title="Edit" color="amber" onClick={() => handleOpenEdit(borrower)} icon={<Edit2 size={16} />} />
                        <ActionBtn title="Delete" color="red" onClick={() => onDelete(borrower.id)} icon={<Trash2 size={16} />} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedBorrowers.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-14 text-center text-zinc-600 text-sm">
                  {searchTerm ? `No results for "${searchTerm}"` : 'No borrowers yet. Add your first one!'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden space-y-3">
        {sortedBorrowers.map((borrower) => {
          const pct = Math.min(100, borrower.totalPayable > 0 ? (borrower.repaidAmount / borrower.totalPayable) * 100 : 0);
          const remaining = borrower.totalPayable - borrower.repaidAmount;

          return (
            <div key={borrower.id} className="glass-card-sm p-4 space-y-3.5">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar name={borrower.name} />
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{borrower.name}</p>
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5"><Phone size={11} /> {borrower.phone}</div>
                  </div>
                </div>
                <span className={borrower.status === 'Active' ? 'badge-active' : 'badge-completed'}>{borrower.status}</span>
              </div>

              {borrower.note && (
                <div className="flex items-start gap-2 text-xs text-zinc-500 italic bg-zinc-900/60 border border-zinc-800/60 rounded-lg px-3 py-2">
                  <FileText size={12} className="flex-shrink-0 mt-0.5 text-zinc-600" /><span>{borrower.note}</span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Lent', val: `₹${borrower.loanAmount.toLocaleString('en-IN')}`, color: 'text-zinc-100' },
                  { label: 'Repaid', val: `₹${borrower.repaidAmount.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
                  { label: 'Due', val: `₹${remaining.toLocaleString('en-IN')}`, color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-500">Repayment</span>
                  <span className="text-zinc-400 font-medium">{Math.round(pct)}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${borrower.status === 'Completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Primary Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleOpenTopUp(borrower)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-semibold hover:bg-violet-500/15 transition-colors">
                  <PlusCircle size={14} /> Top Up
                </button>
                {borrower.status === 'Active' ? (
                  <button onClick={() => handleOpenRepay(borrower)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/15 transition-colors">
                    <DollarSign size={14} /> Repay
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800/50 text-zinc-600 border border-zinc-700/30 text-xs font-semibold">
                    <CheckCircle size={14} /> Completed
                  </div>
                )}
              </div>

              {/* Icon Actions */}
              <div className="flex justify-between items-center pt-1 border-t border-zinc-800/60">
                {[
                  { title: 'History', icon: <Clock size={16} />, color: 'text-sky-400 hover:bg-sky-500/10', action: () => handleOpenHistory(borrower) },
                  { title: copiedId === borrower.id ? 'Copied!' : 'Share', icon: copiedId === borrower.id ? <CheckCircle size={16} /> : <Share2 size={16} />, color: 'text-rose-400 hover:bg-rose-500/10', action: () => handleShareStatement(borrower) },
                  { title: 'Download', icon: <FileDown size={16} />, color: 'text-zinc-400 hover:bg-zinc-700/50', action: () => handleDownloadStatement(borrower) },
                  { title: 'Edit', icon: <Edit2 size={16} />, color: 'text-amber-400 hover:bg-amber-500/10', action: () => handleOpenEdit(borrower) },
                  { title: 'Delete', icon: <Trash2 size={16} />, color: 'text-red-400 hover:bg-red-500/10', action: () => onDelete(borrower.id) },
                ].map(btn => (
                  <button key={btn.title} title={btn.title} onClick={btn.action}
                    className={`flex-1 flex justify-center p-2 rounded-lg transition-colors ${btn.color}`}>
                    {btn.icon}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {sortedBorrowers.length === 0 && (
          <div className="glass-card-sm py-14 text-center">
            <p className="text-zinc-600 text-sm">
              {searchTerm ? `No results for "${searchTerm}"` : 'No borrowers yet. Add your first one!'}
            </p>
          </div>
        )}
      </div>

    </div>

    {/* Modals outside transform div */}
    {isModalOpen && (
      <Modal onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div>
              <h2 className="text-base font-bold text-zinc-100">{editingId ? 'Edit Borrower' : 'Add New'}</h2>
              <p className="hidden sm:block text-xs text-zinc-500 mt-0.5">{editingId ? 'Update borrower details' : 'Fill in details to create a new loan record'}</p>
            </div>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost p-1.5"><X size={18} /></button>
          </div>

          <div className="modal-body space-y-3 sm:space-y-4">
            {/* Full Name */}
            <div>
              <label className="label-base">Full Name</label>
              <input required type="text" placeholder="e.g. Ramesh Kumar"
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="input-base" />
            </div>

            {/* Phone + Date — 2 columns even on mobile */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="label-base">Phone</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-600 text-[10px] sm:text-xs pointer-events-none">+91</span>
                  <input required type="tel" placeholder="9876543210"
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="input-base pl-8 sm:pl-11" />
                </div>
              </div>
              <div>
                <label className="label-base">Start Date</label>
                <input required type="date"
                  value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="input-base px-2 sm:px-4" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label-base">Email <span className="text-zinc-600 normal-case font-normal">(optional)</span></label>
              <input type="email" placeholder="borrower@example.com"
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="input-base" />
            </div>

            {/* Loan Amount */}
            <div>
              <label className="label-base">Loan Amount</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-600 text-sm pointer-events-none">₹</span>
                <input required type="number" min="0" placeholder="50000"
                  value={formData.loanAmount} onChange={e => setFormData({ ...formData, loanAmount: e.target.value })}
                  className="input-base pl-8" />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="label-base">Note <span className="text-zinc-600 normal-case font-normal">(optional)</span></label>
              <textarea rows={1} placeholder="Reason for loan, collateral, etc."
                value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })}
                className="input-base resize-none" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Create Borrower'}</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    )}

    {isRepayModalOpen && (
      <Modal onClose={() => setIsRepayModalOpen(false)} maxWidth="max-w-sm">
        <form onSubmit={handleRepaySubmit}>
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingDown size={17} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">Record Payment</h2>
                {repayingBorrower && <p className="text-xs text-zinc-500">{repayingBorrower.name}</p>}
              </div>
            </div>
            <button type="button" onClick={() => setIsRepayModalOpen(false)} className="btn-ghost p-1.5"><X size={18} /></button>
          </div>

          <div className="modal-body space-y-3 sm:space-y-4">
            {repayingBorrower && (
              <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2 sm:py-3">
                <span className="text-[10px] sm:text-xs text-zinc-500">Pending</span>
                <span className="text-sm font-bold text-amber-400">
                  ₹{(repayingBorrower.totalPayable - repayingBorrower.repaidAmount).toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div>
              <label className="label-base">Amount Received</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-600 text-sm pointer-events-none">₹</span>
                <input required type="number" min="1" placeholder="0"
                  value={repayAmount} onChange={e => setRepayAmount(e.target.value)}
                  className="input-base pl-8 text-lg font-semibold" />
              </div>
            </div>
            <div>
              <label className="label-base">Note <span className="text-zinc-600 normal-case font-normal">(optional)</span></label>
              <textarea rows={1} placeholder="e.g. UPI Ref #123456"
                value={repayNote} onChange={e => setRepayNote(e.target.value)}
                className="input-base resize-none" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn-primary bg-emerald-600 hover:bg-emerald-500">
              <CheckCircle size={15} /> Confirm Payment
            </button>
            <button type="button" onClick={() => setIsRepayModalOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    )}

    {isTopUpModalOpen && (
      <Modal onClose={() => setIsTopUpModalOpen(false)} maxWidth="max-w-sm">
        <form onSubmit={handleTopUpSubmit}>
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <TrendingUp size={17} className="text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">Top Up Loan</h2>
                {topUpBorrower && <p className="text-xs text-zinc-500">{topUpBorrower.name}</p>}
              </div>
            </div>
            <button type="button" onClick={() => setIsTopUpModalOpen(false)} className="btn-ghost p-1.5"><X size={18} /></button>
          </div>

          <div className="modal-body space-y-3 sm:space-y-4">
            {topUpBorrower && (
              <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2 sm:py-3">
                <span className="text-[10px] sm:text-xs text-zinc-500">Current Loan</span>
                <span className="text-sm font-bold text-violet-400">₹{topUpBorrower.loanAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div>
              <label className="label-base">Amount to Add</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-600 text-sm pointer-events-none">₹</span>
                <input required type="number" min="1" placeholder="5000"
                  value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)}
                  className="input-base pl-8 text-lg font-semibold" />
              </div>
            </div>
            <div>
              <label className="label-base">Note <span className="text-zinc-600 normal-case font-normal">(optional)</span></label>
              <textarea rows={1} placeholder="Reason for top-up..."
                value={topUpNote} onChange={e => setTopUpNote(e.target.value)}
                className="input-base resize-none" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn-primary bg-violet-600 hover:bg-violet-500 shadow-violet-900/30">
              <PlusCircle size={15} /> Update Loan
            </button>
            <button type="button" onClick={() => setIsTopUpModalOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    )}

    {isHistoryOpen && historyBorrower && (
      <Modal onClose={() => setIsHistoryOpen(false)} maxWidth="max-w-lg">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <Avatar name={historyBorrower.name} size="sm" />
            <div>
              <h2 className="text-base font-bold text-zinc-100">Payment History</h2>
              <p className="text-xs text-zinc-500">{historyBorrower.name} &middot; {historyBorrower.history.length} transactions</p>
            </div>
          </div>
          <button onClick={() => setIsHistoryOpen(false)} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        {/* Cards list — no table, no horizontal scroll */}
        <div className="modal-body p-0">
          {historyBorrower.history.length === 0 ? (
            <div className="py-14 text-center text-zinc-600 text-sm">No transactions recorded yet.</div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {[...historyBorrower.history]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((h) => (
                  <div key={h.id} className="flex items-start gap-3 px-5 py-4 hover:bg-zinc-900/40 transition-colors group">
                    {/* Type icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      h.type === 'loan'
                        ? 'bg-violet-500/10 border border-violet-500/20'
                        : 'bg-emerald-500/10 border border-emerald-500/20'
                    }`}>
                      {h.type === 'loan'
                        ? <TrendingUp size={15} className="text-violet-400" />
                        : <TrendingDown size={15} className="text-emerald-400" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-base font-bold leading-tight ${h.type === 'loan' ? 'text-violet-400' : 'text-emerald-400'}`}>
                            +₹{h.amount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            <span className="mx-1 text-zinc-700">·</span>
                            {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {h.note && <p className="text-xs text-zinc-400 italic mt-1 truncate">{h.note}</p>}
                        </div>

                        {/* Badge + delete */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            h.type === 'loan'
                              ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {h.type === 'loan' ? 'Top Up' : 'Payment'}
                          </span>
                          <button
                            title="Delete this transaction"
                            onClick={() => onDeleteHistory(historyBorrower.id, h.id)}
                            className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10
                              transition-all duration-150 opacity-0 group-hover:opacity-100 sm:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={() => setIsHistoryOpen(false)} className="btn-secondary">Close</button>
        </div>
      </Modal>
    )}
  </>
);
};

export default Borrowers;