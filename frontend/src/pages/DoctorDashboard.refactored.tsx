/**
 * DoctorDashboard Component (Refactored & Stabilized)
 *
 * Comprehensive clinician dashboard for remote patient monitoring.
 * Provides real-time insights, patient management, and clinical decision support.
 *
 * Features:
 * - Real-time patient status monitoring
 * - Advanced filtering and sorting
 * - Risk assessment indicators
 * - Quick action shortcuts
 * - Performance analytics
 * - Alert system for critical cases
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorAPI } from '../utils/api';
import type { Patient } from '../types';

// ========== TYPES ==========

type SortField = 'name' | 'lastActivity' | 'accuracy' | 'riskLevel';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'inactive' | 'needsAttention';

interface DashboardStats {
  totalPatients: number;
  activeToday: number;
  avgAccuracy: number;
  patientsNeedingAttention: number;
  highRiskPatients: number;
}

interface PatientWithMetrics extends Patient {
  daysSinceLastSession: number;
  riskLevel: 'low' | 'medium' | 'high';
  trend: 'improving' | 'stable' | 'declining';
  needsAttention: boolean;
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Calculate days since last session
 */
const getDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Assess patient risk level based on multiple factors
 */
const assessRiskLevel = (patient: Patient): 'low' | 'medium' | 'high' => {
  if (!patient.last_session) return 'medium';

  const accuracy = patient.last_session.accuracy;
  const daysSince = getDaysSince(patient.last_session.date);

  // High risk: poor performance OR long inactivity
  if (accuracy < 60 || daysSince >= 7) return 'high';

  // Medium risk: moderate performance AND some inactivity
  if (accuracy < 75 || daysSince >= 3) return 'medium';

  // Low risk: good performance AND regular activity
  return 'low';
};

/**
 * Determine if patient needs attention
 */
const needsAttention = (patient: Patient): boolean => {
  if (!patient.last_session) return true;

  const daysSince = getDaysSince(patient.last_session.date);
  const accuracy = patient.last_session.accuracy;

  return daysSince >= 5 || accuracy < 60;
};

/**
 * Enrich patient data with calculated metrics
 */
const enrichPatientData = (patients: Patient[]): PatientWithMetrics[] => {
  return patients.map(patient => ({
    ...patient,
    daysSinceLastSession: patient.last_session ? getDaysSince(patient.last_session.date) : 999,
    riskLevel: assessRiskLevel(patient),
    trend: 'stable', // TODO: Calculate based on session history
    needsAttention: needsAttention(patient)
  }));
};

// ========== ENHANCED PATIENT CARD ==========

interface EnhancedPatientCardProps {
  patient: PatientWithMetrics;
  onClick: () => void;
}

const EnhancedPatientCard = ({ patient, onClick }: EnhancedPatientCardProps) => {
  const formatDate = (dateString: string) => {
    const days = getDaysSince(dateString);
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
    return `${Math.floor(days / 30)} tháng trước`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md
        hover:shadow-xl transition-all duration-300 cursor-pointer
        border-2 ${patient.needsAttention
          ? 'border-orange-300 dark:border-orange-600'
          : 'border-gray-200 dark:border-gray-700'
        }
        hover:scale-[1.02]
      `}
    >
      {/* Attention Badge */}
      {patient.needsAttention && (
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
          Cần chú ý
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
            {patient.full_name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{patient.age} tuổi</span>
            <span>•</span>
            <span>{patient.gender}</span>
            <span>•</span>
            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {patient.username}
            </span>
          </div>
        </div>

        {/* Risk Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(patient.riskLevel)}`}>
          {patient.riskLevel === 'high' && 'Nguy cơ cao'}
          {patient.riskLevel === 'medium' && 'Nguy cơ vừa'}
          {patient.riskLevel === 'low' && 'Ổn định'}
        </div>
      </div>

      {/* Session Info */}
      {patient.last_session ? (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Buổi tập gần nhất:</p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {patient.last_session.exercise}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(patient.last_session.date)}
              </p>
            </div>

            {/* Accuracy */}
            <div className="text-right">
              <p className={`text-3xl font-bold ${getAccuracyColor(patient.last_session.accuracy)}`}>
                {patient.last_session.accuracy.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Độ chính xác</p>
            </div>
          </div>

          {/* Activity Status */}
          <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                patient.daysSinceLastSession === 0 ? 'bg-green-500 animate-pulse' :
                patient.daysSinceLastSession <= 2 ? 'bg-green-500' :
                patient.daysSinceLastSession <= 5 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></span>
              <span className="text-gray-600 dark:text-gray-400">
                {patient.daysSinceLastSession === 0 ? 'Hoạt động hôm nay' :
                 patient.daysSinceLastSession <= 2 ? 'Hoạt động gần đây' :
                 patient.daysSinceLastSession <= 5 ? 'Không hoạt động gần đây' :
                 'Không hoạt động lâu'}
              </span>
            </div>

            {/* Quick Action */}
            <button className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
              Xem chi tiết →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-semibold">Chưa có buổi tập nào</p>
          <p className="text-sm text-red-500 dark:text-red-400 mt-1">Cần liên hệ bệnh nhân</p>
        </div>
      )}
    </div>
  );
};

// ========== MAIN COMPONENT ==========

export const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('lastActivity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Load patients
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await doctorAPI.getPatients();
      setPatients(data.patients);
    } catch (err) {
      console.error('Failed to load patients:', err);
      setError('Không thể tải danh sách bệnh nhân. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enrich patient data
  const enrichedPatients = useMemo(() => enrichPatientData(patients), [patients]);

  // Calculate dashboard stats
  const stats: DashboardStats = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();

    return {
      totalPatients: enrichedPatients.length,
      activeToday: enrichedPatients.filter(p =>
        p.last_session && new Date(p.last_session.date).toDateString() === today
      ).length,
      avgAccuracy: enrichedPatients.filter(p => p.last_session).length > 0
        ? enrichedPatients
            .filter(p => p.last_session)
            .reduce((sum, p) => sum + (p.last_session?.accuracy || 0), 0) /
          enrichedPatients.filter(p => p.last_session).length
        : 0,
      patientsNeedingAttention: enrichedPatients.filter(p => p.needsAttention).length,
      highRiskPatients: enrichedPatients.filter(p => p.riskLevel === 'high').length,
    };
  }, [enrichedPatients]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    let filtered = enrichedPatients;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.full_name.toLowerCase().includes(query) ||
        p.username.toLowerCase().includes(query)
      );
    }

    // Status filter
    switch (filterStatus) {
      case 'active':
        filtered = filtered.filter(p => p.daysSinceLastSession <= 2);
        break;
      case 'inactive':
        filtered = filtered.filter(p => p.daysSinceLastSession > 2);
        break;
      case 'needsAttention':
        filtered = filtered.filter(p => p.needsAttention);
        break;
    }

    return filtered;
  }, [enrichedPatients, searchQuery, filterStatus]);

  // Sort patients
  const sortedPatients = useMemo(() => {
    const sorted = [...filteredPatients];

    sorted.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          compareValue = a.full_name.localeCompare(b.full_name);
          break;
        case 'lastActivity':
          compareValue = a.daysSinceLastSession - b.daysSinceLastSession;
          break;
        case 'accuracy':
          compareValue = (a.last_session?.accuracy || 0) - (b.last_session?.accuracy || 0);
          break;
        case 'riskLevel':
          const riskOrder = { high: 3, medium: 2, low: 1 };
          compareValue = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [filteredPatients, sortField, sortDirection]);

  // Handlers
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePatientClick = (patientId: number) => {
    navigate(`/doctor/patient/${patientId}`);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">Dashboard Bác Sĩ</h1>
            <p className="text-xl opacity-90">Xin chào, {user?.full_name}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadPatients}
              className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
            >
              Làm mới
            </button>
            <button
              onClick={handleLogout}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-50 transition"
            >
              Đăng Xuất
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Tổng bệnh nhân</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.totalPatients}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Tập hôm nay</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.activeToday}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Độ chính xác TB</p>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {stats.avgAccuracy.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Cần chú ý</p>
            <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
              {stats.patientsNeedingAttention}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Nguy cơ cao</p>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400">{stats.highRiskPatients}</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm bệnh nhân (tên hoặc username)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-lg"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'active', 'inactive', 'needsAttention'] as FilterStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {status === 'all' && 'Tất cả'}
                  {status === 'active' && 'Hoạt động'}
                  {status === 'inactive' && 'Không hoạt động'}
                  {status === 'needsAttention' && 'Cần chú ý'}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-semibold"
              >
                <option value="lastActivity">Hoạt động gần nhất</option>
                <option value="name">Tên</option>
                <option value="accuracy">Độ chính xác</option>
                <option value="riskLevel">Mức độ rủi ro</option>
              </select>

              <button
                onClick={() => toggleSort(sortField)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Hiển thị {sortedPatients.length} / {enrichedPatients.length} bệnh nhân
          </div>
        </div>

        {/* Patient List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Danh Sách Bệnh Nhân
          </h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-600 dark:text-red-400 font-semibold">❌ {error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">Đang tải danh sách bệnh nhân...</p>
            </div>
          ) : sortedPatients.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl text-gray-600 dark:text-gray-400 mb-2">
                {searchQuery || filterStatus !== 'all'
                  ? 'Không tìm thấy bệnh nhân phù hợp'
                  : 'Chưa có bệnh nhân nào'}
              </p>
              {(searchQuery || filterStatus !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                  className="mt-4 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedPatients.map((patient) => (
                <EnhancedPatientCard
                  key={patient.id}
                  patient={patient}
                  onClick={() => handlePatientClick(patient.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
