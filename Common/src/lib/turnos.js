
"use strict";

var Dnv = Dnv || {};
Dnv.turnos = (function () {
    /*
    * FIXME: Estas variables solo están definidas en LG
    * No es algo portable, sin embargo, la funcionalidad de turnos depende de Flash y flash solo funciona en LG y SSSP
    * Para implementarlo con HTML5, se haria de una forma diferente, sin usar el archivo en disco
    */
    var TURNOS_PATH = Dnv.Cloud._VARIOS_PATH;
    var TURNOS_FLASH_PATH = Dnv.Cloud._VARIOS_PATH; // Dnv.Cloud._VARIOS_REFERENCE_PATH;
    if (Dnv.Cloud._VARIOS_REFERENCE_PATH) {
        TURNOS_FLASH_PATH = Dnv.Cloud._VARIOS_REFERENCE_PATH;
    }

    var TURNOS_BASICO_FILENAME = "Turnos.xml";
    var TURNOS_AVANZADO_FILENAME = "TurnosAvanzado.xml";

    var datos = {};
    var _minValue = 1;
    var _maxValue = 99;
    var _isTurnosAvanzado = false;
    var _valorAnterior = 0;
    var _valorActual = 0;
    var _estado = true;
    var _keyBuffer = null;
    var _keyIntBuffer = null;
    var _soporteTecladoArduino = false;
    /*
    * Los teclados y el dongle envían cada minuto
    * Consideraremos la falta de noticias durante 2 minutos como error...
    */
    var _pingtecladoTimeout = undefined;
    var _pingDispositivoTimeout = 90 * 1000; // 90 segundos
    var _pingsDispositivosTime = {};
    var _isDispositivoOk = {};

    var _ID_DONGLE = "Receptor de botonera";
    var _ID_BOTONERA = "Botonera "; // "Botonera N"

    var leerBasico = function () {

        //var rutaTurnos = TURNOS_PATH + (_isTurnosAvanzado ? TURNOS_AVANZADO_FILENAME : TURNOS_BASICO_FILENAME);

        Dnv.monitor.readFileAsync(TURNOS_PATH + TURNOS_BASICO_FILENAME,
            function exitoCb(resultado) {
                try {
                    var doc = new DOMParser().parseFromString(resultado, "text/xml");
                    _valorActual = parseInt(doc.getElementsByTagName("item")[0].getAttribute("value"));
                    console.info("[TURNOS] Leido el fichero de turnos basico: " + _valorActual);
                    Dnv.Smo.onLocalDataActualizado(TURNOS_BASICO_FILENAME, resultado);
                    escribir(); // Generamos el fichero de LocalData
                } catch (e) {
                    console.error("No se pudo parsear el fichero de turnos: " + e);
                }
            }, function errorCb() {
                console.error("No se pudo leer el fichero de turnos");
                escribir();
            });
    };

    var leerAvanzado = function () {

        //var rutaTurnos = TURNOS_PATH + (_isTurnosAvanzado ? TURNOS_AVANZADO_FILENAME : TURNOS_BASICO_FILENAME);

        Dnv.monitor.readFileAsync(TURNOS_PATH + TURNOS_AVANZADO_FILENAME,
            function exitoCb(resultado) {
                try {
                    var doc = new DOMParser().parseFromString(resultado, "text/xml");
                    for (var item in doc.getElementsByTagName("item")) {
                        /*datos[item.getAttribute("objectID")] = {
                        "objectId": item.getAttribute("objectID"),
                        "desc": item.getAttribute("desc"),
                        "lastUpdate": item.getAttribute("lastUpdate"),
                        "color": item.getAttribute("color"),
                        "value": item.getAttribute("value"),
                        "status": item.getAttribute("status")
                        };*/
                        if (item.getAttribute("objectID") == Dnv.cfg.getObjectId()) {
                            _valorActual = parseInt(item.getAttribute("value"));
                        }
                    };
                    console.info("[TURNOS] Leido el fichero de turnos avanzado: " + _valorActual);
                    escribir(); // Generamos el fichero de LocalData
                } catch (e) {
                    console.error("No se pudo parsear el fichero de turnos: " + e);
                }
            }, function errorCb() {
                console.error("No se pudo leer el fichero de turnos");
            });
    };

    var escribir = function () {
        console.info("[TURNOS] Escribir turno " + _valorActual);
        var rutaTurnos = TURNOS_PATH + (_isTurnosAvanzado ? TURNOS_AVANZADO_FILENAME : TURNOS_BASICO_FILENAME);
        var pl = Dnv.Pl.lastPlaylist;
        var seccion;
        if (pl && "SeccionTurnos" in pl.getPlayer().getSalida().getMetadatos()) {
            seccion = pl.getPlayer().getSalida().getMetadatos()["SeccionTurnos"]
        } else {
            seccion = "";
        }
        var color;
        if (pl && "ColorTurnos" in pl.getPlayer().getSalida().getMetadatos()) {
            color = pl.getPlayer().getSalida().getMetadatos()["ColorTurnos"]
        } else {
            color = "#000000";
        }

        var contenidoBasico = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<keylogger Timestamp=\"" + Dnv.utiles.formatDateTimeEspanol(new Date()) + "\">\n" +
                "\t<item desc=\"" + seccion.replace("&", "&amp;").replace("\"", "&quot;") + "\" value=\"" + _valorActual + "\" />\n</keylogger>";
        Dnv.monitor.writeFile(TURNOS_PATH + TURNOS_BASICO_FILENAME, contenidoBasico);

        var contenido = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<keylogger>\n" +
                "\t<item objectID=\"" + Dnv.cfg.getObjectId() + "\" desc=\"" + seccion.replace("&", "&amp;").replace("\"", "&quot;") + "\" lastUpdate=\"" + Dnv.utiles.formatDateTimeEspanol(new Date()) + "\" color=\"" + color + "\" value=\"" + _valorActual + "\" status=\"" + (_estado ? 1 : 0) + "\" />\n" +
                "</keylogger>";
        Dnv.monitor.writeFile(TURNOS_PATH + TURNOS_AVANZADO_FILENAME, contenido);

        // Lo hacemos disponible a través de local data
        Dnv.Smo.onLocalDataActualizado(TURNOS_BASICO_FILENAME, contenidoBasico);
        Dnv.monitor.writeFile(Dnv.Cloud._STATIC_PATH + TURNOS_BASICO_FILENAME, contenidoBasico);        

        //Dnv.monitor.writeFile(rutaTurnos, contenido);
    };

    var _onTeclaPulsada = function _onTeclaPulsada(e) {
        var keycode = e.keyCode;
        if (Menu && !Menu.isMostrandoMenu()) {
            // Workarround para la tecla +*] de un teclado español configurado en inglés
            if (keycode === 221 && !e.altKey) keycode = (e.shiftKey ? 0x6a : 0x6b);

            // Workarround para la tecla +*] de un teclado español
            if (keycode === 187 && !e.altKey) keycode = (e.shiftKey ? 0x6a : 0x6b);

            // Workarround para la tecla -_ de un teclado español configurado en inglés
            if (keycode === 191 && !e.altKey && !e.shiftKey) keycode = 0x6d;

            // Workarround para la tecla -_ de un teclado español configurado en inglés
            if (keycode === 189 && !e.altKey && !e.shiftKey) keycode = 0x6d;

            // Workarround para la tecla 7/ que tiene 7 y dividir
            if (keycode === 0x37 && !e.altKey && e.shiftKey) keycode = 0x6f;

            switch (keycode) {
                case 38: // Derecha
                case 39: // Arriba
                case 0x6b: // + numérico
                    //case 221: // teclado español configurado como inglés
                    // Siguiente
                    _keyBuffer = null;
                    _keyIntBuffer = null;
                    _valorAnterior = _valorActual;
                    if (_valorActual < _maxValue) {
                        _valorActual++;
                    } else {
                        _valorActual = _minValue;
                    }
                    escribir();
                    break;
                case 37: // Izquierda
                case 40: // Abajo
                case 0x6d: // - numérico
                    //case 191: // teclado español configurado como inglés
                    // Anterior
                    _keyBuffer = null;
                    _keyIntBuffer = null;
                    _valorAnterior = _valorActual;
                    if (_valorActual > _minValue) {
                        _valorActual--;
                    } else {
                        _valorActual = _maxValue;
                    }
                    escribir();
                    break;
                case 0x6a: // * numérico
                    // Deshacer
                    _keyBuffer = null;
                    _keyIntBuffer = null;
                    var aux = _valorAnterior;
                    _valorAnterior = _valorActual;
                    _valorActual = aux;
                    escribir();
                    break;
                case 0x6f: // / numérico
                    // Abrir / cerrar
                    _keyBuffer = null;
                    _keyIntBuffer = null;
                    _estado = !_estado;
                    escribir();
                    break;
                case 0x30: // 0 normal
                case 0x31: // 1 normal
                case 0x32: // 2 normal
                case 0x33: // 3 normal
                case 0x34: // 4 normal
                case 0x35: // 5 normal
                case 0x36: // 6 normal
                case 0x37: // 7 normal
                case 0x38: // 8 normal
                case 0x39: // 9 normal
                case 0x60: // 0 numérico
                case 0x61: // 1 numérico
                case 0x62: // 2 numérico
                case 0x63: // 3 numérico
                case 0x64: // 4 numérico
                case 0x65: // 5 numérico
                case 0x66: // 6 numérico
                case 0x67: // 7 numérico
                case 0x68: // 8 numérico
                case 0x69: // 9 numérico
                    var v = keycode - (keycode >= 0x60 ? 0x60 : 0x30);
                    if (_keyBuffer === null) _keyBuffer = "";
                    _keyBuffer += String.fromCharCode(e.which); // e.charCode no funciona // _keyBuffer += keycode;
                    if (_keyIntBuffer === null) _keyIntBuffer = 0;
                    _keyIntBuffer = _keyIntBuffer * 10 + v;
                    break;
                case 0x0D: // Intro... Se usa tambien para activar el menú lateral
                    if (_keyBuffer !== null && _keyBuffer.indexOf("DKY") === _keyBuffer.length - 3) {
                        //var numBotonera = parseInt(_keyBuffer.substring(3));
                        console.info("[TURNOS] El dongle del teclado ha dado señales de vida.");
                        var pl = Dnv.Pl.lastPlaylist;
                        if (pl) {
                            _pingsDispositivosTime[pl.getPlayer().getSalida().getPlayerName() + " " + _ID_DONGLE] = Date.now();
                        } else {
                            console.warn("[TURNOS] No tenemos playlist, no notificamos que el dongle ha dado señales de vida.");
                        }
                    } else if (_keyBuffer !== null && _keyBuffer.indexOf("BTN") === 0) {
                        var numBotonera = parseInt(_keyBuffer.substring(3));
                        console.info("[TURNOS] La botonera " + numBotonera + " ha dado señales de vida.");
                        var pl = Dnv.Pl.lastPlaylist;
                        if (pl) {
                            _pingsDispositivosTime[pl.getPlayer().getSalida().getPlayerName() + " " + _ID_BOTONERA + numBotonera] = Date.now();
                        } else {
                            console.warn("[TURNOS] No tenemos playlist, no notificamos que la botonera ha dado señales de vida.");
                        }
                    } else if (_keyIntBuffer !== null && _keyIntBuffer != 1 && _keyIntBuffer <= _maxValue) {
                        // Al mantener pulsado el botón rojo, nos envia 0<Intro>
                        _valorAnterior = _valorActual;
                        _valorActual = _keyIntBuffer;
                        if (_valorActual > _maxValue) {
                            _valorActual = _maxValue;
                        } else if (_valorActual < _minValue) {
                            _valorActual = _minValue;
                        }
                        escribir();
                    }
                    _keyBuffer = null;
                    _keyIntBuffer = null;
                    break;
                case 0x44: // 68 D
                case 0x4B: // 75 K
                case 0x59: // 89 Y
                    // DKY[Enter] es un ping de dongle del keyboard arduino
                    if (_keyBuffer === null) _keyBuffer = "";
                    _keyBuffer += String.fromCharCode(e.which); // e.charCode no funciona
                    //_keyBuffer += e.key;
                    _keyIntBuffer = null;
                    break;
                case 0x42: // 66 B
                case 0x54: // 64 T
                case 0x4E: // 78 N
                    // BTN1[Enter] es un ping de la botonera 1
                    if (_keyBuffer === null) _keyBuffer = "";
                    _keyBuffer += String.fromCharCode(e.which); // e.charCode no funciona
                    //_keyBuffer += e.key;
                    _keyIntBuffer = null;
                    break;
                default:
                    //_keyBuffer = null;
                    //_keyIntBuffer = null;
            }

        }
    };
    var _lastkeyDownKeyCode;
    window.addEventListener("keyup", function (e) {
        //console.log("keyup " + e.keyCode);
        if (_lastkeyDownKeyCode !== e.keyCode) {
            // Al resetear con el teclado arduino del piloto de mercadona, no se manda el keydown del intro, solo el keyup.
            _onTeclaPulsada(e);
        }
    });
    window.addEventListener("keypress", function (e) {
        //console.log("keypress " + e.keyCode);
    });
    window.addEventListener("keydown", function (e) {
        _lastkeyDownKeyCode = e.keyCode;
        //console.log("keydown " + e.keyCode);
        _onTeclaPulsada(e);
    });

    var _checkDispositivoInterval = undefined;
    var _checkDispositivo = function _checkDispositivo() {
        var margenTiempo = Date.now() - _pingDispositivoTimeout;
        for (var id in _pingsDispositivosTime) {
            if (_pingsDispositivosTime.hasOwnProperty(id)) {
                if (_pingsDispositivosTime[id] < margenTiempo) {
                    console.warn("[TURNOS] El dispositivo externo " + id + " no responde");
                    Dnv.alarmas.dispositivosExternos.onEstado(id, Dnv.alarmas.estados.ERROR, "Perdida de conectividad");
                } else {
                    Dnv.alarmas.dispositivosExternos.onEstado(id, Dnv.alarmas.estados.OK, "OK");
                }
            }
        }
    };
    var _onConfiguracionCargada = function onConfiguracionCargada() {
        console.log("TURNOS: Cargando configuracion");
        _isTurnosAvanzado = (Dnv.cfg.getCfgString("EntradaTeclado_Mode", "").indexOf("-a") >= 0);
        _minValue = Dnv.cfg.getCfgInt("EntradaTeclado_MinTurno", 1);
        _maxValue = Dnv.cfg.getCfgInt("EntradaTeclado_MaxTurno", 99);
        //_isTurnosAvanzado = (Dnv.cfg.getCfgString("EntradaTeclado_Mode", "").indexOf("-a") >= 0);
        _soporteTecladoArduino = Dnv.cfg.getCfgBoolean("TecladoIconEnabled", false);
        if (_soporteTecladoArduino) {
            if (_checkDispositivoInterval !== undefined) clearInterval(_checkDispositivoInterval);
            _checkDispositivoInterval = setInterval(_checkDispositivo, 90 * 1000);
            _checkDispositivo();
        }

        leerBasico(); // Inicializar el turno actual
    };
    window.addEventListener(CFG_CARGADA_EVENT, _onConfiguracionCargada);


    return {

        onConfiguracionCargada: _onConfiguracionCargada,
        isIntroduciendoTurno: function () { return _keyBuffer !== null; },
        getRuta: function () { return TURNOS_FLASH_PATH + TURNOS_BASICO_FILENAME; },
        getRutaAvanzado: function () { return TURNOS_FLASH_PATH + TURNOS_AVANZADO_FILENAME; }
    };
})();

