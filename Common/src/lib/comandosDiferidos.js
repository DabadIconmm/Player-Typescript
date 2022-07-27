"use strict";

var Dnv = Dnv || {};

//TODO: El acceso a los datos de localStorage no está sincronizado, podría dar problemas?

Dnv.comandos = (function () {

    var _comandosDiferidos = [];

    var _timerComandosDiferidos;

    var _isWaiting = false;

    function _guardarComandosDiferidos() {
        var comandosData = [];
        for (var i = 0; i < _comandosDiferidos.length; i++) {
            comandosData.push(_comandosDiferidos[i].getData());
            //TODO RAG: enviar confirmación de comando diferidos
            //¿aquí o al ejecutarlos? <- [CAR] La confirmacion se envía justo antes de ejecutarlo
        }
        window.localStorage['comandosDiferidos'] = JSON.stringify(comandosData);
    };

    var _getComandosDiferidos = function _getComandosDiferidos() {

        var cd = window.localStorage['comandosDiferidos'];
        var cdRaw;
        if (cd !== undefined) {
            cdRaw = JSON.parse(cd);
        }

        if (cdRaw !== undefined && cdRaw !== "undefined") {
            console.log("[COMANDOS_DIFERIDOS] comandos en memoria: " + cdRaw.length);
            _comandosDiferidos = [];
            for (var i = 0; i < cdRaw.length; i++) {
                var cmd = new Dnv.comandos.ComandoDiferido()
                cmd.setData(cdRaw[i]);
                _comandosDiferidos.push(cmd);
            }
        } else {
            console.log("[COMANDOS_DIFERIDOS] No hay comandos en memoria.");
        }
    };

    var _procesarComandoLog = function _procesarComandoLog(comando) {
        //contemplamos sólo 2 peticiones: log (*.log) y xml (*.xml).
        //se subirán los archivos que existan en el directorio logs/ y que coincidan con el nombre fijado y de la fecha (nombre) que se solicite.

        //EJEMPLO DE COMANDO:
        //SHELLEXEC;;c:\deneva\Assistant.exe;;u *.log C:\deneva\resources\log\ 2015/05/08 2015/05/08 C:\deneva\resources\temp\Player_JPascual_01_Log_2015_05_08.zip 192.168.1.205/DenevaCuatro/main/extFunction 60 192.168.13.49 1811
        console.info("[PROCESAR_COMANDO] procesamos el comando = '" + comando + "'");
        try {
            var parametros = comando.split(" ");

            var iniDate = new Date(parametros[3]); //parametros[3];
            var endDate = new Date(parametros[4]); //parametros[4];
            endDate.setHours(23, 59, 59, 999);

            var finalName = parametros[5].substr(parametros[5].lastIndexOf("\\") + 1);

            var url = Dnv.cfg.getConfigProtocolServer() + parametros[6] + "/UploadLogZipFile.aspx";

            Dnv.uploadZip.generateAndUploadLogsZip(finalName, iniDate, endDate, url);
        } catch (ex) {
            console.error("No se pudo procesar el comando " + comando + ": " + ex.message);
            //throw ex;
        }
        /*Dnv.monitor.obtenerFicherosPorFecha(Dnv.Cloud._LOGS_PATH, "log", iniDate, endDate, function exitoListado(ficheros) {

        console.log("[PROCESAR_COMANDO] Número de ficheros: " + ficheros.length);
        if (ficheros.length == 0) {
        console.warn("[PROCESAR_COMANDO] No hay ficheros que subir en este rango de fechas.");

        return;
        }
        Dnv.monitor.createZipFile(Dnv.Cloud._LOGS_PATH, ficheros, "uint8array", function zipCreadoCb(zipUint8) {
        console.log("[PROCESAR_COMANDO] Archivo creado.");
        Dnv.uploadZip.uploadLogsZip(zipUint8, finalName, url);
        });
        });*/
    };


    return {

        solicitarComandosDiferidos: function solicitarComandosDiferidos(callback, errorCallback) {

            if (Dnv.cfg.getCfgInt("MyOwnCode", 0) == 0) {
                console.warn("No pedimos comandos diferidos, MyOwnCode = 0");
                if (errorCallback) errorCallback();
                return;
            }

            function errHandlerID(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[COMANDOS_DIFERIDOS] Error al pedir comandos: " + e);
                }
                //console.trace();
                if (errorCallback) errorCallback();
                _isWaiting = false;
            }

            function handlerID() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        console.log("[COMANDOS_DIFERIDOS] Respuesta a la peticion de comandos: " + this.response);
                        try {
                            //if (callback) {
                            if (this.response) {
                                if (callback) callback(this.response);
                            } else {
                                errHandlerID("No se recibió comandos");
                            }
                            return;
                            //}
                        } catch (e) {
                            errHandlerID(e);
                        }
                        _isWaiting = false;
                    } else {
                        errHandlerID("Error HTTP: " + this.statusText);
                    }
                }
            }

            if (_isWaiting) {
                console.log("[COMANDOS_DIFERIDOS] estamos esperando respuesta del servidor. Omitimos la petición");
                return;
            }

            var timeStampLastComandoDiferido = Dnv.cfg.getTimeStampLastComandoDiferido();
            if (timeStampLastComandoDiferido == undefined) { timeStampLastComandoDiferido = "1900-01-01T00:00:00" };

            var client = new XMLHttpRequest();
            client.onreadystatechange = handlerID;
            client.onerror = errHandlerID;

            Dnv.monitor.writeLogFile("[COMANDOS_DIFERIDOS] Pedimos comandos diferidos para " + Dnv.cfg.getCfgInt("MyOwnCode", 0) + " con fecha '" + timeStampLastComandoDiferido + "'...");

            console.log("[COMANDOS_DIFERIDOS] Pedimos comandos diferidos para " + Dnv.cfg.getCfgInt("MyOwnCode", 0) + " con fecha '" + timeStampLastComandoDiferido + "'...");
            //client.open("POST", Dnv.cfg.getCfgString("ConfigHostbaseAddressWeb", "") + "/GetComandosDiferido");

            //RAG TODO: nuevos settings
            var url = Dnv.cfg.getCfgString("ConfigClientEndPointAddressWeb", Dnv.cfg.getDefaultWcfServerAddress() + "/Servicios/WebConfig") + "/GetComandosDiferido";
            client.open("POST", url);

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            //Function GetComandosDiferido(ByVal objId As String, ByVal timeStamp As Date) As XElement
            var xml = '<GetComandosDiferido xmlns="http://tempuri.org/"><objId>' + Dnv.cfg.getCfgInt("MyOwnCode", 0) + '</objId><timeStamp>' + timeStampLastComandoDiferido + '</timeStamp></GetComandosDiferido>';

            client.send(xml);
        },

        iniciarTimerComandosDiferidos: function iniciarTimerComandosDiferidos() {
            console.log("[COMANDOS_DIFERIDOS] iniciamos timer comandos diferidos: " + Dnv.cfg.getCfgInt("SegundosTimer", 30) * 1000 + " segundos");

            _getComandosDiferidos();

            Dnv.comandos.detenerTimerComandosDiferidos();

            /**
            Dnv.comandos.solicitarComandosDiferidos(Dnv.comandos.parsearComandosDiferidos);
            Dnv.comandos.comprobarComandosDiferidos();
          
            _timerComandosDiferidos = setInterval(function () {
            Dnv.comandos.solicitarComandosDiferidos(Dnv.comandos.parsearComandosDiferidos);
            Dnv.comandos.comprobarComandosDiferidos();
            }, Dnv.cfg.getCfgInt("SegundosTimer", 30) * 1000);
            **/

            function fecthComandos() {
                Dnv.comandos.solicitarComandosDiferidos(function (datos) {
                    Dnv.comandos.parsearComandosDiferidos(datos, Dnv.comandos.comprobarComandosDiferidos);
                }, Dnv.comandos.comprobarComandosDiferidos);

                if (Dnv.cfg.getCfgBoolean("Manager_ModoDeterminista_Enabled", false)) {
                    _timerComandosDiferidos = setTimeout(fecthComandos, Dnv.utiles.getIntervalPeticionDeterminista(Dnv.cfg.getCfgInt("MyOwnCode", 0), Dnv.cfg.getCfgInt("SegundosTimer", 30)));
                } else {
                    _timerComandosDiferidos = setTimeout(fecthComandos, Dnv.cfg.getCfgInt("SegundosTimer", 30) * 1000);
                }
            }

            fecthComandos();

        },

        detenerTimerComandosDiferidos: function detenerTimerComandosDiferidos() {
            console.log("[COMANDOS_DIFERIDOS] Detenemos TimerComandosDiferidos");

            if (_timerComandosDiferidos) {
                clearTimeout(_timerComandosDiferidos);
                _timerComandosDiferidos = undefined;
            }
        },

        comprobarComandosDiferidos: function comprobarComandosDiferidos() {
            console.log("[COMANDOS_DIFERIDOS]: comprobamos los comandos...");
            _getComandosDiferidos(); //obtenemos valores de localStorage

            var i = _comandosDiferidos.length;

            while (i--) {
                var c = _comandosDiferidos[i];
                var dnow = new Date();
                //console.log("[COMANDOS_DIFERIDOS] analizamos comando(" + i.toString() + ")..");

                if (c.getInicioTimestamp() < dnow.getTime()) {
                    if (c.getFinTimestamp() > dnow.getTime()) {
                        if (c.getDias() == "") { //enum?
                            //Puntual
                            /*
                            console.log("[COMANDOS_DIFERIDOS] c.getEjecutadoPuntual(): " + c.getEjecutadoPuntual());
                            console.log("[COMANDOS_DIFERIDOS] c.getEjecutado(): " + c.getEjecutado());
                            console.log("[COMANDOS_DIFERIDOS] typeof c.getEjecutado(): " + typeof c.getEjecutadoPuntual());
                            */
                            if (c.getEjecutado() == undefined || c.getEjecutado() == "01/01/1900 0:00:00") {
                                if (c.getEjecutadoPuntual() == "false") {
                                    var comandoAEjecutar = c.getComando();

                                    console.log("[COMANDOS_DIFERIDOS] vamos a ejecutar comando puntual " + c.getCodigo() + " (" + comandoAEjecutar + ")");

                                    //_comandosDiferidos.splice(i, 1); los tenemos que guardar hasta que caduquen porque nos pueden llegar varias veces.
                                    c.setEjecutadoPuntual(true);

                                    Dnv.comandos.ejecutarComandoDiferido(comandoAEjecutar, c.getCodigo());
                                    console.log("[COMANDOS_DIFERIDOS] comando puntual (" + c.getCodigo() + ") ejecutado.");
                                    //} else {
                                    //    console.log("[COMANDOS_DIFERIDOS] No entra. ejecutado puntual (" + c.getCodigo() + "). omitimos.");
                                }
                                //} else {
                                //    console.log("[COMANDOS_DIFERIDOS] No entra. comando (" + c.getCodigo() + ") ejecutado. Omitimos.");                               
                            }
                        } else {
                            //semanal
                            var dInicio = new Date();
                            dInicio.setTime(c.getInicioTimestamp());
                            var dFin = new Date();
                            dFin.setTime(c.getFinTimestamp());
                            if (Dnv.utiles.isInTime(dnow, dInicio, dFin)) {
                                var dias = c.getDias().split(";");

                                for (var j = 0; j < dias.length; j++) {
                                    if (dias[j] == dnow.getDay()) {
                                        if (c.getLastDiaEjecutado() < Dnv.utiles.getDayAndYear(dnow)) {
                                            console.log("[COMANDOS_DIFERIDOS] ejecutamos comando " + c.getComando());

                                            c.setLastDiaEjecutado(Dnv.utiles.getDayAndYear(dnow));
                                            Dnv.comandos.ejecutarComandoDiferido(c.getComando(), c.getCodigo());
                                        } else {
                                            console.log("[COMANDOS_DIFERIDOS] Ya hemos ejecutado el comando " + c.getCodigo() + " hoy.");
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        console.log("[COMANDOS_DIFERIDOS] comando " + c.getCodigo() + " caducado. Lo borramos");
                        _comandosDiferidos.splice(i, 1);
                    }
                } else {
                    console.log("[COMANDOS_DIFERIDOS]: Todavía no hay que ejecutar el comando (inicio > now)...");
                }
            }
            _guardarComandosDiferidos(); //guardamos cambios a localStorage
            console.log("[COMANDOS_DIFERIDOS]: Fin de comprobación de comandos.");
        },

        parsearComandosDiferidos: function parsearComandosDiferidos(data, callback) {
            _getComandosDiferidos(); //obtenemos valores de localStorage
            var doc;
            //if (data instanceof String) {
            doc = new DOMParser().parseFromString(data, "text/xml");
            //} else {
            //    doc = data;
            //}

            var plElement;

            if (doc instanceof Document) {
                plElement = doc.documentElement;
            } else {
                plElement = doc;
            }

            console.log("[COMANDOS_DIFERIDOS]: parseamos comandos...");

            try {
                if (plElement.getElementsByTagName("Comandos").length > 0) {
                    var timestampComandos = plElement.getElementsByTagName("Comandos")[0].getAttribute("Timestamp");
                    var tsDate = Dnv.utiles.stringToTimestamp(timestampComandos);
                    var finalTimestamp = Dnv.utiles.formatearFechaWCF(tsDate, false);

                    console.log("[COMANDOS_DIFERIDOS] actualizamos timeStampLastComandoDiferido a " + finalTimestamp);
                    Dnv.cfg.setTimeStampLastComandoDiferido(finalTimestamp);
                } else if (plElement.getElementsByTagName("GetComandosDiferidoResult")[0].getAttributeNS("http://www.w3.org/2001/XMLSchema-instance", "nil") === "true") {
                    console.log("[COMANDOS_DIFERIDOS] No hay cambios en el servidor");
                    if (callback) callback();
                    return;
                } else {
                    console.log("[COMANDOS_DIFERIDOS] no se han recibido comandos (vacío)");
                }
            } catch (e) {
                console.error("[COMANDOS_DIFERIDOS] no hay timestamp. ");
                Dnv.monitor.writeLogFile("[COMANDOS_DIFERIDOS] no hay timestamp. ", LogLevel.Error);
                if (callback) callback();
                return;
            }

            var comandos = plElement.getElementsByTagName("ComandoDiferido");

            /*var comandosExistentes = [];
            for (var i = 0; i < _comandosDiferidos.length; i++) comandosExistentes[i] = _comandosDiferidos[i];*/

            var nuevosComandos = [];
            for (var i = 0; i < comandos.length; i++) {
                var currentComando = comandos[i];

                if (parseInt(currentComando.getElementsByTagName("Destino")[0].getAttribute("value")) != Dnv.cfg.getCfgInt("MyOwnCode", 3823328)) {
                    console.log("[COMANDOS_DIFERIDOS] - el comando no es para nosotros.");
                    return;
                }

                var codigo = currentComando.getAttribute("Codigo");
                var comando = currentComando.getElementsByTagName("CommandText")[0].getAttribute("value");
                var tipoComando = parseInt(currentComando.getElementsByTagName("Comando")[0].getAttribute("value"));
                var periodicidad = currentComando.getElementsByTagName("Periodicidad")[0].getAttribute("value");
                var timeInicio = currentComando.getElementsByTagName("TimeInicio")[0].getAttribute("value");
                var timeEjecutado = currentComando.getElementsByTagName("TimeExecuted")[0].getAttribute("value");
                var timeFin = currentComando.getElementsByTagName("TimeFin")[0].getAttribute("value");
                var dias = currentComando.getElementsByTagName("Dias")[0].getAttribute("value");
                var descripcion = currentComando.getElementsByTagName("Descripcion")[0].getAttribute("value");

                var tmpComand = new Dnv.comandos.ComandoDiferido(codigo, comando, tipoComando, periodicidad, timeInicio, timeEjecutado, timeFin, dias, descripcion, false);
                var addComando = true;
                /*
                //guardamos todos. el código no sirve para identificar un comando.
                var count = _comandosDiferidos.length;
                for (var j = 0; j < count; j++) {
                if (_comandosDiferidos[j].codigo == codigo) {
                addComando = false;
                j = count;
                }
                }*/

                /*/si ya lo hemos ejecutado ya lo tenemos..
                // [CAR] FIXME: ¿y si lo hemos ejecutado, pero hemos fallado al notificar la ejecución? no creo que debieramos reañadirlo
                if (timeEjecutado != "01/01/1900 0:00:00") {
                addComando = false;
                }*/
                for (var j = 0; j < _comandosDiferidos.length; j++) {
                    // Si en el seridor se borran y se vuelven a crear comandos, el codigo puede que se haya reutilizado. Revisamos el texto del comando tambien
                    if (_comandosDiferidos[j].getCodigo() == codigo && _comandosDiferidos[j].getComando() == comando) {
                        /*if (timeEjecutado != _comandosDiferidos[j].getEjecutado()) {
                        // El servidor tiene una fecha de ejecucion incorrecta...
                        // TODO: renotificar al servidor. Guardar el estado original para saber si renotificar éxito o error
                        tmpComand.setEjecutado(_comandosDiferidos[j].getEjecutado());
                        }*/
                        tmpComand.setLastDiaEjecutado(_comandosDiferidos[j].getLastDiaEjecutado());
                        tmpComand.setEjecutadoPuntual(_comandosDiferidos[j].getEjecutadoPuntual());
                        break;

                    }
                }
                nuevosComandos.push(tmpComand);
                /*
                if (addComando) {
                _comandosDiferidos.push(tmpComand);
                console.log("[COMANDOS_DIFERIDOS]  añadimos comando " + codigo + " (" + comando + ") a la lista");
                //envío la confirmación justo antes de procesarlo.
                /*try {
                Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);
                } catch (e) {
                console.log("[COMANDOS_DIFERIDOS]  No se ha podido enviar confirmación para el comando " + codigo);
                }* /
                } else {
                console.log("[COMANDOS_DIFERIDOS]  NO añadimos comando " + codigo + " a la lista (ya existe)");
                }
                */
            }
            _comandosDiferidos = nuevosComandos;

            _guardarComandosDiferidos(); //guardamos cambios a localStorage
            if (callback) callback();
            //Dnv.comandos.comprobarComandosDiferidos();

        },

        ejecutarComandoDiferido: function ejecutarComandoDiferido(comando, codigo) {
            //TODO RAG: implementar comandos
            var params = comando.split(";;");
            if (params.length == 0) {
                console.warn("[COMANDOS_DIFERIDOS] Omitimos el comando " + comando + ". No podemos parsearlo");
                return;
            }

            switch (params[0].toUpperCase()) {

                case "RESET":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.warn("[COMANDOS_DIFERIDOS] - Reseteamos el equipo en 5 segundos...");
                    setTimeout(Dnv.monitor.restart, 5000); //dejamos un tiempo xq si no no loguea y puede que no guarde los datos
                    //Dnv.monitor.restart();
                    break;

                case "STOPALL":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.warn("[COMANDOS_DIFERIDOS] - Reseteamos las aplicaciones en 5 segundos durante " + params[1] + " segundos...");
                    //Dnv.monitor.resetApp();
                    setTimeout(function () {
                        // Vuelvo a loguear, para no tener que ir 5 segundos para arriba
                        var msg = "[COMANDOS_DIFERIDOS] - Reseteamos las aplicaciones debido a un comando diferido ";
                        console.warn(msg);
                        Dnv.monitor.writeLogFile(msg);
                        Dnv.monitor.resetApp();
                    }, 5000); //dejamos un tiempo xq si no no loguea y puede que no guarde los datos
                    break;

                case "RECONFIG":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.log("[COMANDOS_DIFERIDOS] - Pasamos a configuración");
                    Dnv.cfg.resetConfig();  //reseteamos la configuración
                    Main.navigateToConfigure();
                    break;

                case "POWEROFF":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.log("[COMANDOS_DIFERIDOS] - POWER_OFF");
                    Dnv.monitor.apagarPantalla();
                    break;

                case "POWERON":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.log("[COMANDOS_DIFERIDOS] - POWER_ON");
                    Dnv.monitor.encenderPantalla();
                    break;

                case "SHELLEXEC":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    //TODO RAG: ahora sólo contemplo la subida de ficheros de log y xml (auditoria) del directorio logs.
                    //más adelante habrá que extender este comando..
                    console.log("[COMANDOS_DIFERIDOS] - UPLOAD_FILES");
                    _procesarComandoLog(comando);
                    break;
                case "WEBOS_UPGRADE_FW":
                    if (Main.upgradeFirmwareAndReboot && Main.info.engine == "LG") {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                        console.log("[COMANDOS_DIFERIDOS] - WEBOS_UPGRADE_FW");
                        Main.upgradeFirmwareAndReboot(params[1], params[2]);
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
                    }
                    break;
                case "TOSHIBA_UPGRADE_FW":
                    if (Dnv.appcache.upgradeFirm && Main.info.engine == "TOSHIBA") {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                        console.log("[COMANDOS_DIFERIDOS] - TOSHIBA_UPGRADE_FW");
                        Dnv.appcache.upgradeFirm();
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
                    }
                    break;
                case "UPDATE":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.log("[COMANDOS_DIFERIDOS] - UPDATE");
                    Main.upgradeAndRestart(params[1]);
                    break;
                case "UPDATE_LEMMA":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.log("[COMANDOS_DIFERIDOS] - UPDATE LEMMA");
                    Dnv.Update.updateLemma(params[1]);
                    break; 
                case "RESTORE_BACKUP":
                    if (Dnv.Update.restoreBackup) {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                        // restore backup reinicia el player sin esperar... damos tiempo a que se apunte que se ha ejecutado el comando
                        console.log("[COMANDOS_DIFERIDOS] - INSTALL_BACKUP");
                        //Dnv.Update.restoreBackup();
                        setTimeout(Dnv.Update.restoreBackup, 500);
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
                    }
                    break;
                case "EXECUTE_COMMANDS":
                    if (Dnv.Update.executeCommands) {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                        console.log("[COMANDOS_DIFERIDOS] - EXECUTE_COMMANDS");
                        Dnv.Update.executeCommands(params[1]);
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
                    }
                    break;
                case "UPDATE_RELEYEBLE":
                    if (Dnv.Update.updateReleyeble) {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                        console.log("[COMANDOS_DIFERIDOS] - UPDATE_RELEYEBLE");
                        Dnv.Update.updateReleyeble(params[1]);
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
                    }
                    break;
                case "RESET_CONTENTS":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.log("[COMANDOS_DIFERIDOS] - RESET_CONTENTS");
                    Dnv.cfg.resetContents();
                    break;
                case "COMMAND_RS232":
                    if (Dnv.monitor.executeCommand) {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                        console.log("[COMANDOS_DIFERIDOS] - COMMAND_RS232");
                        Dnv.monitor.executeCommand(params[1], params[2]);
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
                    }
                    break;
                case "LOCK":
                    if (Dnv.monitor.lock) {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                        console.log("[COMANDOS_DIFERIDOS] - LOCK");
                        Dnv.monitor.lock();
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
                    }

                    break;
                case "UNLOCK":
                    if (Dnv.monitor.unLock) {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                        console.log("[COMANDOS_DIFERIDOS] - UNLOCK");
                        Dnv.monitor.unLock();
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
                    }
                    break;
                case "DELETE_PRICES":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.log("[COMANDOS_DIFERIDOS] - DELETE_PRICES");
                    Dnv.cfg.borrarPrecios();
                    break;
                case "SHOW_AUDIENCE":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.log("[COMANDOS_DIFERIDOS] - SHOW_AUDIENCES");
                    Menu.showInfoAudienciaCommand();
                    break;
                case "HIDE_AUDIENCE":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.log("[COMANDOS_DIFERIDOS] - HIDE_AUDIENCE");
                    Menu.hideInfoAudiencia();
                    break;
                case "SET_PASES_NO_ENVIADOS":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.log("[COMANDOS_DIFERIDOS] - SET_PASES_NO_ENVIADOS");
                    setTimeout(function () { Dnv.bigdata.setPasesNoEnviados(params[1], params[2]); }, 5000);
                    break;

                case "SETTIME": // Poner en hora
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);
                    if (Main.setTime) {
                        console.log("[COMANDOS_DIFERIDOS] - SETTIME");
                        Main.setTime(false);
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
                    }
                    break;
                case "SETTIMENTP": // Poner en hora usando NTP
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);
                    if (Main.setTime) {
                        console.log("[COMANDOS_DIFERIDOS] - SETTIMENTP");
                        Main.setTime(true);
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
                    }
                    break;
                case "BORRAR_LOGS":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);
                    Dnv.limpieza.borrarLogs();
                    break;
                case "LOGUEAR_USO_DISCO":
                    if (Dnv.monitor.loguearEspacioUsado) {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);
                        Dnv.monitor.loguearEspacioUsado();
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // 2 es error
                    }
                    break;
                /*case "RESET_CONTENTS": revisar
                Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                console.warn("[COMANDOS_DIFERIDOS] - RESET_CONTENTS");
                Dnv.limpieza.eliminarArchivos();
                Dnv.limpieza.eliminarListados();
                Dnv.monitor.loguearEspacioUsado();
                setTimeout(Dnv.monitor.restart, 40 * 1000);
                break;*/
                case "UNINSTALL":
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);

                    console.warn("[COMANDOS_DIFERIDOS] - UNINSTALL");
                    Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Deshabilitando player");
                    //Dnv.limpieza.eliminarArchivos();
                    //Dnv.limpieza.eliminarListados();
                    Dnv.cfg.resetConfig(true);  //reseteamos la configuración y borrar archivos
                    setTimeout(function () {
                        Dnv.cfg.setInternalCfgBoolean("PlayerDesactivado", true);
                        if (Dnv.monitor.uninstall) { // Si hay alguna plataforma con uninstall, se hace
                            Dnv.monitor.uninstall();
                        } else { // Sino, en cada arranque nos vamos a una pantalla en negro
                            window.location = "player_desactivado.html";
                        }
                    }, 40 * 1000);
                    //setTimeout(Dnv.monitor.restart, 40 * 1000);
                    break;
                case "SETURLAPLICACION":
                    if (Dnv.monitor.setUrlAplicacion && params[1]) {

                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 1);
                        Dnv.monitor.setUrlAplicacion(params[1], function exitoCb() {
                            console.warn("[MONITOR] Se cambio la url de arranque de la aplicación de " + Dnv.deviceInfo.urlApplication() + " a " + params[1] + " Actualizamos en 10 segundos");
                            setTimeout(Main.upgradeAndRestart, 10 * 1000);
                        }, function errorCb() {
                            Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2);
                        });
                    } else {
                        Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
                    }
                    break;
                default:
                    console.warn("Comando diferido desconocido " + comando);
                    Dnv.comandos.enviarConfirmacionComandoDiferido(codigo, 2, "No soportado"); // Error, no soportado
            }
        },

        enviarConfirmacionComandoDiferido: function enviarConfirmacionComandoDiferido(codigoComando, resultado, descripcion) {
            // 0 no ejecutado, 1 ok, 2 error
            // Creo que tanto resultado como descripción solo se guardan si el servidor es un TopMaster...
            function errHandlerConfirmacion(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[COMANDOS_DIFERIDOS] Error al enviar respuesta de comandos diferidos: " + e);
                }
                //console.trace();
            }

            function handlerConfirmacion() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        // console.log("[COMANDOS_DIFERIDOS] Respuesta a confirmación de comandos: " + this.response);

                    } else {
                        errHandlerConfirmacion("Error HTTP: " + this.statusText);
                    }
                }
            }

            var client = new XMLHttpRequest();
            client.onreadystatechange = handlerConfirmacion;
            client.onerror = errHandlerConfirmacion;

            console.log("[COMANDOS_DIFERIDOS] Enviamos confirmación para comando " + codigoComando);

            //RAG TODO: nuevos settings
            var url = Dnv.cfg.getCfgString("ConfigClientEndPointAddressWeb", Dnv.cfg.getDefaultWcfServerAddress() + "/Servicios/WebConfig") + "/SetConfirmacionComandosDiferido";
            client.open("POST", url);

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            //Function SetConfirmacionComandosDiferido(ByVal objId As Integer, ByVal codCmd As String, ByVal timeStamp As Date, Optional resultado As Integer = 1, Optional descripcion As String = "") As Boolean
            var xml = '<SetConfirmacionComandosDiferido xmlns="http://tempuri.org/">' +
            '<objId>' + Dnv.cfg.getCfgInt("MyOwnCode", 0) + '</objId>' +
            '<codCmd>' + codigoComando + '</codCmd>' +
            '<timeStamp>' + Dnv.utiles.formatearFechaWCF(new Date()) + '</timeStamp>' +
            '<resultado>' + resultado + '</resultado>' +
            (descripcion ? '<descripcion>' + descripcion + '</descripcion>' : '') +
            '</SetConfirmacionComandosDiferido>';

            client.send(xml);
        },

        eliminarComandosDiferidos: function eliminarComandosDiferidos() {
            window.localStorage['comandosDiferidos'] = "{}";
        }
    }
})();


Dnv.comandos.ComandoDiferido = function (codigo, comando, tipoComando, periodicidad, inicio, ejecutado, fin, dias, descripcion, ejecutadoPuntual) {

    var lastDiaEjecutado = 0; //?dia del año

    var inicioTimestamp;
    var finTimestamp;

    var ejecutadoPuntual;

    if (inicio != undefined) {
        inicioTimestamp = Dnv.utiles.stringToTimestamp(inicio).getTime();
    }
    if (fin != undefined) {
        finTimestamp = Dnv.utiles.stringToTimestamp(fin).getTime();
    }

    return {
        getCodigo: function () { return codigo; },
        getComando: function () { return comando; },
        getTipoComando: function () { return tipoComando; },
        getPeriodicidad: function () { return periodicidad; },
        getInicio: function () { return inicio; },
        //setEjecutado: function (value) { ejecutado = value; },
        getEjecutado: function () { return ejecutado; },
        getFin: function () { return fin; },
        getDias: function () { return dias; },
        getDescripcion: function () { return descripcion; },

        getInicioTimestamp: function () { return inicioTimestamp; },
        getFinTimestamp: function () { return finTimestamp; },

        // TODO: [CAR] guardar a disco segun hacemos el set? 
        setLastDiaEjecutado: function (value) { lastDiaEjecutado = value; },
        getLastDiaEjecutado: function () { return lastDiaEjecutado; },

        getEjecutadoPuntual: function () { return ejecutadoPuntual; },
        setEjecutadoPuntual: function (value) { ejecutadoPuntual = value; },

        //serializar JSON
        // TODO: [CAR] mejor devolver un objeto simple que se serializa a JSON en lugar de inventarnos el formato. Asi si el comando tiene "$" no se rompe, y se conservan los tipos
        getData: function () { return codigo + "$" + comando + "$" + tipoComando + "$" + periodicidad + "$" + inicio + "$" + ejecutado + "$" + fin + "$" + dias + "$" + descripcion + "$" + inicioTimestamp + "$" + finTimestamp + "$" + lastDiaEjecutado + "$" + ejecutadoPuntual },
        setData: function (data) {
            var values = data.split("$");
            codigo = values[0];
            comando = values[1];
            tipoComando = values[2];
            periodicidad = values[3];
            inicio = values[4];
            ejecutado = values[5];
            fin = values[6];
            dias = values[7];
            descripcion = values[8];
            inicioTimestamp = values[9];
            finTimestamp = values[10];
            lastDiaEjecutado = values[11];
            ejecutadoPuntual = values[12];
        }
    };
};