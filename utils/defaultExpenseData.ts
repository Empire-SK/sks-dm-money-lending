import { ExpenseCategory, ExpenseAccount } from '../types/expense';

export const DEFAULT_CATEGORIES: Omit<ExpenseCategory, 'id' | 'userId' | 'createdAt'>[] = [
  {
    name: 'Food & Restaurants',
    icon: 'Utensils',
    color: '#10B981', // emerald
    subcategories: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Cafe'],
    isDefault: true,
  },
  {
    name: 'Travel & Transportation',
    icon: 'Car',
    color: '#0EA5E9', // sky
    subcategories: ['Bus', 'Train', 'Fuel', 'Taxi', 'Auto'],
    isDefault: true,
  },
  {
    name: 'Shopping',
    icon: 'ShoppingBag',
    color: '#8B5CF6', // violet
    subcategories: ['Clothes', 'Electronics', 'Accessories'],
    isDefault: true,
  },
  {
    name: 'Rent & Accommodation',
    icon: 'Home',
    color: '#F59E0B', // amber
    subcategories: ['Rent', 'Hostel', 'Maintenance'],
    isDefault: true,
  },
  {
    name: 'Bills & Utilities',
    icon: 'Zap',
    color: '#06B6D4', // cyan
    subcategories: ['Electricity', 'Internet', 'Mobile', 'Water', 'Gas'],
    isDefault: true,
  },
  {
    name: 'Subscriptions',
    icon: 'Tv',
    color: '#F43F5E', // rose
    subcategories: ['OTT', 'Software', 'Memberships'],
    isDefault: true,
  },
  {
    name: 'Education',
    icon: 'GraduationCap',
    color: '#6366F1', // indigo
    subcategories: ['Books', 'Courses', 'College'],
    isDefault: true,
  },
  {
    name: 'Entertainment',
    icon: 'Film',
    color: '#D946EF', // fuchsia
    subcategories: ['Movies', 'Games', 'Outings'],
    isDefault: true,
  },
  {
    name: 'Health',
    icon: 'HeartPulse',
    color: '#EF4444', // red
    subcategories: ['Medicine', 'Hospital', 'Medical', 'Gym'],
    isDefault: true,
  },
  {
    name: 'Personal & Family',
    icon: 'Users',
    color: '#14B8A6', // teal
    subcategories: ['Personal care', 'Family expenses', 'Gifts'],
    isDefault: true,
  },
  {
    name: 'Other',
    icon: 'MoreHorizontal',
    color: '#71717A', // zinc
    subcategories: ['Miscellaneous', 'Unexpected'],
    isDefault: true,
  },
];

export const DEFAULT_ACCOUNTS: Omit<ExpenseAccount, 'id' | 'userId' | 'createdAt'>[] = [
  {
    name: 'Cash',
    type: 'cash',
    openingBalance: 0,
    color: '#10B981',
    icon: 'Banknote',
    notes: 'Physical cash in hand',
  },
  {
    name: 'Primary UPI / GPay',
    type: 'upi',
    openingBalance: 0,
    color: '#3B82F6',
    icon: 'Smartphone',
    notes: 'UPI enabled account (Google Pay, PhonePe, Paytm)',
  },
  {
    name: 'Federal Bank / Savings',
    type: 'bank',
    openingBalance: 0,
    color: '#8B5CF6',
    icon: 'Landmark',
    notes: 'Bank savings account (Federal Bank, HDFC, SBI, etc.)',
  },
];

export const getInitializedDefaultCategories = (userId: string = 'default'): ExpenseCategory[] => {
  return DEFAULT_CATEGORIES.map((c, index) => ({
    ...c,
    id: `cat_default_${index + 1}`,
    userId,
    createdAt: '2026-01-01T00:00:00.000Z',
  }));
};

export const getInitializedDefaultAccounts = (userId: string = 'default'): ExpenseAccount[] => {
  return DEFAULT_ACCOUNTS.map((a, index) => ({
    ...a,
    id: `acc_default_${index + 1}`,
    userId,
    createdAt: '2026-01-01T00:00:00.000Z',
  }));
};
