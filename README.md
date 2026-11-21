<div align="center">
  <img src="./public/favicon.png" width="84" height="84" alt="SKS DM Platform Logo" />
  <h1>SKS DM Platform</h1>
  <p><strong>Modern Money Lending, Borrower Ledger & Personal Expense Management Suite</strong></p>
  <p><em>Enterprise-grade personal finance, loan management, and multi-account ledger for modern operators.</em></p>

  <p>
    <a href="https://money.sabinksanthosh.me" target="_blank"><strong>🌐 Live Application: money.sabinksanthosh.me</strong></a>
  </p>

  <div>
    <img src="https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase Firestore" />
    <img src="https://img.shields.io/badge/License-Proprietary-emerald?style=for-the-badge" alt="License" />
  </div>
</div>

---

## 🌟 Executive Overview

**SKS DM Platform** is a fintech application bringing together **peer-to-peer loan management** and **personal expense tracking** into a unified workspace. Built with a Bento grid aesthetic, Indian financial formatting (₹, lakhs, crores), and cross-device real-time sync, it is designed for speed, precision, and privacy.

---

## 🚀 Core Modules

### 1. 💼 Lending & Borrower Management
A ledger designed to track borrowers, repayments, and outstanding balances with zero math errors.
- **Borrower Profiles**: Track borrower details, loan principal, interest, total payable, and repayment milestones.
- **Automated Repayments & Top-Ups**: Record partial or full repayments and add loan top-ups with instant automatic balance re-calculation.
- **Accidental Entry Rollbacks**: Delete specific history items with ledger rebalancing.
- **Public Statement Links**: Generate tamper-resistant, shareable URLs (`/statement/:id`) so borrowers can review their balances and payment logs without requiring an account.
- **PDF Reports**: Export formatted borrower statements on demand.

### 2. 📊 Bento Expense Manager
A personal finance dashboard inspired by modern Bento UI designs.
- **Active Spendable Liquidity**: Real-time distinction between total net worth, liquid spendable funds (Cash + UPI + Bank), and locked dedicated savings vaults.
- **Salary & Income Engine**: Record monthly salaries with breakdowns (Base, Bonus, Incentives, Other Income) with automatic account credit integration.
- **Multi-Account Support**: Manage multiple accounts (Bank accounts, UPI wallets, Cash, Savings Vaults) with transfer logging.
- **Dynamic Budgets & Alert Thresholds**: Set overall and per-category monthly limits with proactive threshold badges:
  - 🟢 Normal (`< 75%`)
  - 🟡 Caution (`75% – 89%`)
  - 🟠 High Warning (`90% – 99%`)
  - 🔴 Exceeded (`≥ 100%`)
- **Transaction History & Filter Engine**: Multi-dimensional search, date ranges, transaction types (Expense, Income, Transfer, Refund), categories, and accounts.
- **Receipt Management**: Attach and preview receipts (JPG, PNG, WEBP, PDF) directly within transactions.
- **Exporting Suite**: Export ledger data to CSV or download styled PDF reports.
- **Visual Analytics**: Category breakdown charts, monthly spending trends, and month-over-month comparisons using Recharts.

---

## 🎨 UI & UX Innovations

- **Cinematic Theme Ripple Wave**: Seamless switching between **Dark Mode** and **Light Bento Mode** powered by the native CSS View Transitions API (`cubic-bezier(0.25, 1, 0.35, 1)` at 780ms), with ripple wave origins tied to touch/click coordinates.
- **High-Contrast Light Bento**: Custom slate and emerald palette (`#09090b` high-legibility typography, `#F4F5F7` backdrop, and crisp white cards) eliminating dark-block contrast glitches.
- **Mobile-First Responsive Layout**: 2x2 touch grids, thumb-friendly navigation, zero-scroll mobile modals, and bottom-sheet drawers.
- **Global Error Boundary**: Hardened fallback rendering preventing blank screen crashes if any client component fails.

---

## 🛡️ Reliability, Data Isolation & Concurrency

- **Real-Time Cross-Device Sync**: Subscriptions via Firestore ensure changes made on mobile reflect on desktop in real time.
- **Multi-Tenant User Isolation**: Partitioned data structures isolate personal user accounts (e.g. `amil@sksdm.com`) from primary admin workspaces.
- **Duplicate Prevention Engine**: Synchronous submit locks (`isSubmittingRef`) and ID deduplication prevent accidental double-submits or cloned rows.
- **Deterministic Math Engine**: Built-in test suites verify rounding, transfers, and Indian comma formatting across all edge cases.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tooling** | [Vite 6](https://vitejs.dev/) |
| **Styling & Design** | [Tailwind CSS 3.4](https://tailwindcss.com/) + Custom Bento Glassmorphism |
| **Database & Auth** | [Google Firebase](https://firebase.google.com/) (Firestore Cloud DB & Authentication) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Icons & Assets** | [Lucide React](https://lucide.dev/) |
| **Reporting & Export**| `html2pdf.js`, `jspdf`, `html2canvas` |

---

## 📂 Project Directory Structure

```text
sks-dm-money-lending/
├── components/                 # Reusable UI Components
│   ├── ErrorBoundary.tsx       # Global React Error Boundary
│   ├── Layout.tsx              # Main Sidebar, Top Navigation & Theme Switcher
│   ├── DashboardStatsCard.tsx  # KPI Summary Cards
│   └── expense/                # Expense Manager Modals & UI Components
│       ├── AccountModal.tsx    # Bank & Wallet Account Manager
│       ├── BudgetModal.tsx     # Monthly Category Budget Manager
│       ├── CategoryModal.tsx   # Custom Categories & Subcategories
│       ├── ExpenseNav.tsx      # Top Bento Navigation & Quick Actions
│       ├── ReceiptViewerModal  # Receipt File Preview
│       ├── SalaryModal.tsx     # Monthly Salary Breakdown Recorder
│       └── TransactionModal.tsx# Transaction Entry & Edit Form
├── contexts/                   # React Context Providers
│   ├── AuthContext.tsx         # Firebase Authentication State
│   ├── ExpenseContext.tsx      # Real-time Expense & Account Ledger
│   └── ThemeContext.tsx        # View Transition Circular Ripple Wave Engine
├── pages/                      # Application Route Views
│   ├── Login.tsx               # Secure Authentication Page
│   ├── Dashboard.tsx           # Lending Executive Dashboard
│   ├── Borrowers.tsx           # Borrower Directory & Loans Ledger
│   ├── BorrowerStatement.tsx   # Public Borrower Statement Route
│   └── expense/                # Personal Finance Module
│       ├── ExpenseOverview.tsx # Bento Overview & Balance Dashboard
│       ├── Transactions.tsx    # Transaction Ledger, Search & Reports
│       ├── Salary.tsx          # Monthly Salary History
│       ├── Budgets.tsx         # Category Budget Meters & Alerts
│       ├── Analytics.tsx       # Financial Charts & MoM Breakdown
│       ├── Categories.tsx      # Category Management
│       └── Accounts.tsx        # Liquid Accounts & Balances
├── services/                   # External API & Cloud Services
│   ├── authService.ts          # Authentication Operations
│   ├── firestoreService.ts     # Borrower & Loan Firestore Operations
│   ├── expenseService.ts       # Expense Ledger & Cross-Device Cloud Sync
│   └── receiptService.ts      # Cloud Receipt Storage Operations
├── tests/                      # Automated Verification Test Suites
│   ├── testCalculations.js     # Financial Math & Balance Tests
│   ├── testBaselineRecovery.js # Admin Data Recovery & Isolation Tests
│   └── testDuplicatePrevention # Concurrency & Deduplication Tests
├── utils/                      # Helper Functions & Constants
│   ├── expenseCalculations.ts  # Indian Number Formatting & Balance Algorithms
│   └── defaultExpenseData.ts   # Default Categories & Accounts
└── index.css                   # Global Tailwind Utilities & Theme Transitions
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- A **Firebase Project** with Firestore and Authentication enabled

### Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Empire-SK/sks-dm-money-lending.git
   cd sks-dm-money-lending
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

6. **Run Test Suites:**
   ```bash
   node tests/testCalculations.js
   node tests/testBaselineRecovery.js
   node tests/testDuplicatePrevention.js
   ```

---

## 🔒 Security & Privacy

- **Protected Routes**: Authentication guards prevent unauthorized workspace access.
- **Multi-Tenant Protection**: Strict tenant isolation prevents personal users from accessing admin financial records.
- **Input Sanitization**: Number parsing and currency rounding guards eliminate floating-point calculation discrepancies.

---

<div align="center">
  <p>© 2026 <strong>SKS DM Platform</strong>. All rights reserved.</p>
</div>
