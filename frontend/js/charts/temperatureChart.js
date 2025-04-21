import { fetchData, formatTooltip } from '../utils/helpers.js';

class TemperatureChart {
    constructor(container) {
        this.container = container;
        this.modalContainer = document.getElementById('modalChartContainer');

        this.margin = { top: 60, right: 180, bottom: 50, left: 50 };
        this.width = 600 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;
        this.data = null;
        this.changeText = document.getElementById("change-trend");
        
        this.init();
    }
    
    async init() {
        this.data = await fetchData('/api/nasa/global-temperature');
        if (!this.data) return;
        this.renderChart();
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
    
    
    renderModalContent() {
        d3.select(this.modalContainer).selectAll('*').remove();
        const modalWidth =  800;
        const modalHeight = 400;
        this.changeText.innerText = "The growth of average temperature for the last century: 1.42°C";


        const svg = d3.select(this.modalContainer)
            .append('svg')
            .attr('width', modalWidth + this.margin.left + this.margin.right - 50)
            .attr('height', modalHeight + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
        
        const years = this.data.years.map(year => new Date(year, 0, 1));
        const values = this.data.values;
        
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
            .attr('transform', `translate(${modalWidth / 2}, ${modalHeight + this.margin.bottom - 15})`)
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
                    .style('top', (event.pageY - 28) + 'px')
                    .style('z-index', 10000);
            })
            .on('mouseout', () => {
                d3.select('#chart-tooltip').transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        
    }
}

export { TemperatureChart };
