import { fetchData, formatTooltip } from '../utils/helpers.js';

class TemperatureChart {
    constructor(container) {
        this.container = container;
        this.modalContainer = document.getElementById('modalChartContainer');

        this.margin = { top: 60, right: 180, bottom: 50, left: 50 };
        this.width = 1180 - this.margin.left - this.margin.right;
        this.height = 520 - this.margin.top - this.margin.bottom;
        this.data = null;
        this.predictionData = null;
        this.changeText = document.getElementById("change-trend");
        
        this.init();
    }
    
    async init() {
        try {
            this.data = await fetchData('/api/nasa/global-temperature');
            console.log('Historical Data:', this.data); // Log historical data
    
            const nYears = 10;
            this.predictionData = await fetchData(`/api/predict/${nYears}`);
            console.log('Prediction Data:', this.predictionData); // Log prediction data
    
            if (!this.data || !this.predictionData) {
                console.error('Data fetching failed'); // Log if data fetching fails
                return;
            }
    
            this.renderChart();
        } catch (error) {
            console.error('Error fetching data:', error); // Log any errors
        }
    }
    
    renderChart() {
        d3.select(this.container).selectAll('*').remove();
    
        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right - 150)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
    
        // Process historical data
        const historicalYears = this.data.years.map(year => new Date(year, 0, 1));
        const historicalValues = this.data.values;
        const historicalLineData = historicalYears.map((year, i) => ({
            year: year.getFullYear(),
            value: historicalValues[i]
        }));
    
        // Process prediction data
        const predictionValues = this.predictionData['global-temperature'] || [];
        const lastHistoricalYear = historicalYears[historicalYears.length - 1].getFullYear();
        const predictionLineData = predictionValues.map((value, i) => ({
            year: lastHistoricalYear + i + 1, // Start from the year after the last historical year
            value: value
        }));
    
        console.log('Historical Line Data:', historicalLineData); // Log historical data
        console.log('Prediction Line Data:', predictionLineData); // Log prediction data
    
        // Combine data for scales
        const allYears = historicalYears.concat(predictionLineData.map(d => new Date(d.year, 0, 1)));
        const allValues = historicalValues.concat(predictionLineData.map(d => d.value));
    
        // Set scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(allYears))
            .range([0, this.width]);
    
        const yScale = d3.scaleLinear()
            .domain([d3.min(allValues) - 0.5, d3.max(allValues) + 0.5])
            .range([this.height, 0]);
    
        const line = d3.line()
            .x(d => xScale(new Date(d.year, 0, 1)))
            .y(d => yScale(d.value))
            .curve(d3.curveBasis);
    
        // Render axes
        svg.append('g')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(xScale).ticks(5));
    
        svg.append('g')
            .call(d3.axisLeft(yScale));
    
        // Render labels
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
    
        // Render historical data
        svg.append('path')
            .datum(historicalLineData)
            .attr('fill', 'none')
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 2)
            .attr('d', line);
    
        svg.selectAll('.historical-dot')
            .data(historicalLineData)
            .enter().append('circle')
            .attr('class', 'historical-dot')
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
    
        // Render predicted data
        svg.append('path')
            .datum(predictionLineData)
            .attr('fill', 'none')
            .attr('stroke', '#3498db')
            .attr('stroke-width', 2)
            .attr('d', line);
    
        svg.selectAll('.prediction-dot')
            .data(predictionLineData)
            .enter().append('circle')
            .attr('class', 'prediction-dot')
            .attr('cx', d => xScale(new Date(d.year, 0, 1)))
            .attr('cy', d => yScale(d.value))
            .attr('r', 3)
            .attr('fill', '#3498db')
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
    
    
    async renderModalContent() {
        d3.select(this.modalContainer).selectAll('*').remove();
        const modalWidth = 800;
        const modalHeight = 400;
        this.changeText.innerText = "The growth of average temperature for the last century: 1.42°C";
    
        const svg = d3.select(this.modalContainer)
            .append('svg')
            .attr('width', modalWidth + this.margin.left + this.margin.right - 50)
            .attr('height', modalHeight + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
    
        // Process historical data
        const historicalYears = this.data.years.map(year => new Date(year, 0, 1));
        const historicalValues = this.data.values;
        const historicalLineData = historicalYears.map((year, i) => ({
            year: year.getFullYear(),
            value: historicalValues[i]
        }));
    
        // Process prediction data
        const predictionValues = this.predictionData['global-temperature'] || [];
        const lastHistoricalYear = historicalYears[historicalYears.length - 1].getFullYear();
        const predictionLineData = predictionValues.map((value, i) => ({
            year: lastHistoricalYear + i + 1, // Start from the year after the last historical year
            value: value
        }));
    
        console.log('Historical Line Data:', historicalLineData); // Log historical data
        console.log('Prediction Line Data:', predictionLineData); // Log prediction data
    
        // Combine data for scales
        const allYears = historicalYears.concat(predictionLineData.map(d => new Date(d.year, 0, 1)));
        const allValues = historicalValues.concat(predictionLineData.map(d => d.value));
    
        // Set scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(allYears))
            .range([0, modalWidth]);
    
        const yScale = d3.scaleLinear()
            .domain([d3.min(allValues) - 0.5, d3.max(allValues) + 0.5])
            .range([modalHeight, 0]);
    
        const line = d3.line()
            .x(d => xScale(new Date(d.year, 0, 1)))
            .y(d => yScale(d.value))
            .curve(d3.curveBasis);
    
        // Render axes
        svg.append('g')
            .attr('transform', `translate(0, ${modalHeight})`)
            .call(d3.axisBottom(xScale).ticks(10));
    
        svg.append('g')
            .call(d3.axisLeft(yScale));
    
        // Render labels
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
    
        // Render historical data
        svg.append('path')
            .datum(historicalLineData)
            .attr('fill', 'none')
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 2)
            .attr('d', line);
    
        svg.selectAll('.historical-dot')
            .data(historicalLineData)
            .enter().append('circle')
            .attr('class', 'historical-dot')
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
    
        // Render predicted data
        svg.append('path')
            .datum(predictionLineData)
            .attr('fill', 'none')
            .attr('stroke', '#3498db')
            .attr('stroke-width', 2)
            .attr('d', line);
    
        svg.selectAll('.prediction-dot')
            .data(predictionLineData)
            .enter().append('circle')
            .attr('class', 'prediction-dot')
            .attr('cx', d => xScale(new Date(d.year, 0, 1)))
            .attr('cy', d => yScale(d.value))
            .attr('r', 4)
            .attr('fill', '#3498db')
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
