package com.hybrid.athlete;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle state){registerPlugin(WorkoutServicePlugin.class);super.onCreate(state);}
}
