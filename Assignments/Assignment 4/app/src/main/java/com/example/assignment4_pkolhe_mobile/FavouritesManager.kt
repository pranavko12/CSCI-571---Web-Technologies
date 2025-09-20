package com.example.assignment4_pkolhe_mobile

import android.content.Context

object FavoritesManager
{
    private const val PREFS_NAME = "favorites_prefs"
    private const val FAVORITES_KEY = "favorites"

    fun addFavorite(context: Context, cityName: String)
    {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        val favorites = prefs.getStringSet(FAVORITES_KEY, mutableSetOf()) ?: mutableSetOf()
        favorites.add(cityName)
        editor.putStringSet(FAVORITES_KEY, favorites)
        editor.apply()
    }

    fun removeFavorite(context: Context, cityName: String)
    {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        val favorites = prefs.getStringSet(FAVORITES_KEY, mutableSetOf()) ?: mutableSetOf()
        favorites.remove(cityName)
        editor.putStringSet(FAVORITES_KEY, favorites)
        editor.apply()
    }

    fun isFavorite(context: Context, cityName: String): Boolean
    {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val favorites = prefs.getStringSet(FAVORITES_KEY, mutableSetOf()) ?: mutableSetOf()
        return favorites.contains(cityName)
    }

    fun getFavorites(context: Context): Set<String>
    {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getStringSet(FAVORITES_KEY, mutableSetOf()) ?: mutableSetOf()
    }
}
