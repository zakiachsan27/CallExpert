// Slug Generator Utility
// Generates SEO-friendly URL slugs from titles

// Indonesian character mappings
const indonesianCharMap: Record<string, string> = {
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
  'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
  'ñ': 'n', 'ç': 'c',
  // Common Indonesian special characters
  'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u',
};

// Stop words in Indonesian (common words to optionally remove for shorter slugs)
const indonesianStopWords = new Set([
  'dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'dengan', 'pada', 'adalah',
  'ini', 'itu', 'atau', 'juga', 'akan', 'telah', 'sudah', 'agar', 'oleh',
  'serta', 'bagi', 'saat', 'ketika', 'bila', 'jika', 'kalau', 'apa',
  'siapa', 'mana', 'bagaimana', 'mengapa', 'kapan', 'dimana', 'kemana',
  'berapa', 'apakah', 'tentang', 'sebagai', 'dapat', 'bisa', 'harus',
  'sangat', 'lebih', 'paling', 'semua', 'setiap', 'antara', 'dalam',
  'melalui', 'terhadap', 'karena', 'sehingga', 'setelah', 'sebelum',
]);

// Generate slug from title
export function generateSlug(title: string, options: {
  removeStopWords?: boolean;
  maxLength?: number;
} = {}): string {
  const { removeStopWords = false, maxLength = 100 } = options;

  let slug = title.toLowerCase();

  // Replace special characters
  for (const [char, replacement] of Object.entries(indonesianCharMap)) {
    slug = slug.replace(new RegExp(char, 'g'), replacement);
  }

  // Remove non-alphanumeric characters except spaces and hyphens
  slug = slug.replace(/[^a-z0-9\s-]/g, '');

  // Split into words
  let words = slug.split(/\s+/).filter(word => word.length > 0);

  // Optionally remove stop words
  if (removeStopWords && words.length > 3) {
    words = words.filter(word => !indonesianStopWords.has(word));
  }

  // Join with hyphens
  slug = words.join('-');

  // Remove consecutive hyphens
  slug = slug.replace(/-+/g, '-');

  // Remove leading/trailing hyphens
  slug = slug.replace(/^-|-$/g, '');

  // Truncate to max length (at word boundary)
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Don't cut in the middle of a word
    const lastHyphen = slug.lastIndexOf('-');
    if (lastHyphen > maxLength * 0.5) {
      slug = slug.substring(0, lastHyphen);
    }
  }

  return slug;
}

// Generate unique slug by appending number if needed
export function generateUniqueSlug(
  title: string,
  existingSlugs: string[],
  options: {
    removeStopWords?: boolean;
    maxLength?: number;
  } = {}
): string {
  const baseSlug = generateSlug(title, options);

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  // Find available suffix
  let counter = 2;
  let newSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(newSlug)) {
    counter++;
    newSlug = `${baseSlug}-${counter}`;

    // Safety limit
    if (counter > 100) {
      newSlug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return newSlug;
}

// Validate slug format
export function isValidSlug(slug: string): boolean {
  // Must be lowercase alphanumeric with hyphens only
  // Cannot start or end with hyphen
  // Cannot have consecutive hyphens
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 250;
}

// Sanitize user-input slug
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Get slug preview (for display)
export function getSlugPreview(slug: string, baseUrl: string = 'https://mentorinaja.com'): string {
  return `${baseUrl}/artikel/${slug}`;
}
