import { fetchData } from '../utils/helpers.js';

export class CombinedClimateChart {
    constructor(container) {
        this.container = container;
        this.margin = { top: 60, right: 350, bottom: 50, left: 50 };
        this.width = 1250 - this.margin.left - this.margin.right;
        this.height = 520 - this.margin.top - this.margin.bottom;
        this.data = null;

        // Define colors for each metric
        this.colors = {
            temperature: '#e74c3c', // Red
            co2: '#2c3e50',       // Dark Blue
            seaLevel: '#2ecc71',  // Green
            ice: '#3498db',       // Light Blue
            methane: '#f1c40f'    // Yellow
        };

        this.init();
    }

    async init() {
        try {
            // Fetch data for all metrics
            let [temperatureData, co2Data, seaLevelData, iceData, methaneData] = await Promise.all([
                fetchData('/api/nasa/global-temperature'),
                fetchData('/api/nasa/carbon-dioxide'),
                fetchData('/api/nasa/sea-level'),
                fetchData('/api/nasa/arctic-sea-ice'),
                fetchData('/api/nasa/methane')
            ]);
            temperatureData = this.filterDataFromYear(temperatureData, 1983);
            co2Data = this.filterDataFromYear(co2Data, 1983);
            seaLevelData = this.filterDataFromYear(seaLevelData, 1983);
            iceData = this.filterDataFromYear(iceData, 1983);
            methaneData = this.filterDataFromYear(methaneData, 1983);
            // Combine data into a single structure
            this.data = {
                temperature: temperatureData,
                co2: co2Data,
                seaLevel: seaLevelData,
                ice: iceData,
                methane: methaneData
            };
            this.normalizeData();

            // Render the chart
            this.renderChart();
        } catch (error) {
            console.error('Error initializing CombinedClimateChart:', error);
        }
    }

    filterDataFromYear(data, startYear) {
        if (!data || !Array.isArray(data.years) || !Array.isArray(data.values)) {
            throw new Error('Invalid data format');
        }
    
        // Filter years and values starting from the specified year
        const filteredYears = [];
        const filteredValues = [];
    
        data.years.forEach((year, index) => {
            if (year >= startYear && year <=2023) {
                filteredYears.push(year);
                filteredValues.push(data.values[index]);
            }
        });
    
        return {
            metric: data.metric,
            years: filteredYears,
            values: filteredValues
        };
    }

    normalizeData() {
        // Normalize values for each metric
        Object.keys(this.data).forEach(metric => {
            let metricValues = this.data[metric].values;
            let maxVal = Math.max(...metricValues);
            let minVal = Math.min(...metricValues);

            this.data[metric].values = this.data[metric].values.map(value =>
                (value - minVal) / (maxVal - minVal)
            );
        });
    }

    renderChart() {
        // Clear any existing content in the container
        d3.select(this.container).selectAll('*').remove();

        // Append SVG to the container
        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        // Scales
        const xScale = d3.scaleTime()
            .range([0, this.width]);

        const yScale = d3.scaleLinear()
            .range([this.height, 0])
            .domain([0,1]);

        // Extract years from one of the datasets (assuming all datasets share the same years)
        const years = this.data.temperature.years.map(year => new Date(year, 0, 1));
        xScale.domain(d3.extent(years));

        // Add axes
        svg.append('g')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(xScale).ticks(10));

        svg.append('g')
            .call(d3.axisLeft(yScale));

        // Add labels
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
            .text('Normalized values');

        // Draw lines and shaded areas for each metric
        Object.keys(this.data).forEach(metric => {
            const lineData = this.data[metric].years.map((year, i) => ({
                year: new Date(year, 0, 1),
                value: this.data[metric].values[i]
            }));

            const line = d3.line()
                .x(d => xScale(d.year))
                .y(d => yScale(d.value))
                .curve(d3.curveBasis);

            const area = d3.area()
                .x(d => xScale(d.year))
                .y0(this.height)
                .y1(d => yScale(d.value))
                .curve(d3.curveBasis);

            // Add shaded area
            svg.append('path')
                .datum(lineData)
                .attr('fill', this.colors[metric])
                .attr('fill-opacity', 0.3)
                .attr('d', area);

            // Add line
            svg.append('path')
                .datum(lineData)
                .attr('fill', 'none')
                .attr('stroke', this.colors[metric])
                .attr('stroke-width', 2)
                .attr('d', line);

            // Add dots
            svg.selectAll(`.dot-${metric}`)
                .data(lineData)
                .enter().append('circle')
                .attr('class', `dot-${metric}`)
                .attr('cx', d => xScale(d.year))
                .attr('cy', d => yScale(d.value))
                .attr('r', 3)
                .attr('fill', this.colors[metric]);
        });

        // Add legend
        const legend = svg.append('g')
            .attr('transform', `translate(${this.width +20}, 20)`);

        Object.keys(this.colors).forEach((metric, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);

            legendRow.append('rect')
                .attr('width', 10)
                .attr('height', 10)
                .attr('fill', this.colors[metric]);

            legendRow.append('text')
                .attr('x', 15)
                .attr('y', 10)
                .text(metric.charAt(0).toUpperCase() + metric.slice(1));
        });
    }
}
