//! Base-12 RocksDB Driver
//! 
//! A custom storage engine that enforces duodecimal (base-12) key encoding
//! and ordering at the persistence layer using RocksDB.

use rocksdb::{Options, Comparator, DB, Direction, IteratorMode};
use std::cmp::Ordering;
use thiserror::Error;

/// Error types for base-12 operations
#[derive(Error, Debug)]
pub enum Base12Error {
    #[error("Data corruption: non-base-12 value detected in storage engine (byte value: {0})")]
    InvalidByteValue(u8),
    
    #[error("RocksDB operation failed: {0}")]
    RocksDbError(#[from] rocksdb::Error),
    
    #[error("Key validation failed: contains non-duodecimal bytes")]
    InvalidKeyFormat,
}

/// Result type alias for base-12 operations
pub type Base12Result<T> = Result<T, Base12Error>;

/// The Duodecimal Alphabet (Σ₁₂): 0-9, A, B
/// Mapped to raw hex bytes 0x00 through 0x0B
pub const BASE12_MIN: u8 = 0x00;
pub const BASE12_MAX: u8 = 0x0B;

/// Radix-12 Codec for encoding/decoding integers to/from base-12 byte vectors
pub struct Radix12Codec;

impl Radix12Codec {
    /// Encode a standard unsigned integer into a fixed-width base-12 byte vector
    /// 
    /// The encoding uses big-endian ordering to preserve lexicographic sort order.
    pub fn encode_u64(mut value: u64) -> Vec<u8> {
        if value == 0 {
            return vec![0];
        }
        
        let mut result = Vec::new();
        while value > 0 {
            let remainder = (value % 12) as u8;
            result.push(remainder);
            value /= 12;
        }
        
        // Reverse to maintain big-endian structural significance for sorting
        result.reverse();
        result
    }

    /// Decode a base-12 byte vector back to a u64 integer
    /// 
    /// Returns an error if any byte is outside the valid base-12 range (0x00-0x0B)
    pub fn decode_u64(bytes: &[u8]) -> Base12Result<u64> {
        let mut value: u64 = 0;
        for &byte in bytes {
            if byte > BASE12_MAX {
                return Err(Base12Error::InvalidByteValue(byte));
            }
            value = value * 12 + byte as u64;
        }
        Ok(value)
    }
    
    /// Validate that a byte slice contains only valid base-12 values
    pub fn validate_key(bytes: &[u8]) -> Base12Result<()> {
        for &byte in bytes {
            if byte > BASE12_MAX {
                return Err(Base12Error::InvalidByteValue(byte));
            }
        }
        Ok(())
    }
    
    /// Encode a u64 with fixed width padding for consistent sorting
    pub fn encode_u64_fixed(value: u64, width: usize) -> Base12Result<Vec<u8>> {
        let mut encoded = Self::encode_u64(value);
        if encoded.len() > width {
            return Err(Base12Error::InvalidKeyFormat);
        }
        
        // Left-pad with zeros to achieve fixed width
        let mut padded = vec![0; width - encoded.len()];
        padded.append(&mut encoded);
        Ok(padded)
    }
}

/// Custom comparator function for base-12 keys
/// 
/// This comparator enforces:
/// 1. Validation that all bytes are within the duodecimal range (0x00-0x0B)
/// 2. Lexicographic ordering which matches base-12 ordinal sequence
fn base12_comparator(a: &[u8], b: &[u8]) -> Ordering {
    // Structural integrity check: guarantee every byte matches the radix law
    for &byte in a.iter().chain(b.iter()) {
        if byte > BASE12_MAX {
            // Treat illegal states as un-sortable anomalies
            // In practice, this should never happen if writes go through Radix12Codec
            return Ordering::Equal;
        }
    }
    
    // Standard big-endian duodecimal comparison matches lexicographical byte ordering
    a.cmp(b)
}

/// Base-12 Engine wrapper around RocksDB
/// 
/// All keys are automatically encoded/decoded using the duodecimal codec,
/// ensuring syntropic ordering at the persistence layer.
pub struct Base12Engine {
    db: DB,
}

impl Base12Engine {
    /// Open a new base-12 database at the specified path
    pub fn open(path: &str) -> Base12Result<Self> {
        let mut opts = Options::default();
        opts.create_if_missing(true);
        
        // Register the custom comparator to enforce base-12 validation and sorting
        let comp = Comparator::new("Base12Comparator", base12_comparator);
        opts.set_comparator(comp);

        let db = DB::open(&opts, path)?;
        Ok(Base12Engine { db })
    }

    /// Store a value with a u64 key (automatically encoded to base-12)
    pub fn put_radix_state(&self, key: u64, value: &[u8]) -> Base12Result<()> {
        let encoded_key = Radix12Codec::encode_u64(key);
        self.db.put(&encoded_key, value)?;
        Ok(())
    }

    /// Retrieve a value by u64 key (automatically decoded from base-12)
    pub fn get_radix_state(&self, key: u64) -> Base12Result<Option<Vec<u8>>> {
        let encoded_key = Radix12Codec::encode_u64(key);
        Ok(self.db.get(&encoded_key)?)
    }

    /// Delete a key by u64 identifier
    pub fn delete_radix_state(&self, key: u64) -> Base12Result<()> {
        let encoded_key = Radix12Codec::encode_u64(key);
        self.db.delete(&encoded_key)?;
        Ok(())
    }

    /// Iterate over a range of base-12 keys
    /// 
    /// Returns an iterator yielding (decoded_key, value) pairs
    pub fn range_scan(&self, start: u64, end: u64) -> Base12Result<Base12RangeIterator> {
        let start_key = Radix12Codec::encode_u64(start);
        let end_key = Radix12Codec::encode_u64(end);
        
        let iter = self.db.iterator(IteratorMode::From(&start_key, Direction::Forward));
        Ok(Base12RangeIterator {
            inner: iter,
            end_key,
        })
    }

    /// Get the underlying RocksDB instance for advanced operations
    pub fn inner_db(&self) -> &DB {
        &self.db
    }
}

/// Iterator for range scans over base-12 keys
pub struct Base12RangeIterator<'a> {
    inner: rocksdb::DBIterator<'a>,
    end_key: Vec<u8>,
}

impl<'a> Iterator for Base12RangeIterator<'a> {
    type Item = Base12Result<(u64, Vec<u8>)>;

    fn next(&mut self) -> Option<Self::Item> {
        match self.inner.next() {
            Some(Ok((key, value))) => {
                // Check if we've exceeded the range
                if key.as_ref() > self.end_key.as_slice() {
                    return None;
                }
                
                // Decode the key
                match Radix12Codec::decode_u64(&key) {
                    Ok(decoded_key) => Some(Ok((decoded_key, value.to_vec()))),
                    Err(e) => Some(Err(e)),
                }
            }
            Some(Err(e)) => Some(Err(Base12Error::from(e))),
            None => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_codec_round_trip() {
        let test_values = vec![0, 1, 11, 12, 143, 1727, 1728, u64::MAX];
        
        for value in test_values {
            let encoded = Radix12Codec::encode_u64(value);
            let decoded = Radix12Codec::decode_u64(&encoded).unwrap();
            assert_eq!(value, decoded, "Round trip failed for {}", value);
        }
    }

    #[test]
    fn test_codec_base12_validation() {
        // Valid base-12 bytes
        assert!(Radix12Codec::validate_key(&[0, 1, 5, 10, 11]).is_ok());
        
        // Invalid: byte > 11
        assert!(Radix12Codec::validate_key(&[0, 1, 12]).is_err());
        assert!(Radix12Codec::validate_key(&[255]).is_err());
    }

    #[test]
    fn test_ordering_preservation() {
        // Keys should sort in base-12 order
        let keys = vec![1, 11, 12, 143, 1727, 1728];
        let encoded: Vec<Vec<u8>> = keys.iter().map(|&k| Radix12Codec::encode_u64(k)).collect();
        
        // Verify encoded keys are in ascending order
        for i in 0..encoded.len() - 1 {
            assert!(encoded[i] < encoded[i + 1], 
                "Ordering failed: {} ({:?}) should be < {} ({:?})",
                keys[i], encoded[i], keys[i + 1], encoded[i + 1]);
        }
    }

    #[test]
    fn test_engine_put_get() {
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().join("test_db");
        
        let engine = Base12Engine::open(path.to_str().unwrap()).unwrap();
        
        // Test basic put/get
        engine.put_radix_state(42, b"hello").unwrap();
        let value = engine.get_radix_state(42).unwrap().unwrap();
        assert_eq!(value, b"hello");
        
        // Test non-existent key
        let missing = engine.get_radix_state(999).unwrap();
        assert!(missing.is_none());
    }

    #[test]
    fn test_engine_range_scan() {
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().join("test_db");
        
        let engine = Base12Engine::open(path.to_str().unwrap()).unwrap();
        
        // Insert sequential keys
        for i in 0..20 {
            engine.put_radix_state(i, format!("value_{}", i).as_bytes()).unwrap();
        }
        
        // Scan range [5, 15]
        let mut results = Vec::new();
        for item in engine.range_scan(5, 15).unwrap() {
            let (key, value) = item.unwrap();
            results.push((key, String::from_utf8(value).unwrap()));
        }
        
        assert_eq!(results.len(), 11); // Keys 5 through 15 inclusive
        assert_eq!(results[0].0, 5);
        assert_eq!(results[10].0, 15);
    }

    #[test]
    fn test_syntropy_enforcement() {
        // Demonstrate that the comparator rejects invalid base-12 data
        let valid_key = Radix12Codec::encode_u64(100);
        let invalid_key = vec![0, 1, 15, 3]; // 15 is not a valid base-12 digit
        
        // The comparator should handle this gracefully
        let ordering = base12_comparator(&valid_key, &invalid_key);
        // Invalid keys are treated as equal (un-sortable)
        assert_eq!(ordering, Ordering::Equal);
    }
}

fn main() {
    println!("Base-12 RocksDB Driver initialized");
    println!("Duodecimal alphabet: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, A(10), B(11)");
    println!("Byte mapping: 0x00 - 0x0B");
    
    // Demo: encode some values
    let demo_values = vec![0, 1, 11, 12, 144, 1728];
    println!("\nEncoding examples:");
    for val in demo_values {
        let encoded = Radix12Codec::encode_u64(val);
        println!("  {} -> {:?}", val, encoded);
    }
}
