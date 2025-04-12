import scrapy


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
