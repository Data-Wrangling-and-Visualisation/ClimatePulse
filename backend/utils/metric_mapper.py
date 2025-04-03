METRIC_MAP = {
    'co2': 'Carbon dioxide (CO2) emissions (total) excluding LULUCF (Mt CO2e)',
    'renewable': 'Renewable energy consumption (% of total final energy consumption)',
    'forest': 'Forest area (% of land area)',
    'air_pollution': 'PM2.5 air pollution, mean annual exposure (micrograms per cubic meter)'
}

def get_metric_name(key):
    return METRIC_MAP.get(key.lower(), key)

def get_available_metrics():
    return [{'key': k, 'name': v} for k, v in METRIC_MAP.items()]