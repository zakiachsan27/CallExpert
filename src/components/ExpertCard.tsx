import { memo } from 'react';
import { Star, Briefcase, MapPin } from 'lucide-react';
import type { Expert } from '../App';

type ExpertCardProps = {
  expert: Expert;
  onClick: () => void;
};

export const ExpertCard = memo(function ExpertCard({ expert, onClick }: ExpertCardProps) {
  const lowestPrice = Math.min(...expert.sessionTypes.map(s => s.price));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div
      className="bg-white p-6 rounded-3xl border border-gray-200 text-left hover:shadow-xl hover:-translate-y-1 transition flex flex-col cursor-pointer"
      onClick={onClick}
    >
      {/* Header: Avatar + Rating */}
      <div className="flex justify-between items-start mb-4">
        <img
          src={expert.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${expert.name}`}
          alt={expert.name}
          width={56}
          height={56}
          loading="lazy"
          decoding="async"
          className="w-14 h-14 rounded-2xl bg-gray-100 border object-cover"
        />
        <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100 flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" /> {expert.rating.toFixed(1)}
        </span>
      </div>

      {/* Info */}
      <h3 className="font-bold text-lg italic text-slate-900">{expert.name}</h3>
      <p className="text-sm text-gray-500 mb-4 font-medium">{expert.role} @ {expert.company}</p>

      {/* Location & Experience */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>{expert.location.city}, {expert.location.country}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 font-bold bg-gray-50 w-fit px-2 py-1 rounded">
          <Briefcase className="w-4 h-4" />
          <span>{expert.experience}+ Years Experience</span>
        </div>
      </div>

      {/* Expertise Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {expert.expertise.slice(0, 2).map((skill) => (
          <span key={skill} className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-medium">
            {skill}
          </span>
        ))}
        {expert.expertise.length > 2 && (
          <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-medium">
            +{expert.expertise.length - 2}
          </span>
        )}
      </div>

      {/* Footer: Price + Button */}
      <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400">Mulai dari</p>
          <span className="text-base font-bold text-brand-600">{formatPrice(lowestPrice)}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition"
        >
          Book Now
        </button>
      </div>
    </div>
  );
});