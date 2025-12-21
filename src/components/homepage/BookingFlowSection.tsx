import { Search, Calendar, CreditCard, MessageCircle } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: Search,
    title: 'Pilih Expert',
    description: 'Temukan expert yang sesuai dengan kebutuhan Anda',
  },
  {
    number: 2,
    icon: Calendar,
    title: 'Pilih Jadwal',
    description: 'Pilih tanggal dan waktu yang tersedia',
  },
  {
    number: 3,
    icon: CreditCard,
    title: 'Bayar',
    description: 'Pembayaran aman via Midtrans',
  },
  {
    number: 4,
    icon: MessageCircle,
    title: 'Mulai Konsultasi',
    description: 'Sesi dimulai sesuai jadwal',
  },
];

export function BookingFlowSection() {
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Cara Booking Konsultasi
          </h2>
          <p className="text-gray-600">
            Proses booking yang mudah dan cepat
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex-1 flex flex-col md:flex-row items-center gap-4">
              <div className="flex flex-col items-center text-center md:flex-1">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-brand-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-brand-600">{step.number}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:block w-12 h-0.5 bg-gray-300 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
