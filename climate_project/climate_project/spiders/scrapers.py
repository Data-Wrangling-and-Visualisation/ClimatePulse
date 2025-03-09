import scrapy
import json
import requests

class NasaSpider(scrapy.Spider):
    name = "nasa_spider"
    start_urls = [
        "https://climate.nasa.gov/vital-signs/global-temperature/",
        "https://climate.nasa.gov/vital-signs/carbon-dioxide/",
        "https://climate.nasa.gov/vital-signs/sea-level/"
    ]

    def parse(self, response):
        if "global-temperature" in response.url:
            script_data = response.css("script#__NEXT_DATA__::text").get()
            if script_data:
                json_data = json.loads(script_data)
                temperature_data = json_data["props"]["pageProps"]["data"]
                for entry in temperature_data:
                    yield {
                        "year": entry["year"],
                        "temperature_anomaly": entry["value"]
                    }
        elif "carbon-dioxide" in response.url:
            script_data = response.css("script#__NEXT_DATA__::text").get()
            if script_data:
                json_data = json.loads(script_data)
                co2_data = json_data["props"]["pageProps"]["data"]
                for entry in co2_data:
                    yield {
                        "year": entry["year"],
                        "co2_level": entry["value"]
                    }
        elif "sea-level" in response.url:
            script_data = response.css("script#__NEXT_DATA__::text").get()
            if script_data:
                json_data = json.loads(script_data)
                sea_level_data = json_data["props"]["pageProps"]["data"]
                for entry in sea_level_data:
                    yield {
                        "year": entry["year"],
                        "sea_level_rise": entry["value"]
                    }

class NoaaSpider(scrapy.Spider):
    name = "noaa_spider"
    start_urls = ["https://www.ncdc.noaa.gov/billings/"]

    def parse(self, response):
        for row in response.css("table#disaster-table tbody tr"):
            yield {
                "year": row.css("td:nth-child(1)::text").get().strip(),
                "disaster_type": row.css("td:nth-child(2)::text").get().strip(),
                "frequency": row.css("td:nth-child(3)::text").get().strip(),
                "economic_damage": row.css("td:nth-child(4)::text").get().strip()
            }

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