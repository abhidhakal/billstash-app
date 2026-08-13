import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scanReceipt } from '../services/ocrService';
import { parseReceipt } from '../services/receiptParser';
import { addBill } from '../services/billService';
import { Camera, Upload, Image as ImageIcon, X } from 'lucide-react';
import BillForm from '../components/BillForm';
import LoadingSpinner from '../components/LoadingSpinner';
import './ScanPage.css';

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
      <div className="page-header">
        <h1 className="page-title">
          {step === 'capture' ? 'Scan Receipt' : step === 'scanning' ? 'Scanning...' : 'Bill Details'}
        </h1>
        {step !== 'capture' && (
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>
            <X size={16} /> Start Over
          </button>
        )}
      </div>

      {error && (
        <div className="scan-error animate-fade-in">
          {error}
        </div>
      )}

      {/* Step 1: Capture */}
      {step === 'capture' && (
        <div className="scan-capture animate-fade-in">
          <div
            className="scan-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={40} strokeWidth={1.2} />
            <p className="scan-dropzone-title">Tap to scan a receipt</p>
            <p className="scan-dropzone-hint">Take a photo or choose from gallery</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="sr-only"
          />

          <div className="scan-alt-actions">
            <button
              className="btn btn-outline btn-full"
              onClick={() => {
                // Remove capture attribute for gallery
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute('capture');
                  fileInputRef.current.click();
                  // Re-add capture after click
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
              className="btn btn-ghost btn-full"
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
        <div className="scan-processing animate-fade-in">
          {imagePreview && (
            <div className="scan-preview">
              <img src={imagePreview} alt="Receipt" />
            </div>
          )}
          <div className="scan-progress">
            <div className="scan-progress-bar">
              <div
                className="scan-progress-fill"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <div className="scan-progress-info">
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
            <div className="scan-confidence">
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
