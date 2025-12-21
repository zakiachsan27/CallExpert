import { ExpertCard } from '../ExpertCard';
import { Button } from '../ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { ArrowRight } from 'lucide-react';
import type { Expert } from '../../App';

type FeaturedExpertsSectionProps = {
  experts: Expert[];
  onExpertClick: (slugOrId: string) => void;
  onViewAll: () => void;
};

export function FeaturedExpertsSection({ experts, onExpertClick, onViewAll }: FeaturedExpertsSectionProps) {
  if (experts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Temukan Expert Terbaik
          </h2>
          <p className="text-gray-600">
            Expert pilihan dengan rating tertinggi dan pengalaman terbaik
          </p>
        </div>

        <div className="relative px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {experts.map((expert) => (
                <CarouselItem key={expert.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <ExpertCard
                      expert={expert}
                      onClick={() => onExpertClick(expert.slug || expert.id)}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        <div className="text-center mt-8">
          <Button
            size="lg"
            className="bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 transition"
            onClick={onViewAll}
          >
            Lihat Semua Expert
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
