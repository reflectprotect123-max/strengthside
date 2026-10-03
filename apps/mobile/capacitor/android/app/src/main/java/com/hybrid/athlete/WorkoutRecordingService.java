package com.hybrid.athlete;
import android.app.*;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.*;
import androidx.core.app.NotificationCompat;
// Keeps an active BLE recording process foreground; actual phone testing remains required.
public class WorkoutRecordingService extends Service {
 private PowerManager.WakeLock wakeLock;
 @Override public void onCreate(){super.onCreate();NotificationManager manager=getSystemService(NotificationManager.class);manager.createNotificationChannel(new NotificationChannel("engine_recording","Workout recording",NotificationManager.IMPORTANCE_LOW));}
 @Override public int onStartCommand(Intent intent,int flags,int startId){
  Intent open=new Intent(this,MainActivity.class);PendingIntent pending=PendingIntent.getActivity(this,0,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  Notification notification=new NotificationCompat.Builder(this,"engine_recording").setSmallIcon(android.R.drawable.ic_media_play).setContentTitle("The Hybrid Engine").setContentText("Workout recording is active").setContentIntent(pending).setOngoing(true).build();
  if(Build.VERSION.SDK_INT>=29)startForeground(7301,notification,ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);else startForeground(7301,notification);
  if(wakeLock==null){wakeLock=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"HybridEngine:Workout");wakeLock.acquire(6*60*60*1000L);}
  return START_NOT_STICKY;
 }
 @Override public void onDestroy(){if(wakeLock!=null&&wakeLock.isHeld())wakeLock.release();super.onDestroy();}
 @Override public IBinder onBind(Intent intent){return null;}
}
