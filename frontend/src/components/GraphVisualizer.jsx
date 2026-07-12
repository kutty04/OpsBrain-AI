import React, { useEffect, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

const getNodeStyle = (type) => {
  // Node fills are intentionally deep/saturated so they read clearly on BOTH
  // the bright titanium theme (mist bg) and the dark command theme.
  const base = {
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
    borderWidth: '2px',
    borderStyle: 'solid',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'all 180ms ease-in-out',
    backdropFilter: 'blur(4px)',
    letterSpacing: '0.02em',
  };

  switch (type) {
    case 'Vessel':
      // Deep ocean blue — Vessel/Tank
      return { ...base, style: { ...base, background: 'rgba(12, 35, 51, 0.92)', borderColor: '#38bdf8', boxShadow: '0 2px 12px rgba(56, 189, 248, 0.15)' } };
    case 'Instrument':
      // Electric violet — Instruments/Sensors
      return { ...base, style: { ...base, background: 'rgba(44, 18, 48, 0.92)', borderColor: '#e879f9', boxShadow: '0 2px 12px rgba(232, 121, 249, 0.15)' } };
    case 'Valve':
      // Warm amber — Valves (industrial energy)
      return { ...base, style: { ...base, background: 'rgba(42, 26, 8, 0.92)', borderColor: '#fbbf24', boxShadow: '0 2px 12px rgba(251, 191, 36, 0.18)' } };
    case 'Exchanger':
      // Teal-cyan — Heat Exchangers
      return { ...base, style: { ...base, background: 'rgba(5, 35, 32, 0.92)', borderColor: '#2dd4bf', boxShadow: '0 2px 12px rgba(45, 212, 191, 0.15)' } };
    case 'Pump':
      // Bright emerald — Pumps (healthy flow)
      return { ...base, style: { ...base, background: 'rgba(4, 33, 26, 0.92)', borderColor: '#34d399', boxShadow: '0 2px 12px rgba(52, 211, 153, 0.15)' } };
    case 'Line':
    default:
      // Cool graphite — Process Lines
      return { ...base, style: { ...base, background: 'rgba(17, 24, 39, 0.88)', borderColor: '#6b7280', boxShadow: '0 2px 8px rgba(0,0,0,0.30)' } };
  }
};

export default function GraphVisualizer({ graphData, selectedNodeName, investigationStep, isInvestigating, activeGraphTrace }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    if (!graphData || !graphData.nodes) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: rawNodes, edges: rawEdges } = graphData;

    // Circle layout algorithm
    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    const formattedNodes = rawNodes.map((n, index) => {
      // Position start node at center, others around circle
      let x = centerX;
      let y = centerY;

      if (rawNodes.length > 1) {
        const isStart = n.name === selectedNodeName;
        if (!isStart) {
          const angle = (index / (rawNodes.length - 1)) * 2 * Math.PI;
          x = centerX + radius * Math.cos(angle);
          y = centerY + radius * Math.sin(angle);
        }
      }

      const styleObj = getNodeStyle(n.type);
      let nodeClassName = '';

      if (isInvestigating) {
        // Resolve dynamic nodes to pulse
        const traceNodes = activeGraphTrace?.affected_nodes || [selectedNodeName];
        const isCurrentActive = (n.name === selectedNodeName && investigationStep >= 1);
        const isTraceActive = traceNodes.includes(n.name) && investigationStep >= 3;
        
        if (isCurrentActive || isTraceActive) {
          if (n.name === selectedNodeName) {
            styleObj.style.boxShadow = '0 0 25px var(--accent-ai), inset 0 0 10px rgba(6, 182, 212, 0.4)';
            styleObj.style.borderColor = 'var(--accent-ai)';
            styleObj.style.borderWidth = '2px';
            nodeClassName = 'animate-pulse';
          } else {
            styleObj.style.boxShadow = '0 0 25px var(--color-critical), inset 0 0 10px rgba(220, 38, 38, 0.4)';
            styleObj.style.borderColor = 'var(--color-critical)';
            styleObj.style.borderWidth = '2px';
            nodeClassName = 'animate-pulse';
          }
        } else {
          // Dim non-active nodes during active investigation
          styleObj.style.opacity = '0.25';
          styleObj.style.filter = 'blur(0.5px)';
        }
      } else {
        // Highlight selected node (normal state)
        if (n.name === selectedNodeName) {
          styleObj.style.boxShadow = '0 0 15px var(--accent-primary), inset 0 0 6px rgba(59, 130, 246, 0.2)';
          styleObj.style.borderColor = 'var(--accent-primary)';
          styleObj.style.borderWidth = '2px';
        }
      }

      return {
        id: n.id,
        data: { label: `${n.name}\n[${n.type}]` },
        position: { x, y },
        style: styleObj.style,
        className: nodeClassName,
      };
    });

    const formattedEdges = rawEdges.map((e) => {
      let strokeColor = '#94a3b8'; // Line / Flow default
      let strokeDasharray = '';
      let isAnimated = e.relation_type === 'FLOWS_TO';
      
      if (e.relation_type === 'MEASURES') {
        strokeColor = '#c084fc'; // Purple for instrument measure
        strokeDasharray = '5,5';
      } else if (e.relation_type === 'CONTROLS') {
        strokeColor = '#fb923c'; // Orange for control signal
        strokeDasharray = '3,3';
      }

      // During AI investigation, highlight and animate tracing edges dynamically
      const srcNode = rawNodes.find(n => n.id === e.source_id);
      const tgtNode = rawNodes.find(n => n.id === e.target_id);
      
      const isTraceEdge = activeGraphTrace?.affected_edges?.some(trace => 
        (trace.source === srcNode?.name && trace.target === tgtNode?.name) ||
        (trace.source === tgtNode?.name && trace.target === srcNode?.name)
      );

      const isRcaEdgeFallback = !activeGraphTrace && 
        ((srcNode?.name === selectedNodeName && tgtNode?.name === 'GCM-104') ||
         (srcNode?.name === 'GCM-104' && tgtNode?.name === selectedNodeName));

      if (isInvestigating && (isTraceEdge || isRcaEdgeFallback) && investigationStep >= 3) {
        strokeColor = 'var(--accent-ai)';
        isAnimated = true;
      }

      return {
        id: e.id,
        source: e.source_id,
        target: e.target_id,
        label: e.relation_type,
        labelStyle: { fill: '#0f172a', fontSize: '9px', fontWeight: 'bold' },

        style: { 
          stroke: strokeColor, 
          strokeWidth: isInvestigating && (isTraceEdge || isRcaEdgeFallback) && investigationStep >= 3 ? 3 : 2, 

          strokeDasharray 
        },
        animated: isAnimated,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
        },
      };
    });

    setNodes(formattedNodes);
    setEdges(formattedEdges);
  }, [graphData, selectedNodeName, isInvestigating, investigationStep]);

  return (
    <div className="w-full h-[400px] bg-[var(--bg-app)]/50 border border-[var(--border-color)] rounded-lg overflow-hidden relative shadow-sm card-premium">
      <div className="cad-corner-tl" />
      <div className="cad-corner-tr" />
      <div className="cad-corner-bl" />
      <div className="cad-corner-br" />
      
      <div className="absolute top-4 left-4 z-10 bg-[var(--bg-card)]/90 backdrop-blur border border-[var(--border-color)] px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
        Active Topology: {nodes.length} Nodes | {edges.length} Edges
      </div>
      <div className="absolute top-4 right-4 z-10 bg-[var(--bg-card)]/90 backdrop-blur border border-[var(--border-color)] px-3 py-1.5 rounded-lg text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">
        [SYS_TOPOLOGY_FLOW]
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesConnectable={false}
        nodesDraggable={true}
      >
        <Background color="var(--border-color)" gap={16} />
        <Controls showInteractive={false} className="fill-slate-900 stroke-slate-900 bg-[var(--bg-card)] border border-[var(--border-color)] rounded" />
        <MiniMap 
          nodeColor={(n) => 'var(--border-color)'} 
          maskColor="rgba(5, 5, 5, 0.6)"
          className="border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-card)]"
        />
      </ReactFlow>
    </div>
  );
}
