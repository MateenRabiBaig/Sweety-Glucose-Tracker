import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import apiRequest from "../services/api";

const MonthlyTrendChart = () => {
  const { token } = useAuth();
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTrends = async () => {
      try {
        const data = await apiRequest("/reports/trends", { token });
        setTrends(data.trends || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadTrends();
  }, [token]);

  const chartData = trends.map((item, index) => ({
    ...item,
    index,
    value: item.average === null ? null : Number(item.average),
    label: item.month.split(" ")[0]
  }));
  const points = chartData.filter((item) => item.value !== null);
  const max = points.length ? Math.max(...points.map((point) => point.value)) : 0;
  const min = points.length ? Math.min(...points.map((point) => point.value)) : 0;
  const range = max - min || 1;
  const width = 720;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const getX = (index) => padding.left + (index * (width - padding.left - padding.right)) / Math.max(trends.length - 1, 1);
  const getY = (value) => padding.top + ((max - value) * (height - padding.top - padding.bottom)) / range;
  const lineSegments = [];
  let currentSegment = [];

  chartData.forEach((point) => {
    if (point.value === null) {
      if (currentSegment.length) lineSegments.push(currentSegment);
      currentSegment = [];
      return;
    }
    currentSegment.push(`${getX(point.index)},${getY(point.value)}`);
  });

  if (currentSegment.length) lineSegments.push(currentSegment);

  return (
    <section className="panel trend-panel">
      <div className="panel-heading">
        <div>
          <h2>Monthly Glucose Trend</h2>
          <p>Average glucose levels over the last six months.</p>
        </div>
      </div>

      {loading ? (
        <p className="loading-message">Loading chart...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : points.length === 0 ? (
        <div className="empty-state">
          <h3>No trend data available</h3>
          <p>Add glucose readings to view your monthly trend.</p>
        </div>
      ) : (
        <div className="trend-chart">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly average glucose trend">
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="currentColor" opacity="0.18" />
            <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="currentColor" opacity="0.18" />
            <line x1={padding.left} y1={(height - padding.bottom + padding.top) / 2} x2={width - padding.right} y2={(height - padding.bottom + padding.top) / 2} stroke="currentColor" opacity="0.1" strokeDasharray="4 5" />
            {lineSegments.map((segment, index) => (
              <polyline key={index} points={segment.join(" ")} fill="none" stroke="#496b50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {points.map((point) => (
              <g key={point.month}>
                <circle cx={getX(point.index)} cy={getY(point.value)} r="5" fill="#496b50">
                  <title>{`${point.month}: ${point.value.toFixed(1)} mg/dl`}</title>
                </circle>
                <text x={getX(point.index)} y={height - 14} textAnchor="middle" fontSize="12">{point.label}</text>
              </g>
            ))}
            <text x="8" y={padding.top + 4} fontSize="12">{max}</text>
            <text x="8" y={height - padding.bottom} fontSize="12">{min}</text>
          </svg>
        </div>
      )}
    </section>
  );
};

export default MonthlyTrendChart;
