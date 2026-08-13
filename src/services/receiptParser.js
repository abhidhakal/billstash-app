/**
 * Parse OCR text from a receipt and extract structured data.
 * Uses regex patterns to find total amount, date, and merchant name.
 * Sanitizes input to prevent XSS & injection attacks.
 */

/**
 * Sanitize text input: strip HTML tags, control chars, and enforce length limit.
 */
export function sanitizeText(str = '', maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // strip control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Extract the total amount from receipt text.
 * Looks for common patterns: "Total", "Grand Total", "Amount Due", etc.
 */
function extractAmount(text) {
  const lines = text.split('\n');

  // Patterns ordered by specificity (most specific first)
  const totalPatterns = [
    /(?:grand\s*total|net\s*total|total\s*(?:amount|due|payable|paid))\s*[:=]?\s*(?:rs\.?|npr\.?|₹)?\s*([\d,]+\.?\d*)/i,
    /(?:total)\s*[:=]?\s*(?:rs\.?|npr\.?|₹)?\s*([\d,]+\.?\d*)/i,
    /(?:rs\.?|npr\.?|₹)\s*([\d,]+\.?\d*)\s*$/im,
    /(?:amount)\s*[:=]?\s*(?:rs\.?|npr\.?|₹)?\s*([\d,]+\.?\d*)/i,
  ];

  // Try each pattern
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

  // Fallback: find the largest number on any line that looks like a total
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
 * Supports: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD Mon YYYY, etc.
 */
function extractDate(text) {
  const datePatterns = [
    // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/,
    // YYYY-MM-DD
    /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,
    // DD Mon YYYY or DD-Mon-YYYY
    /(\d{1,2})\s*[-\/]?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*[-\/]?\s*(\d{2,4})/i,
    // Mon DD, YYYY
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
        // DD/MM/YYYY
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = parseInt(match[3]);
        date = new Date(year, month, day);
      } else if (pattern === datePatterns[1]) {
        // YYYY-MM-DD
        date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else if (pattern === datePatterns[2]) {
        // DD Mon YYYY
        const monthStr = match[2].toLowerCase().slice(0, 3);
        let year = parseInt(match[3]);
        if (year < 100) year += 2000;
        date = new Date(year, months[monthStr], parseInt(match[1]));
      } else if (pattern === datePatterns[3]) {
        // Mon DD, YYYY
        const monthStr = match[1].toLowerCase().slice(0, 3);
        date = new Date(parseInt(match[3]), months[monthStr], parseInt(match[2]));
      }

      // Validate date
      if (date && !isNaN(date.getTime()) && date.getFullYear() > 2000) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    }
  }

  // Default to today if no date found
  return new Date().toISOString().split('T')[0];
}

/**
 * Extract merchant name from receipt text.
 * Usually the first non-empty, non-numeric line.
 */
function extractMerchant(text) {
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2);

  for (const line of lines.slice(0, 5)) {
    // Skip lines that are mostly numbers / dates / addresses
    const cleaned = line.replace(/[^a-zA-Z\s]/g, '').trim();
    if (cleaned.length >= 3 && !/^\d/.test(line)) {
      // Capitalize first letter of each word
      return sanitizeText(cleaned
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' '), 100);
    }
  }

  return 'Unknown Merchant';
}

/**
 * Parse a receipt's OCR text into structured data.
 * @param {string} text - Raw OCR text
 * @returns {{ merchant: string, amount: number|null, date: string, rawText: string }}
 */
export function parseReceipt(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      merchant: '',
      amount: null,
      date: new Date().toISOString().split('T')[0],
      rawText: '',
    };
  }

  const cleanRawText = sanitizeText(text, 10000);

  return {
    merchant: extractMerchant(cleanRawText),
    amount: extractAmount(cleanRawText),
    date: extractDate(cleanRawText),
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
