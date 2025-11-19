import * as pdfjsLib from 'pdfjs-dist';

// Use worker with new URL constructor (works with Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

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
    console.log('Starting PDF extraction for:', file.name);
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF loaded, pages:', pdf.numPages);

    let fullText = '';

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log('Extracting page:', pageNum);
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

    console.log('Extraction complete, text length:', fullText.length);
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF.');
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
 * Calculate years from period string (e.g., "2020 - Present", "Jan 2018 - Dec 2020")
 */
function calculateYearsFromPeriod(period: string): number {
  const yearRegex = /\d{4}/g;
  const years = period.match(yearRegex);

  if (!years || years.length === 0) return 0;

  const startYear = parseInt(years[0]);
  const endYear = period.toLowerCase().includes('present') || period.toLowerCase().includes('current')
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

  // Look for experience section with multiple variations
  const expSectionRegex = /(?:WORK\s*EXPERIENCE|PROFESSIONAL\s*EXPERIENCE|EXPERIENCE|WORK\s*HISTORY|EMPLOYMENT\s*HISTORY|CAREER\s*HISTORY)[\s\S]*?(?=\n\n[A-Z]{2,}|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS|$)/i;
  const expSection = text.match(expSectionRegex);

  console.log('extractWorkExperience - Section found:', !!expSection);
  if (!expSection) {
    console.log('extractWorkExperience - No experience section found');
    return experiences;
  }

  const sectionText = expSection[0];
  console.log('extractWorkExperience - Section text preview:', sectionText.substring(0, 300));

  const lines = sectionText.split('\n').filter(line => line.trim().length > 0);
  console.log('extractWorkExperience - Total lines:', lines.length);

  let i = 1; // Skip section header
  while (i < lines.length) {
    const line = lines[i].trim();

    // Check if line contains job title with | separator (e.g., "Job Title | Company | Date")
    if (line.includes('|') && /[A-Z]/.test(line) && !line.startsWith('-') && !line.startsWith('•')) {
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
          if (descLine.includes('|') && /[A-Z]/.test(descLine) && !descLine.startsWith('-') && !descLine.startsWith('•')) {
            break;
          }

          // Add description lines
          if (descLine.startsWith('•') || descLine.startsWith('-') || descLine.startsWith('*')) {
            description += descLine.replace(/^[•\-*]\s*/, '') + ' ';
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

    // Check if this line looks like a job title (original logic for other formats)
    if (/^[A-Z]/.test(line) &&
        !line.startsWith('•') &&
        !line.startsWith('-') &&
        !line.startsWith('*') &&
        line.length > 5 &&
        line.length < 100) {

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
        } else if (/\d{4}/.test(nextLine)) {
          // This line is a date, previous line might be on same line as title
          period = nextLine;
          company = title.split(/\s{2,}|\||–|—/)[1] || '';
          i++;
        } else {
          // Company is on its own line
          company = nextLine;
          i++;

          // Check next line for period
          if (i < lines.length && /\d{4}/.test(lines[i])) {
            period = lines[i].trim();
            i++;
          }
        }

        // Following lines are description (bullets or paragraphs)
        let description = '';
        while (i < lines.length) {
          const descLine = lines[i].trim();

          // Stop if we hit another job title pattern
          if (/^[A-Z][a-z]+\s+[A-Z]/.test(descLine) &&
              !descLine.startsWith('•') &&
              !descLine.startsWith('-')) {
            break;
          }

          // Add description lines
          if (descLine.startsWith('•') || descLine.startsWith('-') || descLine.startsWith('*')) {
            description += descLine.replace(/^[•\-*]\s*/, '') + ' ';
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
  return experiences.slice(0, 5); // Limit to latest 5 experiences
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
