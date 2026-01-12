import dotenv from 'dotenv';
import express from 'express';

import { CsvReaderService } from './services/csv-reader.service';
import { MetricsCalculatorService } from './services/metrics-calculator.service';
import { PrometheusService } from './services/prometheus.service';
import { SolarDataRow, FarmName, AppConfig } from './types/solar.types';

// Load environment variables
dotenv.config();

/**
 * Main application server for Solar Farm Monitoring
 */
class SolarSimulatorServer {
    private app: express.Application;
    private config: AppConfig;
    private csvReader: CsvReaderService;
    private metricsCalculator: MetricsCalculatorService;
    private prometheus: PrometheusService;
    private farmData: Map<FarmName, SolarDataRow[]>;
    private currentIndices: Map<FarmName, number>;
    private updateInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.app = express();
        this.config = this.loadConfig();
        this.csvReader = new CsvReaderService(this.config.dataPath);
        this.metricsCalculator = new MetricsCalculatorService();
        this.prometheus = new PrometheusService();
        this.farmData = new Map();
        this.currentIndices = new Map();

        this.setupRoutes();
    }

    /**
     * Load configuration from environment variables
     */
    private loadConfig(): AppConfig {
        return {
            port: parseInt(process.env.PORT || '3000', 10),
            dataPath: process.env.DATA_PATH || '../../data',
            updateIntervalMs: parseInt(process.env.UPDATE_INTERVAL_MS || '60000', 10),
            logLevel: process.env.LOG_LEVEL || 'info',
            nodeEnv: process.env.NODE_ENV || 'development',
        };
    }

    /**
     * Setup Express routes
     */
    private setupRoutes(): void {
        // Health check endpoint for Kubernetes liveness probe
        this.app.get('/health', (_req, res) => {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            });
        });

        // Readiness check endpoint for Kubernetes readiness probe
        this.app.get('/ready', (_req, res) => {
            const isReady = this.farmData.size === 3; // All 3 farms loaded
            if (isReady) {
                res.status(200).json({
                    status: 'ready',
                    farms: Array.from(this.farmData.keys()),
                });
            } else {
                res.status(503).json({
                    status: 'not ready',
                    message: 'Farm data not loaded yet',
                });
            }
        });

        // Prometheus metrics endpoint
        this.app.get('/metrics', async (_req, res) => {
            try {
                const metrics = await this.prometheus.getMetrics();
                res.set('Content-Type', this.prometheus.getRegistry().contentType);
                res.send(metrics);
            } catch (error) {
                console.error('Error generating metrics:', error);
                res.status(500).send('Error generating metrics');
            }
        });

        // Info endpoint (for debugging)
        this.app.get('/info', (_req, res) => {
            const info: any = {
                farms: {},
                config: {
                    updateIntervalMs: this.config.updateIntervalMs,
                    dataPath: this.config.dataPath,
                },
            };

            this.farmData.forEach((data, farm) => {
                const currentIndex = this.currentIndices.get(farm) || 0;
                const currentRow = data[currentIndex % data.length];
                info.farms[farm] = {
                    totalRecords: data.length,
                    currentIndex,
                    currentTimestamp: currentRow?.timestamp,
                    currentPower: currentRow?.power_production_kw,
                };
            });

            res.json(info);
        });
    }

    /**
     * Load data for all farms
     */
    private async loadData(): Promise<void> {
        console.log('🌞 Loading solar farm data...');
        try {
            this.farmData = await this.csvReader.loadAllFarms();

            // Initialize indices
            const farms: FarmName[] = ['provence', 'occitanie', 'aquitaine'];
            farms.forEach(farm => {
                this.currentIndices.set(farm, 0);
            });

            console.log(`✅ Loaded data for ${this.farmData.size} farms`);

            // Perform initial metrics update
            this.updateMetrics();
        } catch (error) {
            console.error('❌ Failed to load farm data:', error);
            throw error;
        }
    }

    /**
     * Update metrics for all farms
     */
    private updateMetrics(): void {
        this.farmData.forEach((data, farm) => {
            const currentIndex = this.currentIndices.get(farm) || 0;
            const metrics = this.metricsCalculator.calculateFarmMetrics(
                farm,
                data,
                currentIndex
            );
            this.prometheus.updateMetrics(metrics);

            // Move to next data point (simulate time progression)
            this.currentIndices.set(farm, currentIndex + 1);
        });

        if (this.config.logLevel === 'debug') {
            console.log(`📊 Metrics updated at ${new Date().toISOString()}`);
        }
    }

    /**
     * Start the periodic metrics update
     */
    private startMetricsUpdate(): void {
        console.log(
            `⏰ Starting metrics update every ${this.config.updateIntervalMs}ms`
        );

        this.updateInterval = setInterval(() => {
            this.updateMetrics();
        }, this.config.updateIntervalMs);
    }

    /**
     * Stop the periodic metrics update
     */
    private stopMetricsUpdate(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏰ Stopped metrics update');
        }
    }

    /**
     * Start the server
     */
    async start(): Promise<void> {
        try {
            // Load data first
            await this.loadData();

            // Start metrics update
            this.startMetricsUpdate();

            // Start HTTP server
            this.app.listen(this.config.port, () => {
                console.log('');
                console.log('🚀 Solar Farm Simulator started!');
                console.log(`📡 Server running on port ${this.config.port}`);
                console.log(`📊 Metrics: http://localhost:${this.config.port}/metrics`);
                console.log(`❤️  Health: http://localhost:${this.config.port}/health`);
                console.log(`✅ Ready: http://localhost:${this.config.port}/ready`);
                console.log(`ℹ️  Info: http://localhost:${this.config.port}/info`);
                console.log('');
            });
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown(): Promise<void> {
        console.log('🛑 Shutting down gracefully...');
        this.stopMetricsUpdate();
        process.exit(0);
    }
}

// Handle graceful shutdown
const server = new SolarSimulatorServer();

process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());

// Start the server
server.start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
