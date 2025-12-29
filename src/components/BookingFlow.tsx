import { useState } from 'react';
import { ArrowLeft, Star, Clock, MessageCircle, Video, Users, MapPinned, Loader2, ChevronDown, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import type { Expert, SessionType, Booking } from '../App';
import { createBooking } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

type BookingFlowProps = {
  expert: Expert;
  sessionType: SessionType;
  onBookingComplete: (booking: Booking) => void;
  onBack: () => void;
};

export function BookingFlow({ expert, sessionType, onBookingComplete, onBack }: BookingFlowProps) {
  const { userId } = useAuth();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isInstantBooking, setIsInstantBooking] = useState(false);

  // Check if expert is available now
  const expertAvailableNow = expert.availableNow || false;

  // Get days in the current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(selectedMonth);
  const firstDayOfMonth = getFirstDayOfMonth(selectedMonth);
  const today = new Date();

  // Generate available time slots
  const getAvailableSlots = () => {
    if (sessionType.category === 'offline-event') {
      return ['10:00', '13:00', '15:00', '17:00'];
    }
    return ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'];
  };

  const timeSlots = getAvailableSlots();

  // Check if a date is today
  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === selectedMonth.getMonth() &&
      today.getFullYear() === selectedMonth.getFullYear()
    );
  };

  // Check if date is in the past
  const isPastDate = (day: number) => {
    const checkDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return checkDate < todayStart;
  };

  // Check if day is a Sunday (disabled)
  const isSunday = (day: number) => {
    const checkDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    return checkDate.getDay() === 0;
  };

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
        return <MessageCircle className="w-5 h-5" />;
      case 'online-video':
        return <Video className="w-5 h-5" />;
      case 'online-event':
        return <Users className="w-5 h-5" />;
      case 'offline-event':
        return <MapPinned className="w-5 h-5" />;
    }
  };

  const getCategoryLabel = () => {
    switch (sessionType.category) {
      case 'online-chat':
        return 'Chat';
      case 'online-video':
        return 'GMeet';
      case 'online-event':
        return 'Event';
      case 'offline-event':
        return 'Offline';
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];

  const handleBooking = async () => {
    if (!userId) {
      setError('Anda harus login terlebih dahulu');
      return;
    }

    // For instant booking, skip date/time validation
    if (!isInstantBooking) {
      if (!selectedDate) {
        setError('Mohon pilih tanggal booking');
        return;
      }

      if (!selectedTime) {
        setError('Mohon pilih waktu booking');
        return;
      }
    }

    if (!topic.trim()) {
      setError('Mohon isi topik diskusi');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // For instant booking, use current date and time
      let bookingDate: Date;
      let bookingDateStr: string;
      let bookingTime: string;

      if (isInstantBooking) {
        bookingDate = new Date();
        bookingDateStr = bookingDate.toISOString().split('T')[0];
        bookingTime = bookingDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else {
        bookingDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), selectedDate!);
        bookingDateStr = bookingDate.toISOString().split('T')[0];
        bookingTime = selectedTime!;
      }

      const timestamp = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orderId = `ORDER-${timestamp}-${randomStr}`;

      const { id: bookingId, order_id } = await createBooking({
        user_id: userId,
        expert_id: expert.id,
        session_type_id: sessionType.id,
        booking_date: bookingDateStr,
        booking_time: bookingTime,
        topic: topic.trim(),
        notes: topic.trim(),
        total_price: sessionType.price,
        order_id: orderId,
        meeting_link: sessionType.category === 'online-video'
          ? `https://meet.google.com/${Math.random().toString(36).substring(7)}`
          : null,
        is_instant: isInstantBooking
      });

      const booking: Booking = {
        id: bookingId,
        orderId: order_id,
        expert,
        sessionType: sessionType,
        date: bookingDate,
        time: bookingTime,
        topic: topic.trim(),
        notes: topic.trim(),
        totalPrice: sessionType.price,
        meetingLink: `https://meet.google.com/${Math.random().toString(36).substring(7)}`,
        status: 'pending',
        paymentStatus: 'waiting'
      };

      onBookingComplete(booking);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Gagal membuat booking. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Allow proceeding if instant booking with topic, or regular booking with date/time/topic
  const canProceed = (isInstantBooking && topic.trim()) || (selectedDate && selectedTime && topic.trim());

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-32">
      {/* --- HEADER --- */}
      <nav className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sticky top-0 z-50">
        <div className="max-w-xl mx-auto w-full flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-lg text-slate-900">Konfirmasi Booking</span>
        </div>
      </nav>

      <main className="max-w-xl mx-auto py-6 px-4 space-y-5">

        {/* --- CARD 1: INFO EXPERT --- */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <img
            src={expert.avatar}
            alt={expert.name}
            className="w-14 h-14 rounded-full border-2 border-brand-50 bg-slate-50 object-cover"
          />
          <div>
            <h2 className="font-bold text-slate-900 text-base">{expert.name}</h2>
            <p className="text-xs text-gray-500 mb-1">{expert.role} @ {expert.company}</p>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-slate-700">{expert.rating}</span>
              <span className="text-xs text-gray-400">• {expert.experience}+ Tahun Pengalaman</span>
            </div>
          </div>
        </div>

        {/* --- CARD 2: DETAIL SESI --- */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          {/* Decoration blur */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>

          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4 relative z-10">Sesi Pilihan</h3>

          <div className="flex justify-between items-start relative z-10">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                {getCategoryIcon()}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{sessionType.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-100">
                    {getCategoryLabel()}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {sessionType.duration} Menit
                  </span>
                </div>
              </div>
            </div>
            {/* HARGA */}
            <div className="text-right">
              <span className="block font-bold text-brand-600 text-xl">{formatPrice(sessionType.price)}</span>
            </div>
          </div>
        </div>

        {/* --- CARD 2.5: KONSULTASI SEKARANG (if expert available) --- */}
        {expertAvailableNow && (
          <div className={`p-5 rounded-2xl border-2 shadow-sm transition-all ${isInstantBooking ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${isInstantBooking ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'}`}>
                <Zap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-base text-slate-900">Konsultasi Sekarang</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    ONLINE
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {expert.name} tersedia untuk konsultasi langsung saat ini. Mulai sesi setelah pembayaran dikonfirmasi.
                </p>
                <button
                  onClick={() => {
                    setIsInstantBooking(!isInstantBooking);
                    if (!isInstantBooking) {
                      // Clear scheduled booking selections when switching to instant
                      setSelectedDate(null);
                      setSelectedTime(null);
                    }
                  }}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    isInstantBooking
                      ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                      : 'bg-green-50 text-green-700 border-2 border-green-300 hover:bg-green-100'
                  }`}
                >
                  {isInstantBooking ? '✓ Konsultasi Sekarang Dipilih' : 'Pilih Konsultasi Sekarang'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- CARD 3: PILIH JADWAL --- */}
        <div className={`bg-white p-5 rounded-2xl border shadow-sm transition-all ${isInstantBooking ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-sm text-slate-900">
              {expertAvailableNow ? 'Atau Pilih Jadwal Lain' : 'Pilih Tanggal & Waktu'}
            </h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <span>{monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          </div>

          {/* CALENDAR GRID */}
          <div className="mb-6">
            <div className="grid grid-cols-7 text-center mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-[10px] font-bold text-gray-400 uppercase">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
              {/* Empty slots for padding */}
              {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`}></div>)}

              {/* Render Dates */}
              {[...Array(daysInMonth)].map((_, i) => {
                const date = i + 1;
                const isSelected = date === selectedDate;
                const isTodayDate = isToday(date);
                const isPast = isPastDate(date);
                const isDisabled = isPast || isSunday(date);

                return (
                  <button
                    key={date}
                    onClick={() => !isDisabled && setSelectedDate(date)}
                    disabled={isDisabled}
                    className={`
                      h-9 w-full rounded-lg text-xs flex items-center justify-center transition relative
                      ${isSelected
                        ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-200'
                        : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-slate-700 hover:bg-brand-50 hover:text-brand-600'}
                      ${isTodayDate && !isSelected ? 'text-brand-600 font-bold border border-brand-200' : ''}
                    `}
                  >
                    {date}
                    {isSelected && <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIME SLOTS */}
          <div className="border-t border-gray-100 pt-5">
            <h4 className="font-bold text-xs text-gray-400 mb-3 uppercase tracking-wider">Waktu Tersedia</h4>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`
                    py-2.5 rounded-xl text-sm font-medium border transition
                    ${selectedTime === time
                      ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-200 font-bold'
                      : 'border-gray-200 text-slate-600 bg-white hover:border-brand-300 hover:text-brand-600'}
                  `}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- CARD 4: TOPIK DISKUSI --- */}
        {(isInstantBooking || (selectedDate && selectedTime)) && (
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <Label htmlFor="topic" className="font-bold text-sm text-slate-900 mb-3 block">
              Topik Diskusi <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="topic"
              placeholder="Jelaskan topik atau masalah yang ingin Anda diskusikan..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              className="w-full border-gray-200 focus:border-brand-400 focus:ring-brand-100 rounded-xl"
            />
            <p className="text-xs text-gray-400 mt-2">
              {isInstantBooking
                ? 'Jelaskan apa yang ingin Anda diskusikan dalam konsultasi langsung ini.'
                : 'Expert akan me-review topik Anda sebelum menerima booking.'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

      </main>

      {/* --- STICKY FOOTER --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-safe shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Total Pembayaran</span>
            <span className="font-bold text-xl text-brand-600">{formatPrice(sessionType.price)}</span>
          </div>
          <Button
            onClick={handleBooking}
            disabled={!canProceed || isSubmitting}
            className={`text-white font-bold py-3 px-8 rounded-xl active:scale-95 transition shadow-lg flex-1 max-w-xs text-sm h-12 ${
              isInstantBooking
                ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : isInstantBooking ? (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Mulai Sekarang
              </>
            ) : (
              'Lanjut Pembayaran'
            )}
          </Button>
        </div>
      </div>

    </div>
  );
}
