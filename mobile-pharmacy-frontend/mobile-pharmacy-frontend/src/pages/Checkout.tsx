import { ArrowLeft, Check, MapPin, PenLine } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import SignatureModal from '../components/SignatureModal';
import signatureLogger from '../utils/SignatureLogger';

// Sample cart items
const CART_ITEMS = [
  { id: 1, name: 'Paracetamol 500mg', qty: 2, price: 15000 },
  { id: 2, name: 'Vitamin C 1000mg', qty: 1, price: 25000 },
  { id: 3, name: 'Amoxicillin 500mg', qty: 1, price: 35000 },
];

function Checkout() {
  const navigate = useNavigate();
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<ReturnType<typeof signatureLogger.getExportData> | null>(null);
  const [isOrderComplete, setIsOrderComplete] = useState(false);

  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingFee = 10000;
  const total = subtotal + shippingFee;

  const handleOpenSignature = () => {
    setShowSignatureModal(true);
  };

  const handleCloseSignature = () => {
    setShowSignatureModal(false);
  };

  const handleSaveSignature = (data: ReturnType<typeof signatureLogger.getExportData>) => {
    setSignatureData(data);
    setShowSignatureModal(false);
    console.log('[Checkout] Signature saved:', JSON.stringify(data, null, 2));
  };

  const handleSubmitOrder = () => {
    if (!signatureData) {
      alert('Silakan tambahkan tanda tangan terlebih dahulu');
      return;
    }

    // Submit order with signature data
    console.log('[Checkout] Order submitted with signature trajectory');
    setIsOrderComplete(true);

    // Navigate to home after 2 seconds
    setTimeout(() => {
      navigate('/home');
    }, 3000);
  };

  if (isOrderComplete) {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Berhasil!</h2>
          <p className="text-gray-600">Terima kasih telah berbelanja</p>
          <p className="text-sm text-gray-500 mt-4">Mengalihkan ke halaman utama...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-800 pr-10">Checkout</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Delivery Address */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-gray-800">Alamat Pengiriman</h3>
          </div>
          <div className="pl-8">
            <p className="font-medium text-gray-800">John Doe</p>
            <p className="text-sm text-gray-600">+62 812 3456 7890</p>
            <p className="text-sm text-gray-600 mt-1">
              Jl. Sudirman No. 123, RT 01/RW 02, Kelurahan Menteng, Kecamatan Menteng, Jakarta Pusat, DKI Jakarta 10310
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Pesanan</h3>
          <div className="space-y-3">
            {CART_ITEMS.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center text-2xl">
                  💊
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.qty}x Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <p className="font-medium text-gray-800">
                  Rp {(item.price * item.qty).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Ringkasan Pembayaran</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-800">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ongkos Kirim</span>
              <span className="text-gray-800">Rp {shippingFee.toLocaleString('id-ID')}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-800">Total</span>
                <span className="text-teal-600">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Signature Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <PenLine className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-gray-800">Tanda Tangan Digital</h3>
          </div>
          
          {signatureData ? (
            <div className="space-y-3">
              {/* Show signature preview */}
              <div className="border-2 border-dashed border-teal-300 rounded-lg p-2 bg-teal-50">
                <img 
                  src={signatureData.image_data_url} 
                  alt="Tanda tangan" 
                  className="w-full h-24 object-contain"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-teal-600">
                <Check className="w-4 h-4" />
                <span>Tanda tangan tersimpan ({signatureData.total_points} titik, {signatureData.stroke_count} goresan)</span>
              </div>
              <button
                onClick={handleOpenSignature}
                className="w-full py-2 text-teal-600 font-medium border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
              >
                Ubah Tanda Tangan
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Tanda tangan digital diperlukan sebagai verifikasi pemesanan obat resep
              </p>
              <button
                onClick={handleOpenSignature}
                className="w-full py-3 bg-teal-100 text-teal-700 font-medium rounded-lg hover:bg-teal-200 transition-colors flex items-center justify-center gap-2"
              >
                <PenLine className="w-5 h-5" />
                Tambah Tanda Tangan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600">Total Pembayaran</span>
          <span className="text-xl font-bold text-teal-600">Rp {total.toLocaleString('id-ID')}</span>
        </div>
        <button
          onClick={handleSubmitOrder}
          disabled={!signatureData}
          className={`w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${
            signatureData
              ? 'bg-teal-600 text-white hover:bg-teal-500 active:bg-teal-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Check className="w-5 h-5" />
          Proses Pesanan
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="cart" />

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={handleCloseSignature}
        onSave={handleSaveSignature}
      />
    </div>
  );
}

export default Checkout;
