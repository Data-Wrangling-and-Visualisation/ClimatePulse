import { fetchData, formatTooltip } from '../utils/helpers.js';

class RenewableEnergyChart {
    constructor(container) {
        this.container = container;
        this.modalContainer = document.getElementById('modalChartContainer');

        this.margin = { top: 60, right: 180, bottom: 100, left: 50 };
        this.width = 600 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;
        this.data = null;
        this.changeText = document.getElementById("change-trend");
        
        this.init();
    }
    
    async init() {
        this.data = await fetchData(`/api/top/${'renewable'}?limit=10`);
        console.log(this.data);
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
        
        const countries = this.data.map(d => d.country);
        const values = this.data.map(d => d.value);
        const colorScale = d3.scaleOrdinal()
            .domain(countries)
            .range(d3.schemeCategory10);

        
        const x = d3.scaleBand()
            .domain(countries)
            .range([0, this.width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(values)])
            .range([this.height, 0]);
        
        svg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .attr("dy", "0")  // Adjust vertical position of rotated labels
            .attr("dx", "-0.5em");
        
        svg.append("g")
            .call(d3.axisLeft(y));
        
        // Add axis labels
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", this.width / 2)
            .attr("y", this.height + this.margin.bottom - 10)
            .style("text-anchor", "middle")
            .text("Country");
        
        
        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.height / 2)
            .attr("y", -this.margin.left + 15)
            .style("text-anchor", "middle")
            .text("Value");
        
        // Create bars
        svg.selectAll(".bar")
            .data(this.data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("fill", d => colorScale(d.country))
            .attr("x", d => x(d.country))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => this.height - y(d.value))
            .append("title")
            .text(d => `${d.country}: ${d.value.toFixed(2)}`);
        
    }
    
    
    renderModalContent() {
        d3.select(this.modalContainer).selectAll('*').remove();
        const modalWidth =  800;
        const modalHeight = 400;
        this.changeText.innerText = '';


        const svg = d3.select(this.modalContainer)
            .append('svg')
            .attr('width', modalWidth + this.margin.left + this.margin.right - 50)
            .attr('height', modalHeight + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
    
        const countries = this.data.map(d => d.country);
        const values = this.data.map(d => d.value);
        const colorScale = d3.scaleOrdinal()
            .domain(countries)
            .range(d3.schemeCategory10);

        
        const x = d3.scaleBand()
            .domain(countries)
            .range([0, modalWidth])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(values)])
            .range([modalHeight, 0]);
        
        svg.append("g")
            .attr("transform", `translate(0,${modalHeight})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .attr("dy", "0")  // Adjust vertical position of rotated labels
            .attr("dx", "-0.5em");
        
        svg.append("g")
            .call(d3.axisLeft(y));
        
        // Add axis labels
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", modalWidth / 2)
            .attr("y", modalHeight + this.margin.bottom)
            .style("text-anchor", "middle")
            .text("Country");
        
        
        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -modalHeight / 2)
            .attr("y", -this.margin.left + 15)
            .style("text-anchor", "middle")
            .text("Value");
        
        // Create bars
        svg.selectAll(".bar")
            .data(this.data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("fill", d => colorScale(d.country))
            .attr("x", d => x(d.country))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => modalHeight - y(d.value))
            .append("title")
            .text(d => `${d.country}: ${d.value.toFixed(2)}`);        
    }
}

export { RenewableEnergyChart };
