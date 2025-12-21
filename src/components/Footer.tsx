import { useNavigate, Link } from 'react-router-dom';

export function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-20 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-24 mb-16">
          {/* Brand & Description */}
          <div className="md:w-5/12">
            <Link to="/" className="text-2xl font-bold italic block mb-6 text-white tracking-tight hover:text-brand-400 transition">
              MentorinAja
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Platform edukasi dan mentoring #1 di Indonesia yang menghubungkan profesional dengan para ahli di industri top-tier. Akselerasi karirmu sekarang.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 transition cursor-pointer text-xs font-bold"
              >
                IG
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 transition cursor-pointer text-xs font-bold"
              >
                LI
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 transition cursor-pointer text-xs font-bold"
              >
                YT
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="md:w-7/12 grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Produk */}
            <div>
              <h4 className="font-bold text-white mb-6 text-sm">Produk</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>
                  <button
                    onClick={() => navigate('/experts')}
                    className="hover:text-brand-400 transition"
                  >
                    Cari Mentor
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/experts?category=CV%20Review')}
                    className="hover:text-brand-400 transition"
                  >
                    Review CV
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/experts?category=Mock%20Interview')}
                    className="hover:text-brand-400 transition"
                  >
                    Mock Interview
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/experts?category=Webinar')}
                    className="hover:text-brand-400 transition"
                  >
                    Webinar
                  </button>
                </li>
              </ul>
            </div>

            {/* Perusahaan */}
            <div>
              <h4 className="font-bold text-white mb-6 text-sm">Perusahaan</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>
                  <button className="hover:text-brand-400 transition">
                    Tentang Kami
                  </button>
                </li>
                <li>
                  <button className="hover:text-brand-400 transition">
                    Karir
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/expert/login')}
                    className="hover:text-brand-400 transition"
                  >
                    Jadi Mentor
                  </button>
                </li>
                <li>
                  <button className="hover:text-brand-400 transition">
                    Partner
                  </button>
                </li>
              </ul>
            </div>

            {/* Dukungan */}
            <div>
              <h4 className="font-bold text-white mb-6 text-sm">Dukungan</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>
                  <button className="hover:text-brand-400 transition">
                    Pusat Bantuan
                  </button>
                </li>
                <li>
                  <button className="hover:text-brand-400 transition">
                    Syarat & Ketentuan
                  </button>
                </li>
                <li>
                  <button className="hover:text-brand-400 transition">
                    Kebijakan Privasi
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div>&copy; {currentYear} MentorinAja. All rights reserved.</div>
          <div className="flex gap-6">
            <button className="hover:text-slate-300 transition">Privacy</button>
            <button className="hover:text-slate-300 transition">Terms</button>
            <button className="hover:text-slate-300 transition">Sitemap</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
