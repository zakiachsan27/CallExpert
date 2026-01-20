import { useState, useEffect } from 'react';
import { Link, Check, AlertCircle, Loader2 } from 'lucide-react';
import { generateSlug, isValidSlug } from '../../../utils/slugGenerator';
import { checkSlugAvailability } from '../../../services/articleService';

interface SlugInputProps {
  value: string;
  title: string;
  articleId?: string;
  onChange: (slug: string) => void;
}

export function SlugInput({ value, title, articleId, onChange }: SlugInputProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  // Auto-generate slug from title when title changes and slug is empty
  useEffect(() => {
    if (title && !value) {
      const generatedSlug = generateSlug(title);
      onChange(generatedSlug);
    }
  }, [title]);

  // Check availability when slug changes
  useEffect(() => {
    if (!value) {
      setIsAvailable(null);
      setError('');
      return;
    }

    if (!isValidSlug(value)) {
      setError('Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung');
      setIsAvailable(false);
      return;
    }

    const checkAvailability = async () => {
      setIsChecking(true);
      setError('');

      try {
        const available = await checkSlugAvailability(value, articleId);
        setIsAvailable(available);
        if (!available) {
          setError('Slug sudah digunakan');
        }
      } catch (err) {
        console.error('Error checking slug:', err);
        setError('Gagal memeriksa ketersediaan slug');
      } finally {
        setIsChecking(false);
      }
    };

    const debounce = setTimeout(checkAvailability, 500);
    return () => clearTimeout(debounce);
  }, [value, articleId]);

  const handleGenerateFromTitle = () => {
    if (title) {
      const generatedSlug = generateSlug(title);
      onChange(generatedSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow valid slug characters
    const newValue = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">URL Slug</label>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Link className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={value}
            onChange={handleSlugChange}
            placeholder="artikel-slug"
            className={`w-full pl-10 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              error ? 'border-red-300' : isAvailable ? 'border-green-300' : 'border-gray-200'
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isChecking ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : isAvailable === true ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : isAvailable === false ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateFromTitle}
          disabled={!title}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate
        </button>
      </div>

      {/* Preview URL */}
      <p className="text-xs text-gray-500">
        Preview: <span className="font-mono">mentorinaja.com/artikel/{value || '...'}</span>
      </p>

      {/* Error Message */}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
