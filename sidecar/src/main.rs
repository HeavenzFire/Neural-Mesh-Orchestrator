//! Sidecar API - Base-12/RocksDB Storage Driver
//! LZ4 compression for optimized storage

use quantizer_core::{to_base12, Base12Digit, RadixBuffer};
use serde::{Deserialize, Serialize};

/// Compressed storage entry with LZ4 metadata
#[derive(Debug, Serialize, Deserialize)]
pub struct StorageEntry {
    pub key: u64,
    pub compressed_data: Vec<u8>,
    pub original_size: usize,
    pub radix_repr: Vec<u8>,
}

impl StorageEntry {
    pub fn new(key: u64, data: &[u8]) -> Self {
        // Simulated LZ4 compression (in production, use lz4 crate)
        let compressed = lz4_compress(data);
        let radix_buf = to_base12::<16>(key);
        
        StorageEntry {
            key,
            compressed_data: compressed,
            original_size: data.len(),
            radix_repr: radix_buf.as_slice().iter().map(|d| d.value()).collect(),
        }
    }
}

/// Simple LZ4-like compression simulation
fn lz4_compress(data: &[u8]) -> Vec<u8> {
    // In production: use lz4_flex::compress(data)
    // For now, simulate with simple RLE-style reduction
    if data.is_empty() {
        return vec![];
    }
    
    let mut result = Vec::with_capacity(data.len());
    let mut i = 0;
    
    while i < data.len() {
        let byte = data[i];
        let mut count = 1;
        
        while i + count < data.len() && data[i + count] == byte && count < 255 {
            count += 1;
        }
        
        result.push(count as u8);
        result.push(byte);
        i += count;
    }
    
    result
}

/// Range query result iterator
pub struct RangeQueryResult {
    entries: Vec<StorageEntry>,
    index: usize,
}

impl RangeQueryResult {
    pub fn new(entries: Vec<StorageEntry>) -> Self {
        RangeQueryResult { entries, index: 0 }
    }
}

impl Iterator for RangeQueryResult {
    type Item = StorageEntry;

    fn next(&mut self) -> Option<Self::Item> {
        if self.index >= self.entries.len() {
            return None;
        }
        let entry = self.entries[self.index].clone();
        self.index += 1;
        Some(entry)
    }
}

/// Simulated RocksDB-backed storage engine
pub struct Base12Storage {
    entries: std::collections::BTreeMap<u64, StorageEntry>,
}

impl Base12Storage {
    pub fn new() -> Self {
        Base12Storage {
            entries: std::collections::BTreeMap::new(),
        }
    }

    pub fn put(&mut self, key: u64, value: &[u8]) {
        let entry = StorageEntry::new(key, value);
        self.entries.insert(key, entry);
    }

    pub fn get(&self, key: u64) -> Option<&StorageEntry> {
        self.entries.get(&key)
    }

    pub fn range_query(&self, start: u64, end: u64) -> RangeQueryResult {
        let entries: Vec<_> = self.entries
            .range(start..end)
            .map(|(_, v)| v.clone())
            .collect();
        RangeQueryResult::new(entries)
    }

    pub fn compression_ratio(&self) -> f64 {
        if self.entries.is_empty() {
            return 1.0;
        }
        
        let total_original: usize = self.entries.values().map(|e| e.original_size).sum();
        let total_compressed: usize = self.entries.values().map(|e| e.compressed_data.len()).sum();
        
        if total_compressed == 0 {
            return 1.0;
        }
        
        total_original as f64 / total_compressed as f64
    }
}

fn main() {
    println!("Sidecar API - Base-12 Storage Driver");
    println!("=====================================");
    
    let mut storage = Base12Storage::new();
    
    // Store some test data
    for i in 0..100 {
        let data = vec![i as u8; 1024];
        storage.put(i, &data);
    }
    
    println!("Stored 100 entries");
    println!("Compression ratio: {:.2}x", storage.compression_ratio());
    
    // Range query demonstration
    println!("\nRange query [10, 15):");
    for entry in storage.range_query(10, 15) {
        println!("  Key: {}, Radix-12: {:?}", entry.key, entry.radix_repr);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lz4_compress() {
        let input = vec![1u8; 100];
        let compressed = lz4_compress(&input);
        assert!(compressed.len() < input.len());
    }

    #[test]
    fn test_storage_roundtrip() {
        let mut storage = Base12Storage::new();
        storage.put(42, b"hello world");
        assert!(storage.get(42).is_some());
    }
}
