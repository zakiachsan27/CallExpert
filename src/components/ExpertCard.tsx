import { Star, Briefcase, Award } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import type { Expert } from '../App';

type ExpertCardProps = {
  expert: Expert;
  onClick: () => void;
};

export function ExpertCard({ expert, onClick }: ExpertCardProps) {
  const lowestPrice = Math.min(...expert.sessionTypes.map(s => s.price));
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative">
        {/* Availability Badge */}
        <div className="absolute top-3 right-3 z-10">
          {expert.availability === 'online' ? (
            <Badge className="bg-green-500 hover:bg-green-600">
              <div className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse"></div>
              Online
            </Badge>
          ) : (
            <Badge variant="secondary">
              Offline
            </Badge>
          )}
        </div>
        
        {/* Avatar */}
        <div className="p-6 pb-3">
          <img
            src={expert.avatar}
            alt={expert.name}
            className="w-20 h-20 rounded-full object-cover mx-auto mb-4 group-hover:scale-105 transition-transform"
          />
          
          <div className="text-center mb-3">
            <h3 className="mb-1">{expert.name}</h3>
            <p className="text-gray-600 mb-1">{expert.role}</p>
            <p className="text-gray-500">{expert.company}</p>
          </div>

          {/* Location */}
          <div className="text-center mb-3">
            <p className="text-gray-500">📍 {expert.location.city}, {expert.location.country}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-center gap-1 mb-4">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{expert.rating}</span>
            <span className="text-gray-500">({expert.reviewCount} reviews)</span>
          </div>

          {/* Expertise Tags */}
          <div className="flex flex-wrap gap-1.5 justify-center mb-4">
            {expert.expertise.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
            {expert.expertise.length > 3 && (
              <Badge variant="secondary">+{expert.expertise.length - 3}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Briefcase className="w-4 h-4" />
            <span>{expert.experience}+ years</span>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Mulai dari</p>
            <p className="text-blue-600">{formatPrice(lowestPrice)}</p>
          </div>
        </div>
        
        {/* Session Types Available */}
        <div className="mt-3 flex flex-wrap gap-1">
          {expert.sessionTypes.some(s => s.category === 'online-chat') && (
            <Badge variant="outline" className="text-xs">💬 Chat</Badge>
          )}
          {expert.sessionTypes.some(s => s.category === 'online-video') && (
            <Badge variant="outline" className="text-xs">📹 Google Meet</Badge>
          )}
          {expert.sessionTypes.some(s => s.category === 'online-event') && (
            <Badge variant="outline" className="text-xs">🎯 Event</Badge>
          )}
          {expert.sessionTypes.some(s => s.category === 'offline-event') && (
            <Badge variant="outline" className="text-xs">☕ Offline</Badge>
          )}
        </div>
      </div>
    </Card>
  );
}