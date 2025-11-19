import { useState } from 'react';
import { Search, Filter, Users, ChevronDown, User, Award, Receipt, LogOut, LayoutDashboard } from 'lucide-react';
import { ExpertCard } from './ExpertCard';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import type { Expert } from '../App';
import { mockExperts } from '../lib/mockData';

type ExpertListProps = {
  onExpertClick: (expert: Expert) => void;
  onLoginAsUser?: () => void;
  onLoginAsExpert?: () => void;
  userAccessToken?: string | null;
  expertAccessToken?: string | null;
  onUserHistory?: () => void;
  onExpertDashboard?: () => void;
  onUserLogout?: () => void;
  onExpertLogout?: () => void;
};

export function ExpertList({ 
  onExpertClick, 
  onLoginAsUser, 
  onLoginAsExpert,
  userAccessToken,
  expertAccessToken,
  onUserHistory,
  onExpertDashboard,
  onUserLogout,
  onExpertLogout
}: ExpertListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedSessionTypes, setSelectedSessionTypes] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'online' | 'offline'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get all unique expertise
  const allExpertise = Array.from(
    new Set(mockExperts.flatMap(expert => expert.expertise))
  );

  // Filter experts
  const filteredExperts = mockExperts.filter(expert => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        expert.name.toLowerCase().includes(query) ||
        expert.role.toLowerCase().includes(query) ||
        expert.company.toLowerCase().includes(query) ||
        expert.expertise.some(skill => skill.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }

    // Expertise filter
    if (selectedExpertise.length > 0) {
      const hasExpertise = selectedExpertise.some(skill => 
        expert.expertise.includes(skill)
      );
      if (!hasExpertise) return false;
    }

    // Session type filter
    if (selectedSessionTypes.length > 0) {
      const hasSessionType = selectedSessionTypes.some(type =>
        expert.sessionTypes.some(st => st.category === type)
      );
      if (!hasSessionType) return false;
    }

    // Availability filter
    if (selectedAvailability !== 'all') {
      if (expert.availability !== selectedAvailability) return false;
    }

    return true;
  });

  const toggleExpertise = (skill: string) => {
    setSelectedExpertise(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleSessionType = (type: string) => {
    setSelectedSessionTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearAllFilters = () => {
    setSelectedExpertise([]);
    setSelectedSessionTypes([]);
    setSelectedAvailability('all');
    setSearchQuery('');
  };

  const activeFilterCount = 
    selectedExpertise.length + 
    selectedSessionTypes.length + 
    (selectedAvailability !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Title & Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl">Temukan Expert Terbaik</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">
                Konsultasi dengan para profesional berpengalaman di bidangnya
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{filteredExperts.length} experts</span>
              </div>
              
              {/* If user logged in */}
              {userAccessToken && (
                <>
                  {onUserHistory && (
                    <Button variant="outline" size="sm" onClick={onUserHistory} className="gap-2">
                      <Receipt className="w-4 h-4" />
                      <span className="hidden sm:inline">Riwayat</span>
                    </Button>
                  )}
                  {onUserLogout && (
                    <Button variant="outline" size="sm" onClick={onUserLogout} className="gap-2">
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </Button>
                  )}
                </>
              )}
              
              {/* If expert logged in */}
              {expertAccessToken && (
                <>
                  {/* Expert sudah login, tidak perlu tampilkan button Dashboard dan Logout di homepage */}
                </>
              )}
              
              {/* If not logged in */}
              {!userAccessToken && !expertAccessToken && (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <User className="w-4 h-4" />
                        Login
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Pilih Tipe Login</DialogTitle>
                        <DialogDescription>
                          Silakan pilih apakah Anda ingin login sebagai User atau Expert
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 pt-4">
                        {onLoginAsUser && (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-3 h-auto py-4"
                            onClick={onLoginAsUser}
                          >
                            <User className="w-5 h-5" />
                            <div className="text-left">
                              <div>Login sebagai User</div>
                              <div className="text-sm text-muted-foreground">
                                Untuk booking sesi dengan expert
                              </div>
                            </div>
                          </Button>
                        )}
                        {onLoginAsExpert && (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-3 h-auto py-4"
                            onClick={onLoginAsExpert}
                          >
                            <Award className="w-5 h-5" />
                            <div className="text-left">
                              <div>Login sebagai Expert</div>
                              <div className="text-sm text-muted-foreground">
                                Kelola profil dan layanan Anda
                              </div>
                            </div>
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Cari berdasarkan nama, role, atau keahlian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 relative">
                  <Filter className="w-4 h-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge className="ml-1 px-1.5 min-w-[20px] h-5">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Filter Expert</DialogTitle>
                  <DialogDescription>
                    Sesuaikan filter berikut untuk menemukan expert yang tepat.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Availability Filter */}
                  <div>
                    <h4 className="mb-3">Status Ketersediaan</h4>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedAvailability === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAvailability('all')}
                      >
                        Semua
                      </Button>
                      <Button
                        variant={selectedAvailability === 'online' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAvailability('online')}
                      >
                        🟢 Online
                      </Button>
                      <Button
                        variant={selectedAvailability === 'offline' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAvailability('offline')}
                      >
                        ⚫ Offline
                      </Button>
                    </div>
                  </div>

                  {/* Session Type Filter */}
                  <div>
                    <h4 className="mb-3">Tipe Sesi</h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'online-chat', label: '💬 Chat' },
                        { value: 'online-video', label: '📹 Video Call' },
                        { value: 'online-event', label: '🎯 Online Event' },
                        { value: 'offline-event', label: '☕ Offline Event' }
                      ].map(type => (
                        <Button
                          key={type.value}
                          variant={selectedSessionTypes.includes(type.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleSessionType(type.value)}
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Expertise Filter */}
                  <div>
                    <h4 className="mb-3">Keahlian</h4>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {allExpertise.map(skill => (
                        <Button
                          key={skill}
                          variant={selectedExpertise.includes(skill) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleExpertise(skill)}
                        >
                          {skill}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={clearAllFilters}
                    >
                      Reset
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Terapkan
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedAvailability !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {selectedAvailability === 'online' ? '🟢 Online' : '⚫ Offline'}
                  <button
                    onClick={() => setSelectedAvailability('all')}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedSessionTypes.map(type => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {type === 'online-chat' && '💬 Chat'}
                  {type === 'online-video' && '📹 Video'}
                  {type === 'online-event' && '🎯 Event'}
                  {type === 'offline-event' && '☕ Offline'}
                  <button
                    onClick={() => toggleSessionType(type)}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {selectedExpertise.map(skill => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    onClick={() => toggleExpertise(skill)}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expert Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredExperts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map(expert => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                onClick={() => onExpertClick(expert)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-500 mb-2">Tidak ada expert ditemukan</h3>
            <p className="text-gray-400 mb-4">
              Coba ubah filter atau kata kunci pencarian
            </p>
            <Button onClick={clearAllFilters}>
              Reset Filter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}