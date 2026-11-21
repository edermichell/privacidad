package com.google.android.play.core.appupdate;
public abstract class AppUpdateInfo { public abstract int updateAvailability(); public abstract int availableVersionCode(); public abstract Integer clientVersionStalenessDays(); public abstract boolean isUpdateTypeAllowed(int t); }
