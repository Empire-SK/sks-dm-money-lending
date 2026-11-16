import React, { useState, useMemo } from 'react';
import {
  Coins,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Calendar,
  Award,
  DollarSign,
  TrendingUp,
  Download,
} from 'lucide-react';
import { useExpense } from '../../contexts/ExpenseContext';
import { ExpenseNav } from '../../components/expense/ExpenseNav';
import { SalaryModal } from '../../components/expense/SalaryModal';
import { SalaryRecord } from '../../types/expense';
import { formatINR, formatMonthYear } from '../../utils/expenseCalculations';

export const Salary: React.FC = () => {
  const { accounts, salaryRecords, handleDeleteSalary } = useExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryRecord | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Extract available years from records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(new Date().getFullYear().toString());
    salaryRecords.forEach((s) => {
      if (s.monthYear) {
        years.add(s.monthYear.slice(0, 4));
      }
    });
    return Array.from(years).sort().reverse();
  }, [salaryRecords]);

  // Filtered by year
  const filteredRecords = useMemo(() => {
    return salaryRecords.filter((s) => s.monthYear.startsWith(selectedYear));
  }, [salaryRecords, selectedYear]);

  // Yearly summary calculations
  const yearlyStats = useMemo(() => {
    return filteredRecords.reduce(
      (acc, s) => {
        acc.totalBase += s.baseSalary || 0;
        acc.totalBonus += s.bonus || 0;
        acc.totalIncentive += s.incentive || 0;
        acc.totalOther += s.otherIncome || 0;
        acc.grandTotal += s.totalIncome || 0;
        return acc;
      },
      { totalBase: 0, totalBonus: 0, totalIncentive: 0, totalOther: 0, grandTotal: 0 }
    );
  }, [filteredRecords]);

  const handleDelete = async (record: SalaryRecord) => {
    if (window.confirm(`Delete salary record for ${record.monthYear}? The corresponding income transaction will also be removed.`)) {
      await handleDeleteSalary(record.id);
    }
  };

  const handleEdit = (record: SalaryRecord) => {
    setEditingSalary(record);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ExpenseNav />

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100">Monthly Salary Management</h2>
          <p className="text-[11px] sm:text-xs text-zinc-500">
            Record manual monthly salary deposits, bonuses, and incentives
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-500 font-medium">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent border-none text-zinc-200 text-xs focus:outline-none cursor-pointer font-bold select-inline"
            >
              {availableYears.map((y) => (
                <option key={y} value={y} className="bg-zinc-900 text-zinc-100">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setEditingSalary(null);
              setIsModalOpen(true);
            }}
            className="btn-primary text-xs py-2 px-3"
          >
            <Plus size={14} />
            <span>Add Salary</span>
          </button>
        </div>
      </div>

      {/* Yearly Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="glass-card p-3.5 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Total {selectedYear} Income
          </p>
          <p className="text-lg sm:text-2xl font-bold mt-1 text-emerald-400 tabular-nums truncate">
            {formatINR(yearlyStats.grandTotal)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 truncate">{filteredRecords.length} recorded months</p>
        </div>

        <div className="glass-card p-3.5 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Base Salary Total
          </p>
          <p className="text-lg sm:text-2xl font-bold mt-1 text-zinc-100 tabular-nums truncate">
            {formatINR(yearlyStats.totalBase)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 truncate">
            Avg: {formatINR(filteredRecords.length ? yearlyStats.totalBase / filteredRecords.length : 0)} / mo
          </p>
        </div>

        <div className="glass-card p-3.5 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Bonuses & Incentives
          </p>
          <p className="text-lg sm:text-2xl font-bold mt-1 text-amber-400 tabular-nums truncate">
            {formatINR(yearlyStats.totalBonus + yearlyStats.totalIncentive)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 truncate">
            Bonus: {formatINR(yearlyStats.totalBonus)}
          </p>
        </div>

        <div className="glass-card p-3.5 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Other Incomes
          </p>
          <p className="text-lg sm:text-2xl font-bold mt-1 text-sky-400 tabular-nums truncate">
            {formatINR(yearlyStats.totalOther)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 truncate">Supplementary income</p>
        </div>
      </div>

      {/* Salary History */}
      <div className="glass-card overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-100">
            Salary History ({selectedYear})
          </h3>
          <span className="text-[11px] sm:text-xs text-zinc-500">
            {filteredRecords.length} records found
          </span>
        </div>

        {/* Mobile View: Card-based list (md:hidden) */}
        <div className="md:hidden divide-y divide-zinc-800/60">
          {filteredRecords.map((record) => {
            const acc = accounts.find((a) => a.id === record.accountId);

            return (
              <div key={record.id} className="p-3.5 space-y-2 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-zinc-100">
                    {formatMonthYear(record.monthYear)}
                  </h4>
                  <span className="text-sm font-extrabold text-emerald-400 tabular-nums">
                    {formatINR(record.totalIncome)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-850">
                  <div>
                    <span className="text-zinc-500">Base Salary:</span>
                    <p className="font-semibold text-zinc-200">{formatINR(record.baseSalary)}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Credited To:</span>
                    <p className="font-semibold text-zinc-200 truncate">{acc?.name || 'Account'}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Bonus & Inc:</span>
                    <p className="font-semibold text-amber-400">
                      {record.bonus + record.incentive > 0 ? formatINR(record.bonus + record.incentive) : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Received Date:</span>
                    <p className="font-semibold text-zinc-300">{record.receivedDate}</p>
                  </div>
                </div>

                {record.note && (
                  <p className="text-[11px] text-zinc-500 italic">
                    "{record.note}"
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-850">
                  <button
                    onClick={() => handleEdit(record)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1 text-xs"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(record)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1 text-xs"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })}

          {filteredRecords.length === 0 && (
            <div className="py-10 text-center text-xs text-zinc-500">
              No salary records logged for {selectedYear}.
            </div>
          )}
        </div>

        {/* Desktop View: Full Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4">Credited Account</th>
                <th className="py-3 px-4">Received Date</th>
                <th className="py-3 px-4 text-right">Base Salary</th>
                <th className="py-3 px-4 text-right">Bonus</th>
                <th className="py-3 px-4 text-right">Incentives</th>
                <th className="py-3 px-4 text-right">Other Income</th>
                <th className="py-3 px-4 text-right font-bold text-zinc-300">Total Income</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredRecords.map((record) => {
                const acc = accounts.find((a) => a.id === record.accountId);

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-zinc-800/40 transition-colors group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-zinc-200 text-sm">
                        {formatMonthYear(record.monthYear)}
                      </div>
                      {record.note && (
                        <div className="text-[10px] text-zinc-500 truncate max-w-xs">
                          {record.note}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-zinc-400">
                      {acc?.name || 'Account'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-zinc-400">
                      {record.receivedDate}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap text-zinc-300 font-medium">
                      {formatINR(record.baseSalary)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap text-amber-400">
                      {record.bonus > 0 ? formatINR(record.bonus) : '-'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap text-amber-400">
                      {record.incentive > 0 ? formatINR(record.incentive) : '-'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap text-sky-400">
                      {record.otherIncome > 0 ? formatINR(record.otherIncome) : '-'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-emerald-400 text-sm">
                      {formatINR(record.totalIncome)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Edit salary record"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(record)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete salary record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    No salary records logged for {selectedYear}. Click "Add Salary" to enter your salary.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SalaryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSalary(null);
        }}
        initialData={editingSalary}
      />
    </div>
  );
};
