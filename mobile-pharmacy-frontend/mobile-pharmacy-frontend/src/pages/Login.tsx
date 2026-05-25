import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Eye, EyeOff, FlaskConical, Lock, User } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Fixed credentials for pharmacist
const PHARMACIST_CREDENTIALS = {
  username: 'apoteker',
  password: 'pharma123'
};

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi');
      return;
    }

    // Check if pharmacist credentials
    if (username === PHARMACIST_CREDENTIALS.username && password === PHARMACIST_CREDENTIALS.password) {
      // Store pharmacist session
      sessionStorage.setItem('pharmacistLoggedIn', 'true');
      sessionStorage.setItem('pharmacistName', 'Apt. Sarah Wijaya, S.Farm');
      navigate('/pharmacist');
    } else {
      // Regular user login - accept any credentials for demo
      sessionStorage.setItem('userLoggedIn', 'true');
      sessionStorage.setItem('userName', username);
      navigate('/home');
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Branding Panel (Left on desktop, Top on mobile) */}
      <motion.div
        initial={{ flex: isMobile ? '0 0 35%' : '0 0 45%' }}
        animate={{ flex: isMobile ? '0 0 35%' : '0 0 45%' }}
        className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 flex items-center justify-center p-6 relative overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Branding Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 0.85 }}
          transition={{ duration: 0.5 }}
          className="text-center relative z-10"
        >
          {/* Logo/Icon */}
          <div className="mb-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <FlaskConical className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
          </div>

          {/* Branding Text */}
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Mobile Pharmacy
          </h2>

          {/* Tagline - Hidden on mobile */}
          {!isMobile && (
            <p className="text-emerald-200 mt-2 text-xs md:text-sm">
              Solusi kesehatan digital di genggaman Anda
            </p>
          )}

          {/* Back to Registration link */}
          <button
            onClick={() => navigate('/register')}
            className="mt-4 text-white/70 text-sm hover:text-white underline transition-colors flex items-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Belum punya akun? Daftar
          </button>
        </motion.div>
      </motion.div>

      {/* Login Form Panel (Right on desktop, Bottom on mobile) */}
      <motion.div
        initial={{ opacity: 0, x: isMobile ? 0 : 50, y: isMobile ? 50 : 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-teal-50 to-emerald-50 flex-1 overflow-y-auto"
      >
        <div className="max-w-lg mx-auto p-6 md:p-8 flex flex-col justify-center min-h-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-800">Masuk ke Akun</h2>
            <p className="text-gray-500 text-sm mt-1">Selamat datang kembali!</p>
          </motion.div>

          {/* Form */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username Field */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none transition-all bg-white border-gray-200 hover:border-gray-300"
                  placeholder="Masukkan username"
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none transition-all bg-white border-gray-200 hover:border-gray-300"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Login Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-teal-500 hover:to-emerald-500 focus:ring-4 focus:ring-teal-300 transition-all tracking-wide shadow-lg shadow-teal-600/30"
            >
              MASUK
            </motion.button>
          </motion.form>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-6 bg-white border-2 border-teal-100 rounded-xl p-4"
          >
            <p className="text-xs text-teal-700 text-center">
              <span className="font-semibold">ℹ️ Informasi:</span><br />
              User biasa dapat masuk dengan username & password apapun.<br />
              <span className="text-teal-600 font-medium">Apoteker:</span> username = <code className="bg-teal-100 px-1.5 py-0.5 rounded text-teal-800">apoteker</code> | password = <code className="bg-teal-100 px-1.5 py-0.5 rounded text-teal-800">pharma123</code>
            </p>
          </motion.div>

          {/* Mobile: Back link at bottom */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="mt-6 text-center pb-4"
            >
              <p className="text-sm text-gray-600">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-teal-700 font-medium hover:underline focus:outline-none"
                >
                  Daftar di sini
                </button>
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
