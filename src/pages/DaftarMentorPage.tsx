import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { supabase } from '../services/supabase';
import { ArrowLeft, Loader2, User, Mail, Phone, Briefcase, Link as LinkIcon, Linkedin, CheckCircle, AlertCircle, Instagram, AtSign, Youtube, Music2 } from 'lucide-react';

export function DaftarMentorPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [expertise, setExpertise] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [threadsUrl, setThreadsUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validation
      if (!name || !email || !whatsapp || !expertise) {
        throw new Error('Semua field wajib harus diisi');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Format email tidak valid');
      }

      // WhatsApp validation (Indonesian format)
      const whatsappRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
      if (!whatsappRegex.test(whatsapp.replace(/[\s-]/g, ''))) {
        throw new Error('Format nomor WhatsApp tidak valid');
      }

      // Portfolio link - just accept as text (no URL validation needed)
      // Removed strict URL validation as per user request

      // LinkedIn URL validation (optional)
      if (linkedinUrl && !linkedinUrl.includes('linkedin.com')) {
        throw new Error('Format LinkedIn URL tidak valid');
      }

      // Submit to Supabase with timeout
      const submitPromise = supabase
        .from('mentor_applications')
        .insert({
          name,
          email,
          whatsapp: whatsapp.replace(/[\s-]/g, ''),
          expertise,
          portfolio_link: portfolioLink || null,
          linkedin_url: linkedinUrl || null,
          instagram_url: instagramUrl || null,
          threads_url: threadsUrl || null,
          tiktok_url: tiktokUrl || null,
          youtube_url: youtubeUrl || null,
          status: 'pending'
        });

      // Add timeout of 15 seconds to prevent stuck page
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout. Silakan coba lagi.')), 15000)
      );

      const { error: submitError } = await Promise.race([submitPromise, timeoutPromise]) as any;

      if (submitError) {
        if (submitError.code === '23505') {
          throw new Error('Email sudah terdaftar. Silakan gunakan email lain.');
        }
        throw new Error('Gagal mengirim pendaftaran. Silakan coba lagi.');
      }

      setSuccess(true);
      // Reset form
      setName('');
      setEmail('');
      setWhatsapp('');
      setExpertise('');
      setPortfolioLink('');
      setLinkedinUrl('');
      setInstagramUrl('');
      setThreadsUrl('');
      setTiktokUrl('');
      setYoutubeUrl('');

    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4 py-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none opacity-50"></div>

      <Card className="w-full max-w-lg border-gray-200 shadow-xl shadow-brand-100/50 relative z-10">

        {/* Header Card */}
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-start mb-4">
            <Link
              to="/"
              className="text-xs font-medium text-gray-500 hover:text-brand-600 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold italic text-slate-900 tracking-tight">
            Daftar Sebagai Mentor
          </CardTitle>
          <CardDescription className="text-gray-500">
            Bergabunglah dengan komunitas mentor profesional kami dan bantu orang lain berkembang.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Success Alert */}
          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="ml-2 text-sm font-bold">Pendaftaran Berhasil!</AlertTitle>
              <AlertDescription className="ml-2 text-xs opacity-90">
                Tim kami akan menghubungi Anda melalui WhatsApp dalam 1-3 hari kerja.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="ml-2 text-sm font-bold">Pendaftaran Gagal</AlertTitle>
              <AlertDescription className="ml-2 text-xs opacity-90">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Input Nama */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nama lengkap Anda"
                    className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Input Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@domain.com"
                    className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Input WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700">
                  No. WhatsApp <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                  />
                </div>
                              </div>

              {/* Input Expertise */}
              <div className="space-y-2">
                <Label htmlFor="expertise" className="text-sm font-semibold text-gray-700">
                  Keahlian/Expertise <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="expertise"
                    placeholder="Contoh: Memasak, Menjahit, Badminton, Musik, Bisnis, Fotografi, dll."
                    className="pl-10 pt-2 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100 min-h-[80px] resize-none"
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    required
                  />
                </div>
                              </div>

              {/* Input Portfolio Link (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="portfolio" className="text-sm font-semibold text-gray-700">
                  Link Portofolio <span className="text-gray-400 font-normal">(Opsional)</span>
                </Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="portfolio"
                    type="text"
                    placeholder="drive.google.com/... atau link lainnya"
                    className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                  />
                </div>
                              </div>

              {/* Social Media Section */}
              <div className="space-y-3 pt-2">
                <p className="text-sm font-semibold text-gray-700">Sosial Media <span className="text-gray-400 font-normal">(Opsional)</span></p>

                {/* Instagram */}
                <div className="relative">
                  <Instagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="instagram"
                    type="text"
                    placeholder="instagram.com/username"
                    className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                  />
                </div>

                {/* Threads */}
                <div className="relative">
                  <AtSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="threads"
                    type="text"
                    placeholder="threads.net/@username"
                    className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                    value={threadsUrl}
                    onChange={(e) => setThreadsUrl(e.target.value)}
                  />
                </div>

                {/* TikTok */}
                <div className="relative">
                  <Music2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="tiktok"
                    type="text"
                    placeholder="tiktok.com/@username"
                    className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                  />
                </div>

                {/* YouTube */}
                <div className="relative">
                  <Youtube className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="youtube"
                    type="text"
                    placeholder="youtube.com/@channel"
                    className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                </div>

                {/* LinkedIn */}
                <div className="relative">
                  <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="linkedin"
                    type="text"
                    placeholder="linkedin.com/in/username"
                    className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl py-6 shadow-lg shadow-brand-200 transition transform hover:-translate-y-0.5"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  'Kirim Pendaftaran'
                )}
              </Button>
            </form>
          )}

          {success && (
            <div className="text-center">
              <Button
                onClick={() => setSuccess(false)}
                variant="outline"
                className="mt-4"
              >
                Daftar Lagi
              </Button>
            </div>
          )}

        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-gray-50 pt-6 bg-gray-50/50 rounded-b-3xl">
          <div className="text-center text-sm text-gray-500">
            Sudah menjadi mentor?{" "}
            <Link to="/expert/login" className="font-bold text-brand-600 hover:underline">
              Login di sini
            </Link>
          </div>
        </CardFooter>

      </Card>

      {/* Footer Copy */}
      <div className="absolute bottom-6 text-xs text-gray-400 text-center w-full">
        © 2025 MentorinAja. Mentor Registration.
      </div>
    </div>
  );
}
