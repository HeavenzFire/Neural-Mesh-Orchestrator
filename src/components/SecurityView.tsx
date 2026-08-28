import { useState, useEffect } from 'react';
import { AuditLog, UserRole } from '../types/neuron.ts';
import { MeshApi } from '../services/api.ts';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  FileCheck, 
  Download, 
  Hash, 
  CheckCircle, 
  UserCheck, 
  RefreshCw,
  Eye,
  Terminal,
  FileSpreadsheet
} from 'lucide-react';

interface SecurityViewProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  mfaEnabled: boolean;
  onOpenMfaModal: () => void;
}

export default function SecurityView({
  currentRole,
  onChangeRole,
  mfaEnabled,
  onOpenMfaModal
}: SecurityViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchLog, setSearchLog] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const fetchLogs = async () => {
    try {
      const data = await MeshApi.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchesSearch = !searchLog || l.action.toLowerCase().includes(searchLog.toLowerCase()) || l.details.toLowerCase().includes(searchLog.toLowerCase()) || l.actor.toLowerCase().includes(searchLog.toLowerCase());
    const matchesAction = filterAction === 'all' || l.action.startsWith(filterAction);
    return matchesSearch && matchesAction;
  });

  const handleExport = (format: 'json' | 'csv') => {
    window.open(`/api/export?format=${format}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Security Posture Overview Ribbon */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-100">Zero-Trust Security, RBAC & Audit Compliance</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cryptographically signed mesh ledger, role-based synapse permissions, and AES-256 encrypted payload storage at rest.
            </p>
          </div>

          {/* Export compliance logs */}
          <div className="flex items-center gap-2">
            <button
              id="export-csv-btn"
              onClick={() => handleExport('csv')}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              id="export-json-btn"
              onClick={() => handleExport('json')}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export JSON Ledger</span>
            </button>
          </div>
        </div>

        {/* Security Matrix Ribbon */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] block">Active Role Context</span>
              <span className="text-slate-200 font-bold uppercase font-mono">{currentRole}</span>
            </div>
            <select
              id="switch-role-select"
              value={currentRole}
              onChange={e => onChangeRole(e.target.value as UserRole)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 text-xs"
            >
              <option value="admin">Admin (Full Control)</option>
              <option value="architect">Architect (Pipeline & Specs)</option>
              <option value="operator">Operator (Execute & Signals)</option>
              <option value="viewer">Viewer (Read-Only)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] block">MFA / 2FA Status</span>
              <span className={`font-bold text-xs ${mfaEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                {mfaEnabled ? 'Enforced (TOTP Active)' : 'Pending Verification'}
              </span>
            </div>
            <button
              id="manage-mfa-btn"
              onClick={onOpenMfaModal}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
            >
              {mfaEnabled ? 'Manage' : 'Enable 2FA'}
            </button>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] block">Data at Rest Encryption</span>
              <span className="text-emerald-400 font-bold font-mono">AES-256-GCM Active</span>
            </div>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Cryptographic Compliance Audit Trail */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              Cryptographic Audit Log Ledger
            </h3>
            <p className="text-xs text-slate-400">
              SHA-256 hash chained records for tamper-proof traceability and compliance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="audit-search-input"
              type="text"
              placeholder="Search audit actions..."
              value={searchLog}
              onChange={e => setSearchLog(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-200"
            />
            <button
              id="refresh-audit-btn"
              onClick={fetchLogs}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                <th className="pb-2 font-medium">TIMESTAMP</th>
                <th className="pb-2 font-medium">ACTION</th>
                <th className="pb-2 font-medium">ACTOR</th>
                <th className="pb-2 font-medium">ROLE</th>
                <th className="pb-2 font-medium">DETAILS</th>
                <th className="pb-2 font-medium text-right">HASH SIGNATURE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/40 text-slate-300">
                  <td className="py-2.5 text-slate-400">{new Date(l.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2.5 font-bold text-indigo-300">{l.action}</td>
                  <td className="py-2.5 text-slate-400">{l.actor}</td>
                  <td className="py-2.5 uppercase text-[10px] text-slate-400">{l.role}</td>
                  <td className="py-2.5 text-slate-300 max-w-xs truncate font-sans text-xs">{l.details}</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-emerald-400/90 truncate max-w-[120px]">
                    {l.hash.substring(0, 16)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
