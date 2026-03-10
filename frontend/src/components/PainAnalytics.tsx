import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { Session } from '../types';

interface PainAnalyticsProps {
  sessions: Session[];
}

export const PainAnalytics = ({ sessions }: PainAnalyticsProps) => {
  // Calculate pain statistics
  const painStats = useMemo(() => {
    const totalSessions = sessions.length;
    const sessionsWithPain = sessions.filter(s => s.pain_detected).length;
    const painPercentage = totalSessions > 0 ? (sessionsWithPain / totalSessions) * 100 : 0;

    // Count by pain level
    const painLevelCounts = {
      none: 0,
      mild: 0,
      moderate: 0,
      severe: 0,
    };

    sessions.forEach(session => {
      const level = session.max_pain_level || 'none';
      painLevelCounts[level as keyof typeof painLevelCounts]++;
    });

    // Pain by exercise type
    const painByExercise: Record<string, { total: number; withPain: number }> = {};
    
    sessions.forEach(session => {
      if (!painByExercise[session.exercise_name]) {
        painByExercise[session.exercise_name] = { total: 0, withPain: 0 };
      }
      painByExercise[session.exercise_name].total++;
      if (session.pain_detected) {
        painByExercise[session.exercise_name].withPain++;
      }
    });

    return {
      totalSessions,
      sessionsWithPain,
      painPercentage,
      painLevelCounts,
      painByExercise,
    };
  }, [sessions]);

  // Chart data
  const painLevelChartData = [
    { level: 'Không đau', count: painStats.painLevelCounts.none, color: '#10b981' },
    { level: 'Đau nhẹ', count: painStats.painLevelCounts.mild, color: '#fbbf24' },
    { level: 'Đau TB', count: painStats.painLevelCounts.moderate, color: '#f97316' },
    { level: 'Đau nặng', count: painStats.painLevelCounts.severe, color: '#ef4444' },
  ];

  const exercisePainData = Object.entries(painStats.painByExercise).map(([exercise, data]) => ({
    exercise: exercise,
    withPain: data.withPain,
    withoutPain: data.total - data.withPain,
    painRate: data.total > 0 ? ((data.withPain / data.total) * 100).toFixed(1) : 0,
  }));

  if (painStats.totalSessions === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Phân Tích Đau
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Chưa có dữ liệu buổi tập.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🩺 Phân Tích Đau
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {painStats.totalSessions} buổi tập
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <div className="text-green-600 dark:text-green-400 text-sm font-semibold mb-1">
            Buổi Tập Không Đau
          </div>
          <div className="text-3xl font-bold text-green-700 dark:text-green-300">
            {painStats.totalSessions - painStats.sessionsWithPain}
          </div>
          <div className="text-xs text-green-600 dark:text-green-500 mt-1">
            {(100 - painStats.painPercentage).toFixed(1)}% tổng số
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
          <div className="text-orange-600 dark:text-orange-400 text-sm font-semibold mb-1">
            Buổi Tập Có Đau
          </div>
          <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
            {painStats.sessionsWithPain}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-500 mt-1">
            {painStats.painPercentage.toFixed(1)}% tổng số
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
          <div className="text-red-600 dark:text-red-400 text-sm font-semibold mb-1">
            Đau Nghiêm Trọng
          </div>
          <div className="text-3xl font-bold text-red-700 dark:text-red-300">
            {painStats.painLevelCounts.severe}
          </div>
          <div className="text-xs text-red-600 dark:text-red-500 mt-1">
            {painStats.painLevelCounts.moderate + painStats.painLevelCounts.severe} đau TB-nặng
          </div>
        </div>
      </div>

      {/* Pain Level Distribution */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          Phân Bố Mức Độ Đau
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={painLevelChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              dataKey="level" 
              stroke="#6b7280"
              style={{ fontSize: '14px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '14px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Bar dataKey="count" name="Số buổi">
              {painLevelChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pain by Exercise Type */}
      {exercisePainData.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Đau Theo Loại Bài Tập
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={exercisePainData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis 
                dataKey="exercise" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '14px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="withoutPain" stackId="a" fill="#10b981" name="Không đau" />
              <Bar dataKey="withPain" stackId="a" fill="#ef4444" name="Có đau" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recommendations */}
      {painStats.sessionsWithPain > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h4 className="font-bold text-yellow-900 dark:text-yellow-200 mb-2">
                Khuyến Nghị An Toàn
              </h4>
              <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                {painStats.painLevelCounts.severe > 0 && (
                  <li>• Đã phát hiện {painStats.painLevelCounts.severe} buổi tập có đau nghiêm trọng - Nên tham khảo ý kiến bác sĩ</li>
                )}
                {painStats.painPercentage > 30 && (
                  <li>• Tỷ lệ đau cao ({painStats.painPercentage.toFixed(1)}%) - Cân nhắc giảm cường độ tập luyện</li>
                )}
                <li>• Luôn dừng tập khi có dấu hiệu đau bất thường</li>
                <li>• Hãy nghỉ ngơi đầy đủ giữa các buổi tập</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
