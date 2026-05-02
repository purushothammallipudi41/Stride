package com.stride.social;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        // Nuclear fix for white bar: force native window background to midnight dark
        getWindow().getDecorView().setBackgroundColor(android.graphics.Color.parseColor("#030014"));
    }
}
