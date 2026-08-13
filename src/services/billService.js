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
import { sanitizeText, CATEGORIES } from './receiptParser';

const ALLOWED_CATEGORIES = new Set(CATEGORIES.map(c => c.value));
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB limit

/**
 * Validate and sanitize bill inputs to prevent XSS and database corruption.
 */
function validateAndSanitizeBill(billData) {
  const merchant = sanitizeText(billData.merchant || 'Unknown', 100);
  const notes = sanitizeText(billData.notes || '', 1000);
  const rawText = sanitizeText(billData.rawText || '', 10000);

  let amount = parseFloat(billData.amount);
  if (isNaN(amount) || !isFinite(amount) || amount < 0) {
    amount = 0;
  } else if (amount > 10000000) {
    amount = 10000000;
  }

  const category = ALLOWED_CATEGORIES.has(billData.category) ? billData.category : 'other';

  // Date validation (YYYY-MM-DD)
  let date = billData.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = new Date().toISOString().split('T')[0];
  }

  return {
    merchant: merchant || 'Unknown',
    amount,
    date,
    category,
    notes,
    rawText,
  };
}

/**
 * Get the bills subcollection reference for a user.
 */
function billsCollection(uid) {
  if (!uid || typeof uid !== 'string') {
    throw new Error('Unauthorized: Invalid User ID');
  }
  return collection(db, 'users', uid, 'bills');
}

/**
 * Upload a receipt image to Firebase Storage with security validation.
 */
async function uploadReceiptImage(uid, billId, imageFile) {
  if (!ALLOWED_IMAGE_TYPES.has(imageFile.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.');
  }

  if (imageFile.size > MAX_IMAGE_SIZE) {
    throw new Error('File size exceeds the 10MB limit.');
  }

  const imagePath = `users/${uid}/receipts/${billId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, imagePath);

  await uploadBytes(storageRef, imageFile, {
    contentType: imageFile.type,
    customMetadata: { uploadedBy: uid }
  });

  const imageUrl = await getDownloadURL(storageRef);

  return { imageUrl, imagePath };
}

/**
 * Add a new bill to Firestore.
 */
export async function addBill(uid, billData, imageFile = null) {
  if (!uid) throw new Error('Unauthorized request');

  const sanitized = validateAndSanitizeBill(billData);
  const now = Timestamp.now();

  const docData = {
    ...sanitized,
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
      console.error('Image upload security error:', err);
    }
  }

  return { id: docRef.id, ...docData };
}

/**
 * Get all bills for a user, optionally filtered by month/year and category.
 */
export async function getBills(uid, filters = {}) {
  if (!uid) throw new Error('Unauthorized request');

  const constraints = [orderBy('date', 'desc')];

  if (filters.category && filters.category !== 'all' && ALLOWED_CATEGORIES.has(filters.category)) {
    constraints.push(where('category', '==', filters.category));
  }

  const q = query(billsCollection(uid), ...constraints);
  const snapshot = await getDocs(q);

  let bills = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Client-side date filtering
  if (filters.month !== undefined && filters.year !== undefined) {
    const monthStr = String(filters.month + 1).padStart(2, '0');
    const yearStr = String(filters.year);
    const prefix = `${yearStr}-${monthStr}`;
    bills = bills.filter((b) => b.date && b.date.startsWith(prefix));
  }

  // Client-side search with sanitization
  if (filters.search) {
    const searchLower = sanitizeText(filters.search, 50).toLowerCase();
    bills = bills.filter(
      (b) =>
        (b.merchant && b.merchant.toLowerCase().includes(searchLower)) ||
        (b.notes && b.notes.toLowerCase().includes(searchLower))
    );
  }

  return bills;
}

/**
 * Get a single bill by ID with IDOR check.
 */
export async function getBillById(uid, billId) {
  if (!uid || !billId) throw new Error('Unauthorized request');

  const docRef = doc(db, 'users', uid, 'bills', billId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Bill not found or access denied');
  }

  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Update a bill with sanitization.
 */
export async function updateBill(uid, billId, updates) {
  if (!uid || !billId) throw new Error('Unauthorized request');

  const sanitized = validateAndSanitizeBill(updates);
  const docRef = doc(db, 'users', uid, 'bills', billId);

  await updateDoc(docRef, {
    ...sanitized,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a bill and its receipt image with IDOR protection.
 */
export async function deleteBill(uid, billId) {
  if (!uid || !billId) throw new Error('Unauthorized request');

  // Verify ownership before deleting
  const bill = await getBillById(uid, billId);

  if (bill.imagePath) {
    try {
      const storageRef = ref(storage, bill.imagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  }

  const docRef = doc(db, 'users', uid, 'bills', billId);
  await deleteDoc(docRef);
}

/**
 * Get monthly spending statistics.
 */
export async function getMonthlyStats(uid, month, year) {
  if (!uid) throw new Error('Unauthorized request');

  const bills = await getBills(uid, { month, year });

  const totalSpent = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const billCount = bills.length;
  const avgPerBill = billCount > 0 ? totalSpent / billCount : 0;

  const byCategory = {};
  bills.forEach((b) => {
    const cat = b.category || 'other';
    if (!byCategory[cat]) {
      byCategory[cat] = { total: 0, count: 0 };
    }
    byCategory[cat].total += b.amount || 0;
    byCategory[cat].count += 1;
  });

  const byDay = {};
  bills.forEach((b) => {
    if (b.date) {
      const day = b.date.split('-')[2];
      if (!byDay[day]) byDay[day] = 0;
      byDay[day] += b.amount || 0;
    }
  });

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
 * Export bills as CSV string with CSV Injection Protection.
 * Prefixes sensitive values starting with =, +, -, @ with a single quote to prevent CSV Formula Injection in Excel/Google Sheets.
 */
export function exportToCSV(bills) {
  const sanitizeCSVCell = (val) => {
    let str = String(val || '').replace(/"/g, '""');
    // Prevent CSV Formula Injection
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    return `"${str}"`;
  };

  const headers = ['Date', 'Merchant', 'Amount', 'Category', 'Notes'];
  const rows = bills.map((b) => [
    sanitizeCSVCell(b.date),
    sanitizeCSVCell(b.merchant),
    b.amount || 0,
    sanitizeCSVCell(b.category),
    sanitizeCSVCell(b.notes),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
