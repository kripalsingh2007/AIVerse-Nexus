import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { Sliders, Volume2, VolumeX, Sparkles, RefreshCw, Zap } from 'lucide-react';

export default function ControlCenter() {
  const {
    rlExploration, setRlExploration,
    modelWeightCF, setModelWeightCF,
    abTrafficSplit, setAbTrafficSplit,
    attentionHeads, setAttentionHeads,
    isAudioEnabled, setIsAudioEnabled,
    playBeep
  } = useSimulation();

  const handleConvertTrigger = (model) => {
    // Synth success bell
    playBeep(model === 'A' ? 1046.50 : 1318.51, 'triangle', 0.12);
    // Visual trigger blip
    const event = new CustomEvent('conversion-trigger', { detail: { model } });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col h-full rounded-xl cyber-panel border-cyan-500/20 border bg-[#050111]/85 p-4 justify-between space-y-4">
      
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2.5">
          <Sliders className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-orbitron tracking-widest text-cyan-400 glow-text-cyan uppercase font-semibold">
            Interactive Control Center
          </span>
        </div>
        
        {/* Audio Toggle */}
        <button
          onClick={() => {
            const nextVal = !isAudioEnabled;
            setIsAudioEnabled(nextVal);
            // Play confirm beep if enabling
            if (nextVal) {
              setTimeout(() => {
                try {
                  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                  const osc = audioCtx.createOscillator();
                  const gain = audioCtx.createGain();
                  osc.frequency.value = 600;
                  gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                  osc.connect(gain); gain.connect(audioCtx.destination);
                  osc.start(); osc.stop(audioCtx.currentTime + 0.08);
                } catch(e){}
              }, 50);
            }
          }}
          className={`p-1.5 rounded border transition-all duration-300 ${
            isAudioEnabled 
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-cyan-glow' 
              : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-500'
          }`}
          title="Toggle Synth Audio Telemetry"
        >
          {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Tweak Slider Dials */}
      <div className="flex-1 space-y-3.5 text-xs">
        
        {/* Slider 1: RL Exploration */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-orbitron text-slate-300">
            <span className="tracking-wider">RL Exploration Epsilon</span>
            <span className="text-cyan-400 font-bold tracking-widest">{rlExploration.toFixed(2)}</span>
          </div>
          <input
            type="range" min="0.05" max="0.95" step="0.05"
            value={rlExploration}
            onChange={(e) => {
              setRlExploration(parseFloat(e.target.value));
              playBeep(440 + parseFloat(e.target.value) * 300, 'sine', 0.02);
            }}
            className="w-full accent-cyan-400 bg-slate-900 rounded-lg appearance-none h-1 border border-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>Tight exploitation</span>
            <span>Broad exploration (satellite paths)</span>
          </div>
        </div>

        {/* Slider 2: Similarity weight CF */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-orbitron text-slate-300">
            <span className="tracking-wider">Vector Similarity Weights</span>
            <span className="text-magenta-400 font-bold tracking-widest">{(modelWeightCF * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range" min="0.10" max="0.90" step="0.05"
            value={modelWeightCF}
            onChange={(e) => {
              setModelWeightCF(parseFloat(e.target.value));
              playBeep(520 + parseFloat(e.target.value) * 200, 'sine', 0.02);
            }}
            className="w-full accent-magenta-400 bg-slate-900 rounded-lg appearance-none h-1 border border-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>Raw text embeddings</span>
            <span>Collaborative cluster tight pull</span>
          </div>
        </div>

        {/* Slider 3: Attention Heads */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-orbitron text-slate-300">
            <span className="tracking-wider">Transformer Multi-Heads</span>
            <span className="text-violet-400 font-bold tracking-widest">{attentionHeads} Heads</span>
          </div>
          <input
            type="range" min="2" max="16" step="2"
            value={attentionHeads}
            onChange={(e) => {
              setAttentionHeads(parseInt(e.target.value));
              playBeep(330 + parseInt(e.target.value) * 40, 'sine', 0.03);
            }}
            className="w-full accent-violet-400 bg-slate-900 rounded-lg appearance-none h-1 border border-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>Low dimensions</span>
            <span>Hyper-dimensional cross attention</span>
          </div>
        </div>

        {/* Slider 4: A/B split */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-orbitron text-slate-300">
            <span className="tracking-wider">A/B Testing Traffic split</span>
            <div className="font-bold font-orbitron space-x-1 tracking-wider text-[10px]">
              <span className="text-cyan-400">A:{abTrafficSplit}%</span>
              <span className="text-slate-500">|</span>
              <span className="text-magenta-400">B:{100 - abTrafficSplit}%</span>
            </div>
          </div>
          <input
            type="range" min="0" max="100" step="5"
            value={abTrafficSplit}
            onChange={(e) => {
              setAbTrafficSplit(parseInt(e.target.value));
              playBeep(400 + parseInt(e.target.value) * 3, 'sine', 0.02);
            }}
            className="w-full accent-cyan-400 bg-slate-900 rounded-lg appearance-none h-1 border border-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>Greedy search model</span>
            <span>Exploration neural ranker</span>
          </div>
        </div>

      </div>

      {/* Bottom Command Buttons (Simulated conversions) */}
      <div className="space-y-2.5 pt-2.5 border-t border-slate-800">
        <div className="text-[9px] font-orbitron tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
          A/B Live Conversion Testing
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <button
            onClick={() => handleConvertTrigger('A')}
            className="py-2 px-2.5 font-orbitron rounded-lg border border-cyan-500/30 text-cyan-300 bg-cyan-950/20 hover:bg-cyan-500/20 active:scale-95 transition-all uppercase flex items-center justify-center gap-1.5 shadow-none hover:shadow-cyan-glow"
          >
            <Zap className="w-3 h-3" />
            Trigger Conv A
          </button>
          
          <button
            onClick={() => handleConvertTrigger('B')}
            className="py-2 px-2.5 font-orbitron rounded-lg border border-magenta-500/30 text-magenta-300 bg-magenta-950/20 hover:bg-magenta-500/20 active:scale-95 transition-all uppercase flex items-center justify-center gap-1.5 shadow-none hover:shadow-magenta-glow"
          >
            <RefreshCw className="w-3 h-3" />
            Trigger Conv B
          </button>
        </div>
      </div>
      
    </div>
  );
}
