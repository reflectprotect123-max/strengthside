/* Standard Bluetooth Heart Rate transport. No Fitbit/WHOOP account data. */
(function(root){
  const service='0000180d-0000-1000-8000-00805f9b34fb';
  const measurement='00002a37-0000-1000-8000-00805f9b34fb';
  const uuid=value=>{const s=String(value).toLowerCase();return /^[0-9a-f]{4}$/.test(s)?'0000'+s+'-0000-1000-8000-00805f9b34fb':s;};
  function createDevice(ble,info,onConnectionChange,options={}){
    const device=new EventTarget(),char=new EventTarget();let generation=0,closing=null;
    device.name=info.name||'Heart-rate monitor';
    function ended(){const wasConnected=device.gatt.connected;generation++;device.gatt.connected=false;onConnectionChange(device,false);if(wasConnected)device.dispatchEvent(new Event('gattserverdisconnected'));}
    async function disconnect(){
      if(closing)return closing;
      ended();
      closing=(async()=>{try{await ble.stopNotifications(info.deviceId,service,measurement);}catch{}try{await ble.disconnect(info.deviceId);}catch{}})();
      try{await closing;}finally{closing=null;}
    }
    char.stopNotifications=()=>{generation++;return ble.stopNotifications(info.deviceId,service,measurement);};
    char.startNotifications=async()=>{
      if(!device.gatt.connected)throw Error('Heart-rate monitor is disconnected.');
      const current=++generation;
      try{await ble.startNotifications(info.deviceId,service,measurement,value=>{
        if(current!==generation||!device.gatt.connected)return;
        char.value=value;char.dispatchEvent(new Event('characteristicvaluechanged'));
      });}catch(err){await disconnect();throw err;}
      return char;
    };
    device.gatt={connected:false,disconnect,connect:async()=>{
      if(closing)await closing;
      const current=++generation;
      try{
        await ble.connect(info.deviceId,ended);
        let found=false,services=[],bondStatus='';
        const hasHr=rows=>rows.some(s=>uuid(s.uuid)===service&&s.characteristics?.some(c=>uuid(c.uuid)===measurement&&(c.properties?.notify||c.properties?.indicate)));
        const ensureCurrent=()=>{if(current!==generation)throw Error('Heart-rate connection was interrupted. Please reconnect.');};
        for(let attempt=0;attempt<2;attempt++){
          services=await ble.getServices(info.deviceId);
          ensureCurrent();found=hasHr(services);
          if(found)break;
          if(attempt===0)await ble.discoverServices(info.deviceId);
        }
        // Pair only as a bounded Android Fitbit recovery, not for working monitors.
        if(!found&&options.android&&/fitbit|\bair\b/i.test(info.name||'')&&typeof ble.isBonded==='function'&&typeof ble.createBond==='function'){
          ensureCurrent();
          const bonded=await ble.isBonded(info.deviceId);ensureCurrent();
          bondStatus=bonded?'already paired':'not paired';
          if(!bonded){
            options.onStatus?.('Accept the Android pairing request for your Fitbit, if shown.');
            try{await ble.createBond(info.deviceId,{timeout:30000});}
            catch(err){throw Error('Fitbit pairing did not complete: '+err.message+'. Reconnect to try again.');}
            ensureCurrent();
            if(!await ble.isBonded(info.deviceId))throw Error('Fitbit pairing was not confirmed by Android. Reconnect and accept the pairing request.');
            ensureCurrent();bondStatus='paired, HR service still missing';
            options.onStatus?.('Fitbit paired. Checking live heart rate…');
            await ble.discoverServices(info.deviceId);ensureCurrent();
            services=await ble.getServices(info.deviceId);ensureCurrent();found=hasHr(services);
          }
        }
        if(!found){
          const details=services.map(s=>String(s.uuid)+' ['+(s.characteristics||[]).map(c=>String(c.uuid)).join(', ')+']').join('; ');
          throw Error('The monitor did not expose a live heart-rate measurement after fresh discovery. Disconnect it from other tracking apps and retry. Bluetooth services: '+(details||'none')+'.'+(bondStatus?' Android: '+bondStatus+'.':''));
        }
        if(current!==generation)throw Error('Heart-rate connection was interrupted. Please reconnect.');
        device.gatt.connected=true;onConnectionChange(device,true);
        return {getPrimaryService:async name=>{
          if(name!=='heart_rate'&&uuid(name)!==service)throw Error('Unsupported Bluetooth service.');
          return {getCharacteristic:async name=>{
            if(name!=='heart_rate_measurement'&&uuid(name)!==measurement)throw Error('Unsupported Bluetooth characteristic.');
            return char;
          }};
        }};
      }catch(err){await disconnect();throw err;}
    }};
    return device;
  }
  root.EngineHrTransport={createDevice};
})(globalThis);
