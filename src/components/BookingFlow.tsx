import { BookingSection } from './BookingSection';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Star, Briefcase, MapPin, Clock, Video, MessageCircle, Users, MapPinned } from 'lucide-react';
import type { Expert, SessionType, Booking } from '../App';

type BookingFlowProps = {
  expert: Expert;
  sessionType: SessionType;
  onBookingComplete: (booking: Booking) => void;
  onBack: () => void;
};

export function BookingFlow({ expert, sessionType, onBookingComplete, onBack }: BookingFlowProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getCategoryIcon = () => {
    switch (sessionType.category) {
      case 'online-chat':
        return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'online-video':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'online-event':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'offline-event':
        return <MapPinned className="w-5 h-5 text-blue-600" />;
    }
  };

  const getCategoryLabel = () => {
    switch (sessionType.category) {
      case 'online-chat':
        return '💬 Online Chat';
      case 'online-video':
        return '📹 Google Meet';
      case 'online-event':
        return '🎯 Group Event';
      case 'offline-event':
        return `☕ Offline - ${expert.location.city}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Expert Detail
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Expert Summary */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <img
              src={expert.avatar}
              alt={expert.name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="flex-1">
              <h2 className="mb-1">{expert.name}</h2>
              <p className="text-gray-600 mb-2">{expert.role} at {expert.company}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{expert.rating}</span>
                  <span className="text-gray-500">({expert.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Briefcase className="w-3 h-3" />
                  <span>{expert.experience}+ years</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>{expert.location.city}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Session Type Summary */}
        <Card className="p-6 mb-6">
          <h3 className="mb-4">Sesi yang Dipilih</h3>
          <div className="flex items-start gap-3">
            {getCategoryIcon()}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-gray-900">{sessionType.name}</h4>
                  <Badge variant="outline" className="text-xs mt-1">
                    {getCategoryLabel()}
                  </Badge>
                </div>
                <p className="text-green-600 font-semibold">{formatPrice(sessionType.price)}</p>
              </div>
              <p className="text-gray-600 text-sm mb-2">{sessionType.description}</p>
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>{sessionType.duration} menit</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Booking Form */}
        <Card className="p-6">
          <h3 className="mb-6">Detail Booking</h3>
          <BookingSection
            expert={expert}
            selectedSessionType={sessionType}
            onBookingComplete={onBookingComplete}
          />
        </Card>
      </div>
    </div>
  );
}
