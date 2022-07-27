
"use strict";

var Dnv = Dnv || {};

var CFG_CARGADA_EVENT = "CFG_CARGADA_EVENT";

//Dnv.Cfg = Dnv.Cfg || {};
Dnv.cfg = (function () {

    var CFG_PREFIX = "cfg_";
    var INTERNAL_CFG_PREFIX = "internal_cfg_";
    var PL_KEY = "pl";
    var BACKUP_TIMESTAMP_KEY = "backup_timestamp";
    var BACKUP_FILENAME = "cfg_backup.json";
    var CFG_OBJECTID = 0; //38233281;
    var cfgCargada = false;

    var cfg = {
        /*
        no_es_cfg: 1234,
        cfg_string: "abc",
        cfg_number: 1234,
        cfg_boolean: true,
        cfg_strnbr: "1234",
        cfg_strbln1: "1",
        cfg_strblnt: "true",
        cfg_strbln0: "0",
        cfg_strblnf: "false",
        
        */
    };



    function _castToString(value) {
        return "" + value;
    };

    function _castToInt(value) { // REalmente a number, aunque sea flotante
        if (typeof value === 'number') {
            return value;
            //} else if (!Number.isNaN(value)){
        } else if (!isNaN(value)) {
            return parseInt(value, 10);
        } // else if (value !== null && value !== undefined) {
        console.log("El valor " + value + " no es un número");
        //}
        throw new Error("No podemos convertir a integer");
        //return undefined;
    };

    function _castToBoolean(value) {
        if (typeof value === 'boolean') {
            return value;
        } else if (typeof value === 'string') {
            if (value === '0' || value.toLowerCase() === "false") {
                return false;
            } else if (value === '1' || value.toLowerCase() === "true") {
                return true;
            }
        }
        //if (value !== null && value !== undefined) {
        console.error("El valor " + value + "no es un boolean");
        //}

        throw new Error("No podemos convertir a boolean");
        //return undefined;
    };


    function _hacerBackupADisco() {
        // En LG me da la impresion de que se carga un localStorage viejo en ocasiones, por lo que hacemos un backup a un archivo de vez en cuando
        try {
            var ahora = new Date().getTime();
            window.localStorage[BACKUP_TIMESTAMP_KEY] = ahora;
            Dnv.monitor.writeFile(Dnv.Cloud._PATH + "/" + BACKUP_FILENAME, JSON.stringify(window.localStorage));
        } catch (e) {
            console.error("[CFG] No pudimos hacer un backup");
        }
    }

    function _eliminarBackupDeDisco() {
        try {
            console.warn("[CFG] Borrando el backup de configuración");
            window.localStorage[BACKUP_TIMESTAMP_KEY] = 0;
            Dnv.monitor.deleteFile(Dnv.Cloud._PATH + "/" + BACKUP_FILENAME);
        } catch (e) {
            console.error("[CFG] No pudimos borrar el backup");
        }
    }

    function _comprobarBackupDeDisco(callback) {

        var callbackLlamado = false;
        Dnv.monitor.readFileAsync(Dnv.Cloud._PATH + "/" + BACKUP_FILENAME,
            function exitoCb(resultado) {
                try {
                    var datos = JSON.parse(resultado);
                    /*
                    * En LG, las pantallas SM5KE con webOS4.0 y FW 03.01.70, tras actualizar la aplicación,
                    * pierden el contenido de Local Storage.
                    */
                    if ((window.localStorage[BACKUP_TIMESTAMP_KEY] === undefined && datos[BACKUP_TIMESTAMP_KEY] !== undefined) ||
                            parseInt(window.localStorage[BACKUP_TIMESTAMP_KEY]) < parseInt(datos[BACKUP_TIMESTAMP_KEY])) {
                        console.warn("[CFG] Los datos del backup de configuracion son más nuevos (" + datos[BACKUP_TIMESTAMP_KEY] + ") que los de localStorage (" + window.localStorage[BACKUP_TIMESTAMP_KEY] + ")");
                        // AMR Comento la alarma
                        // Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "La configuración en disco no parece ser correcta.");
                        // TODO: Reemplazar los datos de localStorage?
                        var hayCambios = false;
                        for (var k in datos) {
                            if (datos.hasOwnProperty(k)) {
                                if (k != BACKUP_TIMESTAMP_KEY && window.localStorage[k] != datos[k]) {
                                    hayCambios = true;
                                    window.localStorage[k] = datos[k];
                                }
                            }
                        }
                        if (hayCambios) {
                            console.warn("[CFG] Hemos actualizado la configuracion con datos procedentes del backup, pero NO reiniciamos");
                            var date = new Date();
                            window.localStorage[BACKUP_TIMESTAMP_KEY] = datos[BACKUP_TIMESTAMP_KEY];
                            //AMR Comento este reinicio porque solo trae problemas. Hay veces que entra en un bucle de reinicios
                            if (Main.info.engine === "LG") {
                                Dnv.monitor.resetApp();
                            }

                        } else {
                            console.warn("[CFG] El backup y la configuracion de disco tenian los mismos datos");
                        }
                    }
                } catch (e) {
                    console.error("[CFG] No pudimos comprobar el backup de configuracion");

                    console.error(e);
                }
                callbackLlamado = true;
                if (callback) callback();
            }, function errorCb() {
                console.warn("[CFG] No se pudieron leer los datos del backup de configuracion");

                callbackLlamado = true;
                if (callback) callback();
            });

        setTimeout(function () {
            if (!callbackLlamado) {
                callbackLlamado = true;
                if (callback) callback();
            }
        }, 15000);
    }



    return {

        //getObjectId: function () { return CFG_OBJECTID; },
        getObjectId: function () { return Dnv.cfg.getCfgInt("MyOwnCode", 0); },
        cargarCfg: function cargarCfg(successCallback, errorCallback) {


            /** AMACHO
            if (Dnv.sincronizacion.isMaestroSincronizando()) {
            // Necesitamos interactividad, asi que pasamos de cosas que puedan ocupar el hilo principal
            // Ni siquiera llamamos a callbacks
            return;
            }
            **/

            // Llamada AJAX
            var that = Dnv.cfg; // this;

            var pid = Dnv.cfg.getConfigPID();

            if (Dnv.cfg.getConfigPID() === undefined) {
                // No estamos configurados...
                console.warn("[CONFIG] No tenemos PID ¿Es la primera vez que arrancamos?");
                if (Main.info.engine == "TOSHIBA") {

                    var upgradedFirm = DatabaseManager.read("TOSHIBA_UPGRADED_FIRM");

                    if (upgradedFirm == "true") {
                        console.warn("[CONFIG](TOSHIBA) No cargamos cfg de disco porque se esta actualizando el firm.");
                    } else {
                        that.cargarCfgDeDisco();
                    }

                } else {
                    that.cargarCfgDeDisco();
                }
                if (successCallback) successCallback();

                return;
            }

            function _successCbConfig(responseXML, timeStamp) {
                /*
                 * timeStamp sera undefined si no se usa WSDenevaRequest
                 */
                if (responseXML == "Sin cambios") {
                    console.log("[CONFIGUARCION] La configuracion devuelta por WSRequest no tiene cambios")
                    if (successCallback) successCallback();
                    return;
                }
                if (Dnv.cfg.getConfigPID() == 0) {
                    console.warn("[CONFIGURACION] Nos ha llegado una respuesta de configuracion, pero no tenemos ID... Puede que acaben de reconfigurarnos, descartamos la configuración");
                    if (successCallback) successCallback();
                    return;
                }

                var xmlElements = responseXML.getElementsByTagName("XML");
                if (xmlElements.length == 0) xmlElements = responseXML.getElementsByTagNameNS("http://schemas.datacontract.org/2004/07/Deneva.WCFServices", "XML");
                if (xmlElements.length > 0 || timeStamp) {
                    if (timeStamp) {
                        var doc = responseXML;
                    } else {
                        var result = xmlElements[0];
                        var doc = new DOMParser().parseFromString(result.textContent, "text/xml");
                    }


                    var iterator = document.evaluate("/configuration/userSettings/*/setting", doc, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
                    

                    var lastUpdated = responseXML.getElementsByTagName("LastUpdated");
                    if (timeStamp) {
                        lastUpdated = Dnv.utiles.formatearFecha(new Date(Date.parse(timeStamp)),false)
                    } else {
                        if (lastUpdated.length != 0) {
                            lastUpdated = lastUpdated[0].textContent;
                        } else {
                            lastUpdated = responseXML.getElementsByTagNameNS("http://schemas.datacontract.org/2004/07/Deneva.WCFServices", "LastUpdated")[0].textContent;
                        }
                    }

                    Dnv.cfg.setInternalCfgString("configLastUpdated", lastUpdated);

                    var thisNode = iterator.iterateNext();

                    while (thisNode) {
                        cfg[CFG_PREFIX + thisNode.getAttribute("name")] = thisNode.getElementsByTagName("value")[0].textContent;
                        thisNode = iterator.iterateNext();
                    }

                    console.log("[CONFIGURACION] Configuración cargada de red.");

                    that.guardarCfgEnDisco();

                    CFG_OBJECTID = Dnv.cfg.getCfgInt("MyOwnCode", 0);
                    //Dnv.cfg.configurarPlayer();
                    cfgCargada = true;
                    window.dispatchEvent(new CustomEvent(CFG_CARGADA_EVENT, { 'detail': {} })); window.dispatchEvent(new CustomEvent(CFG_CARGADA_EVENT, { 'detail': {} }));

                    if (successCallback) successCallback();
                } else if (Dnv.cfg.getCfgInt("MyOwnCode", 0) != 0) { // Estamos configurados de antes...
                    console.log("[CONFIGURACION] La configuracion parece actualizada");
                    var estabaCargada = cfgCargada;
                    cfgCargada = true;
                    if (!estabaCargada) window.dispatchEvent(new CustomEvent(CFG_CARGADA_EVENT, { 'detail': {} }));

                    if (successCallback) successCallback();
                } else { // ?????
                    console.error("[CONFIGURACION] El servidor devolvió una respuesta de configuracion inesperada (probablemente vacia): " + responseXML);
                    that.cargarCfgDeDisco(successCallback);
                    /** TODO
                    console.warn("[CONFIGURACION] Se vuelve a pedir configuración en 30 segundos");
                    setTimeout(function () {
                    Dnv.servidor.getConfigByPID(Dnv.cfg.getConfigPID(), _successCbConfig, _errorCbConfig);
                    }, 30000);
                    **/
                }

            }

            function _errorCbConfig(doc) {
                // FIXME: y si no hay cfg en disco?
                var objId = Dnv.cfg.getCfgInt("MyOwnCode", 0);
                if (!cfgCargada || objId == 0) {
                    that.cargarCfgDeDisco(successCallback);
                    /** TODO
                    console.warn("[CONFIGURACION] Se vuelve a pedir configuración en 30 segundos");
                    setTimeout(function () {
                    Dnv.servidor.getConfigByPID(Dnv.cfg.getConfigPID(), _successCbConfig, _errorCbConfig);
                    }, 30000);
                    **/
                } else {
                    // Ya tenemos una configuracion cargada de red... no hacemos nada
                    if (successCallback) successCallback();
                }
            }

            Dnv.servidor.getConfigByPID(Dnv.cfg.getConfigPID(), _successCbConfig, _errorCbConfig);

        },
        cargarCfgDeDisco: function cargarCfgDeDisco(callback) {

            function check() {
                for (var key in window.localStorage) {
                    if (key.substr(0, CFG_PREFIX.length) === CFG_PREFIX) {
                        //console.log("[CONFIGURACION] cargamos config de disco " + key);
                        // Bug: SAMSUNG (Maple2012), un string vacio guardado en localStorage, se lee como null
                        //      LG tambien lo hace en primer arranque
                        if (/*Main.info.engine === "SAMSUNG" && */window.localStorage[key] === null) {
                            cfg[key] = "";
                        } else {
                            cfg[key] = window.localStorage[key];
                        }
                    }
                }
            }

            if (Main.info.engine == "TOSHIBA") {

                var numKeys = DatabaseManager.read("TOSHIBA_NUM_DB");
                var upgradedFirm = DatabaseManager.read("TOSHIBA_UPGRADED_FIRM");

                if (numKeys != "" && upgradedFirm == "true") {

                    console.info("[CFG] Iniciamos despues de una actualizacion de firm");

                    console.warn("[CFG] (TOSHIBA) Intento de obtencion de backup de Storage Manager");
                    for (var i = 0; i < numKeys; i++) {
                        var clave = DatabaseManager.read(i);
                        window.localStorage[clave] = DatabaseManager.read(clave);
                    }

                    var resultado = DatabaseManager.write("TOSHIBA_UPGRADED_FIRM", "false");
                    console.warn("[CFG] (TOSHIBA) Backup obtenido de Storage Manager");

                    Dnv.monitor.resetApp();

                } else { check(); }

            } else { check(); }

            console.warn("Configuración cargada de disco (" + Object.keys(cfg).length + " elementos)");

            window.dispatchEvent(new CustomEvent(CFG_CARGADA_EVENT, { 'detail': {} }));

            _comprobarBackupDeDisco(callback); // Asincrono

            //console.trace();
            //Dnv.cfg.configurarPlayer();
        },
        guardarCfgEnDisco: function guardarCfgEnDisco() {
            var resetear = false;
            console.log("[CONFIGURACION]: Guardamos configuración a disco (" + Object.keys(cfg).length + " elementos)");

            function wait(ms) {
                var start = new Date().getTime();
                var end = start;
                while (end < start + ms) {
                    end = new Date().getTime();
                }
            }

            for (var key in cfg) {
                //console.log("key " + key + "\t\tcfg " + cfg[key] + "\t\tlocalStorage " + window.localStorage[key]+" typeof "+(typeof window.localStorage[key])+ " "+JSON.stringify(window.localStorage[key]));
                if (key.substr(0, CFG_PREFIX.length) === CFG_PREFIX) {

                    if (window.localStorage[key] != cfg[key]) {
                        if (window.localStorage[key] !== null && window.localStorage[key] !== undefined && window.localStorage[key] !== "" && cfg[key] !== "") {
                            console.warn("[CONFIGURACION] Hay cambios en " + key);
                            console.warn("[CONFIGURACION]  - - - key: " + key + " local " + window.localStorage[key] + " :::: cfg " + cfg[key] + " :::");
                            resetear = true;
                        } else if ((window.localStorage[key] === null || window.localStorage[key] === undefined) && (cfg[key] !== undefined && cfg[key] !== null)) {
                            // Bug: SAMSUNG (Maple2012), un string vacio guardado en localStorage, se lee como null
                            //      LG webOS tambien lo hace en primer arranque
                            if (!(/*Main.info.engine === "SAMSUNG" && */window.localStorage[key] === null && cfg[key] === "")) {
                                console.warn("[CONFIGURACION] Hay cambios en la configuración. Nuevo setting: " + key);
                                resetear = true;
                            }
                        } else {
                            console.log("[CONFIGURACION] setting vacío " + key);
                        }
                        if (Main.info.engine == "TOSHIBA") {
                            resetear = true;
                        }
                    }
                    console.log("Guardamos " + key + "=" + cfg[key])
                    window.localStorage[key] = cfg[key];
                    if (Main.info.engine == "TIZEN") wait(10);
                }
            }

            Dnv.cfg.setInternalCfgString("timeLastConfig", Dnv.utiles.formatearFecha(new Date()));

            console.log("[CONFIGURACION]: ==== MYOWNCODE ====  " + Dnv.cfg.getCfgInt("MyOwnCode", 0));
            //resetear = false
            if (resetear == false) {
                console.log("[CONFIGURACION] NO hay cambios en la configuración.");
            } else {
                console.warn("[CONFIGURACION] Hay cambios en la configuración, reseteamos APP");
                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Reiniciando aplicación debido a cambios de configuración.");

                _hacerBackupADisco(); // Ojo, sera asincrono en LG

                setTimeout(function () {
                    // Vuelvo a loguear, para no tener que ir 5 segundos para arriba
                    var msg = "[CONFIGURACION] - Reseteamos las aplicaciones debido a un cambio de configuración";
                    console.warn(msg);
                    Dnv.monitor.writeLogFile(msg);
                    Dnv.monitor.resetApp();
                }, 10000); // Reseteamos dentro de 10 segundos por si no ha copiado los cambios a disco...
                //Dnv.monitor.resetApp();
            }
        },

        hacerBackupADisco: _hacerBackupADisco,

        limpiarCfgDeDisco: function limpiarCfgDeDisco() {
            for (var key in window.localStorage) {
                if (key.substr(0, CFG_PREFIX.length) === CFG_PREFIX) {
                    delete window.localStorage[key];
                    //window.localStorage.removeItem(key);
                    console.info("[CONFIGURACION] Borrado " + key);
                }
            }
            _eliminarBackupDeDisco();
            console.warn("[CONFIGURACION] Configuración borrada de disco.");
            //console.trace();
        },

        limpiarPreciosMenuboard: function limpiarPreciosMenuboard() {
            delete window.localStorage["menuboard"];

            console.warn("[MENUBOARD] Precios borrados de disco.");
        },

        limpiarCfgDeMemoria: function limpiarCfgDeMemoria() {
            for (var key in cfg) {
                if (key.substr(0, CFG_PREFIX.length) === CFG_PREFIX) {
                    delete cfg[key];
                }
            }
            console.warn("[CONFIGURACION] Configuración borrada de memoria.");
        },


        cargarPlDeDisco: function cargarPlDeDisco() {
            return window.localStorage[PL_KEY];
            console.warn("Playlist cargada de disco");
        },

        guardarPlEnDisco: function guardarPlEnDisco(xml) {
            window.localStorage[PL_KEY] = xml;

            _hacerBackupADisco(); // Ojo, sera asincrono en LG
        },

        borrarPlEnDisco: function borrarPlEnDisco() {
            delete window.localStorage[PL_KEY];
        },

        setCfgString: function setCfgString(key, value) {
            cfg[CFG_PREFIX + key] = value;
        },

        getCfgString: function getCfgString(key, defaultValue) {
            if (cfg.hasOwnProperty(CFG_PREFIX + key)) {
                return "" + cfg[CFG_PREFIX + key];
            } else if (window.localStorage.hasOwnProperty(CFG_PREFIX + key)) {
                return "" + window.localStorage[CFG_PREFIX + key];
            } else {
                console.warn("cfg (setCfgString). Devolvemos el valor por defecto para " + key);
                return defaultValue;
            }
        },

        getCfgInt: function getCfgInt(key, defaultValue) {
            var val = undefined;
            if (cfg.hasOwnProperty(CFG_PREFIX + key)) {
                val = cfg[CFG_PREFIX + key];
            } else if (window.localStorage.hasOwnProperty(CFG_PREFIX + key)) {
                val = window.localStorage[CFG_PREFIX + key];
            }

            if (val !== undefined) {
                if (typeof val === 'number') {
                    return val;
                    //} else if (!Number.isNaN(val)){
                } else if (!isNaN(val)) {
                    return parseInt(val, 10);
                } else if (val !== null && val !== undefined) {
                    console.error("El valor de configuracion " + key + " no es un número sino: " + val);
                }
            } else {
                console.warn("cfg (getCfgInt). Devolvemos el valor por defecto para " + key);
                return defaultValue;
            }
        },

        getCfgNoCacheInt: function getCfgNoCacheInt(key, defaultValue) {
            if (window.localStorage.hasOwnProperty(CFG_PREFIX + key)) {
                var val = window.localStorage[CFG_PREFIX + key];
                if (typeof val === 'number') {
                    return val;
                    //} else if (!Number.isNaN(val)){
                } else if (!isNaN(val)) {
                    return parseInt(val, 10);
                } else if (val !== null && val !== undefined) {
                    console.error("El valor de configuracion " + key + " no es un número sino: " + val);
                }
            } else {
                console.warn("cfg (getCfgNoCacheInt). Devolvemos el valor por defecto para " + key);
                return defaultValue;
            }
        },

        getCfgBoolean: function getCfgBoolean(key, defaultValue) {
            var val = undefined;
            if (cfg.hasOwnProperty(CFG_PREFIX + key)) {
                val = cfg[CFG_PREFIX + key];
            } else if (window.localStorage.hasOwnProperty(CFG_PREFIX + key)) {
                val = window.localStorage[CFG_PREFIX + key];
            }

            if (val !== undefined) {
                //var val = cfg[CFG_PREFIX + key];
                if (typeof val === 'boolean') {
                    return val;
                } else if (typeof val === 'string') {
                    if (val === '0' || val.toLowerCase() === "false") {
                        return false;
                    } else if (val === '1' || val.toLowerCase() === "true") {
                        return true;
                    }
                }
                if (val !== null && val !== undefined) {
                    console.error("El valor de configuracion " + key + " no es un boolean sino: " + val);
                }
            } else {
                console.warn("cfg (getCfgBoolean). Devolvemos el valor por defecto para " + key);
                return defaultValue;
            }
        },

        isAapagado: function isAapagado() {
            //todo RAG
            return false;
        },

        getConfigurado: function getConfigurado() {
            var valor = window.localStorage[INTERNAL_CFG_PREFIX + "configurado"];
            if (valor === undefined) { // Inicializamos
                Dnv.cfg.setConfigurado(false);
                return false;
            }
            try {
                return _castToBoolean(valor);
            } catch (e) {
                return false;
            }
        },

        getConfiguradoTime: function getConfiguradoTime() {
            var time = 0;
            try {
                return _castToInt(window.localStorage[INTERNAL_CFG_PREFIX + "configurado_time"]);
            } catch (e) {
                return time
            }
        },
        getConfigTimeStamp: function getConfigTimeStamp() {
            var time = 0;
            try {
                var timeString = window.localStorage[INTERNAL_CFG_PREFIX + "configLastUpdated"];
                var numero = Dnv.utiles.stringToTimestamp(timeString.replace("T"," ")).getTime();
                return numero
            } catch (e) {
                return time
            }
        },
        setConfigurado: function setConfigurado(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "configurado"] = _castToBoolean(value);
            window.localStorage[INTERNAL_CFG_PREFIX + "configurado_time"] = _castToInt(new Date().getTime());
        },
               
        getConfigProtocolServer: function getConfigProtocolServer() {
            //for (var key in window.localStorage) {
            //if (key.indexOf(INTERNAL_CFG_PREFIX + "ipServer") > -1) {
            if (window.localStorage[INTERNAL_CFG_PREFIX + "protocolServer"]) {
                return window.localStorage[INTERNAL_CFG_PREFIX + "protocolServer"];
            } else {
                return "http://";
            }
            //}
            //}
            //return undefined;
        },

        setConfigProtocolServer: function setConfigProtocolServer(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "protocolServer"] = value;
        },

        getConfigIpServer: function getConfigIpServer() {
            //for (var key in window.localStorage) {
            //if (key.indexOf(INTERNAL_CFG_PREFIX + "ipServer") > -1) {
            return window.localStorage[INTERNAL_CFG_PREFIX + "ipServer"];
            //}
            //}
            //return undefined;
        },

        setConfigIpServer: function setConfigIpServer(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "ipServer"] = value;
        },

        /**
         * Devolver la ruta por defecto de los WCF.
         * Si usamos http sera http://servidor:8090
         * Si usamos https sera https://servidor
         */
        getDefaultWcfServerAddress: function getDefaultWcfServerAddress() {
            if (Dnv.cfg.getConfigProtocolServer() === "http://") {
                return "http://" + Dnv.cfg.getCfgString("IPMaster", Dnv.deviceInfo.ipServer()) + ":8090";
            } else {
                return Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getCfgString("IPMaster", Dnv.deviceInfo.ipServer());
            }
        },

        getConfigID: function getConfigID() {
            //for (var key in window.localStorage) {
            //if (key.indexOf(INTERNAL_CFG_PREFIX + "configID") > -1) {
            return window.localStorage[INTERNAL_CFG_PREFIX + "configID"];
            //}
            //}
            //return undefined;
        },

        setConfigID: function setConfigID(pid) {
            window.localStorage[INTERNAL_CFG_PREFIX + "configID"] = pid;
        },

        getConfigPID: function getConfigPID() {
            //for (var key in window.localStorage) {
            //if (key.indexOf(INTERNAL_CFG_PREFIX + "configPID") > -1) {

            return window.localStorage[INTERNAL_CFG_PREFIX + "configPID"];
            //}
            //}
            //return undefined;
        },

        setConfigPID: function setConfigPID(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "configPID"] = value;
        },

        getConfigEID: function getConfigEID() {
            //for (var key in window.localStorage) {
            //if (key.indexOf(INTERNAL_CFG_PREFIX + "configEID") > -1) {
            return window.localStorage[INTERNAL_CFG_PREFIX + "configEID"];
            //}
            //}
            //return undefined;
        },

        setConfigEID: function setConfigEID(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "configEID"] = value;
        },

        getValidezCfgID: function getValidezCfgID() {
            //for (var key in window.localStorage) {
            //if (key.indexOf(INTERNAL_CFG_PREFIX + "validezConfigID") > -1) {
            return parseFloat(window.localStorage[INTERNAL_CFG_PREFIX + "validezConfigID"]);
            //}
            //}
            //return undefined;
        },

        setValidezCfgID: function setValidezCfgID(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "validezConfigID"] = value;
        },

        getUrlConfigID: function getUrlConfigID() {
            //for (var key in window.localStorage) {
            //if (key.indexOf(INTERNAL_CFG_PREFIX + "UrlConfigID") > -1) {
            return window.localStorage[INTERNAL_CFG_PREFIX + "UrlConfigID"];
            //}
            //}
            //return undefined;
        },

        setUrlConfigID: function setUrlConfigID(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "UrlConfigID"] = value;
        },

        // FIXME: [CAR] Esto habría que ofuscarlo de alguna forma...

        getValidezLicencia: function getValidezLicencia() {
            //for (var key in window.localStorage) {
            //if (key.indexOf(INTERNAL_CFG_PREFIX + "validezLicencia") > -1) {
            return parseFloat(window.localStorage[INTERNAL_CFG_PREFIX + "validezLicencia"]);
            //}
            //}
            //return undefined;
        },

        setValidezLicencia: function setValidezLicencia(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "validezLicencia"] = value;
        },

        getMacLicencia: function getMacLicencia() {
            return window.localStorage[INTERNAL_CFG_PREFIX + "macLicencia"];
        },

        setMacLicencia: function setMacLicencia(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "macLicencia"] = value;
        },

        getTimeStampLastComandoDiferido: function getTimeStampLastComandoDiferido() {
            //for (var key in window.localStorage) {
            //if (key.indexOf(INTERNAL_CFG_PREFIX + "timeStampLastComandoDiferido") > -1) {
            return window.localStorage[INTERNAL_CFG_PREFIX + "timeStampLastComandoDiferido"];
            // }
            // }
            //return undefined;
        },
        //no borrar cuando se reconfigure (comandos diferidos)!!
        setTimeStampLastComandoDiferido: function setTimeStampLastComandoDiferido(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "timeStampLastComandoDiferido"] = value;
        },

        getKeysEnabled: function getKeysEnabled() {
            var valor = window.localStorage[INTERNAL_CFG_PREFIX + "keysEnabled"];
            if (valor === undefined) { // Inicializamos
                Dnv.cfg.setKeysEnabled(false);
                return false;
            }
            try {
                return _castToBoolean(valor);
            } catch (e) {
                return false;
            }
        },

        setKeysEnabled: function setKeysEnabled(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "keysEnabled"] = _castToBoolean(value);
        },

        getLastDayAuditoriaUploaded: function getLastDayAuditoriaUploaded() {
            return window.localStorage[INTERNAL_CFG_PREFIX + "lastDayAuditoriaUploaded"];
        },

        setLastDayAuditoriaUploaded: function setLastDayAuditoriaUploaded(value) {
            window.localStorage[INTERNAL_CFG_PREFIX + "lastDayAuditoriaUploaded"] = value;
        },

        setInternalCfgString: function setInternalCfgString(key, value) {
            cfg[INTERNAL_CFG_PREFIX + key] = value;
            window.localStorage[INTERNAL_CFG_PREFIX + key] = value;
        },

        getInternalCfgString: function getInternalCfgString(key, defaultValue) {
            if (cfg.hasOwnProperty(INTERNAL_CFG_PREFIX + key)) {
                return "" + cfg[INTERNAL_CFG_PREFIX + key];
            } else if (window.localStorage.hasOwnProperty(INTERNAL_CFG_PREFIX + key)) {
                cfg[INTERNAL_CFG_PREFIX + key] = window.localStorage[INTERNAL_CFG_PREFIX + key];
                return "" + cfg[INTERNAL_CFG_PREFIX + key];
            } else {
                console.warn("cfg (getInternalCfgString). Devolvemos el valor por defecto para " + key);
                return defaultValue;
            }
        },

        deleteInternalCfgString: function setInternalCfgString(key) {
            delete cfg[INTERNAL_CFG_PREFIX + key];
            window.localStorage.removeItem(INTERNAL_CFG_PREFIX + key);
        },

        setInternalCfgInt: function setInternalCfgInt(key, value) {
            cfg[INTERNAL_CFG_PREFIX + key] = value;
            window.localStorage[INTERNAL_CFG_PREFIX + key] = value;
        },

        getInternalCfgInt: function getInternalCfgInt(key, defaultValue) {
            if (cfg.hasOwnProperty(INTERNAL_CFG_PREFIX + key)) {
                return _castToInt(cfg[INTERNAL_CFG_PREFIX + key]);
            } else if (window.localStorage.hasOwnProperty(INTERNAL_CFG_PREFIX + key)) {
                cfg[INTERNAL_CFG_PREFIX + key] = _castToInt(window.localStorage[INTERNAL_CFG_PREFIX + key]);
                return cfg[INTERNAL_CFG_PREFIX + key];
            } else {
                console.warn("cfg (getInternalCfgInt). Devolvemos el valor por defecto para " + key);
                return defaultValue;
            }
        },
        deleteInternalCfgInt: function setInternalCfgInt(key) {
            delete cfg[INTERNAL_CFG_PREFIX + key];
            window.localStorage.removeItem(INTERNAL_CFG_PREFIX + key);
        },

        setInternalCfgBoolean: function setInternalCfgBoolean(key, value) {
            cfg[INTERNAL_CFG_PREFIX + key] = value;
            window.localStorage[INTERNAL_CFG_PREFIX + key] = value;
        },

        getInternalCfgBoolean: function getInternalCfgBoolean(key, defaultValue) {
            if (cfg.hasOwnProperty(INTERNAL_CFG_PREFIX + key)) {
                return _castToBoolean(cfg[INTERNAL_CFG_PREFIX + key]);
            } else if (window.localStorage.hasOwnProperty(INTERNAL_CFG_PREFIX + key)) {
                cfg[INTERNAL_CFG_PREFIX + key] = _castToBoolean(window.localStorage[INTERNAL_CFG_PREFIX + key]);
                return cfg[INTERNAL_CFG_PREFIX + key];
            } else {
                console.warn("cfg (getInternalCfgBoolean). Devolvemos el valor por defecto para " + key);
                return defaultValue;
            }
        },
        deleteInternalCfgBoolean: function setInternalCfgBoolean(key) {
            delete cfg[INTERNAL_CFG_PREFIX + key];
            window.localStorage.removeItem(INTERNAL_CFG_PREFIX + key);
        },

        hacerBackupCfg: function hacerBackupCfg() { _hacerBackupADisco(); },
        resetConfig: function resetConfig(noReiniciar) {
            console.warn("----------resetConfig----------");
            Dnv.servidor.deleteDescargasDispositivo();
            Dnv.cfg.setConfigurado(false);
            Dnv.cfg.setConfigID(0);
            Dnv.cfg.setValidezCfgID(0);
            Dnv.cfg.setConfigPID(0);
            Dnv.cfg.setConfigEID(0);
            Dnv.cfg.setUrlConfigID("");
            Dnv.cfg.deleteInternalCfgString("configLastUpdated");
            Dnv.cfg.deleteInternalCfgString("videowall_top_position");
            Dnv.cfg.deleteInternalCfgString("videowall_left_position");
            Dnv.cfg.deleteInternalCfgString("videowall_zoom_position");
            Dnv.cfg.limpiarCfgDeDisco();
            Dnv.cfg.limpiarCfgDeMemoria();
            Dnv.cfg.limpiarPreciosMenuboard();
            Dnv.cfg.borrarPlEnDisco();
            Dnv.Pl.lastPlaylist = undefined;
            Dnv.Pl.lastPlaylistDocument = undefined;
            Dnv.cfg.setValidezLicencia(0);
            Dnv.cfg.setMacLicencia(null);
            Dnv.comandos.eliminarComandosDiferidos();
            Dnv.limpieza.eliminarArchivos();
            Dnv.limpieza.eliminarListados();

            _hacerBackupADisco(); // Pisamos el backup...

            if (Main.info.engine == "TOSHIBA") {
                Dnv.monitor.clearDatabase();
                Dnv.monitor.formatUSB();
            }
            /*
            internal_cfg_keysEnabled: "false"
            internal_cfg_lastDayAuditoriaUploaded: "2015-12-13 00:00:01" <- resetear?
            internal_cfg_timeStampLastComandoDiferido: "2015-12-14T11:10:03" <- resetear?
            */

            if (!noReiniciar) {
                Dnv.monitor.resetApp();
            }

        },

        resetContents: function resetContents() {
            console.warn("----------resetContents----------");

            Dnv.servidor.deleteDescargasDispositivo();
            Dnv.cfg.deleteInternalCfgString("configLastUpdated");
            Dnv.cfg.limpiarCfgDeDisco();
            Dnv.cfg.limpiarCfgDeMemoria();
            Dnv.cfg.limpiarPreciosMenuboard();
            Dnv.cfg.borrarPlEnDisco();
            Dnv.Pl.lastPlaylist = undefined;
            Dnv.Pl.lastPlaylistDocument = undefined;
            Dnv.comandos.eliminarComandosDiferidos();

            Dnv.limpieza.eliminarArchivos();
            Dnv.limpieza.eliminarListados();

            _hacerBackupADisco(); // Pisamos el backup...

            if (Main.info.engine == "TOSHIBA") {
                Dnv.monitor.clearDatabase();
                Dnv.monitor.formatUSB();
            }

            /*
            internal_cfg_keysEnabled: "false"
            internal_cfg_lastDayAuditoriaUploaded: "2015-12-13 00:00:01" <- resetear?
            internal_cfg_timeStampLastComandoDiferido: "2015-12-14T11:10:03" <- resetear?
            */
            setTimeout(Dnv.monitor.resetApp, 1500);

        },

        borrarPrecios: function () {
            Dnv.cfg.limpiarPreciosMenuboard();
            setTimeout(Dnv.monitor.restart, 500);
        }

        //TODO: crear evento (callback) y que cada clase se reconfigure sola cuando toque
        // y borre su mierda de disco
        /*configurarPlayer: function configurarPlayer() {
        CFG_OBJECTID = Dnv.cfg.getCfgInt("MyOwnCode", 0);
        Dnv.CFG_URL_ALARMAS = "http://" + Dnv.cfg.getCfgString("conexion_MasterIp") + ":6007/";
        }*/

    };

})();

