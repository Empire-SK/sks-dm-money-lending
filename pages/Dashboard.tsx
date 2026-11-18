import React, { useMemo, useState } from 'react';
import { Users, CreditCard, Wallet, AlertCircle, Trophy } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import DashboardStatsCard from '../components/DashboardStatsCard';
import { useTheme } from '../contexts/ThemeContext';
import { Borrower } from '../types';

interface DashboardProps {
  borrowers: Borrower[];
}

const PIE_COLORS = ['#10b981', '#f59e0b'];

const AVATAR_COLORS = [
  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'bg-violet-500/15 text-violet-400 border-violet-500/25',
  'bg-sky-500/15 text-sky-400 border-sky-500/25',
  'bg-amber-500/15 text-amber-400 border-amber-500/25',
  'bg-rose-500/15 text-rose-400 border-rose-500/25',
];
const getAvatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const Dashboard: React.FC<DashboardProps> = ({ borrowers }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [leaderboardCategory, setLeaderboardCategory] = useState<'pending' | 'loan' | 'repaid'>('pending');

  const tooltipStyle = isLight
    ? {
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        color: '#0F172A',
        boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.08)',
        padding: '10px 14px',
      }
    : {
        borderRadius: '16px',
        border: '1px solid rgba(63,63,70,0.8)',
        backgroundColor: 'rgba(24,24,27,0.95)',
        backdropFilter: 'blur(12px)',
        color: '#e4e4e7',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        padding: '10px 14px',
      };

  const tooltipLabelStyle = {
    color: isLight ? '#64748B' : '#a1a1aa',
    fontSize: '11px',
    marginBottom: '4px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  };

  const tooltipItemStyle = {
    color: isLight ? '#0F172A' : '#f4f4f5',
    fontSize: '13px',
    fontWeight: '700',
    padding: '2px 0',
  };
  const stats = useMemo(() => {
    return borrowers.reduce(
      (acc, curr) => {
        acc.totalLent += curr.loanAmount;
        acc.totalRepaid += curr.repaidAmount;
        acc.totalOutstanding += (curr.totalPayable - curr.repaidAmount);
        if (curr.status === 'Active') acc.activeLoans += 1;
        return acc;
      },
      { totalLent: 0, totalRepaid: 0, totalOutstanding: 0, activeLoans: 0 }
    );
  }, [borrowers]);

  const pieData = [
    { name: 'Repaid', value: stats.totalRepaid },
    { name: 'Outstanding', value: stats.totalOutstanding },
  ];

  const collectionData = useMemo(() => {
    const months: Record<string, number> = {};
    borrowers.forEach(b => {
      b.history.forEach(h => {
        const key = new Date(h.date).toLocaleString('default', { month: 'short', year: '2-digit' });
        months[key] = (months[key] || 0) + h.amount;
      });
    });
    return Object.entries(months).map(([name, amount]) => ({ name, amount }));
  }, [borrowers]);

  const recoveryRate = stats.totalLent > 0
    ? Math.round((stats.totalRepaid / stats.totalLent) * 100)
    : 0;

  const activeBorrowers = useMemo(() => borrowers.filter(b => b.status === 'Active'), [borrowers]);

  const topBorrowers = useMemo(() => {
    return [...activeBorrowers].sort((a, b) => {
      if (leaderboardCategory === 'pending') {
        const pA = a.totalPayable - a.repaidAmount;
        const pB = b.totalPayable - b.repaidAmount;
        return pB - pA;
      }
      if (leaderboardCategory === 'loan') {
        return b.loanAmount - a.loanAmount;
      }
      if (leaderboardCategory === 'repaid') {
        return b.repaidAmount - a.repaidAmount;
      }
      return 0;
    }).slice(0, 5);
  }, [activeBorrowers, leaderboardCategory]);

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">Overview of your lending portfolio</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-400 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#65A30D] dark:bg-[#A3E635] animate-pulse" />
          Live Lending Data
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatsCard
          title="Active Loans"
          value={stats.activeLoans}
          icon={Users}
          accent="sky"
          trend={`${borrowers.length} total borrowers`}
        />
        <DashboardStatsCard
          title="Total Lent"
          value={`₹${stats.totalLent.toLocaleString('en-IN')}`}
          icon={CreditCard}
          accent="violet"
        />
        <DashboardStatsCard
          title="Total Repaid"
          value={`₹${stats.totalRepaid.toLocaleString('en-IN')}`}
          icon={Wallet}
          accent="emerald"
        />
        <DashboardStatsCard
          title="Outstanding"
          value={`₹${stats.totalOutstanding.toLocaleString('en-IN')}`}
          icon={AlertCircle}
          accent="amber"
        />
      </div>

      {/* Recovery Rate Banner */}
      {borrowers.length > 0 && (
        <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300">Portfolio Recovery Rate</span>
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">{recoveryRate}%</span>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#65A30D] to-[#A3E635] dark:from-emerald-500 dark:to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${recoveryRate}%` }}
              />
            </div>
          </div>
          <div className="sm:border-l sm:border-gray-200 dark:sm:border-zinc-800 sm:pl-4 flex sm:flex-col gap-3 sm:gap-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <span>₹{stats.totalRepaid.toLocaleString('en-IN')} <span className="text-slate-400 dark:text-zinc-500">collected</span></span>
            <span>₹{stats.totalOutstanding.toLocaleString('en-IN')} <span className="text-slate-400 dark:text-zinc-500">pending</span></span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="glass-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Monthly Collections</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Transaction volume by month</p>
          </div>
          <div className="h-56">
            {collectionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collectionData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? '#E5E7EB' : 'rgba(63,63,70,0.5)'} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isLight ? '#64748B' : '#71717a', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isLight ? '#64748B' : '#71717a', fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Collected']}
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={{ fill: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-slate-500 dark:text-zinc-500">No collection data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Portfolio Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Repaid vs outstanding breakdown</p>
          </div>
          <div className="h-56">
            {(stats.totalRepaid + stats.totalOutstanding) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    formatter={(value) => (
                      <span style={{ color: isLight ? '#475569' : '#a1a1aa', fontSize: '12px', fontWeight: '600' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-slate-500 dark:text-zinc-500">No portfolio data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              Active Borrowers Leaderboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Top 5 by category</p>
          </div>
          <div className="flex gap-1.5 bg-gray-100 dark:bg-zinc-900/60 p-1 rounded-2xl border border-gray-200/80 dark:border-zinc-800/60">
            {(['pending', 'loan', 'repaid'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setLeaderboardCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  leaderboardCategory === cat 
                    ? 'bg-[#A3E635] text-[#0D2A18] shadow-sm' 
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {topBorrowers.length > 0 ? topBorrowers.map((b, idx) => {
            const value = leaderboardCategory === 'pending' 
              ? b.totalPayable - b.repaidAmount
              : leaderboardCategory === 'loan' ? b.loanAmount : b.repaidAmount;
            
            return (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/40 hover:bg-gray-100/80 dark:hover:bg-zinc-900/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-6 text-center text-xs font-black ${idx === 0 ? 'text-amber-500 text-sm' : idx === 1 ? 'text-slate-500 dark:text-zinc-300' : idx === 2 ? 'text-amber-700 dark:text-amber-600' : 'text-slate-400 dark:text-zinc-500'}`}>
                    #{idx + 1}
                  </div>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0 ${getAvatarColor(b.name)}`}>
                    {b.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{b.name}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{b.phone}</p>
                  </div>
                </div>
                <div className={`text-sm font-black tabular-nums ${
                  leaderboardCategory === 'pending' ? 'text-amber-600 dark:text-amber-400' 
                  : leaderboardCategory === 'loan' ? 'text-slate-800 dark:text-zinc-200' 
                  : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  ₹{value.toLocaleString('en-IN')}
                </div>
              </div>
            );
          }) : (
            <div className="py-6 text-center text-sm text-slate-500 dark:text-zinc-500">No active borrowers found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;