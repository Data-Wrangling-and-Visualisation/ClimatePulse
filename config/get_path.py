import os

def get_root_directory():
    file_path = os.path.abspath(__file__)
    return os.path.dirname(os.path.dirname(file_path))
