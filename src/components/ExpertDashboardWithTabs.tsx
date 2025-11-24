import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ExpertTransactions } from './ExpertTransactions';
import { ExpertDashboard } from './ExpertDashboard';
import {
  LogOut,
  User,
  Video,
  Receipt
} from 'lucide-react';

type ExpertDashboardWithTabsProps = {
  accessToken: string;
  expertId: string;
  onBack: () => void;
  onLogout?: () => void;
};

export function ExpertDashboardWithTabs({ accessToken, expertId, onBack, onLogout }: ExpertDashboardWithTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Get active tab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/layanan')) return 'services';
    if (path.includes('/transaksi')) return 'transactions';
    return 'profile';
  };

  const activeTab = getActiveTabFromPath();

  const handleTabChange = (value: string) => {
    const paths = {
      profile: '/expert/dashboard',
      services: '/expert/dashboard/layanan',
      transactions: '/expert/dashboard/transaksi'
    };
    navigate(paths[value as keyof typeof paths] || '/expert/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h2>Dashboard Expert</h2>
            {onLogout && (
              <Button variant="outline" onClick={onLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4 lg:inline hidden" />
              <span>Profil</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Video className="w-4 h-4 lg:inline hidden" />
              <span>Layanan</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <Receipt className="w-4 h-4 lg:inline hidden" />
              <span>Transaksi</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <ExpertDashboard
              accessToken={accessToken}
              expertId={expertId}
              onBack={onBack}
              hideHeaderAndNav={true}
              showOnlyServices={false}
            />
          </TabsContent>

          <TabsContent value="services" className="mt-0">
            <ExpertDashboard
              accessToken={accessToken}
              expertId={expertId}
              onBack={onBack}
              hideHeaderAndNav={true}
              showOnlyServices={true}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <ExpertTransactions accessToken={accessToken} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}