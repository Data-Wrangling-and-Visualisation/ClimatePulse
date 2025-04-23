import { fetchData, formatTooltip } from '../utils/helpers.js';

class PredictionChart {
    constructor(container) {
        this.container = container;
        this.modalContainer = document.getElementById('modalChartContainer');
        this.margin = { top: 60, right: 180, bottom: 50, left: 50 };
        this.width = 600 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;
        this.data = null;

        this.init();
    }

    async init() {
        this.renderChart();
    }

    renderChart() {
        // Clear any existing content in the container
        d3.select(this.container).selectAll('*').remove();

        // Add a placeholder text that acts as a clickable trigger
        const placeholderText = d3.select(this.container)
            .append('div')
            .attr('class', 'chart-placeholder-text')
            .style('cursor', 'pointer')
            .style('text-align', 'center')
            .style('font-size', '18px')
            .style('color', '#2c3e50')
            .style('margin-top', '50px');

        // Add a click event listener to open the modal
        placeholderText.on('click', () => {
            document.getElementById('chartModal').style.display = 'block';
            this.renderModalContent();
        });
    }

    async renderModalContent() {
        console.log('!!!');
        d3.select(this.modalContainer).selectAll('*').remove();
        const modalWidth = 800;
        const modalHeight = 400;

        try {
            // Fetch prediction data for the next 50 years
            const nYears = 10; // You can adjust this value or make it configurable
            const url = `/api/predict/${nYears}`;
            const predictionDataAll = await fetchData(url);

            const predictionData = predictionDataAll['global-temperature'] || [];
            if (!predictionData || !Array.isArray(predictionData)) return;

            // Extract years and values from the prediction data
            const years = Array.from({ length: nYears }, (_, i) => 2024 + i);
            const values = predictionData;

            // Render the prediction chart
            this.updateModalChart(years, values, modalWidth, modalHeight);
        } catch (error) {
            console.error('Error fetching prediction data:', error);
        }
    }

    updateModalChart(years, values, width, height) {

        const validData = years.map((year, i) => ({
            year: year,
            value: values[i]
        })).filter(d => !isNaN(d.value));

        // Check if validData is empty
        if (validData.length === 0) {
            console.error('No valid data available for rendering the chart.');
            return;
        }

        // Append an SVG element to the modal container
        const svg = d3.select(this.modalContainer)
            .append('svg')
            .attr('width', width + this.margin.left + this.margin.right)
            .attr('height', height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        // Define scales
        const xScale = d3.scaleLinear()
            .domain([d3.min(years), d3.max(years)])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(values) - 0.5, d3.max(values) + 0.5])
            .nice()
            .range([height, 0]);

        // Add axes
        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).ticks(validData.length).tickFormat(d3.format('d')));

        svg.append('g')
            .call(d3.axisLeft(yScale));

        // Add labels
        svg.append('text')
            .attr('transform', `translate(${width / 2}, ${height + this.margin.bottom - 5})`)
            .style('text-anchor', 'middle')
            .text('Year');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Predicted Value');

        // Draw the line
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value))
            .curve(d3.curveBasis);

        const lineData = years.map((year, i) => ({
            year: year,
            value: values[i]
        }));

        svg.append('path')
            .datum(lineData)
            .attr('fill', 'none')
            .attr('stroke', '#f39c12') // Orange color for predictions
            .attr('stroke-width', 2)
            .attr('d', line);

        // Add dots
        svg.selectAll('.dot')
            .data(lineData)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.year))
            .attr('cy', d => yScale(d.value))
            .attr('r', 4)
            .attr('fill', '#f39c12')
            .on('mouseover', (event, d) => {
                const tooltip = d3.select('#chart-tooltip');
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(formatTooltip(d, 'prediction'))
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

export { PredictionChart };