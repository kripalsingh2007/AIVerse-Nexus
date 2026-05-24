import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { ShieldCheck, Eye, Compass, Cpu, Target } from 'lucide-react';

export default function ExplainabilityPanel() {
  const { selectedNode } = useSimulation();

  return (
    <div className="flex flex-col h-[320px] rounded-xl cyber-panel border-magenta-500/20 border bg-[#050111]/85 overflow-hidden">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#08021a]/90 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Eye className="w-4 h-4 text-magenta-400 animate-pulse" />
          <span className="text-xs font-orbitron tracking-widest text-magenta-400 glow-text-magenta uppercase font-semibold">
            AI Explainability HUD
          </span>
        </div>
        
        <div className="flex items-center space-x-1.5 bg-magenta-950/20 px-2 py-0.5 rounded border border-magenta-500/30">
          <ShieldCheck className="w-3.5 h-3.5 text-magenta-400" />
          <span className="text-[8px] font-orbitron text-magenta-300 tracking-wider">XAI ENGINE</span>
        </div>
      </div>

      {/* Inspected Node Overview */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-900 flex items-center justify-between">
        <div>
          <div className="text-[9px] font-mono text-slate-500 uppercase">Current Mapped Target</div>
          <div className="text-sm font-orbitron text-slate-200 tracking-wider font-semibold glow-text-cyan">
            {selectedNode.id}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-[9px] font-mono text-slate-500 uppercase">Similarity Segment</div>
          <div className="text-xs font-orbitron text-magenta-400 font-semibold uppercase">
            {selectedNode.category}
          </div>
        </div>
      </div>

      {/* Multi-Head Attention Scores & Cosine Matrix Grid */}
      <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40">
        
        {/* Left Column: Multi-head Attention (8-head bars) */}
        <div className="space-y-2">
          <div className="text-[9px] font-orbitron text-slate-400 tracking-wider flex items-center uppercase gap-1 mb-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            Transformer Attention Weights
          </div>
          
          <div className="space-y-1.5">
            {selectedNode.attentionWeights.map((weight, index) => (
              <div key={index} className="flex items-center space-x-2 text-[10px] font-mono">
                <span className="text-slate-500 w-8">Head_{index}</span>
                <div className="flex-1 h-2 bg-slate-900 rounded border border-slate-800 overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-magenta-500 rounded transition-all duration-700"
                    style={{ width: `${weight * 100}%` }}
                  />
                </div>
                <span className="text-magenta-400 font-semibold w-7 text-right">{(weight).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Similarity Cosine & RL decision matrix */}
        <div className="flex flex-col justify-between space-y-4">
          
          {/* Cosine Circular Ring Graphic */}
          <div className="cyber-panel p-2.5 rounded-lg border border-slate-800 bg-[#0d091e]/50 flex items-center space-x-3">
            <div className="relative w-14 h-14 rounded-full flex items-center justify-center border-2 border-dashed border-cyan-500/30 p-1">
              {/* Spinning outline ring */}
              <div className="absolute inset-0 rounded-full border border-cyan-400 border-t-transparent border-r-transparent animate-spin" />
              <Target className="w-5 h-5 text-cyan-400 absolute" />
            </div>

            <div>
              <div className="text-[9px] font-mono text-slate-500 uppercase">Cosine Similarity</div>
              <div className="text-lg font-orbitron font-bold text-cyan-300 tracking-wide leading-none">
                {selectedNode.cosineSimilarity}
              </div>
              <div className="text-[8px] font-mono text-cyan-400/75 mt-1 font-semibold uppercase">
                Confidence: {(selectedNode.rankingConfidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* RL Explainer Decision Logs */}
          <div className="cyber-panel p-2.5 rounded-lg border border-slate-800 bg-[#070b16]/50">
            <div className="text-[9px] font-mono text-slate-500 uppercase mb-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-green-400" />
              RL Action policy Selection
            </div>
            
            <div className="text-[10px] font-mono text-emerald-400 font-semibold break-words uppercase">
              {selectedNode.rlDecision}
            </div>
            
            <div className="text-[9px] text-slate-500 mt-1 leading-normal">
              Epsilon probability split dynamically balances exploratory novelty orbits against greedy historical accuracy vectors.
            </div>
          </div>

        </div>

      </div>

      {/* Footer details */}
      <div className="px-4 py-1.5 bg-[#08021a]/90 border-t border-slate-900 text-[9px] font-mono text-slate-500 flex justify-between">
        <span>XAI_TENSOR_WEIGHTS: Mapped</span>
        <span>LATENT_SPACE: d_model=512</span>
      </div>
    </div>
  );
}
