const API_BASE_URL = 'http://localhost:5000';

function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getColorForValue(value, min, max) {
    if (min === max) return 'rgb(0, 255, 0)'; // Handle single value case
    const normalized = (value - min) / (max - min);
    const r = Math.floor(255 * normalized);
    const g = Math.floor(255 * (1 - normalized));
    return `rgb(${r},${g},0)`; // Removed spaces for consistency
}


async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data from', endpoint, error);
        return null;
    }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function formatTooltip(data, metric) {
    let value = data.value;
    let unit = '';

    switch (metric) {
        case 'temperature':
            value = data.value.toFixed(2);
            unit = '°C';
            break;
        case 'co2':
            unit = 'Mt CO₂e';
            break;
        case 'renewable':
            unit = '%';
            break;
        case 'forest':
            unit = '% of land area';
            break;
        case 'air_pollution':
            unit = 'µg/m³';
            break;
    }

    return `
        <div class="tooltip-content">
            <strong>${data.year}</strong><br>
            ${metric}: <strong>${value}${unit}</strong>
        </div>
    `;
}

export { formatNumber, getColorForValue, fetchData, debounce, formatTooltip };
