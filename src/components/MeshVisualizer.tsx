import React, { useEffect, useRef, useState, useMemo } from 'react';
import { NeuronNode } from '../types/neuron.ts';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Layers, 
  Activity, 
  Sparkles,
  ShieldCheck,
  Cpu,
  Info,
  Maximize2
} from 'lucide-react';

interface MeshVisualizerProps {
  neurons: NeuronNode[];
  selectedNeuron: NeuronNode | null;
  onSelectNeuron: (neuron: NeuronNode | null) => void;
  activePathwaySteps?: string[];
  isDarkTheme?: boolean;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  domain: string;
  status: string;
  latency: number;
  node: NeuronNode;
}

interface SynapseEdge {
  sourceId: string;
  targetId: string;
  active: boolean;
  color?: string;
}

interface AxonPulse {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  speed: number;
  color: string;
}

const DOMAIN_COLORS: Record<string, { bg: string; glow: string; border: string }> = {
  orchestration: { bg: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)', border: '#818cf8' },
  generation: { bg: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', border: '#c084fc' },
  codecraft: { bg: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', border: '#34d399' },
  inference: { bg: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', border: '#fbbf24' },
  storage: { bg: '#0284c7', glow: 'rgba(2, 132, 199, 0.4)', border: '#38bdf8' },
  evaluation: { bg: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', border: '#facc15' },
  agentics: { bg: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)', border: '#2dd4bf' },
  security: { bg: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', border: '#fb7185' },
  interface: { bg: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', border: '#22d3ee' },
  analytics: { bg: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)', border: '#f472b6' }
};

export default function MeshVisualizer({
  neurons,
  selectedNeuron,
  onSelectNeuron,
  activePathwaySteps = [],
  isDarkTheme = true
}: MeshVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<NeuronNode | null>(null);
  const [showSynapses, setShowSynapses] = useState(true);
  const [activePulses, setActivePulses] = useState<AxonPulse[]>([]);
  const [isLivePulsing, setIsLivePulsing] = useState(true);

  // Cached node layout positions
  const nodePositionsRef = useRef<NodePosition[]>([]);
  const pulsesRef = useRef<AxonPulse[]>([]);

  // Compute domain centers & deterministic node layout for 256 nodes
  useEffect(() => {
    if (!neurons || neurons.length === 0) return;

    const domainAngles: Record<string, number> = {
      orchestration: 0,
      generation: Math.PI * 0.2,
      codecraft: Math.PI * 0.4,
      inference: Math.PI * 0.6,
      storage: Math.PI * 0.8,
      security: Math.PI * 1.0,
      evaluation: Math.PI * 1.2,
      agentics: Math.PI * 1.4,
      interface: Math.PI * 1.6,
      analytics: Math.PI * 1.8
    };

    const newPositions: NodePosition[] = neurons.map((node, index) => {
      const isAnchor = index < 8;
      const domain = node.manifest.domain;
      const baseAngle = domainAngles[domain] || 0;
      
      let x = 0;
      let y = 0;

      if (node.manifest.id === 'entangled-multimodal-system-3') {
        x = 0;
        y = 0;
      } else if (isAnchor) {
        const rad = 140;
        x = Math.cos(baseAngle) * rad;
        y = Math.sin(baseAngle) * rad;
      } else {
        const clusterRadius = 80 + (index % 12) * 22;
        const spreadAngle = baseAngle + ((index % 9) - 4) * 0.16 + (Math.sin(index) * 0.08);
        const distance = 160 + (index % 18) * 16;
        x = Math.cos(spreadAngle) * distance;
        y = Math.sin(spreadAngle) * distance;
      }

      const radius = isAnchor ? 12 : (node.manifest.domain === 'orchestration' ? 9 : 6.5);

      return {
        id: node.manifest.id,
        x,
        y,
        vx: 0,
        vy: 0,
        radius,
        domain,
        status: node.status,
        latency: node.health.latency_ms,
        node
      };
    });

    nodePositionsRef.current = newPositions;
  }, [neurons]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;

      // Clear background
      ctx.clearRect(0, 0, width, height);

      // Draw subtle neural grid matrix
      ctx.save();
      ctx.strokeStyle = isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40 * zoom;
      const startX = (pan.x % gridSize);
      const startY = (pan.y % gridSize);

      for (let x = startX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = startY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      const nodes = nodePositionsRef.current;
      const nodeMap = new Map<string, NodePosition>();
      nodes.forEach(n => nodeMap.set(n.id, n));

      // Draw Synapse Edges
      if (showSynapses) {
        ctx.save();
        for (const n of nodes) {
          const deps = n.node.manifest.dependencies || [];
          for (const depId of deps) {
            const target = nodeMap.get(depId);
            if (target) {
              const x1 = centerX + n.x * zoom;
              const y1 = centerY + n.y * zoom;
              const x2 = centerX + target.x * zoom;
              const y2 = centerY + target.y * zoom;

              const isPathwayEdge = activePathwaySteps.includes(n.id) && activePathwaySteps.includes(depId);

              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);

              if (isPathwayEdge) {
                ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
                ctx.lineWidth = 2.5 * zoom;
                ctx.shadowColor = '#6366f1';
                ctx.shadowBlur = 8;
              } else {
                ctx.strokeStyle = isDarkTheme ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)';
                ctx.lineWidth = 0.8 * zoom;
                ctx.shadowBlur = 0;
              }
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      // Draw Traveling Axon Pulses
      if (isLivePulsing) {
        // Spawn random pulse occasionally
        if (Math.random() < 0.15 && nodes.length > 2) {
          const sIndex = Math.floor(Math.random() * nodes.length);
          const sNode = nodes[sIndex];
          const deps = sNode.node.manifest.dependencies;
          if (deps && deps.length > 0) {
            const targetNode = nodeMap.get(deps[0]);
            if (targetNode) {
              pulsesRef.current.push({
                sourceX: sNode.x,
                sourceY: sNode.y,
                targetX: targetNode.x,
                targetY: targetNode.y,
                progress: 0,
                speed: 0.015 + Math.random() * 0.02,
                color: DOMAIN_COLORS[sNode.domain]?.border || '#6366f1'
              });
            }
          }
        }

        // Update and draw pulses
        ctx.save();
        for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
          const pulse = pulsesRef.current[i];
          pulse.progress += pulse.speed;

          if (pulse.progress >= 1) {
            pulsesRef.current.splice(i, 1);
            continue;
          }

          const currX = centerX + (pulse.sourceX + (pulse.targetX - pulse.sourceX) * pulse.progress) * zoom;
          const currY = centerY + (pulse.sourceY + (pulse.targetY - pulse.sourceY) * pulse.progress) * zoom;

          ctx.beginPath();
          ctx.arc(currX, currY, 3 * zoom, 0, Math.PI * 2);
          ctx.fillStyle = pulse.color;
          ctx.shadowColor = pulse.color;
          ctx.shadowBlur = 10;
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw Nodes
      for (const n of nodes) {
        const screenX = centerX + n.x * zoom;
        const screenY = centerY + n.y * zoom;

        // Skip offscreen
        if (screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) continue;

        const isSelected = selectedNeuron?.manifest.id === n.id;
        const isHovered = hoveredNode?.manifest.id === n.id;
        const isPathwayActive = activePathwaySteps.includes(n.id);
        const matchesSearch = searchTerm ? n.id.toLowerCase().includes(searchTerm.toLowerCase()) || n.domain.toLowerCase().includes(searchTerm.toLowerCase()) : true;
        const matchesDomain = filterDomain === 'all' || n.domain === filterDomain;

        const palette = DOMAIN_COLORS[n.domain] || { bg: '#64748b', glow: 'rgba(100,116,139,0.3)', border: '#94a3b8' };
        const baseRadius = n.radius * zoom;
        const radius = isSelected || isHovered ? baseRadius * 1.4 : baseRadius;

        // Dim if filtered out
        const opacity = matchesSearch && matchesDomain ? 1 : 0.18;

        ctx.save();
        ctx.globalAlpha = opacity;

        // Outer glow on active / hovered / degraded
        if (n.status === 'degraded') {
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 12;
        } else if (n.status === 'offline') {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
        } else if (isSelected || isHovered || isPathwayActive) {
          ctx.shadowColor = palette.border;
          ctx.shadowBlur = 16;
        }

        // Draw node body
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(3, radius), 0, Math.PI * 2);

        if (n.status === 'offline') {
          ctx.fillStyle = isDarkTheme ? '#1e293b' : '#cbd5e1';
          ctx.strokeStyle = '#ef4444';
        } else if (n.status === 'degraded') {
          ctx.fillStyle = isDarkTheme ? '#451a03' : '#fef3c7';
          ctx.strokeStyle = '#f59e0b';
        } else {
          ctx.fillStyle = isDarkTheme ? palette.bg : palette.border;
          ctx.strokeStyle = palette.border;
        }

        ctx.lineWidth = (isSelected ? 3 : (isHovered ? 2 : 1)) * zoom;
        ctx.fill();
        ctx.stroke();

        // If selected or primary anchor, draw label
        if (zoom > 0.85 || isSelected || isHovered || n.radius > 10 || isPathwayActive) {
          ctx.font = `${Math.max(9, Math.min(13, 10 * zoom))}px "Space Grotesk", sans-serif`;
          ctx.fillStyle = isDarkTheme ? '#f1f5f9' : '#0f172a';
          ctx.textAlign = 'center';
          ctx.shadowBlur = 0;
          ctx.fillText(n.id.length > 18 && zoom < 1.2 ? n.id.substring(0, 16) + '…' : n.id, screenX, screenY + radius + 11);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [zoom, pan, showSynapses, isLivePulsing, selectedNeuron, hoveredNode, activePathwaySteps, searchTerm, filterDomain, isDarkTheme]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width * window.devicePixelRatio;
        canvasRef.current.height = rect.height * window.devicePixelRatio;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse & Touch interactions (Pan, Zoom, Click, Hover)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    // Hover detection
    if (!canvasRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = rect.width / 2 + pan.x;
    const centerY = rect.height / 2 + pan.y;

    const found = nodePositionsRef.current.find(n => {
      const screenX = centerX + n.x * zoom;
      const screenY = centerY + n.y * zoom;
      const dist = Math.hypot(mouseX - screenX, mouseY - screenY);
      return dist <= Math.max(8, n.radius * zoom + 5);
    });

    setHoveredNode(found ? found.node : null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = rect.width / 2 + pan.x;
    const centerY = rect.height / 2 + pan.y;

    const found = nodePositionsRef.current.find(n => {
      const screenX = centerX + n.x * zoom;
      const screenY = centerY + n.y * zoom;
      const dist = Math.hypot(mouseX - screenX, mouseY - screenY);
      return dist <= Math.max(8, n.radius * zoom + 6);
    });

    onSelectNeuron(found ? found.node : null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(3.5, Math.max(0.35, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-[620px] rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950/80 shadow-2xl flex flex-col">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search & Domain Filter */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 pointer-events-auto shadow-lg">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            id="mesh-canvas-search-input"
            type="text"
            placeholder="Search 256 neurons..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-36 sm:w-48"
          />
          {searchTerm && (
            <button 
              id="clear-search-btn"
              onClick={() => setSearchTerm('')} 
              className="text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <select
            id="mesh-canvas-domain-select"
            value={filterDomain}
            onChange={e => setFilterDomain(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-slate-200">All Domains (10)</option>
            <option value="orchestration" className="bg-slate-900 text-indigo-400">Orchestration</option>
            <option value="generation" className="bg-slate-900 text-purple-400">Generation</option>
            <option value="codecraft" className="bg-slate-900 text-emerald-400">Codecraft</option>
            <option value="inference" className="bg-slate-900 text-amber-400">Inference</option>
            <option value="storage" className="bg-slate-900 text-blue-400">Storage</option>
            <option value="evaluation" className="bg-slate-900 text-yellow-400">Evaluation</option>
            <option value="agentics" className="bg-slate-900 text-teal-400">Agentics</option>
            <option value="security" className="bg-slate-900 text-rose-400">Security</option>
            <option value="interface" className="bg-slate-900 text-cyan-400">Interface</option>
            <option value="analytics" className="bg-slate-900 text-pink-400">Analytics</option>
          </select>
        </div>

        {/* View Tools & Toggles */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-slate-700 pointer-events-auto shadow-lg">
          <button
            id="toggle-synapses-btn"
            onClick={() => setShowSynapses(!showSynapses)}
            title="Toggle Synapse Edges"
            className={`p-1.5 rounded text-xs transition-colors ${showSynapses ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            id="toggle-axon-pulses-btn"
            onClick={() => setIsLivePulsing(!isLivePulsing)}
            title="Toggle Live Axon Firing Pulses"
            className={`p-1.5 rounded text-xs transition-colors ${isLivePulsing ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            <Activity className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            id="zoom-in-btn"
            onClick={() => setZoom(prev => Math.min(3.5, prev * 1.2))}
            title="Zoom In"
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="zoom-out-btn"
            onClick={() => setZoom(prev => Math.max(0.35, prev * 0.8))}
            title="Zoom Out"
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            id="reset-view-btn"
            onClick={resetView}
            title="Reset View Position"
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Canvas */}
      <div 
        ref={containerRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Hover Tooltip Card */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 z-30 pointer-events-none bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-xl max-w-sm text-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-mono font-bold text-slate-100">{hoveredNode.manifest.id}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                hoveredNode.status === 'online' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                hoveredNode.status === 'degraded' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {hoveredNode.status}
              </span>
            </div>
            <div className="text-slate-400 mb-2">{hoveredNode.manifest.metadata?.description || 'Repository Neuron'}</div>
            <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800">
              <div>
                <span className="text-slate-500 block">Domain</span>
                <span className="text-slate-300 font-medium capitalize">{hoveredNode.manifest.domain}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Latency</span>
                <span className="text-emerald-400 font-mono">{hoveredNode.health.latency_ms}ms</span>
              </div>
              <div>
                <span className="text-slate-500 block">Version</span>
                <span className="text-slate-300 font-mono">{hoveredNode.manifest.version}</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {hoveredNode.manifest.capabilities.map(cap => (
                <span key={cap} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Ticker */}
      <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <strong className="text-slate-200">256/256</strong> Synapses Active
          </span>
          <span className="hidden sm:inline-block text-slate-600">•</span>
          <span className="hidden sm:inline text-slate-400">
            Click any neuron node to inspect manifest, heartbeat metrics, or test handshakes.
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-500">Zoom:</span>
          <span className="text-slate-300">{Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
