package com.google.android.play.core.appupdate;
public interface AppUpdateManager { com.google.android.gms.tasks.Task<AppUpdateInfo> getAppUpdateInfo(); boolean startUpdateFlowForResult(AppUpdateInfo i, android.app.Activity a, AppUpdateOptions o, int rc) throws android.content.IntentSender.SendIntentException; }
