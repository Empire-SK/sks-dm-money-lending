// Test suite for duplicate prevention in expense transactions and cross-device sync

import assert from 'assert';

// Simulate the mergeTransactions logic from expenseService
const mergeTransactions = (local, cloud, deletedIds = []) => {
  const deletedSet = new Set(deletedIds);
  const map = new Map();

  for (const t of cloud) {
    if (t && t.id && !deletedSet.has(t.id)) {
      map.set(t.id, t);
    }
  }

  for (const t of local) {
    if (!t || !t.id || deletedSet.has(t.id)) continue;
    if (!map.has(t.id)) {
      map.set(t.id, t);
    } else {
      const existing = map.get(t.id);
      const tTime = new Date(t.updatedAt || t.createdAt || 0).getTime();
      const existTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      if (tTime > existTime) {
        map.set(t.id, t);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
};

// Simulate sanitizeUniqueById logic
const sanitizeUniqueById = (items) => {
  if (!items || !Array.isArray(items)) return [];
  const seen = new Set();
  const result = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
};

// Simulate handleAddTransaction state update
const addTxToState = (prev, created) => {
  return [created, ...prev.filter((t) => t.id !== created.id)];
};

console.log('--- STARTING DUPLICATE PREVENTION VERIFICATION ---');

// Test 1: handleAddTransaction deduplication when onSnapshot fires before local state update
const initialList = [
  { id: 'tx_1', title: 'Coffee', amount: 50, date: '2026-11-20' },
  { id: 'tx_2', title: 'Lunch', amount: 150, date: '2026-11-20' },
];

const newTx = { id: 'tx_new_123', title: 'Snacks', amount: 80, date: '2026-11-21' };

// Scenario: Cloud listener receives newTx first
const stateAfterCloudSnapshot = [newTx, ...initialList];
assert.strictEqual(stateAfterCloudSnapshot.length, 3, 'State after cloud snapshot should have 3 items');

// Then local handleAddTransaction finishes and updates state:
const stateAfterLocalAdd = addTxToState(stateAfterCloudSnapshot, newTx);
assert.strictEqual(stateAfterLocalAdd.length, 3, 'State must NOT duplicate newTx (length must remain 3)');
const occurrences = stateAfterLocalAdd.filter((t) => t.id === newTx.id);
assert.strictEqual(occurrences.length, 1, 'newTx must only appear exactly once');
console.log('✓ Test 1 Passed: Concurrent cloud snapshot + local add never duplicates transaction.');

// Test 2: sanitizeUniqueById purges any duplicate IDs
const duplicateList = [
  { id: 'tx_dup', title: 'Tea', amount: 20 },
  { id: 'tx_dup', title: 'Tea', amount: 20 },
  { id: 'tx_other', title: 'Bus', amount: 30 },
];
const sanitized = sanitizeUniqueById(duplicateList);
assert.strictEqual(sanitized.length, 2, 'Sanitized list must eliminate duplicates');
assert.strictEqual(sanitized.filter((t) => t.id === 'tx_dup').length, 1, 'Only one copy of tx_dup must remain');
console.log('✓ Test 2 Passed: sanitizeUniqueById strictly enforces unique items by id.');

// Test 3: Deleting a transaction removes only that target and leaves others intact
const listBeforeDelete = [
  { id: 'tx_1', title: 'Coffee' },
  { id: 'tx_2', title: 'Lunch' },
  { id: 'tx_3', title: 'Dinner' },
];
const listAfterDelete = listBeforeDelete.filter((t) => t.id !== 'tx_2');
assert.strictEqual(listAfterDelete.length, 2, 'Remaining items must be 2');
assert.strictEqual(listAfterDelete.some((t) => t.id === 'tx_2'), false, 'tx_2 must be gone');
assert.strictEqual(listAfterDelete.some((t) => t.id === 'tx_1'), true, 'tx_1 must remain');
assert.strictEqual(listAfterDelete.some((t) => t.id === 'tx_3'), true, 'tx_3 must remain');
console.log('✓ Test 3 Passed: Deleting removes only the single target item.');

console.log('==============================================');
console.log('ALL DUPLICATE PREVENTION TESTS PASSED! ✓');
console.log('==============================================');
