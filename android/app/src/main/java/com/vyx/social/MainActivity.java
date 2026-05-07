package com.vyx.social;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import androidx.activity.EdgeToEdge;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Enable modern Edge-to-Edge
        EdgeToEdge.enable(this);
        
        Window window = getWindow();
        
        // 2. Force Draw-Behind: This allows the app content to flow behind system bars (Instagram style)
        WindowCompat.setDecorFitsSystemWindows(window, false);

        window.setFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        
        // 4. Force UI Controller for icons
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(false); // Force white icons
            controller.setAppearanceLightNavigationBars(false);
        }

        // 5. Fundamental backgrounds - Match Brand Color for seamless transition
        window.getDecorView().setBackgroundColor(Color.parseColor("#030014"));
        
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setBackgroundColor(Color.TRANSPARENT);
            
            // Disable scrollbars and overscroll to prevent system artifacts
            this.bridge.getWebView().setVerticalScrollBarEnabled(false);
            this.bridge.getWebView().setHorizontalScrollBarEnabled(false);
            this.bridge.getWebView().setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
        }
    }




}

