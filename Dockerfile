# Use the latest official Node.js image
FROM node:latest AS build

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json (or yarn.lock) to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files to the container
COPY . .

# Build the Next.js app
RUN npm run build

# Start a new stage from the latest Node.js image
FROM node:latest AS runtime

# Set the working directory in the container
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

# Install only production dependencies
RUN npm install --production

# Expose the port your Next.js app will run on
EXPOSE 3000

# Start the Next.js app in production mode
CMD ["npm", "start"]