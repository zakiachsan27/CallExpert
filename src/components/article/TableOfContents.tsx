import { useEffect, useState } from 'react';
import { List } from 'lucide-react';
import { extractHeadings } from '../../utils/seoAnalyzer';

interface TableOfContentsProps {
  content: string;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const headings = extractHeadings(content);

    // Generate IDs for headings
    const tocItems: TOCItem[] = headings
      .filter(h => h.level >= 2 && h.level <= 3) // Only H2 and H3
      .map((h, index) => ({
        id: `heading-${index}-${h.text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
        text: h.text,
        level: h.level,
      }));

    setItems(tocItems);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    items.forEach(item => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Header height + some padding
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (items.length < 2) {
    return null;
  }

  return (
    <nav className="bg-gray-50 rounded-xl p-5 sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <List className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Daftar Isi</h3>
      </div>

      <ul className="space-y-2">
        {items.map(item => (
          <li
            key={item.id}
            className={item.level === 3 ? 'ml-4' : ''}
          >
            <button
              onClick={() => scrollToHeading(item.id)}
              className={`text-left text-sm transition-colors w-full py-1 px-2 rounded hover:bg-purple-100 ${
                activeId === item.id
                  ? 'text-purple-700 bg-purple-50 font-medium'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Helper component to inject IDs into article content
export function processContentWithIds(content: string): string {
  let headingIndex = 0;

  return content.replace(
    /<h([2-3])([^>]*)>(.*?)<\/h[2-3]>/gi,
    (match, level, attrs, text) => {
      const plainText = text.replace(/<[^>]*>/g, '');
      const id = `heading-${headingIndex}-${plainText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
      headingIndex++;
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    }
  );
}
