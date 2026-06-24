# VozSenias

Aplicacion web movil para probar camara, deteccion de gestos y voz en vivo.

## Que hace ahora

- Abre la camara frontal del celular.
- Usa MediaPipe Gesture Recognizer para detectar gestos de mano comunes.
- Convierte esos gestos en frases en espanol con `speechSynthesis`.
- Permite tocar frases rapidas para probar el altavoz aunque el detector no haya cargado.
- Se puede instalar como PWA si se publica por HTTPS.

## 30 senias/frases incluidas

Las primeras 7 tienen deteccion automatica con el modelo publico de MediaPipe. Las otras 23 quedan como botones de voz rapida hasta entrenar un modelo propio de lengua de senias.

| # | Frase hablada | Gesto/senia en espanol | Auto |
| --- | --- | --- | --- |
| 1 | Hola | Palma abierta | Si |
| 2 | Necesito ayuda | Puno cerrado | Si |
| 3 | Si | Pulgar arriba | Si |
| 4 | No | Pulgar abajo | Si |
| 5 | Estoy bien | V de victoria | Si |
| 6 | Te quiero | Te quiero | Si |
| 7 | Quiero hablar | Dedo hacia arriba | Si |
| 8 | Gracias | Mano al menton hacia afuera | No |
| 9 | Por favor | Mano en el pecho en circulo | No |
| 10 | Perdon | Puno en el pecho | No |
| 11 | Tengo hambre | Mano hacia la boca | No |
| 12 | Tengo sed | Dedo cerca de la boca | No |
| 13 | Necesito ir al bano | Mano en B moviendose | No |
| 14 | Me duele | Dedos apuntando al dolor | No |
| 15 | Llamen a mi familia | Gesto de llamar | No |
| 16 | Llamen a emergencias | Gesto de telefono urgente | No |
| 17 | Estoy perdido | Manos buscando | No |
| 18 | No entiendo | Mano cerca de la frente | No |
| 19 | Repeti, por favor | Mano vuelve hacia mi | No |
| 20 | Mas despacio | Mano bajando lento | No |
| 21 | Estoy cansado | Manos bajan desde hombros | No |
| 22 | Tengo frio | Brazos temblando | No |
| 23 | Tengo calor | Mano abanica la cara | No |
| 24 | Quiero comer | Dedos hacia la boca | No |
| 25 | Quiero agua | Senia de agua | No |
| 26 | Quiero dormir | Mano baja por la cara | No |
| 27 | Estoy esperando | Manos en espera | No |
| 28 | Voy a casa | Mano hacia casa | No |
| 29 | Necesito escribir | Gesto de lapiz | No |
| 30 | No puedo hablar | Mano frente a la boca | No |

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
