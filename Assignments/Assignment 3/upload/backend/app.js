const express = require('express');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();
const cors = require('cors');

const app = express();
MONGO_URI = "mongodb+srv://pranavko12:9004270429pk1211@fav.cvg6p.mongodb.net/?retryWrites=true&w=majority&appName=Fav"
const client = new MongoClient(MONGO_URI);
let db;
const connectDB = async () =>
{
  if (!db)
  {
    try
    {
      await client.connect();
      db = client.db("fav");
      console.log("Connected to MongoDB");
    }
    catch (error)
    {
      console.error("Error connecting to MongoDB:", error);
      process.exit(1);
    }
  }
  return db;
};

const WeatherCode =
{
    1000: {description: "Clear", icon: "WeatherCodes/clear.svg"},
    1100: {description: "Mostly Clear", icon: "WeatherCodes/mostly_clear.svg"},
    1101: {description: "Partly Cloudy", icon: "WeatherCodes/partly_cloudy.svg"},
    1102: {description: "Mostly Cloudy", icon: "WeatherCodes/mostly_cloudy.svg"},
    1001: {description: "Cloudy", icon: "WeatherCodes/cloudy.svg"},
    4000: {description: "Drizzle", icon: "WeatherCodes/drizzle.svg"},
    5001: {description: "Flurries", icon: "WeatherCodes/flurries.svg"},
    2000: {description: "Fog", icon: "WeatherCodes/fog.svg"},
    2100: {description: "Light Fog", icon: "WeatherCodes/fog_light.svg"},
    6000: {description: "Freezing Drizzle", icon: "WeatherCodes/freezing_drizzle.svg"},
    6001: {description: "Freezing Rain", icon: "WeatherCodes/freezing_rain.svg"},
    6201: {description: "Heavy Freezing Rain", icon: "WeatherCodes/freezing_rain_heavy.svg"},
    6200: {description: "Light Freezing Rain", icon: "WeatherCodes/freezing_rain_light.svg"},
    7000: {description: "Ice Pellets", icon: "WeatherCodes/ice_pellets.svg"},
    7101: {description: "Heavy Ice Pellets", icon: "WeatherCodes/ice_pellets_heavy.svg"},
    7102: {description: "Light Ice Pellets", icon: "WeatherCodes/ice_pellets_light.svg"},
    5000: {description: "Snow", icon: "WeatherCodes/snow.svg"},
    5101: {description: "Heavy Snow", icon: "WeatherCodes/snow_heavy.svg"},
    5100: {description: "Light Snow", icon: "WeatherCodes/snow_light.svg"},
    4201: {description: "Heavy Rain", icon: "WeatherCodes/rain_heavy.svg"},
    4200: {description: "Light Rain", icon: "WeatherCodes/rain_light.svg"},
    4001: {description: "Rain", icon: "WeatherCodes/rain.svg"},
    3001: {description: "Strong Wind", icon: "WeatherCodes/strong_wind.png"},
    3000: {description: "Wind", icon: "WeatherCodes/wind.png"},
    3002: {description: "Light Wind", icon: "WeatherCodes/light_wind.jpg"},
    8000: {description: "T-storm", icon: "WeatherCodes/tstorm.svg"}
};

app.use(express.json());

app.use((req, res, next) =>
{
  res.setHeader(
    "Content-Security-Policy",
    `
        default-src 'self';
        img-src 'self' data: https://maps.gstatic.com https://maps.googleapis.com;
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com;
        connect-src 'self' https://maps.googleapis.com https://ipinfo.io;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
    `.replace(/\s{2,}/g, " ").trim()
  );
  next();
});

app.use(cors(
  {
    origin: "https://frontend-service-dot-webtechass3-441707.wl.r.appspot.com",
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

app.options('*', (req, res) =>
{
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});


app.get("/api/favorites", async (req, res) =>
{
  try
  {
    const db = await connectDB();
    const favorites = await db.collection("ass3").find({}).toArray();
    res.status(200).json(favorites);
  }
  catch (error)
  {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

app.post("/api/favorites", async (req, res) =>
{
  const { city, state } = req.body;
  if (!city || !state)
  {
    return res.status(400).json({ error: "City and State are required" });
  }
  try
  {
    const db = await connectDB();
    await db.collection("ass3").insertOne({ city, state });
    res.status(201).json({ message: "Favorite added successfully" });
  }
  catch (error)
  {
    console.error("Error adding favorite:", error);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

app.delete("/api/favorites/:city", async (req, res) =>
{
  const { city } = req.params;
  try
  {
    const db = await connectDB();
    const result = await db.collection("ass3").deleteOne({ city });
    if (result.deletedCount === 0)
    {
      return res.status(404).json({ error: "City not found in favorites" });
    }
    res.status(200).json({ message: "Favorite removed successfully" });
  }
  catch (error)
  {
    console.error("Error removing favorite:", error);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

app.use(express.static(path.join(__dirname, "../frontend/build")));


app.get('/api/weather', async (req, res) =>
{
    const { lat, lon, interval } = req.query;
    if (!lat || !lon || !interval) return res.status(400).json({ error: 'Latitude, longitude and interval are required' });
    const fields = interval === '1h'
        ? ['temperature', 'humidity', 'pressureSeaLevel', 'windSpeed', 'weatherCode']
        : ['temperatureMax', 'temperatureMin','temperatureApparent', 'windSpeed', 'weatherCode','humidity', 'visibility', 'cloudCover', 'sunriseTime','sunsetTime'];

    const timelineInterval = interval || '1d';

    try
    {
       const response = await axios.get(`https://api.tomorrow.io/v4/timelines`,
         {
           params:
           {
               location: `${lat},${lon}`,
               fields: interval === '1d'
                   ? ['temperatureMax', 'temperatureMin','temperatureApparent', 'windSpeed', 'weatherCode','humidity', 'visibility', 'cloudCover', 'sunriseTime','sunsetTime']
                   : ['temperature', 'humidity', 'pressureSeaLevel', 'windSpeed', 'weatherCode'],
               timesteps: interval,
               units: 'imperial',
               timezone: 'America/New_York',
               apikey: process.env.TOMORROW_API_KEY,
           },
       });

       if (interval === '1d')
       {
           const dailyData = response.data.data.timelines[0].intervals.map(interval =>
             {
               const date = new Date(interval.startTime).toLocaleDateString('en-US',
               {
                   weekday: 'long',
                   year: 'numeric',
                   month: 'short',
                   day: 'numeric'
               });
               const weatherCode = interval.values.weatherCode;
               const status = WeatherCode[weatherCode] || { description: 'Unknown', icon: '' };

               return {
                date,
                status: status.description,
                icon: status.icon,
                tempHigh: interval.values.temperatureMax,
                tempLow: interval.values.temperatureMin,
                apparentTemp: interval.values.temperatureApparent,
                sunRiseTime: new Date(interval.values.sunriseTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
                sunSetTime: new Date(interval.values.sunsetTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
                humidity: interval.values.humidity,
                windSpeed: interval.values.windSpeed,
                visibility: interval.values.visibility,
                cloudCover: interval.values.cloudCover
            };
           });
           res.json(dailyData);
       }
       else
       {
           const hourlyData = response.data.data.timelines[0].intervals.map(interval =>
             {
               const date = new Date(interval.startTime).toLocaleString('en-US',
               {
                   weekday: 'short',
                   hour: '2-digit',
                   minute: '2-digit'
               });
               const weatherCode = interval.values.weatherCode;
               const status = WeatherCode[weatherCode] || { description: 'Unknown', icon: '' };

               return {
                   date,
                   temperature: interval.values.temperature,
                   humidity: interval.values.humidity,
                   pressure: interval.values.pressureSeaLevel,
                   windSpeed: interval.values.windSpeed,
                   status: status.description,
                   icon: status.icon
               };
           });
           res.json(hourlyData);
       }
   }
   catch (error)
   {
       console.error("Error fetching weather data:", error);
       res.status(500).json({ error: 'Failed to fetch weather data' });
   }
});

app.get('/api/weather/details', async (req, res) =>
{
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    try
    {
        const response = await axios.get(`https://api.tomorrow.io/v4/timelines`,
          {
            params:
            {
                location: 'YOUR_LAT_LON',
                fields: ['temperatureMax', 'temperatureMin', 'temperatureApparent', 'humidity', 'windSpeed', 'cloudCover', 'sunriseTime', 'sunsetTime'],
                timesteps: '1d',
                units: 'imperial',
                timezone: 'America/New_York',
                apikey: process.env.TOMORROW_API_KEY,
            },
        });

        const detailedData = response.data.data.timelines[0].intervals.find(interval =>
          {
            const intervalDate = new Date(interval.startTime).toLocaleDateString('en-US');
            return intervalDate === new Date(date).toLocaleDateString('en-US');
        });

        if (detailedData) {
            const weatherCode = detailedData.values.weatherCode;
            const status = WeatherCode[weatherCode] || { description: 'Unknown', icon: '' };
            res.json({
                date,
                status: status.description,
                icon: status.icon,
                tempHigh: detailedData.values.temperatureMax,
                tempLow: detailedData.values.temperatureMin,
                apparentTemp: detailedData.values.temperatureApparent,
                sunRiseTime: new Date(detailedData.values.sunriseTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
                sunSetTime: new Date(detailedData.values.sunsetTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
                humidity: detailedData.values.humidity,
                windSpeed: detailedData.values.windSpeed,
                visibility: detailedData.values.visibility,
                cloudCover: detailedData.values.cloudCover,
            });
        }
        else
        {
            res.status(404).json({ error: 'No detailed data found for this date' });
        }
    }
    catch (error)
    {
        console.error("Error fetching detailed weather data:", error);
        res.status(500).json({ error: 'Failed to fetch detailed weather data' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
