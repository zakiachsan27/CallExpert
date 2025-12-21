import { ShieldCheck, MessageCircle, CalendarCheck } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

const features = [
  {
    icon: ShieldCheck,
    title: 'Expert Terverifikasi',
    description: 'Semua expert telah melalui proses verifikasi ketat dengan resume dan pengalaman kerja yang tervalidasi',
  },
  {
    icon: MessageCircle,
    title: 'Chat Real-time',
    description: 'Komunikasi langsung dengan expert melalui chat dan video call untuk pengalaman konsultasi terbaik',
  },
  {
    icon: CalendarCheck,
    title: 'Sistem Booking Mudah',
    description: 'Booking sesi konsultasi dengan jadwal fleksibel dan pembayaran aman melalui berbagai metode',
  },
];

export function WhyMentoringAjaSection() {
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Mengapa MentoringAja?
          </h2>
          <p className="text-gray-600">
            Platform konsultasi expert terpercaya dengan berbagai keunggulan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
