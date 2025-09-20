package com.example.assignment4_pkolhe_mobile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.highsoft.highcharts.common.HIColor
import com.highsoft.highcharts.common.hichartsclasses.*
import com.highsoft.highcharts.core.HIChartView
import java.text.SimpleDateFormat
import java.util.Locale

class WeeklyFragment : Fragment()
{
    private val tempHighList = mutableListOf<Int>()
    private val tempLowList = mutableListOf<Int>()
    private val datesList = mutableListOf<String>()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_weekly, container, false)

        val chartView = view.findViewById<HIChartView>(R.id.weekly_chart)

        arguments?.let {
            tempHighList.addAll(it.getIntegerArrayList("temp_high_list") ?: emptyList())
            tempLowList.addAll(it.getIntegerArrayList("temp_low_list") ?: emptyList())
            datesList.addAll(it.getStringArrayList("dates_list") ?: emptyList())
        }
        val formattedDates = datesList.map { formatDate(it) }
        val options = createChartOptions(formattedDates, tempHighList, tempLowList)
        chartView.options = options

        return view
    }

    private fun createChartOptions(
        dates: List<String>,
        tempHighs: List<Int>,
        tempLows: List<Int>
    ): HIOptions {
        val options = HIOptions()

        val chart = HIChart().apply {
            type = "arearange"
        }
        options.chart = chart

        val title = HITitle().apply {
            text = "Temperature Variation by Day"
        }
        options.title = title

        val xAxis = HIXAxis().apply {
            categories = ArrayList(dates)
        }
        options.xAxis = arrayListOf(xAxis)

        val yAxis = HIYAxis().apply {
            this.title = HITitle().apply { text = "Values" }
        }
        options.yAxis = arrayListOf(yAxis)

        val areaRangeSeries = HIArearange().apply {
            name = "Temperature Range"
            color = HIColor.initWithRGBA(173, 216, 230, 0.7)
            data = ArrayList(tempHighs.indices.map { index ->
                arrayListOf(index.toDouble(), tempLows[index].toDouble(), tempHighs[index].toDouble())
            })
        }

        val legend = HILegend().apply {
            enabled = true
            align = "center"
            verticalAlign = "bottom"
            layout = "horizontal"
        }
        options.legend = legend

        val tooltip = HITooltip().apply {
            headerFormat = "<b>{point.key}</b><br/>"
            pointFormat = "Temperature range: {point.low}°C - {point.high}°C"
        }
        options.tooltip = tooltip

        options.series = arrayListOf(areaRangeSeries)

        return options
    }



    companion object
    {
        fun newInstance(weatherDetails: Bundle): WeeklyFragment
        {
            val fragment = WeeklyFragment()
            val args = Bundle(weatherDetails)
            fragment.arguments = args
            return fragment
        }
    }
    private fun formatDate(inputDate: String): String {
        return try
        {
            val inputFormat = SimpleDateFormat("EEEE, MMM dd, yyyy", Locale.US)
            val outputFormat = SimpleDateFormat("dd. MMM", Locale.US)
            val date = inputFormat.parse(inputDate)
            outputFormat.format(date ?: inputDate)
        }
        catch (e: Exception)
        {
            e.printStackTrace()
            inputDate
        }
    }
}
