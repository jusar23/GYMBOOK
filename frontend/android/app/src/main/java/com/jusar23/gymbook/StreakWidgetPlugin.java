package com.jusar23.gymbook;

import android.content.Context;
import android.content.SharedPreferences;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.app.Activity;
import android.os.Build;

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

    @PluginMethod
    public void pin(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.resolve(new com.getcapacitor.JSObject().put("supported", false).put("requested", false));
            return;
        }
        AppWidgetManager manager = AppWidgetManager.getInstance(getContext());
        ComponentName provider = new ComponentName(getContext(), StreakWidgetProvider.class);
        boolean supported = manager.isRequestPinAppWidgetSupported();
        if (!supported) {
            call.resolve(new com.getcapacitor.JSObject().put("supported", false).put("requested", false));
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.resolve(new com.getcapacitor.JSObject().put("supported", true).put("requested", false));
            return;
        }
        // Launch the launcher confirmation from the foreground UI thread. Some
        // launchers silently ignore the request when it comes from the bridge thread.
        activity.runOnUiThread(() -> {
            try {
                boolean requested = manager.requestPinAppWidget(provider, null, null);
                call.resolve(new com.getcapacitor.JSObject()
                    .put("supported", true)
                    .put("requested", requested));
            } catch (Exception error) {
                call.reject("Could not open the Android widget prompt", error);
            }
        });
    }
}
