import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsWindBarb from 'highcharts/modules/windbarb';
import './App.css';

HighchartsMore(Highcharts);
HighchartsWindBarb(Highcharts);

function loadMapScript()
{
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps)
        {
            console.log("Google Maps script already loaded.");
            resolve();
        }
        else
        {
            console.log("Loading Google Maps script...");
            const script = document.createElement("script");
            script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBJu5-rCtn-37xsclF-73p830YSb5z259c&libraries=places,marker";
            script.async = true;
            script.defer = true;
            script.onload = () =>
            {
                console.log("Google Maps script loaded successfully.");
                resolve();
            };
            script.onerror = () =>
            {
                console.error("Failed to load Google Maps script");
                reject("Failed to load Google Maps script");
            };
            document.head.appendChild(script);
        }
    });
}

function WeatherSearch()
{
    const [location, setLocation] = useState({ street: '', city: '', state: '', lat: '', lon: '' });
    const [errors, setErrors] = useState('');
    const [isLocationFetched, setIsLocationFetched] = useState(false);
    const [autoDetect, setAutoDetect] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [selectedTab, setSelectedTab] = useState("Results");
    const [isSearchEnabled, setIsSearchEnabled] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [isValidResponse, setIsValidResponse] = useState(false);
    const [hourlyData, setHourlyData] = useState([]);
    const [showForecast, setShowForecast] = useState(false);
    const [forecastData, setForecastData] = useState([]);
    const cityInputRef = useRef(null);
    const mapRef = useRef(null);
    const [selectedSubTab, setSelectedSubTab] = useState("Day View");
    const [selectedDayDetails, setSelectedDayDetails] = useState(null);
    const [showDetailsPane, setShowDetailsPane] = useState(false);
    const [lastSelectedRow, setLastSelectedRow] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() =>
    {
    const fetchFavoritesFromDB = async () =>
    {
    try
    {
      const response = await axios.get("https://backend-service-dot-webtechass3-441707.wl.r.appspot.com/api/favorites");
      setFavorites(response.data);
    }
    catch (error)
    {
      console.error("Error fetching favorites:", error);
    }
  };

  fetchFavoritesFromDB();
}, []);

    useEffect(() =>
    {
        async function initializeMapScript()
        {
            try
            {
                await loadMapScript();
                setMapLoaded(true);
            }
            catch (error)
            {
                console.error(error);
            }
        }

        initializeMapScript();
    }, []);

      useEffect(() =>
      {
      if (mapLoaded && showDetailsPane && location.lat && location.lon)
      {
          initializeMapWithLatLng(location.lat, location.lon);
      }
      else if (mapRef.current && !showDetailsPane)
      {
          mapRef.current.innerHTML = '';
          mapRef.current.style.display = 'none';
      }
    }, [mapLoaded, showDetailsPane, location.lat, location.lon]);

    const initializeMapWithLatLng = (lat, lng) =>
    {
      console.log("Lat/Lon for map initialization:", lat, lng);
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
      {
      console.error("Invalid latitude or longitude values.");
      return;
      }
      if (mapRef.current)
      {
        setTimeout(() =>
        {
            const map = new window.google.maps.Map(mapRef.current,
              {
                center: { lat: parseFloat(lat), lng: parseFloat(lng) },
                zoom: 12,
                mapTypeId: window.google.maps.MapTypeId.ROADMAP,
              });

              const marker = new window.google.maps.Marker(
                {
                position: { lat: parseFloat(lat), lng: parseFloat(lng) },
                map: map,
                });
                map.setCenter({ lat: parseFloat(lat), lng: parseFloat(lng) });
                console.log("Marker added at:", lat, lng);
        }, 0);

      }
      else
      {
          console.warn("Map ref is null.");
      }
    };

    useEffect(() =>
    {
        if (forecastData.length > 0 && !selectedDayDetails)
        {
            setSelectedDayDetails(forecastData[0]);
        }
    }, [forecastData, selectedDayDetails]);

    useEffect(() =>
    {
        if (window.google)
        {
            const autocomplete = new window.google.maps.places.Autocomplete(cityInputRef.current,
              {
                types: ['(cities)'],
                componentRestrictions: { country: "us" }
            });

            autocomplete.addListener("place_changed", () =>
            {
                const place = autocomplete.getPlace();
                setLocation(prevLocation => (
                  {
                    ...prevLocation,
                    city: place.address_components[0].long_name
                }));
            });
        }
    }, []);

    useEffect(() =>
    {
        localStorage.setItem("favorites", JSON.stringify(favorites));
    }, [favorites]);

    const handleAddToFavorites = async (city, state) =>
    {
        if (!favorites.some((fav) => fav.city === city))
        {
          try
          {
            await axios.post("https://backend-service-dot-webtechass3-441707.wl.r.appspot.com/api/favorites", { city, state });
            setFavorites([...favorites, { city, state }]);
            setSearchResults((results) =>
                results.filter((result) => result.city !== city)
            );
          }
          catch(error)
          {
          console.error("Failed to add favorite:", error);
          }
        }
    };

    const handleRemoveFromFavorites = async (city) =>
    {
      try
      {
        await axios.delete(`https://backend-service-dot-webtechass3-441707.wl.r.appspot.com/api/favorites/${city}`);
        setFavorites(favorites.filter((fav) => fav.city !== city));
      }
      catch(error)
      {
        console.error("Failed to remove favorite:", error);
      }
    };



    const handleCitySearch = async (city, state) =>
    {
      console.log("City selected from Favorites:", city, state);
      const address = `${city}, ${state}`;
      try
      {
          const geocodeResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyBMd3g5DdaKCEJ787hqOVruGSEb2V1f1Bg&libraries=places`);
          if (geocodeResponse.data.results.length > 0)
          {
              const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
              console.log("Lat/Lon fetched for city:", { lat, lng });
              const addressComponents = geocodeResponse.data.results[0].address_components;
              let extractedCity = '';
              let extractedState = '';addressComponents.forEach(component =>
                {
                  if (component.types.includes("locality"))
                  {
                      extractedCity = component.long_name;
                  }
                  if (component.types.includes("administrative_area_level_1"))
                  {
                      extractedState = component.long_name;
                  }
                });
              if (!extractedCity || !extractedState)
              {
                setSearchError("An error occurred. Please try again later.");
                setShowForecast(false);
                return;
            }
              setLocation(prevLocation => (
                {
                  ...prevLocation,
                  city: extractedCity,
                  state: extractedState,
                  lat: lat,
                  lon: lng
                }));
            setShowForecast(true);
            setIsLocationFetched(true);
            fetchWeatherData(lat, lng, '1d');
            fetchWeatherData(lat, lng, '1h');
            setSelectedTab("Results");
            }
          }
          catch (error)
          {
            console.error("Error fetching lat/lon for the address:", error);
            setShowForecast(false);
            setIsLocationFetched(false);
            setSearchError('An error occurred. Please try again later.');
          }
        };


    const isCityInFavorites = (city) =>
    {
        return favorites.some(fav => fav.city === city);
    };


    const handleInputChange = (e) =>
    {
        const { name, value } = e.target;
        setLocation((prevLocation) => (
          {
            ...prevLocation,
            [name]: value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    };

    const handleCheckboxChange = (e) =>
    {
        const { name, checked } = e.target;
        if (name === "autoDetect") setAutoDetect(checked);
        if (name === "currentLocation")
        {
            setCurrentLocation(checked);
            if (checked)
            {
                setErrors({ street: '', city: '', state:''});
            }
        }
    };

    const handleRowClick = (day) =>
    {
        setSelectedDayDetails(day);
        setLastSelectedRow(day);
        initializeMapWithLatLng(location.lat, location.lon);
        setShowDetailsPane(true);
    };

    const handleDetailsButtonClick = () =>
    {
      if (lastSelectedRow)
      {
          setSelectedDayDetails(lastSelectedRow);
      }
      else if (forecastData.length > 0) {
          setSelectedDayDetails(forecastData[0]);
      }
      setShowDetailsPane(true);
    };

    const handleBackToList = () =>
    {
        setShowDetailsPane(false);
    };

    const handleTabChange = (tab) =>
    {
        setSelectedTab(tab);
    };

    const handleSubTabChange = (tab) =>
    {
        setSelectedSubTab(tab);
    };

    const tweetWeather = () =>
    {
        const tweetContent = `The temperature in ${location.city}, ${location.state} on ${selectedDayDetails.date} is ${selectedDayDetails.tempHigh}°F. The weather conditions are ${selectedDayDetails.status} #CSCI571WeatherSearch`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetContent)}`;
        window.open(twitterUrl, "_blank");
    };


    const handleKeyDown = (e, fieldName) =>
    {
      if (e.key === 'Enter' && !currentLocation)
      {
          e.preventDefault();
          validateField(fieldName);
        }
      };

   const validateField = (fieldName) =>
   {
       if (currentLocation) return;
       const newErrors = { ...errors };

       switch (fieldName)
       {
           case 'street':
               if (!location.street.trim())
               {
                   newErrors.street = 'Please enter a valid street';
               }
               else
               {
                   newErrors.street = '';
               }
               break;
           case 'city':
               if (!location.city.trim())
               {
                   newErrors.city = 'Please enter a valid city';
               }
               else
               {
                   newErrors.city = '';
               }
               break;
           case 'state':
               if (!location.state.trim() || location.state === 'Select your state')
               {
                   newErrors.state = 'Please select a valid state';
               }
               else
               {
                   newErrors.state = '';
               }
               break;
           default:
               break;
       }

       setErrors(newErrors);
};


    const handleSearch = async (e) =>
    {
        e.preventDefault();
        setLoading(true);
        setIsValidResponse(false);
        if (!currentLocation)
        {
            const newErrors = {};
            if (!location.street.trim()) newErrors.street = 'Please enter a valid street';
            if (!location.city.trim()) newErrors.city = 'Please enter a valid city';
            if (!location.state.trim() || location.state === 'Select your state') newErrors.state = 'Please select a valid state';

            setErrors(newErrors);
            if (Object.keys(newErrors).length > 0) return;
        }
        if (currentLocation)
        {
            try
            {
                const response = await axios.get(`https://ipinfo.io/json?token=5b1be4f0ed7ea6`);
                const { city, region, loc } = response.data;
                const [lat, lon] = loc.split(',');
                setLocation(prevLocation => (
                  {
                    ...prevLocation,
                    city: city,
                    state: region,
                    lat: lat,
                    lon: lon
                }));
                setShowForecast(true);
                setIsLocationFetched(true);
                setSelectedSubTab("Day View");
                fetchWeatherData(lat, lon, '1d');
                fetchWeatherData(lat, lon, '1h');
            }
            catch (error)
            {
                console.error("Error fetching current location:", error);
                setShowForecast(false);
                setSearchError('An error occurred. Please try again later.');
                setIsLocationFetched(false);
            }
            finally
            {
                setLoading(false);
            }
        }
        else if (location.street && location.city && location.state)
        {
            const address = `${location.street}, ${location.city}, ${location.state}`;
            try
            {
                const response = await axios.get(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyBMd3g5DdaKCEJ787hqOVruGSEb2V1f1Bg&libraries=places`
                );
                if (response.data.results.length > 0)
                {
                  const { lat, lng } = response.data.results[0].geometry.location;
                  const addressComponents = response.data.results[0].address_components;
                  let extractedCity = '';
                  let extractedState = '';

                  addressComponents.forEach(component =>
                    {
                      if (component.types.includes("locality"))
                      {
                          extractedCity = component.long_name;
                      }
                      if (component.types.includes("administrative_area_level_1"))
                      {
                          extractedState = component.long_name;
                      }
                  });
                  if (!extractedCity || !extractedState)
                  {
                    setSearchError("An error occurred. Please try again later.");
                    setShowForecast(false);
                    return;
                  }
                  setLocation(prevLocation => (
                    {
                      ...prevLocation,
                      city: extractedCity,
                      state: extractedState,
                      lat: lat,
                      lon: lng
                    }));
                setShowForecast(true);
                setIsLocationFetched(true);
                fetchWeatherData(lat, lng, '1d');
                fetchWeatherData(lat, lng, '1h');
              }
            }
            catch (error)
            {
                console.error("Error fetching lat/lon for the address:", error);
                setShowForecast(false);
                setIsLocationFetched(false);
                setSearchError('An error occurred. Please try again later.');
            }
            finally
            {
                setLoading(false);
            }
        }
    };

    const fetchWeatherData = async (lat, lon, interval) =>
    {
        try
        {
            const response = await axios.get(`https://backend-service-dot-webtechass3-441707.wl.r.appspot.com/api/weather`,
              {
                params: { lat, lon, interval }
              });
            if (interval === '1d')
            {
                setForecastData(response.data);
            }
            else
            {
                setHourlyData(response.data);
            }
        }
        catch (error)
        {
            console.error("Error fetching weather data:", error);
        }
    };

    const TemperatureRangeChart = ({ forecastData }) =>
    {
        const dates = forecastData.map(day => day.date);
        const tempHighs = forecastData.map(day => day.tempHigh);
        const tempLows = forecastData.map(day => day.tempLow);

        const options = {
            chart: {
                type: 'arearange',
            },
            title: {
                text: 'Temperature Ranges (Min, Max)',
            },
            xAxis: {
                categories: dates,
                crosshair: {
                    dashStyle: 'Solid',
                    width: 4,
                },
                labels: {
                    formatter: function () {
                        const date = new Date(this.value);
                        return Highcharts.dateFormat('%e %b', date.getTime());
                    },
                },
            },
            yAxis: {
                title: {
                    text: 'Temperature (°F)',
                },
            },
            series: [
                {
                    name: 'Temperatures',
                    data: tempHighs.map((high, index) => [tempLows[index], high]),
                    color: '#FF8C00',
                    fillColor: {
                        linearGradient: [0, 0, 0, 300],
                        stops: [
                            [0, 'rgba(255, 140, 0, 0.7)'],
                            [0.7, 'rgba(135, 206, 250, 0.7)'],
                            [1, 'rgba(135, 206, 250, 1)'],
                        ],
                    },
                    marker: {
                        fillColor: '#1E90FF',
                        lineWidth: 2,
                        lineColor: '#FF8C00',
                    },
                    lineWidth: 2,
                },
            ],
        };

        return (
            <div id="temperature_chart">
                <HighchartsReact highcharts={Highcharts} options={options} />
            </div>
        );
    };

    const parseCustomDate = (dateStr) =>
    {
        const [dayStr, time, period] = dateStr.split(' ');
        const daysMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const today = new Date();
        const targetDay = daysMap[dayStr];
        const currentDay = today.getDay();
        let dayDifference = targetDay - currentDay;
        if (dayDifference < 0) dayDifference += 7;

        let [hour, minute] = time.split(':').map(Number);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;

        const resultDate = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate() + dayDifference,
              hour,
              minute
          );

          return resultDate.getTime();
        };

        const meteogramOptions =
        {
              chart: { type: 'column' },
              title: { text: 'Hourly Weather (Next 5 Days)' },
              xAxis: {
                  type: 'datetime',
                  labels: {
                    formatter: function () {
                    return Highcharts.dateFormat('%H', this.value);
                },align: 'center',
                  },
                  tickInterval: 3600 * 1000 * 4,
              },
              yAxis: [
                  {
                      title: { text: 'Temperature (°F)' },
                      labels: { format: '{value}°F' },
                  },
                  {
                      title: { text: 'Pressure (inHg)' },
                      opposite: true,
                      labels: { format: '{value} inHg' },
                  }
              ],
              tooltip: {
                  shared: true,
                  formatter: function () {
                      const point = this.points[0].point;
                      return `<b>${Highcharts.dateFormat('%A, %b %e, %I:%M %p', point.x)}</b><br/>` +
                          `Temperature: ${point.temperature}°F<br/>` +
                          `Humidity: ${point.humidity}%<br/>` +
                          `Pressure: ${point.pressure} inHg<br/>` +
                          `Wind: ${point.windSpeed} mph`;
                  },
              },
              series: [
                  {
                      name: 'Temperature',
                      data: hourlyData.map((hour) => {
                          const parsedDate = parseCustomDate(hour.date);
                          return {
                              x: parsedDate,
                              y: hour.temperature,
                              temperature: hour.temperature,
                              humidity: hour.humidity,
                              pressure: hour.pressure,
                              windSpeed: hour.windSpeed,
                          };
                      }),
                      type: 'line',
                      color: '#FF0000'
                  },
                  {
                      name: 'Humidity',
                      data: hourlyData.map((hour) => {
                          const parsedDate = parseCustomDate(hour.date);
                          return {
                              x: parsedDate,
                              y: hour.humidity,
                          };
                      }),
                      type: 'column',
                      color: '#1E90FF',
                      yAxis: 0
                  },
                  {
                      name: 'Pressure',
                      data: hourlyData.map((hour) => {
                          const parsedDate = parseCustomDate(hour.date);
                          return {
                              x: parsedDate,
                              y: hour.pressure,
                          };
                      }),
                      type: 'spline',
                      color: '#FFA500',
                      yAxis: 1
                  },
                  {
                      name: 'Wind',
                      type: 'windbarb',
                      data: hourlyData.map((hour) => {
                          const parsedDate = parseCustomDate(hour.date);
                          return {
                              x: parsedDate,
                              value: hour.windSpeed,
                              direction: hour.windDirection,
                          };
                      }),
                      color: '#000000',
                      vectorLength: 10
                  }
        ]
    };

    const handleClear = () =>
    {
        setLocation({ street: '', city: '', state: '', lat: '', lon: '' });
        setAutoDetect(false);
        setCurrentLocation(false);
        setErrors({});
        setSearchError('');
        setIsLocationFetched(false);
        setShowForecast(false);
        setIsValidResponse(false);
        setSelectedTab("Results");
        setShowDetailsPane(false);
    };

    useEffect(() =>
    {
        const isFormFilled = location.street.trim() && location.city.trim() && location.state.trim();
        setIsSearchEnabled(isFormFilled || currentLocation);
    }, [location, currentLocation]);

    return (
        <div className="form-container">
            <div className="container mt-5 p-4 border rounded bg-light">
                <h2 className="text-center mb-4">
                    Weather Search<span>⛅</span>
                </h2>

                <div className="form-group row">
                    <label htmlFor="street" className="col-sm-2 col-form-label">Street<span className="text-danger">*</span></label>
                    <div className="col-sm-10">
                        <input
                            type="text"
                            name="street"
                            value={location.street}
                            onKeyDown={(e) => handleKeyDown(e, 'street')}
                            onChange={handleInputChange}
                            className={`form-control ${errors.street ? 'is-invalid' : ''}`}
                            required
                            disabled={currentLocation}
                        />
                        {errors.street && <div className="invalid-feedback">{errors.street}</div>}
                    </div>
                </div>

                <div className="form-group row">
                    <label htmlFor="city" className="col-sm-2 col-form-label">City<span className="text-danger">*</span></label>
                    <div className="col-sm-10">
                        <input
                            type="text"
                            name="city"
                            value={location.city}
                            onChange={handleInputChange}
                            onKeyDown={(e) => handleKeyDown(e, 'city')}
                            className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                            required
                            disabled={currentLocation}
                            ref={cityInputRef}
                        />
                        {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                    </div>
                </div>

                <div className="form-group row">
                    <label htmlFor="state" className="col-sm-2 col-form-label">State<span className="text-danger">*</span></label>
                    <div className="col-sm-10">
                        <select
                            name="state"
                            value={location.state}
                            onChange={handleInputChange}
                            className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                            onKeyDown={(e) => handleKeyDown(e, 'state')}
                            required
                            disabled={currentLocation}
                        >
                            <option value="">Select your state</option>
                            <option value="Alabama">Alabama</option>
                            <option value="Alaska">Alaska</option>
                            <option value="Arizona">Arizona</option>
                            <option value="Arkansas">Arkansas</option>
                            <option value="California">California</option>
                            <option value="Colorado">Colorado</option>
                            <option value="Connecticut">Connecticut</option>
                            <option value="Delaware">Delaware</option>
                            <option value="District of Columbia">District of Columbia</option>
                            <option value="Florida">Florida</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Hawaii">Hawaii</option>
                            <option value="Idaho">Idaho</option>
                            <option value="Illinois">Illinois</option>
                            <option value="Indiana">Indiana</option>
                            <option value="Iowa">Iowa</option>
                            <option value="Kansas">Kansas</option>
                            <option value="Kentucky">Kentucky</option>
                            <option value="Louisiana">Louisiana</option>
                            <option value="Maine">Maine</option>
                            <option value="Maryland">Maryland</option>
                            <option value="Massachusetts">Massachusetts</option>
                            <option value="Michigan">Michigan</option>
                            <option value="Minnesota">Minnesota</option>
                            <option value="Mississippi">Mississippi</option>
                            <option value="Missouri">Missouri</option>
                            <option value="Montana">Montana</option>
                            <option value="Nebraska">Nebraska</option>
                            <option value="Nevada">Nevada</option>
                            <option value="New Hampshire">New Hampshire</option>
                            <option value="New Jersey">New Jersey</option>
                            <option value="New Mexico">New Mexico</option>
                            <option value="New York">New York</option>
                            <option value="North Carolina">North Carolina</option>
                            <option value="North Dakota">North Dakota</option>
                            <option value="Ohio">Ohio</option>
                            <option value="Oklahoma">Oklahoma</option>
                            <option value="Oregon">Oregon</option>
                            <option value="Pennsylvania">Pennsylvania</option>
                            <option value="Rhode Island">Rhode Island</option>
                            <option value="SC">South Carolina</option>
                            <option value="South Dakota">South Dakota</option>
                            <option value="Tennessee">Tennessee</option>
                            <option value="Texas">Texas</option>
                            <option value="Utah">Utah</option>
                            <option value="Vermont">Vermont</option>
                            <option value="Virginia">Virginia</option>
                            <option value="Washington">Washington</option>
                            <option value="West Virginia">West Virginia</option>
                            <option value="Wisconsin">Wisconsin</option>
                            <option value="Wyoming">Wyoming</option>
                        </select>
                        {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                    </div>
                </div>

                <hr />

                <div className="d-flex justify-content-center align-items-center mb-3">
                    <label className="form-check-label mr-2">
                        <span>Autodetect Location</span><span className="text-danger">*</span>
                    </label>
                    <input
                        type="checkbox"
                        name="currentLocation"
                        checked={currentLocation}
                        onChange={handleCheckboxChange}
                        className="form-check-input mx-2"
                    />
                    <span>Current Location</span>
                </div>

                <div className="d-flex justify-content-center mb-3">
                    <button
                        onClick={handleSearch}
                        className="btn btn-primary mx-2"
                        disabled={!isSearchEnabled}
                        style={{ opacity: isSearchEnabled ? 1 : 0.3 }}
                    >
                        <i className="fas fa-search"></i> Search
                    </button>
                    <button onClick={handleClear} className="btn btn-clear mx-2">
                        <img
                            src={`${process.env.PUBLIC_URL}/WeatherCodes/list-nested.svg`}
                            alt="Clear Icon"
                            style={{ width: '20px', height: '20px', marginRight: '5px' }}
                        />
                        Clear
                    </button>
                </div>
            </div>

            <div className="d-flex justify-content-center mt-3">
                <button
                    className={`btn mx-2 ${selectedTab === "Results" ? "btn-primary text-white" : "btn-inactive"}`}
                    onClick={() => handleTabChange("Results")}
                >
                    Results
                </button>
                <button
                    className={`btn mx-2 ${selectedTab === "Favorites" ? "btn-primary text-white" : "btn-inactive"}`}
                    onClick={() => handleTabChange("Favorites")}
                >
                    Favorites
                </button>
            </div>

            {loading && (
                    <div className="progress mt-4">
                        <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            role="progressbar"
                            style={{ width: '100%' }}
                            aria-valuenow="100"
                            aria-valuemin="0"
                            aria-valuemax="100"
                        ></div>
                    </div>
                )}

            {searchError ? (
              <div className="alert alert-danger mt-3" role="alert">
                {searchError}
              </div>
            ) : selectedTab === "Results" && showForecast && (
              <div className="content-area">
                  <div className="results-details-container">
                    {showDetailsPane ? (
                      <div className= "details-pane">
                        <div className="details-header">
                           <button className="back-button" onClick={handleBackToList}>
                              <img
                                  src={`${process.env.PUBLIC_URL}/WeatherCodes/pt_right.png`}
                                  alt="Right arrow icon"
                                  style={{ width: '12px', height: '12px', marginRight: '5px' }}
                              />
                              List
                          </button>

                               <h2>{selectedDayDetails?.date}</h2>
                               <button className="close-button" onClick={tweetWeather}>
                                  <img
                                      src={`${process.env.PUBLIC_URL}/WeatherCodes/twitter-x.svg`}
                                      alt="Twitter"
                                      style={{ width: '12px', height: '12px', marginRight: '5px' }}
                                  />
                              </button>
                       </div>
                       <table className="table table-striped">
                           <tbody>
                               <tr><td><b>Status</b></td><td>{selectedDayDetails?.status}</td></tr>
                               <tr><td><b>Max Temperature</b></td><td>{selectedDayDetails?.tempHigh}°F</td></tr>
                               <tr><td><b>Min Temperature</b></td><td>{selectedDayDetails?.tempLow}°F</td></tr>
                               <tr><td><b>Apparent Temperature</b></td><td>{selectedDayDetails?.apparentTemp}°F</td></tr>
                               <tr><td><b>Sun Rise Time</b></td><td>{selectedDayDetails?.sunRiseTime}</td></tr>
                               <tr><td><b>Sun Set Time</b></td><td>{selectedDayDetails?.sunSetTime}</td></tr>
                               <tr><td><b>Humidity</b></td><td>{selectedDayDetails?.humidity}%</td></tr>
                               <tr><td><b>Wind Speed</b></td><td>{selectedDayDetails?.windSpeed} mph</td></tr>
                               <tr><td><b>Visibility</b></td><td>{selectedDayDetails?.visibility} mi</td></tr>
                               <tr><td><b>Cloud Cover</b></td><td>{selectedDayDetails?.cloudCover}%</td></tr>
                            </tbody>
                        </table>
                        <div id="map" ref={mapRef} style={{ height: '400px', width: '100%', marginTop: '20px' }}></div>
                    </div>
                 ) : (
                   <div className="results-section">
                       {isLocationFetched && (
                           <h2 className="text-center mt-3">
                               Forecast at {location.city}, {location.state}
                           </h2>
                       )}

                       <div className="d-flex justify-content-end align-items-center mt-2 mb-4">
                           {forecastData.length > 0 && (
                              <button
                                  className="btn btn-light"
                                  onClick={() => {
                                      if (isCityInFavorites(location.city)) {
                                        handleRemoveFromFavorites(location.city);
                                      } else {
                                        handleAddToFavorites(location.city, location.state);
                                      }
                                    }}
                              >
                                  <img
                                  src={
                                        isCityInFavorites(location.city)
                                          ? `${process.env.PUBLIC_URL}/WeatherCodes/star-fill.svg`
                                          : `${process.env.PUBLIC_URL}/WeatherCodes/star.svg`
                                      }
                                      alt="Add to Favorites"
                                      style={{ width: '20px', marginRight: '5px' }}
                                  />
                              </button>
                          )}

                           <button
                              className="btn btn-light d-flex align-items-center"
                              style={{ border: '1px solid #ccc', padding: '6px 12px' }}
                              onClick={handleDetailsButtonClick}
                          >
                              <span style={{ fontWeight: '500', fontSize: '14px' }}>Details</span>
                              <img
                                  src={`${process.env.PUBLIC_URL}/WeatherCodes/pt_left.png`}
                                  alt="Right arrow icon"
                                  style={{ width: '12px', height: '12px', marginLeft: '5px' }}
                              />
                          </button>

                       </div>

                       <div className="d-flex justify-content-end align-items-center mt-2">
                           <button
                               className={`btn ${selectedSubTab === "Day View" ? "text-dark" : "text-primary"}`}
                               onClick={() => handleSubTabChange("Day View")}
                               style={{
                                   background: "none",
                                   padding: "8px 16px",
                                   marginRight: "8px",
                                   cursor: "pointer",
                                   border: selectedSubTab === "Day View" ? "1px solid #ccc" : "none",
                                   borderBottom: selectedSubTab === "Day View" ? "none" : "1px solid #ccc",
                                   color: selectedSubTab === "Day View" ? "#000" : "#007bff",
                                   borderRadius: selectedSubTab === "Day View" ? "6px 6px 0 0" : "0",
                               }}
                               onMouseEnter={(e) => {
                                   e.target.style.border = "1px solid #ccc";
                                   e.target.style.borderRadius = "6px";
                               }}
                               onMouseLeave={(e) => {
                                   if (selectedSubTab !== "Day View") {
                                       e.target.style.border = "none";
                                       e.target.style.borderBottom = "1px solid #ccc";
                                       e.target.style.borderRadius = "0";
                                   }
                               }}
                           >
                               Day View
                           </button>

                           <button
                               className={`btn ${selectedSubTab === "Daily Temp. Chart" ? "text-dark" : "text-primary"}`}
                               onClick={() => handleSubTabChange("Daily Temp. Chart")}
                               style={{
                                   background: "none",
                                   padding: "8px 16px",
                                   marginRight: "8px",
                                   cursor: "pointer",
                                   border: selectedSubTab === "Daily Temp. Chart" ? "1px solid #ccc" : "none",
                                   borderBottom: selectedSubTab === "Daily Temp. Chart" ? "none" : "1px solid #ccc",
                                   color: selectedSubTab === "Daily Temp. Chart" ? "#000" : "#007bff",
                                   borderRadius: selectedSubTab === "Daily Temp. Chart" ? "6px 6px 0 0" : "0",
                               }}
                               onMouseEnter={(e) => {
                                   e.target.style.border = "1px solid #ccc";
                                   e.target.style.borderRadius = "6px";
                               }}
                               onMouseLeave={(e) => {
                                   if (selectedSubTab !== "Daily Temp. Chart") {
                                       e.target.style.border = "none";
                                       e.target.style.borderBottom = "1px solid #ccc";
                                       e.target.style.borderRadius = "0";
                                   }
                               }}
                           >
                               Daily Temp. Chart
                           </button>

                           <button
                               className={`btn ${selectedSubTab === "Meteogram" ? "text-dark" : "text-primary"}`}
                               onClick={() => handleSubTabChange("Meteogram")}
                               style={{
                                   background: "none",
                                   padding: "8px 16px",
                                   cursor: "pointer",
                                   border: selectedSubTab === "Meteogram" ? "1px solid #ccc" : "none",
                                   borderBottom: selectedSubTab === "Meteogram" ? "none" : "1px solid #ccc",
                                   color: selectedSubTab === "Meteogram" ? "#000" : "#007bff",
                                   borderRadius: selectedSubTab === "Meteogram" ? "6px 6px 0 0" : "0",
                               }}
                               onMouseEnter={(e) => {
                                   e.target.style.border = "1px solid #ccc";
                                   e.target.style.borderRadius = "6px";
                               }}
                               onMouseLeave={(e) => {
                                   if (selectedSubTab !== "Meteogram") {
                                       e.target.style.border = "none";
                                       e.target.style.borderBottom = "1px solid #ccc";
                                       e.target.style.borderRadius = "0";
                                   }
                               }}
                           >
                               Meteogram
                           </button>
                       </div>

                       <div className="tab-content mt-3">
                           {selectedSubTab === "Day View" && forecastData.length > 0 && (
                               <div className="table-responsive mt-4">
                                   <table className="table table-striped">
                                       <thead>
                                           <tr>
                                               <th>#</th>
                                               <th>Date</th>
                                               <th>Status</th>
                                               <th>Temp. High(°F)</th>
                                               <th>Temp. Low(°F)</th>
                                               <th>Wind Speed(mph)</th>
                                           </tr>
                                       </thead>
                                       <tbody>
                                           {forecastData.map((day, index) => (
                                               <tr key={index} onClick={() => handleRowClick(day)} style={{ cursor: 'pointer' }}>
                                                   <td>{index + 1}</td>
                                                   <td>{day.date}</td>
                                                   <td>
                                                       <img src={day.icon} alt={day.status} style={{ width: "20px", marginRight: "5px" }} />
                                                       {day.status}
                                                   </td>
                                                   <td>{day.tempHigh.toFixed(2)}</td>
                                                   <td>{day.tempLow.toFixed(2)}</td>
                                                   <td>{day.windSpeed.toFixed(2)}</td>
                                               </tr>
                                           ))}
                                       </tbody>
                                   </table>
                               </div>
                           )}
                           {selectedSubTab === "Daily Temp. Chart" && (
                               <div className="chart-container mt-4">
                                   <TemperatureRangeChart forecastData={forecastData} />
                               </div>
                           )}
                           {selectedSubTab === "Meteogram" && (
                               <HighchartsReact highcharts={Highcharts} options={meteogramOptions} />
                           )}
                       </div>
                   </div>
               )}
               </div>
           </div>
         )}
       {selectedTab === "Favorites" && (
               <div className="favorites-container mt-3">
                  {console.log("Rendering Favorites Tab:", favorites)}
                   {favorites.length === 0 ? (
                       <div className="no-records-alert" role="alert">
                           Sorry, No records found.
                       </div>
                   ) : (
                       <table className="table table-striped">
                           <thead>
                               <tr>
                                   <th>#</th>
                                   <th>City</th>
                                   <th>State</th>
                                   <th>Actions</th>
                               </tr>
                           </thead>
                           <tbody>
                               {favorites.map((fav, index) => (
                                   <tr key={index}>
                                       <td>{index + 1}</td>
                                       <td>
                                           <button
                                               className="btn btn-link"
                                               onClick={() => handleCitySearch(fav.city, fav.state)}
                                           >
                                               {fav.city}
                                           </button>
                                       </td>
                                       <td>{fav.state}</td>
                                       <td>
                                           <button
                                               className="btn btn-danger"
                                               onClick={() => handleRemoveFromFavorites(fav.city)}
                                           >
                                               <img
                                                   src={`${process.env.PUBLIC_URL}/WeatherCodes/trash.svg`}
                                                   alt="Remove"
                                                   style={{ width: '20px' }}
                                               />
                                           </button>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   )}

               </div>
           )}

    </div>
)};

export default WeatherSearch;
