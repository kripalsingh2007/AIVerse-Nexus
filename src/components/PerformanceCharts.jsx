import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useSimulation } from '../context/SimulationContext';
import { BarChart3, LineChart as LineIcon, Activity, Sparkles } from 'lucide-react';

export default function PerformanceCharts() {
  const { chartData, rlRewardData, abPerformanceData, playBeep } = useSimulation();
  const [activeTab, setActiveTab] = useState('throughput');
  const [flashMessage, setFlashMessage] = useState(null);

  // Listen to manual conversion click triggers to spawn a visual flash alert!
  useEffect(() => {
    const handleConversion = (e) => {
      const model = e.detail.model;
      setFlashMessage(`[ALERT] Conversion Event detected on Model ${model}! Spiking reward vector.`);
      setTimeout(() => setFlashMessage(null), 3000);
    };

    window.addEventListener('conversion-trigger', handleConversion);
    return () => window.removeEventListener('conversion-trigger', handleConversion);
  }, []);

  return (
    <div className="flex flex-col h-[320px] rounded-xl cyber-panel border-violet-500/20 border bg-[#050111]/85 overflow-hidden">
      
      {/* Chart Nav Tabs HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#08021a]/90 border-b border-slate-800">
        <div className="flex items-center space-x-1">
          <BarChart3 className="w-4 h-4 text-violet-400 animate-pulse" />
          <span className="text-xs font-orbitron tracking-widest text-violet-400 glow-text-violet uppercase font-semibold">
            Telemetry Analysis Panels
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {[
            { id: 'throughput', label: 'RPS / Latency', icon: Activity },
            { id: 'rewards', label: 'RL Convergence', icon: LineIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  playBeep(650, 'sine', 0.03);
                }}
                className={`px-3 py-1.5 text-[9px] font-orbitron tracking-widest border rounded transition-all duration-300 uppercase flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-violet-glow'
                    : 'bg-transparent text-slate-500 border-transparent hover:border-slate-850 hover:text-slate-350'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Spiking Flash Banner */}
      {flashMessage && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 text-yellow-300 font-mono text-[9px] px-4 py-1 animate-pulse flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
            {flashMessage}
          </div>
          <span className="text-[8px] opacity-75 font-orbitron">SYSTEM_SYNCED</span>
        </div>
      )}

      {/* Chart Canvas Content */}
      <div className="flex-1 p-4 bg-slate-950/40 relative">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'throughput' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff007f" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#ff007f" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" />
              <XAxis 
                dataKey="time" 
                tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                stroke="rgba(255,255,255,0.05)"
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                stroke="rgba(255,255,255,0.05)"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(8, 4, 22, 0.95)', 
                  borderColor: 'rgba(0, 242, 254, 0.25)', 
                  borderRadius: '8px',
                  boxShadow: '0 0 15px rgba(0,242,254,0.15)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 10
                }}
                labelClassName="text-slate-500 font-orbitron font-semibold mb-1"
                itemStyle={{ color: '#cbd5e1' }}
              />
              <Area 
                name="RPS Throughput"
                type="monotone" 
                dataKey="throughput" 
                stroke="#00f2fe" 
                fillOpacity={1} 
                fill="url(#colorThroughput)" 
                strokeWidth={2}
              />
              <Area 
                name="Avg Latency (ms)"
                type="monotone" 
                dataKey="latency" 
                stroke="#ff007f" 
                fillOpacity={1} 
                fill="url(#colorLatency)" 
                strokeWidth={2}
              />
            </AreaChart>
          ) : (
            <LineChart data={rlRewardData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" />
              <XAxis 
                dataKey="episode" 
                tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                stroke="rgba(255,255,255,0.05)"
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                stroke="rgba(255,255,255,0.05)"
                domain={[0.4, 1.0]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(8, 4, 22, 0.95)', 
                  borderColor: 'rgba(138, 43, 226, 0.25)', 
                  borderRadius: '8px',
                  boxShadow: '0 0 15px rgba(138,43,226,0.15)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 10
                }}
                labelClassName="text-slate-500 font-orbitron font-semibold mb-1"
                itemStyle={{ color: '#cbd5e1' }}
              />
              <Line 
                name="Greedy Core policy Reward"
                type="monotone" 
                dataKey="rewardA" 
                stroke="#39ff14" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#39ff14', strokeWidth: 1 }}
              />
              <Line 
                name="Exploratory Bandit Reward"
                type="monotone" 
                dataKey="rewardB" 
                stroke="#8a2be2" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#8a2be2', strokeWidth: 1 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer details */}
      <div className="px-4 py-1.5 bg-[#08021a]/90 border-t border-slate-900 text-[9px] font-mono text-slate-500 flex justify-between">
        <span>METRICS_HISTORY: 20 Ticks BUFFER</span>
        <span>PLOTS: SVG RENDER ENGINE</span>
      </div>
    </div>
  );
}
