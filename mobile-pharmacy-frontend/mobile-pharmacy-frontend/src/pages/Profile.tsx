import { ChevronRight, ClipboardList, CreditCard, HelpCircle, Lock, LogOut, Mail, MapPin, Menu, Smartphone, Star, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

interface UserData {
  nama: string;
  email: string;
  telepon: string;
  alamat: string;
}

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
}

function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>({
    nama: 'Pengguna',
    email: 'user@example.com',
    telepon: '08xxxxxxxxxx',
    alamat: 'Alamat belum diisi',
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Load user data from sessionStorage (saved during registration)
  useEffect(() => {
    const savedName = sessionStorage.getItem('userName');
    const savedFormData = sessionStorage.getItem('registrationFormData');
    
    if (savedFormData) {
      try {
        const formData = JSON.parse(savedFormData);
        setUserData({
          nama: formData.nama || savedName || 'Pengguna',
          email: formData.email || 'user@example.com',
          telepon: formData.telepon || '08xxxxxxxxxx',
          alamat: formData.alamat || 'Alamat belum diisi',
        });
      } catch {
        // If parsing fails, use defaults
        if (savedName) {
          setUserData(prev => ({ ...prev, nama: savedName }));
        }
      }
    } else if (savedName) {
      setUserData(prev => ({ ...prev, nama: savedName }));
    }
  }, []);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Menu items
  const menuItems: MenuItem[] = [
    {
      id: 'orders',
      icon: <ClipboardList className="w-6 h-6" />,
      label: 'Riwayat Pesanan',
      description: 'Lihat semua transaksi Anda',
      badge: '3',
    },
    {
      id: 'payment',
      icon: <CreditCard className="w-6 h-6" />,
      label: 'Metode Pembayaran',
      description: 'Kelola kartu dan e-wallet',
    },
    {
      id: 'help',
      icon: <HelpCircle className="w-6 h-6" />,
      label: 'Pusat Bantuan',
      description: 'FAQ dan layanan pelanggan',
    },
    {
      id: 'privacy',
      icon: <Lock className="w-6 h-6" />,
      label: 'Pengaturan Privasi',
      description: 'Kelola data dan keamanan',
    },
  ];

  const handleLogout = () => {
    // Clear all session data
    sessionStorage.removeItem('userLoggedIn');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('registrationFormData');
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 pt-8 pb-6 px-6 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-teal-400/20 rounded-full blur-3xl"></div>
        </div>

        {/* Header Content */}
        <div className="relative z-10 text-center">
          {/* Avatar */}
          <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-xl border-4 border-white/30">
            <span className="text-2xl font-bold text-teal-700">
              {getInitials(userData.nama)}
            </span>
          </div>

          {/* Name */}
          <h1 className="text-xl font-bold text-white mt-4">{userData.nama}</h1>
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 bg-amber-400/90 text-amber-900 px-3 py-1 rounded-full text-xs font-semibold mt-2">
            <Star className="w-3.5 h-3.5" fill="currentColor" />
            Member Platinum
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-4 pb-24 overflow-y-auto">
        {/* Data Card */}
        <div className="mx-4 bg-white rounded-2xl shadow-lg">
          {/* Section Header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Data Demografis
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Data dari pendaftaran akun</p>
          </div>

          {/* Data Fields */}
          <div className="p-5 space-y-4">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">Email</p>
                <p className="text-sm text-gray-800 break-all">{userData.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">Nomor Telepon</p>
                <p className="text-sm text-gray-800">{userData.telepon}</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">Alamat Lengkap</p>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{userData.alamat}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-lg">
          {/* Section Header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Menu className="w-5 h-5 text-teal-600" />
              Menu Lainnya
            </h2>
          </div>

          {/* Menu Items */}
          <div className="divide-y divide-gray-100">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center shrink-0 text-teal-600">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mx-4 mt-6">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-4 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 font-semibold rounded-2xl hover:from-red-100 hover:to-rose-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-red-100/50 shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            Keluar dari Akun
          </button>
        </div>

        {/* App Version */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Mobile Pharmacy v1.0
        </p>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
            {/* Modal Content */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Keluar dari Akun?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Anda yakin ingin keluar? Data sesi Anda akan dihapus.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-4 text-gray-600 font-medium hover:bg-gray-50 transition-colors border-r border-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-4 text-red-600 font-semibold hover:bg-red-50 transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
