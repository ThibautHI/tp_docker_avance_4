import { SolarDataRow, FarmMetrics, AnomalyType } from '../types/solar.types';

/**
 * Service for calculating metrics from solar data
 */
export class MetricsCalculatorService {
    /**
     * Calculate aggregated metrics for a farm from its data
     * @param farmName - Name of the farm
     * @param data - Array of solar data rows
     * @param currentIndex - Current index in the data array for simulation
     * @returns Calculated farm metrics
     */
    calculateFarmMetrics(
        farmName: string,
        data: SolarDataRow[],
        currentIndex: number = 0
    ): FarmMetrics {
        if (data.length === 0) {
            return this.getEmptyMetrics(farmName);
        }

        // Get current reading (circular to simulate continuous operation)
        const index = currentIndex % data.length;
        const currentRow = data[index];

        // Calculate total energy and revenue from all data up to current point
        const dataUpToNow = data.slice(0, index + 1);
        const totalEnergyKwh = this.calculateTotalEnergy(dataUpToNow);
        const totalRevenueEur = this.calculateTotalRevenue(dataUpToNow);

        // Count anomalies
        const anomalyCounts = this.countAnomalies(dataUpToNow);

        // Get inverter status
        const inverterStatus = [
            currentRow.inverter_1_status,
            currentRow.inverter_2_status,
            currentRow.inverter_3_status,
            currentRow.inverter_4_status,
        ];

        return {
            farmName,
            currentPowerKw: currentRow.power_production_kw,
            currentIrradianceWm2: currentRow.irradiance_wm2,
            currentPanelTempC: currentRow.panel_temp_c,
            currentAmbientTempC: currentRow.ambient_temp_c,
            currentEfficiencyPercent: currentRow.efficiency_percent,
            totalEnergyKwh,
            totalRevenueEur,
            anomalyCounts,
            inverterStatus,
        };
    }

    /**
     * Calculate total energy produced (kWh)
     * @param data - Array of solar data rows
     * @returns Total energy in kWh
     */
    private calculateTotalEnergy(data: SolarDataRow[]): number {
        return data.reduce((total, row) => {
            // Each row represents 1 hour of production
            return total + row.power_production_kw;
        }, 0);
    }

    /**
     * Calculate total revenue (EUR)
     * @param data - Array of solar data rows
     * @returns Total revenue in EUR
     */
    private calculateTotalRevenue(data: SolarDataRow[]): number {
        // Get the latest daily_revenue_eur which is cumulative
        if (data.length === 0) return 0;

        // Sum all daily revenues (taking max per day to avoid duplicates)
        const dailyRevenues = new Map<number, number>();
        data.forEach(row => {
            const day = row.day_of_year;
            const currentMax = dailyRevenues.get(day) || 0;
            dailyRevenues.set(day, Math.max(currentMax, row.daily_revenue_eur));
        });

        return Array.from(dailyRevenues.values()).reduce((sum, rev) => sum + rev, 0);
    }

    /**
     * Count anomalies by type
     * @param data - Array of solar data rows
     * @returns Map of anomaly counts
     */
    private countAnomalies(data: SolarDataRow[]): Record<AnomalyType, number> {
        const counts: Record<AnomalyType, number> = {
            NORMAL: 0,
            OVERHEAT: 0,
            INVERTER_DOWN: 0,
            DEGRADATION: 0,
            SHADING: 0,
            SENSOR_FAIL: 0,
        };

        data.forEach((row) => {
            if (row.anomaly_type in counts) {
                counts[row.anomaly_type]++;
            }
        });

        return counts;
    }

    /**
     * Calculate average efficiency
     * @param data - Array of solar data rows
     * @returns Average efficiency percentage
     */
    calculateAverageEfficiency(data: SolarDataRow[]): number {
        if (data.length === 0) return 0;

        const totalEfficiency = data.reduce(
            (sum, row) => sum + row.efficiency_percent,
            0
        );
        return totalEfficiency / data.length;
    }

    /**
     * Calculate performance ratio (actual vs theoretical)
     * @param data - Array of solar data rows
     * @returns Performance ratio as percentage
     */
    calculatePerformanceRatio(data: SolarDataRow[]): number {
        const totalActual = data.reduce(
            (sum, row) => sum + row.power_production_kw,
            0
        );
        const totalTheoretical = data.reduce(
            (sum, row) => sum + row.theoretical_power_kw,
            0
        );

        if (totalTheoretical === 0) return 0;
        return (totalActual / totalTheoretical) * 100;
    }

    /**
     * Get empty metrics for initialization
     * @param farmName - Name of the farm
     * @returns Empty metrics object
     */
    private getEmptyMetrics(farmName: string): FarmMetrics {
        return {
            farmName,
            currentPowerKw: 0,
            currentIrradianceWm2: 0,
            currentPanelTempC: 0,
            currentAmbientTempC: 0,
            currentEfficiencyPercent: 0,
            totalEnergyKwh: 0,
            totalRevenueEur: 0,
            anomalyCounts: {
                NORMAL: 0,
                OVERHEAT: 0,
                INVERTER_DOWN: 0,
                DEGRADATION: 0,
                SHADING: 0,
                SENSOR_FAIL: 0,
            },
            inverterStatus: [0, 0, 0, 0],
        };
    }
}
