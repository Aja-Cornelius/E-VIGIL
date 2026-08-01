import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

// Utility to mask NDPA sensitive data
const maskString = (str, visibleChars = 4) => {
  if (!str) return '***';
  if (str.length <= visibleChars) return str;
  return '*'.repeat(str.length - visibleChars) + str.slice(-visibleChars);
};

const LiveStreamFeed = ({ transactions, selectedTransactionId, onSelectTransaction }) => {
  const getRiskClass = (verdict) => {
    if (verdict === 'REJECT') return 'risk-high';
    if (verdict === 'CHALLENGE') return 'risk-medium';
    return 'risk-low';
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-red)', animation: 'pulse 2s infinite' }} />
        Live Evaluation Stream
      </h3>
      <div className="feed-container">
        {transactions.map((tx) => (
          <div 
            key={tx.id} 
            className={`tx-item ${getRiskClass(tx.verdict)} ${tx.id === selectedTransactionId ? 'active-tx' : ''}`}
            onClick={() => onSelectTransaction(tx)}
            style={{ cursor: 'pointer', transition: 'all 0.2s ease', border: tx.id === selectedTransactionId ? '1px solid var(--accent-blue)' : '1px solid transparent' }}
          >
            <div className="tx-details">
              <h4>₦{tx.amount.toLocaleString()}</h4>
              <p>ID: <span className="masked-data">{tx.id}</span> | BVN: <span className="masked-data">{maskString(tx.bvn, 4)}</span></p>
              <p style={{ fontSize: '11px', marginTop: '4px' }}>{tx.time}</p>
            </div>
            <div className="tx-score">
              <span className={`score-badge ${getRiskClass(tx.verdict).replace('risk-', '')}`}>
                {tx.verdict}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                R_s: {tx.risk.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .active-tx {
          background: rgba(59, 130, 246, 0.08) !important;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
        }
      `}} />
    </div>
  );
};

export default LiveStreamFeed;
