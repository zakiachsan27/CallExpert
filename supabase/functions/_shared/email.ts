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

// Email template untuk Mentee (Receipt) - Friendly version
function getMenteeEmailTemplate(data: BookingDetails): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Terkonfirmasi - MentorinAja</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.7; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px; }
    .greeting { font-size: 18px; margin-bottom: 16px; }
    .detail-card { background: #F8FAFC; padding: 24px; border-radius: 12px; margin: 24px 0; }
    .detail-card h3 { margin: 0 0 16px 0; color: #4F46E5; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E2E8F0; }
    .detail-item:last-child { border-bottom: none; }
    .detail-label { color: #64748B; }
    .detail-value { font-weight: 600; color: #1E293B; }
    .meeting-box { background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; border: 2px solid #C7D2FE; }
    .meeting-box h3 { margin: 0 0 12px 0; color: #4F46E5; }
    .meeting-box a { color: #4F46E5; font-weight: bold; text-decoration: none; font-size: 14px; word-break: break-all; }
    .meeting-box p { margin: 12px 0 0 0; font-size: 12px; color: #6366F1; }
    .cta-button { display: block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; text-align: center; font-weight: 600; margin: 24px 0; }
    .footer { text-align: center; padding: 24px; color: #94A3B8; font-size: 12px; border-top: 1px solid #E2E8F0; }
    .emoji { font-size: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Yeay, Booking Berhasil! 🎉</h1>
      <p>Sesi mentoring kamu sudah terkonfirmasi</p>
    </div>
    <div class="content">
      <p class="greeting">Halo <strong>${data.menteeName}</strong>! 👋</p>
      <p>Terima kasih sudah booking sesi mentoring di MentorinAja. Berikut detail sesi kamu:</p>
      
      <div class="detail-card">
        <h3>📋 Detail Sesi</h3>
        <div class="detail-item">
          <span class="detail-label">Mentor</span>
          <span class="detail-value">${data.mentorName}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Jenis Sesi</span>
          <span class="detail-value">${data.sessionType}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Durasi</span>
          <span class="detail-value">${data.duration} menit</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Tanggal</span>
          <span class="detail-value">${data.bookingDate}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Waktu</span>
          <span class="detail-value">${data.bookingTime} WIB</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Total Bayar</span>
          <span class="detail-value" style="color: #059669;">Rp ${data.amount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      ${data.meetingLink ? `
      <div class="meeting-box">
        <h3>🔗 Link Google Meet</h3>
        <a href="${data.meetingLink}" target="_blank">${data.meetingLink}</a>
        <p>Klik link di atas saat waktu sesi tiba</p>
      </div>
      ` : ''}

      <a href="https://mentorinaja.com/invoice/${data.orderId}" class="cta-button">Lihat Invoice</a>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${getCalendarUrl(data)}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; background: #F8FAFC; border: 2px solid #E2E8F0; color: #475569; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
          📅 Tambah ke Google Calendar
        </a>
      </div>

      <p style="color: #64748B; font-size: 14px;">Sampai ketemu di sesi mentoring! 🚀</p>
    </div>
    <div class="footer">
      <p><strong>MentorinAja</strong> - Platform Mentoring Indonesia</p>
      <p>Order ID: ${data.orderId}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Email template untuk Mentor (Notifikasi) - Friendly version
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
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.7; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px; }
    .greeting { font-size: 18px; margin-bottom: 16px; }
    .detail-card { background: #F8FAFC; padding: 24px; border-radius: 12px; margin: 24px 0; }
    .detail-card h3 { margin: 0 0 16px 0; color: #059669; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E2E8F0; }
    .detail-item:last-child { border-bottom: none; }
    .detail-label { color: #64748B; }
    .detail-value { font-weight: 600; color: #1E293B; }
    .earnings-card { background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 2px solid #A7F3D0; }
    .earnings-card h3 { margin: 0 0 16px 0; color: #059669; }
    .earnings-total { font-size: 28px; color: #059669; font-weight: bold; margin-top: 12px; }
    .meeting-box { background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; border: 2px solid #C7D2FE; }
    .meeting-box h3 { margin: 0 0 12px 0; color: #4F46E5; }
    .meeting-box a { color: #4F46E5; font-weight: bold; text-decoration: none; font-size: 14px; word-break: break-all; }
    .cta-button { display: block; background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; text-align: center; font-weight: 600; margin: 24px 0; }
    .footer { text-align: center; padding: 24px; color: #94A3B8; font-size: 12px; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ada Booking Baru! 🎉</h1>
      <p>Seseorang ingin belajar dari kamu</p>
    </div>
    <div class="content">
      <p class="greeting">Halo <strong>${data.mentorName}</strong>! 👋</p>
      <p>Kabar baik! Ada mentee yang baru saja booking sesi dengan kamu. Berikut detailnya:</p>
      
      <div class="detail-card">
        <h3>👤 Info Mentee</h3>
        <div class="detail-item">
          <span class="detail-label">Nama</span>
          <span class="detail-value">${data.menteeName}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Email</span>
          <span class="detail-value">${data.menteeEmail}</span>
        </div>
      </div>

      <div class="detail-card">
        <h3>📋 Detail Sesi</h3>
        <div class="detail-item">
          <span class="detail-label">Jenis Sesi</span>
          <span class="detail-value">${data.sessionType}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Durasi</span>
          <span class="detail-value">${data.duration} menit</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Tanggal</span>
          <span class="detail-value">${data.bookingDate}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Waktu</span>
          <span class="detail-value">${data.bookingTime} WIB</span>
        </div>
      </div>

      <div class="earnings-card">
        <h3>💰 Pendapatan Kamu</h3>
        <div class="detail-item">
          <span class="detail-label">Total Booking</span>
          <span class="detail-value">Rp ${data.amount.toLocaleString('id-ID')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Biaya Platform (20%)</span>
          <span class="detail-value">- Rp ${platformFee.toLocaleString('id-ID')}</span>
        </div>
        <div class="earnings-total">Rp ${mentorEarnings.toLocaleString('id-ID')}</div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #059669;">Yang akan kamu terima</p>
      </div>

      ${data.meetingLink ? `
      <div class="meeting-box">
        <h3>🔗 Link Google Meet</h3>
        <a href="${data.meetingLink}" target="_blank">${data.meetingLink}</a>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #6366F1;">Gunakan link ini saat sesi dimulai</p>
      </div>
      ` : ''}

      <a href="https://mentorinaja.com/expert/dashboard" class="cta-button">Lihat Dashboard</a>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${getCalendarUrl(data)}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; background: #F8FAFC; border: 2px solid #E2E8F0; color: #475569; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
          📅 Tambah ke Google Calendar
        </a>
      </div>

      <p style="color: #64748B; font-size: 14px;">Terima kasih sudah jadi bagian dari MentorinAja! 🙏</p>
    </div>
    <div class="footer">
      <p><strong>MentorinAja</strong> - Platform Mentoring Indonesia</p>
      <p>Order ID: ${data.orderId}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Generate Google Calendar URL for email CTA
function getCalendarUrl(data: BookingDetails): string {
  const duration = data.duration || 60;
  const startDate = new Date(`${data.bookingDate}T${data.bookingTime}:00+07:00`);
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
  
  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const title = `MentorinAja: Sesi dengan ${data.mentorName}`;
  const details = `Sesi mentoring MentorinAja

Mentor: ${data.mentorName}
Mentee: ${data.menteeName}
Jenis Sesi: ${data.sessionType}
${data.meetingLink ? `\nLink Google Meet: ${data.meetingLink}` : ''}

---
MentorinAja - Platform Mentoring Indonesia`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: details,
    ctz: 'Asia/Jakarta',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Kirim email ke Mentee
export async function sendMenteeReceipt(data: BookingDetails): Promise<void> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.menteeEmail,
      reply_to: REPLY_TO_EMAIL,
      subject: `[MentorinAja] Booking Berhasil - Sesi dengan ${data.mentorName}`,
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
      subject: `[MentorinAja] Booking Baru dari ${data.menteeName}`,
      html: getMentorEmailTemplate(data),
    });

    console.log('Mentor email sent:', result);
  } catch (error) {
    console.error('Failed to send mentor email:', error);
    throw error;
  }
}
