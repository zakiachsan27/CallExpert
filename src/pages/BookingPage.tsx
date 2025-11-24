import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookingFlow } from '../components/BookingFlow';
import { BookingSuccess } from '../components/BookingSuccess';
import { Loader2 } from 'lucide-react';
import type { Expert, SessionType, Booking } from '../App';
import { getExpertBySlug } from '../services/database';

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
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
          from: `/expert/${slug}/booking`,
          loginAs: 'user'
        }
      });
      return;
    }

    fetchExpertAndSession();
  }, [slug, sessionTypeId, isUserLoggedIn]);

  const fetchExpertAndSession = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!slug) {
        setError('Expert slug tidak valid');
        return;
      }

      // Fetch expert from database by slug
      const foundExpert = await getExpertBySlug(slug);

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
    // Redirect to invoice page with unique order_id
    if (bookingData.orderId) {
      navigate(`/invoice/${bookingData.orderId}`);
    } else {
      // Fallback: show booking success component (legacy flow)
      setBooking(bookingData);
    }
  };

  const handleBackToExpert = () => {
    navigate(`/expert/${slug}`);
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