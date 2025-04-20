# Repository Structure
```
ClimatePulse/
├── backend/                         # backend part:
|   ├── \__init__.py                 # to form a module
|   ├── app.py                       # main file with server endpoints
│   ├── config/                      # future configs can be added
│   │   ├── \__init__.py             # to form a module
│   │   └── get_path.py              # helper file
│   └── utils/                       # helper function
│       ├── \__init__.py             # to form a module
|       ├── data_loader.py           # key data extraction methods
│       └── metric_mapper.py         # dicts with metric names
├── checkpoints/                     # checkpoints
|   ├── checkpoint1.md
|   ├── checkpoint2.md 
│   ├── pictures/                    # pictures used in checkpoints
│   │   ├── ...
├── data/                            # data files (row and processed)
|   ├── countries_data.json
|   ├── nasa_data.csv 
|   ├── nasa_data.json
|   ├── worldbank_data.csv
|   └── worldbank_data.json
├── data_collection/                 # scrapy data collection
│   ├── scrapy.cfg                   # default scrapy structure    
│   └── data_collection/ 
│       ├── \__init__.py            
|       ├── items.py
│       ├── middlewares.py
│       ├── pipelines.py            
|       ├── settings.py
│       └── spiders/
│            ├── \__init__.py            
|            ├── nasa.py              # NASA scrapping
│            └── worldbank.py         # WorldBank scrapping
├── data_exploration/                 # collected data exploration                  
│   ├── EDA_and_preprocessing_NASA.ipynb 
│   └── EDA_and_preprocessing_worldbank.ipynb 
├── frontend/                         # source code
│   ├── index.html                    # main index
│   ├── assets/                       # styling: css + images for js
│   │   ├── css/                      
│   │   │    └── styles.css
│   │   └── images/
│   │         │...
│   └── js/                           # JS code
│       ├── main.js                   # main js that uses other js
│       ├── charts/                   # d3 charts collection
│       │     ├── co2Chart.js
│       │     ├── countryStatsChart.js
│       │     ├── renewableEnergyChart.js
│       │     └── temperatureChart.js
│       ├── globe/                    # globe js
│       │     ├── globe.js
│       └── utils/                    # helper js
│             └── helper.js
├── .gitignore                        # specifies files to ignore
├── docker-compose.yml                # to start project
├── Dockerfile                        # copy all backend files and start the app
├── Dockerfile.http                   # copy all frontend files
├── README.md                         # project overview
├── requirements.txt                  # python dependencies
├── server.py                         # to start the server
└── start.sh                          # script used in Dockerfile
```