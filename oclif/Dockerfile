FROM node:lts-alpine

RUN mkdir -p /app
WORKDIR /app
COPY . /app

RUN npm install

CMD ["npm", "run", "migrateandtestapi"]
