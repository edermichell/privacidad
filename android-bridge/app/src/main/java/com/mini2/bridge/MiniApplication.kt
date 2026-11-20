package com.mini2.bridge

import android.app.Application
import android.content.Context
import com.secneo.sdk.Helper

/** El SDK V4 de DJI exige instalar su "Helper" antes de cualquier otra cosa. */
class MiniApplication : Application() {
    override fun attachBaseContext(base: Context) {
        super.attachBaseContext(base)
        Helper.install(this)
    }
}
