// Último Refugio para PC: servidor local mínimo + ventana de Edge/Chrome en modo aplicación.
// El juego (index.html) va incrustado en el .exe; las partidas se guardan en la carpeta del perfil (%LOCALAPPDATA%\UltimoRefugio).
package main

import (
	"bytes"
	"embed"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync/atomic"
	"time"
)

//go:embed index.html
var assets embed.FS

const port = 47615

var (
	lastPing int64 // unix seg del último latido de la página
	byeAt    int64 // unix seg en que la página dijo adiós (0 = no)
)

const hook = `<script>(function(){var p=function(){try{fetch('/__ping',{cache:'no-store'}).catch(function(){})}catch(e){}};p();setInterval(p,5000);addEventListener('pagehide',function(){try{navigator.sendBeacon('/__bye')}catch(e){}});})();</script>`

func now() int64 { return time.Now().Unix() }

func main() {
	url := fmt.Sprintf("http://127.0.0.1:%d/", port)
	html, err := assets.ReadFile("index.html")
	if err != nil {
		os.Exit(1)
	}
	html = bytes.Replace(html, []byte("</body>"), []byte(hook+"</body>"), 1)

	mux := http.NewServeMux()
	mux.HandleFunc("/__ping", func(w http.ResponseWriter, r *http.Request) {
		atomic.StoreInt64(&lastPing, now())
		atomic.StoreInt64(&byeAt, 0)
		w.WriteHeader(204)
	})
	mux.HandleFunc("/__bye", func(w http.ResponseWriter, r *http.Request) {
		atomic.StoreInt64(&byeAt, now())
		w.WriteHeader(204)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" && r.URL.Path != "/index.html" {
			http.NotFound(w, r)
			return
		}
		atomic.StoreInt64(&byeAt, 0)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.Write(html)
	})

	ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", port))
	if err != nil {
		// ya hay otra copia abierta: solo se abre otra ventana hacia ella
		openWindow(url)
		return
	}
	go http.Serve(ln, mux)
	atomic.StoreInt64(&lastPing, now())

	started := time.Now()
	done := make(chan struct{})
	if cmd := openWindow(url); cmd != nil {
		go func() {
			cmd.Wait()
			// con perfil propio, Edge/Chrome no termina hasta cerrar la ventana; si termina enseguida (se delegó en otra instancia), mandan los latidos
			if time.Since(started) > 8*time.Second {
				close(done)
			}
		}()
	}
	for {
		select {
		case <-done:
			return
		case <-time.After(1 * time.Second):
		}
		t := now()
		if b := atomic.LoadInt64(&byeAt); b != 0 && t-b >= 4 {
			return
		}
		if t-atomic.LoadInt64(&lastPing) > 600 { // 10 min sin señales de vida: se cierra solo
			return
		}
	}
}

func profileDir() string {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base, _ = os.UserCacheDir()
	}
	d := filepath.Join(base, "UltimoRefugio", "perfil")
	os.MkdirAll(d, 0o755)
	return d
}

func openWindow(url string) *exec.Cmd {
	if os.Getenv("UR_NOBROWSER") != "" {
		return nil
	}
	pf, pf86, la := os.Getenv("ProgramFiles"), os.Getenv("ProgramFiles(x86)"), os.Getenv("LOCALAPPDATA")
	cands := []string{
		filepath.Join(pf86, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pf, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pf, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(pf86, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(la, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(pf, `BraveSoftware\Brave-Browser\Application\brave.exe`),
	}
	for _, c := range cands {
		if strings.HasPrefix(c, `\`) || c == "" {
			continue
		}
		if _, err := os.Stat(c); err == nil {
			cmd := exec.Command(c,
				"--app="+url,
				"--user-data-dir="+profileDir(),
				"--window-size=1280,720",
				"--no-first-run", "--no-default-browser-check",
				"--autoplay-policy=no-user-gesture-required",
				"--disable-features=Translate")
			if cmd.Start() == nil {
				return cmd
			}
		}
	}
	// último recurso: el navegador predeterminado
	cmd := exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	cmd.Start()
	return nil
}
