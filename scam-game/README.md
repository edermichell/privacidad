# 📞 Scam Call — Estafa con tus amigos (de mentiritas)

Juego de fiesta en el navegador: llamas **por voz** a una víctima con **IA** e intentas
"estafarla" (todo es ficción y el dinero es falso). Ves a la víctima y a ti en pantalla,
con **barras de confianza y sospecha** en vivo, y al final aprendes qué banderas rojas usaste
para reconocer estafas reales.

## Cómo se juega
1. Agrega de 1 a 6 jugadores (se pasan el teléfono por turnos).
2. Elige **víctima** (más difícil = más puntos) y **pretexto** (soporte técnico, banco, premio…).
3. Habla con el micrófono (o escribe). La víctima responde con voz, gestos y emociones.
4. Sube su **confianza** sin disparar su **sospecha**. Pide el pago en el momento justo.
5. Ganas si acepta pagar; pierdes si cuelga, llama a la policía o se acaba el tiempo.
6. Ranking final y debriefing educativo de cada llamada.

Detalles: la víctima **recuerda sus dudas** ("¿cómo sé que es cierto?") y juzga tu respuesta, responde preguntas personales, sufre **eventos sorpresa** (la vecina, la hija, el gato…) y te da **consejos en vivo**; hay frases rápidas, nivel de micrófono, puntos flotantes y estrellas. Expresiones y labios animados, tu avatar (o tu cámara), pistas (−50 pts), guion
sugerido, "debilidades" de cada víctima, 6 víctimas y 6 pretextos.

## Ejecutar
```bash
cd scam-game
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start     # http://localhost:3000
```
- **Con API key**: la víctima la interpreta Claude (conversación libre). El modelo se elige
  en el menú (por defecto `claude-opus-5-5`, con esfuerzo bajo para respuesta rápida; Haiku 5.5
  es la opción más veloz). La clave solo vive en el servidor. Si la IA falla, el turno pasa
  automáticamente al cerebro offline.
- **Sin API key**: funciona igual con un cerebro offline por reglas (menos fino, pero jugable).
- Variables: `PORT`, `SCAM_MODEL`.
- Usa **Chrome o Edge** para reconocimiento de voz; en otros navegadores puedes escribir.

## Privacidad
El audio no sale de tu navegador: la voz se transcribe localmente por el navegador
(el motor depende de este; en Chrome lo procesa Google) y solo el **texto** de lo que dices se
envía a tu servidor y a la API de Claude para generar la respuesta. La cámara es opcional y
nunca se transmite.

## Estructura
- `server.mjs` — servidor estático + `/api/turn` (proxy a Claude) y `/api/status`.
- `public/data.js` — víctimas, pretextos y lecciones (compartido con el servidor).
- `public/brain.js` — cliente de IA + cerebro offline.
- `public/avatar.js`, `voice.js`, `game.js`, `index.html`, `styles.css`.

> Juego de ficción con fines de entretenimiento y concienciación. No uses estas técnicas con
> personas reales.
