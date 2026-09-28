FROM oven/bun:1.3.12

ENV TZ=America/Argentina/Buenos_Aires

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

CMD ["bun", "src/index.ts"]
