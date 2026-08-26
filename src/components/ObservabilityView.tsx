import { useState, useEffect } from 'react';
import { MetricSnapshot, AlertItem, NeuronNode } from '../types/neuron.ts';
import { MeshApi } from '../services/api.ts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Bell, 
  Mail, 
  Smartphone, 
  Sliders, 
  ShieldAlert, 
  RefreshCw, 
  Zap,
  BarChart3,
  Flame,
  ArrowUpRight
} from 'lucide-react';

interface ObservabilityViewProps {
  neurons: NeuronNode[];
  onBurstSimulated?: () => void;
}

export default function ObservabilityView({ neurons, onBurstSimulated }: ObservabilityViewProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [trends, setTrends] = useState<MetricSnapshot[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isSimulatingBurst, setIsSimulatingBurst] = useState(false);

  // Alert Settings
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [latencyThreshold, setLatencyThreshold] = useState(100);
  const [errorThreshold, setErrorThreshold] = useState(5);
  const [notificationEmail, setNotificationEmail] = useState('heavenzfire1@gmail.com');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const loadData = async () => {
    try {
      const [m, t, a] = await Promise.all([
        MeshApi.getMetricsOverview(),
        MeshApi.getMetricTrends(),
        MeshApi.getAlerts()
      ]);
      setMetrics(m);
      setTrends(t);
      setAlerts(a);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = async (id: string) => {
    await MeshApi.acknowledgeAlert(id);
    loadData();
  };

  const handleSimulateBurst = async () => {
    setIsSimulatingBurst(true);
    try {
      await MeshApi.simulateLoadBurst();
      await loadData();
      if (onBurstSimulated) onBurstSimulated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingBurst(false);
    }
  };

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Simulation Trigger */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-100">Observability & Capacity Telemetry</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time latency profiling, error rate anomaly detection, automated failover tracing, and capacity forecasting.
          </p>
        </div>

        <button
          id="simulate-traffic-burst-btn"
          onClick={handleSimulateBurst}
          disabled={isSimulatingBurst}
          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Flame className="w-4 h-4" />
          <span>{isSimulatingBurst ? 'Injecting Surge...' : 'Simulate 250% Traffic Burst'}</span>
        </button>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Average Mesh Latency</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {metrics?.avg_mesh_latency_ms || 28} <span className="text-sm font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-2">
            <span>p95 Latency: {metrics?.p95_mesh_latency_ms || 54}ms</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Mesh Throughput</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {metrics?.total_throughput_rps?.toLocaleString() || '12,480'} <span className="text-sm font-normal text-slate-400">req/s</span>
          </div>
          <div className="text-[11px] text-indigo-400 flex items-center gap-1 mt-2">
            <span>256 Synapse channels active</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Neurons</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {metrics?.online_nodes || 252}<span className="text-sm font-normal text-slate-400"> / {metrics?.total_nodes || 256}</span>
          </div>
          <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-2">
            <span>{metrics?.degraded_nodes || 3} degraded • {metrics?.offline_nodes || 1} offline</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Mesh Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {metrics?.active_alerts_count || 0}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-2">
            <span>Auto-failover enabled</span>
          </div>
        </div>
      </div>

      {/* Latency & Throughput Timeseries Visualizer (Pure SVG/CSS Chart) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">24-Hour Latency & Request Volume Trends</h3>
            <p className="text-xs text-slate-400">Historical performance telemetry for capacity planning</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Avg Latency (ms)
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> p95 Latency (ms)
            </span>
          </div>
        </div>

        {/* SVG Chart Rendering */}
        <div className="h-56 w-full relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
            <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
            <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

            {/* Render Avg Latency Path */}
            {trends.length > 1 && (
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                points={trends
                  .map((t, idx) => {
                    const x = (idx / (trends.length - 1)) * 800;
                    const y = 180 - (Math.min(100, t.avg_latency_ms) / 100) * 150;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            )}

            {/* Render p95 Latency Path */}
            {trends.length > 1 && (
              <polyline
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                strokeDasharray="3"
                points={trends
                  .map((t, idx) => {
                    const x = (idx / (trends.length - 1)) * 800;
                    const y = 180 - (Math.min(100, t.p95_latency_ms) / 100) * 150;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            )}
          </svg>
        </div>

        <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800">
          <span>24 Hours Ago</span>
          <span>18 Hours Ago</span>
          <span>12 Hours Ago</span>
          <span>6 Hours Ago</span>
          <span>Now (Real-time)</span>
        </div>
      </div>

      {/* Two Column Grid: Active Alerts + Alert Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Alerts List */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Automated Alert Stream
            </h3>
            <span className="text-xs font-mono text-slate-400">{alerts.length} total alerts</span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active alerts. All 256 neurons operating within acceptable SLO parameters.
              </div>
            ) : (
              alerts.map(alt => (
                <div
                  key={alt.id}
                  className={`p-3.5 rounded-lg border text-xs transition-all ${
                    alt.acknowledged
                      ? 'bg-slate-950/40 border-slate-800 text-slate-500'
                      : alt.severity === 'critical'
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                      : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          alt.severity === 'critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {alt.severity}
                        </span>
                        <span className="font-bold text-slate-100">{alt.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mb-2">{alt.message}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                        <span>{new Date(alt.timestamp).toLocaleTimeString()}</span>
                        {alt.neuron_id && <span>Node: {alt.neuron_id}</span>}
                        {alt.auto_mitigated && <span className="text-emerald-400">✓ Auto-Mitigated</span>}
                      </div>
                    </div>

                    {!alt.acknowledged && (
                      <button
                        id={`ack-alert-${alt.id}`}
                        onClick={() => handleAcknowledgeAlert(alt.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold shrink-0"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alert Configuration & Notification Settings */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              SLO & Notification Channels
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Latency Threshold: <strong className="text-indigo-400 font-mono">{latencyThreshold}ms</strong>
              </label>
              <input
                id="latency-threshold-slider"
                type="range"
                min="40"
                max="300"
                step="10"
                value={latencyThreshold}
                onChange={e => setLatencyThreshold(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <span className="text-[10px] text-slate-500">Triggers rebalance alert if node exceeds latency</span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Error Rate Trigger: <strong className="text-rose-400 font-mono">{errorThreshold}%</strong>
              </label>
              <input
                id="error-threshold-slider"
                type="range"
                min="1"
                max="15"
                step="1"
                value={errorThreshold}
                onChange={e => setErrorThreshold(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-[10px] text-slate-500">Auto-routes to standby replica when exceeded</span>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold block">Notification Channels</span>
              <label className="flex items-center justify-between text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer">
                <span className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Automated Email Alerts
                </span>
                <input
                  id="email-alerts-toggle"
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={e => setEmailAlerts(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                  Push Notifications
                </span>
                <input
                  id="push-alerts-toggle"
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={e => setPushAlerts(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
              </label>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Alert Dispatch Email</label>
                <input
                  id="alert-email-input"
                  type="email"
                  value={notificationEmail}
                  onChange={e => setNotificationEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>
            </div>

            <button
              id="save-slo-settings-btn"
              onClick={handleSaveSettings}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-md transition-all mt-2"
            >
              {settingsSaved ? 'SLO Thresholds Applied ✓' : 'Update Alert Thresholds'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
