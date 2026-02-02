import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from './supabase';

// PDF.js worker setup - use CDN for production reliability
// This is more reliable than bundled worker which can fail in production
const PDFJS_VERSION = '4.10.38'; // Match installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

console.log('[ResumeParser] PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);

// =============================================
// AI-BASED RESUME PARSING (Recommended)
// =============================================

export interface AIParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  experiences: Array<{
    title: string;
    company: string;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    description: string | null;
  }>;
  education: Array<{
    institution: string;
    degree: string | null;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
  }>;
  skills: string[];
}

/**
 * Parse resume using AI (recommended for better accuracy)
 * Falls back to regex-based parsing if AI fails
 */
export async function parseResumeWithAI(file: File): Promise<AIParsedResume> {
  const text = await extractTextFromPDF(file);

  console.log('=== AI PARSING RESUME ===');
  console.log('Text length:', text.length);

  try {
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('parse-resume-ai', {
      body: { resumeText: text }
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(error.message || 'Failed to call AI parser');
    }

    if (!data?.success) {
      console.error('AI parsing failed:', data?.error);
      throw new Error(data?.error || 'AI parsing failed');
    }

    console.log('=== AI PARSED RESULT ===');
    console.log('Name:', data.data.name);
    console.log('Experiences:', data.data.experiences?.length || 0);
    console.log('Education:', data.data.education?.length || 0);
    console.log('Skills:', data.data.skills?.length || 0);

    return data.data as AIParsedResume;

  } catch (error) {
    console.error('AI parsing error, falling back to regex:', error);

    // Fall back to regex-based parsing
    const regexResult = await parseResume(file);

    // Convert regex result to AI format
    return {
      name: regexResult.name || null,
      email: regexResult.email || null,
      phone: regexResult.phone || null,
      location: regexResult.location.city ? `${regexResult.location.city}, ${regexResult.location.country}` : null,
      summary: regexResult.bio || null,
      experiences: regexResult.workExperience.map(exp => ({
        title: exp.title,
        company: exp.company,
        location: null,
        start_date: extractStartDate(exp.period),
        end_date: extractEndDate(exp.period),
        is_current: isCurrentPosition(exp.period),
        description: exp.description
      })),
      education: regexResult.education.map(edu => ({
        institution: edu,
        degree: null,
        field_of_study: null,
        start_date: null,
        end_date: null
      })),
      skills: regexResult.skills
    };
  }
}

// Helper functions for fallback conversion
function extractStartDate(period: string): string | null {
  const yearMatch = period.match(/\d{4}/);
  if (yearMatch) {
    return `${yearMatch[0]}-01`;
  }
  return null;
}

function extractEndDate(period: string): string | null {
  const lowerPeriod = period.toLowerCase();
  if (lowerPeriod.includes('present') || lowerPeriod.includes('current') || lowerPeriod.includes('sekarang')) {
    return null;
  }
  const years = period.match(/\d{4}/g);
  if (years && years.length > 1) {
    return `${years[1]}-12`;
  }
  return null;
}

function isCurrentPosition(period: string): boolean {
  const lowerPeriod = period.toLowerCase();
  return lowerPeriod.includes('present') || lowerPeriod.includes('current') || lowerPeriod.includes('sekarang');
}

// =============================================
// REGEX-BASED RESUME PARSING (Fallback)
// =============================================

export interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  location: {
    city: string;
    country: string;
  };
  bio: string;
  company: string;
  role: string;
  experience: number;
  expertise: string[];
  skills: string[];
  workExperience: Array<{
    title: string;
    company: string;
    period: string;
    description: string;
  }>;
  education: string[];
  achievements: string[];
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('[PDF Extract] Starting for:', file.name, 'Size:', file.size);
    console.log('[PDF Extract] Worker src:', pdfjsLib.GlobalWorkerOptions.workerSrc);

    const arrayBuffer = await file.arrayBuffer();
    console.log('[PDF Extract] ArrayBuffer created, size:', arrayBuffer.byteLength);

    console.log('[PDF Extract] Loading PDF document...');
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

    // Add progress logging
    loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
      if (progress.total > 0) {
        console.log('[PDF Extract] Loading progress:', Math.round((progress.loaded / progress.total) * 100) + '%');
      }
    };

    const pdf = await loadingTask.promise;
    console.log('[PDF Extract] PDF loaded successfully, pages:', pdf.numPages);

    let fullText = '';

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log('[PDF Extract] Extracting page:', pageNum, '/', pdf.numPages);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Preserve line structure by tracking Y positions
      let lastY = -1;
      const pageText = textContent.items
        .map((item: any) => {
          const text = item.str;
          const y = item.transform[5]; // Y position

          // Add newline if Y position changed (new line in PDF)
          if (lastY !== -1 && Math.abs(y - lastY) > 5) {
            lastY = y;
            return '\n' + text;
          }

          lastY = y;
          return text + ' ';
        })
        .join('');

      fullText += pageText + '\n\n';
    }

    console.log('[PDF Extract] Extraction complete, text length:', fullText.length);
    console.log('[PDF Extract] Preview:', fullText.substring(0, 200));
    return fullText;
  } catch (error: any) {
    console.error('[PDF Extract] Error extracting text from PDF:', error);
    console.error('[PDF Extract] Error name:', error?.name);
    console.error('[PDF Extract] Error message:', error?.message);

    // Provide more specific error messages
    if (error?.name === 'PasswordException') {
      throw new Error('PDF is password protected. Please upload an unprotected PDF.');
    } else if (error?.name === 'InvalidPDFException') {
      throw new Error('Invalid PDF file. Please upload a valid PDF document.');
    } else if (error?.message?.includes('worker')) {
      throw new Error('PDF worker failed to load. Please refresh and try again.');
    }

    throw new Error(`Failed to read PDF: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Parse resume text and extract structured data
 * This parser is optimized for ATS-friendly resumes
 */
export async function parseResume(file: File): Promise<ParsedResumeData> {
  const text = await extractTextFromPDF(file);

  console.log('=== PARSING RESUME ===');
  console.log('Full text preview (first 500 chars):', text.substring(0, 500));

  const parsedData = {
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    location: extractLocation(text),
    bio: extractBio(text),
    company: extractCurrentCompany(text),
    role: extractCurrentRole(text),
    experience: extractYearsOfExperience(text),
    expertise: extractExpertise(text),
    skills: extractSkills(text),
    workExperience: extractWorkExperience(text),
    education: extractEducation(text),
    achievements: extractAchievements(text),
  };

  console.log('=== PARSED DATA ===');
  console.log('Name:', parsedData.name);
  console.log('Email:', parsedData.email);
  console.log('Company:', parsedData.company);
  console.log('Role:', parsedData.role);
  console.log('Work Experience count:', parsedData.workExperience.length);
  console.log('Work Experience:', parsedData.workExperience);

  return parsedData;
}

/**
 * Extract name from resume text
 * Usually at the top of the resume
 */
function extractName(text: string): string {
  // Get first few lines
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  console.log('extractName - First 10 lines:', lines.slice(0, 10));

  // Name is usually in the first 5 lines and is 2-5 words
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    const words = line.split(/\s+/);

    // Skip common header words
    const commonHeaders = ['RESUME', 'CV', 'CURRICULUM', 'VITAE', 'PROFILE', 'PERSONAL', 'CONTACT'];
    if (commonHeaders.some(header => line.toUpperCase().includes(header))) {
      continue;
    }

    // Check if it looks like a name (2-5 words, mostly capitalized, no numbers/symbols)
    if (words.length >= 2 && words.length <= 5 &&
        !/\d/.test(line) &&  // No numbers
        /^[A-Z]/.test(line) &&  // Starts with capital
        !line.includes('@') &&  // No email
        !line.includes('|') &&  // No separators
        !line.includes(':') &&  // No colons
        line.length < 50) {  // Not too long

      // Check if most words are capitalized (name pattern)
      const capitalizedWords = words.filter(w => /^[A-Z]/.test(w));
      if (capitalizedWords.length >= words.length * 0.5) {
        console.log('extractName - Found name:', line);
        return line;
      }
    }
  }

  console.log('extractName - No name found');
  return '';
}

/**
 * Extract email from resume text
 */
function extractEmail(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : '';
}

/**
 * Extract phone number from resume text
 */
function extractPhone(text: string): string {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : '';
}

/**
 * Extract location (city, country) from resume text
 */
function extractLocation(text: string): { city: string; country: string } {
  // Common location patterns
  const locationPatterns = [
    /(?:Jakarta|Bandung|Surabaya|Bali|Yogyakarta|Medan|Semarang),?\s*(?:Indonesia|ID)/i,
    /(?:Singapore|SG)/i,
    /(?:Kuala Lumpur|KL),?\s*(?:Malaysia|MY)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      const location = match[0];
      const parts = location.split(/[,\s]+/).filter(p => p.length > 0);

      if (parts.length >= 2) {
        return {
          city: parts[0],
          country: parts[parts.length - 1].replace(/[^a-zA-Z]/g, '')
        };
      }
    }
  }

  return { city: '', country: '' };
}

/**
 * Extract bio/summary from resume text
 */
function extractBio(text: string): string {
  // Look for summary/profile section
  const summaryRegex = /(?:SUMMARY|PROFILE|ABOUT|OBJECTIVE)[\s\S]*?(?:\n\n|\n(?=[A-Z]{2,}))/i;
  const match = text.match(summaryRegex);

  if (match) {
    // Clean up the summary text
    const bio = match[0]
      .replace(/(?:SUMMARY|PROFILE|ABOUT|OBJECTIVE)/i, '')
      .trim()
      .split('\n')
      .filter(line => line.trim().length > 20)
      .join(' ')
      .substring(0, 500);

    return bio;
  }

  return '';
}

/**
 * Extract current company from work experience
 */
function extractCurrentCompany(text: string): string {
  const experiences = extractWorkExperience(text);
  if (experiences.length > 0) {
    return experiences[0].company;
  }
  return '';
}

/**
 * Extract current role from work experience
 */
function extractCurrentRole(text: string): string {
  const experiences = extractWorkExperience(text);
  if (experiences.length > 0) {
    return experiences[0].title;
  }
  return '';
}

/**
 * Calculate years of experience from work history
 */
function extractYearsOfExperience(text: string): number {
  const experiences = extractWorkExperience(text);

  let totalYears = 0;
  experiences.forEach(exp => {
    const years = calculateYearsFromPeriod(exp.period);
    totalYears += years;
  });

  return Math.round(totalYears);
}

/**
 * Calculate years from period string (e.g., "2020 - Present", "Jan 2018 - Dec 2020", "Agustus 2025 – Sekarang")
 */
function calculateYearsFromPeriod(period: string): number {
  const yearRegex = /\d{4}/g;
  const years = period.match(yearRegex);

  if (!years || years.length === 0) return 0;

  const startYear = parseInt(years[0]);
  const lowerPeriod = period.toLowerCase();
  // Support Indonesian "Sekarang" as well as English "Present"/"Current"
  const isCurrentJob = lowerPeriod.includes('present') || lowerPeriod.includes('current') || lowerPeriod.includes('sekarang');
  const endYear = isCurrentJob
    ? new Date().getFullYear()
    : (years.length > 1 ? parseInt(years[1]) : new Date().getFullYear());

  return Math.max(0, endYear - startYear);
}

/**
 * Extract expertise/specializations from resume
 */
function extractExpertise(text: string): string[] {
  const expertise: string[] = [];

  // Common expertise keywords for tech professionals
  const expertiseKeywords = [
    'Product Management', 'Project Management', 'Agile', 'Scrum', 'Software Development',
    'Data Science', 'Machine Learning', 'AI', 'DevOps', 'Cloud Computing',
    'UX Design', 'UI Design', 'User Research', 'Digital Marketing', 'SEO',
    'Business Analysis', 'Strategy', 'Leadership', 'Team Management'
  ];

  expertiseKeywords.forEach(keyword => {
    // Escape special regex characters in keyword (for safety)
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(escapedKeyword, 'i').test(text)) {
      expertise.push(keyword);
    }
  });

  return expertise.slice(0, 5); // Limit to top 5
}

/**
 * Extract skills from resume text
 */
function extractSkills(text: string): string[] {
  const skills: string[] = [];

  // Look for skills section
  const skillsSectionRegex = /(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES)[\s\S]*?(?:\n\n|\n(?=[A-Z]{2,}))/i;
  const skillsSection = text.match(skillsSectionRegex);

  // Common technical skills (including those with special characters)
  const technicalSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'React', 'Node.js', 'Angular', 'Vue', 'Vue.js',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'Git', 'Jira', 'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Excel', 'Tableau',
    'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', '.NET', 'ASP.NET', 'Next.js', 'Express.js'
  ];

  const searchText = skillsSection ? skillsSection[0] : text;

  technicalSkills.forEach(skill => {
    // Escape special regex characters in skill name (e.g., C++, .NET)
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escapedSkill}\\b`, 'i').test(searchText)) {
      skills.push(skill);
    }
  });

  return skills.slice(0, 10); // Limit to top 10
}

/**
 * Extract work experience from resume text
 */
function extractWorkExperience(text: string): Array<{
  title: string;
  company: string;
  period: string;
  description: string;
}> {
  const experiences: Array<{
    title: string;
    company: string;
    period: string;
    description: string;
  }> = [];

  // Look for experience section with multiple variations (including Indonesian)
  // First, find where the experience section starts
  const expHeaderRegex = /(?:WORK\s*EXPERIENCE|PROFESSIONAL\s*EXPERIENCE|EXPERIENCE|WORK\s*HISTORY|EMPLOYMENT\s*HISTORY|CAREER\s*HISTORY|PENGALAMAN\s*KERJA|PENGALAMAN\s*PROFESIONAL)\s*\n/i;
  const headerMatch = text.match(expHeaderRegex);

  if (!headerMatch) {
    console.log('extractWorkExperience - No experience section header found');
    return experiences;
  }

  const headerIndex = headerMatch.index! + headerMatch[0].length;
  const remainingText = text.substring(headerIndex);

  // Find where the section ends (at next major section)
  const endSectionRegex = /\n(?:EDUCATION|SKILLS|TECHNICAL\s+SKILLS|CERTIFICATIONS|PROJECTS|KOMPETENSI|KOMPETENSI\s+UNGGULAN|PENDIDIKAN|KEAHLIAN|Tools:?\s*\n|Bahasa\s*\n|LANGUAGES|REFERENCES|AWARDS|ACHIEVEMENTS)/i;
  const endMatch = remainingText.match(endSectionRegex);

  const sectionText = endMatch
    ? remainingText.substring(0, endMatch.index!)
    : remainingText;

  console.log('extractWorkExperience - Section found: true');
  console.log('extractWorkExperience - Section text length:', sectionText.length);
  console.log('extractWorkExperience - Section text preview:', sectionText.substring(0, 500));
  console.log('extractWorkExperience - Section text end:', sectionText.substring(Math.max(0, sectionText.length - 500)));

  const lines = sectionText.split('\n').filter(line => line.trim().length > 0);
  console.log('extractWorkExperience - Total lines:', lines.length);

  // Check if line is a bullet point (defined first as other functions depend on it)
  const isBulletLine = (line: string): boolean => {
    return /^[●•\-\*◦▪]\s*.+/.test(line.trim());
  };

  // Indonesian month names for date detection
  const indonesianMonths = 'Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember';
  const englishMonths = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
  // More flexible date regex - allows additional text after the date range (like "Paruh Waktu")
  const dateLineRegex = new RegExp(`^(${indonesianMonths}|${englishMonths})\\s+\\d{4}\\s*[–\\-—]\\s*(${indonesianMonths}|${englishMonths}\\s+\\d{4}|\\d{4}|Sekarang|Present|Current)`, 'i');
  // Also match year-only format like "2021 – 2023"
  const yearOnlyDateRegex = /^\d{4}\s*[–\-—]\s*(\d{4}|Present|Sekarang|Current)/i;

  // Check if line is a date line (Indonesian or English format)
  const isDateLine = (line: string): boolean => {
    const trimmed = line.trim();
    return dateLineRegex.test(trimmed) || yearOnlyDateRegex.test(trimmed);
  };

  // Check if line is a company-location line (contains dash separator like "Company – Location" or "Company - Location")
  // More flexible to allow dots, numbers, special chars in company names (like "Katadata.co.id")
  const isCompanyLocationLine = (line: string): boolean => {
    const trimmed = line.trim();
    // Must contain a dash separator (em dash, en dash, or hyphen) not at start
    // And have content on both sides
    const dashMatch = trimmed.match(/^(.+?)\s*[–\-—]\s*(.+)$/);
    if (dashMatch) {
      const beforeDash = dashMatch[1].trim();
      const afterDash = dashMatch[2].trim();
      // Company name should be reasonably long and location should start with capital
      return beforeDash.length > 2 && /^[A-Z]/.test(afterDash) && !isDateLine(trimmed);
    }
    return false;
  };

  // Check if line looks like a company name without location (no dash separator)
  // e.g., "Telkom Digital Business x KLHK & BKPM", "Pengadilan Agama Jakarta Timur (Aplikasi Santrimo)"
  const isCompanyOnlyLine = (line: string): boolean => {
    const trimmed = line.trim();
    // Not a date, not a bullet, starts with capital, has some length
    return /^[A-Z]/.test(trimmed) &&
           trimmed.length > 5 &&
           trimmed.length < 120 &&
           !isDateLine(trimmed) &&
           !isBulletLine(trimmed) &&
           // Contains company indicators OR is followed by a date line (checked in caller)
           (/\s(x|&|\|)\s/.test(trimmed) ||           // collaboration/and patterns
            /\.(co|com|id|org)/.test(trimmed) ||      // domain extensions
            /^(PT|CV)\s/.test(trimmed) ||             // Indonesian company prefixes
            /\([^)]+\)/.test(trimmed) ||              // has parentheses (like "Aplikasi Santrimo")
            /^[A-Z][a-z]+\s+[A-Z]/.test(trimmed));    // Multi-word proper noun (Company Name pattern)
  };

  // Check if a line could be a company line when followed by a date line
  // This is a more permissive check used in context
  const isPotentialCompanyLine = (line: string): boolean => {
    const trimmed = line.trim();
    return /^[A-Z]/.test(trimmed) &&
           trimmed.length > 3 &&
           trimmed.length < 120 &&
           !isDateLine(trimmed) &&
           !isBulletLine(trimmed);
  };

  // Check if line looks like a continuation of a bullet point (not a real title)
  // These are lines that were split by PDF extraction
  const isBulletContinuation = (line: string): boolean => {
    const trimmed = line.trim();
    // Common patterns that indicate this is continuation text, not a title
    const continuationPatterns = [
      /^(dan|serta|untuk|dengan|dalam|yang|secara|hingga|sehingga|termasuk|melalui|berisi|terkait)\s/i, // Indonesian connectors at start
      /^(and|or|for|with|in|to|by|from|including|through|using)\s/i, // English connectors at start
      /^(rencana|kebutuhan|beban|target|sistem)\s/i, // Common noun starters from bullets
      /\.\s*$/, // Ends with period (likely end of sentence from bullet)
      /^[a-z]/, // Starts with lowercase (continuation)
    ];
    return continuationPatterns.some(pattern => pattern.test(trimmed));
  };

  // Check if line looks like a valid job title
  const isLikelyJobTitle = (line: string): boolean => {
    const trimmed = line.trim();
    // Must start with capital, not be a bullet continuation
    if (!(/^[A-Z]/.test(trimmed))) return false;
    if (isBulletContinuation(trimmed)) return false;
    if (isBulletLine(trimmed)) return false;
    if (isDateLine(trimmed)) return false;
    if (isCompanyLocationLine(trimmed)) return false;

    // Job titles usually contain certain words or patterns
    const jobTitlePatterns = [
      /manager/i, /director/i, /lead/i, /senior/i, /junior/i,
      /engineer/i, /developer/i, /analyst/i, /specialist/i,
      /coordinator/i, /executive/i, /officer/i, /head/i,
      /consultant/i, /architect/i, /designer/i, /tenaga\s+ahli/i,
      /product/i, /project/i, /group/i
    ];

    // If it matches a job title pattern, it's likely a title
    if (jobTitlePatterns.some(p => p.test(trimmed))) return true;

    // If line is reasonably short (typical title length) and doesn't look like description
    if (trimmed.length < 80 && trimmed.length > 5) {
      // Check it doesn't look like a sentence (no common sentence starters/connectors)
      const sentencePatterns = [/^Mem\w+/, /^Meng\w+/, /^Meny\w+/, /^Men\w+/, /^Ber\w+/]; // Indonesian verb prefixes
      if (!sentencePatterns.some(p => p.test(trimmed))) {
        return true;
      }
    }

    return false;
  };

  let i = 1; // Skip section header
  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip bullet points and empty lines when looking for job title
    if (isBulletLine(line) || line.length < 5) {
      i++;
      continue;
    }

    // Check if line contains job title with | separator (e.g., "Job Title | Company | Date")
    if (line.includes('|') && /[A-Z]/.test(line) && !isBulletLine(line)) {
      const parts = line.split('|').map(p => p.trim());

      if (parts.length >= 2) {
        const title = parts[0];
        const company = parts[1] || '';
        const period = parts[2] || '';

        console.log('extractWorkExperience - Found job with | separator:', { title, company, period });
        i++;

        // Following lines are description (bullets or paragraphs)
        let description = '';
        while (i < lines.length) {
          const descLine = lines[i].trim();

          // Stop if we hit another job entry with |
          if (descLine.includes('|') && /[A-Z]/.test(descLine) && !isBulletLine(descLine)) {
            break;
          }

          // Add description lines
          if (isBulletLine(descLine)) {
            description += descLine.replace(/^[●•\-\*◦▪]\s*/, '') + ' ';
            i++;
          } else if (descLine.length > 20 && descLine.length < 200) {
            description += descLine + ' ';
            i++;
          } else {
            break;
          }
        }

        experiences.push({
          title,
          company: company || 'Not specified',
          period: period || 'Present',
          description: description.trim().substring(0, 300)
        });
        console.log('extractWorkExperience - Added experience:', { title, company, period });
        continue;
      }
    }

    // NEW: Check for Indonesian 3-line format (Title, Company-Location or Company, Date)
    // Format 1: Job Title / Alternative Title
    //           Company – Location
    //           Month Year – Month Year/Sekarang
    // Format 2: Job Title (with parentheses)
    //           Company Name (no location)
    //           Month Year – Month Year
    if (isLikelyJobTitle(line) && line.length > 5 && line.length < 100) {
      // Check if next two lines match the pattern
      const nextLineIdx = i + 1;
      const dateLineIdx = i + 2;

      if (nextLineIdx < lines.length && dateLineIdx < lines.length) {
        const nextLine = lines[nextLineIdx].trim();
        const potentialDateLine = lines[dateLineIdx].trim();

        // Check if this is 3-line format: Title, Company (any format), Date
        // Use flexible company detection - if next line is not a date/bullet and is followed by a date
        const isCompanyLine = isCompanyLocationLine(nextLine) || isCompanyOnlyLine(nextLine) || isPotentialCompanyLine(nextLine);

        if (isCompanyLine && isDateLine(potentialDateLine)) {
          const title = line;
          let company = '';
          let location = '';

          // Extract company and location based on format
          if (isCompanyLocationLine(nextLine)) {
            const companyMatch = nextLine.match(/^(.+?)\s*[–\-—]\s*(.+)$/);
            company = companyMatch ? companyMatch[1].trim() : nextLine;
            location = companyMatch ? companyMatch[2].trim() : '';
          } else {
            company = nextLine;
          }
          const period = potentialDateLine;

          console.log('extractWorkExperience - Found 3-line format:', { title, company, location, period });
          i = dateLineIdx + 1;

          // Collect bullet points as description
          let description = '';
          while (i < lines.length) {
            const descLine = lines[i].trim();

            // Stop if we hit a new job title (not a bullet, not a date, starts with capital)
            if (!isBulletLine(descLine) && !isDateLine(descLine) && /^[A-Z]/.test(descLine) && descLine.length > 5) {
              // Check if next lines form a new job entry
              const checkNextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
              const checkDateLine = i + 2 < lines.length ? lines[i + 2].trim() : '';

              if ((isCompanyLocationLine(checkNextLine) || isCompanyOnlyLine(checkNextLine) || isPotentialCompanyLine(checkNextLine)) && isDateLine(checkDateLine)) {
                break;
              }
              if (descLine.includes('|') && /[A-Z]/.test(descLine)) {
                break;
              }
            }

            // Add bullet point descriptions
            if (isBulletLine(descLine)) {
              description += descLine.replace(/^[●•\-\*◦▪]\s*/, '') + ' ';
              i++;
            } else if (descLine.length > 20 && descLine.length < 200 && !isDateLine(descLine)) {
              description += descLine + ' ';
              i++;
            } else {
              break;
            }
          }

          experiences.push({
            title,
            company: location ? `${company}, ${location}` : company,
            period,
            description: description.trim().substring(0, 300)
          });
          console.log('extractWorkExperience - Added 3-line format experience:', { title, company, period });
          continue;
        }
      }
    }

    // Check if this line looks like a job title (original logic for other formats)
    if (isLikelyJobTitle(line) && line.length > 5 && line.length < 100) {

      const title = line;
      console.log('extractWorkExperience - Found potential title:', title);
      i++;

      // Next line might be company name or company | date format
      if (i < lines.length) {
        const nextLine = lines[i].trim();
        let company = '';
        let period = '';

        // Check if line contains separator (e.g., "Company | Jan 2020 - Present")
        if (nextLine.includes('|')) {
          const parts = nextLine.split('|');
          company = parts[0].trim();
          period = parts[1] ? parts[1].trim() : '';
          i++;
        } else if (isDateLine(nextLine) || /\d{4}/.test(nextLine)) {
          // This line is a date, previous line might be on same line as title
          period = nextLine;
          company = title.split(/\s{2,}|\||–|—/)[1] || '';
          i++;
        } else {
          // Company is on its own line
          company = nextLine;
          i++;

          // Check next line for period
          if (i < lines.length && (isDateLine(lines[i]) || /\d{4}/.test(lines[i]))) {
            period = lines[i].trim();
            i++;
          }
        }

        // Following lines are description (bullets or paragraphs)
        let description = '';
        while (i < lines.length) {
          const descLine = lines[i].trim();

          // Stop if we hit another job title pattern
          if (/^[A-Z][a-z]+\s+[A-Z]/.test(descLine) && !isBulletLine(descLine)) {
            break;
          }

          // Add description lines
          if (isBulletLine(descLine)) {
            description += descLine.replace(/^[●•\-\*◦▪]\s*/, '') + ' ';
            i++;
          } else if (descLine.length > 20) {
            description += descLine + ' ';
            i++;
          } else {
            break;
          }
        }

        if (company || period) {
          experiences.push({
            title,
            company: company || 'Not specified',
            period: period || 'Present',
            description: description.trim().substring(0, 300)
          });
          console.log('extractWorkExperience - Added experience:', { title, company, period });
        }
      }
    } else {
      i++;
    }
  }

  console.log('extractWorkExperience - Total experiences found:', experiences.length);
  return experiences.slice(0, 15); // Limit to latest 15 experiences
}

/**
 * Extract education from resume text
 */
function extractEducation(text: string): string[] {
  const education: string[] = [];

  // Look for education section
  const eduSectionRegex = /(?:EDUCATION|ACADEMIC)[\s\S]*?(?=\n(?:EXPERIENCE|SKILLS|CERTIFICATIONS|$))/i;
  const eduSection = text.match(eduSectionRegex);

  if (!eduSection) return education;

  const lines = eduSection[0].split('\n').filter(line => line.trim().length > 20);

  // Look for degree patterns
  const degreePatterns = [
    /(?:Bachelor|Master|PhD|MBA|BS|MS|BA|MA).*?(?:in|of).*?(?:from|at|\|)/i,
    /(?:Bachelor|Master|PhD|MBA|BS|MS|BA|MA).*?(?:\d{4})/i
  ];

  lines.forEach(line => {
    degreePatterns.forEach(pattern => {
      if (pattern.test(line)) {
        const edu = line.trim().replace(/[•\-]\s*/, '');
        if (edu.length > 0 && !education.includes(edu)) {
          education.push(edu);
        }
      }
    });
  });

  return education.slice(0, 3);
}

/**
 * Extract achievements and certifications from resume text
 */
function extractAchievements(text: string): string[] {
  const achievements: string[] = [];

  // Look for certifications/achievements section
  const achieveSectionRegex = /(?:CERTIFICATIONS|ACHIEVEMENTS|AWARDS|LICENSES)[\s\S]*?(?=\n(?:EDUCATION|SKILLS|EXPERIENCE|$))/i;
  const achieveSection = text.match(achieveSectionRegex);

  if (!achieveSection) return achievements;

  const lines = achieveSection[0].split('\n').filter(line => line.trim().length > 10);

  lines.forEach(line => {
    const cleaned = line.trim().replace(/^[•\-]\s*/, '');
    if (cleaned.length > 0 &&
        !cleaned.match(/^(?:CERTIFICATIONS|ACHIEVEMENTS|AWARDS|LICENSES)/i)) {
      achievements.push(cleaned);
    }
  });

  return achievements.slice(0, 5);
}
