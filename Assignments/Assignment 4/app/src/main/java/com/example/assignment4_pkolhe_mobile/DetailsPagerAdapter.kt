package com.example.assignment4_pkolhe_mobile

import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.viewpager2.adapter.FragmentStateAdapter
import android.os.Bundle

class DetailsPagerAdapter(
    activity: AppCompatActivity,
    private val city: String,
    private val weatherDetails: Bundle
) : FragmentStateAdapter(activity) {

    override fun getItemCount(): Int = 3

    override fun createFragment(position: Int): Fragment
    {
        return when (position) {
            0 -> TodayFragment.newInstance(weatherDetails)
            1 -> WeeklyFragment.newInstance(weatherDetails)
            2 -> WeatherDataFragment.newInstance(weatherDetails)
            else -> throw IllegalArgumentException("Invalid position")
        }
    }
}
