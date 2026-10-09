FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy contract sources, configs, and scripts
COPY . .

# Pre-compile contracts
RUN npx hardhat compile

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Expose Hardhat EVM RPC port
EXPOSE 8545

# Health check testing JSON-RPC net_version response
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=10s \
  CMD node -e "fetch('http://localhost:8545', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',method:'net_version',params:[],id:1})}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Launch Hardhat Node with automated contract deployment
CMD ["./entrypoint.sh"]
