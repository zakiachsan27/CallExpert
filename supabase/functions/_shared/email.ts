import { Resend } from 'https://esm.sh/resend@2.0.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_aTn4KwMG_HTfHs5YtjvVp44rvJK7NTbT3';
const FROM_EMAIL = 'noreply@mentorinaja.com';
const REPLY_TO_EMAIL = 'zakiachsan27@gmail.com';

const resend = new Resend(RESEND_API_KEY);

export interface BookingDetails {
  bookingId: string;
  orderId: string;
  menteeName: string;
  menteeEmail: string;
  mentorName: string;
  mentorEmail: string;
  sessionType: string;
  duration: number;
  bookingDate: string;
  bookingTime: string;
  amount: number;
  meetingLink?: string;
}

// Email template untuk Mentee (Receipt)
function getMenteeEmailTemplate(data: BookingDetails): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pembayaran Berhasil - MentorinAja</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .detail-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-row:last-child { border-bottom: none; }
    .meeting-link { background: #EEF2FF; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .meeting-link a { color: #4F46E5; font-weight: bold; text-decoration: none; }
    .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Pembayaran Berhasil!</h1>
      <p>Booking Anda telah dikonfirmasi</p>
    </div>
    <div class="content">
      <p>Halo <strong>${data.menteeName}</strong>,</p>
      <p>Terima kasih atas pembayaran Anda. Booking sesi mentoring telah berhasil dikonfirmasi.</p>
      
      <div class="detail-box">
        <h3>Detail Booking</h3>
        <div class="detail-row">
          <span>Order ID:</span>
          <strong>${data.orderId}</strong>
        </div>
        <div class="detail-row">
          <span>Expert:</span>
          <strong>${data.mentorName}</strong>
        </div>
        <div class="detail-row">
          <span>Jenis Sesi:</span>
          <strong>${data.sessionType}</strong>
        </div>
        <div class="detail-row">
          <span>Durasi:</span>
          <strong>${data.duration} menit</strong>
        </div>
        <div class="detail-row">
          <span>Tanggal:</span>
          <strong>${data.bookingDate}</strong>
        </div>
        <div class="detail-row">
          <span>Waktu:</span>
          <strong>${data.bookingTime}</strong>
        </div>
        <div class="detail-row">
          <span>Total Bayar:</span>
          <strong>Rp ${data.amount.toLocaleString('id-ID')}</strong>
        </div>
      </div>

      ${data.meetingLink ? `
      <div class="meeting-link">
        <h3>Link Meeting</h3>
        <p><a href="${data.meetingLink}" target="_blank">${data.meetingLink}</a></p>
        <p style="font-size: 12px; color: #666;">Klik link di atas untuk bergabung ke sesi mentoring</p>
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="https://mentorinaja.id/booking/${data.bookingId}" class="button">Lihat Detail Booking</a>
      </div>

      <p>Jika ada pertanyaan, silakan hubungi kami melalui email atau WhatsApp.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 MentorinAja. All rights reserved.</p>
      <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Email template untuk Mentor (Notifikasi)
function getMentorEmailTemplate(data: BookingDetails): string {
  const platformFee = data.amount * 0.2; // 20% platform fee
  const mentorEarnings = data.amount - platformFee;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Baru - MentorinAja</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .detail-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-row:last-child { border-bottom: none; }
    .earnings-box { background: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
    .meeting-link { background: #EEF2FF; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .meeting-link a { color: #4F46E5; font-weight: bold; text-decoration: none; }
    .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Baru Masuk!</h1>
      <p>Ada sesi mentoring baru yang menunggu Anda</p>
    </div>
    <div class="content">
      <p>Halo <strong>${data.mentorName}</strong>,</p>
      <p>Selamat! Ada booking baru dari mentee. Berikut detailnya:</p>
      
      <div class="detail-box">
        <h3>Info Mentee</h3>
        <div class="detail-row">
          <span>Nama:</span>
          <strong>${data.menteeName}</strong>
        </div>
        <div class="detail-row">
          <span>Email:</span>
          <strong>${data.menteeEmail}</strong>
        </div>
      </div>

      <div class="detail-box">
        <h3>Detail Sesi</h3>
        <div class="detail-row">
          <span>Jenis Sesi:</span>
          <strong>${data.sessionType}</strong>
        </div>
        <div class="detail-row">
          <span>Durasi:</span>
          <strong>${data.duration} menit</strong>
        </div>
        <div class="detail-row">
          <span>Tanggal:</span>
          <strong>${data.bookingDate}</strong>
        </div>
        <div class="detail-row">
          <span>Waktu:</span>
          <strong>${data.bookingTime}</strong>
        </div>
      </div>

      <div class="earnings-box">
        <h3>Pendapatan Anda</h3>
        <div class="detail-row">
          <span>Total Booking:</span>
          <span>Rp ${data.amount.toLocaleString('id-ID')}</span>
        </div>
        <div class="detail-row">
          <span>Biaya Platform (20%):</span>
          <span>- Rp ${platformFee.toLocaleString('id-ID')}</span>
        </div>
        <div class="detail-row" style="font-size: 18px; color: #10B981;">
          <span><strong>Total Diterima:</strong></span>
          <strong>Rp ${mentorEarnings.toLocaleString('id-ID')}</strong>
        </div>
      </div>

      ${data.meetingLink ? `
      <div class="meeting-link">
        <h3>Link Meeting</h3>
        <p><a href="${data.meetingLink}" target="_blank">${data.meetingLink}</a></p>
        <p style="font-size: 12px; color: #666;">Gunakan link ini saat sesi dimulai</p>
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="https://mentorinaja.id/expert/dashboard" class="button">Lihat Jadwal</a>
      </div>

      <p>Terima kasih telah menjadi bagian dari MentorinAja!</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 MentorinAja. All rights reserved.</p>
      <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Kirim email ke Mentee
export async function sendMenteeReceipt(data: BookingDetails): Promise<void> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.menteeEmail,
      reply_to: REPLY_TO_EMAIL,
      subject: `Pembayaran Berhasil - Booking #${data.orderId}`,
      html: getMenteeEmailTemplate(data),
    });

    console.log('Mentee email sent:', result);
  } catch (error) {
    console.error('Failed to send mentee email:', error);
    throw error;
  }
}

// Kirim email ke Mentor
export async function sendMentorNotification(data: BookingDetails): Promise<void> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.mentorEmail,
      reply_to: REPLY_TO_EMAIL,
      subject: `Booking Baru - ${data.menteeName}`,
      html: getMentorEmailTemplate(data),
    });

    console.log('Mentor email sent:', result);
  } catch (error) {
    console.error('Failed to send mentor email:', error);
    throw error;
  }
}
