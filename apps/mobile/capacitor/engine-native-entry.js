import { BleClient } from '@capacitor-community/bluetooth-le';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { registerPlugin, Capacitor } from '@capacitor/core';
window.EngineNative={BleClient,Browser,App,Filesystem,Directory,KeepAwake,Capacitor,CapacitorUpdater,WorkoutService:registerPlugin('WorkoutService')};
// The existing WHOOP connector uses this registry for native consent/deep links.
// registerPlugin exposes Browser/App on the shared Capacitor registry.
