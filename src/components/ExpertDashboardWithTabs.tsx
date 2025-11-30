import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ExpertTransactions } from './ExpertTransactions';
import { ExpertDashboard } from './ExpertDashboard';
import {
  LogOut,
  User,
  Video,
  Receipt,
  Bell,
  DollarSign
} from 'lucide-react';
import { projectId } from '../utils/supabase/info.tsx';

type ExpertDashboardWithTabsProps = {
  accessToken: string;
  expertId: string;
  onBack: () => void;
  onLogout?: () => void;
};

export function ExpertDashboardWithTabs({ accessToken, expertId, onBack, onLogout }: ExpertDashboardWithTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // Get active tab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/profil')) return 'profile';
    if (path.includes('/layanan')) return 'services';
    if (path.includes('/transaksi')) return 'transactions';
    return 'transactions'; // Default to transactions
  };

  const activeTab = getActiveTabFromPath();

  const handleTabChange = (value: string) => {
    const paths = {
      transactions: '/expert/dashboard/transaksi',
      services: '/expert/dashboard/layanan',
      profile: '/expert/dashboard/profil'
    };
    navigate(paths[value as keyof typeof paths] || '/expert/dashboard/transaksi');
  };

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();

    // Check if there are unread notifications from localStorage
    const lastSeenTime = localStorage.getItem('expert_last_seen_notifications');
    if (!lastSeenTime) {
      setHasUnreadNotifications(notifications.length > 0);
    }
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/transactions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();

      // Filter only paid transactions, sort by newest, take 10
      const paidTransactions = (data.transactions || [])
        .filter((t: any) => t.paymentStatus === 'paid')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      setNotifications(paidTransactions);

      // Check for unread notifications
      const lastSeenTime = localStorage.getItem('expert_last_seen_notifications');
      if (lastSeenTime && paidTransactions.length > 0) {
        const lastSeen = new Date(lastSeenTime).getTime();
        const hasNew = paidTransactions.some((t: any) => new Date(t.createdAt).getTime() > lastSeen);
        setHasUnreadNotifications(hasNew);
      } else if (paidTransactions.length > 0) {
        setHasUnreadNotifications(true);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Silent fail - notifications are not critical
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);

    // Mark as read when opening
    if (!showNotifications) {
      setHasUnreadNotifications(false);
      localStorage.setItem('expert_last_seen_notifications', new Date().toISOString());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h2>Dashboard Expert</h2>

            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative notification-container">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenNotifications}
                  className="relative"
                >
                  <Bell className="w-5 h-5" />
                  {hasUnreadNotifications && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                  )}
                </Button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-[700px] bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="font-semibold text-base">Transaksi</h3>
                    </div>

                    <div className="overflow-y-auto" style={{ maxHeight: '330px' }}>
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">Belum ada transaksi baru</p>
                        </div>
                      ) : (
                        <div>
                          {notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                setShowNotifications(false);
                                navigate(`/invoice/${notif.id}`);
                              }}
                              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="font-medium text-sm text-gray-900 line-clamp-1">
                                    {notif.userName}
                                  </p>
                                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                    {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short'
                                    })}
                                  </span>
                                </div>

                                <p className="text-xs text-gray-600">
                                  {notif.itemName || notif.itemCategory?.replace(/-/g, ' ') || 'Sesi'}
                                </p>

                                {notif.type === 'session' && notif.date && (
                                  <p className="text-xs text-gray-500 whitespace-nowrap">
                                    {new Date(notif.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {notif.time && ` • ${notif.time}`}
                                  </p>
                                )}

                                <p className="text-sm text-green-600 font-semibold">
                                  Rp {notif.price.toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {onLogout && (
                <Button variant="outline" onClick={onLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="transactions" className="gap-2">
              <Receipt className="w-4 h-4 lg:inline hidden" />
              <span>Transaksi</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Video className="w-4 h-4 lg:inline hidden" />
              <span>Layanan</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4 lg:inline hidden" />
              <span>Profil</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            {activeTab === 'transactions' && <ExpertTransactions accessToken={accessToken} />}
          </TabsContent>

          <TabsContent value="services" className="mt-0">
            {activeTab === 'services' && (
              <ExpertDashboard
                accessToken={accessToken}
                expertId={expertId}
                onBack={onBack}
                hideHeaderAndNav={true}
                showOnlyServices={true}
              />
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            {activeTab === 'profile' && (
              <ExpertDashboard
                accessToken={accessToken}
                expertId={expertId}
                onBack={onBack}
                hideHeaderAndNav={true}
                showOnlyServices={false}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}