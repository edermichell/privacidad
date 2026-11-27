# Último Refugio en Microsoft Store (PC) · guía paso a paso

El juego es una página web, así que en Microsoft Store va como **PWA**: la web se publica en GitHub Pages, **PWABuilder** la empaqueta (`.msixbundle`) y ese paquete se sube a Partner Center.

```
carpeta web/  →  repo público «ultimo-refugio» (GitHub Pages)  →  PWABuilder  →  .msixbundle  →  Partner Center
```

**Lo bueno:** las actualizaciones del juego llegan solas. Basta con cambiar los archivos del repo, sin volver a enviar el paquete a Microsoft. El paquete solo se vuelve a subir si cambian el icono, el nombre o el manifest.

---

## Qué hay en esta carpeta

| Carpeta / archivo | Para qué |
|---|---|
| `web/` | **La edición PC completa.** Esto es lo que va al repo nuevo: `index.html` (el juego 18.5), `manifest.webmanifest`, `sw.js` (funciona sin conexión), `icons/`, `capturas/` y `.nojekyll`. |
| `arte_store/` | Arte para la ficha: portada 1:1, póster 9:16 y «super hero art» 16:9. |
| `TEXTOS_FICHA_MICROSOFT.md` | Descripción, características, palabras clave, notas para certificación, etc. |
| `CAMBIOS_EDICION_PC.md` | Qué cambia respecto a Android (sin anuncios ni compras) y las pruebas realizadas. |

### Diferencias con Android (edición PC)
- **Sin anuncios.** Lo que en Android se gana viendo un anuncio (caja extra, revivir una vez por partida, recuperar aliento, duplicar caja) se da directamente. Se mantienen los mismos límites por día y tiempos de espera.
- **Sin compras.** La «Tienda» pasa a llamarse «Cajas» y no vende nada. Los trajes premium (solo estética) vienen incluidos. El Pack Fundador y «Buen anfitrión» no aparecen.
- **Teclado y ratón** (o mando), en pantalla completa. Se puede jugar sin conexión. El multijugador usa el mismo servidor que Android, así que los jugadores de PC y de Android pueden jugar juntos.

---

## Paso 1 · Reservar el nombre en Partner Center
1. Partner Center → **Aplicaciones y juegos** → **+ Nuevo producto** → **Juego MSIX o PWA** (en inglés: *MSIX or PWA game*).
2. Escribe el nombre: `Último Refugio`. Si ya está tomado, prueba `Último Refugio: Zombis` (el que usas en Google Play).
3. Una vez creado, abre **Administración de productos → Identidad del producto** y apunta estos tres valores. No son secretos y los necesitarás en el paso 3:
   - **Package/Identity/Name**, por ejemplo `12345ImpulsoCapital.UltimoRefugio`.
   - **Package/Identity/Publisher**, por ejemplo `CN=XXXXXXXX-XXXX-…`.
   - **Package/Properties/PublisherDisplayName**, tu nombre de editor.

## Paso 2 · Subir la web a GitHub Pages
1. En GitHub crea un repositorio **público** llamado **`ultimo-refugio`**, vacío (sin README).
2. Sube **el contenido** de la carpeta `web/`, no la carpeta en sí. Tienes dos opciones:
   - **Opción A (yo lo hago):** dime «ya creé el repo» y lo conecto a esta sesión y subo los archivos.
   - **Opción B (tú):** en el repo vacío, **Add file → Upload files**, arrastra todo lo que hay dentro de `web/` (incluidas las carpetas `icons` y `capturas`) y pulsa **Commit changes**. El archivo `.nojekyll` está oculto; si no se sube, no pasa nada.
3. Repo → **Settings → Pages** → *Source: Deploy from a branch* → **main** / **(root)** → **Save**.
4. En 1 o 2 minutos el juego queda en: **`https://edermichell.github.io/ultimo-refugio/`**. Ábrelo en Edge para comprobar que carga.

> Si al repo le pones otro nombre, avísame: el `manifest.webmanifest` usa `/ultimo-refugio/` como identificador.

## Paso 3 · Crear el paquete con PWABuilder
1. Entra en **https://www.pwabuilder.com**, pega la URL del paso 2 y pulsa **Start**.
2. PWABuilder revisa el manifest, el service worker y los iconos; ya están preparados. Pulsa **Package For Stores** → **Windows** → **Generate Package**.
3. En las opciones de Windows rellena:
   - **Package ID** = *Package/Identity/Name* del paso 1.
   - **Publisher ID** = *Package/Identity/Publisher*, el que empieza por `CN=`.
   - **Publisher display name** = *PublisherDisplayName*.
   - **App version**: `1.0.0` la primera vez. Cada vez que vuelvas a subir un paquete, debe ser mayor (1.0.1, 1.0.2…).
   - **Language**: `es-mx` (o `es`).
4. Descarga el ZIP. Dentro hay un `.msixbundle` (y un `.classic.appxbundle` para Windows antiguos) e instrucciones. **El `.msixbundle` es lo que se sube.**
5. *(Opcional)* Para probarlo antes en tu PC, el ZIP trae instrucciones para instalar el paquete de prueba (*test package*).

## Paso 4 · Rellenar el envío en Partner Center
En el producto → **Iniciar envío**:

1. **Precios y disponibilidad:** **Gratis**. Mercados: todos, o los que quieras. Visibilidad: pública (o privada para probar primero).
2. **Propiedades:**
   - Categoría **Juegos** → subcategoría **Acción y aventura** (o **Estrategia**).
   - **URL de la política de privacidad:** `https://edermichell.github.io/privacidad/`.
   - Opciones de juego: **multijugador en línea: sí (hasta 10)**; cooperativo en línea: sí; un jugador: sí.
   - Hardware: teclado y ratón (o mando). Pantalla mínima: 1366 × 768.
3. **Clasificación por edades:** rellena el cuestionario **IARC** con sinceridad:
   - **Violencia:** contra zombis y personas, con sangre, en pixel art.
   - **Interacción entre usuarios:** sí. Hay chat de texto y de **voz de proximidad** en las salas, y una sala PvP opcional.
   - **Compras:** no.
   - Ubicación compartida: no.

   Saldrá algo parecido a lo de Google Play (aprox. 16+ o PEGI 16).
4. **Paquetes:** sube el **`.msixbundle`** del paso 3 y, si quieres, también el `.classic.appxbundle`. Dispositivos: **Escritorio**.
5. **Fichas de Store (Español):** pega los textos de `TEXTOS_FICHA_MICROSOFT.md` y sube:
   - **Capturas de pantalla** (1920 × 1080): `web/capturas/pc_1.png` … `pc_5.png`.
   - **Logotipos de Store**:
     - **Arte de caja 1:1**: `arte_store/caja_1x1_2160x2160.png` (o la de 1080).
     - **Póster 9:16**: `arte_store/poster_9x16_1440x2160.png` (o la de 720 × 1080).
     - **Super hero art 16:9**: `arte_store/super_hero_16x9_3840x2160.png`. No lleva título a propósito, porque Microsoft lo pone encima.
6. **Opciones de envío → Notas para la certificación:** pega las notas de `TEXTOS_FICHA_MICROSOFT.md`.
7. **Enviar a la Store.** La certificación suele tardar de 1 a 3 días hábiles.

---

## Cómo se actualiza después
- **Juego nuevo (18.6, 18.7…):** se reemplazan los archivos del repo `ultimo-refugio` con la nueva carpeta `web/` y listo. Al abrir el juego, cada PC descarga la versión nueva; si no hay conexión, usa la última guardada.
- **Mantén el servidor al día:** los PC siempre tienen la última versión, igual que el servidor. Actualiza los dos juntos, como hasta ahora.
- **Reenviar el paquete a Microsoft** solo hace falta si cambian el icono, el nombre o el manifest. En ese caso, súbelo con la versión siguiente (1.0.1…).

## Avisos importantes
- **No fusiones la rama de trabajo en `main` del repo `privacidad`.** Ahí el `index.html` es la política de privacidad (la que usan Google Play y Microsoft), y la rama tiene el juego en ese mismo archivo: lo reemplazaría.
- **No subas a GitHub** la llave `.jks` ni contraseñas. La carpeta `web/` no contiene nada de eso.
- **Micrófono (chat de voz):** en la PWA, Windows o Edge piden permiso la primera vez que se usa. No lo he podido probar en un Windows real. Si al probar el paquete el chat de voz no pide permiso, dímelo.
