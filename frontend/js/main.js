import { TemperatureChart } from './charts/temperatureChart.js';
import { CO2Chart } from './charts/co2Chart.js';
import { CountryStatsChart } from './charts/countryStatsChart.js';
import { RenewableEnergyChart } from './charts/renewableEnergyChart.js';
import { PredictionChart } from './charts/predictionChart.js';
import { WorldMapVisualization } from './map/map.js';
import { BurningBalanceLeft } from './charts/burningBalance.js';
import { BurningBalanceRight } from './charts/burningBalance.js';

class ClimatePulseApp {
    constructor() {
        this.initCharts();
        this.initMap();
        this.setupEventListeners();
        this.initViz();
    }

    initCharts() {
        this.temperatureChart = new TemperatureChart(
            document.querySelector('[data-chart="temperature"] .chart-placeholder'),
            document.querySelector('[data-chart="temperature"] .modal'),
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
        this.predictionChart = new PredictionChart(
            document.querySelector('[data-chart="prediction"] .chart-placeholder')
        );
    }

    initMap() {
        this.map = new WorldMapVisualization('map-container');
    }

    initViz() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Pass the SPECIFIC Three.js container ID
                    const leftGlobe = new BurningBalanceLeft('burning-balance-threejs');
                    const rightGlobe = new BurningBalanceRight('burning-balance-right');

                    const sharedSlider = document.getElementById('shared-slider');
                    const yearDisplay = document.getElementById('year-display');

                    const plusBtn = document.getElementById('increment-year');
                    const minusBtn = document.getElementById('decrement-year');

                    let currentYear = 2000;
                    
                    // Function to update everything
                    const updateAll = async (newYear) => {
                        // Clamp year between 2000-2020
                        newYear = Math.max(2000, Math.min(2020, newYear));
                        currentYear = newYear;
                        
                        // Update UI
                        sharedSlider.value = currentYear;
                        yearDisplay.textContent = currentYear;
                        
                        // Update globes
                        await leftGlobe.updateYear(currentYear);
                        await rightGlobe.updateYear(currentYear);
                    };
                    
                    // Slider change handler
                    sharedSlider.addEventListener('input', (e) => {
                        updateAll(parseInt(e.target.value));
                    });
                    
                    // Plus button handler
                    plusBtn.addEventListener('click', () => {
                        updateAll(currentYear + 1);
                    });
                    
                    // Minus button handler
                    minusBtn.addEventListener('click', () => {
                        updateAll(currentYear - 1);
                    });

                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
    
        document.querySelectorAll('[data-viz="burning-balance"]').forEach(section => {
            observer.observe(section);
        });
    }
    openChartModal(chartType) {
        const modal = document.getElementById('chartModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalChartContainer = document.getElementById('modalChartContainer');

        switch (chartType) {
            case 'temperature':
                modalTitle.textContent = 'Global Temperature Trends';
                this.temperatureChart.renderModalContent();
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
            case 'prediction':
                modalTitle.textContent = 'Future Climate Predictions';
                this.predictionChart.renderModalContent();
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
            alert('Data sources: NASA, World Bank');
        });

        const navbarHeight = document.querySelector('.main-nav').offsetHeight;

        document.getElementById('climateBtn').addEventListener('click', () => {
            const targetSection = document.getElementById('climateDataSection');
            const targetPosition = targetSection.getBoundingClientRect().top + window.scrollY - navbarHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        });

        document.getElementById('predictionsBtn').addEventListener('click', () => {
            const targetSection = document.getElementById('predictionsSection');
            const targetPosition = targetSection.getBoundingClientRect().top + window.scrollY - navbarHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        });

        document.getElementById('mapBtn').addEventListener('click', () => {
            const targetSection = document.getElementById('mapSection');
            const targetPosition = targetSection.getBoundingClientRect().top + window.scrollY - navbarHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
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
