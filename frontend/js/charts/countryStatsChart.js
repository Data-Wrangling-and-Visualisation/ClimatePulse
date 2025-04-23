import { fetchData, formatTooltip } from '../utils/helpers.js';

class CountryStatsChart {
    constructor(container) {
        this.container = container;
        this.modalContainer = document.getElementById('modalChartContainer');

        this.margin = { top: 60, right: 180, bottom: 50, left: 50 };
        this.width = 600 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;
        this.data = null;
        this.changeText = document.getElementById('change-trend');
        
        this.init();
    }
    
    async init() {
        this.data = await fetchData('/api/nasa');
        if (!this.data) return;
        this.renderChart();
        this.setupEventListeners();
    }
    
    renderChart() {
    }
    
    setupEventListeners() {
        const controls = d3.select(this.container).node().parentNode;
        const controlDiv = d3.select(controls).insert('div', ':first-child')
            .attr('class', 'chart-controls');
    }
    
    async renderModalContent() {
        d3.select(this.modalContainer).selectAll('*').remove();
        const modalWidth =  800;
        const modalHeight = 300;

        const controlsDiv = d3.select(this.modalContainer)
            .append('div')
            .attr('class', 'modal-controls');

        controlsDiv.append('label')
            .text('Select Country: ');

        const countryDropdown = controlsDiv.append('select')
            .attr('id', 'country-selector');
        controlsDiv.append('br');

        controlsDiv.append('label')
            .attr('style', 'margin-top: 20px;')
            .text('Select Metric: ');
    
        const metricDropdown = controlsDiv.append('select')
            .attr('id', 'metric-selector');

        const svg = d3.select(this.modalContainer)
            .append('svg')
            .attr('width', modalWidth + this.margin.left + this.margin.right - 50)
            .attr('height', modalHeight + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        try {
            const countries = await fetchData('/api/countries');
            const metrics = ['co2', 'renewable', 'forest', 'air_pollution'];
            countries.forEach(country => {
                countryDropdown.append('option')
                    .attr('value', country)
                    .text(country);
            });
            metrics.forEach(metric => {
                metricDropdown.append('option')
                    .attr('value', metric)
                    .text(metric.toUpperCase());
            });
    
            // Set up an event listener for the dropdown
            // let selectedCountry;
            // let selectedMetric;
            countryDropdown.on('change', async () => {
                const selectedCountry = countryDropdown.node().value;
                const selectedMetric = metricDropdown.node().value;

                const url = `/api/wb/country?country=${selectedCountry}&metric=${selectedMetric}`;
                const countryData = await fetchData(url);
                if (!countryData) return;
                this.updateModalChart(svg, countryData.years, countryData.values, modalWidth, modalHeight, selectedMetric);
            });
            metricDropdown.on('change', async () => {
                const selectedCountry = countryDropdown.node().value;
                const selectedMetric = metricDropdown.node().value;

                const url = `/api/wb/country?country=${selectedCountry}&metric=${selectedMetric}`;
                const countryData = await fetchData(url);
                if (!countryData) return;
                this.updateModalChart(svg, countryData.years, countryData.values, modalWidth, modalHeight, selectedMetric);
            });
    
            const initialCountry = countries[0];
            const initialMetric = 'co2';
            const initialUrl = `/api/wb/country?country=${initialCountry}&metric=${initialMetric}`;
            const initialData = await fetchData(initialUrl);
    
            if (initialData) {
                this.updateModalChart(svg, initialData.years, initialData.values, modalWidth, modalHeight);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }        
    }

    updateModalChart(svg, years, values, width, height, metric) {
        svg.selectAll('*').remove();
        let textPlaceholder;
        let yAxisText;
        let toolText;
        console.log(metric);
        if (metric == 'air_pollution') {
            textPlaceholder = 'The growth of air pollution (micrograms per cubic meter)';
            yAxisText = 'Air pollution (mcg per m^3)';
            toolText = 'Pollution: ';
        } else if (metric == 'renewable') {
            textPlaceholder = 'The growth of percentage of renewable energy';
            yAxisText = 'Percent of renewable energy';
            toolText = 'Renewable energy percent: ';
        } else if (metric == 'forest') {
            textPlaceholder = 'The growth of forest area';
            yAxisText = 'Forest area (km²)';
            toolText = 'km²: ';
        } else {
            textPlaceholder = 'The growth of the emissions ppm value';
            yAxisText = 'CO₂ Emissions (ppm)';
            toolText = 'PPM: ';
        }

        this.changeText.innerText = `${textPlaceholder} from ${years[0]} till ${years[years.length - 1]} is ${values[values.length - 1] - values[0]}`;
        const xScale = d3.scaleTime()
            .domain(d3.extent(years.map(year => new Date(year, 0, 1))))
            .range([0, width]);
    
        const yScale = d3.scaleLinear()
            .domain([d3.min(values) - 0.5, d3.max(values) + 0.5])
            .range([height, 0]);
    
        const line = d3.line()
            .x(d => xScale(new Date(d.year, 0, 1)))
            .y(d => yScale(d.value))
            .curve(d3.curveBasis);
    
        const lineData = years.map((year, i) => ({
            year: year,
            value: values[i]
        }));
    
        // Add axes
        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).ticks(10));
    
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
            .text(yAxisText);
    
        // Draw the line and dots
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
            .attr('fill', '#2c3e50')
            .on('mouseover', (event, d) => {
                const tooltip = d3.select('#chart-tooltip');
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(formatTooltip(d, toolText))
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

export { CountryStatsChart };
