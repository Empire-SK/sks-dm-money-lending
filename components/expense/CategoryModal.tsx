import React, { useState, useEffect } from 'react';
import { X, Tag, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useExpense } from '../../contexts/ExpenseContext';
import { ExpenseCategory } from '../../types/expense';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ExpenseCategory | null;
}

const CATEGORY_COLORS = [
  '#10B981', // emerald
  '#0EA5E9', // sky
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EC4899', // pink
  '#EF4444', // red
  '#06B6D4', // cyan
  '#14B8A6', // teal
  '#6366F1', // indigo
  '#D946EF', // fuchsia
  '#71717A', // zinc
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { currentUser } = useAuth();
  const { handleAddCategory, handleEditCategory } = useExpense();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setIcon(initialData.icon || 'Tag');
      setColor(initialData.color || CATEGORY_COLORS[0]);
      setSubcategories(initialData.subcategories || []);
    } else {
      setName('');
      setIcon('Tag');
      setColor(CATEGORY_COLORS[0]);
      setSubcategories([]);
    }
    setNewSubcategory('');
    setError('');
  }, [initialData, isOpen]);

  const handleAddSubcat = () => {
    const trimmed = newSubcategory.trim();
    if (trimmed && !subcategories.includes(trimmed)) {
      setSubcategories([...subcategories, trimmed]);
      setNewSubcategory('');
    }
  };

  const handleRemoveSubcat = (sub: string) => {
    setSubcategories(subcategories.filter((s) => s !== sub));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        userId: currentUser?.uid || '',
        name: name.trim(),
        icon,
        color,
        subcategories,
        isDefault: initialData?.isDefault ?? false,
      };

      if (initialData) {
        await handleEditCategory({ ...initialData, ...payload });
      } else {
        await handleAddCategory(payload);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl border flex items-center justify-center text-white"
              style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, color }}
            >
              <CategoryIcon name={icon} size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {initialData ? 'Edit Category' : 'New Expense Category'}
              </h2>
              <p className="text-xs text-zinc-500">
                Customize icons, colors, and subcategories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="modal-body space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label-base">Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Gym & Fitness, Vacation, Pets"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="label-base">Select Icon</label>
              <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 p-2 bg-zinc-950 rounded-xl border border-zinc-800 max-h-36 overflow-y-auto">
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                      icon === ic
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    <CategoryIcon name={ic} size={18} />
                  </button>
                ))}
              </div>
            </div>

            {/* Color Theme */}
            <div>
              <label className="label-base">Color Theme</label>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Subcategories */}
            <div>
              <label className="label-base">Subcategories</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Protein, Trainer, Supplements"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubcat();
                    }
                  }}
                  className="input-base"
                />
                <button
                  type="button"
                  onClick={handleAddSubcat}
                  className="btn-secondary px-3 py-2 text-xs"
                >
                  <Plus size={16} />
                </button>
              </div>

              {subcategories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                  {subcategories.map((sub) => (
                    <span
                      key={sub}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700/60 text-zinc-300"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcat(sub)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500 italic">No subcategories added yet.</p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Category'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
