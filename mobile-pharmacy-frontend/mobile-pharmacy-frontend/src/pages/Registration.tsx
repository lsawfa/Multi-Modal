import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, FlaskConical } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogger } from '../context/LoggerContext';
import { ExportData, KeyboardBiometricsSummary } from '../utils/BiometricLogger';

interface FormData {
  nama: string;
  email: string;
  telepon: string;
  alamat: string;
}

interface FormErrors {
  nama?: string;
  email?: string;
  telepon?: string;
  alamat?: string;
}

interface BiometricsData {
  form_data?: FormData;
  biometric_data: ExportData;
  keyboard_biometrics_summary: KeyboardBiometricsSummary;
  submission_timestamp?: number;
}

function Registration() {
  const navigate = useNavigate();
  const { getExportData, getKeyboardBiometrics, eventCount, isRecording } = useLogger();
  
  // Split screen states
  const [showForm, setShowForm] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nama: '',
    email: '',
    telepon: '',
    alamat: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [biometricsData, setBiometricsData] = useState<BiometricsData | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Welcome screen animation sequence
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Step 1: Show "Selamat Datang" (after 500ms)
    timers.push(setTimeout(() => setWelcomeStep(1), 500));
    
    // Step 2: Show "di" (after 1200ms)
    timers.push(setTimeout(() => setWelcomeStep(2), 1200));
    
    // Step 3: Show "Mobile Pharmacy" (after 1800ms)
    timers.push(setTimeout(() => setWelcomeStep(3), 1800));
    
    // Step 4: Show tagline & button (after 2500ms)
    timers.push(setTimeout(() => setWelcomeStep(4), 2500));

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Handle start button click - trigger split screen
  const handleStart = () => {
    setShowForm(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama wajib diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.telepon.trim()) {
      newErrors.telepon = 'Nomor telepon wajib diisi';
    } else if (!/^[0-9+\-\s()]{10,15}$/.test(formData.telepon)) {
      newErrors.telepon = 'Format nomor telepon tidak valid';
    }

    if (!formData.alamat.trim()) {
      newErrors.alamat = 'Alamat wajib diisi';
    } else if (formData.alamat.trim().length < 50) {
      newErrors.alamat = `Alamat minimal 50 karakter (saat ini: ${formData.alamat.trim().length} karakter)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    if (validateForm()) {
      const exportData = getExportData();
      const keyboardBiometrics = getKeyboardBiometrics();
      
      const submissionData: BiometricsData = {
        form_data: formData,
        biometric_data: exportData,
        keyboard_biometrics_summary: keyboardBiometrics,
        submission_timestamp: Date.now()
      };

      // Save form data to sessionStorage for Profile page
      sessionStorage.setItem('registrationFormData', JSON.stringify(formData));
      sessionStorage.setItem('userName', formData.nama);

      setBiometricsData(submissionData);
      setSubmitted(true);
      
      console.log('Form Submission with Biometrics:', submissionData);
    }
  };

  const handleViewBiometrics = (): void => {
    const exportData = getExportData();
    const keyboardBiometrics = getKeyboardBiometrics();
    setBiometricsData({
      biometric_data: exportData,
      keyboard_biometrics_summary: keyboardBiometrics
    });
    setShowBiometrics(true);
  };

  const downloadBiometrics = (): void => {
    const exportData = getExportData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biometric_data_${exportData.session_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoginClick = (): void => {
    navigate('/login');
  };

  // Success screen after form submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 py-5 px-6">
            <h1 className="text-center text-lg font-semibold text-white tracking-wide">
              REGISTRASI BERHASIL
            </h1>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-8 h-8 text-teal-600" />
              </motion.div>
              <p className="text-gray-600">Data biometrik Anda telah berhasil dikumpulkan</p>
            </div>

            <div className="bg-teal-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-teal-800 mb-3 text-sm">Ringkasan Data:</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Total Events:</span>
                  <span className="ml-2 font-medium">{biometricsData?.biometric_data?.total_events || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Keystrokes:</span>
                  <span className="ml-2 font-medium">{biometricsData?.keyboard_biometrics_summary?.total_keystrokes || 0}</span>
                </div>
                {biometricsData?.keyboard_biometrics_summary?.hold_time_stats && (
                  <>
                    <div>
                      <span className="text-gray-500">Avg Hold:</span>
                      <span className="ml-2 font-medium">
                        {biometricsData.keyboard_biometrics_summary.hold_time_stats.mean.toFixed(1)} ms
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Avg Flight:</span>
                      <span className="ml-2 font-medium">
                        {biometricsData.keyboard_biometrics_summary.flight_time_stats?.mean.toFixed(1) || 'N/A'} ms
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={downloadBiometrics}
                className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                DOWNLOAD DATA JSON
              </button>
              <button
                onClick={() => navigate('/home')}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                LANJUT KE PENCARIAN
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ nama: '', email: '', telepon: '', alamat: '' });
                }}
                className="w-full bg-teal-100 text-teal-700 py-3 px-4 rounded-lg font-medium hover:bg-teal-200 transition-colors"
              >
                RESET FORM
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Split Screen Layout
  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Welcome Panel (Left on desktop, Top on mobile) */}
      <motion.div
        layout
        initial={{ flex: isMobile ? '1 0 100%' : '1 0 100%' }}
        animate={{
          flex: showForm ? (isMobile ? '0 0 35%' : '0 0 45%') : '1 0 100%',
        }}
        transition={{ 
          duration: 0.8, 
          ease: [0.4, 0, 0.2, 1],
          layout: { duration: 0.8 }
        }}
        className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 flex items-center justify-center p-6 relative overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Welcome Content */}
        <motion.div 
          layout
          className="text-center relative z-10"
          animate={{
            scale: showForm ? 0.85 : 1,
          }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo/Icon */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: welcomeStep >= 1 ? 1 : 0, 
              scale: welcomeStep >= 1 ? 1 : 0.5 
            }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className={`${showForm ? 'w-16 h-16 md:w-20 md:h-20' : 'w-24 h-24'} bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto shadow-2xl transition-all duration-500`}>
              <FlaskConical className={`${showForm ? 'w-10 h-10 md:w-12 md:h-12' : 'w-14 h-14'} text-white transition-all duration-500`} />
            </div>
          </motion.div>

          {/* Welcome Text - Collapsed when form shows */}
          <AnimatePresence>
            {!showForm && (
              <motion.div 
                className="space-y-2"
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Selamat Datang */}
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: welcomeStep >= 1 ? 1 : 0, 
                    y: welcomeStep >= 1 ? 0 : 20 
                  }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl md:text-4xl font-light text-white/90"
                >
                  Selamat Datang
                </motion.h1>

                {/* di */}
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: welcomeStep >= 2 ? 1 : 0, 
                    y: welcomeStep >= 2 ? 0 : 20 
                  }}
                  transition={{ duration: 0.5 }}
                  className="text-xl text-white/70"
                >
                  di
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Pharmacy - Always visible, becomes branding */}
          <motion.h2 
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: welcomeStep >= 3 ? 1 : 0, 
              y: welcomeStep >= 3 ? 0 : 20,
              scale: 1
            }}
            transition={{ duration: 0.7 }}
            className={`font-bold text-white ${
              showForm 
                ? 'text-xl md:text-2xl mt-2' 
                : 'text-4xl md:text-5xl'
            } transition-all duration-500`}
          >
            Mobile Pharmacy
          </motion.h2>

          {/* Tagline - Hidden when form shows on mobile */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: welcomeStep >= 4 ? (showForm && isMobile ? 0 : 1) : 0, 
              y: welcomeStep >= 4 ? 0 : 20,
              height: showForm && isMobile ? 0 : 'auto'
            }}
            transition={{ duration: 0.5 }}
            className={`text-emerald-200 mt-4 ${showForm ? 'text-xs md:text-sm' : 'text-sm md:text-base'}`}
          >
            Solusi kesehatan digital di genggaman Anda
          </motion.p>

          {/* Mulai Button - Hidden when form shows */}
          <AnimatePresence>
            {!showForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: welcomeStep >= 4 ? 1 : 0, 
                  y: welcomeStep >= 4 ? 0 : 20 
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                className="mt-10"
              >
                <button
                  onClick={handleStart}
                  className="px-10 py-4 bg-white text-teal-700 font-semibold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 mx-auto group"
                >
                  <span>Mulai Registrasi</span>
                  <svg 
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                
                {/* Skip text */}
                <p className="text-white/40 text-xs mt-6">
                  Tekan tombol untuk memulai pendaftaran
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login link when form is shown */}
          <AnimatePresence>
            {showForm && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleLoginClick}
                className="mt-4 text-white/70 text-sm hover:text-white underline transition-colors"
              >
                Sudah punya akun? Masuk
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Registration Form Panel (Right on desktop, Bottom on mobile) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ 
              x: isMobile ? 0 : '100%', 
              y: isMobile ? '100%' : 0,
              opacity: 0 
            }}
            animate={{ 
              x: 0, 
              y: 0,
              opacity: 1 
            }}
            exit={{ 
              x: isMobile ? 0 : '100%', 
              y: isMobile ? '100%' : 0,
              opacity: 0 
            }}
            transition={{ 
              duration: 0.8, 
              ease: [0.4, 0, 0.2, 1] 
            }}
            className={`bg-gradient-to-br from-teal-50 to-emerald-50 flex-1 overflow-y-auto ${
              isMobile ? 'min-h-[65vh]' : 'min-h-screen'
            }`}
          >
            <div className="max-w-lg mx-auto p-6 md:p-8">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mb-6"
              >
                <h2 className="text-2xl font-bold text-gray-800">Registrasi Akun</h2>
                <p className="text-gray-500 text-sm mt-1">Lengkapi data diri Anda untuk melanjutkan</p>
              </motion.div>

              {/* Progress Bar */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mb-6"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-teal-700 font-medium">Langkah 1/1</span>
                  <span className="text-xs text-teal-500">{eventCount} events</span>
                </div>
                <div className="w-full bg-teal-100 rounded-full h-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.6, duration: 1 }}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full"
                  />
                </div>
                {/* Recording indicator */}
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-teal-600">
                    {isRecording ? 'Merekam biometrik...' : 'Tidak merekam'}
                  </span>
                </div>
              </motion.div>

              {/* Form */}
              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {/* Nama Lengkap */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="nama"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none transition-all bg-white ${
                      errors.nama ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Masukkan nama lengkap"
                  />
                  {errors.nama && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.nama}
                    </p>
                  )}
                </motion.div>

                {/* Alamat Email */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none transition-all bg-white ${
                      errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="contoh@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </motion.div>

                {/* Nomor Telepon */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <label htmlFor="telepon" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    id="telepon"
                    name="telepon"
                    value={formData.telepon}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none transition-all bg-white ${
                      errors.telepon ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="08xxxxxxxxxx"
                  />
                  {errors.telepon && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.telepon}
                    </p>
                  )}
                </motion.div>

                {/* Alamat Lengkap */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Alamat Lengkap
                    <span className="text-gray-400 font-normal ml-1 text-xs">(min. 50 karakter)</span>
                  </label>
                  <textarea
                    id="alamat"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none transition-all resize-none bg-white ${
                      errors.alamat ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Masukkan alamat lengkap termasuk RT/RW, kelurahan, kecamatan, kota, dan kode pos"
                  />
                  <div className="flex justify-between mt-1.5">
                    {errors.alamat ? (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.alamat}
                      </p>
                    ) : (
                      <span></span>
                    )}
                    <span className={`text-xs font-medium ${formData.alamat.length >= 50 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {formData.alamat.length}/50
                    </span>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-teal-500 hover:to-emerald-500 focus:ring-4 focus:ring-teal-300 transition-all tracking-wide shadow-lg shadow-teal-600/30"
                >
                  DAFTAR SEKARANG
                </motion.button>
              </motion.form>

              {/* View Biometrics Button (for debugging) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.4 }}
                className="mt-6"
              >
                <button
                  type="button"
                  onClick={handleViewBiometrics}
                  className="w-full bg-white text-teal-600 py-3 px-4 rounded-xl text-sm hover:bg-teal-50 transition-colors border-2 border-teal-100"
                >
                  📊 Lihat Data Biometrik
                </button>
              </motion.div>

              {/* Mobile: Login link at bottom */}
              {isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.4 }}
                  className="mt-6 text-center pb-4"
                >
                  <p className="text-sm text-gray-600">
                    Sudah punya akun?{' '}
                    <button
                      type="button"
                      onClick={handleLoginClick}
                      className="text-teal-700 font-medium hover:underline focus:outline-none"
                    >
                      Masuk di sini
                    </button>
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Biometrics Modal */}
      <AnimatePresence>
        {showBiometrics && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 flex justify-between items-center">
                <h3 className="font-semibold text-white">Data Biometrik Real-time</h3>
                <button
                  onClick={() => setShowBiometrics(false)}
                  className="text-white/80 hover:text-white transition-colors active:scale-90"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(biometricsData, null, 2)}
                </pre>
              </div>
              <div className="p-4 border-t">
                <button
                  onClick={downloadBiometrics}
                  className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                >
                  Download JSON
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Registration;
