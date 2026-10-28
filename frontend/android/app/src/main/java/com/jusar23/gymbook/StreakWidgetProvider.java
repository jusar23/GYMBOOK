package com.jusar23.gymbook;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class StreakWidgetProvider extends AppWidgetProvider {
    private static final String PREFS = "streak_widget";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        for (int widgetId : widgetIds) manager.updateAppWidget(widgetId, buildViews(context));
    }

    public static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] widgetIds = manager.getAppWidgetIds(new ComponentName(context, StreakWidgetProvider.class));
        for (int widgetId : widgetIds) manager.updateAppWidget(widgetId, buildViews(context));
    }

    private static RemoteViews buildViews(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.streak_widget);
        int accent = colorOrDefault(prefs.getString("accentColor", "#B8F36B"));
        StreakData data = calculate(prefs);

        views.setTextViewText(R.id.streak_count, String.valueOf(data.days));
        views.setTextColor(R.id.streak_count, accent);
        views.setTextViewText(R.id.streak_label, prefs.getString("streakLabel", "Daily streak"));
        views.setTextViewText(R.id.streak_shield, prefs.getString(
            data.shieldUsed ? "shieldUsed" : "shieldReady",
            data.shieldUsed ? "Weekly shield used" : "Weekly shield ready"
        ));
        views.setTextColor(R.id.streak_shield, accent);

        JSONArray labels = parseArray(prefs.getString("dayLabels", "[]"));
        Calendar monday = Calendar.getInstance();
        monday.set(Calendar.HOUR_OF_DAY, 12);
        monday.set(Calendar.MINUTE, 0);
        monday.set(Calendar.SECOND, 0);
        monday.set(Calendar.MILLISECOND, 0);
        monday.add(Calendar.DATE, -((monday.get(Calendar.DAY_OF_WEEK) + 5) % 7));
        Set<String> workoutDates = data.workouts;
        JSONObject week = data.week;
        JSONObject dayPlan = data.dayPlan;
        int muted = Color.rgb(135, 143, 153);

        for (int i = 0; i < 7; i++) {
            Calendar day = (Calendar) monday.clone();
            day.add(Calendar.DATE, i);
            String iso = formatDate(day);
            String label = labels.optString(i, new String[] {"Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"}[i]);
            boolean trained = workoutDates.contains(iso);
            boolean planned = isPlanned(dayPlan, week, iso, day.get(Calendar.DAY_OF_WEEK) - 1);
            int labelId = dayLabelId(i);
            int markId = dayMarkId(i);
            views.setTextViewText(labelId, label);
            views.setTextColor(labelId, iso.equals(formatDate(Calendar.getInstance())) ? accent : muted);
            views.setTextViewText(markId, trained ? "✓" : planned ? "•" : "·");
            views.setTextColor(markId, trained ? accent : planned ? Color.argb(175, Color.red(accent), Color.green(accent), Color.blue(accent)) : muted);
        }

        Intent launch = new Intent(context, MainActivity.class);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending = PendingIntent.getActivity(context, 7401, launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.streak_widget_root, pending);
        return views;
    }

    private static StreakData calculate(SharedPreferences prefs) {
        JSONObject week = parseObject(prefs.getString("week", "{}"));
        JSONObject dayPlan = parseObject(prefs.getString("dayPlan", "{}"));
        Set<String> workouts = new HashSet<>();
        JSONArray workoutDates = parseArray(prefs.getString("workoutDates", "[]"));
        for (int i = 0; i < workoutDates.length(); i++) {
            String date = workoutDates.optString(i, "");
            if (!date.isEmpty()) workouts.add(date);
        }

        Calendar cursor = Calendar.getInstance();
        cursor.set(Calendar.HOUR_OF_DAY, 12);
        cursor.set(Calendar.MINUTE, 0);
        cursor.set(Calendar.SECOND, 0);
        cursor.set(Calendar.MILLISECOND, 0);
        String today = formatDate(cursor);
        String currentWeek = weekStart(cursor);
        Set<String> shieldWeeks = new HashSet<>();
        Set<String> unprotectedMisses = new HashSet<>();
        int streak = 0;

        // Give the weekly shield to the first missed training day in calendar order.
        for (int offset = 3650; offset >= 0; offset--) {
            Calendar day = (Calendar) cursor.clone();
            day.add(Calendar.DATE, -offset);
            String iso = formatDate(day);
            if (iso.equals(today) || workouts.contains(iso)) continue;
            boolean planned = isPlanned(dayPlan, week, iso, day.get(Calendar.DAY_OF_WEEK) - 1);
            if (!planned) continue;

            String weekKey = weekStart(day);
            if (!shieldWeeks.add(weekKey)) unprotectedMisses.add(iso);
        }

        for (int offset = 0; offset <= 3650; offset++) {
            Calendar day = (Calendar) cursor.clone();
            day.add(Calendar.DATE, -offset);
            String iso = formatDate(day);
            if (unprotectedMisses.contains(iso)) break;
            if (workouts.contains(iso)) streak++;
        }
        return new StreakData(streak, shieldWeeks.contains(currentWeek), workouts, week, dayPlan);
    }

    private static boolean isPlanned(JSONObject dayPlan, JSONObject week, String iso, int weekday) {
        if (dayPlan.has(iso)) {
            Object override = dayPlan.opt(iso);
            if (override == null || JSONObject.NULL.equals(override)) return false;
            String value = String.valueOf(override);
            if ("rest".equals(value) || value.isEmpty()) return false;
            return true;
        }
        Object routine = week.opt(String.valueOf(weekday));
        return routine != null && !JSONObject.NULL.equals(routine) && !String.valueOf(routine).isEmpty();
    }

    private static String formatDate(Calendar date) {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(date.getTime());
    }

    private static String weekStart(Calendar date) {
        Calendar monday = (Calendar) date.clone();
        monday.add(Calendar.DATE, -((monday.get(Calendar.DAY_OF_WEEK) + 5) % 7));
        return formatDate(monday);
    }

    private static int dayLabelId(int i) {
        switch (i) {
            case 0: return R.id.day_label_0;
            case 1: return R.id.day_label_1;
            case 2: return R.id.day_label_2;
            case 3: return R.id.day_label_3;
            case 4: return R.id.day_label_4;
            case 5: return R.id.day_label_5;
            default: return R.id.day_label_6;
        }
    }

    private static int dayMarkId(int i) {
        switch (i) {
            case 0: return R.id.day_mark_0;
            case 1: return R.id.day_mark_1;
            case 2: return R.id.day_mark_2;
            case 3: return R.id.day_mark_3;
            case 4: return R.id.day_mark_4;
            case 5: return R.id.day_mark_5;
            default: return R.id.day_mark_6;
        }
    }

    private static int colorOrDefault(String value) {
        try { return Color.parseColor(value); }
        catch (Exception ignored) { return Color.rgb(184, 243, 107); }
    }

    private static JSONObject parseObject(String value) {
        try { return new JSONObject(value); }
        catch (Exception ignored) { return new JSONObject(); }
    }

    private static JSONArray parseArray(String value) {
        try { return new JSONArray(value); }
        catch (Exception ignored) { return new JSONArray(); }
    }

    private static final class StreakData {
        final int days;
        final boolean shieldUsed;
        final Set<String> workouts;
        final JSONObject week;
        final JSONObject dayPlan;

        StreakData(int days, boolean shieldUsed, Set<String> workouts, JSONObject week, JSONObject dayPlan) {
            this.days = days;
            this.shieldUsed = shieldUsed;
            this.workouts = workouts;
            this.week = week;
            this.dayPlan = dayPlan;
        }
    }
}
