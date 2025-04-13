import { fetchData, formatTooltip } from '../utils/helpers.js';

class TemperatureChart {
    constructor(container, modalContainer) {
        this.container = container;
        this.modalContainer = modalContainer;
        this.margin = { top: 60, right: 180, bottom: 50, left: 50 };
        this.width = 600 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;
        this.data = null;
        
        this.init();
    }
    
    async init() {
        this.data = await fetchData('/api/nasa/global-temperature');
        if (!this.data) return;
        this.renderChart();
        this.setupEventListeners();
    }
    
    renderChart() {
        d3.select(this.container).selectAll('*').remove();
        
        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right - 150)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
        
        const years = this.data.years.map(year => new Date(year, 0, 1));
        const values = this.data.values;
        
        const xScale = d3.scaleTime()
            .domain(d3.extent(years))
            .range([0, this.width]);
            
        const yScale = d3.scaleLinear()
            .domain([d3.min(values) - 0.5, d3.max(values) + 0.5])
            .range([this.height, 0]);
        
        const line = d3.line()
            .x(d => xScale(new Date(d.year, 0, 1)))
            .y(d => yScale(d.value))
            .curve(d3.curveBasis);
            
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
            .text('Temperature Anomaly (°C)');
            
        svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', 0 - (this.margin.top / 2))
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold');
            
        svg.append('path')
            .datum(lineData)
            .attr('fill', 'none')
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 2)
            .attr('d', line);
            
        svg.selectAll('.dot')
            .data(lineData)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(new Date(d.year, 0, 1)))
            .attr('cy', d => yScale(d.value))
            .attr('r', 3)
            .attr('fill', '#e74c3c')
            .on('mouseover', (event, d) => {
                const tooltip = d3.select('#chart-tooltip');
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(formatTooltip(d, 'temperature'))
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
    
    renderModalContent() {
        d3.select(this.container).selectAll('*').remove();
        
        // const modalWidth = this.modalContainer.node().clientWidth - this.margin.left - this.margin.right;
        // const modalHeight = 500 - this.margin.top - this.margin.bottom;
        
        const svg = this.modalContainer.append('svg')
            .attr('width', modalWidth + this.margin.left + this.margin.right)
            .attr('height', modalHeight + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
        
        const years = this.data[0].map(year => new Date(year, 0, 1));
        const values = this.data[1];
        
        const xScale = d3.scaleTime()
            .domain(d3.extent(years))
            .range([0, modalWidth]);
            
        const yScale = d3.scaleLinear()
            .domain([d3.min(values) - 0.5, d3.max(values) + 0.5])
            .range([modalHeight, 0]);
        
        const line = d3.line()
            .x(d => xScale(new Date(d.year, 0, 1)))
            .y(d => yScale(d.value))
            .curve(d3.curveBasis);
            
        const lineData = years.map((year, i) => ({
            year: year.getFullYear(),
            value: values[i]
        }));
        
        svg.append('g')
            .attr('transform', `translate(0, ${modalHeight})`)
            .call(d3.axisBottom(xScale).ticks(10));
            
        svg.append('g')
            .call(d3.axisLeft(yScale));
            
        svg.append('text')
            .attr('transform', `translate(${modalWidth / 2}, ${modalHeight + this.margin.bottom - 5})`)
            .style('text-anchor', 'middle')
            .text('Year');
            
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left)
            .attr('x', 0 - (modalHeight / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Temperature Anomaly (°C)');
            
        svg.append('text')
            .attr('x', modalWidth / 2)
            .attr('y', 0 - (this.margin.top / 2))
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold');
            
        svg.append('path')
            .datum(lineData)
            .attr('fill', 'none')
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 2)
            .attr('d', line);
            
        svg.selectAll('.dot')
            .data(lineData)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(new Date(d.year, 0, 1)))
            .attr('cy', d => yScale(d.value))
            .attr('r', 4)
            .attr('fill', '#e74c3c')
            .on('mouseover', (event, d) => {
                const tooltip = d3.select('#chart-tooltip');
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(formatTooltip(d, 'temperature'))
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                d3.select('#chart-tooltip').transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        
        // this.addTrendLine(svg, lineData, xScale, yScale, modalWidth, modalHeight);
    }
    
    addTrendLine(svg, data, xScale, yScale, width, height) {
        const n = data.length;
        const xSum = data.reduce((sum, d) => sum + d.year, 0);
        const ySum = data.reduce((sum, d) => sum + d.value, 0);
        const xySum = data.reduce((sum, d) => sum + (d.year * d.value), 0);
        const xSqSum = data.reduce((sum, d) => sum + (d.year * d.year), 0);
        
        const slope = (n * xySum - xSum * ySum) / (n * xSqSum - xSum * xSum);
        const intercept = (ySum - slope * xSum) / n;
        
        const firstYear = data[0].year;
        const lastYear = data[data.length - 1].year;
        
        const trendData = [
            { year: firstYear, value: slope * firstYear + intercept },
            { year: lastYear, value: slope * lastYear + intercept }
        ];
        
        const trendLine = d3.line()
            .x(d => xScale(new Date(d.year, 0, 1)))
            .y(d => yScale(d.value));
            
        svg.append('path')
            .datum(trendData)
            .attr('fill', 'none')
            .attr('stroke', '#3498db')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('d', trendLine);
            
        svg.append('text')
            .attr('x', xScale(new Date(lastYear, 0, 1)) - 10)
            .attr('y', yScale(slope * lastYear + intercept) - 10)
            .style('font-size', '12px')
            .style('fill', '#3498db')
            .text(`Trend: ${slope.toFixed(3)}°C/year`);
    }
}

export { TemperatureChart };
