# Tareas
Cada vez que se haga una funcionalidad nueva hay que
1. Poner el caso de uso en CasosUso (en el archivo logger)
2. Plantear la interfaz
3. Hacer pruebas unitarias **solo contra la interfaz, nunca contra la implementación**. Eso es porque si se cambia la implementación un test nunca debería de fallar.

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
- Añadir al TODO
- Implementar lo que se pueda
- Dejar optimizados los asyncs
- No hacen falta tests