/**
 * iben-genesis - Base-12 Radix Space Engine
 * TypeScript bindings for WASM Bridge
 */

export interface JsBase12Result {
  digits: number[];
  length: number;
}

export interface IbenGenesis {
  /**
   * Convert a number to Base-12 representation
   * @param value - The number to convert
   * @returns Base-12 digit array
   */
  convert_to_base12(value: bigint | number): JsBase12Result;

  /**
   * Perform range iteration over radix space
   * @param start - Starting value (inclusive)
   * @param end - Ending value (exclusive)
   * @param count - Maximum number of results
   * @returns Array of Base-12 results
   */
  radix_range_iter(start: bigint | number, end: bigint | number, count: number): JsBase12Result[];

  /**
   * Benchmark operation latency
   * @param iterations - Number of iterations to run
   * @returns Average microseconds per operation
   */
  benchmark_conversion(iterations: number): number;
}

// WASM module loader
let wasmModule: IbenGenesis | null = null;

/**
 * Initialize the WASM module
 * @returns Promise resolving to the IbenGenesis instance
 */
export async function init(): Promise<IbenGenesis> {
  if (wasmModule) {
    return wasmModule;
  }

  const wasmUrl = new URL('./iben_genesis_bg.wasm', import.meta.url);
  const wasmResponse = await fetch(wasmUrl);
  const wasmBytes = await wasmResponse.arrayBuffer();
  
  // Import the generated JS glue code
  const wasmExports = await import('./iben_genesis.js');
  wasmModule = await wasmExports.default(wasmBytes);
  
  return wasmModule as IbenGenesis;
}

/**
 * Quick access to Base-12 conversion
 * @param value - The number to convert
 * @returns Base-12 digit array
 */
export async function toBase12(value: bigint | number): Promise<number[]> {
  const iben = await init();
  const result = iben.convert_to_base12(value);
  return result.digits;
}

/**
 * Quick access to range queries
 * @param start - Starting value (inclusive)
 * @param end - Ending value (exclusive)
 * @param count - Maximum results
 */
export async function rangeQuery(
  start: bigint | number, 
  end: bigint | number, 
  count: number
): Promise<JsBase12Result[]> {
  const iben = await init();
  return iben.radix_range_iter(start, end, count);
}

export default init;
