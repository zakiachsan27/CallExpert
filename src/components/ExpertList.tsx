import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { ExpertCard } from './ExpertCard';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Skeleton } from './ui/skeleton';
import type { Expert } from '../App';
import { getExperts } from '../services/database';

type ExpertListProps = {
  onExpertClick: (expertId: string) => void;
  initialCategory?: string;
  initialSearch?: string;
};

export function ExpertList({
  onExpertClick,
  initialCategory,
  initialSearch
}: ExpertListProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedSessionTypes, setSelectedSessionTypes] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'online' | 'offline'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch experts from database
  useEffect(() => {
    fetchExperts();
  }, []);

  // Handle initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setSelectedExpertise([initialCategory]);
    }
  }, [initialCategory]);

  // Handle initialSearch changes
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const fetchExperts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getExperts();
      setExperts(data);
    } catch (err) {
      console.error('Error fetching experts:', err);
      setError('Gagal memuat daftar expert. Silakan refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get all unique expertise
  const allExpertise = Array.from(
    new Set(experts.flatMap(expert => expert.expertise))
  );

  // Filter experts
  const filteredExperts = experts.filter(expert => {
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
    <div className="min-h-screen bg-white">
      {/* Hero Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Title Section - Centered like homepage */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold italic text-slate-900 mb-3">
              Temukan Expert Terbaik
            </h1>
            <p className="text-gray-500 text-lg">
              Konsultasi dengan para profesional berpengalaman di bidangnya
            </p>
          </div>

          {/* Search Bar - Styled like homepage */}
          <div className="max-w-2xl mx-auto">
            <div className="relative shadow-xl shadow-brand-100 rounded-full group">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-500 transition" />
              <Input
                placeholder="Cari nama, role, atau keahlian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-32 h-14 text-base rounded-full border-gray-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 shadow-sm transition"
              />
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 gap-2 h-10 px-4 rounded-full border-gray-200 text-gray-600 hover:text-brand-600 hover:border-brand-200 bg-white"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                    {activeFilterCount > 0 && (
                      <Badge className="ml-0.5 px-1.5 min-w-[20px] h-5 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold italic">Filter Expert</DialogTitle>
                    <DialogDescription>
                      Sesuaikan filter berikut untuk menemukan expert yang tepat.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Availability Filter */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Status Ketersediaan</h4>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedAvailability === 'all' ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => setSelectedAvailability('all')}
                        >
                          Semua
                        </Button>
                        <Button
                          variant={selectedAvailability === 'online' ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => setSelectedAvailability('online')}
                        >
                          Online
                        </Button>
                        <Button
                          variant={selectedAvailability === 'offline' ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => setSelectedAvailability('offline')}
                        >
                          Offline
                        </Button>
                      </div>
                    </div>

                    {/* Session Type Filter */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Tipe Sesi</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'online-chat', label: 'Chat' },
                          { value: 'online-video', label: 'Video Call' },
                          { value: 'online-event', label: 'Online Event' },
                          { value: 'offline-event', label: 'Offline Event' }
                        ].map(type => (
                          <Button
                            key={type.value}
                            variant={selectedSessionTypes.includes(type.value) ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-full"
                            onClick={() => toggleSessionType(type.value)}
                          >
                            {type.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Expertise Filter */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Keahlian</h4>
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                        {allExpertise.map(skill => (
                          <Button
                            key={skill}
                            variant={selectedExpertise.includes(skill) ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-full"
                            onClick={() => toggleExpertise(skill)}
                          >
                            {skill}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={clearAllFilters}
                      >
                        Reset
                      </Button>
                      <Button
                        className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-700"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        Terapkan
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {selectedAvailability !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 text-sm h-8 px-4 bg-brand-50 text-brand-700 border border-brand-100 rounded-full">
                  {selectedAvailability === 'online' ? 'Online' : 'Offline'}
                  <button
                    onClick={() => setSelectedAvailability('all')}
                    className="ml-1 hover:text-red-600 font-bold"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedSessionTypes.map(type => (
                <Badge key={type} variant="secondary" className="gap-1.5 text-sm h-8 px-4 bg-brand-50 text-brand-700 border border-brand-100 rounded-full">
                  {type === 'online-chat' && 'Chat'}
                  {type === 'online-video' && 'Video'}
                  {type === 'online-event' && 'Event'}
                  {type === 'offline-event' && 'Offline'}
                  <button
                    onClick={() => toggleSessionType(type)}
                    className="ml-1 hover:text-red-600 font-bold"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {selectedExpertise.map(skill => (
                <Badge key={skill} variant="secondary" className="gap-1.5 text-sm h-8 px-4 bg-brand-50 text-brand-700 border border-brand-100 rounded-full">
                  {skill}
                  <button
                    onClick={() => toggleExpertise(skill)}
                    className="ml-1 hover:text-red-600 font-bold"
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
      <div className="bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results count */}
          {!isLoading && !error && (
            <p className="text-sm text-gray-500 mb-6 text-center">
              Menampilkan <span className="font-semibold text-slate-900">{filteredExperts.length}</span> expert
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-3xl p-6 space-y-4 border border-gray-100 shadow-lg shadow-gray-100">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-[72px] w-[72px] rounded-2xl" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                  <div className="flex justify-between pt-5 border-t border-gray-100">
                    <Skeleton className="h-12 w-24" />
                    <Skeleton className="h-10 w-28 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-red-600 mb-2 font-bold text-lg">Terjadi Kesalahan</p>
              <p className="text-gray-500 mb-6">{error}</p>
              <Button onClick={fetchExperts} className="bg-brand-600 hover:bg-brand-700 rounded-xl px-8 py-3 h-auto font-bold shadow-lg shadow-brand-200">
                Coba Lagi
              </Button>
            </div>
          ) : filteredExperts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperts.map(expert => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  onClick={() => onExpertClick(expert.slug || expert.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-slate-900 mb-2 font-bold text-lg">Tidak ada expert ditemukan</p>
              <p className="text-gray-500 mb-6">
                Coba ubah filter atau kata kunci pencarian
              </p>
              <Button onClick={clearAllFilters} variant="outline" className="rounded-xl px-8 py-3 h-auto font-bold border-gray-200 hover:border-brand-600 hover:text-brand-600">
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}