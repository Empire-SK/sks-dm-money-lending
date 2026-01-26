import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Borrowers from './pages/Borrowers';
import BorrowerStatement from './pages/BorrowerStatement';
import { Borrower } from './types';
import { subscribeToAuthChanges, logout } from './services/authService';
import { getBorrowers, addBorrower, updateBorrower, deleteBorrower, repayLoan, topUpLoan, getBorrower } from './services/firestoreService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);

  // Initialize auth and data
  useEffect(() => {
    let mounted = true;
    console.log("App initializing...");

    // Safety timeout in case Firebase hangs
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn("Auth check timed out. Defaulting to unauthenticated.");
        setIsLoading(false);
      }
    }, 5000);

    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (!mounted) return;
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      setIsAuthenticated(!!user);
      if (user) {
        try {
          const data = await getBorrowers();
          if (mounted) setBorrowers(data);
        } catch (error) {
          console.error("Error loading data:", error);
        }
      } else {
        if (mounted) setBorrowers([]);
      }
      if (mounted) {
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleAddBorrower = async (newBorrowerData: Omit<Borrower, 'id' | 'repaidAmount' | 'status' | 'history'>) => {
    const newBorrowerInput = {
      ...newBorrowerData,
      repaidAmount: 0,
      status: 'Active' as const,
      history: []
    };

    try {
      const createdBorrower = await addBorrower(newBorrowerInput);
      setBorrowers(prev => [...prev, createdBorrower]);
    } catch (error) {
      console.error("Error adding borrower:", error);
      alert("Failed to save borrower. Please try again.");
    }
  };

  const handleEditBorrower = async (updatedBorrower: Borrower) => {
    // Recalculate status just in case
    const status: 'Active' | 'Completed' = updatedBorrower.repaidAmount >= updatedBorrower.totalPayable ? 'Completed' : 'Active';
    const finalBorrower = { ...updatedBorrower, status };

    try {
      await updateBorrower(finalBorrower);
      setBorrowers(prev => prev.map(b => b.id === finalBorrower.id ? finalBorrower : b));
    } catch (error) {
      console.error("Error updating borrower:", error);
      alert("Failed to update borrower. Please try again.");
    }
  };

  const handleDeleteBorrower = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this borrower?')) {
      try {
        await deleteBorrower(id);
        setBorrowers(prev => prev.filter(b => b.id !== id));
      } catch (error) {
        console.error("Error deleting borrower:", error);
        alert("Failed to delete borrower.");
      }
    }
  };

  const handleRepayment = async (id: string, amount: number, note?: string) => {
    try {
      await repayLoan(id, amount, note);
      const updatedBorrower = await getBorrower(id);
      if (updatedBorrower) {
        setBorrowers(prev => prev.map(b => b.id === id ? updatedBorrower : b));
      }
    } catch (error) {
      console.error("Error processing repayment:", error);
      alert("Failed to process repayment.");
    }
  };

  const handleTopUp = async (id: string, amount: number, note?: string) => {
    try {
      await topUpLoan(id, amount, note);
      const updatedBorrower = await getBorrower(id);
      if (updatedBorrower) {
        setBorrowers(prev => prev.map(b => b.id === id ? updatedBorrower : b));
      }
    } catch (error) {
      console.error("Error processing top-up:", error);
      alert("Failed to process top-up.");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
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
            />
          } />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;