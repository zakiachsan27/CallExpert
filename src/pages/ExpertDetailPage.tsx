import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExpertDetail } from '../components/ExpertDetail';
import { Loader2 } from 'lucide-react';
import type { Expert } from '../App';

// Demo experts data - same as ExpertList
const demoExperts: Expert[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Senior Product Manager',
    company: 'Google',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    rating: 4.9,
    reviewCount: 127,
    expertise: ['Product Management', 'Strategy', 'Leadership'],
    bio: 'Experienced product manager with 10+ years leading teams at top tech companies. Specialized in B2B SaaS products and agile methodologies.',
    experience: 10,
    location: { city: 'Jakarta', country: 'Indonesia' },
    availability: 'online',
    skills: ['Figma', 'Jira', 'SQL', 'Python'],
    achievements: [
      'Led product launch reaching 1M+ users in 6 months',
      'Certified Scrum Master (CSM)',
      'Product Management Certificate from ProductSchool'
    ],
    education: [
      'MBA from Stanford University',
      'BS in Computer Science from MIT'
    ],
    workExperience: [
      {
        title: 'Senior Product Manager',
        company: 'Google',
        period: '2020 - Present',
        description: 'Leading product development for Google Workspace, managing a team of 15 engineers and designers.'
      },
      {
        title: 'Product Manager',
        company: 'Meta',
        period: '2017 - 2020',
        description: 'Managed Instagram Shopping features, increasing conversion rate by 40%.'
      }
    ],
    sessionTypes: [
      {
        id: '1',
        name: 'Quick Chat',
        duration: 30,
        price: 150000,
        category: 'online-chat',
        description: 'Quick consultation via chat untuk pertanyaan singkat'
      },
      {
        id: '2',
        name: 'Video Call 1-on-1',
        duration: 60,
        price: 300000,
        category: 'online-video',
        description: 'Konsultasi mendalam via video call'
      },
      {
        id: '3',
        name: 'Coffee Chat',
        duration: 90,
        price: 400000,
        category: 'offline-event',
        description: 'Bertemu langsung untuk diskusi santai sambil ngopi'
      }
    ],
    digitalProducts: [
      {
        id: 'p1',
        name: 'Product Management Career Guide',
        description: 'E-book lengkap untuk memulai karir sebagai Product Manager',
        price: 99000,
        type: 'ebook'
      },
      {
        id: 'p2',
        name: 'PRD Template Pack',
        description: 'Kumpulan template Product Requirements Document',
        price: 149000,
        type: 'template'
      }
    ]
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'UX Design Lead',
    company: 'Apple',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rating: 4.8,
    reviewCount: 89,
    expertise: ['UX Design', 'User Research', 'Design Systems'],
    bio: 'Award-winning UX designer passionate about creating intuitive user experiences. Former design lead at Apple and Airbnb.',
    experience: 8,
    location: { city: 'Bandung', country: 'Indonesia' },
    availability: 'offline',
    skills: ['Figma', 'Sketch', 'Prototyping', 'User Testing'],
    achievements: [
      'Red Dot Design Award Winner 2022',
      'Led design system serving 50M+ users',
      'Speaker at UX Indonesia Conference'
    ],
    education: [
      'Master of Design from Parsons School of Design',
      'BA in Graphic Design from RISD'
    ],
    workExperience: [
      {
        title: 'UX Design Lead',
        company: 'Apple',
        period: '2019 - Present',
        description: 'Leading UX design for Apple Music, focusing on personalization and discovery features.'
      },
      {
        title: 'Senior UX Designer',
        company: 'Airbnb',
        period: '2016 - 2019',
        description: 'Designed host onboarding experience, reducing time-to-list by 60%.'
      }
    ],
    sessionTypes: [
      {
        id: '1',
        name: 'Portfolio Review',
        duration: 45,
        price: 200000,
        category: 'online-video',
        description: 'Review portofolio design dan feedback detail'
      },
      {
        id: '2',
        name: 'Design Mentoring',
        duration: 90,
        price: 450000,
        category: 'online-video',
        description: 'Mentoring mendalam untuk improve design skills'
      }
    ],
    digitalProducts: [
      {
        id: 'p3',
        name: 'UX Design System Starter Kit',
        description: 'Template lengkap design system siap pakai',
        price: 199000,
        type: 'template'
      }
    ]
  },
  {
    id: '3',
    name: 'Amanda Rodriguez',
    role: 'Marketing Director',
    company: 'Netflix',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400',
    rating: 5.0,
    reviewCount: 156,
    expertise: ['Digital Marketing', 'Brand Strategy', 'Growth Hacking'],
    bio: 'Marketing expert specializing in digital strategy and brand building. Helped scale multiple startups from 0 to 10M+ users.',
    experience: 12,
    location: { city: 'Surabaya', country: 'Indonesia' },
    availability: 'online',
    skills: ['Google Ads', 'Facebook Ads', 'SEO', 'Analytics'],
    achievements: [
      'Grew Netflix Indonesia subscribers by 300%',
      'Google Ads Certified Professional',
      'Forbes 30 Under 30 Marketing'
    ],
    education: [
      'MBA in Marketing from Harvard Business School',
      'BA in Communications from UCLA'
    ],
    workExperience: [
      {
        title: 'Marketing Director',
        company: 'Netflix',
        period: '2021 - Present',
        description: 'Leading marketing strategy for Southeast Asia region.'
      },
      {
        title: 'Head of Growth',
        company: 'Gojek',
        period: '2018 - 2021',
        description: 'Scaled user base from 5M to 50M across Indonesia.'
      }
    ],
    sessionTypes: [
      {
        id: '1',
        name: 'Marketing Strategy Session',
        duration: 60,
        price: 350000,
        category: 'online-video',
        description: 'Konsultasi strategi marketing untuk bisnis Anda'
      },
      {
        id: '2',
        name: 'Growth Workshop',
        duration: 120,
        price: 800000,
        category: 'online-event',
        description: 'Workshop intensif growth hacking dan digital marketing'
      }
    ],
    digitalProducts: [
      {
        id: 'p4',
        name: 'Digital Marketing Playbook',
        description: 'Panduan lengkap strategi digital marketing dari 0',
        price: 149000,
        type: 'guide'
      },
      {
        id: 'p5',
        name: 'Growth Hacking Course',
        description: 'Video course lengkap tentang growth hacking',
        price: 499000,
        type: 'course'
      }
    ]
  }
];

export function ExpertDetailPage() {
  const { expertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpertDetail();
  }, [expertId]);

  const fetchExpertDetail = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Try to fetch from backend first
      // For now, use demo data
      const foundExpert = demoExperts.find(e => e.id === expertId);
      
      if (!foundExpert) {
        setError('Expert tidak ditemukan');
        return;
      }

      setExpert(foundExpert);
    } catch (err) {
      console.error('Error fetching expert:', err);
      setError('Gagal memuat data expert');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleBookingClick = (sessionTypeId: string) => {
    // Navigate to booking page with session type
    navigate(`/expert/${expertId}/booking`, { state: { sessionTypeId } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Expert tidak ditemukan'}
          </h2>
          <button
            onClick={handleBack}
            className="text-purple-600 hover:underline"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return <ExpertDetail expert={expert} onBack={handleBack} onBookingClick={handleBookingClick} />;
}