package com.transientlab.motion;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

/**
 * Zingdex 跃索 —— 单 Activity + WebView 壳。
 *
 * 站点资源打包在 assets/site 下，通过 file:///android_asset 直接加载。
 * 应用不申请网络权限，字体与组件代码全部内置。
 *
 * 这一版在原有壳上补了四件事：
 *   1. 边到边布局：内容延伸到状态栏 / 导航栏下方，再用 insets 把 WebView 撑回来，
 *      横屏和刘海屏都不会被切。
 *   2. 主题联动：站内切换深浅色时，通过 ZingdexHost.setTheme() 把状态栏、
 *      导航栏和窗口底色一起换掉，图标颜色也跟着变（浅色底用深色图标）。
 *   3. 外链外开：页面里的 http(s) 链接交给系统浏览器，不在 WebView 里迷路。
 *   4. 返回键：能后退就后退，退到底再按一次才退出，避免误触直接杀进程。
 */
public class MainActivity extends Activity {

    /* 手机端只做展示 + 设置，工作流在电脑端 */
    private static final String START_URL = "file:///android_asset/site/mobile.html";
    private static final int COLOR_DARK = Color.parseColor("#0A0B0D");
    private static final int COLOR_LIGHT = Color.parseColor("#F4F3EE");
    private static final long EXIT_WINDOW_MS = 2000L;
    private static final int REQ_PERM = 2002;

    private String pendingImage = null;
    private String pendingImageName = null;

    private WebView webView;
    private FrameLayout root;
    private long lastBackPress = 0L;

    /** 边到边的基础 UI 标志，applyTheme 会在它上面叠加浅色图标。 */
    private int baseUiFlags = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        configureWindow();

        root = new FrameLayout(this);
        root.setBackgroundColor(COLOR_DARK);

        webView = new WebView(this);
        webView.setBackgroundColor(COLOR_DARK);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        configureWebView();

        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT);
        root.addView(webView, lp);
        setContentView(root);

        // 必须放在 setContentView 之后：DecorView 还没挂上时
        // getWindowInsetsController() 返回 null，会直接 NPE 闪退
        applyTheme(true);

        applyInsets();

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(START_URL);
        }
    }

    // ------------------------------------------------------------------
    // 窗口与系统栏
    // ------------------------------------------------------------------

    private void configureWindow() {
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.setStatusBarColor(COLOR_DARK);
            window.setNavigationBarColor(COLOR_DARK);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS
                    | WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
        } else {
            baseUiFlags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            window.getDecorView().setSystemUiVisibility(baseUiFlags);
        }
    }

    /** 深浅色联动：窗口底色、两根系统栏、栏内图标颜色。 */
    private void applyTheme(boolean dark) {
        final int bg = dark ? COLOR_DARK : COLOR_LIGHT;

        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.setStatusBarColor(bg);
            window.setNavigationBarColor(bg);
        }
        if (root != null) {
            root.setBackgroundColor(bg);
        }
        if (webView != null) {
            webView.setBackgroundColor(bg);
        }

        View decor = window.getDecorView();
        if (decor == null) return;   // 窗口还没挂上，等下次再设

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            int lightBars = android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            android.view.WindowInsetsController ctl = decor.getWindowInsetsController();
            if (ctl != null) ctl.setSystemBarsAppearance(dark ? 0 : lightBars, lightBars);
        } else {
            int flags = baseUiFlags;
            if (!dark) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
            }
            decor.setSystemUiVisibility(flags);
        }
    }

    private void applyInsets() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
            root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override
                public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                    int top, bottom, left, right;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        android.graphics.Insets bars =
                                insets.getInsets(WindowInsets.Type.systemBars()
                                        | WindowInsets.Type.displayCutout());
                        top = bars.top;
                        bottom = bars.bottom;
                        left = bars.left;
                        right = bars.right;
                    } else {
                        top = insets.getSystemWindowInsetTop();
                        bottom = insets.getSystemWindowInsetBottom();
                        left = insets.getSystemWindowInsetLeft();
                        right = insets.getSystemWindowInsetRight();
                    }
                    v.setPadding(left, top, right, bottom);
                    return insets;
                }
            });
        }
    }

    // ------------------------------------------------------------------
    // WebView
    // ------------------------------------------------------------------

    private void configureWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);            // 主题偏好写入 localStorage
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setLoadsImagesAutomatically(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }

        webView.addJavascriptInterface(new HostBridge(), "ZingdexHost");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openExternal(Uri.parse(url));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openExternal(request.getUrl());
            }
        });

        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition,
                                        String mimeType, long contentLength) {
                openExternal(Uri.parse(url));
            }
        });
    }

    /** 只把站外的 http(s) 交给系统浏览器；assets 内的相对跳转留在 WebView。 */
    private boolean openExternal(Uri uri) {
        if (uri == null) {
            return false;
        }
        String scheme = uri.getScheme();
        if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
            return false;
        }
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "没有可打开该链接的浏览器", Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    /** 站内 app.js 通过这个对象回调原生主题与平台信息。 */
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_PERM) return;
        if (grantResults.length > 0 && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            doSaveImage();
        } else {
            pendingImage = null;
            Toast.makeText(this, "没有存储权限，无法保存到相册", Toast.LENGTH_LONG).show();
        }
    }

    /** 把二维码写进系统相册（Android 10+ 走 MediaStore，低版本走公共图片目录） */
    private void doSaveImage() {
        if (pendingImage == null) return;
        String name = (pendingImageName == null || pendingImageName.isEmpty())
                ? "Zingdex.png" : pendingImageName;
        try {
            byte[] bytes;
            if ("__asset__".equals(pendingImage)) {
                try (java.io.InputStream in = getAssets().open("site/assets/contact-qr.png")) {
                    java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
                    byte[] buf = new byte[8192];
                    int n;
                    while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
                    bytes = bos.toByteArray();
                }
            } else {
                String raw = pendingImage;
                int comma = raw.indexOf(',');
                if (comma > 0) raw = raw.substring(comma + 1);
                bytes = android.util.Base64.decode(raw, android.util.Base64.DEFAULT);
            }
            if (bytes == null || bytes.length == 0) throw new java.io.IOException("图片数据为空");

            if (Build.VERSION.SDK_INT >= 29) {
                android.content.ContentValues cv = new android.content.ContentValues();
                cv.put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, name);
                cv.put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "image/png");
                cv.put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH,
                        android.os.Environment.DIRECTORY_PICTURES + "/Zingdex");
                cv.put(android.provider.MediaStore.MediaColumns.IS_PENDING, 1);

                android.net.Uri uri = getContentResolver()
                        .insert(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                if (uri == null) throw new java.io.IOException("相册拒绝创建条目");
                java.io.OutputStream out = getContentResolver().openOutputStream(uri);
                if (out == null) throw new java.io.IOException("相册无法写入");
                out.write(bytes);
                out.flush();
                out.close();

                // 写完再解除挂起，系统才会把这张图正式加入相册
                android.content.ContentValues done = new android.content.ContentValues();
                done.put(android.provider.MediaStore.MediaColumns.IS_PENDING, 0);
                getContentResolver().update(uri, done, null, null);
            } else {
                java.io.File dir = new java.io.File(
                        android.os.Environment.getExternalStoragePublicDirectory(
                                android.os.Environment.DIRECTORY_PICTURES), "Zingdex");
                if (!dir.exists() && !dir.mkdirs()) throw new java.io.IOException("无法创建目录");
                java.io.File f = new java.io.File(dir, name);
                try (java.io.FileOutputStream out = new java.io.FileOutputStream(f)) {
                    out.write(bytes);
                }
                android.media.MediaScannerConnection.scanFile(
                        this, new String[]{f.getAbsolutePath()}, null, null);
            }
            Toast.makeText(this, "已保存到相册", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            String m = String.valueOf(e.getMessage());
            Toast.makeText(this, "保存失败：" + (m.length() > 28 ? m.substring(0, 28) : m),
                    Toast.LENGTH_LONG).show();
        } finally {
            pendingImage = null;
            pendingImageName = null;
        }
    }


    private static String quoteJs(String s) {
        if (s == null) return "''";
        StringBuilder sb = new StringBuilder("'");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == 0x27 || c == 0x5C) {
                sb.append((char) 0x5C).append(c);
            } else if (c == 0x0A) {
                sb.append((char) 0x5C).append('n');
            } else if (c == 0x0D) {
                sb.append((char) 0x5C).append('r');
            } else {
                sb.append(c);
            }
        }
        return sb.append((char) 0x27).toString();
    }

    private void runJs(final String code) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (webView != null) webView.evaluateJavascript(code, null);
            }
        });
    }

    public class HostBridge {

        @JavascriptInterface
        public void setTheme(final String theme) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    applyTheme(!"light".equalsIgnoreCase(theme));
                }
            });
        }

        /** 直接把 assets 里的二维码写进相册。不走 JS 传字节，
         *  file:// 下的 fetch 会被 WebView 拦掉。 */
        @JavascriptInterface
        public void saveQr() {
            pendingImage = "__asset__";
            pendingImageName = "Zingdex-联系管理员.png";
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (Build.VERSION.SDK_INT < 29
                            && checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE)
                            != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                        requestPermissions(
                                new String[]{android.Manifest.permission.WRITE_EXTERNAL_STORAGE},
                                REQ_PERM);
                    } else {
                        doSaveImage();
                    }
                }
            });
        }

        /** 导出使用须知：把内置 PDF 拷到缓存，再交给系统分享 */
        @JavascriptInterface
        public void shareDoc() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        java.io.File f = new java.io.File(getCacheDir(), "Zingdex-使用须知.pdf");
                        try (java.io.InputStream in = getAssets().open("site/assets/terms.pdf");
                             java.io.FileOutputStream out = new java.io.FileOutputStream(f)) {
                            byte[] buf = new byte[8192];
                            int n;
                            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                        }
                        android.net.Uri uri = new android.net.Uri.Builder()
                                .scheme("content")
                                .authority(DocProvider.AUTHORITY)
                                .appendPath("Zingdex-使用须知.pdf")
                                .build();

                        Intent send = new Intent(Intent.ACTION_SEND);
                        send.setType("application/pdf");
                        send.putExtra(Intent.EXTRA_STREAM, uri);
                        send.putExtra(Intent.EXTRA_SUBJECT, "Zingdex 使用须知");
                        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                        Intent chooser = Intent.createChooser(send, "分享使用须知");
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        startActivity(chooser);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "导出失败", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        /** 保存二维码到相册。Android 10 以下需要申请存储权限。 */
        @JavascriptInterface
        public void saveImage(final String base64, final String filename) {
            pendingImage = base64;
            pendingImageName = filename;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (Build.VERSION.SDK_INT < 29
                            && checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE)
                            != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                        requestPermissions(
                                new String[]{android.Manifest.permission.WRITE_EXTERNAL_STORAGE},
                                REQ_PERM);
                    } else {
                        doSaveImage();
                    }
                }
            });
        }

        @JavascriptInterface
        public String platform() {
            return "android";
        }

        /** 系统当前是否深色。WebView 的 prefers-color-scheme 跟的是应用主题，不可靠 */
        @JavascriptInterface
        public boolean systemDark() {
            int mode = getResources().getConfiguration().uiMode
                    & android.content.res.Configuration.UI_MODE_NIGHT_MASK;
            return mode == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        /**
         * 设备标识：用来把激活状态锁死在这台机器上。
         * ANDROID_ID 在恢复出厂前不变，且不涉及任何权限。
         * 把应用数据拷到另一台手机上，这个值就对不上，激活随之失效。
         */
        @JavascriptInterface
        public String deviceId() {
            try {
                String id = android.provider.Settings.Secure.getString(
                        getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
                return id == null ? "" : id;
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public String version() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public boolean isNative() {
            return true;
        }

        /** 原生剪贴板：不依赖 WebView 的 document.execCommand，任何机型都稳。 */
        @JavascriptInterface
        public boolean copy(final String text) {
            try {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        android.content.ClipboardManager cm =
                                (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                        if (cm != null) {
                            cm.setPrimaryClip(android.content.ClipData.newPlainText("Zingdex", text));
                        }
                    }
                });
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        /** 系统分享面板：不写外部存储，也就不需要任何存储权限。 */
        @JavascriptInterface
        public boolean share(final String title, final String text) {
            try {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Intent send = new Intent(Intent.ACTION_SEND);
                        send.setType("text/plain");
                        send.putExtra(Intent.EXTRA_SUBJECT, title);
                        send.putExtra(Intent.EXTRA_TEXT, text);
                        Intent chooser = Intent.createChooser(send, "导出组件");
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(chooser);
                    }
                });
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        /**
         * 用系统浏览器打开链接。
         * 装了对面的 App 并且声明了 App Links 时，Android 会直接拉起那个 App，
         * 没装就落到浏览器——路由交给系统，不写死。
         */
        @JavascriptInterface
        public boolean openUrl(final String url) {
            if (url == null || !(url.startsWith("http://") || url.startsWith("https://"))) {
                return false;
            }
            try {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(i);
                        } catch (ActivityNotFoundException e) {
                            Toast.makeText(MainActivity.this,
                                    "没有可以打开这个链接的应用", Toast.LENGTH_SHORT).show();
                        }
                    }
                });
                return true;
            } catch (Exception e) {
                return false;
            }
        }

    }

    // ------------------------------------------------------------------
    // 生命周期与返回键
    // ------------------------------------------------------------------

    @Override
    public void onBackPressed() {
        // 返回键全部交给页面处理：关弹窗 → 关详情 → 回组件视图 → 滚回最顶 → 提示「已在首页」。
        // 任何情况下都不靠返回键退出，避免误触。退出请用系统手势上滑或主界面键。
        if (webView != null) {
            webView.evaluateJavascript("window.TZBack && window.TZBack.handle()", null);
        }
    }

    @Override
    public void onConfigurationChanged(android.content.res.Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // manifest 里声明了 uiMode，切换深浅色时 Activity 不会重建，
        // 这里主动通知页面重新判断一次「跟随系统」。
        if (webView != null) {
            webView.post(new Runnable() {
                @Override
                public void run() {
                    webView.evaluateJavascript("window.TZThemeSync && window.TZThemeSync()", null);
                }
            });
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    protected void onPause() {
        if (webView != null) {
            webView.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            root.removeView(webView);
            webView.loadUrl("about:blank");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
