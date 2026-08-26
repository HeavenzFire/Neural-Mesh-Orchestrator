import React, { useState, useMemo } from 'react';
import { NeuronNode, NeuronManifest } from '../types/neuron.ts';
import { MeshApi } from '../services/api.ts';
import { 
  Search, 
  Filter, 
  Activity, 
  RefreshCw, 
  Plus, 
  AlertOctagon, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  Cpu, 
  FileCode2, 
  Zap,
  GitBranch,
  Layers,
  ChevronRight
} from 'lucide-react';

interface NeuronDirectoryProps {
  neurons: NeuronNode[];
  onSelectNeuron: (neuron: NeuronNode) => void;
  onRefresh: () => void;
  onOpenRegisterModal: () => void;
}

export default function NeuronDirectory({
  neurons,
  onSelectNeuron,
  onRefresh,
  onOpenRegisterModal
}: NeuronDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [pingingId, setPingingId] = useState<string | null>(null);

  const filteredNeurons = useMemo(() => {
    return neurons.filter(n => {
      const matchesSearch = !searchTerm || (
        n.manifest.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.manifest.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.manifest.capabilities.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (n.manifest.metadata?.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesDomain = domainFilter === 'all' || n.manifest.domain === domainFilter;
      const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
      return matchesSearch && matchesDomain && matchesStatus;
    });
  }, [neurons, searchTerm, domainFilter, statusFilter]);

  const handlePingHandshake = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPingingId(id);
    try {
      await MeshApi.sendHandshake(id, 'online', {
        latency_ms: 10 + Math.floor(Math.random() * 25),
        error_rate: 0.00
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setPingingId(null), 400);
    }
  };

  const handleToggleFailure = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await MeshApi.toggleNeuronFailure(id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Filter & Control Ribbon */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="directory-search-input"
              type="text"
              placeholder="Search across 256 nodes by ID, domain, capability..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Domain Filter */}
          <select
            id="directory-domain-filter"
            value={domainFilter}
            onChange={e => setDomainFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Domains (10)</option>
            <option value="orchestration">Orchestration</option>
            <option value="generation">Generation</option>
            <option value="codecraft">Codecraft</option>
            <option value="inference">Inference</option>
            <option value="storage">Storage</option>
            <option value="evaluation">Evaluation</option>
            <option value="agentics">Agentics</option>
            <option value="security">Security</option>
            <option value="interface">Interface</option>
            <option value="analytics">Analytics</option>
          </select>

          {/* Status Filter */}
          <select
            id="directory-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="degraded">Degraded</option>
            <option value="offline">Offline</option>
            <option value="failover_standby">Failover Standby</option>
          </select>
        </div>

        {/* View mode toggle & Register Button */}
        <div className="flex items-center gap-2">
          <button
            id="directory-refresh-btn"
            onClick={onRefresh}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg"
            title="Refresh Registry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="register-neuron-btn"
            onClick={onOpenRegisterModal}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Neuron</span>
          </button>
        </div>
      </div>

      {/* Directory Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Showing <strong className="text-slate-200">{filteredNeurons.length}</strong> of <strong className="text-slate-200">{neurons.length}</strong> repository nodes
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {neurons.filter(n => n.status === 'online').length} Online
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {neurons.filter(n => n.status === 'degraded').length} Degraded
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {neurons.filter(n => n.status === 'offline').length} Offline
          </span>
        </div>
      </div>

      {/* Grid View of Neurons */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredNeurons.map(n => {
          const isPinging = pingingId === n.manifest.id;
          return (
            <div
              key={n.manifest.id}
              id={`neuron-card-${n.manifest.id}`}
              onClick={() => onSelectNeuron(n)}
              className="bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/60 rounded-xl p-4 cursor-pointer transition-all shadow-lg hover:shadow-indigo-500/10 group flex flex-col justify-between"
            >
              <div>
                {/* Card Top: ID & Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="truncate">
                    <h4 className="font-mono font-bold text-slate-100 text-xs truncate group-hover:text-indigo-300 transition-colors">
                      {n.manifest.id}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <GitBranch className="w-2.5 h-2.5 text-indigo-400" />
                      {n.manifest.metadata?.mesh_branch || 'mesh-sync'} • v{n.manifest.version}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${
                    n.status === 'online' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    n.status === 'degraded' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    n.status === 'failover_standby' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {n.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                  {n.manifest.metadata?.description || 'Microservice neural node connected to mesh.'}
                </p>

                {/* Capabilities Pills */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {n.manifest.capabilities.map(cap => (
                    <span
                      key={cap}
                      className="bg-slate-950 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded border border-slate-800 font-mono"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Health Metrics Ribbon & Quick Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Latency</span>
                    <span className={`font-semibold ${n.health.latency_ms > 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {n.health.latency_ms}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Domain</span>
                    <span className="text-slate-300 capitalize text-[10px]">{n.manifest.domain}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">RPS</span>
                    <span className="text-slate-400">{n.health.requests_per_sec || 20}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id={`ping-handshake-${n.manifest.id}`}
                    onClick={(e) => handlePingHandshake(e, n.manifest.id)}
                    title="Send Synapse Handshake Ping"
                    className="p-1.5 text-slate-300 hover:text-indigo-300 hover:bg-slate-800 rounded bg-slate-950 border border-slate-800 transition-colors"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>

                  <button
                    id={`toggle-fail-${n.manifest.id}`}
                    onClick={(e) => handleToggleFailure(e, n.manifest.id)}
                    title={n.status === 'offline' ? 'Recover Node' : 'Simulate Failure Injection'}
                    className={`p-1.5 rounded bg-slate-950 border transition-colors ${
                      n.status === 'offline'
                        ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/30'
                        : 'text-slate-400 border-slate-800 hover:text-rose-400 hover:bg-rose-950/30'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
