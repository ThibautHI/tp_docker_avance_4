# Solar Farm Simulator 🌞

Simulateur de surveillance de fermes solaires photovoltaïques avec exposition de métriques Prometheus pour monitoring temps réel.

## 📋 Description

Ce simulateur Node.js/TypeScript lit les données de production de 3 fermes solaires françaises (Provence, Occitanie, Aquitaine) et expose des métriques au format Prometheus pour le monitoring GitOps avec ArgoCD, Prometheus et Grafana.

## 🚀 Démarrage Rapide

### Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- Données CSV dans le répertoire `../../data/`

### Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Démarrer en mode développement
npm run dev
```

### Build Production

```bash
# Compiler TypeScript
npm run build

# Démarrer en production
npm start
```

## 🐳 Docker

### Build de l'image

```bash
docker build -t solar-simulator:latest .
```

### Exécution

```bash
# Avec les données locales
docker run -p 3000:3000 \
  -v $(pwd)/../../data:/data \
  -e DATA_PATH=/data \
  solar-simulator:latest
```

## 📊 Endpoints

### `/metrics` - Métriques Prometheus
Retourne toutes les métriques au format Prometheus.

**Exemple:**
```bash
curl http://localhost:3000/metrics
```

### `/health` - Health Check
Endpoint pour les probes de liveness Kubernetes.

**Exemple:**
```bash
curl http://localhost:3000/health
```

**Réponse:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-09T10:30:00.000Z",
  "uptime": 123.45
}
```

### `/ready` - Readiness Check
Endpoint pour les probes de readiness Kubernetes.

**Exemple:**
```bash
curl http://localhost:3000/ready
```

### `/info` - Information de Débogage
Affiche l'état actuel du simulateur.

**Exemple:**
```bash
curl http://localhost:3000/info
```

## 📈 Métriques Exposées

### Gauges (Valeurs Instantanées)

| Métrique | Description | Labels |
|----------|-------------|--------|
| `solar_power_production_kw` | Production actuelle (kW) | `farm` |
| `solar_irradiance_wm2` | Irradiance solaire (W/m²) | `farm` |
| `solar_panel_temperature_celsius` | Température panneaux (°C) | `farm` |
| `solar_ambient_temperature_celsius` | Température ambiante (°C) | `farm` |
| `solar_efficiency_percent` | Rendement (%) | `farm` |
| `solar_inverter_status` | État onduleur (0/1) | `farm`, `inverter` |

### Counters (Valeurs Cumulées)

| Métrique | Description | Labels |
|----------|-------------|--------|
| `solar_total_energy_kwh` | Énergie totale produite (kWh) | `farm` |
| `solar_total_revenue_eur` | Revenus totaux (€) | `farm` |
| `solar_anomaly_count` | Nombre d'anomalies | `farm`, `type` |

### Types d'Anomalies

- `NORMAL` : Fonctionnement normal
- `OVERHEAT` : Surchauffe des panneaux
- `INVERTER_DOWN` : Panne d'onduleur
- `DEGRADATION` : Dégradation des panneaux
- `SHADING` : Ombrage partiel
- `SENSOR_FAIL` : Défaillance de capteur

## ⚙️ Configuration

Variables d'environnement disponibles :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port HTTP du serveur | `3000` |
| `DATA_PATH` | Chemin vers les données CSV | `../../data` |
| `UPDATE_INTERVAL_MS` | Intervalle de mise à jour (ms) | `60000` |
| `LOG_LEVEL` | Niveau de log (info/debug) | `info` |
| `NODE_ENV` | Environnement (dev/prod) | `development` |

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📁 Structure du Projet

```
solar-simulator/
├── src/
│   ├── types/
│   │   └── solar.types.ts          # Définitions TypeScript
│   ├── services/
│   │   ├── csv-reader.service.ts   # Lecture CSV
│   │   ├── metrics-calculator.service.ts  # Calculs métriques
│   │   └── prometheus.service.ts   # Exposition Prometheus
│   └── server.ts                   # Serveur Express
├── tests/
│   └── metrics-calculator.service.test.ts
├── Dockerfile                      # Image Docker
├── package.json
├── tsconfig.json
└── README.md
```

## 🏗️ Architecture

Le simulateur suit une architecture en couches :

1. **CSV Reader** : Charge les données depuis les fichiers CSV
2. **Metrics Calculator** : Calcule les métriques agrégées
3. **Prometheus Service** : Expose les métriques au format Prometheus
4. **Express Server** : API HTTP avec endpoints health/ready/metrics

## 🔄 Simulation Temps Réel

Le simulateur parcourt les données historiques de manière séquentielle, avançant d'une heure à chaque intervalle de mise à jour (configurable via `UPDATE_INTERVAL_MS`). Cela simule un flux temps réel à partir des données de 30 jours.

## 📝 Exemples de Requêtes PromQL

```promql
# Production actuelle de la ferme Provence
solar_power_production_kw{farm="provence"}

# Énergie totale de toutes les fermes
sum(solar_total_energy_kwh)

# Anomalies de type OVERHEAT
solar_anomaly_count{type="OVERHEAT"}

# Rendement moyen
avg(solar_efficiency_percent)

# Onduleurs en panne
solar_inverter_status == 0
```

## 🐛 Débogage

### Logs détaillés

```bash
# Mode debug
LOG_LEVEL=debug npm run dev
```

### Vérifier les données chargées

```bash
curl http://localhost:3000/info
```

## 📄 Licence

MIT

## 👨‍💻 Auteur

YNOV Master 2 DevOps - TD4 Monitoring GitOps
