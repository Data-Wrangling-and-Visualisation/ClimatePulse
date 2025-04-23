import json
from config.get_path import get_worldbank_csv_data_path, get_nasa_data_path, get_worldbank_data_path, get_country_data_path
from utils.metric_mapper import get_metric_name, get_metric_key, get_nasa_metric_name, get_available_metrics
from utils.train import predict_metrics
import pandas as pd

class ClimateDataLoader:
    def __init__(self):
        self.nasa_path = get_nasa_data_path()
        self.wb_path = get_worldbank_data_path()
        self.wb_csv_path = get_worldbank_csv_data_path()
        self.country_path = get_country_data_path()
        self.load_nasa_data()
        self.load_worldbank_data()
        self.load_country_metadata()
        
    def load_nasa_data(self):
        with open(self.nasa_path) as f:
            data = json.load(f)
        self.nasa_data = {
            'global-temperature': data.get('global-temperature', {}),
            'ocean-warming': data.get('ocean-warming', {}),
            'methane': data.get('methane', {}), 
            'carbon-dioxide': data.get('carbon-dioxide', {}),
            'sea-level': data.get('sea-level', {}),
            'arctic-sea-ice': data.get('arctic-sea-ice', {}), 
        }
    
    def load_worldbank_data(self):
        with open(self.wb_path) as f:
            self.wb_raw_data = json.load(f)
        
        self.wb_country_data = {}
        self.wb_metric_data = {}
        
        for entry in self.wb_raw_data:
            country = entry['country']
            metric = get_metric_key(entry['meaning'])
            year = entry['year']
            value = float(entry['value']) if entry['value'] else None
            
            if value is None:
                continue
                
            if country not in self.wb_country_data:
                self.wb_country_data[country] = {}
            if metric not in self.wb_country_data[country]:
                self.wb_country_data[country][metric] = {}
            self.wb_country_data[country][metric][year] = value
            
            if metric not in self.wb_metric_data:
                self.wb_metric_data[metric] = {}
            if country not in self.wb_metric_data[metric]:
                self.wb_metric_data[metric][country] = {}
            self.wb_metric_data[metric][country][year] = value
            
    def load_country_metadata(self):
        with open(self.country_path) as f:
            raw_data = json.load(f)

        self.country_metadata = {
            country['name']: {
                'id': country['id'],
                'code': country['iso2Code'],
                'longitude': float(country['longitude']),
                'latitude': float(country['latitude']),
                'region': country.get('region', {}).get('value', 'Unknown'),
                'capital': country.get('capitalCity', 'Unknown')
            }
            for country in raw_data[0] if country['name'] and country['longitude'] and country['latitude']
        }
        return self.country_metadata

    def load_predict_metrics(self, n_years):
        with open(self.nasa_path, 'r') as f:
            data = json.load(f)

        rows = []
        for metric, year_values in data.items():
            for year_str, value in year_values.items():
                rows.append({
                    'metric': metric,
                    'year': float(year_str),
                    'value': float(value)
                })
        predictions = predict_metrics(int(n_years), rows)
        self.predictions = predictions

# data getters ========================================================================
    def get_global_data_by_metric(self, metric):
        metric_key = get_nasa_metric_name(metric)
        data = self.nasa_data.get(metric_key, {})

        years = [int(float(year)) for year in data.keys()]
        values = list(data.values())

        sorted_years_values = sorted(zip(years, values))
        sorted_years, sorted_values = zip(*sorted_years_values)

        return list(sorted_years), list(sorted_values)

    def get_local_data_by_country(self, country, metric=None):
        if country not in self.wb_country_data:
            return None if metric else {}
            
        if metric:
            metric_key = get_metric_key(metric)
            if metric_key not in self.wb_country_data[country]:
                return None, None
                
            years = sorted(self.wb_country_data[country][metric_key].keys())
            values = [self.wb_country_data[country][metric_key][year] for year in years]
            return years, values
        
        return self.wb_country_data[country]

    def get_local_data_by_metric(self, metric, country=None):
        metric_key = get_metric_key(metric)
        if metric_key not in self.wb_metric_data:
            return None if country else {}
            
        if country:
            if country not in self.wb_metric_data[metric_key]:
                return None, None
                
            years = sorted(self.wb_metric_data[metric_key][country].keys())
            values = [self.wb_metric_data[metric_key][country][year] for year in years]
            return years, values
        
        return self.wb_metric_data[metric_key]

    def get_country_names(self):
        return list(self.wb_country_data.keys())
    

    def get_top_countries_by_metric(self, metric, limit=10, ascending=False):
        metric_key = get_metric_key(metric)
        if metric_key not in self.wb_metric_data:
            return []
        
        country_avgs = []
        for country, years_data in self.wb_metric_data[metric_key].items():
            values = list(years_data.values())
            if values:
                avg = sum(values) / len(values)
                country_avgs.append((country, avg))
        
        country_avgs.sort(key=lambda x: x[1], reverse=not ascending)
        
        return [
            {
                'country': country,
                'value': avg,
                'metadata': self.country_metadata.get(country, {})
            }
            for country, avg in country_avgs[:limit]
        ]

    def get_predictions(self, n_years):
        self.load_predict_metrics(n_years)
        return self.predictions
    
    def get_forest_data(self, year):
        # path = '/app/data'
        # wb_csv = pd.read_csv(path + '/worldbank_data.csv')

        with open(self.wb_csv_path) as f:
            self.wb_csv_raw_data = pd.read_csv(f)


        wb_csv = self.wb_csv_raw_data
        # wb_csv = wb_csv[wb_csv['year'] >= 2000]
        # wb_csv = wb_csv[wb_csv['year'] <= 2021]
        wb_csv = wb_csv[wb_csv['year'] == int(year)]

        wb_csv = wb_csv[~wb_csv['country'].isin(['Curacao', 'Gibraltar', 'Hong Kong SAR, China', 
                                                'Macao SAR, China', 'Montenegro', 'Serbia', 'South Sudan', 
                                                'Sudan', 'Sint Maarten (Dutch part)', 'Liechtenstein', 'Isle of Man', 
                                                'Channel Islands', 'Andorra', 'Monaco', 'San Marino', 'St. Martin (French part)',
                                                'West Bank and Gaza', 'Aruba', 'British Virgin Islands', 'Cayman Islands',
                                                'Channel Islands', 'Faroe Islands', 'French Polynesia', 'New Caledonia',
                                                'Turks and Caicos Islands'])]
        unique_countries = wb_csv['country'].unique()
        print('!'*100, wb_csv.isna().sum())

        with open(self.country_path) as f:
            countries_data = json.load(f)[0]
        country_coords = {}
        for country in countries_data:
            if country['name'] in unique_countries:
                try:
                    country_coords[country['name']] = [
                        float(country['latitude']),
                        float(country['longitude'])
                    ]
                except (ValueError, KeyError):
                    continue

        for col in ['carbon_dioxide', 'forests_ratio', 'air_pollution']:
            min_val = wb_csv[col].min()
            max_val = wb_csv[col].max()
            wb_csv[col] = (wb_csv[col] - min_val) / (max_val - min_val)
        
        result = []
        for _, row in wb_csv.iterrows():
            country_name = row['country']
            if country_name in country_coords:
                result.append({
                    "country": country_name,
                    "co2_emissions": round(row['carbon_dioxide'], 3),
                    "forest_area": round(row['forests_ratio'], 3),
                    "air_pollution": round(row['air_pollution'], 3),
                    "coordinates": country_coords[country_name]
                })
        return result
    