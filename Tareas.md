# Tareas
Cada vez que se haga una funcionalidad nueva hay que
1. Poner el caso de uso en CasosUso (en el archivo logger)
2. Plantear la interfaz
3. Hacer pruebas unitarias **solo contra la interfaz, nunca contra la implementación**. Eso es porque si se cambia la implementación un test nunca debería de fallar.

## Estructura de archivos
- Está desordenado: ordenar, decidir una lógica y un protocolo de donde va cada cosa.

## Utiles 
Esto lo pueden hacer varias personas a la vez. Lo ideal sería empezar por esto para ir aprendiendo ts
- No es necesaria una interfaz para esto pero se puede hacer
- utiles.js y Dnv.helpers
- tests

## Logger

- Integrar [pino](https://github.com/pinojs/pino) - mandar por rabbit
- Idealmente esto deberia ir en un  worker thread
- Plantear cual va a ser la estructura de los logs (AGG)
- Preparar la implementación para integrar las alarmas
- tests

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
- Añadir hooks (por ejemplo: añadir hooks para los turnos, bigData, etc.)
- No hacen falta tests
- [Compilación condicional](https://www.npmjs.com/package/esbuild-ifdef) y diferentes archivos para funciones de cada plataforma.

## VSCode
- Crear una configuración del Prettier ([Documentación](https://prettier.io/docs/en/options.html))
    [e intergarlo con ESLint](https://prettier.io/docs/en/integrating-with-linters.html)