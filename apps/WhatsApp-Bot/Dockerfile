FROM oven/bun:1.3.12

WORKDIR /app

COPY apps/WhatsApp-Bot/package.json ./
RUN bun install

COPY apps/WhatsApp-Bot/ .

CMD ["bun", "src/index.ts"]
