"use strict";
var Dnv = Dnv || {};


var isConsoleDefined;
try {
    if (console === undefined) {
        isConsoleDefined = false;
    } else {
        isConsoleDefined = true;
    }
} catch (e) {
    isConsoleDefined = false;
}
var console = console || {};

if (!isConsoleDefined) {

    var podemosReferenciarWindow = true;
    try {
        var a = window;
    } catch (e) { // WTF Samsung? ReferenceError: Can't find variable: window
        podemosReferenciarWindow = false;
    }

    if (podemosReferenciarWindow && window && window.self && window.self.console) {
        console = window.self.console;
    } else {
        console = {
            log: function () {
                postMessage({
                    isConsole: true,
                    level: "log",
                    msg: arguments[0]/*,
					args: JSON.stringify(arguments)*/
                });
            },
            warn: function () {
                var stack = new Error().stack;
                var msg = (stack ? arguments[0] + "[TRACE:\n" + stack + "]" : arguments[0])
                postMessage({
                    isConsole: true,
                    level: "warn",
                    msg: msg/*,
					args: arguments*/
                });
            },
            error: function () {
                var stack = new Error().stack;
                var msg = (stack ? arguments[0] + "[TRACE:\n" + stack + "]" : arguments[0])
                postMessage({
                    isConsole: true,
                    level: "error",
                    msg: msg/*,
					args: arguments*/
                });
            }
        };
    }
}


// El DOMParser no esta disponible desde workers
importScripts("xml_for_script/tinyxmlw3cdom.js", "xml_for_script/tinyxmlsax.js");
Dnv.comandosRemotos = (function () {


    function _procesarControlCommands() {
        //if (!Dnv.sincronizacion.isEsclavo()) {
        _getRemoteControlCommands(_url, function (comandos) {
            //console.log(JSON.stringify(comandos));
            if (comandos.length > 0) {
                postMessage({
                    isConsole: false,
                    isComandos: true,
                    comandos: comandos/*,
					args: arguments*/
                });
            }

        });
        //}
    }

    var _loguearMensajesErrorRed = true;

    function _getRemoteControlCommands(url, callback, errorCallback) {


        function errHandler(e) {
            if (_loguearMensajesErrorRed) {
                console.error("[SERVIDOR] Error al pedir comandos de control: " + e);
            }
            if (errorCallback) errorCallback();
        }
        function handler() {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {
                    //console.log("Respuesta de torrent status");
                    if (callback) {
                        //this.responseXML.getElementsByTgName
                        var doc;
                        var resultado = [];
                        if (this.responseXML) {
                            doc = this.responseXML
                            var stringItems = doc.getElementsByTagName("string");

                            for (var i = 0; i < stringItems.length; i++) {
                                resultado.push(stringItems[i].textContent);
                            }
                        } else {

                            var parser = new DOMImplementation();
                            var gobjDatabaseDom = parser.loadXML(this.responseText);
                            doc = gobjDatabaseDom.getDocumentElement();


                            var stringItems = doc.getElementsByTagName("a:string");
                            for (var i = 0; i < stringItems.length; i++) {
                                resultado.push("" + stringItems.item(i).firstChild.getNodeValue());
                            }
                        }
                        callback(resultado);
                    }

                } else {
                    errHandler("[SERVIDOR] Comandos de control: Error HTTP: " + this.statusText);
                }
            }
        }


        var client = new XMLHttpRequest();
        client.onreadystatechange = handler;
        client.onerror = errHandler;
        client.timeout = 45000; // La llamada parece bastante lenta
        client.ontimeout = function () { errHandler("Timed out al pedir comandos de control!!!"); };

        //var url = Dnv.cfg.getCfgString("AvisosClientEndPointAddressWeb", "http://" + Dnv.cfg.getConfigIpServer() + ":8090/ServicioAvisos/WebAvisos") + "/GetRemoteControl";

        var xml = '<GetRemoteControl xmlns="http://tempuri.org/"><ObjId>' + _objectId + '</ObjId></GetRemoteControl>';

        client.open("POST", url);

        client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

        //xml = undefine
        //client.send();

        //console.log("[SERVIDOR] Pidiendo comandos de control");
        client.send(xml);



    }
    var _url;
    var _interval;
    var _intervalId = undefined;
    var _objectId = undefined;

    var onCambioEstadoConectividad = function onCambioEstadoConectividad(hayConectividad) {
        _loguearMensajesErrorRed = hayConectividad;
    };

    return {
        comenzar: function (url, interval, objectId) {
            _url = url;
            _interval = interval;
            _objectId = objectId;
            if (!_intervalId) {
                _intervalId = setInterval(_procesarControlCommands, interval);
            }
        },
        detener: function () {
            if (_intervalId) clearInterval(_intervalId);
            _intervalId = null;
        },
        onCambioEstadoConectividad: onCambioEstadoConectividad
    };


})();



self.addEventListener('message', function (e) {
    console.log("[CONTROL WORKER] Mensaje " + e.data.comando);
    postMessage("[CONTROL WORKER] Recibido " + JSON.stringify(e.data));


    var comando = e.data.comando;
    switch (comando) {
        case "comenzar":
            Dnv.comandosRemotos.comenzar(e.data.url, e.data.interval, e.data.objectId);
            break;
        //case "setIpMaster":        
        case "detener":
            Dnv.comandosRemotos.detener();
            break;
        /*case "enviarMensajes":
            Dnv.alarmas.enviarAlarmas(e.data.mensajes);
            break;*/
        case "cambioEstadoConectividad":
            Dnv.comandosRemotos.onCambioEstadoConectividad(e.data.hayConectividad);
            break;
        default:
            console.error("[CONTROL WORKER] Mensaje desconocido " + JSON.stringify(e.data));
            break;
    }
    /*
    if (typeof (e.data) === "string" && e.data.substr(0, 9) === "comenzar|") {
    Dnv.alarmas.comenzar(e.data.substr(9));
    } else if (typeof (e.data) === "string" && e.data.substr(0, 9) === "ipMaster|") {
    Dnv.alarmas.setIpMaster(e.data.substr(9));
    } else if (e.data === "detener") {
    Dnv.alarmas.detener();
    } else if (e.data instanceof Array) {
    // cada elemento del array tiene una propiedad  estado y otra mensaje
    Dnv.alarmas.enviarAlarmas(e.data);
    } else if (e.data) {
    Dnv.alarmas.enviarAlarma(/*e.data.remitente, * /e.data.estado, e.data.mensaje);
    } else {
    console.error("[ALARMAS]: Mensaje desconocido " + e);
    }*/
    //self.postMessage(e.data);
}, false);
