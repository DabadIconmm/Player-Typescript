"use strict";
var Dnv = Dnv || {};

/*

    Anteriormente:
        Se hace una petición a GetPIDByIDPlayerJS para comprobar si estamos enlazados (EID / PID). 
        si no estamos enlazados indica que no nos han configurado todavía o si estamos configurados que quieren que nos configuremos.
        si ya estábamos configurados navegamos a página de configuración
        si no lo estamos, segumos esperando hasta que se asigne un player en la web.
    
    Ahora:    
        Si no estamos configurados, se hace una petición a GetPIDByIDPlayerJS para comprobar si ya estamos enlazados (EID / PID). 
        No volvemos a hacer la comprobación


*/


//importScripts("crypto-js/md5.js", "crypto-js/tripledes.js");
// El DOMParser no esta disponible desde workers
//importScripts("xml_for_script/tinyxmlw3cdom.js", "xml_for_script/tinyxmlsax.js");


Dnv.licencias = (function () {

    var timerId;
    var timerIdSinLicencia;
    var timerIdConLicencia;
    var intervaloTimerMsecs;
    var INTERVALO_CONFIGURADO_POR_DEFECTO = 10 * 60 * 1000; // Que pida de cuando en cuando, para no llenar los logs del servidor
    var INTERVALO_NO_CONFIGURADO_POR_DEFECTO = 30 * 1000; // Que pida continuamente para detectar si el usuario lo configura en la web
    function _reprogramarTimerLicencias() {
        var msecs = Dnv.cfg.getCfgInt("SegundosTimerSincronzar", 0) * 1000;
        if (msecs === 0) {
            msecs = (Dnv.cfg.getConfigurado() ? INTERVALO_CONFIGURADO_POR_DEFECTO : INTERVALO_NO_CONFIGURADO_POR_DEFECTO);
        }
        if (msecs != intervaloTimerMsecs) {
            intervaloTimerMsecs = msecs;
            timerId = setInterval(Dnv.licencias.comprobarLicencia, msecs);
        }
    }

    //TODO: RAG

    // getConfigProtocolServer puyede no ester inicializado. Se reinicializa al iniciar los timers
    var urlServer = Dnv.cfg.getCfgString("WebServiceURL", Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getConfigIpServer() + "/WSResources/RemoteResources.asmx");
    


    //todo: revisar la implementación para cada dispositivo
    var _obtenerMAC = function _obtenerMAC() {
        //mac address
        console.log("_obtenerMAC...");
        //return Dnv.deviceInfo.getMacAddress();
        return "_obtenerMAC";
    };

    var _obtenerHardwareVersion = function _obtenerHardwareVersion() {
        console.log("_obtenerHardwareVersion...");
        //return Dnv.deviceInfo.getSerialNumber();
        return "_obtenerHardwareVersion";
    };

    var _obtenerModelName = function _obtenerModelName() {
        console.log("_obtenerModelName...");
        //return Dnv.deviceInfo.getSerialNumber();
        return "_obtenerModelName";
    };

    var _obtenerSerialNumber = function _obtenerSerialNumber() {
        console.log("_obtenerSerialNumber...");
        //return Dnv.deviceInfo.getSerialNumber();
        return "_obtenerSerialNumber";
    };
    var _razonErrorLicencia = undefined;

    return {

        getRazonErrorLicencia: function () {
            return _razonErrorLicencia;
        },
        isLicenciaValida: function isLicenciaValida() {

            //if (!CHECKLICENCIAS) return true;
            console.log("[LICENCIAS] Validez de licencia: " + Dnv.cfg.getValidezLicencia() + " " + new Date(Dnv.cfg.getValidezLicencia()));
            if (Dnv.cfg.getValidezLicencia() > new Date().getTime()) {
                return true;
            }


            /*if (Dnv.cfg.getConfigurado()) {
            console.warn("[LICENCIAS] La licencia no parece valida, pero omitimos la comprobacion");
            return true;
            }*/
            return false;
        },

        obtenerLicencia: function obtenerLicencia(callback, errorCallback) {
            console.log("[LICENCIAS]: obtenerLicencia");
            var url = Dnv.cfg.getCfgString("LicencesClientEndPointAddressWeb", Dnv.cfg.getDefaultWcfServerAddress() + "/Licencias/WebSolicitudes") + "/GetLicence";

            var errorManejado = false;
            function errRedHandler(e) {
                if (errorManejado) return; // No lo manejamos 2 veces
                errorManejado = true;

                Dnv.systemInfo.setEstadoConectividadLicencia("Error");

                // Parece que no podemos contactar con el servidor, miramos si tenemos una licencia en disco

                console.error("[LICENCIAS] Error (licencias): " + e);
                //console.trace();

                if (!Dnv.licencias.isLicenciaValida() && Dnv.cfg.getConfigurado()) {
                    //paramos la presentación
                    Dnv.cfg.setValidezLicencia(0);
                    console.warn("[NAVEGACION] NO tenemos licencia válida.");
                    try { // Avisamos solo si no tenemos licencia
                        _razonErrorLicencia = e;
                        Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.ERROR, "Licencia NO válida: " + e);
                    } catch (e) { };
                    if (Dnv.cfg.getCfgBoolean("Salida_CheckLicenciaDeneva", true)) {
                        Main.navegarSinLicencia();
                    }
                }

                if (errorCallback) errorCallback("Error (licencias): " + e);
            }


            function errLicenciaHandler(e) {
                if (errorManejado) return; // No lo manejamos 2 veces
                errorManejado = true;

                // Parece que no podemos contactar con el servidor, miramos si tenemos una licencia en disco

                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[LICENCIAS] Error (licencias): " + e);
                }

                //console.trace();

                if (!Dnv.licencias.isLicenciaValida() && Dnv.cfg.getConfigurado()) {
                    //paramos la presentación
                    Dnv.cfg.setValidezLicencia(0);
                    console.warn("[NAVEGACION] NO tenemos licencia válida.");
                    try { // Avisamos solo si no tenemos licencia
                        _razonErrorLicencia = e;
                        Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.ERROR, "Licencia NO válida: " + e);
                    } catch (e) { };
                    if (Dnv.cfg.getCfgBoolean("Salida_CheckLicenciaDeneva", true)) {
                        Main.navegarSinLicencia();
                    }
                }

                if (errorCallback) errorCallback("Error (licencias): " + e);
            }



            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        Dnv.systemInfo.setEstadoConectividadLicencia("OK");
                        console.log("[LICENCIAS]: Respuesta a la peticion de licencia: " + this.response);

                        try {
                            //if (callback) {
                            if (this.response && this.response.indexOf(";;") == -1) {

                                var encLic = this.responseXML.firstChild.firstChild.firstChild.nodeValue;
                                console.log("[LICENCIAS]: recibida licencia: " + encLic);

                                var lic = Dnv.encoder.descodificar(encLic);

                                var elems = lic.split(String.fromCharCode(255));
                                var validez = elems[elems.length - 1];

                                //TODO: comparar con el hardware actual

                                var formattedDate = Dnv.utiles.stringToTimestamp(validez);

                                console.info("[LICENCIAS]: validez licencia = " + validez + " : " + formattedDate.getTime());

                                var forzarNavegacion = false;

                                if (Dnv.cfg.getValidezLicencia() == 0) {
                                    forzarNavegacion = true;
                                }

                                Dnv.cfg.setValidezLicencia(formattedDate.getTime());

                                if (Dnv.licencias.isLicenciaValida()) {
                                    _razonErrorLicencia = undefined;
                                    if (forzarNavegacion) {
                                        console.log("[LICENCIAS]: La licencia es válida, navegamos a siguente.");
                                        try {
                                            Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.OK, "Licencia válida.");
                                        } catch (e) { };
                                        Dnv.cfg.cargarCfg();

                                        Main.iniciarTimerPlaylist();
                                        forzarNavegacion = false;

                                        Dnv.presentador.continuarPresentacion();
                                        //Dnv.presentador.avanzarSlide(document.getElementById("wrapper"));
                                    }
                                    if (callback) callback(this.response);
                                } else {
                                    console.warn("[LICENCIAS]: La licencia no es válida o está caducada");
                                    errLicenciaHandler("[LICENCIAS]: La licencia no es válida o está caducada");
                                }
                            } else {
                                if (this.responseXML && this.responseXML.firstChild && this.responseXML.firstChild.firstChild) {

                                    //el mensaje es algo así: ;;TEXT;;Error. Ha expirado la vigencia
                                    /*
                                    * En caso de error, el servidor devuelve sin cifrar: 
                                    * ";;TEXT;;Error xxxxxxxxxx" (Mensaje de error empieza por "Error") En caso de que la empresa no exista, no queden licencias...
                                    * ";;TEXT;;ERROR;;Error al procesar la solicitud de licencia" En caso de excepcion al generar la licencia
                                    * ";;ERROR;;" Creo que no se puede dar este caso
                                    * "ERROR;;" Creo que si se puede dar este caso
                                    * "" Si hubo un error en el servicio WCF
                                    */
                                    var mensaje = "";
                                    if (this.responseXML.firstChild.firstChild.firstChild) {
                                        mensaje = this.responseXML.firstChild.firstChild.firstChild.nodeValue;
                                    }
                                    if (mensaje.indexOf(";;TEXT;;Error") === 0) {
                                        console.warn("[LICENCIAS]: Hay algún error con la licencia (" + this.response + ")");
                                        //invalidamos la licencia

                                        //RAG : comentar. Pruebas samsung...
                                        //Dnv.cfg.resetConfig();  //reseteamos la configuración
                                        //Main.navigateToConfigure();

                                        if (Dnv.cfg.getValidezLicencia() != 0) {
                                            Dnv.cfg.setValidezLicencia(0);
                                        }
                                    } else if (mensaje.indexOf(";;TEXT;;ERROR;;") === 0 || mensaje.indexOf(";;ERROR;;") === 0 || mensaje.indexOf("ERROR;;") === 0) {
                                        console.warn("[LICENCIAS]: Hubo un error en el servidor a la hora de generar la licencia.");
                                    } else if (mensaje === "") { // Excepcion en el servidor
                                        console.warn("[LICENCIAS]: Recibida respuesta vacia, error en el servidor.");
                                    }

                                    errLicenciaHandler(mensaje.split(";;")[2]);
                                } else {
                                    errLicenciaHandler("[LICENCIAS]: No se recibió licencia o licencia incorrecta. Respuesta = " + this.response);
                                }
                            }
                            //}
                        } catch (e) {
                            errRedHandler(e.message);
                        }
                    } else {
                        errRedHandler("Error HTTP: " + this.statusText); // Estrictamente no es error de red, pero bueno
                        Dnv.systemInfo.setEstadoConectividadLicencia("HTTP error: " + this.status + " " + this.statusText);
                    }
                }
            }

            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errRedHandler;
            client.timeout = 45000;
            client.ontimeout = function () {
                errRedHandler("Timed out al pedir licencias!!!");
                Dnv.systemInfo.setEstadoConectividadLicencia("Timeout");
            }

            console.log("[LICENCIAS]: obtenemos datos hardware..");

            var mac = Dnv.deviceInfo.mac_wired();
            if (Main.info.engine === "TIZEN") {
                /*
                 * Las versiones antiguas de Tizen usan la mac en uso en lugar de forzar la mac cableada.
                 * Por compatibilidad con versiones antiguas de Deneva (y casos de reconfiguración y demás),
                 * en Tizen usamos la mac en uso, si no hay una definida.
                 */
                if (Dnv.cfg.getMacLicencia() === undefined) {
                    mac = Dnv.deviceInfo.mac(); // La mac en uso
                    Dnv.cfg.setMacLicencia(mac);
                } else {
                    // Ya estabamos usando una, la seguimos usando por si nos cambian de wifi a cable
                    mac = Dnv.cfg.getMacLicencia();
                }
            }

            // A veces la mac no esta disponible segun arrancamos (LG 86UH5C) Asi que se almacena para usarla como fallback
            if (!mac || mac.indexOf(':') < 0) {
                mac = Dnv.cfg.getMacLicencia();
            } else {
                Dnv.cfg.setMacLicencia(mac);
            }
            var msgLic = Dnv.cfg.getConfigEID() + String.fromCharCode(255) + mac + String.fromCharCode(255) + Dnv.deviceInfo.serialNumber() + String.fromCharCode(255) + Dnv.deviceInfo.modelName() + String.fromCharCode(255) + Dnv.deviceInfo.hardwareVersion();

            console.log("[LICENCIAS]: Pidiendo licencias");
            console.log("[LICENCIAS]: PID " + Dnv.cfg.getConfigPID());
            console.log("[LICENCIAS]: EID " + Dnv.cfg.getConfigEID());
            console.log("[LICENCIAS]: wiredmac " + Dnv.deviceInfo.mac_wired());
            console.log("[LICENCIAS]: wifimac " + Dnv.deviceInfo.mac_wifi());

            var msgLicEnc = Dnv.encoder.codificar(msgLic);

            var xml = '<GetLicence xmlns="http://tempuri.org/"><PID>' + Dnv.cfg.getConfigPID() + '</PID><Solicitud>' + msgLicEnc + '</Solicitud></GetLicence>'

            client.open("POST", url);

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');


            client.send(xml);
        },

        detenerTimerLicencias: function detenerTimerLicencias() {
            if (timerIdSinLicencia) {
                console.log("[LICENCIAS]: Detenemos el timer de licencias (sin licencia valida)");
                clearInterval(timerIdSinLicencia);
                timerIdSinLicencia = undefined;
            }

            if (timerIdConLicencia) {
                console.log("[LICENCIAS]: Detenemos el timer de licencias (con licencia valida)");
                clearInterval(timerIdConLicencia);
                timerIdConLicencia = undefined;
            }
        },

        iniciarTimerLicencias: function iniciarTimerLicencias() {
            // Puede que getConfigProtocolServer no estuviera correctamente inicializado
            urlServer = Dnv.cfg.getCfgString("WebServiceURL", Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getConfigIpServer() + "/WSResources/RemoteResources.asmx");

            Dnv.licencias.detenerTimerLicencias();
            Dnv.licencias.comprobarLicencia();
            //console.log("[LICENCIAS]: Comenzamos el reenvio de peticiones de licencias cada 30 segundos");
            //timerIdSinLicencia = setInterval(Dnv.licencias.comprobarLicencia, Dnv.cfg.getCfgString("SegundosTimerSincronzar", 30 * 1000));
        },



        ////////////////////
        /*
        getPIDByIDPlayerJS: function getPIDByIDPlayerJS(callback, errorCallback) {

        function errHandlerPID(e) {
        console.error("[LICENCIAS]: Error al pedir getPIDByIDPlayerJS: " + e);
        if (errorCallback) errorCallback();
        }

        function sucessHandler(response) {
        console.log("[LICENCIAS]: Respuesta a la peticion de getPIDByIDPlayerJS: " + response);
        try {
        //if (callback) {

        if (response == "") {
        console.log("[LICENCIAS]: Respuesta vacía a la peticion de getPIDByIDPlayerJS");
        errHandlerPID();
        //alert("getPIDByIDPlayerJS response vacío");
        return;
        }

        /*if (response.indexOf("ERROR") != -1) {
        console.warn("[LICENCIAS]: Error al obtener la licencia: " + response);

        Dnv.cfg.setValidezLicencia(0);
        Main.navegarSinLicencia();
        errHandlerPID(response);
        //RAG :comprobar versión ws. (no habría que reconfigurar...)
        //Dnv.cfg.resetConfig();g  //reseteamos la configuración
        //Main.navigateToConfigure();
        return;
        }* /

        if (Dnv.cfg.getConfigPID() + "[]" + Dnv.cfg.getConfigEID() != response) {
        console.warn("[LICENCIAS]: No estamos vinculados. " + Dnv.cfg.getConfigPID() + "[]" + Dnv.cfg.getConfigEID() + " != " + response);
        if (Dnv.cfg.getConfigurado()) { //estabamos configurados
        console.warn("[LICENCIAS]: *************** Reseteamos la configuración ***************");

        Dnv.cfg.resetConfig();  //reseteamos la configuración
        Main.navigateToConfigure();
        return;
        }
        } else {
        console.info("[LICENCIAS]: vinculado correctamente");
        }

        if (response) {
        if (callback) callback(response);
        } else {
        errHandlerPID("[LICENCIAS]: No se recibió getPIDByIDPlayerJS");
        }

        } catch (e) {
        errHandlerPID(e);
        }
        }

        Dnv.servidor.getPIDByIDPlayerJS(sucessHandler, errHandlerPID);
        },
        */
        comprobarLicencia: function comprobarLicencia() {
            console.log("[LICENCIAS]: comprobarLicencia..");

            Dnv.licencias.obtenerLicencia();

            console.log("[LICENCIAS]: Comenzamos el reenvio de peticiones de licencias");

            if (Dnv.licencias.isLicenciaValida()) {
                if (!timerIdConLicencia) {
                    Dnv.licencias.detenerTimerLicencias();
                    var segundos = Dnv.cfg.getCfgString("SegundosTimerLicencia_ConValida", 8 * 3600);
                    timerIdConLicencia = setInterval(Dnv.licencias.comprobarLicencia, segundos * 1000);
                    console.log("[LICENCIAS]: Comprobación establecida cada: " + segundos + " segundos al tener licencia valida");
                }
            } else {
                if (!timerIdSinLicencia) {
                    Dnv.licencias.detenerTimerLicencias();
                    var segundos = Dnv.cfg.getCfgString("SegundosTimerLicencia_SinValida", 60);
                    timerIdSinLicencia = setInterval(Dnv.licencias.comprobarLicencia, segundos * 1000);
                    console.log("[LICENCIAS]: Comprobación establecida cada: " + segundos + " segundos al no tener licencia valida");
                }
            }

            /*
            Dnv.licencias.getPIDByIDPlayerJS(function () {
            console.log("[LICENCIAS]: respuesta ok de getPIDByIDPlayerJS..");
            Dnv.licencias.obtenerLicencia();
            }, function errorCb() {
            console.error("[LICENCIAS]: No podemos comprobar la licencia porque no nos devolvieron el PID");
            Dnv.systemInfo.setEstadoConectividadLicencia("Error getting current PID");
            });
            */
        }

    };
})();