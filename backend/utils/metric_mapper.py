METRIC_MAP = {
    'co2'          : 'Carbon dioxide (CO2) emissions (total) excluding LULUCF (Mt CO2e)',
    'renewable'    : 'Renewable energy consumption (% of total final energy consumption)',
    'forest'       : 'Forest area (% of land area)',
    'air_pollution': 'PM2.5 air pollution, mean annual exposure (micrograms per cubic meter)'
}

METRIC_MAP_INV = {
    'Carbon dioxide (CO2) emissions (total) excluding LULUCF (Mt CO2e)'      : 'co2',
    'Renewable energy consumption (% of total final energy consumption)'     : 'renewable',
    'Forest area (% of land area)'                                           : 'forest',
    'PM2.5 air pollution, mean annual exposure (micrograms per cubic meter)' : 'air_pollution'
}

NASA_MAP = {
    'co2'           : 'carbon-dioxide',
    'methane'       : 'methane',
    'temperature'   : 'global-temperature',
    'ocean_warming' : 'ocean-warming',
    'sea_level'     : 'sea-level',
    'arctic_sea_ice': 'arctic-sea-ice',
}

def get_metric_name(key):
    return METRIC_MAP.get(key.lower(), key)

def get_metric_key(name):
    return METRIC_MAP_INV.get(name, name)

def get_nasa_metric_name(key):
    return NASA_MAP.get(key.lower(), key)

def get_available_metrics():
    return [{'key': k, 'name': v} for k, v in METRIC_MAP.items()]