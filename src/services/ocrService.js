import Tesseract from 'tesseract.js';

/**
 * Preprocess image for better OCR accuracy:
 * - Convert to grayscale
 * - Increase contrast
 * Returns a data URL of the processed image.
 */
function preprocessImage(imageFile) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale and increase contrast
      const contrast = 1.4; // contrast factor
      const intercept = 128 * (1 - contrast);

      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Apply contrast
        const val = Math.min(255, Math.max(0, gray * contrast + intercept));

        data[i] = val;     // R
        data[i + 1] = val; // G
        data[i + 2] = val; // B
        // Alpha stays the same
      }

      ctx.putImageData(imageData, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };

    img.src = url;
  });
}

/**
 * Perform OCR on an image file.
 * @param {File} imageFile - The image to scan
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function scanReceipt(imageFile, onProgress = () => {}) {
  try {
    // Preprocess for better accuracy
    const processedImage = await preprocessImage(imageFile);

    const result = await Tesseract.recognize(processedImage, 'eng', {
      logger: (info) => {
        if (info.status === 'recognizing text' && info.progress) {
          onProgress(Math.round(info.progress * 100));
        }
      },
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to scan receipt. Please try again.');
  }
}
