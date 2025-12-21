import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ExpertList } from '../components/ExpertList';

export function ExpertsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const searchFromUrl = searchParams.get('search');

  const handleExpertClick = (slugOrId: string) => {
    navigate(`/expert/${slugOrId}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex-1">
        <ExpertList
          onExpertClick={handleExpertClick}
          initialCategory={categoryFromUrl || undefined}
          initialSearch={searchFromUrl || undefined}
        />
      </div>
      <Footer />
    </div>
  );
}
