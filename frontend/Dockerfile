FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar codigo de la aplicacion
COPY . .

# Exponer puerto
EXPOSE 5173

# Comando por defecto
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
