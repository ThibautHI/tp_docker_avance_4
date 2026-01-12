# 💰 Rapport FinOps - Analyse et Optimisation

## 1. Audit des Ressources Actuelles

Voici l'état des lieux des ressources consommées par le cluster de monitoring :

| Service | CPU (Request / Limit) | RAM (Request / Limit) | Statut |
|---------|----------------------|----------------------|--------|
| **Solar Simulator** | 100m / 200m | 128Mi / 256Mi | ✅ Optimisé |
| **Grafana** | 100m / 200m | 128Mi / 256Mi | ✅ Optimisé |
| **Prometheus** | **Non défini** | **Non défini** | ❌ **CRITIQUE** |

> [!WARNING]
> **Risque Financier & Stabilité** : Le déploiement Prometheus n'a aucune limite de ressources définie. En cas de pic de charge ou de fuite mémoire, il peut consommer toute la capacité du noeud, impactant les autres services (Noise Neighbor) et augmentant potentiellement la facture sur un cluster avec auto-scaling activé.

## 2. Estimation des Coûts Mensuels

*Base de calcul (estimative Cloud Provider standard - type AWS/GCP)* :
- **vCPU** : ~25€ / mois
- **RAM** : ~4€ / GB / mois
- **Stockage PVC** : ~0.10€ / GB / mois

### Coût Actuel (Estimation)

1.  **Solar Simulator** :
    - 0.2 vCPU = 5€
    - 256 MiB RAM = 1€
    - **Total : ~6€ / mois**

2.  **Grafana** :
    - 0.2 vCPU = 5€
    - 256 MiB RAM = 1€
    - **Total : ~6€ / mois**

3.  **Prometheus (Projection sans limites)** :
    - Est. moy : 0.5 vCPU = 12.5€
    - Est. moy : 1 GB RAM = 4€
    - **Total : ~16.5€ / mois**

**TOTAL INFRASTRUCTURE : ~28.50€ / mois**

## 3. Stratégies d'Optimisation (FinOps)

Voici 3 propositions concrètes pour réduire la facture et sécuriser l'infrastructure.

### ✅ Optimisation 1 : Right-Sizing Prometheus (Sécurité & Coût)

Fixer des limites strictes pour Prometheus pour éviter la surconsommation, tout en garantissant son fonctionnement.

**Action recommandée** : Modifier `k8s/monitoring/prometheus/deployment.yaml`.

```yaml
resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: 500m
    memory: 1Gi
```

### ✅ Optimisation 2 : Scaling Temporel (GreenIT)

**Constat** : Il s'agit d'une ferme solaire. **La nuit (22h-06h), la production est nulle.**
Le simulateur continue de tourner pour envoyer des "zéros", ce qui consomme du CPU et du stockage inutilement.

**Action recommandée** : Mettre en place un **CronJob** ou utiliser **KEDA** pour scale-down le simulateur la nuit.
- **Gain** : 8h d'arrêt par jour = 33% d'économie sur le simulateur.
- **Économie** : ~2€ / mois sur le pod, plus économies de stockage logs/métriques.

### ✅ Optimisation 3 : Rétention des Métriques

Par défaut, Prometheus peut conserver les données jusqu'à saturation du disque. Pour un monitoring temps réel, une rétention courte suffit souvent.

**Action recommandée** : Configurer la rétention à 15 jours.
Ajouter le flag suivant au démarrage de Prometheus :
`--storage.tsdb.retention.time=15d`

**Gain** : Réduction significative de la taille du Volume (PVC), passant potentiellement de 50GB à 10GB selon le volume de métriques.
