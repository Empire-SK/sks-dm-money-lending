import React, { useState } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  FolderTree,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useExpense } from '../../contexts/ExpenseContext';
import { ExpenseNav } from '../../components/expense/ExpenseNav';
import { CategoryIcon } from '../../components/expense/CategoryIcon';
import { CategoryModal } from '../../components/expense/CategoryModal';
import { ExpenseCategory } from '../../types/expense';
import { formatINR, formatMonthYear } from '../../utils/expenseCalculations';

export const Categories: React.FC = () => {
  const {
    categories,
    transactions,
    selectedMonthYear,
    monthlySummary,
    handleDeleteCategory,
  } = useExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  const handleDelete = async (category: ExpenseCategory) => {
    // Check if category has any transactions in all history
    const hasTx = transactions.some((t) => t.categoryId === category.id);
    if (hasTx) {
      alert(`Cannot delete category "${category.name}" because it is associated with existing transactions. Please reassign or delete those transactions first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      await handleDeleteCategory(category.id);
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ExpenseNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100">Expense Categories</h2>
          <p className="text-[11px] sm:text-xs text-zinc-500">
            Manage your categories, subcategories, custom icons, and visual themes
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="btn-primary text-xs py-2 px-3 self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>New Category</span>
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const spentThisMonth = monthlySummary.categorySpending[cat.id] || 0;
          const totalHistoryTxCount = transactions.filter((t) => t.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              className="glass-card p-4 sm:p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white border flex-shrink-0"
                      style={{
                        backgroundColor: `${cat.color || '#10B981'}15`,
                        borderColor: `${cat.color || '#10B981'}30`,
                        color: cat.color || '#10B981',
                      }}
                    >
                      <CategoryIcon name={cat.icon} size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-500">
                        {totalHistoryTxCount} total transactions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      title="Edit category"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Subcategories tags */}
                <div className="mt-3 sm:mt-4">
                  <p className="text-[9px] sm:text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Subcategories ({cat.subcategories?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cat.subcategories && cat.subcategories.length > 0 ? (
                      cat.subcategories.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-300 text-[10px] border border-zinc-800 font-medium"
                        >
                          {sub}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-600 italic">None defined</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Monthly Spent */}
              <div className="mt-4 sm:mt-5 pt-2.5 sm:pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-500 text-[11px]">
                  Spent ({formatMonthYear(selectedMonthYear)}):
                </span>
                <span className="font-bold text-zinc-200 tabular-nums">
                  {formatINR(spentThisMonth)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        initialData={editingCategory}
      />
    </div>
  );
};
