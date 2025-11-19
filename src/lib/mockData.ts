import type { Expert } from '../App';

export const mockExperts: Expert[] = [
  {
    id: '1',
    name: 'Sarah Anderson',
    role: 'Senior Product Manager',
    company: 'Google',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    rating: 4.9,
    reviewCount: 127,
    expertise: ['Product Strategy', 'User Research', 'Agile', 'Leadership'],
    bio: 'Product leader with 8+ years driving innovation in tech. Passionate about mentoring the next generation of PMs.',
    experience: 8,
    location: {
      city: 'Jakarta',
      country: 'Indonesia'
    },
    availability: 'online',
    sessionTypes: [
      {
        id: 's1-1',
        name: 'Quick Chat',
        duration: 30,
        price: 150000,
        category: 'online-chat',
        description: 'Instant messaging consultation for quick questions'
      },
      {
        id: 's1-2',
        name: '1-on-1 Video Consultation',
        duration: 60,
        price: 500000,
        category: 'online-video',
        description: 'Deep dive video call session via Zoom'
      },
      {
        id: 's1-3',
        name: 'Workshop Session',
        duration: 120,
        price: 1500000,
        category: 'online-event',
        description: 'Group workshop for teams (max 10 people)'
      },
      {
        id: 's1-4',
        name: 'Coffee Meetup',
        duration: 90,
        price: 750000,
        category: 'offline-event',
        description: 'In-person meetup at local cafe in Jakarta'
      }
    ],
    digitalProducts: [
      {
        id: 'p1-1',
        name: 'Product Management Starter Kit',
        description: 'Complete guide with templates, frameworks, and checklists for aspiring PMs',
        price: 250000,
        type: 'guide',
        downloadLink: 'https://example.com/pm-starter-kit.pdf'
      },
      {
        id: 'p1-2',
        name: 'PRD Template Collection',
        description: '10+ battle-tested PRD templates used at Google',
        price: 150000,
        type: 'template',
        downloadLink: 'https://example.com/prd-templates.zip'
      }
    ],
    achievements: [
      'Led product launch reaching 10M+ users',
      'Speaker at ProductCon 2023',
      'Mentor of 50+ product managers'
    ],
    education: [
      'MBA - Stanford University',
      'BS Computer Science - UI'
    ]
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Lead Software Engineer',
    company: 'Meta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rating: 4.8,
    reviewCount: 89,
    expertise: ['System Design', 'React', 'Node.js', 'Cloud Architecture'],
    bio: 'Full-stack engineer specializing in scalable systems. Love helping developers level up their skills.',
    experience: 10,
    location: {
      city: 'Singapore',
      country: 'Singapore'
    },
    availability: 'offline',
    sessionTypes: [
      {
        id: 's2-1',
        name: 'Code Review',
        duration: 45,
        price: 400000,
        category: 'online-video',
        description: 'Comprehensive code review and feedback session'
      },
      {
        id: 's2-2',
        name: 'System Design Session',
        duration: 90,
        price: 800000,
        category: 'online-video',
        description: 'Learn how to design scalable systems'
      },
      {
        id: 's2-3',
        name: 'Career Coaching',
        duration: 60,
        price: 600000,
        category: 'online-video',
        description: 'Career guidance for software engineers'
      }
    ],
    digitalProducts: [
      {
        id: 'p2-1',
        name: 'System Design Interview Masterclass',
        description: 'Video course covering 20+ system design scenarios',
        price: 500000,
        type: 'course',
        downloadLink: 'https://example.com/system-design-course'
      }
    ],
    achievements: [
      'Built infrastructure serving 2B+ users',
      'Tech lead for Instagram Stories',
      'Open source contributor with 10k+ stars'
    ],
    education: [
      'MS Computer Science - MIT',
      'BS Engineering - NTU'
    ]
  },
  {
    id: '3',
    name: 'Priya Sharma',
    role: 'UX Design Director',
    company: 'Airbnb',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    rating: 5.0,
    reviewCount: 156,
    expertise: ['UX Design', 'Design Systems', 'User Research', 'Figma'],
    bio: 'Design leader passionate about creating delightful user experiences. Former design lead at Uber and Grab.',
    experience: 12,
    location: {
      city: 'Bali',
      country: 'Indonesia'
    },
    availability: 'online',
    sessionTypes: [
      {
        id: 's3-1',
        name: 'Portfolio Review',
        duration: 45,
        price: 350000,
        category: 'online-video',
        description: 'Get expert feedback on your design portfolio'
      },
      {
        id: 's3-2',
        name: 'Design Critique',
        duration: 60,
        price: 450000,
        category: 'online-video',
        description: 'Detailed critique of your design work'
      },
      {
        id: 's3-3',
        name: 'Quick Design Question',
        duration: 15,
        price: 100000,
        category: 'online-chat',
        description: 'Quick chat for urgent design questions'
      },
      {
        id: 's3-4',
        name: 'Design Workshop',
        duration: 180,
        price: 2000000,
        category: 'offline-event',
        description: 'Full-day design workshop in Bali'
      }
    ],
    digitalProducts: [
      {
        id: 'p3-1',
        name: 'UX Design System Template',
        description: 'Complete Figma design system used at Airbnb',
        price: 300000,
        type: 'template',
        downloadLink: 'https://figma.com/design-system-template'
      },
      {
        id: 'p3-2',
        name: 'User Research Playbook',
        description: 'Step-by-step guide to conducting effective user research',
        price: 200000,
        type: 'ebook',
        downloadLink: 'https://example.com/ux-research-playbook.pdf'
      }
    ],
    achievements: [
      'Led redesign of Airbnb booking flow',
      'Built design system used by 200+ designers',
      'Mentor at Google UX Design Certificate'
    ],
    education: [
      'MFA Interaction Design - Carnegie Mellon',
      'BFA Visual Design - ITB'
    ]
  }
];