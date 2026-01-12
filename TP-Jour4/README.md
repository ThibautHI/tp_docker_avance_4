# Solar Monitoring Project 🌞

Projet complet de monitoring d'une ferme solaire avec architecture GitOps, Kubernetes, Prometheus et Grafana.

## 🚀 Démarrage Rapide

Le script automatique s'occupe de tout (Cluster, Build, Deploy) :

```powershell
.\start-gitops.ps1
```

## 📚 Documentation

- [Guides de Test Complet](GUIDE_TEST_COMPLET.md)
- [Architecture Détaillée](ARCHITECTURE_COMPLETE.md)
- [Analyse FinOps & Optimisation](FINOPS_ANALYSIS.md)

## 🛠️ Architecture Technique

| Composant | Technologie | Description |
|-----------|-------------|-------------|
| **Cluster** | Kind | Kubernetes local dans Docker |
| **App** | Node.js/TS | Simulateur de production solaire |
| **Data** | ConfigMap | Injection CSV (Provence, Aquitaine, Occitanie) |
| **Monitoring** | Prometheus | Collecte de métriques (intervalle 30s) |
| **Viz** | Grafana | Dashboard pré-configuré (Provisioning) |
| **Alerting** | Alertmanager | 5 Règles (Surchauffe, Panne, etc.) |

## 📊 Accès aux Services

| Service | Commande d'accès | URL | Creds |
|---------|------------------|-----|-------|
| **App** | `kubectl port-forward -n solar-monitoring svc/solar-simulator 3000:3000` | http://localhost:3000 | - |
| **Prometheus** | `kubectl port-forward -n monitoring svc/prometheus 9090:9090` | http://localhost:9090 | - |
| **Grafana** | `kubectl port-forward -n monitoring svc/grafana 3001:3000` | http://localhost:3001 | admin/admin |

## ✅ Fonctionnalités

- [x] Simulation réaliste basée sur des données CSV
- [x] Exposition métriques Prometheus (`/metrics`)
- [x] Dashboard Grafana automatique ("Solar Farm Monitoring")
- [x] Alerting Rules configurées
- [x] Analyse de coûts (FinOps)

---
*Projet réalisé dans le cadre du TD4 - Master 2 ynov*