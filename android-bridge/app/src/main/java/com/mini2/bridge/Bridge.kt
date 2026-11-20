package com.mini2.bridge

import android.content.Context
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.SurfaceTexture
import android.graphics.YuvImage
import android.media.MediaFormat
import android.os.Handler
import android.os.HandlerThread
import android.os.SystemClock
import dji.common.camera.SettingsDefinitions
import dji.common.error.DJIError
import dji.common.flightcontroller.ConnectionFailSafeBehavior
import dji.common.flightcontroller.FlightControllerState
import dji.common.flightcontroller.FlightMode
import dji.common.flightcontroller.virtualstick.FlightControlData
import dji.common.flightcontroller.virtualstick.FlightCoordinateSystem
import dji.common.flightcontroller.virtualstick.RollPitchControlMode
import dji.common.flightcontroller.virtualstick.VerticalControlMode
import dji.common.flightcontroller.virtualstick.YawControlMode
import dji.common.gimbal.Rotation
import dji.common.gimbal.RotationMode
import dji.common.util.CommonCallbacks
import dji.sdk.camera.VideoFeeder
import dji.sdk.codec.DJICodecManager
import dji.sdk.products.Aircraft
import dji.sdk.sdkmanager.DJISDKManager
import fi.iki.elonen.NanoHTTPD
import org.java_websocket.WebSocket
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.server.WebSocketServer
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.InetSocketAddress
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.hypot

/**
 * Puente entre la interfaz web (dji-mini2-control.html) y el Mini 2.
 *
 *  - HTTP  :8080  sirve la interfaz (assets/index.html)
 *  - WS    :8765  protocolo JSON de la pestaña "Conexión" + fotogramas JPEG binarios
 *
 * IMPORTANTE: escrito contra DJI Mobile SDK V4 (4.16.x) sin poder compilarlo ni probarlo con un dron
 * real. Puede que haya que ajustar nombres de clases/métodos al compilar. Prueba SIEMPRE sin hélices
 * y luego en un espacio abierto.
 */
class Bridge(
    private val ctx: Context,
    private val status: (String) -> Unit,
) {
    companion object {
        /** false = solo accesible desde el propio celular (WebView). true = también desde la red local, SIN autenticación. */
        const val ALLOW_LAN = false
        const val HTTP_PORT = 8080
        const val WS_PORT = 8765
    }

    private class Lim(val vh: Float, val up: Float, val down: Float, val yaw: Float)

    private var ws: WsServer? = null
    private var http: AssetServer? = null
    private val thread = HandlerThread("bridge").apply { start() }
    private val handler = Handler(thread.looper)

    // --- Estado compartido (rellenado por callbacks del SDK)
    @Volatile private var fcs: FlightControllerState? = null
    @Volatile private var bat = 0; @Volatile private var volt = 0.0; @Volatile private var temp = 0
    @Volatile private var gimPitch = 0f
    @Volatile private var rc = 0; @Volatile private var vid = 0
    @Volatile private var rec = false; @Volatile private var recT = 0
    @Volatile private var photos = 0
    @Volatile private var mode = "N"
    private var firstLat = Double.NaN; private var firstLon = Double.NaN

    // --- Virtual stick
    @Volatile private var vsEnabled = false
    @Volatile private var lastSticks = 0L
    @Volatile private var lastActive = 0L
    private var gimTarget = 0f
    private var lastGimSent = 0L

    // --- Vídeo
    private var codec: DJICodecManager? = null
    private var videoListener: VideoFeeder.VideoDataListener? = null
    private val encoding = AtomicBoolean(false)
    private var lastFrame = 0L

    // ------------------------------------------------------------------ servidores
    fun startServers() {
        val host = if (ALLOW_LAN) null else "127.0.0.1"
        http = AssetServer(ctx, host, HTTP_PORT).also { it.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false) }
        val addr = if (ALLOW_LAN) InetSocketAddress(WS_PORT) else InetSocketAddress("127.0.0.1", WS_PORT)
        ws = WsServer(addr).also { it.isReuseAddr = true; it.start() }
        handler.post(loop)
        status("Servidores listos (HTTP $HTTP_PORT, WS $WS_PORT)")
    }

    fun stopServers() {
        handler.removeCallbacksAndMessages(null)
        try { ws?.stop(500) } catch (_: Exception) {}
        try { http?.stop() } catch (_: Exception) {}
        disableVirtualStick()
        stopVideo()
        thread.quitSafely()
    }

    private inner class WsServer(addr: InetSocketAddress) : WebSocketServer(addr) {
        override fun onOpen(conn: WebSocket, hs: ClientHandshake) { connectionLostTimeout = 5; status("Interfaz conectada") }
        override fun onClose(conn: WebSocket?, code: Int, reason: String?, remote: Boolean) {
            if (connections.isEmpty()) { disableVirtualStick(); status("Interfaz desconectada: el mando RC recupera el control") }
        }
        override fun onMessage(conn: WebSocket, message: String) = handle(conn, message)
        override fun onError(conn: WebSocket?, ex: Exception?) { status("WS error: ${ex?.message}") }
        override fun onStart() {}
    }

    /** Sirve SOLO la interfaz web empaquetada en assets. */
    private class AssetServer(private val ctx: Context, host: String?, port: Int) : NanoHTTPD(host, port) {
        override fun serve(session: IHTTPSession): Response {
            if (session.uri != "/" && session.uri != "/index.html")
                return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "404")
            return try {
                newChunkedResponse(Response.Status.OK, "text/html; charset=utf-8", ctx.assets.open("index.html"))
            } catch (e: Exception) {
                newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "text/plain", "Falta assets/index.html")
            }
        }
    }

    // ------------------------------------------------------------------ SDK
    private fun aircraft(): Aircraft? = DJISDKManager.getInstance().product as? Aircraft

    /** Idempotente: se puede llamar cada vez que el SDK avise de un cambio de producto/componente. */
    fun attach() {
        val ac = aircraft() ?: return
        ac.flightController?.setStateCallback { s -> fcs = s }
        ac.battery?.setStateCallback { s -> bat = s.chargeRemainingInPercent; volt = s.voltage / 1000.0; temp = s.temperature }
        ac.gimbal?.setStateCallback { s -> gimPitch = s.attitudeInDegrees.pitch }
        ac.camera?.setSystemStateCallback { s -> rec = s.isRecording; recT = s.currentVideoRecordingTimeInSeconds }
        try {
            ac.airLink?.setUplinkSignalQualityCallback { q -> rc = q }
            ac.airLink?.setDownlinkSignalQualityCallback { q -> vid = q }
        } catch (_: Throwable) { /* no disponible en todos los modelos */ }
        // Conexión perdida con la interfaz/RC: que el dron decida (volver a casa, aterrizar, mantener).
        // ac.flightController?.setConnectionFailSafeBehavior(ConnectionFailSafeBehavior.GO_HOME, null)
        startVideo()
        status("Dron conectado: ${ac.model?.displayName}")
    }

    fun detach() {
        fcs = null; stopVideo(); vsEnabled = false
        status("Dron desconectado")
    }

    // ------------------------------------------------------------------ vídeo (H.264 -> YUV -> JPEG)
    private fun startVideo() {
        if (codec != null) return
        val feed = VideoFeeder.getInstance()?.primaryVideoFeed ?: return
        val c = DJICodecManager(ctx, SurfaceTexture(0), 0, 0)
        c.enabledYuvData(true)
        c.setYuvDataCallback { fmt, yuv, size, w, h -> onYuv(fmt, yuv, size, w, h) }
        codec = c
        videoListener = VideoFeeder.VideoDataListener { buf, size -> codec?.sendDataToDecoder(buf, size) }
        feed.addVideoDataListener(videoListener)
    }

    private fun stopVideo() {
        try { videoListener?.let { VideoFeeder.getInstance()?.primaryVideoFeed?.removeVideoDataListener(it) } } catch (_: Throwable) {}
        try { codec?.enabledYuvData(false); codec?.cleanSurface(); codec?.destroyCodec() } catch (_: Throwable) {}
        codec = null; videoListener = null
    }

    private fun onYuv(fmt: MediaFormat?, yuv: java.nio.ByteBuffer?, size: Int, w: Int, h: Int) {
        val server = ws ?: return
        if (yuv == null || server.connections.isEmpty()) return
        val now = SystemClock.elapsedRealtime()
        if (now - lastFrame < 66 || !encoding.compareAndSet(false, true)) return   // ~15 fps, sin acumular
        lastFrame = now
        try {
            val raw = ByteArray(size); yuv.rewind(); yuv.get(raw)
            val semiPlanar = try { fmt?.getInteger(MediaFormat.KEY_COLOR_FORMAT) != 19 /* planar I420 */ } catch (_: Exception) { true }
            val nv21 = toNv21(raw, w, h, semiPlanar)
            val out = ByteArrayOutputStream(w * h / 4)
            YuvImage(nv21, ImageFormat.NV21, w, h, null).compressToJpeg(Rect(0, 0, w, h), 60, out)
            server.broadcast(out.toByteArray())
        } catch (_: Exception) {
        } finally { encoding.set(false) }
    }

    /** NV12 (Y + UVUV) o I420 (Y + U + V)  ->  NV21 (Y + VUVU). */
    private fun toNv21(src: ByteArray, w: Int, h: Int, semiPlanar: Boolean): ByteArray {
        val ySize = w * h
        val out = ByteArray(ySize * 3 / 2)
        System.arraycopy(src, 0, out, 0, ySize)
        val n = ySize / 4
        if (semiPlanar) {
            var i = 0
            while (i < n * 2) { out[ySize + i] = src[ySize + i + 1]; out[ySize + i + 1] = src[ySize + i]; i += 2 }
        } else {
            for (i in 0 until n) { out[ySize + 2 * i] = src[ySize + n + i]; out[ySize + 2 * i + 1] = src[ySize + i] }
        }
        return out
    }

    // ------------------------------------------------------------------ mensajes de la interfaz
    private fun handle(conn: WebSocket, text: String) {
        val j = try { JSONObject(text) } catch (_: Exception) { return }
        when (j.optString("t")) {
            "ping" -> conn.send("""{"t":"pong","ts":${j.optLong("ts")}}""")
            "sticks" -> onSticks(j)
            "cmd" -> onCmd(conn, j.optInt("id"), j.optString("name"), j.optJSONObject("args") ?: JSONObject())
        }
    }

    private fun lim(): Lim = when (mode) {
        "C" -> Lim(6f, 2f, 1.5f, 60f)
        "S" -> Lim(15f, 4f, 3.5f, 100f)   // el SDK limita velocidad horizontal a ±15 m/s y yaw a ±100 °/s
        else -> Lim(10f, 3f, 3f, 100f)
    }

    private fun onSticks(j: JSONObject) {
        mode = j.optString("mode", mode)
        val pitch = j.optDouble("pitch", 0.0).toFloat()
        val roll = j.optDouble("roll", 0.0).toFloat()
        val yaw = j.optDouble("yaw", 0.0).toFloat()
        val thr = j.optDouble("throttle", 0.0).toFloat()
        val gim = j.optDouble("gimbal", 0.0).toFloat()
        val now = SystemClock.elapsedRealtime()
        lastSticks = now
        val active = listOf(pitch, roll, yaw, thr).any { abs(it) > 0.02f }
        if (active) { lastActive = now; enableVirtualStick() }
        if (vsEnabled) sendStick(pitch, roll, yaw, thr)
        // Gimbal por velocidad: integramos un objetivo absoluto
        if (abs(gim) > 0.05f) {
            gimTarget = (gimTarget + gim * 35f * 0.04f).coerceIn(-90f, 20f)
            if (now - lastGimSent > 100) { rotateGimbal(gimTarget); lastGimSent = now }
        } else gimTarget = gimPitch
    }

    private fun sendStick(pitch: Float, roll: Float, yaw: Float, thr: Float) {
        val l = lim()
        val vertical = if (thr > 0) thr * l.up else thr * l.down
        // En modo BODY + VELOCITY: pitch = adelante/atrás (m/s), roll = derecha/izquierda (m/s)
        aircraft()?.flightController?.sendVirtualStickFlightControlData(
            FlightControlData(pitch * l.vh, roll * l.vh, yaw * l.yaw, vertical), null)
    }

    private fun enableVirtualStick() {
        if (vsEnabled) return
        val fc = aircraft()?.flightController ?: return
        fc.rollPitchControlMode = RollPitchControlMode.VELOCITY
        fc.yawControlMode = YawControlMode.ANGULAR_VELOCITY
        fc.verticalControlMode = VerticalControlMode.VELOCITY
        fc.rollPitchCoordinateSystem = FlightCoordinateSystem.BODY
        fc.setVirtualStickModeEnabled(true, CommonCallbacks.CompletionCallback<DJIError> { e ->
            vsEnabled = (e == null)
            status(if (e == null) "Control virtual ACTIVO (los sticks del RC dejan de pilotar)" else "Virtual stick: ${e.description}")
        })
    }

    private fun disableVirtualStick() {
        if (!vsEnabled) return
        val fc = aircraft()?.flightController
        try { fc?.sendVirtualStickFlightControlData(FlightControlData(0f, 0f, 0f, 0f), null) } catch (_: Throwable) {}
        fc?.setVirtualStickModeEnabled(false, CommonCallbacks.CompletionCallback<DJIError> { })
        vsEnabled = false
        status("Control virtual desactivado: vuelve el mando RC")
    }

    private fun rotateGimbal(angle: Float) {
        val g = aircraft()?.gimbal ?: return
        val r = Rotation.Builder().mode(RotationMode.ABSOLUTE_ANGLE).pitch(angle)
            .roll(Rotation.NO_ROTATION).yaw(Rotation.NO_ROTATION).time(0.4).build()
        g.rotate(r, null)
    }

    // ------------------------------------------------------------------ comandos
    private fun ack(conn: WebSocket?, id: Int, e: DJIError?) =
        conn?.send(JSONObject().put("t", "ack").put("id", id).put("ok", e == null).put("msg", e?.description ?: "").toString())

    private fun fail(conn: WebSocket?, id: Int, msg: String) =
        conn?.send(JSONObject().put("t", "ack").put("id", id).put("ok", false).put("msg", msg).toString())

    private fun cb(conn: WebSocket?, id: Int) = CommonCallbacks.CompletionCallback<DJIError> { e -> ack(conn, id, e) }

    private fun onCmd(conn: WebSocket, id: Int, name: String, a: JSONObject) {
        val ac = aircraft() ?: return fail(conn, id, "Dron no conectado")
        val fc = ac.flightController
        val cam = ac.camera
        when (name) {
            "takeoff" -> fc?.startTakeoff(cb(conn, id)) ?: fail(conn, id, "Sin controlador de vuelo")
            "land" -> fc?.startLanding(cb(conn, id))
            "cancel_land" -> fc?.cancelLanding(cb(conn, id))
            "confirm_landing" -> fc?.confirmLanding(cb(conn, id))
            "rth" -> fc?.startGoHome(cb(conn, id))
            "cancel_rth" -> fc?.cancelGoHome(cb(conn, id))
            "emergency" -> fc?.turnOffMotors(cb(conn, id))
            "brake" -> { sendStick(0f, 0f, 0f, 0f); ack(conn, id, null) }
            "set_mode" -> { mode = a.optString("mode", "N"); ack(conn, id, null) }
            "set_home" -> fc?.setHomeLocationUsingAircraftCurrentLocation(cb(conn, id))
            "calibrate" ->
                if (a.optString("what") == "compass") fc?.compass?.startCalibration(cb(conn, id))
                else fail(conn, id, "Solo se implementa la calibración de brújula (hazla desde DJI Fly)")

            "gimbal_angle" -> { rotateGimbal(a.optDouble("angle", 0.0).toFloat().coerceIn(-90f, 20f)); ack(conn, id, null) }
            "gimbal_center" -> { rotateGimbal(0f); ack(conn, id, null) }

            "photo" -> cam?.setMode(SettingsDefinitions.CameraMode.SHOOT_PHOTO) { e ->
                if (e != null) ack(conn, id, e)
                else cam?.startShootPhoto { e2 -> if (e2 == null) photos++; ack(conn, id, e2) }
            } ?: fail(conn, id, "Sin cámara")
            "record_start" -> cam?.setMode(SettingsDefinitions.CameraMode.RECORD_VIDEO) { e ->
                if (e != null) ack(conn, id, e) else cam?.startRecordVideo(cb(conn, id))
            } ?: fail(conn, id, "Sin cámara")
            "record_stop" -> cam?.stopRecordVideo(cb(conn, id))

            "camera_set" -> when {
                a.has("mode") -> cam?.setMode(
                    if (a.optString("mode") == "video") SettingsDefinitions.CameraMode.RECORD_VIDEO
                    else SettingsDefinitions.CameraMode.SHOOT_PHOTO, cb(conn, id))
                // TODO: ISO, obturador, EV, balance de blancos, resolución/fps, formato, zoom digital (ver SettingsDefinitions)
                else -> fail(conn, id, "Ajuste de cámara no implementado en el puente base: ${a.keys().asSequence().toList()}")
            }

            "settings_set" -> {
                val v = a.opt("value")
                when (a.optString("key")) {
                    "rthAlt" -> fc?.setGoHomeHeightInMeters((v as Number).toInt(), cb(conn, id))
                    "maxAlt" -> fc?.setMaxFlightHeight((v as Number).toInt(), cb(conn, id))
                    "maxDist" -> {
                        fc?.setMaxFlightRadiusLimitationEnabled(true, null)
                        fc?.setMaxFlightRadius((v as Number).toInt(), cb(conn, id))
                    }
                    "failsafe" -> fc?.setConnectionFailSafeBehavior(when (v) {
                        "land" -> ConnectionFailSafeBehavior.LANDING
                        "hover" -> ConnectionFailSafeBehavior.HOVER
                        else -> ConnectionFailSafeBehavior.GO_HOME
                    }, cb(conn, id))
                    "vision" -> fc?.flightAssistant?.setVisionAssistedPositioningEnabled(v as Boolean, cb(conn, id))
                    else -> ack(conn, id, null)   // ajustes solo de la interfaz (avisos de batería, etc.)
                }
            }

            // No existen en la API pública del SDK V4 (o requieren implementación propia con sticks/waypoints)
            "quickshot", "hyperlapse", "panorama", "shot_stop",
            "mission_upload", "mission_start", "mission_pause", "mission_resume", "mission_stop",
            "zoom_set" -> fail(conn, id, "No implementado en el puente base: $name")

            else -> fail(conn, id, "Comando desconocido: $name")
        }
    }

    // ------------------------------------------------------------------ bucle 10 Hz: telemetría + vigilancia
    private val loop = object : Runnable {
        override fun run() {
            try {
                val now = SystemClock.elapsedRealtime()
                // Si la interfaz deja de enviar sticks: frenar; si lleva 2 s inactiva: devolver el control al RC
                if (vsEnabled) {
                    if (now - lastSticks > 500) sendStick(0f, 0f, 0f, 0f)
                    if (now - lastActive > 2000 || now - lastSticks > 2000) disableVirtualStick()
                }
                val server = ws
                if (server != null && server.connections.isNotEmpty()) server.broadcast(telemetry())
            } catch (_: Throwable) {}
            handler.postDelayed(this, 100)
        }
    }

    private fun telemetry(): String {
        val o = JSONObject().put("t", "telemetry").put("mode", mode).put("rc", rc).put("vid", vid)
            .put("bat", bat).put("volt", volt).put("temp", temp).put("gim", gimPitch.toDouble())
            .put("rec", rec).put("recT", recT).put("photos", photos)
        val s = fcs
        if (s == null) return o.put("state", "ground").put("motors", false).put("sats", 0).toString()

        val loc = s.aircraftLocation
        val lat = loc.latitude; val lon = loc.longitude
        if (lat.isFinite() && lon.isFinite() && (lat != 0.0 || lon != 0.0)) {
            if (firstLat.isNaN()) { firstLat = lat; firstLon = lon }
            val hl = if (s.isHomeLocationSet) s.homeLocation.latitude else firstLat
            val ho = if (s.isHomeLocationSet) s.homeLocation.longitude else firstLon
            o.put("lat", lat).put("lon", lon).put("homeLat", hl).put("homeLon", ho)
                .put("x", (lon - ho) * 111320.0 * cos(Math.toRadians(hl)))
                .put("y", (lat - hl) * 111320.0)
        }
        val fm = s.flightMode
        val state = when {
            !s.isFlying && !s.areMotorsOn() -> "ground"
            fm == FlightMode.GO_HOME -> "rth"
            fm == FlightMode.AUTO_LANDING -> "landing"
            fm == FlightMode.AUTO_TAKEOFF -> "takeoff"
            else -> "flying"
        }
        // Velocidades del SDK en NED (m/s): X norte, Y este, Z abajo
        o.put("state", state).put("motors", s.areMotorsOn())
            .put("alt", loc.altitude.toDouble())
            .put("hs", hypot(s.velocityX.toDouble(), s.velocityY.toDouble()))
            .put("vz", (-s.velocityZ).toDouble())
            .put("yaw", ((s.attitude.yaw + 360.0) % 360.0))
            .put("pitch", s.attitude.pitch).put("roll", s.attitude.roll)
            .put("sats", s.satelliteCount).put("ft", s.flightTimeInSeconds)
        if (s.isLandingConfirmationNeeded) o.put("msg", "Confirma el aterrizaje")
        return o.toString()
    }
}
