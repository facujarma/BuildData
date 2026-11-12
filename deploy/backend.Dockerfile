# Backend (Express + Postgres/Supabase).
#
# OJO: el contexto de build es la RAÍZ del repo, no apps/Backend. El Backend no tiene
# package.json propio (sus dependencias viven en el package.json de la raíz), así que
# se instala desde ahí y se copia solo la carpeta apps/Backend.
# Lo arma docker-compose.yml con: context: . / dockerfile: deploy/backend.Dockerfile

FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    TZ=America/Argentina/Buenos_Aires

WORKDIR /app

COPY package.json ./

# --omit=optional evita las dependencias binarias del Frontend (tailwind/lightningcss),
# que no se usan acá y agrandan la imagen.
RUN npm install --omit=dev --omit=optional --no-audit --no-fund \
    && npm cache clean --force

COPY apps/Backend ./apps/Backend

# La app no escribe en disco: corre con el usuario sin privilegios de la imagen oficial
USER node

EXPOSE 3001

CMD ["node", "apps/Backend/server.js"]
