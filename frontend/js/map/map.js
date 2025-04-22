import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';
import * as topojson from "https://cdn.skypack.dev/topojson@3.0.2";
import { fetchData, formatNumber } from '../utils/helpers.js';

export class WorldMapVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.countryData = {};
        this.countryMetadata = {};
        this.currentYear = 2023;
        this.metric = 'co2';
        this.currentTransform = d3.zoomIdentity;

        this.zoomed = (event) => {
            this.currentTransform = event.transform;
            this.mapGroup.attr('transform', event.transform);
            this.updatePointSizes();
        };

        this.zoom = d3.zoom().scaleExtent([1, 8]).on('zoom', this.zoomed.bind(this));

        this.initMap();
        this.loadData();
    }

    getColorForValue(value, min, max) {
        const logMin = min > 0 ? Math.log10(min) : 0;
        const logMax = Math.log10(max);
        const logValue = value > 0 ? Math.log10(value) : logMin;
        const normalized = (logValue - logMin) / (logMax - logMin);

        return d3.scaleSequential(d3.interpolatePlasma)
            .domain([1, 0])(normalized);
    }

    async initMap() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .style('background-color', '#f5f5f5')
            .call(this.zoom);

        this.mapGroup = this.svg.append('g');

        this.yearSelect = d3.select(this.container)
            .insert('div', ':first-child')
            .attr('class', 'map-controls')
            .append('select')
            .attr('id', 'year-select')
            .on('change', () => {
                this.currentYear = parseInt(d3.select('#year-select').property('value'));
                this.updateMap();
            });

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

    zoomed(event) {
        this.currentTransform = event.transform;
        this.mapGroup.attr('transform', event.transform);
        this.updatePointSizes();
    }

    updatePointSizes() {
        const zoomLevel = this.currentTransform.k;
        const sizeFactor = 1 / Math.max(1, Math.pow(zoomLevel, 0.7));

        this.mapGroup.selectAll('.data-point')
            .attr('r', d => {
                const value = d[1][this.currentYear];
                return Math.sqrt(value / this.maxValue * 30) * sizeFactor + 2;
            })
            .attr('stroke-width', 0.5 + (1 / zoomLevel));
    }

    async loadData() {
        try {
            const metadataResponse = await fetchData('/api/countries_data');
            this.countryMetadata = metadataResponse;
            await this.loadEmissionsData();

            const years = await this.getAvailableYears();
            this.populateYearSelect(years);
            this.drawMap();
        } catch (error) {
            console.error('Error loading map data:', error);
        }
    }

    async loadEmissionsData() {
        try {
            const data = await fetchData(`/api/wb/metric?metric=${this.metric}`);

            if (data) {
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
            const years = new Set();

            Object.values(data).forEach(countryData => {
                Object.keys(countryData).forEach(year => {
                    years.add(parseInt(year));
                });
            });

            return Array.from(years).sort((a, b) => b - a);
        } catch (error) {
            console.error('Error getting available years:', error);
            return [this.currentYear];
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
        const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');

        this.projection = d3.geoMercator()
            .scale(this.width / 6)
            .translate([this.width / 2, this.height / 2]);

        const path = d3.geoPath().projection(this.projection);

        this.calculateMinMaxForCurrentYear();

        this.mapGroup.selectAll('.country')
            .data(topojson.feature(world, world.objects.countries).features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path)
            .attr('fill', d => {
                const countryName = this.findCountryByFeature(d);

                if (countryName && this.countryData[countryName]?.[this.currentYear]) {
                    return this.getColorForValue(
                        this.countryData[countryName][this.currentYear],
                        this.minValue,
                        this.maxValue
                    );
                }
                return '#ddd';
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5)
            .on('mouseover', this.handleCountryMouseover.bind(this))
            .on('mouseout', this.handleCountryMouseout.bind(this));

        this.drawDataPoints();

        this.addLegend();
    }

    findCountryByFeature(feature) {
        if (feature.properties && feature.properties.name) {
            const exactName = feature.properties.name;
            if (this.countryMetadata[exactName]) {
                return exactName;
            }
        }

        return this.findCountryByPolygonContainment(feature);
    }

    findCountryByPolygonContainment(feature) {
        const polygons = this.extractAllPolygons(feature.geometry);

        for (const [country, meta] of Object.entries(this.countryMetadata)) {
            if (meta.longitude && meta.latitude) {
                if (this.isPointInPolygons(meta.longitude, meta.latitude, polygons)) {
                    return country;
                }
            }
        }

        console.log("failed", feature.properties.name);
        return null;
    }

    extractAllPolygons(geometry) {
        const polygons = [];

        if (geometry.type === 'Polygon') {
            polygons.push(geometry.coordinates);
        }
        else if (geometry.type === 'MultiPolygon') {
            for (const polygon of geometry.coordinates) {
                polygons.push(polygon);
            }
        }

        return polygons;
    }

    isPointInPolygons(lng, lat, polygons) {
        for (const polygon of polygons) {
            if (this.isPointInPolygon(lng, lat, polygon)) {
                return true;
            }
        }
        return false;
    }

    isPointInPolygon(lng, lat, polygon) {
        const rings = Array.isArray(polygon[0][0]) ? polygon : [polygon];

        let inside = false;
        for (const ring of rings) {
            if (ring.length < 3) continue;

            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                const xi = ring[i][0], yi = ring[i][1];
                const xj = ring[j][0], yj = ring[j][1];

                const intersect = ((yi > lat) !== (yj > lat)) &&
                    (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
        }
        return inside;
    }

    calculateMinMaxForCurrentYear() {
        this.minValue = Infinity;
        this.maxValue = -Infinity;

        for (const country in this.countryData) {
            const value = this.countryData[country]?.[this.currentYear];
            if (value !== undefined) {
                if (value < this.minValue) this.minValue = value;
                if (value > this.maxValue) this.maxValue = value;
            }
        }

        if (this.minValue === Infinity) this.minValue = 0;
        if (this.maxValue === -Infinity) this.maxValue = 1;
    }

    drawDataPoints() {
        this.mapGroup.selectAll('.data-point').remove();

        const validCountries = Object.entries(this.countryData)
            .filter(([country, yearsData]) =>
                yearsData[this.currentYear] !== undefined &&
                this.countryMetadata[country]
            );

        this.mapGroup.selectAll('.data-point')
            .data(validCountries)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', ([country]) => {
                const meta = this.countryMetadata[country];
                return this.projection([meta.longitude, meta.latitude])?.[0] || 0;
            })
            .attr('cy', ([country]) => {
                const meta = this.countryMetadata[country];
                return this.projection([meta.longitude, meta.latitude])?.[1] || 0;
            })
            .attr('r', 3)
            .attr('fill', ([country, yearsData]) => {
                const value = yearsData[this.currentYear];
                return this.getColorForValue(value, this.minValue, this.maxValue);
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5)
            .on('mouseover', this.handlePointMouseover.bind(this))
            .on('mouseout', this.handlePointMouseout.bind(this));

        this.updatePointSizes();
    }

    scalePointSizes(zoomLevel = 1) {
        const baseSize = 3;
        const scaleFactor = zoomLevel > 1 ? 100 / zoomLevel : 100;

        this.mapGroup.selectAll('.data-point')
            .attr('r', d => {
                const value = d[1][this.currentYear];
                return Math.sqrt(value / this.maxValue * scaleFactor) + baseSize;
            });
    }

    addLegend() {
        this.svg.selectAll('.legend').remove();

        const legendWidth = 200;
        const legendHeight = 20;

        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width - legendWidth - 40}, 40)`);

        const logMin = this.minValue > 0 ? Math.log10(this.minValue) : 0;
        const logMax = Math.log10(this.maxValue);
        const logRange = logMax - logMin;

        const gradient = legend.append('defs')
            .append('linearGradient')
            .attr('id', 'color-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%');

        [0, 0.5, 1].forEach(offset => {
            const value = Math.pow(10, logMin + offset * logRange);
            gradient.append('stop')
                .attr('offset', `${offset * 100}%`)
                .attr('stop-color', this.getColorForValue(value, this.minValue, this.maxValue));
        });

        legend.append('rect')
            .attr('x', 0)
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#color-gradient)')
            .attr('stroke', '#000')
            .attr('stroke-width', 0.5);

        legend.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .text(`CO₂ Emissions (Mt) - ${this.currentYear}`)
            .style('font-weight', 'bold')
            .style('font-size', '12px');

        const tickValues = [
            this.minValue,
            Math.pow(10, logMin + logRange * 0.5),
            this.maxValue
        ];

        legend.selectAll('.legend-tick')
            .data(tickValues)
            .enter()
            .append('line')
            .attr('x1', d => ((Math.log10(d) - logMin) / logRange) * legendWidth)
            .attr('x2', d => ((Math.log10(d) - logMin) / logRange) * legendWidth)
            .attr('y1', legendHeight)
            .attr('y2', legendHeight + 5)
            .attr('stroke', '#000')
            .attr('stroke-width', 1);

        legend.selectAll('.legend-label')
            .data(tickValues)
            .enter()
            .append('text')
            .attr('x', d => ((Math.log10(d) - logMin) / logRange) * legendWidth)
            .attr('y', legendHeight + 20)
            .text(d => {
                if (d >= 1000) {
                    return d3.format('.2s')(d).replace('G', 'B');
                }
                return d3.format('.1f')(d);
            })
            .style('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('pointer-events', 'none');
    }

    handleCountryMouseover = (event, d) => {
        const countryName = this.findCountryByFeature(d);
        if (countryName) {
            const meta = this.countryMetadata[countryName];
            const value = this.countryData[countryName]?.[this.currentYear];

            d3.select(event.currentTarget)
                .attr('stroke-width', 2)
                .attr('stroke', '#000');

            this.tooltip
                .style('opacity', 1)
                .html(`
                    <strong>${countryName}</strong><br>
                    CO₂ Emissions (${this.currentYear}): ${value ? formatNumber(value) + ' Mt' : 'No data'}<br>
                    Region: ${meta.region || 'Unknown'}<br>
                    Capital: ${meta.capital || 'Unknown'}
                `)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 28}px`);
        }
    };

    handleCountryMouseout = (event) => {
        d3.select(event.currentTarget)
            .attr('stroke-width', 0.5)
            .attr('stroke', '#fff');
        this.tooltip.style('opacity', 0);
    };

    handlePointMouseover = (event, [country, yearsData]) => {
        const value = yearsData[this.currentYear];
        const meta = this.countryMetadata[country];

        d3.select(event.currentTarget)
            .attr('r', d => Math.sqrt(d[1][this.currentYear] / this.maxValue * 30) * (1 / Math.max(1, Math.pow(this.currentTransform.k, 0.7)) * 1.5 + 2))
                .attr('stroke-width', 1);

        this.tooltip
            .style('opacity', 1)
            .html(`
                <strong>${country}</strong><br>
                CO₂ Emissions (${this.currentYear}): ${formatNumber(value)} Mt<br>
                Region: ${meta.region || 'Unknown'}<br>
                Capital: ${meta.capital || 'Unknown'}
            `)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 28}px`);
    };

    handlePointMouseout = (event) => {
        const sizeFactor = 1 / Math.max(1, Math.pow(this.currentTransform.k, 0.7));
        d3.select(event.currentTarget)
            .attr('r', d => Math.sqrt(d[1][this.currentYear] / this.maxValue * 30) * sizeFactor + 2)
            .attr('stroke-width', 0.5 + (1 / this.currentTransform.k));
        this.tooltip.style('opacity', 0);
    };

    updateMap() {
        this.calculateMinMaxForCurrentYear();

        this.mapGroup.selectAll('.country')
            .attr('fill', d => {
                const countryName = this.findCountryByFeature(d);

                if (countryName && this.countryData[countryName]?.[this.currentYear]) {
                    return this.getColorForValue(
                        this.countryData[countryName][this.currentYear],
                        this.minValue,
                        this.maxValue
                    );
                }
                return '#ddd';
            });

        this.drawDataPoints();

        this.addLegend();
    }
}
