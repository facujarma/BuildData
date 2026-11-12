FROM oven/bun:1.3.12

ENV TZ=America/Argentina/Buenos_Aires \
    NODE_ENV=production

WORKDIR /app

COPY package.json ./
# --production: TypeScript y @types solo hacen falta en desarrollo (el runtime es Bun)
RUN bun install --production

COPY . .

# Las transcripciones de audio escriben temporales acá (transcription.service.ts)
RUN mkdir -p /app/tmp

# Un solo proceso: dos instancias con el mismo auth state se pisan (error 440)
CMD ["bun", "src/index.ts"]
