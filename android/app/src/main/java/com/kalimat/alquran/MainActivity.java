package com.kalimat.alquran;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // إخفاء شريط العنوان (URL bar)
    if (getSupportActionBar() != null) {
      getSupportActionBar().hide();
    }
  }
}