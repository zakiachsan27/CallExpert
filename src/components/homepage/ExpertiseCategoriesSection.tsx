import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ArrowRight } from 'lucide-react';

type ExpertiseCategoriesSectionProps = {
  categories: Array<[string, number]>;
  onCategoryClick: (category: string) => void;
};

export function ExpertiseCategoriesSection({ categories, onCategoryClick }: ExpertiseCategoriesSectionProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Kategori Keahlian
          </h2>
          <p className="text-gray-600">
            Temukan expert berdasarkan keahlian yang Anda butuhkan
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(([category, count]) => (
            <Card
              key={category}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-brand-600 group"
              onClick={() => onCategoryClick(category)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <h3 className="text-base font-semibold group-hover:text-brand-600 transition-colors">
                    {category}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {count} Expert
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
