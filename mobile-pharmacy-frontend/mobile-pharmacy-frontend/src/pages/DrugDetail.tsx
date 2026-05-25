import { ArrowLeft, Share2, ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import scrollLogger from '../utils/ScrollLogger';

// Sample drug data
const DRUG_DATA = {
  id: 'paracetamol-500',
  name: 'Paracetamol 500mg',
  price: 15000,
  image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop',
  description: `Paracetamol adalah obat yang digunakan untuk meredakan nyeri ringan hingga sedang dan menurunkan demam. Obat ini bekerja dengan cara menghambat produksi prostaglandin di otak yang berperan dalam menimbulkan rasa nyeri dan demam.

Paracetamol merupakan salah satu obat pereda nyeri dan penurun demam yang paling umum digunakan dan tersedia secara luas di seluruh dunia. Obat ini termasuk dalam golongan analgesik-antipiretik.`,
  indications: `Paracetamol diindikasikan untuk:
• Meredakan nyeri ringan hingga sedang seperti sakit kepala, sakit gigi, nyeri otot, nyeri haid, dan nyeri pasca operasi ringan
• Menurunkan demam pada kondisi flu, infeksi saluran pernapasan, dan infeksi lainnya
• Meredakan nyeri sendi pada kondisi osteoarthritis
• Sebagai alternatif untuk pasien yang tidak dapat menggunakan aspirin atau NSAID
• Membantu mengatasi gejala pilek dan flu
• Meredakan ketidaknyamanan pasca vaksinasi`,
  composition: `Setiap tablet mengandung:
• Paracetamol (Acetaminophen) 500 mg
• Bahan tambahan: Mikrokristalin selulosa, Pati jagung, Magnesium stearat, Povidon K30, Asam stearat, Talk
• Tidak mengandung gluten
• Tidak mengandung laktosa`,
  dosage: `ATURAN PAKAI:

Dewasa dan anak di atas 12 tahun:
• Dosis: 1-2 tablet (500mg-1000mg) setiap 4-6 jam
• Maksimal: 8 tablet (4000mg) dalam 24 jam
• Jangan melebihi dosis yang dianjurkan

Anak-anak 6-12 tahun:
• Dosis: ½-1 tablet (250mg-500mg) setiap 4-6 jam
• Maksimal: 4 tablet (2000mg) dalam 24 jam
• Selalu konsultasikan dengan dokter

Anak-anak di bawah 6 tahun:
• Gunakan sediaan sirup dengan dosis sesuai berat badan
• Konsultasikan dengan dokter atau apoteker

CARA PENGGUNAAN:
• Telan tablet dengan air putih
• Dapat diminum sebelum atau sesudah makan
• Jangan mengunyah atau menghancurkan tablet
• Berikan jarak minimal 4 jam antara dosis
• Jangan gunakan bersama obat lain yang mengandung paracetamol

PENYIMPANAN:
• Simpan pada suhu di bawah 30°C
• Jauhkan dari sinar matahari langsung
• Simpan di tempat kering
• Jauhkan dari jangkauan anak-anak`,
  sideEffects: `⚠️ EFEK SAMPING YANG MUNGKIN TERJADI:

EFEK SAMPING UMUM (Jarang terjadi):
• Mual ringan
• Sakit perut
• Reaksi alergi ringan seperti ruam kulit

EFEK SAMPING SERIUS (Segera hentikan penggunaan dan hubungi dokter):
• Reaksi alergi berat: pembengkakan wajah, bibir, lidah, atau tenggorokan
• Kesulitan bernapas atau menelan
• Ruam kulit yang parah atau mengelupas
• Gatal-gatal hebat
• Kulit atau mata menguning (tanda kerusakan hati)
• Urine berwarna gelap
• Feses berwarna pucat
• Mual atau muntah yang tidak kunjung hilang
• Nyeri perut bagian atas
• Kelelahan yang tidak biasa

PERINGATAN KERUSAKAN HATI:
Penggunaan paracetamol melebihi dosis yang dianjurkan dapat menyebabkan kerusakan hati yang serius dan berpotensi fatal. Risiko kerusakan hati meningkat jika:
• Mengonsumsi alkohol secara berlebihan
• Sudah memiliki penyakit hati
• Menggunakan obat lain yang mempengaruhi fungsi hati
• Menggunakan paracetamol dalam jangka waktu lama

INTERAKSI OBAT:
• Warfarin: dapat meningkatkan efek pengencer darah
• Obat epilepsi: dapat mempengaruhi kadar obat dalam darah
• Rifampisin: dapat mengurangi efektivitas paracetamol
• Alkohol: meningkatkan risiko kerusakan hati

KONTRAINDIKASI:
• Hipersensitivitas terhadap paracetamol
• Gangguan fungsi hati berat
• Defisiensi enzim G6PD (kondisi tertentu)

Jika Anda mengalami efek samping yang tidak tercantum di atas atau efek samping yang memburuk, segera hentikan penggunaan dan konsultasikan dengan tenaga kesehatan.`,
  warnings: `PERINGATAN DAN PERHATIAN:

• Jangan melebihi dosis yang dianjurkan
• Konsultasikan dengan dokter jika gejala tidak membaik setelah 3 hari
• Hati-hati penggunaan pada pasien dengan gangguan fungsi hati atau ginjal
• Informasikan kepada dokter jika Anda sedang mengonsumsi obat lain
• Tidak dianjurkan untuk penggunaan jangka panjang tanpa pengawasan medis
• Hindari konsumsi alkohol selama menggunakan obat ini
• Untuk ibu hamil dan menyusui, konsultasikan dengan dokter sebelum penggunaan`,
};

function DrugDetail() {
  const navigate = useNavigate();
  const { drugId } = useParams();
  const [showScrollData, setShowScrollData] = useState(false);
  const [scrollData, setScrollData] = useState<ReturnType<typeof scrollLogger.getExportData> | null>(null);
  
  // Section refs for tracking
  const descriptionRef = useRef<HTMLDivElement>(null);
  const indicationsRef = useRef<HTMLDivElement>(null);
  const compositionRef = useRef<HTMLDivElement>(null);
  const dosageRef = useRef<HTMLDivElement>(null);
  const sideEffectsRef = useRef<HTMLDivElement>(null);
  const warningsRef = useRef<HTMLDivElement>(null);

  // Initialize scroll logger
  useEffect(() => {
    // Register sections
    if (descriptionRef.current) scrollLogger.registerSection('deskripsi', descriptionRef.current);
    if (indicationsRef.current) scrollLogger.registerSection('indikasi', indicationsRef.current);
    if (compositionRef.current) scrollLogger.registerSection('komposisi', compositionRef.current);
    if (dosageRef.current) scrollLogger.registerSection('dosis', dosageRef.current);
    if (sideEffectsRef.current) scrollLogger.registerSection('efek-samping', sideEffectsRef.current);
    if (warningsRef.current) scrollLogger.registerSection('peringatan', warningsRef.current);

    // Start recording
    scrollLogger.start('drug-detail-paracetamol');

    return () => {
      // Export data before unmount
      const data = scrollLogger.getExportData();
      console.log('[DrugDetail] Scroll Analytics:', JSON.stringify(data, null, 2));
      
      // Stop recording
      scrollLogger.stop();
      
      // Unregister sections
      scrollLogger.unregisterSection('deskripsi');
      scrollLogger.unregisterSection('indikasi');
      scrollLogger.unregisterSection('komposisi');
      scrollLogger.unregisterSection('dosis');
      scrollLogger.unregisterSection('efek-samping');
      scrollLogger.unregisterSection('peringatan');
    };
  }, []);

  const handleShowScrollData = () => {
    const data = scrollLogger.getExportData();
    setScrollData(data);
    setShowScrollData(true);
    console.log('[DrugDetail] Current Scroll Data:', JSON.stringify(data, null, 2));
  };

  const handleAddToCart = () => {
    // Log add to cart action
    console.log('[DrugDetail] Add to cart clicked');
    alert('Produk ditambahkan ke keranjang!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: DRUG_DATA.name,
        text: `Lihat ${DRUG_DATA.name} di Mobile Pharmacy`,
        url: window.location.href,
      });
    } else {
      alert('Link copied!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <h1 className="text-lg font-semibold text-gray-800">Detail Obat</h1>
          
          <button
            onClick={handleShare}
            className="p-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="Bagikan"
          >
            <Share2 className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="pt-16">
        {/* Product Header */}
        <div className="bg-white">
          {/* Product Image */}
          <div className="w-full h-64 bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center">
            <img
              src={DRUG_DATA.image}
              alt={DRUG_DATA.name}
              className="w-48 h-48 object-contain rounded-lg shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/200x200?text=Obat';
              }}
            />
          </div>
          
          {/* Product Info */}
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-800">{DRUG_DATA.name}</h2>
            <p className="text-xl font-semibold text-teal-600 mt-2">
              Rp {DRUG_DATA.price.toLocaleString('id-ID')}
            </p>
            
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold rounded-xl hover:from-gray-700 hover:to-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              Tambah ke Keranjang
            </button>
          </div>
        </div>

        {/* Content Sections */}
        <div className="mt-2 space-y-2">
          {/* Deskripsi */}
          <section ref={descriptionRef} className="bg-white p-4" data-section="deskripsi">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
              Deskripsi
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {DRUG_DATA.description}
            </p>
          </section>

          {/* Indikasi Umum */}
          <section ref={indicationsRef} className="bg-white p-4" data-section="indikasi">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
              Indikasi Umum
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {DRUG_DATA.indications}
            </p>
          </section>

          {/* Komposisi */}
          <section ref={compositionRef} className="bg-white p-4" data-section="komposisi">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
              Komposisi
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {DRUG_DATA.composition}
            </p>
          </section>

          {/* Dosis & Aturan Pakai */}
          <section ref={dosageRef} className="bg-white p-4" data-section="dosis">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
              Dosis & Aturan Pakai
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {DRUG_DATA.dosage}
            </p>
          </section>

          {/* Efek Samping - CRITICAL SECTION */}
          <section 
            ref={sideEffectsRef} 
            className="bg-white p-4 border-l-4 border-red-500" 
            data-section="efek-samping"
          >
            <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-500 rounded-full"></span>
              ⚠️ Efek Samping
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {DRUG_DATA.sideEffects}
            </p>
          </section>

          {/* Peringatan */}
          <section ref={warningsRef} className="bg-white p-4" data-section="peringatan">
            <h3 className="text-lg font-semibold text-amber-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
              ⚡ Peringatan
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {DRUG_DATA.warnings}
            </p>
          </section>
        </div>

        {/* Debug: Show Scroll Data Button */}
        <div className="p-4 bg-gray-100">
          <button
            onClick={handleShowScrollData}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            📊 Lihat Data Scroll Analytics
          </button>
        </div>

        {/* Scroll Data Modal */}
        {showScrollData && scrollData && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
            <div className="bg-white w-full max-h-[80vh] rounded-t-2xl overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Scroll Analytics Data</h3>
                <button
                  onClick={() => setShowScrollData(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[70vh]">
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-teal-800 mb-2">📈 Ringkasan</h4>
                    <ul className="text-sm space-y-1 text-teal-700">
                      <li>Total Events: {scrollData.total_scroll_events}</li>
                      <li>Max Depth: {scrollData.max_scroll_depth_percentage.toFixed(1)}%</li>
                      <li>Avg Velocity: {scrollData.average_velocity.toFixed(2)} px/s</li>
                      <li>Duration: {((scrollData.recording_duration_ms || 0) / 1000).toFixed(1)}s</li>
                    </ul>
                  </div>

                  {/* Reading Behavior */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">📖 Perilaku Membaca</h4>
                    <ul className="text-sm space-y-1 text-blue-700">
                      <li>Total Reading Time: {(scrollData.reading_behavior.total_reading_time_ms / 1000).toFixed(1)}s</li>
                      <li>Efek Samping Reached: {scrollData.reading_behavior.efek_samping_reached ? '✅ Ya' : '❌ Tidak'}</li>
                      <li>Efek Samping Read Time: {(scrollData.reading_behavior.efek_samping_read_time_ms / 1000).toFixed(1)}s</li>
                      <li>Sections Read: {scrollData.reading_behavior.sections_read.join(', ') || 'None'}</li>
                    </ul>
                  </div>

                  {/* Section Visibility */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">👁️ Section Visibility</h4>
                    <div className="space-y-2">
                      {scrollData.section_visibility.map((section) => (
                        <div key={section.section_id} className="text-sm">
                          <div className="flex justify-between text-purple-700">
                            <span className="font-medium">{section.section_name}</span>
                            <span>{(section.reading_time_ms / 1000).toFixed(1)}s reading</span>
                          </div>
                          <div className="w-full bg-purple-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${section.visible_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Raw JSON */}
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">🔧 Raw JSON</h4>
                    <pre className="text-xs overflow-x-auto bg-gray-800 text-green-400 p-3 rounded">
                      {JSON.stringify(scrollData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="search" />
    </div>
  );
}

export default DrugDetail;
