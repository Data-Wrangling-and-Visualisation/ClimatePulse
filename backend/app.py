from flask import Flask, jsonify, request
from flask_cors import CORS
from utils.data_loader import ClimateDataLoader
from utils.metric_mapper import get_metric_name, get_available_metrics

app = Flask(__name__)
CORS(app)
loader = ClimateDataLoader()

@app.route('/api/metrics', methods=['GET'])
def list_metrics():
    return jsonify({
        'metrics': get_available_metrics(),
        'default': 'co2'
    })

@app.route('/api/nasa', methods=['GET'])
def nasa_data():
    return jsonify(loader.load_nasa_data())

@app.route('/api/countries', methods=['GET'])
def country_list():
    return jsonify(loader.load_country_metadata())

@app.route('/api/top/<metric_key>', methods=['GET'])
def top_countries(metric_key):
    metric = get_metric_name(metric_key)
    ascending = request.args.get('ascending', 'false') == 'true'
    limit = int(request.args.get('limit', 10))
    
    data = loader.load_worldbank_data()
    filtered = [d for d in data if d['meaning'] == metric]
    
    return jsonify(filtered[:limit])

@app.route('/api/country/<country_code>/metrics', methods=['GET'])
def country_metrics(country_code):
    nasa = loader.load_nasa_data()
    wb = [d for d in loader.load_worldbank_data() if d['country']['id'] == country_code]
    
    return jsonify({
        'temperature': nasa['temperature'],
        'ocean_warming': nasa['ocean_warming'],
        'methane': nasa['methane'],
        'co2': nasa['co2'],
        'sea_level': nasa['sea_level'],
        'arctic_sea_ice': nasa['arctic_sea_ice'],
        'country_data': wb
    })

@app.route('/api/renewable-energy', methods=['GET'])
def renewable_energy():
    metric = "Renewable energy consumption (% of total final energy consumption)"
    data = [d for d in loader.load_worldbank_data() if d['meaning'] == metric]
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
