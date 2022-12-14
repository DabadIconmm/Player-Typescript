# Tareas

Cada vez que se haga una funcionalidad nueva hay que:

1. Poner el caso de uso en CasosUso (en el archivo logger), crear función log con logFactory()
2. Plantear la interfaz: Cuanto mas pequeña mejor
3. Hacer pruebas unitarias **solo contra la interfaz, nunca contra la implementación**. Eso es porque si se cambia la implementación un test nunca debería de fallar.
4. Ver si tiene que estar en un namespace

El codigo JavaScript esta en el tfs en soluciones/PlayerHTML5-Unificado

## Utiles (daniel)

Esto lo pueden hacer varias personas a la vez. Lo ideal sería empezar por esto para ir aprendiendo ts

- No es necesaria una interfaz para esto pero se puede hacer
- arreglar [utiles.ts](src\Utils\utiles.ts)
- utiles.js: Common\src\lib\utiles.js y Dnv.helpers
- tests

## DeviceProperties (daniel)

- Common\lib\deviceProperties.js

## Logger (orion)

- Integrar [pino](https://github.com/pinojs/pino) - mandar por rabbit/kafka
- Idealmente esto deberia ir en un  worker thread
- Plantear cual va a ser la estructura de los logs (AGG) -> Documentar en logger.ts
- Preparar la implementación para integrar las alarmas
- tests
- comprimir con [snappy](https://www.npmjs.com/package/snappy)?
- casosUso stack???? -> no se va a hacer

## Alarmas

- Plantear interfaz (se llamará por la clase logger)
- Extraer todo lo posible al worker thread
- Implementar
- Tests (con mocks)

## Init pipeline

- Sigue el principio de [Chain of Responsibility](https://sourcemaking.com/design_patterns/chain_of_responsibility)
- Añadir al TODO
- Implementar lo que se pueda
- Dejar optimizados los asyncs
- Añadir hooks (por ejemplo: turnos, bigData, etc, cosas para cada plataforma)
- No hacen falta tests
- [Compilación condicional](https://www.npmjs.com/package/esbuild-ifdef) y diferentes archivos para funciones de cada plataforma.

## VSCode (*)

- Crear una configuración del Prettier ([Documentación](https://prettier.io/docs/en/options.html))
    [e intergarlo con ESLint](https://prettier.io/docs/en/integrating-with-linters.html)

## Build (orion)

- Arreglarla, no puede estar en bash si todo el mundo usa windows

## CI (orion)

- Crear una pipeline con jenkins o lo que sea
