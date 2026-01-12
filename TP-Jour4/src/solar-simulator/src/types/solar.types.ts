/**
 * TypeScript type definitions for Solar Farm Monitoring System
 */

/**
 * Structure of a single row from the CSV data
 */
export interface SolarDataRow {
    timestamp: Date;
    farm_name: string;
    hour: number;
    day_of_year: number;
    irradiance_wm2: number;
    ambient_temp_c: number;
    panel_temp_c: number;
    theoretical_power_kw: number;
    power_production_kw: number;
    efficiency_percent: number;
    inverter_1_status: number;
    inverter_2_status: number;
    inverter_3_status: number;
    inverter_4_status: number;
    daily_revenue_eur: number;
    anomaly_type: AnomalyType;
    anomaly_severity: AnomalySeverity;
}

/**
 * Types of anomalies that can occur
 */
export type AnomalyType =
    | 'NORMAL'
    | 'OVERHEAT'
    | 'INVERTER_DOWN'
    | 'DEGRADATION'
    | 'SHADING'
    | 'SENSOR_FAIL';

/**
 * Severity levels for anomalies
 */
export type AnomalySeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Aggregated metrics for a solar farm
 */
export interface FarmMetrics {
    farmName: string;
    currentPowerKw: number;
    currentIrradianceWm2: number;
    currentPanelTempC: number;
    currentAmbientTempC: number;
    currentEfficiencyPercent: number;
    totalEnergyKwh: number;
    totalRevenueEur: number;
    anomalyCounts: Record<AnomalyType, number>;
    inverterStatus: number[];
}

/**
 * Configuration for the solar farm
 */
export interface FarmConfig {
    name: string;
    panels: number;
    capacity_mw: number;
    inverters: number;
    location: string;
}

/**
 * Application configuration
 */
export interface AppConfig {
    port: number;
    dataPath: string;
    updateIntervalMs: number;
    logLevel: string;
    nodeEnv: string;
}

/**
 * Farm names type
 */
export type FarmName = 'provence' | 'occitanie' | 'aquitaine';
