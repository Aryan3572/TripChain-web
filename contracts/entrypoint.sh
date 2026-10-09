#!/bin/sh
set -e

echo "=================================================="
echo "⚡ Starting Hardhat EVM Node on 0.0.0.0:8545..."
echo "=================================================="

# Start Hardhat node in background
npx hardhat node --hostname 0.0.0.0 &
HARDHAT_PID=$!

# Trap signals for graceful shutdown
trap 'echo "🛑 Stopping Hardhat node..."; kill -TERM "$HARDHAT_PID" 2>/dev/null; exit 0' INT TERM

# Wait for Hardhat RPC endpoint to accept JSON-RPC requests
echo "⏳ Waiting for Hardhat Node RPC to become healthy..."
MAX_ATTEMPTS=30
ATTEMPT=0
READY=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if node -e "fetch('http://127.0.0.1:8545', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',method:'net_version',params:[],id:1})}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    READY=1
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 1
done

if [ $READY -eq 1 ]; then
  echo "✅ Hardhat Node RPC is live! Deploying smart contracts to local network..."
  npx hardhat run scripts/deploy.js --network localhost || {
    echo "⚠️ Contract deployment script exited with a warning, continuing node execution..."
  }
  echo "🎉 Hardhat Node ready and serving RPC on port 8545."
else
  echo "⚠️ RPC ping timed out; proceeding with Hardhat node process..."
fi

# Keep container running and monitor Hardhat process
wait "$HARDHAT_PID"
