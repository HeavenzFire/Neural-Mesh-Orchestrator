import React, { useState } from 'react';
import { NeuronManifest } from '../types/neuron.ts';
import { MeshApi } from '../services/api.ts';
import { X, Plus, Sparkles, Check, AlertCircle } from 'lucide-react';

interface RegisterNeuronModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: () => void;
}

export default function RegisterNeuronModal({
  isOpen,
  onClose,
  onRegistered
}: RegisterNeuronModalProps) {
  const [manifestStr, setManifestStr] = useState<string>(
    JSON.stringify(
      {
        id: 'quantum-synthesis-node-01',
        version: '1.2.0',
        domain: 'generation',
        entrypoint: 'http://localhost:7045/api',
        capabilities: ['generate', 'synthesize_lattice', 'prompt_forge'],
        dependencies: ['entangled-multimodal-system-3', 'vector-vault-lake'],
        metadata: {
          author: 'Genesis Cluster Team',
          mesh_branch: 'mesh-sync',
          replicas: 2,
          description: 'Quantum-accelerated neural lattice synthesizer'
        }
      },
      null,
      2
    )
  );

  const [status, setStatus] = useState('online');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let parsed: NeuronManifest;
      try {
        parsed = JSON.parse(manifestStr);
      } catch (err) {
        throw new Error('Invalid JSON format in manifest editor.');
      }

      await MeshApi.registerNeuron(parsed, status);
      onRegistered();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100">Register Repository Neuron</h3>
            <p className="text-xs text-slate-400">Add a new repository node to the 256-node neural mesh cortex.</p>
          </div>
          <button
            id="close-register-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Neuron Manifest Specification (<code className="text-indigo-400">neuron.json</code>)
            </label>
            <textarea
              id="register-manifest-textarea"
              rows={13}
              value={manifestStr}
              onChange={e => setManifestStr(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Initial Status:</span>
              <select
                id="register-status-select"
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
              >
                <option value="online">Online</option>
                <option value="degraded">Degraded</option>
                <option value="failover_standby">Failover Standby</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                id="submit-register-neuron-btn"
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Register to Cortex'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
