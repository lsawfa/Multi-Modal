import { Check, CheckCircle, Clock, FileText, LogOut, User, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Order status type
type OrderStatus = 'pending' | 'approved' | 'rejected';

// Order interface
interface Order {
  id: string;
  sessionId: string;
  userName: string;
  uploadTimestamp: number;
  prescriptionImage: string | null;
  status: OrderStatus;
  verifiedAt: number | null;
  verifiedBy: string | null;
  notes: string;
}

// Mock orders data - in real app this would come from database
const generateMockOrders = (): Order[] => {
  const statuses: OrderStatus[] = ['pending', 'pending', 'pending', 'approved', 'rejected', 'pending'];
  const names = ['Ahmad Rizki', 'Siti Nurhaliza', 'Budi Santoso', 'Maria Putri', 'Doni Pratama', 'Rina Amelia'];
  
  return statuses.map((status, index) => ({
    id: `ORD-${String(1001 + index).padStart(4, '0')}`,
    sessionId: `sess_${Date.now() - Math.random() * 86400000}_${Math.random().toString(36).substring(2, 8)}`,
    userName: names[index],
    uploadTimestamp: Date.now() - Math.random() * 3600000 * (index + 1),
    prescriptionImage: index % 2 === 0 ? '/sample-prescription.jpg' : null, // Placeholder
    status,
    verifiedAt: status !== 'pending' ? Date.now() - Math.random() * 1800000 : null,
    verifiedBy: status !== 'pending' ? 'Apt. Sarah Wijaya' : null,
    notes: status === 'rejected' ? 'Resep tidak terbaca dengan jelas' : '',
  }));
};

function PharmacistDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');
  const [showDetail, setShowDetail] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pharmacistName] = useState(() => 
    sessionStorage.getItem('pharmacistName') || 'Apt. Sarah Wijaya, S.Farm'
  );

  // Initialize mock orders
  useEffect(() => {
    // Check if there are orders in localStorage (from user uploads)
    const savedOrders = localStorage.getItem('pharmacyOrders');
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        setOrders(parsed);
      } catch {
        setOrders(generateMockOrders());
      }
    } else {
      setOrders(generateMockOrders());
    }
  }, []);

  // Save orders to localStorage when changed
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('pharmacyOrders', JSON.stringify(orders));
    }
  }, [orders]);

  // Filter orders
  const filteredOrders = orders.filter(order => 
    filterStatus === 'all' ? true : order.status === filterStatus
  );

  // Get status counts
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle order selection
  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetail(true);
    setRejectReason('');
  };

  // Handle approve order
  const handleApprove = useCallback(() => {
    if (!selectedOrder) return;

    setOrders(prev => prev.map(order => 
      order.id === selectedOrder.id
        ? {
            ...order,
            status: 'approved' as OrderStatus,
            verifiedAt: Date.now(),
            verifiedBy: pharmacistName,
          }
        : order
    ));

    setShowDetail(false);
    setSelectedOrder(null);
  }, [selectedOrder, pharmacistName]);

  // Handle reject order
  const handleReject = useCallback(() => {
    if (!selectedOrder) return;

    setOrders(prev => prev.map(order => 
      order.id === selectedOrder.id
        ? {
            ...order,
            status: 'rejected' as OrderStatus,
            verifiedAt: Date.now(),
            verifiedBy: pharmacistName,
            notes: rejectReason || 'Resep tidak valid',
          }
        : order
    ));

    setShowRejectModal(false);
    setShowDetail(false);
    setSelectedOrder(null);
    setRejectReason('');
  }, [selectedOrder, pharmacistName, rejectReason]);

  const handleLogout = () => {
    sessionStorage.removeItem('pharmacistLoggedIn');
    sessionStorage.removeItem('pharmacistName');
    navigate('/register');
  };

  // Get status badge
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Menunggu
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <Check className="w-3.5 h-3.5" />
            Disetujui
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <X className="w-3.5 h-3.5" />
            Ditolak
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Dashboard Verifikasi Resep</h1>
                <p className="text-xs text-gray-500">Mobile Pharmacy System</p>
              </div>
            </div>

            {/* Pharmacist Profile */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{pharmacistName}</p>
                <p className="text-xs text-teal-600">Apoteker Bertugas</p>
              </div>
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-teal-600" />
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{statusCounts.all}</p>
                <p className="text-xs text-gray-500">Total Resep</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{statusCounts.pending}</p>
                <p className="text-xs text-gray-500">Menunggu</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
                <p className="text-xs text-gray-500">Disetujui</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
                <p className="text-xs text-gray-500">Ditolak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  filterStatus === status
                    ? 'border-teal-600 text-teal-600 bg-teal-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {status === 'all' && 'Semua'}
                {status === 'pending' && 'Menunggu'}
                {status === 'approved' && 'Disetujui'}
                {status === 'rejected' && 'Ditolak'}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  filterStatus === status
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {statusCounts[status]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ID Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pasien
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Session ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Waktu Upload
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Tidak ada resep pada kategori ini
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectOrder(order)}
                    >
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm font-medium text-gray-800">{order.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700">{order.userName}</span>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="font-mono text-xs text-gray-500 truncate max-w-[150px] block">
                          {order.sessionId.substring(0, 20)}...
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">{formatTime(order.uploadTimestamp)}</span>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail Side Panel */}
      {showDetail && selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDetail(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Detail Verifikasi</h2>
                <p className="text-sm text-gray-500">{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Panel Content */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Informasi Order</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Pasien</span>
                    <span className="text-sm font-medium text-gray-800">{selectedOrder.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Session ID</span>
                    <span className="text-xs font-mono text-gray-600 max-w-[200px] truncate">
                      {selectedOrder.sessionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Waktu Upload</span>
                    <span className="text-sm text-gray-800">{formatTime(selectedOrder.uploadTimestamp)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Status</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  {selectedOrder.verifiedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Diverifikasi</span>
                      <span className="text-sm text-gray-800">{formatTime(selectedOrder.verifiedAt)}</span>
                    </div>
                  )}
                  {selectedOrder.notes && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-500">Catatan:</span>
                      <p className="text-sm text-red-600 mt-1">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prescription Preview */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Pratinjau Resep</h3>
                <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 min-h-[300px] flex items-center justify-center">
                  {selectedOrder.prescriptionImage ? (
                    <img
                      src={selectedOrder.prescriptionImage}
                      alt="Prescription"
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <svg className="w-16 h-16 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500 text-sm">Gambar resep tidak tersedia</p>
                      <p className="text-gray-400 text-xs mt-1">(Demo Mode)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedOrder.status === 'pending' && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Tindakan</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 active:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/30"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Setujui Pesanan
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 active:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Tolak Resep
                    </button>
                  </div>
                </div>
              )}

              {/* Already verified info */}
              {selectedOrder.status !== 'pending' && (
                <div className={`p-4 rounded-lg ${
                  selectedOrder.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {selectedOrder.status === 'approved' ? (
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <div>
                      <p className={`font-semibold ${
                        selectedOrder.status === 'approved' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {selectedOrder.status === 'approved' ? 'Pesanan Telah Disetujui' : 'Resep Telah Ditolak'}
                      </p>
                      <p className="text-sm text-gray-600">
                        oleh {selectedOrder.verifiedBy} pada {selectedOrder.verifiedAt && formatTime(selectedOrder.verifiedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Tolak Resep</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Berikan alasan penolakan resep ini
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Resep tidak terbaca dengan jelas, foto buram, dll."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={3}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom animation style */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default PharmacistDashboard;
