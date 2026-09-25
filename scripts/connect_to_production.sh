#!/bin/bash
# =============================================================================
# PRODUCTION MESH CONNECTION SCRIPT
# Connects local agents to the AWS Sovereign Core Router via NLB
# =============================================================================

set -e

# Configuration
PROD_HOST="sov-nlb-prod-8888.elb.us-east-1.amazonaws.com"
PROD_PORT="8888"
AGENT_ID="${AGENT_ID:-local-agent-$(date +%s)}"
LOG_FILE="/workspace/logs/production_connection_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure log directory exists
mkdir -p /workspace/logs

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     SOVEREIGN CORE MESH - PRODUCTION CONNECTION          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] $1" | tee -a "$LOG_FILE"
}

log "${YELLOW}Initializing connection to production router...${NC}"
log "Target: tcp://$PROD_HOST:$PROD_PORT"
log "Agent ID: $AGENT_ID"
log "Log file: $LOG_FILE"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    log "${RED}ERROR: Python3 is required but not installed.${NC}"
    exit 1
fi

# Create a temporary Python client script for production connection
cat << 'PYTHON_EOF' > /tmp/prod_client.py
import asyncio
import json
import sys
import hashlib
from datetime import datetime

class ProductionMeshClient:
    def __init__(self, host, port, agent_id):
        self.host = host
        self.port = port
        self.agent_id = agent_id
        self.reader = None
        self.writer = None
        self.connected = False
        self.message_count = 0
        
    async def connect(self):
        """Establish connection to production router"""
        try:
            print(f"🔄 Connecting to tcp://{self.host}:{self.port}...")
            self.reader, self.writer = await asyncio.open_connection(
                self.host, self.port
            )
            self.connected = True
            print(f"✅ TCP connection established")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {str(e)}")
            return False
    
    async def send_handshake(self):
        """Send authenticated handshake to production router"""
        if not self.connected:
            return False
            
        # Create handshake payload with SHA3-256 fingerprint
        timestamp = datetime.utcnow().isoformat()
        message_id = hashlib.sha3_256(
            f"{self.agent_id}-{timestamp}-{self.message_count}".encode()
        ).hexdigest()[:16]
        
        handshake = {
            "sender_id": self.agent_id,
            "message_id": message_id,
            "payload": {
                "action": "HANDSHAKE",
                "timestamp": timestamp,
                "agent_type": "production_client",
                "version": "1.0.0"
            }
        }
        
        try:
            message_json = json.dumps(handshake) + "\n"
            self.writer.write(message_json.encode('utf-8'))
            await self.writer.drain()
            print(f"📤 Handshake sent (ID: {message_id})")
            
            # Read response
            response_bytes = await self.reader.read(4096)
            if not response_bytes:
                print("❌ No response from server")
                return False
                
            response = json.loads(response_bytes.decode('utf-8').strip())
            print(f"📥 Server response: {json.dumps(response, indent=2)}")
            
            if response.get("status") == "ACTIVE" and response.get("synchronized"):
                print("✅ HANDSHAKE SUCCESSFUL - Agent synchronized with production mesh")
                self.message_count += 1
                return True
            else:
                print(f"❌ Handshake rejected: {response}")
                return False
                
        except Exception as e:
            print(f"❌ Handshake error: {str(e)}")
            return False
    
    async def send_telemetry(self, metrics):
        """Send telemetry data to production router"""
        if not self.connected:
            return False
            
        timestamp = datetime.utcnow().isoformat()
        message_id = hashlib.sha3_256(
            f"{self.agent_id}-{timestamp}-{self.message_count}".encode()
        ).hexdigest()[:16]
        
        telemetry = {
            "sender_id": self.agent_id,
            "message_id": message_id,
            "payload": {
                "action": "TELEMETRY",
                "timestamp": timestamp,
                "metrics": metrics
            }
        }
        
        try:
            message_json = json.dumps(telemetry) + "\n"
            self.writer.write(message_json.encode('utf-8'))
            await self.writer.drain()
            self.message_count += 1
            return True
        except Exception as e:
            print(f"❌ Telemetry error: {str(e)}")
            return False
    
    async def listen_for_commands(self, duration=30):
        """Listen for commands from the router"""
        print(f"👂 Listening for commands from production mesh ({duration}s)...")
        start_time = asyncio.get_event_loop().time()
        
        try:
            while asyncio.get_event_loop().time() - start_time < duration:
                data = await self.reader.read(4096)
                if not data:
                    print("⚠️ Connection closed by server")
                    break
                    
                message = data.decode('utf-8').strip()
                if message:
                    print(f"📩 Command received: {message}")
                    
                await asyncio.sleep(0.5)
                
        except asyncio.TimeoutError:
            print("⏰ Listen timeout reached")
        except Exception as e:
            print(f"❌ Listen error: {str(e)}")
    
    async def close(self):
        """Gracefully close connection"""
        if self.writer:
            self.writer.close()
            await self.writer.wait_closed()
        self.connected = False
        print("🔌 Connection closed")

async def main():
    if len(sys.argv) < 4:
        print("Usage: python prod_client.py <host> <port> <agent_id>")
        sys.exit(1)
    
    host = sys.argv[1]
    port = int(sys.argv[2])
    agent_id = sys.argv[3]
    
    client = ProductionMeshClient(host, port, agent_id)
    
    # Connect to production router
    if not await client.connect():
        sys.exit(1)
    
    # Perform handshake
    if not await client.send_handshake():
        await client.close()
        sys.exit(1)
    
    # Send initial telemetry
    telemetry_data = {
        "cpu_usage": 0.0,
        "memory_usage": 0.0,
        "active_tasks": 0,
        "network_latency_ms": 0,
        "status": "READY"
    }
    await client.send_telemetry(telemetry_data)
    
    # Listen for commands
    await client.listen_for_commands(duration=30)
    
    # Close connection
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
PYTHON_EOF

echo ""
log "${GREEN}Starting production connection sequence...${NC}"
echo ""

# Execute the Python client
python3 /tmp/prod_client.py "$PROD_HOST" "$PROD_PORT" "$AGENT_ID"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    log "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    log "${GREEN}║     PRODUCTION CONNECTION SUCCESSFUL                      ║${NC}"
    log "${GREEN}║     Agent $AGENT_ID is now part of the sovereign mesh    ║${NC}"
    log "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
else
    log "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    log "${RED}║     PRODUCTION CONNECTION FAILED                          ║${NC}"
    log "${RED}║     Check logs at: $LOG_FILE                             ║${NC}"
    log "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
fi

log "Session log saved to: $LOG_FILE"

# Cleanup
rm -f /tmp/prod_client.py

exit $EXIT_CODE
