package com.example.assignment4_pkolhe_mobile

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.ImageView
import android.graphics.Color
import android.widget.TableLayout
import android.widget.TableRow
import android.widget.TextView
import android.widget.ImageButton
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import android.widget.Toast
import androidx.core.content.ContextCompat
import okhttp3.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class HomeActivity : AppCompatActivity()
{
    private lateinit var cityName: TextView
    private lateinit var temperature: TextView
    private lateinit var weatherSummary: TextView
    private lateinit var humidity: TextView
    private lateinit var windSpeed: TextView
    private lateinit var visibility: TextView
    private lateinit var pressure: TextView
    private lateinit var weatherIcon: ImageView
    private lateinit var weeklyForecastTable: TableLayout
    private lateinit var searchButton: ImageView
    private lateinit var placeholderDots: LinearLayout

    private var temperatureValue: Int = 0
    private var pressureValue: Double = 0.0
    private var summary: String = ""
    private var humidityValue: Int = 0
    private var windSpeedValue: Double = 0.0
    private var visibilityValue: Double = 0.0
    private var cloudCoverValue: Int = 0
    private val tempHighList = mutableListOf<Int>()
    private val tempLowList = mutableListOf<Int>()
    private val datesList = mutableListOf<String>()
    private lateinit var toggleIcon: ImageView
    private val defaultCity = "Los Angeles"

    private val backendUrl = "https://backend-service-dot-webtechass3-441707.wl.r.appspot.com"
    private val geocodeUrl = "https://maps.googleapis.com/maps/api/geocode/json"
    private val apiKey = "AIzaSyBJu5-rCtn-37xsclF-73p830YSb5z259c"
    private val ipInfoUrl = "https://ipinfo.io/json?token=5b1be4f0ed7ea6"

    private val weatherIconMap = mapOf(
        "Clear" to R.drawable.clear,
        "Mostly Clear" to R.drawable.mostly_clear,
        "Partly Cloudy" to R.drawable.partly_cloudy,
        "Mostly Cloudy" to R.drawable.mostly_cloudy,
        "Cloudy" to R.drawable.cloudy,
        "Drizzle" to R.drawable.drizzle,
        "Rain" to R.drawable.rain,
        "Heavy Rain" to R.drawable.rain_heavy,
        "Light Rain" to R.drawable.rain_light,
        "Snow" to R.drawable.snow,
        "Heavy Snow" to R.drawable.snow_heavy,
        "Light Snow" to R.drawable.snow_light,
        "Freezing Rain" to R.drawable.freezing_rain,
        "Heavy Freezing Rain" to R.drawable.freezing_rain_heavy,
        "Light Freezing Rain" to R.drawable.freezing_rain_light,
        "Ice Pellets" to R.drawable.ice_pellets,
        "Heavy Ice Pellets" to R.drawable.ice_pellets_heavy,
        "Light Ice Pellets" to R.drawable.ice_pellets_light,
        "Fog" to R.drawable.fog,
        "Light Fog" to R.drawable.fog_light,
        "Freezing Drizzle" to R.drawable.freezing_drizzle,
        "Flurries" to R.drawable.flurries,
        "Thunderstorm" to R.drawable.tstorm,
        "Strong Wind" to R.drawable.strong_wind,
        "Wind" to R.drawable.wind,
        "Light Wind" to R.drawable.light_wind
    )

    override fun onCreate(savedInstanceState: Bundle?)
    {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        val backButton = findViewById<ImageButton>(R.id.back_button)
        val appTitle = findViewById<TextView>(R.id.app_title)

        val cityNameIntent = intent.getStringExtra("city_name")
        if (cityNameIntent != null && cityNameIntent != "Los Angeles")
        {
            backButton.visibility = View.VISIBLE
            appTitle.text = cityNameIntent
        }
        else
        {
            backButton.visibility = View.GONE
            appTitle.text = "WeatherApp"
        }

        backButton.setOnClickListener {
            val intent = Intent(this, HomeActivity::class.java).apply {
                putExtra("city_name", "Los Angeles")
            }
            startActivity(intent)
            finish()
        }

        placeholderDots = findViewById(R.id.placeholder_dots)
        loadFavoriteDots()

        cityName = findViewById(R.id.city_name)
        temperature = findViewById(R.id.temperature)
        weatherSummary = findViewById(R.id.weather_summary)
        humidity = findViewById(R.id.humidity)
        windSpeed = findViewById(R.id.wind_speed)
        visibility = findViewById(R.id.visibility)
        pressure = findViewById(R.id.pressure)
        weatherIcon = findViewById(R.id.weather_icon)
        weeklyForecastTable = findViewById(R.id.weekly_forecast_table)
        searchButton = findViewById(R.id.search_button)

        val detailsButton: ImageButton = findViewById(R.id.info_button)
        detailsButton.setOnClickListener {
            val intent = Intent(this, DetailsActivity::class.java).apply {
                putExtra("city_name", cityName.text.toString())
                putExtra("temperature", temperatureValue.toString())
                putExtra("pressure", "${"%.2f".format(pressureValue)} inHg")
                putExtra("weather_summary", summary)
                putExtra("humidity", "$humidityValue%")
                putExtra("wind_speed", "${"%.2f".format(windSpeedValue)} mph")
                putExtra("visibility", "${"%.2f".format(visibilityValue)} mi")
                putExtra("cloud_cover", "$cloudCoverValue%")
                putIntegerArrayListExtra("temp_high_list", ArrayList(tempHighList))
                putIntegerArrayListExtra("temp_low_list", ArrayList(tempLowList))
                putStringArrayListExtra("dates_list", ArrayList(datesList))

            }
            startActivity(intent)
        }

        if (!FavoritesManager.isFavorite(this, defaultCity))
        {
            FavoritesManager.addFavorite(this, defaultCity)
            addDotForCity(defaultCity)
        }

        val customFab = findViewById<LinearLayout>(R.id.custom_fab)
        toggleIcon = findViewById(R.id.toggle_icon)
        customFab.setOnClickListener {
            val cityName = intent.getStringExtra("city_name") ?: defaultCity
            val isFavorite = FavoritesManager.isFavorite(this, cityName)
            toggleFavorite(cityName,isFavorite)
        }

        searchButton.setOnClickListener {
            val intent = Intent(this, SearchActivity::class.java)
            startActivity(intent)
        }

        val cityNameToggle =  intent.getStringExtra("city_name")
        if (cityNameToggle == defaultCity || cityNameToggle == null)
        {
            customFab.visibility = View.GONE
        }
        else
        {
            customFab.visibility = View.VISIBLE
        }

        val cityNameFromIntent = intent.getStringExtra("city_name")
        if (cityNameFromIntent != null)
        {
            fetchLatLonForCity(cityNameFromIntent)
        }
        else
        {
            fetchLocationAndWeather()
        }
    }

    private fun toggleFavorite(cityName: String, isFavorite: Boolean)
    {
        if (FavoritesManager.isFavorite(this, cityName) || isFavorite)
        {
            FavoritesManager.removeFavorite(this, cityName)
            removeDotForCity(cityName)
            Toast.makeText(this, "$cityName removed from Favorites", Toast.LENGTH_SHORT).show()
        }
        else
        {
            FavoritesManager.addFavorite(this, cityName)
            addDotForCity(cityName)
            Toast.makeText(this, "$cityName added to Favorites", Toast.LENGTH_SHORT).show()
        }
        updateFABIcon(cityName)
    }

    private fun updateFABIcon(cityName: String)
    {
        if (FavoritesManager.isFavorite(this, cityName))
        {
            toggleIcon.setImageResource(R.drawable.fav_remove)
        }
        else
        {
            toggleIcon.setImageResource(R.drawable.fav_add)
        }
    }

    private fun addDotForCity(cityName: String)
    {
        val dot = ImageView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(8, 0, 8, 0)
            }
            setImageResource(R.drawable.dot_icon)
            contentDescription = cityName
            setOnClickListener {
                openCityPage(cityName)
            }
        }
        placeholderDots.addView(dot)
    }

    private fun removeDotForCity(cityName: String)
    {
        val childCount = placeholderDots.childCount
        for (i in 0 until childCount)
        {
            val child = placeholderDots.getChildAt(i)
            if (child is ImageView && child.contentDescription == cityName)
            {
                placeholderDots.removeView(child)
                break
            }
        }
    }

    private fun loadFavoriteDots()
    {
        placeholderDots.removeAllViews()
        val favorites = FavoritesManager.getFavorites(this)
        favorites.forEach { cityName ->
            addDotForCity(cityName)
        }
    }

    private fun openCityPage(cityName: String)
    {
        val intent = Intent(this, HomeActivity::class.java).apply {
            putExtra("city_name", cityName)
        }
        startActivity(intent)
    }

    private fun fetchLatLonForCity(city: String)
    {
        val url = "$geocodeUrl?address=${city.replace(" ", "+")}&key=$apiKey"
        val request = Request.Builder().url(url).build()
        val client = OkHttpClient()

        client.newCall(request).enqueue(object : Callback
        {
            override fun onFailure(call: Call, e: IOException)
            {
                e.printStackTrace()
                Log.e("WeatherApp", "Failed to fetch lat/lon for city: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response)
            {
                val responseData = response.body?.string()
                responseData?.let {
                    val json = JSONObject(it)
                    val results = json.optJSONArray("results")
                    if (results != null && results.length() > 0) {
                        val location = results.getJSONObject(0).optJSONObject("geometry")?.optJSONObject("location")
                        val lat = location?.optDouble("lat", 0.0) ?: 0.0
                        val lon = location?.optDouble("lng", 0.0) ?: 0.0

                        // Extract formatted address components
                        val addressComponents = results.getJSONObject(0).optJSONArray("address_components")
                        var fetchedCity = ""
                        var stateName = ""

                        addressComponents?.let {
                            for (i in 0 until it.length()) {
                                val component = it.getJSONObject(i)
                                val types = component.optJSONArray("types")?.let { typesArray ->
                                    (0 until typesArray.length()).map { idx -> typesArray.getString(idx) }
                                } ?: emptyList()

                                if ("locality" in types) fetchedCity = component.optString("long_name", "")
                                if ("administrative_area_level_1" in types) stateName = component.optString("long_name", "")
                            }
                        }

                        runOnUiThread {
                            cityName.text = "$fetchedCity, $stateName"
                            fetchWeatherData(lat, lon, "1d")
                        }
                    }
                }
            }
        })
    }

    private fun fetchLocationAndWeather()
    {
        val request = Request.Builder().url(ipInfoUrl).build()
        val client = OkHttpClient()

        client.newCall(request).enqueue(object : Callback
        {
            override fun onFailure(call: Call, e: IOException)
            {
                e.printStackTrace()
                Log.e("WeatherApp", "Failed to fetch location data: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response)
            {
                val responseData = response.body?.string()
                responseData?.let {
                    val json = JSONObject(it)
                    val loc = json.getString("loc").split(",")
                    val latitude = loc[0].toDouble()
                    val longitude = loc[1].toDouble()
                    val city = json.getString("city")
                    val region = json.getString("region")

                    runOnUiThread {
                        cityName.text = "$city, $region"
                        fetchWeatherData(latitude, longitude, "1d")
                    }
                }
            }
        })
    }

    private fun fetchWeatherData(lat: Double, lon: Double, interval: String)
    {
        val url = "$backendUrl/api/weather?lat=$lat&lon=$lon&interval=$interval"
        val request = Request.Builder().url(url).build()
        val client = OkHttpClient()

        client.newCall(request).enqueue(object : Callback
        {
            override fun onFailure(call: Call, e: IOException)
            {
                e.printStackTrace()
                Log.e("WeatherApp", "Failed to fetch weather data: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response)
            {
                val responseData = response.body?.string()
                responseData?.let {
                    val jsonArray = JSONArray(it)
                    runOnUiThread {
                        if (interval == "1d")
                        {
                            setWeatherData(jsonArray.getJSONObject(0))
                            populateWeeklyForecast(jsonArray)
                            fetchWeatherData(lat, lon, "1h")
                        }
                        else if (interval == "1h")
                        {
                            updateHourlyData(jsonArray.getJSONObject(0))
                        }
                    }
                }
            }
        })
    }

    private fun setWeatherData(data: JSONObject)
    {
        summary = data.optString("status", "Unknown")
        humidityValue = data.optDouble("humidity", 0.0).toInt()
        windSpeedValue = data.optDouble("windSpeed", 0.0)
        visibilityValue = data.optDouble("visibility", 0.0)
        cloudCoverValue = data.optDouble("cloudCover", 0.0).toInt()


        weatherSummary.text = summary
        humidity.text = "${humidityValue}%"
        windSpeed.text = "${windSpeedValue} mph"
        visibility.text = "${"%.2f".format(visibilityValue)} mi"

        val resId = weatherIconMap[summary]
        weatherIcon.setImageResource(resId ?: R.drawable.clear)
    }

    private fun updateHourlyData(data: JSONObject)
    {
        temperatureValue = data.optDouble("temperature", 0.0).toInt()
        pressureValue = data.optDouble("pressure", 0.0)

        temperature.text = "${temperatureValue}°F"
        pressure.text = "${"%.2f".format(pressureValue)} inHg"
    }

    private fun populateWeeklyForecast(data: JSONArray)
    {
        weeklyForecastTable.removeAllViews()

        val daysToShow = minOf(data.length(), 7)
        tempHighList.clear()
        tempLowList.clear()
        datesList.clear()

        for (i in 0 until daysToShow)
        {
            val dayData = data.getJSONObject(i)
            val date = dayData.getString("date")
            val tempHigh = dayData.getInt("tempHigh")
            val tempLow = dayData.getInt("tempLow")

            tempHighList.add(tempHigh)
            tempLowList.add(tempLow)
            datesList.add(date)

            val row = TableRow(this).apply {
                layoutParams = TableRow.LayoutParams(
                    TableRow.LayoutParams.MATCH_PARENT,
                    TableRow.LayoutParams.WRAP_CONTENT
                )
                setPadding(16, 16, 16, 16)
                setBackgroundColor(Color.parseColor("#252525"))
            }

            val dateView = TextView(this).apply {
                text = formatDate(dayData.getString("date"))
                setTextColor(ContextCompat.getColor(this@HomeActivity, R.color.white))
                textSize = 16f
                setPadding(8, 0, 8, 0)
            }
            row.addView(dateView)

            val iconView = ImageView(this).apply {
                val resId = weatherIconMap[dayData.getString("status")]
                setImageResource(resId ?: R.drawable.clear)
                layoutParams = TableRow.LayoutParams(64, 64).apply {
                    setMargins(8, 0, 8, 0)
                }
            }
            row.addView(iconView)

            val minTempView = TextView(this).apply {
                text = "${dayData.getInt("tempLow")}"
                setTextColor(ContextCompat.getColor(this@HomeActivity, R.color.white))
                textSize = 16f
                setPadding(8, 0, 8, 0)
            }
            row.addView(minTempView)

            val maxTempView = TextView(this).apply {
                text = "${dayData.getInt("tempHigh")}"
                setTextColor(ContextCompat.getColor(this@HomeActivity, R.color.white))
                textSize = 16f
                setPadding(8, 0, 8, 0)
            }
            row.addView(maxTempView)

            weeklyForecastTable.addView(row)

            if (i < daysToShow-1) {
                val separator = View(this).apply {

                    layoutParams = TableLayout.LayoutParams(
                        TableLayout.LayoutParams.MATCH_PARENT,
                        8
                    )
                    setBackgroundColor(Color.parseColor("#323232"))
                }
                weeklyForecastTable.addView(separator)
            }
        }
    }

    private fun formatDate(inputDate: String): String
    {
        return try
        {
            val inputFormat = SimpleDateFormat("EEEE, MMM d, yyyy", Locale.US)
            val outputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val date = inputFormat.parse(inputDate) ?: return "Invalid Date"
            outputFormat.format(date)
        }
        catch (e: Exception)
        {
            e.printStackTrace()
            "Invalid Date"
        }
    }
}

