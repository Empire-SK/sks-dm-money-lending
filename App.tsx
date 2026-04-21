import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Borrowers from './pages/Borrowers';
import BorrowerStatement from './pages/BorrowerStatement';
import { Borrower } from './types';
import { subscribeToAuthChanges, logout } from './services/authService';
import {
  getBorrowers, addBorrower, updateBorrower, deleteBorrower,
  repayLoan, topUpLoan, getBorrower, deleteHistoryItem
} from './services/firestoreService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);

  useEffect(() => {
    let mounted = true;

    // Ensure loader stays for at least 1.8s for better UX
    const minLoaderTime = new Promise(resolve => setTimeout(resolve, 1800));

    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (!mounted) return;
      setIsAuthenticated(!!user);
      if (user) {
        try {
          const data = await getBorrowers();
          if (mounted) setBorrowers(data);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      } else {
        if (mounted) setBorrowers([]);
      }
      
      // Wait for both data and minimum time
      await minLoaderTime;
      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try { await logout(); } catch (error) { console.error('Logout failed:', error); }
  };

  const handleAddBorrower = async (newBorrowerData: Omit<Borrower, 'id' | 'repaidAmount' | 'status' | 'history'>) => {
    try {
      const created = await addBorrower({ ...newBorrowerData, repaidAmount: 0, status: 'Active', history: [] });
      setBorrowers(prev => [...prev, created]);
    } catch (error) {
      console.error('Error adding borrower:', error);
      alert('Failed to save borrower. Please try again.');
    }
  };

  const handleEditBorrower = async (updatedBorrower: Borrower) => {
    const status: 'Active' | 'Completed' = updatedBorrower.repaidAmount >= updatedBorrower.totalPayable ? 'Completed' : 'Active';
    const final = { ...updatedBorrower, status };
    try {
      await updateBorrower(final);
      setBorrowers(prev => prev.map(b => b.id === final.id ? final : b));
    } catch (error) {
      console.error('Error updating borrower:', error);
      alert('Failed to update borrower.');
    }
  };

  const handleDeleteBorrower = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this borrower?')) return;
    try {
      await deleteBorrower(id);
      setBorrowers(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting borrower:', error);
      alert('Failed to delete borrower.');
    }
  };

  const handleRepayment = async (id: string, amount: number, note?: string) => {
    try {
      await repayLoan(id, amount, note);
      const updated = await getBorrower(id);
      if (updated) setBorrowers(prev => prev.map(b => b.id === id ? updated : b));
    } catch (error) {
      console.error('Error processing repayment:', error);
      alert('Failed to process repayment.');
    }
  };

  const handleTopUp = async (id: string, amount: number, note?: string) => {
    try {
      await topUpLoan(id, amount, note);
      const updated = await getBorrower(id);
      if (updated) setBorrowers(prev => prev.map(b => b.id === id ? updated : b));
    } catch (error) {
      console.error('Error processing top-up:', error);
      alert('Failed to process top-up.');
    }
  };

  const handleDeleteHistory = async (borrowerId: string, historyItemId: string) => {
    if (!window.confirm('Delete this transaction? The loan balance will be adjusted automatically.')) return;
    try {
      await deleteHistoryItem(borrowerId, historyItemId);
      const updated = await getBorrower(borrowerId);
      if (updated) setBorrowers(prev => prev.map(b => b.id === borrowerId ? updated : b));
    } catch (error) {
      console.error('Error deleting history item:', error);
      alert('Failed to delete transaction.');
    }
  };

  /* ── Branded Splash Loader ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-5 select-none overflow-hidden">
        {/* Animated logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-emerald-600/15 border border-emerald-500/25
            flex items-center justify-center shadow-2xl shadow-emerald-900/20">
            <TrendingUp className="w-10 h-10 text-emerald-400 animate-arrowHike" strokeWidth={2.5} />
          </div>
          {/* Subtle glow ring */}
          <div className="absolute -inset-4 bg-emerald-500/5 rounded-full blur-2xl animate-pulse" />
        </div>

        {/* Brand name */}
        <div className="text-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-2xl font-bold bg-gradient-to-br from-zinc-100 to-zinc-400 bg-clip-text text-transparent tracking-tight">
            SKS Lending
          </h1>
          <p className="text-xs font-medium text-emerald-500/60 uppercase tracking-[0.2em] mt-2">
            Secure Management
          </p>
        </div>

        {/* Improved Loader dots */}
        <div className="flex items-center gap-2 mt-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-emerald-500/30 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />

        {/* Public Statement Route */}
        <Route path="/statement/:id" element={<BorrowerStatement />} />

        <Route path="/" element={
          isAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" replace />
        }>
          <Route index element={<Dashboard borrowers={borrowers} />} />
          <Route path="borrowers" element={
            <Borrowers
              borrowers={borrowers}
              onAdd={handleAddBorrower}
              onEdit={handleEditBorrower}
              onDelete={handleDeleteBorrower}
              onRepay={handleRepayment}
              onTopUp={handleTopUp}
              onDeleteHistory={handleDeleteHistory}
            />
          } />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;