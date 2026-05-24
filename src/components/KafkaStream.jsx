import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { Terminal, ShieldAlert, Wifi, Play, Pause, Trash2 } from 'lucide-react';

export default function KafkaStream() {
  const { logs, playBeep } = useSimulation();
  const [filterType, setFilterType] = useState('ALL');
  const [isPaused, setIsPaused] = useState(false);
  const [pausedLogs, setPausedLogs] = useState([]);

  // Freeze the stream when paused
  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      setPausedLogs([...logs]);
    }
    playBeep(720, 'triangle', 0.04);
  };

  const activeLogs = isPaused ? pausedLogs : logs;

  const filteredLogs = activeLogs.filter(log => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'RETRIEVAL': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25';
      case 'ATTENTION': return 'bg-violet-500/10 text-violet-400 border-violet-500/25';
      case 'RANKING': return 'bg-magenta-500/10 text-magenta-400 border-magenta-500/25';
      case 'BANDIT': return 'bg-green-500/10 text-green-400 border-green-500/25';
      case 'OUT': return 'bg-white/5 text-slate-300 border-white/10';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/25';
    }
  };

  return (
    <div className="flex flex-col h-[320px] rounded-xl cyber-panel border-cyan-500/20 border bg-[#050111]/85 overflow-hidden">
      
      {/* HUD Bar Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#08021a]/90 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-orbitron tracking-widest text-cyan-400 glow-text-cyan uppercase font-semibold">
            Kafka Live Event Stream
          </span>
        </div>
        
        {/* Terminal Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePauseToggle}
            className={`p-1.5 rounded border transition-all duration-300 ${
              isPaused 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400'
            }`}
            title={isPaused ? "Resume Live Feed" : "Pause Stream"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center space-x-1 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
            <Wifi className={`w-3.5 h-3.5 led-blink-cyan ${isPaused ? 'text-slate-500' : 'text-cyan-400'}`} />
            <span className="text-[9px] font-mono text-slate-400 tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      {/* Segment Filter Menu */}
      <div className="flex items-center justify-start space-x-1.5 px-3 py-2 bg-slate-950/40 border-b border-slate-800/60 text-[9px] font-orbitron tracking-wider">
        {['ALL', 'RETRIEVAL', 'ATTENTION', 'RANKING', 'BANDIT', 'OUT'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setFilterType(t);
              playBeep(600, 'sine', 0.02);
            }}
            className={`px-2 py-1 rounded border transition-all duration-200 uppercase ${
              filterType === t 
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' 
                : 'bg-transparent text-slate-500 border-transparent hover:border-slate-800 hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-2.5 bg-slate-950/80">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 font-orbitron text-xs">
            <ShieldAlert className="w-4 h-4 mr-2" />
            WAITING_FOR_KAFKA_PACKETS_TO_ROUTE...
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2 border-b border-slate-900/50 pb-1.5 hover:bg-slate-900/20 rounded px-1 transition-all">
              <span className="text-slate-600 select-none text-[10px] pt-0.5">
                {log.timestamp}
              </span>
              
              <span className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold font-orbitron tracking-widest uppercase select-none ${getBadgeStyle(log.type)}`}>
                {log.type}
              </span>
              
              <span className="text-slate-300 break-all select-all">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer details */}
      <div className="px-4 py-1.5 bg-[#08021a]/90 border-t border-slate-900 text-[9px] font-mono text-slate-500 flex justify-between">
        <span>LOGS_CAPACITY: 60 EVENTS</span>
        <span>PARTITIONS: [broker_01, broker_02]</span>
      </div>
    </div>
  );
}
