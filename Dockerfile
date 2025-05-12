FROM node:18-alpine
# 2. Directorio de trabajo
WORKDIR /usr/src/app
# 3. Copiar archivos de dependencias e instalar (aprovechando caché)
COPY package*.json ./
# Usar 'ci' para instalaciones limpias basadas en package-lock.json
RUN npm ci --only=production
# 4. Copiar el resto del código fuente
COPY /src .
# 5. Exponer el puerto de la API
EXPOSE 3000
# 6. Comando para iniciar la aplicación
# Usamos 'node server.js' directamente
CMD [ "node", "server.js" ]