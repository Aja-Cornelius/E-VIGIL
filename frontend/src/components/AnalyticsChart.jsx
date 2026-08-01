import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '8px', fontWeight: 600 }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, fontSize: '12px', margin: '4px 0', fontWeight: 500 }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsChart = ({ transactions }) => {
  const [chartData, setChartData] = useState([]);
  const countersRef = useRef({ approve: 0, challenge: 0, reject: 0 });

  useEffect(() => {
    if (transactions.length === 0) return;

    const latest = transactions[0];
    if (!latest) return;

    // Accumulate verdict counts
    if (latest.verdict === 'APPROVE') countersRef.current.approve++;
    else if (latest.verdict === 'CHALLENGE') countersRef.current.challenge++;
    else if (latest.verdict === 'REJECT') countersRef.current.reject++;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setChartData(prev => {
      const newPoint = {
        time: timeLabel,
        Approved: countersRef.current.approve,
        Challenged: countersRef.current.challenge,
        Rejected: countersRef.current.reject,
      };
      return [...prev, newPoint].slice(-20); // Keep last 20 data points
    });
  }, [transactions]);

  // Calculate session summary stats
  const totalTx = countersRef.current.approve + countersRef.current.challenge + countersRef.current.reject;
  const approveRate = totalTx > 0 ? ((countersRef.current.approve / totalTx) * 100).toFixed(1) : '0.0';
  const rejectRate = totalTx > 0 ? ((countersRef.current.reject / totalTx) * 100).toFixed(1) : '0.0';

  return (
    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
          <BarChart3 size={18} color="var(--accent-blue)" />
          Verdict Distribution (Live)
        </h3>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          <span style={{ color: 'var(--accent-green)' }}>✓ {approveRate}% Pass</span>
          <span style={{ color: 'var(--accent-red)' }}>✕ {rejectRate}% Block</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradChallenged" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradRejected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} 
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} 
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
              iconSize={8}
            />
            <Area 
              type="monotone" 
              dataKey="Approved" 
              stroke="#10b981" 
              strokeWidth={2}
              fill="url(#gradApproved)" 
              animationDuration={600}
            />
            <Area 
              type="monotone" 
              dataKey="Challenged" 
              stroke="#f59e0b" 
              strokeWidth={2}
              fill="url(#gradChallenged)" 
              animationDuration={600}
            />
            <Area 
              type="monotone" 
              dataKey="Rejected" 
              stroke="#ef4444" 
              strokeWidth={2}
              fill="url(#gradRejected)" 
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
