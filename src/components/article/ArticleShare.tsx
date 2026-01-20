import { Facebook, Twitter, Linkedin, Link2, Check } from 'lucide-react';
import { useState } from 'react';

interface ArticleShareProps {
  title: string;
  url: string;
}

export function ArticleShare({ title, url }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 mr-2">Bagikan:</span>

      <button
        onClick={() => openShareWindow(shareLinks.facebook)}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
        title="Bagikan ke Facebook"
      >
        <Facebook className="w-4 h-4" />
      </button>

      <button
        onClick={() => openShareWindow(shareLinks.twitter)}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200 transition-colors"
        title="Bagikan ke Twitter"
      >
        <Twitter className="w-4 h-4" />
      </button>

      <button
        onClick={() => openShareWindow(shareLinks.linkedin)}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
        title="Bagikan ke LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </button>

      <button
        onClick={copyToClipboard}
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
          copied
            ? 'bg-green-100 text-green-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={copied ? 'Tersalin!' : 'Salin link'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
