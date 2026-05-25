import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface BottomNavigationProps {
  activeTab?: 'home' | 'search' | 'cart' | 'profile';
}

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Beranda',
    path: '/home',
    icon: Home,
  },
  {
    id: 'search',
    label: 'Cari',
    path: '/search',
    icon: Search,
  },
  {
    id: 'cart',
    label: 'Keranjang',
    path: '/cart',
    icon: ShoppingCart,
  },
  {
    id: 'profile',
    label: 'Profil',
    path: '/profile',
    icon: User,
  },
];

function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (path: string) => {
    navigate(path);
  };

  const getActiveTab = () => {
    if (activeTab) return activeTab;
    const currentPath = location.pathname;
    const item = NAV_ITEMS.find(item => currentPath.startsWith(item.path));
    return item?.id || 'home';
  };

  const currentActive = getActiveTab();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-2xl shadow-gray-200/50 z-50">
      <div className="flex justify-around items-center py-2 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentActive === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.path)}
              className={`relative flex flex-col items-center gap-0.5 px-5 py-2.5 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-b from-teal-50 to-teal-100/50 shadow-sm' 
                  : 'hover:bg-gray-50 active:scale-95'
              }`}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                <Icon 
                  className={`w-6 h-6 transition-all ${isActive ? 'text-teal-600' : 'text-gray-400'}`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  fill={isActive ? 'currentColor' : 'none'}
                />
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wide transition-all ${
                  isActive ? 'text-teal-600' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-2 w-8 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white/95" />
    </div>
  );
}

export default BottomNavigation;
