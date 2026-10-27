package com.jusar23.gymbook;

import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RestBubble")
public class RestBubblePlugin extends Plugin {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private WindowManager windowManager;
    private View bubble;
    private TextView clockView;
    private WindowManager.LayoutParams layoutParams;
    private long endsAt;
    private boolean timerActive;
    private boolean soundEnabled;
    private String tone = "classic";
    private String continueLabel = "Continue";
    private boolean appPaused;
    private Runnable tick;
    private Runnable finish;
    private final List<Runnable> countdowns = new ArrayList<>();
    private float dragX, dragY;
    private int startX, startY;

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (Settings.canDrawOverlays(getContext())) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + getContext().getPackageName()));
        getActivity().runOnUiThread(() -> {
            getActivity().startActivity(intent);
            JSObject result = new JSObject();
            result.put("granted", false);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void setRestTimer(PluginCall call) {
        long newEndsAt;
        try { newEndsAt = Long.parseLong(call.getString("endsAt", "0")); }
        catch (NumberFormatException error) { newEndsAt = 0L; }
        if (newEndsAt <= System.currentTimeMillis()) {
            call.reject("Rest timer end time is invalid");
            return;
        }
        endsAt = newEndsAt;
        soundEnabled = call.getBoolean("sound", true);
        tone = call.getString("tone", "classic");
        continueLabel = call.getString("continueLabel", "Continue");
        timerActive = true;
        getActivity().runOnUiThread(() -> {
            cancelSchedule();
            scheduleFinish();
            if (appPaused) showBubble(); else removeBubble();
            call.resolve();
        });
    }

    @PluginMethod
    public void clearRestTimer(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            timerActive = false;
            cancelSchedule();
            removeBubble();
            call.resolve();
        });
    }

    @Override
    protected void handleOnPause() {
        appPaused = true;
        if (timerActive) showBubble();
    }

    @Override
    protected void handleOnResume() {
        appPaused = false;
        removeBubble();
        JSObject result = new JSObject();
        result.put("granted", Settings.canDrawOverlays(getContext()));
        notifyListeners("overlayPermissionChanged", result);
    }

    private void scheduleFinish() {
        long delay = Math.max(0L, endsAt - System.currentTimeMillis());
        if (soundEnabled) {
            long remainingMs = Math.max(1L, endsAt - System.currentTimeMillis());
            int countdownSeconds = (int) Math.min(3L, (remainingMs + 999L) / 1000L);
            for (int seconds = countdownSeconds; seconds >= 1; seconds--) {
                // If +15/−15 moves the end inside the final three seconds, play every
                // remaining cue immediately at its corresponding second instead of
                // dropping cues whose original timestamp has already passed.
                long cueDelay = Math.max(0L, remainingMs - seconds * 1000L);
                Runnable cue = () -> { if (timerActive && appPaused) playCountdownTone(); };
                countdowns.add(cue);
                handler.postDelayed(cue, cueDelay);
            }
        }
        finish = () -> {
            if (!timerActive) return;
            timerActive = false;
            removeBubble();
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
        if (tick != null) handler.removeCallbacks(tick);
        for (Runnable cue : countdowns) handler.removeCallbacks(cue);
        countdowns.clear();
        finish = null;
        tick = null;
    }

    private void showBubble() {
        if (!timerActive || !appPaused || !Settings.canDrawOverlays(getContext()) || bubble != null) return;
        try {
            windowManager = (WindowManager) getContext().getSystemService(Context.WINDOW_SERVICE);
            bubble = buildBubble();
            int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
            layoutParams = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                    | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);
            layoutParams.gravity = Gravity.TOP | Gravity.LEFT;
            layoutParams.x = getPreferences().getInt("restBubbleX", dp(16));
            layoutParams.y = getPreferences().getInt("restBubbleY", dp(180));
            windowManager.addView(bubble, layoutParams);
            updateClock();
            scheduleTick();
        } catch (Exception error) {
            removeBubble();
        }
    }

    private View buildBubble() {
        LinearLayout container = new LinearLayout(getContext());
        container.setGravity(Gravity.CENTER_VERTICAL);
        container.setOrientation(LinearLayout.HORIZONTAL);
        container.setPadding(dp(13), dp(8), dp(8), dp(8));
        GradientDrawable background = new GradientDrawable();
        background.setColor(0xF21A1D23);
        background.setCornerRadius(dp(30));
        background.setStroke(dp(1), 0xAA7B8492);
        container.setBackground(background);
        container.setElevation(dp(8));

        LinearLayout time = new LinearLayout(getContext());
        time.setGravity(Gravity.CENTER_VERTICAL);
        time.setOrientation(LinearLayout.HORIZONTAL);
        clockView = new TextView(getContext());
        clockView.setTextColor(0xFFFFFFFF);
        clockView.setTextSize(19);
        clockView.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        time.addView(clockView);
        TextView label = new TextView(getContext());
        label.setText("  " + getContext().getString(R.string.app_name));
        label.setTextColor(0xFFB8C0CC);
        label.setTextSize(11);
        time.addView(label);
        container.addView(time, new LinearLayout.LayoutParams(-2, dp(38)));
        time.setOnTouchListener(this::dragBubble);

        Button proceed = new Button(getContext());
        proceed.setText(continueLabel);
        proceed.setTextSize(13);
        proceed.setAllCaps(false);
        proceed.setTextColor(0xFF10130D);
        proceed.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        GradientDrawable buttonBackground = new GradientDrawable();
        buttonBackground.setColor(0xFFB7F34A);
        buttonBackground.setCornerRadius(dp(22));
        proceed.setBackground(buttonBackground);
        LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(-2, dp(38));
        buttonParams.leftMargin = dp(10);
        container.addView(proceed, buttonParams);
        proceed.setOnClickListener(v -> {
            timerActive = false;
            cancelSchedule();
            removeBubble();
            notifyListeners("continueRest", new JSObject());
        });
        return container;
    }

    private boolean dragBubble(View view, MotionEvent event) {
        if (layoutParams == null || windowManager == null) return false;
        if (event.getAction() == MotionEvent.ACTION_DOWN) {
            dragX = event.getRawX();
            dragY = event.getRawY();
            startX = layoutParams.x;
            startY = layoutParams.y;
            return true;
        }
        if (event.getAction() == MotionEvent.ACTION_MOVE) {
            layoutParams.x = Math.max(0, startX + Math.round(event.getRawX() - dragX));
            layoutParams.y = Math.max(0, startY + Math.round(event.getRawY() - dragY));
            try { windowManager.updateViewLayout(bubble, layoutParams); } catch (Exception ignored) { }
            return true;
        }
        if (event.getAction() == MotionEvent.ACTION_UP) {
            getPreferences().edit().putInt("restBubbleX", layoutParams.x).putInt("restBubbleY", layoutParams.y).apply();
            return true;
        }
        return true;
    }

    private void scheduleTick() {
        tick = new Runnable() {
            @Override public void run() {
                if (!timerActive || bubble == null) return;
                updateClock();
                handler.postDelayed(this, 500L);
            }
        };
        handler.post(tick);
    }

    private void updateClock() {
        if (clockView == null) return;
        long seconds = Math.max(0L, (endsAt - System.currentTimeMillis() + 999L) / 1000L);
        clockView.setText((seconds / 60L) + ":" + String.format(java.util.Locale.US, "%02d", seconds % 60L));
    }

    private void removeBubble() {
        if (tick != null) handler.removeCallbacks(tick);
        tick = null;
        if (bubble != null && windowManager != null) {
            try { windowManager.removeView(bubble); } catch (Exception ignored) { }
        }
        bubble = null;
        clockView = null;
        layoutParams = null;
    }

    private void playFinishTone() {
        NotificationChime.play(getContext(), tone, "finish", true);
    }

    private void playCountdownTone() {
        NotificationChime.play(getContext(), tone, "countdown", false);
    }

    private android.content.SharedPreferences getPreferences() {
        return getContext().getSharedPreferences("rest_bubble", Context.MODE_PRIVATE);
    }

    private int dp(int value) {
        return Math.round(value * getContext().getResources().getDisplayMetrics().density);
    }

    @Override
    protected void handleOnDestroy() {
        cancelSchedule();
        removeBubble();
        super.handleOnDestroy();
    }
}
