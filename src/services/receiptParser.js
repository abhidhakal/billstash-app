/**
 * Parse OCR text from a receipt and extract structured data.
 * Uses regex patterns to find total amount, date, merchant name, and item line summaries.
 * Sanitizes input to prevent XSS & injection attacks.
 */

/**
 * Sanitize text input: strip HTML tags, control chars, and enforce length limit.
 */
export function sanitizeText(str = '', maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Extract the total amount from receipt text.
 */
function extractAmount(text) {
  const lines = text.split('\n');

  const totalPatterns = [
    /(?:grand\s*total|net\s*total|total\s*(?:amount|due|payable|paid))\s*[:=]?\s*(?:rs\.?|npr\.?|₹)?\s*([\d,]+\.?\d*)/i,
    /(?:total)\s*[:=]?\s*(?:rs\.?|npr\.?|₹)?\s*([\d,]+\.?\d*)/i,
    /(?:rs\.?|npr\.?|₹)\s*([\d,]+\.?\d*)\s*$/im,
    /(?:amount)\s*[:=]?\s*(?:rs\.?|npr\.?|₹)?\s*([\d,]+\.?\d*)/i,
  ];

  for (const pattern of totalPatterns) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0 && amount < 10000000) {
          return amount;
        }
      }
    }
  }

  let maxAmount = 0;
  const numberPattern = /(?:rs\.?|npr\.?|₹)?\s*([\d,]+\.\d{2})/gi;
  let match;
  while ((match = numberPattern.exec(text)) !== null) {
    const val = parseFloat(match[1].replace(/,/g, ''));
    if (val > maxAmount && val < 10000000) {
      maxAmount = val;
    }
  }

  return maxAmount || null;
}

/**
 * Extract date from receipt text.
 */
function extractDate(text) {
  const datePatterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/,
    /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,
    /(\d{1,2})\s*[-\/]?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*[-\/]?\s*(\d{2,4})/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s*(\d{4})/i,
  ];

  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let date;

      if (pattern === datePatterns[0]) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = parseInt(match[3]);
        date = new Date(year, month, day);
      } else if (pattern === datePatterns[1]) {
        date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else if (pattern === datePatterns[2]) {
        const monthStr = match[2].toLowerCase().slice(0, 3);
        let year = parseInt(match[3]);
        if (year < 100) year += 2000;
        date = new Date(year, months[monthStr], parseInt(match[1]));
      } else if (pattern === datePatterns[3]) {
        const monthStr = match[1].toLowerCase().slice(0, 3);
        date = new Date(parseInt(match[3]), months[monthStr], parseInt(match[2]));
      }

      if (date && !isNaN(date.getTime()) && date.getFullYear() > 2000) {
        return date.toISOString().split('T')[0];
      }
    }
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Extract merchant name from receipt text.
 */
function extractMerchant(text) {
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2);

  for (const line of lines.slice(0, 5)) {
    const cleaned = line.replace(/[^a-zA-Z\s]/g, '').trim();
    if (cleaned.length >= 3 && !/^\d/.test(line)) {
      return sanitizeText(cleaned
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' '), 100);
    }
  }

  return 'Unknown Merchant';
}

/**
 * Extract line items summary from OCR text.
 * Finds item lines (excluding totals, dates, merchant, taxes).
 */
function extractItemsSummary(text) {
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 3);

  const excludePatterns = /total|subtotal|tax|vat|date|cash|change|card|thank|receipt|tel|vat|amount|cashier|invoice|bill/i;
  const itemLines = [];

  for (const line of lines) {
    if (excludePatterns.test(line)) continue;
    // Check if line looks like an item (contains letters and optionally numbers/prices)
    if (/[a-zA-Z]{3,}/.test(line) && !/^\d{4}-\d{2}-\d{2}/.test(line)) {
      const cleanLine = line.replace(/^(?:\d+x|\d+\s*pcs)\s*/i, '').replace(/[-=]{3,}/g, '').trim();
      if (cleanLine.length > 3 && cleanLine.length < 50) {
        itemLines.push(cleanLine);
      }
    }
  }

  // Skip the first line if it's the merchant name
  const candidates = itemLines.length > 1 ? itemLines.slice(1, 4) : itemLines.slice(0, 3);
  return candidates.join(', ');
}

/**
 * Parse a receipt's OCR text into structured data.
 * @param {string} text - Raw OCR text
 * @returns {{ merchant: string, amount: number|null, date: string, notes: string, rawText: string }}
 */
export function parseReceipt(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      merchant: '',
      amount: null,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      rawText: '',
    };
  }

  const cleanRawText = sanitizeText(text, 10000);
  const itemsSummary = extractItemsSummary(cleanRawText);

  return {
    merchant: extractMerchant(cleanRawText),
    amount: extractAmount(cleanRawText),
    date: extractDate(cleanRawText),
    notes: itemsSummary ? sanitizeText(itemsSummary, 200) : '',
    rawText: cleanRawText,
  };
}

/**
 * Category options for bills.
 */
export const CATEGORIES = [
  { value: 'groceries', label: 'Groceries', icon: 'ShoppingCart' },
  { value: 'dining', label: 'Dining', icon: 'UtensilsCrossed' },
  { value: 'utilities', label: 'Utilities', icon: 'Zap' },
  { value: 'transport', label: 'Transport', icon: 'Car' },
  { value: 'shopping', label: 'Shopping', icon: 'ShoppingBag' },
  { value: 'healthcare', label: 'Healthcare', icon: 'Heart' },
  { value: 'entertainment', label: 'Entertainment', icon: 'Film' },
  { value: 'education', label: 'Education', icon: 'GraduationCap' },
  { value: 'rent', label: 'Rent', icon: 'Home' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
];
