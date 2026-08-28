# Sovereign Build Scaffolding

## Overview

The Sovereign Build system implements a Base-12 Radix Space Engine with:
- **Zero heap allocation** core quantizer (stack-only operations)
- **LZ4 compression** for optimized storage layer
- **WASM bridge** for client-side <1ms operations
- **NPM package** (`iben-genesis`) for ecosystem distribution
- **Self-hosted CI/CD** pipeline (Woodpecker)

## Components

| Component | Status | Location | Key Metric |
|-----------|--------|----------|------------|
| Core Engine | ✅ Compiled | `quantizer-core/` | 0 heap alloc, stack-only |
| Sidecar API | ✅ Ready | `sidecar/` | Base-12/RocksDB driver |
| WASM Bridge | ✅ Optimized | `wasm-bridge/` | <1ms client-side op |
| NPM Package | ✅ Packaged | `wasm-bridge-pkg/` | TypeScript bindings |
| Benchmarks | ✅ Scripted | `bench/` | Empirical proof suite |
| CI/CD | ✅ Defined | `.woodpecker.yml` | Air-gapped, reproducible |

## Quick Start

### Build All Targets

```bash
# Native binaries
cd quantizer-core && cargo build --release
cd sidecar && cargo build --release

# WASM module
cd wasm-bridge && wasm-pack build --release

# NPM package
cd wasm-bridge-pkg && npm pack
```

### Run Benchmarks

```bash
./bench/run_benchmarks.sh
```

### Deploy to Kubernetes

```bash
helm install sovereign ./ci/templates/deploy/helm/sovereign-ledger
```

## Post-Deploy Quick Start

```bash
# Verify deployment
kubectl get pods -l app.kubernetes.io/name=sovereign-ledger

# Check compression metrics
kubectl logs -l app.kubernetes.io/name=sovereign-ledger

# Range query test
curl http://localhost/api/range?start=0&end=100
```

## Integration Points

1. Copy `.woodpecker.yml` or `.gitlab-ci.yml` to your repo root
2. Deploy to Kubernetes: `helm install sovereign /opt/sovereign/ci/templates/deploy/helm/sovereign-ledger`
3. All configs enforce higher-radix persistence at the storage layer

## API Specification v1.0.0

### Endpoints

- `GET /api/range?start={u64}&end={u64}` - Range query over radix space
- `POST /api/store` - Store compressed entry
- `GET /api/metrics` - Compression ratio and performance stats

### Response Format

```json
{
  "key": 42,
  "radix_repr": [6, 3],
  "compressed_size": 256,
  "original_size": 1024,
  "compression_ratio": 4.0
}
```

## License

MIT - Sovereign Build
