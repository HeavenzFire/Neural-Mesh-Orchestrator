//! WASM Bridge - Client-side Base-12 Operations
//! <1ms client-side operations

use wasm_bindgen::prelude::*;
use quantizer_core::{to_base12, Base12Digit, RadixBuffer, RadixRangeIter};
use serde::{Serialize, Deserialize};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// JavaScript-compatible Base12 result
#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct JsBase12Result {
    digits: Vec<u8>,
    length: usize,
}

#[wasm_bindgen]
impl JsBase12Result {
    #[wasm_bindgen(getter)]
    pub fn digits(&self) -> Vec<u8> {
        self.digits.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn length(&self) -> usize {
        self.length
    }
}

/// Convert a number to Base-12 representation (WASM export)
#[wasm_bindgen]
pub fn convert_to_base12(value: u64) -> JsBase12Result {
    let buffer: RadixBuffer<16> = to_base12(value);
    let digits: Vec<u8> = buffer.as_slice().iter().map(|d| d.value()).collect();
    
    JsBase12Result {
        digits,
        length: buffer.len(),
    }
}

/// Perform range iteration over radix space (WASM export)
#[wasm_bindgen]
pub fn radix_range_iter(start: u64, end: u64, count: usize) -> Vec<JsValue> {
    let mut results = Vec::with_capacity(count.min((end - start) as usize));
    let mut iter = RadixRangeIter::<16>::new(start, end);
    
    for _ in 0..count {
        if let Some(buffer) = iter.next() {
            let digits: Vec<u8> = buffer.as_slice().iter().map(|d| d.value()).collect();
            let result = JsBase12Result {
                digits,
                length: buffer.len(),
            };
            results.push(serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL));
        } else {
            break;
        }
    }
    
    results
}

/// Benchmark operation latency (returns microseconds)
#[wasm_bindgen]
pub fn benchmark_conversion(iterations: u32) -> f64 {
    let start = js_sys::Date::now();
    
    for i in 0..iterations {
        let _: RadixBuffer<16> = to_base12(i as u64);
    }
    
    let end = js_sys::Date::now();
    (end - start) / (iterations as f64) * 1000.0 // Convert to microseconds per op
}

/// Initialize the WASM bridge (optional setup)
#[wasm_bindgen(start)]
pub fn main() {
    #[cfg(debug_assertions)]
    log("WASM Bridge initialized - Base-12 engine ready");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_convert_to_base12() {
        let result = convert_to_base12(12);
        assert_eq!(result.length, 2);
        assert_eq!(result.digits()[0], 0);
        assert_eq!(result.digits()[1], 1);
    }
}
