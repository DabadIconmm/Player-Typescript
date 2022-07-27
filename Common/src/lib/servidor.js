
"use strict";

var Dnv = Dnv || {};

Dnv.servidor = (function () {
    /*
    * 
    * http://msdn.microsoft.com/en-us/library/ms256131%28v=vs.110%29.aspx
    * http://www.w3schools.com/schema/schema_dtypes_date.asp
    * http://www.w3.org/TR/xmlschema-2/
    * 
    */

    var protocol = undefined;
    var ipServidor = undefined;
    var objectId = undefined;
    var defaultWcfBaseUrl = undefined;
    var defaultWsBaseUrl = undefined;
    var urlWebCfgServiceInicial = undefined;

    var _getConfig = function _getConfig(id, byPid, callback, errorCallback) {

        if (Dnv.cfg.getCfgBoolean("Manager_WebRequest_Enabled", false)) {
            _getConfigWSRequest(callback, errorCallback);
            return;
        }
        var urlFallback = urlWebCfgServiceInicial || Dnv.cfg.getDefaultWcfServerAddress() + "/Servicios/WebConfig";
        console.log("urlWebCfgServiceInicial " + urlWebCfgServiceInicial);
        console.log("Dnv.cfg.getDefaultWcfServerAddress() " + Dnv.cfg.getDefaultWcfServerAddress());
        var url = Dnv.cfg.getCfgString("ConfigClientEndPointAddressWeb", urlFallback /*defaultWcfBaseUrl + "/Servicios/WebConfig"*/) + "/GetConfiguracion";
        console.log("url " + url);
        /*
        * El manejo de errores salta varias veces.
        * Uno del client.oneror, otro de respuesta nula   
        */

        if (!byPid && Dnv.cfg.getCfgInt("MyOwnCode", 0) == 0) {
            console.warn("[SERVIDOR] No pedimos configuración, MyOwnCode = 0");
            if (errorCallback) errorCallback();
            return;
        } else if (byPid && id == 0) {
            console.warn("[SERVIDOR] No pedimos configuración, PID = 0");
            if (errorCallback) errorCallback();
            return;
        }

        var errorManejado = false;
        function errHandler(e) {
            //console.log(this.readyState);
            if (errorManejado) return; // No lo manejamos 2 veces

            errorManejado = true;
            if (Dnv.utiles.debeLoguearFallosDeRed()) {
                console.error("[SERVIDOR] Error al pedir configuracion: " + e);
            }
            Dnv.systemInfo.setEstadoConectividadConfiguracion("Error");
            if (errorCallback) errorCallback();
        }
        function handler() {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {
                    Dnv.systemInfo.setEstadoConectividadConfiguracion("OK");
                    console.log("Respuesta de configuracion " + this.responseXML);
                    try {
                        if (callback) callback(this.responseXML);
                    } catch (e) {
                        errHandler("Error en la respuesta del servidor a la petición de configuración: " + e + " " + e.filename + ":" + e.lineno + " " + e.message);
                    }
                } else {
                    errHandler("Error HTTP: " + this.status + " " + this.statusText);
                    Dnv.systemInfo.setEstadoConectividadConfiguracion("HTTP error: " + this.status + " " + this.statusText);
                }
            }
        }

        var client = new XMLHttpRequest();
        client.onreadystatechange = handler;
        client.onerror = errHandler;
        client.timeout = 45000;
        client.ontimeout = function () {
            errHandler("Timed out al obtener la configuracion!!!");
            Dnv.systemInfo.setEstadoConectividadConfiguracion("Timeout");
        }

        //client.open("POST", "http://" + ipServidor + ":8090/Servicios/WebConfig/GetConfiguracion");
        //client.open("POST", Dnv.cfg.getCfgString("ConfigHostbaseAddressWeb", "") + "/GetConfiguracion");
        //client.open("POST", Dnv.cfg.getCfgString("ConfigHostbaseAddressWeb", "http://" + ipServidor + ":8090/Servicios/WebConfig" + "/GetConfiguracion"));
        //todo RAG - crear settings
        client.open("POST", url);

        var xml;
        if (byPid) {
            xml = '<GetConfiguracion xmlns="http://tempuri.org/"><ID>' + id + '</ID><byObjId>false</byObjId><lastConfigTimestamp>' + Dnv.cfg.getInternalCfgString("configLastUpdated", "1900-01-01 00:00:00") + '</lastConfigTimestamp><replicador>false</replicador><newMode>true</newMode></GetConfiguracion>';
        } else {
            xml = '<GetConfiguracion xmlns="http://tempuri.org/"><ID>' + id + '</ID><byObjId>true</byObjId><lastConfigTimestamp>' + Dnv.cfg.getInternalCfgString("configLastUpdated", "1900-01-01 00:00:00") + '</lastConfigTimestamp><replicador>false</replicador><newMode>true</newMode></GetConfiguracion>';
        }
        client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

        //xml = undefine
        //client.send();
        errorManejado = false;
        console.log("Pidiendo configuracion");
        client.send(xml);
    };

    var _getConfigWSRequest = function _getConfigWSRequest(callback, errorCallback) {
        var url;
        if (Dnv.cfg.getCfgString("URLConfigMaster", "") != "") {
            url = Dnv.cfg.getCfgString("URLConfigMaster", "");
            if (url.length == (url.lastIndexOf("/") + 1)) { //Quitamos la / final por si la han metido en el setting
                url = url.substring(0, url.lastIndexOf("/"))
            }
            
        } else {
            url = Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getCfgString("IPMaster", Dnv.cfg.getConfigIpServer()) + "/wsdenevarequest/api/cfg";
        }


        var objId = Dnv.cfg.getObjectId();
        var pid = Dnv.cfg.getConfigPID()
        var fecha = Dnv.utiles.formatearFechaUTCDia(new Date())
        var token = CryptoJS.SHA256(pid + ";" + fecha).toString(CryptoJS.enc.Hex);
        var fechaHTTP = (new Date(Dnv.cfg.getConfigTimeStamp())).toUTCString();

        if (objId == "undefined" || objId == 0) {
            console.warn("[SERVIDOR] ObjectID no válido, no pedimos config WSRequest.");
            return;
        }
  
        var errorManejado = false;
        function errHandler(e) {
            if (errorManejado) return; // No lo manejamos 2 veces

            errorManejado = true;
            if (Dnv.utiles.debeLoguearFallosDeRed()) {
                console.error("[SERVIDOR] Error al pedir configuracion WSRequest: " + e);
            }
            Dnv.systemInfo.setEstadoConectividadConfiguracion("Error");
            if (errorCallback) errorCallback();
        }

        function handler() {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {
                    Dnv.systemInfo.setEstadoConectividadConfiguracion("OK");
                    console.log("Respuesta de configuracion WSRequest" + this.responseXML);
                    try {
                        var timeStamp = this.getResponseHeader('Last-Modified');
                        if (callback) callback(this.responseXML, timeStamp);
                    } catch (e) {
                        errHandler("Error en la respuesta del servidor a la petición de configuración WSRequest: " + e + " " + e.filename + ":" + e.lineno + " " + e.message);
                    }
                } else if (this.status === 304) {
                    console.log("La configuracion de WSRequest no ha cambiado");
                    Dnv.systemInfo.setEstadoConectividadConfiguracion("OK");
                    try {
                        if (callback) callback("Sin cambios");
                    } catch (e) {
                        errHandler("Error en la respuesta del servidor a la petición de configuración WSRequest: " + e + " " + e.filename + ":" + e.lineno + " " + e.message);
                    }
                } else {
                    errHandler("Error HTTP: " + this.status + " " + this.statusText);
                    Dnv.systemInfo.setEstadoConectividadConfiguracion("HTTP error: " + this.status + " " + this.statusText);
                }
            }
        }

        var client = new XMLHttpRequest();
        client.onreadystatechange = handler;
        client.onerror = errHandler;
        client.timeout = 45000;
        client.ontimeout = function () {
            errHandler("Timed out al obtener Config WSRequest!");
            Dnv.systemInfo.setEstadoConectividadPlaylist("Timeout");
        };

        client.open("GET", url + "/" + objId);
        client.setRequestHeader('X-Pid', pid);
        client.setRequestHeader('X-Token', token);
        client.setRequestHeader('If-Modified-Since', fechaHTTP);
        errorManejado = false;
        console.log("[PLAYLIST] Pidiendo playlist WSRequest para ObjectID=" + objId + "...");
        client.send();
    }

    var _inicializarUrlCfg = function _inicializarUrlCfg(pid, eid, successCb) {

        if (!pid || pid === "0") {
            console.warn("[SERVIDOR] No pedimos url de configuración inicial, PID = " + pid);
            return;
        } else {
            console.info("[SERVIDOR] Pedimos url de configuración inicial, PID = " + pid);
        }

        if (!defaultWsBaseUrl) {
            defaultWsBaseUrl = Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getConfigIpServer();
        }

        var url = defaultWsBaseUrl + "/WSResources/RemoteResources.asmx/GetMetadatoDispoPadre?EID=" + eid + "&PID=" + pid + "&NomMetadato=IPPublic";

        var client = new XMLHttpRequest();
        /*
        * El manejo de errores salta varias veces.
        * Uno del client.oneror, otro de respuesta nula   
        */
        var errorManejado = false;
        function errHandler(e) {
            //console.log(client.readyState);
            if (errorManejado) return; // No lo manejamos 2 veces

            if (Dnv.utiles.debeLoguearFallosDeRed()) {
                console.error("[SERVIDOR] Error al pedir la url inicial: " + e);
            }
            Dnv.systemInfo.setEstadoConectividadConfiguracion("Error al obtener la url inicial");
            //if (errorCallback) errorCallback();

            if (client.status === 500 && client.responseText.indexOf("System.InvalidOperationException:")) {
                console.error("[SERVIDOR] El servidor no implementa el método para la url inicial, usamos el por defecto..." + e);
                urlWebCfgServiceInicial = Dnv.cfg.getDefaultWcfServerAddress() + "/Servicios/WebConfig";
                if (successCb) successCb();
            } else {

                setTimeout(function () { // Reintentar
                    errorManejado = false;
                    _inicializarUrlCfg(pid, eid, successCb);
                }, 25 * 1000);
            }

        }
        function handler() {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {
                    Dnv.systemInfo.setEstadoConectividadConfiguracion("OK");
                    console.log("Respuesta de direccion de configuracion " + this.response);
                    if (this.responseXML && this.responseXML.documentElement && this.responseXML.documentElement.tagName === "string") {
                        var valor = this.responseXML.documentElement.textContent;
                        if (valor.indexOf(";;ERROR;;") >= 0) {
                            errHandler("Respuesta erronea: " + valor);
                        } else {
                            valor = valor.replace("[IPMASTER]", Dnv.cfg.getConfigIpServer());
                            if (Dnv.cfg.getConfigProtocolServer() === "https://") {
                                urlWebCfgServiceInicial = Dnv.cfg.getConfigProtocolServer() + valor + '/Servicios/WebConfig';
                            } else {
                                urlWebCfgServiceInicial = Dnv.cfg.getConfigProtocolServer() + valor + ':8090/Servicios/WebConfig';
                            }
                            console.log("urlWebCfgServiceInicial " + urlWebCfgServiceInicial);
                            if (successCb) successCb();
                        }
                    } else {
                        errHandler("Respuesta erronea: " + valor);
                    }

                } else {
                    errHandler("Error HTTP: " + this.status + " " + this.statusText);
                }
            }
        }

        client.onreadystatechange = handler;
        client.onerror = errHandler;
        client.timeout = 45000;
        client.ontimeout = function () {
            errHandler("Timed out al obtener la url de configuracion inicial!!!");
            Dnv.systemInfo.setEstadoConectividadConfiguracion("Timeout al obtener la url inicial");
        }
        client.open("GET", url);
        client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

        //xml = undefine
        //client.send();
        errorManejado = false;
        console.log("Pidiendo url de configuracion inicial");
        client.send();
    };

    /*var _aligerarPlaylist = function _aligerarPlaylist(playlistElement) {
        for (var i = 0; i < playlistElement.childNodes.length; i++) {
            var name = playlistElement.childNodes[i].tagName;
            if (name !== "Canales" && name !== "Plantillas" && name !== "Secuencias" &&
                    name !== "Recursos" && name !== "Resoluciones" && name !== "Idiomas" &&
                    name !== "Streamings" && name !== "Player") {
                var nodo = playlistElement.childNodes[i];
                while (nodo.firstChild != null) {
                    nodo.removeChild(nodo.firstChild);
                }
                nodo.appendChild(playlistElement.ownerDocument.createComment("Contenido eliminado para ahorrar memoria"));
            }
        }
    }*/

    return {

        setUp: function setUp(ip, objId, prot) {
            console.log("[CONFIGURACION] SetUP - ip:" + ip + " objID:" + objId);
            ipServidor = ip;
            objectId = objId;
            if (prot !== undefined) {
                protocol = prot;
            } else if (Dnv.cfg.getConfigProtocolServer && Dnv.cfg.getConfigProtocolServer() !== undefined) {
                protocol = Dnv.cfg.getConfigProtocolServer();
            } else {
                protocol = "http://";
            }
            defaultWcfBaseUrl = Dnv.cfg.getDefaultWcfServerAddress();
            if (!defaultWcfBaseUrl) {
                if (protocol === "http://") {
                    defaultWcfBaseUrl = protocol + ipServidor + ":8090";
                } else {
                    defaultWcfBaseUrl = protocol + ipServidor;
                }
            }
            defaultWsBaseUrl = protocol + ipServidor; // web services

        },

        getPlaylist: function getPlaylist(objId, callback, errorCallback) {

            var url = Dnv.cfg.getCfgString("PlayListClientEndPointAddressWeb", defaultWcfBaseUrl + "/Servicios/WebPlayList") + "/GetPlayList?ObjectID=" + objectId;
            function errHandler(e) {
                //console.log(this.readyState);
                Dnv.systemInfo.setEstadoConectividadPlaylist("Error");
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR] Error al pedir la playlist: " + e);
                }
                //console.trace();
                if (errorCallback) errorCallback();
            }

            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        Dnv.systemInfo.setEstadoConectividadPlaylist("OK");
                        console.log("[SERVIDOR] Respuesta a la peticion de playlist: " + this.responseXML);
                        /*
                        var pl = Dnv.Pl.parsePlaylist(this.responseXML);
                        console.log(pl);*/
                        try {
                            //if (callback) {
                            if (this.responseXML) { // FIXME cambiar cuando se llame a GetNew
                                if (callback) callback(this.responseXML);
                            } else {
                                errHandler("No se recibió playlist");
                                Dnv.systemInfo.setEstadoConectividadPlaylist("Invalid response");
                            }
                            //var result = this.responseXML.getElementsByTagName("GetPlayListResult")[0].children[0];
                            //callback(result);
                            //}
                        } catch (e) {
                            errHandler(e);
                            Dnv.systemInfo.setEstadoConectividadPlaylist("Invalid response");
                        }
                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                        Dnv.systemInfo.setEstadoConectividadPlaylist("HTTP error: " + this.status + " " + this.statusText);
                    }
                }
            }
            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000;
            client.ontimeout = function () {
                errHandler("Timed out al obtener la playlist!!!");
                Dnv.systemInfo.setEstadoConectividadPlaylist("Timeout");
            };

            client.open("GET", url);
            //
            /*
            *<GetPlayList xmlns="http://tempuri.org/"><ObjectID>38233281</ObjectID></GetPlayList>
            *
            * 
            * Los timestamps son Dates
            *  http://192.168.3.20:8090/Servicios/WebPlaylist/GetNewPlayList 
            <GetNewPlayList xmlns="http://tempuri.org/">
            <objId>38233281</objId>
            <TimestampCanales>1900-01-01T00:00:00</TimestampCanales>
            <TimestampPlantillas>1900-01-01T00:00:00</TimestampPlantillas>
            <TimestampRecursos>1900-01-01T00:00:00</TimestampRecursos>
            <TimestampCampanyas>1900-01-01T00:00:00</TimestampCampanyas>
            <TimestampRecursosDescargas>1900-01-01T00:00:00</TimestampRecursosDescargas>
            <TimestampResoluciones>1900-01-01T00:00:00</TimestampResoluciones>
            <TimestampIdiomas>1900-01-01T00:00:00</TimestampIdiomas>
            <TimestampSecuencias>1900-01-01T00:00:00</TimestampSecuencias>
            <TimestampSettings>1900-01-01T00:00:00</TimestampSettings>
            <TimestampDispositivo>1900-01-01T00:00:00</TimestampDispositivo>
            <TimestampVariables>1900-01-01T00:00:00</TimestampVariables>
            <TimestampsEstados>1900-01-01T00:00:00</TimestampsEstados>
            <TimestampMensajesMegafonia>1900-01-01T00:00:00</TimestampMensajesMegafonia>
            <TimesatmpMensajesTeleindicadores>1900-01-01T00:00:00</TimesatmpMensajesTeleindicadores>
            <byObjId>true</byObjId>
            <empresa></empresa>
            <recTotales>0</recTotales>
            <recPendientes>0</recPendientes>
            </GetNewPlayList>*/
            /*var xml = '<GetPlayList '+
            'xmlns="http://tempuri.org/" '+
            'xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" '+
            'xmlns:i="http://www.w3.org/2001/XMLSchema-instance" '+
            'xmlns:b="http://schemas.datacontract.org/2004/07/Deneva.WCFDenevaUpdate">'+
            '<objId>38233281</objId>'+
            '</GetPlayList>';
            */
            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            //client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
            //xml = undefine
            console.log("Pidiendo playlist");
            client.send();
            //client.send(xml);
        },
        getNewPlaylist: function getNewPlaylist(docPl, callback, errorCallback) {

            var url = Dnv.cfg.getCfgString("PlayListClientEndPointAddressWeb", defaultWcfBaseUrl + "/Servicios/WebPlayList") + "/GetNewPlayList";
            //url = "http://192.168.13.49:8091/Servicios/WebPlayList/GetNewPlayList"; // BORRAME

            var objId = Dnv.cfg.getObjectId();
            var empresa = Dnv.cfg.getCfgString("Empresa", "0");
            var recTotales = (docPl ? docPl.getElementsByTagName("Recurso").length : 0);
            var recPendientes;
            try {
                recPendientes = Dnv.Cloud.downloader.getRecursosPendientes();
            } catch (e) {
                recPendientes = 0;
            }

            function errHandler(e) {
                //console.log(this.readyState);
                Dnv.systemInfo.setEstadoConectividadPlaylist("Error");
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.warn("[SERVIDOR] Error al pedir la playlist: " + e);
                }
                //console.trace();
                if (errorCallback) errorCallback();
            }

            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        Dnv.systemInfo.setEstadoConectividadPlaylist("OK");
                        console.log("[PLAYLIST] Respuesta a la peticion de playlist: " + this.responseText);
                        /*
                        var pl = Dnv.Pl.parsePlaylist(this.responseXML);
                        console.log(pl);*/
                        //if (callback) {
                        if (this.responseXML) { // FIXME cambiar cuando se llame a GetNew
                            var playlistElement
                            try {
                                playlistElement = this.responseXML.getElementsByTagName("PlayList")[0];

                            } catch (e) {
                                errHandler(e);
                                return;
                            }
                            if (callback) callback(playlistElement);
                        } else if (this.responseText === "null") {
                            errHandler("[PLAYLIST] No se recibió playlist");
                        } else { //ni playlist ni nulo, no es válido.
                            errHandler("[PLAYLIST] No se recibió playlist válida.");
                        }
                        //var result = this.responseXML.getElementsByTagName("GetPlayListResult")[0].children[0];
                        //callback(result);
                        //}
                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                        Dnv.systemInfo.setEstadoConectividadPlaylist("HTTP error: " + this.status + " " + this.statusText);
                    }
                }
            }

            if (objId == "undefined" || objId == 0) {
                console.warn("[PLAYLIST] ObjectID no válido, no pedimos playlist.");
                return;
            }

            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000;
            client.ontimeout = function () {
                errHandler("Timed out al obtener newPlaylist!!!");
                Dnv.systemInfo.setEstadoConectividadPlaylist("Timeout");
            };

            //console.log("http://"+ipServidor+":8090/Servicios/WebPlayList/GetNewPlayList?ObjectID="+objectId);
            //
            /*
            *<GetPlayList xmlns="http://tempuri.org/"><ObjectID>38233281</ObjectID></GetPlayList>
            *
            * 
            * Los timestamps son Dates 
            *  http://192.168.3.20:8090/Servicios/WebPlaylist/GetNewPlayList 
            <GetNewPlayList xmlns="http://tempuri.org/">
            <objId>38233281</objId>
            <TimestampCanales>1900-01-01T00:00:00</TimestampCanales>
            <TimestampPlantillas>1900-01-01T00:00:00</TimestampPlantillas>
            <TimestampRecursos>1900-01-01T00:00:00</TimestampRecursos>
            <TimestampCampanyas>1900-01-01T00:00:00</TimestampCampanyas>
            <TimestampRecursosDescargas>1900-01-01T00:00:00</TimestampRecursosDescargas>
            <TimestampResoluciones>1900-01-01T00:00:00</TimestampResoluciones>
            <TimestampIdiomas>1900-01-01T00:00:00</TimestampIdiomas>
            <TimestampSecuencias>1900-01-01T00:00:00</TimestampSecuencias>
            <TimestampSettings>1900-01-01T00:00:00</TimestampSettings>
            <TimestampDispositivo>1900-01-01T00:00:00</TimestampDispositivo>
            <TimestampVariables>1900-01-01T00:00:00</TimestampVariables>
            <TimestampsEstados>1900-01-01T00:00:00</TimestampsEstados>
            <TimestampMensajesMegafonia>1900-01-01T00:00:00</TimestampMensajesMegafonia>
            <TimesatmpMensajesTeleindicadores>1900-01-01T00:00:00</TimesatmpMensajesTeleindicadores>
            <byObjId>true</byObjId>
            <empresa></empresa>
            <recTotales>0</recTotales>
            <recPendientes>0</recPendientes>
            </GetNewPlayList>*/

            var getTimestampSeccion = function (seccion) {
                if (!docPl || Dnv.Pl.lastPlaylistFromUSB) return '1900-01-01T00:00:00';

                var strFecha = docPl.getElementsByTagName(seccion)[0].getAttribute("TimeStamp");
                /*
                * Nos lo dan en dd/mm/yyyy h:mm:ss y tenemos que pasarlo a yyyy-mm-ddThh:mm:ss
                * Hay que tener en cuenta que puede que nos hayan dato la hora con un solo digito, al
                * enviar hay que enviarla con dos digitos
                */

                var elementos = strFecha.split(' ');
                var elementosFecha = elementos[0].split('/');
                var elementosHora = elementos[1].split(':');

                if (elementosFecha[1].length === 1) elementosFecha[1] = '0' + elementosFecha[1];
                if (elementosFecha[0].length === 1) elementosFecha[0] = '0' + elementosFecha[0];
                if (elementosHora[0].length === 1) elementosHora[0] = '0' + elementosHora[0];
                if (elementosHora[1].length === 1) elementosHora[1] = '0' + elementosHora[1];
                if (elementosHora[2].length === 1) elementosHora[2] = '0' + elementosHora[2];


                return elementosFecha[2] + '-' + elementosFecha[1] + '-' + elementosFecha[0] + 'T' + elementosHora[0] + ':' + elementosHora[1] + ':' + elementosHora[2];
            }
            var xml = '<GetNewPlayList ' +
                'xmlns="http://tempuri.org/" ' +
                'xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" ' +
                'xmlns:i="http://www.w3.org/2001/XMLSchema-instance" ' +
                'xmlns:b="http://schemas.datacontract.org/2004/07/Deneva.WCFDenevaUpdate">' +
                '<objId>' + objId + '</objId>' +
                '<TimestampCanales>' + getTimestampSeccion('Canales') + '</TimestampCanales>' +
                '<TimestampPlantillas>' + getTimestampSeccion('Plantillas') + '</TimestampPlantillas>' +
                '<TimestampRecursos>' + getTimestampSeccion('Recursos') + '</TimestampRecursos>' +
                '<TimestampCampanyas>' + getTimestampSeccion('Inserciones') + '</TimestampCampanyas>' +
                '<TimestampRecursosDescargas>' + getTimestampSeccion('RecursosDescargas') + '</TimestampRecursosDescargas>' +
                '<TimestampResoluciones>' + getTimestampSeccion('Resoluciones') + '</TimestampResoluciones>' +
                '<TimestampIdiomas>' + getTimestampSeccion('Idiomas') + '</TimestampIdiomas>' +
                '<TimestampSecuencias>' + getTimestampSeccion('Secuencias') + '</TimestampSecuencias>' +
                '<TimestampSettings>' + getTimestampSeccion('Settings') + '</TimestampSettings>' +
                '<TimestampDispositivo>' + getTimestampSeccion('Player') + '</TimestampDispositivo>' +
                '<TimestampVariables>' + getTimestampSeccion('Variables') + '</TimestampVariables>' +
                '<TimestampsEstados>' + getTimestampSeccion('Estados') + '</TimestampsEstados>' +
                '<TimestampMensajesMegafonia>' + getTimestampSeccion('MensajesMegafonia') + '</TimestampMensajesMegafonia>' +
                '<TimesatmpMensajesTeleindicadores>' + getTimestampSeccion('MensajesTeleindicadores') + '</TimesatmpMensajesTeleindicadores>' +
                '<byObjId>true</byObjId>' +
                '<empresa>' + empresa + '</empresa>' +
                '<recTotales>' + recTotales + '</recTotales>' +
                '<recPendientes>' + recPendientes + '</recPendientes>' +
                '<timestampDnvLoops>' + getTimestampSeccion('DnvLoops') + '</timestampDnvLoops>' +
                '</GetNewPlayList>';

            client.open("POST", url);
            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
            //xml = undefine
            console.log("[PLAYLIST] Pidiendo playlist para ObjectID=" + objId + "...");
            //client.send();
            client.send(xml);
        },
        getNewPlaylistDic: function getNewPlaylistDic(docPl, callback, errorCallback) {

            if (Dnv.cfg.getCfgBoolean("Manager_WebRequest_Enabled", false)) {
                Dnv.servidor.getPlaylistWSRequest(callback, errorCallback);
                return;
            }
            var url = Dnv.cfg.getCfgString("PlayListClientEndPointAddressWeb", defaultWcfBaseUrl + "/Servicios/WebPlayList") + "/GetNewPlayListDic";

            var objId = Dnv.cfg.getObjectId();
            var empresa = Dnv.cfg.getCfgString("Empresa", "0");
            var recTotales = (docPl ? docPl.getElementsByTagName("Recurso").length : 0);
            var recPendientes = Dnv.Cloud.downloader.getRecursosPendientes();
            
            function errHandler(e) {
                //console.log(this.readyState);


                if (client.status === 404 && client.responseText.indexOf("Extremo no encontrado") >= 0) {
                    console.error("[SERVIDOR] El servidor no implementa getNewPlaylistDic, usamos la petición antigua...");
                    Dnv.servidor.getNewPlaylist(docPl, callback, errorCallback);
                } else {

                    Dnv.systemInfo.setEstadoConectividadPlaylist("Error");
                    if (Dnv.utiles.debeLoguearFallosDeRed()) {
                        console.warn("[SERVIDOR] Error al pedir la playlist: " + e);
                    }
                    //console.trace();
                    if (errorCallback) errorCallback();
                }
            }

            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        Dnv.systemInfo.setEstadoConectividadPlaylist("OK");
                        console.log("[PLAYLIST] Respuesta a la peticion de playlist: " + this.responseText);
                        if (this.responseXML) { // FIXME cambiar cuando se llame a GetNew
                            var playlistElement
                            try {
                                playlistElement = this.responseXML.getElementsByTagName("PlayList")[0];

                                //_aligerarPlaylist(playlistElement);
                            } catch (e) {
                                errHandler(e);
                                return;
                            }
                            if (callback) callback(playlistElement);
                        } else if (this.responseText === "null") {
                            errHandler("[PLAYLIST] No se recibió playlist");
                        } else { //ni playlist ni nulo, no es válido.
                            errHandler("[PLAYLIST] No se recibió playlist válida.");
                        }
                    } else if (client.status === 404 /* &&
                            (client.responseText.indexOf("Extremo no encontrado") >= 0 ||
                             client.responseText.indexOf("Endpoint not found") >= 0)*/) {
                        console.error("[SERVIDOR] El servidor no implementa getNewPlaylistDic, usamos la petición antigua...");
                        Dnv.servidor.getNewPlaylist(docPl, callback, errorCallback);
                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                        Dnv.systemInfo.setEstadoConectividadPlaylist("HTTP error: " + this.status + " " + this.statusText);
                    }
                }
            }

            if (objId == "undefined" || objId == 0) {
                console.warn("[PLAYLIST] ObjectID no válido, no pedimos playlist.");
                return;
            }

            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000;
            client.ontimeout = function () {
                errHandler("Timed out al obtener newPlaylist!!!");
                Dnv.systemInfo.setEstadoConectividadPlaylist("Timeout");
            };

            var getTimestampSeccion = function (seccion) {
                if (!docPl || Dnv.Pl.lastPlaylistFromUSB) return '1900-01-01T00:00:00';

                //var strFecha = docPl.getElementsByTagName(seccion)[0].getAttribute("TimeStamp");

                var strFecha;
                for (var i = 0; i < docPl.childNodes.length; i++) {
                    var e = docPl.childNodes[i];
                    if (e.tagName === seccion) {
                        strFecha = e.getAttribute("TimeStamp");
                        break;
                    }
                }
                if (!strFecha) {
                    console.error("No existe la seccion de playlist " + seccion);
                    return '1900-01-01T00:00:00';
                }
                /*
                * Nos lo dan en dd/mm/yyyy h:mm:ss y tenemos que pasarlo a yyyy-mm-ddThh:mm:ss
                * Hay que tener en cuenta que puede que nos hayan dato la hora con un solo digito, al
                * enviar hay que enviarla con dos digitos
                */

                var elementos = strFecha.split(' ');
                var elementosFecha = elementos[0].split('/');
                var elementosHora = elementos[1].split(':');

                if (elementosFecha[1].length === 1) elementosFecha[1] = '0' + elementosFecha[1];
                if (elementosFecha[0].length === 1) elementosFecha[0] = '0' + elementosFecha[0];
                if (elementosHora[0].length === 1) elementosHora[0] = '0' + elementosHora[0];
                if (elementosHora[1].length === 1) elementosHora[1] = '0' + elementosHora[1];
                if (elementosHora[2].length === 1) elementosHora[2] = '0' + elementosHora[2];


                return elementosFecha[2] + '-' + elementosFecha[1] + '-' + elementosFecha[0] + 'T' + elementosHora[0] + ':' + elementosHora[1] + ':' + elementosHora[2];
            }
            /*
            Public Enum PlayListSecciones
            dispositivos = 1
            player = 2
            salida = 3
            idiomas = 4
            canales = 5
            inserciones = 6
            plantillas = 7
            recursos = 8
            recursosDescargas = 9
            secuencias = 10
            settings = 11
            resoluciones = 12
            variables = 13
            estados = 14
            mensajes_megafonía = 15
            mensajes_teleindicadores = 16
            'webSlice = 17
            dnvLoops = 18
            streaming = 19
            End Enum
            */

            var xml = '<GetNewPlayListDic ' +
                'xmlns="http://tempuri.org/" ' +
                'xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" ' +
                'xmlns:i="http://www.w3.org/2001/XMLSchema-instance" ' +
                'xmlns:b="http://schemas.datacontract.org/2004/07/Deneva.WCFDenevaUpdate">' +
                '<objId>' + objId + '</objId>' +
                '<seccionesTimestamps xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">' +
                /* 
                * Hay secciones que nunca nos vienen, nos olvidamos de ellas,
                * y en otras que no queremos podriamos poner una fecha en el futuro...
                * aunque falsease los datos de la web 
                */
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>dispositivos</a:Key><a:Value>' + getTimestampSeccion('Player') + '</a:Value>' + // Es dispositivos, no player
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>idiomas</a:Key><a:Value>' + getTimestampSeccion('Idiomas') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>canales</a:Key><a:Value>' + getTimestampSeccion('Canales') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>inserciones</a:Key><a:Value>' + getTimestampSeccion('Inserciones') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>plantillas</a:Key><a:Value>' + getTimestampSeccion('Plantillas') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>recursos</a:Key><a:Value>' + getTimestampSeccion('Recursos') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>recursosDescargas</a:Key><a:Value>' + getTimestampSeccion('RecursosDescargas') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>secuencias</a:Key><a:Value>' + getTimestampSeccion('Secuencias') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>settings</a:Key><a:Value>' + getTimestampSeccion('Settings') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>resoluciones</a:Key><a:Value>' + getTimestampSeccion('Resoluciones') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>variables</a:Key><a:Value>' + getTimestampSeccion('Variables') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>estados</a:Key><a:Value>' + getTimestampSeccion('Estados') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>mensajes_megafonía</a:Key><a:Value>' + getTimestampSeccion('MensajesMegafonia') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>mensajes_teleindicadores</a:Key><a:Value>' + getTimestampSeccion('MensajesTeleindicadores') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>dnvLoops</a:Key><a:Value>' + getTimestampSeccion('DnvLoops') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                '<a:Key>streaming</a:Key><a:Value>' + getTimestampSeccion('Streamings') + '</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                /* Seccion incompatible con 2.25.8
                '<a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                  '<a:Key>dataSources</a:Key><a:Value>1900-01-01T00:00:00</a:Value>' +
                '</a:KeyValueOfEnumeracion.PlayListSeccionesdateTime_PUz1SOHJ>' +
                */
                '</seccionesTimestamps>' +
                '<byObjId>true</byObjId>' +
                '<empresa>' + empresa + '</empresa>' +
                '<recTotales>' + recTotales + '</recTotales>' +
                '<recPendientes>' + recPendientes + '</recPendientes>' +
                '<rol>' + Dnv.cfg.getCfgString("Rol", 147) + '</rol>' +
                '</GetNewPlayListDic>';

            client.open("POST", url);
            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
            console.log("[PLAYLIST] Pidiendo playlist para ObjectID=" + objId + "...");
            client.send(xml);
        },
        getPlaylistWSRequest: function getPlaylistWSRequest(callback, errorCallback) {
            var url;
            if (Dnv.cfg.getCfgString("URLPlaylistMaster", "") != "") {
                url = Dnv.cfg.getCfgString("URLPlaylistMaster", "");
                if (url.length == (url.lastIndexOf("/") + 1)) { //Quitamos la / final por si la han metido en el setting
                    url = url.substring(0, url.lastIndexOf("/"))
                }
            } else {
                url = Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getCfgString("IPMaster", Dnv.cfg.getConfigIpServer()) + "/wsdenevarequest/api/playlist";
            }
            

            var objId = Dnv.cfg.getObjectId();
            var pid = Dnv.cfg.getConfigPID();
            var fecha = Dnv.utiles.formatearFechaUTCDia(new Date());
            var fechaHTTP;
            if (Dnv.Pl.lastPlaylist) {
                var timeString = Dnv.cfg.getInternalCfgString("playlistLastUpdated", "");
                var numero = Dnv.utiles.stringToTimestamp(timeString.replace("T", " ")).getTime();
                fechaHTTP = (new Date(numero)).toUTCString();
            } else { //En la primera carga forzamos a que nos de la playlist ya que no tiene de base
                fechaHTTP = (new Date(0)).toUTCString();
            }
           
            var token = CryptoJS.SHA256(pid + ";" + fecha).toString(CryptoJS.enc.Hex);

            if (objId == "undefined" || objId == 0) {
                console.warn("[PLAYLIST] ObjectID no válido, no pedimos playlist WSRequest.");
                return;
            }

            function errHandler(e) {
                Dnv.systemInfo.setEstadoConectividadPlaylist("Error");
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.warn("[SERVIDOR] Error al pedir la playlist WSRequest: " + e);
                }
                if (errorCallback) errorCallback();
            }

            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        Dnv.systemInfo.setEstadoConectividadPlaylist("OK");
                        console.log("[PLAYLIST] Respuesta a la peticion de playlist WSRequest: " + this.responseText);
                        if (this.responseXML) {
                            var playlistElement;
                            var timeStamp;
                            try {
                                playlistElement = this.responseXML.getElementsByTagName("PlayList")[0];
                                timeStamp = this.getResponseHeader('Last-Modified');

                            } catch (e) {
                                errHandler(e);
                                return;
                            }
                            if (callback) callback(playlistElement, timeStamp);
                        } else if (this.responseText === "null") {
                            errHandler("[PLAYLIST] No se recibió playlist WSRequest");
                        } else { //ni playlist ni nulo, no es válido.
                            errHandler("[PLAYLIST] No se recibió playlist WSRequest válida.");
                        }
                    } else if (client.status === 304) {
                        console.info("[SERVIDOR] La playlist recibida por WSRequest no tiene cambios");
                        Dnv.systemInfo.setEstadoConectividadPlaylist("OK");
                        if (callback) callback("Sin cambios");
                    } else if (client.status === 404) {
                        console.error("[SERVIDOR] El servidor no implementa getNewPlaylistDic, usamos la petición antigua...");
                        Dnv.servidor.getNewPlaylist(docPl, callback, errorCallback);
                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                        Dnv.systemInfo.setEstadoConectividadPlaylist("HTTP error: " + this.status + " " + this.statusText);
                    }
                }
            }
            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000;
            client.ontimeout = function () {
                errHandler("Timed out al obtener Playlist WSRequest!");
                Dnv.systemInfo.setEstadoConectividadPlaylist("Timeout");
            };

            client.open("GET", url + "/" + objId);
            client.setRequestHeader('X-Pid', pid);
            client.setRequestHeader('X-Token', token);
            client.setRequestHeader('If-Modified-Since', fechaHTTP);
            console.log("[PLAYLIST] Pidiendo playlist WSRequest para ObjectID=" + objId + "...");
            client.send();
        },
        getPlaylistHivestack: function getPlaylist(objId, callback, errorCallback) {



            var hivestackUUID = JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", '{"config": {"uuid": "","url": "apps.hivestack.com","logstashEnabled": "True"},"campanya":{"id_campanya": "1322","empresa": "192","usuario": "389","id_insercion": "4107"}}')).config.uuid;

            if (hivestackUUID == null || hivestackUUID == undefined) {
                Dnv.monitor.writeLogFile("[SERVIDOR] Error: No hemos obtenido UUID de Hivestack", LogLevel.Error);
                return;
            }

            var url = "https://" + JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", '{"config": {"uuid": "","url": "apps.hivestack.com","logstashEnabled": "True"},"campanya":{"id_campanya": "1322","empresa": "192","usuario": "389","id_insercion": "4107"}}')).config.url + "/nirvana/api/v1/units/" + hivestackUUID + "/creatives";
            function errHandler(e) {
                //console.log(this.readyState);
                Dnv.systemInfo.setEstadoConectividadPlaylist("Error");
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR] Error al pedir la playlist hivestack: " + e);
                }
                //console.trace();
                if (errorCallback) errorCallback();
            }

            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        Dnv.systemInfo.setEstadoConectividadPlaylist("OK");
                        console.log("[SERVIDOR] Respuesta a la peticion de playlist hivestack: " + this.response);
                        /*
                        var pl = Dnv.Pl.parsePlaylist(this.response);
                        console.log(pl);*/
                        try {
                            //if (callback) {
                            if (this.response) { // FIXME cambiar cuando se llame a GetNew
                                if (callback) callback(this.response);
                            } else {
                                errHandler("No se recibió playlist hivestack");
                            }
                            //var result = this.response.getElementsByTagName("GetPlayListResult")[0].children[0];
                            //callback(result);
                            //}
                        } catch (e) {
                            errHandler(e);
                        }
                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                        Dnv.systemInfo.setEstadoConectividadPlaylist("HTTP error: " + this.status + " " + this.statusText);
                    }
                }
            }
            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000;
            client.ontimeout = function () {
                errHandler("Timed out al obtener la playlist!!!");
                Dnv.systemInfo.setEstadoConectividadPlaylist("Timeout");
            };
            client.open("GET", url);
            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            client.send();
        },

        getNewPlaylistHivestack: function getNewPlaylistHivestack(docPl, callback, errorCallback) {

            var hivestackUUID = JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", '{"config": {"uuid": "","url": "apps.hivestack.com","logstashEnabled": "True"},"campanya":{"id_campanya": "1322","empresa": "192","usuario": "389","id_insercion": "4107"}}')).config.uuid;

            if (hivestackUUID == null || hivestackUUID == undefined) {
                Dnv.monitor.writeLogFile("[SERVIDOR] Error: No hemos obtenido UUID de Hivestack", LogLevel.Error);
                return;
            }

            var url = "https://" + JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", '{"config": {"uuid": "","url": "apps.hivestack.com","logstashEnabled": "True"},"campanya":{"id_campanya": "1322","empresa": "192","usuario": "389","id_insercion": "4107"}}')).config.url + "/nirvana/api/v1/units/" + hivestackUUID + "/creatives";

            var recTotales = (docPl ? docPl.length : 0);
            var recPendientes;
            try {
                recPendientes = Dnv.Cloud.downloader.getRecursosPendientes();
            } catch (e) {
                recPendientes = 0;
            }

            function errHandler(e) {
                //console.log(this.readyState);
                /*Dnv.systemInfo.setEstadoConectividadPlaylist("Error");
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.warn("[SERVIDOR] Error al pedir la playlist: " + e);
                }*/
                //console.trace();
                if (errorCallback) errorCallback();
            }

            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        console.log("[PLAYLIST] Respuesta a la peticion de playlist hivestack: " + this.responseText);
                        /*
                        var pl = Dnv.Pl.parsePlaylist(this.response);
                        console.log(pl);*/
                        //if (callback) {
                        if (this.response) { // FIXME cambiar cuando se llame a GetNew
                            var playlistElement
                            try {
                                playlistElement = JSON.parse(this.response);

                            } catch (e) {
                                errHandler(e);
                                return;
                            }
                            if (callback) callback(playlistElement);
                        } else if (this.responseText === "null") {
                            errHandler("[PLAYLIST] No se recibió playlist");
                        } else { //ni playlist ni nulo, no es válido.
                            errHandler("[PLAYLIST] No se recibió playlist válida.");
                        }
                        //var result = this.response.getElementsByTagName("GetPlayListResult")[0].children[0];
                        //callback(result);
                        //}
                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                    }
                }
            }

            if (hivestackUUID == "" || hivestackUUID == null || hivestackUUID == undefined) {
                console.warn("[PLAYLIST HIVESTACK] UUID no válido, no pedimos playlist de Hivestack.");
                return;
            }

            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000;
            client.ontimeout = function () {
                errHandler("Timed out al obtener newPlaylistHivestack!!!");
                //Dnv.systemInfo.setEstadoConectividadPlaylist("Timeout");
            };


            client.open("GET", url);
            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
            //xml = undefine
            console.log("[PLAYLIST HIVESTACK] Pidiendo playlist Hivestack para UUID=" + hivestackUUID + "...");
            //client.send();
            client.send();
            if (!Dnv.sincronizacion.isConectado() || !Dnv.presentador.isReproduciendo() || (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro())) {
                Dnv.servidor.getVastHivestack(hivestackUUID);
            }
        },
        getNewPlaylistHivestackDic: function getNewPlaylistHivestackDic(docPl, callback, errorCallback) {

            var uuid = JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", '{"config": {"uuid": "","url": "apps.hivestack.com","logstashEnabled": "True"},"campanya":{"id_campanya": "1322","empresa": "192","usuario": "389","id_insercion": "4107"}}')).config.uuid;

            if (uuid == null || uuid == undefined) {
                Dnv.monitor.writeLogFile("[SERVIDOR] Error: No hemos obtenido UUID de Hivestack", LogLevel.Error);
                return;
            }
            var url = "https://" + JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", '{"config": {"uuid": "","url": "apps.hivestack.com","logstashEnabled": "True"},"campanya":{"id_campanya": "1322","empresa": "192","usuario": "389","id_insercion": "4107"}}')).config.url + "/nirvana/api/v1/units/" + uuid + "/creatives";

        

            function errHandler(e) {
                //console.log(this.readyState);


                if (client.status === 404 && client.responseText.indexOf("Extremo no encontrado") >= 0) {
                    console.error("[SERVIDOR] El servidor no implementa getNewPlaylistHivestackDic, usamos la petición antigua...");
                    Dnv.servidor.getNewPlaylistHivestack(docPl, callback, errorCallback);
                } else {

                    Dnv.systemInfo.setEstadoConectividadPlaylist("Error");
                    if (Dnv.utiles.debeLoguearFallosDeRed()) {
                        console.warn("[SERVIDOR] Error al pedir la playlist hivestack: " + e);
                    }
                    //console.trace();
                    if (errorCallback) errorCallback();
                }
            }

            function handlerPlaylist() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        Dnv.systemInfo.setEstadoConectividadPlaylist("OK");
                        console.log("[PLAYLIST] Respuesta a la peticion de playlist: " + this.responseText);
                        if (this.response) { // FIXME cambiar cuando se llame a GetNew
                            var playlistElement
                            try {
                                playlistElement = JSON.parse(this.response);

                                //_aligerarPlaylist(playlistElement);
                            } catch (e) {
                                return;
                            }
                            if (callback) callback(playlistElement);
                        } else if (this.responseText === "null") {
                            errHandler("[PLAYLIST] No se recibió playlist");
                        } else { //ni playlist ni nulo, no es válido.
                            errHandler("[PLAYLIST] No se recibió playlist válida.");
                        }
                    } else if (client.status === 404 /* &&
                            (client.responseText.indexOf("Extremo no encontrado") >= 0 ||
                             client.responseText.indexOf("Endpoint not found") >= 0)*/) {
                        console.error("[SERVIDOR] El servidor no implementa getNewPlaylistHivestackDic, usamos la petición antigua...");
                        Dnv.servidor.getNewPlaylistHivestack(docPl, callback, errorCallback);
                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                        Dnv.systemInfo.setEstadoConectividadPlaylist("HTTP error: " + this.status + " " + this.statusText);
                    }
                }
            }

            if (uuid == "undefined" || uuid == 0) {
                console.warn("[PLAYLIST] ObjectID no válido, no pedimos playlist.");
                return;
            }

            var client = new XMLHttpRequest();
            client.onreadystatechange = handlerPlaylist;
            client.onerror = errHandler;
            client.timeout = 45000;
            client.ontimeout = function () {
                errHandler("Timed out al obtener newPlaylist Hivestack!!!");
                Dnv.systemInfo.setEstadoConectividadPlaylist("Timeout");
            };

            client.open("GET", url);
            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
            //xml = undefine
            console.log("[PLAYLIST HIVESTACK] Pidiendo playlist para UUID=" + uuid + "...");
            //client.send();
            client.send();
            try {

                if (!Dnv.SSP.Hivestack.VastSolicitado) {
                    console.log("[PLAYLIST] .SSP. Solicitar VAST Hivestack ");
                    Dnv.SSP.Hivestack.getVast();
                }

            } catch (e) {

            }

        },
        getConfigByID: function getConfigByID(objId, callback, errorCallback) {
            console.log("[CONFIGURACION] getConfigByID: " + objId);
            _getConfig(objId, false, callback, errorCallback);
        },


        getConfigByPID: function getConfigByPID(pid, callback, errorCallback) {
            console.log("[CONFIGURACION] getConfigByPID: " + pid);
            if (Dnv.cfg.getConfigurado() && Dnv.cfg.getCfgInt("MyOwnCode", 0) !== 0) {
                _getConfig(pid, true, callback, errorCallback);
            } else if (pid && pid !== "0") {
                _inicializarUrlCfg(pid, Dnv.cfg.getConfigEID(), function () {
                    _getConfig(pid, true, callback, errorCallback);
                });
            } else if (errorCallback) {
                errorCallback();
            }
            //_getConfig(pid, true, callback, errorCallback);
        },




        /*
        * 
        <OperationContract()> _
        <WebInvoke(Method:="POST", BodyStyle:=WebMessageBodyStyle.Wrapped, ResponseFormat:=WebMessageFormat.Xml)> _
        Function GetDataSource(ByVal dataSourceID As Integer, ByVal lastUpdate As String, ByVal objId As Integer, ByRef estado As DataSourceDataEstado) As String
    
        http://192.168.3.20:8090/Servicios/WebSmartObject/GetDataSource
        <GetDataSource xmlns="http://tempuri.org/">
        <dataSourceID>60</dataSourceID>
        <lastUpdate>1900-01-01 00:00:00</lastUpdate>
        <objId>38233281</objId>
        <estado>noActualizado</estado>
        </GetDataSource >
        */
        getDataSource: function (cod, lastUpdate, callback, errorCallback) {

            if (!lastUpdate) lastUpdate = "1900-01-01 00:00:00";

            var errorManejado = false;
            function errHandler(e) {
                //console.log(this.readyState);
                if (errorManejado) return; // No lo manejamos 2 veces

                errorManejado = true;
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR] Error al pedir datasource " + cod + ": " + e);
                }
                if (errorCallback) errorCallback();
            }
            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        console.log("[SERVIDOR] Respuesta de datasource " + cod + "");
                        //if (callback) { // TODO: validar que solo hay una cfg devuelta
                        //var result = doc.evaluate("GetConfiguracionResponse/GetConfiguracionResult/KeyValueOfintFicheroConfigaGqlMRMM/", elemento, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null); 
                        var result;
                        try {
                            result = this.responseXML.getElementsByTagName("GetDataSourceResult")[0];
                            if (callback) callback(result.textContent);
                            //result = new DOMParser().parseFromString(result.textContent, "text/xml");
                            //if(callback) callback(result);
                        } catch (e) {
                            errHandler("Error en la respuesta del servidor a la petición de datasource " + cod + ": " + e);
                        }
                        //}

                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                    }
                }
            }
            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000;
            client.ontimeout = function () { errHandler("Timed out al obtener el datasource para " + cod + "!!!"); };

            var url = Dnv.cfg.getCfgString("SmartObjectClientEndPointAddressWeb", defaultWcfBaseUrl + "/Servicios/WebSmartObject") + "/GetDataSource";
            client.open("POST", url);
            var xml = '<GetDataSource xmlns="http://tempuri.org/"><dataSourceID>' + cod + '</dataSourceID><lastUpdate>' + lastUpdate + '</lastUpdate><objId>' + objectId + '</objId><estado>noActualizado</estado></GetDataSource>';

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            //xml = undefine
            //client.send();

            console.log("Pidiendo datasource " + cod);
            client.send(xml);
        },


        getPIDByIDPlayerJS: function getPIDByIDPlayerJS(callback, errorCallback) {
            function errHandlerPID(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR]: Error al pedir getPIDByIDPlayerJS: " + e);
                }
                if (errorCallback) errorCallback("Error al pedir getPIDByIDPlayerJS: " + e);
                Dnv.systemInfo.setEstadoConectividadPid("Error");
            }

            function handlerPID() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        console.log("[SERVIDOR]: Respuesta a la peticion de getPIDByIDPlayerJS: " + this.response);
                        Dnv.systemInfo.setEstadoConectividadPid("OK");
                        try {
                            if (this.response) {
                                if (callback) callback(this.response);
                            } else {
                                errHandlerPID("[SERVIDOR]: No se recibió getPIDByIDPlayerJS");
                            }
                            //}
                        } catch (e) {
                            errHandlerPID(e);
                        }
                    } else {
                        errHandlerPID("Error HTTP: " + this.statusText);
                        Dnv.systemInfo.setEstadoConectividadPid("HTTP error: " + this.status + " " + this.statusText);
                    }
                }
            }

            var clientPID = new XMLHttpRequest();
            clientPID.onreadystatechange = handlerPID;
            clientPID.onerror = errHandlerPID;
            clientPID.timeout = 45000;
            clientPID.ontimeout = function () {
                errHandlerPID("Timed out al obtener getPIDByIDPlayerJS!!!");
                Dnv.systemInfo.setEstadoConectividadPid("Timeout");
            };

            var time = new Date().getTime().toString(); // los milisegundos solo tienen 1000 valores posibles, mejor usar un parametro con un valor que no se repita
            var prot = Dnv.cfg.getConfigProtocolServer();
            if (!prot) {
                if (Dnv.deviceInfo.protocolServer) {
                    prot = Dnv.deviceInfo.protocolServer();
                } else {
                    prot = protocol;
                }
            }
            var urlServer = Dnv.cfg.getCfgString("WebServiceURL", prot + Dnv.cfg.getConfigIpServer() + "/WSResources/RemoteResources.asmx");
            console.log(urlServer + "/GetPIDByIDPlayerJS?IDPlayer=" + Dnv.cfg.getConfigID() + "&r=" + time);
            clientPID.open("GET", urlServer + "/GetPIDByIDPlayerJS?IDPlayer=" + Dnv.cfg.getConfigID() + "&r=" + time);

            //        $("#infoText").fadeIn(2000);
            //        document.getElementById('infoText').innerHTML = "Solicitando PID...";

            clientPID.send();
        },
        enviarTorrentStatus: function enviarTorrentStatus(estados, callback, errorCallback) {


            function errHandler(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR] Error al enviar torrent status: " + e);
                }
                if (errorCallback) errorCallback();
            }
            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        //console.log("Respuesta de torrent status");
                        if (callback) callback(result.textContent);

                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                    }
                }
            }

            /*
            
            <SetTorrentStatus xmlns="http://tempuri.org/">
            <status xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
            <a:KeyValueOfClaveTorrentstringd21suXpv>
            <a:Key xmlns:b="http://schemas.datacontract.org/2004/07/Deneva.WCFServices">
            <b:Destinatario>16229</b:Destinatario>
            <b:Recurso>4008</b:Recurso>
            <b:_destinatario>16229</b:_destinatario>
            <b:_recurso>4008</b:_recurso>
            </a:Key>
            <a:Value>&lt;TorrentStatus ObjetoDestino='16229' Recurso='4008' Progreso='100' Velocidad='4' SizeTotal='1234' SizeDescargado='1234' LastUpdate='1900-01-01' Estado='99' /&gt;</a:Value>
            </a:KeyValueOfClaveTorrentstringd21suXpv>
            <a:KeyValueOfClaveTorrentstringd21suXpv>
            <a:Key xmlns:b="http://schemas.datacontract.org/2004/07/Deneva.WCFServices">
            <b:Destinatario>16229</b:Destinatario>
            <b:Recurso>4477</b:Recurso>
            <b:_destinatario>16229</b:_destinatario>
            <b:_recurso>4477</b:_recurso>
            </a:Key>
            <a:Value>&lt;TorrentStatus ObjetoDestino='16229' Recurso='4477' Progreso='100' Velocidad='4' SizeTotal='1234' SizeDescargado='1234' LastUpdate='1900-01-01' Estado='99' /&gt;</a:Value>
            </a:KeyValueOfClaveTorrentstringd21suXpv>
            <a:KeyValueOfClaveTorrentstringd21suXpv>
            <a:Key xmlns:b="http://schemas.datacontract.org/2004/07/Deneva.WCFServices">
            <b:Destinatario>16229</b:Destinatario>
            <b:Recurso>3524</b:Recurso>
            <b:_destinatario>16229</b:_destinatario>
            <b:_recurso>3524</b:_recurso>
            </a:Key>
            <a:Value>&lt;TorrentStatus ObjetoDestino='16229' Recurso='3524' Progreso='100' Velocidad='4' SizeTotal='1234' SizeDescargado='1234' LastUpdate='1900-01-01' Estado='99' /&gt;</a:Value>
            </a:KeyValueOfClaveTorrentstringd21suXpv>
            </status>
            </SetTorrentStatus>
            */
            var ahora = Dnv.utiles.formatearFechaWCFUTC(new Date(), true);
            var xml = '<SetTorrentStatus xmlns="http://tempuri.org/"><status xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">';

            var keys = Object.keys(estados);
            for (var i = 0; i < keys.length; i++) {
                /*					
                Valores posibles de Estado:
                1;Detenido
                2;Pausado
                3;Descargando
                4;Seeding
                5;Hashing
                6;Parando
                7;Error
                99;Automático
                */
				var recur = Dnv.Pl.lastPlaylist.getRecursos();
				if(recur[keys[i]]){
					if(recur[keys[i]][Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0]]){
						if(!recur[keys[i]][Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0]].isSSP()){
							if (estados[keys[i]]) {
								var estado = (estados[keys[i]].progreso == 100 ? 4 : 3);
								xml += '<a:KeyValueOfClaveTorrentstringd21suXpv><a:Key xmlns:b="http://schemas.datacontract.org/2004/07/Deneva.WCFServices">' +
									'<b:Destinatario>' + objectId + '</b:Destinatario>' +
									'<b:Recurso>' + estados[keys[i]].recurso + '</b:Recurso>' +
									'<b:_destinatario>' + objectId + '</b:_destinatario>' +
									'<b:_recurso>' + estados[keys[i]].recurso + '</b:_recurso>' +
									"</a:Key><a:Value>&lt;TorrentStatus " +
									"ObjetoDestino='" + objectId + "' " +
									"Recurso='" + estados[keys[i]].recurso + "' " +
									"Progreso='" + estados[keys[i]].progreso + "' " +
									"Velocidad='" + (estados[keys[i]].speed !== undefined ? estados[keys[i]].speed : "0") + "' " +
									"VelocidadUsuario='" + (estados[keys[i]].origen !== undefined ? estados[keys[i]].origen : "4" /* Normal */) + "' " +
									"SizeTotal='" + estados[keys[i]].sizeTotal + "' " +
									"SizeDescargado='" + estados[keys[i]].sizeDescargado + "' " +
									"LastUpdate='" + ahora + "' " +
									"Estado='" + estado + "' /&gt;</a:Value>" +
									'</a:KeyValueOfClaveTorrentstringd21suXpv>';
							}
						}else{
							console.log("[SERVIDOR].SSP.SetTorrentStatus() Recurso de SSP no envip torrent status" + keys[i]);
						}
					}
				}else{
					console.log("[SERVIDOR]SetTorrentStatus() No envio el recurso " + keys[i] + " por no estar en la playlist")
				}
            }
            xml += '</status></SetTorrentStatus>';

            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000; // La llamada parece bastante lenta
            client.ontimeout = function () { errHandler("Timed out al enviar torrent status!!!"); };

            var url = Dnv.cfg.getCfgString("TorrentClientEndPointAddressWeb", defaultWcfBaseUrl + "/Servicios/WebTorrent") + "/SetTorrentStatus";
            client.open("POST", url);

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            //xml = undefine
            //client.send();

            console.log("[SERVIDOR] Enviando estado de descarga");
            client.send(xml);



        },

        getAvisos: function getAvisos(callback, errorCallback) {


            function errHandler(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR] Error al pedir avisos: " + e);
                }
                if (errorCallback) errorCallback();
            }
            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        //console.log("Respuesta de torrent status");
                        if (callback) callback(this.responseXML);

                    } else {
                        errHandler("[SERVIDOR] Avisos: Error HTTP: " + this.statusText);
                    }
                }
            }


            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000; // La llamada parece bastante lenta
            client.ontimeout = function () { errHandler("Timed out al pedir avisos!!!"); };

            var url = Dnv.cfg.getCfgString("AvisosClientEndPointAddressWeb", defaultWcfBaseUrl + "/ServicioAvisos/WebAvisos") + "/GetAvisos";

            var xml = '<GetAvisos xmlns="http://tempuri.org/"><ObjectID>' + objectId + '</ObjectID><rol>147</rol><replicador>false</replicador></GetAvisos>';


            client.open("POST", url);

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            //xml = undefine
            //client.send();

            console.log("[SERVIDOR] Pidiendo avisos");
            client.send(xml);



        },

        getRemoteControlCommands: function getRemoteControlCommands(callback, errorCallback) {


            function errHandler(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
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
                            var stringItems = this.responseXML.getElementsByTagName("string");
                            var resultado = [];
                            for (var i = 0; i < stringItems.length; i++) {
                                resultado.push(stringItems[i].textContent);
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

            var url = Dnv.cfg.getCfgString("AvisosClientEndPointAddressWeb", defaultWcfBaseUrl + "/ServicioAvisos/WebAvisos") + "/GetRemoteControl";

            var xml = '<GetRemoteControl xmlns="http://tempuri.org/"><ObjId>' + objectId + '</ObjId></GetRemoteControl>';

            client.open("POST", url);

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            //xml = undefine
            //client.send();

            console.log("[SERVIDOR] Pidiendo comandos de control");
            client.send(xml);



        },
        setStatusDispositivoExterno: function setStatusDispositivoExterno(idExterno, estado, descripcion, callback, errorCallback) {


            function errHandler(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR] Error al enviar el estado del dipositivo '" + idExterno + "': " + e);
                }
                if (errorCallback) errorCallback();
            }
            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        //console.log("Respuesta de torrent status");
                        if (callback) callback(result.textContent);

                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                    }
                }
            }

            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000; // La llamada parece bastante lenta
            client.ontimeout = function () { errHandler("Timed out al enviar el estado de dispositivos!!!"); };

            // El nombre del parametro "objetctID" esta escrito asi
            var url = Dnv.cfg.getCfgString("WebServiceURL", defaultWsBaseUrl + "/WSResources/RemoteResources.asmx") +
                "/SetStatus?objetctID=" + objectId + "&ID_EXTERNO=" + escape(idExterno) + "&estado=" + estado + "&descripcion=" + escape(descripcion);

            client.open("GET", url);

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            //xml = undefine
            //client.send();

            console.log("[SERVIDOR] Enviando estado de dispositivos");
            client.send();



        },
        setMetadatoDispositivoExterno: function setMetadatoDispositivoExterno(idExterno, metadato, valor, callback, errorCallback) {


            function errHandler(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR] Error al enviar el estado del dipositivo '" + idExterno + "': " + e);
                }
                if (errorCallback) errorCallback();
            }
            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                       
                        if (callback) callback(result.textContent);

                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                    }
                }
            }
            var EID = Dnv.cfg.getConfigEID();
            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000; // La llamada parece bastante lenta
            client.ontimeout = function () { errHandler("Timed out al enviar cambio de metadato de dispositivos!!!"); };

            // El nombre del parametro "objetctID" esta escrito asi
            var url = Dnv.cfg.getCfgString("WebServiceURL", defaultWsBaseUrl + "/WSResources/RemoteResources.asmx") +
                "/SetMetadatoValorByNombreDispositivoExterno?objId=" + objectId + "&nombreDispositivo=" + escape(idExterno) + "&metadato=" + escape(metadato) + "&valor=" + escape(valor) + "&EID=" + escape(EID);

            client.open("GET", url);

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            //xml = undefine
            //client.send();

            console.log("[SERVIDOR] Enviando cambio de valor en metadato de dispositivo " + idExterno + ": " + metadato + " con valor " + valor);
            client.send();



        },
        /*
        * Apaño perro, perro, perro
        * Si solo hay conexion por el puerto 80 y las conexiones al 8090 fallan, intentar notificar al servidor web...
        * Como no hay web service especifico, creamos errores 404...
        */
        logInServerLog: function (msg) {
            msg = Dnv.deviceInfo.modelName() + "_ID:" + Dnv.cfg.getConfigID() + "_PID:" + Dnv.cfg.getConfigPID() + "_" + msg;

            // 
            var client = new XMLHttpRequest();
            client.timeout = 5000;
            client.open("GET", (Dnv.cfg.getConfigProtocolServer() || "http://") + Dnv.deviceInfo.ipServer() + "/soc/log_errores_conexion/?=" + encodeURIComponent(msg));
            client.send();
        },
        setNowShowingPubli: function (objidSalida, calendario, canal, slide, campanya, insercion, recurso, plantilla, timestamp, extrainfo) {

            if (!Dnv.cfg.getCfgBoolean("NowShowingServiceEnabled", false)) return;

            function errHandler(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR] Error al enviar SetNowShowingPubli: " + e);
                }
            }

            var url = Dnv.cfg.getCfgString("LogsClientEndPointAddressWeb", defaultWcfBaseUrl + "/Servicios/WebLogs") + "/SetNowShowingPubli";
            var client = new XMLHttpRequest();
            client.onerror = errHandler;
            client.timeout = 15000;
            client.ontimeout = function () { errHandler("Timed out al enviar SetNowShowingPubli!!!"); };
            client.open("POST", url);
            var xml = '<SetNowShowingPubli xmlns="http://tempuri.org/" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">' +
                '<ObjectId>' + objidSalida + '</ObjectId>' +
                '<Calendario>' + calendario + '</Calendario>' +
                '<Canal>' + canal + '</Canal>' +
                '<Slide>' + slide + '</Slide>' +
                '<Campanya>' + campanya + '</Campanya>' +
                '<Insercion>' + insercion + '</Insercion>' +
                '<Recurso>' + recurso + '</Recurso>' +
                '<Plantilla>' + plantilla + '</Plantilla>' +
                '<TimeStamp>' + timestamp + '</TimeStamp>' +
                '<ExtraInfo>' + extrainfo + '</ExtraInfo>' +
                '</SetNowShowingPubli>';

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            client.send(xml);

        },
        setNowShowingStreaming: function (objidSalida, calendario, canal, slide, plantilla, timestamp, urlStream) {

            if (!Dnv.cfg.getCfgBoolean("NowShowingServiceEnabled", false)) return;

            console.info("[SERVIDOR]SetNowShowingStreaming " + objidSalida + " " + calendario + " " + canal + " " + slide + " " + timestamp + " " + urlStream);
            function errHandler(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR] Error al enviar SetNowShowingStreaming: " + e);
                }
            }
            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        //console.log("Respuesta de torrent status");
                        console.log("SetNowShowingStreaming enviado.")

                    } else {
                        errHandler("[SERVIDOR] Error al enviar SetNowShowingStreaming: Error HTTP: " + this.statusText);
                    }
                }
            }

            var url = Dnv.cfg.getCfgString("LogsClientEndPointAddressWeb", defaultWcfBaseUrl + "/Servicios/WebLogs") + "/SetNowShowingStreaming";
            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 15000;
            client.ontimeout = function () { errHandler("Timed out al enviar SetNowShowingStreaming!!!"); };
            client.open("POST", url);
            var xml = '<SetNowShowingStreaming xmlns="http://tempuri.org/" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">' +
                '<ObjectId>' + objidSalida + '</ObjectId>' +
                '<Calendario>' + calendario + '</Calendario>' +
                '<Canal>' + canal + '</Canal>' +
                '<Slide>' + slide + '</Slide>' +
                '<Plantilla>' + plantilla + '</Plantilla>' +
                '<TimeStamp>' + timestamp + '</TimeStamp>' +
                '<ExtraInfo></ExtraInfo>' +
                '<StreamingInfo>' + (urlStream ? urlStream : "") + '</StreamingInfo>' +
                '</SetNowShowingStreaming>';

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            client.send(xml);

        },
        setNowShowingPubliStreaming: function (objidSalida, calendario, canal, slide, campanya, insercion, recurso, plantilla, timestamp, extraInfo, urlStream) {

            if (!Dnv.cfg.getCfgBoolean("NowShowingServiceEnabled", false)) return;

            console.info("[SERVIDOR]SetNowShowingPubliStreaming " + objidSalida + " " + calendario + " " + canal + " " + slide + " " + timestamp + " " + urlStream);
            function errHandler(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR] Error al enviar SetNowShowingPubliStreaming: " + e);
                }
            }
            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        //console.log("Respuesta de torrent status");
                        console.log("SetNowShowingPubliStreaming enviado.")

                    } else {
                        errHandler("[SERVIDOR] Error al enviar SetNowShowingPubliStreaming: Error HTTP: " + this.statusText);
                    }
                }
            }

            var url = Dnv.cfg.getCfgString("LogsClientEndPointAddressWeb", defaultWcfBaseUrl + "/Servicios/WebLogs") + "/SetNowShowingPubliStreaming";
            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 15000;
            client.ontimeout = function () { errHandler("Timed out al enviar SetNowShowingPubliStreaming!!!"); };
            client.open("POST", url);
            var xml = '<SetNowShowingPubliStreaming xmlns="http://tempuri.org/" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">' +
                '<ObjectId>' + objidSalida + '</ObjectId>' +
                '<Calendario>' + calendario + '</Calendario>' +
                '<Canal>' + canal + '</Canal>' +
                '<Slide>' + slide + '</Slide>' +
                '<Campanya>' + campanya + '</Campanya>' +
                '<Insercion>' + insercion + '</Insercion>' +
                '<Recurso>' + recurso + '</Recurso>' +
                '<Plantilla>' + plantilla + '</Plantilla>' +
                '<TimeStamp>' + timestamp + '</TimeStamp>' +
                '<ExtraInfo>' + extraInfo +'</ExtraInfo>' +
                '<StreamingInfo>' + (urlStream ? urlStream : "") + '</StreamingInfo>' +
                '</SetNowShowingPubliStreaming>';

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            client.send(xml);
        },
        deleteDescargasDispositivo: function deleteDescargasDispositivo(callback, errorCallback) {


            function errHandler(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SERVIDOR] Error al descargar descargas de dispositivo: " + e);
                }
                if (errorCallback) errorCallback();
            }
            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        //console.log("Respuesta de torrent status");
                        if (callback) callback(result.textContent);

                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                    }
                }
            }

            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000; // La llamada parece bastante lenta
            client.ontimeout = function () { errHandler("Timed out al enviar borrado de descargas de dispositivo!!!"); };

            // El nombre del parametro "objetctID" esta escrito asi
            var url = Dnv.cfg.getCfgString("WebServiceURL", defaultWsBaseUrl + "/WSResources/RemoteResources.asmx") +
                "/DeleteDescargasDispo?ObjIDDIspo=" + Dnv.cfg.getCfgString("MyOwnCode", 0);

            client.open("GET", url);

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            //xml = undefine
            //client.send();

            console.log("[SERVIDOR] Borrando descargas de dispositivo");
            client.send();


        },

        DNVControlComandoEjecutado: function DNVControlComandoEjecutado(codigocomando, objId, estado, descripcion, callback, errorCallback) {


            function errHandler(e) {
                if (_loguearMensajesErrorRed) {
                    console.error("[SERVIDOR] Error al enviar el resultado de comandos de control: " + e);
                }
                if (errorCallback) errorCallback();
            }
            function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        //console.log("Respuesta de torrent status");
                        if (callback) {
                            //this.responseXML.getElementsByTgName

                            callback(this.responseXML);
                        }

                    } else {
                        errHandler("[SERVIDOR] Envio de resultado de comandos de control: Error HTTP: " + this.statusText);
                    }
                }
            }


            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 45000; // La llamada parece bastante lenta
            client.ontimeout = function () { errHandler("Timed out al enviar resultado de comandos de control!!!"); };

            if (!defaultWsBaseUrl) {
                defaultWsBaseUrl = Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getConfigIpServer();
            }

            var url = Dnv.cfg.getCfgString("WebServiceURL", defaultWsBaseUrl + "/WSResources/RemoteResources.asmx") + "/DNVControlComandoEjecutado?codigocomando=" + codigocomando + "&objID=" + objId + "&estado=" + estado + "&descripcion=" + encodeURIComponent(descripcion);

            client.open("GET", url);

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');


            client.send();
        }
    };
})();

