package com.jusar23.gymbook;

import android.content.pm.ActivityInfo;
import android.content.res.Configuration;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WorkoutOrientation")
public class WorkoutOrientationPlugin extends Plugin {
    @PluginMethod
    public void setLocked(PluginCall call) {
        boolean locked = call.getBoolean("locked", false);
        getActivity().runOnUiThread(() -> {
            if (locked) {
                int orientation = getActivity().getResources().getConfiguration().orientation;
                int requested = orientation == Configuration.ORIENTATION_LANDSCAPE
                    ? ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
                    : ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
                getActivity().setRequestedOrientation(requested);
            } else {
                getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
            }
            call.resolve();
        });
    }
}
