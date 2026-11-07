package com.jusar23.gymbook;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(WorkoutOrientationPlugin.class);
        registerPlugin(TimerAudioPlugin.class);
        registerPlugin(RestNotificationPlugin.class);
        registerPlugin(StreakWidgetPlugin.class);
        registerPlugin(TrainingFilePlugin.class);
        TrainingFilePlugin.setPendingUri(getIntent() == null ? null : getIntent().getData(), getIntent() == null ? null : getIntent().getType());
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        TrainingFilePlugin.setPendingUri(intent == null ? null : intent.getData(), intent == null ? null : intent.getType());
        if (intent != null && intent.getData() != null && ("application/json".equals(intent.getType()) || intent.getData().toString().toLowerCase(java.util.Locale.ROOT).endsWith(".json")) && getBridge() != null) {
            getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new Event('gymbook-training-file-open'))", null);
        }
    }
}
