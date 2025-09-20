package com.example.assignment4_pkolhe_mobile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import android.widget.TextView
import android.widget.ImageView

class TodayFragment : Fragment()
{

    private lateinit var windSpeedText: TextView
    private lateinit var pressureText: TextView
    private lateinit var precipitationText: TextView
    private lateinit var temperatureText: TextView
    private lateinit var humidityText: TextView
    private lateinit var visibilityText: TextView
    private lateinit var cloudCoverText: TextView
    private lateinit var uvIndexText: TextView
    private lateinit var weatherIcon: ImageView
    private lateinit var weatherSummaryText: TextView

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

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_today, container, false)

        windSpeedText = view.findViewById(R.id.wind_speed_value)
        pressureText = view.findViewById(R.id.pressure_value)
        precipitationText = view.findViewById(R.id.precipitation_value)
        temperatureText = view.findViewById(R.id.temperature_value)
        humidityText = view.findViewById(R.id.humidity_value)
        visibilityText = view.findViewById(R.id.visibility_value)
        cloudCoverText = view.findViewById(R.id.cloud_cover_value)
        uvIndexText = view.findViewById(R.id.uv_index_value)
        weatherIcon = view.findViewById(R.id.icon_weather)
        weatherSummaryText = view.findViewById(R.id.icon_value)

        val weatherDetails = arguments
        weatherDetails?.let {
            windSpeedText.text = it.getString("wind_speed", "N/A")
            pressureText.text = it.getString("pressure", "N/A")
            precipitationText.text = it.getString("precipitation", "0%")
            temperatureText.text = it.getString("temperature", "N/A")
            humidityText.text = it.getString("humidity", "N/A")
            visibilityText.text = it.getString("visibility", "N/A")
            cloudCoverText.text = it.getString("cloud_cover", "N/A")
            uvIndexText.text = it.getString("uv_index", "0")
            weatherSummaryText.text = it.getString("weather_summary", "Clear")

            val summary = it.getString("weather_summary", "Clear")
            weatherSummaryText.text = summary
            val iconResId = weatherIconMap[summary] ?: R.drawable.clear
            weatherIcon.setImageResource(iconResId)
        }
        return view
    }

    companion object
    {
        fun newInstance(weatherDetails: Bundle): TodayFragment {
            val fragment = TodayFragment()
            fragment.arguments = weatherDetails
            return fragment
        }
    }

}
