# Arreglar el aviso de app-ads.txt en Unity (badUrlForm)

**Qué significa el error.** Unity toma el **sitio web del desarrollador** de tu ficha de Google Play y busca el archivo en la **raíz** de ese dominio: `https://<dominio>/app-ads.txt`. `badUrlForm` quiere decir que no pudo formar una URL válida: el sitio web está vacío, mal escrito (sin `https://`) o el archivo no está en la raíz. Por eso Unity muestra «URL de anuncios de aplicaciones: –».

El archivo ya está listo: **`app-ads.txt`** (esta carpeta). Contiene los 163 vendedores de la lista de Unity, sin duplicados, con tu línea `unity.com, 161245500, DIRECT` primero y en inglés (`RESELLER` / `DIRECT`). La palabra que muestra el panel, «REVENDEDOR», es solo una traducción y no vale dentro del archivo.

## Pasos
1. **Crea en GitHub un repo público llamado exactamente `edermichell.github.io`.** Es tu «sitio de usuario»: lo que contiene se sirve en la raíz `https://edermichell.github.io/`. Tus otras páginas (`/privacidad/` y `/ultimo-refugio/`) siguen funcionando igual.
2. Sube **`app-ads.txt`** a la raíz de ese repo, o dime que ya lo creaste y lo subo yo. En **Settings → Pages**, comprueba que publica desde **main / (root)**.
3. Comprueba en el navegador que **https://edermichell.github.io/app-ads.txt** muestra el texto.
4. **Google Play Console** → tu app → **Presencia en Google Play → Configuración de la ficha de Play Store (Detalles de la tienda) → Información de contacto → Sitio web**. Escribe exactamente `https://edermichell.github.io/` y guarda.
5. En **Unity → Monetización → Configuraciones → App-ads.txt**, espera a que vuelva a comprobarlo (puede tardar de 24 h a unos días) o usa «volver a comprobar» si aparece.

## Cuando Unity añada vendedores nuevos
Copia la lista completa del panel (botón «Copiar»), pásamela y regenero `app-ads.txt`. Luego se reemplaza en el repo `edermichell.github.io`.

La edición PC (Microsoft Store) no tiene anuncios: allí no hace falta.
