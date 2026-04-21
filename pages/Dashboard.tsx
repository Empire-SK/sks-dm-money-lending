import React, { useMemo } from 'react';
import { Users, CreditCard, Wallet, AlertCircle } from 'lucide-react';
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

const Dashboard: React.FC<DashboardProps> = ({ borrowers }) => {
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
    </div>
  );
};

export default Dashboard;