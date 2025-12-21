import { useNavigate } from 'react-router-dom';
import { UserTransactionHistory } from '../components/UserTransactionHistory';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function UserTransactionsPage() {
  const navigate = useNavigate();
  const { userAccessToken } = useAuth();

  return (
    <UserTransactionHistory
      onBack={() => navigate('/')}
    />
  );
}
