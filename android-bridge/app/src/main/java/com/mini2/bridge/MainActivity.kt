package com.mini2.bridge

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.TextView
import dji.common.error.DJIError
import dji.common.error.DJISDKError
import dji.sdk.base.BaseComponent
import dji.sdk.base.BaseProduct
import dji.sdk.sdkmanager.DJISDKInitEvent
import dji.sdk.sdkmanager.DJISDKManager

class MainActivity : Activity() {
    private lateinit var web: WebView
    private lateinit var statusView: TextView
    private lateinit var bridge: Bridge

    private val perms = arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.READ_PHONE_STATE, Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.RECORD_AUDIO,
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val root = FrameLayout(this)
        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
        }
        statusView = TextView(this).apply {
            setBackgroundColor(0x99000000.toInt()); setTextColor(Color.WHITE); textSize = 11f; setPadding(12, 4, 12, 4)
        }
        root.addView(web, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        root.addView(statusView, FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM or Gravity.START))
        setContentView(root)

        bridge = Bridge(applicationContext) { msg -> runOnUiThread { statusView.text = msg } }
        bridge.startServers()
        web.loadUrl("http://127.0.0.1:${Bridge.HTTP_PORT}/?bridge=1")

        requestMissingPermissionsThenRegister()
    }

    private fun requestMissingPermissionsThenRegister() {
        val missing = perms.filter { Build.VERSION.SDK_INT >= 23 && checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
        if (missing.isEmpty()) registerSdk() else requestPermissions(missing.toTypedArray(), 1)
    }

    override fun onRequestPermissionsResult(code: Int, p: Array<out String>, r: IntArray) {
        super.onRequestPermissionsResult(code, p, r)
        registerSdk()   // el SDK puede funcionar con permisos parciales; si falla, el estado lo indicará
    }

    private fun registerSdk() {
        statusView.text = "Registrando SDK de DJI (necesita Internet la primera vez)…"
        DJISDKManager.getInstance().registerApp(this, object : DJISDKManager.SDKManagerCallback {
            override fun onRegister(e: DJIError?) {
                runOnUiThread {
                    if (e == DJISDKError.REGISTRATION_SUCCESS) {
                        statusView.text = "SDK registrado. Conecta el RC-N1 por USB y enciende el dron."
                        DJISDKManager.getInstance().startConnectionToProduct()
                    } else statusView.text = "Error de registro: ${e?.description} (¿App Key y package name correctos?)"
                }
            }
            override fun onProductDisconnect() { bridge.detach() }
            override fun onProductConnect(p: BaseProduct?) { bridge.attach() }
            override fun onProductChanged(p: BaseProduct?) { bridge.attach() }
            override fun onComponentChange(k: BaseProduct.ComponentKey?, o: BaseComponent?, n: BaseComponent?) { bridge.attach() }
            override fun onInitProcess(e: DJISDKInitEvent?, i: Int) {}
            override fun onDatabaseDownloadProgress(a: Long, b: Long) {}
        })
    }

    override fun onDestroy() {
        bridge.stopServers()
        web.destroy()
        super.onDestroy()
    }
}
