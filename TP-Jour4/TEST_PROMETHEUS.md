# 🧪 Guide de Test - Configuration Prometheus

## 📋 Tests à Effectuer

### 1. Test des Métriques (ServiceMonitor)

```bash
# Démarrer port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Ouvrir http://localhost:9090
```

**Dans Prometheus UI :**

#### Vérifier les Targets
1. Aller dans **Status** → **Targets**
2. Chercher `solar-simulator`
3. ✅ Status doit être **UP**

#### Tester les Métriques
Dans **Graph**, tester ces requêtes :

```promql
# 1. Production actuelle
solar_power_production_kw

# 2. Par ferme
solar_power_production_kw{farm="provence"}

# 3. Total toutes fermes
sum(solar_power_production_kw)

# 4. Température
solar_panel_temperature_celsius

# 5. Anomalies
solar_anomaly_count

# 6. Rendement
solar_efficiency_percent
```

✅ **Résultat attendu** : Toutes les requêtes retournent des données

---

### 2. Test des Règles d'Alerting

```bash
# Vérifier que les règles sont chargées
kubectl get prometheusrule -n monitoring

# Devrait afficher: solar-alerts
```

**Dans Prometheus UI :**

1. Aller dans **Alerts**
2. Vous devriez voir **5 règles** :
   - ✅ SolarPanelOverheating
   - ✅ SolarInverterDown
   - ✅ SolarLowProduction
   - ✅ SolarDataLoss
   - ✅ SolarSLOBreach

**États possibles** :
- 🟢 **Inactive** : Pas d'alerte (normal)
- 🟡 **Pending** : Condition vraie mais pas encore déclenchée
- 🔴 **Firing** : Alerte active

---

### 3. Test Grafana

```bash
# Port-forward Grafana
kubectl port-forward -n monitoring svc/grafana 3001:3000

# Ouvrir http://localhost:3001
# Login: admin / admin
```

**Vérifications** :

1. **Datasource Prometheus** :
   - Configuration → Data Sources
   - ✅ "Prometheus" doit être présent et actif

2. **Dashboard** :
   - Dashboards → Browse
   - ✅ "Solar Farm Monitoring Dashboard" présent
   - ✅ 6 panneaux visibles avec données

3. **Panneaux attendus** :
   - Production par Ferme (graph)
   - Température Panneaux (graph)
   - Énergie Totale (stat)
   - Revenus Totaux (stat)
   - Rendement Moyen (gauge)
   - Anomalies par Ferme (table)

---

## 🚀 Script de Test Complet

```bash
#!/bin/bash

echo "=== Test 1 : Application déployée ==="
kubectl get pods -n solar-monitoring
kubectl get svc -n solar-monitoring

echo -e "\n=== Test 2 : ServiceMonitor créé ==="
kubectl get servicemonitor -n monitoring | grep solar

echo -e "\n=== Test 3 : PrometheusRules créées ==="
kubectl get prometheusrule -n monitoring | grep solar

echo -e "\n=== Test 4 : Métriques exposées ==="
kubectl port-forward -n solar-monitoring svc/solar-simulator 3000:3000 &
PF_PID=$!
sleep 3
curl -s http://localhost:3000/metrics | grep solar_ | head -5
kill $PF_PID

echo -e "\n=== Test 5 : Grafana accessible ==="
kubectl get pods -n monitoring | grep grafana

echo -e "\n✅ Tests terminés"
echo "Pour accéder à Prometheus : kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
echo "Pour accéder à Grafana    : kubectl port-forward -n monitoring svc/grafana 3001:3000"
```

---

## 🎯 Checklist de Validation

### Configuration Prometheus

- [ ] ServiceMonitor créé dans namespace `monitoring`
- [ ] Target `solar-simulator` visible dans Prometheus
- [ ] Target status = **UP**
- [ ] Métriques `solar_*` disponibles dans Prometheus
- [ ] Scraping interval = 30s

### Règles d'Alerting

- [ ] 5 règles créées (PrometheusRule)
- [ ] Règles visibles dans Prometheus UI
- [ ] Expressions PromQL valides
- [ ] Labels `severity` présents
- [ ] Annotations `summary` et `description` présentes

### Grafana

- [ ] Grafana déployé et accessible
- [ ] Datasource Prometheus configuré
- [ ] Dashboard importé
- [ ] 6 panneaux affichent des données
- [ ] Refresh automatique fonctionne

---

## 🐛 Troubleshooting

### ServiceMonitor ne fonctionne pas

```bash
# Vérifier les labels
kubectl get svc solar-simulator -n solar-monitoring --show-labels
kubectl describe servicemonitor solar-simulator -n monitoring

# Les labels doivent correspondre !
```

### Métriques vides dans Prometheus

```bash
# Vérifier l'app expose bien les métriques
kubectl port-forward svc/solar-simulator 3000:3000 -n solar-monitoring
curl http://localhost:3000/metrics

# Vérifier les logs Prometheus
kubectl logs -n monitoring prometheus-prometheus-kube-prometheus-prometheus-0
```

### Règles d'alerting non visibles

```bash
# Vérifier le label release=prometheus
kubectl get prometheusrule solar-alerts -n monitoring -o yaml | grep -A5 labels

# Reload Prometheus si nécessaire
kubectl delete pod -n monitoring prometheus-prometheus-kube-prometheus-prometheus-0
```

### Grafana dashboard vide

```bash
# Vérifier la datasource
kubectl exec -n monitoring deployment/grafana -- wget -qO- http://localhost:3000/api/datasources

# Reimporter le dashboard manuellement depuis l'UI
```

---

## 📊 Requêtes PromQL Utiles

```promql
# Production totale
sum(solar_power_production_kw)

# Température max
max(solar_panel_temperature_celsius)

# Rendement moyen par ferme
avg(solar_efficiency_percent) by (farm)

# Nombre d'anomalies
sum(solar_anomaly_count) by (type)

# Taux de disponibilité
sum(up{job="solar-simulator"}) / count(up{job="solar-simulator"}) * 100

# Production vs théorique
(sum(solar_power_production_kw) / sum(solar_theoretical_power_kw)) * 100
```

---

## ✅ Validation Finale

Votre configuration Prometheus est OK si :

1. ✅ Target `solar-simulator` = UP
2. ✅ Toutes les métriques `solar_*` disponibles
3. ✅ 5 règles d'alerting présentes
4. ✅ Grafana affiche le dashboard avec données
5. ✅ Pas d'erreurs dans les logs Prometheus

**Félicitations ! Votre monitoring est fonctionnel** 🎉
