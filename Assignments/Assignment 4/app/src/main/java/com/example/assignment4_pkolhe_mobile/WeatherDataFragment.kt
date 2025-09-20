package com.example.assignment4_pkolhe_mobile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.highsoft.highcharts.common.HIColor
import com.highsoft.highcharts.common.hichartsclasses.*
import com.highsoft.highcharts.core.HIChartView
import com.highsoft.highcharts.core.HIFunction

class WeatherDataFragment : Fragment()
{
    private lateinit var chartView: HIChartView
    private var cloudCover: Int = 0
    private var precipitation: Int = 0
    private var humidity: Int = 0

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_weather_data, container, false)
        chartView = view.findViewById(R.id.weather_data_chart)
        // Extract values from arguments
        arguments?.let {
            cloudCover = it.getString("cloud_cover", "N/A")?.filter { char -> char.isDigit() }?.toIntOrNull() ?: 0
            precipitation = it.getString("precipitation", "0")?.filter { char -> char.isDigit() }?.toIntOrNull() ?: 0
            humidity = it.getString("humidity", "N/A")?.filter { char -> char.isDigit() }?.toIntOrNull() ?: 0
        }


        val options = createCircularChart(cloudCover, humidity, precipitation)
        chartView.options = options
        return view
    }

    fun createCircularChart(cloudCover: Int, humidity: Int, precipitation: Int): HIOptions {
        val options = HIOptions()

        val chart = HIChart()
        chart.type = "solidgauge"
        options.chart = chart

        val title = HITitle()
        title.text = "Stat Summary"
        title.align = "center"
        options.title = title

        val pane = HIPane()
        pane.startAngle = 0
        pane.endAngle = 360
        pane.background = arrayListOf(
            createPaneBackground(90, HIColor.initWithRGB(224, 255, 224)),
            createPaneBackground(70, HIColor.initWithRGB(224, 244, 255)),
            createPaneBackground(50, HIColor.initWithRGB(255, 224, 224))
        )
        options.pane = pane

        val tooltip = HITooltip()
        tooltip.enabled = true
        tooltip.shared = false
        tooltip.useHTML = true
        tooltip.formatter = HIFunction(
            "function () { return '<b>' + this.series.name + '</b>: ' + (this.y !== null ? this.y : '0') + '%'; }"
        )
        options.tooltip = tooltip

        val plotOptions = HIPlotOptions()
        val solidgauge = HISolidgauge()
        solidgauge.point = HIPoint().apply {
            events = HIEvents().apply {
                click = HIFunction("function () { this.series.chart.tooltip.refresh(this); }")
            }
        }
        plotOptions.solidgauge = solidgauge
        options.plotOptions = plotOptions

        val yAxis = HIYAxis()
        yAxis.min = 0
        yAxis.max = 100
        yAxis.lineWidth = 0
        yAxis.tickPositions = arrayListOf()
        options.yAxis = arrayListOf(yAxis)

        val outerCircle = createSolidGaugeSeriesWithArrow("Cloud Cover", cloudCover, HIColor.initWithRGB(147, 196, 125), 70, 90)
        val middleCircle = createSolidGaugeSeriesWithArrow("Humidity", humidity, HIColor.initWithRGB(111, 168, 220), 50, 70)
        val innerCircle = createSolidGaugeSeriesWithArrow("Precipitation", precipitation, HIColor.initWithRGB(246, 178, 107), 30, 50)

        options.series = arrayListOf(outerCircle, middleCircle, innerCircle)

        return options
    }

    private fun createPaneBackground(outerRadius: Int, color: HIColor): HIBackground
    {
        val background = HIBackground()
        background.outerRadius = "$outerRadius%"
        background.innerRadius = "${outerRadius - 20}%"
        background.backgroundColor = color
        background.borderWidth = 0
        return background
    }

    private fun createSolidGaugeSeriesWithArrow(
        name: String,
        value: Int,
        color: HIColor,
        innerRadius: Int,
        outerRadius: Int
    ): HISolidgauge {
        val series = HISolidgauge()
        series.name = name

        val dataPoint = HIData()
        dataPoint.y = value.toDouble()
        dataPoint.color = color
        series.data = arrayListOf(dataPoint)

        series.innerRadius = "$innerRadius%"
        series.radius = "$outerRadius%"

        val dataLabels = HIDataLabels()
        dataLabels.enabled = true
        dataLabels.useHTML = true
        dataLabels.format = """<span style="display: inline-block;">&#8593;</span>"""
        dataLabels.align = "center"
        dataLabels.verticalAlign = "middle"
        dataLabels.style = HIStyle().apply {
            fontSize = 32
        }
        dataLabels.distance = (outerRadius - innerRadius) / 2 + innerRadius
        series.dataLabels = arrayListOf(dataLabels)

        return series
    }



    companion object
    {
        fun newInstance(weatherDetails: Bundle): WeatherDataFragment
        {
            val fragment = WeatherDataFragment()
            fragment.arguments = weatherDetails
            return fragment
        }
    }
}
