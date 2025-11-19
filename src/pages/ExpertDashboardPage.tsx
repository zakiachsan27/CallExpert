import { useNavigate } from 'react-router-dom';
import { ExpertDashboardWithTabs } from '../components/ExpertDashboardWithTabs';
import { useAuth } from '../contexts/AuthContext';

export function ExpertDashboardPage() {
  const navigate = useNavigate();
  const { expertAccessToken, logoutExpert } = useAuth();

  const handleLogout = () => {
    logoutExpert();
    navigate('/expert/login', { replace: true });
  };

  return (
    <ExpertDashboardWithTabs 
      accessToken={expertAccessToken || 'demo-expert-token'} 
      expertId="demo-expert-id"
      onBack={() => navigate('/')} 
      onLogout={handleLogout}
    />
  );
}