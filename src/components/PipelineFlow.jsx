import React, { useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSimulation } from '../context/SimulationContext';
import { Database, Filter, Cpu, Sliders, Play, LogIn } from 'lucide-react';

// --- Custom Cyberpunk Node Layout ---
const CyberNode = ({ data }) => {
  const Icon = data.icon;
  return (
    <div className={`cyber-panel p-3 rounded-lg border text-left min-w-[170px] ${
      data.active ? 'border-cyan-500/50 shadow-cyan-glow bg-cyan-950/20' : 'border-slate-800 bg-slate-950/40'
    }`}>
      {data.targetHandle && (
        <Handle type="target" position={Position.Left} className="!bg-cyan-400 !border-cyan-200" />
      )}
      
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-orbitron tracking-widest text-slate-500 uppercase">
          {data.sub}
        </span>
        <div className={`h-1.5 w-1.5 rounded-full ${
          data.active ? 'bg-cyan-400 led-blink-cyan' : 'bg-slate-700'
        }`} />
      </div>

      <div className="flex items-center space-x-2">
        <div className={`p-1 rounded ${data.active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-orbitron font-semibold text-slate-200 tracking-wider">
            {data.label}
          </div>
          <div className="text-[10px] font-mono text-cyan-400 font-medium">
            {data.metric}
          </div>
        </div>
      </div>

      {data.sourceHandle && (
        <Handle type="source" position={Position.Right} className="!bg-cyan-400 !border-cyan-200" />
      )}
    </div>
  );
};

export default function PipelineFlow() {
  const { 
    throughput, 
    latencyAvg, 
    attentionHeads, 
    rlExploration, 
    modelWeightCF 
  } = useSimulation();

  const nodeTypes = useMemo(() => ({ cyberNode: CyberNode }), []);

  // Compute live data indicators
  const vectorRetrievalMetric = `${(modelWeightCF * 100).toFixed(0)}% CF Match`;
  const rankingMetric = `${attentionHeads} Multi-Heads`;
  const banditMetric = `Eps: ${rlExploration.toFixed(2)}`;

  // Define nodes layout positions in canvas
  const nodes = useMemo(() => [
    {
      id: 'n-1',
      type: 'cyberNode',
      data: { 
        sub: 'STREAM_IN', 
        label: 'User Request Session', 
        metric: `${(throughput / 10).toFixed(0)} events/sec`, 
        icon: LogIn,
        active: true,
        sourceHandle: true
      },
      position: { x: 30, y: 110 },
    },
    {
      id: 'n-2',
      type: 'cyberNode',
      data: { 
        sub: 'STAGE_1_RETRIEVER', 
        label: 'Vector Similarity', 
        metric: vectorRetrievalMetric, 
        icon: Database,
        active: true,
        sourceHandle: true,
        targetHandle: true
      },
      position: { x: 250, y: 30 },
    },
    {
      id: 'n-3',
      type: 'cyberNode',
      data: { 
        sub: 'STAGE_2_FILTER', 
        label: 'Policy Blocklist', 
        metric: '0.00% duplicates', 
        icon: Filter,
        active: true,
        sourceHandle: true,
        targetHandle: true
      },
      position: { x: 250, y: 190 },
    },
    {
      id: 'n-4',
      type: 'cyberNode',
      data: { 
        sub: 'STAGE_3_RANKER', 
        label: 'Transformer Model', 
        metric: rankingMetric, 
        icon: Cpu,
        active: true,
        sourceHandle: true,
        targetHandle: true
      },
      position: { x: 470, y: 110 },
    },
    {
      id: 'n-5',
      type: 'cyberNode',
      data: { 
        sub: 'STAGE_4_RE_RANK', 
        label: 'Reinforcement Bandit', 
        metric: banditMetric, 
        icon: Sliders,
        active: true,
        sourceHandle: true,
        targetHandle: true
      },
      position: { x: 690, y: 110 },
    },
    {
      id: 'n-6',
      type: 'cyberNode',
      data: { 
        sub: 'STREAM_OUT', 
        label: 'Recommendation Served', 
        metric: `${latencyAvg}ms Latency`, 
        icon: Play,
        active: true,
        targetHandle: true
      },
      position: { x: 910, y: 110 },
    },
  ], [throughput, vectorRetrievalMetric, rankingMetric, banditMetric, latencyAvg]);

  // Edges connecting nodes with flow animations
  const edges = useMemo(() => [
    {
      id: 'e1-2',
      source: 'n-1',
      target: 'n-2',
      type: 'straight',
      animated: true,
      style: { stroke: '#00f2fe', strokeWidth: 1.5, opacity: 0.8 },
    },
    {
      id: 'e1-3',
      source: 'n-1',
      target: 'n-3',
      type: 'straight',
      animated: true,
      style: { stroke: '#8a2be2', strokeWidth: 1.5, opacity: 0.6 },
    },
    {
      id: 'e2-4',
      source: 'n-2',
      target: 'n-4',
      type: 'straight',
      animated: true,
      style: { stroke: '#00f2fe', strokeWidth: 1.5, opacity: 0.8 },
    },
    {
      id: 'e3-4',
      source: 'n-3',
      target: 'n-4',
      type: 'straight',
      animated: true,
      style: { stroke: '#8a2be2', strokeWidth: 1.5, opacity: 0.6 },
    },
    {
      id: 'e4-5',
      source: 'n-4',
      target: 'n-5',
      type: 'straight',
      animated: true,
      style: { stroke: '#ff007f', strokeWidth: 1.8, opacity: 0.9 },
    },
    {
      id: 'e5-6',
      source: 'n-5',
      target: 'n-6',
      type: 'straight',
      animated: true,
      style: { stroke: '#39ff14', strokeWidth: 2.0, opacity: 0.9 },
    },
  ], []);

  return (
    <div className="relative w-full h-[280px] rounded-xl cyber-panel border border-violet-500/20 bg-[#050112]/75 overflow-hidden">
      
      {/* Title HUD Header */}
      <div className="absolute top-3 left-4 flex items-center space-x-2.5 z-20 pointer-events-none">
        <Cpu className="w-4 h-4 text-violet-400 animate-pulse" />
        <div className="text-xs font-orbitron tracking-widest text-violet-400 glow-text-violet uppercase font-semibold">
          Real-time Engine Pipeline Topology
        </div>
      </div>

      <div className="absolute top-3 right-4 text-[9px] font-mono text-slate-500 z-20 pointer-events-none">
        PIPELINE: ACTIVE | ALIGNED TO MULTI-AGENT STATE
      </div>

      {/* React Flow Board */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnDrag={false}
        panOnScroll={false}
        preventScrolling={true}
        nodesDraggable={false}
        elementsSelectable={false}
        className="w-full h-full text-slate-200"
      >
        <Background color="#1f1144" gap={16} size={1} />
        <Controls 
          showZoom={false} 
          showInteractive={false} 
          position="bottom-left" 
          className="!bg-slate-900 !border-slate-800 !shadow-none [&>button]:!bg-slate-900 [&>button]:!text-slate-400 [&>button]:!border-slate-800 [&>svg]:!fill-slate-400"
        />
      </ReactFlow>
    </div>
  );
}
