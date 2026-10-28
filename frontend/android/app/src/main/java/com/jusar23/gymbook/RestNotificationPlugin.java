package com.jusar23.gymbook;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "RestNotification")
public class RestNotificationPlugin extends Plugin {
    private static final String CHANNEL_ID = "gymbook_rest_timer";
    private static final int NOTIFICATION_ID = 2601;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final List<Runnable> countdowns = new ArrayList<>();
    private long endsAt;
    private boolean timerActive;
    private boolean soundEnabled;
    private boolean appPaused;
    private String tone = "classic";
    private String title = "Rest timer";
    private String detail = "Rest";
    private String adjustLabel = "Adjust last set";
    private Runnable finish;

    @PluginMethod
    public void setRestTimer(PluginCall call) {
        try {
            endsAt = Long.parseLong(call.getString("endsAt", "0"));
        } catch (NumberFormatException error) {
            endsAt = 0L;
        }
        if (endsAt <= System.currentTimeMillis()) {
            call.reject("Rest timer end time is invalid");
            return;
        }

        soundEnabled = call.getBoolean("sound", true);
        tone = call.getString("tone", "classic");
        title = call.getString("title", "Rest timer");
        detail = call.getString("detail", "Rest");
        adjustLabel = call.getString("adjustLabel", "Adjust last set");
        timerActive = true;

        getActivity().runOnUiThread(() -> {
            cancelSchedule();
            scheduleFinish();
            if (appPaused) showNotification();
            call.resolve();
        });
    }

    @PluginMethod
    public void clearRestTimer(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            timerActive = false;
            cancelSchedule();
            cancelNotification();
            call.resolve();
        });
    }

    @Override
    protected void handleOnPause() {
        appPaused = true;
        if (timerActive) showNotification();
    }

    @Override
    protected void handleOnResume() {
        appPaused = false;
        cancelNotification();
    }

    private void scheduleFinish() {
        long delay = Math.max(0L, endsAt - System.currentTimeMillis());
        if (soundEnabled) {
            long remainingMs = Math.max(1L, delay);
            int countdownSeconds = (int) Math.min(3L, (remainingMs + 999L) / 1000L);
            for (int seconds = countdownSeconds; seconds >= 1; seconds--) {
                long cueDelay = Math.max(0L, remainingMs - seconds * 1000L);
                Runnable cue = () -> { if (timerActive && appPaused) playCountdownTone(); };
                countdowns.add(cue);
                handler.postDelayed(cue, cueDelay);
            }
        }

        finish = () -> {
            if (!timerActive) return;
            timerActive = false;
            cancelNotification();
            boolean playedInBackground = soundEnabled && appPaused;
            if (playedInBackground) playFinishTone();
            JSObject result = new JSObject();
            result.put("soundPlayed", playedInBackground);
            notifyListeners("restFinished", result);
        };
        handler.postDelayed(finish, delay);
    }

    private void cancelSchedule() {
        if (finish != null) handler.removeCallbacks(finish);
        for (Runnable cue : countdowns) handler.removeCallbacks(cue);
        countdowns.clear();
        finish = null;
    }

    private void showNotification() {
        if (!timerActive || !appPaused) return;
        try {
            Context context = getContext();
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    context.getString(R.string.rest_timer_channel_name),
                    NotificationManager.IMPORTANCE_LOW
                );
                channel.setSound(null, null);
                channel.enableVibration(false);
                manager.createNotificationChannel(channel);
            }

            Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (launch == null) return;
            launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent openApp = PendingIntent.getActivity(
                context, NOTIFICATION_ID, launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(context, CHANNEL_ID)
                : new Notification.Builder(context);
            builder.setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(detail)
                .setStyle(new Notification.BigTextStyle().bigText(detail))
                .setContentIntent(openApp)
                .setWhen(endsAt)
                .setShowWhen(true)
                .setUsesChronometer(true)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setCategory(Notification.CATEGORY_STOPWATCH)
                .setPriority(Notification.PRIORITY_LOW)
                .addAction(android.R.drawable.ic_menu_edit, adjustLabel, openApp);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) builder.setChronometerCountDown(true);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) builder.setTimeoutAfter(Math.max(1L, endsAt - System.currentTimeMillis()));
            manager.notify(NOTIFICATION_ID, builder.build());
        } catch (SecurityException ignored) {
            // Android notification permission may have been revoked in system settings.
        }
    }

    private void cancelNotification() {
        NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(NOTIFICATION_ID);
    }

    private void playFinishTone() {
        NotificationChime.play(getContext(), tone, "finish", true);
    }

    private void playCountdownTone() {
        NotificationChime.play(getContext(), tone, "countdown", false);
    }
}
