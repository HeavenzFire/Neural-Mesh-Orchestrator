import { useState, useEffect } from 'react';
import { MessageEnvelope, NeuronNode } from '../types/neuron.ts';
import { MeshApi } from '../services/api.ts';
import { 
  Radio, 
  Send, 
  Filter, 
  RefreshCw, 
  Play, 
  ArrowRight, 
  Clock, 
  Hash, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  CornerDownRight
} from 'lucide-react';

interface AxonBusStreamProps {
  neurons: NeuronNode[];
  onSignalDispatched?: () => void;
}

export default function AxonBusStream({ neurons, onSignalDispatched }: AxonBusStreamProps) {
  const [events, setEvents] = useState<MessageEnvelope[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedTrace, setSelectedTrace] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Custom Signal Injector State
  const [sourceNeuron, setSourceNeuron] = useState(neurons[0]?.manifest.id || 'entangled-multimodal-system-3');
  const [targetNeuron, setTargetNeuron] = useState(neurons[1]?.manifest.id || 'iben-genesis');
  const [signalType, setSignalType] = useState<'request' | 'response' | 'heartbeat' | 'alert' | 'handshake'>('request');
  const [payloadText, setPayloadText] = useState(
    JSON.stringify({ prompt: 'Synthesize sub-lattice tensor', context: { actor: 'mesh-architect' } }, null, 2)
  );

  const fetchEvents = async () => {
    try {
      const list = await MeshApi.getAxonEvents(80, filterType === 'all' ? undefined : filterType);
      setEvents(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (!autoRefresh) return;
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [filterType, autoRefresh]);

  const handleDispatchSignal = async () => {
    setIsSending(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(payloadText);
      } catch (e) {
        alert('Invalid JSON payload');
        setIsSending(false);
        return;
      }

      await MeshApi.dispatchSignal({
        source: sourceNeuron,
        target: targetNeuron,
        signal_type: signalType,
        payload: parsed
      });

      await fetchEvents();
      if (onSignalDispatched) onSignalDispatched();
    } catch (err: any) {
      alert(err.message || 'Signal dispatch failed');
    } finally {
      setIsSending(false);
    }
  };

  const handleReplaySignal = async (ev: MessageEnvelope) => {
    try {
      await MeshApi.dispatchSignal({
        source: ev.source,
        target: ev.target,
        signal_type: ev.signal_type,
        payload: ev.payload,
        pathway_id: ev.pathway_id
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Signal Injector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Radio className="w-4 h-4 animate-pulse" />
              </span>
              <h2 className="text-lg font-bold text-slate-100">Axon Message Bus (Live Event Stream)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time asynchronous signal broker facilitating decoupled inter-neuron envelopes, heartbeats, and failover notifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <input
                id="auto-poll-checkbox"
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span>Live Streaming</span>
            </label>

            <button
              id="refresh-bus-btn"
              onClick={fetchEvents}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Signal Injector Form */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Source Neuron</label>
            <select
              id="signal-source-select"
              value={sourceNeuron}
              onChange={e => setSourceNeuron(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
            >
              {neurons.map(n => (
                <option key={n.manifest.id} value={n.manifest.id}>
                  {n.manifest.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Target Neuron</label>
            <select
              id="signal-target-select"
              value={targetNeuron}
              onChange={e => setTargetNeuron(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
            >
              {neurons.map(n => (
                <option key={n.manifest.id} value={n.manifest.id}>
                  {n.manifest.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Signal Type</label>
            <select
              id="signal-type-select"
              value={signalType}
              onChange={e => setSignalType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
            >
              <option value="request">request</option>
              <option value="response">response</option>
              <option value="heartbeat">heartbeat</option>
              <option value="alert">alert</option>
              <option value="handshake">handshake</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              id="dispatch-signal-btn"
              onClick={handleDispatchSignal}
              disabled={isSending}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Dispatch Axon Signal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          {['all', 'request', 'response', 'heartbeat', 'alert', 'handshake', 'failover_trigger'].map(type => (
            <button
              key={type}
              id={`filter-signal-${type}`}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded capitalize font-medium transition-all ${
                filterType === type
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>

        <span className="text-slate-500 font-mono">
          Showing {events.length} message envelopes in ring buffer
        </span>
      </div>

      {/* Event Stream List */}
      <div className="space-y-2.5">
        {events.map((ev, index) => {
          const isAlert = ev.signal_type === 'alert';
          const isFailover = ev.signal_type === 'failover_trigger';
          const isRequest = ev.signal_type === 'request';
          const isResponse = ev.signal_type === 'response';

          return (
            <div
              key={ev.trace_id + '-' + index}
              className={`p-3.5 rounded-xl border transition-all ${
                isAlert
                  ? 'bg-rose-950/20 border-rose-800/40'
                  : isFailover
                  ? 'bg-amber-950/20 border-amber-800/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    isAlert ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    isFailover ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    isRequest ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    isResponse ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {ev.signal_type}
                  </span>

                  {ev.pathway_id && (
                    <span className="text-[11px] font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/30">
                      pathway: {ev.pathway_id}
                    </span>
                  )}

                  <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-600" />
                    {ev.trace_id}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    id={`replay-signal-${ev.trace_id}`}
                    onClick={() => handleReplaySignal(ev)}
                    title="Replay this signal envelope"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium hover:underline"
                  >
                    <Play className="w-3 h-3" /> Replay
                  </button>
                </div>
              </div>

              {/* Routing Path */}
              <div className="flex items-center gap-2 font-mono text-xs text-slate-200 mb-2">
                <span className="text-indigo-300 font-semibold">{ev.source}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-emerald-300 font-semibold">{ev.target}</span>
                {ev.latency_ms && (
                  <span className="text-slate-500 text-[10px]">({ev.latency_ms}ms)</span>
                )}
              </div>

              {/* Payload Box */}
              <pre className="bg-slate-950/90 p-2 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-32">
                {JSON.stringify(ev.payload, null, 2)}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
