package com.hybrid.athlete;
import android.content.Intent;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name="WorkoutService")
public class WorkoutServicePlugin extends Plugin {
 @PluginMethod public void start(PluginCall call){try{ContextCompat.startForegroundService(getContext(),new Intent(getContext(),WorkoutRecordingService.class));call.resolve();}catch(Exception e){call.reject("Could not start recording service",e);}}
 @PluginMethod public void share(PluginCall call){try{String data=call.getString("data", "{}"),name=call.getString("filename", "engine-backup.json").replaceAll("[^a-zA-Z0-9._-]", "_");File file=new File(getContext().getCacheDir(),name);try(FileOutputStream stream=new FileOutputStream(file)){stream.write(data.getBytes(StandardCharsets.UTF_8));}Intent send=new Intent(Intent.ACTION_SEND);send.setType("application/json");send.putExtra(Intent.EXTRA_STREAM,FileProvider.getUriForFile(getContext(),getContext().getPackageName()+".fileprovider",file));send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);getActivity().startActivity(Intent.createChooser(send,"Save or share Engine data"));call.resolve();}catch(Exception e){call.reject("Could not export data",e);}}
 @PluginMethod public void stop(PluginCall call){getContext().stopService(new Intent(getContext(),WorkoutRecordingService.class));call.resolve();}
}
