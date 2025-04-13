import os

def get_root_directory():
    file_path = os.path.abspath(__file__)
    return os.path.dirname(os.path.dirname(os.path.dirname(file_path)))

def get_data_path():
    return os.path.join(get_root_directory(), 'data')

def get_country_data_path():
    return os.path.join(get_data_path(), 'countries_data.json')

def get_nasa_data_path():
    return os.path.join(get_data_path(), 'nasa_data.json')

def get_worldbank_data_path():
    return os.path.join(get_data_path(), 'worldbank_data.json')
