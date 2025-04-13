import { TemperatureChart } from './charts/temperatureChart.js';
import { CO2Chart } from './charts/co2Chart.js';
import { CountryStatsChart } from './charts/countryStatsChart.js';
import { RenewableEnergyChart } from './charts/renewableEnergyChart.js';
import { GlobeVisualization } from './globe/globe.js';

class ClimatePulseApp {
    constructor() {
        this.initCharts();
        this.initGlobe();
        this.setupEventListeners();
    }

    initCharts() {
        this.temperatureChart = new TemperatureChart(
            document.querySelector('[data-chart="temperature"] .chart-placeholder')
        );

        this.co2Chart = new CO2Chart(
            document.querySelector('[data-chart="co2"] .chart-placeholder')
        );

        this.countryStatsChart = new CountryStatsChart(
            document.querySelector('[data-chart="country"] .chart-placeholder')
        );

        this.renewableEnergyChart = new RenewableEnergyChart(
            document.querySelector('[data-chart="renewable"] .chart-placeholder')
        );
    }

    initGlobe() {
        this.globe = new GlobeVisualization('globe-container');
    }

    openChartModal(chartType) {
        const modal = document.getElementById('chartModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalChartContainer = document.getElementById('modalChartContainer');

        switch (chartType) {
            case 'temperature':
                modalTitle.textContent = 'Global Temperature Trends';
                this.temperatureChart.renderChart();
                break;
            case 'co2':
                modalTitle.textContent = 'CO₂ Emissions Analysis';
                this.co2Chart.renderModalContent();
                break;
            case 'country':
                modalTitle.textContent = 'Country Climate Statistics';
                this.countryStatsChart.renderModalContent();
                break;
            case 'renewable':
                modalTitle.textContent = 'Renewable Energy Leaders';
                this.renewableEnergyChart.renderModalContent();
                break;
        }

        modal.style.display = 'block';
    }

    setupEventListeners() {
        document.querySelector('.close-btn').addEventListener('click', () => {
            document.getElementById('chartModal').style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === document.getElementById('chartModal')) {
                document.getElementById('chartModal').style.display = 'none';
            }
        });

        document.getElementById('scrollTopBtn').addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.getElementById('dataSourcesBtn').addEventListener('click', () => {
            alert('Data sources: NASA, NOAA, World Bank');
        });

        document.getElementById('feedbackForm').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your feedback!');
            e.target.reset();
        });

        document.querySelectorAll('.grid-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking on the button itself
                if (e.target.classList.contains('expand-btn')) return;
                
                const chartType = item.getAttribute('data-chart');
                this.openChartModal(chartType);
            });
        });

        // Add click handlers for expand buttons
        document.querySelectorAll('.expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chartType = btn.closest('.grid-item').getAttribute('data-chart');
                this.openChartModal(chartType);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ClimatePulseApp();
    
    const tooltip = document.createElement('div');
    tooltip.id = 'chart-tooltip';
    Object.assign(tooltip.style, {
        position: 'absolute',
        padding: '8px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '4px',
        pointerEvents: 'none',
        opacity: 0,
        zIndex: 10
    });
    document.body.appendChild(tooltip);
});
