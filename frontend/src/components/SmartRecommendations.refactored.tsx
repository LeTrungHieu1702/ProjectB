/**
 * SmartRecommendations Component (Refactored)
 *
 * Provides AI-driven insights and recommendations based on patient exercise history.
 * Analyzes patterns, trends, and performance metrics to generate actionable advice.
 *
 * Features:
 * - Performance trend analysis
 * - Exercise variety recommendations
 * - Consistency tracking
 * - Common error identification
 * - Progress milestones
 * - Rest day suggestions
 * - Personalized tips
 */

import { useMemo } from 'react';
import type { Session } from '../types';

interface SmartRecommendationsProps {
  sessions: Session[];
  /** Maximum number of recommendations to display */
  maxRecommendations?: number;
  /** Show icons in recommendations */
  showIcons?: boolean;
}

type RecommendationType = 'success' | 'warning' | 'info' | 'tip' | 'alert';

interface Recommendation {
  type: RecommendationType;
  title: string;
  message: string;
  icon: string;
  priority: number; // Higher = more important
  category: 'performance' | 'consistency' | 'variety' | 'health' | 'progress';
}

/**
 * Analyzes exercise sessions and generates smart recommendations
 */
const useRecommendationEngine = (sessions: Session[]): Recommendation[] => {
  return useMemo(() => {
    if (sessions.length === 0) return [];

    const recommendations: Recommendation[] = [];
    const now = new Date();

    // ========== 1. PERFORMANCE ANALYSIS ==========
    const recentSessions = sessions.slice(0, 5);
    const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;

    if (avgAccuracy >= 90) {
      recommendations.push({
        type: 'success',
        title: 'Hiệu suất xuất sắc!',
        message: `Độ chính xác ${avgAccuracy.toFixed(1)}% - Bạn đang thực hiện rất tốt! Hãy tiếp tục duy trì và có thể tăng độ khó.`,
        icon: '',
        priority: 8,
        category: 'performance'
      });
    } else if (avgAccuracy >= 75) {
      recommendations.push({
        type: 'success',
        title: 'Hiệu suất tốt',
        message: `Độ chính xác ${avgAccuracy.toFixed(1)}% - Bạn đang làm rất tốt. Tập trung cải thiện các lỗi nhỏ để đạt mức hoàn hảo.`,
        icon: '',
        priority: 6,
        category: 'performance'
      });
    } else if (avgAccuracy >= 60) {
      recommendations.push({
        type: 'warning',
        title: 'Cần cải thiện kỹ thuật',
        message: `Độ chính xác ${avgAccuracy.toFixed(1)}% - Hãy tập chậm lại, tập trung vào tư thế đúng hơn là số lượng.`,
        icon: '',
        priority: 9,
        category: 'performance'
      });
    } else {
      recommendations.push({
        type: 'alert',
        title: 'Cần cải thiện nghiêm túc',
        message: `Độ chính xác ${avgAccuracy.toFixed(1)}% quá thấp. Xem lại video hướng dẫn và tập với tốc độ chậm hơn. Nên tham khảo bác sĩ.`,
        icon: '',
        priority: 10,
        category: 'performance'
      });
    }

    // ========== 2. TREND ANALYSIS ==========
    if (sessions.length >= 10) {
      const recentAvg = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;
      const olderSessions = sessions.slice(5, 10);
      const olderAvg = olderSessions.reduce((sum, s) => sum + s.accuracy, 0) / olderSessions.length;

      const improvement = recentAvg - olderAvg;

      if (improvement >= 10) {
        recommendations.push({
          type: 'success',
          title: 'Tiến bộ vượt bậc!',
          message: `Độ chính xác tăng ${improvement.toFixed(1)}% so với trước. Quá tuyệt vời! Hãy duy trì động lực này.`,
          icon: '',
          priority: 9,
          category: 'progress'
        });
      } else if (improvement >= 5) {
        recommendations.push({
          type: 'success',
          title: 'Đang tiến bộ',
          message: `Cải thiện ${improvement.toFixed(1)}% so với trước. Bạn đang đi đúng hướng!`,
          icon: '',
          priority: 7,
          category: 'progress'
        });
      } else if (improvement <= -10) {
        recommendations.push({
          type: 'warning',
          title: 'Hiệu suất giảm sút',
          message: `Độ chính xác giảm ${Math.abs(improvement).toFixed(1)}%. Có thể bạn đang mệt hoặc tập quá nhanh. Hãy nghỉ ngơi và quay lại.`,
          icon: '',
          priority: 9,
          category: 'health'
        });
      }
    }

    // ========== 3. EXERCISE VARIETY ==========
    const exerciseTypes = new Set(sessions.map(s => s.exercise_name));
    const exerciseDistribution = sessions.reduce((acc, s) => {
      acc[s.exercise_name] = (acc[s.exercise_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (exerciseTypes.size === 1 && sessions.length >= 5) {
      recommendations.push({
        type: 'tip',
        title: 'Đa dạng hóa bài tập',
        message: `Bạn chỉ tập "${Array.from(exerciseTypes)[0]}". Thử thêm các bài tập khác để phát triển toàn diện hơn!`,
        icon: '',
        priority: 7,
        category: 'variety'
      });
    } else if (exerciseTypes.size >= 3) {
      recommendations.push({
        type: 'success',
        title: 'Tập đa dạng tốt',
        message: `Bạn đã thực hiện ${exerciseTypes.size} loại bài tập khác nhau. Rất tốt cho sự phát triển toàn diện!`,
        icon: '',
        priority: 5,
        category: 'variety'
      });
    }

    // Identify most and least practiced exercises
    const sortedExercises = Object.entries(exerciseDistribution).sort((a, b) => b[1] - a[1]);
    if (sortedExercises.length > 1) {
      const [mostPracticed, leastPracticed] = [sortedExercises[0], sortedExercises[sortedExercises.length - 1]];
      const ratio = mostPracticed[1] / leastPracticed[1];

      if (ratio >= 3) {
        recommendations.push({
          type: 'tip',
          title: 'Cân bằng bài tập',
          message: `Bạn tập "${mostPracticed[0]}" nhiều hơn "${leastPracticed[0]}" ${ratio.toFixed(0)}x. Hãy cân bằng hơn để phát triển đồng đều.`,
          icon: '',
          priority: 6,
          category: 'variety'
        });
      }
    }

    // ========== 4. CONSISTENCY TRACKING ==========
    const lastSession = new Date(sessions[0].start_time);
    const daysSinceLastSession = Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastSession === 0) {
      const sessionsToday = sessions.filter(s => {
        const sessionDate = new Date(s.start_time);
        return sessionDate.toDateString() === now.toDateString();
      }).length;

      if (sessionsToday === 1) {
        recommendations.push({
          type: 'success',
          title: 'Tuyệt vời hôm nay!',
          message: 'Bạn đã hoàn thành buổi tập hôm nay. Hãy nghỉ ngơi để cơ thể phục hồi.',
          icon: '',
          priority: 6,
          category: 'consistency'
        });
      } else if (sessionsToday >= 2) {
        recommendations.push({
          type: 'warning',
          title: 'Tập nhiều hôm nay',
          message: `Bạn đã tập ${sessionsToday} buổi hôm nay. Tuyệt vời nhưng đừng quên nghỉ ngơi để tránh chấn thương.`,
          icon: '',
          priority: 8,
          category: 'health'
        });
      }
    } else if (daysSinceLastSession === 1) {
      recommendations.push({
        type: 'info',
        title: 'Giữ đều tiến độ',
        message: 'Tập hôm qua rồi. Nếu cảm thấy khỏe, hãy tập tiếp hôm nay để duy trì nhịp độ!',
        icon: '',
        priority: 5,
        category: 'consistency'
      });
    } else if (daysSinceLastSession >= 2 && daysSinceLastSession <= 4) {
      recommendations.push({
        type: 'info',
        title: 'Đã lâu không tập',
        message: `${daysSinceLastSession} ngày kể từ buổi tập cuối. Hãy quay lại để duy trì tiến bộ!`,
        icon: '',
        priority: 7,
        category: 'consistency'
      });
    } else if (daysSinceLastSession >= 5) {
      recommendations.push({
        type: 'alert',
        title: 'Nghỉ quá lâu',
        message: `${daysSinceLastSession} ngày không tập! Việc gián đoạn lâu có thể làm mất tiến độ. Hãy bắt đầu lại với cường độ nhẹ.`,
        icon: '',
        priority: 10,
        category: 'consistency'
      });
    }

    // Weekly consistency
    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 7);
    const sessionsThisWeek = sessions.filter(s => new Date(s.start_time) >= last7Days);

    if (sessionsThisWeek.length >= 5 && sessionsThisWeek.length <= 6) {
      recommendations.push({
        type: 'success',
        title: 'Streak tuyệt vời!',
        message: `${sessionsThisWeek.length} buổi tuần này! Tần suất lý tưởng. Hãy duy trì nhịp độ này.`,
        icon: '',
        priority: 7,
        category: 'consistency'
      });
    } else if (sessionsThisWeek.length >= 7) {
      recommendations.push({
        type: 'warning',
        title: 'Tập quá nhiều',
        message: `${sessionsThisWeek.length} buổi tuần này. Nghỉ ngơi rất quan trọng! Cơ thể cần thời gian phục hồi để tránh chấn thương.`,
        icon: '',
        priority: 9,
        category: 'health'
      });
    } else if (sessionsThisWeek.length <= 2 && sessions.length >= 10) {
      recommendations.push({
        type: 'tip',
        title: 'Tăng tần suất tập',
        message: `Chỉ ${sessionsThisWeek.length} buổi tuần này. Mục tiêu lý tưởng là 3-5 buổi/tuần để tiến bộ tốt nhất.`,
        icon: '',
        priority: 6,
        category: 'consistency'
      });
    }

    // ========== 5. COMMON ERRORS ANALYSIS ==========
    const allErrors: Record<string, number> = {};
    sessions.slice(0, 10).forEach(s => {
      s.errors?.forEach(e => {
        allErrors[e.name] = (allErrors[e.name] || 0) + e.count;
      });
    });

    const sortedErrors = Object.entries(allErrors).sort((a, b) => b[1] - a[1]);

    if (sortedErrors.length > 0) {
      const topError = sortedErrors[0];
      const errorFrequency = topError[1] / sessions.slice(0, 10).reduce((sum, s) => sum + s.total_reps, 0);

      if (errorFrequency > 0.3) { // More than 30% of reps have this error
        recommendations.push({
          type: 'warning',
          title: 'Lỗi cần sửa gấp',
          message: `"${topError[0]}" xuất hiện ${topError[1]} lần (${(errorFrequency * 100).toFixed(0)}% động tác). Tập trung khắc phục lỗi này!`,
          icon: '',
          priority: 9,
          category: 'performance'
        });
      } else if (topError[1] >= 10) {
        recommendations.push({
          type: 'tip',
          title: 'Lỗi thường gặp',
          message: `"${topError[0]}" xuất hiện ${topError[1]} lần. Xem lại video hướng dẫn về điểm này.`,
          icon: '',
          priority: 7,
          category: 'performance'
        });
      }

      // Multiple recurring errors
      const significantErrors = sortedErrors.filter(([_, count]) => count >= 5);
      if (significantErrors.length >= 3) {
        recommendations.push({
          type: 'tip',
          title: 'Nhiều điểm cần cải thiện',
          message: `Có ${significantErrors.length} lỗi thường gặp. Hãy tập từng phần động tác, không vội hoàn thành số lượng.`,
          icon: '',
          priority: 8,
          category: 'performance'
        });
      }
    }

    // ========== 6. REP PROGRESS TRACKING ==========
    if (sessions.length >= 10) {
      const recentReps = recentSessions.reduce((sum, s) => sum + s.total_reps, 0) / recentSessions.length;
      const olderSessions = sessions.slice(5, 10);
      const olderReps = olderSessions.reduce((sum, s) => sum + s.total_reps, 0) / olderSessions.length;

      const repsIncrease = ((recentReps - olderReps) / olderReps) * 100;

      if (repsIncrease >= 20) {
        recommendations.push({
          type: 'success',
          title: 'Sức mạnh tăng!',
          message: `Số lần tập tăng ${repsIncrease.toFixed(0)}% so với trước. Sức bền và sức mạnh của bạn đang cải thiện tốt!`,
          icon: '',
          priority: 7,
          category: 'progress'
        });
      } else if (repsIncrease <= -20) {
        recommendations.push({
          type: 'warning',
          title: 'Số lần tập giảm',
          message: `Số lần tập giảm ${Math.abs(repsIncrease).toFixed(0)}%. Có thể bạn cần nghỉ ngơi hoặc điều chỉnh cường độ.`,
          icon: '',
          priority: 8,
          category: 'health'
        });
      }
    }

    // ========== 7. DURATION & INTENSITY ==========
    const avgDuration = recentSessions.reduce((sum, s) => sum + s.duration_seconds, 0) / recentSessions.length;

    if (avgDuration < 120) { // Less than 2 minutes
      recommendations.push({
        type: 'tip',
        title: 'Tập quá nhanh',
        message: `Thời gian trung bình ${Math.round(avgDuration)}s/buổi. Hãy tập chậm lại, tập trung vào chất lượng động tác.`,
        icon: '',
        priority: 7,
        category: 'performance'
      });
    } else if (avgDuration > 600) { // More than 10 minutes
      recommendations.push({
        type: 'info',
        title: 'Buổi tập dài',
        message: `Thời gian trung bình ${Math.round(avgDuration / 60)}p/buổi. Rất tốt! Đảm bảo nghỉ ngơi đủ giữa các lần.`,
        icon: '',
        priority: 5,
        category: 'performance'
      });
    }

    // ========== 8. MILESTONE ACHIEVEMENTS ==========
    const totalSessions = sessions.length;
    const totalReps = sessions.reduce((sum, s) => sum + s.total_reps, 0);

    if (totalSessions === 10) {
      recommendations.push({
        type: 'success',
        title: 'Cột mốc 10 buổi!',
        message: 'Chúc mừng! Bạn đã hoàn thành 10 buổi tập. Đây là bước đầu quan trọng trong hành trình phục hồi.',
        icon: '',
        priority: 8,
        category: 'progress'
      });
    } else if (totalSessions === 50) {
      recommendations.push({
        type: 'success',
        title: 'Cột mốc 50 buổi!',
        message: 'Xuất sắc! 50 buổi tập cho thấy sự kiên trì tuyệt vời. Bạn đang đạt kết quả rất tốt!',
        icon: '',
        priority: 9,
        category: 'progress'
      });
    } else if (totalSessions === 100) {
      recommendations.push({
        type: 'success',
        title: 'Cột mốc 100 buổi!',
        message: 'Phi thường! 100 buổi tập là thành tựu đáng tự hào. Bạn là hình mẫu về sự kiên trì!',
        icon: '',
        priority: 10,
        category: 'progress'
      });
    }

    if (totalReps >= 1000 && totalReps < 1010) {
      recommendations.push({
        type: 'success',
        title: '1000+ động tác!',
        message: `Bạn đã hoàn thành ${totalReps} động tác tập luyện. Một cột mốc tuyệt vời!`,
        icon: '',
        priority: 8,
        category: 'progress'
      });
    }

    // Sort by priority (highest first) and return
    return recommendations.sort((a, b) => b.priority - a.priority);
  }, [sessions]);
};

/**
 * Main component
 */
export const SmartRecommendations = ({
  sessions,
  maxRecommendations = 4,
  showIcons = true
}: SmartRecommendationsProps) => {
  const allRecommendations = useRecommendationEngine(sessions);
  const displayedRecommendations = allRecommendations.slice(0, maxRecommendations);

  if (displayedRecommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <span>Gợi ý thông minh</span>
        </h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <p className="text-blue-800 dark:text-blue-200 text-lg">
            Bắt đầu tập luyện để nhận gợi ý cá nhân hóa từ hệ thống AI!
          </p>
        </div>
      </div>
    );
  }

  const getColorClasses = (type: RecommendationType) => {
    const baseClasses = 'transition-all duration-300 hover:scale-[1.02] hover:shadow-lg';
    switch (type) {
      case 'success':
        return `${baseClasses} bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100`;
      case 'warning':
        return `${baseClasses} bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100`;
      case 'info':
        return `${baseClasses} bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100`;
      case 'tip':
        return `${baseClasses} bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100`;
      case 'alert':
        return `${baseClasses} bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100`;
      default:
        return `${baseClasses} bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100`;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return '';
      case 'consistency': return '';
      case 'variety': return '';
      case 'health': return '';
      case 'progress': return '';
      default: return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span>Gợi ý thông minh</span>
        </h3>
        {allRecommendations.length > maxRecommendations && (
          <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            +{allRecommendations.length - maxRecommendations} gợi ý khác
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedRecommendations.map((rec, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${getColorClasses(rec.type)}`}
          >
            <div className="flex items-start gap-3">
              {showIcons && (
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <span className="text-3xl">{rec.icon}</span>
                  <span className="text-xs opacity-70">{getCategoryIcon(rec.category)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold mb-1 text-base leading-snug">{rec.title}</h4>
                <p className="text-sm opacity-90 leading-relaxed">{rec.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sessions.length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Tổng buổi tập</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {sessions.length > 0 ? (sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length).toFixed(1) : '0'}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Độ chính xác TB</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {sessions.reduce((sum, s) => sum + s.total_reps, 0)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Tổng số lần</p>
          </div>
        </div>
      </div>
    </div>
  );
};
