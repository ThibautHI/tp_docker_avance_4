# 📦 Livrables Phase 3 - GitOps

## ✅ Structure Créée

```
TP-Jour4/
├── src/solar-simulator/          ✅ Application Node.js/TypeScript
├── apps/solar-simulator/          ✅ Manifests K8s
│   ├── configmap.yaml
│   ├── deployment.yaml            (CPU: 100m-200m, RAM: 128Mi-256Mi)
│   ├── service.yaml
│   └── kustomization.yaml
├── monitoring/                    ✅ Stack observabilité
│   ├── prometheus/
│   │   ├── prometheus-config.yaml
│   │   └── servicemonitor.yaml   (scrape: 30s)
│   ├── grafana/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── dashboards/
│   │       └── solar-dashboard.json  (6 panneaux)
│   └── alertmanager/
│       ├── config.yaml
│       └── rules.yaml            (5 règles d'alerting)
└── argocd/                        ✅ Applications GitOps
    ├── application-solar.yaml
    └── application-monitoring.yaml
```

## 🚀 Déploiement Complet

### Étape 1 : Déployer l'app avec les manifests existants

```bash
# Build l'image
docker build -t solar-simulator:latest -f src/solar-simulator/Dockerfile src/solar-simulator

# Charger dans kind
kind load docker-image solar-simulator:latest --name solar-monitoring

# Déployer avec Kustomize
kubectl apply -k apps/solar-simulator/

# OU sans Kustomize
kubectl apply -f apps/solar-simulator/
```

### Étape 2 : Déployer les 5 règles d'alerting

```bash
# Appliquer les règles
kubectl apply -f monitoring/alertmanager/rules.yaml

# Vérifier
kubectl get prometheusrule -n monitoring
```

### Étape 3 : Déployer Grafana

```bash
# Déployer Grafana
kubectl apply -f monitoring/grafana/

# Vérifier
kubectl get pods -n monitoring | grep grafana
```

### Étape 4 : Vérifier tout fonctionne

```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090 &

# Port-forward Grafana
kubectl port-forward -n monitoring svc/grafana 3001:3000 &

# Port-forward l'app
kubectl port-forward -n solar-monitoring svc/solar-simulator 3000:3000 &
```

**URLs** :
- Prometheus : http://localhost:9090
- Grafana : http://localhost:3001 (admin/admin)
- App : http://localhost:3000/metrics

## 📊 Test des 5 Règles d'Alerting

Ouvrir http://localhost:9090/alerts

Vous devriez voir :

1. ✅ **SolarPanelOverheating** - Panneau > 65°C pendant 10 min
2. ✅ **SolarInverterDown** - Onduleur status = 0
3. ✅ **SolarLowProduction** - Production < 50% théorique
4. ✅ **SolarDataLoss** - Absence données > 5 min
5. ✅ **SolarSLOBreach** - Disponibilité < 99.5%

## 📈 Test du Dashboard Grafana

Ouvrir http://localhost:3001

1. Login : admin / admin
2. Import dashboard :
   - Dashboard → Import
   - Copier le contenu de `monitoring/grafana/dashboards/solar-dashboard.json`
   - Paste JSON
   - Import

**Le dashboard doit afficher 6 panneaux** :
1. Production par Ferme (graph)
2. Température Panneaux (graph)
3. Énergie Totale (stat)
4. Revenus Totaux (stat)
5. Rendement Moyen (gauge)
6. Anomalies par Ferme (table)

## 🎯 Pour la démo

### Script de démo rapide

```bash
#!/bin/bash

echo "=== Solar Monitoring - Démonstration ==="

# 1. Montrer l'app
echo "1. Application déployée:"
kubectl get pods -n solar-monitoring

# 2. Métriques
echo -e "\n2. Métriques exposées:"
curl -s http://localhost:3000/metrics | grep solar_ | head -10

# 3. Prometheus targets
echo -e "\n3. Prometheus scraping:"
echo "Ouvrir http://localhost:9090/targets"
echo "Target 'solar-simulator' doit être UP"

# 4. Alertes
echo -e "\n4. Règles d'alerting (5):"
kubectl get prometheusrule -n monitoring | grep solar
echo "Ouvrir http://localhost:9090/alerts"

# 5. Grafana
echo -e "\n5. Dashboard Grafana:"
echo "Ouvrir http://localhost:3001"
echo "Login: admin / admin"
echo "6 panneaux avec données temps réel"

echo -e "\n✅ Démonstration prête!"
```

## ✅ Checklist Livrables Phase 3

### Repository Git
- [x] Structure créée selon spec TD4
- [ ] Repository sur GitHub/GitLab
- [ ] README.md mis à jour

### Manifests Kubernetes
- [x] apps/solar-simulator/ complets
- [x] deployment.yaml avec resources (CPU: 100m-200m, RAM: 128Mi-256Mi)
- [x] service.yaml
- [x] configmap.yaml
- [x] kustomization.yaml

### Configuration Prometheus
- [x] prometheus-config.yaml
- [x] servicemonitor.yaml (scrape 30s)

### 5 Règles d'Alerting
- [x] SolarPanelOverheating (> 65°C, 10 min)
- [x] SolarInverterDown (status = 0)
- [x] SolarLowProduction (< 50% théorique)
- [x] SolarDataLoss (absence > 5 min)
- [x] SolarSLOBreach (< 99.5% dispo)

### Grafana
- [x] Dashboard avec 6 panneaux
- [x] Datasource Prometheus configuré

### ArgoCD
- [x] application-solar.yaml
- [x] application-monitoring.yaml

## 🎓 **Phase 3 COMPLÈTE**

Tous les livrables sont créés !

Consultez `TEST_PROMETHEUS.md` pour les tests détaillés. 🚀
