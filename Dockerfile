FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Fail early with a clear message if source files were omitted from the build context.
RUN test -f /app/src/main.jsx && test -f /app/src/style.css
RUN npm run build
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["npm", "start"]
