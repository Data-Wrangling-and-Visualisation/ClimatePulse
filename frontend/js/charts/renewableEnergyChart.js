import { fetchData, formatTooltip, formatNumber } from '../utils/helpers.js';

class RenewableEnergyChart {
    constructor(container, modalContainer) {
        this.container = container;
        this.modalContainer = modalContainer;
        this.margin = { top: 20, right: 30, bottom: 100, left: 80 };
        this.width = 600 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;
        this.data = null;
        this.topCountries = [];
        this.showTop = true;
        this.yearRange = [2010, 2020];

        this.init();
    }

    async init() {
        this.data = await fetchData('/api/renewable-energy');

        if (this.data) {
            this.processData();
            this.renderChart();
            this.setupEventListeners();
        }
    }

    processData() {
        const countryData = {};

        this.data.forEach(item => {
            const country = item.country;
            const year = item.year;
            const value = item.value;

            if (!countryData[country]) {
                countryData[country] = [];
            }

            if (year >= this.yearRange[0] && year <= this.yearRange[1]) {
                countryData[country].push(value);
            }
        });

        this.topCountries = Object.keys(countryData)
            .map(country => {
                const values = countryData[country];
                const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                return { country, avg };
            })
            .filter(item => !isNaN(item.avg))
            .sort((a, b) => this.showTop ? b.avg - a.avg : a.avg - b.avg)
            .slice(0, 10);
    }

    renderChart() {
        if (!this.topCountries.length) return;

        d3.select(this.container).selectAll('*').remove();

        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        const xScale = d3.scaleBand()
            .domain(this.topCountries.map(d => d.country))
            .range([0, this.width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(this.topCountries, d => d.avg) * 1.1])
            .range([this.height, 0]);

        svg.append('g')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .attr('dx', '-0.5em')
            .attr('dy', '0.5em');

        svg.append('g')
            .call(d3.axisLeft(yScale));

        svg.append('text')
            .attr('transform', `translate(${this.width / 2}, ${this.height + this.margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .text('Country');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left)
            .attr('x', 0 - (this.height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Renewable Energy (%)');

        svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', 0 - (this.margin.top / 2))
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text(`${this.showTop ? 'Top' : 'Bottom'} 10 Countries by Renewable Energy Usage (${this.yearRange[0]}-${this.yearRange[1]})`);

        svg.selectAll('.bar')
            .data(this.topCountries)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.country))
            .attr('y', d => yScale(d.avg))
            .attr('width', xScale.bandwidth())
            .attr('height', d => this.height - yScale(d.avg))
            .attr('fill', d => d.avg > 50 ? '#2ecc71' : d.avg > 30 ? '#f39c12' : '#e74c3c')
            .on('mouseover', (event, d) => {
                const tooltip = d3.select('#chart-tooltip');
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`
                    <div class="tooltip-content">
                        <strong>${d.country}</strong><br>
                        Average: <strong>${d.avg.toFixed(1)}%</strong><br>
                        Years: ${this.yearRange[0]}-${this.yearRange[1]}
                    </div>
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                d3.select('#chart-tooltip').transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        svg.selectAll('.bar-label')
            .data(this.topCountries)
            .enter().append('text')
            .attr('class', 'bar-label')
            .attr('x', d => xScale(d.country) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.avg) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#333')
            .text(d => d.avg.toFixed(1) + '%');
    }

    setupEventListeners() {
        const controls = d3.select(this.container).node().parentNode;
        const controlDiv = d3.select(controls).insert('div', ':first-child')
            .attr('class', 'chart-controls');

        controlDiv.append('button')
            .text(this.showTop ? 'Show Worst Performers' : 'Show Best Performers')
            .on('click', () => {
                this.showTop = !this.showTop;
                this.processData();
                this.renderChart();
                d3.select(this).text(this.showTop ? 'Show Worst Performers' : 'Show Best Performers');
            });

        controlDiv.append('label')
            .text('Year Range: ')
            .attr('for', 'year-range');

        controlDiv.append('input')
            .attr('type', 'range')
            .attr('id', 'year-range')
            .attr('min', 1990)
            .attr('max', 2020)
            .attr('step', 1)
            .attr('value', this.yearRange[0])
            .on('input', (event) => {
                this.yearRange[0] = parseInt(event.target.value);
                if (this.yearRange[0] > this.yearRange[1]) {
                    this.yearRange[1] = this.yearRange[0];
                    d3.select('#year-range-end').property('value', this.yearRange[1]);
                }
                this.processData();
                this.renderChart();
            });

        controlDiv.append('span')
            .text(this.yearRange[0]);

        controlDiv.append('input')
            .attr('type', 'range')
            .attr('id', 'year-range-end')
            .attr('min', 1990)
            .attr('max', 2020)
            .attr('step', 1)
            .attr('value', this.yearRange[1])
            .on('input', (event) => {
                this.yearRange[1] = parseInt(event.target.value);
                if (this.yearRange[1] < this.yearRange[0]) {
                    this.yearRange[0] = this.yearRange[1];
                    d3.select('#year-range').property('value', this.yearRange[0]);
                }
                this.processData();
                this.renderChart();
            });

        controlDiv.append('span')
            .text(this.yearRange[1]);
    }

    renderModalContent() {
        // TODO: expanded version with more interactive features
    }
}

export { RenewableEnergyChart };
