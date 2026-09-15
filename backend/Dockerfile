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

# Start the server
CMD ["npm", "start"]
