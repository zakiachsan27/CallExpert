import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExpertDetail } from '../components/ExpertDetail';
import { Loader2 } from 'lucide-react';
import type { Expert } from '../App';
import { getExpertBySlug } from '../services/database';

export function ExpertDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpertDetail();
  }, [slug]);

  const fetchExpertDetail = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!slug) {
        setError('Expert slug tidak valid');
        return;
      }

      // Fetch from database by slug
      const foundExpert = await getExpertBySlug(slug);

      if (!foundExpert) {
        setError('Expert tidak ditemukan');
        return;
      }

      // Debug logging to verify data from database
      console.log('🔍 Expert Data Loaded:', {
        id: foundExpert.id,
        name: foundExpert.name,
        slug: foundExpert.slug,
        sessionTypesCount: foundExpert.sessionTypes?.length || 0,
        digitalProductsCount: foundExpert.digitalProducts?.length || 0,
        sessionTypes: foundExpert.sessionTypes,
        digitalProducts: foundExpert.digitalProducts
      });

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
    // Navigate to booking page with session type using slug
    navigate(`/expert/${slug}/booking`, { state: { sessionTypeId } });
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