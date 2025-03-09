import scrapy
import json
import requests

class WorldBankSpider(scrapy.Spider):
    name = "worldbank_spider"
    def get_total():
        response = requests.get(f"https://api.worldbank.org/v2/country/all/indicator/EN.GHG.CO2.MT.CE.AR5?format=json")
        data = json.loads(response.text)
        try:
            return data[0]["total"]
        except:
            return 0

    start_urls = [
        f"https://api.worldbank.org/v2/country/all/indicator/EN.GHG.CO2.MT.CE.AR5?format=json&per_page={get_total()}"
    ]

    def parse(self, response):
        data = json.loads(response.text)
        for entry in data[1]:
            if entry["value"] is not None:
                yield {
                    "country": entry["country"]["value"],
                    "year": entry["date"],
                    "co2_emissions": float(entry["value"])
                }