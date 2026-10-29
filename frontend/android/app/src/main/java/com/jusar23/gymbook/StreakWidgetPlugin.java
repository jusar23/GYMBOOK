package com.jusar23.gymbook;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StreakWidget")
public class StreakWidgetPlugin extends Plugin {
    private static final String PREFS = "streak_widget";

    @PluginMethod
    public void update(PluginCall call) {
        Context context = getContext();
        SharedPreferences.Editor editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        editor.putString("workoutDates", call.getArray("workoutDates", new com.getcapacitor.JSArray()).toString());
        editor.putString("week", call.getObject("week", new com.getcapacitor.JSObject()).toString());
        editor.putString("dayPlan", call.getObject("dayPlan", new com.getcapacitor.JSObject()).toString());
        editor.putString("routineIds", call.getArray("routineIds", new com.getcapacitor.JSArray()).toString());
        editor.putString("accentColor", call.getString("accentColor", "#B8F36B"));
        editor.putString("streakLabel", call.getString("streakLabel", "Daily streak"));
        editor.putString("shieldReady", call.getString("shieldReady", "Weekly shield ready"));
        editor.putString("shieldUsed", call.getString("shieldUsed", "Weekly shield used"));
        editor.putString("dayLabels", call.getArray("dayLabels", new com.getcapacitor.JSArray()).toString());
        editor.apply();
        StreakWidgetProvider.updateAll(context);
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply();
        StreakWidgetProvider.updateAll(getContext());
        call.resolve();
    }

}
