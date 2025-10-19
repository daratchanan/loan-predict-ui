// ============================================
// components/dashboard/AdminDashboard.tsx
// Dashboard Component เฉพาะสำหรับ Admin
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoanApplicationDialog } from '@/components/loan/LoanApplicationDialog';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, TrendingUp, Calendar, RefreshCw, LogOut, Plus, Filter, X } from 'lucide-react';

export function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [modelPerformance, setModelPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    prediction_filter: '',
    purpose_filter: '',
    sort_by: '',
    sort_order: 'desc',
    page: 1,
    page_size: 10,
  });

  const loadData = async (queryParams?: Record<string, any>) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const params = queryParams || buildQueryParams();
      const [dashboard, performance] = await Promise.all([
        api.getDashboard(token, params),
        api.getModelPerformance(token),
      ]);
      setDashboardData(dashboard);
      setModelPerformance(performance);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildQueryParams = () => {
    const params: Record<string, any> = {};
    
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.prediction_filter !== '') params.prediction_filter = filters.prediction_filter;
    if (filters.purpose_filter) params.purpose_filter = filters.purpose_filter;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_order) params.sort_order = filters.sort_order;
    if (filters.page) params.page = filters.page;
    if (filters.page_size) params.page_size = filters.page_size;

    return params;
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const applyFilters = () => {
    loadData();
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      prediction_filter: '',
      purpose_filter: '',
      sort_by: '',
      sort_order: 'desc',
      page: 1,
      page_size: 10,
    });
    loadData({});
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    loadData({ ...buildQueryParams(), page: newPage });
  };

  const handleRetrain = async () => {
    if (!confirm('คุณต้องการ Retrain Model ใช่หรือไม่?') || !token) return;
    
    setRetraining(true);
    try {
      await api.retrainModel(token);
      alert('เริ่มกระบวนการ Retrain Model แล้ว');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRetraining(false);
    }
  };

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ระบบคาดการณ์การอนุมัติสินเชื่อ - Admin</h1>
            <p className="text-sm text-gray-600">
              ผู้ใช้: {user?.username} ({user?.roles.map(r => r.name).join(', ')})
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 bg-[#ff9933] text-white px-4 py-2 rounded-lg hover:bg-[#e68a2e]"
            >
              <Plus size={20} />
              สร้างใบสมัคร
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              <LogOut size={20} />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* Model Performance */}
        {modelPerformance && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">ประสิทธิภาพของโมเดล</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="border-r pr-4">
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-xl font-bold text-gray-800">
                  {(modelPerformance.accuracy * 100).toFixed(1)}%
                </p>
              </div>
              <div className="border-r pr-4">
                <p className="text-sm text-gray-600">Precision</p>
                <p className="text-xl font-bold text-gray-800">
                  {(modelPerformance.precision_class_1 * 100).toFixed(1)}%
                </p>
              </div>
              <div className="border-r pr-4">
                <p className="text-sm text-gray-600">Recall</p>
                <p className="text-xl font-bold text-gray-800">
                  {(modelPerformance.recall_class_1 * 100).toFixed(1)}%
                </p>
              </div>
              <div className="border-r pr-4">
                <p className="text-sm text-gray-600">F1 Score</p>
                <p className="text-xl font-bold text-gray-800">
                  {(modelPerformance.f1_score_class_1 * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Threshold</p>
                <p className="text-xl font-bold text-gray-800">
                  {modelPerformance.optimal_threshold?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ใบสมัครทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-800">{dashboardData?.total_applications || 0}</p>
              </div>
              <FileText className="text-[#ff9933]" size={40} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">อัตราการอนุมัติ</p>
                <p className="text-3xl font-bold text-green-600">
                  {dashboardData?.approval_rate_30_days?.toFixed(1) || 0}%
                </p>
              </div>
              <TrendingUp className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Model Version</p>
                <p className="text-lg font-bold text-gray-800">{modelPerformance?.model_version || 'N/A'}</p>
                <p className="text-xs text-gray-500">Accuracy: {(modelPerformance?.accuracy * 100).toFixed(1)}%</p>
              </div>
              <Calendar className="text-blue-600" size={40} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">ผลการพิจารณา</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData?.prediction_breakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, value }) => `${label}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(dashboardData?.prediction_breakdown || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                {/* <Legend /> */}
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">วัตถุประสงค์การกู้</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData?.purpose_breakdown || []}>
                <XAxis dataKey="label" angle={-45} textAnchor="end" height={100} style={{ fontSize: '12px' }}/>
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ff9933" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Recent Applications Table with Filters */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">ใบสมัครล่าสุด</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter size={18} />
              {showFilters ? 'ซ่อนตัวกรอง' : 'แสดงตัวกรอง'}
            </button>
          </div>

          {showFilters && (
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ผลการพิจารณา
                  </label>
                  <select
                    value={filters.prediction_filter}
                    onChange={(e) => handleFilterChange('prediction_filter', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none text-sm"
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="0">ผ่านเกณฑ์</option>
                    <option value="1">ไม่ผ่านเกณฑ์</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วัตถุประสงค์
                  </label>
                  <select
                    value={filters.purpose_filter}
                    onChange={(e) => handleFilterChange('purpose_filter', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none text-sm"
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="debt_consolidation">รวมหนี้</option>
                    <option value="credit_card">บัตรเครดิต</option>
                    <option value="home_improvement">ปรับปรุงบ้าน</option>
                    <option value="educational">การศึกษา</option>
                    <option value="small_business">ธุรกิจขนาดเล็ก</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เรียงตาม
                  </label>
                  <select
                    value={filters.sort_by}
                    onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none text-sm"
                  >
                    <option value="">ค่าเริ่มต้น</option>
                    <option value="int_rate">อัตราดอกเบี้ย</option>
                    <option value="model_probability">ความน่าจะเป็น</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ลำดับ
                  </label>
                  <select
                    value={filters.sort_order}
                    onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none text-sm"
                  >
                    <option value="desc">มากไปน้อย</option>
                    <option value="asc">น้อยไปมาก</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนต่อหน้า
                  </label>
                  <select
                    value={filters.page_size}
                    onChange={(e) => handleFilterChange('page_size', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none text-sm"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={applyFilters}
                    className="flex-1 bg-[#ff9933] text-white px-4 py-2 rounded-lg hover:bg-[#e68a2e] transition-colors text-sm"
                  >
                    ค้นหา
                  </button>
                  <button
                    onClick={clearFilters}
                    className="flex items-center justify-center bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    title="ล้างตัวกรอง"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">FICO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วัตถุประสงค์</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ดอกเบี้ย</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ผลการพิจารณา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ความเสี่ยงผิดนัด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dashboardData?.recent_applications?.items?.length > 0 ? (
                  dashboardData.recent_applications.items.map((app: any) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{app.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(app.application_date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{app.fico}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{app.purpose}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(app.int_rate * 100).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          app.model_prediction === 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {app.model_prediction === 0 ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(app.model_probability * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      ไม่พบข้อมูลใบสมัคร
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {dashboardData?.recent_applications?.total_pages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">
                  หน้า {dashboardData.recent_applications.current_page} จาก {dashboardData.recent_applications.total_pages}
                </p>
                <span className="text-sm text-gray-500">
                  ({dashboardData.recent_applications.total_items} รายการ)
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ก่อนหน้า
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, dashboardData.recent_applications.total_pages) }, (_, i) => {
                    let pageNum;
                    if (dashboardData.recent_applications.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (filters.page <= 3) {
                      pageNum = i + 1;
                    } else if (filters.page >= dashboardData.recent_applications.total_pages - 2) {
                      pageNum = dashboardData.recent_applications.total_pages - 4 + i;
                    } else {
                      pageNum = filters.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 border rounded-lg transition-colors ${
                          filters.page === pageNum
                            ? 'bg-[#ff9933] text-white border-[#ff9933]'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === dashboardData.recent_applications.total_pages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {token && (
        <LoanApplicationDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          token={token}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}