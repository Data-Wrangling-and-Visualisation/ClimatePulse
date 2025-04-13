from flask import Flask, jsonify, request
from flask_cors import CORS
from utils.data_loader import ClimateDataLoader
from utils.metric_mapper import get_metric_name, get_available_metrics, get_nasa_metric_name

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
def nasa_global_data():
    return jsonify(loader.nasa_data)

@app.route('/api/nasa/<metric_key>', methods=['GET'])
def nasa_metric_data(metric_key):
    try:
        years, values = loader.get_global_data_by_metric(metric_key)
        return jsonify({
            'years': years,
            'values': values,
            'metric': get_nasa_metric_name(metric_key)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
@app.route('/api/countries', methods=['GET'])
def country_list():
    return jsonify(loader.get_country_names())

@app.route('/api/wb/metric', methods=['GET'])
def wb_metric():
    metric = request.args.get('metric')
    country = request.args.get('country')
    
    if not metric:
        return jsonify({'error': 'Metric parameter is required'}), 400
    
    if country:
        years, values = loader.get_local_data_by_metric(metric, country)
        if years is None:
            return jsonify({'error': 'Data not found'}), 404
        return jsonify({
            'years': years,
            'values': values,
            'country': country,
            'metric': get_metric_name(metric)
        })
    else:
        data = loader.get_local_data_by_metric(metric)
        return jsonify(data)

@app.route('/api/wb/country', methods=['GET'])
def wb_country():
    country = request.args.get('country')
    metric = request.args.get('metric')
    
    if not country:
        return jsonify({'error': 'Country parameter is required'}), 400
    
    if metric:
        years, values = loader.get_local_data_by_country(country, metric)
        if years is None:
            return jsonify({'error': 'Data not found'}), 404
        return jsonify({
            'years': years,
            'values': values,
            'country': country,
            'metric': get_metric_name(metric)
        })
    else:
        data = loader.get_local_data_by_country(country)
        return jsonify(data)

@app.route('/api/top/<metric_key>', methods=['GET'])
def top_countries(metric_key):
    try:
        limit = int(request.args.get('limit', 10))
        ascending = request.args.get('ascending', 'false').lower() == 'true'
        
        results = loader.get_top_countries_by_metric(
            metric_key,
            limit=limit,
            ascending=ascending
        )
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/country/<country_name>/metrics', methods=['GET'])
def country_metrics(country_name):
    try:
        # Get NASA global data
        temp_years, temp_values = loader.get_global_data_by_metric('temperature')
        co2_years, co2_values = loader.get_global_data_by_metric('co2')
        
        # Get country-specific data
        country_data = loader.get_local_data_by_country(country_name)
        
        return jsonify({
            'global': {
                'temperature': {
                    'years': temp_years,
                    'values': temp_values
                },
                'co2': {
                    'years': co2_years,
                    'values': co2_values
                }
            },
            'country': {
                'name': country_name,
                'metrics': country_data,
                'metadata': loader.country_metadata.get(country_name, {})
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# compute average for each country for last 10 years, and select top
@app.route('/api/renewable-energy', methods=['GET'])
def renewable_energy():
    try:
        results = loader.get_top_countries_by_metric('renewable', limit=10)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
