import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { AnalysisReport, FiveElement } from '../../core/types';

interface EnergyTrendChartProps {
  reports: AnalysisReport[];
  days?: number;
}

const ELEMENT_COLORS = {
  [FiveElement.WOOD]: '#8BA889',  // Emerald/Green
  [FiveElement.FIRE]: '#D98B73',  // Warm Red/Orange
  [FiveElement.EARTH]: '#C4B08B', // Earthy Yellow/Tan
  [FiveElement.METAL]: '#A8A8A8', // Silver/Grey
  [FiveElement.WATER]: '#6B7B8C', // Deep Blue/Grey
};

const ELEMENT_LABELS = {
  [FiveElement.WOOD]: '木',
  [FiveElement.FIRE]: '火',
  [FiveElement.EARTH]: '土',
  [FiveElement.METAL]: '金',
  [FiveElement.WATER]: '水',
};

export const EnergyTrendChart: React.FC<EnergyTrendChartProps> = ({ reports, days = 7 }) => {
  const chartData = React.useMemo(() => {
    // Sort reports by timestamp ascending
    const sortedReports = [...reports].sort((a, b) => a.timestamp - b.timestamp);
    
    // Filter for last X days if needed
    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);
    const filteredReports = sortedReports.filter(r => r.timestamp >= cutoff);

    return filteredReports.map(report => ({
      date: new Date(report.timestamp).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      fullDate: new Date(report.timestamp).toLocaleDateString('ja-JP'),
      [FiveElement.WOOD]: report.totalScores[FiveElement.WOOD],
      [FiveElement.FIRE]: report.totalScores[FiveElement.FIRE],
      [FiveElement.EARTH]: report.totalScores[FiveElement.EARTH],
      [FiveElement.METAL]: report.totalScores[FiveElement.METAL],
      [FiveElement.WATER]: report.totalScores[FiveElement.WATER],
    }));
  }, [reports, days]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-ink/10 rounded-3xl bg-white/5">
        <p className="text-xs tracking-widest text-ink-muted uppercase">十分なデータがありません</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 md:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            {Object.entries(ELEMENT_COLORS).map(([element, color]) => (
              <linearGradient key={`grad-${element}`} id={`grad-${element}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.3)', letterSpacing: '0.1em' }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.3)' }}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255,255,255,0.9)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: '16px',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
              fontSize: '12px',
              padding: '12px'
            }}
            itemStyle={{ padding: '2px 0' }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '8px', color: '#141414' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            formatter={(value) => <span className="text-ink-muted">{ELEMENT_LABELS[value as FiveElement] || value}</span>}
          />
          {Object.entries(ELEMENT_COLORS).map(([element, color]) => (
            <Area
              key={element}
              type="monotone"
              dataKey={element}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#grad-${element})`}
              animationDuration={2000}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
