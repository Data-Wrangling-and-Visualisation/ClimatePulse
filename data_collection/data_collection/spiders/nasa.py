import scrapy
import json
from urllib.parse import urljoin
from collections import defaultdict

class NasaClimateSpider(scrapy.Spider):
    name = 'nasa_spider'
    allowed_domains = ['climate.nasa.gov']
    start_urls = ['https://climate.nasa.gov/vital-signs/global-temperature/']
    merged_data = defaultdict()


    def parse(self, response):
        links = response.xpath('//*[@id="page"]/div[3]/nav/ul/li')
        for i,link in enumerate(links):
            link = link.xpath('a').attrib.get('href')
            link = urljoin(response.url, link)
            yield scrapy.Request(
                url=link,
                callback=self.parse_nav
            )            
            

    def parse_nav(self, response):
        multi_line_chart = response.xpath('//div[@data-react-class="MultiLineChart"]')[0]
        vital_sign = response.url.split('/')[-2]

        data = multi_line_chart.attrib.get('data-react-props')
        data = json.loads(data).get('items')

        stats = defaultdict()
        for entry in data:
            year = entry.get('x')
            indicator = entry.get('y')
            if year and indicator:
                stats[year] = indicator

        self.merged_data[vital_sign] = stats

    def closed(self, reason):
        with open('./data_collection/spiders/nasa_data.json', 'w') as f:
            json.dump(self.merged_data, f, indent=4)
