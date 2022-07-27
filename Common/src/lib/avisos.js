
"use strict";

var DENEVA_CONTROL_INTERVAL = 5 * 1000;

var Dnv = Dnv || {};

Dnv.avisos = {};

Dnv.avisos.comportamiento = {
    PANTALLA_COMPLETA: 1,
    LEDONTV: 2,
    AUDIO_PREGRABADO: 3,
    AUDIO_TTS: 4,
    MENSAJE_USUARIO_LED: 5,
    MENSAJE_PREDEFINIDO_LED: 6,
    MENSAJE_PREDEFINIDO_MEGAFONIA_LEDONTV: 7,
    MENSAJE_PREDEFINIDO_MEGAFONIA_LED: 8,
    MENSAJE_USUARIO_LEDONTV: 9,
    MENSAJE_ZONACONTENIDOS: 10,
    MENSAJE_PREDEFINIDO_MEGAFONIA_VIDEO: 11,
    MENSAJE_PREDEFINIDO_MEGAFONIA_LED_LEDONTV: 12,
    MENSAJE_PREDEFINIDO_MEGAFONIA_LED_VIDEO: 13,
    AUDIO_TTS_MEGAFONIA_LED: 14,
    AUDIO_TTS_MEGAFONIA_LED_LEDONTV: 15,
    AUDIO_TTS_MEGAFONIA_LEDONTV: 16,
    PLANTILLA: 17,
    CANAL: 18
};
Dnv.avisos.cola = {};
Dnv.avisos.nextReproduccion = [];
Dnv.avisos.nextReproduccionIdioma = [];
Dnv.avisos.currentAviso = undefined;

Dnv.avisos.avisosTransitInicializados = false;

Dnv.avisosTransit = function () {
    if (!Dnv.avisos.avisosTransitInicializados) {
        Dnv.avisos.avisosTransitInicializados = true;
        if (Dnv.cfg.getCfgInt("TransITProduct", 0) > 0 && Dnv.cfg.getCfgBoolean("Avisos_RabbitMQ_Enabled", false)) {

            var setEstadoDefecto = function setEstadoDefecto() {
                var valorDefecto = 15;
                if (Dnv.Pl.lastPlaylist.getPlayer().getMetadatos["Embarcado"] == "True") {
                    valorDefecto = 115;
                }
                Dnv.Pl.valoresForzados.setValorForzado(Dnv.Calendarios.Cal.tipos.CANAL, Dnv.cfg.getCfgInt("TransITEstadoSinConexion", valorDefecto));
            }

            setEstadoDefecto();

            var checkAvisos = function () {

                // ordenamos las prioridadades de mayor a menor
                var prioridades = Object.keys(Dnv.avisos.cola).sort();
                prioridades = Object.keys(Dnv.avisos.cola).reverse();
                for (var p = 0; p < prioridades.length; p++) {
                    var avisos = Dnv.avisos.cola[prioridades[p]];
                    // recorremos los avisos de esa prioridad
                    var codAvisos = Object.keys(avisos);
                    for (var a = 0; a < codAvisos.length; a++) {

                        var aviso = avisos[codAvisos[a]];
                        var codigoAviso = aviso.getCodigo();
                        var prioridadAviso = aviso.getPrioridad();
                        var comportamientoAviso = aviso.getComportamiento();
                        var duracionAviso = aviso.getDuracion();
                        if (comportamientoAviso == Dnv.avisos.comportamiento.MENSAJE_USUARIO_LEDONTV ||
                            comportamientoAviso == Dnv.avisos.comportamiento.LEDONTV ||
                            comportamientoAviso == Dnv.avisos.comportamiento.AUDIO_TTS_MEGAFONIA_LED_LEDONTV ||
                            comportamientoAviso == Dnv.avisos.comportamiento.AUDIO_TTS_MEGAFONIA_LEDONTV ||
                            comportamientoAviso == Dnv.avisos.comportamiento.MENSAJE_PREDEFINIDO_MEGAFONIA_LED_LEDONTV) {
                            duracionAviso = -1;
                        }
                        if (aviso.isReproducible()) {
                            // solo se muestra si el aviso no es el mismo que estamos ya reproduciendo
                            // o es de prioridad mayor

                            var avisoActualVigente = false;
                            if (Dnv.avisos.currentAviso &&
                                Dnv.avisos.cola[Dnv.avisos.currentAviso.getPrioridad()] &&
                                Dnv.avisos.cola[Dnv.avisos.currentAviso.getPrioridad()][Dnv.avisos.currentAviso.getCodigo()]
                                ) {
                                avisoActualVigente = true;
                            }

                            if (!avisoActualVigente ||
                           (Dnv.avisos.currentAviso.getCodigo() != codigoAviso && (prioridadAviso > Dnv.avisos.currentAviso.getPrioridad() &&
                            codigoAviso != Dnv.avisos.currentAviso.getCodigo()))
                            ) {
                                var presentacion = aviso.getPresentaciones()[Dnv.avisos.nextReproduccionIdioma[prioridades[p]][codigoAviso]];

                                if (duracionAviso == -1) {
                                    Dnv.Smo.setAviso(codigoAviso,
                                                 comportamientoAviso,
                                                 presentacion.text,
                                                 Dnv.cfg.getCfgInt("Avisos_NumPasesLedOnTv", 1),
                                                 prioridadAviso,
                                                 aviso.getTipoBase(),
                                                 presentacion.lang
                                                 );

                                } else {
                                    Dnv.Smo.setAvisoDuracion(codigoAviso,
                                                 comportamientoAviso,
                                                 presentacion.text,
                                                 Dnv.cfg.getCfgInt("Avisos_NumPasesLedOnTv", 1),
                                                 prioridadAviso,
                                                 aviso.getTipoBase(),
                                                 presentacion.lang,
                                                 duracionAviso
                                                 );
                                }

                                aviso.setNextReproduccion();
                                Dnv.avisos.currentAviso = aviso;
                            }
                            break;
                        }

                    }
                }

            }

            var user = Dnv.encoder.descodificar(Dnv.cfg.getCfgString("RabbitMQ_User", "administrador"));
            var pass = Dnv.encoder.descodificar(Dnv.cfg.getCfgString("RabbitMQ_Pass", "Iconmm2k8"));
            var url = Dnv.cfg.getCfgString("RabbitMQ_ConnectionString", "167.114.127.177");
            var port = Dnv.cfg.getCfgInt("RabbitMQ_PortMQTT", 1883);
            var vhost = Dnv.cfg.getCfgString("RabbitMQ_Vhost", "");

            var topicToBindAvisos = "/SendAviso/" + Dnv.cfg.getCfgInt("MyOwnCode", 0);
            var topicToBindVariables = "/Onboard/variables";
            var topicToBindComandos = "/SendRemoteCommand/" + Dnv.cfg.getCfgInt("MyOwnCode", 0);

            var mqtt = require('mqtt');
            var cliente = mqtt.connect("mqtt://" + url, { username: user, password: pass, port: port, clientId: "PlayerHTML5_" + Dnv.cfg.getCfgString("MyOwnCode", 0) });
            cliente.subscribe(topicToBindAvisos);
            cliente.subscribe(topicToBindVariables);
            cliente.subscribe(topicToBindComandos);

            cliente.on('connect', function () {
                console.info("[RABBIT] Conectado");
            });
            cliente.on('disconnect', function (err) {
                console.warn("[RABBIT] Conexion cerrada " + err.message);
                setEstadoDefecto();
            });
            cliente.on('error', function (err) {
                console.error("[RABBIT] Error en conexion " + err.message);
            });

            var lastMessageVariables;

            cliente.on('message', function (topic, message) {

                var string = message.toString();

                switch (topic) {

                    case topicToBindComandos:

                        try {
                            console.info("[RABBIT][COMANDOS] Msg recibido: " + string);
                            var data = JSON.parse(string);
                            Dnv.comandosRemotos.procesarComandosRemoto(data.comando);
                        } catch (e) {
                            console.warn("[RABBIT][COMANDOS] Msg con formato incorrecto");
                        }

                    case topicToBindAvisos:
                        try {

                            console.info("[RABBIT][AVISOS] Msg recibido: " + string);

                            var data = JSON.parse(string);

                            if (data.Avisos == null) {
                                Dnv.avisos.cola = {};
                                checkAvisos();
                                return
                            }

                            var avisos = data.Avisos.Aviso;

                            Dnv.avisos.cola = {};

                            for (var av = 0; av < avisos.length; av++) {

                                var mensaje = avisos[av];

                                // obtenemos las distintas presentaciones que tiene el aviso (idiomas)
                                var presentaciones = [];
                                var presentacion_idiomas = mensaje.Presentacion.langs;
                                for (var l = 0; l < presentacion_idiomas.length; l++) {
                                    var lang = presentacion_idiomas[l].lang;
                                    if (lang.length) {
                                        for (var la = 0; la < lang.length; la++) {
                                            var sublang = lang[la];
                                            presentaciones.push({ lang: sublang["@ID"], size: sublang.Txt["@Size"], text: sublang.Txt["#cdata-section"] });
                                        }
                                    } else {
                                        presentaciones.push({ lang: lang["@ID"], size: lang.Txt["@Size"], text: lang.Txt["#cdata-section"] });
                                    }
                                }

                                var codigo = parseInt(mensaje["@Codigo"]);
                                var enabled = parseInt(mensaje["@Enabled"]);
                                var fechaInicio = Date.parse(Dnv.utiles.stringToTimestamp(mensaje["@FechaInicio"]));
                                var fechaFinal = Date.parse(Dnv.utiles.stringToTimestamp(mensaje["@FechaFinal"]));
                                var horaInicio = Dnv.utiles.parseTimeInMinutes(mensaje["@HoraInicio"]);
                                var horaFinal = Dnv.utiles.parseTimeInMinutes(mensaje["@HoraFinal"]);
                                var diasSemana = mensaje["@Dias"];
                                var prioridad = parseInt(mensaje["@Prioridad"]);
                                var ambitoSalida = mensaje["@AmbitoSalidas"].split(/[,;]/);

                                // miramos si cumple las condiciones para mostrarse de que este habilitado y ambito
                                if (enabled == 1 && ambitoSalida.includes(Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo().toString())
                        ) {

                                    var aviso = new Dnv.Pl.Aviso(codigo,
                                                                 parseInt(mensaje["@ObjID"]),
                                                                 mensaje["@Denominacion"],
                                                                 mensaje["@TipoAviso"],
                                                                 mensaje["@TipoMedio"],
                                                                 parseInt(mensaje["@TipoBase"]),
                                                                 enabled,
                                                                 parseInt(mensaje["@Comportamiento"]),
                                                                 fechaInicio,
                                                                 fechaFinal,
                                                                 horaInicio,
                                                                 horaFinal,
                                                                 parseInt(mensaje["@Duracion"]),
                                                                 diasSemana,
                                                                 parseInt(mensaje["@Repeticiones"]),
                                                                 ambitoSalida,
                                                                 prioridad,
                                                                 parseInt(mensaje["@Repeticiones_Intervalo"]),
                                                                 presentaciones
                                );

                                    if (!Dnv.avisos.cola[prioridad]) Dnv.avisos.cola[prioridad] = {};

                                    if (!Dnv.avisos.nextReproduccion[prioridad]) Dnv.avisos.nextReproduccion[prioridad] = [];
                                    if (!Dnv.avisos.nextReproduccionIdioma[prioridad]) Dnv.avisos.nextReproduccionIdioma[prioridad] = [];

                                    if (!Dnv.avisos.nextReproduccion[prioridad][codigo]) Dnv.avisos.nextReproduccion[prioridad][codigo] = new Date(0);
                                    if (!Dnv.avisos.nextReproduccionIdioma[prioridad][codigo]) Dnv.avisos.nextReproduccionIdioma[prioridad][codigo] = 0;

                                    Dnv.avisos.cola[prioridad][codigo] = aviso;
                                    //}

                                }
                                checkAvisos();
                            }

                        } catch (e) {
                            console.warn("[RABBIT][AVISOS] Msg con formato incorrecto");
                        }

                        break;
                    case topicToBindVariables:

                        if (lastMessageVariables && string == lastMessageVariables) return;

                        lastMessageVariables = string;

                        console.info("[RABBIT][VARIABLES] Msg recibido: " + string);

                        var data = JSON.parse(string);

                        try {
                            var mensaje = data;
                            if (mensaje.Content == "variables") {
                                var variables = mensaje.variables;
                                for (var v = 0; v < variables.length; v++) {
                                    var variable = parseInt(variables[v].id);
                                    var value = parseInt(variables[v].value);
                                    // variable de estado de embarcado
                                    if (variable == 1100 && Dnv.Pl.Variables[variable].getValor() != value) {
                                        Dnv.Variables.actualizarValor(variable, value);
                                        // obtener el estado
                                        var estado = Dnv.Pl.lastPlaylist.getPlayer().getEstados()[value];
                                        if (estado) {
                                            console.info("[RABBIT][VARIABLES] Cambiando a estado: " + estado.getDenominacion() + " (" + estado.getCodigo() + ")");
                                            Dnv.Pl.EstadoActual = estado.getCodigo();
                                            // cambiar al canal asociado al estado
                                            var canal = estado.getCanal();
                                            if (canal == 0) {
                                                Dnv.Pl.valoresForzados.deleteValorForzado(Dnv.Calendarios.Cal.tipos.CANAL);
                                            } else {
                                                Dnv.Pl.valoresForzados.setValorForzado(Dnv.Calendarios.Cal.tipos.CANAL, canal);
                                            }
                                        }
                                    } else if (Dnv.Pl.Variables[variable] && Dnv.Pl.Variables[variable].getValor() != value) {
                                        // actualizar el estado de la variable
                                        Dnv.Variables.actualizarValor(variable, value);
                                        Dnv.presentador.avanzarSlideEvaluandoActual(true);
                                    }
                                }
                            } else {
                                console.warn("[RABBIT][VARIABLES] Msg no correspondiente a variables");
                            }
                        } catch (e) {
                            console.warn("[RABBIT][VARIABLES] Msg con formato incorrecto");
                        }
                        break;
                }

            });

            var intervalCheckAvisos = setInterval(checkAvisos, 1000);
        }
    }
}


Dnv.comandosRemotos = (function () {

    try {
        var worker = new Worker("lib/avisos_worker.js");

        worker.onMessage = function avisosWorkerMessageHandler(oEvent) {
            if (oEvent.data) {
                if (oEvent.data.isConsole) {
                    console.log("[CONTROL] Mensaje de worker " + oEvent.data.level + " " + oEvent.data.msg);
                    console[oEvent.data.level](oEvent.data.msg);
                } else if (oEvent.data.isComandos) {
                    _procesarComandosRemotos(oEvent.data.comandos);

                    //console.log("[CONTROL] Worker said : " + oEvent.data);
                } else {
                    console.log("[CONTROL] Worker said : " + oEvent.data);
                }
            }
        };
        worker.onmessage = worker.onMessage; // LG (comprobar en samsung tambien que este es el correcto)
        worker.onerror = function onerror(e) {
            console.error("[CONTROL]  WORKER ERROR: " + e.message + " " + e.filename + " " + e.lineno);
        };
    } catch (e) { }

    var _SEPARADOR = String.fromCharCode(255); // ÿ
    var _ultimoComandoProcesadoTimestamp = 0;

    function _procesarComandoRemoto(comando) {
        /*
        * Por un lado tenemos los comandos remotos normales (mando a distancia, carrusel),
        * y por otro los que vienen de RemoteControl
        * 
        * Los de RemoteControl tienen la forma:
        * MSJCMD||16662||SET_CALENDAR|300|197148|START_RC||CMD||60;16229;16662;ÿ02/05/2017 19:20:02
        * donde 16662 es el ObjectId de la salida, 60 el del TopMaster y 16229 el del player
        * 
        * Puede llegarnos el mismo valor múltiples veces, pero tal y como está hecho lo de los valores
        * forzados, primero setear todo y luego aplicar las diferencias frente a lo que está en ejecución, 
        * debería evitarse que el mismo comando se aplique varias veces.
        */
        if (comando.indexOf("MSJCMD||" === 0)) {
            var parts = comando.split("||");
            var destinatario = parts[1]; // Validar que sea
            var cmd = parts[2];
            var nexos = parts[3]; // ¿?
            var timestamp = undefined;
            var codHistorico = undefined;
            var exito = undefined;
            var msgError = undefined;



            

            console.info("Procesando comando remoto: " + cmd);
            var pl = Dnv.Pl.lastPlaylist;
            if (pl.getPlayer().getCodigo() == destinatario || pl.getPlayer().getSalida().getCodigo() == destinatario) {
                /*
                if (cmd.indexOf("|START_RC") >= 0 && cmd.indexOf("|START_RC") == cmd.length - "|START_RC".length) {
                    // Si acaba con |START_RC, lo eliminamos
                    cmd = cmd.substr(0, cmd.length - "|START_RC".length);

                    Dnv.Pl.valoresForzados.onRemoteControlCommandRecibido();
                    timestamp = Dnv.utiles.stringToTimestamp(parts[4].split(_SEPARADOR)[1]);
                } else if (cmd.indexOf("|START_RC|") >= 0) {
                // Si START_RC es parte intermedia del comando, tambien lo quitamos
                */
                var cmdParts = cmd.split("|");
                for (var i = 0; i < cmdParts.length; i++) {
                    // Buscamos partes "opcionales" y las quitamos
                    var part = cmdParts[i];
                    if (part == "START_RC") {
                        Dnv.Pl.valoresForzados.onRemoteControlCommandRecibido();
                        timestamp = Dnv.utiles.stringToTimestamp(parts[4].split(_SEPARADOR)[1]);
                        cmdParts.splice(i, 1);
                        i--;
                    } else if (part.indexOf("CMDHISTORICO[") === 0) {
                        codHistorico = parseInt(part.substr(part.indexOf("[") + 1, part.indexOf("]") - 1));
                        cmdParts.splice(i, 1);
                        i--;
                    }
                }
                // e.g. "SET_CALENDAR\\|300\\||SET_STREAM\\|"
                /*
                * Definimos expresiones regulares de comandos a ignorar. Por ejemplo "SET_CALENDAR\|300\||SET_STREAM\|" 
                * para no permitir cambiar de canal o stream
                * /
                var patronIgnorados = Dnv.cfg.getCfgString("PatronComandosIgnorados", null);
                //var patronIgnorados = Dnv.cfg.getCfgString("PatronComandosIgnorados", "SET_CALENDAR\\|300\\||SET_STREAM\\|");
                if (patronIgnorados) {
                var re = new RegExp(patronIgnorados);
                if (cmd.match(re)) {
                console.warn("Ignorando comando remoto: " + cmd);
                return;
                }
                }
                */
                /*
                * Como usar expresiones regulares puede ser propenso a errores
                *`Ponemos una opcion mas sencilla: una lista, separada por ; de
                * strings por los que comenzarán los comandos a ignorar
                */
                //var iniciosIgnorados = Dnv.cfg.getCfgString("ComandosRemotosIgnorados", "SET_CALENDAR|300|;SET_STREAM|").split(";");
                var iniciosIgnorados = Dnv.cfg.getCfgString("ComandosRemotosIgnorados", "").split(";");
                for (var i = 0; i < iniciosIgnorados.length; i++) {
                    if (iniciosIgnorados[i].length > 0 && cmd.indexOf(iniciosIgnorados[i]) === 0) {
                        console.warn("Ignorando comando remoto: " + cmd);
                        msgError = "Comando ignorado";
                        exito = false;
                        cmdParts[0] = "CMD_IGNORADO";
                    }
                }
                // TODO: refactorizar la comprobacion timestamp

                switch (cmdParts[0]) {
                    case "RESET":
                        if (cmdParts.length === 1) {
                            if (!timestamp || _ultimoComandoProcesadoTimestamp < timestamp) {
                                console.warn("[CONTROL] - Reseteamos el equipo en 5 segundos...");
                                setTimeout(Dnv.monitor.restart, 5000); //dejamos un tiempo xq si no no loguea y puede que no guarde los datos
                                exito = true;
                            } else {
                                msgError = "Comando sin timestamp u obsoleto: " + cmd;
                                console.warn("[CONTROL] " + msgError);
                                exito = false;
                            }
                        } else {
                            console.warn("[CONTROL] Formato de comando inválido: " + cmd);
                            exito = false;
                            msgError = "Formato de comando inválido: " + cmd;
                        }
                        break;
                    case "SET_CALENDAR":
                        if (cmdParts.length === 3) {
                            Dnv.Pl.valoresForzados.preSetValorForzado(cmdParts[1], cmdParts[2]);
                            exito = true;
                        } else {
                            console.warn("[CONTROL] Formato de comando inválido: " + cmd);
                            exito = false;
                            msgError = "Formato de comando inválido: " + cmd;
                        }
                        break;
                    case "RESET_CALENDAR":
                        if (cmdParts.length === 2) {
                            Dnv.Pl.valoresForzados.preDeleteValorForzado(cmdParts[1]);
                            exito = true;
                        } else {
                            console.warn("[CONTROL] Formato de comando inválido: " + cmd);
                            exito = false;
                            msgError = "Formato de comando inválido: " + cmd;
                        }
                        break;
                    case "NEXTPLANTILLA":
                        // TODO: tal como lo ponemos, los comandos
                        if (cmdParts.length === 1) {
                            if (!timestamp || _ultimoComandoProcesadoTimestamp < timestamp) {
                                if (timestamp) _ultimoComandoProcesadoTimestamp = timestamp;

                                Dnv.presentador.avanzarSlideDirectamente();
                                exito = true;
                            } else {
                                msgError = "Comando obsoleto: " + cmd;
                                console.warn("[CONTROL] " + msgError);
                                exito = false;
                            }
                        } else {
                            console.warn("[CONTROL] Formato de comando inválido: " + cmd);
                            exito = false;
                            msgError = "Formato de comando inválido: " + cmd;
                        }
                        break;
                    case "HOME":
                        if (cmdParts.length === 1) {
                            if (!timestamp || _ultimoComandoProcesadoTimestamp < timestamp) {
                                if (timestamp) _ultimoComandoProcesadoTimestamp = timestamp;

                                Dnv.presentador.irAInicioPresentacion();
                                exito = true;
                            } else {
                                msgError = "Comando sin timestamp u obsoleto: " + cmd;
                                console.warn("[CONTROL] " + msgError);
                                exito = false;
                            }
                        } else {
                            console.warn("[CONTROL] Formato de comando inválido: " + cmd);
                            exito = false;
                            msgError = "Formato de comando inválido: " + cmd;
                        }
                        break; case "SET_STREAM":
                        // TODO: tal como lo ponemos, los comandos
                        if (cmdParts.length === 2 || cmdParts.length === 3) {
                            if (!timestamp || _ultimoComandoProcesadoTimestamp < timestamp) {
                                if (timestamp) _ultimoComandoProcesadoTimestamp = timestamp;

                                Dnv.Pl.valoresForzados.preSetValorForzado(
                                        Dnv.Pl.valoresForzados.CODIGO_STREAMING,
                                        { url: cmdParts[1], mimeType: cmdParts[2], urlOriginal: cmdParts[1] });
                                // Al aplicar el cambio de calendario, se lanza CAMBIO_STREAM_EVENT desde el control de calendario
                                /* 
                                * Si lanzabamos el evento y el stream no esta en pantalla, en webOS2 se llamaba a setNowShowingStreaming dos veces,
                                * una con el streaming nuevo y justo despues otra con el streaming viejo.
                                */
                                /*window.dispatchEvent(new CustomEvent(
                                Dnv.Pl.valoresForzados.CAMBIO_STREAM_EVENT,
                                { 'detail': { url: cmdParts[1], mimeType: cmdParts[2], urlOriginal: cmdParts[1]} }));*/
                                exito = true;
                            } else {
                                msgError = "Comando sin timestamp u obsoleto: " + cmd;
                                console.warn("[CONTROL] " + msgError);
                                exito = false;
                            }
                        } else {
                            console.warn("[CONTROL] Formato de comando inválido: " + cmd);
                            exito = false;
                            msgError = "Formato de comando inválido: " + cmd;
                        }
                        break;
                    case "RESET_STREAM":
                        // TODO: tal como lo ponemos, los comandos
                        if (cmdParts.length === 1) {
                            if (!timestamp || _ultimoComandoProcesadoTimestamp < timestamp) {
                                if (timestamp) _ultimoComandoProcesadoTimestamp = timestamp;
                                Dnv.Pl.valoresForzados.preDeleteValorForzado(Dnv.Pl.valoresForzados.CODIGO_STREAMING);
                                // No lanzamos el RESET_STREAM_EVENT porque ya se lanza a partir de deleteValorForzado
                                /*
                                window.dispatchEvent(new CustomEvent(
                                Dnv.Pl.valoresForzados.RESET_STREAM_EVENT,
                                { 'detail': {} }));
                                */
                                Dnv.Pl.valoresForzados.deleteValorForzado(Dnv.Pl.valoresForzados.CODIGO_STREAMING);
                                exito = true;
                            } else {
                                msgError = "Comando obsoleto: " + cmd;
                                console.warn("[CONTROL] " + msgError);
                                exito = false;
                            }
                        } else {
                            console.warn("[CONTROL] Formato de comando inválido: " + cmd);
                            exito = false;
                            msgError = "Formato de comando inválido: " + cmd;
                        }
                        break;
                    case "SET_AUDIO_BOOST":
                        /*
                        * El audio boost es un metadato de player que especifica un porcentaje
                        * por el que multiplicar el valor del calendario de volumen
                        */
                        if (cmdParts.length === 2 && !isNaN(cmdParts[1])) {
                            // Definimos el prevalor para que al aplicarlos, no pise el valor forzado
                            Dnv.Pl.valoresForzados.preSetValorForzado(Dnv.Pl.valoresForzados.CODIGO_AUDIO_BOOST, cmdParts[1]);
                            Dnv.Pl.valoresForzados.setValorForzado(Dnv.Pl.valoresForzados.CODIGO_AUDIO_BOOST, cmdParts[1]);
                            window.dispatchEvent(new CustomEvent(
                                        Dnv.Pl.valoresForzados.CAMBIO_AUDIO_BOOST_EVENT,
                                        { 'detail': {} }));
                            exito = true;
                        } else {
                            console.warn("[CONTROL] Formato de comando inválido: " + cmd);
                            exito = false;
                            msgError = "Formato de comando inválido: " + cmd;
                        }
                        break;
                    case "RESET_AUDIO_BOOST":

                        if (cmdParts.length === 1) {
                            if (!timestamp || _ultimoComandoProcesadoTimestamp < timestamp) {
                                if (timestamp) _ultimoComandoProcesadoTimestamp = timestamp;
                                Dnv.Pl.valoresForzados.preDeleteValorForzado(Dnv.Pl.valoresForzados.CODIGO_AUDIO_BOOST);
                                Dnv.Pl.valoresForzados.deleteValorForzado(Dnv.Pl.valoresForzados.CODIGO_AUDIO_BOOST);
                                window.dispatchEvent(new CustomEvent(
                                        Dnv.Pl.valoresForzados.CAMBIO_AUDIO_BOOST_EVENT,
                                        { 'detail': {} }));
                                exito = true;
                            } else {
                                msgError = "Comando obsoleto: " + cmd;
                                console.warn("[CONTROL] " + msgError);
                                exito = false;
                            }
                        } else {
                            console.warn("[CONTROL] Formato de comando inválido: " + cmd);
                            exito = false;
                            msgError = "Formato de comando inválido: " + cmd;
                        }
                        break;
                    case "CLEAROSD":
                    case "RESET_CANAL_TDT":
                    case "RESET_IDIOMA":
                        // Son comandos que se envian en restablecer. Devolvemos OK
                        console.warn("[CONTROL] Comando desconocido: " + cmd);
                        exito = true;
                        msgError = "Comando no implementado: " + cmdParts[0];
                        break;
                    case "CMD_IGNORADO":
                        break;
                    default:
                        exito = false;
                        msgError = "Comando desconocido: " + cmdParts[0];
                        console.warn("[CONTROL] Comando desconocido: " + cmd);
                }
            } else {
                exito = false;
                console.warn("[CONTROL] Comando para salida desconocida: " + comando);
            }

        } else {
            exito = false;
            console.warn("[CONTROL] Comando desconocido: " + comando);
        }

        /*
        * Estados:
        * 0 No comenzado
        * 1 Enviado
        * 2 En ejecucion
        * 3 Terminado OK
        * 4 Terminado Error
        * 5 Timeout
        */
        if (codHistorico !== undefined) {
            Dnv.servidor.DNVControlComandoEjecutado(codHistorico, destinatario, (exito === true ? 3 : 4), (msgError ? msgError : ""));
        }
        return exito;


    }


    function _procesarComandosRemotos(comandos) {
        //if (!Dnv.sincronizacion.isEsclavo()) {
        //Dnv.servidor.getRemoteControlCommands(function (comandos) {

        Dnv.sincronizacion.onMaestroNecesitaSincronizacion();

        /*if (Dnv.sincronizacion.isMaestro() && comandos.length > 0) {
        Dnv.sincronizacion.enviarComandosRemotos(comandos);
        }*/

        function ejecutar() {
            var inicio = new Date().getTime();
            var hayComandoValido = false;
            for (var i = 0; i < comandos.length; i++) {
                var exito = _procesarComandoRemoto(comandos[i]);
                hayComandoValido = hayComandoValido || exito;
            }
            console.log("Duración de evaluación de comandos remotos " + (new Date().getTime() - inicio) + "ms");
            if (hayComandoValido) Dnv.Pl.valoresForzados.aplicarPreValores();
        }
        //ejecutar();

        //if (Dnv.sincronizacion.isMaestro()) {
        //    console.log("[CONTROL] Retrasando ejecucion de comandos");
        //    setTimeout(ejecutar, Dnv._SYNC_DELAY_MAESTRO + Dnv.sincronizacion.getLatenciaEsclavo());
        //} else {
        //    ejecutar();
        //}
        //});
        //}
        if (Dnv.sincronizacion.isMaestro() && comandos.length > 0) {

            var time = new Date().getTime() + 1500;
            Dnv.sincronizacion.enviarComandosRemotos(comandos, time);


            Dnv.comandosRemotos.inyectarComandosRemotos(comandos, time);

            /*setTimeout(function () {
            ejecutar();
            }, 1500 /*Dnv._SYNC_DELAY_MAESTRO + Dnv.sincronizacion.getLatenciaEsclavo()* /);*/
        } else {
            ejecutar();
        }

    }



    var _intervalId = undefined;

    window.addEventListener(Dnv.NEW_PLAYLIST_EVENT, function (evt) {
        console.log(evt);
        var pl = evt.detail;
        var player = pl.getPlayer();

        if (player.isRight() && Dnv.sincronizacion.isConectado()) {
            Dnv.comandosRemotos.detener();
        } else {
            Dnv.comandosRemotos.comenzar();
        }
    });



    window.addEventListener(Dnv.sincronizacion.SINCRONIZACION_CONECTADO_EVENT, function (evt) {
        console.log(evt);
        var pl = Dnv.Pl.lastPlaylist;
        if (pl) {
            var player = pl.getPlayer();

            if (player.isRight()) {
                Dnv.comandosRemotos.detener();
            } else {
                Dnv.comandosRemotos.comenzar();
            }
        }
    });

    window.addEventListener(Dnv.sincronizacion.SINCRONIZACION_DESCONECTADO_EVENT, function (evt) {
        console.log(evt);
        if (Dnv.Pl.lastPlaylist) {
            Dnv.comandosRemotos.comenzar();
        }
    });


    Dnv.systemInfo.addCambioEstadoConexionServidorCallback(function (isConectado) {
        Dnv.comandosRemotos.onCambioEstadoConexion(isConectado);
    });

    return {
        comenzar: function () {
            if (!Dnv.cfg.getCfgBoolean("RemoteControlEnabled", false)) return;

            var url = Dnv.cfg.getCfgString("AvisosClientEndPointAddressWeb", Dnv.cfg.getDefaultWcfServerAddress() + "/ServicioAvisos/WebAvisos") + "/GetRemoteControl";
            var interval = Dnv.cfg.getCfgInt("SegundosTimerAvisosRemoteControl", DENEVA_CONTROL_INTERVAL);

            if (interval <= 0) {
                interval = DENEVA_CONTROL_INTERVAL;
            } else if (interval <= 300) {
                interval *= 1000; // Parece que está en segundos, pasamos a msecs
            }
            var objectId = Dnv.cfg.getCfgInt("MyOwnCode", 0);
            /*
             * Esto lo hizo Raul para "DEMO SIMON"
             * No tiene sentido. Si el setting esta mal, que corrijan el setting, en lugar de sobrescribir nosotros su valor.
             
            if (!url.includes(Dnv.cfg.getConfigIpServer())) {
                var url = url.replace(url.split("/")[2].split(":")[0], Dnv.cfg.getConfigIpServer());
            }
            */
            try {
                worker.postMessage({
                    comando: "comenzar",
                    url: url,
                    interval: interval,
                    objectId: objectId
                });
            } catch (e) {
                console.error("[CONTROL] No se pudo enviar el mensaje de arranque al worker");
                Dnv.monitor.writeLogFile("[CONTROL] No se pudo enviar el mensaje de arranque al worker", LogLevel.Error);
            };

        },
        detener: function () {
            if (!Dnv.cfg.getCfgBoolean("RemoteControlEnabled", false)) return;

            try {
                worker.postMessage({ comando: "detener" });
            } catch (e) {
                console.error("[CONTROL] No se pudo enviar el mensaje de detención al worker");
                Dnv.monitor.writeLogFile("[CONTROL] No se pudo enviar el mensaje de detención al worker", LogLevel.Error);
            };
        },
        inyectarComandosRemotos: function (comandos, time) {
            if (!Dnv.cfg.getCfgBoolean("RemoteControlEnabled", false)) return;

            var inicio = new Date().getTime();
            var hayComandoValido = false;
            for (var i = 0; i < comandos.length; i++) {
                hayComandoValido = hayComandoValido || _procesarComandoRemoto(comandos[i]);
            }
            console.log("Duración de evaluación de comandos remotos inyectados " + (new Date().getTime() - inicio) + "ms");

            var delay = time - new Date().getTime();
            if (hayComandoValido) setTimeout(Dnv.Pl.valoresForzados.aplicarPreValores, (delay > 0 ? delay : 1));

        },
        onCambioEstadoConexion: function onCambioEstadoConexion(isConectado) {

            try {
                worker.postMessage({
                    comando: "cambioEstadoConectividad",
                    hayConectividad: isConectado
                });
            } catch (e) {
                console.error("[CONTROL] No se pudo enviar el cambio de estado de conectividad al worker");
                Dnv.monitor.writeLogFile("[CONTROL] No se pudo enviar el cambio de estado de conectividad al worker", LogLevel.Error);
            };
        },
        procesarComandosRemoto: function procesarComandosRemoto(comandos) {
            _procesarComandoRemoto(comandos);
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


