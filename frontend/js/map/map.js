import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';
import * as topojson from "https://cdn.skypack.dev/topojson@3.0.2";
import { fetchData, getColorForValue, formatNumber } from '../utils/helpers.js';

export class WorldMapVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.countryData = {};
        this.countryMetadata = {};
        this.currentYear = new Date().getFullYear() - 1; // Default to last year
        this.metric = 'co2'; // Default metric

        this.initMap();
        this.loadData();
    }

    async initMap() {
        // Set up SVG container
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .style('background-color', '#f5f5f5');

        // Add year selection control
        this.yearSelect = d3.select(this.container)
            .insert('div', ':first-child')
            .attr('class', 'map-controls')
            .append('select')
            .attr('id', 'year-select')
            .on('change', () => {
                this.currentYear = parseInt(d3.select('#year-select').property('value'));
                this.updateMap();
            });

        // Add tooltip div
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'map-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('padding', '8px')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('border-radius', '4px')
            .style('pointer-events', 'none');
    }

    async loadData() {
        try {
            // Load country metadata
            const metadataResponse = await fetch('/data/countries_data.json');
            const rawMetadataAll = await metadataResponse.json();
            const rawMetadata = rawMetadataAll[0];

            // Process metadata into a more usable format
            this.countryMetadata = rawMetadata.reduce((acc, country) => {
                if (country.longitude && country.latitude) {
                    acc[country.name] = {
                        id: country.id,
                        code: country.iso2Code,
                        longitude: parseFloat(country.longitude),
                        latitude: parseFloat(country.latitude),
                        region: country.region?.value || 'Unknown',
                        capital: country.capitalCity || 'Unknown'
                    };
                }
                return acc;
            }, {});

            // Load initial emissions data
            await this.loadEmissionsData();

            // Get available years for dropdown
            const years = await this.getAvailableYears();
            this.populateYearSelect(years);

            // Draw the map
            this.drawMap();
        } catch (error) {
            console.error('Error loading map data:', error);
        }
    }

    async loadEmissionsData() {
        try {
            const data = await fetchData(`/api/wb/metric?metric=${this.metric}`);

            if (data) {
                // Process data into {country: {year: value}} format
                this.countryData = {};
                this.minValue = Infinity;
                this.maxValue = -Infinity;

                for (const [country, yearsData] of Object.entries(data)) {
                    if (this.countryMetadata[country]) {
                        this.countryData[country] = {};

                        for (const [year, value] of Object.entries(yearsData)) {
                            const numericValue = parseFloat(value);
                            if (!isNaN(numericValue)) {
                                this.countryData[country][year] = numericValue;

                                // Update min/max for color scaling
                                if (numericValue < this.minValue) this.minValue = numericValue;
                                if (numericValue > this.maxValue) this.maxValue = numericValue;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading emissions data:', error);
        }
    }

    async getAvailableYears() {
        try {
            const data = await fetchData('/api/wb/metric?metric=co2');
            console.log(data);

            const years = new Set();

            // Collect all available years from the data
            Object.values(data).forEach(countryData => {
                Object.keys(countryData).forEach(year => {
                    years.add(parseInt(year));
                });
            });
            console.log(years);

            return Array.from(years).sort((a, b) => b - a); // Sort descending
        } catch (error) {
            console.error('Error getting available years:', error);
            return [this.currentYear]; // Fallback to current year
        }
    }

    populateYearSelect(years) {
        this.yearSelect.selectAll('option')
            .data(years)
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d)
            .property('selected', d => d === this.currentYear);
    }

    async drawMap() {
        // Load world map GeoJSON
        const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');

        // Create a projection centered on 0,0
        this.projection = d3.geoMercator()
            .scale(this.width / 6)
            .translate([this.width / 2, this.height / 2]);

        // Create path generator
        const path = d3.geoPath().projection(this.projection);

        // Draw base map
        this.svg.append('g')
            .selectAll('path')
            .data(topojson.feature(world, world.objects.countries).features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path)
            .attr('fill', '#ddd')
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);

        // Draw data points
        this.drawDataPoints();

        // Add legend
        this.addLegend();
    }

    drawDataPoints() {
        // Remove existing points if any
        this.svg.selectAll('.data-point').remove();

        // Filter countries with valid data for current year
        const validCountries = Object.entries(this.countryData)
            .filter(([country, yearsData]) =>
                yearsData[this.currentYear] !== undefined &&
                this.countryMetadata[country]
            );

        // Draw points for each country with data
        this.svg.selectAll('.data-point')
            .data(validCountries)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', ([country]) => {
                const meta = this.countryMetadata[country];
                return this.projection([meta.longitude, meta.latitude])[0];
            })
            .attr('cy', ([country]) => {
                const meta = this.countryMetadata[country];
                return this.projection([meta.longitude, meta.latitude])[1];
            })
            .attr('r', 8) // Base radius
            .attr('fill', ([country, yearsData]) => {
                const value = yearsData[this.currentYear];
                return getColorForValue(value, this.minValue, this.maxValue);
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .on('mouseover', (event, [country, yearsData]) => {
                const value = yearsData[this.currentYear];
                const meta = this.countryMetadata[country];

                // Highlight point
                d3.select(event.currentTarget)
                    .attr('r', 12)
                    .attr('stroke-width', 2);

                // Show tooltip
                this.tooltip
                    .style('opacity', 1)
                    .html(`
                        <strong>${country}</strong><br>
                        ${this.metric.toUpperCase()} Emissions (${this.currentYear}): ${formatNumber(value)} Mt<br>
                        Region: ${meta.region}<br>
                        Capital: ${meta.capital}
                    `)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', (event) => {
                // Reset point style
                d3.select(event.currentTarget)
                    .attr('r', 8)
                    .attr('stroke-width', 1);

                // Hide tooltip
                this.tooltip.style('opacity', 0);
            })
            .attr('data-country', ([country]) => country)
            .attr('data-value', ([country, yearsData]) => yearsData[this.currentYear]);

        // Scale point size based on value
        this.scalePointSizes();
    }

    scalePointSizes() {
        const sizeScale = d3.scaleSqrt()
            .domain([this.minValue, this.maxValue])
            .range([5, 20]);

        this.svg.selectAll('.data-point')
            .attr('r', d => {
                const value = d[1][this.currentYear];
                return sizeScale(value);
            });
    }

    addLegend() {
        // Remove existing legend if any
        this.svg.selectAll('.legend').remove();

        const legendWidth = 200;
        const legendHeight = 20;

        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width - legendWidth - 20}, 20)`);

        // Create gradient
        const defs = this.svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', getColorForValue(this.minValue, this.minValue, this.maxValue));

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', getColorForValue(this.maxValue, this.minValue, this.maxValue));

        // Draw legend rectangle
        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#gradient)');

        // Add legend text
        legend.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .text(`${this.metric.toUpperCase()} Emissions (Mt) - ${this.currentYear}`);

        legend.append('text')
            .attr('x', 0)
            .attr('y', legendHeight + 15)
            .text(formatNumber(this.minValue));

        legend.append('text')
            .attr('x', legendWidth)
            .attr('y', legendHeight + 15)
            .text(formatNumber(this.maxValue))
            .style('text-anchor', 'end');
    }

    updateMap() {
        this.drawDataPoints();
        this.addLegend();
    }
}
