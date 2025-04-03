import json
from config.get_path import get_nasa_data_path, get_worldbank_data_path, get_country_data_path

class ClimateDataLoader:
    def __init__(self):
        self.nasa_path = get_nasa_data_path()
        self.wb_path = get_worldbank_data_path()
        self.country_path = get_country_data_path()
        
    def load_nasa_data(self):
        with open(self.nasa_path) as f:
            data = json.load(f)
        return {
            'temperature': self._process_nasa_metric(data, 'global-temperature'),
            'ocean_warming': self._process_nasa_metric(data, 'ocean-warming'),
            'methane': self._process_nasa_metric(data, 'methane'),
            'co2': self._process_nasa_metric(data, 'carbon-dioxide'),
            'sea_level': self._process_nasa_metric(data, 'sea-level'),
            'arctic_sea_ice': self._process_nasa_metric(data, 'arctic-sea-ice')
        }
    
    def _process_nasa_metric(self, data, metric):
        return [{'year': year, 'value': val} for year, val in data.get(metric, {}).items()]
    
    def load_worldbank_data(self):
        with open(self.wb_path) as f:
            return json.load(f)
    
    def load_country_metadata(self):
        with open(self.country_path) as f:
            return json.load(f)
