export interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  type?: 'payment' | 'loan';
  note?: string;
}

export interface Borrower {
  id: string;
  name: string;
  phone: string;
  email: string;
  loanAmount: number;     // Principal
  totalPayable: number;   // Same as Principal (No Interest)
  repaidAmount: number;   // Total repaid so far
  startDate: string;
  status: 'Active' | 'Completed';
  history: PaymentHistory[];
  note?: string;
}

export interface DashboardStats {
  totalBorrowers: number;
  totalLent: number;
  totalRepaid: number;
  totalOutstanding: number;
  activeLoans: number;
}

export interface User {
  email: string;
  name: string;
}