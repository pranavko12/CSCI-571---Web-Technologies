document.addEventListener('DOMContentLoaded', function()
{
  const form = document.getElementById('info');
  const street = document.getElementById('street');
  const city = document.getElementById('city');
  const state = document.getElementById('state');
  const locationInfo = document.getElementById('location_display');
  const weatherDetails = document.getElementById('weather_info');
  const clearButton = document.querySelector('.clear');
  const WeatherCode = {
      1000: {description: "Clear", icon: "Images/Images/WeatherCodes/clear.svg"},
      1100: {description: "Mostly Clear", icon: "Images/Images/WeatherCodes/mostly_clear.svg"},
      1101: {description: "Partly Cloudy", icon: "Images/Images/WeatherCodes/partly_cloudy.svg"},
      1102: {description: "Mostly Cloudy", icon: "Images/Images/WeatherCodes/mostly_cloudy.svg"},
      1001: {description: "Cloudy", icon: "Images/Images/WeatherCodes/cloudy.svg"},
      4000: {description: "Drizzle", icon: "Images/Images/WeatherCodes/drizzle.svg"},
      5001: {description: "Flurries", icon: "Images/Images/WeatherCodes/flurries.svg"},
      2000: {description: "Fog", icon: "Images/Images/WeatherCodes/fog.svg"},
      2100: {description: "Light Fog", icon: "Images/Images/WeatherCodes/fog_light.svg"},
      6000: {description: "Freezing Drizzle", icon: "Images/Images/WeatherCodes/freezing_drizzle.svg"},
      6001: {description: "Freezing Rain", icon: "Images/Images/WeatherCodes/freezing_rain.svg"},
      6201: {description: "Heavy Freezing Rain", icon: "Images/Images/WeatherCodes/freezing_rain_heavy.svg"},
      6200: {description: "Light Freezing Rain", icon: "Images/Images/WeatherCodes/freezing_rain_light.svg"},
      7000: {description: "Ice Pellets", icon: "Images/Images/WeatherCodes/ice_pellets.svg"},
      7101: {description: "Heavy Ice Pellets", icon: "Images/Images/WeatherCodes/ice_pellets_heavy.svg"},
      7102: {description: "Light Ice Pellets", icon: "Images/Images/WeatherCodes/ice_pellets_light.svg"},
      5000: {description: "Snow", icon: "Images/Images/WeatherCodes/snow.svg"},
      5101: {description: "Heavy Snow", icon: "Images/Images/WeatherCodes/snow_heavy.svg"},
      5100: {description: "Light Snow", icon: "Images/Images/WeatherCodes/snow_light.svg"},
      4201: {description: "Heavy Rain", icon: "Images/Images/WeatherCodes/rain_heavy.svg"},
      4200: {description: "Light Rain", icon: "Images/Images/WeatherCodes/rain_light.svg"},
      4001: {description: "Rain", icon: "Images/Images/WeatherCodes/rain.svg"},
      3001: {description: "Strong Wind", icon: "Images/Images/WeatherCodes/strong_wind.png"},
      3000: {description: "Wind", icon: "Images/Images/WeatherCodes/wind.png"},
      3002: {description: "Light Wind", icon: "Images/Images/WeatherCodes/light_wind.jpg"},
      8000: {description: "T-storm", icon: "Images/Images/WeatherCodes/tstorm.svg"}
  };
  const pointer = document.getElementById('pointer');
  const graphs = document.getElementById('graphs');

  let isChartVisible = false;

  document.getElementById('submit').addEventListener('click', async function(event)
  {
    event.preventDefault();

    const autoDetect = document.getElementById('location').checked;
    if (autoDetect)
    {
      street.removeAttribute('required');
      city.removeAttribute('required');
      state.removeAttribute('required');
      locationFromIP();
    }
    else
    {
      street.setAttribute('required', 'required');
      city.setAttribute('required', 'required');
      state.setAttribute('required', 'required');
      const locationData = { street: street.value, city: city.value, state: state.value };
      locationFromAddress(locationData);
      if (!form.reportValidity())
      {
        document.getElementById('error_message').innerText = "No records have been found.VALIDITY";
        document.getElementById('error_message').style.display = 'block';
      }
     }
  });
  clearButton.addEventListener('click', function()
  {
    document.getElementById('error_message').style.display = 'none';
    weatherDetails.style.display = 'none';
    document.getElementById('daily_weather').style.display = 'none';
    document.getElementById('pointer').style.display = 'none';
    document.getElementById('graphs').style.display = 'none';
    isChartVisible = false;
  });


  async function locationFromIP()
  {
    try
    {
      const token = '5b1be4f0ed7ea6';
      const ipResponse = await fetch(`https://ipinfo.io/json?token=${token}`);
      if (ipResponse.ok)
      {
        const ipData = await ipResponse.json();
        const lat = ipData.loc.split(',')[0];
        const lon = ipData.loc.split(',')[1];
        const city = ipData.city;
        const region = ipData.region;
        locationInfo.innerText = `${city}, ${region}`;
        weatherByCoordinates(lat, lon);
        temperatureData(lat, lon);
        hourlyData(lat,lon);
        document.getElementById('error_message').style.display = 'none';
      }
      else
      {
        document.getElementById('error_message').style.display = 'block';
      }
    }
    catch (error)
    {
      console.error("Error fetching location from IP:", error);
      document.getElementById('error_message').innerText = "No records have been found.IPinfo";
      document.getElementById('error_message').style.display = 'block';
    }
  }

  async function locationFromAddress(locationData)
  {
    const address = `${locationData.street}, ${locationData.city}, ${locationData.state}`;
    try
    {
        const apiKey = 'AIzaSyCCA-rWf8OSdfc0qwf4HScjsIFAMiZkoDU';
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0)
        {
          const lat = data.results[0].geometry.location.lat;
          const lon = data.results[0].geometry.location.lng;
            locationInfo.innerText = address;
            weatherByCoordinates(lat, lon);
            temperatureData(lat, lon);
            hourlyData(lat,lon);
            document.getElementById('error_message').style.display = 'none';
        }
        else
        {
          weatherByState(locationData.state, apiKey);
        }
      }
      catch (error)
      {
          console.error("Error fetching coordinates:", error);
          document.getElementById('error_message').innerText = "No records have been found.GEO";
          document.getElementById('error_message').style.display = 'block';
      }
    }

    async function weatherByState(state,apiKey)
    {
      try
      {
          const fallbackResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(state)}&key=${apiKey}`);
          const fallbackData = await fallbackResponse.json();

          if (fallbackData.status === "OK" && fallbackData.results.length > 0)
          {
              const lat = fallbackData.results[0].geometry.location.lat;
              const lon = fallbackData.results[0].geometry.location.lng;
              locationInfo.innerText = fallbackData.results[0].formatted_address;
              weatherByCoordinates(lat, lon);
              temperatureData(lat, lon);
              hourlyData(lat,lon);
              document.getElementById('error_message').style.display = 'none';
          }
          else
          {
              document.getElementById('error_message').innerText = "No records have been found.Geocode";
              document.getElementById('error_message').style.display = 'block';
          }
        }
        catch (error)
        {
          console.error("Error fetching coordinates:", error);
          document.getElementById('error_message').innerText = "No records have been found.GEO";
          document.getElementById('error_message').style.display = 'block';
        }
  }

  async function weatherByCoordinates(lat, lon)
  {
    try
    {
      const weatherResponse = await fetch(`http://localhost:5000/get_weather?lat=${lat}&lon=${lon}`);
      const weatherData = await weatherResponse.json();
      displayWeather(weatherData);
      if (weatherResponse.ok && weatherData)
      {
      displayWeather(weatherData);
      document.getElementById('error_message').style.display = 'none';
      }
      else
      {
        document.getElementById('error_message').style.display = 'block';
      }
    }
    catch (error)
    {
      console.error("Error fetching weather data:", error);
      document.getElementById('error_message').innerText = "No records have been found.MAIN";
      document.getElementById('error_message').style.display = 'block';
    }
  }

  function displayWeather(data)
  {
    weatherDetails.style.display = 'block';
    const current_weather = data.current_weather;
    const weatherCode = current_weather.weather_code;
    const {description, icon} = WeatherCode[weatherCode];
    document.getElementById('weather_icon').innerHTML = `<img src="${icon}">`;
    document.getElementById('weather_temp').innerText = `${current_weather.temp}°`;
    document.getElementById('weather_summary').innerText = description;
    document.getElementById('humidity').innerText = `${current_weather.humidity}%`;
    document.getElementById('pressure').innerText = `${current_weather.pressure}inHg`;
    document.getElementById('wind-speed').innerText = `${current_weather.windSpeed} mph`;
    document.getElementById('visibility').innerText = `${current_weather.visibility} mi`;
    document.getElementById('cloud-cover').innerText = `${current_weather.cloudCover}%`;
    document.getElementById('uv-level').innerText = `${current_weather.uvIndex}`;

    const forecast = data.forecast;
    const wd = forecast.weather_code;
    const forecastDetails = document.getElementById('forecast-details');
    forecastDetails.innerHTML = '';
    forecast.forEach(day =>
      {
        const {description, icon} = WeatherCode[day.weather_code];
        const row = document.createElement('tr');
        row.innerHTML = `
                       <td>${day.date}</td>
                       <td><img src="${icon}"> ${description}</td>
                       <td>${day.tempHigh}</td>
                       <td>${day.tempLow}</td>
                       <td>${day.windSpeed}</td>
                       `;
        forecastDetails.appendChild(row);

        row.addEventListener('click', function()
        {
          displayDailyWeather(day);
        });
      });
  }
  function displayDailyWeather(dailyData)
  {
      const weather_code = dailyData.weather_code;
      const {description, icon} = WeatherCode[weather_code];
      const sunriseTime = new Date(dailyData.sunrise);
      const sunsetTime = new Date(dailyData.sunset);
      const formattedSunrise = formatTime(sunriseTime);
      const formattedSunset = formatTime(sunsetTime);
      const precipitation = dailyData.precipitation === 0 ? "N/A" : dailyData.precipitation;
      document.getElementById("daily_date").innerText = dailyData.date;
      document.getElementById("daily_status").innerText = description;
      document.getElementById("daily_temp").innerText = `${dailyData.tempHigh}°F/${dailyData.tempLow}°F`;
      document.getElementById("daily_icon").src = icon;

      document.getElementById("daily_precipitation").innerText = precipitation;
      document.getElementById("daily_chance_of_rain").innerText = `${dailyData.chance_of_rain}%`;
      document.getElementById("daily_wind_speed").innerText = `${dailyData.windSpeed} mph`;
      document.getElementById("daily_humidity").innerText = `${dailyData.humidity}%`;
      document.getElementById("daily_visibility").innerText = `${dailyData.visibility} mi`;
      document.getElementById("sunrise_sunset").innerText = `${formattedSunrise}/${formattedSunset}`;

      document.getElementById("weather_info").style.display = "none";
      document.getElementById("daily_weather").style.display = "block";
      document.getElementById("pointer").style.display = "block";
    };

    function formatTime(date)
    {
      let hours = date.getUTCHours();
      let minutes = date.getUTCMinutes();
      let ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      return hours + (minutes !== '00' ? `:${minutes}` : '') + ampm;
    }

    pointer.addEventListener('click', function()
    {
      toggleCharts();
    });

  function toggleCharts()
  {
    if (isChartVisible)
    {
      graphs.style.display = 'none';
      pointer.src = "Images/Images/pt_down.png";
    }
    else
    {
      graphs.style.display = 'block';
      pointer.src = "Images/Images/pt_up.png";
    }
    isChartVisible = !isChartVisible;
  }
  async function temperatureData(lat, lon)
  {
        try
        {
            const response = await fetch(`http://localhost:5000/get_temperature_data?lat=${lat}&lon=${lon}`);
            const data = await response.json();
            if (data.temperature_data)
            {
                temperatureChart(data.temperature_data);
            }
        }
        catch (error)
        {
            console.error("Error fetching temperature range:", error);
        }
    }

    function temperatureChart(temperature_data)
    {
        const dates = temperature_data.map(day => formatDate(day.date));
        const tempHighs = temperature_data.map(day => day.tempHigh);
        const tempLows = temperature_data.map(day => day.tempLow);

        Highcharts.chart('temperature_chart',
        {
            chart:
            {
              type: 'arearange'
            },
            title:
            {
              text: 'Temperature Ranges (Min, Max)'
            },
            xAxis:
            {
              categories: dates,
                     crosshair:
                     {
                        dashStyle: 'Solid',
                        width: 4
                     },
                     labels:
                     {
                        formatter: function()
                        {
                              const date = new Date(this.value);
                              return Highcharts.dateFormat('%e %b', date.getTime());
                        }
                      }
              },
            yAxis:
            {
              title:
              {
                text: 'Temperature (°F)'
              }
            },
            series:
            [{
                name: 'Temperatures',
                data: tempHighs.map((high, index) => [tempLows[index], high]),
                color: '#FF8C00',
                fillColor:
                {
                  linearGradient: [0, 0, 0, 300],
                  stops:
                  [
                      [0, 'rgba(255, 140, 0, 0.5)'],
                      [0.5, 'rgba(135, 206, 250, 0.5)'],
                      [1, 'rgba(135, 206, 250, 1)']
                  ]
                },
            marker:
            {
                fillColor: '#1E90FF',
                lineWidth: 2,
                lineColor: '#FF8C00'
            },
            lineWidth: 2
            }]
          });
    }

    function formatDate(isoString)
    {
      const date = new Date(isoString);
      const day = date.getUTCDate();
      const month = date.getUTCMonth() + 1;
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayIndex = date.getDay();
      const weekday = daysOfWeek[dayIndex];
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }

    async function hourlyData(lat,lon)
    {
      try
      {
          const response = await fetch(`http://localhost:5000/get_hourly_data?lat=${lat}&lon=${lon}`);
          const data = await response.json();
          if (data.hourly_weather)
          {
              hourlyChart(data.hourly_weather);
          }
          else
          {
            console.error("No hourly weather data found");
          }
      }
      catch (error)
      {
          console.error("Error fetching hourly weather data:", error);
      }
    }

    function hourlyChart(hourly_weather)
    {
      const hours = hourly_weather.map(hour => hourlyTime(hour.time));
      const temps = hourly_weather.map(hour => hour.temp);
      const humidity = hourly_weather.map(hour => hour.humidity);
      const windSpeed = hourly_weather.map(hour => hour.windSpeed);
      const pressure = hourly_weather.map(hour => hour.pressure);

      Highcharts.chart('hourly_chart',
      {
        chart:
        {
          type: 'column'
        },
        title:
        {
          text: 'Hourly Weather (For Next 5 Days)'
        },
        xAxis:
        {
          type: 'datetime',
          labels:
          {
            formatter: function ()
            {
                return Highcharts.dateFormat('%a, %b %e', this.value);
            }
          },
          tickInterval: 6 * 3600 * 1000,
          crosshair: true
        },
        yAxis:
        [{
          title:
          {
            text: 'Temperature (°F) / Humidity (%)'
          },
          plotLines: [{
                value: 0,
                color: '#BBBBBB',
                width: 1,
                zIndex: 2
            }],
            maxPadding: 0.3,
            minRange: 8,
            tickInterval: 1,
            gridLineColor: 'rgba(128, 128, 128, 0.1)'
        },
        {
            title: {
                text: 'humidity'
            },
            labels: {
                enabled: false
            },
            gridLineWidth: 0,
            tickLength: 0,
            minRange: 10,
            min: 0

        },
        {
            allowDecimals: false,
            title: {
                text: 'hPa',
                offset: 0,
                align: 'high',
                rotation: 0,
                style: {
                    fontSize: '10px',
                    color: Highcharts.getOptions().colors[2]
                },
                textAlign: 'left',
                x: 3
          },
            gridLineWidth: 0,
            opposite: true,
            showLastLabel: false
        }],
        tooltip:
        {
          formatter: function ()
          {
            let pointDate = new Date(this.x);
            return `<b>${Highcharts.dateFormat('%A, %e %b', pointDate)}</b><br>
                    Temperature: ${this.points[0].y} °F<br>
                    Humidity: ${this.points[1].y}%<br>
                    Air Pressure: ${this.points[2].y} inHg`;
          },
          shared: true
        },
        series:
        [{
          name: 'Temperature',
          data: temps.map((temp, index) => [hours[index], temp]),
          type: 'spline',
          tooltip: { valueSuffix: ' °F' },
          color: '#FF0000'
        },
        {
          name: 'Humidity',
          data: humidity.map((hum, index) => [hours[index], hum]),
          type: 'column',
          tooltip: { valueSuffix: '%' },
          color: '#0000FF'
        },
        {
          name: 'Air Pressure',
          data: pressure.map((pres, index) => [hours[index], pres]),
          type: 'line',
          yAxis: 1,
          tooltip: { valueSuffix: ' inHg' },
          color: '#FFA500'
        },
        {
          name: 'Wind',
          type: 'windbarb',
          id: 'windbarbs',
          lineWidth: 1.5,
          vectorLength: 18,
          yOffset: -15,
          data: windSpeed.map((wd, index) => [hours[index], wd]),
          tooltip: { valueSuffix: '%' },
          color: '#A020F0'
    }]
});


    }

  function hourlyTime(isoString)
  {
    date = new Date(isoString);
    if (isNaN(date))
    {
      console.error('Invalid date provided:', isoString);
      return 'Invalid date';
    }
    return date.getTime();
  }
});
