import { createWorker } from 'tesseract.js';

/**
 * Preprocess image for better OCR accuracy:
 * - Convert to grayscale
 * - Increase contrast
 * Returns a data URL of the processed image.
 * Falls back to raw image file URL if canvas fails.
 */
function preprocessImage(imageFile) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          const contrast = 1.4;
          const intercept = 128 * (1 - contrast);

          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const val = Math.min(255, Math.max(0, gray * contrast + intercept));
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }

          ctx.putImageData(imageData, 0, 0);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          console.warn('Image preprocessing canvas error, using raw image:', err);
          URL.revokeObjectURL(url);
          resolve(imageFile);
        }
      };

      img.onerror = (err) => {
        console.warn('Image load error, using raw file:', err);
        URL.revokeObjectURL(url);
        resolve(imageFile);
      };

      img.src = url;
    } catch (err) {
      console.warn('Preprocess error:', err);
      resolve(imageFile);
    }
  });
}

/**
 * Perform OCR on an image file using Tesseract.js worker.
 * @param {File} imageFile - The image to scan
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function scanReceipt(imageFile, onProgress = () => {}) {
  let worker = null;
  try {
    const processedImage = await preprocessImage(imageFile);

    worker = await createWorker('eng', 1, {
      logger: (info) => {
        if (info.status === 'recognizing text' && typeof info.progress === 'number') {
          onProgress(Math.round(info.progress * 100));
        }
      },
    });

    const result = await worker.recognize(processedImage);
    await worker.terminate();

    return {
      text: result.data.text || '',
      confidence: result.data.confidence || 0,
    };
  } catch (error) {
    if (worker) {
      try {
        await worker.terminate();
      } catch (_) {}
    }
    console.error('Tesseract OCR Error:', error);
    throw new Error(`OCR Scan failed: ${error.message || 'Worker initialization error'}`);
  }
}
