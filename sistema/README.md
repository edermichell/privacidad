# Sistema de gestión — IMPULSO CAPITAL CIUDADANO S.A.S.

Programa para administrar la empresa desde el navegador: contabilidad, facturación y cobros, nómina, empleados, contratos, documentos, marketing, juegos, tareas y seguridad.
No necesita internet ni instalar librerías: todo se guarda en su propia computadora.

## Requisitos

- **Node.js 22.13 o superior** (descárguelo gratis en https://nodejs.org, versión "LTS").

## Cómo iniciarlo

| Sistema | Qué hacer |
|---|---|
| Windows | Doble clic en `iniciar-windows.bat` |
| Mac / Linux | En la terminal, dentro de esta carpeta: `./iniciar.sh` (o `npm start`) |

Luego abra **http://localhost:3000** en el navegador.

### Primera vez
1. La ventana negra del servidor muestra un **código de instalación** de 6 dígitos.
2. En el navegador escriba la razón social, el **número de empresa (NIT)**, una **contraseña** (mínimo 10 caracteres, letras y números) y el código.
3. Desde ese momento se ingresa siempre con **número de empresa + contraseña**.

> El código de instalación evita que otra persona de su red configure el sistema antes que usted.

## Módulos

| Módulo | Qué hace |
|---|---|
| **Panel principal** | Ingresos, gastos y utilidad del mes y del año, gráfico de 12 meses, cuentas por cobrar, alertas de vencimientos y cumpleaños. |
| **Contabilidad** | Libro de ingresos y gastos con cuentas del PUC adaptadas a un estudio de videojuegos (Ads, compras in-app, tiendas, hosting…). Estado de resultados mensual por año, IVA y retenciones por bimestre/cuatrimestre. Exportación a Excel (CSV). |
| **Facturación y cobros** | Cuentas de cobro numeradas automáticamente con IVA y retenciones; impresión/PDF. Al marcarlas como pagadas el ingreso pasa solo a Contabilidad. |
| **Clientes y proveedores** | Directorio de terceros (clientes, proveedores, publishers, plataformas). |
| **Empleados** | Hoja de vida laboral: datos, cargo, área, salario, EPS, pensión, ARL, cuenta bancaria. **Certificado laboral** listo para imprimir. |
| **Nómina** | Liquidación mensual según la ley colombiana: salud y pensión, fondo de solidaridad, auxilio de transporte, horas extra, recargos, comisiones, deducciones, aportes del empleador (ARL, caja, ICBF, SENA con exoneración art. 114-1 E.T.), provisiones (cesantías, intereses, prima, vacaciones). Desprendibles de pago, resumen y exportación. Al pagarla se registra en Contabilidad. |
| **Contratos** | Control de contratos con alertas de vencimiento y **borradores automáticos**: laboral, prestación de servicios, confidencialidad (NDA) y genéricos, con cláusulas de propiedad intelectual para videojuegos. |
| **Documentos** | Archivo digital (Cámara de Comercio, RUT, estatutos, contratos firmados, marcas…) con categorías, fechas de vencimiento y descarga. Máx. 15 MB por archivo. |
| **Juegos y proyectos** | Portafolio (Último Refugio ya viene registrado): estado, versión, descargas, usuarios activos, calificación. |
| **Marketing** | Campañas con presupuesto, gasto, CTR, CPI y ROAS; calendario de contenido para redes sociales. |
| **Tareas y obligaciones** | Pendientes con fecha límite (DIAN, PILA, Cámara de Comercio…), responsables y prioridad. |
| **Configuración** | Datos de la empresa, parámetros de nómina del año (SMMLV, auxilio de transporte…), respaldo. |
| **Usuarios y permisos** | Un usuario por empleado, con rol y permisos por módulo. |
| **Mi cuenta y seguridad** | Cambio de contraseña, sesiones abiertas y bitácora de accesos y cambios (con el usuario que los hizo). |

## Usuarios y permisos

- **Administrador principal:** entra con el número de empresa y la contraseña maestra, dejando vacío el campo «Usuario» (o escribiendo `admin`).
- **Cada empleado** entra con **número de empresa + su usuario + su contraseña**. Se crean en *Sistema → Usuarios y permisos* o desde *Empleados* con el botón «👤 Usuario».
- Al crear o restablecer un usuario, el sistema genera una **contraseña temporal**; la persona debe cambiarla la primera vez que entra.
- Roles listos: **Administrador**, **Contador**, **Recursos humanos**, **Marketing**, **Desarrollo**, **Consulta** y **Personalizado** (eligiendo módulo por módulo *Sin acceso / Ver / Editar*).
- Lo que un usuario no tiene permitido no aparece en su menú, y el servidor lo rechaza aunque intente entrar directo.
- Desactivar un usuario cierra sus sesiones de inmediato. La bitácora registra **quién** hizo cada cosa.
- Solo los administradores gestionan usuarios, ven la bitácora completa y descargan respaldos; solo el principal puede cambiar el número de empresa.

## Seguridad incluida

- Contraseña guardada con **scrypt + sal aleatoria** (no se puede leer ni recuperar).
- **Bloqueo de 15 minutos** tras 5 intentos fallidos (por equipo y por usuario).
- Cierre de sesión automático por inactividad (30 min por defecto) y máximo 12 h por sesión.
- Cookies `HttpOnly` + `SameSite=Strict`, protección CSRF y política de seguridad de contenido (CSP) contra XSS.
- **Bitácora** de inicios de sesión, intentos fallidos y cada creación, edición o eliminación.
- El servidor solo escucha en **esta computadora** (`127.0.0.1`) por defecto.

### ¿Olvidó la contraseña?
En la computadora donde está instalado, con el servidor apagado:
```
npm run restablecer-clave
```

### Usarlo desde otros equipos de la oficina (opcional)
```
HOST=0.0.0.0 npm start          (Mac/Linux)
set HOST=0.0.0.0 && npm start   (Windows)
```
Para acceso por internet, publíquelo **solo detrás de HTTPS** (por ejemplo Tailscale o un proxy con certificado) y agregue `COOKIE_SECURE=1`.

## Respaldo

Toda la información está en la carpeta `data/` (base de datos `empresa.db` y carpeta `archivos/`).
**Copie esa carpeta con regularidad** a un disco externo o nube privada. También puede descargar un respaldo JSON en Configuración → Respaldo.
La carpeta `data/` está excluida de git para que sus datos nunca se publiquen en GitHub.

## Importante

- Nómina e impuestos son herramientas de apoyo: **valide con su contador** antes de pagar la PILA o declarar. Actualice cada enero el SMMLV y el auxilio de transporte en Configuración.
- Las cuentas de cobro no sustituyen la **factura electrónica** de la DIAN cuando sea obligatoria.
- Los borradores de contratos deben ser revisados por un abogado antes de firmarse.

## Para desarrolladores

- `server.js`: servidor HTTP y API (sin dependencias, usa `node:sqlite`).
- `schema.js`: definición de módulos; agregar un campo aquí lo agrega a la base de datos y a los formularios.
- `nomina.js`: cálculo de nómina.
- `public/`: interfaz (HTML, CSS y JS sin frameworks).
- Pruebas: `npm test`.
