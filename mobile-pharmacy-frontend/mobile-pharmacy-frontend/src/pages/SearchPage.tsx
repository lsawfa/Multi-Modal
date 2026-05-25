import { AlertTriangle, ArrowLeft, ChevronRight, Clock, FileText, ImageIcon, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import SearchBar from '../components/SearchBar';
import { useLogger } from '../context/LoggerContext';

// Recent searches data
const RECENT_SEARCHES = [
  { id: 1, name: 'Paracetamol', icon: '💊' },
  { id: 2, name: 'Vitamin C', icon: '🍊' },
  { id: 3, name: 'Obat Flu', icon: '🤧' },
];

// Popular categories
const POPULAR_CATEGORIES = [
  { id: 1, name: 'Demam', icon: '🌡️', color: 'bg-red-100' },
  { id: 2, name: 'Batuk', icon: '😷', color: 'bg-yellow-100' },
  { id: 3, name: 'Alergi', icon: '🤧', color: 'bg-purple-100' },
  { id: 4, name: 'Kulit', icon: '🧴', color: 'bg-pink-100' },
  { id: 5, name: 'Vitamin', icon: '💪', color: 'bg-green-100' },
  { id: 6, name: 'Maag', icon: '🫃', color: 'bg-orange-100' },
];

function SearchPage() {
  const navigate = useNavigate();
  const { logger, eventCount } = useLogger();
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [hasTypingError, setHasTypingError] = useState(false);
  const [showCognitiveMetrics, setShowCognitiveMetrics] = useState(false);
  const [cognitiveMetrics, setCognitiveMetrics] = useState<ReturnType<typeof logger.getCognitiveLoadMetrics>>(null);

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // Simulate search results
    setSearchResults([`${query} 500mg`, `${query} Sirup`, `${query} Tablet`]);
    
    // Get cognitive metrics after search
    const metrics = logger.getCognitiveLoadMetrics();
    setCognitiveMetrics(metrics);
    setShowCognitiveMetrics(true);
  };

  const handleRecentSearchClick = (searchTerm: string) => {
    console.log('Recent search clicked:', searchTerm);
    handleSearch(searchTerm);
  };

  const handleCategoryClick = (categoryName: string) => {
    console.log('Category clicked:', categoryName);
    handleSearch(categoryName);
  };

  const handleBackClick = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-4 flex items-center gap-4 shadow-lg">
        <button
          onClick={handleBackClick}
          className="p-2 hover:bg-white/20 rounded-xl transition-colors active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold flex-1">Pencarian Obat</h1>
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{eventCount} events</span>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          onTypingError={setHasTypingError}
          placeholder="Cari obat, vitamin, suplemen..."
        />

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Hasil Pencarian</h3>
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/drug/${encodeURIComponent(result)}`)}
                  className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg hover:bg-teal-100 cursor-pointer transition-colors"
                >
                  <span className="text-2xl">💊</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{result}</p>
                    <p className="text-xs text-gray-500">Tersedia</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-teal-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cognitive Metrics Panel */}
        {showCognitiveMetrics && cognitiveMetrics && (
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-emerald-500">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-700">📊 Cognitive Load Metrics</h3>
              <button
                onClick={() => setShowCognitiveMetrics(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-teal-50 p-2 rounded-lg">
                <p className="text-gray-500 text-xs">Total Keystrokes</p>
                <p className="font-bold text-teal-700">{cognitiveMetrics.total_keystrokes}</p>
              </div>
              <div className="bg-red-50 p-2 rounded-lg">
                <p className="text-gray-500 text-xs">Corrections</p>
                <p className="font-bold text-red-600">{cognitiveMetrics.correction_count}</p>
              </div>
              <div className="bg-yellow-50 p-2 rounded-lg">
                <p className="text-gray-500 text-xs">Thinking Pauses</p>
                <p className="font-bold text-yellow-600">{cognitiveMetrics.thinking_pause_count}</p>
              </div>
              <div className="bg-purple-50 p-2 rounded-lg">
                <p className="text-gray-500 text-xs">Hesitations</p>
                <p className="font-bold text-purple-600">{cognitiveMetrics.hesitation_count}</p>
              </div>
              <div className="bg-blue-50 p-2 rounded-lg">
                <p className="text-gray-500 text-xs">Error Rate</p>
                <p className="font-bold text-blue-600">{(cognitiveMetrics.error_rate * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg">
                <p className="text-gray-500 text-xs">Avg Latency</p>
                <p className="font-bold text-emerald-600">{cognitiveMetrics.avg_latency_ms.toFixed(0)} ms</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {searchResults.length === 0 && (
          <>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Pencarian Terakhir
              </h3>
              <div className="space-y-2">
                {RECENT_SEARCHES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleRecentSearchClick(item.name)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors text-left"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="flex-1 text-gray-700">{item.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Categories */}
            <div className="bg-white rounded-xl p-4 shadow-md">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Kategori Populer
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {POPULAR_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.name)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:scale-105 transition-transform"
                  >
                    <div className={`w-14 h-14 ${category.color} rounded-full flex items-center justify-center text-2xl shadow-sm`}>
                      {category.icon}
                    </div>
                    <span className="text-xs font-medium text-gray-700">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Resep Card */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-4 shadow-lg text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Upload Resep Dokter</h3>
                  <p className="text-sm text-white/80">Kirim foto resep untuk pemesanan obat</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/upload-resep')}
                className="w-full mt-4 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-white/90 active:bg-white/80 transition-colors flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                Upload Resep
              </button>
            </div>
          </>
        )}

        {/* Typing Error Indicator */}
        {hasTypingError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Kemungkinan kesalahan ketik</p>
              <p className="text-xs text-red-600">Periksa ejaan nama obat Anda</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="search" />
    </div>
  );
}

export default SearchPage;
