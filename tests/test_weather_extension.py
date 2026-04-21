from extensions.base import FeedSection
from extensions.weather import WeatherExtension
from extensions.weather.collector import (
    describe_weather_code,
    fetch_today_weather,
    infer_country_code_from_timezone,
)


def test_describe_weather_code_maps_known_values():
    assert describe_weather_code(2) == "Partly cloudy"
    assert describe_weather_code(99) == "Thunderstorm with heavy hail"


def test_fetch_today_weather_resolves_city_and_parses_forecast(httpx_mock):
    httpx_mock.add_response(
        json={
            "results": [
                {
                    "name": "Boston",
                    "admin1": "Massachusetts",
                    "country": "United States",
                    "latitude": 42.3601,
                    "longitude": -71.0589,
                }
            ]
        }
    )
    httpx_mock.add_response(
        json={
            "timezone": "America/New_York",
            "current": {
                "temperature_2m": 14.5,
                "apparent_temperature": 13.9,
                "relative_humidity_2m": 62,
                "weather_code": 2,
                "wind_speed_10m": 12.3,
                "is_day": 1,
            },
            "daily": {
                "time": ["2026-04-13"],
                "temperature_2m_max": [16.2],
                "temperature_2m_min": [8.1],
                "precipitation_probability_max": [30],
                "sunrise": ["2026-04-13T06:05"],
                "sunset": ["2026-04-13T19:27"],
            },
        }
    )

    items = fetch_today_weather("Boston")

    assert len(items) == 1
    assert items[0]["label"] == "Boston, Massachusetts, United States"
    assert items[0]["condition"] == "Partly cloudy"
    assert items[0]["temp_max_c"] == 16.2
    assert items[0]["precipitation_probability_pct"] == 30

    requests = httpx_mock.get_requests()
    assert requests[0].url.host == "geocoding-api.open-meteo.com"
    assert requests[0].url.params["name"] == "Boston"
    assert requests[1].url.host == "api.open-meteo.com"


def test_fetch_today_weather_returns_empty_when_city_not_found(httpx_mock):
    httpx_mock.add_response(json={"results": []})

    assert fetch_today_weather("Atlantis") == []


def test_fetch_today_weather_shenzhen_shanghai_timezone(httpx_mock):
    httpx_mock.add_response(
        json={
            "results": [
                {
                    "name": "Shenzhen",
                    "admin1": "Guangdong",
                    "country": "China",
                    "latitude": 22.5431,
                    "longitude": 114.0579,
                }
            ]
        }
    )
    httpx_mock.add_response(
        json={
            "timezone": "Asia/Shanghai",
            "current": {
                "temperature_2m": 28.0,
                "apparent_temperature": 31.5,
                "relative_humidity_2m": 80,
                "weather_code": 80,
                "wind_speed_10m": 8.0,
                "is_day": 1,
            },
            "daily": {
                "time": ["2026-04-21"],
                "temperature_2m_max": [32.0],
                "temperature_2m_min": [24.0],
                "precipitation_probability_max": [60],
                "sunrise": ["2026-04-21T06:05"],
                "sunset": ["2026-04-21T18:52"],
            },
        }
    )

    items = fetch_today_weather("Shenzhen", timezone="Asia/Shanghai")

    assert len(items) == 1
    assert items[0]["label"] == "Shenzhen, Guangdong, China"
    assert items[0]["timezone"] == "Asia/Shanghai"
    assert items[0]["condition"] == "Slight rain showers"
    assert items[0]["temp_max_c"] == 32.0

    requests = httpx_mock.get_requests()
    assert requests[0].url.params["name"] == "Shenzhen"
    assert requests[0].url.params["countryCode"] == "CN"
    assert requests[1].url.params["timezone"] == "Asia/Shanghai"


def test_infer_country_code_from_timezone_handles_common_timezones():
    assert infer_country_code_from_timezone("Europe/London") == "GB"
    assert infer_country_code_from_timezone("Asia/Shanghai") == "CN"
    assert infer_country_code_from_timezone("auto") is None
    assert infer_country_code_from_timezone("Mars/Olympus") is None


def test_fetch_today_weather_prefers_country_from_timezone(httpx_mock):
    httpx_mock.add_response(
        json={
            "results": [
                {
                    "name": "London",
                    "admin1": "England",
                    "country": "United Kingdom",
                    "latitude": 51.50853,
                    "longitude": -0.12574,
                }
            ]
        }
    )
    httpx_mock.add_response(
        json={
            "timezone": "Europe/London",
            "current": {
                "temperature_2m": 12.0,
                "apparent_temperature": 10.5,
                "relative_humidity_2m": 75,
                "weather_code": 3,
                "wind_speed_10m": 15.0,
                "is_day": 1,
            },
            "daily": {
                "time": ["2026-04-21"],
                "temperature_2m_max": [14.0],
                "temperature_2m_min": [7.0],
                "precipitation_probability_max": [45],
                "sunrise": ["2026-04-21T05:52"],
                "sunset": ["2026-04-21T20:07"],
            },
        }
    )

    items = fetch_today_weather("London", timezone="Europe/London")

    assert len(items) == 1
    assert items[0]["label"] == "London, England, United Kingdom"

    requests = httpx_mock.get_requests()
    assert requests[0].url.params["name"] == "London"
    assert requests[0].url.params["countryCode"] == "GB"
    assert requests[1].url.params["timezone"] == "Europe/London"


def test_fetch_today_weather_falls_back_to_global_geocoding(httpx_mock):
    httpx_mock.add_response(json={"results": []})
    httpx_mock.add_response(
        json={
            "results": [
                {
                    "name": "Reykjavik",
                    "admin1": "Capital Region",
                    "country": "Iceland",
                    "latitude": 64.1466,
                    "longitude": -21.9426,
                }
            ]
        }
    )
    httpx_mock.add_response(
        json={
            "timezone": "Atlantic/Reykjavik",
            "current": {
                "temperature_2m": 6.0,
                "apparent_temperature": 2.0,
                "relative_humidity_2m": 88,
                "weather_code": 1,
                "wind_speed_10m": 19.0,
                "is_day": 1,
            },
            "daily": {
                "time": ["2026-04-21"],
                "temperature_2m_max": [7.0],
                "temperature_2m_min": [2.0],
                "precipitation_probability_max": [20],
                "sunrise": ["2026-04-21T05:54"],
                "sunset": ["2026-04-21T21:06"],
            },
        }
    )

    items = fetch_today_weather("Reykjavik", timezone="Europe/London")

    assert len(items) == 1
    assert items[0]["label"] == "Reykjavik, Capital Region, Iceland"

    requests = httpx_mock.get_requests()
    assert requests[0].url.params["countryCode"] == "GB"
    assert "countryCode" not in requests[1].url.params
    assert requests[2].url.params["timezone"] == "Europe/London"


def test_weather_extension_shenzhen_shanghai_config_fetch_and_render(httpx_mock):
    """Full round-trip: WeatherExtension with city=Shenzhen, timezone=Asia/Shanghai."""
    httpx_mock.add_response(
        json={
            "results": [
                {
                    "name": "Shenzhen",
                    "admin1": "Guangdong",
                    "country": "China",
                    "latitude": 22.5431,
                    "longitude": 114.0579,
                }
            ]
        }
    )
    httpx_mock.add_response(
        json={
            "timezone": "Asia/Shanghai",
            "current": {
                "temperature_2m": 28.0,
                "apparent_temperature": 31.5,
                "relative_humidity_2m": 80,
                "weather_code": 80,
                "wind_speed_10m": 8.0,
                "is_day": 1,
            },
            "daily": {
                "time": ["2026-04-21"],
                "temperature_2m_max": [32.0],
                "temperature_2m_min": [24.0],
                "precipitation_probability_max": [60],
                "sunrise": ["2026-04-21T06:05"],
                "sunset": ["2026-04-21T18:52"],
            },
        }
    )

    ext = WeatherExtension({"city": "Shenzhen", "timezone": "Asia/Shanghai"})
    items = ext.fetch()
    section = ext.render(items)

    assert len(items) == 1
    assert items[0]["label"] == "Shenzhen, Guangdong, China"
    assert items[0]["timezone"] == "Asia/Shanghai"
    assert items[0]["condition"] == "Slight rain showers"

    requests = httpx_mock.get_requests()
    assert requests[1].url.params["timezone"] == "Asia/Shanghai"

    assert isinstance(section, FeedSection)
    assert section.icon == "🌦️"
    assert section.meta["city"] == "Shenzhen"


def test_weather_extension_render_includes_icon_and_city():
    ext = WeatherExtension({"city": "Boston"})

    section = ext.render([{"label": "Boston"}])

    assert isinstance(section, FeedSection)
    assert section.icon == "🌦️"
    assert section.meta["city"] == "Boston"
