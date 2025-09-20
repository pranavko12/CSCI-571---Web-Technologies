package com.example.assignment4_pkolhe_mobile

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.viewpager2.widget.ViewPager2
import com.google.android.material.tabs.TabLayout
import com.google.android.material.tabs.TabLayoutMediator
import android.view.LayoutInflater
import android.widget.ImageView

class DetailsActivity : AppCompatActivity()
{

    private lateinit var backButton: ImageButton
    private lateinit var tweetButton: ImageButton
    private lateinit var cityNameTextView: TextView
    private lateinit var viewPager: ViewPager2
    private lateinit var tabLayout: TabLayout

    override fun onCreate(savedInstanceState: Bundle?)
    {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_details)


        backButton = findViewById(R.id.back_button)
        tweetButton = findViewById(R.id.tweet_button)
        cityNameTextView = findViewById(R.id.city_name)
        viewPager = findViewById(R.id.viewPager)
        tabLayout = findViewById(R.id.tabLayout)

        val cityName = intent.getStringExtra("city_name") ?: "Unknown City"
        val temperature = intent.getStringExtra("temperature") ?: "0°F"
        val pressure = intent.getStringExtra("pressure") ?: "0 inHg"
        val weatherSummary = intent.getStringExtra("weather_summary") ?: "N/A"
        val humidity = intent.getStringExtra("humidity") ?: "0%"
        val windSpeed = intent.getStringExtra("wind_speed") ?: "0 mph"
        val visibility = intent.getStringExtra("visibility") ?: "0 mi"
        val cloudCover = intent.getStringExtra("cloud_cover") ?: "0%"

        val tempHighList = intent.getIntegerArrayListExtra("temp_high_list") ?: arrayListOf()
        val tempLowList = intent.getIntegerArrayListExtra("temp_low_list") ?: arrayListOf()
        val datesList = intent.getStringArrayListExtra("dates_list") ?: arrayListOf()


        val weatherDetails = Bundle().apply {
            putString("temperature", temperature)
            putString("pressure", pressure)
            putString("weather_summary", weatherSummary)
            putString("humidity", humidity)
            putString("wind_speed", windSpeed)
            putString("visibility", visibility)
            putString("cloud_cover", cloudCover)
            putIntegerArrayList("temp_high_list", tempHighList)
            putIntegerArrayList("temp_low_list", tempLowList)
            putStringArrayList("dates_list", datesList)
        }

        cityNameTextView.text = cityName

        val detailsPagerAdapter = DetailsPagerAdapter(this, cityName, weatherDetails)
        viewPager.adapter = detailsPagerAdapter

        TabLayoutMediator(tabLayout, viewPager) { tab, position ->
            val tabView = LayoutInflater.from(this).inflate(R.layout.tab_layout, null)
            val tabIcon = tabView.findViewById<ImageView>(R.id.tab_icon)
            val tabTitle = tabView.findViewById<TextView>(R.id.tab_title)

            when (position)
            {
                0 -> {
                    tabIcon.setImageResource(R.drawable.today_icon)
                    tabTitle.text = "TODAY"
                }
                1 -> {
                    tabIcon.setImageResource(R.drawable.weekly_icon)
                    tabTitle.text = "WEEKLY"
                    }
                2 -> {
                    tabIcon.setImageResource(R.drawable.weather_data_icon)
                    tabTitle.text = "WEATHER DATA"
                }
            }

            tab.customView = tabView
        }.attach()


        backButton.setOnClickListener{
            finish()
        }

        val tweetContent = "Check Out $cityName’s Weather! It is $temperature°F! #CSCI571WeatherSearch"
        tweetButton = findViewById(R.id.tweet_button)
        tweetButton.setOnClickListener {

            val twitterUrl = "https://twitter.com/intent/tweet?text=${Uri.encode(tweetContent)}"
            val tweetIntent = Intent(Intent.ACTION_VIEW, Uri.parse(twitterUrl))
            startActivity(tweetIntent)
        }
    }
}
