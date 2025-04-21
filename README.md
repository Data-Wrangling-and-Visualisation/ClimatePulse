# Global Climate Change Insights: An Interactive Visualization of Environmental Data

## Repository Structure
See the structure [here](./checkpoints/repository_structure.md)

## Run the app
To tun the app you can simple clone our repository and run ``docker-compose up --build`` from the root directory. After containers are ready the page is available on the ``localhost:8080``.

## Visualizations

![](./checkpoints/pictures/temp_co2_charts.jpg)

![](./checkpoints/pictures/country_renew_charts.jpg)

![](./checkpoints/pictures/country_chart_openes.jpg)

![](./checkpoints/pictures/globe_final.jpg)


## Project Description

### Goal  
The goal of this project is to create an interactive web application that visualizes global climate change data, enabling users to explore trends, correlations, and impacts of environmental factors such as temperature, carbon emissions, and natural disasters over time.

### Vision  
The application will tell the story of how climate change has evolved globally, highlighting key trends and anomalies. It will help users understand the relationship between human activities (e.g., CO2 emissions) and environmental changes (e.g., rising temperatures, melting ice caps).

### Target Audience  
- **General Public:** To raise awareness about climate change.  
- **Researchers and Students:** To explore and analyze climate data.  
- **Policy Makers:** To understand trends and make data-driven decisions.  

### Key Questions for Users  
1. How have global temperatures changed over the past century?  
2. What is the correlation between CO2 emissions and temperature rise?  
3. How have natural disasters (e.g., wildfires, hurricanes) increased over time?  
4. Which countries contribute the most to global emissions?  

---

## Dataset Description

### Data Sources  
- **Primary Sources:**  
  - **NASA:** Historical temperature records, CO2 levels, and sea level rise.  
  - **World Bank Open Data:** Country-specific emissions and economic indicators.  

### Dataset Overview  
- **Variables:** Temperature anomalies, CO2 levels, sea level rise, natural disaster frequency, country-specific emissions, GDP.  
- **Time Period:** 1900–2023.  
- **Geographic Coverage:** Global (country-level granularity where possible).  
- **Size:** ~10,000–20,000 records after preprocessing.  

---

## Visualization Layout

### Architecture  
1. **Data Pipeline:**  
   - **Scraping:** Collect data using Scrapy (NASA, NOAA, World Bank).  
   - **Cleaning/Preprocessing:** Pandas for handling missing values and restructuring.  
   - **Exploration:** Matplotlib for EDA.  
   - **Delivery:** Flask API to serve processed JSON data.  
   - **Visualization:** Interactive panels built with Three.js and D3.js.  

### Proposed Visualizations  

1. The Temperature Warming over the World plot.
2. CO2 emissions plots: 1st plot - linechart with average global temperature growth, 2nd plot - linechart for a distinct country (option to choose a country) + shadowed kde plot of CO2 intercecting with shadowed kde plot of global temperature (they will intersect a lot to demonstred the correlation) 
3. Global Statictics: the plot with ALL available metrics from both datasets per each country. The user must choose the country first, and then the plot will show him all metrics for the chosen country (yearly temperature, air pollution, percent of forests, etc.). + short summary (the co2 grows, air pollution grows, etc.) compute it after the plot generation
4. Renewable Energy plots to see top countries: bar chart showing top 10 countries by renewable energy usage over the past 10 years. The user also can switch to the worst countries in this field, or check the value (average over last 10 year) of renewable energy ratio in his country.
5. 3D globe which is covered with world countries map. Each country should be colored with different shades depending on how many CO2 emissions it produces. Hovering them we can see the exact value.

### Interactive Features  
- **Interactive Charts:** Points hovering allows to see more detailed information.
- **Filtering:** By year, region, or variable.  
- **Animations:** Smooth transitions during updates.  
