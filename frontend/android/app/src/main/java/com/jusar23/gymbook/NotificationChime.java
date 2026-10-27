package com.jusar23.gymbook;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

/** Soft, short notification-stream chimes shared by the in-app timer and rest bubble. */
final class NotificationChime {
    private static final int RATE = 44100;
    private static final Handler HANDLER = new Handler(Looper.getMainLooper());
    private static AudioTrack activeTrack;
    private static AudioManager activeAudio;
    private static AudioFocusRequest activeFocus;
    private static boolean hasFocus;

    private NotificationChime() {}

    static synchronized boolean play(Context context, String tone, String kind, boolean duck) {
        releaseActive();
        AudioManager audio = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (duck) requestDuck(audio);

        int[] preset = notes(tone);
        int[] sequence = "finish".equals(kind) ? preset : new int[] { preset[0] };
        short[] pcm = synthesize(sequence);
        AudioTrack track = null;
        try {
            track = new AudioTrack(AudioManager.STREAM_NOTIFICATION, RATE,
                AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT,
                pcm.length * 2, AudioTrack.MODE_STATIC);
            if (track.getState() != AudioTrack.STATE_INITIALIZED) throw new IllegalStateException("Notification audio is unavailable");
            track.write(pcm, 0, pcm.length);
            track.setStereoVolume(1f, 1f);
            activeTrack = track;
            activeAudio = audio;
            track.play();
            AudioTrack playing = track;
            HANDLER.postDelayed(() -> {
                synchronized (NotificationChime.class) {
                    if (activeTrack == playing) releaseActive();
                }
            }, pcm.length * 1000L / RATE + 120L);
            return true;
        } catch (Exception error) {
            if (track != null) track.release();
            abandonFocus(audio);
            return false;
        }
    }

    private static short[] synthesize(int[] sequence) {
        final double noteSeconds = 0.205;
        final double gapSeconds = 0.025;
        int framesPerNote = (int) (RATE * noteSeconds);
        int gapFrames = (int) (RATE * gapSeconds);
        short[] samples = new short[sequence.length * framesPerNote + Math.max(0, sequence.length - 1) * gapFrames];
        for (int index = 0; index < sequence.length; index++) {
            int start = index * (framesPerNote + gapFrames);
            double base = sequence[index];
            for (int frame = 0; frame < framesPerNote; frame++) {
                double time = frame / (double) RATE;
                double attack = Math.min(1.0, time / 0.012);
                double release = Math.min(1.0, (noteSeconds - time) / 0.035);
                double decay = Math.exp(-time * 5.4);
                double wave = Math.sin(2 * Math.PI * base * time)
                    + 0.19 * Math.sin(2 * Math.PI * base * 2.76 * time)
                    + 0.045 * Math.sin(2 * Math.PI * base * 5.4 * time);
                double value = wave * attack * Math.max(0, release) * decay * 0.56 / 1.235;
                samples[start + frame] = (short) (Math.max(-1, Math.min(1, value)) * Short.MAX_VALUE);
            }
        }
        return samples;
    }

    private static int[] notes(String tone) {
        switch (tone == null ? "classic" : tone) {
            case "double": return new int[] { 659, 784, 988 };
            case "bright": return new int[] { 1047, 1319, 1568 };
            case "soft": return new int[] { 523, 659, 784 };
            case "urgent": return new int[] { 988, 784, 988 };
            default: return new int[] { 784, 988, 1175 };
        }
    }

    private static void requestDuck(AudioManager audio) {
        if (audio == null) return;
        hasFocus = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            activeFocus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                .setAudioAttributes(attributes).setAcceptsDelayedFocusGain(false).build();
            audio.requestAudioFocus(activeFocus);
        } else {
            //noinspection deprecation
            audio.requestAudioFocus(null, AudioManager.STREAM_NOTIFICATION, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
        }
    }

    private static void abandonFocus(AudioManager audio) {
        if (!hasFocus || audio == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && activeFocus != null) {
            audio.abandonAudioFocusRequest(activeFocus);
            activeFocus = null;
        } else {
            //noinspection deprecation
            audio.abandonAudioFocus(null);
        }
        hasFocus = false;
    }

    private static void releaseActive() {
        HANDLER.removeCallbacksAndMessages(null);
        if (activeTrack != null) {
            try { activeTrack.stop(); } catch (IllegalStateException ignored) { /* It may already have completed. */ }
            try { activeTrack.release(); } catch (IllegalStateException ignored) { /* Device audio shut down. */ }
            activeTrack = null;
        }
        abandonFocus(activeAudio);
        activeAudio = null;
    }
}
