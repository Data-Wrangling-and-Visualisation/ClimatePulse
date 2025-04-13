import { fetchData, formatTooltip, getColorForValue } from '../utils/helpers.js';

class CO2Chart {
    constructor(container, modalContainer) {
        this.container = container;
        this.modalContainer = modalContainer;
        this.margin = { top: 20, right: 30, bottom: 40, left: 50 };
        this.width = 600 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;
        this.data = null;
        this.countries = [];
        this.selectedCountry = 'World';

        this.init();
    }

    async init() {
        const globalData = await fetchData('/api/nasa/carbon-dioxide');

        this.countries = await fetchData('/api/countries');
        if (this.countries) {
            this.countries = this.countries.map(c => c.name);
            this.countries.unshift('World');
        }

        if (globalData) {
            this.data = {
                global: globalData,
                countries: {}
            };

            this.renderChart();

            this.setupEventListeners();
        }
    }

    async loadCountryData(country) {
        if (country === 'World') return;

        if (!this.data.countries[country]) {
            const countryData = await fetchData(`/api/wb/country?country=${country}&metric=co2`);
            if (countryData) {
                this.data.countries[country] = countryData;
            }
        }
    }

    renderChart() {
        d3.select(this.container).selectAll('*').remove();

        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        const years = this.data.global.years.map(year => new Date(year, 0, 1));
        const values = this.data.global.values;
        
        const xScale = d3.scaleTime()
            .domain(d3.extent(years))
            .range([0, this.width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(values) * 1.1])
            .range([this.height, 0]);

        const line = d3.line()
            .x(d => xScale(new Date(d.year, 0, 1)))
            .y(d => yScale(d.value));

        const lineData = years.map((year, i) => ({
            year: year.getFullYear(),
            value: values[i]
        }));

        svg.append('g')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(xScale).ticks(5));

        svg.append('g')
            .call(d3.axisLeft(yScale));

        svg.append('text')
            .attr('transform', `translate(${this.width / 2}, ${this.height + this.margin.bottom - 5})`)
            .style('text-anchor', 'middle')
            .text('Year');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left)
            .attr('x', 0 - (this.height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('CO₂ Concentration (ppm)');

        svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', 0 - (this.margin.top / 2))
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Atmospheric CO₂ Concentration (Global)');

        svg.append('path')
            .datum(lineData)
            .attr('fill', 'none')
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', 2)
            .attr('d', line);

        svg.selectAll('.dot')
            .data(lineData)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(new Date(d.year, 0, 1)))
            .attr('cy', d => yScale(d.value))
            .attr('r', 3)
            .attr('fill', '#2c3e50')
            .on('mouseover', (event, d) => {
                const tooltip = d3.select('#chart-tooltip');
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(formatTooltip(d, 'co2'))
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                d3.select('#chart-tooltip').transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    }

    setupEventListeners() {
        const controls = d3.select(this.container).node().parentNode;
        const controlDiv = d3.select(controls).insert('div', ':first-child')
            .attr('class', 'chart-controls');

        if (this.countries.length > 0) {
            controlDiv.append('label')
                .text('Select Country: ')
                .attr('for', 'country-select');

            controlDiv.append('select')
                .attr('id', 'country-select')
                .on('change', (event) => {
                    this.selectedCountry = event.target.value;
                    this.loadCountryData(this.selectedCountry)
                        .then(() => this.updateChart());
                })
                .selectAll('option')
                .data(this.countries)
                .enter().append('option')
                .text(d => d)
                .attr('value', d => d);
        }
    }

    updateChart() {
        // TODO: Update chart based on selected country (similar to renderChart but with country-specific data)
    }

    renderModalContent() {
        // TODO: Create expanded version with more features
    }
}

export { CO2Chart };
