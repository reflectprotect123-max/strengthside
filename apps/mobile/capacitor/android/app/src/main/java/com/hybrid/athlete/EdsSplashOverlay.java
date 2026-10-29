package com.hybrid.athlete;

import android.app.Activity;
import android.content.res.AssetManager;
import android.graphics.Matrix;
import android.graphics.SurfaceTexture;
import android.media.MediaPlayer;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.Surface;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

/**
 * Ported from the EDS Conditioning rebrand (Apps PR #21). Full-screen overlay
 * that plays the 2.5s EDS Strength splash (assets/eds_splash.mp4) immediately
 * after the plain-navy Android 12+ / Capacitor splash exits. Does not block
 * the Capacitor web view, login, or data loading. If the app is ready early the
 * video still finishes.
 */
public final class EdsSplashOverlay {
    static final int NAVY = 0xFF0A1020;
    private static final String ASSET = "eds_splash.mp4";
    private static final long PREPARE_TIMEOUT_MS = 3000L;
    private static final long PLAY_FAILSAFE_MS = 4000L;

    private EdsSplashOverlay() {}

    public static void install(final Activity activity) {
        if (activity == null) {
            return;
        }
        try {
            View decor = activity.getWindow().getDecorView();
            if (!(decor instanceof ViewGroup)) {
                return;
            }
            attach(activity, (ViewGroup) decor);
        } catch (Throwable ignored) {
            // Never delay or crash launch.
        }
    }

    private static void attach(final Activity activity, final ViewGroup root) {
        final FrameLayout overlay = new FrameLayout(activity);
        overlay.setBackgroundColor(NAVY);
        overlay.setClickable(true);
        overlay.setFocusable(true);
        overlay.setFitsSystemWindows(false);
        try {
            overlay.setElevation(10000f);
        } catch (Throwable ignored) {
        }

        final TextureView texture = new TextureView(activity);
        texture.setOpaque(false);
        FrameLayout.LayoutParams videoLp =
                new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        Gravity.CENTER);
        overlay.addView(texture, videoLp);
        root.addView(
                overlay,
                new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        overlay.bringToFront();

        final Handler handler = new Handler(Looper.getMainLooper());
        final MediaPlayer[] holder = new MediaPlayer[1];
        final boolean[] dismissed = new boolean[] {false};
        final boolean[] started = new boolean[] {false};

        final Runnable dismiss =
                new Runnable() {
                    @Override
                    public void run() {
                        if (dismissed[0]) {
                            return;
                        }
                        dismissed[0] = true;
                        handler.removeCallbacksAndMessages(null);
                        releasePlayer(holder);
                        try {
                            root.removeView(overlay);
                        } catch (Throwable ignored) {
                        }
                    }
                };
        final Runnable prepareTimeout =
                new Runnable() {
                    @Override
                    public void run() {
                        if (!started[0]) {
                            dismiss.run();
                        }
                    }
                };

        handler.postDelayed(prepareTimeout, PREPARE_TIMEOUT_MS);

        TextureView.SurfaceTextureListener listener =
                new TextureView.SurfaceTextureListener() {
                    @Override
                    public void onSurfaceTextureAvailable(
                            SurfaceTexture surfaceTexture, int width, int height) {
                        try {
                            startPlayer(activity, texture, surfaceTexture, holder, handler, started, dismiss);
                        } catch (Throwable ignored) {
                            dismiss.run();
                        }
                    }

                    @Override
                    public void onSurfaceTextureSizeChanged(
                            SurfaceTexture surfaceTexture, int width, int height) {}

                    @Override
                    public boolean onSurfaceTextureDestroyed(SurfaceTexture surfaceTexture) {
                        dismiss.run();
                        return true;
                    }

                    @Override
                    public void onSurfaceTextureUpdated(SurfaceTexture surfaceTexture) {}
                };
        texture.setSurfaceTextureListener(listener);
        if (texture.isAvailable()) {
            try {
                startPlayer(activity, texture, texture.getSurfaceTexture(), holder, handler, started, dismiss);
            } catch (Throwable ignored) {
                dismiss.run();
            }
        }
    }

    private static void startPlayer(
            Activity activity,
            final TextureView texture,
            SurfaceTexture surfaceTexture,
            final MediaPlayer[] holder,
            final Handler handler,
            final boolean[] started,
            final Runnable dismiss)
            throws Exception {
        if (holder[0] != null) {
            return;
        }
        File file = materialize(activity);
        if (file == null) {
            dismiss.run();
            return;
        }
        final MediaPlayer player = new MediaPlayer();
        holder[0] = player;
        player.setDataSource(file.getAbsolutePath());
        player.setSurface(new Surface(surfaceTexture));
        player.setLooping(false);
        player.setOnVideoSizeChangedListener(
                new MediaPlayer.OnVideoSizeChangedListener() {
                    @Override
                    public void onVideoSizeChanged(MediaPlayer mp, int width, int height) {
                        applyFit(texture, width, height);
                    }
                });
        player.setOnPreparedListener(
                new MediaPlayer.OnPreparedListener() {
                    @Override
                    public void onPrepared(MediaPlayer mp) {
                        started[0] = true;
                        handler.postDelayed(dismiss, PLAY_FAILSAFE_MS);
                        try {
                            applyFit(texture, mp.getVideoWidth(), mp.getVideoHeight());
                        } catch (Throwable ignored) {
                        }
                        try {
                            mp.start();
                        } catch (Throwable ignored) {
                            dismiss.run();
                        }
                    }
                });
        player.setOnCompletionListener(
                new MediaPlayer.OnCompletionListener() {
                    @Override
                    public void onCompletion(MediaPlayer mp) {
                        dismiss.run();
                    }
                });
        player.setOnErrorListener(
                new MediaPlayer.OnErrorListener() {
                    @Override
                    public boolean onError(MediaPlayer mp, int what, int extra) {
                        dismiss.run();
                        return true;
                    }
                });
        player.prepareAsync();
    }

    private static void applyFit(TextureView texture, int videoW, int videoH) {
        int viewW = texture.getWidth();
        int viewH = texture.getHeight();
        if (viewW <= 0 || viewH <= 0 || videoW <= 0 || videoH <= 0) {
            return;
        }
        float scale = Math.min((float) viewW / (float) videoW, (float) viewH / (float) videoH);
        float dx = (viewW - videoW * scale) / 2f;
        float dy = (viewH - videoH * scale) / 2f;
        Matrix matrix = new Matrix();
        matrix.setScale(scale, scale);
        matrix.postTranslate(dx, dy);
        texture.setTransform(matrix);
    }

    private static File materialize(Activity activity) {
        try {
            File out = new File(activity.getCacheDir(), ASSET);
            if (out.exists() && out.length() > 1000) {
                return out;
            }
            AssetManager assets = activity.getAssets();
            InputStream in = assets.open(ASSET);
            FileOutputStream fos = new FileOutputStream(out);
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) {
                fos.write(buf, 0, n);
            }
            fos.close();
            in.close();
            return out;
        } catch (Throwable ignored) {
            return null;
        }
    }

    private static void releasePlayer(MediaPlayer[] holder) {
        try {
            MediaPlayer mp = holder[0];
            holder[0] = null;
            if (mp == null) {
                return;
            }
            mp.setOnCompletionListener(null);
            mp.setOnErrorListener(null);
            mp.setOnPreparedListener(null);
            mp.setOnVideoSizeChangedListener(null);
            if (mp.isPlaying()) {
                mp.stop();
            }
            mp.reset();
            mp.release();
        } catch (Throwable ignored) {
        }
    }
}
