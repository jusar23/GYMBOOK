package com.jusar23.gymbook;

import android.net.Uri;
import android.provider.OpenableColumns;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "TrainingFile")
public class TrainingFilePlugin extends Plugin {
    private static Uri pendingUri;

    static void setPendingUri(Uri uri, String mimeType) {
        if (uri == null) return;
        String scheme = uri.getScheme();
        String path = uri.getLastPathSegment();
        boolean fileUri = "content".equals(scheme) || "file".equals(scheme);
        boolean jsonFile = "application/json".equalsIgnoreCase(mimeType)
            || (path != null && path.toLowerCase(java.util.Locale.ROOT).endsWith(".json"));
        if (fileUri && jsonFile) pendingUri = uri;
    }

    @PluginMethod
    public void readPending(PluginCall call) {
        Uri uri = pendingUri;
        if (uri == null) { call.resolve(new JSObject()); return; }
        try (InputStream input = getContext().getContentResolver().openInputStream(uri)) {
            if (input == null) throw new IllegalStateException("Could not open the selected file.");
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            JSObject result = new JSObject();
            result.put("content", new String(output.toByteArray(), StandardCharsets.UTF_8));
            call.resolve(result);
            pendingUri = null;
        } catch (Exception error) { call.reject("Could not read the Gym Book Training file.", error); }
    }
}
