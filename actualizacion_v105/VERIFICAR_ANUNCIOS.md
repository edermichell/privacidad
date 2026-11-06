# Cómo comprobar que los anuncios de Unity son reales y funcionan

## Lo que trae la app (verificado en el código)
| Dato | Valor |
|---|---|
| Proveedor por defecto | **Unity Ads** (`ADS_PROVIDER` vacío o `unity`). `none` desactiva los anuncios. **AdMob eliminado en la v103** (sin SDK `play-services-ads`, sin IDs de prueba de Google). |
| SDK | `com.unity3d.ads:unity-ads:4.16.1` — la versión **existe en Maven Central** y el proyecto resuelve Maven Central (`google()` + `mavenCentral()`). La última publicada es 4.21.0. |
| Game ID | `800423692` (secreto `UNITY_GAME_ID`) |
| Bloques | Con recompensa: `BP_Rewarded_Android` · Intersticial: `BP_Interstitial_Android` (secretos `UNITY_REWARDED`, `UNITY_INTERSTITIAL`) |
| Modo de prueba | **Desactivado por defecto** (`UNITY_TEST_MODE=false`) → anuncios **REALES** que generan ingresos. Con `UNITY_TEST_MODE=true` salen anuncios de prueba. |
| Consentimiento | Formulario UMP; si el usuario acepta se le pasa a Unity (`gdpr.consent`). |
| Dónde se usan | **Con recompensa (siempre opcionales):** caja de suministros en la Tienda (máx. 3/día), **duplicar el contenido de una caja abierta** (máx. 3/día, v100), **recuperar 1 aliento** en la pausa, solo en modo Casual (máx. 2/día, v100) y **revivir** (1 por partida). Entre dos anuncios con recompensa pasa al menos 1 minuto. **Intersticial:** al pulsar «Otra partida» o «Menú» tras morir, a partir de la 2.ª partida terminada, máx. 1 cada 2,5 min, **y nunca** si acabas de ver un anuncio con recompensa (5 min) ni si la partida duró menos de 3 minutos (v100). «Sin anuncios» y «Pack Fundador» quitan el intersticial. |

## Lo que NO se puede comprobar desde fuera (hay que hacerlo con tu cuenta y un teléfono)
- Que el Game ID `800423692` y los dos bloques **pertenezcan a tu proyecto** de Unity y estén activos.
- Que Unity **sirva anuncios** (relleno). Un juego nuevo puede tardar horas o días en tener relleno real.
- Que el formulario de consentimiento de la UE aparezca (necesita un ID de app de AdMob real en `UMP_APP_ID` y un mensaje RGPD creado en AdMob; sin él, en EEE/Reino Unido/Suiza **no se iniciarán anuncios** hasta que lo configures; fuera de esas regiones no hace falta).

## Prueba paso a paso (10 minutos)
1. **Unity Dashboard** (cloud.unity.com → Monetization → Ads): abre tu proyecto Android y comprueba que su **Game ID** es el de arriba, que existen los bloques `BP_Rewarded_Android` (con recompensa) y `BP_Interstitial_Android` (intersticial) y que el proyecto está **activo/Live**. Si son otros, define los secretos `UNITY_GAME_ID`, `UNITY_REWARDED` y `UNITY_INTERSTITIAL` y vuelve a compilar.
2. **Compila con `UNITY_TEST_MODE=true`**, instala en un teléfono con internet y ejecuta `adb logcat | grep -i unity`. Debes ver que Unity **inicializa** y que el bloque **se carga**. En el juego: Tienda → «Ver anuncio» (caja) o muere → «Revivir · ver anuncio». Si aparece un anuncio de prueba y al terminarlo recibes la caja/revives, **la integración funciona**.
3. **Compila con `UNITY_TEST_MODE=false`** (el valor por defecto) para producción. En el Dashboard mira *Statistics*: deben subir *Requests* e *Impressions*. Si hay solicitudes pero 0 impresiones, falta relleno (normal al principio).
4. ⚠ **Nunca pulses tus propios anuncios reales** (Unity puede suspender la cuenta). Usa el modo de prueba o tu dispositivo registrado como de prueba.
5. **PRIVACY_URL**: el valor por defecto es `https://TU-DOMINIO/privacidad.html` (relleno). Publica `privacy.html` en tu dominio y define el secreto `PRIVACY_URL` antes de publicar en Google Play.
6. **Consentimiento UE**: define `UMP_APP_ID` (ID de app de AdMob, solo para el formulario) y crea un mensaje RGPD en AdMob (Privacidad y mensajes) si quieres anuncios en EEE/Reino Unido/Suiza.

## Qué mensajes ve el jugador
| Situación | Mensaje |
|---|---|
| Anuncio completo | «¡Recibiste 1 caja de suministros!» / revive |
| Lo cierra antes de tiempo | «Debes ver el anuncio completo para recibir la caja / revivir» |
| Sin relleno o sin red | «No hay anuncios disponibles ahora. Intenta de nuevo en un momento.» |
| Antes de 60 s o tras 3 anuncios | «Espera N s…» / «Hoy ya viste 3 anuncios» |
El intersticial **nunca castiga**: si no hay anuncio, la partida sigue.
