import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookingFlow } from '../components/BookingFlow';
import { BookingSuccess } from '../components/BookingSuccess';
import { Loader2 } from 'lucide-react';
import type { Expert, SessionType, Booking } from '../App';

// Same demo experts data
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
    bio: 'Experienced product manager with 10+ years leading teams at top tech companies.',
    experience: 10,
    location: { city: 'Jakarta', country: 'Indonesia' },
    availability: 'online',
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
    bio: 'Award-winning UX designer passionate about creating intuitive user experiences.',
    experience: 8,
    location: { city: 'Bandung', country: 'Indonesia' },
    availability: 'offline',
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
    bio: 'Marketing expert specializing in digital strategy and brand building.',
    experience: 12,
    location: { city: 'Surabaya', country: 'Indonesia' },
    availability: 'online',
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
    ]
  }
];

export function BookingPage() {
  const { expertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isUserLoggedIn } = useAuth();
  
  const [expert, setExpert] = useState<Expert | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);

  // Get sessionTypeId from navigation state
  const sessionTypeId = (location.state as any)?.sessionTypeId;

  useEffect(() => {
    // Check if user is logged in
    if (!isUserLoggedIn) {
      // Redirect to login with return URL
      navigate('/login', { 
        state: { 
          from: `/expert/${expertId}/booking`,
          loginAs: 'user'
        } 
      });
      return;
    }

    fetchExpertAndSession();
  }, [expertId, sessionTypeId, isUserLoggedIn]);

  const fetchExpertAndSession = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Find expert (use demo data for now)
      const foundExpert = demoExperts.find(e => e.id === expertId);
      
      if (!foundExpert) {
        setError('Expert tidak ditemukan');
        return;
      }

      setExpert(foundExpert);

      // Find session type
      const foundSession = foundExpert.sessionTypes.find(st => st.id === sessionTypeId);
      
      if (!foundSession) {
        // Default to first session type
        setSelectedSessionType(foundExpert.sessionTypes[0]);
      } else {
        setSelectedSessionType(foundSession);
      }
    } catch (err) {
      console.error('Error fetching expert:', err);
      setError('Gagal memuat data booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingComplete = (bookingData: Booking) => {
    setBooking(bookingData);
  };

  const handleBackToExpert = () => {
    navigate(`/expert/${expertId}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !expert || !selectedSessionType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Data tidak ditemukan'}
          </h2>
          <button
            onClick={handleBackToExpert}
            className="text-purple-600 hover:underline"
          >
            Kembali ke Expert Detail
          </button>
        </div>
      </div>
    );
  }

  // Show success page if booking is complete
  if (booking) {
    return (
      <BookingSuccess 
        booking={booking} 
        onBackToHome={handleBackToHome}
      />
    );
  }

  // Show booking flow
  return (
    <BookingFlow
      expert={expert}
      sessionType={selectedSessionType}
      onBookingComplete={handleBookingComplete}
      onBack={handleBackToExpert}
    />
  );
}