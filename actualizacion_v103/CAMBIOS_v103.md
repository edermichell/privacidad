# v103 (9.7, versionCode 89) — AdMob eliminado, Unity Ads como único proveedor

## Qué se quitó
- **SDK de AdMob** (`com.google.android.gms:play-services-ads`) y todo su código en `MainActivity.java`
  (carga/mostrado de recompensado e intersticial de Google, `MobileAds`, `AdRequest`…).
- **IDs de prueba de Google** para recompensado e intersticial (`admob_rewarded`, `admob_interstitial`) y el proveedor `ADS_PROVIDER=admob`.
- Secretos `ADMOB_REWARDED` y `ADMOB_INTERSTITIAL`. `ADS_PROVIDER` ahora solo admite `unity` (por defecto) o `none`.
- Menciones a AdMob en `privacy.html`, guías y comentarios.

## Unity Ads, principal y único
- Anuncios **reales** por defecto (`UNITY_TEST_MODE=false`), Game ID `800423692`, bloques `BP_Rewarded_Android` / `BP_Interstitial_Android`.
- Mismo flujo de consentimiento y los mismos límites y reglas de anuncios del juego (sin cambios en `index.html`, salvo un comentario).
- Se añadió `play-services-ads-identifier:18.1.0` para que Unity siga recibiendo el ID de publicidad (antes llegaba de forma indirecta por AdMob).

## Qué se conserva a propósito
- **UMP** (formulario de consentimiento RGPD de Google): sigue haciendo falta en EEE/Reino Unido/Suiza para poder mostrar los anuncios de Unity.
  UMP exige un ID de app de AdMob en el manifest, pero **ya no se piden anuncios a Google**. El ID es el secreto `UMP_APP_ID`
  (acepta también `ADMOB_APP_ID`). Si no lo defines queda un marcador de posición: fuera de EEE/Reino Unido/Suiza todo funciona igual;
  dentro, sin formulario no se inician anuncios.

## Verificación
- Pruebas del juego con el puente nativo simulado: anuncios (v97, v100), maquetación, recarga, v94 y migración de partidas: 0 fallos.
- **Java/Gradle NO compilados** (no hay SDK de Android aquí): solo se comprobó que no hay errores de sintaxis. Compila con tu flujo de siempre
  y prueba en un móvil (ver `VERIFICAR_ANUNCIOS.md`). No pude comprobar que Unity sirva anuncios con tu Game ID.
