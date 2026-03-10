/**
 * Remote Monitoring Utilities
 *
 * Comprehensive utilities for remote patient monitoring and clinical decision support.
 * Provides analytics, risk assessment, and trend analysis capabilities.
 */

import type { Session, Patient } from '../types/index';

// ========== TYPES ==========

export interface PatientTrend {
  direction: 'improving' | 'stable' | 'declining';
  confidence: number; // 0-1
  description: string;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  category: 'performance' | 'adherence' | 'safety' | 'clinical';
  description: string;
  severity: number; // 0-10
  weight: number; // 0-1
}

export interface PerformanceMetrics {
  accuracy: {
    current: number;
    trend: number; // Change percentage
    percentile: number; // Compared to other patients
  };
  consistency: {
    sessionsPerWeek: number;
    adherenceRate: number; // 0-100
    longestStreak: number;
    currentStreak: number;
  };
  progress: {
    totalSessions: number;
    totalReps: number;
    totalDuration: number; // seconds
    improvementRate: number; // Percentage per week
  };
  errors: {
    mostCommon: Array<{ name: string; frequency: number }>;
    trend: 'improving' | 'worsening' | 'stable';
  };
}

export interface AlertItem {
  id: string;
  patientId: number;
  severity: 'info' | 'warning' | 'critical';
  category: 'adherence' | 'performance' | 'safety';
  message: string;
  timestamp: Date;
  actionRequired: boolean;
}

// ========== TREND ANALYSIS ==========

/**
 * Analyze patient performance trend over time
 */
export const analyzePatientTrend = (sessions: Session[]): PatientTrend => {
  if (sessions.length < 3) {
    return {
      direction: 'stable',
      confidence: 0.3,
      description: 'Chưa đủ dữ liệu để phân tích xu hướng'
    };
  }

  // Split into recent and older sessions
  const recentSessions = sessions.slice(0, Math.ceil(sessions.length / 2));
  const olderSessions = sessions.slice(Math.ceil(sessions.length / 2));

  // Calculate average accuracy
  const recentAvg = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;
  const olderAvg = olderSessions.reduce((sum, s) => sum + s.accuracy, 0) / olderSessions.length;

  const change = recentAvg - olderAvg;
  const changePercent = (change / olderAvg) * 100;

  // Determine trend
  let direction: 'improving' | 'stable' | 'declining';
  let confidence: number;
  let description: string;

  if (Math.abs(changePercent) < 5) {
    direction = 'stable';
    confidence = 0.7;
    description = `Hiệu suất ổn định ở mức ${recentAvg.toFixed(1)}%`;
  } else if (changePercent > 0) {
    direction = 'improving';
    confidence = Math.min(0.9, 0.5 + (changePercent / 20));
    description = `Cải thiện ${changePercent.toFixed(1)}% so với trước (${olderAvg.toFixed(1)}% → ${recentAvg.toFixed(1)}%)`;
  } else {
    direction = 'declining';
    confidence = Math.min(0.9, 0.5 + (Math.abs(changePercent) / 20));
    description = `Giảm ${Math.abs(changePercent).toFixed(1)}% so với trước (${olderAvg.toFixed(1)}% → ${recentAvg.toFixed(1)}%)`;
  }

  return { direction, confidence, description };
};

// ========== RISK ASSESSMENT ==========

/**
 * Comprehensive risk assessment for patient
 */
export const assessPatientRisk = (patient: Patient, sessions: Session[]): RiskAssessment => {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // 1. Performance Risk
  if (patient.last_session) {
    const accuracy = patient.last_session.accuracy;
    if (accuracy < 50) {
      factors.push({
        category: 'performance',
        description: `Độ chính xác rất thấp (${accuracy.toFixed(1)}%)`,
        severity: 9,
        weight: 0.4
      });
      totalScore += 9 * 0.4;
    } else if (accuracy < 65) {
      factors.push({
        category: 'performance',
        description: `Độ chính xác thấp (${accuracy.toFixed(1)}%)`,
        severity: 6,
        weight: 0.4
      });
      totalScore += 6 * 0.4;
    }
  }

  // 2. Adherence Risk
  const daysSinceLastSession = patient.last_session
    ? Math.floor((new Date().getTime() - new Date(patient.last_session.date).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysSinceLastSession >= 14) {
    factors.push({
      category: 'adherence',
      description: `Không tập ${daysSinceLastSession} ngày - nguy cơ bỏ trị liệu`,
      severity: 10,
      weight: 0.3
    });
    totalScore += 10 * 0.3;
  } else if (daysSinceLastSession >= 7) {
    factors.push({
      category: 'adherence',
      description: `Không tập ${daysSinceLastSession} ngày - giảm tuân thủ`,
      severity: 7,
      weight: 0.3
    });
    totalScore += 7 * 0.3;
  } else if (daysSinceLastSession >= 4) {
    factors.push({
      category: 'adherence',
      description: `${daysSinceLastSession} ngày chưa tập`,
      severity: 4,
      weight: 0.3
    });
    totalScore += 4 * 0.3;
  }

  // 3. Trend Risk
  if (sessions.length >= 5) {
    const trend = analyzePatientTrend(sessions);
    if (trend.direction === 'declining' && trend.confidence > 0.6) {
      factors.push({
        category: 'performance',
        description: `Xu hướng giảm sút: ${trend.description}`,
        severity: 7,
        weight: 0.2
      });
      totalScore += 7 * 0.2;
    }
  }

  // 4. Error Pattern Risk
  if (sessions.length > 0) {
    const allErrors: Record<string, number> = {};
    sessions.slice(0, 5).forEach(s => {
      s.errors?.forEach(e => {
        allErrors[e.name] = (allErrors[e.name] || 0) + e.count;
      });
    });

    const totalReps = sessions.slice(0, 5).reduce((sum, s) => sum + s.total_reps, 0);
    const totalErrors = Object.values(allErrors).reduce((sum, count) => sum + count, 0);
    const errorRate = totalReps > 0 ? totalErrors / totalReps : 0;

    if (errorRate > 0.5) {
      factors.push({
        category: 'safety',
        description: `Tỷ lệ lỗi cao (${(errorRate * 100).toFixed(0)}%) - nguy cơ chấn thương`,
        severity: 8,
        weight: 0.1
      });
      totalScore += 8 * 0.1;
    }
  }

  // Normalize score to 0-100
  const normalizedScore = totalScore * 10;

  // Determine risk level
  let level: 'low' | 'medium' | 'high' | 'critical';
  if (normalizedScore >= 75) level = 'critical';
  else if (normalizedScore >= 50) level = 'high';
  else if (normalizedScore >= 25) level = 'medium';
  else level = 'low';

  // Generate recommendations
  const recommendations = generateRecommendations(factors, level);

  return {
    level,
    score: normalizedScore,
    factors,
    recommendations
  };
};

/**
 * Generate clinical recommendations based on risk factors
 */
const generateRecommendations = (factors: RiskFactor[], riskLevel: string): string[] => {
  const recommendations: string[] = [];

  // Performance-based recommendations
  const perfFactors = factors.filter(f => f.category === 'performance');
  if (perfFactors.length > 0) {
    recommendations.push('Xem xét điều chỉnh độ khó bài tập phù hợp hơn');
    recommendations.push('Tăng cường hướng dẫn kỹ thuật qua video call');
  }

  // Adherence-based recommendations
  const adherenceFactors = factors.filter(f => f.category === 'adherence');
  if (adherenceFactors.length > 0) {
    recommendations.push('Liên hệ bệnh nhân để tìm hiểu rào cản');
    recommendations.push('Xem xét điều chỉnh lịch tập phù hợp hơn');
    recommendations.push('Tăng cường nhắc nhở và động viên');
  }

  // Safety-based recommendations
  const safetyFactors = factors.filter(f => f.category === 'safety');
  if (safetyFactors.length > 0) {
    recommendations.push('Cần đánh giá lại tình trạng sức khỏe');
    recommendations.push('Xem xét giảm cường độ tập luyện');
    recommendations.push('Tăng cường giám sát qua video call');
  }

  // General high-risk recommendations
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('Ưu tiên liên hệ trong 24h');
    recommendations.push('Xem xét lên lịch tái khám trực tiếp');
  }

  return recommendations;
};

// ========== PERFORMANCE METRICS ==========

/**
 * Calculate comprehensive performance metrics
 */
export const calculatePerformanceMetrics = (sessions: Session[]): PerformanceMetrics => {
  if (sessions.length === 0) {
    return {
      accuracy: { current: 0, trend: 0, percentile: 0 },
      consistency: { sessionsPerWeek: 0, adherenceRate: 0, longestStreak: 0, currentStreak: 0 },
      progress: { totalSessions: 0, totalReps: 0, totalDuration: 0, improvementRate: 0 },
      errors: { mostCommon: [], trend: 'stable' }
    };
  }

  // Accuracy metrics
  const currentAccuracy = sessions[0].accuracy;
  const oldAccuracy = sessions.length > 5
    ? sessions.slice(5, 10).reduce((sum, s) => sum + s.accuracy, 0) / Math.min(5, sessions.length - 5)
    : currentAccuracy;
  const accuracyTrend = ((currentAccuracy - oldAccuracy) / oldAccuracy) * 100;

  // Consistency metrics
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sessionsThisWeek = sessions.filter(s => new Date(s.start_time) >= weekAgo).length;

  // Calculate streaks
  const { longestStreak, currentStreak } = calculateStreaks(sessions);

  // Adherence rate (sessions per week compared to recommended 3-5)
  const adherenceRate = Math.min(100, (sessionsThisWeek / 4) * 100); // 4 is ideal

  // Progress metrics
  const totalSessions = sessions.length;
  const totalReps = sessions.reduce((sum, s) => sum + s.total_reps, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);

  // Calculate improvement rate (accuracy change per week)
  const weeksOfData = Math.max(1, sessions.length / 4); // Assuming ~4 sessions per week
  const improvementRate = accuracyTrend / weeksOfData;

  // Error analysis
  const allErrors: Record<string, number> = {};
  sessions.forEach(s => {
    s.errors?.forEach(e => {
      allErrors[e.name] = (allErrors[e.name] || 0) + e.count;
    });
  });

  const mostCommon = Object.entries(allErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({
      name,
      frequency: count / totalReps
    }));

  // Error trend
  const recentErrors = sessions.slice(0, 5).reduce((sum, s) =>
    sum + (s.errors?.reduce((esum, e) => esum + e.count, 0) || 0), 0
  );
  const olderErrors = sessions.slice(5, 10).reduce((sum, s) =>
    sum + (s.errors?.reduce((esum, e) => esum + e.count, 0) || 0), 0
  );
  const errorTrend: 'improving' | 'worsening' | 'stable' =
    recentErrors < olderErrors * 0.8 ? 'improving' :
    recentErrors > olderErrors * 1.2 ? 'worsening' : 'stable';

  return {
    accuracy: {
      current: currentAccuracy,
      trend: accuracyTrend,
      percentile: 50 // TODO: Calculate based on all patients
    },
    consistency: {
      sessionsPerWeek: sessionsThisWeek,
      adherenceRate,
      longestStreak,
      currentStreak
    },
    progress: {
      totalSessions,
      totalReps,
      totalDuration,
      improvementRate
    },
    errors: {
      mostCommon,
      trend: errorTrend
    }
  };
};

/**
 * Calculate exercise streaks
 */
const calculateStreaks = (sessions: Session[]): { longestStreak: number; currentStreak: number } => {
  if (sessions.length === 0) return { longestStreak: 0, currentStreak: 0 };

  // Group sessions by date
  const sessionDates = sessions.map(s =>
    new Date(s.start_time).toDateString()
  );
  const uniqueDates = [...new Set(sessionDates)].sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Calculate current streak
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return { longestStreak, currentStreak };
};

// ========== ALERT SYSTEM ==========

/**
 * Generate alerts for patients requiring attention
 */
export const generatePatientAlerts = (patients: Patient[], allSessions: Map<number, Session[]>): AlertItem[] => {
  const alerts: AlertItem[] = [];
  const now = new Date();

  patients.forEach(patient => {
    const sessions = allSessions.get(patient.id) || [];

    // Alert: No sessions
    if (!patient.last_session) {
      alerts.push({
        id: `no-sessions-${patient.id}`,
        patientId: patient.id,
        severity: 'critical',
        category: 'adherence',
        message: `${patient.full_name} chưa có buổi tập nào`,
        timestamp: now,
        actionRequired: true
      });
      return;
    }

    const daysSince = Math.floor((now.getTime() - new Date(patient.last_session.date).getTime()) / (24 * 60 * 60 * 1000));

    // Alert: Long inactivity
    if (daysSince >= 7) {
      alerts.push({
        id: `inactive-${patient.id}`,
        patientId: patient.id,
        severity: 'critical',
        category: 'adherence',
        message: `${patient.full_name} không tập ${daysSince} ngày`,
        timestamp: now,
        actionRequired: true
      });
    } else if (daysSince >= 4) {
      alerts.push({
        id: `inactive-${patient.id}`,
        patientId: patient.id,
        severity: 'warning',
        category: 'adherence',
        message: `${patient.full_name} không tập ${daysSince} ngày`,
        timestamp: now,
        actionRequired: false
      });
    }

    // Alert: Poor performance
    if (patient.last_session.accuracy < 50) {
      alerts.push({
        id: `poor-performance-${patient.id}`,
        patientId: patient.id,
        severity: 'critical',
        category: 'performance',
        message: `${patient.full_name} có độ chính xác rất thấp (${patient.last_session.accuracy.toFixed(1)}%)`,
        timestamp: now,
        actionRequired: true
      });
    } else if (patient.last_session.accuracy < 65) {
      alerts.push({
        id: `poor-performance-${patient.id}`,
        patientId: patient.id,
        severity: 'warning',
        category: 'performance',
        message: `${patient.full_name} có độ chính xác thấp (${patient.last_session.accuracy.toFixed(1)}%)`,
        timestamp: now,
        actionRequired: false
      });
    }

    // Alert: Declining trend
    if (sessions.length >= 5) {
      const trend = analyzePatientTrend(sessions);
      if (trend.direction === 'declining' && trend.confidence > 0.7) {
        alerts.push({
          id: `declining-${patient.id}`,
          patientId: patient.id,
          severity: 'warning',
          category: 'performance',
          message: `${patient.full_name} có xu hướng giảm sút: ${trend.description}`,
          timestamp: now,
          actionRequired: false
        });
      }
    }
  });

  // Sort by severity and timestamp
  const severityOrder = { critical: 3, warning: 2, info: 1 };
  return alerts.sort((a, b) => {
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
};

// ========== EXPORT UTILITIES ==========

export const monitoringUtils = {
  analyzePatientTrend,
  assessPatientRisk,
  calculatePerformanceMetrics,
  generatePatientAlerts
};

export default monitoringUtils;
