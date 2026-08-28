import React, { useState } from 'react';
import { PathwayDefinition } from '../types/neuron.ts';
import { 
  decodePathwayFromBase64, 
  validatePathwaySchema 
} from '../utils/pathwaySerialization.ts';
import { 
  X, 
  Upload, 
  FileCode2, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle,
  FileJson,
  Sparkles
} from 'lucide-react';

interface ImportPathwayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPathway: (pathway: PathwayDefinition) => void;
}

export default function ImportPathwayModal({
  isOpen,
  onClose,
  onImportPathway
}: ImportPathwayModalProps) {
  const [importInput, setImportInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const parseAndImport = (content: string) => {
    setError(null);
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Please provide a valid JSON pathway definition, base64 payload, or shareable URL.');
      return;
    }

    try {
      // 1. Check if it's a shareable link with pathway_data
      if (trimmed.includes('pathway_data=')) {
        const match = trimmed.match(/pathway_data=([^&]+)/);
        if (match && match[1]) {
          const parsed = decodePathwayFromBase64(match[1]);
          onImportPathway(parsed);
          onClose();
          return;
        }
      }

      // 2. Check if it's raw JSON
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        const validPathway = validatePathwaySchema(parsed);
        onImportPathway(validPathway);
        onClose();
        return;
      }

      // 3. Check if it's a raw base64 string
      try {
        const parsed = decodePathwayFromBase64(trimmed);
        onImportPathway(parsed);
        onClose();
        return;
      } catch (e) {
        // Fallback to JSON parse
        const parsed = JSON.parse(trimmed);
        const validPathway = validatePathwaySchema(parsed);
        onImportPathway(validPathway);
        onClose();
      }
    } catch (err: any) {
      setError('Failed to parse definition: ' + (err.message || 'Invalid format'));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportInput(text);
      parseAndImport(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportInput(text);
        parseAndImport(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        id="import-pathway-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Import Pathway Definition</h3>
              <p className="text-xs text-slate-400">Load or paste a reproducible pathway specification</p>
            </div>
          </div>
          <button
            id="close-import-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-950/20'
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
            }`}
          >
            <FileCode2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-200">
              Drag and drop a pathway JSON file here
            </p>
            <p className="text-[11px] text-slate-500 mt-1">or browse from your machine</p>
            
            <label className="mt-3 inline-block">
              <input
                id="file-upload-input"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-xs font-medium border border-slate-700 inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Select .json File
              </span>
            </label>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-semibold uppercase">Or Paste JSON / Share Link</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <div>
            <textarea
              id="import-json-textarea"
              rows={5}
              placeholder='Paste raw JSON { "id": "my-pathway", "name": "...", "steps": [...] } or a ?pathway_data=... link'
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            id="cancel-import-btn"
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            id="confirm-import-btn"
            onClick={() => parseAndImport(importInput)}
            disabled={!importInput.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-lg"
          >
            Import Pathway
          </button>
        </div>
      </div>
    </div>
  );
}
