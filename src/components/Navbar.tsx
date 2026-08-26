import { 
  Network, 
  Cpu, 
  Radio, 
  Activity, 
  ShieldCheck, 
  Code2, 
  Layers, 
  Plus, 
  Sun, 
  Moon, 
  Bell, 
  Lock,
  GitBranch
} from 'lucide-react';
import { UserRole } from '../types/neuron.ts';

export type NavTab = 'topology' | 'pathways' | 'directory' | 'bus' | 'observability' | 'security' | 'api';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  nodeCount: number;
  onlineCount: number;
  avgLatency: number;
  alertCount: number;
  currentRole: UserRole;
  mfaEnabled: boolean;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  onOpenRegisterModal: () => void;
  onOpenMfaModal: () => void;
}

export default function Navbar({
  activeTab,
  onSelectTab,
  nodeCount,
  onlineCount,
  avgLatency,
  alertCount,
  currentRole,
  mfaEnabled,
  isDarkTheme,
  onToggleTheme,
  onOpenRegisterModal,
  onOpenMfaModal
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Brand Logo & Live Mesh Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Network className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
                  Neural Mesh <span className="text-indigo-400 font-mono text-xs">CORTEX</span>
                </h1>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {onlineCount}/{nodeCount || 256} Neurons Online
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block">
                Dynamic capability routing & synapse handshake mesh
              </span>
            </div>
          </div>

          {/* Right Action Tools & Security Badges */}
          <div className="flex items-center gap-2.5 text-xs">
            {/* Average Latency Pill */}
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{avgLatency || 28}ms</span>
            </div>

            {/* Role & MFA Badge */}
            <button
              id="navbar-mfa-badge-btn"
              onClick={onOpenMfaModal}
              title={`Role: ${currentRole} (Click to manage MFA)`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
                mfaEnabled
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="capitalize">{currentRole}</span>
            </button>

            {/* Register New Neuron Button */}
            <button
              id="navbar-register-neuron-btn"
              onClick={onOpenRegisterModal}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Register Neuron</span>
            </button>

            {/* Theme Toggle */}
            <button
              id="navbar-theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              title="Toggle Theme"
            >
              {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 scrollbar-none text-xs font-medium border-t border-slate-800/80 pt-2">
          <button
            id="nav-tab-topology"
            onClick={() => onSelectTab('topology')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'topology'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Topology Canvas (256 Neurons)</span>
          </button>

          <button
            id="nav-tab-pathways"
            onClick={() => onSelectTab('pathways')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'pathways'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Pathway Threading Studio</span>
          </button>

          <button
            id="nav-tab-directory"
            onClick={() => onSelectTab('directory')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Capability Directory ({nodeCount || 256})</span>
          </button>

          <button
            id="nav-tab-bus"
            onClick={() => onSelectTab('bus')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'bus'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Axon Message Bus</span>
          </button>

          <button
            id="nav-tab-observability"
            onClick={() => onSelectTab('observability')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'observability'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Observability & Alerts</span>
            {alertCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {alertCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-security"
            onClick={() => onSelectTab('security')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Audit Ledger</span>
          </button>

          <button
            id="nav-tab-api"
            onClick={() => onSelectTab('api')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'api'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>API Docs & Tampermonkey</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
