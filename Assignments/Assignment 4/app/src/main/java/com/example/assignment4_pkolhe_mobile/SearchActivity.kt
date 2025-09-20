package com.example.assignment4_pkolhe_mobile

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.View
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ListView
import android.widget.RelativeLayout
import androidx.appcompat.app.AppCompatActivity
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import com.google.android.libraries.places.api.net.PlacesClient
import org.json.JSONObject
import java.io.IOException

class SearchActivity : AppCompatActivity()
{
    private lateinit var searchInput: EditText
    private lateinit var suggestionsList: ListView
    private lateinit var backButton: ImageButton
    private lateinit var suggestionsAdapter: ArrayAdapter<String>
    private lateinit var placesClient: PlacesClient
    private lateinit var progressLayout: RelativeLayout


    private val suggestions = mutableListOf<String>()
    private val TAG = "SearchActivity"

    override fun onCreate(savedInstanceState: Bundle?)
    {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_search)

        if (!Places.isInitialized())
        {
            Places.initialize(applicationContext, "AIzaSyBJu5-rCtn-37xsclF-73p830YSb5z259c")
        }
        placesClient = Places.createClient(this)

        searchInput = findViewById(R.id.search_input)
        suggestionsList = findViewById(R.id.suggestions_list)
        backButton = findViewById(R.id.back_button)
        progressLayout = findViewById(R.id.progress_layout)

        suggestionsAdapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, suggestions)
        suggestionsList.adapter = suggestionsAdapter

        backButton.setOnClickListener {
            finish()
        }

        searchInput.addTextChangedListener(object : TextWatcher
        {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int)
            {
                if (!s.isNullOrEmpty())
                {
                    fetchSuggestions(s.toString())
                }
            }

            override fun afterTextChanged(s: Editable?) {}
        })

        suggestionsList.setOnItemClickListener { _, _, position, _ ->
            val selectedCity = suggestions[position]
            fetchCityCoordinates(selectedCity)
        }
    }

    private fun fetchSuggestions(query: String)
    {
        val request = FindAutocompletePredictionsRequest.builder()
            .setQuery(query)
            .build()

        placesClient.findAutocompletePredictions(request).addOnSuccessListener { response ->
            suggestions.clear()
            for (prediction in response.autocompletePredictions)
            {
                suggestions.add(prediction.getPrimaryText(null).toString())
            }
            suggestionsAdapter.notifyDataSetChanged()
        }.addOnFailureListener { exception ->
            Log.e(TAG, "Error fetching autocomplete suggestions: ${exception.message}")
        }
    }



    private fun fetchCityCoordinates(city: String)
    {
        runOnUiThread { progressLayout.visibility = View.VISIBLE }
        val geocodeUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=${city.replace(" ", "+")}&key=AIzaSyBJu5-rCtn-37xsclF-73p830YSb5z259c"
        val client = okhttp3.OkHttpClient()
        val request = okhttp3.Request.Builder().url(geocodeUrl).build()

        client.newCall(request).enqueue(object : okhttp3.Callback
        {
            override fun onFailure(call: okhttp3.Call, e: IOException)
            {
                Log.e(TAG, "Error fetching geocode data: ${e.message}")

                runOnUiThread { progressLayout.visibility = View.GONE }
            }

            override fun onResponse(call: okhttp3.Call, response: okhttp3.Response)
            {
                response.body?.let { responseBody ->
                    val json = JSONObject(responseBody.string())
                    val results = json.getJSONArray("results")
                    if (results.length() > 0)
                    {
                        val location = results.getJSONObject(0).getJSONObject("geometry")
                            .getJSONObject("location")
                        val lat = location.getDouble("lat")
                        val lng = location.getDouble("lng")
                        val city = results.getJSONObject(0).getString("formatted_address")
                        runOnUiThread {
                            progressLayout.visibility = View.GONE
                            val intent = Intent(this@SearchActivity, HomeActivity::class.java).apply {
                                putExtra("city_name", city)
                                putExtra("lat", lat)
                                putExtra("lng", lng)
                            }
                        startActivity(intent)
                    }}
                    else
                    {
                        runOnUiThread {
                            progressLayout.visibility = View.GONE
                            Log.e(TAG, "No results found for city")
                        }
                    }
                }
            }
        })
    }
}
