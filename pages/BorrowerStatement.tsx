import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBorrower } from '../services/firestoreService';
import { Borrower } from '../types';
import { Phone, CheckCircle, Clock, AlertCircle, FileDown, Printer, TrendingDown, TrendingUp, Mail } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const BorrowerStatement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [borrower, setBorrower] = useState<Borrower | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBorrower = async () => {
            if (!id) return;
            try {
                const data = await getBorrower(id);
                if (data) {
                    setBorrower(data);
                } else {
                    setError('Statement not found. The link may be invalid or expired.');
                }
            } catch (err) {
                console.error(err);
                setError('Unable to load statement. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchBorrower();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-9 h-9 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                    <p className="text-sm text-zinc-500">Loading statement...</p>
                </div>
            </div>
        );
    }

    if (error || !borrower) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={28} className="text-red-400" />
                    </div>
                    <h1 className="text-lg font-bold text-zinc-100 mb-2">Statement Unavailable</h1>
                    <p className="text-sm text-zinc-500 leading-relaxed">{error || 'Statement not found.'}</p>
                </div>
            </div>
        );
    }

    const percentage = Math.min(100, borrower.totalPayable > 0
        ? (borrower.repaidAmount / borrower.totalPayable) * 100 : 0);
    const remaining = borrower.totalPayable - borrower.repaidAmount;

    const handlePrint = () => {
        const element = document.getElementById('statement-content');
        const opt = {
            margin: 10,
            filename: `Statement_${borrower.name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 } as any,
            html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 1024 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } as any
        };
        html2pdf().from(element).set(opt).save();
    };

    const handleDownloadCSV = () => {
        const summaryRows = [
            `"Borrower Name","${borrower.name}"`,
            `"Phone","${borrower.phone}"`,
            `"Email","${borrower.email}"`,
            `"Loan Start Date","${borrower.startDate}"`,
            `"Total Lent Amount","${borrower.loanAmount}"`,
            `"Total Repaid Amount","${borrower.repaidAmount}"`,
            `"Outstanding Balance","${remaining}"`,
            `"Current Status","${borrower.status}"`
        ];
        const historyRows = borrower.history.map(h =>
            `"${new Date(h.date).toLocaleDateString()}","${h.type === 'loan' ? 'Top Up' : 'Payment'}","${h.amount}","${h.type === 'loan' ? 'Disbursed' : 'Success'}"`
        );
        const csvContent = [
            '--- Borrower Statement ---',
            ...summaryRows, '',
            '--- Transaction History ---',
            '"Payment Date","Type","Amount","Status"',
            ...historyRows
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Statement_${borrower.name.replace(/\s+/g, '_')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 px-4 py-8 md:py-12">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-600/4 rounded-full blur-[100px]" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-600/3 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-2xl mx-auto space-y-5" id="statement-content">

                {/* ── Brand Header ── */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        SKS DM Money Lending Services
                    </div>
                </div>

                {/* ── Borrower Card ── */}
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
                    {/* Card top accent */}
                    <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

                    <div className="p-6 md:p-8">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-zinc-800/80">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
                                    {borrower.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                    {borrower.phone && (
                                        <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                                            <Phone size={13} /> {borrower.phone}
                                        </span>
                                    )}
                                    {borrower.email && (
                                        <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                                            <Mail size={13} /> {borrower.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Action Buttons */}
                                <div className="flex gap-2 no-print" data-html2canvas-ignore="true">
                                    <button
                                        onClick={handlePrint}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                            bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60
                                            text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
                                        title="Download PDF"
                                    >
                                        <Printer size={14} />
                                        <span className="hidden sm:inline">PDF</span>
                                    </button>
                                    <button
                                        onClick={handleDownloadCSV}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                            bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60
                                            text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
                                        title="Download CSV"
                                    >
                                        <FileDown size={14} />
                                        <span className="hidden sm:inline">CSV</span>
                                    </button>
                                </div>
                                <span className={borrower.status === 'Completed'
                                    ? 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }>
                                    {borrower.status === 'Completed' ? 'Loan Repaid' : 'Active Loan'}
                                </span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                            {[
                                { label: 'Loan Amount', value: `₹${borrower.loanAmount.toLocaleString('en-IN')}`, color: 'text-zinc-100' },
                                { label: 'Repaid', value: `₹${borrower.repaidAmount.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
                                { label: 'Outstanding', value: `₹${remaining.toLocaleString('en-IN')}`, color: 'text-amber-400' },
                                { label: 'Start Date', value: new Date(borrower.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), color: 'text-zinc-300' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4">
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">{stat.label}</p>
                                    <p className={`text-lg font-bold mt-1.5 ${stat.color}`}>{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Progress */}
                        <div className="mt-6">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-zinc-500 font-medium">Repayment Progress</span>
                                <span className="text-zinc-300 font-semibold">{Math.round(percentage)}%</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Transaction History ── */}
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
                    <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent" />
                    <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center gap-2">
                        <Clock size={16} className="text-zinc-500" />
                        <h2 className="text-sm font-semibold text-zinc-200">Transaction History</h2>
                        <span className="ml-auto text-xs text-zinc-600">{borrower.history.length} records</span>
                    </div>

                    {borrower.history.length === 0 ? (
                        <div className="py-14 text-center">
                            <p className="text-sm text-zinc-600">No transactions recorded yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-zinc-950/40 border-b border-zinc-800/60">
                                    <tr>
                                        {['Date', 'Type', 'Amount', 'Status'].map(h => (
                                            <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60">
                                    {[...borrower.history]
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((payment) => (
                                            <tr key={payment.id} className="hover:bg-zinc-800/20 transition-colors">
                                                <td className="px-5 py-4">
                                                    <p className="text-sm text-zinc-200">
                                                        {new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs text-zinc-600 mt-0.5">
                                                        {new Date(payment.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {payment.type === 'loan' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                                            <TrendingUp size={10} /> Top Up
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            <TrendingDown size={10} /> Payment
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`px-5 py-4 text-sm font-semibold ${payment.type === 'loan' ? 'text-violet-400' : 'text-emerald-400'}`}>
                                                    +₹{payment.amount.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle size={10} /> Success
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-zinc-700 pb-4">
                    Generated by SKS DM Money Lending Services &middot; {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
};

export default BorrowerStatement;
