package com.stride.social;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        View view = getBridge().getWebView();
        if (view instanceof WebView) {
            WebView webView = (WebView) view;
            WebSettings settings = webView.getSettings();

            // Allow mixed content for socket.io and other HTTP resources
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

            // Allow file access and other permissive settings for local dev
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptEnabled(true);

            // Maintain the margin fix
            ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) webView.getLayoutParams();
            params.topMargin = 100;
            webView.setLayoutParams(params);
        }
    }
}
