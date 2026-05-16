import React, { useMemo, useState } from 'react';
import { Users, CreditCard, Wallet, AlertCircle, Trophy } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import DashboardStatsCard from '../components/DashboardStatsCard';
import { Borrower } from '../types';

interface DashboardProps {
  borrowers: Borrower[];
}

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid rgba(63,63,70,0.8)',
  backgroundColor: 'rgba(24,24,27,0.95)',
  backdropFilter: 'blur(12px)',
  color: '#e4e4e7',
  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
  padding: '10px 14px',
};

const tooltipLabelStyle = {
  color: '#a1a1aa',
  fontSize: '11px',
  marginBottom: '4px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
};

const tooltipItemStyle = {
  color: '#f4f4f5',
  fontSize: '13px',
  fontWeight: '600',
  padding: '2px 0',
};

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
  const [leaderboardCategory, setLeaderboardCategory] = useState<'pending' | 'loan' | 'repaid'>('pending');
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
          <h1 className="text-xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Overview of your lending portfolio</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live data
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
        <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-300">Portfolio Recovery Rate</span>
              <span className="text-sm font-bold text-emerald-400">{recoveryRate}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${recoveryRate}%` }}
              />
            </div>
          </div>
          <div className="sm:border-l sm:border-zinc-800 sm:pl-4 flex sm:flex-col gap-3 sm:gap-1 text-xs text-zinc-500">
            <span>₹{stats.totalRepaid.toLocaleString('en-IN')} <span className="text-zinc-600">collected</span></span>
            <span>₹{stats.totalOutstanding.toLocaleString('en-IN')} <span className="text-zinc-600">pending</span></span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="glass-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-200">Monthly Collections</h3>
            <p className="text-xs text-zinc-600 mt-0.5">Transaction volume by month</p>
          </div>
          <div className="h-56">
            {collectionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collectionData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(63,63,70,0.5)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Collected']}
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-zinc-600">No collection data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-200">Portfolio Distribution</h3>
            <p className="text-xs text-zinc-600 mt-0.5">Repaid vs outstanding breakdown</p>
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
                      <span style={{ color: '#a1a1aa', fontSize: '12px' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-zinc-600">No portfolio data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Trophy size={16} className="text-amber-400" />
              Active Borrowers Leaderboard
            </h3>
            <p className="text-xs text-zinc-600 mt-0.5">Top 5 by category</p>
          </div>
          <div className="flex gap-2 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/60">
            {(['pending', 'loan', 'repaid'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setLeaderboardCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  leaderboardCategory === cat 
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {topBorrowers.length > 0 ? topBorrowers.map((b, idx) => {
            const value = leaderboardCategory === 'pending' 
              ? b.totalPayable - b.repaidAmount
              : leaderboardCategory === 'loan' ? b.loanAmount : b.repaidAmount;
            
            return (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40 hover:bg-zinc-900/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-6 text-center text-xs font-bold ${idx === 0 ? 'text-amber-400 text-sm' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-zinc-600'}`}>
                    #{idx + 1}
                  </div>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0 ${getAvatarColor(b.name)}`}>
                    {b.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{b.name}</p>
                    <p className="text-xs text-zinc-600">{b.phone}</p>
                  </div>
                </div>
                <div className={`text-sm font-bold ${
                  leaderboardCategory === 'pending' ? 'text-amber-400' 
                  : leaderboardCategory === 'loan' ? 'text-zinc-200' 
                  : 'text-emerald-400'
                }`}>
                  ₹{value.toLocaleString('en-IN')}
                </div>
              </div>
            );
          }) : (
            <div className="py-6 text-center text-sm text-zinc-600">No active borrowers found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;