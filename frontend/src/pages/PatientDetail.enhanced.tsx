/**
 * PatientDetail Component (Enhanced with Remote Monitoring)
 *
 * Comprehensive patient view for clinicians with advanced analytics,
 * risk assessment, trend analysis, and clinical decision support.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../utils/api';
import { SessionCard } from '../components/SessionCard';
import { ProgressChart } from '../components/ProgressChart';
import { ErrorAnalytics } from '../components/ErrorAnalytics';
import { SmartRecommendations } from '../components/SmartRecommendations.refactored';
import {
  analyzePatientTrend,
  assessPatientRisk,
  calculatePerformanceMetrics,
  type PatientTrend,
  type RiskAssessment,
  type PerformanceMetrics
} from '../utils/monitoringUtils';
import type { Session, Patient } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// ========== COMPONENTS ==========

interface TrendCardProps {
  trend: PatientTrend;
}

const TrendCard = ({ trend }: TrendCardProps) => {
  const getColorClasses = () => {
    switch (trend.direction) {
      case 'improving':
        return 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100';
      case 'declining':
        return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100';
    }
  };

  const getIcon = () => {
    switch (trend.direction) {
      case 'improving': return '↗';
      case 'declining': return '↘';
      default: return '→';
    }
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${getColorClasses()}`}>
      <div className="flex items-start gap-4">
        <span className="text-4xl">{getIcon()}</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1">Xu Hướng Hiệu Suất</h3>
          <p className="text-sm mb-2 opacity-90">{trend.description}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-black/10 dark:bg-white/10 px-2 py-1 rounded">
              Độ tin cậy: {(trend.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RiskCardProps {
  risk: RiskAssessment;
}

const RiskCard = ({ risk }: RiskCardProps) => {
  const getColorClasses = () => {
    switch (risk.level) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700 text-red-900 dark:text-red-100';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 border-orange-400 dark:border-orange-700 text-orange-900 dark:text-orange-100';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700 text-green-900 dark:text-green-100';
    }
  };

  const getIcon = () => {
    switch (risk.level) {
      case 'critical': return '!';
      case 'high': return '!';
      case 'medium': return '!';
      default: return '✓';
    }
  };

  const getRiskLabel = () => {
    switch (risk.level) {
      case 'critical': return 'Cực kỳ cao';
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      default: return 'Thấp';
    }
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${getColorClasses()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{getIcon()}</span>
          <div>
            <h3 className="text-lg font-bold">Đánh Giá Rủi Ro</h3>
            <p className="text-2xl font-bold">{getRiskLabel()}</p>
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{risk.score.toFixed(0)}</div>
          <div className="text-xs opacity-70">Điểm rủi ro</div>
        </div>
      </div>

      {/* Risk Factors */}
      {risk.factors.length > 0 && (
        <div className="mb-4">
          <p className="font-semibold text-sm mb-2">Yếu tố rủi ro:</p>
          <ul className="space-y-1">
            {risk.factors.map((factor, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="opacity-70">•</span>
                <span>{factor.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {risk.recommendations.length > 0 && (
        <div className="pt-4 border-t border-current/20">
          <p className="font-semibold text-sm mb-2">Khuyến nghị:</p>
          <ul className="space-y-1">
            {risk.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span>✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface MetricsGridProps {
  metrics: PerformanceMetrics;
}

const MetricsGrid = ({ metrics }: MetricsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Accuracy */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Độ chính xác hiện tại</p>
        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
          {metrics.accuracy.current.toFixed(1)}%
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className={metrics.accuracy.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
            {metrics.accuracy.trend >= 0 ? '↗' : '↘'} {Math.abs(metrics.accuracy.trend).toFixed(1)}%
          </span>
          <span className="text-gray-500 dark:text-gray-400">so với trước</span>
        </div>
      </div>

      {/* Consistency */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Tần suất tập</p>
        <p className="text-4xl font-bold text-green-600 dark:text-green-400">
          {metrics.consistency.sessionsPerWeek}
        </p>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          buổi/tuần
        </div>
        <div className="mt-1 text-sm">
          <span className="text-purple-600 dark:text-purple-400 font-semibold">
            Streak: {metrics.consistency.currentStreak} ngày
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Tổng tiến độ</p>
        <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
          {metrics.progress.totalSessions}
        </p>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {metrics.progress.totalReps} lần tập
        </div>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {Math.floor(metrics.progress.totalDuration / 60)} phút
        </div>
      </div>

      {/* Adherence */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Tuân thủ</p>
        <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
          {metrics.consistency.adherenceRate.toFixed(0)}%
        </p>
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${metrics.consistency.adherenceRate}%` }}
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Streak dài nhất: {metrics.consistency.longestStreak} ngày
        </div>
      </div>
    </div>
  );
};

interface ErrorSummaryProps {
  metrics: PerformanceMetrics;
}

const ErrorSummary = ({ metrics }: ErrorSummaryProps) => {
  if (metrics.errors.mostCommon.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-6 text-center">
        <span className="text-4xl mb-2 block">✓</span>
        <p className="text-green-900 dark:text-green-100 font-semibold">
          Không có lỗi đáng kể được ghi nhận
        </p>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (metrics.errors.trend) {
      case 'improving': return '↗';
      case 'worsening': return '↘';
      default: return '→';
    }
  };

  const getTrendColor = () => {
    switch (metrics.errors.trend) {
      case 'improving': return 'text-green-600 dark:text-green-400';
      case 'worsening': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Lỗi Thường Gặp</h3>
        <span className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor()}`}>
          {getTrendIcon()} {metrics.errors.trend === 'improving' ? 'Đang cải thiện' :
                           metrics.errors.trend === 'worsening' ? 'Đang tồi đi' : 'Ổn định'}
        </span>
      </div>
      <div className="space-y-3">
        {metrics.errors.mostCommon.map((error, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">{idx + 1}. {error.name}</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${error.frequency * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 w-12 text-right">
                {(error.frequency * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== MAIN COMPONENT ==========

export const PatientDetail = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Analytics
  const [trend, setTrend] = useState<PatientTrend | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load patient info and sessions
      const [patientsData, sessionsData] = await Promise.all([
        doctorAPI.getPatients(),
        doctorAPI.getPatientHistory(Number(patientId), 50)
      ]);

      const currentPatient = patientsData.patients.find(p => p.id === Number(patientId));
      if (!currentPatient) {
        throw new Error('Không tìm thấy bệnh nhân');
      }

      setPatient(currentPatient);
      setSessions(sessionsData.sessions);

      // Calculate analytics
      if (sessionsData.sessions.length > 0) {
        setTrend(analyzePatientTrend(sessionsData.sessions));
        setRisk(assessPatientRisk(currentPatient, sessionsData.sessions));
        setMetrics(calculatePerformanceMetrics(sessionsData.sessions));
      }
    } catch (err) {
      console.error('Failed to load patient data:', err);
      setError('Không thể tải thông tin bệnh nhân. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = () => {
    if (!patient || !sessions.length) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('BÁO CÁO TIẾN ĐỘ PHỤC HỒI CHỨC NĂNG', 20, 20);

    doc.setFontSize(12);
    doc.text(`Bệnh nhân: ${patient.full_name}`, 20, 30);
    doc.text(`ID: ${patient.id} | Username: ${patient.username}`, 20, 37);
    doc.text(`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`, 20, 44);

    // Risk & Trend Summary
    if (risk && trend) {
      doc.text('ĐÁNH GIÁ TỔNG QUAN:', 20, 57);
      doc.text(`- Mức độ rủi ro: ${risk.level.toUpperCase()} (${risk.score.toFixed(0)}/100)`, 25, 64);
      doc.text(`- Xu hướng: ${trend.direction.toUpperCase()}`, 25, 71);
      if (risk.recommendations.length > 0) {
        doc.text('- Khuyến nghị:', 25, 78);
        risk.recommendations.slice(0, 2).forEach((rec, idx) => {
          doc.text(`  ${idx + 1}. ${rec}`, 27, 85 + (idx * 7));
        });
      }
    }

    // Metrics
    if (metrics) {
      const startY = risk ? 100 : 57;
      doc.text('CHỈ SỐ HIỆU SUẤT:', 20, startY);
      doc.text(`- Độ chính xác: ${metrics.accuracy.current.toFixed(1)}%`, 25, startY + 7);
      doc.text(`- Tần suất: ${metrics.consistency.sessionsPerWeek} buổi/tuần`, 25, startY + 14);
      doc.text(`- Tuân thủ: ${metrics.consistency.adherenceRate.toFixed(0)}%`, 25, startY + 21);
      doc.text(`- Streak hiện tại: ${metrics.consistency.currentStreak} ngày`, 25, startY + 28);
    }

    // Sessions table
    const tableData = sessions.slice(0, 10).map((s, i) => [
      i + 1,
      s.exercise_name,
      new Date(s.start_time).toLocaleDateString('vi-VN'),
      s.total_reps,
      `${s.accuracy.toFixed(1)}%`,
      `${Math.floor(s.duration_seconds / 60)}p`,
    ]);

    doc.autoTable({
      startY: metrics ? 140 : 120,
      head: [['#', 'Bài tập', 'Ngày', 'Số lần', 'Chính xác', 'Thời gian']],
      body: tableData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`bao-cao-${patient.username}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400">Đang tải thông tin bệnh nhân...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-red-600 dark:text-red-400 mb-4">❌ {error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            ← Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">{patient.full_name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-lg opacity-90">
                <span>{patient.age} tuổi</span>
                <span>•</span>
                <span>{patient.gender}</span>
                <span>•</span>
                <span className="bg-white/20 px-3 py-1 rounded">{patient.username}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadPatientData}
                className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
              >
                Làm mới
              </button>
              <button
                onClick={generatePDF}
                disabled={sessions.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xuất PDF
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                ← Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {sessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <span className="text-6xl mb-4 block">•</span>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Bệnh nhân chưa có buổi tập nào
            </p>
            <p className="text-gray-500 dark:text-gray-500">
              Hãy khuyến khích bệnh nhân bắt đầu tập luyện để theo dõi tiến độ
            </p>
          </div>
        ) : (
          <>
            {/* Risk & Trend Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {risk && <RiskCard risk={risk} />}
              {trend && <TrendCard trend={trend} />}
            </div>

            {/* Performance Metrics */}
            {metrics && (
              <>
                <MetricsGrid metrics={metrics} />

                <div className="mt-6 mb-6">
                  <ErrorSummary metrics={metrics} />
                </div>
              </>
            )}

            {/* Smart Recommendations */}
            <SmartRecommendations sessions={sessions} maxRecommendations={6} />

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 mb-6">
              <ProgressChart sessions={sessions} />
              <ErrorAnalytics patientId={Number(patientId)} />
            </div>

            {/* Session History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Chi Tiết Các Buổi Tập ({sessions.length} buổi)
              </h2>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
