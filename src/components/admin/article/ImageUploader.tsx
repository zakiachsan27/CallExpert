import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  imageUrl: string;
  imageAlt: string;
  onImageChange: (url: string) => void;
  onAltChange: (alt: string) => void;
  onUpload: (file: File) => Promise<string>;
}

export function ImageUploader({
  imageUrl,
  imageAlt,
  onImageChange,
  onAltChange,
  onUpload,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const url = await onUpload(file);
      onImageChange(url);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Gagal mengupload gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onImageChange('');
    onAltChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Gambar Utama</label>

      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt={imageAlt || 'Featured image'}
            className="w-full h-48 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
            isUploading
              ? 'border-purple-300 bg-purple-50'
              : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-sm text-purple-600">Mengupload...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Klik untuk upload gambar</p>
                <p className="text-xs text-gray-500">PNG, JPG, atau WebP (max 5MB)</p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {imageUrl && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alt Text (untuk SEO)
          </label>
          <input
            type="text"
            value={imageAlt}
            onChange={e => onAltChange(e.target.value)}
            placeholder="Deskripsi gambar untuk SEO..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Deskripsikan gambar untuk membantu SEO dan aksesibilitas
          </p>
        </div>
      )}
    </div>
  );
}
