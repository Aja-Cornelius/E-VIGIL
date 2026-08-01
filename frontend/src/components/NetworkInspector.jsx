import React from 'react';
import { Network, Smartphone, UserX, AlertOctagon, HelpCircle, CheckCircle, ShieldAlert } from 'lucide-react';

const maskString = (str, visibleChars = 4) => {
  if (!str) return '***';
  if (str.length <= visibleChars) return str;
  return '*'.repeat(str.length - visibleChars) + str.slice(-visibleChars);
};


const NetworkInspector = ({ selectedTransaction }) => {
  if (!selectedTransaction) {
    return (
      <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '24px' }}>
        <HelpCircle size={48} color="var(--text-secondary)" style={{ marginBottom: '16px', opacity: 0.3 }} />
        <h3 style={{ color: 'var(--text-secondary)' }}>No Transaction Selected</h3>
        <p style={{ fontSize: '13px', color: 'var(--border-color)', marginTop: '8px' }}>
          Select a transaction from the live evaluation stream to trace its proxy path.
        </p>
      </div>
    );
  }

  const { id, amount, bvn, risk, verdict, device_guid, reason_code, user_display_message } = selectedTransaction;

  const getBadgeClass = (v) => {
    if (v === 'REJECT') return 'high';
    if (v === 'CHALLENGE') return 'medium';
    return 'low';
  };

  const getVerdictIcon = (v) => {
    if (v === 'REJECT') return <ShieldAlert size={14} />;
    if (v === 'CHALLENGE') return <AlertOctagon size={14} />;
    return <CheckCircle size={14} />;
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={20} color="var(--accent-blue)" />
            Network Inspector
          </h3>
          <span className={`score-badge ${getBadgeClass(verdict)}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {getVerdictIcon(verdict)} {verdict}
          </span>
        </div>

        <div className="network-inspector" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Destination Node */}
          <div className="node-item" style={{ borderLeft: verdict === 'REJECT' ? '4px solid var(--accent-red)' : verdict === 'CHALLENGE' ? '4px solid var(--accent-orange)' : '4px solid var(--accent-green)' }}>
            <div className="node-icon" style={{ 
              background: verdict === 'REJECT' ? 'rgba(239, 68, 68, 0.1)' : verdict === 'CHALLENGE' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
              color: verdict === 'REJECT' ? 'var(--accent-red)' : verdict === 'CHALLENGE' ? 'var(--accent-orange)' : 'var(--accent-green)' 
            }}>
              <UserX size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Destination BVN Node</div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600 }}>
                {maskString(bvn, 4)}
              </div>
            </div>
          </div>

          {/* Link line */}
          <div style={{ width: 2, height: 16, background: 'var(--border-color)', margin: '0 0 0 30px', opacity: 0.5 }} />

          {/* Shared Device Node */}
          <div className="node-item" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
            <div className="node-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Evaluated Device (GUID)</div>
              <div className="masked-data" style={{ fontSize: '12px' }}>{maskString(device_guid, 8)}</div>
            </div>
          </div>

          {/* Link line */}
          <div style={{ width: 2, height: 16, background: 'var(--border-color)', margin: '0 0 0 30px', opacity: 0.5 }} />

          {/* Identity Concentrator / Hop loop */}
          <div className="node-item" style={{ borderLeft: '4px solid var(--text-secondary)' }}>
            <div className="node-icon" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
              <Network size={20} />
            </div>
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Linked Graph Hop Indicators</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '10px' }}>
                <span className="masked-data" style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>24h Outflow</span>
                <span className="masked-data" style={{ padding: '2px 6px', background: risk > 0.4 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: '4px', color: risk > 0.4 ? 'var(--accent-orange)' : 'inherit' }}>Fingerprint</span>
                <span className="masked-data" style={{ padding: '2px 6px', background: risk >= 0.75 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: '4px', color: risk >= 0.75 ? 'var(--accent-red)' : 'inherit' }}>Mule Pool</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: verdict === 'REJECT' ? 'rgba(239, 68, 68, 0.05)' : verdict === 'CHALLENGE' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)', 
        borderRadius: '8px', 
        border: verdict === 'REJECT' ? '1px solid rgba(239, 68, 68, 0.2)' : verdict === 'CHALLENGE' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)' 
      }}>
        <h4 style={{ 
          color: verdict === 'REJECT' ? 'var(--accent-red)' : verdict === 'CHALLENGE' ? 'var(--accent-orange)' : 'var(--accent-green)', 
          fontSize: '13px', 
          marginBottom: '6px',
          fontWeight: 600
        }}>
          {reason_code || "EVALUATION_COMPLETED"}
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {user_display_message || "System evaluated this transaction profile. All channels reporting stable risk metrics."}
        </p>
      </div>
    </div>
  );
};

export default NetworkInspector;
