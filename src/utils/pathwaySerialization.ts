import { PathwayDefinition } from '../types/neuron.ts';

/**
 * Safely encodes a pathway definition into a UTF-8 safe base64 URL parameter.
 */
export function encodePathwayToBase64(pathway: PathwayDefinition): string {
  const jsonString = JSON.stringify(pathway);
  const utf8Bytes = encodeURIComponent(jsonString);
  const base64 = btoa(unescape(utf8Bytes));
  return encodeURIComponent(base64);
}

/**
 * Safely decodes a base64 encoded string into a PathwayDefinition.
 */
export function decodePathwayFromBase64(base64Str: string): PathwayDefinition {
  const rawBase64 = decodeURIComponent(base64Str);
  const utf8Bytes = atob(rawBase64);
  const jsonString = decodeURIComponent(escape(utf8Bytes));
  const parsed = JSON.parse(jsonString);
  return validatePathwaySchema(parsed);
}

/**
 * Generates a full shareable reproducible URL for a pathway.
 */
export function generatePathwayShareableUrl(pathway: PathwayDefinition): string {
  const encoded = encodePathwayToBase64(pathway);
  return `${window.location.origin}${window.location.pathname}?tab=pathways&pathway_data=${encoded}`;
}

/**
 * Triggers a client-side download of a formatted JSON file.
 */
export function downloadPathwayAsJsonFile(pathway: PathwayDefinition): string {
  const prettyJson = JSON.stringify(pathway, null, 2);
  const dataStr = "data:application/json;charset=utf-8," + encodeURIComponent(prettyJson);
  const downloadAnchor = document.createElement('a');
  const safeFilename = `${pathway.id || 'neural-pathway'}.json`;
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", safeFilename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  return safeFilename;
}

/**
 * Validates and sanitizes a raw pathway object.
 */
export function validatePathwaySchema(data: any): PathwayDefinition {
  if (!data || typeof data !== 'object') {
    throw new Error('Pathway payload must be a JSON object.');
  }

  if (!data.id || typeof data.id !== 'string') {
    throw new Error('Pathway is missing a valid "id" field.');
  }

  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Pathway is missing a valid "name" field.');
  }

  if (!Array.isArray(data.steps) || data.steps.length === 0) {
    throw new Error('Pathway must contain at least one step in the "steps" array.');
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || 'Neural mesh workflow pipeline',
    routing_policy: ['least_latency', 'cost_optimized', 'failover_redundant', 'round_robin'].includes(data.routing_policy)
      ? data.routing_policy
      : 'least_latency',
    steps: data.steps.map((s: any, idx: number) => {
      const neuronId = s.neuronId || s.neuron_id;
      if (!neuronId) throw new Error(`Step #${idx + 1} is missing neuronId.`);
      return {
        neuronId,
        capability: s.capability || 'route',
        timeout_ms: typeof s.timeout_ms === 'number' ? s.timeout_ms : 150,
        fallbackNeuronId: s.fallbackNeuronId || s.fallback_neuron_id
      };
    }),
    created_at: data.created_at || new Date().toISOString()
  };
}
