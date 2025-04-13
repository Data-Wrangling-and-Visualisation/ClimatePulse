# Global Climate Change Insights: An Interactive Visualization of Environmental Data

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
  - **NOAA:** Natural disaster frequency and intensity (e.g., hurricanes, wildfires).  
- **Secondary Source:**  
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

#### Panel 1 (Three.js):  
1. **3D Globe:**  
   - Displays temperature anomalies and CO2 levels by country.  
   - Features: Zoom, hover tooltips, time slider.  
2. **3D Bar Chart:**  
   - Top 10 CO2-emitting countries with bars in 3D space.  
3. **3D Heatmap:**  
   - Overlay of natural disaster hotspots (toggle by disaster type).  

#### Panel 2 (D3.js):  
1. **Line Chart:** Global temperature anomalies over time (zoom/pan).  
2. **Scatter Plot:** Correlation between CO2 emissions and temperature.  
3. **Bar Chart:** Natural disaster frequency by type/region.  

### Interactive Features  
- **Linked Charts:** Selecting a country on the 3D globe updates D3.js charts.  
- **Filtering:** By year, region, or variable.  
- **Animations:** Smooth transitions during updates.  
