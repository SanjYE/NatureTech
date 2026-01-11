# Use Node 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Install a simple server to serve static files
RUN npm install -g serve

# Expose port
EXPOSE 5173

# Start command
CMD ["serve", "-s", "dist", "-l", "5173"]
