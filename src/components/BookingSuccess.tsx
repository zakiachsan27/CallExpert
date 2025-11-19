import { CheckCircle, Calendar, Clock, Video, Mail, Download, Home, Copy, Check, MessageSquare, AlertCircle, CreditCard, Building2, Wallet, RefreshCw, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Input } from './ui/input';
import type { Booking } from '../App';

type BookingSuccessProps = {
  booking: Booking;
  onBackToHome: () => void;
};

type PaymentMethod = 'credit-card' | 'bank-transfer' | 'e-wallet';
type BankType = 'BCA' | 'Mandiri' | 'BNI' | 'BRI';
type EWalletType = 'gopay' | 'ovo' | 'dana' | 'shopeepay';

export function BookingSuccess({ booking: initialBooking, onBackToHome }: BookingSuccessProps) {
  const [copied, setCopied] = useState(false);
  const [booking, setBooking] = useState(initialBooking);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(booking.paymentMethod || 'credit-card');
  const [selectedBank, setSelectedBank] = useState<BankType>('BCA');
  const [selectedEWallet, setSelectedEWallet] = useState<EWalletType | null>(null);
  
  // Credit Card Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');

  const totalAmount = booking.totalPrice || (booking.sessionType.price + 2000);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Generate Virtual Account Number (dummy)
  const generateVANumber = (bank: BankType): string => {
    const bankCodes = {
      'BCA': '70012',
      'Mandiri': '88008',
      'BNI': '8808',
      'BRI': '26208'
    };
    return `${bankCodes[bank]}${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`;
  };

  const vaNumber = generateVANumber(selectedBank);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.replace(/\//g, '').length <= 4) {
      setCardExpiry(formatted);
    }
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length <= 3) {
      setCardCVV(value);
    }
  };

  const handleCreditCardPayment = () => {
    // Simulate redirect to Visa/Mastercard gateway
    alert('Mengalihkan ke halaman pembayaran Visa/Mastercard...');
    // In real app: window.location.href = 'https://visa-payment-gateway.com/...';
    
    // Simulate successful payment for demo
    setTimeout(() => {
      handlePaymentComplete();
    }, 1000);
  };

  const handleEWalletPayment = (wallet: EWalletType) => {
    const walletUrls = {
      'gopay': 'https://gopay.co.id/payment',
      'ovo': 'https://ovo.id/payment',
      'dana': 'https://dana.id/payment',
      'shopeepay': 'https://shopeepay.co.id/payment'
    };
    
    alert(`Mengalihkan ke halaman ${wallet.toUpperCase()}...`);
    // In real app: window.location.href = walletUrls[wallet];
    
    // Simulate successful payment for demo
    setTimeout(() => {
      handlePaymentComplete();
    }, 1000);
  };

  const handleCopyLink = () => {
    if (booking.meetingLink) {
      // Use fallback method directly since Clipboard API might be blocked
      const textArea = document.createElement('textarea');
      textArea.value = booking.meetingLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (err) {
        console.error('Failed to copy:', err);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const handlePaymentComplete = () => {
    // Simulate payment completion
    setBooking({
      ...booking,
      paymentStatus: 'paid',
      paymentMethod: paymentMethod
    });
  };

  const isPaid = booking.paymentStatus === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 ${isPaid ? 'bg-green-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center`}>
            {isPaid ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            )}
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          {isPaid ? (
            <>
              <h1 className="text-green-600 mb-2">Pembayaran Berhasil!</h1>
              <p className="text-gray-600">
                Konsultasi Anda telah berhasil dibooking dan link meeting telah di-generate
              </p>
            </>
          ) : (
            <>
              <h1 className="text-yellow-600 mb-2">Menunggu Pembayaran</h1>
              <p className="text-gray-600 mb-4">
                Silakan selesaikan pembayaran untuk mengkonfirmasi booking Anda
              </p>
              <Button onClick={handlePaymentComplete}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sudah Dibayar
              </Button>
            </>
          )}
        </div>

        <Separator className="mb-6" />

        {/* Booking Details */}
        <div className="space-y-6">
          {/* Expert Info */}
          <div className="flex items-center gap-4">
            <img
              src={booking.expert.avatar}
              alt={booking.expert.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h2>{booking.expert.name}</h2>
              <p className="text-gray-600">{booking.expert.role}</p>
            </div>
          </div>

          <Separator />

          {/* Schedule Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-gray-600">Tipe Sesi</p>
                <p>{booking.sessionType.name} ({booking.sessionType.duration} menit)</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-gray-600">Tanggal</p>
                <p>
                  {booking.date.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-gray-600">Waktu</p>
                <p>{booking.time} WIB ({booking.sessionType.duration} menit)</p>
              </div>
            </div>

            {booking.topic && (
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-600">Topik yang akan dibahas</p>
                  <p className="text-gray-700">{booking.topic}</p>
                </div>
              </div>
            )}

            {isPaid && booking.meetingLink && (
              <div className="flex items-start gap-3">
                <Video className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-600 mb-2">Link Meeting</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-100 p-3 rounded-lg break-all">
                      <p className="text-blue-600">{booking.meetingLink}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Method Selection - Only show if not paid */}
          {!isPaid && (
            <>
              <div>
                <h3 className="mb-4">Pilih Metode Pembayaran</h3>
                <div className="space-y-3">
                  {/* Credit Card */}
                  <div className={`border rounded-lg transition-colors ${
                    paymentMethod === 'credit-card' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setPaymentMethod('credit-card')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'credit-card' ? 'border-blue-600' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'credit-card' && (
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          )}
                        </div>
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p>Credit Card / Debit Card</p>
                          <p className="text-gray-500">Visa, Mastercard, JCB</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Credit Card Form - Shows when selected */}
                    {paymentMethod === 'credit-card' && (
                      <div className="px-4 pb-4 space-y-4 border-t border-blue-200 pt-4 mt-2">
                        <div className="space-y-2">
                          <Label htmlFor="cardName">Nama Pemilik Kartu</Label>
                          <Input
                            id="cardName"
                            placeholder="JOHN DOE"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Nomor Kartu</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            maxLength={19}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cardExpiry">Kadaluarsa (MM/YY)</Label>
                            <Input
                              id="cardExpiry"
                              placeholder="12/25"
                              value={cardExpiry}
                              onChange={handleExpiryChange}
                              maxLength={5}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cardCVV">CVV</Label>
                            <Input
                              id="cardCVV"
                              placeholder="123"
                              type="password"
                              value={cardCVV}
                              onChange={handleCVVChange}
                              maxLength={3}
                            />
                          </div>
                        </div>

                        <Button 
                          className="w-full" 
                          onClick={handleCreditCardPayment}
                          disabled={!cardName || !cardNumber || !cardExpiry || !cardCVV || cardNumber.replace(/\s/g, '').length < 16 || cardExpiry.length < 5 || cardCVV.length < 3}
                        >
                          Bayar {formatPrice(totalAmount)}
                        </Button>

                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-xs">Pembayaran aman dengan enkripsi SSL</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bank Transfer */}
                  <div className={`border rounded-lg transition-colors ${
                    paymentMethod === 'bank-transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setPaymentMethod('bank-transfer')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'bank-transfer' ? 'border-blue-600' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'bank-transfer' && (
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          )}
                        </div>
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p>Bank Transfer</p>
                          <p className="text-gray-500">BCA, Mandiri, BNI, BRI</p>
                        </div>
                      </div>
                    </div>

                    {/* Bank Transfer Details - Shows when selected */}
                    {paymentMethod === 'bank-transfer' && (
                      <div className="px-4 pb-4 space-y-4 border-t border-blue-200 pt-4 mt-2">
                        {/* Bank Selection */}
                        <div className="grid grid-cols-2 gap-3">
                          {(['BCA', 'Mandiri', 'BNI', 'BRI'] as BankType[]).map((bank) => (
                            <div
                              key={bank}
                              onClick={() => setSelectedBank(bank)}
                              className={`border rounded-lg p-4 cursor-pointer transition-all text-center ${
                                selectedBank === bank
                                  ? 'border-blue-600 bg-blue-100'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <p>{bank}</p>
                            </div>
                          ))}
                        </div>

                        {/* VA Details */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg space-y-4">
                          <div>
                            <p className="text-blue-100 mb-1">Nomor Virtual Account</p>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xl tracking-wider">{vaNumber}</p>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  const textArea = document.createElement('textarea');
                                  textArea.value = vaNumber;
                                  textArea.style.position = 'fixed';
                                  textArea.style.left = '-999999px';
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textArea);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className="bg-white/20 border-white/30 hover:bg-white/30 text-white"
                              >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>

                          <Separator className="bg-white/20" />

                          <div>
                            <p className="text-blue-100 mb-1">Jumlah Transfer</p>
                            <p className="text-2xl">{formatPrice(totalAmount)}</p>
                          </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                          <p className="mb-2">Cara Transfer:</p>
                          <ol className="space-y-2 text-gray-700 list-decimal list-inside">
                            <li>Buka aplikasi mobile banking atau ATM</li>
                            <li>Pilih menu Transfer ke Virtual Account {selectedBank}</li>
                            <li>Masukkan nomor VA: <span className="font-mono font-semibold">{vaNumber}</span></li>
                            <li>Masukkan nominal: <span className="font-semibold">{formatPrice(totalAmount)}</span></li>
                            <li>Konfirmasi dan selesaikan pembayaran</li>
                            <li>Klik tombol "Sudah Dibayar" setelah transfer berhasil</li>
                          </ol>
                        </div>

                        <div className="text-center text-gray-500 text-sm">
                          <p>Virtual Account berlaku untuk 1x transaksi ini</p>
                          <p>Pembayaran akan otomatis terverifikasi dalam 5-10 menit</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* E-Wallet */}
                  <div className={`border rounded-lg transition-colors ${
                    paymentMethod === 'e-wallet' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setPaymentMethod('e-wallet')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'e-wallet' ? 'border-blue-600' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'e-wallet' && (
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          )}
                        </div>
                        <Wallet className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p>E-Wallet</p>
                          <p className="text-gray-500">GoPay, OVO, DANA, ShopeePay</p>
                        </div>
                      </div>
                    </div>

                    {/* E-Wallet Details - Shows when selected */}
                    {paymentMethod === 'e-wallet' && (
                      <div className="px-4 pb-4 space-y-4 border-t border-blue-200 pt-4 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                          {/* GoPay */}
                          <div
                            onClick={() => setSelectedEWallet('gopay')}
                            className={`border rounded-lg p-6 cursor-pointer transition-all text-center ${
                              selectedEWallet === 'gopay'
                                ? 'border-blue-600 bg-blue-100'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <Wallet className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                            <p>GoPay</p>
                          </div>

                          {/* OVO */}
                          <div
                            onClick={() => setSelectedEWallet('ovo')}
                            className={`border rounded-lg p-6 cursor-pointer transition-all text-center ${
                              selectedEWallet === 'ovo'
                                ? 'border-purple-600 bg-purple-100'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <Wallet className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                            <p>OVO</p>
                          </div>

                          {/* DANA */}
                          <div
                            onClick={() => setSelectedEWallet('dana')}
                            className={`border rounded-lg p-6 cursor-pointer transition-all text-center ${
                              selectedEWallet === 'dana'
                                ? 'border-blue-600 bg-blue-100'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <Wallet className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                            <p>DANA</p>
                          </div>

                          {/* ShopeePay */}
                          <div
                            onClick={() => setSelectedEWallet('shopeepay')}
                            className={`border rounded-lg p-6 cursor-pointer transition-all text-center ${
                              selectedEWallet === 'shopeepay'
                                ? 'border-orange-600 bg-orange-100'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <Wallet className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                            <p>ShopeePay</p>
                          </div>
                        </div>

                        {selectedEWallet && (
                          <>
                            <div className="bg-white p-4 rounded-lg border border-blue-200">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-gray-700">
                                  <p className="mb-2">Cara Pembayaran:</p>
                                  <ol className="space-y-1 list-decimal list-inside">
                                    <li>Klik tombol "Bayar dengan {selectedEWallet.toUpperCase()}"</li>
                                    <li>Anda akan diarahkan ke aplikasi {selectedEWallet.toUpperCase()}</li>
                                    <li>Konfirmasi pembayaran sebesar {formatPrice(totalAmount)}</li>
                                    <li>Selesaikan pembayaran di aplikasi</li>
                                    <li>Anda akan otomatis kembali ke halaman ini</li>
                                  </ol>
                                </div>
                              </div>
                            </div>

                            <Button 
                              className="w-full" 
                              onClick={() => handleEWalletPayment(selectedEWallet)}
                            >
                              <Wallet className="w-4 h-4 mr-2" />
                              Bayar dengan {selectedEWallet.toUpperCase()} - {formatPrice(totalAmount)}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Payment Summary */}
          <div className="space-y-2">
            <h3>Rincian Pembayaran</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Harga konsultasi</span>
                <span>{formatPrice(booking.sessionType.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya admin</span>
                <span>{formatPrice(5000)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Total {isPaid ? 'Dibayar' : 'yang Harus Dibayar'}</span>
                <span className="text-green-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Status */}
          {isPaid && (
            <>
              {/* Next Steps */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="mb-3">Langkah Selanjutnya:</h3>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">
                      Konfirmasi booking telah dikirim ke email Anda
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">
                      Anda akan menerima reminder 24 jam sebelum sesi
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Video className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">
                      Join meeting 5 menit sebelum waktu yang ditentukan
                    </span>
                  </li>
                </ul>
              </div>
              
              <Separator />
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {isPaid ? (
              <>
                <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link Meeting
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
                <Button className="flex-1" onClick={onBackToHome}>
                  <Home className="w-4 h-4 mr-2" />
                  Kembali ke Home
                </Button>
              </>
            ) : (
              <Button variant="outline" className="w-full" onClick={onBackToHome}>
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Home
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}