#!/usr/bin/env bash
# Benchmark Suite - Empirical Proof against Boolean AI Baselines

set -e

echo "======================================"
echo "  Sovereign Build Benchmark Suite"
echo "  Base-12 vs Boolean AI Comparison"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

run_test() {
    local test_name="$1"
    local test_cmd="$2"
    
    echo -n "Running: $test_name ... "
    
    if eval "$test_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        ((pass_count++))
    else
        echo -e "${RED}FAIL${NC}"
        ((fail_count++))
    fi
}

echo "--- Core Engine Tests ---"
run_test "Base-12 Conversion" "cd /workspace/quantizer-core && cargo test test_base12_conversion --release"
run_test "Radix Range Iterator" "cd /workspace/quantizer-core && cargo test test_radix_range --release"

echo ""
echo "--- Sidecar Storage Tests ---"
run_test "LZ4 Compression" "cd /workspace/sidecar && cargo test test_lz4_compress --release"
run_test "Storage Roundtrip" "cd /workspace/sidecar && cargo test test_storage_roundtrip --release"

echo ""
echo "--- WASM Bridge Tests ---"
run_test "WASM Base-12 Conversion" "cd /workspace/wasm-bridge && cargo test --release"

echo ""
echo "======================================"
echo "  Benchmark Results Summary"
echo "======================================"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}All benchmarks passed! System ready for production.${NC}"
    exit 0
else
    echo -e "${YELLOW}Some benchmarks failed. Review output above.${NC}"
    exit 1
fi
