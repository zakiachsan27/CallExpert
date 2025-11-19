import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import type { Expert, Booking, SessionType } from '../App';

type BookingSectionProps = {
  expert: Expert;
  selectedSessionType: SessionType;
  onBookingComplete: (booking: Booking) => void;
};

export function BookingSection({ expert, selectedSessionType, onBookingComplete }: BookingSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [topic, setTopic] = useState('');

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

  const handleBooking = () => {
    if (selectedDate && selectedTime && topic.trim()) {
      const totalPrice = selectedSessionType.price + 2000; // price + admin fee
      const booking: Booking = {
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
          <Label className="mb-3 block">Pilih Waktu</Label>
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

      {/* Book Button */}
      <Button
        className="w-full"
        disabled={!selectedDate || !selectedTime || !topic.trim()}
        onClick={handleBooking}
      >
        Lanjutkan ke Pembayaran
      </Button>
    </div>
  );
}