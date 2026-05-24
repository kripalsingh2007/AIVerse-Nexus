import React, { useEffect, useState } from 'react';
import { useSimulation } from './context/SimulationContext';
import ThreeUniverse from './components/ThreeUniverse';
import PipelineFlow from './components/PipelineFlow';
import ControlCenter from './components/ControlCenter';
import ExplainabilityPanel from './components/ExplainabilityPanel';
import PerformanceCharts from './components/PerformanceCharts';
import KafkaStream from './components/KafkaStream';
import { 
  Shield, 
  Cpu, 
  Activity, 
  Clock, 
  Users, 
  HelpCircle, 
  Lock, 
  Unlock, 
  Settings, 
  AlertTriangle, 
  Gauge, 
  TrendingUp, 
  FileCode,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const {
    throughput,
    latencyAvg,
    latencyP99,
    activeConnections,
    totalServed,
    conceptDrift,
    isAudioEnabled,
    setIsAudioEnabled,
    playBeep,
    isServerOnline,
    
    // Auth & Rate limits states
    activeUser,
    userRole,
    userToken,
    loginUser,
    logoutUser,
    rateLimitLimit,
    rateLimitRemaining,
    securityAlert,
    abStats
  } = useSimulation();

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [systemStatus, setSystemStatus] = useState('NOMINAL');
  const [pulseMetric, setPulseMetric] = useState(false);
  const [dashboardMode, setDashboardMode] = useState('command'); // 'command' or 'observability'
  
  // Login input states
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [authError, setAuthError] = useState(null);

  // Time clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Flash stats on update
  useEffect(() => {
    setPulseMetric(true);
    const t = setTimeout(() => setPulseMetric(false), 200);
    return () => clearTimeout(t);
  }, [totalServed]);

  const handlePresetSelect = (usr, pwd) => {
    setLoginUsername(usr);
    setLoginPassword(pwd);
    playBeep(700, 'sine', 0.03);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const res = await loginUser(loginUsername, loginPassword);
    if (!res.success) {
      setAuthError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#03000d] text-slate-100 p-4 font-sans select-none relative overflow-x-hidden cyber-hud-overlay cyber-grid">
      
      {/* Background visual neon noise */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-slate-950/40 to-black" />

      {/* --- RBAC CONSOLE SECURITY WARNING ALERTS --- */}
      {securityAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-bounce">
          <div className="bg-red-500/15 border-2 border-red-500/60 text-red-300 rounded-xl p-3.5 shadow-2xl backdrop-blur-md flex items-center space-x-3.5">
            <AlertCircle className="w-6 h-6 text-red-400 led-blink-magenta" />
            <div>
              <div className="text-xs font-orbitron font-bold uppercase tracking-widest text-red-400">Security Gate Block</div>
              <div className="text-[10px] font-mono mt-0.5">{securityAlert}</div>
            </div>
          </div>
        </div>
      )}

      {/* --- TOP HUD HEADER --- */}
      <header className="relative z-10 w-full mb-4 cyber-panel border-cyan-500/25 border p-3.5 rounded-xl bg-[#07021c]/80 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Brand Details */}
        <div className="flex items-center space-x-3.5">
          <div className="p-2 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-lg shadow-cyan-glow relative">
            <Cpu className="w-6 h-6 text-white animate-pulse" />
            <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-lg blur opacity-50 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-orbitron font-extrabold tracking-widest bg-gradient-to-r from-cyan-400 via-violet-400 to-magenta-400 bg-clip-text text-transparent uppercase">
                AIVerse Nexus
              </h1>
              <span className="text-[9px] font-mono border border-cyan-500/35 bg-cyan-500/10 px-1.5 py-0.5 rounded text-cyan-300 tracking-wider">
                v4.8-PROD
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 tracking-wider">
              ENTERPRISE COGNITIVE RECOMMENDATION ORCHESTRATOR
            </p>
          </div>
        </div>

        {/* Live Numeric Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 max-w-3xl w-full px-2 sm:px-6">
          
          <div className="text-left border-l border-slate-800 pl-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
              DECISIONS_SERVED
            </span>
            <span className={`text-sm font-orbitron font-bold text-slate-200 tracking-wider block transition-all ${
              pulseMetric ? 'text-cyan-400 scale-[1.02]' : ''
            }`}>
              {totalServed.toLocaleString()}
            </span>
          </div>

          <div className="text-left border-l border-slate-800 pl-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
              SYSTEM_THROUGHPUT
            </span>
            <span className="text-sm font-orbitron font-bold text-cyan-400 glow-text-cyan tracking-wider block flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              {throughput.toLocaleString()} RPS
            </span>
          </div>

          <div className="text-left border-l border-slate-800 pl-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
              AVG_LATENCY
            </span>
            <span className="text-sm font-orbitron font-bold text-magenta-400 glow-text-magenta tracking-wider block flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-magenta-400" />
              {latencyAvg} ms
            </span>
          </div>

          <div className="text-left border-l border-slate-800 pl-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
              ACTIVE_SESSIONS
            </span>
            <span className="text-sm font-orbitron font-bold text-violet-400 glow-text-violet tracking-wider block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              {activeConnections.toLocaleString()}
            </span>
          </div>

        </div>

        {/* System Time and Operational Status */}
        <div className="flex flex-row md:flex-col justify-end items-end gap-3 text-right">
          <div className="text-xs font-mono text-slate-400 tracking-wider">
            {currentTime}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-mono text-slate-500 uppercase">ENGINE</span>
            <div className={`px-2 py-0.5 rounded text-[10px] font-orbitron font-bold tracking-widest border transition-all ${
              isServerOnline 
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 led-blink-cyan' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}>
              {isServerOnline ? 'CORE_NEURAL_PYTORCH' : 'STANDALONE_JS_HUD'}
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase">SYS_STATUS</span>
            <div className={`px-2 py-0.5 rounded text-[10px] font-orbitron font-bold tracking-widest border transition-all ${
              systemStatus === 'NOMINAL' 
                ? 'bg-green-500/10 text-green-300 border-green-500/40 led-blink-green' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/40 led-blink-magenta'
            }`}>
              {systemStatus}
            </div>
          </div>
        </div>

      </header>

      {/* --- HUD COCKPIT MODE SELECTION TABS --- */}
      <div className="relative z-10 w-full mb-4 flex justify-start space-x-2">
        <button
          onClick={() => {
            setDashboardMode('command');
            playBeep(600, 'sine', 0.03);
          }}
          className={`px-4 py-2 text-xs font-orbitron tracking-widest rounded-lg border transition-all duration-300 uppercase flex items-center gap-2 ${
            dashboardMode === 'command'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-glow'
              : 'bg-transparent text-slate-400 border-slate-800 hover:bg-slate-800/30'
          }`}
        >
          <Settings className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          Command NET (Models & Pipeline)
        </button>

        <button
          onClick={() => {
            setDashboardMode('observability');
            playBeep(700, 'sine', 0.03);
          }}
          className={`px-4 py-2 text-xs font-orbitron tracking-widest rounded-lg border transition-all duration-300 uppercase flex items-center gap-2 ${
            dashboardMode === 'observability'
              ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-violet-glow'
              : 'bg-transparent text-slate-400 border-slate-800 hover:bg-slate-800/30'
          }`}
        >
          <Gauge className="w-4 h-4 text-violet-400" />
          Telemetry Matrix (Observability & Security)
        </button>
      </div>

      {/* --- MASTER DASHBOARD CONTENT WRAPPERS --- */}
      {dashboardMode === 'command' ? (
        // VIEW MODE 1: Core neural networking and models parameter selectors
        <main className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fadeIn">
          
          <section className="flex flex-col space-y-4 lg:col-span-1">
            <ThreeUniverse />
            <PipelineFlow />
          </section>

          <section className="flex flex-col space-y-4 lg:col-span-1">
            <ControlCenter />
            <ExplainabilityPanel />
          </section>

          <section className="flex flex-col space-y-4 lg:col-span-1">
            <PerformanceCharts />
            <KafkaStream />
          </section>

        </main>
      ) : (
        // VIEW MODE 2: Grafana-HUD Observability & Cryptographic authentication splits
        <main className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fadeIn">
          
          {/* Column A: JWT Identity Console & Role Lockouts */}
          <section className="flex flex-col space-y-4 lg:col-span-1">
            
            {/* Identity console card */}
            <div className="cyber-panel p-4 rounded-xl border border-cyan-500/20 bg-[#050111]/85 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3.5 border-b border-slate-800 pb-2.5">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-orbitron tracking-widest text-cyan-400 glow-text-cyan uppercase font-semibold">
                    JWT Identity & RBAC Keys
                  </span>
                </div>

                {activeUser === "anonymous" ? (
                  // User log-in options
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="bg-cyan-950/10 border border-cyan-500/10 rounded-lg p-3 text-[10px] text-slate-400 font-mono leading-normal">
                      [INFO] Guest sessions operate view-only. Log in as an **Admin** profile to unlock PyTorch model weights sliders!
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[9px] font-orbitron uppercase">
                      <button 
                        type="button" onClick={() => handlePresetSelect('admin', 'admin123')}
                        className={`py-1 border rounded ${loginUsername === 'admin' ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300' : 'bg-transparent border-slate-800 text-slate-400'}`}
                      >
                        Admin Profile
                      </button>
                      <button 
                        type="button" onClick={() => handlePresetSelect('auditor', 'audit123')}
                        className={`py-1 border rounded ${loginUsername === 'auditor' ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300' : 'bg-transparent border-slate-800 text-slate-400'}`}
                      >
                        Auditor
                      </button>
                      <button 
                        type="button" onClick={() => handlePresetSelect('guest', 'guest123')}
                        className={`py-1 border rounded ${loginUsername === 'guest' ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300' : 'bg-transparent border-slate-800 text-slate-400'}`}
                      >
                        Guest View
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-slate-500 block uppercase">Client Username</label>
                        <input 
                          type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-slate-500 block uppercase">Password Hash</label>
                        <input 
                          type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                    </div>

                    {authError && (
                      <div className="text-[10px] font-mono text-red-400 font-semibold">{authError}</div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 rounded-lg text-xs font-orbitron font-semibold uppercase tracking-widest text-slate-100 hover:shadow-cyan-glow transition-all"
                    >
                      Authenticate Session
                    </button>
                  </form>
                ) : (
                  // Logged-in profile view
                  <div className="space-y-4 font-mono text-xs text-slate-300">
                    <div className="cyber-panel p-3 rounded-lg border border-slate-800 bg-[#0d091e]/50 flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center relative">
                        <Unlock className="w-5 h-5 text-white" />
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 border-2 border-slate-900 rounded-full led-blink-green" />
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase leading-none">Active Signee</div>
                        <div className="font-orbitron text-sm font-semibold tracking-wider text-emerald-400 uppercase mt-0.5">
                          {activeUser}
                        </div>
                        <div className="text-[9px] text-emerald-300 uppercase leading-none mt-1 font-orbitron tracking-widest border border-emerald-500/30 bg-emerald-500/10 px-1 rounded inline-block">
                          Role: {userRole}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 uppercase block text-[9px] mb-0.5">JWT Token Signature</span>
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-900 break-all select-all text-slate-400 text-[10px] leading-relaxed">
                          {userToken.slice(0, 48)}...
                        </div>
                      </div>

                      <div className="bg-slate-900/30 border border-slate-800 p-2 rounded-lg text-[10px] text-slate-400 leading-normal flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Valid key cryptographically verified on backend. Rate limit quota restored dynamically.</span>
                      </div>
                    </div>

                    <button
                      onClick={logoutUser}
                      className="w-full py-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-orbitron font-semibold uppercase tracking-widest transition-all"
                    >
                      Disconnect Keys
                    </button>
                  </div>
                )}
              </div>

              {/* API Rate Limiting meter */}
              <div className="border-t border-slate-800 pt-3.5 space-y-2 mt-4">
                <div className="flex justify-between items-center text-[10px] font-orbitron">
                  <span className="text-slate-500 uppercase tracking-widest">Rate Limit Consumption</span>
                  <span className="text-cyan-400 font-bold">{rateLimitRemaining} / {rateLimitLimit} REQ/MIN</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-900 overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500 shadow-cyan-glow"
                    style={{ width: `${(rateLimitRemaining / rateLimitLimit) * 100}%` }}
                  />
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  Resets in standard sliding window (HTTP Header: X-RateLimit-Reset)
                </div>
              </div>

            </div>

          </section>

          {/* Column B: Concept Drift Indicator & Telemetry */}
          <section className="flex flex-col space-y-4 lg:col-span-1">
            
            <div className="cyber-panel p-4 rounded-xl border border-violet-500/20 bg-[#050111]/85 h-full flex flex-col justify-between">
              
              <div>
                <div className="flex items-center space-x-2.5 mb-3.5 border-b border-slate-800 pb-2.5">
                  <AlertTriangle className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-orbitron tracking-widest text-violet-400 glow-text-violet uppercase font-semibold">
                    Dynamic Concept Drift Registry
                  </span>
                </div>

                <div className="space-y-4">
                  
                  {/* Warning Indicator Shield */}
                  <div className={`p-3 rounded-lg border flex items-start gap-3 transition-all ${
                    conceptDrift > 0.4 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}>
                    {conceptDrift > 0.4 ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 led-blink-magenta shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-400 led-blink-green shrink-0 mt-0.5" />
                    )}
                    
                    <div className="text-xs font-mono">
                      <div className="font-orbitron font-semibold uppercase text-[10px]">
                        {conceptDrift > 0.4 ? 'WARNING: HIGH DRIFT SUSPECTED' : 'SYSTEM HEALTH: OPTIMAL'}
                      </div>
                      <div className="text-[10px] opacity-75 mt-0.5 leading-normal">
                        {conceptDrift > 0.4 
                          ? 'Concept drift is crossing critical thresholds! Recommend triggering Airflow canary retraining tasks.'
                          : 'Feature vector distributions remain stable aligned to ratings baseline indexes.'}
                      </div>
                    </div>
                  </div>

                  {/* Circular Dial representation */}
                  <div className="flex flex-col items-center justify-center p-4">
                    <div className="relative w-32 h-32 rounded-full border-4 border-dashed border-slate-800 flex flex-col items-center justify-center">
                      {/* Interactive ring glowing */}
                      <div 
                        className={`absolute inset-0 rounded-full border-2 border-t-transparent transition-all duration-700 animate-spin ${
                          conceptDrift > 0.4 ? 'border-amber-400' : 'border-cyan-400'
                        }`}
                        style={{ animationDuration: '3s' }}
                      />
                      <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">DRIFT_INDEX</div>
                      <div className={`text-2xl font-orbitron font-bold tracking-wide ${
                        conceptDrift > 0.4 ? 'text-amber-400' : 'text-cyan-400 glow-text-cyan'
                      }`}>
                        {conceptDrift.toFixed(3)}
                      </div>
                      <div className="text-[8px] font-mono text-slate-600 mt-1 uppercase">LIMIT: 0.400</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 leading-normal font-mono text-[10px] space-y-1">
                    <div>1. Drift aggregates sequence divergence offsets.</div>
                    <div>2. Trigger limit defined in Grafana alerting.</div>
                    <div>3. Live scraper targets: Prometheus `/metrics`.</div>
                  </div>

                </div>
              </div>

              {/* Mock trigger buttons */}
              <div className="border-t border-slate-800 pt-3.5 mt-4">
                <button
                  onClick={() => {
                    playBeep(980, 'sine', 0.12);
                    alert("API TRIGGER: Apache Airflow dynamic retraining workflow triggered via active DAG canary deployment.");
                  }}
                  className="w-full py-2 bg-violet-600/20 hover:bg-violet-600/35 border border-violet-500/40 hover:border-violet-500/60 rounded-lg text-[10px] font-orbitron font-semibold uppercase tracking-widest text-violet-300 transition-all flex items-center justify-center gap-1.5 shadow-none hover:shadow-violet-glow"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                  Trigger Airflow Retraining
                </button>
              </div>

            </div>

          </section>

          {/* Column C: A/B Variant stats Z-score and p-values */}
          <section className="flex flex-col space-y-4 lg:col-span-1">
            
            <div className="cyber-panel p-4 rounded-xl border border-magenta-500/20 bg-[#050111]/85 h-full flex flex-col justify-between">
              
              <div>
                <div className="flex items-center space-x-2.5 mb-3.5 border-b border-slate-800 pb-2.5">
                  <TrendingUp className="w-4 h-4 text-magenta-400" />
                  <span className="text-xs font-orbitron tracking-widest text-magenta-400 glow-text-magenta uppercase font-semibold">
                    A/B Statistical Variants CTR
                  </span>
                </div>

                <div className="space-y-4 font-mono text-[11px]">
                  
                  {/* Model A vs B split bar metrics */}
                  <div className="space-y-3">
                    {/* Model A */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-orbitron text-cyan-300">
                        <span>Variant A (Greedy Core)</span>
                        <span className="font-bold">{abStats.variant_a.ctr}% CTR</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span>Trials: {abStats.variant_a.trials} | Clicks: {abStats.variant_a.clicks}</span>
                        <span>95% CI: [{abStats.variant_a.ci[0]}% - {abStats.variant_a.ci[1]}%]</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded border border-slate-900 overflow-hidden relative">
                        <div className="h-full bg-cyan-400 rounded transition-all duration-500" style={{ width: `${abStats.variant_a.ctr * 3.5}%` }} />
                      </div>
                    </div>

                    {/* Model B */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-orbitron text-magenta-300">
                        <span>Variant B (Bandit Explorer)</span>
                        <span className="font-bold">{abStats.variant_b.ctr}% CTR</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span>Trials: {abStats.variant_b.trials} | Clicks: {abStats.variant_b.clicks}</span>
                        <span>95% CI: [{abStats.variant_b.ci[0]}% - {abStats.variant_b.ci[1]}%]</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded border border-slate-900 overflow-hidden relative">
                        <div className="h-full bg-magenta-400 rounded transition-all duration-500" style={{ width: `${abStats.variant_b.ctr * 3.5}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Math stats calculations */}
                  <div className="cyber-panel p-3 rounded-lg border border-slate-800 bg-slate-950/50 space-y-1.5 text-[10px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Calculated Z-Score:</span>
                      <span className="font-semibold text-slate-200">{abStats.statistics.z_score}</span>
                    </div>
                    
                    <div className="flex justify-between text-slate-400">
                      <span>Calculated p-Value:</span>
                      <span className="font-semibold text-slate-200">{abStats.statistics.p_value}</span>
                    </div>

                    <div className="border-t border-slate-850 pt-1.5 flex justify-between items-center text-[10px]">
                      <span>Statistical Significance (p &lt; 0.05):</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold font-orbitron ${
                        abStats.statistics.is_significant 
                          ? 'bg-green-500/10 text-green-300 border border-green-500/30 led-blink-green' 
                          : 'bg-slate-900 text-slate-500 border border-slate-850'
                      }`}>
                        {abStats.statistics.is_significant ? 'SIGNIFICANT' : 'NOT SIGNIFICANT'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Note on math */}
              <div className="border-t border-slate-800 pt-3.5 mt-4 text-[9px] text-slate-500 font-mono text-center">
                CTR parameters updated continuously via closed-loop feedback chimes.
              </div>

            </div>

          </section>

        </main>
      )}

      {/* --- FOOTER HUD --- */}
      <footer className="relative z-10 mt-4 p-3.5 rounded-xl cyber-panel border-slate-900 border text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center space-x-2">
          <Shield className="w-3.5 h-3.5 text-cyan-500/60" />
          <span>SECURITY_ENCRYPT: SHA-256 | ACTIVE_USER_ACCESS: Mapped</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="hover:text-cyan-400 cursor-help transition-all flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> HUD Guide
          </span>
          <span>|</span>
          <span className="text-[9px]">AIVerse Inc © 2026. ALL METRICS SCALED FROM PYTORCH BACKEND</span>
        </div>
      </footer>

    </div>
  );
}
