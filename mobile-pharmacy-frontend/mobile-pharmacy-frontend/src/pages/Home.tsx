import { Download, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

// ==================== TYPES ====================
interface Drug {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface InteractionLog {
  timestamp: number;
  event_type: 'scroll' | 'dwell' | 'click' | 'category_view' | 'drug_card_click';
  data: ScrollData | DwellData | ClickData | Record<string, unknown>;
}

interface ScrollData {
  scroll_y: number;
  scroll_velocity: number;
  viewport_percentage: number;
  direction: 'up' | 'down' | 'idle';
  [key: string]: unknown;
}

interface DwellData {
  category_id: string;
  category_name: string;
  dwell_duration_ms: number;
  is_reading: boolean;
  [key: string]: unknown;
}

interface ClickData {
  element_type: string;
  element_id: string;
  element_name: string;
  coordinates: { x: number; y: number };
  viewport_coordinates: { x: number; y: number };
  [key: string]: unknown;
}

// ==================== DATA ====================
const categories: Category[] = [
  { id: 'fever-flu', name: 'Demam & Flu', icon: '🤒', description: 'Obat untuk demam, pilek, dan flu' },
  { id: 'cough-throat', name: 'Batuk & Tenggorokan', icon: '🤧', description: 'Obat batuk dan radang tenggorokan' },
  { id: 'gastric', name: 'Maag & Pencernaan', icon: '🤢', description: 'Obat maag, diare, dan pencernaan' },
  { id: 'first-aid', name: 'P3K & Luka Luar', icon: '🩹', description: 'Obat luka, antiseptik, dan P3K' },
];

const drugsByCategory: Record<string, Drug[]> = {
  'fever-flu': [
    { id: 'paracetamol', name: 'Paracetamol 500mg', price: 8500, category: 'fever-flu', image: '💊' },
    { id: 'panadol', name: 'Panadol Extra', price: 15000, category: 'fever-flu', image: '💊' },
    { id: 'bodrex', name: 'Bodrex Flu & Batuk', price: 12000, category: 'fever-flu', image: '💊' },
    { id: 'decolgen', name: 'Decolgen', price: 10000, category: 'fever-flu', image: '💊' },
  ],
  'cough-throat': [
    { id: 'obt-batuk', name: 'OBH Combi', price: 18000, category: 'cough-throat', image: '🧴' },
    { id: 'vicks', name: 'Vicks Formula 44', price: 25000, category: 'cough-throat', image: '🧴' },
    { id: 'strepsils', name: 'Strepsils', price: 15000, category: 'cough-throat', image: '🍬' },
    { id: 'siladex', name: 'Siladex', price: 20000, category: 'cough-throat', image: '🧴' },
  ],
  'gastric': [
    { id: 'antasida', name: 'Antasida DOEN', price: 5000, category: 'gastric', image: '💊' },
    { id: 'promag', name: 'Promag', price: 8000, category: 'gastric', image: '💊' },
    { id: 'mylanta', name: 'Mylanta', price: 22000, category: 'gastric', image: '🧴' },
    { id: 'entrostop', name: 'Entrostop', price: 12000, category: 'gastric', image: '💊' },
  ],
  'first-aid': [
    { id: 'betadine', name: 'Betadine 15ml', price: 18000, category: 'first-aid', image: '🧴' },
    { id: 'hansaplast', name: 'Hansaplast', price: 10000, category: 'first-aid', image: '🩹' },
    { id: 'bioplacenton', name: 'Bioplacenton', price: 35000, category: 'first-aid', image: '🧴' },
    { id: 'rivanol', name: 'Rivanol', price: 8000, category: 'first-aid', image: '🧴' },
  ],
};

// ==================== COMPONENT ====================
function Home() {
  const navigate = useNavigate();
  const [interactionLogs, setInteractionLogs] = useState<InteractionLog[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [categoryDwellTimes, setCategoryDwellTimes] = useState<Map<string, number>>(new Map());
  
  // Refs for tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const currentVisibleCategory = useRef<string | null>(null);
  const dwellStartTime = useRef<number | null>(null);
  const scrollVelocityHistory = useRef<number[]>([]);
  
  // ==================== LOGGING FUNCTIONS ====================
  const addLog = useCallback((event_type: InteractionLog['event_type'], data: ScrollData | DwellData | ClickData | Record<string, unknown>) => {
    const log: InteractionLog = {
      timestamp: Date.now(),
      event_type,
      data,
    };
    setInteractionLogs(prev => [...prev, log]);
    console.log(`[HomeLogger] ${event_type}:`, data);
  }, []);

  // ==================== SCROLL TRACKING (Throttled) ====================
  const throttle = <T extends (...args: unknown[]) => void>(func: T, limit: number): T => {
    let inThrottle = false;
    return ((...args: unknown[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  };

  const calculateScrollVelocity = useCallback(() => {
    if (!containerRef.current) return 0;
    
    const currentY = containerRef.current.scrollTop;
    const currentTime = Date.now();
    const deltaY = currentY - lastScrollY.current;
    const deltaTime = currentTime - lastScrollTime.current;
    
    const velocity = deltaTime > 0 ? Math.abs(deltaY / deltaTime * 1000) : 0; // px/s
    
    lastScrollY.current = currentY;
    lastScrollTime.current = currentTime;
    
    return velocity;
  }, []);

  const getViewportPercentage = useCallback(() => {
    if (!containerRef.current) return 0;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return Math.round((scrollTop / (scrollHeight - clientHeight)) * 100) || 0;
  }, []);

  const getScrollDirection = useCallback((velocity: number): 'up' | 'down' | 'idle' => {
    if (!containerRef.current) return 'idle';
    const currentY = containerRef.current.scrollTop;
    if (velocity < 10) return 'idle';
    return currentY > lastScrollY.current ? 'down' : 'up';
  }, []);

  // ==================== DWELL TIME TRACKING ====================
  const updateCategoryDwellTime = useCallback((categoryId: string, duration: number) => {
    setCategoryDwellTimes(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(categoryId) || 0;
      newMap.set(categoryId, existing + duration);
      return newMap;
    });
  }, []);

  const checkVisibleCategory = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;
    
    let closestCategory: string | null = null;
    let minDistance = Infinity;
    
    categoryRefs.current.forEach((element, categoryId) => {
      const rect = element.getBoundingClientRect();
      const categoryCenter = rect.top + rect.height / 2;
      const distance = Math.abs(categoryCenter - containerCenter);
      
      if (distance < minDistance && rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
        minDistance = distance;
        closestCategory = categoryId;
      }
    });
    
    // Handle category change
    if (closestCategory !== currentVisibleCategory.current) {
      // Log previous category dwell time
      if (currentVisibleCategory.current && dwellStartTime.current) {
        const dwellDuration = Date.now() - dwellStartTime.current;
        const category = categories.find(c => c.id === currentVisibleCategory.current);
        
        if (dwellDuration > 500) { // Only log if viewed for more than 500ms
          updateCategoryDwellTime(currentVisibleCategory.current, dwellDuration);
          
          const dwellData: DwellData = {
            category_id: currentVisibleCategory.current,
            category_name: category?.name || '',
            dwell_duration_ms: dwellDuration,
            is_reading: dwellDuration > 2000, // Consider reading if > 2 seconds
          };
          addLog('dwell', dwellData);
        }
      }
      
      // Start tracking new category
      currentVisibleCategory.current = closestCategory;
      dwellStartTime.current = Date.now();
      
      if (closestCategory) {
        const category = categories.find(c => c.id === closestCategory);
        addLog('category_view', {
          category_id: closestCategory,
          category_name: category?.name || '',
          viewport_percentage: getViewportPercentage(),
        });
      }
    }
  }, [addLog, getViewportPercentage, updateCategoryDwellTime]);

  // ==================== SCROLL HANDLER ====================
  const handleScroll = useCallback(() => {
    const velocity = calculateScrollVelocity();
    const direction = getScrollDirection(velocity);
    const viewportPercentage = getViewportPercentage();
    
    // Keep velocity history for averaging
    scrollVelocityHistory.current.push(velocity);
    if (scrollVelocityHistory.current.length > 10) {
      scrollVelocityHistory.current.shift();
    }
    
    const scrollData: ScrollData = {
      scroll_y: containerRef.current?.scrollTop || 0,
      scroll_velocity: Math.round(velocity),
      viewport_percentage: viewportPercentage,
      direction,
    };
    
    addLog('scroll', scrollData);
    checkVisibleCategory();
  }, [addLog, calculateScrollVelocity, checkVisibleCategory, getScrollDirection, getViewportPercentage]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledScrollHandler = useCallback(throttle(handleScroll, 100), [handleScroll]); // 10 samples per second

  // ==================== CLICK TRACKING ====================
  const handleDrugCardClick = (drug: Drug, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    
    const clickData: ClickData = {
      element_type: 'drug_card',
      element_id: drug.id,
      element_name: drug.name,
      coordinates: {
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
      },
      viewport_coordinates: {
        x: Math.round(event.clientX - rect.left),
        y: Math.round(event.clientY - rect.top),
      },
    };
    
    addLog('drug_card_click', clickData);
    navigate(`/drug/${drug.id}`);
  };

  const handleDetailButtonClick = (drug: Drug, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    
    const clickData: ClickData = {
      element_type: 'detail_button',
      element_id: `btn-${drug.id}`,
      element_name: `Lihat Detail - ${drug.name}`,
      coordinates: {
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
      },
      viewport_coordinates: {
        x: Math.round(event.clientX - rect.left),
        y: Math.round(event.clientY - rect.top),
      },
    };
    
    addLog('click', clickData);
    navigate(`/drug/${drug.id}`);
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', throttledScrollHandler);
      return () => container.removeEventListener('scroll', throttledScrollHandler);
    }
  }, [throttledScrollHandler]);

  // Log final dwell time on unmount
  useEffect(() => {
    return () => {
      if (currentVisibleCategory.current && dwellStartTime.current) {
        const dwellDuration = Date.now() - dwellStartTime.current;
        console.log(`[HomeLogger] Final dwell on ${currentVisibleCategory.current}: ${dwellDuration}ms`);
      }
    };
  }, []);

  // ==================== EXPORT LOGS ====================
  const exportLogs = () => {
    const exportData = {
      session_id: `home_${Date.now()}`,
      export_timestamp: Date.now(),
      total_interactions: interactionLogs.length,
      category_dwell_summary: Object.fromEntries(categoryDwellTimes),
      average_scroll_velocity: scrollVelocityHistory.current.length > 0 
        ? Math.round(scrollVelocityHistory.current.reduce((a, b) => a + b, 0) / scrollVelocityHistory.current.length)
        : 0,
      interaction_logs: interactionLogs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `home_interaction_logs_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ==================== RENDER ====================
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-teal-700">Mobile Pharmacy</h1>
              <p className="text-xs text-gray-500 mt-0.5">Solusi kesehatan digital Anda</p>
            </div>
            {/* Stats indicator */}
            <button
              onClick={() => setShowLogsModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 rounded-full text-xs text-teal-700"
            >
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
              {interactionLogs.length} logs
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main 
        ref={containerRef}
        className="flex-1 overflow-y-auto pb-24"
      >
        {/* Welcome Banner */}
        <div className="px-5 py-6 bg-gradient-to-br from-teal-500 to-emerald-600">
          <h2 className="text-white text-lg font-semibold">Selamat Datang! 👋</h2>
          <p className="text-teal-100 text-sm mt-1">Temukan obat sesuai keluhanmu</p>
        </div>

        {/* Category Sections */}
        <div className="px-5 py-6 space-y-8">
          {categories.map((category) => (
            <section
              key={category.id}
              ref={(el) => {
                if (el) categoryRefs.current.set(category.id, el);
              }}
              className="space-y-4"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
              </div>

              {/* Drug Cards */}
              <div className="grid grid-cols-2 gap-3">
                {drugsByCategory[category.id]?.map((drug) => (
                  <div
                    key={drug.id}
                    onClick={(e) => handleDrugCardClick(drug, e)}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    {/* Drug Icon */}
                    <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center text-2xl mb-3">
                      {drug.image}
                    </div>

                    {/* Drug Info */}
                    <h4 className="font-medium text-gray-800 text-sm leading-tight line-clamp-2">
                      {drug.name}
                    </h4>
                    <p className="text-teal-600 font-semibold text-sm mt-2">
                      {formatPrice(drug.price)}
                    </p>

                    {/* Detail Button */}
                    <button
                      onClick={(e) => handleDetailButtonClick(drug, e)}
                      className="w-full mt-3 py-2 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      Lihat Detail
                    </button>
                  </div>
                ))}
              </div>

              {/* Category Dwell Time Indicator (Debug) */}
              {categoryDwellTimes.get(category.id) && (
                <div className="text-xs text-gray-400 text-right">
                  👁 Dilihat: {Math.round((categoryDwellTimes.get(category.id) || 0) / 1000)}s
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Spacer for bottom navigation */}
        <div className="h-4"></div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" />

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-white">Interaction Logs</h3>
                <p className="text-teal-100 text-xs">{interactionLogs.length} total events</p>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-white/80 hover:text-white active:scale-90 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="p-4 bg-teal-50 border-b">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-teal-700">
                    {interactionLogs.filter(l => l.event_type === 'scroll').length}
                  </p>
                  <p className="text-xs text-gray-500">Scroll Events</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-teal-700">
                    {interactionLogs.filter(l => l.event_type === 'dwell').length}
                  </p>
                  <p className="text-xs text-gray-500">Dwell Records</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-teal-700">
                    {interactionLogs.filter(l => l.event_type.includes('click')).length}
                  </p>
                  <p className="text-xs text-gray-500">Click Events</p>
                </div>
              </div>
            </div>

            {/* Category Dwell Summary */}
            {categoryDwellTimes.size > 0 && (
              <div className="p-4 border-b">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Reading Attention per Category</h4>
                <div className="space-y-2">
                  {categories.map(cat => {
                    const dwellTime = categoryDwellTimes.get(cat.id) || 0;
                    const maxDwell = Math.max(...Array.from(categoryDwellTimes.values()), 1);
                    const percentage = (dwellTime / maxDwell) * 100;
                    
                    return (
                      <div key={cat.id} className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">{cat.name}</span>
                            <span className="text-gray-500">{(dwellTime / 1000).toFixed(1)}s</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-teal-500 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Logs List */}
            <div className="p-4 overflow-y-auto max-h-[300px]">
              <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(interactionLogs.slice(-20), null, 2)}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex gap-3">
              <button
                onClick={exportLogs}
                className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={() => {
                  setInteractionLogs([]);
                  setCategoryDwellTimes(new Map());
                }}
                className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
