
"use strict";

/*
 * Interfaz de control de alarmas para la aplicacion principal.
 * La funcionalidad está implementada en el worker.
 */
Dnv.alarmas = (function () {
    /*return { // FIXME: BORRAME cuando console funcione desde los workers en samsung 
    //setCodigo: function setCodigo(remitente, codigo) {ids[remitente] = codigo;},
    comenzar: function comenzar() {},
    detener: function detener() {},
    enviarAlarmas: function enviarAlarmas(arr) {console.assert(arr instanceof Array);},
    enviarAlarma: function enviarAlarma(/*remitente,* / nivel, estado, mensaje) {},
    }*/
    try {
        var worker = new Worker("lib/alarmas_worker.js");

        worker.onMessage = function alarmasWorkerMessageHandler(oEvent) {
            if (oEvent.data.isConsole) {
                console.log("[ALARMAS] Mensaje de worker " + oEvent.data.level + " " + oEvent.data.msg);
                console[oEvent.data.level](oEvent.data.msg);
            } else if (oEvent.data.isEstadoConectividadAlarmas) {
                Dnv.systemInfo.setEstadoConectividadAlarmas(oEvent.data.estado);
            } else {
                console.log("[ALARMAS] Worker said : " + oEvent.data);
            }
        };
        worker.onmessage = worker.onMessage; // LG (comprobar en samsung tambien que este es el correcto)
        worker.onerror = function onerror(e) {
            console.error("[ALARMAS]  WORKER ERROR: " + e.message + " " + e.filename + " " + e.lineno);
        };
    } catch (e) { }
    //var ids = [];
    /*
    var colaMensajes = [];
		
    var errorHandler = function errorHandler(e, v) {
    console.error(e);
    console.dir(e);
    console.error(v);
    }
		
    var xhr = new XMLHttpRequest();
		
    var enviarAlarma = function enviarAlarma(remitente, nivel, estado, mensaje) {
    var ahora = new Date();
    var fecha = ""+ahora.getUTCDate()+"/"+(ahora.getUTCMonth()+1)+"/"+ahora.getUTCFullYear()+" "+ahora.getUTCHours()+":"+ahora.getUTCMinutes()+":"+ahora.getUTCSeconds();
    var msg = fecha+";"+remitente+";"+estado+";"+mensaje;
			
			
    xhr.open("post", "destino.aspx", true);
			
    oReq.send();
    };*/


    Dnv.systemInfo.addCambioEstadoConexionServidorCallback(function (isConectado) {
        Dnv.alarmas.onCambioEstadoConexion(isConectado);
    });
    var _envioOkTimeoutId;
    var _isOkOff = false;
    var _timestampUltimoMensaje;
    var _segundosSinErroresRecientes = 2 * 60; // En comenzarMonitorizacion se sobrescribirá, es de esperar que sean 10m
    function _onNuevoMensaje(mensaje) {
        /*
        Para evitar que un warning puntual deje las alarmas en warning permanentemente,
        si en _segundosSinErroresRecientes no se ha enviado un OK u OK OFF, reenviamos un OK (u OkOff)
        */
        _timestampUltimoMensaje = new Date().getTime();
        if (_envioOkTimeoutId) clearTimeout(_envioOkTimeoutId);
        var estado = mensaje.estado;
        if (estado !== Dnv.alarmas.estados.OK && estado !== Dnv.alarmas.estados.OK_OFF) {
            _envioOkTimeoutId = setTimeout(function () {
                if (estado !== Dnv.alarmas.estados.OK && estado !== Dnv.alarmas.estados.OK_OFF) {
                    if (new Date().getTime() - _timestampUltimoMensaje + 300 >= _segundosSinErroresRecientes * 1000) {
                        // Añadimos 300ms por si el timer no es preciso...
                        if (Dnv.Menuboard.noTenemosConexion || Dnv.Menuboard.noExisteAlgunPrecio || Dnv.Menuboard.sinPrecios) {
                            console.log("[ALARMAS] No enviamos mensaje de correcto porque algo del MenuBoard no esta bien");
                            _onNuevoMensaje(mensaje);
                        } else {
                            console.info("[ALARMAS] Enviar mensaje de correcto porque no ha habido warnings o errores en los ultimos minutos: " + _isOkOff);
                            Dnv.alarmas.enviarAlarma((_isOkOff ? Dnv.alarmas.estados.OK_OFF : Dnv.alarmas.estados.OK), "Sin errores recientes");
                            Dnv.Menuboard.noTenemosConexionLast = false;
                            Dnv.Menuboard.noExisteAlgunPrecioLast = false;
                            Dnv.Menuboard.sinPreciosLast = false;
                        }
                    }
                }
            }, _segundosSinErroresRecientes * 1000);
        } else if (estado === Dnv.alarmas.estados.OK) {
            _isOkOff = false;
            console.log("okoff " + _isOkOff);
        } else if (estado === Dnv.alarmas.estados.OK_OFF) {
            _isOkOff = true;
            console.log("okoff " + _isOkOff);
        }
    }
    function _onNuevosMensajes(mensajes) {
        for (var i = 0; i < mensajes.length; i++) {
            var estado = mensajes[i].estado;
            if (estado === Dnv.alarmas.estados.OK) {
                _isOkOff = false;
                console.log("okoff " + _isOkOff);
            } else if (estado === Dnv.alarmas.estados.OK_OFF) {
                _isOkOff = true;
                console.log("okoff " + _isOkOff);
            }
        }
        if (mensajes.length > 0) _onNuevoMensaje(mensajes[mensajes.length - 1]);

    }

    return {
        //setCodigo: function setCodigo(remitente, codigo) {ids[remitente] = codigo;},
        //RAG 
        comenzar: function comenzar() {
            console.info("[ALARMAS] Iniciando alarmas");
            try {
                _segundosSinErroresRecientes = Math.max(
                    2 * 60,
                    Dnv.cfg.getCfgInt("SegundosTimer"),
                    Dnv.cfg.getCfgInt("SegundosTimerConfiguracion"),
                    Dnv.cfg.getCfgInt("SegundosTimerLicencia_SinValida")) + 60; // un minuto más por si hay timeouts de red
                console.info("[ALARMAS] Se mandara un OK si no hay errores en " + _segundosSinErroresRecientes + " segundos");
                var ipMaster = Dnv.cfg.getCfgString("IPMaster", Dnv.deviceInfo.ipServer());
                //console.log("[ALARMAS] llamamos IPMaster desde  playlist (" + ipMaster + ")...");
                var urlAlarmas;
                if (Dnv.cfg.getConfigProtocolServer() == "https://") {
                    urlAlarmas = "https://" + ipMaster + "/alarmashttpmonitor/";
                } else {
                    urlAlarmas = "http://" + ipMaster + ":6007/";
                }
                urlAlarmas = Dnv.cfg.getCfgString("Alarmas_HTTPClient", urlAlarmas);
                console.log("[ALARMAS] usamos " + urlAlarmas + "...");
                /*worker.postMessage("ipMaster|" + Dnv.cfg.getCfgString("IPMaster", ""));
                console.log("[ALARMAS] llamamos comenzar desde playlist...");
                worker.postMessage("comenzar|" + Dnv.cfg.getCfgInt("info_code", 0));*/
                worker.postMessage({
                    comando: "comenzar",
                    codDispositivo: Dnv.cfg.getCfgInt("info_code", 0),
                    urlAlarmas: urlAlarmas,
                    temporizacion: Dnv.cfg.getCfgInt("Alarmas_Temporizacion_HTTP", 300)
                });
            } catch (e) {
                console.error("[ALARMAS] No se pudo enviar el mensaje de arranque al worker " + e);
                Dnv.monitor.writeLogFile("[ALARMAS] No se pudo enviar el mensaje de arranque al worker", LogLevel.Error);
            };
            Dnv.alarmas.dispositivosExternos.comenzar();

        },
        detener: function detener() {
            console.info("[ALARMAS] Deteniendo alarmas");
            try {
                worker.postMessage({ comando: "detener" });
            } catch (e) {
                console.error("[ALARMAS] No se pudo enviar el mensaje de detención al worker " + e);
                Dnv.monitor.writeLogFile("[ALARMAS] No se pudo enviar el mensaje de detención al worker", LogLevel.Error);
            };
            Dnv.alarmas.dispositivosExternos.detener();
        },

        _debugGetworker: function () { return worker; },

        enviarAlarmas: function enviarAlarmas(arr) {
            for (var i = 0; i < arr.length; i++) {
                console.info("[ALARMAS] Enviando alarmas [Nivel " + arr[i].estado + "]: " + arr[i].mensaje);
            }

            try {
                console.assert(arr instanceof Array);
                _onNuevosMensajes(arr);
                worker.postMessage({
                    comando: "enviarMensajes",
                    mensajes: arr
                });
            } catch (e) {
                console.error("[ALARMAS] No se pudo enviar el mensaje al worker " + e);
                Dnv.monitor.writeLogFile("[ALARMAS] No se pudo enviar el mensaje al worker", LogLevel.Error);
            };
        },
        enviarAlarma: function enviarAlarma(/*remitente, nivel, */estado, mensaje) {
            console.info("[ALARMAS] Enviando alarma [Nivel " + estado + "]: " + mensaje);
            try {
                _onNuevoMensaje({
                    //remitente: ids[remitente], // FIXME: pasar el ID de remitente, no el Codigo de dispositivo
                    //remitente: remitente, <- solo hay un remitente
                    //nivel: nivel,
                    estado: estado,
                    mensaje: mensaje
                });
                worker.postMessage({
                    comando: "enviarMensajes",
                    mensajes: [{
                        //remitente: ids[remitente], // FIXME: pasar el ID de remitente, no el Codigo de dispositivo
                        //remitente: remitente, <- solo hay un remitente
                        //nivel: nivel,
                        estado: estado,
                        mensaje: mensaje
                    }]
                });
            } catch (e) {
                console.error("[ALARMAS] No se pudo enviar el mensaje al worker " + e);
                Dnv.monitor.writeLogFile("[ALARMAS] No se pudo enviar el mensaje al worker", LogLevel.Error);
            };
        },
        onCambioEstadoConexion: function onCambioEstadoConexion(isConectado) {

            try {
                worker.postMessage({
                    comando: "cambioEstadoConectividad",
                    hayConectividad: isConectado
                });
            } catch (e) {
                console.error("[ALARMAS] No se pudo enviar el cambio de estado de conectividad al worker " + e);
                Dnv.monitor.writeLogFile("[ALARMAS] No se pudo enviar el cambio de estado de conectividad al worker", LogLevel.Error);
            };
        }
    }


})();

Dnv.alarmas.remitentes = {
	PLAYER: 0/*,
	MANAGER: 1,
	CLOUD: 2,
	SALIDA: 3,
	PANTALLA: 4*/
};
Dnv.alarmas.estados = {
	OK_OFF: 0,
	OK: 1,
	SCANNING: 2,
	TIMEOUT: 3,
	WARNING: 4,
	ERROR: 5,
	UNKNOWN: 99999
};

Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.OK, "Arrancando Player Deneva");
/*Dnv.alarmas.enviarAlarmas([{
		remitente: Dnv.alarmas.remitentes.MANAGER,
		estado: Dnv.alarmas.estados.OK,
		mensaje: "Arrancando"
	},{
		remitente: Dnv.alarmas.remitentes.CLOUD,
		estado: Dnv.alarmas.estados.OK,
		mensaje: "Arrancando"
	},{
		remitente: Dnv.alarmas.remitentes.SALIDA,
		estado: Dnv.alarmas.estados.OK,
		mensaje: "Arrancando"
	},{
		remitente: Dnv.alarmas.remitentes.PANTALLA,
		estado: Dnv.alarmas.estados.OK,
		mensaje: "Arrancando"
	}]);*/

Dnv.alarmas.dispositivosExternos = (function () {
    var _monitorizacionInterval;

    var _estados = {};
    var _onEstadoRecibido = function _onEstadoRecibido(id, estado, descripcion) {
        if (_estados[id] === undefined || _estados[id].estado !== estado || _estados[id].descripcion !== descripcion) {
            _onCambioDeEstado(id, estado, descripcion);
        }
    };
    var _onCambioDeEstado = function _onCambioDeEstado(id, estado, descripcion) {

        if (!_estados[id]) _estados[id] = {};

        _estados[id].estado = estado;
        _estados[id].descripcion = descripcion;
        _estados[id].timestamp = Date.now();

    };

    function sendStatus(id, estado, retraso) {
        setTimeout(function () {
            console.log("[ALARMAS][EXTERNOS] (sendStatus) id: " + id + " estado: " + estado.estado + " descripcion: " + estado.descripcion);
            Dnv.servidor.setStatusDispositivoExterno(id, estado.estado, estado.descripcion);
        }, retraso);
    }

    // No enviamos directamente, sino que cada X minutos enviamos el estado, si  ha cambiado, y cada Y si no ha cambiado
    var _checkEstados = function _checkEstados() {
        var envioConCambiosInterval = Dnv.cfg.getCfgInt("AlarmasDExternosTemporizacion", 300) * 1000;
        var envioSinCambiosInterval = Dnv.cfg.getCfgInt("AlarmasDExternosContencion", 600) * 1000;
        var ahora = Date.now();
        var retraso = 5000;
        for (var id in _estados) {
            if (_estados.hasOwnProperty(id)) {
                var estado = _estados[id];
                if (estado.envioTimestamp === undefined || // No ha sido enviado
                        (estado.timestamp > estado.envioTimestamp && estado.envioTimestamp > ahora - envioConCambiosInterval) || // O Ha cambiado desde el último encio y este fue hace X tiempo
                        estado.envioTimestamp > ahora - envioSinCambiosInterval) { // O ha pasado más de Y tiempo
                    // 
                    estado.envioTimestamp = Date.now();
                    console.log("[ALARMAS][EXTERNOS] id: " + id + " estado: " + estado.estado + " descripcion: " + estado.descripcion);
                    sendStatus(JSON.parse(JSON.stringify(id)), JSON.parse(JSON.stringify(estado)), JSON.parse(JSON.stringify(retraso)));
                    retraso += 5000;
                }
            }
        }
    };


    return {
        onEstado: _onEstadoRecibido,
        comenzar: function () {
            if (_monitorizacionInterval === undefined) {
                var envioConCambiosInterval = Dnv.cfg.getCfgInt("AlarmasDExternosTemporizacion", 300) * 1000;
                var envioSinCambiosInterval = Dnv.cfg.getCfgInt("AlarmasDExternosContencion", 600) * 1000;
                // Usamos el mínimo, más un segundo, para compensar posibles esperas debido a procesamiento y envios de JS
                var interval = (envioConCambiosInterval > envioSinCambiosInterval ? envioSinCambiosInterval : envioConCambiosInterval) + 1000;
                _monitorizacionInterval = setInterval(_checkEstados, interval);
                _checkEstados();
            }
        },
        detener: function () {
            if (_monitorizacionInterval === undefined) {
                clearInterval(_monitorizacionInterval);
                _monitorizacionInterval = undefined;
            }
        }

    };

})();

