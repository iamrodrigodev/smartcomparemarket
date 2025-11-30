# 🐳 Docker - SmartCompareMarket

## Inicio Rápido

```bash
docker-compose up -d
```

Eso es todo! Los servicios estarán disponibles en:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **GraphDB**: http://localhost:7200

## ⚙️ Configuración Inicial de GraphDB

**Solo la primera vez**, después de iniciar los contenedores:

1. Abre http://localhost:7200
2. Ve a **Setup** → **Repositories** → **Create new repository**
3. Configura:
   - Repository ID: `smartcomparemarket`
   - Ruleset: `OWL2-RL (Optimized)`
4. Clic en **Create**
5. Ve a **Import** → **Upload RDF files**
6. Sube `ontologies/SmartCompareMarket.owl`
7. Clic en **Import**

## 📝 Comandos Útiles

```bash
# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down

# Reiniciar un servicio
docker-compose restart backend

# Ver estado
docker-compose ps
```

## 🔧 Troubleshooting

### Backend no se conecta a GraphDB

Asegúrate de haber creado el repositorio `smartcomparemarket` en GraphDB (ver arriba).

### Puerto ya en uso

Edita `docker-compose.yml` y cambia el puerto:

```yaml
ports:
  - "NUEVO_PUERTO:PUERTO_INTERNO"
```

---

**¡Listo!** Con `docker-compose up -d` tienes todo funcionando.
