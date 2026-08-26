import { useState, useEffect } from 'react';
import { 
  PathwayDefinition, 
  PathwayStep, 
  PathwayExecutionResult, 
  NeuronNode 
} from '../types/neuron.ts';
import { MeshApi } from '../services/api.ts';
import SharePathwayModal from './SharePathwayModal.tsx';
import ImportPathwayModal from './ImportPathwayModal.tsx';
import {
  downloadPathwayAsJsonFile,
  generatePathwayShareableUrl,
  decodePathwayFromBase64
} from '../utils/pathwaySerialization.ts';
import { 
  Play, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  RefreshCw, 
  FileCode2, 
  Cpu,
  CornerDownRight,
  Hash,
  Download,
  Share2,
  Upload,
  Link as LinkIcon,
  Check,
  FileJson,
  Layers,
  Copy,
  Sliders,
  CheckCheck
} from 'lucide-react';

interface PathwayStudioProps {
  neurons: NeuronNode[];
  onPathwayExecuted?: (result: PathwayExecutionResult) => void;
  onHighlightSteps?: (stepNeuronIds: string[]) => void;
}

export default function PathwayStudio({ neurons, onPathwayExecuted, onHighlightSteps }: PathwayStudioProps) {
  const [pathways, setPathways] = useState<PathwayDefinition[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<PathwayDefinition | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<PathwayExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [simulateFailover, setSimulateFailover] = useState(false);

  // Modals and feedback state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedLinkForId, setCopiedLinkForId] = useState<string | null>(null);
  const [copiedQuickLink, setCopiedQuickLink] = useState(false);

  // Custom payload input
  const [inputPayloadStr, setInputPayloadStr] = useState<string>(
    JSON.stringify({ prompt: 'Build me a lattice body for neural routing', context: { user: 'zachary', priority: 'high' } }, null, 2)
  );

  // AI Optimizer State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<PathwayDefinition>({
    id: '',
    name: '',
    description: '',
    routing_policy: 'least_latency',
    steps: [],
    created_at: ''
  });

  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const loadPathways = async () => {
    try {
      const list = await MeshApi.getPathways();
      
      // Check for shareable link or pathway_data in query params
      const urlParams = new URLSearchParams(window.location.search);
      const sharedDataParam = urlParams.get('pathway_data');
      const sharedIdParam = urlParams.get('pathway_id');

      let initialSelected: PathwayDefinition | null = null;

      if (sharedDataParam) {
        try {
          const parsed = decodePathwayFromBase64(sharedDataParam);
          if (parsed && parsed.id && parsed.steps) {
            initialSelected = parsed;
            const exists = list.some(p => p.id === parsed.id);
            if (!exists) {
              list.unshift(parsed);
            }
            notify(`Loaded shared reproducible pathway: "${parsed.name}"`);
          }
        } catch (e) {
          console.warn('Failed to parse pathway_data param:', e);
        }
      } else if (sharedIdParam) {
        const found = list.find(p => p.id === sharedIdParam);
        if (found) {
          initialSelected = found;
          notify(`Selected pathway from link: "${found.name}"`);
        }
      }

      setPathways(list);
      if (initialSelected) {
        setSelectedPathway(initialSelected);
      } else if (list.length > 0 && !selectedPathway) {
        setSelectedPathway(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPathways();
  }, []);

  useEffect(() => {
    if (selectedPathway && onHighlightSteps) {
      onHighlightSteps(selectedPathway.steps.map(s => s.neuronId));
    }
  }, [selectedPathway]);

  const handleSelectPathway = (p: PathwayDefinition) => {
    setSelectedPathway(p);
    setExecutionResult(null);
    setExecutionError(null);
    setActiveStepIndex(null);
    setIsEditing(false);
  };

  const handleExecute = async () => {
    if (!selectedPathway) return;
    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(inputPayloadStr);
    } catch (e) {
      setExecutionError('Invalid JSON input payload');
      setIsExecuting(false);
      return;
    }

    try {
      // Step through visually
      for (let i = 0; i < selectedPathway.steps.length; i++) {
        setActiveStepIndex(i);
        await new Promise(r => setTimeout(r, 260));
      }

      const result = await MeshApi.executePathway(selectedPathway.id, parsedPayload);
      setExecutionResult(result);
      if (onPathwayExecuted) onPathwayExecuted(result);
    } catch (err: any) {
      setExecutionError(err.message || 'Execution error');
    } finally {
      setIsExecuting(false);
      setActiveStepIndex(null);
    }
  };

  const handleAiOptimize = async () => {
    if (!aiPrompt.trim()) return;
    setIsOptimizing(true);
    try {
      const res = await MeshApi.optimizePathwayWithAI(aiPrompt, selectedPathway?.id);
      setAiInsight(res);
      if (res.recommended_pathway) {
        const newP = {
          ...res.recommended_pathway,
          id: res.recommended_pathway.id || 'ai-path-' + Date.now().toString(36),
          created_at: new Date().toISOString()
        } as PathwayDefinition;
        setSelectedPathway(newP);
        setEditForm(newP);
        setIsEditing(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSavePathway = async () => {
    try {
      const saved = await MeshApi.savePathway(editForm);
      await loadPathways();
      setSelectedPathway(saved);
      setIsEditing(false);
      notify(`Pathway "${saved.name}" saved to cortex.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Export current active pathway configuration into a JSON file
  const handleExportJson = (targetPathway?: PathwayDefinition) => {
    const pathwayToExport = targetPathway || (isEditing ? editForm : selectedPathway);
    if (!pathwayToExport) return;

    const filename = downloadPathwayAsJsonFile(pathwayToExport);
    notify(`Serialized and downloaded "${filename}" JSON file.`);
  };

  // Generate base64-encoded URL link for quick sharing and reproduction
  const handleCopyBase64UrlLink = (targetPathway?: PathwayDefinition) => {
    const target = targetPathway || (isEditing ? editForm : selectedPathway);
    if (!target) return;

    const shareableUrl = generatePathwayShareableUrl(target);
    navigator.clipboard.writeText(shareableUrl);

    if (targetPathway) {
      setCopiedLinkForId(targetPathway.id);
      setTimeout(() => setCopiedLinkForId(null), 2000);
    } else {
      setCopiedQuickLink(true);
      setTimeout(() => setCopiedQuickLink(false), 2000);
    }
    notify(`Base64 reproducible link for "${target.name}" copied to clipboard!`);
  };

  const handleImportPathway = (imported: PathwayDefinition) => {
    setPathways(prev => {
      const filtered = prev.filter(p => p.id !== imported.id);
      return [imported, ...filtered];
    });
    setSelectedPathway(imported);
    setIsEditing(false);
    notify(`Successfully imported pathway "${imported.name}" with ${imported.steps.length} hops.`);
  };

  const handleAddStep = () => {
    const defaultNode = neurons[0]?.manifest.id || 'entangled-multimodal-system-3';
    const newStep: PathwayStep = {
      neuronId: defaultNode,
      capability: neurons[0]?.manifest.capabilities[0] || 'route',
      timeout_ms: 150,
      fallbackNeuronId: neurons[1]?.manifest.id
    };
    setEditForm({
      ...editForm,
      steps: [...editForm.steps, newStep]
    });
  };

  const handleRemoveStep = (index: number) => {
    const nextSteps = [...editForm.steps];
    nextSteps.splice(index, 1);
    setEditForm({ ...editForm, steps: nextSteps });
  };

  const handleUpdateStep = (index: number, field: keyof PathwayStep, value: any) => {
    const nextSteps = [...editForm.steps];
    nextSteps[index] = { ...nextSteps[index], [field]: value };
    // If neuronId changed, update default capability to first valid cap
    if (field === 'neuronId') {
      const node = neurons.find(n => n.manifest.id === value);
      if (node && node.manifest.capabilities.length > 0) {
        nextSteps[index].capability = node.manifest.capabilities[0];
      }
    }
    setEditForm({ ...editForm, steps: nextSteps });
  };

  const currentPathway = isEditing ? editForm : selectedPathway;

  return (
    <div className="space-y-6">
      {/* Toast Notification Notice */}
      {actionNotice && (
        <div className="p-3 bg-indigo-950/90 border border-indigo-500/50 rounded-xl text-xs text-indigo-200 flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)}
            className="text-indigo-400 hover:text-indigo-200 text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header Card with AI Thread Optimizer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Cpu className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-100">Neural Pathway Threading Engine</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Thread multi-hop execution pipelines across 256 repository nodes with dynamic capability discovery, Base64 & JSON reproducibility, and load-balanced failovers.
            </p>
          </div>

          {/* AI Thread Synthesizer Prompt Input */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Sparkles className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
              <input
                id="ai-prompt-input"
                type="text"
                placeholder="e.g. 'Route prompt -> Genesis synth -> Sandbox AST -> Verify'"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiOptimize()}
                className="w-full bg-slate-950/80 border border-purple-500/30 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>
            <button
              id="ai-synthesize-pathway-btn"
              onClick={handleAiOptimize}
              disabled={isOptimizing || !aiPrompt.trim()}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md"
            >
              {isOptimizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Thread with AI</span>
            </button>
          </div>
        </div>

        {/* AI Insight Box */}
        {aiInsight && (
          <div className="mt-4 p-3 bg-purple-950/30 border border-purple-800/40 rounded-lg text-xs text-purple-200 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-purple-100">AI Cortex Synthesis Result:</div>
              <p className="text-purple-300/90">{aiInsight.reasoning}</p>
              {aiInsight.bottleneck_analysis && (
                <p className="text-purple-400/80 text-[11px]">
                  <strong>Bottleneck Analysis:</strong> {aiInsight.bottleneck_analysis}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pathway Selector & Meta */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Configured Pathways</h3>
              <div className="flex items-center gap-2">
                <button
                  id="import-pathway-btn"
                  onClick={() => setIsImportModalOpen(true)}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
                  title="Import from JSON or Share Link"
                >
                  <Upload className="w-3 h-3 text-indigo-400" />
                  <span>Import</span>
                </button>
                <button
                  id="create-new-pathway-btn"
                  onClick={() => {
                    const newDef: PathwayDefinition = {
                      id: 'custom-path-' + Math.random().toString(36).substring(2, 7),
                      name: 'New Custom Neural Pipeline',
                      description: 'Custom chain threading across repository nodes.',
                      routing_policy: 'least_latency',
                      steps: [
                        { neuronId: 'entangled-multimodal-system-3', capability: 'route', timeout_ms: 100 },
                        { neuronId: 'iben-genesis', capability: 'generate', timeout_ms: 300 }
                      ],
                      created_at: new Date().toISOString()
                    };
                    setEditForm(newDef);
                    setSelectedPathway(newDef);
                    setIsEditing(true);
                  }}
                  className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-medium bg-indigo-950/60 hover:bg-indigo-900/80 px-2.5 py-1 rounded-lg border border-indigo-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {pathways.map(p => {
                const isSelected = selectedPathway?.id === p.id;
                const isCopied = copiedLinkForId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/60'
                    }`}
                  >
                    <div 
                      id={`pathway-item-${p.id}`}
                      onClick={() => handleSelectPathway(p)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200 text-xs truncate max-w-[160px]">{p.name}</span>
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">
                          {p.steps.length} hops
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-500 truncate max-w-[110px]">{p.id}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`quick-copy-link-${p.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyBase64UrlLink(p);
                          }}
                          className={`p-1 rounded transition-colors ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                          }`}
                          title="Copy Base64 Share Link"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <LinkIcon className="w-3 h-3" />}
                        </button>

                        <button
                          id={`quick-export-json-${p.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportJson(p);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                          title="Download JSON file"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payload Ingress Editor */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                Ingress Payload (JSON)
              </span>
            </div>
            <textarea
              id="payload-input-textarea"
              rows={4}
              value={inputPayloadStr}
              onChange={e => setInputPayloadStr(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <div className="mt-3">
              <button
                id="execute-pathway-btn"
                onClick={handleExecute}
                disabled={isExecuting || !selectedPathway}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg"
              >
                {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isExecuting ? 'Executing Axon Thread...' : 'Execute Pathway on Mesh'}</span>
              </button>
            </div>
            {executionError && (
              <div className="mt-2 p-2 bg-rose-950/40 border border-rose-800 rounded text-rose-300 text-xs">
                {executionError}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pathway Flow Pipeline & Step Execution Waterfall */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Pathway Details Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>{currentPathway?.name || 'No Pathway Selected'}</span>
                  {currentPathway?.routing_policy && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Policy: {currentPathway.routing_policy}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{currentPathway?.description}</p>
              </div>

              {/* Action Toolbar: 1-Click Export JSON, 1-Click Base64 Link, Share Dialog */}
              <div className="flex items-center gap-2 flex-wrap">
                {currentPathway && (
                  <>
                    {/* 1. Button to serialize current active pathway configuration into a JSON file */}
                    <button
                      id="export-json-file-btn"
                      onClick={() => handleExportJson()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      title="Serialize active configuration into a downloadable .json file"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Export JSON</span>
                    </button>

                    {/* 2. Button to generate base64-encoded URL link for quick sharing and reproduction */}
                    <button
                      id="copy-base64-link-btn"
                      onClick={() => handleCopyBase64UrlLink()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border ${
                        copiedQuickLink
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-300 border-indigo-500/40 hover:border-indigo-400'
                      }`}
                      title="Generate and copy Base64-encoded reproducible web link"
                    >
                      {copiedQuickLink ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />}
                      <span>{copiedQuickLink ? 'Link Copied!' : 'Copy Base64 Link'}</span>
                    </button>

                    {/* 3. Comprehensive Share Dialog */}
                    <button
                      id="open-share-modal-btn"
                      onClick={() => setIsShareModalOpen(true)}
                      className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                      title="Open full reproducibility and sharing modal"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Share</span>
                    </button>
                  </>
                )}

                {isEditing ? (
                  <>
                    <button
                      id="save-pathway-btn"
                      onClick={handleSavePathway}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow"
                    >
                      Save Pathway
                    </button>
                    <button
                      id="cancel-edit-pathway-btn"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    id="edit-pathway-btn"
                    onClick={() => {
                      if (selectedPathway) {
                        setEditForm(selectedPathway);
                        setIsEditing(true);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700"
                  >
                    Edit Threading
                  </button>
                )}
              </div>
            </div>

            {/* Stepper Flow Cards */}
            <div className="mt-5 space-y-3">
              {(isEditing ? editForm.steps : (selectedPathway?.steps || [])).map((step, idx) => {
                const node = neurons.find(n => n.manifest.id === step.neuronId);
                const isActive = activeStepIndex === idx;
                const stepLog = executionResult?.steps.find(s => s.step_index === idx + 1);

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-indigo-950/60 border-indigo-400 shadow-lg ring-1 ring-indigo-400'
                        : stepLog?.status === 'success'
                        ? 'bg-slate-950/70 border-emerald-500/40'
                        : stepLog?.status === 'fallback_used'
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-slate-950/40 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                          isActive
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : stepLog?.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : stepLog?.status === 'fallback_used'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <select
                                id={`step-${idx}-neuron-select`}
                                value={step.neuronId}
                                onChange={e => handleUpdateStep(idx, 'neuronId', e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs font-mono"
                              >
                                {neurons.map(n => (
                                  <option key={n.manifest.id} value={n.manifest.id}>
                                    {n.manifest.id} ({n.manifest.domain})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-mono font-bold text-slate-200 text-xs">
                                {step.neuronId}
                              </span>
                            )}

                            <span className="text-slate-600">→</span>

                            {isEditing ? (
                              <select
                                id={`step-${idx}-cap-select`}
                                value={step.capability}
                                onChange={e => handleUpdateStep(idx, 'capability', e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-indigo-300 rounded px-2 py-1 text-xs font-mono"
                              >
                                {(node?.manifest.capabilities || [step.capability]).map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                {step.capability}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                            <span>Domain: <strong className="text-slate-300 capitalize">{node?.manifest.domain || 'N/A'}</strong></span>
                            <span>Latency: <strong className="text-emerald-400 font-mono">{node?.health.latency_ms || 20}ms</strong></span>
                            {step.fallbackNeuronId && (
                              <span className="text-amber-400/90 flex items-center gap-1">
                                <CornerDownRight className="w-3 h-3" /> Standby: {step.fallbackNeuronId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Execution status or edit controls */}
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <button
                            id={`remove-step-${idx}-btn`}
                            onClick={() => handleRemoveStep(idx)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : stepLog ? (
                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                              stepLog.status === 'success'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-amber-400 bg-amber-500/10'
                            }`}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {stepLog.latency_ms}ms
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              {stepLog.status === 'fallback_used' ? 'Failover Switch Active' : 'Optimal Path'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 font-mono">Timeout: {step.timeout_ms || 150}ms</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isEditing && (
                <button
                  id="add-step-btn"
                  onClick={handleAddStep}
                  className="w-full py-2 border-2 border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Pipeline Hop Step
                </button>
              )}
            </div>
          </div>

          {/* Execution Result Waterfall & Cryptographic Hash Card */}
          {executionResult && (
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Pathway Axon Chain Executed</h4>
                    <span className="text-xs font-mono text-slate-400">Trace ID: {executionResult.trace_id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Total Latency</span>
                    <span className="font-mono font-bold text-emerald-400">{executionResult.total_latency_ms}ms</span>
                  </div>
                  <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Status</span>
                    <span className="font-bold text-emerald-400 uppercase">{executionResult.status}</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic SHA-256 Audit Signature */}
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-400 truncate">
                  <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-500">Audit Hash:</span>
                  <span className="text-indigo-300 truncate">{executionResult.audit_hash}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase shrink-0 px-2 py-0.5 bg-emerald-500/10 rounded">
                  Immutable Verified
                </span>
              </div>

              {/* Step Output Payload Inspector */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Final Synthesized Payload Output
                </span>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                  {JSON.stringify(executionResult.final_output, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share & Export Modal */}
      <SharePathwayModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        pathway={currentPathway}
        onExportJson={() => handleExportJson(currentPathway || undefined)}
      />

      {/* Import Pathway Modal */}
      <ImportPathwayModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportPathway={handleImportPathway}
      />
    </div>
  );
}

