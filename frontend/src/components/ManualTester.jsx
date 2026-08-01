import React, { useState } from 'react';
import { Send, AlertTriangle, CheckCircle, ShieldAlert, Cpu, Fingerprint, Gauge, Network } from 'lucide-react';

const agentIcons = {
  device_agent: Cpu,
  behavioral_agent: Fingerprint,
  velocity_agent: Gauge,
  graph_mule_agent: Network
};

const agentLabels = {
  device_agent: 'Device Integrity Agent',
  behavioral_agent: 'Behavioral Biometrics Agent',
  velocity_agent: 'Velocity & CBN Guard Agent',
  graph_mule_agent: 'Graph Mule Network Agent'
};

const ManualTester = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Form state
  const [amount, setAmount] = useState('25000');
  const [daysSinceReactivation, setDaysSinceReactivation] = useState('1');
  const [rolling24hSpend, setRolling24hSpend] = useState('0');
  const [isRooted, setIsRooted] = useState(false);
  const [isEmulator, setIsEmulator] = useState(false);
  const [hasVPN, setHasVPN] = useState(false);
  const [inputMethod, setInputMethod] = useState('TYPED');
  const [keystrokeDwell, setKeystrokeDwell] = useState('85');
  const [touchPressure, setTouchPressure] = useState('0.5');
  const [institutionType, setInstitutionType] = useState('COMMERCIAL_BANK');
  const [paymentRef, setPaymentRef] = useState('Transfer to friend');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const payload = {
      transaction_id: `tx_manual_${Date.now()}`,
      channel: "MOBILE_APP",
      payment_details: {
        amount_ngn: parseFloat(amount),
        payment_reference: paymentRef
      },
      source_account: {
        account_number: "0123456789",
        bank_code: "044",
        account_tier: "TIER_3",
        current_balance_ngn: 500000,
        days_since_reactivation: parseInt(daysSinceReactivation)
      },
      destination_account: {
        account_number: "9876543210",
        bank_code: "058",
        institution_type: institutionType,
        account_name_resolved: "John Doe",
        days_since_creation: 30
      },
      device_context: {
        device_guid: "d6c40a5a-8ba5-4f4a-912a-bc964a3a69b2",
        is_rooted: isRooted,
        is_emulator: isEmulator,
        has_vpn_active: hasVPN
      },
      behavioral_telemetry: {
        keystroke_dwell_time_avg_ms: parseFloat(keystrokeDwell),
        flight_time_avg_ms: 120.0,
        input_method: inputMethod,
        touch_pressure_normalized: parseFloat(touchPressure)
      },
      rolling_24h_spend: parseFloat(rolling24hSpend)
    };

    try {
      const response = await fetch("http://localhost:8080/api/v1/fraud/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Backend server is offline. Start it with: python backend/server.py" });
    }
    setLoading(false);
  };

  const getVerdictStyle = (verdict) => {
    if (verdict === 'REJECT') return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' };
    if (verdict === 'CHALLENGE') return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' };
    return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', color: '#10b981' };
  };

  const getRiskBarWidth = (score) => `${Math.min(score * 100, 100)}%`;
  const getRiskBarColor = (score) => {
    if (score >= 0.75) return '#ef4444';
    if (score >= 0.40) return '#f59e0b';
    return '#10b981';
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '4px',
    display: 'block',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const checkboxContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#94a3b8'
  };

  return (
    <div className="simulator-layout">
      {/* Left Column - Policy Playground Form */}
      <div className="glass-panel simulator-form-panel">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          <Send size={18} color="var(--accent-blue)" />
          Transaction Policy Sandbox
        </h3>
        
        <form onSubmit={handleSubmit}>
          {/* Row 1: Core Transaction */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Amount (₦)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Days Since Device Bind</label>
              <input type="number" value={daysSinceReactivation} onChange={e => setDaysSinceReactivation(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Rolling 24h Spend (₦)</label>
              <input type="number" value={rolling24hSpend} onChange={e => setRolling24hSpend(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Row 2: Device Toggles */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ ...labelStyle, marginBottom: '8px' }}>Device Context</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ ...checkboxContainerStyle, borderColor: isRooted ? 'rgba(239,68,68,0.4)' : undefined, background: isRooted ? 'rgba(239,68,68,0.08)' : undefined }}>
                <input type="checkbox" checked={isRooted} onChange={e => setIsRooted(e.target.checked)} />
                Rooted / Jailbroken
              </label>
              <label style={{ ...checkboxContainerStyle, borderColor: isEmulator ? 'rgba(239,68,68,0.4)' : undefined, background: isEmulator ? 'rgba(239,68,68,0.08)' : undefined }}>
                <input type="checkbox" checked={isEmulator} onChange={e => setIsEmulator(e.target.checked)} />
                Emulator Detected
              </label>
              <label style={{ ...checkboxContainerStyle, borderColor: hasVPN ? 'rgba(245,158,11,0.4)' : undefined, background: hasVPN ? 'rgba(245,158,11,0.08)' : undefined }}>
                <input type="checkbox" checked={hasVPN} onChange={e => setHasVPN(e.target.checked)} />
                VPN Active
              </label>
            </div>
          </div>

          {/* Row 3: Behavioral + Destination */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Input Method</label>
              <select value={inputMethod} onChange={e => setInputMethod(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="TYPED">Typed</option>
                <option value="PASTED_FROM_CLIPBOARD">Pasted</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Keystroke Dwell (ms)</label>
              <input type="number" value={keystrokeDwell} onChange={e => setKeystrokeDwell(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Touch Pressure (0-1)</label>
              <input type="number" step="0.01" value={touchPressure} onChange={e => setTouchPressure(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Destination Type</label>
              <select value={institutionType} onChange={e => setInstitutionType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="COMMERCIAL_BANK">Commercial Bank</option>
                <option value="NEOBANK">Neobank</option>
                <option value="MICROFINANCE">Microfinance</option>
              </select>
            </div>
          </div>

          {/* Row 4: Payment Reference */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Payment Reference / Narration</label>
            <input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} style={inputStyle} placeholder="e.g. Crypto buy, Transfer to friend" />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? 'rgba(59, 130, 246, 0.3)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.5px'
            }}
          >
            {loading ? '⏳ Evaluating Transaction...' : '🚀 Submit for Fraud Evaluation'}
          </button>
        </form>
      </div>

      {/* Right Column - Evaluation Engine Results */}
      <div className="glass-panel simulator-result-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          <Cpu size={18} color="var(--accent-blue)" />
          Evaluation Engine Results
        </h3>

        {!result && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.25, textAlign: 'center', padding: '40px' }}>
            <Cpu size={64} style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 600 }}>Awaiting Simulation Payload</h4>
            <p style={{ fontSize: '13px', marginTop: '8px', maxWidth: '300px', lineHeight: 1.4 }}>
              Submit a simulated transaction from the left panel to trace E-Vigil's real-time risk decision tree.
            </p>
          </div>
        )}

        {result && !result.error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Verdict Banner */}
            <div style={{
              padding: '16px 20px',
              background: getVerdictStyle(result.verdict).bg,
              border: `1px solid ${getVerdictStyle(result.verdict).border}`,
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {result.verdict === 'REJECT' ? <ShieldAlert size={24} color="#ef4444" /> :
                 result.verdict === 'CHALLENGE' ? <AlertTriangle size={24} color="#f59e0b" /> :
                 <CheckCircle size={24} color="#10b981" />}
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: getVerdictStyle(result.verdict).color }}>
                    {result.verdict}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                    {result.remediation?.user_display_message}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: getVerdictStyle(result.verdict).color }}>
                  {result.composite_risk_score.toFixed(2)}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Risk Score
                </div>
              </div>
            </div>

            {/* Composite Risk Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
                <span>SAFE (0.0)</span>
                <span>CHALLENGE (0.40)</span>
                <span>REJECT (0.75)</span>
                <span>MAX (1.0)</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%',
                  width: getRiskBarWidth(result.composite_risk_score),
                  background: `linear-gradient(90deg, #10b981, ${getRiskBarColor(result.composite_risk_score)})`,
                  borderRadius: '4px',
                  transition: 'width 0.6s ease'
                }} />
                {/* Threshold markers */}
                <div style={{ position: 'absolute', left: '40%', top: 0, width: '1px', height: '100%', background: 'rgba(245,158,11,0.5)' }} />
                <div style={{ position: 'absolute', left: '75%', top: 0, width: '1px', height: '100%', background: 'rgba(239,68,68,0.5)' }} />
              </div>
            </div>

            {/* Per-Agent Breakdown */}
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Agent-by-Agent Breakdown
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.entries(result.agent_breakdown || {}).map(([name, agent]) => {
                  const Icon = agentIcons[name] || Cpu;
                  const riskPct = (agent.risk_contribution * 100).toFixed(0);
                  return (
                    <div key={name} style={{
                      padding: '14px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '10px',
                      borderLeft: `3px solid ${getRiskBarColor(agent.risk_contribution)}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon size={14} color={getRiskBarColor(agent.risk_contribution)} />
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>
                            {agentLabels[name] || name}
                          </span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: getRiskBarColor(agent.risk_contribution) }}>
                          +{agent.risk_contribution.toFixed(2)}
                        </span>
                      </div>
                      {/* Mini risk bar */}
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginBottom: '8px' }}>
                        <div style={{ height: '100%', width: `${riskPct}%`, background: getRiskBarColor(agent.risk_contribution), borderRadius: '2px' }} />
                      </div>
                      {/* Flags */}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(agent.flags || []).length === 0 ? (
                          <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                            ✓ No anomalies
                          </span>
                        ) : (
                          agent.flags.map((flag, i) => (
                            <span key={i} style={{
                              fontSize: '9px',
                              color: getRiskBarColor(agent.risk_contribution),
                              background: `${getRiskBarColor(agent.risk_contribution)}15`,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontWeight: 600
                            }}>
                              {flag}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Execution Metadata */}
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              marginTop: '8px'
            }}>
              <span>TX ID: <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{result.transaction_id}</span></span>
              <span>Execution: <span style={{ color: result.execution_time_ms <= 45 ? '#10b981' : '#ef4444', fontWeight: 700 }}>{result.execution_time_ms}ms</span></span>
              <span>Reason: <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{result.remediation?.reason_code}</span></span>
            </div>
          </div>
        )}

        {result && result.error && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
            ⚠️ {result.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualTester;
