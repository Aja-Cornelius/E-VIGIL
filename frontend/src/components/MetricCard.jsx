import React from 'react';

const MetricCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="glass-panel metric-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="metric-title">{title}</span>
        {Icon && <Icon size={20} color="var(--accent-blue)" />}
      </div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div style={{ fontSize: '12px', color: trend > 0 ? 'var(--accent-red)' : 'var(--accent-green)', marginTop: 'auto' }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last hour
        </div>
      )}
    </div>
  );
};

export default MetricCard;
