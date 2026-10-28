package com.jusar23.gymbook;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(WorkoutOrientationPlugin.class);
        registerPlugin(TimerAudioPlugin.class);
        registerPlugin(RestNotificationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
