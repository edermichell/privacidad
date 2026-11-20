import Foundation
import Network
import UIKit
import CoreLocation
import DJISDK

/// Puente entre la interfaz web (dji-mini2-control.html) y el Mini 2 para iOS.
///
///  - WebSocket en 127.0.0.1:8765 (solo accesible desde el propio dispositivo)
///  - Protocolo JSON de la pestaña "Conexión" + fotogramas JPEG binarios
///
/// IMPORTANTE: escrito contra DJI Mobile SDK V4 para iOS (4.16.x) SIN poder compilarlo ni probarlo con un
/// dron real. Es normal que haya que ajustar algún nombre/tipo del SDK al compilar. Prueba sin hélices.
final class Bridge: NSObject, DJIFlightControllerDelegate, DJIBatteryDelegate, DJICameraDelegate, DJIGimbalDelegate, DJIVideoFeedListener {

    static let port = NWEndpoint.Port(rawValue: 8765)!
    var status: (String) -> Void = { _ in }

    private struct Lim { let vh: Float, up: Float, down: Float, yaw: Float }

    private let q = DispatchQueue(label: "mini2.bridge")
    private var listener: NWListener?
    private var clients: [ObjectIdentifier: NWConnection] = [:]
    private var timer: DispatchSourceTimer?

    // Estado (se escribe siempre en `q`)
    private var fcs: DJIFlightControllerState?
    private var bat = 0, temp = 0, recT = 0, photos = 0
    private var volt = 0.0
    private var gimPitch: Float = 0
    private var rec = false
    private var mode = "N"
    private var firstLat = Double.nan, firstLon = Double.nan

    // Virtual stick
    private var vsEnabled = false
    private var lastSticks = 0.0, lastActive = 0.0, lastGimSent = 0.0
    private var gimTarget: Float = 0

    // Vídeo
    private var feedStarted = false
    private var snapshotBusy = false
    private let previewView = UIView(frame: CGRect(x: 0, y: 0, width: 640, height: 360))
    private var snapTimer: Timer?

    private var aircraft: DJIAircraft? { DJISDKManager.product() as? DJIAircraft }

    // MARK: - Servidor WebSocket
    func start() {
        let params = NWParameters.tcp
        let ws = NWProtocolWebSocket.Options()
        ws.autoReplyPing = true
        params.defaultProtocolStack.applicationProtocols.insert(ws, at: 0)
        params.requiredInterfaceType = .loopback          // solo desde este dispositivo
        do { listener = try NWListener(using: params, on: Bridge.port) }
        catch { status("No se pudo abrir el puerto 8765: \(error.localizedDescription)"); return }
        listener?.newConnectionHandler = { [weak self] c in self?.accept(c) }
        listener?.start(queue: q)

        let t = DispatchSource.makeTimerSource(queue: q)
        t.schedule(deadline: .now() + 0.1, repeating: 0.1)
        t.setEventHandler { [weak self] in self?.tick() }
        t.resume()
        timer = t
        status("Puente listo (WebSocket 127.0.0.1:8765)")
    }

    private func accept(_ c: NWConnection) {
        let id = ObjectIdentifier(c)
        clients[id] = c
        c.stateUpdateHandler = { [weak self] st in
            switch st {
            case .failed, .cancelled: self?.q.async { self?.drop(id) }
            default: break
            }
        }
        c.start(queue: q)
        receive(c, id)
        status("Interfaz conectada")
    }

    private func drop(_ id: ObjectIdentifier) {
        clients[id]?.cancel()
        clients[id] = nil
        if clients.isEmpty { disableVirtualStick(); status("Interfaz desconectada: el mando RC recupera el control") }
    }

    private func receive(_ c: NWConnection, _ id: ObjectIdentifier) {
        c.receiveMessage { [weak self] data, ctx, _, error in
            guard let self = self else { return }
            if let data = data,
               let meta = ctx?.protocolMetadata(definition: NWProtocolWebSocket.definition) as? NWProtocolWebSocket.Metadata,
               meta.opcode == .text {
                self.handle(c, data)
            }
            if error == nil { self.receive(c, id) } else { self.drop(id) }
        }
    }

    private func send(_ c: NWConnection, data: Data, opcode: NWProtocolWebSocket.Opcode) {
        let meta = NWProtocolWebSocket.Metadata(opcode: opcode)
        let ctx = NWConnection.ContentContext(identifier: "ws", metadata: [meta])
        c.send(content: data, contentContext: ctx, isComplete: true, completion: .contentProcessed { _ in })
    }

    private func sendJSON(_ c: NWConnection, _ o: [String: Any]) {
        guard JSONSerialization.isValidJSONObject(o), let d = try? JSONSerialization.data(withJSONObject: o) else { return }
        send(c, data: d, opcode: .text)
    }

    private func broadcast(data: Data, opcode: NWProtocolWebSocket.Opcode) {
        for c in clients.values { send(c, data: data, opcode: opcode) }
    }

    // MARK: - Enlace con el SDK
    /// Idempotente (se llama en cada cambio de producto/componente). Debe llamarse en el hilo principal.
    func attach() {
        guard let ac = aircraft else { return }
        ac.flightController?.delegate = self
        ac.battery?.delegate = self
        ac.gimbal?.delegate = self
        ac.camera?.delegate = self
        startVideo()
        status("Dron conectado: \(ac.model ?? "")")
    }

    func detach() {
        stopVideo()
        q.async { self.fcs = nil; self.vsEnabled = false }
        status("Dron desconectado")
    }

    // MARK: - Delegados del SDK
    func flightController(_ fc: DJIFlightController, didUpdate state: DJIFlightControllerState) { q.async { self.fcs = state } }
    func battery(_ battery: DJIBattery, didUpdate state: DJIBatteryState) {
        q.async { self.bat = state.chargeRemainingInPercent; self.volt = Double(state.voltage) / 1000.0; self.temp = Int(state.temperature) }
    }
    func gimbal(_ gimbal: DJIGimbal, didUpdate state: DJIGimbalState) { q.async { self.gimPitch = state.attitudeInDegrees.pitch } }
    func camera(_ camera: DJICamera, didUpdate systemState: DJICameraSystemState) {
        q.async { self.rec = systemState.isRecording; self.recT = Int(systemState.currentVideoRecordingTimeInSeconds) }
    }

    // MARK: - Mensajes de la interfaz
    private func handle(_ c: NWConnection, _ data: Data) {
        guard let j = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return }
        switch j["t"] as? String {
        case "ping": sendJSON(c, ["t": "pong", "ts": j["ts"] ?? 0])
        case "sticks": onSticks(j)
        case "cmd":
            let id = (j["id"] as? NSNumber)?.intValue ?? 0
            let name = j["name"] as? String ?? ""
            let args = j["args"] as? [String: Any] ?? [:]
            DispatchQueue.main.async { self.onCommand(c, id, name, args) }
        default: break
        }
    }

    private func lim() -> Lim {
        switch mode {
        case "C": return Lim(vh: 6, up: 2, down: 1.5, yaw: 60)
        case "S": return Lim(vh: 15, up: 4, down: 3.5, yaw: 100)   // el SDK limita a ±15 m/s y ±100 °/s
        default: return Lim(vh: 10, up: 3, down: 3, yaw: 100)
        }
    }

    private func onSticks(_ j: [String: Any]) {
        func f(_ k: String) -> Float { Float((j[k] as? NSNumber)?.doubleValue ?? 0) }
        if let m = j["mode"] as? String { mode = m }
        let pitch = f("pitch"), roll = f("roll"), yaw = f("yaw"), thr = f("throttle"), gim = f("gimbal")
        let now = CACurrentMediaTime()
        lastSticks = now
        let active = [pitch, roll, yaw, thr].contains { abs($0) > 0.02 }
        if active { lastActive = now; enableVirtualStick() }
        if vsEnabled { sendStick(pitch, roll, yaw, thr) }
        if abs(gim) > 0.05 {
            gimTarget = min(20, max(-90, gimTarget + gim * 35 * 0.04))
            if now - lastGimSent > 0.1 { rotateGimbal(gimTarget); lastGimSent = now }
        } else { gimTarget = gimPitch }
    }

    private func sendStick(_ pitch: Float, _ roll: Float, _ yaw: Float, _ thr: Float) {
        let l = lim()
        let vertical = thr > 0 ? thr * l.up : thr * l.down
        // BODY + VELOCITY: pitch = adelante/atrás (m/s), roll = derecha/izquierda (m/s)
        let d = DJIVirtualStickFlightControlData(pitch: pitch * l.vh, roll: roll * l.vh, yaw: yaw * l.yaw, verticalThrottle: vertical)
        DispatchQueue.main.async { self.aircraft?.flightController?.send(d, withCompletion: nil) }
    }

    private func enableVirtualStick() {
        if vsEnabled { return }
        DispatchQueue.main.async {
            guard let fc = self.aircraft?.flightController else { return }
            fc.rollPitchControlMode = .velocity
            fc.yawControlMode = .angularVelocity
            fc.verticalControlMode = .velocity
            fc.rollPitchCoordinateSystem = .body
            fc.setVirtualStickModeEnabled(true) { error in
                self.q.async { self.vsEnabled = (error == nil) }
                self.status(error == nil ? "Control virtual ACTIVO (los sticks del RC dejan de pilotar)"
                                         : "Virtual stick: \(error!.localizedDescription)")
            }
        }
    }

    private func disableVirtualStick() {
        if !vsEnabled { return }
        vsEnabled = false
        DispatchQueue.main.async {
            let fc = self.aircraft?.flightController
            fc?.send(DJIVirtualStickFlightControlData(pitch: 0, roll: 0, yaw: 0, verticalThrottle: 0), withCompletion: nil)
            fc?.setVirtualStickModeEnabled(false, withCompletion: nil)
        }
        status("Control virtual desactivado: vuelve el mando RC")
    }

    private func rotateGimbal(_ angle: Float) {
        DispatchQueue.main.async {
            let r = DJIGimbalRotation(pitchValue: NSNumber(value: angle), rollValue: nil, yawValue: nil, time: 0.4, mode: .absoluteAngle)
            self.aircraft?.gimbal?.rotate(with: r, completion: nil)
        }
    }

    // MARK: - Comandos (se ejecutan en el hilo principal)
    private func ack(_ c: NWConnection, _ id: Int, _ e: Error?) {
        q.async { self.sendJSON(c, ["t": "ack", "id": id, "ok": e == nil, "msg": e?.localizedDescription ?? ""]) }
    }
    private func fail(_ c: NWConnection, _ id: Int, _ msg: String) {
        q.async { self.sendJSON(c, ["t": "ack", "id": id, "ok": false, "msg": msg]) }
    }

    private func onCommand(_ c: NWConnection, _ id: Int, _ name: String, _ a: [String: Any]) {
        guard let ac = aircraft else { return fail(c, id, "Dron no conectado") }
        let fc = ac.flightController, cam = ac.camera
        let done: DJICompletionBlock = { [weak self] e in self?.ack(c, id, e) }
        func num(_ k: String) -> Double { (a[k] as? NSNumber)?.doubleValue ?? 0 }

        switch name {
        case "takeoff": fc?.startTakeoff(completion: done)
        case "land": fc?.startLanding(completion: done)
        case "cancel_land": fc?.cancelLanding(completion: done)
        case "confirm_landing": fc?.confirmLanding(completion: done)
        case "rth": fc?.startGoHome(completion: done)
        case "cancel_rth": fc?.cancelGoHome(completion: done)
        case "emergency": fc?.turnOffMotors(completion: done)
        case "brake": sendStick(0, 0, 0, 0); ack(c, id, nil)
        case "set_mode": q.async { self.mode = a["mode"] as? String ?? "N" }; ack(c, id, nil)
        case "set_home": fc?.setHomeLocationUsingAircraftCurrentLocation(completion: done)
        case "calibrate":
            if (a["what"] as? String) == "compass" { fc?.compass?.startCalibration(completion: done) }
            else { fail(c, id, "Solo se implementa la calibración de brújula (hazla desde DJI Fly)") }

        case "gimbal_angle": rotateGimbal(Float(min(20, max(-90, num("angle"))))); ack(c, id, nil)
        case "gimbal_center": rotateGimbal(0); ack(c, id, nil)

        case "photo":
            guard let cam = cam else { return fail(c, id, "Sin cámara") }
            cam.setMode(.shootPhoto) { e in
                if let e = e { done(e) } else {
                    cam.startShootPhoto { e2 in if e2 == nil { self.q.async { self.photos += 1 } }; done(e2) }
                }
            }
        case "record_start":
            guard let cam = cam else { return fail(c, id, "Sin cámara") }
            cam.setMode(.recordVideo) { e in if let e = e { done(e) } else { cam.startRecordVideo(completion: done) } }
        case "record_stop": cam?.stopRecordVideo(completion: done)

        case "camera_set":
            if let m = a["mode"] as? String { cam?.setMode(m == "video" ? .recordVideo : .shootPhoto, withCompletion: done) }
            // TODO: ISO, obturador, EV, balance de blancos, resolución/fps, formato, zoom digital
            else { fail(c, id, "Ajuste de cámara no implementado en el puente base: \(Array(a.keys))") }

        case "settings_set":
            let v = a["value"]
            switch a["key"] as? String {
            case "rthAlt": fc?.setGoHomeHeightInMeters(UInt(num("value")), withCompletion: done)
            case "maxAlt": fc?.setMaxFlightHeight(UInt(num("value")), withCompletion: done)
            case "maxDist":
                fc?.setMaxFlightRadiusLimitationEnabled(true, withCompletion: nil)
                fc?.setMaxFlightRadius(UInt(num("value")), withCompletion: done)
            case "failsafe":
                let b: DJIConnectionFailSafeBehavior = (v as? String) == "land" ? .landing : (v as? String) == "hover" ? .hover : .goHome
                fc?.setConnectionFailSafeBehavior(b, withCompletion: done)
            case "vision": fc?.flightAssistant?.setVisionAssistedPositioningEnabled((v as? Bool) ?? true, withCompletion: done)
            default: ack(c, id, nil)    // ajustes solo de la interfaz (avisos de batería, etc.)
            }

        case "quickshot", "hyperlapse", "panorama", "shot_stop",
             "mission_upload", "mission_start", "mission_pause", "mission_resume", "mission_stop", "zoom_set":
            fail(c, id, "No implementado en el puente base: \(name)")
        default: fail(c, id, "Comando desconocido: \(name)")
        }
    }

    // MARK: - Bucle 10 Hz (cola q): vigilancia + telemetría
    private func tick() {
        let now = CACurrentMediaTime()
        if vsEnabled {
            if now - lastSticks > 0.5 { sendStick(0, 0, 0, 0) }
            if now - lastActive > 2 || now - lastSticks > 2 { disableVirtualStick() }
        }
        if !clients.isEmpty { broadcast(data: telemetry(), opcode: .text) }
    }

    private func telemetry() -> Data {
        var o: [String: Any] = ["t": "telemetry", "mode": mode, "bat": bat, "volt": volt, "temp": temp,
                                "gim": Double(gimPitch), "rec": rec, "recT": recT, "photos": photos]
        func finish() -> Data { (JSONSerialization.isValidJSONObject(o) ? try? JSONSerialization.data(withJSONObject: o) : nil) ?? Data("{}".utf8) }
        guard let s = fcs else { o["state"] = "ground"; o["motors"] = false; o["sats"] = 0; return finish() }

        if let loc = s.aircraftLocation, CLLocationCoordinate2DIsValid(loc.coordinate),
           loc.coordinate.latitude != 0 || loc.coordinate.longitude != 0 {
            let lat = loc.coordinate.latitude, lon = loc.coordinate.longitude
            if firstLat.isNaN { firstLat = lat; firstLon = lon }
            let hl = s.isHomeLocationSet ? s.homeLocation.latitude : firstLat
            let ho = s.isHomeLocationSet ? s.homeLocation.longitude : firstLon
            o["lat"] = lat; o["lon"] = lon; o["homeLat"] = hl; o["homeLon"] = ho
            o["x"] = (lon - ho) * 111_320.0 * cos(hl * .pi / 180)
            o["y"] = (lat - hl) * 111_320.0
            o["alt"] = loc.altitude                        // relativa al despegue en el SDK V4
        }
        let state: String
        if !s.isFlying && !s.areMotorsOn { state = "ground" }
        else if s.flightMode == .goHome { state = "rth" }
        else if s.flightMode == .autoLanding { state = "landing" }
        else if s.flightMode == .autoTakeoff { state = "takeoff" }
        else { state = "flying" }
        // Velocidades NED (m/s): X norte, Y este, Z abajo
        o["state"] = state
        o["motors"] = s.areMotorsOn
        o["hs"] = Double(hypot(s.velocityX, s.velocityY))
        o["vz"] = Double(-s.velocityZ)
        o["yaw"] = (s.attitude.yaw + 360).truncatingRemainder(dividingBy: 360)
        o["pitch"] = s.attitude.pitch; o["roll"] = s.attitude.roll
        o["sats"] = Int(s.satelliteCount)
        o["ft"] = Int(s.flightTimeInSeconds)
        if s.isLandingConfirmationNeeded { o["msg"] = "Confirma el aterrizaje" }
        // TODO: señal del mando/vídeo (rc, vid) vía DJIAirLink
        return finish()
    }

    // MARK: - Vídeo (H.264 -> DJIVideoPreviewer -> snapshot JPEG)
    private func startVideo() {
        if feedStarted { return }
        guard let feed = DJIVideoFeeder.sharedInstance()?.primaryVideoFeed else { return }
        // Si no aparece imagen, copia del ejemplo FPVDemo de DJI la llamada
        // DJIVideoPreviewer.instance()?.setDecoderWithProduct(...) adecuada a tu versión.
        DJIVideoPreviewer.instance()?.setView(previewView)
        DJIVideoPreviewer.instance()?.start()
        feed.add(self, with: nil)
        feedStarted = true
        snapTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in self?.grabFrame() }   // ~10 fps
    }

    private func stopVideo() {
        snapTimer?.invalidate(); snapTimer = nil
        DJIVideoFeeder.sharedInstance()?.primaryVideoFeed.remove(self)
        DJIVideoPreviewer.instance()?.unSetView()
        DJIVideoPreviewer.instance()?.close()
        feedStarted = false
    }

    func videoFeed(_ videoFeed: DJIVideoFeed, didUpdateVideoData videoData: Data) {
        videoData.withUnsafeBytes { (raw: UnsafeRawBufferPointer) in
            guard let base = raw.bindMemory(to: UInt8.self).baseAddress else { return }
            DJIVideoPreviewer.instance()?.push(UnsafeMutablePointer(mutating: base), length: Int32(videoData.count))
        }
    }

    private func grabFrame() {
        if snapshotBusy { return }
        let anyone = q.sync { !clients.isEmpty }
        if !anyone { return }
        snapshotBusy = true
        DJIVideoPreviewer.instance()?.snapshotPreview { [weak self] image in
            guard let self = self else { return }
            defer { self.snapshotBusy = false }
            guard let jpeg = image?.jpegData(compressionQuality: 0.5) else { return }
            self.q.async { self.broadcast(data: jpeg, opcode: .binary) }
        }
    }
}
