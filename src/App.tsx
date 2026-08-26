import { useState, useEffect } from 'react';
import { NeuronNode, UserRole, PathwayExecutionResult } from './types/neuron.ts';
import { MeshApi } from './services/api.ts';
import Navbar, { NavTab } from './components/Navbar.tsx';
import MeshVisualizer from './components/MeshVisualizer.tsx';
import PathwayStudio from './components/PathwayStudio.tsx';
import NeuronDirectory from './components/NeuronDirectory.tsx';
import AxonBusStream from './components/AxonBusStream.tsx';
import ObservabilityView from './components/ObservabilityView.tsx';
import SecurityView from './components/SecurityView.tsx';
import ApiDocsView from './components/ApiDocsView.tsx';
import NeuronDetailDrawer from './components/NeuronDetailDrawer.tsx';
import RegisterNeuronModal from './components/RegisterNeuronModal.tsx';
import MfaModal from './components/MfaModal.tsx';

export default function App() {
  const [neurons, setNeurons] = useState<NeuronNode[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('topology');
  const [selectedNeuron, setSelectedNeuron] = useState<NeuronNode | null>(null);
  const [highlightedStepIds, setHighlightedStepIds] = useState<string[]>([]);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [mfaEnabled, setMfaEnabled] = useState(true);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchMeshState = async () => {
    try {
      const [nodes, m] = await Promise.all([
        MeshApi.getNeurons(),
        MeshApi.getMetricsOverview()
      ]);
      setNeurons(nodes);
      setMetrics(m);
    } catch (err) {
      console.error('Failed to sync mesh state:', err);
    }
  };

  useEffect(() => {
    fetchMeshState();
    const interval = setInterval(fetchMeshState, 8000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePathwayExecuted = (result: PathwayExecutionResult) => {
    showToast(`Pathway '${result.pathway_id}' completed in ${result.total_latency_ms}ms (Hash: ${result.audit_hash.substring(0, 8)})`);
    fetchMeshState();
  };

  const onlineCount = neurons.filter(n => n.status === 'online').length;

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-150`}>
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        nodeCount={neurons.length}
        onlineCount={onlineCount}
        avgLatency={metrics?.avg_mesh_latency_ms || 28}
        alertCount={metrics?.active_alerts_count || 0}
        currentRole={currentRole}
        mfaEnabled={mfaEnabled}
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenMfaModal={() => setIsMfaModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'topology' && (
          <div className="space-y-6">
            <MeshVisualizer
              neurons={neurons}
              selectedNeuron={selectedNeuron}
              onSelectNeuron={setSelectedNeuron}
              activePathwaySteps={highlightedStepIds}
              isDarkTheme={isDarkTheme}
            />

            {/* Quick Summary Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  1. Capability Registry (Cortex)
                </span>
                <p className="text-xs text-slate-300">
                  Every repo exposes a <code className="text-indigo-400 font-mono">neuron.json</code> manifest. The cortex dynamically maps 256 nodes, dependencies, and action verbs.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  2. Handshake Synapse Protocol
                </span>
                <p className="text-xs text-slate-300">
                  Nodes boot services and POST <code className="text-purple-400 font-mono">POST /api/handshake</code> with latency and error telemetry, continually refreshing route weights.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">
                  3. Axon Bus & Pathway Engine
                </span>
                <p className="text-xs text-slate-300">
                  Threads multi-hop execution chains across repositories with load balancing, circuit breakers, and automatic failovers.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pathways' && (
          <PathwayStudio
            neurons={neurons}
            onPathwayExecuted={handlePathwayExecuted}
            onHighlightSteps={setHighlightedStepIds}
          />
        )}

        {activeTab === 'directory' && (
          <NeuronDirectory
            neurons={neurons}
            onSelectNeuron={setSelectedNeuron}
            onRefresh={fetchMeshState}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          />
        )}

        {activeTab === 'bus' && (
          <AxonBusStream
            neurons={neurons}
            onSignalDispatched={fetchMeshState}
          />
        )}

        {activeTab === 'observability' && (
          <ObservabilityView
            neurons={neurons}
            onBurstSimulated={fetchMeshState}
          />
        )}

        {activeTab === 'security' && (
          <SecurityView
            currentRole={currentRole}
            onChangeRole={setCurrentRole}
            mfaEnabled={mfaEnabled}
            onOpenMfaModal={() => setIsMfaModalOpen(true)}
          />
        )}

        {activeTab === 'api' && (
          <ApiDocsView />
        )}
      </main>

      {/* Slide-over Drawer for Selected Neuron */}
      <NeuronDetailDrawer
        neuron={selectedNeuron}
        onClose={() => setSelectedNeuron(null)}
        onRefresh={fetchMeshState}
        onSelectNeuron={setSelectedNeuron}
        allNeurons={neurons}
      />

      {/* Register Neuron Modal */}
      <RegisterNeuronModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegistered={() => {
          fetchMeshState();
          showToast('New neuron registered into mesh cortex.');
        }}
      />

      {/* MFA Modal */}
      <MfaModal
        isOpen={isMfaModalOpen}
        onClose={() => setIsMfaModalOpen(false)}
        mfaEnabled={mfaEnabled}
        onToggleMfa={(enabled) => {
          setMfaEnabled(enabled);
          showToast(enabled ? '2FA Multi-Factor Authentication Enforced ✓' : '2FA Disabled');
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
