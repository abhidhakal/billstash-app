import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

/**
 * Get the bills subcollection reference for a user.
 */
function billsCollection(uid) {
  return collection(db, 'users', uid, 'bills');
}

/**
 * Upload a receipt image to Firebase Storage.
 * @returns {{ imageUrl: string, imagePath: string }}
 */
async function uploadReceiptImage(uid, billId, imageFile) {
  const imagePath = `users/${uid}/receipts/${billId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, imagePath);

  await uploadBytes(storageRef, imageFile);
  const imageUrl = await getDownloadURL(storageRef);

  return { imageUrl, imagePath };
}

/**
 * Add a new bill to Firestore.
 */
export async function addBill(uid, billData, imageFile = null) {
  const now = Timestamp.now();
  const docData = {
    merchant: billData.merchant || 'Unknown',
    amount: parseFloat(billData.amount) || 0,
    date: billData.date || new Date().toISOString().split('T')[0],
    category: billData.category || 'other',
    notes: billData.notes || '',
    rawText: billData.rawText || '',
    imageUrl: '',
    imagePath: '',
    createdAt: now,
    updatedAt: now,
  };

  // Add doc first to get ID, then upload image with that ID
  const docRef = await addDoc(billsCollection(uid), docData);

  if (imageFile) {
    try {
      const { imageUrl, imagePath } = await uploadReceiptImage(uid, docRef.id, imageFile);
      await updateDoc(docRef, { imageUrl, imagePath });
      docData.imageUrl = imageUrl;
      docData.imagePath = imagePath;
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  }

  return { id: docRef.id, ...docData };
}

/**
 * Get all bills for a user, optionally filtered by month/year and category.
 */
export async function getBills(uid, filters = {}) {
  const constraints = [orderBy('date', 'desc')];

  if (filters.category && filters.category !== 'all') {
    constraints.push(where('category', '==', filters.category));
  }

  const q = query(billsCollection(uid), ...constraints);
  const snapshot = await getDocs(q);

  let bills = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Client-side date filtering (Firestore doesn't support range on string dates + orderBy together easily)
  if (filters.month !== undefined && filters.year !== undefined) {
    const monthStr = String(filters.month + 1).padStart(2, '0');
    const yearStr = String(filters.year);
    const prefix = `${yearStr}-${monthStr}`;
    bills = bills.filter((b) => b.date && b.date.startsWith(prefix));
  }

  // Client-side search
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    bills = bills.filter(
      (b) =>
        (b.merchant && b.merchant.toLowerCase().includes(searchLower)) ||
        (b.notes && b.notes.toLowerCase().includes(searchLower))
    );
  }

  return bills;
}

/**
 * Get a single bill by ID.
 */
export async function getBillById(uid, billId) {
  const docRef = doc(db, 'users', uid, 'bills', billId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Bill not found');
  }

  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Update a bill.
 */
export async function updateBill(uid, billId, updates) {
  const docRef = doc(db, 'users', uid, 'bills', billId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a bill and its receipt image.
 */
export async function deleteBill(uid, billId) {
  // Get the bill to find the image path
  const bill = await getBillById(uid, billId);

  // Delete image from storage if it exists
  if (bill.imagePath) {
    try {
      const storageRef = ref(storage, bill.imagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  }

  // Delete the Firestore document
  const docRef = doc(db, 'users', uid, 'bills', billId);
  await deleteDoc(docRef);
}

/**
 * Get monthly spending statistics.
 */
export async function getMonthlyStats(uid, month, year) {
  const bills = await getBills(uid, { month, year });

  const totalSpent = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const billCount = bills.length;
  const avgPerBill = billCount > 0 ? totalSpent / billCount : 0;

  // Category breakdown
  const byCategory = {};
  bills.forEach((b) => {
    const cat = b.category || 'other';
    if (!byCategory[cat]) {
      byCategory[cat] = { total: 0, count: 0 };
    }
    byCategory[cat].total += b.amount || 0;
    byCategory[cat].count += 1;
  });

  // Daily breakdown
  const byDay = {};
  bills.forEach((b) => {
    if (b.date) {
      const day = b.date.split('-')[2];
      if (!byDay[day]) byDay[day] = 0;
      byDay[day] += b.amount || 0;
    }
  });

  // Top merchants
  const byMerchant = {};
  bills.forEach((b) => {
    const merchant = b.merchant || 'Unknown';
    if (!byMerchant[merchant]) {
      byMerchant[merchant] = { total: 0, count: 0 };
    }
    byMerchant[merchant].total += b.amount || 0;
    byMerchant[merchant].count += 1;
  });

  const topMerchants = Object.entries(byMerchant)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));

  return {
    totalSpent,
    billCount,
    avgPerBill,
    byCategory,
    byDay,
    topMerchants,
    bills,
  };
}

/**
 * Export bills as CSV string.
 */
export function exportToCSV(bills) {
  const headers = ['Date', 'Merchant', 'Amount', 'Category', 'Notes'];
  const rows = bills.map((b) => [
    b.date || '',
    `"${(b.merchant || '').replace(/"/g, '""')}"`,
    b.amount || 0,
    b.category || '',
    `"${(b.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
