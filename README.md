# VozSenias

Aplicacion web movil para probar camara, deteccion de gestos y voz en vivo.

## Que hace ahora

- Abre la camara frontal del celular.
- Usa MediaPipe para detectar manos y cuerpo desde la camara.
- Convierte esos gestos en frases en espanol con `speechSynthesis`.
- Incluye frases basicas: Hola, Adios, Necesito ayuda, Estoy perdido, Donde queda, Donde es, Ayuda, No entiendo, Si, No, Estoy bien, Gracias y la letra C.
- Usa el microfono para transcribir en pantalla lo que dice otra persona.
- Permite tocar frases rapidas para probar el altavoz.
- Se puede instalar como PWA si se publica por HTTPS.

## Senias incluidas

Las 9 intentan detectarse desde la camara usando puntos de mano, cuerpo y movimiento. Estan optimizadas para celular con video liviano y overlay alineado sin recorte. Para precision profesional en LSA hace falta entrenar un modelo propio con videos reales.

| # | Frase hablada | Gesto/senia | Camara |
| --- | --- | --- | --- |
| 1 | Hola | Palma abierta moviendo de lado a lado | Si |
| 2 | Adios | Palma abierta moviendo de lado a lado | Si |
| 3 | Necesito ayuda | Puno cerca del pecho | Si |
| 4 | Estoy perdido | Mano abierta lejos del centro | Si |
| 5 | Donde queda | Indice de lado a lado | Si |
| 6 | Donde es | Indice subiendo cerca del pecho | Si |
| 7 | Ayuda | Puno subiendo cerca del pecho | Si |
| 8 | No entiendo | Mano o indice cerca de la frente | Si |
| 9 | Si | Pulgar arriba | Si |
| 10 | No | Pulgar abajo | Si |
| 11 | Estoy bien | V o pulgar arriba | Si |
| 12 | Gracias | Mano desde boca/menton hacia afuera | Si |
| 13 | La letra C | Mano curva como C | Si |

## Como subirlo a GitHub y conectarlo a Vercel

1. Crea un repositorio nuevo en GitHub.
2. Sube estos archivos del proyecto al repositorio.
3. En Vercel, toca `Add New Project`.
4. Elige el repositorio de GitHub.
5. Framework: `Other`.
6. Build command: dejar vacio.
7. Output directory: dejar vacio o poner `.`.
8. Deploy.

Vercel va a publicar la app en una URL HTTPS, necesaria para que el celular permita usar la camara.

## Como probarlo en computadora

Opcion facil en Windows:

```text
Doble click en iniciar-app.bat
```

Desde esta carpeta, levantar un servidor local:

```powershell
python -m http.server 4173
```

Despues abrir:

```text
http://localhost:4173
```

Si no tenes Python, se puede abrir el archivo `index.html`, pero la camara puede no funcionar por seguridad del navegador.

## Como probarlo en celular

La forma mas facil es usarla como app web instalable. La camara en celular necesita HTTPS:

1. Subi esta carpeta a un hosting HTTPS, por ejemplo Netlify, Vercel o GitHub Pages.
2. Abri la URL HTTPS desde Chrome en Android o Safari en iPhone.
3. Toca `Iniciar` y acepta el permiso de camara.
4. Subi el volumen del celular; el parlante usa la voz del navegador.
5. Si aparece el boton `+`, instalala como app. En Android tambien podes usar el menu de Chrome y tocar `Agregar a pantalla principal`.

No conviene abrir el HTML suelto en el celular porque muchos navegadores bloquean la camara cuando el archivo se abre como `file://`.

## App nativa o web

Lo mas facil para avanzar es PWA: parece una app, se instala en la pantalla principal y no requiere Play Store. Cuando el prototipo ya detecte bien las senias reales, se puede envolver con Capacitor para generar una app nativa Android/iPhone usando estos mismos archivos.

## Importante

Esto no reconoce una lengua de senias completa todavia. Reconoce gestos base del modelo publico de MediaPipe. Para que diga frases reales de Lengua de Senias Argentina u otra lengua, el siguiente paso es entrenar o integrar un modelo con videos etiquetados de esas senias.

El archivo donde se cambian las frases es `app.js`, en la lista `signs`.
