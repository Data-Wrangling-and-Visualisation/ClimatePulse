import { fetchData, formatTooltip, formatNumber } from '../utils/helpers.js';

class CountryStatsChart {
    constructor(container, modalContainer) {
        this.container = container;
        this.modalContainer = modalContainer;
        this.margin = { top: 20, right: 30, bottom: 100, left: 50 };
        this.width = 600 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;
        this.data = null;
        this.countries = [];
        this.selectedCountry = 'United States';
        this.selectedMetrics = ['co2', 'forest', 'air_pollution'];

        this.init();
    }

    async init() {
        this.countries = await fetchData('/api/countries');
        if (this.countries) {
            this.countries = this.countries.map(c => c.name);

            await this.loadCountryData(this.selectedCountry);

            this.renderChart();

            this.setupEventListeners();
        }
    }

    async loadCountryData(country) {
        const countryData = await fetchData(`/api/country/${country}/metrics`);
        if (countryData) {
            this.data = countryData;
            return true;
        }
        return false;
    }

    renderChart() {
        if (!this.data) return;

        d3.select(this.container).selectAll('*').remove();

        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        const metricData = {};
        const allYears = new Set();

        this.selectedMetrics.forEach(metric => {
            if (this.data[metric]) {
                const years = Object.keys(this.data[metric]).map(Number);
                years.forEach(year => allYears.add(year));
                metricData[metric] = years.map(year => ({
                    year,
                    value: this.data[metric][year]
                }));
            }
        });

        const sortedYears = Array.from(allYears).sort((a, b) => a - b);

        const xScale = d3.scaleBand()
            .domain(sortedYears)
            .range([0, this.width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(this.selectedMetrics.map(metric =>
                metricData[metric] ? d3.max(metricData[metric], d => d.value) : 0)
            ) * 1.1])
            .range([this.height, 0]);

        const colorScale = d3.scaleOrdinal()
            .domain(this.selectedMetrics)
            .range(['#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6']);

        svg.append('g')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((d, i) => !(i % 5))));

        svg.append('g')
            .call(d3.axisLeft(yScale));

        svg.append('text')
            .attr('transform', `translate(${this.width / 2}, ${this.height + this.margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .text('Year');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left)
            .attr('x', 0 - (this.height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Value');

        svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', 0 - (this.margin.top / 2))
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text(`${this.selectedCountry} Climate Metrics`);

        const metricGroups = svg.selectAll('.metric-group')
            .data(this.selectedMetrics)
            .enter().append('g')
            .attr('class', 'metric-group');

        metricGroups.selectAll('.bar')
            .data(d => metricData[d] || [])
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.year) + xScale.bandwidth() / this.selectedMetrics.length * this.selectedMetrics.indexOf(d3.select(this.parentNode).datum()))
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth() / this.selectedMetrics.length)
            .attr('height', d => this.height - yScale(d.value))
            .attr('fill', d => colorScale(d3.select(this.parentNode).datum()))
            .on('mouseover', function (event, d) {
                const metric = d3.select(this.parentNode).datum();
                const tooltip = d3.select('#chart-tooltip');
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(formatTooltip(d, metric))
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                d3.select('#chart-tooltip').transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        const legend = svg.append('g')
            .attr('transform', `translate(${this.width - 150}, 20)`);

        this.selectedMetrics.forEach((metric, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);

            legendItem.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', colorScale(metric));

            legendItem.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .style('font-size', '12px')
                .text(metric);
        });
    }

    setupEventListeners() {
        const controls = d3.select(this.container).node().parentNode;
        const controlDiv = d3.select(controls).insert('div', ':first-child')
            .attr('class', 'chart-controls');

        controlDiv.append('label')
            .text('Select Country: ')
            .attr('for', 'country-select');

        controlDiv.append('select')
            .attr('id', 'country-select')
            .on('change', async (event) => {
                this.selectedCountry = event.target.value;
                await this.loadCountryData(this.selectedCountry);
                this.renderChart();
            })
            .selectAll('option')
            .data(this.countries)
            .enter().append('option')
            .text(d => d)
            .attr('value', d => d)
            .property('selected', d => d === this.selectedCountry);

        controlDiv.append('label')
            .text('Select Metrics: ')
            .attr('for', 'metric-select');

        const metricSelect = controlDiv.append('select')
            .attr('id', 'metric-select')
            .attr('multiple', true)
            .on('change', (event) => {
                this.selectedMetrics = Array.from(event.target.selectedOptions, option => option.value);
                this.renderChart();
            });

        const availableMetrics = [
            { value: 'co2', text: 'CO2 Emissions' },
            { value: 'forest', text: 'Forest Area' },
            { value: 'air_pollution', text: 'Air Pollution' },
            { value: 'renewable', text: 'Renewable Energy' }
        ];

        metricSelect.selectAll('option')
            .data(availableMetrics)
            .enter().append('option')
            .text(d => d.text)
            .attr('value', d => d.value)
            .property('selected', d => this.selectedMetrics.includes(d.value));
    }

    renderModalContent() {
        // TODO: expanded version with more metrics and interactive features
    }
}

export { CountryStatsChart };
