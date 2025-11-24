import { useState, useEffect } from 'react';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import type { Expert, Booking, SessionType } from '../App';
import { createBooking } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

type BookingSectionProps = {
  expert: Expert;
  selectedSessionType: SessionType;
  onBookingComplete: (booking: Booking) => void;
};

export function BookingSection({ expert, selectedSessionType, onBookingComplete }: BookingSectionProps) {
  const { userId } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Clear error when userId becomes available
  useEffect(() => {
    if (userId && error === 'Anda harus login terlebih dahulu') {
      setError('');
    }
  }, [userId, error]);

  // Generate available time slots (simplified - all weekdays 9-17)
  const getAvailableSlots = () => {
    if (!selectedDate) return [];
    
    // For offline events, show different time slots
    if (selectedSessionType.category === 'offline-event') {
      return ['10:00', '13:00', '15:00', '17:00'];
    }
    
    // For online sessions
    return [
      '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
    ];
  };

  const availableSlots = getAvailableSlots();

  // Check if day is available (weekdays only for now, can be customized)
  const isDayAvailable = (date: Date) => {
    const day = date.getDay();
    // Disable Sundays (0) and past dates
    return day !== 0 && date >= new Date();
  };

  const handleBooking = async () => {
    // Validate user is logged in
    if (!userId) {
      setError('Anda harus login terlebih dahulu');
      return;
    }

    // Validate form fields
    if (!selectedDate) {
      setError('Mohon pilih tanggal booking');
      return;
    }

    if (!selectedTime) {
      setError('Mohon pilih waktu booking');
      return;
    }

    if (!topic.trim()) {
      setError('Mohon isi topik diskusi');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const totalPrice = selectedSessionType.price;

      // Format date as YYYY-MM-DD
      const bookingDate = selectedDate.toISOString().split('T')[0];

      // Generate unique order_id
      const timestamp = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orderId = `ORDER-${timestamp}-${randomStr}`;

      // Create booking in database
      const { id: bookingId, order_id } = await createBooking({
        user_id: userId,
        expert_id: expert.id,
        session_type_id: selectedSessionType.id,
        booking_date: bookingDate,
        booking_time: selectedTime,
        topic: topic.trim(),
        notes: topic.trim(),
        total_price: totalPrice,
        order_id: orderId,
        meeting_link: selectedSessionType.category === 'online-video' 
          ? `https://meet.google.com/${Math.random().toString(36).substring(7)}`
          : null
      });

      // Create booking object for UI
      const booking: Booking = {
        id: bookingId,
        orderId: order_id,
        expert,
        sessionType: selectedSessionType,
        date: selectedDate,
        time: selectedTime,
        topic: topic.trim(),
        notes: topic.trim(),
        totalPrice,
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div>
      <h3 className="mb-4">Pilih Jadwal</h3>

      {/* Date and Time Selection - Stacked Vertically for better desktop view */}
      <div className="mb-6 space-y-4">
        {/* Calendar */}
        <div>
          <Label className="mb-3 block">Pilih Tanggal</Label>
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedTime(null); // Reset time when date changes
            }}
            disabled={(date) => date < new Date() || !isDayAvailable(date)}
            className="rounded-md border w-full"
          />
        </div>

        {/* Time Slots */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Pilih Waktu</Label>
            {/* Button "Sekarang" for chat sessions */}
            {selectedSessionType.category === 'online-chat' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const now = new Date();
                  setSelectedDate(now);
                  const hours = now.getHours().toString().padStart(2, '0');
                  const minutes = now.getMinutes().toString().padStart(2, '0');
                  setSelectedTime(`${hours}:${minutes}`);
                }}
                className="text-xs"
              >
                <Clock className="w-3 h-3 mr-1" />
                Sekarang
              </Button>
            )}
          </div>
          {selectedDate ? (
            <>
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? 'default' : 'outline'}
                      onClick={() => setSelectedTime(slot)}
                      className="w-full"
                    >
                      {slot}
                    </Button>
                  ))}
                  {/* Show current time if "Sekarang" was clicked */}
                  {selectedTime && !availableSlots.includes(selectedTime) && (
                    <Button
                      variant="default"
                      className="w-full col-span-2"
                      disabled
                    >
                      {selectedTime} (Sekarang)
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-gray-500">Tidak ada slot tersedia di hari ini</p>
                </div>
              )}
            </>
          ) : (
            <div className="border rounded-lg p-8 flex items-center justify-center">
              <p className="text-gray-500 text-center">Pilih tanggal terlebih dahulu</p>
            </div>
          )}
        </div>
      </div>

      {/* Topic Input */}
      {selectedDate && selectedTime && (
        <div className="mb-6">
          <Label htmlFor="topic" className="mb-3 block">
            Topik yang Ingin Dibahas <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="topic"
            placeholder="Jelaskan topik atau masalah yang ingin Anda diskusikan dengan expert. Informasi ini akan membantu expert untuk mempersiapkan sesi dengan lebih baik."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            className="w-full"
          />
          <p className="text-gray-500 mt-2">
            Expert akan me-review topik Anda dan dapat menerima atau menolak booking ini.
          </p>
        </div>
      )}

      {/* Booking Summary */}
      {selectedDate && selectedTime && topic.trim() && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-gray-600 mb-2">Ringkasan Booking:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Sesi:</span>
              <span>{selectedSessionType.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>
                {selectedDate.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{selectedTime} WIB ({selectedSessionType.duration} menit)</span>
            </div>
            <div className="flex items-start gap-2 mt-2">
              <span className="text-gray-600">Topik:</span>
              <span className="flex-1">{topic}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span>Total:</span>
              <span className="text-green-600">{formatPrice(selectedSessionType.price)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Book Button */}
      <Button
        className="w-full"
        disabled={!selectedDate || !selectedTime || !topic.trim() || isSubmitting}
        onClick={handleBooking}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Memproses...
          </>
        ) : (
          'Lanjutkan ke Pembayaran'
        )}
      </Button>
    </div>
  );
}