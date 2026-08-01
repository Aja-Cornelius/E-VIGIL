import React, { useState, useEffect } from 'react';
import { Activity, Shield, Users, Zap, Eye, BarChart3, Terminal } from 'lucide-react';
import MetricCard from './components/MetricCard';
import LiveStreamFeed from './components/LiveStreamFeed';
import NetworkInspector from './components/NetworkInspector';
import AnalyticsChart from './components/AnalyticsChart';
import ManualTester from './components/ManualTester';

function App() {
  const [activeTab, setActiveTab] = useState('soc');
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Real-time counter states for session accumulation
  const [totalBlocked, setTotalBlocked] = useState(1204);
  const [totalMules, setTotalMules] = useState(38);
  const [tps, setTps] = useState(4892);

  // Fetch loop moved to parent to drive global metric updates
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const randomAmount = Math.floor(Math.random() * 100000);
        const isNewDevice = Math.random() > 0.8 ? 1 : 100; 
        
        const payload = {
          transaction_id: `tx_${Math.floor(Math.random() * 10000000)}`,
          channel: "MOBILE_APP",
          payment_details: { amount_ngn: randomAmount },
          source_account: { account_number: "0123456789", days_since_reactivation: isNewDevice },
          behavioral_telemetry: { input_method: "TYPED" }
        };

        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const response = await fetch(`${API_BASE_URL}/api/v1/fraud/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          const newTx = {
            id: data.transaction_id,
            amount: randomAmount,
            bvn: `22${Math.floor(100000000 + Math.random() * 900000000)}`,
            risk: data.composite_risk_score,
            verdict: data.verdict,
            time: 'Just now',
            device_guid: `d6c40a5a-8ba5-4f4a-912a-${Math.floor(1000 + Math.random() * 9000)}a69b2`,
            reason_code: data.remediation.reason_code,
            user_display_message: data.remediation.user_display_message,
            execution_time_ms: data.execution_time_ms
          };
          
          setTransactions(prev => {
            const updated = [newTx, ...prev].slice(0, 50);
            if (updated.length > 0 && !selectedTransaction) {
              setSelectedTransaction(updated[0]);
            }
            return updated;
          });

          // Increment global counters based on rules
          if (data.verdict === 'REJECT') {
            setTotalBlocked(c => c + 1);
            if (data.remediation.reason_code === 'ERR_SECURITY_COOLOFF_BREACH_HIGH_MULE_PROBABILITY') {
              setTotalMules(c => c + 1);
            }
          }
        }
      } catch (err) {
        console.error("Backend offline. Retrying...", err);
      }
    };

    fetchRealData();
    const interval = setInterval(fetchRealData, 3000);
    return () => clearInterval(interval);
  }, [selectedTransaction]);

  // Dynamic TPS noise generator to simulate micro-variations
  useEffect(() => {
    const tpsInterval = setInterval(() => {
      setTps(prev => {
        const delta = Math.floor(Math.random() * 20) - 10;
        const target = prev + delta;
        return target < 4800 ? 4850 : target > 5000 ? 4950 : target;
      });
    }, 1500);
    return () => clearInterval(tpsInterval);
  }, []);

  // Compute rolling average latency of backend requests dynamically
  const avgLatency = transactions.length > 0 
    ? Math.round(transactions.reduce((acc, t) => acc + (t.execution_time_ms || 4), 0) / transactions.length) 
    : 4;

  return (
    <div className="dashboard-layout">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div className="brand">
            <Shield size={32} color="#3b82f6" />
            <h1>Project E-Vigil</h1>
          </div>
          
          <nav className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'soc' ? 'active' : ''}`}
              onClick={() => setActiveTab('soc')}
            >
              <Eye size={16} />
              Live SOC Monitor
            </button>
            <button 
              className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={16} />
              SLA & Analytics
            </button>
            <button 
              className={`nav-tab ${activeTab === 'simulator' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulator')}
            >
              <Terminal size={16} />
              Policy Sandbox
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            System Status: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Active (Kafka Stream)</span>
          </div>
          <div style={{ padding: '6px 14px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '13px' }}>
            Admin Desk
          </div>
        </div>
      </header>

      <div className="page-container">
        {activeTab === 'soc' && (
          <div className="soc-layout">
            <LiveStreamFeed 
              transactions={transactions}
              selectedTransactionId={selectedTransaction?.id} 
              onSelectTransaction={setSelectedTransaction} 
            />
            <NetworkInspector selectedTransaction={selectedTransaction} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-layout">
            <div className="metrics-grid">
              <MetricCard title="TPS (NIP Speed)" value={tps.toLocaleString()} icon={Activity} trend={0.4} />
              <MetricCard title="Avg Latency" value={`${avgLatency}ms`} icon={Zap} trend={-3.5} />
              <MetricCard title="Blocked (Cool-off)" value={totalBlocked.toLocaleString()} icon={Shield} trend={4.8} />
              <MetricCard title="Mule Networks Detected" value={totalMules.toString()} icon={Users} />
            </div>
            <div className="chart-container-large">
              <AnalyticsChart transactions={transactions} />
            </div>
          </div>
        )}

        {activeTab === 'simulator' && (
          <ManualTester />
        )}
      </div>
    </div>
  );
}

export default App;
