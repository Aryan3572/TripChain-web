FROM node:18

WORKDIR /app



# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Expose backend port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
