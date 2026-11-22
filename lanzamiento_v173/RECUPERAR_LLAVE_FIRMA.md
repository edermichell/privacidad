# Olvidé la contraseña de la llave (.jks) · qué hacer

**Tranquilo: no pierdes la app.** Tu app usa la **firma de apps de Google Play** (es obligatoria para las apps nuevas desde agosto de 2021). Google firma lo que llega a los teléfonos con **su** llave, que nunca se pierde. La tuya (el archivo `.jks`) es solo la **llave de subida**, y se puede cambiar por una nueva.

## Paso 1 · Intenta recuperar la contraseña (5 minutos)
1. **Android Studio puede recordarla.** Abre el proyecto → **Build ▸ Generate Signed Bundle / APK… ▸ Android App Bundle**. Si al hacerlo antes marcaste «Remember passwords», los campos aparecen ya rellenos: pulsa **Next** y compila.
2. Busca en tu gestor de contraseñas, en las notas del teléfono o en el correo palabras como «keystore», «jks», «upload» o «firma».
3. **Prueba las contraseñas que sueles usar** sin miedo (no se bloquea). En una terminal de tu PC (Android Studio trae `keytool` en `jbr\bin`):
   `keytool -list -keystore RUTA\a\tu-llave.jks`
   Te pide la contraseña: si es correcta, muestra el alias (por ejemplo `upload`); si no, dice «Keystore was tampered with, or password was incorrect». Muchas veces la contraseña de la llave (key password) es la misma que la del archivo.

## Paso 2 · Si no aparece: crea una llave de subida nueva y pide el cambio a Google
1. Comprueba que tu app usa la firma de Google Play: Play Console → tu app → **Prueba y publicación ▸ Configuración ▸ Integridad de la app → Firma de apps** (en algunas cuentas sale como **Versión ▸ Configuración ▸ Firma de apps**). Debe decir que **Google Play firma tu app**.
2. **Crea la llave nueva** en Android Studio: **Build ▸ Generate Signed Bundle / APK… ▸ Android App Bundle ▸ Next ▸ Create new…**
   - Guárdala en un sitio seguro con un nombre claro, por ejemplo `ultimo_refugio_subida_2026.jks`.
   - Alias: `upload`. Validez: **25 años o más**.
   - **Apunta la contraseña** en un gestor de contraseñas (y haz una copia del `.jks` en otro sitio: un USB o tu nube).
   - Cierra el asistente sin compilar todavía.
3. **Exporta el certificado público** (no contiene nada secreto) en una terminal:
   `keytool -export -rfc -keystore ultimo_refugio_subida_2026.jks -alias upload -file upload_certificate.pem`
4. **Pide el restablecimiento** en Play Console, en la misma página de **Firma de apps**: opción **«Solicitar restablecimiento de clave de subida»** (*Request upload key reset*). Elige el motivo («He perdido la contraseña») y sube `upload_certificate.pem`.
5. Google lo revisa y te avisa por correo cuando la llave nueva está activa. A partir de esa fecha, firma el AAB con la **llave nueva** (Build ▸ Generate Signed Bundle ▸ elige el `.jks` nuevo) y súbelo como siempre.

Mientras tanto, la app publicada sigue funcionando y los jugadores no notan nada: lo único que no puedes hacer es subir versiones nuevas hasta que Google active la llave.

## Si la contraseña que olvidaste era otra
- **Panel `/admin` del servidor:** es `claveAdmin` en el `config.json` de la carpeta del servidor de tu PC (ábrelo con el Bloc de notas). Si lo cambias, reinicia el servidor.
- **Cuenta de Google / Play Console o Unity:** se recuperan desde sus páginas de inicio de sesión («¿Olvidaste tu contraseña?»).
