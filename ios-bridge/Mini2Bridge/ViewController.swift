import UIKit
import WebKit
import DJISDK

/// Muestra la interfaz web dentro de un WKWebView y registra el SDK de DJI.
final class ViewController: UIViewController, DJISDKManagerDelegate {
    private var web: WKWebView!
    private let label = UILabel()
    private let bridge = Bridge()

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        UIApplication.shared.isIdleTimerDisabled = true      // no apagar la pantalla

        // La interfaz detecta el modo puente con esta marca (no hay servidor HTTP en iOS)
        let cfg = WKWebViewConfiguration()
        cfg.allowsInlineMediaPlayback = true
        cfg.userContentController.addUserScript(WKUserScript(
            source: "window.__BRIDGE__ = true;", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        web = WKWebView(frame: view.bounds, configuration: cfg)
        web.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
        web.isOpaque = false
        view.addSubview(web)

        label.font = .systemFont(ofSize: 11)
        label.textColor = .white
        label.backgroundColor = UIColor.black.withAlphaComponent(0.6)
        label.frame = CGRect(x: 0, y: view.bounds.height - 20, width: view.bounds.width, height: 20)
        label.autoresizingMask = [.flexibleWidth, .flexibleTopMargin]
        view.addSubview(label)

        bridge.status = { [weak self] msg in DispatchQueue.main.async { self?.label.text = "  " + msg } }
        bridge.start()

        if let url = Bundle.main.url(forResource: "index", withExtension: "html"),
           let html = try? String(contentsOf: url, encoding: .utf8) {
            // baseURL http://127.0.0.1 => origen http (localStorage, ws:// permitido por ATS local)
            web.loadHTMLString(html, baseURL: URL(string: "http://127.0.0.1:8080/?bridge=1"))
        } else {
            label.text = "  Falta index.html en el bundle"
        }

        label.text = "  Registrando SDK de DJI (necesita Internet la primera vez)…"
        DJISDKManager.registerApp(with: self)
    }

    // MARK: DJISDKManagerDelegate
    func appRegisteredWithError(_ error: Error?) {
        DispatchQueue.main.async {
            if let error = error {
                self.label.text = "  Error de registro: \(error.localizedDescription) (¿App Key y bundle id correctos?)"
            } else {
                self.label.text = "  SDK registrado. Conecta el RC-N1 al iPhone y enciende el dron."
                DJISDKManager.startConnectionToProduct()
            }
        }
    }
    func productConnected(_ product: DJIBaseProduct?) { DispatchQueue.main.async { self.bridge.attach() } }
    func productDisconnected() { DispatchQueue.main.async { self.bridge.detach() } }
    func componentConnected(withKey key: String?, andIndex index: Int) { DispatchQueue.main.async { self.bridge.attach() } }
    func didUpdateDatabaseDownloadProgress(_ progress: Progress) {}
}
