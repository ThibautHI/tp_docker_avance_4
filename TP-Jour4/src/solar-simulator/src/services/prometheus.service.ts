import { Registry, Gauge, Counter } from 'prom-client';
import { FarmMetrics } from '../types/solar.types';

/**
 * Service for exposing Prometheus metrics
 */
export class PrometheusService {
    private registry: Registry;

    // Gauge metrics (current values)
    private powerProductionGauge: Gauge<string>;
    private irradianceGauge: Gauge<string>;
    private panelTempGauge: Gauge<string>;
    private ambientTempGauge: Gauge<string>;
    private efficiencyGauge: Gauge<string>;
    private inverterStatusGauge: Gauge<string>;

    // Counter metrics (cumulative values)
    private totalEnergyCounter: Counter<string>;
    private totalRevenueCounter: Counter<string>;
    private anomalyCounter: Counter<string>;

    constructor() {
        this.registry = new Registry();

        // Initialize Gauge metrics
        this.powerProductionGauge = new Gauge({
            name: 'solar_power_production_kw',
            help: 'Current power production in kilowatts',
            labelNames: ['farm'],
            registers: [this.registry],
        });

        this.irradianceGauge = new Gauge({
            name: 'solar_irradiance_wm2',
            help: 'Solar irradiance in watts per square meter',
            labelNames: ['farm'],
            registers: [this.registry],
        });

        this.panelTempGauge = new Gauge({
            name: 'solar_panel_temperature_celsius',
            help: 'Solar panel temperature in Celsius',
            labelNames: ['farm'],
            registers: [this.registry],
        });

        this.ambientTempGauge = new Gauge({
            name: 'solar_ambient_temperature_celsius',
            help: 'Ambient temperature in Celsius',
            labelNames: ['farm'],
            registers: [this.registry],
        });

        this.efficiencyGauge = new Gauge({
            name: 'solar_efficiency_percent',
            help: 'Solar farm efficiency percentage',
            labelNames: ['farm'],
            registers: [this.registry],
        });

        this.inverterStatusGauge = new Gauge({
            name: 'solar_inverter_status',
            help: 'Inverter status (0=down, 1=up)',
            labelNames: ['farm', 'inverter'],
            registers: [this.registry],
        });

        // Initialize Counter metrics
        this.totalEnergyCounter = new Counter({
            name: 'solar_total_energy_kwh',
            help: 'Total energy produced in kilowatt-hours',
            labelNames: ['farm'],
            registers: [this.registry],
        });

        this.totalRevenueCounter = new Counter({
            name: 'solar_total_revenue_eur',
            help: 'Total revenue in euros',
            labelNames: ['farm'],
            registers: [this.registry],
        });

        this.anomalyCounter = new Counter({
            name: 'solar_anomaly_count',
            help: 'Count of anomalies by type',
            labelNames: ['farm', 'type'],
            registers: [this.registry],
        });

        // Set default metrics
        this.registry.setDefaultLabels({
            app: 'solar-simulator',
        });
    }

    /**
     * Update all metrics for a farm
     * @param metrics - Farm metrics to update
     */
    updateMetrics(metrics: FarmMetrics): void {
        const { farmName } = metrics;

        // Update gauge metrics
        this.powerProductionGauge.set({ farm: farmName }, metrics.currentPowerKw);
        this.irradianceGauge.set({ farm: farmName }, metrics.currentIrradianceWm2);
        this.panelTempGauge.set({ farm: farmName }, metrics.currentPanelTempC);
        this.ambientTempGauge.set({ farm: farmName }, metrics.currentAmbientTempC);
        this.efficiencyGauge.set({ farm: farmName }, metrics.currentEfficiencyPercent);

        // Update inverter status
        metrics.inverterStatus.forEach((status, index) => {
            this.inverterStatusGauge.set(
                { farm: farmName, inverter: `inverter_${index + 1}` },
                status
            );
        });

        // Reset and update counters (counters should only increment, so we reset to set absolute values)
        // Note: In a real scenario, counters would only increment. Here we're simulating.
        this.totalEnergyCounter.reset();
        this.totalRevenueCounter.reset();
        this.anomalyCounter.reset();

        this.totalEnergyCounter.inc({ farm: farmName }, metrics.totalEnergyKwh);
        this.totalRevenueCounter.inc({ farm: farmName }, metrics.totalRevenueEur);

        // Update anomaly counts
        Object.entries(metrics.anomalyCounts).forEach(([type, count]) => {
            if (count > 0 && type !== 'NORMAL') {
                this.anomalyCounter.inc({ farm: farmName, type }, count);
            }
        });
    }

    /**
     * Get metrics in Prometheus text format
     * @returns Promise resolving to metrics string
     */
    async getMetrics(): Promise<string> {
        return this.registry.metrics();
    }

    /**
     * Get the registry instance
     * @returns Prometheus registry
     */
    getRegistry(): Registry {
        return this.registry;
    }

    /**
     * Clear all metrics
     */
    clearMetrics(): void {
        this.registry.clear();
    }
}
