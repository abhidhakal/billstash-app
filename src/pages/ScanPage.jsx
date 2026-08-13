import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scanReceipt } from '../services/ocrService';
import { parseReceipt } from '../services/receiptParser';
import { addBill } from '../services/billService';
import { Camera, Upload, Image as ImageIcon, X } from 'lucide-react';
import BillForm from '../components/BillForm';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ScanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isManual = searchParams.get('manual') === 'true';
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(isManual ? 'form' : 'capture'); // capture | scanning | form
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [parsedData, setParsedData] = useState({});
  const [scanProgress, setScanProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    startScanning(file);
  }

  async function startScanning(file) {
    setStep('scanning');
    setScanProgress(0);
    setError('');

    try {
      const { text, confidence } = await scanReceipt(file, (progress) => {
        setScanProgress(progress);
      });

      const parsed = parseReceipt(text);
      setParsedData({
        ...parsed,
        confidence,
      });
      setStep('form');
    } catch (err) {
      setError(err.message || 'Failed to scan receipt');
      setStep('capture');
    }
  }

  async function handleSave(formData) {
    setSaving(true);
    setError('');

    try {
      await addBill(user.uid, formData, imageFile);
      navigate('/', { replace: true });
    } catch (err) {
      setError('Failed to save bill. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setStep('capture');
    setImageFile(null);
    setImagePreview(null);
    setParsedData({});
    setScanProgress(0);
    setError('');
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          {step === 'capture' ? 'Scan Receipt' : step === 'scanning' ? 'Scanning...' : 'Bill Details'}
        </h1>
        {step !== 'capture' && (
          <button className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={handleReset}>
            <X size={16} /> Start Over
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 mb-4 bg-[var(--destructive-subtle)] text-[var(--destructive)] text-xs rounded-lg text-center font-medium animate-fade-in">
          {error}
        </div>
      )}

      {/* Step 1: Capture */}
      {step === 'capture' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div
            className="flex flex-col items-center justify-center p-12 bg-[var(--bg-card)] border-2 border-dashed border-[var(--border)] rounded-2xl cursor-pointer hover:border-[var(--accent)] transition-colors text-center text-[var(--text-secondary)]"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={40} strokeWidth={1.2} className="mb-3 text-[var(--accent)]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Tap to scan a receipt</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Take a photo or choose from gallery</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="sr-only"
          />

          <div className="flex flex-col gap-3">
            <button
              className="w-full py-3 bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute('capture');
                  fileInputRef.current.click();
                  setTimeout(() => {
                    fileInputRef.current?.setAttribute('capture', 'environment');
                  }, 100);
                }
              }}
            >
              <Upload size={18} />
              Upload from Gallery
            </button>

            <button
              className="w-full py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              onClick={() => setStep('form')}
            >
              <ImageIcon size={18} />
              Enter Manually
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Scanning */}
      {step === 'scanning' && (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          {imagePreview && (
            <div className="w-full max-h-60 rounded-xl overflow-hidden border border-[var(--border)]">
              <img src={imagePreview} alt="Receipt" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="w-full flex flex-col gap-3">
            <div className="w-full h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
              <LoadingSpinner size={16} />
              <span>Analyzing receipt... {scanProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Form */}
      {step === 'form' && (
        <div className="animate-fade-in">
          {parsedData.confidence != null && (
            <div className="text-xs text-center text-[var(--accent)] bg-[var(--accent-subtle)] py-1.5 px-3 rounded-md mb-4 font-semibold">
              OCR Confidence: {Math.round(parsedData.confidence)}%
            </div>
          )}
          <BillForm
            initialData={parsedData}
            imagePreview={imagePreview}
            onSubmit={handleSave}
            loading={saving}
          />
        </div>
      )}
    </div>
  );
}
