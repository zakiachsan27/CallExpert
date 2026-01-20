import { useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Eye,
} from 'lucide-react';
import { useState } from 'react';
import { analyzeSEO, getSEOScoreColor, getSEOScoreBgColor, getSEOScoreLabel } from '../../../utils/seoAnalyzer';
import {
  analyzeReadability,
  getReadabilityColor,
  getReadabilityBgColor,
  getReadabilityLabel,
} from '../../../utils/readabilityAnalyzer';
import type { SEOCheck } from '../../../types/article';

interface SEOPanelProps {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  content: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  slug?: string;
}

export function SEOPanel({
  title,
  metaTitle,
  metaDescription,
  focusKeyword,
  content,
  featuredImageUrl,
  featuredImageAlt,
  slug,
}: SEOPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    seo: true,
    readability: true,
    preview: false,
  });

  const seoAnalysis = useMemo(
    () =>
      analyzeSEO({
        title,
        metaTitle,
        metaDescription,
        focusKeyword,
        content,
        featuredImageUrl,
        featuredImageAlt,
        slug,
      }),
    [title, metaTitle, metaDescription, focusKeyword, content, featuredImageUrl, featuredImageAlt, slug]
  );

  const readabilityResult = useMemo(() => analyzeReadability(content), [content]);

  const toggleSection = (section: 'seo' | 'readability' | 'preview') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    }
  };

  const displayTitle = metaTitle || title || 'Judul Artikel';
  const displayDescription = metaDescription || 'Deskripsi artikel akan muncul di sini...';
  const displayUrl = slug ? `mentorinaja.com/artikel/${slug}` : 'mentorinaja.com/artikel/...';

  return (
    <div className="space-y-4">
      {/* SEO Score Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">SEO Score</h3>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-bold ${getSEOScoreBgColor(seoAnalysis.score)} ${getSEOScoreColor(seoAnalysis.score)}`}
          >
            {seoAnalysis.score}/100
          </div>
        </div>

        {/* Score Bar */}
        <div className="mb-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                seoAnalysis.score >= 80
                  ? 'bg-green-500'
                  : seoAnalysis.score >= 60
                    ? 'bg-yellow-500'
                    : seoAnalysis.score >= 40
                      ? 'bg-orange-500'
                      : 'bg-red-500'
              }`}
              style={{ width: `${seoAnalysis.score}%` }}
            />
          </div>
          <p className={`text-xs mt-1 ${getSEOScoreColor(seoAnalysis.score)}`}>
            {getSEOScoreLabel(seoAnalysis.score)}
          </p>
        </div>

        {/* SEO Checks */}
        <button
          onClick={() => toggleSection('seo')}
          className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900"
        >
          <span>Detail Analisis SEO</span>
          {expandedSections.seo ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {expandedSections.seo && (
          <div className="mt-3 space-y-2">
            {seoAnalysis.checks.map(check => (
              <SEOCheckItem key={check.id} check={check} />
            ))}
          </div>
        )}
      </div>

      {/* Readability Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Keterbacaan</h3>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-bold ${getReadabilityBgColor(readabilityResult.level)} ${getReadabilityColor(readabilityResult.level)}`}
          >
            {readabilityResult.score}/100
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{readabilityResult.wordCount}</p>
            <p className="text-xs text-gray-500">Kata</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">
              {readabilityResult.averageSentenceLength}
            </p>
            <p className="text-xs text-gray-500">Kata/Kalimat</p>
          </div>
        </div>

        <p className={`text-sm font-medium ${getReadabilityColor(readabilityResult.level)}`}>
          {getReadabilityLabel(readabilityResult.level)}
        </p>

        {/* Readability Suggestions */}
        <button
          onClick={() => toggleSection('readability')}
          className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900 mt-3"
        >
          <span>Saran Perbaikan</span>
          {expandedSections.readability ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {expandedSections.readability && readabilityResult.suggestions.length > 0 && (
          <ul className="mt-2 space-y-1">
            {readabilityResult.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                {suggestion}
              </li>
            ))}
          </ul>
        )}

        {expandedSections.readability && readabilityResult.suggestions.length === 0 && (
          <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Tidak ada saran perbaikan
          </p>
        )}
      </div>

      {/* Google Preview Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <button
          onClick={() => toggleSection('preview')}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Preview Google</h3>
          </div>
          {expandedSections.preview ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {expandedSections.preview && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-green-700 mb-1">{displayUrl}</p>
            <h4 className="text-blue-700 text-lg font-medium hover:underline cursor-pointer line-clamp-1">
              {displayTitle}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{displayDescription}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SEOCheckItem({ check }: { check: SEOCheck }) {
  const [isExpanded, setIsExpanded] = useState(check.status !== 'good');

  const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div
      className={`p-2 rounded-lg border ${
        check.status === 'good'
          ? 'border-green-100 bg-green-50'
          : check.status === 'warning'
            ? 'border-yellow-100 bg-yellow-50'
            : 'border-red-100 bg-red-50'
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          {getStatusIcon(check.status)}
          <span className="text-sm font-medium text-gray-700">{check.name}</span>
        </div>
        <span className="text-xs text-gray-500">
          {check.points}/{check.maxPoints}
        </span>
      </button>

      {isExpanded && (
        <p
          className={`mt-1 pl-6 text-xs ${
            check.status === 'good'
              ? 'text-green-700'
              : check.status === 'warning'
                ? 'text-yellow-700'
                : 'text-red-700'
          }`}
        >
          {check.message}
        </p>
      )}
    </div>
  );
}
