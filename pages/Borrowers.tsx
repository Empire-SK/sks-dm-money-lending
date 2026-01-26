import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  DollarSign,
  Phone,
  PlusCircle,
  FileText,
  Download,
  FileDown,
  Clock,
  Share2,
  CheckCircle
} from 'lucide-react';
import { Borrower } from '../types';

interface BorrowersProps {
  borrowers: Borrower[];
  onAdd: (b: Omit<Borrower, 'id' | 'repaidAmount' | 'status' | 'history'>) => void;
  onEdit: (b: Borrower) => void;
  onDelete: (id: string) => void;
  onRepay: (id: string, amount: number, note?: string) => void;
  onTopUp: (id: string, amount: number, note?: string) => void;
}

const Borrowers: React.FC<BorrowersProps> = ({ borrowers, onAdd, onEdit, onDelete, onRepay, onTopUp }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* History Modal State */
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyBorrower, setHistoryBorrower] = useState<Borrower | null>(null);

  const handleOpenHistory = (b: Borrower) => {
    setHistoryBorrower(b);
    setIsHistoryOpen(true);
  };

  const handleShareStatement = (b: Borrower) => {
    const url = `${window.location.origin}/#/statement/${b.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(`Link copied to clipboard!\nShare this with ${b.name}:\n${url}`);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      prompt("Copy this link:", url);
    });
  };

  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [repayingId, setRepayingId] = useState<string | null>(null);
  const [topUpId, setTopUpId] = useState<string | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    loanAmount: '',
    startDate: '',
    note: '',
  });

  const [repayAmount, setRepayAmount] = useState('');
  const [repayNote, setRepayNote] = useState('');

  // Top Up States
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpNote, setTopUpNote] = useState('');

  const filteredBorrowers = borrowers.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.phone.includes(searchTerm) ||
    (b.note && b.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDownloadCSV = () => {
    // Define headers
    const headers = ['Name', 'Phone', 'Email', 'Start Date', 'Lent Amount', 'Repaid Amount', 'Outstanding Balance', 'Status', 'Note'];

    // Map data to rows
    const rows = filteredBorrowers.map(b => {
      const remaining = b.totalPayable - b.repaidAmount;
      return [
        `"${b.name}"`,
        `"${b.phone}"`,
        `"${b.email}"`,
        `"${b.startDate}"`,
        b.loanAmount,
        b.repaidAmount,
        remaining,
        `"${b.status}"`,
        `"${(b.note || '').replace(/"/g, '""')}"` // Escape quotes in content
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sks_lending_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadStatement = (borrower: Borrower) => {
    // 1. Borrower Summary Section
    const summaryRows = [
      `"Borrower Name","${borrower.name}"`,
      `"Phone","${borrower.phone}"`,
      `"Email","${borrower.email}"`,
      `"Loan Start Date","${borrower.startDate}"`,
      `"Total Lent Amount","${borrower.loanAmount}"`,
      `"Total Repaid Amount","${borrower.repaidAmount}"`,
      `"Outstanding Balance","${borrower.totalPayable - borrower.repaidAmount}"`,
      `"Current Status","${borrower.status}"`,
      `"Note","${(borrower.note || '').replace(/"/g, '""')}"`
    ];

    // 2. Payment History Section
    const historyHeader = '"Payment Date","Amount Paid"';
    const historyRows = borrower.history.map(h =>
      `"${new Date(h.date).toLocaleDateString()}","${h.amount}"`
    );

    // Combine into one CSV
    const csvContent = [
      '--- Borrower Details ---',
      ...summaryRows,
      '', // Empty line for separation
      '--- Payment History ---',
      historyHeader,
      ...historyRows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Statement_${borrower.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      loanAmount: '',
      startDate: new Date().toISOString().split('T')[0],
      note: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Borrower) => {
    setEditingId(b.id);
    // Strip +91 if present for editing
    const phone = b.phone.startsWith('+91')
      ? b.phone.substring(3).trim()
      : b.phone;

    setFormData({
      name: b.name,
      phone: phone,
      email: b.email,
      loanAmount: b.loanAmount.toString(),
      startDate: b.startDate,
      note: b.note || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenRepay = (b: Borrower) => {
    setRepayingId(b.id);
    setRepayAmount('');
    setRepayNote('');
    setIsRepayModalOpen(true);
  };

  const handleOpenTopUp = (b: Borrower) => {
    setTopUpId(b.id);
    setTopUpAmount('');
    setTopUpNote('');
    setIsTopUpModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      phone: `+91 ${formData.phone}`, // Add prefix on save
      email: formData.email,
      loanAmount: Number(formData.loanAmount),
      totalPayable: Number(formData.loanAmount), // Repayment = Lent Amount (No Interest)
      startDate: formData.startDate,
      note: formData.note,
    };

    if (editingId) {
      // Find original to keep history and id
      const original = borrowers.find(b => b.id === editingId);
      if (original) {
        onEdit({ ...original, ...payload });
      }
    } else {
      onAdd(payload);
    }
    setIsModalOpen(false);
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repayingId && repayAmount) {
      onRepay(repayingId, Number(repayAmount), repayNote);
      setIsRepayModalOpen(false);
      setRepayingId(null);
      setRepayAmount('');
      setRepayNote('');
    }
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpId && topUpAmount) {
      onTopUp(topUpId, Number(topUpAmount), topUpNote);
      setIsTopUpModalOpen(false);
      setTopUpId(null);
      setTopUpAmount('');
      setTopUpNote('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Borrowers</h1>
          <p className="text-slate-400">Manage your loans and track repayments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-700 rounded-lg shadow-sm text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
          >
            <Download size={20} className="mr-2" />
            Export All
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Add Borrower
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-lg border border-white/5 shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, phone, or note..."
            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-md leading-5 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List - Desktop View (Table) */}
      <div className="hidden md:block bg-slate-900/40 backdrop-blur-md rounded-lg border border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-black/20">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Borrower</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Loan Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Repayment Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-white/5">
              {filteredBorrowers.map((borrower) => {
                const percentage = Math.min(100, (borrower.repaidAmount / borrower.totalPayable) * 100);
                const remaining = borrower.totalPayable - borrower.repaidAmount;

                return (
                  <tr key={borrower.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-900/50 border border-blue-700/50 flex items-center justify-center text-blue-400 font-bold mt-1">
                          {borrower.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{borrower.name}</div>
                          <div className="flex items-center text-sm text-slate-400 mt-0.5">
                            <Phone size={12} className="mr-1" />
                            {borrower.phone}
                          </div>
                          {borrower.note && (
                            <div className="flex items-start mt-2 text-xs text-slate-500 italic max-w-[200px]">
                              <FileText size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                              <span className="truncate">{borrower.note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-top pt-5">
                      <div className="text-sm text-slate-200">Lent: <span className="font-semibold text-white">₹{borrower.loanAmount}</span></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                      <div className="w-full max-w-xs">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">₹{borrower.repaidAmount} paid</span>
                          <span className="text-slate-400">₹{remaining} left</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${borrower.status === 'Completed' ? 'bg-green-500' : 'bg-blue-600'}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-top pt-5">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${borrower.status === 'Active'
                        ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-700/30'
                        : 'bg-green-900/30 text-green-500 border border-green-700/30'
                        }`}>
                        {borrower.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-middle">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenTopUp(borrower)}
                          title="Add to Loan (Top-up)"
                          className="text-purple-500 hover:text-purple-400 p-2 hover:bg-purple-500/10 rounded transition-colors"
                        >
                          <PlusCircle size={18} />
                        </button>

                        {borrower.status === 'Active' && (
                          <button
                            onClick={() => handleOpenRepay(borrower)}
                            title="Add Repayment"
                            className="text-green-500 hover:text-green-400 p-2 hover:bg-green-500/10 rounded transition-colors"
                          >
                            <DollarSign size={18} />
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenHistory(borrower)}
                          title="View History"
                          className="text-indigo-500 hover:text-indigo-400 p-2 hover:bg-indigo-500/10 rounded transition-colors"
                        >
                          <Clock size={18} />
                        </button>

                        <button
                          onClick={() => handleShareStatement(borrower)}
                          title="Share Link"
                          className="text-pink-500 hover:text-pink-400 p-2 hover:bg-pink-500/10 rounded transition-colors"
                        >
                          <Share2 size={18} />
                        </button>

                        <button
                          onClick={() => handleDownloadStatement(borrower)}
                          title="Download Statement"
                          className="text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-700 rounded transition-colors"
                        >
                          <FileDown size={18} />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(borrower)}
                          title="Edit"
                          className="text-blue-500 hover:text-blue-400 p-2 hover:bg-blue-500/10 rounded transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(borrower.id)}
                          title="Delete"
                          className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBorrowers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No borrowers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* List - Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {filteredBorrowers.map((borrower) => {
          const percentage = Math.min(100, (borrower.repaidAmount / borrower.totalPayable) * 100);
          const remaining = borrower.totalPayable - borrower.repaidAmount;

          return (
            <div key={borrower.id} className="bg-slate-900/40 backdrop-blur-md rounded-lg border border-white/5 p-4 shadow-sm flex flex-col gap-4">
              {/* Top Row: Info & Status */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-900/50 border border-blue-700/50 flex items-center justify-center text-blue-400 font-bold text-lg">
                    {borrower.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{borrower.name}</h3>
                    <div className="flex items-center text-xs text-slate-400 mt-1">
                      <Phone size={12} className="mr-1" />
                      {borrower.phone}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${borrower.status === 'Active'
                  ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-700/30'
                  : 'bg-green-900/30 text-green-500 border border-green-700/30'
                  }`}>
                  {borrower.status}
                </span>
              </div>

              {/* Note */}
              {borrower.note && (
                <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded border border-slate-800 italic flex items-start gap-2">
                  <FileText size={14} className="flex-shrink-0 mt-0.5 text-slate-500" />
                  <span>{borrower.note}</span>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-lg border border-white/5">
                <div>
                  <span className="text-xs text-slate-500 block">Lent Amount</span>
                  <span className="text-lg font-bold text-white">₹{borrower.loanAmount}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Paid Back</span>
                  <span className="text-lg font-bold text-emerald-400">₹{borrower.repaidAmount}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Repayment Progress</span>
                  <span className="text-slate-400">₹{remaining} remaining</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${borrower.status === 'Completed' ? 'bg-green-500' : 'bg-blue-600'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-slate-800 pt-3 mt-1">
                {/* Primary Actions Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenTopUp(borrower)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-purple-400 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors"
                  >
                    <PlusCircle size={18} />
                    <span className="text-sm font-medium">Top Up</span>
                  </button>

                  {borrower.status === 'Active' ? (
                    <button
                      onClick={() => handleOpenRepay(borrower)}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-green-400 bg-green-500/10 rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                      <DollarSign size={18} />
                      <span className="text-sm font-medium">Repay</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-3 py-2 text-slate-500 bg-slate-800/50 rounded-lg cursor-not-allowed">
                      <CheckCircle size={18} />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  )}
                </div>

                {/* Secondary Actions Row */}
                <div className="flex justify-between items-center bg-black/20 p-1.5 rounded-lg border border-white/5">
                  <button
                    onClick={() => handleOpenHistory(borrower)}
                    className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors flex-1 flex justify-center"
                    title="View History"
                  >
                    <Clock size={20} />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button
                    onClick={() => handleShareStatement(borrower)}
                    className="p-2 text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors flex-1 flex justify-center"
                    title="Share Link"
                  >
                    <Share2 size={20} />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button
                    onClick={() => handleDownloadStatement(borrower)}
                    className="p-2 text-slate-400 hover:bg-slate-700/50 rounded-lg transition-colors flex-1 flex justify-center"
                    title="Download Statement"
                  >
                    <FileDown size={20} />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button
                    onClick={() => handleOpenEdit(borrower)}
                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors flex-1 flex justify-center"
                    title="Edit"
                  >
                    <Edit2 size={20} />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button
                    onClick={() => onDelete(borrower.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-1 flex justify-center"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredBorrowers.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-900 rounded-lg border border-slate-800">
            No borrowers found matching your search.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black bg-opacity-75" onClick={() => setIsModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-slate-900/90 backdrop-blur-xl rounded-lg text-left overflow-hidden shadow-xl transform transition-all border border-white/10 sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-transparent px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                        {editingId ? 'Edit Borrower' : 'Add New Borrower'}
                      </h3>
                      <div className="mt-4 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-slate-300">Full Name</label>
                          <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full bg-slate-900/50 border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-slate-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300">Phone</label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-slate-500 sm:text-sm">+91</span>
                            </div>
                            <input
                              required
                              type="tel"
                              value={formData.phone}
                              onChange={e => setFormData({ ...formData, phone: e.target.value })}
                              className="pl-12 block w-full bg-slate-900/50 border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-slate-500"
                              placeholder="9876543210"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300">Start Date</label>
                          <input required type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="mt-1 block w-full bg-slate-900/50 border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-slate-500" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-slate-300">Loan Amount</label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-slate-500 sm:text-sm">₹</span>
                            </div>
                            <input required type="number" min="0" value={formData.loanAmount} onChange={e => setFormData({ ...formData, loanAmount: e.target.value })} className="pl-7 block w-full bg-slate-900/50 border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-slate-500" />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">Repayment amount will be equal to the loan amount (No interest).</p>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-slate-300">Note</label>
                          <textarea
                            rows={3}
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                            placeholder="Reason for loan, collateral details, etc."
                            className="mt-1 block w-full bg-slate-900/50 border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-slate-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-black/20 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-white/10">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                    {editingId ? 'Save Changes' : 'Create Borrower'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-600 shadow-sm px-4 py-2 bg-slate-700 text-base font-medium text-slate-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {isRepayModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black bg-opacity-75" onClick={() => setIsRepayModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-slate-900/90 backdrop-blur-xl rounded-lg text-left overflow-hidden shadow-xl transform transition-all border border-white/10 sm:my-8 sm:align-middle sm:max-w-sm w-full">
              <form onSubmit={handleRepaySubmit}>
                <div className="bg-transparent px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-white">Record Payment</h3>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-300">Amount Received</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-slate-500 sm:text-sm">₹</span>
                        </div>
                        <input required type="number" min="1" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} className="pl-7 block w-full bg-slate-900/50 border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500 text-lg placeholder-slate-600" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-300">Note (Optional)</label>
                      <textarea
                        rows={2}
                        value={repayNote}
                        onChange={e => setRepayNote(e.target.value)}
                        className="mt-1 block w-full bg-slate-900/50 border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:ring-green-500 focus:border-green-500 sm:text-sm placeholder-slate-600"
                        placeholder="e.g. UPI Ref #123456"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-black/20 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-white/10">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                    Confirm Payment
                  </button>
                  <button type="button" onClick={() => setIsRepayModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-600 shadow-sm px-4 py-2 bg-slate-700 text-base font-medium text-slate-200 hover:bg-slate-600 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black bg-opacity-75" onClick={() => setIsTopUpModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-slate-900/90 backdrop-blur-xl rounded-lg text-left overflow-hidden shadow-xl transform transition-all border border-white/10 sm:my-8 sm:align-middle sm:max-w-md w-full">
              <form onSubmit={handleTopUpSubmit}>
                <div className="bg-transparent px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-white">Add Money to Loan</h3>
                    <p className="mt-1 text-sm text-slate-400">Increase the existing loan amount for this borrower.</p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300">Amount to Add</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-500 sm:text-sm">₹</span>
                          </div>
                          <input required type="number" min="1" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} className="pl-7 block w-full bg-slate-900/50 border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500 placeholder-slate-600" placeholder="e.g. 5000" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300">Note (Optional)</label>
                        <textarea
                          rows={2}
                          value={topUpNote}
                          onChange={e => setTopUpNote(e.target.value)}
                          className="mt-1 block w-full bg-slate-900/50 border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500 sm:text-sm placeholder-slate-600"
                          placeholder="Reason for top-up..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-black/20 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-white/10">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                    Update Loan
                  </button>
                  <button type="button" onClick={() => setIsTopUpModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-600 shadow-sm px-4 py-2 bg-slate-700 text-base font-medium text-slate-200 hover:bg-slate-600 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && historyBorrower && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black bg-opacity-75" onClick={() => setIsHistoryOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-slate-900/90 backdrop-blur-xl rounded-lg text-left overflow-hidden shadow-xl transform transition-all border border-white/10 sm:my-8 sm:align-middle sm:max-w-2xl w-full">
              <div className="bg-transparent px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                        Repayment History: {historyBorrower.name}
                      </h3>
                      <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white">
                        <Trash2 size={20} className="rotate-45" />
                      </button>
                    </div>

                    <div className="mt-2 bg-black/20 rounded-lg overflow-hidden border border-white/5">
                      <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Note</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Amount</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {historyBorrower.history.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-sm">
                                No payments recorded yet.
                              </td>
                            </tr>
                          ) : (
                            [...historyBorrower.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((h) => (
                              <tr key={h.id}>
                                <td className="px-4 py-3 text-sm text-slate-300">
                                  {new Date(h.date).toLocaleDateString()} <span className="text-slate-500 text-xs ml-1">{new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {h.type === 'loan' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                      Top Up
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                      Payment
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate" title={h.note}>
                                  {h.note || '-'}
                                </td>
                                <td className={`px-4 py-3 text-sm text-right font-medium ${h.type === 'loan' ? 'text-white' : 'text-green-400'}`}>
                                  {h.type === 'loan' ? '+' : '+'}₹{h.amount}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                                    Success
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-black/20 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-white/10">
                <button type="button" onClick={() => setIsHistoryOpen(false)} className="w-full inline-flex justify-center rounded-md border border-slate-600 shadow-sm px-4 py-2 bg-slate-700 text-base font-medium text-slate-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Borrowers;