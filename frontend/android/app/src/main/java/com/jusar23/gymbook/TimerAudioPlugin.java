package com.jusar23.gymbook;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TimerAudio")
public class TimerAudioPlugin extends Plugin {
    @PluginMethod
    public void play(PluginCall call) {
        boolean played = NotificationChime.play(getContext(), call.getString("tone", "classic"),
            call.getString("kind", "countdown"), call.getBoolean("duck", false));
        if (played) call.resolve();
        else call.reject("Could not play notification chime");
    }
}
