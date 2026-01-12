import { MetricsCalculatorService } from '../src/services/metrics-calculator.service';
import { SolarDataRow } from '../src/types/solar.types';

describe('MetricsCalculatorService', () => {
    let service: MetricsCalculatorService;

    beforeEach(() => {
        service = new MetricsCalculatorService();
    });

    describe('calculateFarmMetrics', () => {
        it('should return empty metrics for empty data', () => {
            const metrics = service.calculateFarmMetrics('test-farm', [], 0);

            expect(metrics.farmName).toBe('test-farm');
            expect(metrics.currentPowerKw).toBe(0);
            expect(metrics.totalEnergyKwh).toBe(0);
            expect(metrics.totalRevenueEur).toBe(0);
        });

        it('should calculate metrics correctly for single data point', () => {
            const testData: SolarDataRow[] = [
                {
                    timestamp: new Date('2025-06-01T12:00:00'),
                    farm_name: 'provence',
                    hour: 12,
                    day_of_year: 152,
                    irradiance_wm2: 950.0,
                    ambient_temp_c: 32.5,
                    panel_temp_c: 56.2,
                    theoretical_power_kw: 1439.92,
                    power_production_kw: 1439.92,
                    efficiency_percent: 100.0,
                    inverter_1_status: 1,
                    inverter_2_status: 1,
                    inverter_3_status: 1,
                    inverter_4_status: 1,
                    daily_revenue_eur: 259.19,
                    anomaly_type: 'NORMAL',
                    anomaly_severity: 'none',
                },
            ];

            const metrics = service.calculateFarmMetrics('provence', testData, 0);

            expect(metrics.farmName).toBe('provence');
            expect(metrics.currentPowerKw).toBe(1439.92);
            expect(metrics.currentIrradianceWm2).toBe(950.0);
            expect(metrics.currentPanelTempC).toBe(56.2);
            expect(metrics.currentAmbientTempC).toBe(32.5);
            expect(metrics.currentEfficiencyPercent).toBe(100.0);
            expect(metrics.totalEnergyKwh).toBe(1439.92);
            expect(metrics.totalRevenueEur).toBe(259.19);
            expect(metrics.inverterStatus).toEqual([1, 1, 1, 1]);
            expect(metrics.anomalyCounts.NORMAL).toBe(1);
        });

        it('should detect anomalies correctly', () => {
            const testData: SolarDataRow[] = [
                {
                    timestamp: new Date('2025-06-15T13:00:00'),
                    farm_name: 'provence',
                    hour: 13,
                    day_of_year: 166,
                    irradiance_wm2: 1014.6,
                    ambient_temp_c: 33.3,
                    panel_temp_c: 72.0, // Overheat
                    theoretical_power_kw: 1521.62,
                    power_production_kw: 1339.02, // Reduced due to overheat
                    efficiency_percent: 88.0,
                    inverter_1_status: 1,
                    inverter_2_status: 1,
                    inverter_3_status: 1,
                    inverter_4_status: 1,
                    daily_revenue_eur: 241.02,
                    anomaly_type: 'OVERHEAT',
                    anomaly_severity: 'high',
                },
            ];

            const metrics = service.calculateFarmMetrics('provence', testData, 0);

            expect(metrics.anomalyCounts.OVERHEAT).toBe(1);
            expect(metrics.anomalyCounts.NORMAL).toBe(0);
            expect(metrics.currentEfficiencyPercent).toBe(88.0);
        });

        it('should handle multiple data points and calculate totals', () => {
            const testData: SolarDataRow[] = [
                {
                    timestamp: new Date('2025-06-01T07:00:00'),
                    farm_name: 'provence',
                    hour: 7,
                    day_of_year: 152,
                    irradiance_wm2: 238.9,
                    ambient_temp_c: 26.3,
                    panel_temp_c: 32.3,
                    theoretical_power_kw: 395.7,
                    power_production_kw: 395.7,
                    efficiency_percent: 100.0,
                    inverter_1_status: 1,
                    inverter_2_status: 1,
                    inverter_3_status: 1,
                    inverter_4_status: 1,
                    daily_revenue_eur: 71.23,
                    anomaly_type: 'NORMAL',
                    anomaly_severity: 'none',
                },
                {
                    timestamp: new Date('2025-06-01T08:00:00'),
                    farm_name: 'provence',
                    hour: 8,
                    day_of_year: 152,
                    irradiance_wm2: 428.8,
                    ambient_temp_c: 28.9,
                    panel_temp_c: 39.6,
                    theoretical_power_kw: 691.69,
                    power_production_kw: 691.69,
                    efficiency_percent: 100.0,
                    inverter_1_status: 1,
                    inverter_2_status: 1,
                    inverter_3_status: 1,
                    inverter_4_status: 1,
                    daily_revenue_eur: 195.73,
                    anomaly_type: 'NORMAL',
                    anomaly_severity: 'none',
                },
            ];

            const metrics = service.calculateFarmMetrics('provence', testData, 1);

            expect(metrics.currentPowerKw).toBe(691.69);
            expect(metrics.totalEnergyKwh).toBe(395.7 + 691.69);
            expect(metrics.totalRevenueEur).toBe(195.73); // Latest daily revenue
            expect(metrics.anomalyCounts.NORMAL).toBe(2);
        });
    });

    describe('calculateAverageEfficiency', () => {
        it('should return 0 for empty data', () => {
            const avgEfficiency = service.calculateAverageEfficiency([]);
            expect(avgEfficiency).toBe(0);
        });

        it('should calculate average efficiency correctly', () => {
            const testData: SolarDataRow[] = [
                { efficiency_percent: 100.0 } as SolarDataRow,
                { efficiency_percent: 95.0 } as SolarDataRow,
                { efficiency_percent: 90.0 } as SolarDataRow,
            ];

            const avgEfficiency = service.calculateAverageEfficiency(testData);
            expect(avgEfficiency).toBeCloseTo(95.0, 1);
        });
    });

    describe('calculatePerformanceRatio', () => {
        it('should return 0 for empty data', () => {
            const pr = service.calculatePerformanceRatio([]);
            expect(pr).toBe(0);
        });

        it('should return 0 when theoretical power is 0', () => {
            const testData: SolarDataRow[] = [
                {
                    power_production_kw: 100,
                    theoretical_power_kw: 0,
                } as SolarDataRow,
            ];

            const pr = service.calculatePerformanceRatio(testData);
            expect(pr).toBe(0);
        });

        it('should calculate performance ratio correctly', () => {
            const testData: SolarDataRow[] = [
                {
                    power_production_kw: 900,
                    theoretical_power_kw: 1000,
                } as SolarDataRow,
                {
                    power_production_kw: 850,
                    theoretical_power_kw: 1000,
                } as SolarDataRow,
            ];

            const pr = service.calculatePerformanceRatio(testData);
            // (900 + 850) / (1000 + 1000) * 100 = 87.5%
            expect(pr).toBeCloseTo(87.5, 1);
        });
    });
});
