FROM node:18

WORKDIR /app



# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npm run prisma:generate

# Copy project files
COPY . .

# Expose backend port
EXPOSE 5000

# Built-in container health check testing /health endpoint
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=15s \
  CMD node -e "fetch('http://localhost:5000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the server
CMD ["npm", "start"]
