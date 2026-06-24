import React, { useEffect, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

const getNodeStyle = (type) => {
  const base = {
    padding: '12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    border: '1px solid',
    color: '#f8fafc',
    textAlign: 'center',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  };

  switch (type) {
    case 'Vessel':
      return { ...base, bg: 'bg-cyan-950', border: '#06b6d4', style: { background: '#083344', borderColor: '#06b6d4' } };
    case 'Instrument':
      return { ...base, bg: 'bg-fuchsia-950', border: '#d946ef', style: { background: '#4a044e', borderColor: '#d946ef' } };
    case 'Valve':
      return { ...base, bg: 'bg-amber-950', border: '#f59e0b', style: { background: '#451a03', borderColor: '#f59e0b' } };
    case 'Exchanger':
      return { ...base, bg: 'bg-teal-950', border: '#14b8a6', style: { background: '#042f2e', borderColor: '#14b8a6' } };
    case 'Pump':
      return { ...base, bg: 'bg-emerald-950', border: '#10b981', style: { background: '#022c22', borderColor: '#10b981' } };
    case 'Line':
    default:
      return { ...base, bg: 'bg-slate-900', border: '#64748b', style: { background: '#0f172a', borderColor: '#64748b' } };
  }
};

export default function GraphVisualizer({ graphData, selectedNodeName }) {
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

      // Highlight selected node
      if (n.name === selectedNodeName) {
        styleObj.style.boxShadow = '0 0 15px #06b6d4';
        styleObj.style.borderWidth = '2px';
      }

      return {
        id: n.id,
        data: { label: `${n.name}\n[${n.type}]` },
        position: { x, y },
        style: styleObj.style,
      };
    });

    const formattedEdges = rawEdges.map((e) => {
      let strokeColor = '#94a3b8'; // Line / Flow default
      let strokeDasharray = '';
      
      if (e.relation_type === 'MEASURES') {
        strokeColor = '#c084fc'; // Purple for instrument measure
        strokeDasharray = '5,5';
      } else if (e.relation_type === 'CONTROLS') {
        strokeColor = '#fb923c'; // Orange for control signal
        strokeDasharray = '3,3';
      }

      return {
        id: e.id,
        source: e.source_id,
        target: e.target_id,
        label: e.relation_type,
        labelStyle: { fill: '#cbd5e1', fontSize: '9px', fontWeight: 'bold', fillOpacity: 0.8 },
        style: { stroke: strokeColor, strokeWidth: 2, strokeDasharray },
        animated: e.relation_type === 'FLOWS_TO',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
        },
      };
    });

    setNodes(formattedNodes);
    setEdges(formattedEdges);
  }, [graphData, selectedNodeName]);

  return (
    <div className="w-full h-[450px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400">
        Active Topology: {nodes.length} Nodes | {edges.length} Edges
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesConnectable={false}
        nodesDraggable={true}
      >
        <Background color="#334155" gap={16} />
        <Controls showInteractive={false} className="fill-slate-900 stroke-slate-900" />
        <MiniMap 
          nodeColor={(n) => '#1e293b'} 
          maskColor="rgba(15, 23, 42, 0.6)"
          className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950"
        />
      </ReactFlow>
    </div>
  );
}
