import { useState } from 'react';
import { NeuronNode } from '../types/neuron.ts';
import { MeshApi } from '../services/api.ts';
import { 
  X, 
  Activity, 
  Zap, 
  Copy, 
  Check, 
  GitBranch, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface NeuronDetailDrawerProps {
  neuron: NeuronNode | null;
  onClose: () => void;
  onRefresh: () => void;
  onSelectNeuron: (node: NeuronNode) => void;
  allNeurons: NeuronNode[];
}

export default function NeuronDetailDrawer({
  neuron,
  onClose,
  onRefresh,
  onSelectNeuron,
  allNeurons
}: NeuronDetailDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  if (!neuron) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(neuron.manifest, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePingHandshake = async () => {
    setIsPinging(true);
    try {
      await MeshApi.sendHandshake(neuron.manifest.id, 'online', {
        latency_ms: 12 + Math.floor(Math.random() * 20),
        error_rate: 0.00
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPinging(false);
    }
  };

  const handleToggleFailure = async () => {
    try {
      await MeshApi.toggleNeuronFailure(neuron.manifest.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-slate-900/98 backdrop-blur-md border-l border-slate-700 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between space-y-5">
      <div className="space-y-4">
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
              Domain: {neuron.manifest.domain}
            </span>
            <h3 className="text-base font-mono font-bold text-slate-100 mt-0.5">{neuron.manifest.id}</h3>
          </div>
          <button
            id="close-neuron-drawer-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge & Actions */}
        <div className="flex items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              neuron.status === 'online' ? 'bg-emerald-500 animate-pulse' :
              neuron.status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
            }`} />
            <span className="font-semibold text-xs uppercase text-slate-200">{neuron.status}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="drawer-handshake-ping-btn"
              onClick={handlePingHandshake}
              disabled={isPinging}
              className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded text-xs font-semibold flex items-center gap-1"
            >
              <Activity className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>Ping Handshake</span>
            </button>

            <button
              id="drawer-toggle-failure-btn"
              onClick={handleToggleFailure}
              className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                neuron.status === 'offline'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
              }`}
            >
              {neuron.status === 'offline' ? 'Restore Node' : 'Simulate Failure'}
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Latency</span>
            <span className="text-emerald-400 font-mono font-bold">{neuron.health.latency_ms}ms</span>
          </div>
          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Error Rate</span>
            <span className="text-slate-300 font-mono font-bold">{(neuron.health.error_rate * 100).toFixed(1)}%</span>
          </div>
          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Replicas</span>
            <span className="text-slate-300 font-mono font-bold">{neuron.manifest.metadata?.replicas || 2} active</span>
          </div>
          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Branch</span>
            <span className="text-slate-300 font-mono text-[11px] truncate block">{neuron.manifest.metadata?.mesh_branch || 'mesh-sync'}</span>
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Exposed Capabilities
          </span>
          <div className="flex flex-wrap gap-1.5">
            {neuron.manifest.capabilities.map(c => (
              <span key={c} className="bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded text-xs font-mono">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Synapse Dependencies */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Synapse Dependencies ({neuron.manifest.dependencies.length})
          </span>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {neuron.manifest.dependencies.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Root neuron (No upstream dependencies)</span>
            ) : (
              neuron.manifest.dependencies.map(depId => {
                const targetNode = allNeurons.find(n => n.manifest.id === depId);
                return (
                  <button
                    key={depId}
                    onClick={() => targetNode && onSelectNeuron(targetNode)}
                    className="w-full text-left p-2 bg-slate-950 rounded border border-slate-800 hover:border-indigo-500 text-xs font-mono text-slate-300 flex items-center justify-between"
                  >
                    <span>{depId}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Raw neuron.json Manifest */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">neuron.json Manifest</span>
            <button
              onClick={handleCopyJson}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto">
            {JSON.stringify(neuron.manifest, null, 2)}
          </pre>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
        <span>Entrypoint: {neuron.manifest.entrypoint}</span>
      </div>
    </div>
  );
}
