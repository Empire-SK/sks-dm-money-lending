import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, runTransaction, arrayRemove } from 'firebase/firestore';
import { Borrower } from '../types';

const COLLECTION_NAME = 'borrowers';

export const getBorrowers = async (): Promise<Borrower[]> => {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Borrower));
};

export const addBorrower = async (borrower: Omit<Borrower, 'id'>): Promise<Borrower> => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), borrower);
    return { ...borrower, id: docRef.id } as Borrower;
};

export const updateBorrower = async (borrower: Borrower): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, borrower.id);
    const { id, ...data } = borrower;
    await updateDoc(docRef, data as any);
};

export const deleteBorrower = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
};

export const getBorrower = async (id: string): Promise<Borrower | null> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as Borrower;
    }
    return null;
};

export const repayLoan = async (id: string, amount: number, note?: string) => {
    await runTransaction(db, async (transaction) => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const sfDoc = await transaction.get(docRef);

        if (!sfDoc.exists()) {
            throw new Error("Borrower does not exist!");
        }

        const borrower = sfDoc.data() as Borrower;
        const newRepaid = (borrower.repaidAmount || 0) + amount;
        const newStatus: 'Active' | 'Completed' = newRepaid >= borrower.totalPayable ? 'Completed' : 'Active';

        const newHistoryItem = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            amount: amount,
            type: 'payment' as const,
            note: note || ''
        };

        transaction.update(docRef, {
            repaidAmount: newRepaid,
            status: newStatus,
            history: [...(borrower.history || []), newHistoryItem]
        });
    });
};

export const topUpLoan = async (id: string, amount: number, note?: string) => {
    await runTransaction(db, async (transaction) => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const sfDoc = await transaction.get(docRef);

        if (!sfDoc.exists()) {
            throw new Error("Borrower does not exist!");
        }

        const borrower = sfDoc.data() as Borrower;
        const newLoanAmount = (borrower.loanAmount || 0) + amount;
        const newTotalPayable = (borrower.totalPayable || 0) + amount;
        const newStatus: 'Active' | 'Completed' = (borrower.repaidAmount || 0) < newTotalPayable ? 'Active' : 'Completed';

        const newHistoryItem = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            amount: amount,
            type: 'loan' as const,
            note: note || ''
        };

        transaction.update(docRef, {
            loanAmount: newLoanAmount,
            totalPayable: newTotalPayable,
            status: newStatus,
            history: [...(borrower.history || []), newHistoryItem]
        });
    });
};

export const deleteHistoryItem = async (borrowerId: string, historyItemId: string): Promise<void> => {
    await runTransaction(db, async (transaction) => {
        const docRef = doc(db, COLLECTION_NAME, borrowerId);
        const sfDoc = await transaction.get(docRef);

        if (!sfDoc.exists()) throw new Error('Borrower does not exist!');

        const borrower = sfDoc.data() as Borrower;
        const item = borrower.history.find(h => h.id === historyItemId);

        if (!item) throw new Error('History item not found!');

        const newHistory = borrower.history.filter(h => h.id !== historyItemId);

        let newRepaidAmount = borrower.repaidAmount || 0;
        let newLoanAmount = borrower.loanAmount || 0;
        let newTotalPayable = borrower.totalPayable || 0;

        if (item.type === 'payment') {
            newRepaidAmount = Math.max(0, newRepaidAmount - item.amount);
        } else if (item.type === 'loan') {
            newLoanAmount = Math.max(0, newLoanAmount - item.amount);
            newTotalPayable = Math.max(0, newTotalPayable - item.amount);
        }

        const newStatus: 'Active' | 'Completed' =
            newRepaidAmount >= newTotalPayable && newTotalPayable > 0 ? 'Completed' : 'Active';

        transaction.update(docRef, {
            history: newHistory,
            repaidAmount: newRepaidAmount,
            loanAmount: newLoanAmount,
            totalPayable: newTotalPayable,
            status: newStatus,
        });
    });
};
