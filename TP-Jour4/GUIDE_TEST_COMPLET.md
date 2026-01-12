# 🧪 Guide Complet de Test - Application & Prometheus

## ✅ État Actuel

- **Pod** : solar-simulator Running ✅
- **Données** : 720 records × 3 fermes chargés ✅
- **Accès** : Port-forward vers pod fonctionnel ✅

---

## 1️⃣ Tester l'Application

### Port-Forward
```bash
# Dans un terminal
kubectl port-forward -n solar-monitoring pod/solar-simulator-6d598cf89f-s8bs7 3000:3000
```

### Tests
Dans un autre terminal :
```bash
# Health check
curl http://localhost:3000/health

# Info
curl http://localhost:3000/info

# Métriques Prometheus
curl http://localhost:3000/metrics | grep solar_
```

**Métriques attendues** :
```
solar_power_production_kw{farm="provence"} 245.8
solar_panel_temperature_celsius{farm="provence"} 42.3
solar_efficiency_percent{farm="provence"} 87.5
solar_total_energy_kwh{farm="provence"} 12543
solar_total_revenue_eur{farm="provence"} 2508.6
solar_anomaly_count{farm="provence",type="overheating"} 3
```

---

## 2️⃣ Tester Prometheus

### A. Vérifier que Prometheus scrape l'app

```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

Ouvrir **http://localhost:9090**

#### Dans Status → Targets
1. Chercher `solar-simulator` ou `serviceMonitor/monitoring/solar-simulator`
2. **Status attendu** : UP ✅
3. **Last Scrape** : doit être récent (< 30s)

### B. Tester les Requêtes PromQL

Dans Graph → Console :

```promql
# 1. Production totale toutes fermes
sum(solar_power_production_kw)

# 2. Production par ferme
solar_power_production_kw

# 3. Température moyenne
avg(solar_panel_temperature_celsius)

# 4. Rendement par ferme
solar_efficiency_percent{farm="provence"}

# 5. Anomalies
sum(solar_anomaly_count) by (type)
```

### C. Vérifier les 5 Règles d'Alerting

Menu **Alerts** → Vous devez voir :

1. ✅ **SolarPanelOverheating** - Inactive (si temp < 65°C)
2. ✅ **SolarInverterDown** - Inactive (si onduleurs UP)
3. ✅ **SolarLowProduction** - Inactive (si rendement > 50%)
4. ✅ **SolarDataLoss** - Inactive (données présentes)
5. ✅ **SolarSLOBreach** - Inactive (disponibilité > 99.5%)

**États possibles** :
- 🟢 **Inactive** : Tout va bien (normal)
- 🟡 **Pending** : Condition vraie mais pas assez longtemps
- 🔴 **Firing** : Alerte active !

---

## 3️⃣ Vérifications Techniques

### ServiceMonitor
```bash
kubectl get servicemonitor -n monitoring solar-simulator -o yaml
```

**Vérifier** :
- `interval: 30s` ✅
- `path: /metrics` ✅
- Labels correspondent au pod ✅

### PrometheusRules
```bash
kubectl get prometheusrule -n monitoring solar-alerts -o yaml
```

**Vérifier** :
- 5 rules présentes ✅
- Labels `release: prometheus` ✅

### Endpoints
```bash
kubectl get endpoints -n solar-monitoring solar-simulator
```

Si vide → problème de labels Service/Pod

---

##  4️⃣ Script de Test Complet

```bash
#!/bin/bash

echo "=== Test 1 : Pod Running ==="
kubectl get pods -n solar-monitoring

echo -e "\n=== Test 2 : ServiceMonitor ==="
kubectl get servicemonitor -n monitoring | grep solar

echo -e "\n=== Test 3 : PrometheusRule ==="
kubectl get prometheusrule -n monitoring | grep solar

echo -e "\n=== Test 4: Métriques App ==="
POD=$(kubectl get pod -n solar-monitoring -l app=solar-simulator -o name)
kubectl port-forward -n solar-monitoring $POD 3000:3000 &
PF_PID=$!
sleep 3
curl -s http://localhost:3000/metrics | grep solar_ | head -5
kill $PF_PID

echo -e "\n✅ Tests terminés"
```

---

## 5️⃣ Troubleshooting

### Métriques vides dans Prometheus
```bash
# Vérifier les logs Prometheus
kubectl logs -n monitoring prometheus-prometheus-kube-prometheus-prometheus-0

# Vérifier la config du ServiceMonitor
kubectl describe servicemonitor -n monitoring solar-simulator
```

### Target DOWN dans Prometheus
- Vérifier que le pod expose bien `/metrics`
- Vérifier les labels du Service
- Vérifier le namespace du ServiceMonitor

### Alertes pas visibles
- Vérifier le label `release: prometheus` sur la PrometheusRule
- Reload Prometheus manuellement si besoin

---

## ✅ Checklist Validation Finale

- [ ] Pod solar-simulator Running
- [ ] Métriques accessibles via curl
- [ ] Target UP dans Prometheus
- [ ] Requêtes PromQL retournent des données
- [ ] 5 règles d'alerting visibles dans Alerts
- [ ] ServiceMonitor présent dans monitoring namespace

**Tout est OK ? Votre monitoring est opérationnel !** 🎉
