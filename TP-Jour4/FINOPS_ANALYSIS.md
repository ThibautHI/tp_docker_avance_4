# 💰 FinOps & Optimisation - Ferme Solaire

## 📊 1. Analyse des Coûts Actuels

### Ressources Allouées (Requests vs Limits)

| Composant | Requests (CPU / RAM) | Limits (CPU / RAM) | Coût Est. Mensuel* |
|-----------|----------------------|--------------------|--------------------|
| **Solar Simulator** | 100m / 128Mi | 500m / 512Mi | ~4€ |
| **Prometheus** | 500m / 512Mi | 1000m / 2Gi | ~15€ |
| **Grafana** | 100m / 128Mi | 200m / 256Mi | ~4€ |
| **Total** | **0.7 vCPU / 0.8 Gi** | **1.7 vCPU / 2.8 Gi** | **~23€ / mois** |

*\*Basé sur VM moyenne gamme (2vCPU, 4GB) à ~40€/mois.*

### Gaspillage Identifié
- **Prometheus** a des limites très hautes (2Gi) pour un petit dataset.
- **Solar Simulator** est sur-provisionné en CPU limit (500m) pour une app Node.js simple.
- **Pas d'autoscaling** : Les ressources sont réservées 24/7 même la nuit (quand le solaire ne produit pas !).

---

## 🚀 2. Trois Optimisations Proposées

### ✅ Optimisation 1 : Horizontal Pod Autoscaler (HPA)

**Problème** : Le simulateur tourne à plein régime même quand la demande est faible.
**Solution** : Implémenter HPA basé sur l'utilisation CPU.
**Gain** : Réduction du nombre de replicas en période creuse.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: solar-simulator-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: solar-simulator
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### ✅ Optimisation 2 : Downscaling Nocturne (KEDA / Cron)

**Problème** : Une ferme solaire ne produit rien la nuit. Monitorer "rien" coûte de l'argent.
**Solution** : Scaler le simulateur à 0 replicas la nuit (ex: 22h-06h).
**Gain** : **33% d'économie immédiate** (8h/24h).

Commandes (avec CronJob ou KEDA) :
```bash
# Exemple CronJob K8s pour scaler down
kubectl scale deployment solar-simulator --replicas=0
```

### ✅ Optimisation 3 : Rétention Prometheus Ajustée

**Problème** : Stocker des métriques haute fréquence (scraping 5s) sur 15 jours prend beaucoup de disque.
**Solution** :
1. Augmenter l'intervalle de scrape à 30s (suffisant pour du solaire).
2. Réduire la rétention à 7 jours pour les données brutes, et utiliser des "Recording Rules" pour agréger les historiques longs.
**Gain** : Réduction stockage disque **divisé par 6**.

---

## 📉 Impact Financier Projeté

| Optimisation | Économie Estimée | Nouveau Coût Mensuel |
|--------------|------------------|----------------------|
| **État Actuel** | - | **23€** |
| HPA | ~10% | 20.7€ |
| Downscaling Nuit | ~30% | 16.1€ |
| Scraping 30s | (Stockage) | (Moins de PV disk) |
| **Total Optimisé** | **~40%** | **~14€ / mois** |

---

> [!TIP]
> **Action Immédiate** : Appliquer les limites de ressources plus strictes sur Prometheus pour éviter qu'il ne sature un node entier en cas de pic.
