from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)



def format_date(iso_string):
    date_obj = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
    return date_obj.strftime("%A, %d %B %Y")

@app.route('/get_weather')
def get_weather():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    weather_data = get_weather_data(lat, lon)

    if weather_data:
        current_weather = weather_data['data']['timelines'][0]['intervals'][0]['values']
        weather_code = current_weather['weatherCode']
        current_weather_data = {
            "weather_code": weather_code,
            "temp": current_weather['temperature'],
            "humidity": current_weather['humidity'],
            "pressure": current_weather['pressureSeaLevel'],
            "windSpeed": current_weather['windSpeed'],
            "visibility": current_weather['visibility'],
            "cloudCover": current_weather['cloudCover'],
            "uvIndex": current_weather['uvIndex']
        }
        forecast_weather = weather_data['data']['timelines'][0]['intervals']

        forecast = []
        for interval in forecast_weather[:7]:
            weather_code = interval['values']['weatherCode']
            forecast.append({
                "date": format_date(interval['startTime']),
                "weather_code": weather_code,
                "tempHigh": interval['values'].get('temperatureMax', 'N/A'),
                "tempLow": interval['values'].get('temperatureMin', 'N/A'),
                "windSpeed": interval['values']['windSpeed'],
                "precipitation": interval['values'].get('precipitationType', 'N/A'),
                "chance_of_rain": interval['values'].get('precipitationProbability', 'N/A'),
                "humidity": interval['values']['humidity'],
                "visibility": interval['values']['visibility'],
                "sunrise": interval['values'].get('sunriseTime', 'N/A'),
                "sunset": interval['values'].get('sunsetTime', 'N/A')
            })

        return jsonify({
            "current_weather": current_weather_data,
            "forecast": forecast
        })
    else:
        return jsonify({"error": "Failed to fetch weather data"}), 500

def get_weather_data(lat, lon):

    api_key = 'i6t0LkaUvOG0zoHXaPSBJd0Scev0fDxH'
    url = f"https://api.tomorrow.io/v4/timelines?location={lat},{lon}&fields=temperature,temperatureApparent,temperatureMin,temperatureMax,windSpeed,windDirection,humidity,pressureSeaLevel,uvIndex,weatherCode,precipitationProbability,precipitationType,sunriseTime,sunsetTime,visibility,cloudCover,moonPhase&apikey={api_key}&timesteps=1d&units=imperial&timezone=America/Los_Angeles"
    try:
        response = requests.get(url)
        print(f"API Response Status Code: {response.status_code}")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"API Response Error: {response.text}")
            return None
    except Exception as e:
        print(f"Exception occurred: {e}")
        return None

@app.route('/get_temperature_data')
def get_temperature_data():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    graphData = graph_data(lat, lon)

    if graphData:
        forecast_interval = graphData['data']['timelines'][0]['intervals'][:15]
        temperature_data = [{
            "date": interval['startTime'],
            "tempHigh": interval['values'].get('temperatureMax', 'N/A'),
            "tempLow": interval['values'].get('temperatureMin', 'N/A')
        } for interval in forecast_interval]

        return jsonify({"temperature_data": temperature_data})
    else:
        return jsonify({"error": "Failed to fetch temperature data"}), 500

@app.route('/get_hourly_data')
def get_hourly_data():
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    hData = graph_data(lat, lon)

    if hData:
        forecast_interval = hData['data']['timelines'][1]['intervals'][:120]
        hourly_weather = [{
            "time": interval['startTime'],
            "temp": interval['values']['temperature'],
            "humidity": interval['values']['humidity'],
            "pressure": interval['values']['pressureSeaLevel'],
            "windSpeed": interval['values']['windSpeed']
        } for interval in forecast_interval]

        return jsonify({"hourly_weather": hourly_weather})
    else:
        return jsonify({"error": "Failed to fetch hourly data"}), 500

def graph_data(lat,lon):
    api_key = 'i6t0LkaUvOG0zoHXaPSBJd0Scev0fDxH'
    url2 = f"https://api.tomorrow.io/v4/timelines?location={lat},{lon}&fields=temperature,humidity,pressureSeaLevel,windSpeed,temperatureMax,temperatureMin&apikey={api_key}&timesteps=1d,1h&units=imperial&timezone=America/Los_Angeles"
    try:
        response = requests.get(url2)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"API Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Exception occurred: {e}")
        return None

if __name__ == '__main__':
    app.run(debug=True)
