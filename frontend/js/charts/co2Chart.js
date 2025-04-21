import { fetchData, formatTooltip } from '../utils/helpers.js';

class CO2Chart {
    constructor(container) {
        this.container = container;
        this.modalContainer = document.getElementById('modalChartContainer');

        this.margin = { top: 60, right: 180, bottom: 50, left: 50 };
        this.width = 600 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;
        this.data = null;
        this.changeText = document.getElementById('change-trend');
        this.changeText.text = "Hello";
        
        this.init();
    }
    
    async init() {
        this.data = await fetchData('/api/nasa/carbon-dioxide');
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
            .text('CO₂ Emissions (ppm)');
            
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
            .attr('fill', '#2c3e50')
            .on('mouseover', (event, d) => {
                const tooltip = d3.select('#chart-tooltip');
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(formatTooltip(d, 'emissions'))
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

        const svg = d3.select(this.modalContainer)
            .append('svg')
            .attr('width', modalWidth + this.margin.left + this.margin.right - 50)
            .attr('height', modalHeight + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        try {
            const countries = await fetchData('/api/countries');
            countries.forEach(country => {
                countryDropdown.append('option')
                    .attr('value', country)
                    .text(country);
            });
    
            // Set up an event listener for the dropdown
            countryDropdown.on('change', async () => {
                const selectedCountry = countryDropdown.node().value;
                const metric = 'co2';
                const url = `/api/wb/country?country=${selectedCountry}&metric=${metric}`;
                const countryData = await fetchData(url);
                if (!countryData) return;
                this.updateModalChart(svg, countryData.years, countryData.values, modalWidth, modalHeight);
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

    updateModalChart(svg, years, values, width, height) {
        svg.selectAll('*').remove();
        this.changeText.innerText = `The growth of the emissions ppm value from ${years[0]} till ${years[years.length - 1]} is ${values[values.length - 1] - values[0]}`;
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
            .text('CO₂ Emissions (ppm)');
    
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
                tooltip.html(formatTooltip(d, 'emissions'))
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

export { CO2Chart };
