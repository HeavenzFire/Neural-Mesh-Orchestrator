import React, { useState } from 'react';
import { 
  PathwayDefinition 
} from '../types/neuron.ts';
import {
  generatePathwayShareableUrl,
  downloadPathwayAsJsonFile,
  encodePathwayToBase64
} from '../utils/pathwaySerialization.ts';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Link as LinkIcon, 
  FileCode2, 
  Terminal, 
  ExternalLink,
  Share2,
  CheckCircle2,
  Code2,
  Send
} from 'lucide-react';

interface SharePathwayModalProps {
  isOpen: boolean;
  onClose: () => void;
  pathway: PathwayDefinition | null;
  onExportJson?: () => void;
}

export default function SharePathwayModal({
  isOpen,
  onClose,
  pathway,
  onExportJson
}: SharePathwayModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedBase64, setCopiedBase64] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'json' | 'curl' | 'base64'>('link');

  if (!isOpen || !pathway) return null;

  // Generate shareable link with encoded pathway payload
  const shareableUrl = generatePathwayShareableUrl(pathway);
  const prettyJson = JSON.stringify(pathway, null, 2);
  const base64Payload = encodePathwayToBase64(pathway);

  const curlCommand = `curl -X POST "${window.location.origin}/api/pathways" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(pathway)}'`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(prettyJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2500);
  };

  const handleCopyBase64 = () => {
    navigator.clipboard.writeText(base64Payload);
    setCopiedBase64(true);
    setTimeout(() => setCopiedBase64(false), 2500);
  };

  const handleDownloadFile = () => {
    if (onExportJson) {
      onExportJson();
    } else {
      downloadPathwayAsJsonFile(pathway);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        id="share-pathway-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Share & Export Neural Pathway
              </h3>
              <p className="text-xs text-slate-400">
                Reproduce <span className="text-indigo-300 font-mono font-medium">{pathway.name}</span> across teammates and mesh clusters.
              </p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-3 gap-3">
          <button
            id="tab-share-link-btn"
            onClick={() => setActiveTab('link')}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'link'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Shareable URL
          </button>

          <button
            id="tab-share-json-btn"
            onClick={() => setActiveTab('json')}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'json'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            JSON Manifest
          </button>

          <button
            id="tab-share-curl-btn"
            onClick={() => setActiveTab('curl')}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'curl'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            cURL / API Command
          </button>

          <button
            id="tab-share-base64-btn"
            onClick={() => setActiveTab('base64')}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'base64'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Base64 Payload
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-200">
                <div className="font-semibold text-indigo-100 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  Self-Contained Base64-Encoded Reproducible URL
                </div>
                <p className="text-indigo-300/90 leading-relaxed">
                  This link embeds the complete {pathway.steps.length}-hop pipeline definition in a compact, UTF-8 base64 URI payload. Opening this URL anywhere automatically reconstitutes and activates the exact pathway on any mesh instance.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Reproducible Web Link (Base64 Encoded)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="shareable-url-input"
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 select-all focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    id="copy-share-url-btn"
                    onClick={handleCopyLink}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                    }`}
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Pathway Quick Specs */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Hops</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{pathway.steps.length} Steps</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Routing Policy</span>
                  <span className="text-xs font-mono font-bold text-indigo-400 capitalize">{pathway.routing_policy.replace('_', ' ')}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">ID</span>
                  <span className="text-xs font-mono font-bold text-slate-400 truncate block">{pathway.id}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  JSON Definition Schema ({pathway.id}.json)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id="copy-json-btn"
                    onClick={handleCopyJson}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1 border border-slate-700"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                  <button
                    id="download-json-modal-btn"
                    onClick={handleDownloadFile}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium flex items-center gap-1 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-72 select-all">
                {prettyJson}
              </pre>
            </div>
          )}

          {activeTab === 'curl' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  Direct CI/CD Mesh Register Command
                </span>
                <button
                  id="copy-curl-btn"
                  onClick={handleCopyCurl}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1 border border-slate-700"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto max-h-64 whitespace-pre-wrap select-all">
                {curlCommand}
              </pre>
            </div>
          )}

          {activeTab === 'base64' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  Base64 Serialized Pathway String
                </span>
                <button
                  id="copy-base64-raw-btn"
                  onClick={handleCopyBase64}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1 border border-slate-700"
                >
                  {copiedBase64 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBase64 ? 'Copied' : 'Copy Base64'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-64 break-all select-all">
                {base64Payload}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            id="download-file-footer-btn"
            onClick={handleDownloadFile}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Download .JSON File</span>
          </button>

          <button
            id="close-share-dialog-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
