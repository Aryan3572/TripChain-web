FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy contract sources, configs, and scripts
COPY . .

# Pre-compile contracts
RUN npx hardhat compile

# Expose Hardhat EVM RPC port
EXPOSE 8545

# Launch Hardhat Node bound to all network interfaces for container connectivity
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
