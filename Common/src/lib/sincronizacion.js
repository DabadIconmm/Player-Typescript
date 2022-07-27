"use strict";

var Dnv = Dnv || {};

Dnv.sincronizacion = (function() {
    var ALPHA = 0.5; // ALPHA is constant weighting factor(0 ≤ ALPHA < 1). Choosing a value ALPHA close to 1 makes the weighted average immune to changes that last a short time (e.g., a single segment that encounters long delay). Choosing a value for ALPHA close to 0 makes the weighted average respond to changes in delay very quickly.
    var salida;
    var d;
    var numeroNodos = 0;
    var numeroNodosSincVideo = 0;
    var isModeSync = false;
    var lastMessage;
    var lastChangeSecuencia = new Date().getTime();
    var lastKeepAlive = Date.now();
    var ipDevice = Dnv.deviceInfo.ip();

    function _procesarMensaje(payload) {

        var data;
        try {
            data = JSON.parse(payload);
        } catch (e) {
            console.warn("[SINCRONIZACION] No se pudo parsear " + payload);
            return;
        }

        if (data.grupo != grupoSync) {
            console.log("[SINCRONIZACION] Este mensaje es para el grupo: " + data.grupo + " no para mi " + grupoSync);
            return;
        }

        if (lastMessage && data == lastMessage) {
            console.warn("[SINCRONIZACION] Mensaje duplicado");
            return;
        } else {
            lastMessage = data;
        }

        if (data.comando === "inicio") {
            if (!maestro) {

                /**
                if (Dnv.secuenciador.getSlideActual() && Dnv.secuenciador.getSlideActual().getCodigo() == data.codSlide) {
                console.log("[SINCRONIZACION] Se obvia avance de slide porque ya estamos en el");
                return
                }
                **/

                if (data.insercion) Dnv.Pl.lastPlaylist.getPlayer().getSalida().setInsercionSincro(data.nivelInsercion, data.campanya, data.insercion);
                Dnv.sincronizacion.setCurrentServerPort(data.puerto);
                Dnv.sincronizacion.onMaestroNecesitaSincronizacion(); // Por si acaso
                Dnv.presentador.avanzarASlideSync(data.codSlide, data.timeInicio + miDesfase);
                console.log("[SINCRONIZACION] avanzarASlideSync " + data.timeInicio + " " + miDesfase);
            } else {
                //console.error("[SINCRONIZACION] ¿Hay más de un maestro de sincronización?");
            }
        } else if (data.comando === "avance_secuencia") {
            if (!maestro) {
                if (!data.posicionSecuencia) Dnv.Pl.posicionSecuencia = data.posicionSecuencia;
                Dnv.sincronizacion.setCurrentServerPort(data.puerto);
                Dnv.sincronizacion.onMaestroNecesitaSincronizacion(); // Por si acaso
                Dnv.presentador.avanzarSecuenciaSync(data.codSlide, data.posicionSecuencia, data.timeInicio + miDesfase);
                console.log("avanzarASecuenciaSync " + data.timeInicio + " " + miDesfase + " (" + data.posicionSecuencia + ")");
            } else {
                //console.error("[SINCRONIZACION] ¿Hay más de un maestro de sincronización?");
            }
        } else if (data.comando === "comandos_remotos") {
            //console.log("Comando remoto, latencia " + (new Date().getTime() - data.timestamp));
            if (esclavo) {
                Dnv.comandosRemotos.inyectarComandosRemotos(data.comandos, data.time + miDesfase);
            }
        } else if (data.comando === "set_maestro") {
            /**
            var pl = Dnv.Pl.lastPlaylist;
            if (pl) {
            Dnv.sincronizacion.onMaestroNecesitaSincronizacion(); // Por si acaso
            maestro = (data.codPlayer == pl.getPlayer().getCodigo());
            }
            **/
        } else if (data.comando === "maestro_en_canal_sincronizado") {
            maestroSincronizando = true;
        } else if (data.comando === "maestro_en_canal_no_sincronizado") {
            maestroSincronizando = false;
        } else if (data.comando === "check_latencia_request") {
            if (!maestro) {
                _procesarLatenciaRequest(data.timestamp);
            }
        } else if (data.comando === "check_latencia_response") {
            if (maestro) {
                _procesarLatenciaResponse(data.timestamp);
            }
        } else if (data.comando === "valoresAjuste" && data.id == ordenVisual) {

            _enviar({ comando: "valoresAjusteRespuesta", id: ordenVisual, top: htmlStyle.top, left: htmlStyle.left, zoom: htmlStyle.zoom });

        } else if (data.comando === "ajusteManual" && data.id == ordenVisual) {

            htmlStyle.top = data.top;
            htmlStyle.left = data.left;
            htmlStyle.zoom = data.zoom;

        } else if (data.comando === "start_config") {

            _detenerComprobacionLatencia();

            Dnv.presentador.detenerPresentacion();

            htmlStyle = document.getElementById("wrapperRotacion").style;

            if (document.getElementById("video_calibracion") == undefined) {
                videlem = document.createElement("video");
            } else {
                videlem = document.getElementById("video_calibracion");
            }

            if (Dnv.cfg.getInternalCfgString(Main._VERTICAL_CFG, Main._VERTICAL_CFG_HORIZONTAL) == Main._VERTICAL_CFG_VERTICAL) {
                videlem.src = "./assets/calibrar_v.mp4";
            } else {
                videlem.src = "./assets/calibrar_h.mp4";
            }

            videlem.id = "video_calibracion";

            document.getElementById("wrappers").style.background = "transparent";
            document.getElementById("wrapperRotacion").appendChild(videlem);


            if (Dnv.cfg.getInternalCfgString(Main._VERTICAL_CFG, Main._VERTICAL_CFG_HORIZONTAL) == Main._VERTICAL_CFG_VERTICAL) {
                document.getElementById("id").style.transform = 'rotate(90deg)';
                //document.getElementById("wrapperRotacion").style.backgroundSize = "cover";
            }


            document.getElementById("id").innerHTML = grupoSync + "." + ordenVisual;
            document.getElementById("id").style.display = "block";


        } else if (data.comando === "finish_config") {

            Dnv.cfg.setInternalCfgString("videowall_top_position", htmlStyle.top);
            Dnv.cfg.setInternalCfgString("videowall_left_position", htmlStyle.left);
            Dnv.cfg.setInternalCfgString("videowall_zoom_position", htmlStyle.zoom);

            document.getElementById("id").style.display = "none";

            document.getElementById("wrapperRotacion").style.backgroundImage = "";
            document.getElementById("wrapperRotacion").style.backgroundSize = "";

            htmlStyle = "";

            videlem.src = "";
            videlem = null;

            document.getElementById("wrappers").style.background = "black";

            _comenzarComprobacionLatencia();

            Dnv.presentador.continuarPresentacion();

        } else if (data.comando === "config") {

            if (ordenVisual == data.id) {

                var value;

                if (Dnv.cfg.getInternalCfgString(Main._VERTICAL_CFG, Main._VERTICAL_CFG_HORIZONTAL) == Main._VERTICAL_CFG_VERTICAL) {

                    switch (data.coordenada) {

                        case "izquierda":
                            value = parsearStyle(htmlStyle.top, data.size, false);
                            htmlStyle.top = value;
                            break;
                        case "derecha":
                            value = parsearStyle(htmlStyle.top, data.size, true);
                            htmlStyle.top = value;
                            break;
                        case "arriba":
                            value = parsearStyle(htmlStyle.left, data.size, true);
                            htmlStyle.left = value;
                            break;
                        case "abajo":
                            value = parsearStyle(htmlStyle.left, data.size, false);
                            htmlStyle.left = value;
                            Dnv.cfg.setCfgString("videowall_left_position", value);
                            break;
                        case "zoom+":
                            value = parsearZoom(htmlStyle.zoom, data.size, true);
                            htmlStyle.zoom = value;
                            break;
                        case "zoom-":
                            value = parsearZoom(htmlStyle.zoom, data.size, false);
                            htmlStyle.zoom = value;
                            break;
                        case "reset":
                            htmlStyle.zoom = 1;
                            htmlStyle.left = "0px";
                            htmlStyle.top = "0px";
                            break;
                    }


                } else {

                    switch (data.coordenada) {

                        case "arriba":
                            value = parsearStyle(htmlStyle.top, data.size, false);
                            htmlStyle.top = value;
                            break;
                        case "abajo":
                            value = parsearStyle(htmlStyle.top, data.size, true);
                            htmlStyle.top = value;
                            break;
                        case "derecha":
                            value = parsearStyle(htmlStyle.left, data.size, true);
                            htmlStyle.left = value;
                            break;
                        case "izquierda":
                            value = parsearStyle(htmlStyle.left, data.size, false);
                            htmlStyle.left = value;
                            break;
                        case "zoom+":
                            value = parsearZoom(htmlStyle.zoom, data.size, true);
                            htmlStyle.zoom = value;
                            break;
                        case "zoom-":
                            value = parsearZoom(htmlStyle.zoom, data.size, false);
                            htmlStyle.zoom = value;
                            break;
                        case "reset":
                            htmlStyle.zoom = 1;
                            htmlStyle.left = "0px";
                            htmlStyle.top = "0px";
                            break;
                    }

                }

                _enviar({ comando: "valoresAjusteRespuesta", id: ordenVisual, top: htmlStyle.top, left: htmlStyle.left, zoom: htmlStyle.zoom });

            }

        } else if (data.comando === "resetApp") {
            Dnv.monitor.resetApp();
        } else if (data.comando === "keepAlive") {
            lastKeepAlive = Date.now();
        } else if (data.commando === "killffplay") {
            console.log("[SINCRONIZACION] He recibido un KILL FFPLAY");
            try {
                var child_process;
                var execSync;
                child_process = require('child_process');
                execSync = child_process.spawnSync;
                execSync('pkill', ["ffplay"]);
            } catch (e) {

            }

            //execSync('pkill', ["ffmpeg"]);
        } else if (data.comando == "rdyToSync") {
            if (maestro) {
                // Dnv.sincronizacion.SendToPlayerAvanzarSlide(data.deviceIP);
            }
        } else if (data.comando === "InitSincro") {
            if (data.informacion.ip == ipDevice) {
                //Debo hacerlo
                Dnv.presentador.comenzarPresentacion();
                Dnv.Pl.lastPlaylist.getPlayer().getSalida().setInsercionSincro(data.informacion.nivelInsercion, data.informacion.codCamp, data.informacion.codInsercion);
                Dnv.sincronizacion.setCurrentServerPort(data.informacion.serverport);
                Dnv.sincronizacion.onMaestroNecesitaSincronizacion(); // Por si acaso
                Dnv.presentador.avanzarASlideSync(data.informacion.CodSincro, data.informacion.timeSincro + miDesfase);
                var video = Dnv.presentador.getCurrentWrapper().getElementsByTagName("video");
                if (video.length > 0) {
                    video[0].currentTime = data.informacion.currentTime;
                }
                //Dnv.sincronizacion.onMaestroComenzandoSlide(slideActualSmooth.getCodSincronizacion(), timeSincronizacion, codInsercion, nivvelInsercion, codCampanya);
            }
        } else if (data.comando === "getPlayListHivestack") {
            if (maestro) {
                Dnv.sincronizacion.sendPlayListHivestack();
            }
        } else if (data.comando == "playlistAdmooh") {
            if (!maestro) {
                if (data.pladmooh) {
                    console.log(".SSP.Admooh Tengo PladAmooh" + data.pladmooh);
                    var arr = data.pladmooh;
                    Dnv.SSP.Admooh.ParsePlayList(arr);
                }
            }
        } else if (data.comando === "vastHivestack") {
            if (!maestro) {
                if (data.hivestack) {
                    //Dnv.cfg.setInternalCfgString("vastHivestack", JSON.stringify(data.hivestack));

                    Dnv.SSP.Hivestack.Ad = data.hivestack;

                    console.log("[SINCRONIZACION]: .SSP. He recibido el VAST de HIVESTACK" + JSON.stringify(data.hivestack));
                }
            }

        } else if (data.comando === "vastPlaceExchange") {
            if (!maestro) {
                if (data.PlaceExchange) {
                    Dnv.SSP.PlaceExchange.Ad = data.PlaceExchange;
                    console.log("[SINCRONIZACION]: .SSP. He recibido el VAST de PlaceExchange" + JSON.stringify(data.PlaceExchange));
                }
            }
        } else if (data.comando === "configAdmooh") {
            if (!maestro) {
                if (data.Admooh) {
                    Dnv.SSP.Admooh.Cfg = data.Admooh;
                }
            }
        } else if (data.comando === "vastAdmooh") {
            if (!maestro) {
                if (data.Admooh) {
                    Dnv.SSP.Admooh.Ad = data.Admooh;
                    Dnv.SSP.Admooh.lastPrint = data.LastPrint;
                    console.log(".SSP.Admooh He recibido el VAST de vasAdmooh" + JSON.stringify(data.Admooh));
                }

            }
        } else if (data.comando == "playListHivestack") {
            if (!maestro) {
                if (data.PLhivestack) {
                    Dnv.SSP.Hivestack.PlayList = data.PLhivestack;
                    Dnv.Pl.parsePlaylistHivestack(Dnv.SSP.Hivestack.PlayList);
                    console.log("[SINCRONIZACION]: He recibido el PLAYLIST de HIVESTACK" + payload);
                }
            }
        } else if (data.comando == "PlayListPlaceExchange") {
            if (!maestro) {
                if (data.PlayListPlaceExchange) {
                    Dnv.SSP.PlaceExchange.ParsePlayList(data.PlayListPlaceExchange);
                    console.log("[SINCRONIZACION]: He recibido el PLAYLIST de PlaceExchange" + payload);
                }
            }
        } else if (data.comando === "uuidHivestack") {
            if (maestro) {
                if (data.uuidHivestack) {
                    if (Dnv.Pl.HivestackUuids) {
                        if (!Dnv.Pl.HivestackUuids.includes(data.uuidHivestack)) {
                            Dnv.Pl.HivestackUuids = Dnv.Pl.HivestackUuids + "," + data.uuidHivestack;
                        }
                    } else {
                        Dnv.Pl.HivestackUuids = data.uuidHivestack;
                    }

                }
            }

        } else if (data.comando === "versionPlayer") {
            if (!maestro) {
                if (!versionComprobada && data.version != Dnv.version && Dnv.monitor.sendLogRabbit) {
                    Dnv.monitor.sendLogRabbit("[SINCRONIZACION] Player con versión diferente a la del maestro. Versión del maestro: " + data.version + " - Version Player: " + Dnv.version, "INFO");
                    Dnv.monitor.writeLogFile("[SINCRONIZACION](_procesarMensaje) Player con versión diferente a la del maestro. Versión del maestro: " + data.version + " - Version Player: " + Dnv.version, "INFO");
                }
                versionComprobada = true;
            }

        } else {
            console.warn("[SINCRONIZACION] Mensaje invalido: " + payload);
            Dnv.monitor.writeLogFile("[SINCRONIZACION](_procesarMensaje) Mensaje invalido: " + payload);
        }

    }

    function parsearStyle(style, medida, add) {
        if (medida === undefined) {
            medida = 1;
        }
        if (add) {
            return (parseInt(style, 10) + parseInt(medida)) + "px";
        } else {
            return (parseInt(style, 10) - parseInt(medida)) + "px";
        }
    }

    function parsearZoom(style, medida, add) {
        if (medida === undefined) {
            medida = 1;
        }
        if (style != "") {
            if (add) {
                return parseFloat(style) + parseFloat(medida);
            } else {
                return parseFloat(style) - parseFloat(medida);
            }
        }
        return 1;
    }

    function _enviar(obj) {

        if (Main.info.engine == "brightsign") {
            try {
                if (udpSocketSend) {
                    udpSocketSend.SendTo("255.255.255.255", 9758, JSON.stringify(obj));
                } else {
                    console.warn("[SINCRONIZACION] No se pudo enviar el mensaje por UDP");
                }
            } catch (e) {
                console.warn("[SINCRONIZACION] No se pudo enviar el mensaje por UDP");
            }
        } else {
            var success = d.send("sincro-slides", JSON.stringify(obj));

            if (!success) console.warn("[SINCRONIZACION] No se pudo enviar el mensaje");
            if (!success) Dnv.monitor.writeLogFile("[SINCRONIZACION](_enviar) No se pudo enviar el mensaje");
            /**
            try {
            if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify(obj));
            } else {
            console.warn("[SINCRONIZACION] No se pudo enviar el mensaje porque el websocket no está conectado");
            }
            } catch (e) {
            console.warn("[SINCRONIZACION] No se pudo enviar el mensaje");
            }
            **/
        }

    }

    function _enviarJSON(obj) {
        var success = d.send("sincro-slides", obj);
        if (!success) console.warn("[SINCRONIZACION] No se pudo enviar el mensaje");
        if (!success) Dnv.monitor.writeLogFile("[SINCRONIZACION](_enviarJSON) No se pudo enviar el mensaje");
    }

    function cambiarServidor() {

        if (Main.info.engine == "electron" && Dnv.presentador.getController()) {

            setTimeout(function() {
                //if (new Date().getTime() - lastChangeSecuencia > 2000) {
                if (currentServerTime == 1) {
                    Dnv.sincronizacion.matarServidorTiempo2();
                    Dnv.sincronizacion.arrancarServidorTiempo2();
                    currentServerTime = 2;
                } else {
                    Dnv.sincronizacion.matarServidorTiempo1();
                    Dnv.sincronizacion.arrancarServidorTiempo1();
                    currentServerTime = 1;
                }
                lastChangeSecuencia = new Date().getTime();
                //}
            }, 3000);

        }

    }

    function _onInicioSincronizado(codSlide, timeInicio, insercion, nivelInsercion, campanya) {

        if (currentServerTime == 1) {
            currentServerPort = servidor1Puerto;
        } else {
            currentServerPort = servidor2Puerto;
        }

        _enviar({ comando: "inicio", codSlide: codSlide, timeInicio: timeInicio, grupo: grupoSync, insercion: insercion, puerto: currentServerPort, nivelInsercion: nivelInsercion, campanya: campanya });

        cambiarServidor();

    }

    function _onMaestroEnCanalSincronizado() {
        maestroSincronizando = true;
        _enviar({ comando: "maestro_en_canal_sincronizado", grupo: grupoSync });
    }

    function _onMaestroEnCanalNoSincronizado() {
        maestroSincronizando = false;
        _enviar({ comando: "maestro_en_canal_no_sincronizado", grupo: grupoSync });

    }

    function _enviarComandosRemotos(comandos, time) {

        if (Main.info.engine == "brightsign") {
            try {
                if (udpSocketSend) {
                    udpSocketSend.SendTo("255.255.255.255", 9758, JSON.stringify({ comando: "comandos_remotos", comandos: comandos, time: time }));
                } else {
                    console.warn("[SINCRONIZACION] No se pudo enviar los comandos remotos por UDP");
                }
            } catch (e) {
                console.warn("[SINCRONIZACION] No se pudo enviar los comandos remotos por UDP");
            }
        } else {
            try {
                if (websocket && websocket.readyState === WebSocket.OPEN) {
                    websocket.send(JSON.stringify({ comando: "comandos_remotos", comandos: comandos, time: time }));
                } else {
                    console.warn("[SINCRONIZACION] No se pudo enviar los comandos remotos porque el websocket no está conectado");
                    Dnv.monitor.writeLogFile("[SINCRONIZACION](_enviarComandosRemotos) No se pudo enviar los comandos remotos porque el websocket no está conectado");
                }
            } catch (e) {
                console.warn("[SINCRONIZACION] No se pudo enviar los comandos remotos");
                Dnv.monitor.writeLogFile("[SINCRONIZACION](_enviarComandosRemotos) No se pudo enviar los comandos remotos");
            }
        }

    }

    function _onAvanceSecuenciaSincronizada(codSlide, contador, timeInicio) {

        if (!contador) Dnv.Pl.posicionSecuencia = contador;

        if (currentServerTime == 1) {
            currentServerPort = servidor1Puerto;
        } else {
            currentServerPort = servidor2Puerto;
        }

        _enviar({ comando: "avance_secuencia", codSlide: codSlide, posicionSecuencia: contador, timeInicio: timeInicio, grupo: grupoSync, puerto: currentServerPort });

        cambiarServidor();

    }


    var websocket;

    var dgram;

    var udpSocketSend;
    var udpSocketListen;

    var currentServerTime;
    var currentServerPort;

    var childServerTime1;
    var childServerTimeTimeout1;

    var childServerTime2;
    var childServerTimeTimeout2;

    var syncVideoPTP;

    var servidorIP;
    var servidor1Puerto;
    var servidor2Puerto;

    var grupoSync;
    var ordenVisual;

    var conectado = false;
    var debeEstarconectado = false;

    var maestroSincronizando = false;
    var maestro = false;
    var esclavo = false;

    var latenciaEsclavo = 0;
    var miDesfase = 0;
    //var roundTrip = 0;

    var htmlStyle;
    var videlem;

    //var oldRoundTrip = 0;
    var roundTrip = 0;

    var checkKeepAliveIntervalId = null;
    var checkLatenciaIntervalId = null;

    var timeoutPlayVideo;
    var versionComprobada = false;

    function _sendKeepAlive() {
        if (maestro) {
            _enviar({ comando: "keepAlive", timestamp: Date.now(), grupo: grupoSync });
        }
        if ((Date.now() - lastKeepAlive) > 60000) {
            console.error("[SINCRONIZACION][DISCOVER] Reiniciamos ya que no hay maestro");
            Dnv.monitor.writeLogFile("[SINCRONIZACION][DISCOVER](_sendKeepAlive) Reiniciamos ya que no hay maestro. Actual :" + Date.now() + ". Ultimo mensaje: " + lastKeepAlive);
            if (Dnv.monitor.sendLogRabbit) Dnv.monitor.sendLogRabbit("[SINCRONIZACION][DISCOVER] Reiniciamos ya que no hay maestro", "ERROR");
            setTimeout(Dnv.monitor.restart, 5000);
        }
    }

    function _checkLatencia() {
        if (maestro) {
            _enviar({ comando: "check_latencia_request", timestamp: new Date().getTime(), grupo: grupoSync });
        }
    }

    // habria que cambiarlo para soportar multiples pantallas
    function _procesarLatenciaRequest(timestamp) { // Esclavos

        var ahora = new Date().getTime();
        var desfaseSample = ahora - timestamp;
        //if (desfaseSample < 3000) {
        // https://en.wikipedia.org/wiki/Round-trip_delay_time#Protocol_design
        //oldRoundTrip = roundTrip;
        if (miDesfase != 0) {
            miDesfase = (ALPHA * miDesfase) + ((1 - ALPHA) * desfaseSample);
        } else {
            miDesfase = desfaseSample;
        }

        //desfaseSample = Math.round(roundTrip / 2);
        console.log("[SINCRONIZACION] El desfase parece de " + miDesfase + "");
        /*} else {
        console.warn("[SINCRONIZACION]: La latencia del esclavo parece demasiado alta: RoundTripTime " + roundTripDelayTimeSample);
        }*/
        _enviar({ comando: "check_latencia_response", timestamp: new Date().getTime(), grupo: grupoSync });
    }

    function _procesarLatenciaResponse(timestamp) { // Maestro
        //_enviar({ comando: "check_latencia_response", timestamp: timestamp });
        var ahora = new Date().getTime();
        var roundTripDelayTimeSample = ahora - timestamp;
        if (roundTripDelayTimeSample < 1000) {
            // https://en.wikipedia.org/wiki/Round-trip_delay_time#Protocol_design
            //oldRoundTrip = roundTrip;
            if (roundTrip != 0) {
                roundTrip = (ALPHA * roundTrip) + ((1 - ALPHA) * roundTripDelayTimeSample);
            } else {
                roundTrip = roundTripDelayTimeSample
            }
            //if (Math.round(roundTrip / 2) > 0) {
            latenciaEsclavo = Math.round(roundTrip / 2);
            //}
            console.log("[SINCRONIZACION] Latencia del esclavo: RoundTripTime " + roundTripDelayTimeSample);
            Dnv.monitor.writeLogFile("[SINCRONIZACION](_procesarLatenciaResponse) Latencia del esclavo: RoundTripTime " + roundTripDelayTimeSample);
        } else {
            console.log("[SINCRONIZACION] La latencia del esclavo parece demasiado alta: RoundTripTime " + roundTripDelayTimeSample);
            Dnv.monitor.writeLogFile("[SINCRONIZACION](_procesarLatenciaResponse) La latencia del esclavo parece demasiado alta: RoundTripTime " + roundTripDelayTimeSample);
        }
    }

    function _comenzarComprobacionLatencia() {
        if (checkLatenciaIntervalId === null) {
            _checkLatencia();
            checkLatenciaIntervalId = setInterval(_checkLatencia, /**1500***/ 35000);
        }
    }

    function _comenzarKeepAlive() {
        if (checkKeepAliveIntervalId === null) {
            _sendKeepAlive();
            checkKeepAliveIntervalId = setInterval(_sendKeepAlive, 5000);
        }
    }

    function _detenerComprobacionLatencia() {
        if (checkLatenciaIntervalId !== null) {
            clearInterval(checkLatenciaIntervalId);
            checkLatenciaIntervalId = null;
        }

    }

    function _sendKillFFPlay() {
        Dnv.monitor.writeLogFile("[SINCRONIZACION]Envio un KILL FFPLAY");
        _enviar({ comando: "killffplay", grupo: grupoSync });
    }

    function _sendVastHivestack() {
        Dnv.monitor.writeLogFile(".SSP.sincronizacion() Envio vast Hivestack-->" + JSON.stringify(Dnv.SSP.Hivestack.Ad));
        _enviar({ comando: "vastHivestack", grupo: grupoSync, hivestack: Dnv.SSP.Hivestack.Ad });
    }

    function _sendVastPlaceExchange() {
        Dnv.monitor.writeLogFile(".SSP.sincronizacion() Envio vast PlaceExchange-->" + JSON.stringify(Dnv.SSP.PlaceExchange.Ad));
        _enviar({ comando: "vastPlaceExchange", grupo: grupoSync, PlaceExchange: Dnv.SSP.PlaceExchange.Ad });
    }

    function _SendReadyToSync() {
        _enviar({ comando: "rdyToSync", grupo: grupoSync, deviceIP: ipDevice });
    }

    function _SendToPlayerAvanzarSlide(ipP) {
        var delay = Dnv.sincronizacion.getLatenciaEsclavo() + Dnv._SYNC_DELAY_MAESTRO;
        var timeSincronizacion = Dnv.presentador.getTimeSincronizacion();;
        var insercion = Dnv.presentador.getCurrentInsercion();
        var codigo = insercion.getCodigo();
        var nivel = insercion.getPrioridad();
        var camp = insercion.getCampanya();
        var time;
        var codSincro = Dnv.secuenciador.getSlideActual().getCodSincronizacion();
        var video = Dnv.presentador.getCurrentWrapper().getElementsByTagName("video");
        var currentTime = 0;
        if (video.length > 0) {
            currentTime = video[0].currentTime
        }
        if (currentServerTime == 1) {
            currentServerPort = servidor1Puerto;
        } else {
            currentServerPort = servidor2Puerto;
        }
        _enviar({ comando: "InitSincro", grupo: grupoSync, informacion: { ip: ipP, CodSincro: codSincro, timeSincro: timeSincronizacion, codInsercion: codigo, nivelInsercion: nivel, codCamp: camp, serverport: currentServerPort, currentTime: currentTime } });
    }

    function _sendVastAdmooh() {
        console.log(".SSP.sincronizacion() Envio vast admooh-->" + JSON.stringify(Dnv.SSP.Admooh.Ad));
        _enviar({ comando: "vastAdmooh", grupo: grupoSync, Admooh: Dnv.SSP.Admooh.Ad, Int: Dnv.SSP.Admooh.Int, LastPrint: Dnv.SSP.Admooh.lastPrint });
    }

    function _sendConfigAdmooh() {
        console.log(".SSP.sincronizacion() Envio configuración admoooh");
        _enviar({ comando: "configAdmooh", grupo: grupoSync, Admooh: Dnv.SSP.Admooh.Cfg });
    }

    function _sendPlayListHivestack() {
        _enviar({ comando: "playListHivestack", grupo: grupoSync, PLhivestack: Dnv.SSP.Hivestack.PlayList });
    }

    function _sendPlayListAdmooh() {
        _enviar({ comando: "playlistAdmooh", grupo: grupoSync, pladmooh: Dnv.SSP.Admooh.Playlist });
    }

    function _sendPlayListPlaceExchange() {
        _enviar({ comando: "PlayListPlaceExchange", grupo: grupoSync, PlayListPlaceExchange: Dnv.SSP.PlaceExchange.PlayList });
    }

    function _getPlaylistHivestack() {
        _enviar({ comando: "getPlaylistHivestack", grupo: grupoSync, PLhivestack: Dnv.SSP.Hivestack.PlayList })
    }

    function _sendUuidHivestack(uuidHivestack) {



        _enviar({ comando: "uuidHivestack", grupo: grupoSync, uuidHivestack: uuidHivestack });


    }

    function _sendVersionPlayer() {



        _enviar({ comando: "versionPlayer", grupo: grupoSync, version: Dnv.version });


    }

    var wsOnOpen = function wsOnOpen(event) {
        console.info("[SINCRONIZACION] WebSocket conectado");
        conectado = true;
        window.dispatchEvent(new CustomEvent(Dnv.sincronizacion.SINCRONIZACION_CONECTADO_EVENT, { detail: null }));
    }

    var udpOnOpen = function udpOnOpen() {
        console.info("[SINCRONIZACION] Escuchando mensajes UDP");
        conectado = true;
        window.dispatchEvent(new CustomEvent(Dnv.sincronizacion.SINCRONIZACION_CONECTADO_EVENT, { detail: null }));
    }

    var wsOnClose = function wsOnClose(event) {
        conectado = false;
        window.dispatchEvent(new CustomEvent(Dnv.sincronizacion.SINCRONIZACION_DESCONECTADO_EVENT, { detail: null }));
        console.info("[SINCRONIZACION] WebSocket desconectado");
        Dnv.monitor.writeLogFile("[SINCRONIZACION](wsOnClose) WebSocket desconectado");
        _detenerComprobacionLatencia();
        websocket = null;
        if (debeEstarconectado) { // Intentamos reconectar
            setTimeout(function() {
                if (debeEstarconectado && websocket === null) Dnv.sincronizacion.conectar(true);
            }, 5 * 1000);
        }
    }
    var wsOnError = function wsOnError(event) {
        console.log("[SINCRONIZACION] Fallo en el webSocket: " + event + " " + event.message);
        Dnv.monitor.writeLogFile("[SINCRONIZACION](wsOnError) Fallo en el webSocket: " + event + " " + event.message)
        conectado = false;
        window.dispatchEvent(new CustomEvent(Dnv.sincronizacion.SINCRONIZACION_DESCONECTADO_EVENT, { detail: null }));
        if (debeEstarconectado) { // Intentamos reconectar
            setTimeout(function() {
                if (debeEstarconectado && websocket === null) Dnv.sincronizacion.conectar(true);
            }, 5 * 1000);
        }
    }

    var udpOnMessage = function udpOnMessage(event) {
        if (event.remoteHost != Dnv.deviceInfo.ip()) {
            var enc = new TextDecoder("utf-8");
            var mensaje = enc.decode(event.getBytes());
            console.log("[SINCRONIZACION] Mensaje recibido por UDP: " + mensaje);
            _procesarMensaje(mensaje);
        }
    }

    var wsOnMessage = function wsOnMessage(event) {
        console.log("[SINCRONIZACION] Mensaje recibido en el webSocket: " + event.data);
        _procesarMensaje(event.data);
    }

    if (Main.info.engine == "electron") {
        var child_process = require('child_process');
    }
    var timestampMaestroSincro = 0;

    return {
        SINCRONIZACION_CONECTADO_EVENT: "sync_ws_conectado",
        SINCRONIZACION_DESCONECTADO_EVENT: "sync_ws_desconectado",
        /*setUp: function setUp(servidor, puerto) {
        console.log("MENUBOARD: WebSocket setUP " + servidor + ":" + puerto);
        server = servidor;
        port = puerto;
        },*/

        conectar: function conectar(now) {

            if (Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") != ";;") {

                isModeSync = true;

                var _onPlaylistCargada = function onPlaylistCargada(evt) {

                    //if (evt) evt.currentTarget.removeEventListener(evt.type, onPlaylistCargada);

                    salida = Dnv.Pl.lastPlaylist.getPlayer().getSalida();

                    if (grupoSync == salida.getMetadatos()["GrupoSync"] && !now) return

                    grupoSync = salida.getMetadatos()["GrupoSync"];
                    ordenVisual = salida.getMetadatos()["Escritorio"];

                    servidorIP = Dnv.cfg.getCfgString("ServidorSincronizacion", "192.168.3.65") + ":8000";

                    function connectWs(ip) {
                        if (websocket) websocket.close();
                        debeEstarconectado = true;
                        console.info("[SINCRONIZACION] Conectando al websocket " + ip);
                        Dnv.monitor.writeLogFile("[SINCRONIZACION](connectWs) Conectando al websocket " + ip)
                        websocket = new WebSocket("ws://" + ip + ":8000");
                        websocket.onopen = wsOnOpen;
                        websocket.onclose = wsOnClose;
                        websocket.onerror = wsOnError;
                        websocket.onmessage = wsOnMessage;
                    }

                    if (Main.info.engine == "brightsign") {

                        debeEstarconectado = true;
                        console.info("[SINCRONIZACION] Comenzando a escuchar UDP ");
                        Dnv.monitor.writeLogFile("[SINCRONIZACION] Comenzando a escuchar UDP ")
                        udpSocketListen = new BSDatagramSocket();
                        udpSocketSend = new BSDatagramSocket();
                        udpSocketListen.BindLocalPort(9758)
                        udpSocketListen.ondatagram = udpOnMessage;
                        udpOnOpen();
                        //syncVideoPTP = new BSSyncManager("group1", "255.255.255.255", 9759);

                    } else if (Main.info.engine == "electron") {

                        var Discover = require('node-discover');

                        var firstTime = true;

                        if (maestro) {
                            d = Discover({ weight: 1, port: grupoSync, ignoreInstance: false });
                        } else {
                            d = Discover({ weight: 0, port: grupoSync, ignoreInstance: false });
                        }

                        d.on("promotion", function(data) {

                            conectado = true;

                            console.info("[SINCRONIZACION][DISCOVER] Promocionado como maestro " + Dnv.deviceInfo.ip());
                            Dnv.monitor.writeLogFile("[SINCRONIZACION][DISCOVER](conectar) Promocionado como maestro " + Dnv.deviceInfo.ip());
                            if (Dnv.monitor.sendLogRabbit) Dnv.monitor.sendLogRabbit("[SINCRONIZACION][DISCOVER] Promocionado como maestro " + Dnv.deviceInfo.ip() + " - Version Player: " + Dnv.version, "INFO");
                            maestro = true;
                            esclavo = false;
                            servidorIP = Dnv.deviceInfo.ip();
                            //servidorIP = "0.0.0.0";
                            //servidorIP = "127.0.0.1";

                            salida.cleanInsercionSincro();

                            // matamos posibles instancias anteriores del servidor de tiempo
                            Dnv.sincronizacion.matarServidoresTiempo();

                            // arrancamos servidor de tiempo                            
                            Dnv.sincronizacion.arrancarServidorTiempo1();
                            Dnv.sincronizacion.arrancarServidorTiempo2();

                            // al ser el primer arranque, empezamos usando el servidor 1
                            currentServerTime = 1;
                            currentServerPort = servidor1Puerto;

                            setTimeout(function() {
                                //if (Dnv.presentador.isInBuscandoContenidos()) Dnv.presentador.avanzarSlide();
                                Dnv.presentador.avanzarSlideDirectamente();
                            }, 6000);
                            //SSP
                            if (Dnv.SSP.Hivestack.Enable) {
                                Dnv.SSP.Hivestack.Play();
                            }
                            if (Dnv.SSP.Admooh.Enable) {
                                Dnv.SSP.Admooh.Play();
                            }

                            if (Dnv.cfg.getCfgBoolean("MultiPantalla", false)) {
                                console.info("[SINCRONIZACION] Iniciando modo anamórfico ");

                                // servidor websocket
                                console.info("[SINCRONIZACION]: Desplegando servidor websocket en el puerto 8000");
                                Dnv.monitor.writeLogFile("[SINCRONIZACION]: Desplegando servidor websocket en el puerto 8000");
                                var webSocketConfigWall = require('ws');
                                var wss = new webSocketConfigWall.Server({ port: 8000 });
                                wss.broadcast = function broadcast(data) {
                                    wss.clients.forEach(function each(client) {
                                        if (client.readyState === WebSocket.OPEN) {
                                            client.send(data);
                                        }
                                    });
                                };
                                wss.on('connection', function connection(ws) {

                                    ws.on('message', function incoming(data) {
                                        // Broadcast a todos, menos al que manda el mensaje
                                        /**
                                        wss.clients.forEach(function each(client) {
                                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                                client.send(data);
                                            }
                                        });
                                        **/
                                        _enviarJSON(data);
                                    });
                                });

                                connectWs(servidorIP);
                                // servir web de configuración
                                var connect = require('connect');
                                var serveStatic = require('serve-static');
                                connect().use(serveStatic(Dnv.Cloud._ELECTRON_RUN_PATH + "configWall")).listen(8088, function() {
                                    console.log('Server running on 8088...');
                                });
                            }

                        });

                        d.on("master", function(data) {

                            conectado = true;

                            console.info("[SINCRONIZACION][DISCOVER] Es esclavo de " + data.address);
                            Dnv.monitor.writeLogFile("[SINCRONIZACION][DISCOVER] Es esclavo de " + data.address);
                            salida.cleanInsercionSincro();
                            Dnv.sincronizacion.matarServidoresTiempo();
                            maestro = false;
                            esclavo = true;
                            servidorIP = data.address;

                        });

                        var playVideo = function playVideo() {
                           

                            if (maestro) {

                                console.log("[SINCRONIZACION] Nodos listos: " + numeroNodosSincVideo + " (" + (numeroNodos + 1) + ")");
                                Dnv.monitor.writeLogFile("[SINCRONIZACION] Nodos listos: " + numeroNodosSincVideo + " (" + (numeroNodos + 1) + ")");
                                /**
                                if (!timeoutPlayVideo) timeoutPlayVideo = setTimeout(function () {
                                Dnv.presentador.getController().play();
                                numeroNodosSincVideo = 0;
                                timeoutPlayVideo = null;
                                }, 2500);
                                **/

                                if ((numeroNodosSincVideo >= numeroNodos + 1) /**|| firstTime**/ ) {

                                    /**
                                    clearTimeout(timeoutPlayVideo);
                                    numeroNodosSincVideo = 0;
                                    timeoutPlayVideo = null;
                                    **/
                                    try {

                                        if (numeroNodos == 0) {
                                            /**
                                            Dnv.presentador.getController().getMediaElement()[0].element.volume = 0
                                            console.warn("[SINCRONIZACION] Volumen a 0 porque estamos solos en el grupo de sincronizacion");
                                            Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Videos sin audio ya que estamos solos en gruposync");
                                            **/
                                        }

                                        Dnv.presentador.getController().currentTime = 0.0;

                                        Dnv.presentador.getController().play();

                                        setTimeout(function () {
                                            if (Dnv.presentador.getController()) Dnv.presentador.getController().play();
                                        }, 2000);

                                    } catch (e) {
                                        console.error("[SINCRONIZACION] Error con controller. Se cambia de maestro.");
                                        Dnv.monitor.writeLogFile("[SINCRONIZACION] Error con controller. Se cambia de maestro.");
                                        if (Dnv.monitor.sendLogRabbit) Dnv.monitor.sendLogRabbit("[SINCRONIZACION][CONTROLLER] Error con controller", "ERROR");
                                        d.demote(true);
                                    }

                                    console.log("[SINCRONIZACION] Todos los esclavos listos. Play.");
                                    firstTime = false;


                                }

                            }
                        }

                        d.on("added", function(data) {
                            console.log("[SINCRONIZACION][DISCOVER] Player conectado " + data.address);
                            Dnv.monitor.writeLogFile("[SINCRONIZACION][DISCOVER] Player conectado " + data.address);
                            numeroNodos++;
                            playVideo();
                            if (maestro) {
                                Dnv.sincronizacion.sendVersionPlayer();
                                Dnv.sincronizacion.sendPlayListHivestack();
                                Dnv.sincronizacion.sendVastHivestack();
                                Dnv.sincronizacion.sendConfigAdmooh();
                                Dnv.sincronizacion.sendVastAdmooh();
                                Dnv.sincronizacion.sendPlayListAdmooh();
                                Dnv.sincronizacion.sendPlayListPlaceExchange();
                                Dnv.sincronizacion.sendVastPlaceExchange();

                                //Para iniciar sincronizacion al conectar un esclavo.
                                //setTimeout(function(){Dnv.sincronizacion.SendToPlayerAvanzarSlide(data.address);},1000);

                            };

                        });

                        d.on("removed", function(data) {
                            console.log("[SINCRONIZACION][DISCOVER] Player desconectado " + data.address);
                            Dnv.monitor.writeLogFile("[SINCRONIZACION][DISCOVER] Player desconectado " + data.address);
                            numeroNodos--;
                            playVideo();
                        });

                        d.join("sincro-slides", function(data) {
                            console.log("[SINCRONIZACION] Recibido " + data);
                            Dnv.monitor.writeLogFile("[SINCRONIZACION] Recibido " + data);
                            _procesarMensaje(data);
                        });

                        d.join("sincro-video", function() {
                            if (maestro) numeroNodosSincVideo++;
                            playVideo();
                        });

                        d.join("downloads-request", function(data) {

                            if (Dnv.deviceInfo.ip() != data.sender) {

                                var newUrl = "http://" + Dnv.deviceInfo.ip() + ":8099/" + data.filename;

                                var descargado = Dnv.Cloud.downloader.existeRecurso(data.remote, data.hashcode);
                                var descargando = Dnv.Cloud.downloader.descargandoRecurso(data.remote, data.hashcode);

                                if (descargado) {
                                    /**
                                    if (Dnv.sincronizacion.isMaestro() && Dnv.sincronizacion.getNumNodosConectados() != 0 && Dnv.cfg.getCfgBoolean("CloudDistribuido_SoloMaestroDescarga", false)) {
                                        console.log("[CLOUD] No servimos el recurso: " + newUrl.toString() + " al ser maestro");
                                    } else {
                                    **/
                                    console.log("[CLOUD] Comunicamos que tenemos disponible el recurso: " + newUrl.toString());
                                    d.send("downloads-reply", { remote: data.remote, codigo: data.codigo, hashcode: data.hashcode, url: newUrl.toString(), disponible: true, sender: Dnv.deviceInfo.ip() });
                                    //}
                                } else if (descargando) {
                                    console.log("[CLOUD] Comunicamos que estamos descargando el recurso: " + newUrl.toString());
                                    d.send("downloads-reply", { remote: data.remote, codigo: data.codigo, hashcode: data.hashcode, url: newUrl.toString(), disponible: false, sender: Dnv.deviceInfo.ip() });
                                }
                                /**else {
                                                                   console.log("[CLOUD] Comunicamos que NO estamos descargando el recurso: " + newUrl.toString());
                                                                   d.send("downloads-reply", { remote: data.remote, codigo: data.codigo, hashcode: data.hashcode, url: null, disponible: false, sender: Dnv.deviceInfo.ip() });
                                                               }**/

                            }

                        });

                        /**
                        d.join("sincro-disponibilidad", function (data) {
                        if (!Dnv.presentador.isDisponible(data.slide)) {
                        d.send("sincro-disponibilidad-reply", { slide: data.slide, disponible: false, sender: Dnv.deviceInfo.ip() });
                        }
                        });
                        **/

                        // servir carpeta recursos
                        if (!Dnv.cfg.getCfgBoolean("MultiPantalla", false) && Dnv.cfg.getCfgBoolean("CloudDistribuido_Enabled", false)) {
                            var connect = require('connect');
                            var serveStatic = require('serve-static');
                            connect().use(serveStatic(Dnv.Cloud._RECURSOS_PATH)).listen(8099, function() {
                                console.log('[CLOUD] Server running on 8099...');
                            });

                            /**
                            var express = require('express');
                            var server = express();

                            server.use('/', express.static(Dnv.Cloud._RECURSOS_PATH));
                            
                            server.listen(8099);

                            server.maxConnections = 1;
                            **/
                        }

                        /**
                        var http = require('http');
                        var parseUrl = require('parseurl');
                        var send = require('send');

                        var server = http.createServer(function onRequest(req, res) {
                        send(req, parseUrl(req).pathname, { root: Dnv.Cloud._RECURSOS_PATH }).pipe(res)
                        });

                        server.listen(8099);
                        **/

                    } else {
                        connectWs(servidorIP);
                    }

                    //_comenzarComprobacionLatencia();

                    _comenzarKeepAlive();

                };

                window.addEventListener(Dnv.NEW_PLAYLIST_EVENT, _onPlaylistCargada);

                if (now) _onPlaylistCargada();

            }
        },

        liberarPuertoWS: function liberarPuertoWS() {
            console.log("[SINCRONIZACION] Liberamos puerto WS");
            Dnv.monitor.writeLogFile("[SINCRONIZACION] Liberamos puerto WS");
            switch (Main.info.platform) {
                case Main.platform.linux:
                    child_process.spawnSync('fuser', ["-k", "-n", "tcp", "8000"]);
                    break;
                case Main.platform.windows:
                    break;
            }
        },

        liberarPuerto: function liberarPuerto(puerto) {
            console.log("[SINCRONIZACION] Liberamos puerto " + puerto);
            Dnv.monitor.writeLogFile("[SINCRONIZACION] Liberamos puerto " + puerto);
            switch (Main.info.platform) {
                case Main.platform.linux:
                    child_process.spawnSync('fuser', ["-k", "-n", "tcp", puerto]);
                    break;
                case Main.platform.windows:
                    break;
            }
        },

        matarServidoresTiempo: function matarServidoresTiempo() {
            /**
            var disrequire = require('disrequire');
            disrequire(Dnv.Cloud._ELECTRON_RUN_PATH + 'timingservice/server/server.js');
            **/
            console.log("[SINCRONIZACION] Matamos los servidores de tiempo");
            Dnv.monitor.writeLogFile("[SINCRONIZACION] Matamos los servidores de tiempo");
            switch (Main.info.platform) {
                case Main.platform.linux:
                    child_process.spawnSync('pkill', ["nodejs"]);
                    break;
                case Main.platform.windows:
                    child_process.spawnSync('taskkill', ["/F", "/IM", "node*", "/T"]);
                    break;
            }
            //child_process.spawnSync(command);   
        },

        matarYArrancarServidoresTiempo: function matarYArrancarServidoresTiempo() {
            /**
            var disrequire = require('disrequire');
            disrequire(Dnv.Cloud._ELECTRON_RUN_PATH + 'timingservice/server/server.js');
            **/
            console.log("[SINCRONIZACION] Matamos los servidores de tiempo");

            switch (Main.info.platform) {
                case Main.platform.linux:
                    child_process.spawnSync('pkill', ["nodejs"]);
                    break;
                case Main.platform.windows:
                    child_process.spawnSync('taskkill', ["/F", "/IM", "node*", "/T"]);
                    break;
            }
            Dnv.sincronizacion.arrancarServidorTiempo1();

            // al ser el primer arranque, empezamos usando el servidor 1
            currentServerTime = 1;
            currentServerPort = servidor1Puerto;

            Dnv.sincronizacion.arrancarServidorTiempo2();
        },

        matarServidorTiempo1: function matarServidorTiempo1() {
            console.log("[SINCRONIZACION] Matamos el servidor de tiempo (" + servidor1Puerto + ")");
            Dnv.monitor.writeLogFile("[SINCRONIZACION] Matamos el servidor de tiempo (" + servidor1Puerto + ")");
            if (childServerTime1) childServerTime1.kill();
            //this.liberarPuerto(servidor1Puerto);
        },

        matarServidorTiempo2: function matarServidorTiempo2() {
            console.log("[SINCRONIZACION] Matamos el servidor de tiempo (" + servidor2Puerto + ")");
            Dnv.monitor.writeLogFile("[SINCRONIZACION] Matamos el servidor de tiempo (" + servidor2Puerto + ")");
            if (childServerTime2) childServerTime2.kill();
            //this.liberarPuerto(servidor2Puerto);
        },

        arrancarServidorTiempo1: function arrancarServidorTiempo1() {
            servidor1Puerto = 8080;

            console.info("[SINCRONIZACION] Arrancado servidor 1 de tiempo (" + servidor1Puerto + ")");
            Dnv.monitor.writeLogFile("[SINCRONIZACION] Arrancado servidor 1 de tiempo (" + servidor1Puerto + ")");

            var command;
            switch (Main.info.platform) {
                case Main.platform.linux:
                    command = "nodejs";
                    break;
                case Main.platform.windows:
                    command = "node";
                    break;
            }

            childServerTime1 = child_process.spawn(command, [Dnv.Cloud._ELECTRON_RUN_PATH + 'timingservice/server/server.js', servidor1Puerto]);

            //require(Dnv.Cloud._ELECTRON_RUN_PATH + 'timingservice/server/server.js');

            /**
            childServerTime1.stdout.on('data', function (data) {
            console.log("[SINCRONIZACION][1] " + data);
            });
            **/

            /**
            childServerTime1.stderr.on('data', function (data) {
            console.error("[SINCRONIZACION][1] " + data);
            });
            **/

            /**
            childServerTime1.stderr.on('data', function (data) {
            if (data.includes("Error: listen EADDRINUSE :::" + puerto)) {
            console.error("[SINCRONIZACION] Reiniciamos app al estar el puerto " + puerto + " bloqueado");
            childServerTime1.removeAllListeners();
            setTimeout(Dnv.monitor.resetApp, 5000);
            }
            });

            childServerTime1.on('close', function (code) {
            console.info("[SINCRONIZACION] Instancia del servidor de tiempo finalizada: " + code);
            console.log("[SINCRONIZACION] Volvemos a arrancar el servidor de tiempo");
            Dnv.sincronizacion.arrancarServidorTiempo();
            });

            childServerTimeTimeout = setTimeout(function () {
            console.log("[SINCRONIZACION] Matamos el servidor de tiempo por timer de una hora");
            Dnv.sincronizacion.matarServidorTiempo();
            Dnv.sincronizacion.arrancarServidorTiempo();
            }, 1 * 3600 * 1000);
            **/

        },

        arrancarServidorTiempo2: function arrancarServidorTiempo2() {
            servidor2Puerto = 8085;

            console.info("[SINCRONIZACION] Arrancado servidor 2 de tiempo (" + servidor2Puerto + ")");
            Dnv.monitor.writeLogFile("[SINCRONIZACION] Arrancado servidor 2 de tiempo (" + servidor2Puerto + ")");

            var command;
            switch (Main.info.platform) {
                case Main.platform.linux:
                    command = "nodejs";
                    break;
                case Main.platform.windows:
                    command = "node";
                    break;
            }

            childServerTime2 = child_process.spawn(command, [Dnv.Cloud._ELECTRON_RUN_PATH + 'timingservice/server/server.js', servidor2Puerto]);

            /**
            childServerTime2.stdout.on('data', function (data) {
            console.log("[SINCRONIZACION][2] " + data);
            });
            **/
            /**
            childServerTime2.stderr.on('data', function (data) {
            console.error("[SINCRONIZACION][2] " + data);
            });
            **/

        },

        desconectar: function desconectar() {
            if (Main.info.engine == "brightsign") {
                console.log("[SINCRONIZACION] Dejando de escuchar UDP");
                _detenerComprobacionLatencia();
                debeEstarconectado = false;
                if (udpSocketListen) {
                    udpSocketListen.Close();
                } else {
                    conectado = false;
                }
            } else {
                console.log("[SINCRONIZACION] Desconectando del websocket");
                Dnv.monitor.writeLogFile("[SINCRONIZACION] Desconectando del websocket");
                _detenerComprobacionLatencia();
                debeEstarconectado = false;
                if (websocket) {
                    websocket.close();
                } else {
                    conectado = false;
                }
            }
        },
        isConectado: function isConectado() {
            return conectado;
        },
        // TODO
        isSlideDisponible: function isSlideDisponible(slide, callback) {
            var numNodos = 0;
            var timeout;

            var insercion = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getInsercion(true);

            d.join("sincro-disponibilidad-reply", function(data) {
                if (data.codSlide == slide.getCodigo() && data.sender != Dnv.deviceInfo.ip()) {
                    numNodos++;

                    if (!Dnv.presentador.isDisponible(slide.getCodigo(), insercion.getPrioridad(), insercion.getCodigo())) {
                        d.leave("sincro-disponibilidad-reply");
                        callback(false);
                    } else if (numNodos >= Dnv.sincronizacion.getNumNodosConectados()) {
                        d.leave("sincro-disponibilidad-reply");
                        callback(true);
                    }

                }
            });

            timeout = setTimeout(function() {
                console.log("[SINCRONIZACION] Slide disponible en el resto de players " + slide.getDenominacion());
                clearTimeout(timeout);
                d.leave("sincro-disponibilidad-reply");
                callback(true);
            }, 500);

        },

        getVideoSync: function getVideoSync() {
            return syncVideoPTP;
        },
        onMaestroComenzandoSlide: function(codSlide, time, insercion, nivelInsercion, campanya) { _onInicioSincronizado(codSlide, time, insercion, nivelInsercion, campanya); },
        onMaestroEnCanalSincronizado: function() { _onMaestroEnCanalSincronizado(); },
        onMaestroEnCanalNoSincronizado: function() { _onMaestroEnCanalNoSincronizado(); },
        onMaestroAvanzandoSecuencia: function(codSlide, contador, time) { _onAvanceSecuenciaSincronizada(codSlide, contador, time); },
        enviarComandosRemotos: function(comandos, time) { _enviarComandosRemotos(comandos, time); },

        onMaestroNecesitaSincronizacion: function() {
            timestampMaestroSincro = new Date().getTime();
        },

        isMaestroSincronizando: function() {
            if (maestroSincronizando) return true;
            if (new Date().getTime() - timestampMaestroSincro < 30 * 1000) return true;
            return false;
        },
        getLatenciaEsclavo: function() {
            return latenciaEsclavo;
        },
        isMaestro: function() {
            //return Dnv.cfg.getCfgBoolean("MaestroSincronizacion", false);
            return maestro;
        },
        isEsclavo: function() {
            //return Dnv.cfg.getCfgBoolean("MaestroSincronizacion", false);
            return esclavo;
        },
        setMaestro: function(valor) {
            //return Dnv.cfg.getCfgBoolean("MaestroSincronizacion", false);
            maestro = valor;
        },
        setEsclavo: function(valor) {
            //return Dnv.cfg.getCfgBoolean("MaestroSincronizacion", false);
            esclavo = valor;
        },
        setIPServidor: function(ip) {
            servidorIP = ip;
        },
        getIPServidor: function() {
            return servidorIP;
        },
        setPuertoServidor1: function(puerto) {
            servidor1Puerto = puerto;
        },
        setPuertoServidor2: function(puerto) {
            servidor2Puerto = puerto;
        },
        getPuertoServidor1: function() {
            return servidor1Puerto
        },
        getPuertoServidor2: function() {
            return servidor2Puerto
        },
        setCurrentServerPort: function(port) {
            currentServerPort = port;
        },
        getCurrentServerPort: function() {
            return currentServerPort;
        },
        getDiscover: function() {
            return d;
        },
        resetNodosSyncVideo: function() {
            numeroNodosSincVideo = 0;
        },
        isModeSync: function() {
            return isModeSync;
        },
        getNumNodosConectados: function() {
            return numeroNodos;
        },
        sendVastHivestack: function(vastHivestack) { _sendVastHivestack(vastHivestack); },
        sendVastPlaceExchange: function() { _sendVastPlaceExchange(); },
        SendRdyToSync: function() { _SendReadyToSync(); },
        SendToPlayerAvanzarSlide: function(ipP) { _SendToPlayerAvanzarSlide(ipP); },
        killffplay: function() { _sendKillFFPlay(); },
        sendConfigAdmooh: function() { _sendConfigAdmooh(); },
        sendVastAdmooh: function() { _sendVastAdmooh(); },
        sendUuidHivestack: function(uuidHivestack) { _sendUuidHivestack(uuidHivestack); },
        sendPlayListHivestack: function() { _sendPlayListHivestack(); },
        sendPlayListAdmooh: function() { _sendPlayListAdmooh(); },
        sendPlayListPlaceExchange: function() { _sendPlayListPlaceExchange(); },
        getPlayListHivestack: function() { _getPlaylistHivestack },
        sendVersionPlayer: function() { _sendVersionPlayer() }

    };



    var _intervalId = undefined;


    return {
        comenzar: function() {
            if (!_intervalId) {

                // Viendo el código de la implementacion de PC, parecen milisegundos, en vez de segundos
                var interval = Dnv.cfg.getCfgInt("SegundosTimerAvisosRemoteControl", 1000);

                if (interval <= 300) interval *= 1000; // Parece que está en segundos, pasamos a msecs

                _intervalId = setInterval(_procesarControlCommands, interval); // Cada 10 seg
            }
        },
        detener: function() {
                if (_intervalId) clearInterval(_intervalId);
                _intervalId = null;
            }
            /*,
                   lastValue: function (value) {
                       _lastValueEncendido = value;
                   },
                   onValorForzadoModificado: function(tipoCalendario, valor) {
                       if (_intervalId) _comprobarCalendarios();
                   }*/
    };


})();