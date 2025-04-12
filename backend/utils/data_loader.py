import json
from backend.config.get_path import get_nasa_data_path, get_worldbank_data_path, get_country_data_path
from backend.utils.metric_mapper import get_metric_name, get_metric_key


class ClimateDataLoader:
    def __init__(self):
        self.nasa_path = get_nasa_data_path()
        self.wb_path = get_worldbank_data_path()
        self.country_path = get_country_data_path()
        self.load_nasa_data()
        self.load_worldbank_data()
        self.load_country_metadata()
        
    def load_nasa_data(self):
        with open(self.nasa_path) as f:
            data = json.load(f)
        self.nasa_data = {
            'temperature': data.get('global-temperature', {}),
            'ocean_warming': data.get('ocean-warming', {}),
            'methane': data.get('methane', {}), 
            'co2': data.get('carbon-dioxide', {}),
            'sea_level': data.get('sea-level', {}),
            'arctic_sea_ice': data.get('arctic-sea-ice', {}), 
        }
    
    # def _process_nasa_metric(self, data, metric):
    #     return [{'year': year, 'value': val} for year, val in data.get(metric, {}).items()]
    # {'metric':[{'year':'', 'value':''},{},{},...], ...}
    # global parameters
    
    def load_worldbank_data(self):
        with open(self.wb_path) as f:
            data = json.load(f)
        self.wb_data = data

        country_centric = {}
        metric_centric = {}
        for entry in data:
            country = entry['country']
            metric = entry['meaning']
            metric = get_metric_key(metric)
            year = entry['year']
            value = entry['value']
            
            if country and country not in country_centric:
                country_centric[country] = {}
            
            if metric and metric not in country_centric[country]:
                country_centric[country][metric] = {}

            if metric and metric not in metric_centric:
                metric_centric[metric] = {}
            
            if country and country not in metric_centric[metric]:
                metric_centric[metric][country] = {}

            metric_centric[metric][country][year] = value
            country_centric[country][metric][year] = value
        
        self.wb_metric_data = metric_centric
        self.wb_country_data = country_centric
        return data
    # [{'country':'US', 'year' : '', 'meaning' : 'some metric, convert to...', 'value' : float}, {}, {}, ...]
    
    def load_country_metadata(self):
        with open(self.country_path) as f:
            data = json.load(f)
        self.country_metadata = data
        
# data getters ========================================================================
    def get_global_data_by_metric(self, metric) -> tuple[list[float], list[float]]:
        temp_data = self.nasa_data.get(metric, {})
        years = sorted(temp_data.keys())
        vals = [round(temp_data[str(year)], 2) for year in years]
        years = list(map(float, years))
        return years, vals

    
    def get_local_data_by_country(self, country, metric=False):
        if metric:
            temp = self.wb_country_data[country][metric]
            years = sorted(temp.keys())
            vals = [temp[year] for year in years]
            years = list(map(float, years))
            return years, vals
        
        return self.wb_country_data[country]

    def get_local_data_by_metric(self, metric, country=False):
        if country:
            temp = self.wb_metric_data[metric][country]
            years = sorted(temp.keys())
            vals = [temp[year] for year in years]
            years = list(map(float, years))
            return years, vals
        
        return self.wb_metric_data[metric]

dl = ClimateDataLoader()
t = dl.get_local_data_by_metric('renewable')
print(t)