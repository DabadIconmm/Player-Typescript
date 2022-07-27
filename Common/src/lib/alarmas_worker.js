"use strict";
var Dnv = Dnv || {};


var CFG_CIFRAR = false;
/*
 * Lo ideal seria usar WebSockets (con SignalR?) si el servidor lo soporta y peticiones AJAX como fallback...
 *
 * Los WebSockets tienen la ventaja de que habra mucho menos overhead
 *
 *
 *
 * Un bloque de mensajes va entre los carácteres 2 (STX) y 3 (ETX) y cada
 * mensaje dentro, igual
 * 
 * |2|2|mensaje|3|2|mensaje|3|2|mensaje|3|3|
 * 
 */

var isConsoleDefined;
try{
	if(console === undefined) {
		isConsoleDefined = false;
	} else {
		isConsoleDefined = true;
	}
} catch (e) {
	isConsoleDefined = false;
}
var console = console || {};

//if(console === undefined) {

if(!isConsoleDefined) {
	
	var podemosReferenciarWindow = true;
	try {
		var a  = window;
	} catch (e) { // WTF Samsung? ReferenceError: Can't find variable: window
		podemosReferenciarWindow = false;
	}
	
	if(podemosReferenciarWindow && window && window.self && window.self.console) {
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
            info: function () {
                postMessage({
                    isConsole: true,
                    level: "info",
                    msg: arguments[0]/*,
					            args: JSON.stringify(arguments)*/
                });
            },
			warn: function() {
			    var stack = new Error().stack;
                var msg = (stack ? arguments[0] + "[TRACE:\n" + stack + "]" : arguments[0])
				postMessage({
					isConsole: true,
					level: "warn",
					msg: msg/*,
					args: arguments*/
				});
			},
			error: function() {
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

console.log("[ALARMAS]: test");

// El DOMParser no esta disponible desde workers
importScripts("xml_for_script/tinyxmlw3cdom.js", "xml_for_script/tinyxmlsax.js");
Dnv.encoder = (function() {

	return {
		codificar: function codificar(msg) {
				return msg; // FIXME: habilitar codificacion?
		},
		
		descodificar: function descodificar(msg) {
				return msg; // FIXME: habilitar codificacion?
		}
	};
})();

/*
function test(w) {
	
	if (w != Dnv.encoder.descodificar(Dnv.encoder.codificar(w))) {
		console.log("fail "+w+" '"+Dnv.encoder.codificar(w)+"'"+" '"+Dnv.encoder.descodificar(Dnv.codificador.codificar(w))+"'");
	} else {
		console.log(w+" "+Dnv.encoder.codificar(w));
	}
}

test("un");
test("dos");
test("avión");
test("eñe");
test("uno");
test("uno");
test("uno");
*/
		
//Dnv.CFG_URL_ALARMAS = "/testAlarmas.html";
//Dnv.CFG_URL_ALARMAS = "http://pruebascesara2.iconmultimedia.com:8082/dump_inicioalarmas.bin";
//rag Dnv.CFG_URL_ALARMAS = "http://192.168.13.49:6007/";
/*
 * CAR: Revisar... si esto funciona es porque el dispositivo ya estaba configurado, o porque el worker se instancia siempre en dispositivos configurados
 * ¿desde un worker se puede acceder a local storage? ¿Dnv.cfg esta importado?
 */

Dnv.CFG_URL_ALARMAS = null; //"http://192.168.13.49:6007/";

Dnv.alarmas = (function () {



    function setEstadoConectividadAlarmas(msg) {
        postMessage({
            isConsole: false,
            isEstadoConectividadAlarmas: true,
            estado: msg,
            msg: msg
        });


    }

    var colaMensajes = [];
    var ultimoMensaje = null;
    var ultimosEstados = {};

    var xhr = new XMLHttpRequest();

    var _loguearMensajesErrorRed = true;

    var errorHandler = function errorHandler(e) {
        setEstadoConectividadAlarmas("HTTP error: " + xhr.status + " " + xhr.statusText);
        if (_loguearMensajesErrorRed) {
            console.error("[ALARMAS]: ERROR (HTTP STATUS: " + xhr.status + " " + xhr.statusText + "): " + e);
        }
    }
    var timeoutHandler = function timeoutHandler(e) {
        setEstadoConectividadAlarmas("Timeout");
        if (_loguearMensajesErrorRed) {
            console.warn("[ALARMAS]: TIMEOUT: " + e);
        }
    }

    xhr.ontimeout = timeoutHandler;
    xhr.onerror = errorHandler;
    try {
        xhr.timeout = 20 * 1000;
    } catch (e) {
        // Desde el worker no tenemos acceso al contexto de la pagina
        // Es decir, para acceder a monitor, tenemos que importarlo
        // Dnv.monitor.writeLogFile("[ALARMAS] Error XHR " + e.toString(), LogLevel.Error);
        // console.* estan redefinidos para que los maneje pa página principal
        if (e.name === "InvalidStateError") {
            console.warn("[ALARMAS] No se pudo definir el timeout del XHR de alarmas ¿bug de IE? ");
        } else {
            throw e;
        }
    }

    // Para HTML5 no habrá varios remitentes, solo el player 
    var REMITENTES = {
        PLAYER: 0,
        MANAGER: 1,
        CLOUD: 2,
        SALIDA: 3,
        PANTALLA: 4
    };

    var idsRemitentes = [];

    var getNow = function getNow() {
        var ahora = new Date();
        var f = function (n) { return (n < 10 ? "0" + n : n); };
        return "" + f(ahora.getUTCDate()) + "/" + f(ahora.getUTCMonth() + 1) + "/" + f(ahora.getUTCFullYear()) + " " + f(ahora.getUTCHours()) + ":" + f(ahora.getUTCMinutes()) + ":" + f(ahora.getUTCSeconds())
        //return "" + f(ahora.getUTCMonth() + 1) + "/" + f(ahora.getUTCDate()) + "/" + f(ahora.getUTCFullYear()) + " " + f(ahora.getUTCHours()) + ":" + f(ahora.getUTCMinutes()) + ":" + f(ahora.getUTCSeconds())
    };

    var isInicializando = false;
    var init = function init(codigoDispositivo) {
        if (Dnv.CFG_URL_ALARMAS === null) return; // Aún no hay url

        isInicializando = true;
        //var exito = true;

        //var codigoDispositivo = Dnv.cfg.getCfgInt("info_code", 0);

        var msgs = [
			"7777;" + codigoDispositivo + ";" + getNow(),
			"GETXML|" + codigoDispositivo,
		];

        var body = "\x02";
        for (var i = 0; i < msgs.length; i++) {
            body += "\x02" + Dnv.encoder.codificar(msgs[i]) + "\x03";
        }
        body += "\x03";

        /* fallara la fecha if(codigoDispositivo == 4132) {
        console.assert(body === "\x02\x02\x35\x41\x32\x38\x33\x43\x31\x39\x33\x46\x31\x30\x38\x44\x31\x37\x33\x43\x42\x31\x31\x37\x41\x42\x39\x33\x32\x41\x32\x31\x41\x44\x39\x45\x46\x42\x32\x42\x41\x33\x30\x36\x36\x39\x41\x42\x43\x43\x43\x45\x44\x39\x37\x43\x35\x37\x43\x42\x41\x42\x44\x32\x44\x35\x03\x02\x43\x44\x36\x34\x39\x30\x32\x41\x41\x38\x44\x32\x30\x45\x41\x43\x33\x36\x34\x36\x35\x36\x43\x42\x38\x41\x41\x35\x41\x31\x46\x37\x03\x03",
        "El body no coincide "+body );
        }*/

        try {

            xhr.open("post", Dnv.CFG_URL_ALARMAS, false); // Síncrono

            //xhr.send(msg);
            xhr.send(body);
        } catch (e) {
            if (_loguearMensajesErrorRed) {
                console.error("[ALARMAS]: Error enviando alarmas a " + Dnv.CFG_URL_ALARMAS + ": " + e);
            }
            setEstadoConectividadAlarmas("Error");
            // Dnv.monitor.writeLogFile("[ALARMAS]: Error enviando alarmas " + e, LogLevel.Error);
            isInicializando = false;
            return false;
        }
        if (xhr.status !== 200) {
            setEstadoConectividadAlarmas("HTTP error: " + xhr.status + " " + xhr.statusText);

            if (_loguearMensajesErrorRed) {
                console.warn("[ALARMAS]: No se pudo iniciar la conexión con alarmas: Status " + xhr.status + " " + xhr.statusText + " | Response:" + xhr.response);
            }
            console.log("[ALARMAS]: Response " + xhr.responseText);
            isInicializando = false;
            return false;
            /*} else if (!CFG_CIFRAR && !xhr.responseXML){ //Si va cifrado:<- No, hay que decodificar
            console.warn("No se pudo iniciar la conexión con alarmas: No nos devolvieron un XML: Status: "+xhr.status+" "+xhr.statusText+" | Response:"+xhr.response);
            console.log("Status "+xhr.response);
            return false;
            */
        } else {
            setEstadoConectividadAlarmas("OK");
            var text = xhr.responseText;
            if (CFG_CIFRAR) {
                if (text[0] !== "\x02" || text[1] !== "\x02" || text[text.length - 2] !== "\x03" || text[text.length - 1] !== "\x03") {
                    console.warn("[ALARMAS]: La respuesta de inicio de conexión con alarmas no está en el formato esperado: Status " + xhr.status + " " + xhr.statusText + " | Response:" + xhr.response);
                    isInicializando = false;
                    return false;
                }
            }

            try {
                var doc;
                if (CFG_CIFRAR) {
                    text = Dnv.encoder.descodificar(text.slice(2, -2));
                    //console.log("ALARMAS: Response "+xhr.responseText);
                    console.log("[ALARMAS]: Response " + text);

                    var parser = new DOMImplementation();
                    var gobjDatabaseDom = parser.loadXML(text);
                    doc = gobjDatabaseDom.getDocumentElement();
                } else {
                    if (xhr.responseXML) {
                        doc = xhr.responseXML
                    } else {

                        var parser = new DOMImplementation();
                        var gobjDatabaseDom = parser.loadXML(text);
                        doc = gobjDatabaseDom.getDocumentElement();
                    }
                }

                //var doc = new DOMParser().parseFromString(text, "application/xml");
                idsRemitentes[REMITENTES.PLAYER] = codigoDispositivo;
                /**
                idsRemitentes[REMITENTES.MANAGER] = parseInt(doc.getElementsByTagName("DenevaManager").item(0).getElementsByTagName("codigo").item(0).firstChild.toString(), 10);
                idsRemitentes[REMITENTES.CLOUD] = parseInt(doc.getElementsByTagName("DenevaCloud").item(0).getElementsByTagName("codigo").item(0).firstChild.toString(), 10);

                if (doc.getElementsByTagName("SalidaMonitoresTactil").length > 0) {
                idsRemitentes[REMITENTES.SALIDA] = parseInt(doc.getElementsByTagName("SalidaMonitoresTactil").item(0).getElementsByTagName("codigo").item(0).firstChild.toString(), 10);
                idsRemitentes[REMITENTES.PANTALLA] = parseInt(doc.getElementsByTagName("PantallaTactil").item(0).getElementsByTagName("codigo").item(0).firstChild.toString(), 10);
                } else {
                idsRemitentes[REMITENTES.SALIDA] = parseInt(doc.getElementsByTagName("SalidaPantalla").item(0).getElementsByTagName("codigo").item(0).firstChild.toString(), 10);
                idsRemitentes[REMITENTES.PANTALLA] = parseInt(doc.getElementsByTagName("Pantalla").item(0).getElementsByTagName("codigo").item(0).firstChild.toString(), 10);
                }
                **/
            } catch (e) {
                setEstadoConectividadAlarmas("Invalid response");
                if (_loguearMensajesErrorRed) {
                    console.error("[ALARMAS]: Error al parsear la respuesta del servidor al inicializar alarmas: Status " + xhr.status + " " + xhr.statusText + " | Response:" + xhr.response);
                }
                // Dnv.monitor.writeLogFile("[ALARMAS]: Error al parsear la respuesta del servidor al inicializar alarmas: Status " + xhr.status + " " + xhr.statusText + " | Response:" + xhr.response, LogLevel.Error);
                //console.dir(e);
                isInicializando = false;
                return false;
            }
            isInicializando = false;
            return true;
        };

    };
    //console.log("ALARMAS: Init "+init());

    var getMsg = function getMsg(remitente, estado, mensaje) {

        //console.log("ALARMAS: Ids "+ JSON.stringify(idsRemitentes));
        // idsRemitentes puede no estar inicializado
        return {
            fecha: getNow(),
            remitente: remitente,
            estado: estado,
            mensaje: mensaje
        };
    };
    var construirMsg = function getMsg(msg) {
        if (idsRemitentes.length === 0) console.error("Los ids de dispositivos para alarmas no estan inicializados");

        console.log("[ALARMAS]: Ids " + JSON.stringify(idsRemitentes));
        // FIXME: y si el id no esta disponible?

        return Dnv.encoder.codificar(msg.fecha + "|" + idsRemitentes[msg.remitente] + "|" + msg.estado + "|" + msg.mensaje);

    };
    /*
    var enviarAlarma = function enviarAlarma(remitente, nivel, estado, mensaje) {
		
    var ahora = new Date();
    var fecha = ""+ahora.getUTCDate()+"/"+(ahora.getUTCMonth()+1)+"/"+ahora.getUTCFullYear()+" "+ahora.getUTCHours()+":"+ahora.getUTCMinutes()+":"+ahora.getUTCSeconds()
    var msg = fecha+";"+remitente+";"+estado+";"+mensaje
    enviarMsgAlarma(getMsg(remitente, nivel, estado, mensaje));
    }
    */
    var enviarMsgAlarma = function enviarMsgAlarma(msg) {
        //var exito = true;

        var body = "\x02";
        if (msg instanceof Array) {
            for (var i = 0; i < msg.length; i++) {
                body += "\x02" + construirMsg(msg[i]) + "\x03";
            }
        } else {
            body += "\x02" + construirMsg(msg) + "\x03";
        }
        body += "\x03";

        try {
            xhr.open("post", Dnv.CFG_URL_ALARMAS, false); // Síncrono
            xhr.setRequestHeader('Content-type', 'text/plain; charset=UTF-8');
            construirMsg("body " + body);
            //xhr.send(msg);
            xhr.send(body);
        } catch (e) {
            if (_loguearMensajesErrorRed) {
                console.error("[ALARMAS]: Error enviando alarmas " + e);
            }
            setEstadoConectividadAlarmas("Error");
            // Dnv.monitor.writeLogFile("[ALARMAS]: Error enviando alarmas " + e, LogLevel.Error);
            return false;
        }
        if (xhr.status !== 200) {
            if (_loguearMensajesErrorRed) {
                console.warn("[ALARMAS]: No se pudo enviar la alarma: Status " + xhr.status + " " + xhr.statusText);
                console.log("[ALARMAS]: Status " + xhr.responseText);
            }
            setEstadoConectividadAlarmas("HTTP error: " + xhr.status + " " + xhr.statusText);
            return false;
        } else {
            setEstadoConectividadAlarmas("OK");
            return true;
        }

    };

    var enviarPendientes = function enviarPendientes() {
        if (idsRemitentes.length === 0) {
            if (!isInicializando) {
                console.warn("[ALARMAS]: Los ids de dispositivos para alarmas aún no estan inicializados, intentamos inicializarlos");
                init(_codDispositivo);
            } else {
                console.warn("[ALARMAS]: Los ids de dispositivos para alarmas aún no estan inicializados");
            }
            return false;
        }
        if (colaMensajes.length == 0) {
            if (ultimoMensaje) {
                // Reenviamos para señalar que seguimos online
                console.info("[ALARMAS] Reenviando el último estado");
                return enviarMsgAlarma(ultimoMensaje);
            }

        } else {

            console.info("[ALARMAS] Enviando cola de mensajes: " + JSON.stringify(colaMensajes));
            if (enviarMsgAlarma(colaMensajes)) {
                // Enviado con éxito, vaciamos la cola

                while (colaMensajes.length > 0) {
                    colaMensajes.shift();
                }
                return true;
            }
        }
        return false;
        /*
        while(colaMensajes.length > 0) {
        var msg = colaMensajes.shift();
        if(!enviarMsgAlarma(msg)) {
        // No hay conectividad...
        colaMensajes.unshift(msg);
        return false;
        }
        }
        return true;*/
    };

    var enviarAlarmas = function enviarAlarma(alarmas) {

        //var msgs = [];

        var ultimoEstado = ultimosEstados[REMITENTES.PLAYER];


        for (var i = 0; i < alarmas.length; i++) {

            if (ultimoEstado && ultimoEstado.estado == alarmas[i].estado && ultimoEstado.mensaje == alarmas[i].mensaje) {
                console.warn("Ignoramos alarma igual al anterior: " + alarmas[i].mensaje);
                continue;
            }

            ultimosEstados[REMITENTES.PLAYER] = { estado: alarmas[i].estado, mensaje: alarmas[i].mensaje };

            var msg = getMsg(
            //alarmas[i].remitente,
					REMITENTES.PLAYER,
					alarmas[i].estado,
					alarmas[i].mensaje
				);
            colaMensajes.push(msg);
            ultimoMensaje = msg;

            console.log("Pendientes: " + JSON.stringify(colaMensajes));
        }

        if (colaMensajes.length > 0) {
            if (!enviarPendientes() && _loguearMensajesErrorRed) {
                console.warn("[ALARMAS]: No hay conexión de alarmas.");
            }
        }
    };


    /**
    * En HTML5 no se usaran distintos remientes, solo el del player
    */
    var enviarAlarma = function enviarAlarma(estado, mensaje) {
        enviarAlarmaConRemitente(REMITENTES.PLAYER, estado, mensaje);
    };

    var enviarAlarmaConRemitente = function enviarAlarmaConRemitente(remitente, estado, mensaje) {
        var ultimoEstado = ultimosEstados[remitente];
        if (ultimoEstado && ultimoEstado.estado == estado && ultimoEstado.mensaje == mensaje) {
            console.warn("Ignoramos alarma igual al anterior: " + mensaje);
            return;
        }
        ultimosEstados[remitente] = { estado: estado, mensaje: mensaje };


        var msg = getMsg(remitente, estado, mensaje);

        colaMensajes.push(msg);
        ultimoMensaje = msg;

        if (!enviarPendientes() && _loguearMensajesErrorRed) {
            console.warn("[ALARMAS]: No hay conexión de alarmas.");
        }


        /*
        if(enviarPendientes()) {
        console.log("Enviando "+mensaje);
        if(!enviarMsgAlarma(msg)) {
        console.warn("No hay conexión de alarmas.");
        colaMensajes.push(msg);
        }
        } else { // No nos molestamos en reintentar, además, asi no nos saltamos el orden de los mensajes
        console.warn("No hay conexión de alarmas.");
        colaMensajes.push(msg);
        }
        */
    };

    var timerId;
    var _codDispositivo;
    var _urlAlarmas;

    var detener = function detener() {
        if (timerId) {
            console.log("[ALARMAS]: Detenemos el reenvio del buffer de alarmas");
            clearInterval(timerId);
            timerId = undefined;
        }
    };
    var comenzar = function comenzar(codDispositivo, urlAlarmas, temporizacion) {
        detener();
        console.log("[ALARMAS]: comenzar - codDispositivo: " + codDispositivo);
        console.log("[ALARMAS]: Comenzamos el reenvio del buffer de alarmas");

        _codDispositivo = codDispositivo;
        _urlAlarmas = urlAlarmas;

        setUrlAlarmas(urlAlarmas);

        if (idsRemitentes.length == 0) init(codDispositivo);

        console.log("[ALARMAS]: Comenzamos el reenvio del buffer de alarmas cada: " + temporizacion + " ms");
        /**
        function sendAlarmas() {
            enviarPendientes();
            timerId = setTimeout(sendAlarmas, Dnv.utiles.getIntervalPeticionDeterminista(Dnv.cfg.getCfgInt("MyOwnCode", 0), temporizacion));
        }
        **/
        //setTimeout(sendAlarmas, temporizacion*1000);
        timerId = setInterval(enviarPendientes, temporizacion*1000);
    };

    var setUrlAlarmas = function setUrlAlarmas(urlAlarmas) {
        console.log("[ALARMAS]: setUrlAlarmas " + urlAlarmas);
        Dnv.CFG_URL_ALARMAS = urlAlarmas;
    };

    var onCambioEstadoConectividad = function onCambioEstadoConectividad(hayConectividad) {
        _loguearMensajesErrorRed = hayConectividad;
    };

    return {
        enviarPendientes: enviarPendientes,
        enviarAlarmas: enviarAlarmas,
        enviarAlarma: enviarAlarma,
        comenzar: comenzar,
        detener: detener,
        setUrlAlarmas: setUrlAlarmas,
        onCambioEstadoConectividad: onCambioEstadoConectividad
    };
})();


self.addEventListener('message', function (e) {
    console.log("[ALARMAS] Mensaje " + e.data.comando);
    postMessage("[ALARMAS] Recibido " + JSON.stringify(e.data));


    var comando = e.data.comando;
    switch (comando) {
        case "comenzar":
            Dnv.alarmas.comenzar(e.data.codDispositivo, e.data.urlAlarmas, e.data.temporizacion);
            break;
        //case "setIpMaster":       
        case "detener":
            Dnv.alarmas.detener();
            break;
        case "enviarMensajes":
            Dnv.alarmas.enviarAlarmas(e.data.mensajes);
            break;
        case "cambioEstadoConectividad":
            Dnv.alarmas.onCambioEstadoConectividad(e.data.hayConectividad);
            break;
        default:
            console.error("[ALARMAS] Mensaje desconocido " + JSON.stringify(e.data));
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