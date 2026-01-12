import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

import { SolarDataRow, FarmName } from '../types/solar.types';

/**
 * Service for reading and parsing CSV data files
 */
export class CsvReaderService {
    private dataPath: string;

    constructor(dataPath: string) {
        this.dataPath = dataPath;
    }

    /**
     * Load solar data for a specific farm from CSV file
     * @param farmName - Name of the farm (provence, occitanie, aquitaine)
     * @returns Promise resolving to array of solar data rows
     */
    async loadFarmData(farmName: FarmName): Promise<SolarDataRow[]> {
        const filePath = path.join(this.dataPath, `${farmName}_data.csv`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`CSV file not found: ${filePath}`);
        }

        return new Promise((resolve, reject) => {
            const data: SolarDataRow[] = [];

            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', (row: any) => {
                    try {
                        const parsedRow = this.parseRow(row);
                        data.push(parsedRow);
                    } catch (error) {
                        console.warn(`Warning: Failed to parse row:`, error);
                    }
                })
                .on('end', () => {
                    console.log(`✅ Loaded ${data.length} records for ${farmName}`);
                    resolve(data);
                })
                .on('error', (error) => {
                    reject(new Error(`Failed to read CSV file ${filePath}: ${error.message}`));
                });
        });
    }

    /**
     * Parse a CSV row into a SolarDataRow object
     * @param row - Raw CSV row object
     * @returns Parsed SolarDataRow
     */
    private parseRow(row: any): SolarDataRow {
        return {
            timestamp: new Date(row.timestamp),
            farm_name: row.farm_name,
            hour: parseInt(row.hour, 10),
            day_of_year: parseInt(row.day_of_year, 10),
            irradiance_wm2: this.parseFloat(row.irradiance_wm2),
            ambient_temp_c: this.parseFloat(row.ambient_temp_c),
            panel_temp_c: this.parseFloat(row.panel_temp_c),
            theoretical_power_kw: this.parseFloat(row.theoretical_power_kw),
            power_production_kw: this.parseFloat(row.power_production_kw),
            efficiency_percent: this.parseFloat(row.efficiency_percent),
            inverter_1_status: parseInt(row.inverter_1_status, 10),
            inverter_2_status: parseInt(row.inverter_2_status, 10),
            inverter_3_status: parseInt(row.inverter_3_status, 10),
            inverter_4_status: parseInt(row.inverter_4_status, 10),
            daily_revenue_eur: this.parseFloat(row.daily_revenue_eur),
            anomaly_type: row.anomaly_type,
            anomaly_severity: row.anomaly_severity,
        };
    }

    /**
     * Safely parse float values, handling NaN and empty values
     * @param value - String value to parse
     * @returns Parsed float or 0 if invalid
     */
    private parseFloat(value: string): number {
        if (!value || value.trim() === '') {
            return 0;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Load data for all farms
     * @returns Promise resolving to map of farm data
     */
    async loadAllFarms(): Promise<Map<FarmName, SolarDataRow[]>> {
        const farms: FarmName[] = ['provence', 'occitanie', 'aquitaine'];
        const farmData = new Map<FarmName, SolarDataRow[]>();

        for (const farm of farms) {
            try {
                const data = await this.loadFarmData(farm);
                farmData.set(farm, data);
            } catch (error) {
                console.error(`❌ Error loading data for ${farm}:`, error);
                throw error;
            }
        }

        return farmData;
    }
}
