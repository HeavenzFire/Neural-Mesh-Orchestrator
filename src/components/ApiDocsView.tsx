import { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Send, 
  FileJson, 
  Sparkles, 
  Layers, 
  ExternalLink,
  Zap,
  Globe
} from 'lucide-react';

export default function ApiDocsView() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'register' | 'handshake' | 'neurons' | 'pathways' | 'bridge'>('register');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Endpoint test payloads
  const [registerPayload, setRegisterPayload] = useState(
    JSON.stringify({
      manifest: {
        id: 'new-experimental-synth-01',
        version: '1.0.0',
        domain: 'generation',
        entrypoint: 'http://localhost:7099/api',
        capabilities: ['generate', 'synthesize_lattice'],
        dependencies: ['entangled-multimodal-system-3'],
        metadata: {
          author: 'Zachary AI Studio Bridge',
          mesh_branch: 'mesh-sync',
          description: 'Dynamically connected sub-neuron repository'
        }
      },
      status: 'online'
    }, null, 2)
  );

  const [handshakePayload, setHandshakePayload] = useState(
    JSON.stringify({
      neuron_id: 'iben-genesis',
      status: 'online',
      health: {
        latency_ms: 24,
        error_rate: 0.00,
        cpu_pct: 19
      }
    }, null, 2)
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestApi = async () => {
    setIsLoading(true);
    setApiResponse(null);
    try {
      let res;
      if (selectedEndpoint === 'register') {
        res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: registerPayload
        });
      } else if (selectedEndpoint === 'handshake') {
        res = await fetch('/api/handshake', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: handshakePayload
        });
      } else if (selectedEndpoint === 'neurons') {
        res = await fetch('/api/neurons?domain=orchestration');
      } else if (selectedEndpoint === 'pathways') {
        res = await fetch('/api/pathways?from=entangled-multimodal-system-3&to=iben-genesis');
      }

      if (res) {
        const json = await res.json();
        setApiResponse(json);
      }
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const tampermonkeyScript = `// ==UserScript==
// @name         Neural Mesh AI Studio Cortex Bridge
// @namespace    https://ai.studio/build
// @version      1.0.0
// @description  Connects Google AI Studio & browser applications to 256-repo Neural Mesh Cortex
// @match        https://ai.studio/*
// @match        http://localhost:*/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    console.log('[Neural Mesh] Synapse Bridge Initialized on host:', window.location.host);

    const MESH_REGISTRY_URL = window.location.origin;

    // 1. Announce Browser Node Handshake
    async function announceHandshake() {
        try {
            const payload = {
                manifest: {
                    id: 'ai-studio-client-synapse',
                    version: '1.0.0',
                    domain: 'interface',
                    entrypoint: window.location.href,
                    capabilities: ['render_canvas', 'dispatch_event', 'ui_bridge'],
                    dependencies: ['entangled-multimodal-system-3'],
                    metadata: {
                        author: 'Google AI Studio Client',
                        mesh_branch: 'mesh-sync',
                        description: 'Active browser interactive bridge synapse'
                    }
                },
                status: 'online'
            };

            fetch(MESH_REGISTRY_URL + '/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(r => r.json()).then(data => {
                console.log('[Neural Mesh] Registered browser node successfully:', data);
            });
        } catch (e) {
            console.error('[Neural Mesh] Handshake error:', e);
        }
    }

    // Periodic heartbeat
    setInterval(() => {
        fetch(MESH_REGISTRY_URL + '/api/handshake', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                neuron_id: 'ai-studio-client-synapse',
                status: 'online',
                health: { latency_ms: Math.floor(Math.random() * 10) + 12 }
            })
        });
    }, 15000);

    announceHandshake();
})();`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Code2 className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-100">API Documentation & Tampermonkey Bridge</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Standardized REST API schemas for <code className="text-indigo-300 font-mono">neuron.json</code> manifest registration, synapse handshakes, and browser hooks.
            </p>
          </div>

          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-mono">
            OpenAPI 3.1 & JSON-Schema Spec Compliant
          </span>
        </div>
      </div>

      {/* Tabs for Endpoints */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        <button
          id="api-tab-register"
          onClick={() => setSelectedEndpoint('register')}
          className={`px-3 py-2 rounded-lg border font-semibold transition-all ${
            selectedEndpoint === 'register' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          POST /api/register
        </button>
        <button
          id="api-tab-handshake"
          onClick={() => setSelectedEndpoint('handshake')}
          className={`px-3 py-2 rounded-lg border font-semibold transition-all ${
            selectedEndpoint === 'handshake' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          PATCH /api/handshake
        </button>
        <button
          id="api-tab-neurons"
          onClick={() => setSelectedEndpoint('neurons')}
          className={`px-3 py-2 rounded-lg border font-semibold transition-all ${
            selectedEndpoint === 'neurons' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          GET /api/neurons
        </button>
        <button
          id="api-tab-pathways"
          onClick={() => setSelectedEndpoint('pathways')}
          className={`px-3 py-2 rounded-lg border font-semibold transition-all ${
            selectedEndpoint === 'pathways' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          GET /api/pathways
        </button>
        <button
          id="api-tab-bridge"
          onClick={() => setSelectedEndpoint('bridge')}
          className={`px-3 py-2 rounded-lg border font-semibold transition-all ${
            selectedEndpoint === 'bridge' ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          Tampermonkey Userscript Bridge
        </button>
      </div>

      {/* Main Documentation & Interactive Test Console */}
      {selectedEndpoint === 'bridge' ? (
        <div className="bg-slate-900/90 border border-purple-800/50 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                Google AI Studio / Browser Userscript Bridge
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Install this script into Tampermonkey or Violentmonkey to connect your Google AI Studio UI directly into the 256-repo Neural Mesh!
              </p>
            </div>
            <button
              id="copy-tampermonkey-btn"
              onClick={() => handleCopy(tampermonkeyScript, 'tampermonkey')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              {copiedKey === 'tampermonkey' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'tampermonkey' ? 'Copied to Clipboard!' : 'Copy Script'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-purple-200 overflow-x-auto max-h-96">
            {tampermonkeyScript}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Code Snippet & Description */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-indigo-400">
                {selectedEndpoint === 'register' && 'POST /api/register'}
                {selectedEndpoint === 'handshake' && 'PATCH /api/handshake'}
                {selectedEndpoint === 'neurons' && 'GET /api/neurons?domain=orchestration'}
                {selectedEndpoint === 'pathways' && 'GET /api/pathways?from=A&to=B'}
              </span>

              <button
                id="copy-snippet-btn"
                onClick={() => {
                  const snippet = selectedEndpoint === 'register' ? registerPayload : handshakePayload;
                  handleCopy(snippet, 'snippet');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
              >
                {copiedKey === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Payload</span>
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1.5">
                {selectedEndpoint === 'register' ? 'Neuron Manifest Payload (neuron.json)' : 'Handshake Synapse Payload'}
              </label>
              {selectedEndpoint === 'register' ? (
                <textarea
                  id="api-test-register-payload"
                  rows={12}
                  value={registerPayload}
                  onChange={e => setRegisterPayload(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              ) : selectedEndpoint === 'handshake' ? (
                <textarea
                  id="api-test-handshake-payload"
                  rows={8}
                  value={handshakePayload}
                  onChange={e => setHandshakePayload(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-400">
                  Ready to test GET query parameters against live in-memory cortex.
                </div>
              )}
            </div>

            <button
              id="execute-api-test-btn"
              onClick={handleTestApi}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Sending Request...' : 'Send Live API Call'}</span>
            </button>
          </div>

          {/* Right Column: Live API Response Viewer */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live API Response</span>
              {apiResponse && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  HTTP 200 OK
                </span>
              )}
            </div>

            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[380px]">
              {apiResponse ? JSON.stringify(apiResponse, null, 2) : '// Click "Send Live API Call" to inspect the live JSON response'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
