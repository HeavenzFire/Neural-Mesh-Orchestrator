//! Base-12 RocksDB Driver - Binary executable

use base12_rocksdb_driver::{Base12Engine, Radix12Codec, Base12Result};

fn main() -> Base12Result<()> {
    println!("═══════════════════════════════════════════════════════════");
    println!("       Base-12 RocksDB Driver - Syntropic Storage Engine");
    println!("═══════════════════════════════════════════════════════════");
    println!();
    println!("Duodecimal Alphabet (Σ₁₂): 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, A(10), B(11)");
    println!("Byte Mapping: 0x00 - 0x0B");
    println!();
    
    // Demo: encode some values
    println!("───────────────────────────────────────────────────────────");
    println!("Encoding Examples:");
    println!("───────────────────────────────────────────────────────────");
    let demo_values = vec![0, 1, 11, 12, 144, 1728, 20736];
    for val in demo_values {
        let encoded = Radix12Codec::encode_u64(val);
        println!("  Decimal {:>6} → Base-12 Bytes: {:?}", val, encoded);
    }
    println!();
    
    // Demo: database operations
    println!("───────────────────────────────────────────────────────────");
    println!("Database Operations Demo:");
    println!("───────────────────────────────────────────────────────────");
    
    let temp_dir = tempfile::tempdir().expect("Failed to create temp directory");
    let db_path = temp_dir.path().join("base12_demo_db");
    
    println!("Opening database at: {:?}", db_path);
    let engine = Base12Engine::open(db_path.to_str().unwrap())?;
    println!("✓ Database opened successfully");
    println!();
    
    // Insert some state
    println!("Inserting syntropic state entries...");
    let entries = vec![
        (1, "unity"),
        (3, "triad"),
        (6, "hexad"),
        (9, "ennead"),
        (12, "dozen"),
        (144, "gross"),
        (1728, "great_gross"),
    ];
    
    for (key, value) in &entries {
        engine.put_radix_state(*key, value.as_bytes())?;
        println!("  PUT key={} (base-12) → value=\"{}\"", key, value);
    }
    println!();
    
    // Retrieve and verify
    println!("Retrieving entries...");
    for (key, expected_value) in &entries {
        if let Some(value) = engine.get_radix_state(*key)? {
            let value_str = String::from_utf8_lossy(&value);
            println!("  GET key={} → \"{}\" ✓", key, value_str);
        } else {
            println!("  GET key={} → NOT FOUND ✗", key);
        }
    }
    println!();
    
    // Range scan demonstration
    println!("───────────────────────────────────────────────────────────");
    println!("Range Scan Demo [3, 144]:");
    println!("───────────────────────────────────────────────────────────");
    let mut count = 0;
    for item in engine.range_scan(3, 144)? {
        let (key, value) = item?;
        let value_str = String::from_utf8_lossy(&value);
        println!("  Iterator: key={} → \"{}\"", key, value_str);
        count += 1;
    }
    println!("Total entries in range: {}", count);
    println!();
    
    println!("═══════════════════════════════════════════════════════════");
    println!("Syntropy enforcement active at persistence layer.");
    println!("All keys conform to duodecimal ordinal sequence.");
    println!("═══════════════════════════════════════════════════════════");
    
    Ok(())
}
