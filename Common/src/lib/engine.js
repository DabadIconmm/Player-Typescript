"use strict";

var RESOLUTION_CHANGED = "RESOLUTION_CHANGED"; // Evento que lanzamos cuando una plantilla tiene resolucion distinta a la anterior

Dnv.NEW_SLIDE_SHOWN_EVENT = "new_slide_shown";

Dnv._DO_PRECARGA = true;
Dnv._DO_PRECARGA_NO_FIRST = false;
Dnv._PRECARGA_DELAY = 2500;
Dnv._OPACITY_ENABLED = false;
Dnv._OPACITY_OCULTO = 0; //0; // Que no tenga el mismo valor que opacity end
Dnv._OPACITY_VISIBLE = 1;
Dnv._OPACITY_DURATION = "50ms";
Dnv._SYNC_DELAY_MAESTRO = 1500;

Dnv._INTERACTIVO_SMOOTH = false;

/**
 * Usar visibility:hidden en lugar de display:none para ocultar el wrapper que no se muestra
 * Con visibility:hidden parece que los nuevos elementos si que se renderizan en parte, y eso evita problemas
 * con videos en LG al precargar
 */
Dnv._USAR_VISIBILITY = true;



(function() {
    var detectarModoOcultar = function detectarModoOcultar() {

        if (document.getElementById("wrapper0").style.display === document.getElementById("wrapper1").style.display &&
            document.getElementById("wrapper0").style.visibility !== document.getElementById("wrapper1").style.visibility) {
            Dnv._USAR_VISIBILITY = true;
        } else if (document.getElementById("wrapper0").style.display !== document.getElementById("wrapper1").style.display &&
            document.getElementById("wrapper0").style.visibility === document.getElementById("wrapper1").style.visibility) {
            Dnv._USAR_VISIBILITY = false;
        }
    }
    if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", detectarModoOcultar);
    else detectarModoOcultar();
})();

Dnv.helpers = Dnv.helpers || {};
Dnv.helpers.isIE = (function() {
    var value = (navigator.userAgent.indexOf("MSIE") != -1) || (navigator.userAgent.indexOf("Trident") != -1);
    return function() { return value; };
})();
Dnv.helpers.isOldIE = (function() { // IE 10 o inferior
    var value = (navigator.userAgent.indexOf("MSIE") != -1);
    return function() { return value; };
})();
/*
 * El apaño de hacer div.innerHTML = object.outerHTML
 */
Dnv.helpers.needsObjectInnerOuterWorkarround = Dnv.helpers.isIE;

Dnv.helpers.inDom = function inDom(elemento) {
    //console.log((elemento.ownerDocument === document ? "ownerDocument es document" : "ownerDocument no es document"));
    while (elemento.parentNode != null) {
        elemento = elemento.parentNode;
    }
    return elemento === document;
    //console.log((elemento === document ? "elemento es hijo de document" : "elemento no es hijo de document"));
};

/*
 * FIXME: Los errores de precarga no pueden manejarse asi puesto que se causarian avances innecesarios
 */
Dnv.helpers.error = function(e) {
    var elemento = e.currentTarget;
    elemento.removeEventListener("error", Dnv.helpers.error);
    var elementoSrc = elemento.getAttribute("data-filename-original") || elemento.src || elemento.outerHTML;
    var txtError = "Ocurrió un error con el elemento " + elemento + " " + elementoSrc + ": " + e + " " + e.message + " " + e.error;
    if (Dnv.monitor.sendLogRabbit) Dnv.monitor.sendLogRabbit(txtError, "ERROR");
    console.error(txtError);
    console.dir(e);
    console.error("Avanzamos slide debido al error con el elemento");
    /*
     * FIXME: Forzar un avance incondicionalmente es propenso a errores puesto que un elemento de una plantilla antigua
     * uede forzar avances innecesarios.
     * 
     * Idea para mantener el manejador de errores global: guardar el id de carga en un atributo del div slidewrapper
     * En este manejador miramos si e.srcElement está en el DOM y si lo está, recorremos sus padres hasta llegar al slidewrapper
     * De el sacamos el id de carga, y avanzamos con el
     * 
     */
    Dnv.presentador.avanzarSlideDirectamente();
};

Dnv.helpers.checkPlayingVideo_interval = null;
Dnv.helpers.checkPlayingVideo = function(elemento) {

    var lastMomentCheckPlayingVideo = 0;

    var elementoSrc = elemento.getAttribute("data-filename-original") || elemento.src || elemento.outerHTML;

    clearInterval(Dnv.helpers.checkPlayingVideo_interval);

    var duration = elemento.duration;

    Dnv.helpers.checkPlayingVideo_interval = setInterval(function() {

        var current = elemento.currentTime;

        if (!(current > lastMomentCheckPlayingVideo)) {
            if (current == 0 && lastMomentCheckPlayingVideo != 0) {
                clearInterval(Dnv.helpers.checkPlayingVideo_interval);
                console.info("[SINCRONIZACION][ES MAESTRO: " + Dnv.sincronizacion.isMaestro() + "] El video " + elementoSrc + " no se ha parado (" + current + "," + lastMomentCheckPlayingVideo + "," + duration + "), ha finalizado");
            } else if (current > (duration - 1)) {
                clearInterval(Dnv.helpers.checkPlayingVideo_interval);
                console.info("[SINCRONIZACION][ES MAESTRO: " + Dnv.sincronizacion.isMaestro() + "] El video " + elementoSrc + " no se ha parado (" + current + "," + lastMomentCheckPlayingVideo + "," + duration + "), ha finalizado");
            } else {
                //clearInterval(Dnv.helpers.checkPlayingVideo_interval);
                console.error("[SINCRONIZACION][ES MAESTRO: " + Dnv.sincronizacion.isMaestro() + "] El video " + elementoSrc + " se ha parado (" + current + "," + lastMomentCheckPlayingVideo + "," + duration + ")");
                if (Dnv.monitor.sendLogRabbit) Dnv.monitor.sendLogRabbit("[SINCRONIZACION][ES MAESTRO: " + Dnv.sincronizacion.isMaestro() + "] El video " + elementoSrc + " se ha parado (" + current + "," + lastMomentCheckPlayingVideo + "," + duration + ")", "ERROR");

                Dnv.presentador.getController().removeAllMediaElement();
                Dnv.presentador.getController().addMediaElement(elemento);
                Dnv.presentador.getController().play();
            }
        } else {
            lastMomentCheckPlayingVideo = current;
        }

    }, 4000);

};


Dnv.helpers.getMaestra = function getMaestra(slide, salida) {
    if (!slide) return 0;

    salida = (salida || slide.getPlantilla().getPlaylist().getPlayer().getSalida());
    var canal = slide.getCanal();
    var metadatoMaestraSalida = salida.getMetadatos()['PlantillaMaestra'];
    if (metadatoMaestraSalida) {
        metadatoMaestraSalida = parseInt(metadatoMaestraSalida, 10);
        //if (metadatoMaestraSalida === 0) metadatoMaestraSalida = 0;
    } else {
        metadatoMaestraSalida = 0;
    }
    var maestraPlantilla = slide.getPlantilla().getMaestra();
    if (canal.isForzarMaestra()) {
        // Si Salida_Override_PlantillaMaestra, usamos siempre la maestra de la salida, y si no, solo la usamos si la maestra no tiene maestra propia
        if (Dnv.cfg.getCfgBoolean("Salida_Override_PlantillaMaestra", true) || maestraPlantilla === 0) {
            return metadatoMaestraSalida;
        } else {
            return maestraPlantilla;
        }
    } else {
        return maestraPlantilla;
    }
};
Dnv.helpers.sonPlantillasEquivalentes = function sonPlantillasEquivalentes(plantilla1, plantilla2, idioma1, idioma2) {
    if (plantilla1.getCodigo() != plantilla2.getCodigo() ||
        plantilla1.getMaestra() != plantilla2.getMaestra()) {
        return false;
    }

    if (plantilla1.getPlantillaMaestra() &&
        !Dnv.helpers.sonPlantillasEquivalentes(plantilla1.getPlantillaMaestra(), plantilla2.getPlantillaMaestra(), idioma1, idioma2)) {
        return false;
    }

    // TODO: Habria que obtener las capas en base al idioma
    var capas1 = plantilla1.getCapas();
    var capas2 = plantilla2.getCapas();

    if (capas1.length != capas2.length) return false;



    for (var i = 0; i < capas1.length; i++) {
        var capa1 = capas1[i];
        var capa2 = capas2[i];
        if (capa1.getCodigo() != capa2.getCodigo() ||
            capa1.getTipoCapa() != capa2.getTipoCapa() ||
            capa1.getPosX() != capa2.getPosX() || capa1.getPosY() != capa2.getPosY() ||
            capa1.getZIndex() != capa2.getZIndex() || capa1.getAncho() != capa2.getAncho() ||
            capa1.getAlto() != capa2.getAlto() ||
            capa1.isAuditable() != capa2.isAuditable()) {
            return false;
        }

        if (JSON.stringify(capa1.getMetadatos()) !== JSON.stringify(capa2.getMetadatos())) {
            return false;
        }
        var recurso1 = capa1.getRecurso();
        var recurso2 = capa2.getRecurso();
        if (recurso1 && recurso2) {
            if (recurso1.getCodigo() !== recurso2.getCodigo()) return false;
            if (recurso1.getLocalUrl() !== recurso2.getLocalUrl()) return false; //comparamos LocalUrl porque el nombre viene del infohash.
            if (JSON.stringify(recurso1.getMetadatos()) !== JSON.stringify(recurso2.getMetadatos())) {
                return false;
            }
        } else if (!recurso1 && !recurso2) {

        } else {
            return false;
        }

        var recursoHtml1 = capa1.getRecursoHtml5();
        var recursoHtml2 = capa2.getRecursoHtml5();
        if (recursoHtml1 && recursoHtml2) {
            if (recursoHtml1.getCodigo() != recursoHtml2.getCodigo()) return false;

            if (JSON.stringify(recursoHtml1.getMetadatos()) !== JSON.stringify(recursoHtml2.getMetadatos())) {
                return false;
            }
        } else if (!recursoHtml1 && !recursoHtml2) {

        } else {
            return false;
        }

        if (capa1.getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_TEXTO && capa1.getRecurso().getTexto(idioma1) != capa2.getRecurso().getTexto(idioma2)) {
            return false;
        }
        if (capa1.getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_STREAMING) {
            if (capa1.getRecurso().getUrlStreaming() != capa2.getRecurso().getUrlStreaming() ||
                capa1.getRecurso().getMimeType() != capa2.getRecurso().getMimeType()) {

                return false;
            } else if (Main.info.engine === "electron" && Main.getDivCustomVideoPlayerStreaming && !Main.getDivCustomVideoPlayerStreaming(capa1.getRecurso().getUrl(), capa1.getRecurso().getTipoStreaming()).isFFPlayOpened()) {
                return false;
            }
        }
        if (capa1.getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_URL && capa1.getRecurso().getUrl() != capa2.getUrl()) {
            return false;
        }
        return true;

    }
}
Dnv.helpers.debeHacerSmoothPlay = function _debeHacerSmoothPlay(slide1, slide2) {
    if (!Dnv.cfg.getCfgBoolean("SmoothPlayMode", true)) {
        return false;
    }
    // TODO: if (si uno de los dos es insercion) { return false; }

    if (!slide1 || !slide2) {
        return false;
    }
    if (slide1.HasHuecoPublicitario()) { //Es una insercion con lo cual no hacemos smoothplay.
        return false;
    }
    if (slide1.getPlantilla().isAlternada() || slide2.getPlantilla().isAlternada()) {
        // Si hay secuencias alternadas debemos avanzar para que se vean el resto de contenidos
        return false;
    }

    // Usamos la playlist original con la que se cargó la plantilla que está en pantalla.

    var playlist1 = slide1.getPlantilla().getPlaylist();
    var playlist2 = slide2.getPlantilla().getPlaylist();
    var idiomaSlide1 = playlist1.getPlayer().getSalida().getIdiomas()[Dnv.Pl.lastPlaylistIdiomaActual[slide1.getCodigo()]];
    var idiomaSlide2 = playlist2.getPlayer().getSalida().getIdiomas()[Dnv.Pl.lastPlaylistIdiomaActual[slide2.getCodigo()]];
    //if (slide1 == slide2) return true;
    //if ((slide1 == slide2) && ((Dnv.Pl.lastPlaylistIdiomaAnterior[slide1.getCodigo()] == Dnv.Pl.lastPlaylistIdiomaActual[slide2.getCodigo()]) && !slide2.getIsDefault())) {
    //if ((slide1 == slide2) && ((idiomaSlide1 == idiomaSlide2) && !slide2.getIsDefault())) {
    if ((slide1 == slide2) && (playlist2.getPlayer().getSalida().getIdiomas().length == 1)) {
        return true;
    }

    if (playlist2.getPlayer().getSalida().getIdiomas().length > 1) {
        /* 
         * Si se hace smoothplay, el contador de idioma no avanza, con lo que 
         * el player se queda congelado en una plantilla
         * Es un bug pendiente de corregir
         */
        return false;
    }

    /* 
     * Si son objetos distintos, puede que sea el mismo slide, 
     * pero al haberse recargado la playlist es un objeto distinto,
     * revisamos los contenidos
     */

    if (slide1.getCodigo() != slide2.getCodigo() ||
        slide1.getPlantilla().getCodigo() != slide2.getPlantilla().getCodigo() ||
        slide1.getPlantilla().getMaestra() != slide2.getPlantilla().getMaestra()) {
        return false;
    }

    // Comprobar si las plantillas (y sus maestras) son equivalentes

    if (!Dnv.helpers.sonPlantillasEquivalentes(slide1.getPlantilla(), slide2.getPlantilla(), idiomaSlide1, idiomaSlide2)) {
        return false;
    }
    var codPlantillaMaestra1 = Dnv.helpers.getMaestra(slide1);
    var codPlantillaMaestra2 = Dnv.helpers.getMaestra(slide2);
    var playlist1 = slide1.getPlantilla().getPlaylist();
    var playlist2 = slide2.getPlantilla().getPlaylist();
    var plantillaMaestra1 = playlist1.getPlantillaByVinculo(codPlantillaMaestra1);
    var plantillaMaestra2 = playlist2.getPlantillaByVinculo(codPlantillaMaestra2);
    if ((!!codPlantillaMaestra1) !== (!!codPlantillaMaestra2) || (plantillaMaestra1 && !Dnv.helpers.sonPlantillasEquivalentes(
        plantillaMaestra1, plantillaMaestra2, idiomaSlide1, idiomaSlide2))) {
        return false;
    }

    return true;



};


Dnv.controlCalendarios = (function() {
    var _intervalId = undefined;

    var _lastValueEncendido;
    var _lastValueBrillo;
    var _lastValueStream;

    function _getStreamActual(ignorarValorForzado) {
        var valorForzadoStream = Dnv.Pl.valoresForzados.getValorForzado(Dnv.Pl.valoresForzados.CODIGO_STREAMING);
        var valorStream = null;
        var pl = Dnv.Pl.lastPlaylist;
        if (!ignorarValorForzado && valorForzadoStream) {
            valorStream = { url: valorForzadoStream.url, mimeType: valorForzadoStream.mimeType, urlOriginal: valorForzadoStream.urlOriginal };
        } else if (pl) {
            var iptvHeader = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getMetadatos()['IPTV_HEADER'];
            if (iptvHeader) {
                /*
                 * FIXME: Lo suyo seria buscar el tipo MIME en la seccion streamings de la playlist
                 * O detectarlo en funcion de si es UDP, o HLS...
                 * 
                 * Originalmente este metadato solo lo usaban WGTs de webOS de balearia.
                 * Como esos WGTs no pueden funcionar en Tizen, lo implementamos aquí para que funcione igual.
                 */
                valorStream = { url: iptvHeader, mimeType: "video/mp2t", urlOriginal: iptvHeader };
            } else {
                var calendarioStreaming = pl.getPlayer().getSalida().getCalendarios()[Dnv.Calendarios.Cal.tipos.PROGRAMACION_STREAMING];
                if (calendarioStreaming) {
                    var valorCalendario = calendarioStreaming.getCurrentValue();
                    if (valorCalendario !== 0) {
                        var stream = pl.getStreams()[valorCalendario];
                        valorStream = { url: stream.getUrlStreaming(), mimeType: stream.getMimeType(), urlOriginal: stream.getUrlStreaming() };
                    } else {
                        valorStream = null;
                    }
                }
            }
        }
        return valorStream;
    }

    function _comprobarCalendarios() {
        // Obtener pantalla y mirar encendido
        var pl = Dnv.Pl.lastPlaylist;
        if (pl) {
            var player = pl.getPlayer();
            var salida = player.getSalida();
            var calendariosPlayer = player.getCalendarios();
            var calendariosSalida = salida.getCalendarios();
            var calendariosPantalla = salida.getPantalla().getCalendarios();

            var encendido = calendariosPantalla[Dnv.Calendarios.Cal.tipos.ENCENDIDO].getCurrentValue();

            if (_lastValueEncendido != encendido) {

                console.log("[MONITOR]: Nuevo valor encendido en calendario: " + ((encendido == 1) ? "ENCENDIDO " : "APAGADO").toString());
                Dnv.monitor.writeLogFile("[MONITOR]: Nuevo valor encendido en calendario: " + ((encendido == 1) ? "ENCENDIDO " : "APAGADO").toString());

                var msgForzado = (valorForzadoMonitor != -1) ? " FORZADO " : "";

                if (encendido == 1) {
                    Dnv.monitor.encenderPantalla();
                    Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.OK, "Monitor encendido" + msgForzado);
                    Dnv.presentador.continuarPresentacion();
                } else {
                    Dnv.monitor.apagarPantalla();

                    Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.OK_OFF, "Monitor apagado" + msgForzado);
                    Dnv.presentador.pausarPresentacionPorApagado();
                    var salidaCodigo = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo();
                    //var salidaCodigo = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo();
                    //Dnv.servidor.setNowShowingPubliStreaming(salidaCodigo, 0, 0, 0, 0, 0, 0, 0, Dnv.utiles.formatearFechaWCF(new Date(), false), 0, null);
                    Dnv.engine_helpers.enviarNowShowing(pl, null);
                    Dnv.audiencia.resetCampaign();
                }
            }

            _lastValueEncendido = encendido;

            var codCanalProgramado = parseInt(calendariosSalida[Dnv.Calendarios.Cal.tipos.CANAL].getCurrentValue());
            var canalActual = Dnv.secuenciador.getCanalActual();
            if (Dnv.secuenciador.getCanalAgrupadoActual()) {
                canalActual = Dnv.secuenciador.getCanalAgrupadoActual();
            }
            if (!Dnv.controlInteractividad.isInInteractivo() && canalActual && canalActual.getCodigo() !== codCanalProgramado) {
                console.warn("Estabamos en el canal " + canalActual.getCodigo() + " pero el programado es " + codCanalProgramado + ", avanzamos Slide");
                Dnv.presentador.avanzarSlideDirectamente();
            }



            //Dnv.monitor.setVolumen(0);
            var volumen = parseInt(calendariosPlayer[Dnv.Calendarios.Cal.tipos.VOLUMEN].getCurrentValue());
            var boost = Dnv.Pl.valoresForzados.getValorForzado(Dnv.Pl.valoresForzados.CODIGO_AUDIO_BOOST);;
            if (boost === undefined) boost = player.getMetadatos()['AudioBoost'];
            //console.log("El volumen es: " + volumen + " boost " + boost);
            if (boost !== undefined && !isNaN(boost)) {
                volumen = volumen * (parseInt(boost) / 100);
            }
            if (volumen > 100) {
                volumen = 100;
            } else if (volumen < 0) {
                volumen = 0;
            }
            Dnv.monitor.setVolumen(volumen);


            if (Dnv.monitor.setBrillo) {
                //Dnv.monitor.setBrillo(0);
                var brillo = parseInt(calendariosPantalla[Dnv.Calendarios.Cal.tipos.BRILLO].getCurrentValue());
                if (_lastValueBrillo != brillo) {
                    if (brillo == -1) {
                        console.log("[MONITOR]: Nuevo valor brillo en calendario: 100 (-1)");
                        Dnv.monitor.writeLogFile("[MONITOR]: Nuevo valor brillo en calendario: 100 (-1)");
                        Dnv.monitor.setBrillo(100);
                    } else {
                        console.log("[MONITOR]: Nuevo valor brillo en calendario: " + brillo.toString());
                        Dnv.monitor.writeLogFile("[MONITOR]: Nuevo valor brillo en calendario: " + brillo.toString());
                        Dnv.monitor.setBrillo(brillo);
                    }

                }
                _lastValueBrillo = brillo;
            }

            Dnv.monitor.setVolumen(volumen);

            var valorStream = _getStreamActual();

            if (valorStream && (!_lastValueStream || (_lastValueStream.url !== valorStream.url || _lastValueStream.mimeType !== valorStream.mimeType))) {
                _lastValueStream = valorStream;
                window.dispatchEvent(new CustomEvent(Dnv.Pl.valoresForzados.CAMBIO_STREAM_EVENT, { 'detail': valorStream }));
            } else if (!valorStream && _lastValueStream) {
                _lastValueStream = undefined;
                window.dispatchEvent(new CustomEvent(Dnv.Pl.valoresForzados.RESET_STREAM_EVENT, { 'detail': {} }));
            }
        }
    }

    return {
        comenzar: function() {
            if (!_intervalId) {
                _intervalId = setInterval(_comprobarCalendarios, 10 * 1000); // Cada 10 seg
            }
        },
        detener: function() {
            if (_intervalId) clearInterval(_intervalId);
            _intervalId = null;
        },
        lastValue: function(value) {
            _lastValueEncendido = value;
        },
        // valor es undefined si se borra
        onValorForzadoModificado: function(tipoCalendario, valor) {
            if (_intervalId) _comprobarCalendarios();
        },
        getStreamActual: _getStreamActual
    };
})();

Dnv.engine_helpers = (function() {
    return {
        // TODO: Unificar con NowShowingPubli
        enviarNowShowing: function enviarNowShowing(pl, slide) {
            Dnv.engine_helpers.enviarNowShowingStreaming(pl, slide, null, false);
        },
        // Ya calcula datos de publicidad
        enviarNowShowingStreaming: function enviarNowShowingStreaming(pl, slide, stream, ignorarValorForzado) {
            if (!pl) pl = Dnv.Pl.lastPlaylist;
            if (!pl) {
                console.info("[NOW_SHOWING] Aun no hay playlist");
                return;
            }

            if (!slide) slide = Dnv.secuenciador.getSlideActual();

            var salida = pl.getPlayer().getSalida();
            var calendario = 0;
            if (salida.getCalendarios()[Dnv.Calendarios.Cal.tipos.CANAL]) {
                // Los codigos son siempre 0 en la playlist!
                calendario = salida.getCalendarios()[Dnv.Calendarios.Cal.tipos.CANAL].getCodigo();
            }
            if (!stream) {
                var datosStream = Dnv.controlCalendarios.getStreamActual(ignorarValorForzado);
                if (datosStream === null) {
                    if (slide) {
                        var capas = slide.getPlantilla().getCapas(slide.getCodigo());
                        for (var i = 0; i < capas.length; i++) {
                            if (capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_STREAMING) {
                                stream = capas[i].getRecurso().getUrlStreaming();
                            }
                        }
                    }
                } else {
                    stream = datosStream.urlOriginal || datosStream.url;
                }
            } else if (stream.urlOriginal !== undefined || stream.url !== undefined) {
                stream = stream.urlOriginal || stream.url;
            }
            if (stream == null) {
                /*
                 * En Balearia, con el WGT de streaming, se usan estos metadatos
                 * Asumimos que este player es solo de streaming,
                 * pero habria que controlaar si ese WGT o la capa de streaming está o no en pantalla
                 * 
                 */
                stream = salida.getMetadatos()['streaming'];
                if (!stream) stream = salida.getMetadatos()['IPTV_HEADER'];
            }
            if (!slide) {
                // Dnv.servidor.setNowShowingStreaming(salida.getCodigo(), calendario, 0, 0, 0, Dnv.utiles.formatearFechaWCF(new Date(), false), stream);
                Dnv.servidor.setNowShowingPubliStreaming(salida.getCodigo(), calendario, 0, 0, 0, 0, 0, 0, Dnv.utiles.formatearFechaWCF(new Date(), false), "",stream);
                //Dnv.engine_helpers.enviarNowShowing(pl, null);
            } else {

                // NOW-SHOWING
                var extraInfo = new Object();

                extraInfo.IP = Dnv.deviceInfo.ip();

                if (Dnv.sincronizacion) {
                    if (Dnv.sincronizacion.isMaestro()) {
                        extraInfo.Maestro = "true";
                        extraInfo.NumeroNodos = Dnv.sincronizacion.getNumNodosConectados();
                    } else if (Dnv.sincronizacion.isEsclavo()) {
                        extraInfo.Maestro = "false";
                        extraInfo.IPMaestro = Dnv.sincronizacion.getIPServidor();
                    }
                }

                var insercion = slide.getInsercionActual();

                var codCampana = insercion ? insercion.getCampanya() : 0;
                var codInsercion = insercion ? insercion.getCodigo() : 0;
                /* 
                 * La implementacion original es insercion.getRecurso().getCodigo(), 
                 * pero en teoria getRecurso devuelve el codigo,
                 * y una insercion puede que no tenga un recurso, sino una plantilla
                 */
                var codRecursoInsercion = 0;//insercion ? insercion.getRecurso().getCodigo() : 0;
                if (insercion) {
                    extraInfo.Duracion = insercion.getDuracion().toString() + " s";
                    if (insercion.getRecurso().getCodigo) {
                        codRecursoInsercion = insercion.getRecurso().getCodigo();
                    } else {
                        codRecursoInsercion = insercion.getRecurso();
                    }
                } else {
                    extraInfo.Duracion = slide.getDuracion().toString() + " s";
                    codRecursoInsercion = 0;
                }
                Dnv.servidor.setNowShowingPubliStreaming(
                    salida.getCodigo(), calendario, slide.getCanal().getCodigo(), slide.getCodigo(),
                    codCampana, codInsercion, codRecursoInsercion,
                    slide.getPlantilla().getCodigo(), Dnv.utiles.formatearFechaWCF(new Date(), false),
                    JSON.stringify(extraInfo),
                    stream);
            }
        }
    }
})();

// INSERCIONES
var contadorInserciones = 0;
var lastCampanya = 0;
//

Dnv.secuenciador = (function(codigo, filename, hashcode, vinculo) {

    var indice = -1;

    // canales agrupados
    var timeInicioCanalAgrupado;
    var indiceCanal = -1;
    var indiceCanalAgrupado = [];
    var pasesAgrupado = [];
    var pasesIntentosAgrupado = [];
    var pasesTotalesAgrupado = [];
    //

    var slideActual = undefined;
    var canalActual = undefined;
    var canalAgrupadoActual = undefined;
    var codigoPlantillaMaestraActual = 0;
    var cabeceraReproducida = false;

    var currentMaestra;

    function _resetearEstadoCanal() {
        indice = -1;
        cabeceraReproducida = false;
    }
    function _resetearEstado() {
        
        timeInicioCanalAgrupado = undefined;
        indiceCanal = -1;
        indiceCanalAgrupado = [];
        pasesAgrupado = [];
        pasesIntentosAgrupado = [];
        pasesTotalesAgrupado = [];

        slideActual = undefined;
        canalActual = undefined;
        canalAgrupadoActual = undefined;
        codigoPlantillaMaestraActual = 0;
        cabeceraReproducida = false;

        currentMaestra = undefined;
    }


    function _getNextSlideInteractivo() {

        console.log("SECUENCIADOR: Buscando siguiente slide interactivo");
        var pl = Dnv.Pl.lastPlaylist;
        if (!pl) {
            console.error("SECUENCIADOR: No hay playlist");
            return null;
        }
        var canal = pl.getPlayer().getSalida().getCanalInteractivo();

        if (!canal) {
            console.error("SECUENCIADOR: No hay canal");
            return null;
        }
        console.log("SECUENCIADOR: El canal interactivo actual es " + canal.getCodigo());
        if (canal.getSlides().length > 0) { // Canal vacio

            var slide = canal.getSlides()[0];
            if (slide.isDisponible() && slide.isVigente()) {
                console.info("SECUENCIADOR: Slide interactivo " + slide.getCodigo() + " disponible");
                //slideActual = slide;
                return slide;
            } else {
                console.info("SECUENCIADOR: Slide interactivo " + slide.getCodigo() + " " + slide.getDenominacion() + " no disponible");
            }
        } else {
            console.warn("SECUENCIADOR: No hay slides interactivos disponibles. El canal está vacio ¿resolución incorrecta?");
        }

        //slideActual = null;
        return null;
    }
    /*
     * forzarDiferenteMaestra: Devolver un slide con diferente maestra, o null
     * finalizarGapless: Devolver un slide que no sea parte de una serie de videos gapless, o null
     * mismoSlide: Devuelve el mismo slide en el que estamos si cumple las condiciones, o null
     */
    function _getNextSlide(forzarDiferenteMaestra, finalizarGapless, peekCiclo, mismoSlide, peek) {

        //debugger;
        console.log("SECUENCIADOR: Buscando siguiente slide");
        var pl = Dnv.Pl.lastPlaylist;
        if (!pl) {
            console.error("SECUENCIADOR: No hay playlist");
            return null;
        }
        var canal = pl.getPlayer().getSalida().getCanal();

        if (!canal) {
            console.error("SECUENCIADOR: No hay canal");
            Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "El canal no está en la playlist");
            return null;
        }

        var inAgrupado = false;
        var tipoAgrupado;
        var canalAgrupado;
        var numCanalesAgrupado = canal.getCanalesAgrupados().length;
        var pases = 0;
        var pasesIntentos = 0;
        var canales = pl.getPlayer().getSalida().getCanales();
        var salida = pl.getPlayer().getSalida();
        var canalCorrespondiente;
        var duracionMaxima;

        console.log("SECUENCIADOR: El canal actual es " + canal.getCodigo());

        duracionMaxima = canal.getDuracionMax() + (canal.getDuracionMax() * (canal.getMargenMax() / 100));
        // en segundos
        if (duracionMaxima == 0 || duracionMaxima < 60) duracionMaxima = 9999999;

        if (canal.getDuracionMax() < 60 && canal.getDuracionMax() > 0 && pasesAgrupado[indiceCanal] > canal.getDuracionMax()) {

            pasesAgrupado[indiceCanal] = undefined;
            pasesIntentosAgrupado[indiceCanal] = undefined;
            indiceCanal++;
        }


        if (timeInicioCanalAgrupado && duracionMaxima && !((new Date().getTime() - timeInicioCanalAgrupado) < duracionMaxima * 1000)) {
            if (!peek) console.log("SECUENCIADOR [AGRUPADO]: Alcanzada duración máxima del canal. Se reinicia el canal");
            //if (salida.isAllCampanyasVistas()) salida.setInsercionesNoVistas();
            if (!peek) timeInicioCanalAgrupado = null;
            salida.resetLoopInserciones();
            indiceCanal = -1;
            pasesAgrupado = [];
            pasesIntentosAgrupado = [];
        }

        /**
        if (salida.getInserciones().length != 0 && salida.getInsercionesPrioritariasNoVistas().length == 0 &&
        salida.getInsercionesNormalesNoVistas().length == 0 && salida.getInsercionesRelleno() == 0) {
        if (!peek) console.log("[INSERCIONES] No hay inserciones NO vistas, se marcan todas como NO vistas");
        if (!peek) timeInicioCanalAgrupado = null;
        // Se han visto todas las inserciones, se marcan todas como no vistas
        salida.setInsercionesNoVistas();
        salida.resetCountInsercionLoop();
        indiceCanal = -1;
        pasesAgrupado = [];
        pasesIntentosAgrupado = [];
        }
        **/

        // canales agrupados

        // busca a que canal de los que conforman el agrupado tenemos que ir
        function searchCanalAgrupado() {

            if (indiceCanal < 0 && !peek) timeInicioCanalAgrupado = new Date().getTime();

            // miramos a ver que canal los toca
            switch (parseInt(tipoAgrupado)) {

                // en los agrupados por pases, no tenemos que estar cambiando de canal en cada pase                                                                 
                case Dnv.Pl.Canal.tipo.AGRUPADO_PASES:
                    if (indiceCanal < 0 || indiceCanal >= canal.getCanalesAgrupados().length) {
                        indiceCanal = 0;
                    }

                    canalAgrupado = canal.getCanalesAgrupados()[indiceCanal];
                    canalCorrespondiente = canales[canalAgrupado.getCanalHijo()];

                    pases = pasesAgrupado[indiceCanal];
                    if (pases == undefined) pases = 0;
                    pasesIntentos = pasesIntentosAgrupado[indiceCanal];
                    if (pasesIntentos == undefined) pasesIntentos = 0;

                    // hemos agotado los pases correspondientes a ese canal (o intentos de buscar un slide disponible en el)
                    // y pasamos a otro canal
                    if (pases >= canalAgrupado.getPases() && !mismoSlide /**|| pasesIntentos >= canalCorrespondiente.getSlides().length**/) {
                        pasesAgrupado[indiceCanal] = undefined;
                        pasesIntentosAgrupado[indiceCanal] = undefined;
                        indiceCanal++;
                    }
                    break;
                case Dnv.Pl.Canal.tipo.AGRUPADO:
                    indiceCanal++;
                    break;
            }

            if (indiceCanal >= canal.getCanalesAgrupados().length) indiceCanal = 0;
            //if (indiceCanal == 0 && !peek) salida.resetCountInsercionLoop();

            // obtenemos los canales que nos tocan en este pase
            canalAgrupado = canal.getCanalesAgrupados()[indiceCanal];
            canalCorrespondiente = canales[canalAgrupado.getCanalHijo()];

            pases = pasesAgrupado[indiceCanal];
            if (pases == undefined) pases = 0;
            pasesIntentos = pasesIntentosAgrupado[indiceCanal];
            if (pasesIntentos == undefined) pasesIntentos = 0;

            // en el caso de agrupados por porcentajes cuando el maestro ya ha hecho todos los pases que tiene asignado
            // se reinicia la cuenta de pases
            if (pases >= canalAgrupado.getPases() && canalAgrupado.isMaestro() && tipoAgrupado == Dnv.Pl.Canal.tipo.AGRUPADO && !mismoSlide) {
                pasesAgrupado = [];
                //if (!peekCiclo) console.log("SECUENCIADOR [AGRUPADO]: Reiniciamos pases");
                searchCanalAgrupado();
                // cuando hemos alcanzado todos los pases asginados, vamos a buscar otro canal 
            } else if (pases >= canalAgrupado.getPases() && !mismoSlide) {
                searchCanalAgrupado();
                // cuando todavia no hemos alcanzado los pases asignados, devolvemos este canal, ya que es el que nos toca
            } else {
                //if (!peekCiclo) console.log("SECUENCIADOR [AGRUPADO]: El canal actual: '" + canal.getDenominacion() + "' es agrupado");
                canal = canalCorrespondiente;
            }

        }

        if (!timeInicioCanalAgrupado && !peek) timeInicioCanalAgrupado = new Date().getTime();
        /**
        duracionMaxima = canal.getDuracionMax() + (canal.getDuracionMax() * (canal.getMargenMax() / 100));
        // en segundos
        if (duracionMaxima == 0) duracionMaxima = 9999999;
        **/

        if (numCanalesAgrupado > 0) {
            inAgrupado = true;
            Dnv.secuenciador.setCanalAgrupadoActual(canal);
            tipoAgrupado = canal.getTipoAgrupacion();
            searchCanalAgrupado();
        } else {
            Dnv.secuenciador.setCanalAgrupadoActual(null);
        }

        function searchSlide(soloPrioritarias, firstTimeMismoSlide) {
            /**
            if (canal.getSlides().length == 0) {
            return null;
            }
            **/
            var indiceOriginal = (indice > -1 ? indice : canal.getSlides().length - 1);
            if (inAgrupado) {
                if (indiceCanalAgrupado[indiceCanal] == undefined) {
                    indiceCanalAgrupado[indiceCanal] = -1;
                }
                indiceOriginal = (indiceCanalAgrupado[indiceCanal] > -1 ? indiceCanalAgrupado[indiceCanal] : canal.getSlides().length - 1);
                indice = indiceCanalAgrupado[indiceCanal];
            }
            //var codPlantillaMaestraOriginal;
            if (slideActual) {
                //codPlantillaMaestraOriginal = Dnv.helpers.getMaestra(slideActual);
                var canalAct = canalActual;
                if (!canalAct) canalAct = slideActual.getCanal();
                if (canalAct.getCodigo() !== canal.getCodigo() && !inAgrupado) { // Hemos cambiado de canal
                    //indice = -1;
                    indiceOriginal = canal.getSlides().length - 1;
                    //cabeceraReproducida = false;
                    _resetearEstadoCanal();
                } else {
                    if (canal.getSlides()[indiceOriginal] && canal.getSlides()[indiceOriginal].getCodigo() !== slideActual.getCodigo()) {
                        // El slide ha desaparecido del canal o ha cambiado de posición!
                        for (var i = 0; i < canal.getSlides().length; i++) {
                            if (canal.getSlides()[i].getCodigo() === slideActual.getCodigo()) {
                                // El slide ha cambiado de posicion en el canal, avanzamos para devolver el slide siguiente
                                console.warn("[SECUENCIADOR] El slide actual ha cambiado de posicion de " + indiceOriginal + " a " + i);
                                indiceOriginal = i;
                                break;
                            }
                        }

                    }

                }

            } else {
                /*try {
                    codPlantillaMaestraOriginal = Dnv.helpers.getMaestra(canal.getSlides()[indiceOriginal]);
                } catch (e) {
                    codPlantillaMaestraOriginal = 0;
                }*/
                cabeceraReproducida = false;
            }

            //AMACHO SYNC

            var syncMaster = Dnv.sincronizacion.isMaestro();

            //var isLeft = pl.getPlayer().isLeft();
            //var isRight = pl.getPlayer().isRight();

            do {
                var seguirBuscando = false;
                if (firstTimeMismoSlide) {
                    console.log("SECUENCIADOR : Evaluamos el slide en el que estamos");
                    firstTimeMismoSlide = false;
                    seguirBuscando = true;
                } else {
                    indice++;
                }

                if (Dnv.sincronizacion.isConectado()) {
                    if (Dnv.sincronizacion.isMaestro()) {
                        if (indice >= canal.getSlides().length) {
                            indice = 0;
                        }
                    }
                } else {
                    if (indice >= canal.getSlides().length) {
                        indice = 0;
                    }
                }


                var paseAgrupado = function paseAgrupado() {
                    if (inAgrupado && !peekCiclo) {
                        pases++;
                        pasesIntentos++;
                        console.log("SECUENCIADOR [AGRUPADO]: Este pase corresponde al canal: " + canal.getDenominacion() + " (" + pases + "/" + canalAgrupado.getPases() + ")(" + canalAgrupado.getCanal() + ")");

                        indiceCanalAgrupado[indiceCanal] = indice;
                        pasesAgrupado[indiceCanal] = pases;
                        pasesTotalesAgrupado[indiceCanal] = canalAgrupado.getPases();
                        pasesIntentosAgrupado[indiceCanal] = pasesIntentos;
                    }
                }

                // se cuenta como un intento en la busqueda de slide dentro de un canal de los que conforman el agrupado
                // pero como no estaba disponible el slide, no se cuenta como pase
                var paseAgrupadoSinPase = function paseAgrupadoSinPase() {
                    if (inAgrupado && !peekCiclo) {
                        pasesIntentos++;
                        pasesIntentosAgrupado[indiceCanal] = pasesIntentos;
                    }
                }

                var slide = canal.getSlides()[indice];
                if (!slide) {
                    paseAgrupadoSinPase();
                    return null;
                }
                var codMaestra = 0;
                try {
                    var codMaestra = Dnv.helpers.getMaestra(slide);
                } catch (e) { }




                if (
                    // El (slide.isSincronizado() && slide.isCabecera()) es una ñapa para las cabeceras desde el tablet debido a que hay 2 cambios de plantilla, el del tablet y el de la sincronacion
                    (syncMaster || !slide.isSincronizado() || (slide.isSincronizado() && (!cabeceraReproducida && slide.isCabecera()))) &&
                    //((!isLeft && !isRight) || (isLeft && !slide.isRight()) || (isRight != slide.isLeft())) &&
                    (!cabeceraReproducida || !slide.isCabecera()) &&
                    (!forzarDiferenteMaestra || codigoPlantillaMaestraActual == 0 || codigoPlantillaMaestraActual != codMaestra) &&
                    (!finalizarGapless || (!slide.isGapless() || slide.isInicioGapless())) &&
                    slide.isDisponible() && slide.isVigente() && slide.isHabilitado() && Dnv.Variables.calcularCondiciones(slide, soloPrioritarias) /*&& slide.isValidSSP()*/) {
                    //slideActual = slide;


                    if (slide.isCabecera()) {
                        cabeceraReproducida = true;
                        console.info("SECUENCIADOR: Slide " + slide.getCodigo() + " disponible");
                        paseAgrupado();
                        return slide;
                    } else {
                        var modulo = slide.nextCiclo(peekCiclo) % slide.getCiclos();
                        if (slide.getCiclos() == 1) {
                            if (!peekCiclo) console.info("SECUENCIADOR: Slide " + slide.getCodigo() + " disponible");
                            paseAgrupado();
                            return slide;
                        } else if (modulo == 1) {
                            if (!peekCiclo) console.info("SECUENCIADOR: Slide " + slide.getCodigo() + " disponible ciclo (" + slide.getCiclo() + "%" + slide.getCiclos() + "=" + modulo + ")");
                            paseAgrupado();
                            return slide;
                        } else {
                            if (!peekCiclo) console.info("SECUENCIADOR: Slide " + slide.getCodigo() + " NO disponible porque no le corresponde este ciclo (" + slide.getCiclo() + "%" + slide.getCiclos() + "=" + modulo + ")");
                            paseAgrupadoSinPase();
                        }
                    }

                } else {
                    if (soloPrioritarias) {
                        console.log("SECUENCIADOR: Slide " + slide.getCodigo() + " " + slide.getDenominacion() + " no disponible con variables prioritarias");
                    } else {
                        console.log("SECUENCIADOR: Slide " + slide.getCodigo() + " " + slide.getDenominacion() + " no disponible");
                    }
                    if (!soloPrioritarias) paseAgrupadoSinPase();
                    if (canal.getSlides().length == 1) return null;
                }
            } while (indice !== indiceOriginal || seguirBuscando);
            return null;
        };

        function buscarSlide() {
            // si nos llama con el parametro "mismoSlide"
            // evaluamos el mismo slide en el que estamos
            var firstTimeMismoSlide = false;
            if (mismoSlide) firstTimeMismoSlide = true;

            // busqueda de slides que solo cumplan las condiciones prioritarias
            var slideSearch = searchSlide(true, firstTimeMismoSlide);
            if (slideSearch) {
                return slideSearch;
            }

            if (mismoSlide) firstTimeMismoSlide = true;
            // si no ha habido ninguna condicion prioritaria satisfecha
            // se busca que cumplan el resto
            slideSearch = searchSlide(false, firstTimeMismoSlide);
            if (slideSearch) {
                return slideSearch;
            }

            /**
            if (inAgrupado) {
            if (!peek) timeInicioCanalAgrupado = null;
            //var salida = Dnv.Pl.lastPlaylist.getPlayer().getSalida();
            //if (salida.isAllCampanyasVistas()) salida.setInsercionesNoVistas();
            indiceCanal = -1;
            //indiceCanalAgrupado = [];
            pasesAgrupado = [];
            pasesIntentosAgrupado = [];
            pasesTotalesAgrupado = [];
            }
            **/

            return null
        }

        var slide = buscarSlide();
        if (slide) {
            return slide;
        } else {
            if (inAgrupado) {
                // si estamos en un canal agrupado y el canal que nos toca el pase no tiene ningun slide dispoible
                // miramos en el resto de canales que conforman el agrupado
                var numIntentos = 1;
                while (numIntentos < numCanalesAgrupado) {
                    canal = pl.getPlayer().getSalida().getCanal();
                    indiceCanal++;
                    searchCanalAgrupado();
                    slide = buscarSlide();
                    if (slide) return slide;
                    numIntentos++;
                }
                console.log("SECUENCIADOR [AGRUPADO]: Reiniciamos agrupado porque no hay mas slides disponibles");

                pasesAgrupado = [];
                pasesIntentosAgrupado = [];
                indiceCanal = -1;

                salida.resetLoopInserciones();

                //searchCanalAgrupado();

                return buscarSlide();
            }
            if (Dnv.sincronizacion.isConectado()) {
                if (Dnv.sincronizacion.isMaestro()) console.warn("SECUENCIADOR: No hay slides disponibles");
            } else {
                console.warn("SECUENCIADOR: No hay slides disponibles");
            }
            return null;
        }
    };


    return {
        resetearEstado: function () {
            _resetearEstado();
        },
        reiniciarCanal: function (value) {
            _resetearEstadoCanal();
        },
        setSlideActual: function(value) {
            if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isEsclavo() && !value) return;
            slideActual = value;
            window.dispatchEvent(new CustomEvent(Dnv.NEW_SLIDE_SHOWN_EVENT, { detail: { slide: value } }));
        },
        setCanalAgrupadoActual: function(value) {
            canalAgrupadoActual = value;
        },
        getCanalAgrupadoActual: function() {
            return canalAgrupadoActual
        },
        setCanalActual: function(value) {
            canalActual = value;
        },
        setCodigoPlantillaMaestraActual: function(value) {
            codigoPlantillaMaestraActual = value;
        },
        getNextSlide: function(forzarDiferenteMaestra, finalizarGapless, peekCiclo, mismoSlide, peek) {
            // Ponemos valores por defecto
            forzarDiferenteMaestra = forzarDiferenteMaestra || false;
            finalizarGapless = finalizarGapless || false;
            peekCiclo = peekCiclo || false;
            mismoSlide = mismoSlide || false;
            peek = peek || false;

            return _getNextSlide(forzarDiferenteMaestra, finalizarGapless, peekCiclo, mismoSlide, peek);
        },
        getNextSlideConDiferenteMaestra: function() {
            return _getNextSlide(true);
        },
        peekNextSlide: function(mismoSlide) { // Obtener el siguiente slide, sin avanzar el contador
            var oldIndice = indice;
            var oldIndiceCanal = indiceCanal;
            var oldPasesAgrupados = pasesAgrupado[indiceCanal];
            var oldPasesIntentosAgrupados = pasesIntentosAgrupado[indiceCanal];
            if (indiceCanalAgrupado[indiceCanal]) oldIndice = indiceCanalAgrupado[indiceCanal];
            var oldCabeceraReproducida = cabeceraReproducida;
            //var oldInsercionesVistas = Dnv.Pl.insercionesVistas.slice();
            var oldCanalAgrupadoActual = canalAgrupadoActual;
            var nextSlide = this.getNextSlide(null, null, true, mismoSlide, true);
            cabeceraReproducida = oldCabeceraReproducida;
            indice = oldIndice;
            if (indiceCanalAgrupado[oldIndiceCanal]) indiceCanalAgrupado[oldIndiceCanal] = oldIndice;
            pasesAgrupado[oldIndiceCanal] = oldPasesAgrupados;
            pasesIntentosAgrupado[oldIndiceCanal] = oldPasesIntentosAgrupados;
            indiceCanal = oldIndiceCanal;
            //Dnv.Pl.insercionesVistas = oldInsercionesVistas;

            canalAgrupadoActual = oldCanalAgrupadoActual;
            return nextSlide;
        },
        nextCiclo: function() { // Obtener el siguiente slide, sin avanzar el contador, pero avanzando ciclo
            var oldIndice = indice;
            var oldIndiceCanal = indiceCanal;
            var oldPasesAgrupados = pasesAgrupado[indiceCanal];
            var oldPasesIntentosAgrupados = pasesIntentosAgrupado[indiceCanal];
            if (indiceCanalAgrupado[indiceCanal]) oldIndice = indiceCanalAgrupado[indiceCanal];
            var oldCabeceraReproducida = cabeceraReproducida;
            var nextSlide = this.getNextSlide();
            cabeceraReproducida = oldCabeceraReproducida;
            indice = oldIndice;
            if (indiceCanalAgrupado[oldIndiceCanal]) indiceCanalAgrupado[oldIndiceCanal] = oldIndice;
            pasesAgrupado[oldIndiceCanal] = oldPasesAgrupados;
            pasesIntentosAgrupado[oldIndiceCanal] = oldPasesIntentosAgrupados;
            indiceCanal = oldIndiceCanal;

            return nextSlide;
        },

        getSlideActual: function() {
            return slideActual;
        },
        getCanalActual: function() {
            return canalActual;
        },
        getCodigoPlantillaMaestraActual: function() {
            return codigoPlantillaMaestraActual;
        },

        getPaseActual: function() {
            if (!pasesAgrupado[indiceCanal]) return "-";
            return pasesAgrupado[indiceCanal];
        },
        getPasesTotales: function() {
            if (!pasesTotalesAgrupado[indiceCanal]) return "-";
            return pasesTotalesAgrupado[indiceCanal];
        },

        getNextSlideInteractivo: function() {

            return _getNextSlideInteractivo();
        },
        resetCanalesAgrupados: function() {
            timeInicioCanalAgrupado = null;
            indiceCanal = -1;
            indiceCanalAgrupado = [];
            pasesAgrupado = [];
            pasesIntentosAgrupado = [];
            pasesTotalesAgrupado = [];
        },
        resetLoopAgrupado: function() {
            timeInicioCanalAgrupado = null;
            indiceCanal = -1;
            pasesAgrupado = [];
            pasesIntentosAgrupado = [];
        },
        getSlideSincronizado: function(codSincronizacion) {
            var slide = null;
            console.log("SECUENCIADOR: Buscando slide sincronizado " + codSincronizacion);

            var pl = Dnv.Pl.lastPlaylist;

            // Miramos primero en el canal actual
            var player = pl.getPlayer();
            var isLeft = player.isLeft();
            var isRight = player.isRight();


            var canal = player.getSalida().getCanal();
            var numCanalesAgrupado = canal.getCanalesAgrupados().length;

            if (numCanalesAgrupado > 0) {
                var canales = pl.getCanales();
                for (var i = 0; i < numCanalesAgrupado; i++) {
                    var canalAgrupado = canal.getCanalesAgrupados()[i];
                    var canalDelAgrupado = canales[canalAgrupado.getCanalHijo()];
                    var slides = canalDelAgrupado.getSlides();
                    for (var j = 0; j < slides.length; j++) {
                        if (slides[j].getCodSincronizacion() == codSincronizacion && slides[j].isDisponible()) {
                            return slides[j];
                        }
                    }
                }
                return null;
            } else {
                var slides = canal.getSlides();
                for (var i = 0; i < slides.length; i++) {
                    if (slides[i].getCodSincronizacion() == codSincronizacion &&
                        ((!isLeft && !isRight) || (isLeft && !slides[i].isRight()) || (isRight != slides[i].isLeft()))) {
                        if (slides[i].isDisponible()) {
                            return slides[i];
                        } else {
                            return null;
                        }
                    }
                }

                // Miramos a ver si esta en el resto de canales
                var canales = pl.getCanales();
                for (var property in canales) {
                    if (canales.hasOwnProperty(property)) {
                        canal = canales[property];

                        var slides = canal.getSlides();
                        for (var j = 0; j < slides.length; j++) {
                            if (slides[j].getCodSincronizacion() == codSincronizacion &&
                                ((!isLeft && !isRight) || (isLeft && !slides[j].isRight()) || (isRight != slides[j].isLeft()))) {
                                if (slides[j].isDisponible()) {
                                    return slides[j];
                                } else {
                                    return null;
                                }
                            }
                        }
                    }
                }
            }

            return slide;
        }
    };
})();



Dnv.controlInteractividad = (function() {

    var timeoutId = null;
    var lastTouchTime = 0;

    var onEvento = function(evento) {
        lastTouchTime = new Date().getTime();
        if (Dnv.cfg.getCfgBoolean("InteractividadHabilitado", false)) {
            if (!Dnv.controlInteractividad.isInInteractivo()) {
                console.log("Pasando a interactivo")
                evento.preventDefault();
                Dnv.controlInteractividad.onPasoAInteractivo();
                try {
                    document.getElementsByTagName("iframe")[0].onload = function() {
                        document.getElementsByTagName("iframe")[0].contentWindow.document.onclick = onEvento;
                    };
                } catch (e) { }
            }
        }
    };

    function registrar() {
        // KeyDown se maneja con los keybindings
        //document/*.getElementById("wrappers")*/.addEventListener("keydown", onEvento, true);
        //document/*.getElementById("wrappers")*/.addEventListener("keyup", onEvento, true);
        //document/*.getElementById("wrappers")*/.addEventListener("keypress", onEvento, true);
        document /*.getElementById("wrappers")*/.addEventListener("click", onEvento, true);
        document /*.getElementById("wrappers")*/.addEventListener("dblclick", onEvento, true);
        //document/*.getElementById("wrappers")*/.addEventListener("mouseup", onEvento, true);
        //document/*.getElementById("wrappers")*/.addEventListener("mousedown", onEvento, true);
        //document/*.getElementById("wrappers")*/.addEventListener("ontouchstart", onEvento, true);
        //document/*.getElementById("wrappers")*/.addEventListener("ontouchstart", onEvento, true);
        //document/*.getElementById("wrappers")*/.addEventListener("ontouchmove", onEvento, true);
        //document/*.getElementById("wrappers")*/.addEventListener("ontouchcancel", onEvento, true);
    }
    if (document.readyState === "loading") {
        document.addEventListener('DOMContentLoaded', registrar);
    } else {
        registrar();
    }

    function onTimerInteractividad() {

        var timeout = Dnv.cfg.getCfgInt("InteractividadTimeOut", 120);
        if (timeoutId !== null) clearTimeout(timeoutId);
        var ahora = new Date().getTime();
        if (ahora < lastTouchTime + (timeout * 1000)) { // Reprogramamos el timer
            timeoutId = setTimeout(onTimerInteractividad, (timeout * 1000) - (ahora - lastTouchTime));
        } else {
            timeoutId = null;
            Dnv.controlInteractividad.onPasoANoInteractivo();
        }

    }

    return {
        onKeyDown: onEvento,
        isInInteractivo: function() {
            return timeoutId !== null;
        },
        isInInteractivoHTML5: function() {
            return Dnv.cfg.getCfgBoolean("InteractividadHTML5Habilitado", false);
        },
        deberiaSeguirEnInteractivo: function() {
            // Juguettos, true si hubo interacción del usuario en los últimos 5 segundos
            var ahora = new Date().getTime();
            var hayPresencia = (Dnv.sensors && Dnv.sensors.hayPresencia());
            return timeoutId !== null && ((ahora < lastTouchTime + (5 * 1000)) || hayPresencia);
        },
        /*onInteraccionRecibida: function () { 
        }, */
        onPasoAInteractivo: function() {
            console.log("[INTERACTIVIDAD] onPasoAInteractivo");
            lastTouchTime = new Date().getTime();

            if (!Dnv.presentador.isReproduciendo()) return;

            if (timeoutId === null) { // No estamos en interactivo
                if (Dnv.cfg.getCfgBoolean("InteractividadHabilitado", false)) {
                    var timeout = Dnv.cfg.getCfgInt("InteractividadTimeOut", 120);
                    if (timeoutId !== null) clearTimeout(timeoutId);
                    timeoutId = setTimeout(onTimerInteractividad, timeout);
                }
                console.info("[INTERACTIVIDAD] Pasando a interactivo");
                Dnv._INTERACTIVO_SMOOTH = false;
                Dnv.presentador.avanzarSlideDirectamente();
            }
        },
        onPasoANoInteractivo: function() {

            console.log("[INTERACTIVIDAD] onPasoANoInteractivo");
            if (timeoutId !== null) {
                clearTimeout(timeoutId); // Por si llamamos antes de que salte el timeout
                timeoutId = null;
                console.info("[INTERACTIVIDAD] Saliendo de interactivo");
                Dnv._INTERACTIVO_SMOOTH = false;
                if (Dnv.presentador.isReproduciendo()) {
                    Dnv.presentador.avanzarSlideDirectamente();
                }
            }
        }
    };
})();
Dnv.presentador = (function() {

    var controller;
    //var timeoutAvanceSecuencia;
    var ipServidorTiempo;
    var puertoServidorTiempo;
    var contadorSync = 0;
    var id = 0;
    var preferirFlashAHtml5 = false;

    var isInBuscandoContenidos = false;

    var cachePlantillas = {};
    // TODO: Sistema para invalidar cache <- o aún mejor, precachear al parsear playlist, los flashes seguramente no sean cacheables

    var PROPORCIONES = {
        /**
         * Modo original en el que no se hacen escalados
         */
        ESCALADO_ORIGINAL: 0,
        /**
         * Modo en el que se escala hasta que el contenido llene horizontalmente
         * la pantalla. Pueden quedar bandas negras o contenido fuera de la pantalla
         * verticalmente
         */
        ESCALADO_PROPORCIONAL_HORIZONTAL: 1,
        /**
         * Modo en el que se escala hasta que el contenido llene verticalmente
         * la pantalla. Pueden quedar bandas negras o contenido fuera de la pantalla
         * horizontalmente
         */
        ESCALADO_PROPORCIONAL_VERTICAL: 2,
        /**
         * Modo en el que se escala, deformando la plantilla si es necesario.
         */
        ESCALADO_PANTALLA_COMPLETA: 3
    };

    //var posicionarWrapper = 
    function posicionarWrappers(anchoPantalla, altoPantalla, proporciones) {
        posicionarWrapper(document.getElementById('wrapper0'), anchoPantalla, altoPantalla, proporciones);
        posicionarWrapper(document.getElementById('wrapper1'), anchoPantalla, altoPantalla, proporciones);
        posicionarWrapper(document.getElementById('wrapperMaestro0'), anchoPantalla, altoPantalla, proporciones);
        posicionarWrapper(document.getElementById('wrapperMaestro1'), anchoPantalla, altoPantalla, proporciones);
    }

    function posicionarWrapper(wrapper, anchoPantalla, altoPantalla, proporciones) {

        var w = wrapper; //document.getElementById('wrapper');
        w.style.position = "absolute";
        w.style.top = 0;
        w.style.left = 0;
        //var ancho
        var anchoDisp = Dnv.deviceProperties.getWidth();
        var altoDisp = Dnv.deviceProperties.getHeight();
        console.log("" + altoDisp + "x" + altoDisp);
        console.log("before " + w.offsetWidth + "x" + w.offsetHeight);

        switch (proporciones) {
            case PROPORCIONES.ESCALADO_ORIGINAL:
                w.style.width = anchoPantalla + "px";
                w.style.height = altoPantalla + "px";
                /*if (Dnv.cfg.getInternalCfgString(Main._VERTICAL_CFG, Main._VERTICAL_CFG_HORIZONTAL) == Main._VERTICAL_CFG_VERTICAL) {
                    var padX = 0;
                    var padY = 0;
                } else {*/
                    //var padX = Math.round((anchoDisp - anchoPantalla) / 2);
                    //var padY = Math.round((altoDisp - altoPantalla) / 2);

                    // settings para fijar desde que punto de la pantalla se van a pintar los contenidos
                    // (leds...)
                    var padX = Dnv.cfg.getCfgInt("Salida_CoordenadaX", 0);
                    var padY = Dnv.cfg.getCfgInt("Salida_CoordenadaY", 0);

                    // funcionalidad de adaptabilidad de Deneva
                    var vpX = Dnv.cfg.getCfgInt("SalidaPantalla_ViewPortLeft", 0);
                    var vpY = Dnv.cfg.getCfgInt("SalidaPantalla_ViewPortTop", 0);
                    if (vpX != 0 || vpY != 0) {
                        padX -= vpX;
                        padY -= vpY;
                    }
                //}
                w.style.margin = padY + "px " + padX + "px";
                console.log("resize " + alto + " " + padY + " " + ancho + " " + padX);
                break;
            case PROPORCIONES.ESCALADO_PROPORCIONAL_HORIZONTAL:
                w.style.width = "100%";
                var alto = (altoPantalla * (anchoDisp / anchoPantalla));
                w.style.height = alto + "px";
                var pad = Math.round((altoDisp - alto) / 2);
                w.style.margin = pad + "px 0";
                console.log("resize " + alto + " " + pad);
                break;
            case PROPORCIONES.ESCALADO_PROPORCIONAL_VERTICAL:

                w.style.height = "100%";
                var ancho = (anchoPantalla * (altoDisp / altoPantalla));
                w.style.width = ancho + "px";
                var pad = Math.round((anchoDisp - ancho) / 2);
                w.style.margin = "0 " + pad + "px";
                console.log("resize " + ancho + " " + pad);
                break;
            case PROPORCIONES.ESCALADO_PANTALLA_COMPLETA:
                w.style.width = "100%";
                w.style.height = "100%";
                break;
            default:
                console.error("Modo de proporciones desconocido " + proporciones);
            //case
        }
        console.log("after " + w.offsetWidth + "x" + w.offsetHeight);
        /*
        w.style.width = "100%";
        //w.style.height = (window.innerHeight*(1280/window.innerWidth))+"px";
        var alto = (720*(window.innerWidth/1280));
        w.style.height = alto+"px";
            
        var pad = Math.floor(( window.innerHeight - alto ) / 2);
        //w.style.padding_top = "0 "+pad+"px";
        w.style.margin = pad+"px 0";
        //w.style.padding_top = pad+"px";
        //w.style.padding_bottom = pad+"px";
            
        console.log("resuze "+w.style.height+" "+pad);*/
    }

    // FIXME: usar datos reales, ejecutar cuando se haya parseado la playlist en lugar de en load
    function prepararPosicionado() {

        function posicionar() {
            var pl = Dnv.Pl.lastPlaylist;

            if (pl !== undefined) {
                var salida = pl.getPlayer().getSalida();

                posicionarWrappers(salida.getResolucion().getAncho(),
                    salida.getResolucion().getAlto(),
                    parseInt(salida.getMetadatos()["Proporciones"], 10));
            } else {

                posicionarWrappers(Dnv.deviceProperties.getWidth(), //window.innerWidth,
                    Dnv.deviceProperties.getHeight(), //window.innerHeight,
                    PROPORCIONES.ESCALADO_PANTALLA_COMPLETA);
                window.addEventListener('new_playlist', function() {
                    posicionar();
                });
            }
        }

        //posicionarWrapper(1280, 720, getProporciones());
        posicionar();
        //window.onresize = function() {
        window.addEventListener('resize', function() {
            //posicionarWrapper(1280, 720, getProporciones());
            posicionar();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener('DOMContentLoaded', prepararPosicionado);
    } else {
        prepararPosicionado();
    }


    //var getDimensionesCapa =
    function getDimensionesCapa(plantilla, capa, proporciones) {
        //if (proporciones === undefined) proporciones = BORRAME_MODO_PROPORC; //FIXME: BORRAME

        if (proporciones == PROPORCIONES.ESCALADO_ORIGINAL) { // No usamos porcentajes, por si acaso hay problemas de redondeo
            return {
                x: capa.getPosX() + "px",
                y: capa.getPosY() + "px",
                ancho: capa.getAncho() + "px",
                alto: capa.getAlto() + "px"
            }
        } else {
            return {
                x: (100 * capa.getPosX() / plantilla.getAncho()) + "%",
                y: (100 * capa.getPosY() / plantilla.getAlto()) + "%",
                ancho: (100 * capa.getAncho() / plantilla.getAncho()) + "%",
                alto: (100 * capa.getAlto() / plantilla.getAlto()) + "%"
            }
        }
    }

    function getDimensionesCapaWorkarroundWebOS(plantilla, capa, proporciones) {
        //if (proporciones === undefined) proporciones = BORRAME_MODO_PROPORC; //FIXME: BORRAME

        if (proporciones == PROPORCIONES.ESCALADO_ORIGINAL) { // No usamos porcentajes, por si acaso hay problemas de redondeo
            var dimensionar = function dimensionar(x, y, w, h) {
                /*var rect = div.getBoundingClientRect();
                if (rect.top === 0 && rect.left === 0 && rect.right === 0 && rect.bottom === 0 && rect.width === 0 && rect.height === 0) {
                // El div aun no está posicionado... reintentamos despues
                setTimeout(dimensionar, 100);
                return;
                }*/

                /*
                 * En modo vertical hay un cambio de ejes (las X son las Y y las Y son las X)
                 * y el punto base de posicionado es el de la esquina superior derecha.
                 * http://www.samsungdforum.com/B2B/Guide/tut20009/index.html
                 * Para videoPlayer.Execute("SetDisplayArea", x, y, w, h, 1080); // El ultimo parametro siempre es 1080
                 * (y, x) son las coordenadas de la esquina superior *derecha*
                 * y es el eje de abcisas (horizontal) que comienza desde el borde *derecho*
                 * x es el eje de ordenadas (vertical) que comienza desde el borde superior
                 *
                 * Para mostrar un video de 480x320 a 100px del borde superior y pegado al borde izquierdo, se usaria:
                 * videoPlayer.Execute("SetDisplayArea", 100, (1080 - 480), 320, 480, 1080); // El ultimo parametro siempre es 1080
                 * 
                 */
                /*var x = rect.top;
                var y = (document.documentElement.clientWidth - rect.right);
                var w = rect.height;
                var h = rect.width;*/

                /*
                 * Si a SetDisplayArea le damos coordenadas fuera de pantalla,
                 * muestra el video a pantalla completa, por lo que tendremos que recortar
                 * el video mostrado.
                 * El problema es que el recorte es en base a la resolucion original del
                 * video, y esa no la podemos consultar hasta que ha saltado el evento
                 * OnStreamInfoReady
                 */


                var docAncho = Dnv.deviceProperties.getWidth();
                var docAlto = Dnv.deviceProperties.getHeight();

                var rect = { left: x, top: y, width: w, height: h, bottom: (docAlto - y - h), right: (docAncho - w - x) };

                // 0, 1053 1080x6??
                /*x = (document.documentElement.clientHeight - rect.right)rect.top;
                y = (document.documentElement.clientWidth - rect.right);
                w = rect.height;
                h = rect.width;*/

                var doCrop = false;
                var cropX = 0;
                var cropY = 0;
                var cropW = rect.width;
                var cropH = rect.height;
                /*
                if (rect.left < 0) {
                doCrop = true;
                cropX = -rect.left;
                cropW = rect.width - cropX;
                y = docAncho - cropW; // El borde izquierdo de la pantalla vertical
                h = cropW;
                }
                if (rect.top < 0) {
                doCrop = true;
                cropY = -rect.top;
                cropH = rect.height - cropY;
                x = 0; // El borde superior de la pantalla vertical
                w = cropH;
                }
                if (rect.right > docAncho) {
                doCrop = true;
                cropW = cropW - (rect.right - docAncho);
                y = 0; // Esquina superior derecha, en el borde derecho
                h = cropW;
                }
                if (rect.bottom > docAlto) {
                doCrop = true;
                cropH = cropH - (rect.bottom - docAlto);
                w = cropH;
                }*/
                console.log("[WORKARROUND VERTICAL LG] " + JSON.stringify({ x: x, y: y, ancho: w, alto: h }));
                return { x: x + "px", y: y + "px", ancho: w + "px", alto: h + "px" };
            }

            return dimensionar(capa.getPosX(), capa.getPosY(), capa.getAncho(), capa.getAlto());
            return {
                x: capa.getPosX() + "px",
                y: capa.getPosY() + "px",
                ancho: capa.getAncho() + "px",
                alto: capa.getAlto() + "px"
            }
        } else {
            return {
                x: (100 * capa.getPosX() / plantilla.getAncho()) + "%",
                y: (100 * capa.getPosY() / plantilla.getAlto()) + "%",
                ancho: (100 * capa.getAncho() / plantilla.getAncho()) + "%",
                alto: (100 * capa.getAlto() / plantilla.getAlto()) + "%"
            }
        }
    }

    //var getIframeElement = function getRecursoSimpleElement(plantilla, capa, recurso, proporciones, onEndedCallback, onErrorCallback) {
    var getFlashVars = function getFlashVars(capa, playlist) {

        var flashvars = "";
        if (capa.getDataSource() != 0) {
            var datasourceUrl;
            if (Dnv.Cloud.isFileSystemAvailable() && Dnv.Cloud.downloader.getRutaDataSource) { // Miramos si el metodo esta definido. TODO, quitar en el futuro
                var ruta = Dnv.Cloud.downloader.getRutaDataSource(capa.getDataSource());
                //console.log(ruta);
                //console.log("fs available"+Dnv.Cloud.isFileSystemAvailable() +" ruta ds definido "+ Dnv.Cloud.downloader.getRutaDataSource);
                if (ruta !== null) {
                    //datasourceUrl = "file://"+ruta; // SAMSUNG
                    datasourceUrl = ruta; // LG
                    //datasourceUrl = ruta.substr(28); //FIXME!!!
                }
            }
            if (!datasourceUrl) datasourceUrl = capa.getDataSourceUrl();
            flashvars = "url=" + datasourceUrl + "&";
        }
        var metadatos = capa.getMetadatos();
        for (var key in metadatos) {
            flashvars += key + "=" + metadatos[key] + "&";
        }

        if (Dnv.cfg.getCfgInt("TransITProduct", 0) > 0) {
            flashvars += "RutaRecursos=" + Dnv.Cloud._RECURSOS_PATH + "&" + "RecursoNombreInfoHash=1&";
        }

        if (metadatos && playlist) {

            var metadatosSalida = playlist.getPlayer().getSalida().getMetadatos();
            var anadirMetadato = function(key, keyMetadato) {
                if (!(key in metadatos)) { // usamos "in" porque suele estar vacio y evaluarlo es false
                    if (keyMetadato in metadatosSalida) flashvars += key + "=" + metadatosSalida[keyMetadato] + "&";
                }
            }
            anadirMetadato("Salas", "Salas"); // TIPO_DIRECTORIO
            anadirMetadato("Sensores", "Sensores"); // TIPO_TEMPERATURAS
            anadirMetadato("Provincia", "Provincia"); // TIPO_METEREOLOGIA_INFOMAPA_ESPANA
            if (metadatosSalida["LocalizacionMeteo"]) anadirMetadato("DevProvincia", "LocalizacionMeteo"); // TIPO_METEREOLOGIA_INFOPROVINCIA
            else if (metadatosSalida["Provincia"]) anadirMetadato("DevProvincia", "Provincia"); // TIPO_METEREOLOGIA_INFOPROVINCIA
            anadirMetadato("Metrica", "Metrica"); // TIPO_TICKER_DE_METEOROLOGIA
            anadirMetadato("TextoSalida", "TextoSalida"); // TIPO_SMARTTAG
            // anadirMetadato("", ""); // TIPO_QCHANNEL
            //anadirMetadato("ObjIDSalida", "ObjIDSalida"); // TIPO_PRODUCTOS
            //anadirMetadato("", ""); // TIPO_TURNOS_AVANZADO
            anadirMetadato("NucleoPresentacion", "NucleoPresentacion"); // TIPO_INFO_RENFE
            anadirMetadato("LineaPresentacion", "LineaPresentacion"); // TIPO_INFO_RENFE
            anadirMetadato("IdEstacion", "IdEstacion"); // TIPO_TELEINDICADORES_RENFE
            anadirMetadato("TituloEstacion", "TituloEstacion"); // TIPO_TELEINDICADORES_RENFE
            anadirMetadato("SeccionTurnos", "SeccionTurnos"); // TURNOS_AVANZADO
            if (capa.getTipoSmartObject() == 509) {
                flashvars += "RutaXML=" + Dnv.turnos.getRuta() + "&";
            } else if (capa.getTipoSmartObject() == 542) {
                flashvars += "RutaXML=" + Dnv.turnos.getRutaAvanzado() + "&";
            }
            /* TODO: añadir soporte de  command anadirMetadato("", "");
            anadirMetadato("", "");
            anadirMetadato("", "");
            anadirMetadato("", "");*/

            if (metadatos["WebServiceURLMaster"] !== undefined) {
                flashvars += "WebServiceURLMaster=" + Dnv.cfg.getCfgString("WebServiceURLMaster") + "&";
            }

            flashvars += "ObjectID=" + playlist.getPlayer().getSalida().getCodigo() + "&ObjectId=" + playlist.getPlayer().getSalida().getCodigo() + "&ObjIDSalida=" + playlist.getPlayer().getSalida().getCodigo() + "&";

            if (metadatosSalida["smoIdiomas"]) {
                flashvars += "smoIdiomas=" + metadatosSalida["smoIdiomas"] + "&";
            }
            // FIXME: En multidioma habria que usar el idioma actual
            var lang = "EN";
            var idiomasSalida = metadatosSalida["Idiomas"].split(";");
            for (var i = 0; i < idiomasSalida.length; i++) {
                if (idiomasSalida[i] === "27") { // Español
                    lang = "ES";
                    break;
                } else if (idiomasSalida[i] === "25") { // Inglés
                    lang = "EN";
                    break;
                } else if (idiomasSalida[i] === "29") { // Euskera
                    lang = "EU";
                    break;
                } else if (idiomasSalida[i] === "17") { // Catalá
                    lang = "CA";
                    break;
                } else if (idiomasSalida[i] === "38") { // Gallego
                    lang = "GL";
                    break;
                } else if (idiomasSalida[i] === "157") { // Valenciano
                    lang = "es-VC";
                    break;
                } else if (idiomasSalida[i] === "34") { // Francés
                    lang = "FR";
                    break;
                }
            }
        }
        // El proxy solo se usa en modo de presentación 3, pero eso causaría que se usasen samples, etc
        //flashvars += "ProxyUrl=" + Dnv.CFG_PROXY_DATASOURCES + "&ModoPresentacion=5&LowPower=true&Lang=EN&editmode=0&";
        flashvars += "ProxyUrl=" + Dnv.CFG_PROXY_DATASOURCES + '&ModoPresentacion=5&LowPower=true&Lang=' + lang + '&editmode=0&';
        flashvars += "RelojMaestro=" + (capa.isRelojMaestro() ? 1 : 0) + "&";

        flashvars = flashvars.replace("#", "%23");

        if (flashvars.length > 0 && flashvars[flashvars.length - 1] === "&") {
            // Quitamos la & final
            flashvars = flashvars.substring(0, flashvars.length - 1);
        }
        //document.getElementById("data").textContent = flashvars.replace(/&/g, ' ');
        return flashvars;
    };

    /*
     * Registrar los elementos de streaming, para que si llega un comando remoto de forzar cambio
     * este se aplique inmediatamente (sin cambiar plantilla)
     */
    var _currentStreamingElement = undefined;
    var _currentStreamingDefaultData = undefined;
    var _currentStreamingElements = [];
    var onNewStreamingElement = function onNewStreamingElement(video, url, mimeType, urlOriginal) {
        console.log("onNewStreamingElement " + video + " url " + url);

        for (var i = 0; i < _currentStreamingElements.length; i++) {
            var element = _currentStreamingElements[i];
            if (element === undefined || !Dnv.helpers.inDom(element.video)) {
                _currentStreamingElements.splice(i, 1);
                i--;
            }
        }
        _currentStreamingElement = video;
        _currentStreamingDefaultData = { url: url, mimeType: mimeType };
        _currentStreamingElements.push({ video: video, url: url, mimeType: mimeType, urlOriginal: urlOriginal });

        // Eliminamos las referencias despueés de usar el stream
        var oldOnOcultar = video.onOcultar;
        video.onOcultar = function() {

            if (_currentStreamingElement === video) _currentStreamingElement = undefined;

            for (var i = 0; i < _currentStreamingElements.length; i++) {
                var element = _currentStreamingElements[i];
                if (element === undefined || element.video === video) {
                    _currentStreamingElements.splice(i, 1);
                    i--;
                }
            }
            if (oldOnOcultar) oldOnOcultar();
            oldOnOcultar = null;
        };
    };
    var _cambiarFuenteCurrentStreaming = function _currentStreamingData(url, mimeType) {
        console.info("Cambiando fuente de streaming a " + url);
        for (var i = 0; i < _currentStreamingElements.length; i++) {
            var element = _currentStreamingElements[i];
            if (element !== undefined) {
                if (Dnv.helpers.inDom(element.video)) {
                    if (url === null) url = element.url;
                    if (mimeType === null) mimeType = element.mimeType;


                    if (element.video.setRuta) {
                        // Es un custom video element
                        element.video.setRuta(_fixStreamUrl(url), mimeType);
                    } else {
                        element.video.src = _fixStreamUrl(url);
                    }
                } else {
                    _currentStreamingElements.splice(i, 1);
                    i--;
                }
            } else {
                _currentStreamingElements.splice(i, 1);
                i--;
            }
        }
        /*
        if (_currentStreamingElement !== undefined) {
        if (Dnv.helpers.inDom(_currentStreamingElement)) {
        if (_currentStreamingElement.setRuta) {
        // Es un custom video element
        _currentStreamingElement.setRuta(url, mimeType);
        } else {
        _currentStreamingElement.src = url;
        }
        } else {
        _currentStreamingElement = undefined;
        }
        }
        */
    }
    window.addEventListener(Dnv.Pl.valoresForzados.CAMBIO_STREAM_EVENT, function(evt) {
        var datos = evt.detail;
        _cambiarFuenteCurrentStreaming(datos.url, datos.mimeType);
        // Es posible que el estado de controlDeCalendarios aun no este actualizado,
        // usamos el stream explicitamente
        Dnv.engine_helpers.enviarNowShowingStreaming(undefined, undefined, datos.urlOriginal || datos.url);
    });
    window.addEventListener(Dnv.Pl.valoresForzados.RESET_STREAM_EVENT, function(evt) {
        //_cambiarFuenteCurrentStreaming(_currentStreamingDefaultData.url, _currentStreamingDefaultData.mimeType);
        _cambiarFuenteCurrentStreaming(null, null);
        // Es posible que el valor forzado aun no este eliminado,
        // especificamos que hay que ignorarlo
        Dnv.engine_helpers.enviarNowShowingStreaming(undefined, undefined, undefined, true);
    });

    var _fixStreamUrl = function(ruta) {
        // Suelen pasar urls de tipo "udp://@1.2.3.4:5678" para que vlc las parsee como IPv4
        if (ruta.indexOf("udp://@") == 0) {
            ruta = "udp://" + ruta.substring("udp://@".length);
        } else if (ruta.indexOf("rtp://@") == 0) {
            ruta = "rtp://" + ruta.substring("rtp://@".length);
        } else if (ruta.indexOf("rtsp://@") == 0) {
            ruta = "rtsp://" + ruta.substring("rtsp://@".length);
        } else if (ruta.indexOf("rtmp://@") == 0) {
            ruta = "rtmp://" + ruta.substring("rtmp://@".length);
        }
        return ruta;

    };

    var getRecursoSimpleElement = function getRecursoSimpleElement(plantilla, capa, recurso, proporciones, onEndedCallback, onErrorCallback, opciones, slide, precargando, aviso) {
        var insercion;
        var elemento = null;
        var tipoCapa = parseInt(capa.getTipoCapa(), 10);
        var salida = Dnv.Pl.lastPlaylist.getPlayer().getSalida();

        var codMaestra = Dnv.helpers.getMaestra(slide);
        // INSERCIONES

        if (tipoCapa == Dnv.Pl.Capa.tipos.TIPO_HUECO && !slide.HasHuecoSSP()) {

            insercion = salida.getInsercion();
            if (insercion) {
                console.info("[INSERCIONES] Mostrando Pr: " + insercion.getPrioridad() + " Cmp: " + insercion.getCampanya() + " Cod: " + insercion.getCodigo() + " Frc: " + insercion.getFrecuencia() + " (" + insercion.getTipoFrecuencia() + ") Prio: " + insercion.getPriorizada() + " Dnm: " + insercion.getDenominacion());
                insercion.setPriorizada(false);

                recurso = insercion.getRecurso();
                if (recurso && recurso.isDisponible()) {
                    slide.setInsercionActual(insercion);
                    salida.setInsercionActual(insercion);
                }

            } else {
                Dnv.audiencia.resetCampaign();
                salida.resetLoopInserciones();
            }



        } else if (!precargando && codMaestra == 0) {

            salida.resetLoopInserciones();
        }



        var tipoRecurso;
        if (recurso) tipoRecurso = parseInt(recurso.getTipo(), 10);

        /*
         * La idea de opciones es pasar un objeto opcional que no llenar de parametros la llamada
         * Además, hay parametros qye solo tienen sentido si pasas un video o determinado tipo de recurso
         */

        var opciones = opciones || {}; // Por defecto pongo un objeto vacio para que no se queje al intenar acceder a las propiedades
        var videoAutoplay = (opciones.videoAutoplay !== false) ? true : false;
        var syncVideo = !!opciones.syncVideo;
        if (syncVideo) videoAutoplay = false;
        //var videoAutoplay = opciones.videoAutoplay || true;

        var errHandler = function(e) { // Solo da error la primera vez? entonces habria que descartar el objeto...
            var elementoSrc = elemento.getAttribute("data-filename-original") || elemento.src || elemento.outerHTML;
            console.error("Ocurrió un error con el elemento " + elemento + " " + elementoSrc + ": " + e + " " + e.message + " " + e.error);
            console.dir(e);

            // Algunos firmwares de TIZEN descargaban mal los videos
            // TODO: Acotar versiones de TIZEN con este problema
            if (Main.info.engine == "TIZEN") {
                /*
                 * Borrado de recurso si falla al reproducirse
                 * El video no se volverá a descargar hasta la próxima vez que se parsee la playlist!
                 * Como desde el servidor se añaden nuevas secciones a la playlist, acaba llegandonos
                 * siempre una playlist nueva y acabamos parseandola. Pero el comportamiento normal es
                 * que este archivo no se volviese a descargar hasta que cambiase la playlist.
                 */
                Dnv.monitor.deleteFile(elemento.src);
                Dnv.Cloud.downloader.onRecursoBorrado(elemento.src);

                setTimeout(function () {
                    var descomprimir = false;
                    if (recurso.getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) descomprimir = true;
                    console.info("[ENGINE]: Volver a descargar " + recurso.getFilename() + " (" + recurso.getSize() + ")");
                    Dnv.Cloud.downloader.descargarRecurso(recurso.getRemoteUrl(), recurso.getHashcode(), descomprimir, false, recurso.getSize(), recurso.getCodigo());
                }, 3 * 1000);
                
            }

            if (onErrorCallback) onErrorCallback(e);
            //Dnv.presentador.avanzarSlide(wrapper, id);
        };

        if (tipoCapa == Dnv.Pl.Capa.tipos.TIPO_URL) {
            elemento = document.createElement('iframe');
            if (Main.info.engine == "TIZEN") {
                elemento.setAttribute("seamless", "");
                elemento.setAttribute("sandbox", "allow-scripts allow-same-origin");
            }
            elemento.src = capa.getUrl();
        } else if (tipoCapa == Dnv.Pl.Capa.tipos.TIPO_TV) {

            elemento = document.createElement('tv'); // elemento artificial
            elemento.onMostrar = function() { Main.mostrarTv(elemento.clientLeft, elemento.clientTop, elemento.clientWidth, elemento.clientHeight); };
            elemento.onOcultar = function() { Main.ocultarTv(); };
        } else if (tipoCapa == Dnv.Pl.Capa.tipos.TIPO_FUENTE_VIDEO && Main.info.engine == "brightsign") {
            elemento = document.createElement('video');
            elemento.src = "tv:brightsign.biz/hdmi";
        } else {

            switch (tipoRecurso) {
                case Dnv.Pl.Recurso.tipos.TIPO_IMAGEN:
                    if (insercion) slide.setDuracion(insercion.getDuracion());
                    elemento = document.createElement('img'); // Si esto no provoca una precarga, probar con new Image()
                    elemento.src = recurso.getUrl();
                    elemento.setAttribute("data-filename-original", recurso.getRemoteUrl().replace(/.*[\\\/]/, ""));
                    break;
                case Dnv.Pl.Recurso.tipos.TIPO_TEXTO:
                    // FIXME: y si es texto avanzado?
                    elemento = document.createElement('div');
                    var codIdioma = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[Dnv.Pl.lastPlaylistIdiomaActual[slide.getCodigo()]];
                    var html = recurso.getTexto(codIdioma);
                    var htmlSlide = slide.getSlideTexto(recurso.getCodigo(), codIdioma);
                    if (htmlSlide !== undefined) {
                        html = htmlSlide;
                    }
                    var marquee = recurso.getMarquee();
                    if (marquee && marquee.enabled) { // TODO: Lo suyo sería usar CSS3...
                        var direccion;
                        switch (marquee.direccion) {
                            case 0:
                                direccion = "left";
                                break;
                            case 1:
                                direccion = "right";
                                break;
                            case 2:
                                direccion = "up";
                                break;
                            case 3:
                                direccion = "down";
                                break;
                        }
                        var comportamiento;
                        switch (marquee.comportamiento) {
                            case 0:
                                comportamiento = "scroll";
                                break;
                            case 1:
                                comportamiento = "slide";
                                break;
                            case 2:
                                comportamiento = "alternate";
                                break;
                        }
                        var loop = (marquee.continua ? "" : "loop='" + marquee.repeticiones + "' ");
                        html = "<marquee direction='" + direccion + "' behavior='" + comportamiento + "' " +
                            "scrolldelay='" + marquee.retraso + "' scrollamount='" + marquee.desplazamiento + "' " +
                            loop + ">" + html + "</marquee>";
                    }

                    elemento.innerHTML = html;
                    elemento.onMostrar = function onMostrar() {
                        /*
                         * En IE el marquee conserva el numero de repeticiones hechas
                         * en los pases anteriores, asi que "recreamos" el objeto.
                         */
                        this.innerHTML = html;
                    }
                    break;
                case Dnv.Pl.Recurso.tipos.TIPO_STREAMING:
                case Dnv.Pl.Recurso.tipos.TIPO_VIDEO:
                    if (tipoRecurso === Dnv.Pl.Recurso.tipos.TIPO_STREAMING && Main.getDivCustomVideoPlayerStreaming) {

                        var workarroundAutoplay = (opciones.workarroundAutoplay !== false) ? true : false;
                        var videoLoop = false;
                        if (opciones.loop !== undefined) {
                            videoLoop = opciones.loop;
                        } else {
                            if (capa.getTipoCapa() === Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                                videoLoop = false;
                            } else {
                                videoLoop = !capa.isRelojMaestro();
                            }
                        }
                        var filenameOriginal = recurso.getRemoteUrl().replace(/.*[\\\/]/, "");
                        var opcionesVideo = { capa: capa, autoplay: videoAutoplay, ruta: recurso.getUrl(), filenameOriginal: filenameOriginal, workarroundAutoplay: workarroundAutoplay, syncVideo: syncVideo, loop: videoLoop, isPrecarga: opciones.isPrecarga };
                        var urlOriginal = opcionesVideo.ruta;
                        var mimeType = opcionesVideo.mimeType;

                        if (tipoRecurso === Dnv.Pl.Recurso.tipos.TIPO_STREAMING) {
                            opcionesVideo.mimeType = recurso.getMimeType();
                            var valorForzado = Dnv.controlCalendarios.getStreamActual();
                            if (valorForzado) {
                                urlOriginal = valorForzado.urlOriginal || valorForzado.url;
                                opcionesVideo.ruta = valorForzado.url;
                                opcionesVideo.mimeType = valorForzado.mimeType;
                            }
                        }
                        elemento = Main.getDivCustomVideoPlayerStreaming(_fixStreamUrl(recurso.getUrl()), recurso.getTipoStreaming());

                        if (tipoRecurso === Dnv.Pl.Recurso.tipos.TIPO_STREAMING) {
                            onNewStreamingElement(elemento, _fixStreamUrl(urlOriginal), mimeType, urlOriginal);
                            elemento.setRuta(_fixStreamUrl(opcionesVideo.ruta), opcionesVideo.mimeType);
                        } else {
                            elemento.setRuta(_fixStreamUrl(recurso.getUrl()), opcionesVideo.mimeType);
                        }


                        if (capa.isRelojMaestro() && capa.getTipoCapa() !== Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                            console.log("[STREAMING] Entro en capa.relojMaestro");
                            var slideActualSmooth = Dnv.secuenciador.getSlideActual();
                            var slideSiguienteSmooth = null;
                            if (!opciones.isPrecarga) {
                                /*
                                 * Si estamos precargando, slideSiguienteSmooth siempre es igual a slideActualSmooth,
                                 * dejamos null para no hacer smooth play
                                 */
                                slideSiguienteSmooth = Dnv.secuenciador.peekNextSlide();
                            }
                            if (slideActualSmooth != null)
                                console.log("[STREAMING] Codigo slideActualSmooth: " + slideActualSmooth.getCodigo());
                            if (slideSiguienteSmooth != null)
                                console.log("[STREAMING] Codigo slideSiguienteSmooth: " + slideSiguienteSmooth.getCodigo());
                            var endEventListenerAdded = false;
                            if (slideActualSmooth != null || slideSiguienteSmooth != null) {
                                console.log("[STREAMING] Entro en if comparar slides. Resultado comparacion:" + slideActualSmooth == slideSiguienteSmooth);
                                if (Dnv.helpers.debeHacerSmoothPlay(slideActualSmooth, slideSiguienteSmooth)) {
                                    console.info("Smoothplay Ponemos en loop a " + elemento);
                                    if (controller && Dnv.sincronizacion.isMaestro()) {
                                        elemento.onended = function(e) {
                                            if (controller) {
                                                controller.pause();
                                                controller.currentTime = 0.0;
                                                controller.play();
                                            }
                                        };
                                    } else if (Main.getDivCustomVideoPlayer) {
                                        elemento.setLoop(true);
                                    } else {
                                        elemento.loop = "loop";
                                    }
                                    endEventListenerAdded = true;
                                } else {
                                    console.log("[STREAMING] Añadimos listener de ended a " + elemento);
                                    elemento.addEventListener("ended", function endedVideo(evt) {
                                        evt.currentTarget.removeEventListener(evt.type, endedVideo);

                                        console.info("[STREAMING] El streaming " + elemento.src + " acabo su reproducción");

                                        if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro()) {
                                            if (controller) controller.pause();

                                            evt.currentTarget.pause();

                                            evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                                            evt.currentTarget.src = "";
                                        } else if (Dnv.sincronizacion.isConectado()) {

                                            evt.currentTarget.pause();

                                            evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                                            evt.currentTarget.src = "";
                                        }

                                        if (onEndedCallback) {
                                            onEndedCallback();
                                        } else {
                                            Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), id, elemento);
                                        }

                                    }, false);
                                    endEventListenerAdded = true;
                                }

                            } else {
                                console.log("[STREAMING] Añadimos listener de ended a " + elemento + "SlideActual y slideSiguiente == null.");
                                elemento.addEventListener("ended", function endedVideo(evt) {
                                    evt.currentTarget.removeEventListener(evt.type, endedVideo);

                                    console.info("[STREAMING/VIDEO] El video " + elemento.src + " acabo su reproducción");

                                    if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro()) {
                                        if (controller) controller.pause();

                                        evt.currentTarget.pause();

                                        evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                                        evt.currentTarget.src = "";
                                    } else if (Dnv.sincronizacion.isConectado()) {

                                        evt.currentTarget.pause();

                                        evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                                        evt.currentTarget.src = "";
                                    }

                                    if (onEndedCallback) {
                                        onEndedCallback();
                                    } else {
                                        Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), id, elemento);
                                    }



                                }, false);
                                endEventListenerAdded = true;

                            }

                            console.log("[STREAMING] Salgo de capa.relojMaestro.endEventListenerAdded = " + endEventListenerAdded);

                        }

                        if (Main.info.engine == "brightsign") {



                            if (capa.getAceleracion() == "false") {
                                if (Dnv.cfg.getInternalCfgString(Main._VERTICAL_CFG, Main._VERTICAL_CFG_HORIZONTAL) == Main._VERTICAL_CFG_VERTICAL) {

                                    elemento.setAttribute("hwz", "z-index:1");
                                } else {
                                    elemento.setAttribute("hwz", "z-index:1");
                                }
                                console.log("[HWZ] En primer plano");
                            } else {
                                console.log("[HWZ] Sin aceleracion");
                            }

                            elemento.setAttribute("compaudio", "hdmi");

                        }

                        elemento.setAttribute("data-filename-original", recurso.getRemoteUrl().replace(/.*[\\\/]/, ""));
                        /* Hasta aqui codigo smoothplay streaming*/
                        break;
                    } else if (Main.getDivCustomVideoPlayer) {

                        var workarroundAutoplay = (opciones.workarroundAutoplay !== false) ? true : false;
                        var videoLoop = false;
                        if (opciones.loop !== undefined) {
                            videoLoop = opciones.loop;
                        } else {
                            if (capa.getTipoCapa() === Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                                videoLoop = false;
                            } else {
                                videoLoop = !capa.isRelojMaestro();
                            }
                        }
                        var filenameOriginal = recurso.getRemoteUrl().replace(/.*[\\\/]/, "");
                        var opcionesVideo = { capa: capa, autoplay: videoAutoplay, ruta: recurso.getUrl(), filenameOriginal: filenameOriginal, workarroundAutoplay: workarroundAutoplay, syncVideo: syncVideo, loop: videoLoop, isPrecarga: opciones.isPrecarga };
                        var urlOriginal = opcionesVideo.ruta;
                        var mimeType = opcionesVideo.mimeType;

                        if (tipoRecurso === Dnv.Pl.Recurso.tipos.TIPO_STREAMING) {
                            opcionesVideo.mimeType = recurso.getMimeType();
                            var valorForzado = Dnv.controlCalendarios.getStreamActual();
                            if (valorForzado) {
                                urlOriginal = valorForzado.urlOriginal || valorForzado.url;
                                opcionesVideo.ruta = valorForzado.url;
                                opcionesVideo.mimeType = valorForzado.mimeType;
                            }
                        }
                        elemento = Main.getDivCustomVideoPlayer(opcionesVideo);
                        elemento.setAutoplay(videoAutoplay);
                        if (tipoRecurso === Dnv.Pl.Recurso.tipos.TIPO_STREAMING) {
                            onNewStreamingElement(elemento, _fixStreamUrl(urlOriginal), mimeType, urlOriginal);
                            elemento.setRuta(_fixStreamUrl(opcionesVideo.ruta), opcionesVideo.mimeType);
                        } else {
                            elemento.setRuta(_fixStreamUrl(recurso.getUrl()), opcionesVideo.mimeType);
                        }

                    } else {

                        if (insercion) capa.setRelojMaestro();

                        elemento = document.createElement('video');
                        /*if (Main.info.engine === "LG") {
                        // TODO: limitar a webOS 3.2 y superiores; y 3.0 horizontal
                        elemento.texture = true;
                        }*/
                        if (videoAutoplay) {
                            elemento.autoplay = "autoplay";
                        }
                        if (syncVideo) {
                            elemento.syncVideo = true;
                        }

                        if (Main.controlErroresVideo) {
                            /*
                             * En algun caso alguna Tizen fallaba continuamente al reproducir videos
                             * En webOS pasaba con streamings tambien, pero se gestiona de otra forma puesto que
                             * la reoroducion de video va con el DivCustomVideoPlayer
                             */
                            elemento.addEventListener("playing", Main.controlErroresVideo.onPlaying);
                            elemento.addEventListener("error", Main.controlErroresVideo.onError);
                        }

                        // OJO
                        // elemento.style.objectFit = "cover";

                        if ((Main.info.engine == "TOSHIBA" || Main.info.engine == "electron") && Dnv.cfg.getInternalCfgString(Main._VERTICAL_CFG, Main._VERTICAL_CFG_HORIZONTAL) == Main._VERTICAL_CFG_VERTICAL) {
                            elemento.style.objectFit = "fill";
                        }

                        if (Dnv._CFG_MUTEAR) elemento.volume = 0;
                        //elemento.autoplay = true;
                        if (videoAutoplay || opciones.preload) {
                            elemento.preload = "auto";
                        } else {
                            elemento.preload = "none";
                        }

                        //elemento.volume = 1.0;

                        var getTimestamp = function getTimestamp() {
                            var d = new Date();
                            return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDay() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "." + d.getMilliseconds();
                        }

                        var filenameOriginal = recurso.getRemoteUrl().replace(/.*[\\\/]/, "");
                        elemento.onreadystatechange = function() {
                            console.log(filenameOriginal + " onready state change " + v.networkState + " " + v.readyState);
                        }
                        if (Main.info.engine == "TIZEN") {
                            elemento.src = recurso.getUrl().replace("file:///", "/");
                        } else {
                            elemento.src = recurso.getUrl();
                        }







                    }

                    if (capa.isRelojMaestro() && capa.getTipoCapa() !== Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                        console.log("[VIDEO] Entro en capa.relojMaestro");
                        var slideActualSmooth = Dnv.secuenciador.getSlideActual();
                        var slideSiguienteSmooth = null;
                        if (!opciones.isPrecarga) {
                            /*
                             * Si estamos precargando, slideSiguienteSmooth siempre es igual a slideActualSmooth,
                             * dejamos null para no hacer smooth play
                             */
                            slideSiguienteSmooth = Dnv.secuenciador.peekNextSlide();
                            //slideSiguienteSmooth = Dnv.secuenciador.peekNextSlide(slideActualSmooth);

                        }
                        if (slideActualSmooth != null)
                            console.log("[VIDEO] Codigo slideActualSmooth: " + slideActualSmooth.getCodigo());
                        if (slideSiguienteSmooth != null)
                            console.log("[VIDEO] Codigo slideSiguienteSmooth: " + slideSiguienteSmooth.getCodigo());
                        var endEventListenerAdded = false;
                        if (slideActualSmooth != null || slideSiguienteSmooth != null) {
                            console.log("[VIDEO] Entro en if comparar slides. Resultado comparacion:" + (slideActualSmooth == slideSiguienteSmooth));
                            if (Dnv.helpers.debeHacerSmoothPlay(slideActualSmooth, slideSiguienteSmooth)) {
                                console.info("[VIDEO] Ponemos en loop a " + elemento);
                                if (controller && Dnv.sincronizacion.isMaestro()) {
                                    elemento.onended = function(e) {
                                        if (controller) {
                                            controller.pause();
                                            controller.currentTime = 0.0;
                                            controller.play();
                                        }
                                    };
                                } else {
                                    if (Main.getDivCustomVideoPlayer) {

                                        elemento.setLoop(true);

                                    } else {
                                        elemento.loop = "loop";
                                    }
                                    /*
                                     * Hay que comprobar regularmente si hay cambios en el canal para salir del loop
                                     * Al hacer loop, no lanza envento ended y no se comprueba si hay que avanzar a otra plantilla
                                     * ¿Y que pasa si este video es de una plantilla maestra?
                                     */
                                    var idCargaOriginal = id;

                                    var timeout = slide.getDuracion() * 1000;
                                    console.info("[VIDEO] Programar comprobación de avance por fin de smoothplay para id " + id);
                                    var closureProgramarAvanceSiNecesario = (function programarAvanceSiNecesario(/*idCargaOriginal, timeout, onEndedCallback*/) {
                                    
                                        setTimeout(function avanzarSlideSiNecesario() {
                                            console.info("[VIDEO] [SMOOTHPLAY] Solicitando avance por fin de smoothplay " + timeout + "ms para id original " + idCargaOriginal + " en id " + Dnv.presentador.getCurrentIdCarga());
                                            var idCargaInicial = Dnv.presentador.getCurrentIdCarga();
                                            if (onEndedCallback) {
                                                onEndedCallback();
                                            } else {
                                                Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), idCargaOriginal, elemento);
                                            }

                                            if (idCargaInicial === Dnv.presentador.getCurrentIdCarga()) { // No comparo el objeto slideactual porque una actualizacion de playlist lo podria haber cambiado
                                                console.info("[VIDEO][SMOOTHPLAY] Reprogramando comprobacion de avance por fin de smoothplay en " + timeout + " para id " + idCargaOriginal)
                                                setTimeout(programarAvanceSiNecesario, timeout);
                                            }
                                        }, timeout);
                                        console.log("[VIDEO] [SMOOTHPLAY] Preparando comprobacion de avance por fin de smoothplay en " + timeout + " para id " + idCargaOriginal);
                                    })();
                                }
                                endEventListenerAdded = true;
                            } else {
                                console.log("[VIDEO] Añadimos listener de ended a " + elemento);
                                elemento.addEventListener("ended", function endedVideo(evt) {
                                    evt.currentTarget.removeEventListener(evt.type, endedVideo);

                                    console.info("[VIDEO] El video " + elemento.src + " acabo su reproducción");

                                    if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro()) {
                                        if (controller) controller.pause();
                                        //if (controller) controller.removeAllMediaElement();
                                        evt.currentTarget.pause();
                                        //evt.currentTarget.removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                                        evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                                        evt.currentTarget.src = "";
                                    } else if (Dnv.sincronizacion.isConectado()) {
                                        //if (controller) controller.removeAllMediaElement();
                                        evt.currentTarget.pause();
                                        //evt.currentTarget.removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                                        evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                                        evt.currentTarget.src = "";
                                    }

                                    var slideActualSmooth = Dnv.secuenciador.getSlideActual();
                                    var slideSiguienteSmooth = Dnv.secuenciador.peekNextSlide();
                                    if (Dnv.helpers.debeHacerSmoothPlay(slideActualSmooth, slideSiguienteSmooth)) {
                                        console.warn("No hemos cargado el video como smoothplay, pero parece que ahora si es smoothplay!!! Lo ponemos en bucle");
                                        // Al hacer smoothplay, los ended callback no saltan
                                        // FIXME: ¿como deberia comportarse la auditoria de videos en smoothplay?
                                        // FIXME: comprobar si debemos avanzar para cuando dejemos de estar en smoothplay!!! y si no activamos el loop sino hacerllo a mano?
                                        if (Main.getDivCustomVideoPlayer) {
                                            elemento.setLoop(true);
                                            elemento.stop();
                                            elemento.setPosicion(0);
                                            elemento.play();
                                        } else {

                                            elemento.loop = "loop";
                                            elemento.pause();
                                            elemento.currentTime = 0.0;
                                            elemento.play();
                                        }
                                    }

                                    if (onEndedCallback) {
                                        console.info("[VIDEO] Hay onEndedCallback para " + elemento.src + ", lo ejecutamos");
                                        onEndedCallback();
                                    } else {
                                        console.info("[VIDEO] No hay onEndedCallback para " + elemento.src + ", forzamos el avance");
                                        Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), id, elemento);
                                    }

                                }, false);
                                endEventListenerAdded = true;
                            }

                        } else {
                            console.log("[VIDEO] Añadimos listener de ended a " + elemento + "SlideActual y slideSiguiente == null.");
                            elemento.addEventListener("ended", function endedVideo(evt) {
                                evt.currentTarget.removeEventListener(evt.type, endedVideo);

                                console.info("[VIDEO] El video " + elemento.src + " acabo su reproducción");

                                if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro()) {
                                    if (controller) controller.pause();
                                    //if (controller) controller.removeAllMediaElement();
                                    evt.currentTarget.pause();
                                    //evt.currentTarget.removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                                    evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                                    evt.currentTarget.src = "";
                                } else if (Dnv.sincronizacion.isConectado()) {
                                    //if (controller) controller.removeAllMediaElement();
                                    evt.currentTarget.pause();
                                    //evt.currentTarget.removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                                    evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                                    evt.currentTarget.src = "";
                                }

                                if (onEndedCallback) {
                                    onEndedCallback();
                                } else {
                                    Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), id, elemento);
                                }

                                /**evt.currentTarget.removeEventListener(evt.type, endedVideo);

                                console.info("[VIDEO] El video " + elemento.src + " acabo su reproducción");

                                if (controller && Dnv.sincronizacion.isMaestro()) controller.pause();

                                if (onEndedCallback) {
                                onEndedCallback();
                                } else {
                                Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), id, elemento);
                                }**/


                                /**
                                setTimeout(function () {
                                if (controller && Dnv.sincronizacion.isMaestro()) {
                                controller.pause();
                                controller.currentTime = 0.0;
                                controller.play();
                                } else if (evt.currentTarget) {
                                evt.currentTarget.play();
                                }
                                }, 2000);
                                **/

                            }, false);
                            endEventListenerAdded = true;

                        }
                        console.log("[VIDEO] Salgo de capa.relojMaestro.endEventListenerAdded = " + endEventListenerAdded);

                    }


                    /**
                    } else {
                    console.log("Ponemos en loop a " + elemento);
                    if (controller && Dnv.sincronizacion.isMaestro()) {
                    elemento.onended = function (e) {

                    controller.pause();
                    controller.currentTime = 0.0;
                    controller.play();

                    };

                    } else {
                    elemento.loop = "loop";
                    }
                    }
                    **/

                    if (Main.info.engine == "brightsign") {

                        /**
                        if (Dnv.sincronizacion.isConectado()) {
                        
                        Dnv.sincronizacion.getVideoSync().onsyncevent = function (e) {
                        elemento.setSyncParams(e.domain, e.id, e.iso_timestamp);
                        elemento.play();
                        console.log("hecho play");
                        };
                        
                        }
                        **/

                        if (capa.getAceleracion() == "false") {
                            if (Dnv.cfg.getInternalCfgString(Main._VERTICAL_CFG, Main._VERTICAL_CFG_HORIZONTAL) == Main._VERTICAL_CFG_VERTICAL) {
                                //elemento.setAttribute("hwz", "z-index:1; transform:rot270;");
                                elemento.setAttribute("hwz", "z-index:1");
                            } else {
                                elemento.setAttribute("hwz", "z-index:1");
                            }
                            console.log("[HWZ] En primer plano");
                        } else {
                            console.log("[HWZ] Sin aceleracion");
                        }

                        elemento.setAttribute("compaudio", "hdmi");

                    }

                    elemento.setAttribute("data-filename-original", recurso.getRemoteUrl().replace(/.*[\\\/]/, ""));

                    break;



                case Dnv.Pl.Recurso.tipos.TIPO_FLASH: // Quizá lo suyo seria usar swfobject

                    elemento = document.createElement('object');
                    var embed = document.createElement('embed');

                    var url;
                    if (Dnv.Cloud.isFileSystemAvailable() && Dnv.Cloud.isFlashCompatible()) {
                        //var existe = Dnv.Cloud._pluginSef.Execute("IsExistedPath", recurso.getUrl());
                        //console.log("PRESENTADOR: ¿"+recurso.getUrl()+" está en disco?: "+existe);
                        //url = "file://"+recurso.getUrl(); SAMSUNG
                        url = recurso.getUrl(); // LG
                        //url = recurso.getUrl().substr(28); // FIXME!!!
                        //url = recurso.getRemoteUrl(); // FIXME: BORRAME

                        elemento.setAttribute("data-filename-original", recurso.getRemoteUrl().replace(/.*[\\\/]/, ""));
                    } else {
                        url = recurso.getRemoteUrl();
                    }
                    if (Dnv.helpers.isOldIE()) {
                        elemento.setAttribute("classid", "clsid:D27CDB6E-AE6D-11CF-96B8-444553540000");

                        elemento.id = "flash_" + Math.random();
                        //elemento.height = capa.getAlto();
                        //elemento.width = capa.getAncho();
                    } else { // Chrome, firefox...*/
                        elemento.type = 'application/x-shockwave-flash';
                        elemento.data = url;
                    }

                    /*
                    Si es IE classid="clsid:D27CDB6E-AE6D-11CF-96B8-444553540000"
                    Si es chrome elemento.type = 'application/x-shockwave-flash';
                    Si es firefox embed (tambien coge object con type y data)
                    */
                    var addParam = function addParam(nombre, valor) {
                        var param = document.createElement("param");
                        param.name = nombre;
                        param.value = valor;
                        elemento.appendChild(param);
                        embed.setAttribute(nombre, valor);
                    }
                    addParam("movie", url);
                    //addParam("quality", "");
                    addParam("quality", "High");
                    addParam("allowScriptAccess", "always");

                    if (tipoCapa == Dnv.Pl.Capa.tipos.TIPO_SMARTOBJECT) {
                        var flashvars = getFlashVars(capa, plantilla.getPlaylist());
                        addParam("FlashVars", flashvars);
                    } else if (tipoCapa == Dnv.Pl.Capa.tipos.TIPO_ANIMACION) {
                        addParam("FlashVars", recurso.getFlashVars());
                    }

                    addParam("menu", "false");
                    addParam("wmode", "transparent");


                    elemento.appendChild(document.createTextNode("Flash not available")); // Fallback TODO: onload: avanzarSlide


                    var elementoOriginal = elemento;
                    var div;
                    if (Dnv.helpers.needsObjectInnerOuterWorkarround()) {
                        // WorkArround para IE basado en https://code.google.com/p/swfobject/source/browse/trunk/swfobject/src/swfobject.js?r=402#414
                        console.log("Aplicando workarround de <object> para IE");
                        elementoOriginal.style.margin = 0;
                        elementoOriginal.style.padding = 0;
                        //elementoOriginal.style.width = capa.getAncho()+"px";
                        //elementoOriginal.style.height = capa.getAlto()+"px";
                        elementoOriginal.style.width = "100%";
                        elementoOriginal.style.height = "100%";

                        div = document.createElement("div");
                        div.innerHTML = elemento.outerHTML;
                        elemento = div;
                    }

                    //console.log(elemento.outerHTML);



                    elemento.onMostrar = function onMostrar() {
                        var that = this;
                        var nuevoElemento;
                        if (Dnv.helpers.needsObjectInnerOuterWorkarround()) {
                            // WorkArround para IE basado en https://code.google.com/p/swfobject/source/browse/trunk/swfobject/src/swfobject.js?r=402#414
                            console.log("Aplicando workarround de <object> para IE");

                            div.innerHTML = elementoOriginal.outerHTML;
                            //elemento = div;
                            nuevoElemento = div.getElementsByTagName("object")[0];

                            nuevoElemento.onError = errHandler;

                        }


                        var timerId = setTimeout(function() {
                            // TODO:
                            //new Event
                            //var event = new CustomEvent("error", {"detail":"Solo ha cargado el "+elemento.PercentLoaded()+"%"});

                            var checkLoad = function checkLoad(elm) {
                                //console.log(Dnv.helpers.inDom(elm)?elm.PercentLoaded():false);
                                if (Dnv.helpers.inDom(elm)) {
                                    var p;
                                    try {
                                        p = elm.PercentLoaded();
                                    } catch (e) {
                                        p = null;
                                    }
                                    var msg;
                                    //console.log("PercentLoaded "+p);
                                    if (p === 0) {
                                        msg = "La capa flash (" + recurso.getRemoteUrl() + ") solo ha cargado el " + elm.PercentLoaded() + "%";
                                    } else if (p === undefined || p === null) {
                                        msg = "El objeto flash (" + recurso.getRemoteUrl() + ") no parece haberse inicializado correctamente";
                                    }

                                    if (msg !== undefined) {

                                        console.error("PRESENTADOR: " + msg + "... lanzando error");

                                        var event;


                                        if (Dnv.helpers.isErrorEventConstructable())
                                            event = new ErrorEvent("error", { message: msg, filename: null, lineno: 0, column: 0 });
                                        else {
                                            event = document.createEvent("Event");
                                            event.initEvent("error", true, true);
                                            event.message = msg;
                                            event.filename = null;
                                            event.lineno = 0;
                                        }
                                        /*
                                        try {
                                        //event = new CustomEvent('error', { 'detail': msg });
                                        event = new Event('error');
                                        } catch(e) {
                                        console.error("No se puede crear el custom event "+e);
                                        //event = document.createEvent('CustomEvent');
                                        //event.initCustomEvent("error", false, false, msg);
                                        event = document.createEvent('Event');
                                        event.initEvent("error", false, false);
                                        }
                                        */
                                        //var event = new Event("error");


                                        console.warn("FIXME: volver a lanzar el error");
                                        //elm.dispatchEvent(event); // FIXME: Lanzar error

                                    }
                                }
                            }
                            if (nuevoElemento !== undefined) {
                                console.assert(that instanceof HTMLDivElement, "El elemento no es instancia de HTMLDivElement");
                                checkLoad(nuevoElemento);
                            } else {
                                console.assert(that instanceof HTMLObjectElement, "El elemento no es instancia de HTMLObjectElement");
                                checkLoad(that);
                            }
                            /*
                            if (that instanceof HTMLDivElement) {               
                            // Para el workarround de IE
                            var objs = that.getElementsByTagName("object");
                            for (var i = 0; i < objs.length; i++) {
                            checkLoad(objs[i]);
                            }
                            } else {
                            checkLoad(that);
                            }*/
                        }, 5000);
                    }


                    break;
                case Dnv.Pl.Recurso.tipos.TIPO_HTML5:

                    elemento = document.createElement('iframe');
                    var filenameOriginal = recurso.getRemoteUrl().replace(/.*[\\\/]/, "");
                    elemento.setAttribute("data-filename-original", filenameOriginal);


                    // random es un entero entre 0 y 2^32
                    var random = Math.floor(Math.random() * (Math.pow(2, 32) - 0)) + 0;
                    var id = "iframe_capa_" + capa.getCodigo() + "_" + random;

                    var url;
                    if (Dnv.cfg.getCfgInt("TransITProduct", 0) > 0) {
                        url = recurso.getIndexUrl() + "?" + "idSmo=" + id + "&" + recurso.getFlashVars() + "&" + getFlashVars(capa, plantilla.getPlaylist());
                    } else if (recurso.getFlashVars() != "") {
                        url = recurso.getIndexUrl() + "?" + "idSmo=" + id + "&" + recurso.getFlashVars() + "&" + getFlashVars(capa, plantilla.getPlaylist());
                    } else {
                        url = recurso.getIndexUrl() + "?" + "idSmo=" + id + "&" + getFlashVars(capa, plantilla.getPlaylist())
                    }

                    var menuboard = recurso.getInterpretarSoloDiseno();
                    if (menuboard == 1) {
                        if (!Dnv.Menuboard.enabled) {
                            menuboard = 0;
                        }
                    }


                    var codDataSource = 0;
                    var localData = "";
                    if (tipoCapa == Dnv.Pl.Capa.tipos.TIPO_SMARTOBJECT) {
                        codDataSource = capa.getDataSource();
                        if (codDataSource == 0) {
                            codDataSource = recurso.getDataSource();
                        }
                        if (codDataSource == 0) {
                            localData = recurso.getLocaldata();
                        }
                    } else {
                        if (codDataSource == 0) {
                            codDataSource = recurso.getDataSource();
                        }
                        if (codDataSource == 0) {
                            localData = recurso.getLocaldata();
                        }
                    }

                    if (aviso) {
                        console.log("[RECURSO HTML5] Recurso: " + recurso.getFilename() + " cargado como Aviso");
                        flashvars = "idSmo=" + id + "&" + "ancho=" + capa.getAncho() + "&" + "alto=" + capa.getAlto() + "&" + getFlashVars(capa);
                        Dnv.Smo.resgistrarIframeAvisos(id, capa.getMetadatos());
                        elemento.onunload = function() {
                            Dnv.Smo.desregistrarIframeAvisos(id, capa.getMetadatos());
                        }
                        elemento.onerror = function() {
                            Dnv.Smo.desregistrarIframeAvisos(id, capa.getMetadatos());
                        }
                        url = recurso.getIndexUrl() + "?" + flashvars + "&" + recurso.getFlashVars();
                    } else if ((tipoCapa == Dnv.Pl.Capa.tipos.TIPO_SMARTOBJECT && localData === "") || codDataSource != 0) {
                        console.log("[RECURSO HTML5] Recurso: " + recurso.getFilename() + " cargado como SmartObject");
                        flashvars = "idSmo=" + id + "&" + "ancho=" + capa.getAncho() + "&" + "alto=" + capa.getAlto() + "&" + getFlashVars(capa, plantilla.getPlaylist());
                        Dnv.Smo.registrarIframe(id, codDataSource);
                        elemento.onunload = function() {
                            Dnv.Smo.desregistrarIframe(id, codDataSource);
                        }
                        elemento.onerror = function() {
                            Dnv.Smo.desregistrarIframe(id, codDataSource);
                        }
                        url = recurso.getIndexUrl() + "?" + flashvars + "&" + recurso.getFlashVars();
                        var codDs = codDataSource;
                        if (codDs != 0) {
                            /*setTimeout(function () {
                            Dnv.Smo.cargarDsEnIframe(codDs, id);
                            }, 2000);*/
                            elemento.onload = function() {
                                Dnv.Smo.cargarDsEnIframe(codDs, id);
                            }
                        }

                    } else if (localData !== "") {

                        console.log("[RECURSO HTML5] Recurso: " + recurso.getFilename() + " cargado como SmartObject (LocalData)");

                        flashvars = "idSmo=" + id + "&" + "ancho=" + capa.getAncho() + "&" + "alto=" + capa.getAlto() + "&" + getFlashVars(capa, plantilla.getPlaylist());
                        Dnv.Smo.registrarIframeLd(id, localData);
                        elemento.onunload = function() {
                            Dnv.Smo.desregistrarIframeLd(id, localData);
                        }
                        elemento.onerror = function() {
                            Dnv.Smo.desregistrarIframeLd(id, localData);
                        }
                        url = recurso.getIndexUrl() + "?" + flashvars + "&" + recurso.getFlashVars();

                        elemento.onload = function() {
                            Dnv.Smo.cargarLdEnIframe(localData, id);
                        }

                    }

                    elemento.id = id;

                    /*
                     * Hacemos una captura limitada de errores del iframe
                     * El problema es que iframe.contentWindow no existe en este punto. Y de
                     * hecho, creo que cambia con cada url.
                     * En webkit parece que solo podemos acceder al contentWindow a partir del evento load.
                     * En IE deberiamos poder usar readyState.
                     * Y definir el listener en un setTimeout de 1ms tampoco es una opción, porque se ejecuta despues del load.
                     * La cosa es que asi solo capturamos los errores durante la ejecución, no errores en el onLoad del iframe, por ejemplo.
                     */

                    elemento.addEventListener('load', function loadIframe(evt) {
                        // elemento.contentWindow aun no está disponible, asi que ponemos el callback cuando se cargue
                        console.log("Añadiendo manejador de errores para " + filenameOriginal);
                        //var original = elemento.contentWindow.onerror;

                        elemento.contentWindow.onerror = function(errorMsg, url, lineNumber, column, errorObject) {
                            var msg;
                            //if (column && errorObject) msg = "Uncaught error " + errorMsg + " in " + url + ", line " + lineNumber + ", col " + column + ", error " + errorObject;
                            if (column) msg = "Uncaught error " + errorMsg + " in " + url + ", line " + lineNumber + ", col " + column;
                            else msg = "Uncaught error " + errorMsg + " in " + url + ", line " + lineNumber;
                            console.error("[RECURSO HTML5] Error en capa " + capa.getCodigo() + ", recurso " + filenameOriginal + ": " + msg);
                            var err = new Error("Error en capa " + capa.getCodigo() + ", recurso " + filenameOriginal + ": " + msg);
                            errHandler(err);
                            return false;
                        }

                        if (menuboard == 1) {

                            console.log("[MENUBOARD]: Pintando precios (load iframe)");

                            var iframe = (elemento.contentWindow || elemento.contentDocument);
                            if (iframe.document) iframe = iframe.document;

                            Dnv.Menuboard.pintarPrecios(iframe);

                            elemento.style.opacity = 1;

                            console.log("[MENUBOARD]: Precios pintados (load iframe)")

                        }

                        evt.currentTarget.removeEventListener(evt.type, loadIframe);

                    });

                    if (menuboard == 1) {
                        elemento.style.opacity = 0;
                        //elemento.style.webkitTransition = "opacity 300ms";
                    }
                    console.log(".SSP. url del siguiente video -->" + url);
                    elemento.src = url;

                    //elemento.src = "about:blank";
                    /*setTimeout(function () {
                    console.log("Valor de contentWindow " + elemento.contentWindow);
                    console.log("Valor de readystate " + elemento.readyState);
                    console.log("Valor de document " + elemento.document);
                    elemento.onreadystatechange = function (a) { console.log("Ready State!!"); };
                    elemento.onReadyStateChange = function (a) { console.log("Ready State!!"); };
                    }, 1);*/
                    break;
                case Dnv.Pl.Recurso.tipos.TIPO_HUECO:
                    if (tipoRecurso === Dnv.Pl.Recurso.tipos.TIPO_HUECO && slide.getMetadatos()["Tipo de hueco"] == "2") { //Lemma


                        try {
                            var configLemma = Dnv.cfg.getCfgString("Configuracion_Lemma", '{"enabled":"False","slotDuration":"30"}');

                            if (configLemma != "" && configLemma != "{}") {
                                var slotDuration = parseInt(JSON.parse(configLemma).slotDuration);
                            } else {
                                var slotDuration = 30;
                            }
                            slide.setDuracion(slotDuration);
                        } catch (e) {
                            Dnv.monitor.writeLogFile("LEMMA: ***** Error al leer duracion de slot ****** Error=" + e.toString() + " ******");

                        }

                        elemento = Main.getDivPlayerLemma();
                        if (insercion) capa.setRelojMaestro();

                        // OJO
                        // elemento.style.objectFit = "cover";



                        if (Dnv._CFG_MUTEAR) elemento.volume = 0;
                        //elemento.autoplay = true;
                        if (videoAutoplay || opciones.preload) {
                            elemento.preload = "auto";
                        } else {
                            elemento.preload = "none";
                        }

                        //elemento.volume = 1.0;

                        var getTimestamp = function getTimestamp() {
                            var d = new Date();
                            return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDay() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "." + d.getMilliseconds();
                        }


                        if (capa.isRelojMaestro()) {
                            console.log("[PLAYER LEMMA] Entro en capa.relojMaestro");


                            var endEventListenerAdded = false;

                            console.log("[PLAYER LEMMA] Añadimos listener de ended a " + elemento);
                            elemento.addEventListener("ended", function endedVideo(evt) {
                                evt.currentTarget.removeEventListener(evt.type, endedVideo);

                                console.info("[PLAYER LEMMA] El Player Lemma acabo su reproducción");

                                if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro()) {
                                    if (controller) controller.pause();
                                    //if (controller) controller.removeAllMediaElement();
                                    evt.currentTarget.pause();
                                    //evt.currentTarget.removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                                    evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                                    evt.currentTarget.src = "";
                                } else if (Dnv.sincronizacion.isConectado()) {
                                    //if (controller) controller.removeAllMediaElement();
                                    evt.currentTarget.pause();
                                    //evt.currentTarget.removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                                    evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                                    evt.currentTarget.src = "";
                                }

                                if (onEndedCallback) {
                                    onEndedCallback();
                                } else {
                                    Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), id, elemento);
                                }

                                /**evt.currentTarget.removeEventListener(evt.type, endedVideo);
                    
                                console.info("[VIDEO] El video " + elemento.src + " acabo su reproducción");
                    
                                if (controller && Dnv.sincronizacion.isMaestro()) controller.pause();
                    
                                if (onEndedCallback) {
                                onEndedCallback();
                                } else {
                                Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), id, elemento);
                                }**/


                                /**
                                setTimeout(function () {
                                if (controller && Dnv.sincronizacion.isMaestro()) {
                                controller.pause();
                                controller.currentTime = 0.0;
                                controller.play();
                                } else if (evt.currentTarget) {
                                evt.currentTarget.play();
                                }
                                }, 2000);
                                **/

                            }, false);
                            endEventListenerAdded = true;


                            /**
                            if (!endEventListenerAdded) {
                            console.log("[VIDEO] Añadimos listener de ended a " + elemento);
                            elemento.addEventListener("ended", function endedVideo(evt) {
                            evt.currentTarget.removeEventListener(evt.type, endedVideo);
                    
                            console.info("[PLAYER LEMMA] El video " + elemento.src + " acabo su reproducción");
                    
                            if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro()) {
                            if (controller) controller.pause();
                            if (controller) controller.removeAllMediaElement();
                            evt.currentTarget.pause();
                            //evt.currentTarget.removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                            evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                            evt.currentTarget.src = "";
                            } else if (Dnv.sincronizacion.isConectado()) {
                            if (controller) controller.removeAllMediaElement();
                            evt.currentTarget.pause();
                            //evt.currentTarget.removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                            evt.currentTarget.removeEventListener("error", Dnv.helpers.error);
                            evt.currentTarget.src = "";
                            }
                    
                            if (onEndedCallback) {
                            onEndedCallback();
                            } else {
                            Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), id, elemento);
                            }
                    
                            }, false);
                            endEventListenerAdded = true;
                            }
                            **/
                            console.log("[PLAYER LEMMA] Salgo de capa.relojMaestro.endEventListenerAdded = " + endEventListenerAdded);


                        }

                        if (Main.info.engine == "brightsign") {



                            if (capa.getAceleracion() == "false") {
                                if (Dnv.cfg.getInternalCfgString(Main._VERTICAL_CFG, Main._VERTICAL_CFG_HORIZONTAL) == Main._VERTICAL_CFG_VERTICAL) {
                                    //elemento.setAttribute("hwz", "z-index:1; transform:rot270;");
                                    elemento.setAttribute("hwz", "z-index:1");
                                } else {
                                    elemento.setAttribute("hwz", "z-index:1");
                                }
                                console.log("[HWZ] En primer plano");
                            } else {
                                console.log("[HWZ] Sin aceleracion");
                            }

                            elemento.setAttribute("compaudio", "hdmi");

                        }
                    }
                    break;
            }


        }
        if (elemento !== null) {

            //elemento.onerror = errHandler;
            if (precargando) {
                elemento.onerror = errHandler;
            } else {
                elemento.addEventListener('error', Dnv.helpers.error);
            }

            elemento.style.margin = 0;
            elemento.style.padding = 0;
            elemento.style.border = 0;
            elemento.style.position = "absolute";
            /*
            elemento.style.left = capa.getPosX()+"px";
            elemento.style.top = capa.getPosY()+"px";
            elemento.style.width = capa.getAncho()+"px";
            elemento.style.height = capa.getAlto()+"px";
            */
            if (capa.getTipoCapa() != Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {

                var dimensiones = getDimensionesCapa(plantilla, capa, proporciones);
                elemento.style.display = "inline-block";
                elemento.style.left = dimensiones.x;
                elemento.style.top = dimensiones.y;
                elemento.style.width = dimensiones.ancho;
                elemento.style.height = dimensiones.alto;
                if (Main.info.engine == "TIZEN" && tizen.systeminfo.getCapability("http://tizen.org/feature/platform.version") == "2.4.0") {
                    if (parseInt(elemento.style.width) > plantilla.getAncho()) {
                        elemento.style.left = 0;
                        elemento.style.width = plantilla.getAncho() + "px";
                    }
                    if (parseInt(elemento.style.height) > plantilla.getAlto()) elemento.style.height = plantilla.getAlto() + "px";
                }
                /*if (capa.getTipoCapa() != Dnv.Pl.Capa.tipos.TIPO_VIDEO || !Dnv.deviceProperties.isCssRotado()) {
                var dimensiones = getDimensionesCapa(plantilla, capa, proporciones);
                elemento.style.display = "inline-block";
                elemento.style.left = dimensiones.x;
                elemento.style.top = dimensiones.y;
                elemento.style.width = dimensiones.ancho;
                elemento.style.height = dimensiones.alto;
                } else {
                // Apaños para LG webOS2
                var wrapper = document.createElement("div");

                wrapper.style.position = "absolute";
                wrapper.style.left = "-420px";
                wrapper.style.top = "420px";
                wrapper.style.width = "1920px";
                wrapper.style.height = "1080px";
                wrapper.style.webkitTransform = "rotate(-90deg)";
                wrapper.style.transform = "rotate(-90deg)";




                //elemento.style.webkitTransform = "rotate(-90deg)";
                //elemento.style.transform = "rotate(-90deg)";
                //getDimensionesCapaWorkarroundWebOS


                var dimensiones = getDimensionesCapa(plantilla, capa, proporciones);
                elemento.style.display = "inline-block";
                elemento.style.position = "absolute";
                /*elemento.style.left = dimensiones.x;
                elemento.style.top = dimensiones.y;
                elemento.style.width = dimensiones.ancho;
                elemento.style.height = dimensiones.alto;* /
                elemento.style.top = (capa.getPosX() + 1) + "px";
                elemento.style.left = (1920 - capa.getAlto() - capa.getPosY() + 1) + "px";
                elemento.style.width = (capa.getAlto() - 2) + "px";
                elemento.style.height = (capa.getAncho() - 2) + "px";


                //dimensiones = getDimensionesCapaWorkarroundWebOS(plantilla, capa, proporciones);
                /*if (capa.getAncho() > capa.getAlto()) {
                elemento.style.width = dimensiones.ancho;
                elemento.style.height = dimensiones.ancho;
                } else {
                elemento.style.width = dimensiones.alto;
                elemento.style.height = dimensiones.alto;
                }
                /*
                elemento.style.left = dimensiones.x;
                elemento.style.top = dimensiones.y;
                elemento.style.width = dimensiones.ancho;
                elemento.style.height = dimensiones.alto;
                * /
                var video = elemento;
                wrapper.appendChild(elemento);
                elemento = wrapper;
                video.src = recurso.getUrl();
                video.load();
                }*/


            } else {
                elemento.style.left = 0;
                elemento.style.top = 0;
                elemento.style.width = "100%";
                elemento.style.height = "100%";
            }
            elemento.style.zIndex = capa.getZIndex();

            /*
            //elemento.addEventListener("error", function(e){
            var errHandler = function(e){ // Solo da error la primera vez? entonces habria que descartar el objeto...
            console.error("Ocurrió un error con el elemento "+elemento+" "+(elemento.src?elemento.src:elemento.outerHTML)+": "+e.message+" "+e.error);
            console.dir(e);
            if (onErrorCallback) onErrorCallback(e);
            //Dnv.presentador.avanzarSlide(wrapper, id);
            };
            elemento.onerror = errHandler;
            
            // Para el workarround de IE
            var elms = elemento.getElementsByTagName("object");
            for (var i = 0; i < elms.length; i++) {
            var elm = elms[i];
            console.log("definimos error para "+elm);
            elm.onerror = errHandler;
            }*/
            /* No se usa embed
            var elms = elemento.getElementsByTagName("embed");
            console.log(elemento+" "+elms.length);
            for (var i = 0; i < elms.length; i++) {
            var elm = elms[i];
            console.log("definimos error para "+elm);
            elm.onerror = errHandler;
            }*/
            //}, false);

        }
        return elemento;
    }

    // TODO: cambiar de lugar ¿meterlo como método del presentador?
    var getSecuenciaElement = function getSecuenciaElement(slide, plantilla, capa, alternada, proporciones,
        fnGetIdPagina, onEndedCallback, onErrorCallback) {
        var timeoutAvanceSecuencia;
        var parent = document.createElement("div");
        parent.className = "secuencia";

        parent.style.margin = 0;
        parent.style.padding = 0;
        parent.style.position = "absolute";
        var dimensiones = getDimensionesCapa(plantilla, capa, proporciones);
        parent.style.left = dimensiones.x;
        parent.style.top = dimensiones.y;
        parent.style.width = dimensiones.ancho;
        parent.style.height = dimensiones.alto;
        /*parent.style.left= capa.getPosX()+"px";
        parent.style.top = capa.getPosY()+"px";
        parent.style.width = capa.getAncho()+"px";
        parent.style.height = capa.getAlto()+"px";*/
        parent.style.zIndex = capa.getZIndex();
        var contador = -1;

        var secuencia = capa.getRecurso();
        var secuenciasRecursos = secuencia.getSecuenciasRecursos();
        var elementos = [];
        //var duraciones = [];
        var recursos = []; //TODO RAG se puede quitar tb!

        var secuenciaElement = parent; //Object.create(parent, {}); <- no podemos hacer subclase de <div>
        secuenciaElement.className = "secuencia";

        for (var i = 0; i < secuenciasRecursos.length; i++) {
            var opciones = {
                syncVideo: slide.isSincronizado(),
                videoAutoplay: false,
                loop: /*true*/ false
            };

            if (capa.getDataSource() != undefined && capa.getDataSource().indexOf(";") != -1) {

                //Aqui compruebo si la capa tiene datasource y si tiene ; asigno a cada recurso su datasource

                // TODO: Revisar: lo suyo seria esperar a reproducir el video completamente y en el end del video avanzar
                var datasourceCapa = capa.getDataSource();
                capa.setDataSource(datasourceCapa.split(";")[i]);
                elementos[i] = getRecursoSimpleElement(plantilla, capa, secuenciasRecursos[i].getRecurso(), proporciones, function() { }, onErrorCallback, opciones);
                capa.setDataSource(datasourceCapa);
            } else {
                elementos[i] = getRecursoSimpleElement(plantilla, capa, secuenciasRecursos[i].getRecurso(), proporciones, function() { }, onErrorCallback, opciones);
            }

            //duraciones[i] = secuenciasRecursos[i].getDuracion();
            recursos[i] = secuenciasRecursos[i].getRecurso();

            if (elementos[i] instanceof HTMLVideoElement) {

                //Ponemos fondo negro porque en webOS a veces hace un efecto raro mostrando 
                //una banda superior y otra inferior entre videos de una secuencia.

                elementos[i].style.backgroundColor = "black";
                elementos[i].loop = false;
                if (Main.info.engine == "TIZEN" && Dnv.deviceInfo.tizenVersion() < 4) {
                    elementos[i].preload = "none";
                }
            }
            elementos[i].setAttribute("secuencia", "true");

        }
        /*
         * La diferencia con la implementacion de android es que aqui la secuencia se cachea
         * con lo que quiza lo suyo sea quizar el avance de secuencia, si es alternado, y que
         * el timer del slide se encargue de avanzar.
         * Si es alternado, tampoco habria que hacer reset()... quiza se deba manjar en comenzar()
         */

        secuenciaElement.reset = function() {
            console.log("PRESENTADOR: [SECUENCIA] Reset de secuencia " + secuencia.getCodigo());
            contador = -1;


            // Paramos los videos y demas...
            for (var i = 0; i < elementos.length; i++) {
                if (elementos[i] instanceof HTMLVideoElement) {
                    console.log("PRESENTADOR: [SECUENCIA] Pausa " + elementos[i].src);
                    elementos[i].pause();
                    //elementos[i].autoplay = false; ¿Quitar autoplay si hacemos load?
                    if (elementos[i].readyState !== HTMLMediaElement.HAVE_NOTHING) {
                        console.log("PRESENTADOR: [SECUENCIA] Video parado en " + elementos[i].currentTime);
                        elementos[i].currentTime = 0;
                        //videos[i].load(); /// TODO: solo para cacheados
                    }
                } else if (elementos[i].isCustomVideoPlayer) {
                    elementos[i].stop();
                }
            }


            // TODO: lo mismo con flashes           
            // TODO continuar desarrollando
        };
        secuenciaElement.comenzar = function() {
            console.log("PRESENTADOR [SECUENCIA] Comenzando secuencia " + secuencia.getCodigo());
            if (!alternada) {
                contador = -1;
            } else {
                if (capa.getCodigo() in Dnv.Pl.posicionSecuenciasAlternadas) {
                    contador = Dnv.Pl.posicionSecuenciasAlternadas[capa.getCodigo()];
                } else {
                    contador = -1;
                    Dnv.Pl.posicionSecuenciasAlternadas[capa.getCodigo()] = contador;
                }
            }

            // Paramos los videos y demas...
            /**
            for (var i = 0; i < elementos.length; i++) {
            if (elementos[i] instanceof HTMLVideoElement) {
            console.log("PRESENTADOR: Pausa " + elementos[i].src);
            elementos[i].pause();
            elementos[i].autoplay = false;
            if (elementos[i].readyState !== HTMLMediaElement.HAVE_NOTHING) {
            console.log("PRESENTADOR: Video parado en " + elementos[i].currentTime);
            elementos[i].currentTime = 0;
            //videos[i].load(); /// TODO: solo para cacheados
            }
            } else if (elementos[i].isCustomVideoPlayer) {
            elementos[i].stop();
            elementos[i].setAutoplay(false);
            }
            }
            **/
            secuenciaElement.setAttribute("contador", contador);

            // TODO: lo mismo con flashes           
            // TODO continuar desarrollando


            //secuenciaElement.avanzar(true, Dnv.Pl.posicionSecuencia);
            //console.log("[SECUENCIAS] Posicion: " + Dnv.Pl.posicionSecuencia);
        };

        //var _cache = {};

        secuenciaElement.avanzar = function(saltarseComprobacionDom, posicionSecuencia) {
            console.log("PRESENTADOR [SECUENCIA] Entrando en avanzar secuencia. Posicion " + posicionSecuencia);

            if (!alternada) {
                //contador = -1;
            } else {
                if (capa.getCodigo() in Dnv.Pl.posicionSecuenciasAlternadas) {
                    contador = Dnv.Pl.posicionSecuenciasAlternadas[capa.getCodigo()];
                } else {
                    contador = -1;
                    Dnv.Pl.posicionSecuenciasAlternadas[capa.getCodigo()] = contador;
                }
            }

            secuenciaElement.setAttribute("contador", contador);
            // console.log("PRESENTADOR [SECUENCIA] Avanzar secuencia desde Posicion " + contador);

            /*var idPagina = fnGetIdPagina(); // El id de la página para la que se genero la secuencia
            var idPaginaActual = id; // El id de la página en pantalla
            if (idPaginaActual != idPagina) {
            console.warn("Descartando petición de avance para la secuencia "+capa.getRecurso().getCodigo()+" de la capa "+capa.getCodigo()+" debido a que estamos en la página "+idPaginaActual+" en lugar de en la "+idPagina);
            return;
            } else {
            console.log("Petición de avance para la secuencia "+capa.getRecurso().getCodigo()+" de la capa "+capa.getCodigo()+" estando en "+idPaginaActual+" == "+idPagina);
            }*/

            if (posicionSecuencia != null && posicionSecuencia != undefined) {
                contador = parseInt(posicionSecuencia) - 1;
                console.log("PRESENTADOR [SECUENCIA] [SINCRONIZACION] Recibido avance a recurso " + posicionSecuencia + " de la secuencia");
            }

            var secuencia = capa.getRecurso();

            if (!saltarseComprobacionDom && !Dnv.helpers.inDom(secuenciaElement)) {
                var elm = getCurrentSlideWrapper();
                console.warn("PRESENTADOR [SECUENCIA] Descartando petición de avance para la secuencia " + secuencia.getCodigo() + " de la capa " + capa.getCodigo() + " debido a que no estamos en el DOM, sino que" +
                    (elm ? " está la plantilla " + elm.getAttribute("data-plantilla") : " no hay nada"));

                return;
            } else {
                console.log("PRESENTADOR [SECUENCIA] Petición de avance para la secuencia " + secuencia.getCodigo() + " de la capa " + capa.getCodigo());
            }

            var secuenciaCompleta = Dnv.cfg.getCfgBoolean("Secuencia_completa", false);
            /*
             * Puede que nos manden reproducir secuencias incompletas,
             * eso hace que, en smoothplay, empiecen a estar disponibles
             * SecuenciasRecurso que antes no lo estaban.
             * Se puede dar el caso de que empiece a reproducir en smoothplay una secuencia nueva que
             * solo tiene una SecuenciaRecurso que acaba de descargar, y se quede esa imagen fija en pantalla
             * Para evitar ese caso, comprobamos continuamente la disponibilidad
             */
            var contadorOriginal = contador;
            do {
                contador++;
                if (alternada) {
                    Dnv.Pl.posicionSecuenciasAlternadas[capa.getCodigo()] = contador;
                }

                if (contador >= elementos.length) {
                    contador = 0;
                    if (alternada) {
                        Dnv.Pl.posicionSecuenciasAlternadas[capa.getCodigo()] = contador;
                    }
                }

                if (secuenciasRecursos[contador].getRecurso().isDisponible()) {
                    break;
                } else {
                    console.info("PRESENTADOR [SECUENCIA] Omitiendo recurso no disponible de secuencia incompleta");
                }

            } while (contador !== contadorOriginal);

            var viejoContenido = secuenciaElement.firstChild;
            /*
            if (contador >= elementos.length) {
                contador = 0;
                if (alternada) {
                    Dnv.Pl.posicionSecuenciasAlternadas[capa.getCodigo()] = contador;
                }
                */
            if (contador <= contadorOriginal) {
                // Ha llegado al fin de la secuencia, bien porque solo está
                // esa SecuenciaRecurso disponible, o porque ha hecho loop

                if (viejoContenido.tagName == "VIDEO") {
                    viejoContenido.pause();
                    if (!Main.getDivCustomVideoPlayer) viejoContenido.autoplay = false;
                    /*if (Main.getDivCustomVideoPlayer) {
                        viejoContenido.setPosicion(0);
                    } else {
                        viejoContenido.currentTime = 0;
                        viejoContenido.autoplay = false;
                    }*/
                }

                if (capa.isRelojMaestro()) {
                    if (alternada) {
                        Dnv.Pl.posicionSecuenciasAlternadas[capa.getCodigo()] = -1;
                    }
                    console.log("PRESENTADOR [SECUENCIA] Hemos completado la reproducción de la secuencia " + secuencia.getCodigo() + " de la capa " + capa.getCodigo());

                    var hayQueReiniciarSecuencia = false;
                    if (onEndedCallback) {

                        var idCargaInicial = fnGetIdPagina();
                        onEndedCallback();
                        if (idCargaInicial === Dnv.presentador.getCurrentIdCarga()) { // No comparo el objeto slideactual porque una actualizacion de playlist lo podria haber cambiado
                            // No hamos avanzado de plantilla en el onEnded, ¿estamos en smoothplay? reiniciamos la secuencia
                            console.info("PRESENTADOR [SECUENCIA] ¿Estamos en smoothplay? reiniciamos la secuencia para la pagina id " + idCargaInicial);
                            hayQueReiniciarSecuencia = true;
                        }
                        if (viejoContenido && !hayQueReiniciarSecuencia) {
                            /*
                             * Los src="" parece que son para liberar memoria en Toshiba
                             * Pero usarlos causa que se intente cargar la imagen "" y por tanto un error.
                             * Como se libera al final de la reproduccion, y los errores saltan asincronamente, hay un monton de avances
                             * y se salta plantillas.
                             * Además, cuando las secuencias van en bucle, necesitaremos el src en el futuro
                             * TODO: El errorcallback tendria que usar el id de la plantilla cargada, para saber si descaratar o no el error;
                             * pero por temas de memoria se usa uno global
                             */
                            if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro()) {
                                if (viejoContenido.tagName == "VIDEO") {
                                    if (controller) controller.pause();
                                    //if (controller) controller.removeAllMediaElement();
                                    viejoContenido.pause();
                                }
                                //evt.currentTarget.removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                                viejoContenido.removeEventListener("error", Dnv.helpers.error);
                                if (Main.info.engine === "TOSHIBA") viejoContenido.src = "";
                            } else if (Dnv.sincronizacion.isConectado()) {
                                //if (controller) controller.removeAllMediaElement();
                                //if (viejoContenido.tagName == "VIDEO") viejoContenido.pause();
                                //evt.currentTarget.removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                                //viejoContenido.removeEventListener("error", Dnv.helpers.error);
                                //viejoContenido.src = "";
                            } else {
                                viejoContenido.removeEventListener("error", Dnv.helpers.error);
                                if (viejoContenido.tagName == "VIDEO") {
                                    viejoContenido.pause();
                                    if (!Main.getDivCustomVideoPlayer) viejoContenido.autoplay = false;
                                    /*if (Main.getDivCustomVideoPlayer) {
                                        viejoContenido.setPosicion(0);
                                    } else {
                                        viejoContenido.currentTime = 0;
                                        viejoContenido.autoplay = false;
                                    }*/
                                }
                                if (Main.info.engine === "TOSHIBA") viejoContenido.src = "";
                            }
                            if (Main.info.engine === "TOSHIBA") {
                                for (var i = 0; i < elementos.length; i++) {
                                    // Liberar memoria del resto de elementos
                                    elementos[i].src = "";
                                }
                            }
                        }
                        

                    }
                    if (!slide.isSincronizado() && !secuenciaCompleta && plantilla.getCapas().length == 1) {
                        /*
                         * ¿Por que se forzaba un avance incondicionalmente antes de acabar la plantilla?
                         * Esto causa falsos avances de plantilla que cortan la reproduccion de futuras plantillas
                         * Si es reloj maestro, el onEndedCallback es el que debe causar el avance, si es reloj maestro se sigue reproduciendo
                         */
                        //Dnv.presentador.avanzarSlideDirectamente();

                    } else if (slide.isSincronizado() && Dnv.sincronizacion.isMaestro() && !secuenciaCompleta && plantilla.getCapas().length == 1) {
                        // [CAR]: Probablemente esto sea erroneo, pero lo dejo porque no puedo probar la sincronizacion
                        Dnv.presentador.avanzarSlideForzandoComprobacionSmoothplay();
                        //Dnv.presentador.avanzarSlideDirectamente();
                    }
                    if (hayQueReiniciarSecuencia === false) {
                        return;
                    }

                } else if (!secuenciaCompleta && plantilla.getCapas().length == 1) {
                    if (!slide.isSincronizado()) {
                        /*
                         * ¿Por que se forzaba un avance incondicionalmente antes de acabar la plantilla?
                         * Esto causa falsos avances de plantilla que cortan la reproduccion de futuras plantillas
                         * Si es reloj maestro, el onEndedCallback es el que debe causar el avance, si es reloj maestro se sigue reproduciendo
                         */
                        //Dnv.presentador.avanzarSlideDirectamente();
                    } else if (Dnv.sincronizacion.isMaestro()) {
                        // [CAR]: Probablemente esto sea erroneo, pero lo dejo porque no puedo probar la sincronizacion
                        Dnv.presentador.avanzarSlideDirectamente();
                    }

                }

            }


            var nuevoContenido = elementos[contador];

            if (nuevoContenido instanceof HTMLVideoElement && Dnv.sincronizacion.isConectado() && Main.info.engine == "electron") {

                //posteriores
                //if (!controller || (controller && controller.getMediaElement().length == 0)) {

                var requirejs = require('requirejs');
                requirejs.config({
                    baseUrl: __dirname + '/lib/videoSync',
                    nodeRequire: require,
                    paths: {
                        'woodman': 'woodman',
                        'event-target': 'event-target.amd',
                        'websocket': 'browser'
                    }
                });

                requirejs([
                    'TimingObject',
                    'SocketTimingProvider',
                    'TimingMediaController',
                    'StateVector',
                    'woodman'
                ], function(
                    TimingObject, SocketTimingProvider, TimingMediaController, StateVector,
                    woodman) {
                    try {
                        if (Dnv.sincronizacion.isMaestro()) {
                            ipServidorTiempo = Dnv.deviceInfo.ip();
                            if (!ipServidorTiempo) ipServidorTiempo = "0.0.0.0";
                        } else {
                            ipServidorTiempo = Dnv.sincronizacion.getIPServidor();
                        }
                        console.log("[SINCRONIZACION][ELEMENTO VIDEO] IP servidor de tiempo: " + ipServidorTiempo);
                        puertoServidorTiempo = Dnv.sincronizacion.getCurrentServerPort();
                        console.log("[SINCRONIZACION][ELEMENTO VIDEO] Puerto servidor de tiempo: " + puertoServidorTiempo);
                        var timingProvider = new SocketTimingProvider("ws://" + ipServidorTiempo + ":" + puertoServidorTiempo + "/video");
                        var timing = new TimingObject();
                        timing.srcObject = timingProvider;
                        controller = new TimingMediaController(timing);
                        if (nuevoContenido != undefined) {
                            console.log("[SINCRONIZACION][ELEMENTO VIDEO] Video " + nuevoContenido.currentSrc + " añadido a controlador de sincronizacion");
                            controller.addMediaElement(nuevoContenido);
                        }
                        /**else {
                                                               if (videos.length <= i) {
                                                                   //videos[i] = videos[videos.length-1];
                                                                   controller.addMediaElement(videos[i - 1]);
                                                               }
                                                           }**/
                        controller.addEventListener('readystatechange', function(evt) {
                            var flag = true;
                            console.log("[SINCRONIZACION][ELEMENTO VIDEO] Evento: " + evt.value);
                            switch (evt.value) {
                                case "open":
                                    /**
                                    if (!Dnv.sincronizacion.isMaestro() && flag) {
                                    flag = false;

                                    Dnv.sincronizacion.getDiscover().send("sincro-video", { sync: "" });
                                    }
                                    if (Dnv.sincronizacion.isMaestro()) {
                                    setTimeout(function () { controller.play(); }, 2000);
                                    }
                                    **/
                                    Dnv.sincronizacion.getDiscover().send("sincro-video", { sync: "" });

                                    if (Dnv.sincronizacion.isMaestro()) {
                                        setTimeout(function() {
                                            if (controller) controller.play();
                                            Dnv.sincronizacion.resetNodosSyncVideo();
                                            console.log("[SINCRONIZACION][ELEMENTO VIDEO] Timer seguridad. Play.");

                                        }, 5000);
                                    }

                                    break;
                                case "closed":
                                    //controller = null;
                                    break;
                            }
                        });
                    } catch (e) {
                        console.error("[SINCRONIZACION][ELEMENTO VIDEO] Error: " + e);
                    }
                });
                //}
            }



            //var sw = document.getElementById("slideWrapper");
            console.log("PRESENTADOR [SECUENCIA] Avanzando al elemento " + contador + " de la secuencia. " + nuevoContenido.outerHTML);

            //Auditoria secuencias

            if (plantilla.getAuditar() > 0 && capa.isAuditable()) {
                // FIXME: ¿esto no tendria que ir antes de los returns? De lo contrario audita el ultimo elemento?
                //Dnv.auditoria.auditarSecuencia(secuenciasRecursos[contador], Dnv.secuenciador.getSlideActual().getPlantilla(), capa, recursos[contador]);
                Dnv.auditoria.auditarSecuencia(secuencia, plantilla, capa, recursos[contador], secuenciasRecursos[contador].getDuracion());
            }

            function endedVideo(evt) {
                evt.currentTarget.removeEventListener(evt.type, endedVideo);
                console.log("PRESENTADOR [SECUENCIA] Programado avance de secuencia cancelado por video maestro");
                clearTimeout(timeoutAvanceSecuencia);
                if (Dnv.sincronizacion.isConectado()) {
                    if (Dnv.sincronizacion.isMaestro()) {
                        secuenciaElement.avanzar();
                    }
                } else {
                    secuenciaElement.avanzar();
                }
            }



            if (viejoContenido != null) {
                //var oldSlideWrapper = this.replaceChild(slideWrapper, document.getElementById("slideWrapper"));

                //if (viejoContenido.onOcultar) viejoContenido.onOcultar();

                // Paramos los videos y demas...

                if (viejoContenido instanceof HTMLVideoElement) {
                    console.log("PRESENTADOR: [SECUENCIA] Pausa " + viejoContenido.src);
                    //viejoContenido.removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                    // viejoContenido.removeEventListener("error", Dnv.helpers.error); <- Se sigue necesitando si la secuencia está en bucle
                    viejoContenido.removeEventListener("ended", endedVideo);
                    viejoContenido.pause();
                    viejoContenido.autoplay = false;
                    if (Main.info.engine === "TOSHIBA") viejoContenido.src = "";
                    if (viejoContenido.readyState !== HTMLMediaElement.HAVE_NOTHING) {
                        console.log("PRESENTADOR: [SECUENCIA] Video parado en " + viejoContenido.currentTime);
                        viejoContenido.currentTime = 0;
                        //viejoContenido.load(); /// TODO: solo para cacheados
                    }
                    if (!(nuevoContenido instanceof HTMLVideoElement) && slide.isSincronizado() && !Dnv.sincronizacion.isMaestro()) {
                        var delay = Dnv.sincronizacion.getLatenciaEsclavo() + Dnv._SYNC_DELAY_MAESTRO;
                        setTimeout(secuenciaElement.avanzar, delay + (secuenciasRecursos[contador].getDuracion() * 1000));
                    }
                } else if (viejoContenido.isCustomVideoPlayer) {
                    viejoContenido.stop();
                    viejoContenido.setAutoplay(false);
                }

                /*
                var videos = viejoContenido.getElementsByTagName("video");
                for(var i = 0; i < videos.length; i++) {
                videos[i].pause();
                videos[i].autoplay = false;
                if (videos[i].readyState !== HTMLMediaElement.HAVE_NOTHING) {
                console.log("Video parado en "+videos[i].currentTime);
                videos[i].currentTime = 0;
                //videos[i].load(); /// TODO: solo para cacheados
                }
                }
                */

                /*if (nuevoContenido instanceof HTMLObjectElement && Dnv.helpers.needsObjectInnerOuterWorkarround()) {
                secuenciaElement.innerHTML = nuevoContenido.outerHTML;
                var nuevoContenidoElm = secuenciaElement.firstChild;
                //nuevoContenidoElm.Playing == true;
                } else {*/

                //setTimeout(function () {
                secuenciaElement.replaceChild(nuevoContenido, viejoContenido);
                //console.log("PRESENTADOR [SECUENCIA] REEMPLAZADO " + viejoContenido + " por " + nuevoContenido);
                console.log("PRESENTADOR [SECUENCIA] REEMPLAZADO");
                //}, 2500);
                //if (contador == 0) {
                //CORRECION TEMPORAL
                //A veces, al cargar el primer elemento de una secuencia, desparece del DOM aunque todo es aparentemente normal
                setTimeout(function() {
                    try {
                        if (!document.getElementsByClassName("secuencia")[0].firstChild) {
                            console.warn("PRESENTADOR [SECUENCIA] REEMPLAZADO (timeout)");
                            document.getElementsByClassName("secuencia")[0].appendChild(nuevoContenido);
                            if (Dnv.presentador.getController()) setTimeout(function() { Dnv.presentador.getController().play(); }, 200);
                        }
                    } catch (e) { }
                }, 1000);
                //}

                //}
            } else {
                /*if (nuevoContenido instanceof HTMLObjectElement && Dnv.helpers.needsObjectInnerOuterWorkarround()) {
                secuenciaElement.innerHTML = nuevoContenido.outerHTML;
                var nuevoContenidoElm = secuenciaElement.firstChild;
                //nuevoContenidoElm.Playing == true;
                } else {*/
                //setTimeout(function () {
                secuenciaElement.appendChild(nuevoContenido);
                //console.log("PRESENTADOR [SECUENCIA] AÑADIDO " + nuevoContenido);
                console.log("PRESENTADOR [SECUENCIA] AÑADIDO");
                //}, 2500);
                //}
                setTimeout(function() {
                    try {
                        if (!document.getElementsByClassName("secuencia")[0].firstChild) {
                            console.warn("PRESENTADOR [SECUENCIA] AÑADIDO (timeout)");
                            document.getElementsByClassName("secuencia")[0].appendChild(nuevoContenido);
                            if (Dnv.presentador.getController()) setTimeout(function() { Dnv.presentador.getController().play(); }, 200);
                        }
                    } catch (e) { }
                }, 1000);

            }

            console.log("PRESENTADOR [SECUENCIA] Avance Secuencia Codigo " + slide.getCodigo());
            if (nuevoContenido.onMostrar) nuevoContenido.onMostrar();

            var video = false;
            var secuenciaSincronizada = false;
            if (nuevoContenido instanceof HTMLVideoElement) {
                console.log("PRESENTADOR [SECUENCIA] Secuencia Play " + nuevoContenido.src + " en " + nuevoContenido.currentTime);
                video = true;
                if (Dnv._CFG_MUTEAR) nuevoContenido.volume = 0;

                /*if (Main.info.engine == "TIZEN" && Dnv.deviceInfo.tizenVersion() < 4) {
                    nuevoContenido.preload = "auto";
                    nuevoContenido.videoAutoplay = true;
                    nuevoContenido.src = nuevoContenido.src;
                }
                if (Main.info.engine == "TIZEN" && Dnv.deviceInfo.tizenVersion() === 2) {
                    nuevoContenido.load();
                }*/
                //nuevoContenido.currentTime = 0;
                //nuevoContenido.load(); /// TODO: solo para cacheados
                nuevoContenido.loop = false;
                nuevoContenido.addEventListener("ended", endedVideo);
                if (nuevoContenido.currentTime !== 0) nuevoContenido.currentTime = 0;
                if ((Main.info.engine == "TIZEN" && Dnv.deviceInfo.tizenVersion() < 4) ||
                        nuevoContenido.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
                    // En Tizen 2.4 hay que hacer el load despues de todos los cambios de loop y demas
                	/*
                	 * En Tizen 2.4 y 3, (al menos) con la combinacion de una plantilla de video y una plantilla de secuencia de videos,
                	 * el primer video parece que se reproduce, pero la pantalla se queda en negro.
                	 * Haciendo el play ligeramente despues del load se evita ese efecto.
                	 */
                    if (!nuevoContenido.syncVideo) {
                        nuevoContenido.addEventListener("canplaythrough", function canplaythroughListener() {
                            nuevoContenido.removeEventListener("canplaythrough", canplaythroughListener);
                            var ms = 300;
                            if (Dnv.deviceInfo.tizenVersion() === 2) {
                                // Necesita más tiempo a veces
                                ms = 400
                            }
                            setTimeout(function () {
                                //console.log("[SECUENCIA] Haciendo play");
                                nuevoContenido.play();
                            }, ms);


                        });
                    }
                    nuevoContenido.load();
                } else {
                    if (!nuevoContenido.syncVideo) nuevoContenido.play();
                }
                /**
                //setTimeout(nuevoContenido.play, 250);
                setTimeout(nuevoContenido.play, 500);
                setTimeout(nuevoContenido.play, 1000);
                **/
                //nuevoContenido.volume = 1.0;
                console.log(nuevoContenido.getAttribute("data-filename-original") + " Hacemos play [SECUENCIA]");
                setTimeout(function() {
                    //console.log("PRESENTADOR: [SECUENCIA] ReadyStatus " + nuevoContenido.readyState + " rate " + nuevoContenido.playbackRate + " net state " + nuevoContenido.networkState + " net time " + nuevoContenido.currentTime);
                }, 5000);
            } else if (nuevoContenido.isCustomVideoPlayer) {
                if (nuevoContenido.getPosicion() !== 0) nuevoContenido.setPosicion(0);
                //nuevoContenido.load();
                nuevoContenido.play();
            }

            if (slide.isSincronizado()) { // Es secuencia de HTML5s sincronizados
                secuenciaSincronizada = true;
                if (!secuencia.isCompleta() && !Dnv.sincronizacion.isMaestro()) { //Si la secuencia no esta completa se desincroniza hasta el siguiente slide.
                    secuenciaSincronizada = false;
                    Dnv.sincronizacion.desconectar();
                }
                if (Dnv.sincronizacion.isMaestro()) {
                    var delay = Dnv.sincronizacion.getLatenciaEsclavo() + Dnv._SYNC_DELAY_MAESTRO;
                    var timeSincronizacion = new Date().getTime() + delay + (secuenciasRecursos[contador].getDuracion() * 1000);

                    //setTimeout(function () { Dnv.sincronizacion.onMaestroAvanzandoSecuencia(slide.getCodigo(), contador, timeSincronizacion) }, 150);
                    Dnv.sincronizacion.onMaestroAvanzandoSecuencia(slide.getCodigo(), contador, timeSincronizacion);
                    var margenDuracion = 0;
                    if (nuevoContenido instanceof HTMLVideoElement) margenDuracion = 10000;
                    console.log("PRESENTADOR [SECUENCIA] Programado avance de secuencia dentro de " + secuenciasRecursos[contador].getDuracion() + " s");
                    timeoutAvanceSecuencia = setTimeout(function() {
                        console.log("PRESENTADOR [SECUENCIA] Programado avance de secuencia ejecutado");
                        secuenciaElement.avanzar();
                        //}, delay + (secuenciasRecursos[contador].getDuracion() * 1000));
                    }, (secuenciasRecursos[contador].getDuracion() * 1000) + margenDuracion);
                    //setTimeout(secuenciaElement.avanzar, timeSincronizacion);
                }
            }


            if (!alternada && !video && !secuenciaSincronizada) {
                //setTimeout(secuenciaElement.avanzar, duraciones[contador] * 1000);
                // console.log("PRESENTADOR [SECUENCIA] Programando timer de avance " + secuenciasRecursos[contador].getDuracion() * 1000);
                timeoutAvanceSecuencia = setTimeout(secuenciaElement.avanzar, secuenciasRecursos[contador].getDuracion() * 1000);
            } else {
                // console.log("PRESENTADOR [SECUENCIA] No Programamos timer de avance. alternada " + alternada + " video " + video + " secuenciaSincronizada " + secuenciaSincronizada);
            }
            secuenciaElement.setAttribute("contador", contador);

            console.log("PRESENTADOR [SECUENCIA] Nuevo elemento en la secuencia " + secuenciaElement.outerHTML);

            /**
            var observer = new MutationObserver(function (mutations) {
            for (var m = 0; m < mutations.length; m++) {
            for (var ad = 0; ad < mutations[m].addedNodes.length; m++) {
            console.error("PRESENTADOR [SECUENCIA] Cambio en el elemento (añadido) " + mutations[m].addedNodes[ad]);
            }
            for (var rm = 0; rm < mutations[m].removedNodes.length; m++) {
            console.error("PRESENTADOR [SECUENCIA] Cambio en el elemento (quitado) " + mutations[m].removedNodes[rm]);
            }
            }
            });
            observer.observe(secuenciaElement, { attributes: true, childList: true, attributeOldValue: true });
            **/
        };

        secuenciaElement.onOcultar = function secuenciaOncultar() {
            clearTimeout(timeoutAvanceSecuencia);
        };
        return secuenciaElement;
    }

    //var reproduciendo = false;

    var _currentWrapper = null;
    var _currentSlideWrapper = null;

    function setCurrentWrapper(valor) {
        console.log("[ENGINE] setCurrentWrapper: " + (valor ? valor.id : valor));
        _currentWrapper = valor;
        if (valor.id === "wrapper0") {
            _currentSlideWrapper = document.getElementById("wrapper0_slideWrapper");
        } else {
            _currentSlideWrapper = document.getElementById("wrapper1_slideWrapper");
        }
    }

    function getCurrentWrapper() {
        if (!_currentWrapper) {
            console.log("[ENGINE] calculando wrapper");
            var wrapper0 = document.getElementById("wrapper0");
            var wrapper1 = document.getElementById("wrapper1");
            //var oculto, visible, idOculto, idVisible;
            if (Dnv._USAR_VISIBILITY) {
                if (wrapper1.style.visibility == "hidden") {
                    _currentWrapper = wrapper0;
                    _currentSlideWrapper = document.getElementById("wrapper0_slideWrapper");
                } else {
                    _currentWrapper = wrapper1;
                    _currentSlideWrapper = document.getElementById("wrapper1_slideWrapper");
                }
            } else {
                if (wrapper1.style.display == "none") {
                    _currentWrapper = wrapper0;
                    _currentSlideWrapper = document.getElementById("wrapper0_slideWrapper");

                } else {
                    _currentWrapper = wrapper1;
                    _currentSlideWrapper = document.getElementById("wrapper1_slideWrapper");
                }
            }
        }
        console.log("[ENGINE] getCurrentWrapper: " + (_currentWrapper ? _currentWrapper.id : _currentSlideWrapper));
        return _currentWrapper;
    }

    function getCurrentSlideWrapper() {
        var cw = getCurrentWrapper();
        if (cw.id === "wrapper0") {
            return document.getElementById("wrapper0_slideWrapper");
        } else {
            return document.getElementById("wrapper1_slideWrapper");
        }
    }

    function getNotCurrentWrapper() {

        var csw = getCurrentWrapper();
        var ncsw = null;
        if (csw && csw.id === "wrapper0") {
            ncsw = document.getElementById("wrapper1");
        } else if (csw && csw.id === "wrapper1") {
            ncsw = document.getElementById("wrapper0");
        } else {
            console.warn("Valor inesperado para el slidewrapper actual")
        }
        return ncsw;
    }
    var _currentWrapperMaestro = null;

    function setWrapperMaestro(valor) {
        console.log("[ENGINE] setCurrentWrapperMaestro: " + (valor ? valor.id : valor));
        _currentWrapperMaestro = valor;
    }

    function getCurrentWrapperMaestro() {
        if (!_currentWrapperMaestro) {

            var wrapperMaestro0 = document.getElementById("wrapperMaestro0");
            var wrapperMaestro1 = document.getElementById("wrapperMaestro1");
            //var oculto, visible, idOculto, idVisible;
            if (Dnv._USAR_VISIBILITY) {
                if (wrapperMaestro1.style.visibility == "hidden") {
                    _currentWrapperMaestro = document.getElementById("wrapperMaestro0");

                } else {
                    _currentWrapperMaestro = document.getElementById("wrapperMaestro1");
                }
            } else {
                if (wrapperMaestro1.style.display == "none") {
                    _currentWrapperMaestro = document.getElementById("wrapperMaestro0");

                } else {
                    _currentWrapperMaestro = document.getElementById("wrapperMaestro1");
                }
            }
        }
        console.log("[ENGINE] getCurrentWrapperMaestro: " + (_currentWrapperMaestro ? _currentWrapperMaestro.id : _currentWrapperMaestro));
        return _currentWrapperMaestro;
    }

    function getNotCurrentWrapperMaestro() {

        /*var csw = getCurrentSlideWrapper();
        var ncsw = null;
        if (csw && csw.id === "wrapper0_slideWrapper") {
        ncsw = document.getElementById("wrapper1");
        } else if (csw && csw.id === "wrapper1_slideWrapper") {
        ncsw = document.getElementById("wrapper0");
        } else {
        console.warn("Valor inesperado para el slidewrapper actual")
        }
        return ncsw;*/

        var cswm = getCurrentWrapperMaestro();
        var ncswm = null;
        if (cswm && cswm.id === "wrapperMaestro0") {
            ncswm = document.getElementById("wrapperMaestro1");
        } else if (cswm && cswm.id === "wrapperMaestro1") {
            ncswm = document.getElementById("wrapperMaestro0");
        } else {
            console.warn("Valor inesperado para el slidewrapperMaestro actual")
        }
        return ncswm;
    }

    var _initRealizado = false;
    var _primeraEjecucion = true;

    function init() {
        _initRealizado = true;
        var wrapper0 = document.getElementById("wrapper0");
        var wrapper1 = document.getElementById("wrapper1");
        var wrapperMaestro0 = document.getElementById("wrapperMaestro0");
        var wrapperMaestro1 = document.getElementById("wrapperMaestro1");

        /*
         * Para las transiciones de opacidad
         * Desafortunadamente no hay un evento de inicio de transicion (excepto en IE10+), asi que habrá que llamar a mano al callback
         * La idea es poder abortar una transicion. Lo necesitaremos si la plantilla a la que estamos pasando 
         * tiene errores.
         *
         * TODO: Aplicar tambien a plantillas maestras
         */
        //wrapper0.haciendoTransicion = false;
        //wrapper1.haciendoTransicion = false;

        function onTransitionEnd(evt, param1) {
            if (!Dnv._OPACITY_ENABLED) return;

            var src = evt.srcElement;
            src[evt.propertyName + "HaciendoTransicion"] = false;
            //if (src.style.opacity == 0) {
            if (src.style.opacity == Dnv._OPACITY_OCULTO) {
                console.log(src.id + " none");
                if (Dnv._USAR_VISIBILITY) {
                    src.style.visibility = "hidden";
                } else {
                    src.style.display = "none";
                }
                src.innerHTML = "";
                if (src.cbTransitionEnd) src.cbTransitionEnd();
            } else { }
            console.log("PRESENTADOR: ||||||||||||||||OnTransitionEnd " + src.id + " " + evt.propertyName + "=" + src.style[evt.propertyName] + " durante " + evt.elapsedTime + " secs " + (src.children[0] ? src.children[0].getAttribute("data-slide-denominacion") : ""));
        }
        wrapper0.addEventListener("transitionend", onTransitionEnd, false);
        wrapper1.addEventListener("transitionend", onTransitionEnd, false);
        wrapperMaestro0.addEventListener("transitionend", onTransitionEnd, false);
        wrapperMaestro1.addEventListener("transitionend", onTransitionEnd, false);



        function abortarTransicion(elemento, propiedad, valorFinal) {
            if (!Dnv._OPACITY_ENABLED) return;

            console.warn("PRESENTADOR: ||||||||||||||||AbortandoTransicion " + elemento.id + " " + elemento + "=" + elemento.style[propiedad] + " " + (elemento.children[0] ? elemento.children[0].getAttribute("data-slide-denominacion") : ""));
            elemento[propiedad + "HaciendoTransicion"] = false;
            if (valorFinal == 0) {
                var original = elemento.style.transition;
                elemento.style.transition = "0s";
                elemento.style[propiedad] = valorFinal;
                console.log(elemento.id + " none");
                if (Dnv._USAR_VISIBILITY) {
                    elemento.style.visibility = "hidden";
                } else {
                    elemento.style.display = "none";
                }
                elemento.innerHTML = "";
                elemento.style.transition = original;
                if (elemento.cbTransitionEnd) elemento.cbTransitionEnd();
            } else { }
        }

        function onTransitionStart(propiedad, valorFinal) {
            if (!Dnv._OPACITY_ENABLED) return;

            //var elemento = evt.srcElement;
            var elemento = this;
            if (elemento[propiedad + "HaciendoTransicion"] === true) {
                // Abortamos la anterior transicion
                abortarTransicion(elemento, propiedad, valorFinal);
            }
            elemento[propiedad + "HaciendoTransicion"] = true;
        }
        /*console.log("Ejecutando init");
        console.log("wrapper0 " + wrapper0.id);
        console.log("wrapper1 " + wrapper1.id);
        console.log("Ejecutando init");
        console.log("Ejecutando init");
        console.log("Ejecutando init");*/

        wrapper0.onTransitionStart = onTransitionStart;
        wrapper1.onTransitionStart = onTransitionStart;
        //console.log("wrapper0 " + wrapper0.onTransitionStart + " " + document.getElementById("wrapper0").onTransitionStart);
        //console.log("wrapper1 " + wrapper1.onTransitionStart + " " + document.getElementById("wrapper1").onTransitionStart);
        wrapperMaestro0.onTransitionStart = onTransitionStart;
        wrapperMaestro1.onTransitionStart = onTransitionStart;
    }
    /*
    * Samsung SSSP no soporta 2 videos en pantalla, a menos que usemos cosas especificas de samsung
    * Si ponemos un video a continuacion del otro, durante la transicion habra 2 videos en pantalla.
    * 
    * 
    * Parece que, aunque cargue de disco, le cuesta comenzar a reproducir el video, asi que igual
    * habria que mirar como hacer un preload.
    * 
    * Con flash, a efectos prácticos, no tenemos eventos de carga.
    * 
    * 
    * 
    */
    var VengoApagado = false; // Deberia ser innecesaria ahora

    var videosPrecargados = {};
    var pantallaApagada = false;
    var reproduciendoPresentacion = false;

    var anteriorPlantillaAviso;

    var anteriorResolucion;
    var timerSmoothplay;
    var timeoutDuracionSlide;

    var inicioSlideTimestamp;
    var inicioSlide;
    var finSlideTimestamp;

    var lastAvanceTime = Date.now();

    var _posicionarVideoGapless = function _posicionarVideoGapless(slide, slideWrapper, proporciones) {

        var posicion = slide.getPosicionVideosGapless();

        if (proporciones == PROPORCIONES.ESCALADO_ORIGINAL || !slideWrapper) {
            console.warn("No hay _currentSlideWrapper" + slideWrapper);
            Dnv.gaplessVideo.setPosicion(posicion.x, posicion.y, posicion.w, posicion.h);
        } else {
            console.warn("Hay _currentSlideWrapper" + slideWrapper.scrollWidth + "x" + slideWrapper.scrollHeight + " plantilla " + slide.getPlantilla().getAncho() + "x" + slide.getPlantilla().getAlto());
            //console.warn("plantilla" + _currentSlideWrapper.scrollWidth + "x" + _currentSlideWrapper.scrollHeight);
            var ratioHorizontal = slideWrapper.scrollWidth / slide.getPlantilla().getAncho();
            var ratioVertical = slideWrapper.scrollHeight / slide.getPlantilla().getAlto();
            Dnv.gaplessVideo.setPosicion(
                posicion.x * ratioHorizontal,
                posicion.y * ratioVertical,
                posicion.w * ratioHorizontal,
                posicion.h * ratioVertical);
        }
    };


    var _generateSlideWrapper = function(slide, plantilla, generandoParaMaestra) {
        var slideWrapper = document.createElement('div');

        if (!generandoParaMaestra) {
            slideWrapper.setAttribute("class", "slideWrapper");
            slideWrapper.setAttribute("data-slide-denominacion", slide.getDenominacion());
            slideWrapper.setAttribute("data-slide", slide.getCodigo());
        } else {
            slideWrapper.setAttribute("class", "slideWrapperMaestro");
            slideWrapper.setAttribute("data-slide-denominacion", slide.getDenominacion() + "Maestra");
            slideWrapper.setAttribute("data-slide", plantilla.getCodigo()); //(RDF) Si es maestra guardamos el codigo de la plantilla para la comprobacion de mostrar slide en los casos de Smoothplay
        }


        slideWrapper.setAttribute("data-plantilla", plantilla.getCodigo());

        slideWrapper.setAttribute("data-tstamp", new Date().getTime());
        slideWrapper.setAttribute("data-date", new Date().toString());

        var capas = plantilla.getCapas();
        var tieneTv = false;
        var tieneStreaming = false;
        for (var i = 0; i < capas.length; i++) {
            if (capas[i] && capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_TV) tieneTv = true;
            if (capas[i] && capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_FUENTE_VIDEO) tieneTv = true;
            if (capas[i] && capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_STREAMING) {
                tieneStreaming = true;
                //Main.info.canPlay2Videos = false;
            }
        }
        if (!tieneStreaming && !tieneTv && !generandoParaMaestra && !slide.isGapless() && (!Main.getDivCustomVideoPlayer || !plantilla.hasVideo())) {
            /*
             * En estos casos, normalmente el video estará debajo del navegador, o de las capas
             * En LG gapless, el video va por debajo
             * En LG vertical, de momento no hay gapless y el video ahora va dentro de la capa.
             * En Samsung creo que el video iría debajo del navegador, pero habría que testearlo
             */

            slideWrapper.style.background = plantilla.getColorFondo();
        }


        slideWrapper.style.width = "100%"; // Para que se vea el fondo
        slideWrapper.style.height = "100%"; // Para que se vea el fondo
        slideWrapper.style.margin = 0;
        slideWrapper.style.padding = 0;

        return slideWrapper;



    }
    var _intercambioDivsSlidesTimeoutId = null;
    var _intercambioDivsMaestrasTimeoutId = null;
    var _precargaTimeoutId = null;
    var timeSincronizacionPresentador = 0;
    var _CurrentInsercion;
    return {

        getController: function() {
            return controller;
        },

        comenzarPresentacion: function() {
            console.log("PRESENTADOR: comenzamos presentación");
            if (!reproduciendoPresentacion) {

                var splash = document.getElementById("splash");
                if (splash) {
                    splash.parentElement.removeChild(splash);
                }

                reproduciendoPresentacion = true;
                pantallaApagada = false;
                Dnv.presentador.avanzarSlide(document.getElementById("wrapper"));
            }
        },

        detenerPresentacion: function() {
            console.log("PRESENTADOR: detenemos presentación");
            Dnv.presentador.detenerVideos();

            if (Dnv.cfg.getCfgBoolean("MedicionAudiencia_BigData", false)) Dnv.audiencia.resetCampaign();

            // Por si hay flashes con sonido, etc, tambien eliminamos los elementos
            document.getElementById("wrapper0").innerHTML = "";
            document.getElementById("wrapper1").innerHTML = "";
            document.getElementById("wrapperMaestro0").innerHTML = "";
            document.getElementById("wrapperMaestro1").innerHTML = "";
            VengoApagado = true;
            // while (maestro0.lastChild) { maestro0.removeChild(maestro0.lastChild); } // Solo deberia haber 1 child                    

            reproduciendoPresentacion = false;
        },
        pausarPresentacionPorApagado: function() {
            console.log("PRESENTADOR: pausamos la presentación porque han apagado la pantalla");
            Dnv.presentador.detenerVideos();

            Dnv.secuenciador.resetearEstado();

            // Por si hay flashes con sonido, etc, tambien eliminamos los elementos
            document.getElementById("wrapper0").innerHTML = "";
            document.getElementById("wrapper1").innerHTML = "";
            document.getElementById("wrapperMaestro0").innerHTML = "";
            document.getElementById("wrapperMaestro1").innerHTML = "";
            VengoApagado = true;
            // while (maestro0.lastChild) { maestro0.removeChild(maestro0.lastChild); } // Solo deberia haber 1 child                    

            Main.navegarApagado();

            //reproduciendoPresentacion = false;
            pantallaApagada = true;
        },
        continuarPresentacion: function() {
            console.log("PRESENTADOR: continuamos presentación");
            //reproduciendoPresentacion = false;

            if (!reproduciendoPresentacion || pantallaApagada) {
                reproduciendoPresentacion = true;
                pantallaApagada = false;
                Dnv.presentador.avanzarSlideDirectamente();
                VengoApagado = false;
                //Dnv.presentador.avanzarSlide(document.getElementById("wrapper"));
            }

            //Dnv.presentador.avanzarSlide(document.getElementById("wrapper"));
        },
        irAInicioPresentacion: function() {
            //reproduciendoPresentacion = false;
            Dnv.secuenciador.reiniciarCanal();
            Dnv.presentador.avanzarSlideDirectamente()
            //Dnv.presentador.avanzarSlide(document.getElementById("wrapper"));
        },

        /*
         * Qué este reproduciendo no implica que esté mostrando contenidos (puede que la pantalla esté apagada), 
         * solo que el presentador funciona.
         */
        isReproduciendo: function() {
            return reproduciendoPresentacion;
        },
        isPantallaApagada: function() {
            return pantallaApagada;
        },


        setReproduciendo: function(value) {
            reproduciendoPresentacion = value;
        },

        /*
         * Para cuando se detiene la presentacion, o se va a buscando contenidos
         */
        detenerVideos: function(value) {

            clearInterval(Dnv.helpers.checkPlayingVideo_interval);

            var slidesWrapper = document.getElementById("wrappers");

            var videos = slidesWrapper.getElementsByTagName("video");
            for (var i = 0; i < videos.length; i++) {
                if (videos[i].id != "gaplessVideo") {
                    console.log("PRESENTADOR: Deteniendo " + videos[i].getAttribute("data-filename-original") + " Pausando video");
                    videos[i].pause();
                } else if (videos[i].id == "gaplessVideo") {
                    console.log("PRESENTADOR: Deteniendo video gapless");
                    Dnv.gaplessVideo.stop();
                    //if (slide.isInicioGapless()) Dnv.gaplessVideo.recargarPlaylist(true);

                }
            }
            var divs = slidesWrapper.getElementsByTagName("div");
            for (var i = 0; i < divs.length; i++) {
                if (divs[i].isCustomVideoPlayer) {
                    console.log("PRESENTADOR: Custom Deteniendo " + divs[i].getAttribute("data-filename-original") + " Pausando custom video");
                    divs[i].pause();
                }
            }
        },

        setPreferirFlashAHtml5: function(value) {
            preferirFlashAHtml5 = value;
        },

        avanzarSlideDirectamente: function() {
            //Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), null, null);
            /*
            Necesitamos permitir que pueda haber avances frecuentes de slide. Por ejemplo:
            - Avance de plantilla, pero la nueva plantilla contiene errores, lo cual a su vez debe provocar un avance de plantilla hasta llegar a una que se pueda mostrar.
            - Hay un avance de plantilla y alguien toca para pasar a interactivo. Como el handler asume que ya ha pasado a interactivo, no vuelve a intentarlo. 
            Tiene que pasar el timeout de interactividad para volver al canal de reposo, o bien saltar el fin de la plantilla no interactiva actual.
            - Puede que tengan que repetir algunos comandos/macros de DenevaControl...

            if (new Date().getTime() >= lastAvanceTime + 1000) {
            Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), null, null, false, true, true, true, false);
            } else {
            console.warn("PRESENTADOR: No avanzamos slide directamente por exceso de llamadas");
            }
            */
            Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), null, null, false, true, true, true, false);
            //Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), null, null, false, true);
        },
        setCurrentInsercion: function(o) {
            try {
                console.log("PRESENTADOR: setteo current inserción" + o.getDenominacion());
                _CurrentInsercion = o;
            } catch (e) {
                console.log("PRESENTADOR: setteo current inserción");
            }

        },
        getCurrentWrapper: function() {
            if (!_currentWrapper) {
                console.log("[ENGINE] calculando wrapper");
                var wrapper0 = document.getElementById("wrapper0");
                var wrapper1 = document.getElementById("wrapper1");
                //var oculto, visible, idOculto, idVisible;
                if (Dnv._USAR_VISIBILITY) {
                    if (wrapper1.style.visibility == "hidden") {
                        _currentWrapper = wrapper0;
                        _currentSlideWrapper = document.getElementById("wrapper0_slideWrapper");
                    } else {
                        _currentWrapper = wrapper1;
                        _currentSlideWrapper = document.getElementById("wrapper1_slideWrapper");
                    }
                } else {
                    if (wrapper1.style.display == "none") {
                        _currentWrapper = wrapper0;
                        _currentSlideWrapper = document.getElementById("wrapper0_slideWrapper");

                    } else {
                        _currentWrapper = wrapper1;
                        _currentSlideWrapper = document.getElementById("wrapper1_slideWrapper");
                    }
                }
            }
            console.log("[ENGINE] getCurrentWrapper: " + (_currentWrapper ? _currentWrapper.id : _currentSlideWrapper));
            return _currentWrapper;
        },
        getCurrentIdCarga: function getCurrentIdCarga() {
            return id;
        },
        getCurrentInsercion: function () {
            return _CurrentInsercion;
        },
        setTimeSincronizacion: function setTimeSincronizacion(t) {
            timeSincronizacionPresentador = t;
        },
        getTimeSincronizacion: function() {
            return timeSincronizacionPresentador;
        },
        avanzarASlideSync: function(codSincronizacion, timeSincronizacion) {
            //Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), null, null);
            Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), null, null, false, true, {
                codSincronizacion: codSincronizacion,
                timeSincronizacion: timeSincronizacion
            });
        },

        avanzarSecuenciaSync: function(codSincronizacion, posicionSecuencia, timeSincronizacion) {
            //Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), null, null);
            var delayPlay = timeSincronizacion - new Date().getTime();
            console.info("SECUENCIADOR: Recibido mensaje para avanzar secuencia en " + delayPlay + " milisegundos a elemento " + posicionSecuencia);
            //setTimeout(function () {
            if (Dnv.secuenciador.getSlideActual() && Dnv.secuenciador.getSlideActual().getCodSincronizacion() == codSincronizacion) {
                //setTimeout(function () {
                if (document.getElementsByClassName("secuencia")[0]) {
                    document.getElementsByClassName("secuencia")[0].avanzar(true, posicionSecuencia);
                } else {
                    console.warn("SECUENCIADOR: No se ha avanzado elemento de la secuencia sync porque no existe");
                }
                //}, delayPlay);
            } else {
                console.warn("SECUENCIADOR: No se ha avanzado elemento de la secuencia sync porque no existe");
            }
            //}, 150);
        },


        isDisponible: function(codSlide, nivelInsercion, codInsercion) {
            if (!Dnv.sincronizacion.isMaestro && nivelInsercion && codInsercion) Dnv.Pl.lastPlaylist.getPlayer().getSalida().setInsercionSincro(nivelInsercion, codInsercion);
            var slide = Dnv.secuenciador.getSlideSincronizado(codSlide);
            if (slide && slide.isDisponible()) {
                return true;
            } else {
                return false;
            }
        },

        precargarNextSlide: function precargarNextSlide() {
            if (!Dnv._DO_PRECARGA) return; //FIXME
            console.log("Entra en precargar next slide");
            // TODO Mejorar esta comprobacion
            var futuroSlide = Dnv.secuenciador.peekNextSlide();
            if (!futuroSlide) {
                if (!Dnv.sincronizacion.isConectado()) {
                    console.warn("PRESENTADOR: No hay futuro slide");
                } else if (Dnv.sincronizacion.isMaestro()) {
                    console.warn("PRESENTADOR: No hay futuro slide");
                }
                return;
            }

            // FIXME: (!futuroSlide.isGapless() || futuroSlide.isInicioGapless()) es true para slides sin video
            if ((typeof Main !== "undefined") && Main.info && Main.info.canPlay2Videos === false) { // Si Main.info.canPlay2Videos está definido y es false

                var actual = Dnv.secuenciador.getSlideActual();
                if (futuroSlide.hasVideo() && actual.hasVideo()) {
                    // TODO, mejorar esto para precargar las capas del siguiente slide del bloque gapless
                    //if(futuroSlide.isGapless()

                    console.warn("PRESENTADOR: No podemos precargar un video mientras otro se reproduce"); // Al menos en samsung
                    return;
                }
                /*var capas = actual.getPlantilla().getCapas();
                for (var i = 0; i < capas.length; i++) {
                if (capas[i] && capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_VIDEO) {
                }
                }*/
            }
            //var futuroSlide = Dnv.secuenciador.peekNextSlide();
            console.log("El futuro slide es " + (futuroSlide ? futuroSlide.getCodigo() + " " + futuroSlide.getDenominacion() : futuroSlide));

            var proporciones = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getMetadatos()["Proporciones"];

            if (futuroSlide.isInicioGapless()) {

                _posicionarVideoGapless(futuroSlide, _currentSlideWrapper, proporciones);

                /*
                var posicion = futuroSlide.getPosicionVideosGapless();

                if (proporciones == PROPORCIONES.ESCALADO_ORIGINAL || !_currentSlideWrapper) {
                console.warn("No hay _currentSlideWrapper" + _currentSlideWrapper);
                Dnv.gaplessVideo.setPosicion(posicion.x, posicion.y, posicion.w, posicion.h);
                } else {
                console.warn("Hay _currentSlideWrapper" + _currentSlideWrapper.scrollWidth + "x" + _currentSlideWrapper.scrollHeight + " plantilla " + futuroSlide.getPlantilla().getAncho() + "x" + futuroSlide.getPlantilla().getAlto());
                //console.warn("plantilla" + _currentSlideWrapper.scrollWidth + "x" + _currentSlideWrapper.scrollHeight);
                var ratioHorizontal = _currentSlideWrapper.scrollWidth / futuroSlide.getPlantilla().getAncho();
                var ratioVertical = _currentSlideWrapper.scrollHeight / futuroSlide.getPlantilla().getAlto();
                Dnv.gaplessVideo.setPosicion(
                posicion.x * ratioHorizontal,
                posicion.y * ratioVertical,
                posicion.w * ratioHorizontal,
                posicion.h * ratioVertical);
                }*/

                Dnv.gaplessVideo.cargarPlaylist(futuroSlide.getVideosGapless(), false, futuroSlide.getVideosGaplessInLoop());
            } else if (!futuroSlide.isGapless()) {

                var precargaWrapper = getNotCurrentWrapper(); // wrapper0 o wrapper1
                var precargaSlideWrapper = document.getElementById((precargaWrapper.id == "wrapper0" ? "wrapper0_slideWrapper" : "wrapper1_slideWrapper"));
                if (precargaSlideWrapper && precargaSlideWrapper.parentElement === precargaWrapper) {
                    // Limpiamos el slidewrapper
                    for (var i = 0; i < precargaSlideWrapper.children.length; i++) {
                        /* TODO: No precargar si ya estaba...?
                        if (precargaSlideWrapper.children[i].getAttribute("data-slide") == slide.getCodigo()) {
                        encontrado = precargaSlideWrapper.children[i];
                        } else {
                        precargaSlideWrapper.removeChild(precargaSlideWrapper.children[i]);
                        i--;
                        }*/

                        var videoElements = precargaSlideWrapper.children[i].getElementsByTagName("video");
                        for (var j = 0; j < videoElements.length; j++) {
                            var videoElement = videoElements[j];
                            if (videoElement.isInsideCustomVideoPlayer && videoElement.parentElement.isCustomVideoPlayer) {
                                videoElement.parentElement.stop();
                            } else {
                                if (!videoElement.paused) videoElement.pause();
                            }
                        }
                        precargaSlideWrapper.removeChild(precargaSlideWrapper.children[i]);
                        i--;
                    }
                    precargaWrapper.removeChild(precargaSlideWrapper);
                }


                var div = _generateSlideWrapper(futuroSlide, futuroSlide.getPlantilla(), false); // wrapper de la plantilla
                if (precargaWrapper && div) {
                    precargaWrapper.appendChild(div);
                }
                div.setAttribute("data-deprecarga", "si");

                // Evitar que se acumulen precargas que no se usen (p.ej. por cambios de canal o variables)
                videosPrecargados = {};
                var capas = futuroSlide.getPlantilla().getCapas(futuroSlide.getCodigo());
                for (var i = 0; i < capas.length; i++) {
                    if (capas[i] && capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_VIDEO) {
                        /*
                        for (var k in videosPrecargados) {
                        if (videosPrecargados.hasOwnProperty(k)) {
                        console.log("Videos precargado capa " + k);
                        }
                        }
                        */

                        var capa = capas[i];
                        var recurso = capa.getRecurso();
                        var opciones = {
                            videoAutoplay: false,
                            syncVideo: futuroSlide.isSincronizado(),
                            isPrecarga: true
                        };
                        if (recurso.getMimeType && recurso.getMimeType() !== undefined) {
                            // En principio serán streamings de webOS
                            opciones.mimeType = recurso.getMimeType();
                        }
                        console.log("PRESENTADOR: precargando video " + recurso.getFilename());
                        var onErrorPrecarga = function(e) {
                            console.log("PRESENTADOR: Error en precarga de video " + e);
                            //Main._error = e;
                            delete videosPrecargados[capa.getCodigo()];
                            videosPrecargados = {};
                        }
                        var onEnded = function() { console.log("PRESENTADOR: He acabado el video sin nextSlide No.SSP."); };
                        videosPrecargados[capa.getCodigo()] = getRecursoSimpleElement(futuroSlide.getPlantilla(), capa, recurso, proporciones, undefined, onErrorPrecarga, opciones, null, true);

                        if (precargaWrapper && div) {
                            var videoPrecargado = videosPrecargados[capa.getCodigo()];

                            div.appendChild(videoPrecargado);
                            //if (videoPrecargado.onAttachedToDOM) videoPrecargado.onAttachedToDOM();
                        }
                        //revisar 2.21
                        videosPrecargados[capa.getCodigo()].load();
                    }


                }
            }
        },
        mostrarSlide: function(slideWrapper, plantilla, slide, wrapper, tieneMaestra) {

            //RAG: si la plantilla es maestra, el objeto slide en realidad es el de la contenida
            //(porque buscamos la plantilla directamente, no el slide).  cambiar??

            if (cachePlantillas[plantilla.getCodigo()] !== undefined) {
                slideWrapper = cachePlantillas[plantilla.getCodigo()];
                console.log("PRESENTADOR: La plantilla " + plantilla.getCodigo() + " estaba cacheada");

                // Iniciamos los videos y secuencias de la plantilla cacheada

                var videos = slideWrapper.getElementsByTagName("video");
                for (var i = 0; i < videos.length; i++) {
                    //videos[i].currentTime = 0;
                    console.log("PRESENTADOR: Hacemos play en " + videos[i].src + " (" + videos[i].getAttribute("data-filename-original") + ") en " + videos[i].currentTime + " (mostrando plantilla cacheada)");
                    videos[i].play();
                    //videos[i].volume = 1.0;
                }


                var videos = slideWrapper.getElementsByTagName("div");
                for (var i = 0; i < videos.length; i++) {
                    //videos[i].currentTime = 0;
                    if (videos[i].isCustomVideoPlayer) {
                        console.log("PRESENTADOR: Hacemos play en customplayer (" + videos[i].getAttribute("data-filename-original") + ")  (mostrando plantilla cacheada)");
                        videos[i].play();
                    }
                }

                var secuencias = slideWrapper.getElementsByClassName("secuencia");
                for (var i = 0; i < secuencias.length; i++) {
                    //secuencias[i].reset();
                    //secuencias[i].comenzar();
                    secuencias[i].avanzar(true);
                }


            } else {
                //console.log("PRESENTADOR: La plantilla "+plantilla.getCodigo()+" no estaba cacheada");
                var pl = Dnv.Pl.lastPlaylist;
                var salida = pl.getPlayer().getSalida();
                var proporciones = salida.getMetadatos()["Proporciones"];

                // Buscamos si ya habia un slideWrapper generado porque habiamos precargado el slide
                var ncsw;
                if (tieneMaestra) {
                    ncsw = getNotCurrentWrapperMaestro();
                } else {
                    ncsw = getNotCurrentWrapper();
                }
                var encontrado = null;
                if (ncsw) {
                    for (var i = 0; i < ncsw.children.length; i++) {
                        if (ncsw.children[i].getAttribute("data-slide") == slide.getCodigo() /* Si es un slide normal*/ || ncsw.children[i].getAttribute("data-slide") == plantilla.getCodigo() /* Si es una plantilla maestra*/) {
                            encontrado = ncsw.children[i];
                        } else {
                            ncsw.removeChild(ncsw.children[i]);
                            i--;
                        }
                    }
                }

                if (encontrado === null) {
                    slideWrapper = _generateSlideWrapper(slide, plantilla, tieneMaestra);
                    slideWrapper.setAttribute("data-mostrargenerado", "true");
                } else {
                    slideWrapper = encontrado;
                    slideWrapper.setAttribute("data-mostrarreutilizado", "true");
                }
                slideWrapper.setAttribute("data-mostrarDate", new Date().toString());

                /*
                var getHtmlSecuencia = function getHtmlSecuencia(capa, recurso) {
                var indiceSecuencia = -1;
                var secuenciasRecursos = recurso.getSecuenciasRecursos();
                    
                var elemento = document.createElement("div");
                    
                //for()
                    
                    
                indiceSecuencia++; ...// TODO: continuar
                    
                }
                var onFinSecuenciaRecurso = function onFinSecuenciaRecurso(idPagina, relojMaestro) {
                    
                if (relojMaestro && indiceSecuencia == max) {
                Dnv.presentador.avanzarSlide(wrapper, id);
                return;
                }
                    
                avanzar ...// TODO: continuar
                }
                */
                var capas = plantilla.getCapas(slide.getCodigo());
                var contieneRelojMaestro = false;

                var slideWrapperTemp1 = slideWrapper.innerHTML;
                var sliderWrapperTemp2Element = document.createElement("div");


                for (var i = 0; i < capas.length; i++) {
                    var capa = capas[i];
                    var recurso = capa.getRecurso();

                    if ((!Dnv.utiles.soportaFlash() || !preferirFlashAHtml5 || !recurso) && capa.getRecursoHtml5()) {
                        recurso = capa.getRecursoHtml5();
                    }


                    /*var style = " style='margin: 0; padding: 0; position: absolute; " +
                    "top: " + capa.getPosY()+"px; left: "+capa.getPosX()+"px; " +
                    "width: " +capa.getAncho()+"px; height: "+capa.getAlto()+"px; " +
                    "z-index: "+capa.getZIndex()+"' ";*/


                    /*
                     * Refactorizar la generacion de HTML
                     *
                     *
                     * Para secuencias:
                     *   - Sacar el HTML de cada recurso de la secuencia, en lugar de tener solo 3 tipos de elementos, para el cacheo
                     *   - Definir timeouts que tengan en cuenta el id de pagina
                     *   - Permitir el reseteo de todos los videos de la secuencia...
                     *   
                     * Quizas algun sistema de eventos con onSlideStart/onSlideEnd
                     * 
                     */


                    var elemento;
                    if (capa.getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {

                        // TODO REVISAR, estamos usando "elemento" (pero no evaluando) antes de darle valor
                        elemento = getSecuenciaElement(slide, plantilla, capa,
                            plantilla.isAlternada(), proporciones,
                            (function(pagId) { return function() { return pagId; } })(id),
                            (function(id) {
                                return function onEndedCallback() {
                                    console.log("PRESENTADOR: La secuencia pide avanzar página desde " + id);
                                    if (tieneMaestra) console.warn("PRESENTADOR: La secuencia de la plantilla maestra ha llamado a onEndedCallback"); // ¿? Una plantilla maestra no acaba
                                    //Dnv.presentador.avanzarSlideDirectamente();
                                    Dnv.presentador.avanzarSlide(wrapper, id, elemento, true);
                                };
                            })(id),
                            (function(id) {
                                return function onErrorCallback(e) {
                                    if (cachePlantillas[plantilla.getCodigo()]) delete cachePlantillas[plantilla.getCodigo()];
                                    if (!tieneMaestra) {
                                        console.error("PRESENTADOR: Intentando avance de página debido a un error en la página " + id + " elemento " + elemento + " error " + e + " msg " + e.message + " lineno " + e.lineno);
                                        Dnv.presentador.avanzarSlide(wrapper, id, elemento);
                                    } else {
                                        console.error("PRESENTADOR: Intentando avance de página hasta una plantilla con distinta maestra debido a un error en la página " + id + " elemento " + elemento + " error " + e + " msg " + e.message + " lineno " + e.lineno);
                                        Dnv.secuenciador.currentMaestra = null;
                                        // anteriorSlide = null;
                                        Dnv.presentador.avanzarSlide(wrapper, id, elemento, true);
                                    }
                                };
                            })(id)
                        );
                        //elemento.reset();
                        //elemento.comenzar();
                        if (Dnv.sincronizacion.isConectado()) {
                            if (Dnv.sincronizacion.isMaestro()) {
                                elemento.avanzar(true);
                            }
                        } else {
                            elemento.avanzar(true);
                        }
                    } else if (capa.getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_VIDEO && slide.isGapless()) {
                        /*
                         * Casos:
                         * Comienzo de conjunto de videos gapless...
                         *  Habria que hacer una precarga en algún punto
                         * Avance de plantilla con video gapless parte de un conjunto uqe ya ha empezado
                         *  No hacemos nada
                         */

                        /*
                         * Placeholder para las validaciones que hacemos para avanzar de pagina (comprobamos si el elemento que causo el error sigue en el dom)
                         */
                        elemento = document.createElement("div"); // TODO: borrar cuando cambiemos como detectamos que el video gapless es el remitente de los avances de pagina
                        elemento.id = "placeholderGapless";

                        var onEndedCallback = (function(id) {
                            return function onEndedCallback() {
                                console.log("PRESENTADOR: El elemento pide avanzar página desde " + id);
                                if (tieneMaestra) console.warn("PRESENTADOR: La plantilla maestra ha llamado a onEndedCallback"); // ¿? Una plantilla maestra no acaba
                                Dnv.presentador.avanzarSlide(wrapper, id, elemento);
                            };
                        })(id);

                        var onErrorCallback = (function(id) {
                            /*
                            FIXME: Avanzar hasta el siguiente slide no gapless... si todo es gapless, reiniciar la reproduccion


                            */


                            return function onErrorCallback(msg) {

                                // ignoramos el id
                                //Main._error = e; // FIXME: BORRAME
                                if (cachePlantillas[plantilla.getCodigo()]) delete cachePlantillas[plantilla.getCodigo()];
                                if (!tieneMaestra) {
                                    console.error("PRESENTADOR: Intentando avance de página debido a un error en la reproducción de un video gapless.");
                                    Dnv.presentador.avanzarSlide(wrapper, null, elemento, false, true);
                                } else {
                                    console.error("PRESENTADOR: Intentando avance de página debido a un error en la reproducción de un video gapless");
                                    Dnv.presentador.avanzarSlide(wrapper, null, elemento, true, true);
                                }
                            };
                        })(id);


                        Dnv.gaplessVideo.setOnFinDeVideoCallback(onEndedCallback);
                        Dnv.gaplessVideo.setOnFinDePlaylistCallback(onEndedCallback);
                        Dnv.gaplessVideo.setOnErrorCallback(onErrorCallback);
                        if (slide.isInicioGapless()) {
                            var playlistCargada = Dnv.gaplessVideo.getPlaylistCargada();

                            // Esto se ejecuta en el mostrar Slide, que va antes de intercambiarslides... 
                            if (!playlistCargada || playlistCargada !== slide.getVideosGapless()) {
                                // Habrá unos segundos de carga antes de que empiece a reproducir, en los que saldrá mal la capa
                                //var posicion = slide.getPosicionVideosGapless();
                                _posicionarVideoGapless(slide, _currentSlideWrapper, proporciones); // FIXME: fix rapido, revisar
                                //Dnv.gaplessVideo.setPosicion(posicion.x, posicion.y, posicion.w, posicion.h);

                                Dnv.gaplessVideo.cargarPlaylist(slide.getVideosGapless(), true, slide.getVideosGaplessInLoop());
                            } else {
                                //cargarPlaylist
                                //var posicion = slide.getPosicionVideosGapless();
                                //Dnv.gaplessVideo.setPosicion(posicion.x, posicion.y, posicion.w, posicion.h);

                                Dnv.gaplessVideo.play();
                            }

                        } else if (slide.isGapless()) {
                            //var posicion = slide.getPosicionVideosGapless();
                            _posicionarVideoGapless(slide, _currentSlideWrapper, proporciones); // FIXME: fix rapido, revisar
                            //Dnv.gaplessVideo.setPosicion(posicion.x, posicion.y, posicion.w, posicion.h);
                        }


                    } else {

                        var onEndedCallback = (function(id) {
                            return function onEndedCallback() {
                                console.info("PRESENTADOR: El elemento pide avanzar página desde " + id);
                                if (tieneMaestra) console.warn("PRESENTADOR: La plantilla maestra ha llamado a onEndedCallback"); // ¿? Una plantilla maestra no acaba
                                Dnv.presentador.avanzarSlide(wrapper, id, elemento);
                            };
                        })(id);
                        var onErrorCallback = (function(id) {
                            return function onErrorCallback(e) {

                                //Main._error = e; // FIXME: BORRAME
                                if (cachePlantillas[plantilla.getCodigo()]) delete cachePlantillas[plantilla.getCodigo()];
                                if (!tieneMaestra) {
                                    console.error("PRESENTADOR: Intentando avance de página debido a un error en la página " + id + " elemento " + elemento + " error " + e + " msg " + e.message + " lineno " + e.lineno);
                                    Dnv.presentador.avanzarSlide(wrapper, id, elemento);
                                } else {
                                    console.error("PRESENTADOR: Intentando avance de página hasta una plantilla con distinta maestra debido a un error en la página " + id + " elemento " + elemento + " error " + e + " msg " + e.message + " lineno " + e.lineno);
                                    // anteriorSlide = null;
                                    Dnv.presentador.avanzarSlide(wrapper, id, elemento, true);
                                }
                            };
                        })(id);

                        var videoPrecargado = videosPrecargados[capa.getCodigo()];

                        if (videoPrecargado) console.log(videoPrecargado.getAttribute("data-filename-original") + " " + videoPrecargado.isCustomVideoPlayer + " " + videoPrecargado.networkState + " " + videoPrecargado.readyState);
                        if (videoPrecargado && (videoPrecargado.isCustomVideoPlayer || videoPrecargado.readyState == HTMLMediaElement.HAVE_ENOUGH_DATA)) {
                            // En LG a veces se queda en HAVE_FUTURE_DATA y no llega a HAVE_ENOUGH_DATA, no pudiendo reproducir

                            //elemento = videosPrecargados[capa.getCodigo()];
                            elemento = null; // No lo reañadimos puesto que ya está en el wrapper de la futura plantulla
                            if (capa.getRecurso() !== null) {
                                console.log("PRESENTADOR: El video " + capa.getRecurso().getFilename() + " de la capa " + capa.getCodigo() + " está precargado");
                            } else {
                                console.log("PRESENTADOR: El video  de la capa " + capa.getCodigo() + " está precargado");
                            }


                            if (videoPrecargado.isCustomVideoPlayer) {
                                console.log("Video en " + videoPrecargado.currentTime() + ": " + videoPrecargado.outerHTML);
                            } else {
                                console.log("Video en " + videoPrecargado.currentTime + ": " + videoPrecargado.outerHTML);
                            }

                            salida.resetLoopInserciones();

                            delete videosPrecargados[capa.getCodigo()];
                            /**
                            if (capa.isRelojMaestro()) { // Precargar NextSlide no tiene acceso a onEndedCallback... habría que buscar una forma mejor de hacer esto...
                            elemento.addEventListener("ended", function () {
                            console.log("El video " + elemento.src + " acabo su reproducción");
                            onEndedCallback();
                            //Dnv.presentador.avanzarSlide(wrapper, id);
                            }, false);
                            }
                            **/
                            /**
                            var errHandler = function (e) { // Solo da error la primera vez? entonces habria que descartar el objeto...

                            //Main._error = e; // FIXME: BORRAME
                            var videoSrc = elemento.getAttribute("data-filename-original") || elemento.src || elemento.outerHTML;
                            console.error("Ocurrió un error con el video " + elemento + " " + videoSrc + ": " + e.message + " " + e.error);
                            console.dir(e);
                            if (onErrorCallback) onErrorCallback(e);
                            //Dnv.presentador.avanzarSlide(wrapper, id);
                            };
                            
                            elemento.onError = errHandler;
                            **/

                            //elemento.play(); // El precargado no lleva autoplay El play() ya se hace abajo si no hay autoplay
                            //console.log("PRESENTADOR: "+elemento.getAttribute("data-filename-original")+" Hacemos play del video precargado");
                        } else {
                            if (capa.getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_VIDEO) {
                                console.info("PRESENTADOR: El video " + capa.getRecurso().getFilename() + " de la capa " + capa.getCodigo() + " no está precargado");
                            }

                            var opciones = {
                                videoAutoplay: !slide.isSincronizado(),
                                syncVideo: slide.isSincronizado()
                            };
                            console.log(".SSP. Obtengo recurso para videos."); // <- ¿¿¿¿???? Esto es codigo comun, no de SSP! Y no solo es para videos, sino para todo tipo de recurso
                            elemento = getRecursoSimpleElement(plantilla, capa, recurso, proporciones, onEndedCallback, onErrorCallback, opciones, slide);
                            if (elemento !== undefined && elemento !== null) {
                                console.log(".SSP. Obtengo recurso para videos SRC " + elemento.src);
                            } else {
                                console.error(".SSP. Engine Me ha devuelto null el elemento al obtener getRecursoSimpleElement para la plantilla" + plantilla.getDenominacion());
                            }

                        }

                    }
                    if (elemento !== null) {
                        if (tieneMaestra) {
                            sliderWrapperTemp2Element.appendChild(elemento);
                            //RDF. Si tenemos una plantilla maestra que no tiene reloj maestro, ponemos el video en bucle.
                            if (!capa.isRelojMaestro()) {
                                var videos = sliderWrapperTemp2Element.getElementsByTagName("video");
                                for (var l = 0; l < videos.length; l++) {
                                    videos[l].loop = true;
                                }
                            }

                        } else {
                            var videos = slideWrapper.getElementsByTagName("video");
                            var rt = false;
                            for (var l = 0; l < videos.length; l++) {
                                console.log(".SSP. PRESENTADOR --> videos precargados SRC -->" + videos[l].src + " video a añadir src-->" + elemento.src);
                                if (videos[l].src == elemento.src) {
                                    console.log("Engine .SSP. No agrego video porque ya le tengo video-->" + videos[l].src + "| elemento" + elemento.src);
                                    rt = true;
                                }
                            }
                            if (!rt) {
                                console.log("Engine .SSP. Agrego video--> elemento" + elemento.src);
                                slideWrapper.appendChild(elemento);
                            } else {
                                console.log("PRESENTADOR: Ya tenía el mismo video agregado" + elemento.src);
                            }

                        }


                        if (capa.isRelojMaestro()) {
                            contieneRelojMaestro = true;
                        }
                    }
                }
                if (sliderWrapperTemp2Element.innerHTML !== slideWrapperTemp1 && tieneMaestra) {
                    slideWrapper.innerHTML = sliderWrapperTemp2Element.innerHTML;
                }
                /*
                 * FIXME: BORRAME? de momento quito la cache, porque hay que buscar un modo de invalidar los callbacks
                 * además, si la misma plantilla se esta reproduciendo una y otra vez y se reemplaza el id de los callbacks,
                 * se puede ejecutar un callback antiguo cuando ya se ha recargado la plantilla y por tanto tiene un id nuevo.
                 */
                //cachePlantillas[plantilla.getCodigo()] = slideWrapper; // TODO: ¿no cachear flashes?
                /**/
            }
            if (document.getElementById("plantilla")) {
                document.getElementById("plantilla").innerHTML = slideWrapper.getAttribute("data-slide-denominacion");
            }


            return slideWrapper;

        },

        //----------------------------
        intercambiarDivs: function(slideWrapper, slide, wrapper, codMaestra, anteriorSlide, idCarga, VengoApagado) { //Si vengo de apagado para forzar la plantilla maestra.
            // FIXME: Pendiente, a la hora de hacre transiciones  reproducir, comprobar si las maestras reproducen video y mirar si se pueden hacer transiciones

            // Si slideWrapper === undefined, esta llamada corresponde a un intercambio de maestras en el que no hay maestra
            var intercambiandoMaestras = (codMaestra > 0); // || slideWrapper === undefined);

            var wrapperName;
            if (intercambiandoMaestras) { //es maestra
                wrapperName = "wrapperMaestro";
            } else {
                wrapperName = "wrapper";
            }
            //Dnv.helpers.sonPlantillasEquivalentes
            if (intercambiandoMaestras && anteriorSlide && Dnv.helpers.getMaestra(anteriorSlide) == codMaestra && VengoApagado == false) { //Si no vengo de apagado salimos ya que se está mostrando.
                console.log("PRESENTADOR: la maestra " + codMaestra + " ya se está mostrando, salimos");
                return;
            }

            var wrapper0 = document.getElementById(wrapperName + "0");
            var wrapper1 = document.getElementById(wrapperName + "1");
            var oculto, visible, idOculto, idVisible;


            if (intercambiandoMaestras) {
                visible = getCurrentWrapperMaestro();
                idVisible = visible.id;
                oculto = getNotCurrentWrapperMaestro();
                idOculto = oculto.id;
            } else {
                visible = getCurrentWrapper();
                idVisible = visible.id;
                oculto = getNotCurrentWrapper();
                idOculto = oculto.id;
            }
            /*if (!intercambiandoMaestras && ((Dnv._USAR_VISIBILITY && wrapper1.style.visibility == "hidden") || ((!Dnv._USAR_VISIBILITY) && wrapper1.style.display == "none")) || intercambiandoMaestras && wrapper1.activo) {
                visible = wrapper0;
                idVisible = wrapperName + "0";
                oculto = wrapper1;
                idOculto = wrapperName + "1";
            } else {
                visible = wrapper1;
                idVisible = wrapperName + "1";
                oculto = wrapper0;
                idOculto = wrapperName + "0";
            }*/
            console.log("visible " + visible.id + " oculto " + oculto.id + " g " + (getCurrentWrapper() ? getCurrentWrapper().id : getCurrentWrapper()));


            // TODO: Revisar con maestras
            //var doTransition = true;
            //var doTransition = true;
            var doTransition = false;
            if (!Dnv._OPACITY_ENABLED) doTransition = false;
            if ((typeof Main !== 'undefined') && Main.info && Main.info.canPlay2Videos === false) {
                if (anteriorSlide && slide.hasVideo() && anteriorSlide.hasVideo()) {
                    // Deshabilitar transiciones si puede haber dos videos a la vez durante la transicion
                    doTransition = false;
                }
            }

            if (doTransition) {
                console.log("PRESENTADOR: Hacemos transición desde " + visible.id + " | op " + visible.style.opacity + " | d " + visible.style.display + " y " + oculto.id + " | op " + oculto.style.opacity + " | d " + oculto.style.display);
                visible.style.transition = "opacity " + Dnv._OPACITY_DURATION;
                oculto.style.transition = "opacity " + Dnv._OPACITY_DURATION;
            } else {
                console.log("PRESENTADOR: NO hacemos transición desde " + visible.id + " | op " + visible.style.opacity + " | d " + visible.style.display + " | v " + visible.style.visibility + " y " + oculto.id + " | op " + oculto.style.opacity + " | d " + oculto.style.display + " | v " + oculto.style.visibility);
                visible.style.transition = "";
                oculto.style.transition = "";
            }


            //todo: quitar de aquí y comprobar si ya está que no se recargue            
            if (slideWrapper == undefined) {
                //borramos el contenido de la maestra.
                console.log("No tiene Maestra, borramos el contenido");

                Dnv.secuenciador.currentMaestra = 0;

                var maestro0 = document.getElementById("wrapperMaestro0");
                var maestro1 = document.getElementById("wrapperMaestro1");

                var detenerCustomVideoPlayers = function detenerCustomVideoPlayers(elementoPadre) {

                    var divs = elementoPadre.getElementsByTagName("div");
                    for (var i = 0; i < divs.length; i++) {
                        if (divs[i].isCustomVideoPlayer) {
                            console.log("Deteniendo " + divs[i]);
                            divs[i].stop();
                        } else {
                            console.log("No es custom player");
                        }
                    }
                };

                //if (anteriorSlide && anteriorSlide.getPlantilla().getMaestra() != 0 && anteriorSlide.getPlantilla().getMaestra() != codMaestra) {// && doTransition) {

                if (doTransition) { // todo: modificar cómo se calcula doTransition
                    /*
                     * El callback de fin de transicion y el soporte de abortar transicion se define en el init()
                     */
                    console.log("Haciendo transicion de maestras");
                    // TODO: Soporte de abortar transiciones?
                    if (maestro0.activo) {
                        //if (maestro0.style.display == "block") {

                        detenerCustomVideoPlayers(maestro0);

                        maestro0.style.transition = "opacity " + Dnv._OPACITY_DURATION;
                        maestro0.onTransitionStart("opacity", Dnv._OPACITY_OCULTO);
                        maestro0.style.opacity = Dnv._OPACITY_OCULTO;


                        /*maestro0.addEventListener("transitionend", function onTransitionEnd(evt, param1) {
                        if (evt.srcElement.style.opacity == 0) {
                        evt.srcElement.style.display = "none";
                        evt.srcElement.innerHTML = "";
                        if (evt.srcElement.cbTransitionEnd) evt.srcElement.cbTransitionEnd();
                        }
                        console.log("PRESENTADOR: ||||||||||||Maestras - OnTransitionEnd " + evt.srcElement.id + " " + evt.propertyName + "=" + evt.srcElement.style[evt.propertyName] + " durante " + evt.elapsedTime + " secs " + (evt.srcElement.children[0] ? evt.srcElement.children[0].getAttribute("data-slide-denominacion") : ""));
                        }, false);*/
                    }

                    if (maestro1.activo) {
                        //if (maestro1.style.display == "block") {

                        detenerCustomVideoPlayers(maestro1);

                        maestro1.style.transition = "opacity " + Dnv._OPACITY_DURATION;
                        maestro1.onTransitionStart("opacity", Dnv._OPACITY_OCULTO);
                        maestro1.style.opacity = Dnv._OPACITY_OCULTO;
                        /*maestro1.addEventListener("transitionend", function onTransitionEnd(evt, param1) {
                        if (evt.srcElement.style.opacity == 0) {
                        evt.srcElement.style.display = "none";
                        evt.srcElement.innerHTML = "";
                        if (evt.srcElement.cbTransitionEnd) evt.srcElement.cbTransitionEnd();
                        }
                        console.log("PRESENTADOR: ||||||||||||Maestras - OnTransitionEnd " + evt.srcElement.id + " " + evt.propertyName + "=" + evt.srcElement.style[evt.propertyName] + " durante " + evt.elapsedTime + " secs " + (evt.srcElement.children[0] ? evt.srcElement.children[0].getAttribute("data-slide-denominacion") : ""));
                        }, false);*/
                    }

                } else {
                    detenerCustomVideoPlayers(maestro0);
                    while (maestro0.lastChild) {
                        var iframes = maestro0.lastChild.getElementsByTagName("iframe");
                        for (var ifr = 0; ifr < iframes.length; ifr++) {
                            iframes[ifr].src = "about:blank";
                            iframes[ifr].parentNode.removeChild(iframes[ifr]);
                        }
                        maestro0.removeChild(maestro0.lastChild);
                    } // Solo deberia haber 1 child                    
                    detenerCustomVideoPlayers(maestro1);
                    while (maestro1.lastChild) {
                        var iframes = maestro1.lastChild.getElementsByTagName("iframe");
                        for (var ifr = 0; ifr < iframes.length; ifr++) {
                            iframes[ifr].src = "about:blank";
                            iframes[ifr].parentNode.removeChild(iframes[ifr]);
                        }
                        maestro1.removeChild(maestro1.lastChild);
                    } // Solo deberia haber 1 child
                    if (maestro0.activo) {
                        if (Dnv._USAR_VISIBILITY) {
                            maestro1.style.visibility = "hidden"; // porque está vacio
                            maestro0.style.visibility = "hidden";
                        } else {
                            maestro1.style.display = "none"; // porque está vacio
                            maestro0.style.display = "none";
                        }
                        maestro1.activo = true;
                        maestro0.activo = false;
                    } else {
                        if (Dnv._USAR_VISIBILITY) {
                            maestro1.style.visibility = "hidden";
                            maestro0.style.visibility = "hidden"; // porque está vacio
                        } else {
                            maestro1.style.display = "none";
                            maestro0.style.display = "none"; // porque está vacio
                        }
                        maestro0.activo = true;
                        maestro1.activo = false;
                    }
                }
                return;
            }

            console.log(" ||||||||||||||  codMaestra: " + codMaestra + " : currentMaestra:" + Dnv.secuenciador.currentMaestra);
            if (intercambiandoMaestras /*codMaestra > 0*/ && Dnv.secuenciador.currentMaestra == codMaestra && VengoApagado == false) { //XAS Misma comprobación de arriba, no entiendo porque hay 2 de estas.
                console.log("la Maestra ya está cargada, no refrescamos plantilla.");
                return;
            }



            if (!intercambiandoMaestras) setCurrentWrapper(oculto);

            slideWrapper.id = idOculto + "_slideWrapper";
            //slideWrapper.style.background = "transparent";
            //slideWrapper.innerHTML = "<div style='color:red;padding-top: 100px;height:2em;width:12em;background: transparent; font-size:large;'>"+idOculto+"mostrando</div>";
            var oldSlideWrapper = document.getElementById(idVisible + "_slideWrapper");
            //if(oldSlideWrapper) oldSlideWrapper.innerHTML = "<div style='color:green;background: transparent; height:2em;width:12em; font-size:large;'>"+idVisible+"ocultando</div>";
            //wrapper = document.getElementById("wrapper"); // WTF, esto no deberia hacer falta
            if (oldSlideWrapper) console.log("PRESENTADOR: Cambiar " + idVisible + oldSlideWrapper.getAttribute("data-slide-denominacion") + " desde op " + visible.style.opacity + " por " + idOculto + slideWrapper.getAttribute("data-slide-denominacion") + " desde op " + oculto.style.opacity);

            var cbOnMostrar = undefined;

            if (oldSlideWrapper) {

                var anadir = true;
                for (var i = 0; i < oculto.children.length; i++) {
                    if (oculto.children[i] === slideWrapper) {
                        anadir = false;
                    } else {
                        oculto.removeChild(oculto.children[i]);
                        i--;
                    }
                }
                if (anadir) oculto.appendChild(slideWrapper);


                var descripcion = "";
                if (slideWrapper.id) descripcion += (" id=" + slideWrapper.id);
                if (slideWrapper.src) descripcion += (" src=" + slideWrapper.src);
                if (slideWrapper.getAttribute("data-plantilla")) descripcion += (" plantilla=" + slideWrapper.getAttribute("data-plantilla"));
                if (slideWrapper.getAttribute("data-filename-original")) descripcion += (" filename=" + slideWrapper.getAttribute("data-filename-original"));

                console.log("PRESENTADOR: Mostrando " + oculto.id + " " + descripcion);

                cbOnMostrar = function() {



                    var elms = oldSlideWrapper.childNodes;
                    for (var i = 0; i < elms.length; i++) {
                        //elms[i].removeEventListener("timeupdate", Dnv.helpers.checkPlayingVideo);
                        elms[i].removeEventListener("error", Dnv.helpers.error);
                        $(elms[i]).off();
                        if (elms[i].onOcultar) elms[i].onOcultar();
                    }

                    var elms = slideWrapper.childNodes;
                    for (var i = 0; i < elms.length; i++) {
                        if (elms[i].onMostrar) {
                            //console.log("PRESENTADOR: "+elms[i].tagName+" tiene onMostrar");
                            elms[i].onMostrar();
                        } else {
                            //console.log("PRESENTADOR: "+elms[i].tagName+" no tiene onMostrar");
                        }
                    }


                    // Paramos los videos y demas...
                    // Videos HTML5 de la vieja plantilla
                    var videos = oldSlideWrapper.getElementsByTagName("video");
                    console.log("La plantilla vieja tenia " + videos.length + " videos");
                    for (var i = 0; i < videos.length; i++) {
                        console.log("PRESENTADOR: Pausa " + videos[i].src + " " + videos[i].getAttribute("data-filename-original"));
                        if (!videos[i].paused) videos[i].pause();

                        /**
                        if (controller) {
                        controller.pause();
                        controller.removeAllMediaElement();
                        }
                        **/

                        videos[i].autoplay = false;
                        videos[i].preload = "none";
                        console.log("PRESENTADOR: src de " + videos[i].src + " " + videos[i].getAttribute("data-filename-original") + " a vacio");
                        videos[i].removeEventListener("error", Dnv.helpers.error);
                        if (Main.info.engine == "TOSHIBA") {
                            if (!controller) videos[i].src = "";
                        }
                        //videos[i].src = "";
                        //videos[i].src = "";
                        videos[i].volume = 0;
                        //videos[i].parentNode.removeChild(videos[i]);
                        //videos[i].src = "";
                        //videos[i].load();
                        /*if (videos[i].readyState !== HTMLMediaElement.HAVE_NOTHING) {
                        console.log("PRESENTADOR: Video " + videos[i].src + " (" + videos[i].getAttribute("data-filename-original") + ") parado en " + videos[i].currentTime);
                        videos[i].currentTime = 0;
                        //videos[i].load(); /// TODO: solo para cacheados
                        }*/
                    }

                    if (anteriorSlide && anteriorSlide.isGapless() && !slide.isGapless()) {
                        //Dnv.gaplessVideo.pause();
                        Dnv.gaplessVideo.stop();
                    }

                    // Videos "nativos" de la vieja plantilla
                    var divs = oldSlideWrapper.getElementsByTagName("div");
                    var customVideos = [];
                    for (var i = 0; i < divs.length; i++) {
                        if (divs[i].isCustomVideoPlayer) {
                            customVideos.push(divs[i]);
                            divs[i].stop();
                        }
                    }
                    console.log("La plantilla vieja tenia " + customVideos.length + " (custom) videos");

                    try {
                        var iframes = oldSlideWrapper.getElementsByTagName("iframe");
                        for (var ifr = 0; ifr < iframes.length; ifr++) {
                            iframes[ifr].src = "about:blank";
                            iframes[ifr].parentNode.removeChild(iframes[ifr]);
                        }
                        oldSlideWrapper.parentNode.removeChild(oldSlideWrapper);
                    } catch (e) { }

                    // Videos HTML5 de la nueva plantilla
                    // Hemos quitado el autoplay, asi que arrancamos a mano
                    var videos = slideWrapper.getElementsByTagName("video");
                    for (var i = 0; i < videos.length; i++) {

                        if (idCarga !== id) {
                            console.warn("PRESENTADOR: ignoramos plays en timeout hecho para la pagina " + idCarga + " porque estamos en " + id);
                            return;
                        }

                        //if (!videos[i].autoplay) {
                        console.log(videos[i].getAttribute("data-filename-original") + " " + videos[i].readyState);
                        if (!videos[i].syncVideo) {
                            if (videos[i].paused) {
                                // En los dispositivos con solo 1 decodificador (al menos LG) hay que esperar a que el video anterior aborte (la pausa es asincrona)

                                try {

                                    videos[i].play();
                                    console.log("PRESENTADOR: Play " + videos[i].getAttribute("data-filename-original") + " Habia oldslidewrapper");
                                } catch (e) {
                                    console.log("PRESENTADOR: Error al hacer play que provoca la desincronización --> " + ((e.Message !== undefined) ? e.Message : e));
                                }

                                /*
                                setTimeout((function (video) {

                                /*
                                * WorkArround para LG...
                                * La idea de comprobar si está video.ownerDocument es por si han avanzado plantilla, con lo que el video
                                * dejaria de estar en la página
                                * FIXME: Repensar esto con calma. Ademas en futuras versiones de LG no deveria hacer falta. Hecho para el canal de IMM
                                * /
                                if (Main.info.engine === "LG" && video.ownerDocument && !video.paused && video.played.length === 0) {
                                console.warn("PRESENTADOR: Volviendo a hacer Play " + video.getAttribute("data-filename-original") + " Ready State: " + video.readyState + " Habia oldslidewrapper");
                                //console.log
                                video.load();
                                video.play();
                                }
                                })(videos[i]), 500);
                                */
                            } else {
                                console.log("PRESENTADOR: Playing " + videos[i].getAttribute("data-filename-original") + " Habia oldslidewrapper");
                            }
                        } else {
                            if (videos[i].paused) {
                                console.log("PRESENTADOR: Los syncvideo " + videos[i].getAttribute("data-filename-original") + " Habia oldslidewrapper");
                                videos[i].load();
                            }

                            /**
                            if (Dnv.sincronizacion.isConectado() && Main.info.engine == "electron" && Dnv.sincronizacion.getIPServidor() == ipServidorTiempo && controller
                            && Dnv.sincronizacion.getCurrentServerPort() == puertoServidorTiempo) {
                            controller.removeAllMediaElement();
                            controller.addMediaElement(videos[i]);
                            } else **/
                            if (Dnv.sincronizacion.isConectado() && Main.info.engine == "electron") {

                                //posteriores
                                if (videos[0].getAttribute("secuencia") != "true") {
                                    var requirejs = require('requirejs');
                                    requirejs.config({
                                        baseUrl: __dirname + '/lib/videoSync',
                                        nodeRequire: require,
                                        paths: {
                                            'woodman': 'woodman',
                                            'event-target': 'event-target.amd',
                                            'websocket': 'browser'
                                        }
                                    });

                                    requirejs([
                                        'TimingObject',
                                        'SocketTimingProvider',
                                        'TimingMediaController',
                                        'StateVector',
                                        'woodman'
                                    ], function(
                                        TimingObject, SocketTimingProvider, TimingMediaController, StateVector,
                                        woodman) {

                                        if (Dnv.sincronizacion.isMaestro()) {
                                            ipServidorTiempo = Dnv.deviceInfo.ip();
                                            if (!ipServidorTiempo) ipServidorTiempo = "0.0.0.0";
                                        } else {
                                            ipServidorTiempo = Dnv.sincronizacion.getIPServidor();
                                        }
                                        console.log("[SINCRONIZACION][ELEMENTO VIDEO] IP servidor de tiempo: " + ipServidorTiempo);
                                        puertoServidorTiempo = Dnv.sincronizacion.getCurrentServerPort();
                                        console.log("[SINCRONIZACION][ELEMENTO VIDEO] Puerto servidor de tiempo: " + puertoServidorTiempo);
                                        var timingProvider = new SocketTimingProvider("ws://" + ipServidorTiempo + ":" + puertoServidorTiempo + "/video");
                                        var timing = new TimingObject();
                                        timing.srcObject = timingProvider;
                                        //if (controller) controller.removeAllMediaElement();
                                        controller = new TimingMediaController(timing);
                                        if (videos[i] != undefined) {
                                            console.log("[SINCRONIZACION](oldSlideWrapper) Añado video a controlador de sincronización: " + videos[i].currentSrc + ", videos.length: " + videos.length);
                                            controller.addMediaElement(videos[0]);
                                        }
                                        /**else {
                                                                               if (videos.length <= i) {
                                                                                   //videos[i] = videos[videos.length-1];
                                                                                   controller.addMediaElement(videos[i - 1]);
                                                                               }
                                                                           }**/
                                        controller.addEventListener('readystatechange', function(evt) {
                                            var flag = true;
                                            console.log("[SINCRONIZACION][ELEMENTO VIDEO] Evento: " + evt.value);
                                            switch (evt.value) {
                                                case "open":
                                                    /**
                                                    if (!Dnv.sincronizacion.isMaestro() && flag) {
                                                    flag = false;
    
                                                    Dnv.sincronizacion.getDiscover().send("sincro-video", { sync: "" });
                                                    }
                                                    if (Dnv.sincronizacion.isMaestro()) {
                                                    setTimeout(function () { controller.play(); }, 2000);
                                                    }
                                                    **/
                                                    Dnv.sincronizacion.getDiscover().send("sincro-video", { sync: "" });

                                                    if (Dnv.sincronizacion.isMaestro()) {
                                                        setTimeout(function() {
                                                            if (controller) controller.play();
                                                            Dnv.helpers.checkPlayingVideo(videos[0]);
                                                            Dnv.sincronizacion.resetNodosSyncVideo();
                                                            console.log("[SINCRONIZACION][ELEMENTO VIDEO] Timer seguridad. Play.");
                                                        }, 5000);
                                                    } else {
                                                        setTimeout(function() {
                                                            Dnv.helpers.checkPlayingVideo(videos[0]);
                                                        }, 5000);
                                                    }

                                                    break;
                                                case "closed":
                                                    //controller = null;
                                                    break;
                                            }
                                        });

                                    });
                                }
                            }

                        }
                    }


                    // Videos "nativos" de la nueva plantilla
                    var divs = slideWrapper.getElementsByTagName("div");
                    //var customVideos = [];
                    for (var i = 0; i < divs.length; i++) {
                        if (divs[i].isCustomVideoPlayer) {
                            //customVideos.push(divs[i]);
                            console.log("PRESENTADOR: Custom Play " + divs[i].getAttribute("data-filename-original") + " Habia oldslidewrapper");
                            divs[i].play();
                        }
                    }

                };
            } else {
                //Dnv.helpers.inDom(slideWrapper);

                while (oculto.lastChild) { // No deberia haber ninguno
                    console.warn("Eliminando " + oculto.lastChild.outerHTML + " de oculto " + oculto.id);
                    var iframes = oculto.lastChild.getElementsByTagName("iframe");
                    for (var ifr = 0; ifr < iframes.length; ifr++) {
                        iframes[ifr].src = "about:blank";
                        iframes[ifr].parentNode.removeChild(iframes[ifr]);
                    }
                    oculto.removeChild(oculto.lastChild);
                }
                while (visible.lastChild) { // No deberia haber ninguno
                    console.warn("Eliminando " + visible.lastChild.outerHTML + " de visible " + visible.id);
                    var iframes = visible.lastChild.getElementsByTagName("iframe");
                    for (var ifr = 0; ifr < iframes.length; ifr++) {
                        iframes[ifr].src = "about:blank";
                        iframes[ifr].parentNode.removeChild(iframes[ifr]);
                    }
                    visible.removeChild(visible.lastChild);
                }
                oculto.appendChild(slideWrapper);

                var descripcion = "";
                if (slideWrapper.id) descripcion += (" id=" + slideWrapper.id);
                if (slideWrapper.src) descripcion += (" src=" + slideWrapper.src);
                if (slideWrapper.getAttribute("data-plantilla")) descripcion += (" plantilla=" + slideWrapper.getAttribute("data-plantilla"));
                if (slideWrapper.getAttribute("data-filename-original")) descripcion += (" filename=" + slideWrapper.getAttribute("data-filename-original"));

                console.log("PRESENTADOR: Mostrando " + oculto.id + " " + descripcion);
                //Dnv.helpers.inDom(slideWrapper);

                cbOnMostrar = function() {
                    var elms = slideWrapper.childNodes;
                    for (var i = 0; i < elms.length; i++) {
                        if (elms[i].onMostrar) {
                            //console.log("PRESENTADOR: "+elms[i].tagName+" tiene onMostrar");
                            elms[i].onMostrar();
                        } else {
                            //console.log("PRESENTADOR: "+elms[i].tagName+" no tiene onMostrar");
                        }
                    }

                    var videos = slideWrapper.getElementsByTagName("video");
                    for (var vi = 0; vi < videos.length; vi++) {
                        console.log("PRESENTADOR: Play " + videos[vi].getAttribute("data-filename-original") + " No habia oldslidewrapper");
                        if (!videos[vi].syncVideo) {
                            videos[vi].play();
                        } else {
                            videos[vi].load();

                            /**
                            if (Dnv.sincronizacion.isConectado() && Main.info.engine == "electron" && Dnv.sincronizacion.getIPServidor() == ipServidorTiempo && controller
                            && Dnv.sincronizacion.getCurrentServerPort() == puertoServidorTiempo) {
                            controller.removeAllMediaElement();
                            controller.addMediaElement(videos[i]);
                            } else **/
                            if (Dnv.sincronizacion.isConectado() && Main.info.engine == "electron") {
                                if (videos[0].getAttribute("secuencia") != "true") {
                                    //setTimeout(function () {

                                    var requirejs = require('requirejs');
                                    requirejs.config({
                                        baseUrl: __dirname + '/lib/videoSync',
                                        nodeRequire: require,
                                        paths: {
                                            'woodman': 'woodman',
                                            'event-target': 'event-target.amd',
                                            'websocket': 'browser'
                                        }
                                    });

                                    requirejs([
                                        'TimingObject',
                                        'SocketTimingProvider',
                                        'TimingMediaController',
                                        'StateVector',
                                        'woodman'
                                    ], function(
                                        TimingObject, SocketTimingProvider, TimingMediaController, StateVector,
                                        woodman) {

                                        if (Dnv.sincronizacion.isMaestro()) {
                                            ipServidorTiempo = Dnv.deviceInfo.ip();
                                            if (!ipServidorTiempo) ipServidorTiempo = "0.0.0.0";
                                        } else {
                                            ipServidorTiempo = Dnv.sincronizacion.getIPServidor();
                                        }
                                        console.log("[SINCRONIZACION][ELEMENTO VIDEO] IP servidor de tiempo: " + ipServidorTiempo);
                                        puertoServidorTiempo = Dnv.sincronizacion.getCurrentServerPort();
                                        console.log("[SINCRONIZACION][ELEMENTO VIDEO] Puerto servidor de tiempo: " + puertoServidorTiempo);
                                        var timingProvider = new SocketTimingProvider("ws://" + ipServidorTiempo + ":" + puertoServidorTiempo + "/video");
                                        var timing = new TimingObject();
                                        timing.srcObject = timingProvider;
                                        //if (controller) controller.removeAllMediaElement();
                                        controller = new TimingMediaController(timing);
                                        controller.addMediaElement(videos[0]);
                                        controller.addEventListener('readystatechange', function(evt) {
                                            var flag = true;
                                            console.log("[SINCRONIZACION][ELEMENTO VIDEO] Evento: " + evt.value);
                                            switch (evt.value) {
                                                case "open":
                                                    /**
                                                    if (!Dnv.sincronizacion.isMaestro() && flag) {
                                                    flag = false;
 
                                                    Dnv.sincronizacion.getDiscover().send("sincro-video", { sync: "" });
                                                    }
                                                    if (Dnv.sincronizacion.isMaestro()) {
                                                    setTimeout(function () { controller.play(); }, 2000);
                                                    }
                                                    **/
                                                    Dnv.sincronizacion.getDiscover().send("sincro-video", { sync: "" });

                                                    if (Dnv.sincronizacion.isMaestro()) {
                                                        setTimeout(function() {
                                                            if (controller) controller.play();
                                                            Dnv.helpers.checkPlayingVideo(videos[0]);
                                                            Dnv.sincronizacion.resetNodosSyncVideo();
                                                            console.log("[SINCRONIZACION][ELEMENTO VIDEO] Timer seguridad. Play.");
                                                        }, 5000);
                                                    } else {
                                                        setTimeout(function() {
                                                            Dnv.helpers.checkPlayingVideo(videos[0]);
                                                        }, 5000);
                                                    }

                                                    break;
                                                case "closed":
                                                    //controller = null;
                                                    break;
                                            }
                                        });

                                    });
                                }
                                //}, 3000);
                            }
                        }
                    }
                    var divs = slideWrapper.getElementsByTagName("div");
                    for (var i = 0; i < divs.length; i++) {
                        if (divs[i].isCustomVideoPlayer /* && !divs[i].isPaused()*/ ) { // TODO: Revisar webOS
                            console.log("PRESENTADOR: Custom Play " + divs[i].getAttribute("data-filename-original") + " No habia oldslidewrapper");
                            divs[i].play();
                        }
                    }
                };
            }

            if (intercambiandoMaestras /*codMaestra > 0*/) {
                console.log(" |||||||||||||| Fijamos maestra: " + codMaestra);
                Dnv.secuenciador.currentMaestra = codMaestra;
            }

            if (intercambiandoMaestras) {
                if (_intercambioDivsMaestrasTimeoutId) {
                    console.warn("PRESENTADOR: El anterior intercambio de divs maestros no se ha realizado, le cancelamos");
                    clearTimeout(_intercambioDivsMaestrasTimeoutId);
                    _intercambioDivsMaestrasTimeoutId = null;
                }
            } else {

                if (_intercambioDivsSlidesTimeoutId) {
                    console.warn("PRESENTADOR: El anterior intercambio de divs de slide no se ha realizado, le cancelamos");
                    clearTimeout(_intercambioDivsSlidesTimeoutId);
                    _intercambioDivsSlidesTimeoutId = null;
                }
            }

            var _intercambioDivsTimeoutId = setTimeout(function() {
                if (intercambiandoMaestras) {
                    _intercambioDivsMaestrasTimeoutId = null;
                } else {
                    _intercambioDivsSlidesTimeoutId = null;
                }

                if (Dnv._USAR_VISIBILITY) {
                    oculto.style.visibility = "visible";
                } else {
                    oculto.style.display = "block";
                }
                oculto.style.zIndex = 0;
                if (intercambiandoMaestras) {
                    console.log("oculto.childrenElementCount" + oculto.childrenElementCount);
                    if (oculto.childrenElementCount == 0) {
                        if (Dnv._USAR_VISIBILITY) {
                            oculto.style.visibility = "visible";
                        } else {
                            oculto.style.display = "block";
                        }
                    }
                    oculto.activo = true;
                    visible.activo = false;
                }

                //if (visible.id.indexOf("Maestra") != -1) {
                if (intercambiandoMaestras) {
                    visible.style.zindex = 200;
                    oculto.style.zIndex = 100;
                } else {
                    visible.style.zIndex = 1;
                    oculto.style.zIndex = 0;
                }

                /*visible.cbTransitionEnd = function () {
                console.log("PRESENTADOR: Eliminando contenidos de " + visible.id);
                while (visible.lastChild) {
                console.warn("Eliminando " + visible.lastChild.outerHTML + " de visible " + visible.id);
                visible.removeChild(visible.lastChild);
                }
                }*/

                if (Dnv._OPACITY_ENABLED) {
                    if (Dnv._OPACITY_ENABLED && !intercambiandoMaestras) { // FIXME: Aplicar a maestras tambien
                        oculto.onTransitionStart("opacity", Dnv._OPACITY_VISIBLE);
                        visible.onTransitionStart("opacity", Dnv._OPACITY_OCULTO);
                    }
                    oculto.style.opacity = Dnv._OPACITY_VISIBLE;
                    visible.style.opacity = Dnv._OPACITY_OCULTO;
                } else {


                    console.log("oculto.childrenElementCount" + oculto.childrenElementCount);
                    if (oculto.childrenElementCount == 0) {
                        if (Dnv._USAR_VISIBILITY) {
                            oculto.style.visibility = "hidden";
                        } else {
                            oculto.style.display = "none";
                        }
                    } else {
                        if (Dnv._USAR_VISIBILITY) {
                            oculto.style.visibility = "visible";
                        } else {
                            oculto.style.display = "block";
                        }
                    }
                    if (Dnv._USAR_VISIBILITY) {
                        visible.style.visibility = "hidden";
                    } else {
                        visible.style.display = "none";
                    }
                    oculto.activo = true;
                    visible.activo = false;

                }
                //if(cbOnMostrar) 
                //  visible.cbOnOcultado = cbOnMostrar




                console.log("_____________________CB________________");
                if (cbOnMostrar) {
                    cbOnMostrar();

                } else {

                    var videos = visible.getElementsByTagName("video");
                    for (var i = 0; i < videos.length; i++) {
                        console.log("PRESENTADOR: Pause3 " + videos[i].src);
                        videos[i].autoplay = false;
                        videos[i].preload = "none";
                        videos[i].src = "";
                        console.log("PRESENTADOR: Pausa " + videos[i].src);
                        videos[i].pause();

                    }
                    var divs = visible.getElementsByTagName("div");
                    for (var i = 0; i < divs.length; i++) {
                        if (divs[i].isCustomVideoPlayer) {
                            divs[i].stop();
                        }
                    }
                    videos = oculto.getElementsByTagName("video");
                    for (var i = 0; i < videos.length; i++) {
                        if (!videos[i].syncVideo) {
                            console.log("PRESENTADOR: " + videos[i].getAttribute("data-filename-original") + " Play3 " + videos[i].src);
                            console.log("PRESENTADOR: Play " + videos[i].getAttribute("data-filename-original") + " Habia oldslidewrapper");
                            videos[i].autoplay = true;
                            videos[i].play();
                            //videos[i].volume = 1.0;
                        } else {
                            videos[i].load();
                        }
                    }
                    divs = oculto.getElementsByTagName("div");
                    for (var i = 0; i < divs.length; i++) {
                        if (divs[i].isCustomVideoPlayer) {
                            divs[i].stop();
                        }
                    }
                }
            }, 3 * 100); //rag 1000
            if (intercambiandoMaestras) {
                _intercambioDivsMaestrasTimeoutId = _intercambioDivsTimeoutId;
            } else {
                _intercambioDivsSlidesTimeoutId = _intercambioDivsTimeoutId;
            }
            _intercambioDivsTimeoutId = null;
            if (intercambiandoMaestras /*codMaestra != 0*/) return;

            Dnv.avisosTransit();

            var duracionSlide = slide.getDuracion();
            if (!duracionSlide || duracionSlide == 0) duracionSlide = 90;
            var duracion = (duracionSlide + (slide.hasRelojMaestro() ? Dnv.CFG_MARGEN_CARGA_RELOJ_MAESTRO : 0)) * 1000;
            clearTimeout(timeoutDuracionSlide);

            timeoutDuracionSlide = setTimeout((function(id) {
                return function() {
                    //console.log("PRESENTADOR: Se acabo el tiempo asignado al slide " + id);
                    clearTimeout(timerSmoothplay);
                    // clearTimeout(timeoutAvanceSecuencia); <- No podemos parar este timer si estamos en smoothplay. Lo haremos en el onOcultar de la secuencia
                    Dnv.presentador.avanzarSlide(wrapper, id, slideWrapper);
                };
            })(id), duracion);


            console.log("PRESENTADOR: Avance programado para " + slide.getCodigo() + " cargado como página " + id + " en un máximo de " + duracion + " msecs desde " + Dnv.utiles.formatDateTimeEspanol(new Date()));

        },
        //----------------------------

        inicializar: function() {
            init();
        },

        avanzarSlideForzandoComprobacionSmoothplay: function() {
            this.avanzarSlide(null, null, null, null, null, null, null, null, true);
        },

        avanzarSlideEvaluandoActual: function(forzarComprobacionSmoothplay) {
            //if (new Date().getTime() >= lastAvanceTime + 1000) {
            this.avanzarSlide(document.getElementById("wrapper"), null, null, null, null, null, null, true, forzarComprobacionSmoothplay);
            //} else {
            //    console.warn("PRESENTADOR: No avanzamos slide evaluando actual por exceso de llamadas");
            //}
        },

        isInBuscandoContenidos: function() {
            return isInBuscandoContenidos;
        },

        // Ojo, casi todos los argumentos son opcionales y hay llamadas que los omiten
        /*
         * Avanzar slide si se cumplen condiciones
         * wrapper: Parece ser siempre nulo
         * idOrigen: Id del slide que genera el avance.
         *          Sirve para poder descartar el avance si lo ha generado un slide antiguo
         *          o un contenido precargado que aún no se ha mostrado.
         *          FIXME: Solo se compaara con las plantillas normales, habria que gestionarlo para maestras, inserciones, etc
         * elementoOrigen: El elemento que causa el avance.
         *          Sirve para poder descartar el avance si lo ha generado un elemento que no está en el DOM,
         *          es decir, no está mostrándose.
         * forzarAvanceDeMaestra: Forzar avance a un slide con plantilla maestra diferente.
         *          Por ejemplo, si ha habido un error en el contenido de la plantilla maestra, querremos avanzar a una plantilla con
         *          diferente maestra
         * finalizarGapless: Funcionalidad antigua de LG.
         *          En LG para reproducir videos continuamente se pregeneraba una playlist de videos que iba a coincidir con las plantillas
         *          a reproducir, y se pasaba la lista a la pantalla.
         * datosSincronizacion: Objeto con informacion de sincronizacion. Contiene las siguientes propiedades:
         *          - codSincronizacion
         *          - timeSincronizacion
         * directamente: Si se esta forzando un avance a traves de avanzarSlideDirectamente
         * mismoSlide: ¿No avanza si el slide actual sigue cumpliendo las condiciones de slide?
         * forzarComprobacionSmoothplay: Cuando hay sincronización, hace que se compruebe si hay que reproducir en smoothplay. No parece usarse.
         * 
         */
        avanzarSlide: function (wrapper, idOrigen, elementoOrigen, forzarAvanceDeMaestra, finalizarGapless, datosSincronizacion, directamente, mismoSlide, forzarComprobacionSmoothplay) {

            //debugger;
            if (!reproduciendoPresentacion || pantallaApagada) {
                //init();
                //reproduciendo = true;

                console.warn("PRESENTADOR: No navegamos, reproduciendoPresentacion = " + reproduciendoPresentacion + " pantallaApagada " + pantallaApagada);
                return;
                /*
                Dnv.presentador.comenzarPresentacion();
                var splash = document.getElementById("splash");
                if (splash) {
                splash.parentElement.removeChild(splash);
                }
                */
            }

            if (Dnv.Menuboard.enabled && Dnv.Menuboard.sinPrecios) {

                console.warn("PRESENTADOR: No navegamos, reproduciendoPresentacion = " + reproduciendoPresentacion + " pantallaApagada = " + pantallaApagada + ", Menuboard = " + Dnv.Menuboard.enabled + ", sinPrecios = " + Dnv.Menuboard.sinPrecios);

                setTimeout(function() {
                    Dnv.presentador.avanzarSlide();
                }, 5000);

                return;
            }

            if (!Dnv.Pl.lastPlaylist) {
                try {
                    if (!_primeraEjecucion) {
                        console.error("PRESENTADOR: No hay playlist!");
                        Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "No hay playlist");
                    }
                    _primeraEjecucion = false;
                } catch (e) { }

                if (!Dnv.cfg.getConfigurado()) {
                    Main.navigateToConfigure();
                } else {
                    Main.navegarEsperandoPlaylist();
                }
                reproduciendoPresentacion = false;
                return;
            }
            _primeraEjecucion = false;

            if (!Dnv.licencias.isLicenciaValida()) {
                Main.navegarSinLicencia();
                console.warn("PRESENTADOR: No navegamos, no hay licencia válida.");
                return;
            }

            /*if (Dnv.Pl.isPresentacionDetenida == true) {
            console.warn("PRESENTADOR: No navegamos, isPresentacionDetenida = true.");
            return;
            }*/

            var descripcion = "";
            if (elementoOrigen) {
                if (elementoOrigen.id) descripcion += (" id=" + elementoOrigen.id);
                if (elementoOrigen.src) descripcion += (" src=" + elementoOrigen.src);
                if (elementoOrigen.getAttribute("data-plantilla")) descripcion += (" plantilla=" + elementoOrigen.getAttribute("data-plantilla"));
                if (elementoOrigen.getAttribute("data-filename-original")) descripcion += (" filename=" + elementoOrigen.getAttribute("data-filename-original"));
            }
            //if(actualizarContadoresCPU) actualizarContadoresCPU();// TODO:BORRAME
            console.log("PRESENTADOR: Avance desde el elemento " + elementoOrigen + " (" + descripcion + ") a las " + Dnv.utiles.formatDateTimeEspanol(new Date()));
            //if (idOrigen !== undefined && idOrigen !== id) {

            if (idOrigen && idOrigen !== id) {
                console.log("PRESENTADOR: Descartando peticion de avance de Slide porque el avance se origino en la página " + idOrigen + " pero nosotros estamos en " + id);
                return;
            }

            if (elementoOrigen && !Dnv.helpers.inDom(elementoOrigen)) {
                var elm = getCurrentSlideWrapper();

                console.log("PRESENTADOR: Descartando peticion de avance de Slide porque  " + elementoOrigen + " (" + descripcion + ") no está en el DOM, sino que" +
                    (elm ? " estamos en la plantilla " + elm.getAttribute("data-plantilla") : " no hay nada"));
                //if(elementoOrigen.src === undefined) console.log(JSON.stringify(elementoOrigen));
                if (elementoOrigen.src === undefined) console.log("PRESENTADOR: " + elementoOrigen.innerHTML);
                //console.warn("Descartando peticion de avance de Slide desde "+idOrigen+" porque estamos en "+id);
                return;
            }

            //Enviar impression Hivestack
            if (Dnv.secuenciador.getSlideActual() && Dnv.secuenciador.getSlideActual().HasHuecoSSP()) {
                if ((Dnv.sincronizacion.isMaestro() && Dnv.sincronizacion.isConectado()) || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") != ";1;") {
                    if (Dnv.secuenciador.getSlideActual().GetTypeOfSSP() == "3") { //Hivestack.
                        Dnv.SSP.Hivestack.Impresion();
                        Dnv.SSP.Hivestack.Ad = {};
                        Dnv.SSP.Hivestack.VastSolicitado = false;
                        Dnv.SSP.Hivestack.getVast();
                    } else if (Dnv.secuenciador.getSlideActual().GetTypeOfSSP() == "6") {
                        Dnv.SSP.Admooh.VastSolicitado = false;
                        Dnv.SSP.Admooh.lastPrint = Dnv.SSP.Admooh.Ad.printId;
                        Dnv.SSP.Admooh.Ad = {};
                        Dnv.SSP.Admooh.GetVast();
                    } else if (Dnv.secuenciador.getSlideActual().GetTypeOfSSP() == "7") {
                        var duration = (parseInt((Dnv.SSP.PlaceExchange.Ad.duracion.split(":")[2])) * 1000);
                        var time = new Date().getTime() - duration;
                        Dnv.SSP.PlaceExchange.Impresion(time);
                        Dnv.SSP.PlaceExchange.VastSolicitado = false;
                        Dnv.SSP.PlaceExchange.Ad = {};
                        Dnv.SSP.PlaceExchange.getVast();
                    }

                }
            }


            //SMOOTHPLAY 
            var slideActualSmooth = Dnv.secuenciador.getSlideActual();

            var slideSiguienteSmooth = Dnv.secuenciador.peekNextSlide(mismoSlide);
            if (Dnv.controlInteractividad.isInInteractivo() && Dnv._INTERACTIVO_SMOOTH == false) {
                Dnv._INTERACTIVO_SMOOTH = true;
            } else if (Dnv.controlInteractividad.isInInteractivo() && Dnv._INTERACTIVO_SMOOTH == true) {
                return;
            }
            if (slideActualSmooth && slideActualSmooth.getPlantilla().getCapas(slideActualSmooth.getCodigo()).length > 0 && (slideActualSmooth.getPlantilla().getCapas(slideActualSmooth.getCodigo())[0].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_STREAMING) && Dnv.cfg.getCfgBoolean("SmoothPlayMode", false)) {
                forzarComprobacionSmoothplay = true;
                if (!Dnv.sincronizacion.isMaestro()) {
                    var canal = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCanal();
                    var capa1 = slideActualSmooth.getPlantilla().getCapas(slideActualSmooth.getCodigo())[0];
                    // directamente = false; <- Si ha habido un avance directo, es probable que haya ocurrido algun error con algún elemento de la pantilla anterior y necesitemos recargar la plantilla o avanzar

                    // Si es un canal agrupado, no tiene slides asociados
                    if (canal.getSlides() && canal.getSlides().length == 1 && canal.getCanalesAgrupados().length == 0 &&
                            // FIXME: Habria que reubicar isFFPlayOpened para que no haga falta instanciar un DivCustomVideoPlayerStreaming para usarlo
                            (Main.info.engine !== "electron" || Main.getDivCustomVideoPlayerStreaming(capa1.getRecurso().getUrl(), capa1.getRecurso().getTipoStreaming()).isFFPlayOpened())) {
                        slideSiguienteSmooth = slideActualSmooth;
                    }
                }
            }

            if (Dnv.sincronizacion.isConectado() && !forzarComprobacionSmoothplay) {
                slideActualSmooth = null;
                slideSiguienteSmooth = null;

            }

            if (slideActualSmooth != null && slideSiguienteSmooth != null && !Dnv._INTERACTIVO_SMOOTH && !directamente) {

                if (Dnv.helpers.debeHacerSmoothPlay(slideActualSmooth, slideSiguienteSmooth)) {

                    console.log("PRESENTADOR: El siguiente es el mismo slide, no navegamos (SMOOTHPLAY)");

                    /**
                    if (Dnv.sincronizacion.isConectado()) {
                    if (Dnv.sincronizacion.isMaestro()) {
                    var delay = Dnv.sincronizacion.getLatenciaEsclavo() + Dnv._SYNC_DELAY_MAESTRO;
                    var timeSincronizacion = new Date().getTime() + delay;
                    Dnv.sincronizacion.onMaestroComenzandoSlide(slideActualSmooth.getCodSincronizacion(), timeSincronizacion, null, null, null);
                    }
                    }
                    **/


                    /* SmoothPlay Streaming*/
                    if (slideActualSmooth.isSincronizado() && Dnv.sincronizacion.isMaestro() && (slideActualSmooth.getPlantilla().getCapas(slideActualSmooth.getCodigo())[0].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_STREAMING)) {
                        Dnv.monitor.writeLogFile("SMOOTHPLAY STREAMING: ***** Entro en smoothplay sincronizado ****** Timestamp=" + new Date().getTime().toString() + "******");

                        delay = Dnv.sincronizacion.getLatenciaEsclavo() + Dnv._SYNC_DELAY_MAESTRO;

                        //var delay = Dnv.sincronizacion.getLatenciaEsclavo() + Dnv._SYNC_DELAY_MAESTRO + 1000;
                        timeSincronizacion = new Date().getTime() + delay;

                        var codInsercion;
                        var nivelInsercion;
                        var codCampanya;
                        var insercion = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getInsercion();
                        if (insercion) codInsercion = insercion.getCodigo();
                        if (insercion) nivelInsercion = insercion.getPrioridad();
                        if (insercion) codCampanya = insercion.getCampanya();
                        Dnv.presentador.setTimeSincronizacion(timeSincronizacion);
                        Dnv.presentador.setCurrentInsercion(insercion);
                        Dnv.sincronizacion.onMaestroComenzandoSlide(slideActualSmooth.getCodSincronizacion(), timeSincronizacion, codInsercion, nivelInsercion, codCampanya);
                        Dnv.monitor.writeLogFile("SMOOTHPLAY STREAMING: ***** Salgo de smoothplay sincronizado ****** Timestamp=" + new Date().getTime().toString() + " * timeSincronizacion=" + timeSincronizacion + " * " + "Insercion=" + codInsercion + " * ");

                    }
                    /* SmoothPlay Streaming*/


                    Dnv.limpieza.actualizarListadoRecursosFromSlide(slideActualSmooth);

                    //---------auditoria big data

                    if (Dnv.cfg.getCfgBoolean("MedicionAudiencia_BigData", false)) {
                        if (!inicioSlideTimestamp) {
                            inicioSlideTimestamp = new Date();
                            inicioSlide = slideActualSmooth;
                        } else {
                            finSlideTimestamp = new Date();
                            if (inicioSlide.getInsercionActual()) {
                                var duracionInsercion = (finSlideTimestamp.getTime() - inicioSlideTimestamp.getTime()) / 1000;
                                if (duracionInsercion <= inicioSlide.getInsercionActual().getRecurso().getDuracion() * 0.8) {
                                    console.error("[INSERCIONES][ES MAESTRO: " + Dnv.sincronizacion.isMaestro() + "] Insercion: " + inicioSlide.getInsercionActual().getCodigo() + " (" + inicioSlide.getInsercionActual().getDenominacion() + ") se ha cortado antes de tiempo");
                                    if (Dnv.monitor.sendLogRabbit && Dnv.sincronizacion.isMaestro()) Dnv.monitor.sendLogRabbit("[INSERCIONES][ES MAESTRO: " + Dnv.sincronizacion.isMaestro() + "] Insercion: " + inicioSlide.getInsercionActual().getCodigo() + " (" + inicioSlide.getInsercionActual().getDenominacion() + ") se ha cortado antes de tiempo", "ERROR");
                                } else {
                                    Dnv.monitor.writeLogFile("Envio big data insercion: " + inicioSlide.getInsercionActual().getDenominacion() + " , Slide: " + inicioSlide.getDenominacion());
                                    Dnv.bigdata.sendAuditoria(inicioSlideTimestamp, finSlideTimestamp, inicioSlide.getInsercionActual());

                                }
                            } else if (Menu._mostrarInfoAudiencia) {
                                Menu.showInfoAudiencia();
                            }
                            inicioSlideTimestamp = finSlideTimestamp;
                            inicioSlide = slideActualSmooth;
                        }
                    }

                    if (Dnv.cfg.getCfgInt("Salida_Auditoria", 0) == 1) {
                        //auditamos plantilla

                        //PLANTILLAS
                        if (slideActualSmooth.getPlantilla().getAuditar() > 0 && !mismoSlide) {
                            console.log("Auditando plantilla " + slideActualSmooth.getPlantilla().getCodigo());
                            Dnv.auditoria.auditarPlantilla(slideActualSmooth.getPlantilla());

                            //auditamos todos los recursos
                            var capas = slideActualSmooth.getPlantilla().getCapas(slideActualSmooth.getCodigo());
                            for (var i = 0; i < capas.length; i++) {
                                if (capas[i].isAuditable()) {
                                    var recurso = capas[i].getRecurso();

                                    if ((!Dnv.utiles.soportaFlash() || !preferirFlashAHtml5 || !recurso) && capas[i].getRecursoHtml5()) {
                                        recurso = capas[i].getRecursoHtml5();
                                    }


                                    /*if (!recurso) {
                                    if (capas[i].getTipoCapa() === Dnv.Pl.Capa.tipos.TIPO_SMARTOBJECT) {
                                    recurso = capas[i].getRecursoHtml5();
                                    }
                                    }*/
                                    if (recurso) {
                                        if (recurso.isDisponible()) { //RAG Comprobar..
                                            if (capas[i].getTipoCapa() != Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                                                Dnv.auditoria.auditarRecurso(slideActualSmooth.getPlantilla(), capas[i].getCodigo(), capas[i].getTipoCapa(), recurso);
                                            }
                                        }
                                    } else {
                                        // CAR: ¿Tipo URL y demas?
                                        console.warn("No se puede auditar la capa " + capas[i].getCodigo() + " de tipo " + capas[i].getTipoCapa());
                                        continue;
                                    }
                                }
                            }
                        }

                        //MAESTRAS
                        //var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByCodigo(slide.getPlantilla().getMaestra());
                        var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByVinculo(Dnv.helpers.getMaestra(slideActualSmooth));

                        //llamamos siempre aquí. si no hay maestra, cierra la auditoría anterior..
                        //también comprobamos dentro getAuditar.

                        //TODO RAG: la plantilla maestra no se audita como plantilla, auditamos sus recursos. ? comprobar..
                        //Dnv.auditoria.auditarPlantillaMaestra(plantillaMaestra, slide.getPlantilla());

                        if (plantillaMaestra != undefined && slideActualSmooth.getPlantilla().getAuditar() > 0) {
                            var capas = plantillaMaestra.getCapas();
                            for (var i = 0; i < capas.length; i++) {
                                if (capas[i].isAuditable() && capas[i].getRecurso().isDisponible()) { //RAG Comprobar.. <- [CAR] ¿? si ha llegado aquí es porque estaba disponible...
                                    //Dnv.auditoria.auditarRecursoMaestra(slide.getPlantilla(), capas[i].getCodigo(), capas[i].getTipoCapa(), capas[i].getRecurso());
                                    if (capas[i].getTipoCapa() != Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                                        Dnv.auditoria.auditarRecurso(slideActualSmooth.getPlantilla(), capas[i].getCodigo(), capas[i].getTipoCapa(), capas[i].getRecurso());
                                    }
                                }
                                //los recursos pertenecen a la contenida, no a la maestra.
                                //Dnv.auditoria.auditarRecursoMaestra(plantillaMaestra, capas[i].getCodigo(), capas[i].getTipoCapa(), capas[i].getRecurso());
                            }
                        }
                    }

                    var duracion = (slideActualSmooth.getDuracion() + (slideActualSmooth.hasRelojMaestro() ? Dnv.CFG_MARGEN_CARGA_RELOJ_MAESTRO : 0)) * 1000;

                    if (timerSmoothplay) clearTimeout(timerSmoothplay);
                    timerSmoothplay = setTimeout(function() {
                        /**
                        Dnv.secuenciador.nextCiclo();
                        Dnv.presentador.avanzarSlide(wrapper, idOrigen);
                        **/

                        // Si no programamos avances si hay relojes maestros, los videos se quedan en bucle permanentemente, aun cuando se añadan slides al canal
                        //if (!slideActualSmooth.hasRelojMaestro()) { 

                            if (Dnv.sincronizacion.isConectado()) {
                                if (Dnv.sincronizacion.isMaestro()) {
                                    Dnv.secuenciador.nextCiclo();
                                    Dnv.presentador.avanzarSlide(wrapper, idOrigen);
                                }
                            } else {
                                Dnv.secuenciador.nextCiclo();
                                Dnv.presentador.avanzarSlide(wrapper, idOrigen);
                            }
                        //}
                    }, duracion);

                    return

                }

            }


            if (lastAvanceTime !== undefined) {
                console.log("PRESENTADOR: El slide anterior se reprodujo durante " + (Date.now() - lastAvanceTime) + " msecs");
            }
            lastAvanceTime = Date.now();

            // AVISOS
            if (Dnv.cfg.getCfgInt("TransITProduct", 0) > 0 && Dnv.cfg.getCfgBoolean("Avisos_RabbitMQ_Enabled", false)) {
                var wrapperAvisos = document.getElementById("wrapperAvisos");
                var plantillaAviso = Dnv.Pl.lastPlaylist.getPlayer().getEstados()[Dnv.Pl.EstadoActual].getPlantilla();
                if (!plantillaAviso) {
                    var iframes = wrapperAvisos.getElementsByTagName("iframe");
                    for (var ifr = 0; ifr < iframes.length; ifr++) {
                        iframes[ifr].src = "about:blank";
                        iframes[ifr].parentNode.removeChild(iframes[ifr]);
                    }
                    wrapperAvisos.innerHTML = "";
                    wrapperAvisos.style.opacity = 0;
                } else if (plantillaAviso.getCodigo() != anteriorPlantillaAviso) {
                    var iframes = wrapperAvisos.getElementsByTagName("iframe");
                    for (var ifr = 0; ifr < iframes.length; ifr++) {
                        iframes[ifr].src = "about:blank";
                        iframes[ifr].parentNode.removeChild(iframes[ifr]);
                    }
                    wrapperAvisos.innerHTML = "";
                    wrapperAvisos.style.opacity = 1;
                    var capasAvisos = plantillaAviso.getCapas();
                    for (var cA = 0; cA < capasAvisos.length; cA++) {
                        var capaAviso = capasAvisos[cA];
                        var elementAviso = getRecursoSimpleElement(plantillaAviso, capaAviso, capaAviso.getRecursoHtml5(), null, null, null, null, null, null, true);
                        if (elementAviso) {
                            elementAviso.style.opacity = 0;
                            wrapperAvisos.appendChild(elementAviso);
                        }
                    }
                    anteriorPlantillaAviso = plantillaAviso.getCodigo();
                }
            } else {
                // El wrapper avisos está por encima del slide, con lo que impide la interactividad
                var wrapperAvisos = document.getElementById("wrapperAvisos");
                if (wrapperAvisos) { // No todas las plataformas tienen avisos implementado
                    wrapperAvisos.style.display = "none";
                }
            }

            console.log("PRESENTADOR: ***********Avanzando desde " + idOrigen + "***********");

            id++;

            var anteriorSlide = Dnv.secuenciador.getSlideActual();
            var anteriorCodigoPlantillaMaestra = Dnv.secuenciador.getCodigoPlantillaMaestraActual();

            //var slide = (forzarAvanceDeMaestra ? Dnv.secuenciador.getNextSlideConDiferenteMaestra() : Dnv.secuenciador.getNextSlide());
            var slide;

            clearInterval(Dnv.helpers.checkPlayingVideo_interval);

            var codSincronizacion = (datosSincronizacion ? datosSincronizacion.codSincronizacion : undefined);
            var timeSincronizacion = (datosSincronizacion ? datosSincronizacion.timeSincronizacion : undefined);

            if (codSincronizacion) {
                slide = Dnv.secuenciador.getSlideSincronizado(codSincronizacion);
                if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isEsclavo()) {
                    Dnv.secuenciador.setSlideActual(slide);
                    Dnv.secuenciador.setCanalActual(slide.getCanal());
                }
                Dnv.secuenciador.setCodigoPlantillaMaestraActual(Dnv.helpers.getMaestra(slide));
            }

            if (!slide) {
                if (Dnv.controlInteractividad.isInInteractivo()) {
                    if (Dnv.sensors.isEnUso()) {
                        if (Dnv.controlInteractividad.deberiaSeguirEnInteractivo()) {
                            console.log("[INTERACTIVIDAD] deberiaSeguirEnInteractivo true");
                            slide = Dnv.secuenciador.getNextSlideInteractivo();
                        } else {
                            console.log("[INTERACTIVIDAD] deberiaSeguirEnInteractivo false");
                            Dnv.controlInteractividad.onPasoANoInteractivo(); // Ya hace un avance
                            return;
                        }
                    } else {
                        slide = Dnv.secuenciador.getNextSlideInteractivo();
                    }
                }
                if (!slide) {
                    slide = Dnv.secuenciador.getNextSlide(forzarAvanceDeMaestra, finalizarGapless, null, mismoSlide);
                }

                if (Dnv.sincronizacion.isEsclavo() &&
                    slide && anteriorSlide && slide.getCodigo() == anteriorSlide.getCodigo() &&
                    slide.isCabecera() && slide.isSincronizado() &&
                    Dnv.secuenciador.getCanalActual().getCodigo() != slide.getCanal().getCodigo()) {

                    /*
                     * Parece somos el esclavo de sincronizacion y hemos cambiado de canal, pero
                     * debido a la sincronizacion del maestro, ya estamos mostrando la cabecera del
                     * nuevo canal, no avanzamos de slide
                     */
                    id--;
                    Dnv.secuenciador.setCanalActual(slide.getCanal());
                    console.warn("PRESENTADOR: Ignorando salto a slide de cabecera de nuevo canal");
                    return;
                }

                if (slide) Dnv.secuenciador.setCanalActual(slide.getCanal());
            }

            var hayCambioDeCanal = !anteriorSlide || !slide || !Dnv.secuenciador.getCanalActual() || !slide.getCanal() || Dnv.secuenciador.getCanalActual().getCodigo() != slide.getCanal().getCodigo();
            if (hayCambioDeCanal) {
                console.log("PRESENTADOR: Hay cambio de canal");
                var slidesCanalNuevo;
                if (Dnv.secuenciador.getCanalActual()) {
                    slidesCanalNuevo = Dnv.secuenciador.getCanalActual().getSlides();
                } else {
                    slidesCanalNuevo = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCanal().getSlides();
                }
                // FIXME: El canal actual puede ser un canal agrupado. Estos canales no tienen slides propios, por lo que slidesCanalNuevo sera null
                // ¿Habria que crgar los slides del canal referido?
                // ¿Que pasa cuando un canal no tiene slides? (no estan vigentes, esta caducados o sin la resolucion adecuada, sin validar...)
                if (slidesCanalNuevo == undefined || slidesCanalNuevo == null) {
                    if (Dnv.sincronizacion.isConectado() && !Dnv.sincronizacion.isMaestro()) {
                        Dnv.sincronizacion.SendRdyToSync();
                    }

                }
                var slidesSincronizados = 0;
                if (slidesCanalNuevo !== null && slidesCanalNuevo.length > 0) {
                    for (var slideIndex = 0; slideIndex < slidesCanalNuevo.length; slideIndex++) {
                        if (slidesCanalNuevo[slideIndex].isSincronizado()) {
                            slidesSincronizados++;
                        }
                    }
                    if (slidesSincronizados == 0 && !Dnv.sincronizacion.isMaestro()) {
                        Dnv.sincronizacion.desconectar();
                        if (slidesCanalNuevo[0].isDisponible() && slidesCanalNuevo[0].isVigente() && slidesCanalNuevo[0].isHabilitado() &&
                                Dnv.Variables.calcularCondiciones(slidesCanalNuevo[0], false)) {
                            slide = slidesCanalNuevo[0];
                        }
                    } else {
                        if (!Dnv.sincronizacion.isConectado()) {
                            Dnv.sincronizacion.conectar();
                        }
                    }
                }
                //Dnv.presentador.avanzarSlideDirectamente();
                //return;

            }
            Dnv.secuenciador.setSlideActual(slide);
            Dnv.secuenciador.setCodigoPlantillaMaestraActual(Dnv.helpers.getMaestra(slide));

            /*
            Comprobamos si el siguiente video gapless que se a reproducir coincide con el
            del siguiente slide.
            */
            var noCoincideGapless = false;
            if (slide && Dnv.gaplessVideo && slide.isGapless() && !slide.isInicioGapless()) {
                var videoPreparado = Dnv.gaplessVideo.getVideoPreparado();

                if (videoPreparado) {
                    // Buscar capa de video, ver si capa y posicion coincide
                    //                 

                    // Solo hay una capa de video gapless...
                    var capas = slide.getPlantilla().getCapas(slide.getCodigo());
                    var capaVideo;
                    for (var i = 0; i < capas.length; i++) {
                        if (capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_VIDEO) {
                            capaVideo = capas[i];
                        }
                    }

                    // Si no la hemos encontrado, miramos en la plantilla maestra
                    if (!capaVideo && Dnv.helpers.getMaestra(slide) != 0) {
                        var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByVinculo(slide.getPlantilla());
                        if (plantillaMaestra) {
                            capas = plantillaMaestra.getCapas();
                            for (var i = 0; i < capas.length; i++) {
                                if (capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_VIDEO) {
                                    capaVideo = capas[i];
                                }
                            }
                        }
                    }

                    if (capaVideo) {
                        var videoCapa = capaVideo.getRecurso().getUrl();
                        if (videoPreparado != videoCapa) {
                            console.warn("[GAPLESS] El siguiente video gapless preparado es " + videoPreparado + " pero el que toca es " + videoCapa);
                            noCoincideGapless = true;
                        } // else { Comprobar posicion?                      

                    }
                }

            }

            if (noCoincideGapless) {
                slide = Dnv.secuenciador.getNextSlide(forzarAvanceDeMaestra, true, null, mismoSlide);
            } else if (slide && anteriorSlide && slide.isGapless() && !slide.isInicioGapless() && !anteriorSlide.isGapless()) {
                /*                
                 * Este caso puede darse cuando han cambiado el canal por ejemplo de 
                 * [Video1] [Imagen1] a [video1] [video2]
                 * Inicialmente video1 no es gapless, pero si la playlist cambia, segun vayamos a pasar a video 2
                 * esperamos que el gapless esté funcionando, y no lo está
                 */


                slide = Dnv.secuenciador.getNextSlide(forzarAvanceDeMaestra, true, null, mismoSlide);
            }


            if (slide === null) {

                var videoWall = Dnv.sincronizacion.isConectado();

                isInBuscandoContenidos = true;

                // var salidaCodigo = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo();
                // Dnv.servidor.setNowShowingPubli(salidaCodigo, 0, 0, 0, 0, 0, 0, 0, Dnv.utiles.formatearFechaWCF(new Date(), false), 0);
                Dnv.engine_helpers.enviarNowShowing(Dnv.Pl.lastPlaylist, null);
                Dnv.audiencia.resetCampaign();

                if (!videoWall) {
                    Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Buscando contenido. No hay contenidos disponibles.");
                    console.warn("PRESENTADOR: No hay slides disponibles, navegamos a Buscando Contenidos..");
                    Dnv.secuenciador.currentMaestra = null;
                    anteriorSlide = null;
                } else if (videoWall & Dnv.sincronizacion.isMaestro()) {
                    Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Buscando contenido. No hay contenidos disponibles.");
                    console.warn("PRESENTADOR: No hay slides disponibles, navegamos a Buscando Contenidos..");
                    Dnv.secuenciador.currentMaestra = null;
                    anteriorSlide = null;
                }
                if (!videoWall) {
                    Main.navegarBuscandoContenidos();
                }

                Dnv.avisosTransit();

                setTimeout((function(idClosure) {
                    return function() {
                        console.info("PRESENTADOR: Miramos a ver si ahora hay slides disponibles");
                        /**
                        if (!Dnv.sincronizacion.isConectado()) {
                        Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Buscando contenido. No hay contenidos disponibles.");
                        Dnv.presentador.avanzarSlide(wrapper, idClosure, null);
                        } else if (Dnv.sincronizacion.isConectado() & Dnv.sincronizacion.isMaestro()) {
                        Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Buscando contenido. No hay contenidos disponibles.");
                        Dnv.presentador.avanzarSlide(wrapper, idClosure, null);
                        }
                        **/
                        if (Dnv.sincronizacion.isConectado()) {
                            if (Dnv.sincronizacion.isMaestro()) {
                                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Buscando contenido. No hay contenidos disponibles.");
                                Dnv.presentador.avanzarSlide(wrapper, idClosure, null);
                            }
                        } else {
                            Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Buscando contenido. No hay contenidos disponibles.");
                            Dnv.presentador.avanzarSlide(wrapper, idClosure, null);
                        }

                    };
                })(id), 5 * 1000);
                return;
            } else {
                isInBuscandoContenidos = false;
            }
            console.log("PRESENTADOR: ***********Cargando slide " + slide.getCodigo() + " " + slide.getDenominacion() + " como " + id + "***********");
            Dnv.monitor.writeLogFile("PRESENTADOR: ***********Cargando slide " + slide.getCodigo() + " " + slide.getDenominacion() + " como " + id + "***********");


            //(isLeft == slides[i].isLeft() || isRight == slides[i].isRight())

            //if (slide.isSincronizado() && Dnv.sincronizacion.isMaestro()) {
            var pl = Dnv.Pl.lastPlaylist;
            var delay = 0;
            //var timePlay = 0;
            //var isMaestro = pl.getPlayer().isLeft();
            if (Dnv.sincronizacion.isMaestro()) {
                if (slide.getCanal().tieneSlidesSincronizados()) {
                    Dnv.sincronizacion.onMaestroEnCanalSincronizado();
                } else {
                    Dnv.sincronizacion.onMaestroEnCanalNoSincronizado();
                }
            }
            if (slide.isSincronizado() && Dnv.sincronizacion.isMaestro()) {
                delay = Dnv.sincronizacion.getLatenciaEsclavo() + Dnv._SYNC_DELAY_MAESTRO;

                //var delay = Dnv.sincronizacion.getLatenciaEsclavo() + Dnv._SYNC_DELAY_MAESTRO + 1000;
                timeSincronizacion = new Date().getTime() + delay;

                var codInsercion;
                var nivelInsercion;
                var codCampanya;
                var insercion = pl.getPlayer().getSalida().getInsercion();
                if (insercion) codInsercion = insercion.getCodigo();
                if (insercion) nivelInsercion = insercion.getPrioridad();
                if (insercion) codCampanya = insercion.getCampanya();
                Dnv.presentador.setTimeSincronizacion(timeSincronizacion);
                Dnv.presentador.setCurrentInsercion(insercion);
                Dnv.sincronizacion.onMaestroComenzandoSlide(slide.getCodSincronizacion(), timeSincronizacion, codInsercion, nivelInsercion, codCampanya);
            }



            var plantilla = slide.getPlantilla();

            if (!anteriorResolucion || plantilla.getResolucion().getCodigo() !== anteriorResolucion.getCodigo()) {
                var r = plantilla.getResolucion();
                console.info("PRESENTADOR: La plantilla está en una nueva resolución: " + r.getAncho() + "x" + r.getAlto());
                window.dispatchEvent(new CustomEvent(RESOLUTION_CHANGED, {
                    detail: {
                        'codigo': r.getCodigo(),
                        'ancho': r.getAncho(),
                        'alto': r.getAlto()
                    }
                }));
                anteriorResolucion = r;
            }





            /*
            * esto se saca a una function debido a que si estamos sincronizando, puede que necesitemos ejecutar esto con delay 
            * para que el esclavo nos alcance

            */
            function cargarYMostrar(idCarga) {
                if (idCarga != id) return;
                var that = Dnv.presentador;
                //RAG
                //trapi para comprobar que se cargan las maestras en memoria y funciona el método getPlantillaByCodigo

                var slideWrapper;
                var slideWrapperMaestro;
                var codMaestra = Dnv.helpers.getMaestra(slide);

                if (codMaestra != 0) {
                    console.log("----RAG---" + codMaestra);
                    //var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByCodigo(plantilla.getMaestra());
                    var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByVinculo(codMaestra);

                    if (plantillaMaestra != undefined) {
                        console.log("----RAG--- PRESENTADOR: ***********Cargando Plantilla maestra: " + codMaestra + "***********");

                        //if (anteriorCodigoPlantillaMaestra)
                        // Comprobamos si ha cambiado la maestra para decidir si recargar o no
                        var anteriorMaestra = Dnv.Pl.lastPlaylist.getPlantillaByVinculo(anteriorCodigoPlantillaMaestra);
                        var debeCargarMaestra = false;
                        if (!anteriorMaestra || !anteriorSlide) {
                            debeCargarMaestra = true;
                        } else {
                            // Usamos la playlist original con la que se cargó la plantilla que está en pantalla.

                            var playlist = slide.getPlantilla().getPlaylist();
                            var anteriorPlaylist = anteriorSlide.getPlantilla().getPlaylist();
                            var idiomaSlide = playlist.getPlayer().getSalida().getIdiomas()[Dnv.Pl.lastPlaylistIdiomaActual[slide.getCodigo()]];
                            var anteriorIdiomaSlide = anteriorPlaylist.getPlayer().getSalida().getIdiomas()[Dnv.Pl.lastPlaylistIdiomaActual[anteriorSlide.getCodigo()]];
                            if (!Dnv.helpers.sonPlantillasEquivalentes(plantillaMaestra, anteriorMaestra, idiomaSlide, anteriorIdiomaSlide)) {
                                debeCargarMaestra = true;
                            }
                        }


                        if (debeCargarMaestra) {

                            // Solo calculamos el slide si va a haber que mostrarlo... (XAS) y si vengo de apagado....                            
                            slideWrapperMaestro = that.mostrarSlide(slideWrapperMaestro, plantillaMaestra, slide, wrapper, true);
                        }

                    }
                }

                //---------auditoria big data

                if (Dnv.bigdata && Dnv.cfg.getCfgBoolean("MedicionAudiencia_BigData", false)) {
                    if (!inicioSlideTimestamp) {
                        inicioSlideTimestamp = new Date();
                        inicioSlide = slide;
                    } else {
                        finSlideTimestamp = new Date();
                        if (inicioSlide.getInsercionActual()) {
                            var duracionInsercion = (finSlideTimestamp.getTime() - inicioSlideTimestamp.getTime()) / 1000;
                            if (duracionInsercion <= inicioSlide.getInsercionActual().getRecurso().getDuracion() * 0.8) {
                                console.error("[INSERCIONES][ES MAESTRO: " + Dnv.sincronizacion.isMaestro() + "] Insercion: " + inicioSlide.getInsercionActual().getCodigo() + " (" + inicioSlide.getInsercionActual().getDenominacion() + ") se ha cortado antes de tiempo");
                                if (Dnv.monitor.sendLogRabbit && Dnv.sincronizacion.isMaestro()) Dnv.monitor.sendLogRabbit("[INSERCIONES][ES MAESTRO: " + Dnv.sincronizacion.isMaestro() + "] Insercion: " + inicioSlide.getInsercionActual().getCodigo() + " (" + inicioSlide.getInsercionActual().getDenominacion() + ") se ha cortado antes de tiempo", "ERROR");
                            } else {
                                Dnv.monitor.writeLogFile("Envio big data insercion: " + inicioSlide.getInsercionActual().getDenominacion() + " , Slide: " + inicioSlide.getDenominacion());
                                Dnv.bigdata.sendAuditoria(inicioSlideTimestamp, finSlideTimestamp, inicioSlide.getInsercionActual());
                            }
                        } else if (inicioSlide.HasHuecoSSP()) {
                            var json;
                            var nombre;
                            var recurso;
                            if (inicioSlide.GetTypeOfSSP() == "3") {
                                //Hivestack
                                json = JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", ""));
                                nombre = "Hivestack";
                                recurso = Dnv.SSP.Hivestack.Ad.mediaFile;
                            } else if (inicioSlide.GetTypeOfSSP() == "6") {
                                json = Dnv.SSP.Admooh.Cfg;
                                nombre = "Admooh";
                                recurso = Dnv.SSP.Admooh.Ad.mediaFile;

                            } else if (inicioSlide.GetTypeOfSSP() == "7") {
                                json = Dnv.SSP.PlaceExchange.Config;
                                nombre = "PlaceExchange";
                                recurso = Dnv.SSP.PlaceExchange.Ad.mediaFile
                            }
                            var metadatosH = { "SectorTabla": -1, "CostePorPase": 0, "CostePorOjo": 0 };
                            var insercionSSP = new Dnv.Pl.Insercion(json.campanya.id_insercion, json.campanya.objid_insercion, 0, nombre, parseInt(json.campanya.id_campanya), /*id*/ 0, /*empresa*/ 0, /*fecha_inicio*/ 0, /*fecha_final*/ 0, /*hora_inicio*/ 0, /*hora_fin*/ 0, /*content*/ 0, /*recurso*/ 0, /*content_plantilla*/ 0, /*tipo_content*/ 0, /*orden*/ 0,
                                /*vinculo*/
                                0, /*cliente*/ json.campanya.empresa, /*Circuito*/ Dnv.Pl.lastPlaylist.getPlayer().getMetadatos()["Circuito"], /*frecuencia*/ 0,
                                /*frecuenciaValue*/
                                0, /*duracion*/ 0, /*duracionAuto*/ 0, /*pasesPorloop*/ 0, /*loop por pase*/ 0, /*aleatorio*/ 0, /*metadatos*/ metadatosH, /*calendarios*/ 0,
                                /*condiciones*/
                                0, /*condicionesDemograficas*/ 0, /*prioridad*/ 0, /*estado*/ 0);
                            console.info(".SSP." + nombre + ": Envio impression creativo y es " + recurso);


                            Dnv.bigdata.sendAuditoria(inicioSlideTimestamp, finSlideTimestamp, insercionSSP);

                        } else if (inicioSlide.IsCapsulaAuditada()) {

                            var json = JSON.parse(inicioSlide.GetJsonAuditoria());

                            var metadatosH = { "SectorTabla": json.SectorTabla, "CostePorPase": json.CostePorPase, "CostePorOjo": json.CostePorOjo };
                            var insercionPlantilla = new Dnv.Pl.Insercion(json.id_insercion, json.objid_insercion, 0, inicioSlide.getDenominacion() /* Nombre*/, parseInt(json.id_campanya), /*id*/ 0, /*empresa*/ 0, /*fecha_inicio*/ 0, /*fecha_final*/ 0, /*hora_inicio*/ 0, /*hora_fin*/ 0, /*content*/ 0, /*recurso*/ 0, /*content_plantilla*/ 0, /*tipo_content*/ 0, /*orden*/ 0,
                                /*vinculo*/
                                0, /*cliente*/ json.empresa, /*Circuito*/ Dnv.Pl.lastPlaylist.getPlayer().getMetadatos()["Circuito"], /*frecuencia*/ 0,
                                /*frecuenciaValue*/
                                0, /*duracion*/ 0, /*duracionAuto*/ 0, /*pasesPorloop*/ 0, /*loop por pase*/ 0, /*aleatorio*/ 0, /*metadatos*/ metadatosH, /*calendarios*/ 0,
                                /*condiciones*/
                                0, /*condicionesDemograficas*/ 0, /*prioridad*/ 0, /*estado*/ 0);
                            Dnv.monitor.writeLogFile("Envio big data insercion Slide: " + inicioSlide.getDenominacion());

                            Dnv.bigdata.sendAuditoria(inicioSlideTimestamp, finSlideTimestamp, insercionPlantilla);
                        } else if (Menu._mostrarInfoAudiencia) {
                            Menu.showInfoAudiencia();
                        }
                        inicioSlideTimestamp = finSlideTimestamp;
                        inicioSlide = slide;
                    }
                }

                //---------auditoria

                if (Dnv.auditoria.getLastAuditado()) {
                    Dnv.auditoria.setFinSlide(new Date());
                    Dnv.auditoria.setLastAuditado(false);
                }

                if (Dnv.cfg.getCfgInt("Salida_Auditoria", 0) == 1) {
                    //auditamos plantilla

                    //bigdata
                    if (Dnv.Variables.sendBigData != 0) {

                        try {

                            var now = new Date;
                            var utc_timestamp = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
                            var timestamp = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000 * -1));
                            var time_zone = new Date().getTimezoneOffset() / 60 * -1;
                            $.ajax({
                                type: "POST", // Plantilla| Object ID de la salida | tipo de funcionalidad (En tu caso la 2) | la fecha UTC | La franja horaria UTC | el valor 1 Hay Alguien 2 ha dejado de haber alguien | timezone GMT en el que me encuentro| Fecha Local es decir UTC + GTM | y la franja Horaria local.
                                data: { "Plantilla": slide.getPlantilla().getCodigo(), "ObjIDSalida": Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo(), "Tipo": Dnv.Variables.sendBigData, "Fecha": utc_timestamp, "FH": now.getUTCHours(), "valor": 1, "timezone": time_zone, "FechaLocal": timestamp.getTime(), "FHLocal": new Date().getHours() },
                                url: Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getCfgString("IPMaster", Dnv.deviceInfo.ipServer()) + "/WSResources/BigData.asmx/SetData?t=" + new Date().getTime(), //?Plantilla=" + 896767 + "&ObjIDSalida=" + 3816806 + "&Tipo=" + 1 +"&Fecha=" + utc_timestamp + "&FH=" + now.getUTCHours() + "&valor=" +inte ,
                                contentType: 'application/json; charset=utf-8',
                                dataType: "jsonp",
                                jsonpCallback: "test", //La funcion callBack es la que va a llamar mi WS cuando complete la operación yo la he llamado test tu llamala como consideres.

                                error: function(xhr, status, err) {
                                    console.error("[BIGDATA] Error: " + err);
                                }
                            });

                        } catch (e) {
                            console.error("[BIGDATA] Error: " + e);
                        }

                        Dnv.Variables.sendBigData = 0;

                        /**

                        function errHandler(e) {
                        console.error("[BIGDATA] Error: " + e);
                        }

                        var xmlhttp = new XMLHttpRequest();
                        var date = new Date();
                        xmlhttp.onerror = errHandler;
                        xmlhttp.timeout = 4500;
                        xmlhttp.ontimeout = errHandler;
                        xmlhttp.open("POST", "http://" + Dnv.deviceInfo.getIPServerAsync() + "/WSResources/BigData.asmx/SetData?t=" + date.getTime());
                        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                        xmlhttp.send(JSON.stringify({ "callback" : "", "Plantilla": slide.getPlantilla().getCodigo(), "ObjIDSalida": Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo(), "Tipo": Dnv.Variables.sendBigData, "Fecha": date.getTime(), "FH": date.getUTCHours(), "valor": 1, "timezone": date.getTimezoneOffset()/60, "FechaLocal": date.getTime() + (date.getTimezoneOffset() * 60 * 1000), "FHLocal": date.getHours() }));
                        Dnv.Variables.sendBigData = 0;

                        **/

                    }

                    //PLANTILLAS
                    if (slide.getPlantilla().getAuditar() > 0) {
                        console.log("Auditando plantilla " + slide.getPlantilla().getCodigo());
                        Dnv.auditoria.setLastAuditado(true);
                        Dnv.auditoria.auditarPlantilla(slide.getPlantilla());

                        //auditamos todos los recursos
                        var capas = slide.getPlantilla().getCapas(slide.getCodigo());
                        for (var i = 0; i < capas.length; i++) {
                            if (capas[i].isAuditable()) {
                                var recurso = capas[i].getRecurso();

                                if ((!Dnv.utiles.soportaFlash() || !preferirFlashAHtml5 || !recurso) && capas[i].getRecursoHtml5()) {
                                    recurso = capas[i].getRecursoHtml5();
                                }


                                /*if (!recurso) {
                                if (capas[i].getTipoCapa() === Dnv.Pl.Capa.tipos.TIPO_SMARTOBJECT) {
                                recurso = capas[i].getRecursoHtml5();
                                }
                                }*/
                                if (recurso) {
                                    if (recurso.isDisponible()) { //RAG Comprobar.. 
                                        if (capas[i].getTipoCapa() != Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                                            Dnv.auditoria.auditarRecurso(slide.getPlantilla(), capas[i].getCodigo(), capas[i].getTipoCapa(), recurso);
                                        }
                                    }
                                } else {
                                    // CAR: ¿Tipo URL y demas?
                                    console.warn("No se puede auditar la capa " + capas[i].getCodigo() + " de tipo " + capas[i].getTipoCapa());
                                    continue;
                                }
                            }
                        }
                    }

                    //MAESTRAS
                    //var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByCodigo(slide.getPlantilla().getMaestra());
                    var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByVinculo(Dnv.helpers.getMaestra(slide));

                    //llamamos siempre aquí. si no hay maestra, cierra la auditoría anterior..
                    //también comprobamos dentro getAuditar.

                    //TODO RAG: la plantilla maestra no se audita como plantilla, auditamos sus recursos. ? comprobar..
                    //Dnv.auditoria.auditarPlantillaMaestra(plantillaMaestra, slide.getPlantilla());

                    if (plantillaMaestra != undefined && slide.getPlantilla().getAuditar() > 0) {
                        var capas = plantillaMaestra.getCapas();
                        for (var i = 0; i < capas.length; i++) {
                            if (capas[i].isAuditable() && capas[i].getRecurso().isDisponible()) { //RAG Comprobar.. <- [CAR] ¿? si ha llegado aquí es porque estaba disponible...
                                //Dnv.auditoria.auditarRecursoMaestra(slide.getPlantilla(), capas[i].getCodigo(), capas[i].getTipoCapa(), capas[i].getRecurso());
                                if (capas[i].getTipoCapa() != Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                                    Dnv.auditoria.auditarRecurso(slide.getPlantilla(), capas[i].getCodigo(), capas[i].getTipoCapa(), capas[i].getRecurso());
                                }
                            }
                            //los recursos pertenecen a la contenida, no a la maestra.
                            //Dnv.auditoria.auditarRecursoMaestra(plantillaMaestra, capas[i].getCodigo(), capas[i].getTipoCapa(), capas[i].getRecurso());
                        }
                    }
                }
                //---------fin auditoria

                if (finalizarGapless && anteriorSlide && anteriorSlide.isGapless()) {

                    console.log("PRESENTADOR: Deteniendo video gapless debido a que hay que avanzar finalizando gapless");
                    Dnv.gaplessVideo.stop();
                }

                if (!Main.info.canPlay2Videos) {

                    if (plantilla.hasVideo() && anteriorSlide && anteriorSlide.hasVideo()) {



                        if (codMaestra == 0 ||
                            codMaestra !== anteriorCodigoPlantillaMaestra ||
                            ((codMaestra && codMaestra === anteriorCodigoPlantillaMaestra &&
                                !Dnv.Pl.lastPlaylist.getPlantillaByVinculo(codMaestra).hasVideo()))) {


                            /*                        
                             * Esto se hace por problemas en LG (sincronizacion del ise) cuando hay dos videos sincronizasos seguidos 
                             * el problema es que si pausamos el video viejo despues de hacer el play en el nuevo, el nuevo se pausa
                             *
                             * Aplicamos esto solo si la plantilla vieja y la nueva tienen video, y si lo tienen miramos si el video en el
                             * que coinciden es de la maestra
                             */

                            //var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByVinculo(slide.getPlantilla().getMaestra());
                            // FIXME: Mejorar esto

                            var slidesWrapper = document.getElementById("wrappers");

                            var videos = slidesWrapper.getElementsByTagName("video");
                            for (var i = 0; i < videos.length; i++) {
                                if (videos[i].id != "gaplessVideo") {
                                    console.log("PRESENTADOR: Deteniendo " + videos[i].getAttribute("data-filename-original") + " Pausando video");
                                    videos[i].pause();
                                } else if (videos[i].id == "gaplessVideo" && (hayCambioDeCanal /*|| slide.isInicioGapless()*/)) {
                                    console.log("PRESENTADOR: Deteniendo video gapless");
                                    Dnv.gaplessVideo.stop();
                                    //if (slide.isInicioGapless()) Dnv.gaplessVideo.recargarPlaylist(true);

                                }
                            }
                            var divs = slidesWrapper.getElementsByTagName("div");
                            for (var i = 0; i < divs.length; i++) {
                                if (divs[i].isCustomVideoPlayer) {
                                    console.log("PRESENTADOR: Custom Deteniendo " + divs[i].getAttribute("data-filename-original") + " Pausando custom video");
                                    divs[i].pause();
                                }
                            }

                        }

                    }



                }
                //XAS Eliminamos streaming si el slide actual no tiene streaming
                if (Main.info.engine == "electron") {
                    try {
                        console.info("PRESENTADOR: Streaming comprobamos si el slide tiene Streaming para si no, matarlo");
                        if (!slide.HasStreaming()) {
                            var child_process;
                            var execSync;
                            child_process = require('child_process');
                            execSync = child_process.spawnSync;

                            console.info("PRESENTADOR: Streaming Matamos el ffplay");
                            execSync('pkill', ["ffplay"]);
                            if (Dnv.sincronizacion.isMaestro()) {
                                console.info("PRESENTADOR: Streaming Matamos el ffmpeg");
                                execSync('pkill', ["ffmpeg"]);
                                Dnv.sincronizacion.killffplay();
                            }
                        }
                    } catch (e) {
                        console.error("PRESENTADOR: Streaming ha fallado el matar los procesos" + e);
                    }


                }






                slideWrapper = that.mostrarSlide(slideWrapper, plantilla, slide, wrapper, false);


                that.intercambiarDivs(slideWrapper, slide, wrapper, 0, null, idCarga);

                //rag: hago siempre la llamada, si no tiene maestra slideWrapper será undefined y se debe limpiar el div.

                that.intercambiarDivs(slideWrapperMaestro, slide, wrapper, codMaestra, anteriorSlide, idCarga, VengoApagado);

                // guardo el idioma en el que se ha mostrado el slide, y aumento el contador de idioma del slide
                var codigoSlideAnterior = slide.getCodigo();
                Dnv.Pl.lastPlaylistIdiomaAnterior[codigoSlideAnterior] = Dnv.Pl.lastPlaylistIdiomaActual[codigoSlideAnterior];
                Dnv.Pl.lastPlaylistIdiomaActual[codigoSlideAnterior]++;
                // si ha mostrado el ultimo idioma de la salida, se vuelve al primero
                if (Dnv.Pl.lastPlaylistIdiomaActual[codigoSlideAnterior] > (Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas().length - 1)) {
                    Dnv.Pl.lastPlaylistIdiomaActual[codigoSlideAnterior] = 0;
                }

                //TODO RAG. si vemos que ralentiza presentacion poner un settimeout o cambiar de sitio la llamada
                Dnv.limpieza.actualizarListadoRecursosFromSlide(slide);


                // NOW-SHOWING
                Dnv.engine_helpers.enviarNowShowing(pl, slide);
                /*
                var extraInfo = new Object();

                extraInfo.IP = Dnv.deviceInfo.ip();

                if (Dnv.sincronizacion.isMaestro()) {
                    extraInfo.Maestro = "true";
                    extraInfo.NumeroNodos = Dnv.sincronizacion.getNumNodosConectados();
                } else if (Dnv.sincronizacion.isEsclavo()) {
                    extraInfo.Maestro = "false";
                    extraInfo.IPMaestro = Dnv.sincronizacion.getIPServidor();
                }

                var salida = Dnv.Pl.lastPlaylist.getPlayer().getSalida();

                var calendario = 0;
                if (salida.getPantalla().getCalendarios()[Dnv.Calendarios.Cal.tipos.CANAL]) calendario = salida.getPantalla().getCalendarios()[Dnv.Calendarios.Cal.tipos.CANAL].getCodigo();

                var insercion = slide.getInsercionActual();

                if (insercion) {
                    extraInfo.Duracion = insercion.getDuracion().toString() + " s";
                    Dnv.servidor.setNowShowingPubli(salida.getCodigo(),
                        calendario,
                        slide.getCanal().getCodigo(),
                        slide.getCodigo(),
                        insercion.getCampanya(),
                        insercion.getCodigo(),
                        insercion.getRecurso().getCodigo(),
                        slide.getPlantilla().getCodigo(),
                        Dnv.utiles.formatearFechaWCF(new Date(), false),
                        JSON.stringify(extraInfo)
                    );
                } else {
                    extraInfo.Duracion = slide.getDuracion().toString() + " s";
                    Dnv.servidor.setNowShowingPubli(salida.getCodigo(),
                        calendario,
                        slide.getCanal().getCodigo(),
                        slide.getCodigo(),
                        0,
                        0,
                        0,
                        slide.getPlantilla().getCodigo(),
                        Dnv.utiles.formatearFechaWCF(new Date(), false),
                        JSON.stringify(extraInfo)
                    );
                }

                */
                /*
                 * Puesto que hay dispositivos que no soportan con varios videos, no podemos precargar directamente,
                 * sino cuando acabe la transición al intercambiar los divs
                 * TODO: para simplificar, lo hago con un setTimeout, aunque lo suyo seria hacerlo en el listener de la transicion
                 * TODO: la precarga no maneja la maestra
                 */
                //that.precargarNextSlide();
                if (_precargaTimeoutId) clearTimeout(_precargaTimeoutId);
                _precargaTimeoutId = null;
                if (Dnv._DO_PRECARGA && Dnv._DO_PRECARGA_NO_FIRST) {
                    var delayEsclavo = 0;
                    _precargaTimeoutId = setTimeout(function() {
                        _precargaTimeoutId = null;
                        that.precargarNextSlide();
                    }, Dnv._PRECARGA_DELAY + delayEsclavo);
                }
                Dnv._DO_PRECARGA_NO_FIRST = true;
            }

            //var ahora = new Date().getTime();
            //setTimeout(function () { console.log("setTimeout Mostrando con delay " + (new Date().getTime() - ahora)); }, 150);
            //Dnv.engineTimer.anadirTimeout(function () { console.log("engineTimer Mostrando con delay " + (new Date().getTime() - ahora)); }, 150);

            delay = 0;

            if (delay > 0) {
                console.log("Mostrando con delay " + delay);
                setTimeout((function closure(idCarga) { return cargarYMostrar(idCarga) })(id), delay);

            } else {
                cargarYMostrar(id);
            }

            //if (timeInicio) {

            console.log("[SINCRONIZACION] timeSincronizacion " + timeSincronizacion);
            if (timeSincronizacion) {
                var delayPlay = timeSincronizacion - new Date().getTime();
                console.log("[SINCRONIZACION] delayPlay " + delayPlay);

                setTimeout(function() {


                    var slidesWrapper = document.getElementById("wrappers");
                    var videos = slidesWrapper.getElementsByTagName("video");

                    if (Main.info.engine == "brightsign") {
                        console.log("[SINCRONIZACION] Haciendo play");
                        /**
                        if (Dnv.sincronizacion.isMaestro()) {
                        Dnv.sincronizacion.getVideoSync().SetMaster(1);
                        Dnv.sincronizacion.getVideoSync().Synchronize("syncVideo", 1000);
                        }**/
                        for (var i = 0; i < videos.length; i++) {
                            if (videos[i].syncVideo) videos[i].play();
                            console.log("[SINCRONIZACION] Hecho play");
                        }
                    } else if (Main.info.engine == "electron") {
                        if (Dnv.sincronizacion.isMaestro()) {
                            if (controller) {
                                try {
                                    /**
                                    setTimeout(function () {
                                    controller.currentTime = 0.0;
                                    controller.play();
                                    }, 250);
                                    **/
                                } catch (e) {
                                    console.error("[SINCRONIZACION] No se pudo hacer el play " + e);
                                }
                            }
                        }
                    } else {
                        for (var i = 0; i < videos.length; i++) {
                            if (videos[i].syncVideo) videos[i].play();
                            console.log("[SINCRONIZACION] Hecho play");
                        }
                    }

                }, (delayPlay > 0 ? delayPlay : 1));

            }

            //}


        }
    };

})();
/*
Dnv.engineTimer = (function () {

    var callbacks = [];

    function timerCallback() {
        var ahora = new Date().getTime();
        for (var i = 0; i < callbacks.length; i++) {

            if (ahora >= callbacks[i].callbackTime) {
                var cb = callbacks[i];
                callbacks.splice(i, 1);
                cb.ejecutar();
            }

        }


    }

    var timerId = setInterval(timerCallback, 50);

    return {
        anadirTimeout: function (callback, delay) {
            callbacks.push({ejecutar: callback, callbackTime: new Date().getTime() + delay});
        }
    };

})();
*/

// Parece ser que TransIT hace una burrada de llamadas, asi que se limita el número de llamadas que hacen
var lastExternalCall = 0;

window.external = {
    URLNext: function() {
        if (new Date().getTime() >= lastExternalCall + 1000) {
            console.log("PRESENTADOR: Llamada a window.external.URLNext");
            // Sin setTimeout el flash se bloquea
            setTimeout(function() { Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), null, null); }, 10);
        } else {
            console.warn("PRESENTADOR: Llamada a window.external.URLNext bloqueada por exceso de llamadas");
        }
        lastExternalCall = new Date().getTime();
    },
    urlNext: function() {
        if (new Date().getTime() >= lastExternalCall + 1000) {
            console.log("PRESENTADOR: Llamada a window.external.urlNext");
            setTimeout(function() { Dnv.presentador.avanzarSlide(document.getElementById("wrapper"), null, null); }, 10);
        } else {
            console.warn("PRESENTADOR: Llamada a window.external.urlNext bloqueada por exceso de llamadas");
        }
        lastExternalCall = new Date().getTime();

    },
    urlNextDirectamente: function() {
        if (new Date().getTime() >= lastExternalCall + 1000) {
            console.log("PRESENTADOR: Llamada a window.external.urlNextDirectamente");
            Dnv.presentador.avanzarSlideDirectamente();
        } else {
            console.warn("PRESENTADOR: Llamada a window.external.urlNextDirectamente bloqueada por exceso de llamadas");
        }
        lastExternalCall = new Date().getTime();
    },
    setVariable: function(data) {
        console.log("PRESENTADOR: Llamada a window.external.setVariable");
        Dnv.Variables.actualizarValor(data.variable, data.valor);
    },
    getVariable: function(idSmo, data) {
        console.log("PRESENTADOR: Llamada a window.external.getVariable");
        Dnv.Smo.sendToIframe(idSmo, "SMO.getVariable", { variable: data.variable, valor: Dnv.Pl.Variables[parseInt(data.variable)].getValor() });
    },
    LogFlash: function(e) { console.log("PRESENTADOR: Llamada a window.external.LogFlash(" + e + ")"); },
    ExitInteractivity: function() {
        console.log("PRESENTADOR: Llamada a window.external.ExitInteractivity");
        setTimeout(function() { Dnv.controlInteractividad.onPasoANoInteractivo(); }, 10);
    },
    CloseBrowser: function() { console.log("PRESENTADOR: Llamada a window.external.CloseBrowser"); },
    ShowBrowser: function() { console.log("PRESENTADOR: Llamada a window.external.ShowBrowser"); }
};

/*
Funcionamiento de los SmartObjects HTML5 (esta es una de las primeras versiones, quizá se cambie en el futuro)

Los SmartObjects HTML5 vienen empaquetados en archivos .wgt, que son realmente archivos zip renombrados

Estos archivos se descomprimen a un directorio local, y cuando hay que mostrarlos, se carga su index.html dentro de un iframe

Al cargar el index.html se añaden las flashvars de los smartobjects flash como querystring, es decir <iframe src="index.html?variable1=value1&variable2=value2"

Además de las flashvars, se pasan las siguientes variables:
- ancho Ancho del iframe
- alto Alto del iframe
- myID Id que damos al iframe. Le generamos nosotros y será único. Esto nos permite identificar al iframe remitente cuando recibamos mensajes

La comunicación entre iframe y nosotros se hace mediante postMessage y onmessage https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage

Estas llamadas nos permiten pasar objetos sencillos.
    Chrome no parece soportar llamadas directas a funciones de los iframes, si lo soportase podriamos pasar cualquier objeto
    Lo que hacemos es parar un objeto con los siguientes campos
    {
        target: funcion de la otra página que queremos invocar (Dnv.onSmoLoad, SMO.Start)
        idSMO: id de la pagina remitente (solo lo mandan los smartobjects)
        paramArray: parametros para la función...
            Lo que nos estan pasando ahora mismo es un array con un objeto {myID: id del iframe, txt: mensaje de texto}
    }

    Cuando el SmartObject se carga inicializa cosas internas y llama a nuestro Dnv.onSmoLoad
    Pero si el SmartObject necesita un DataSource, no llamará a Dnv.onSmoLoad hasta que le hayamos pasado el DataSource
        En este caso lo que hacemos es escuchar tambien nosotros el evento onLoad y mandar un mensaje SMO.SetDatasource con el xml del datasource
        En caso de que el datsource cambie durante la reproduccion, tambien se hace un SetDatasource, por si el SmartObject quiere cambiar sus contenidos
    Cuando vayamos a mostrarlo, lanzamos SMO.Start. Ahora mismo se hace segun llega el onSmoLoad, pero en el futuro el SmartObject se cargará mientras
    haya otras cosas en pantalla, y se iniciará cuando se haga el cambio para mostrar el SmartObject

*/


// Callbacks de SmartObjects HTML5
Dnv.Smo = (function() {
    // "Diccionario" que asocia el id del iframe html5 con el codigo de su datasource
    var mapIframeDs = {};
    // "Diccionario" que asocia el id del iframe html5 con el codigo de su localData
    var mapIframeLd = {};
    // "Diccionario" que asocia el id del iframe html5 con el codigo de tipo de aviso al que corresponde
    var mapIframeAvisos = {};

    // "Diccionario" que asocia el codigo de datasource con un array de los iframes html5 que lo usan
    var mapDsIframes = {};
    // "Diccionario" que asocia el codigo de localData con un array de los iframes html5 que lo usan
    var mapLdIframes = {};
    // "Diccionario" que asocia del codigo de tipo de aviso con un array de los iframes html5 que son del mismo
    var mapAvisosIframes = {};

    var _cargarDsEnIframe = function(codDs, idIframe) {
        if (codDs.indexOf(";") != -1 && document.getElementsByClassName("secuencia").length > 0) { //Es una secuencia de HTML5s con varios datasources
            if (document.getElementById(idIframe).parentElement.getAttribute("contador") != undefined) {
                codDs = codDs.split(";")[parseInt(document.getElementById(idIframe).parentElement.getAttribute("contador"))];
            } else {
                codDs = codDs.split(";")[0];
            }

        }
        Dnv.Cloud.downloader.getXmlDataSource(codDs, function(data) {
            //console.log("Cargando " + data + " en " + idIframe);
            if (data) {
                _sendToIframe(idIframe, "SMO.setDatasource", { xml: data });
            }
        });
    };

    var _cargarLdEnIframe = function(localData, idIframe) {
        Dnv.Cloud.downloader.getLocalData(localData, function(data) {
            //console.log("Cargando " + data + " en " + idIframe);
            if (data) {
                _sendToIframe(idIframe, "SMO.setDatasource", { xml: data });
            }
        });
    };

    var _cargarXmlEnIframe = function(codDs, xml, idIframe) {
        //console.log("[SMO HTML5] Cargando xml en " + idIframe);
        _sendToIframe(idIframe, "SMO.setDatasource", { xml: xml });
    };

    var _setAviso = function(id, msg, times, priority, incidence, lang, idIframe) {
        _sendToIframe(idIframe, "setAvisoArgs", { id: id, msg: msg, times: times, priority: priority, incidence: incidence, lang: lang });
    };

    var _setAvisoDuracion = function(id, msg, times, priority, incidence, lang, time, idIframe) {
        _sendToIframe(idIframe, "setAvisoDuracionArgs", { id: id, msg: msg, times: times, priority: priority, incidence: incidence, lang: lang, time: time });
    };

    var _sendToIframe = function sendToIframe(idIframe, target, obj) {
        var iframe = document.getElementById(idIframe);
        if (iframe) {
            var iframeWindow = iframe.contentWindow;
            iframeWindow.postMessage({ target: target, objData: obj }, "*");
        } else {
            //
            console.warn("Estamos enviando un mensaje (" + target + ", " + obj + ") a un iframe (" + idIframe + ") inexistente");
        }
    }

    return {

        /**
         * Ejemplo sendToParent(idIframe, "Dnv.metodo", arg1, arg2, arg3)
         */
        sendToIframe: _sendToIframe,
        cargarDsEnIframe: _cargarDsEnIframe,
        cargarLdEnIframe: _cargarLdEnIframe,
        onDatasourceActualizado: function(codDs, xml) {
            if (mapDsIframes[codDs] !== undefined) {
                mapDsIframes[codDs].forEach(function(element, index, array) {
                    if (document.getElementById(element)) {
                        _cargarXmlEnIframe(codDs, xml, element);
                    }
                });
            }
        },
        onLocalDataActualizado: function(codDs, xml) {
            if (mapLdIframes[codDs] !== undefined) {
                mapLdIframes[codDs].forEach(function(element, index, array) {
                    if (document.getElementById(element)) {
                        _cargarXmlEnIframe(codDs, xml, element);
                    }
                });
            }
        },
        setAviso: function(id, tipoAviso, msg, times, priority, incidence, lang) {
            console.log("[AVISOS][SMO HTML5] Pintando aviso: " + id);
            if (mapAvisosIframes[tipoAviso] !== undefined) {
                mapAvisosIframes[tipoAviso].forEach(function(element, index, array) {
                    if (document.getElementById(element)) {
                        _setAviso(id, msg, times, priority, incidence, lang, element);
                        document.getElementById(element).style.opacity = 1;
                    }
                });
            }
        },
        setAvisoDuracion: function(id, tipoAviso, msg, times, priority, incidence, lang, time) {
            console.log("[AVISOS][SMO HTML5] Pintando aviso: " + id);
            if (mapAvisosIframes[tipoAviso] !== undefined) {
                mapAvisosIframes[tipoAviso].forEach(function(element, index, array) {
                    if (document.getElementById(element)) {
                        _setAvisoDuracion(id, msg, times, priority, incidence, lang, time, element);
                        document.getElementById(element).style.opacity = 1;
                        /**
                        setTimeout(function () {
                            if (document.getElementById(element)) document.getElementById(element).style.opacity = 0;
                            Dnv.avisos.currentAviso = undefined;
                        }, time * 1000 + 100);
                        **/
                    }
                });
            }
        },
        registrarIframe: function(iframeId, codDs) {
            console.log("Registramos DS " + codDs + " " + iframeId);
            mapIframeDs[iframeId] = codDs;
            if (mapDsIframes[codDs] === undefined) {
                mapDsIframes[codDs] = new Array();
            }
            mapDsIframes[codDs].push(iframeId);
        },
        registrarIframeLd: function(iframeId, localData) {
            console.log("Registramos LD " + localData + " " + iframeId);
            mapIframeLd[iframeId] = localData;
            if (mapLdIframes[localData] === undefined) {
                mapLdIframes[localData] = new Array();
            }
            mapLdIframes[localData].push(iframeId);
        },
        resgistrarIframeAvisos: function(iframeId, tipoAviso) {
            console.log("Registramos iframe avisos " + iframeId);
            mapIframeAvisos[iframeId] = tipoAviso;
            if (mapIframeAvisos[tipoAviso] === undefined) {
                mapAvisosIframes[tipoAviso] = new Array();
            }
            mapAvisosIframes[tipoAviso].push(iframeId);
        },
        desregistrarIframe: function(iframeId, codDs) { // FIXME: No siempre se llama aqui (en caso de error, por ejemplo)
            console.log("Desregistramos DS " + codDs + " " + iframeId);
            delete mapIframeDs[iframeId];
            if (mapDsIframes[codDs] !== undefined) {
                mapDsIframes[codDs].splice(mapDsIframes[codDs].indexOf(iframeId), 1);
            }
        },
        desregistrarIframeLd: function(iframeId, localData) { // FIXME: No siempre se llama aqui (en caso de error, por ejemplo)
            console.log("Desregistramos LD " + localData + " " + iframeId);
            delete mapIframeLd[iframeId];
            if (mapLdIframes[localData] !== undefined) {
                mapLdIframes[localData].splice(mapLdIframes[localData].indexOf(iframeId), 1);
            }
        },
        desregistrarIframeAvisos: function(iframeId, tipoAviso) {
            console.log("Desregistramos iframe avisos " + iframeId);
            delete mapIframeAvisos[iframeId];
            if (mapIframeAvisos[tipoAviso] !== undefined) {
                mapIframeAvisos[tipoAviso].splice(mapIframeAvisos[tipoAviso].indexOf(iframeId), 1);
            }
        },
        /* Devuelve el codigo de DataSource que esta cargado en ese iframe */
        getCodDsForIframe: function(iframeId) {
            return mapIframeDs[iframeId];
        },
        /* Devuelve el codigo de LocalData que esta cargado en ese iframe */
        getCodLdForIframe: function(iframeId) {
            return mapIframeLd[iframeId];
        },
        /* Devuelve el codigo de tipo de aviso de ese iframe */
        getCodAvisosForIframe: function(iframeId) {
            return mapIframeAvisos[iframeId];
        },
        /* Devuelve un array de identificadores de iframes con SMOs que usan ese DataSource */
        getIframesForCodDs: function(codDs) {
            return mapDsIframes[codDs];
        },
        /* Devuelve un array de identificadores de iframes con SMOs que usan ese LocalData */
        getIframesForCodLd: function(localData) {
            return mapLdIframes[localData];
        },
        /* Devuelve un array de identificadores de iframes con SMOs con ese tipo de avisos */
        getIframesForCodAvisos: function(tipoAviso) {
            return mapAvisosIframes[tipoAviso];
        }
    };


})();
(function() {

    Dnv.smoCallbacks = {
        onSmoLoad: function(idSmo, obj) {
            //console.log("[SMO HTML5] Arrancando smartobject (load) " + idSmo);
            //Dnv.Smo.sendToIframe(obj.myID, "SMO.start", obj.myID);
            var cod = Dnv.Smo.getCodDsForIframe(idSmo);
            console.log("[SMO HTML5] Arrancando smartobject (load) " + idSmo + " " + cod);
            if (cod && cod != 0) { // El 0 es que no hay datasource
                if (cod.indexOf(";") != -1 && document.getElementsByClassName("secuencia").length > 0) { //Es una secuencia de HTML5s con varios datasources
                    cod = cod.split(";")[parseInt(document.getElementById(idSmo).parentElement.getAttribute("contador"))];
                }
                Dnv.Smo.cargarDsEnIframe(cod, idSmo);
            } else {
                cod = Dnv.Smo.getCodLdForIframe(idSmo);
                if (cod) Dnv.Smo.cargarLdEnIframe(cod, idSmo);
            }
            //Dnv.Smo.sendToIframe(obj.myID, "SMO.start", obj.myID);
        },
        onSmoReady: function(idSmo, obj) {
            console.log("[SMO HTML5] Arrancando smartobject (ready) " + idSmo);
            Dnv.Smo.sendToIframe(idSmo, "SMO.start");
        },
        smoLog: function(idSmo, obj) {
            switch (obj.level) {
                case 0:
                    console.log('[SMO HTML5] ' + idSmo + ': [' + obj.txt + ']');
                    break;
                case 1:
                    console.info('[SMO HTML5] ' + idSmo + ': [' + obj.txt + ']');
                    break;
                case 2:
                    console.warn('[SMO HTML5] ' + idSmo + ': [' + obj.txt + ']');
                    break;
                case 3:
                    console.error('[SMO HTML5] ' + idSmo + ': [' + obj.txt + ']');
                    break;
                case 4:
                    console.error('[SMO HTML5] ' + idSmo + ': [' + obj.txt + ']');
                    break;
                default:
                    console.warn('[Nivel desconocido: ' + obj.level + '][SMO HTML5] ' + idSmo + ': [' + obj.txt + ']');
                    break;
            }
        },
        smoAlarma: function(idSmo, obj) {
            Dnv.alarmas.enviarAlarma(obj.level, "Alarma de " + idSmo + ": " + obj.txt);
        },
        reiniciarDispositivo: function(idSmo, obj) {
            console.warn("¡¡¡El SMO " + idSmo + " pide reiniciar la pantalla!!! Razón: " + obj.txt);
            Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "¡¡¡El SMO " + idSmo + " pide reiniciar la pantalla!!! Razón: " + obj.txt);
            setTimeout(Dnv.monitor.restart, 5000); //dejamos un tiempo porque si no, puede que no loguer o que no guarde los datos
        },
        //Dnv.RefreshDataSource = function () { };
        //Dnv.RefreshDataSouce = Dnv.RefreshDataSource;
        urlNext: function(data) {
            window.external.URLNext();
        },
        URLNext: function(data) {
            window.external.URLNext();
        },
        urlNextDirectamente: function(idSmo, data) {
            window.external.urlNextDirectamente();
        },
        setVariable: function(idSmo, data) {
            window.external.setVariable(data);
        },
        getVariable: function(idSmo, data) {
            window.external.getVariable(idSmo, data);
        },
        getFile: function(idSmo, obj) {
            console.log("[SMO HTML5] GetFile solicitado por " + idSmo);
            //Dnv.Smo.sendToIframe(obj.myID, "SMO.start", obj.myID);
            var cod = Dnv.Smo.getCodDsForIframe(idSmo);
            if (cod && cod != 0) { // El 0 es que no hay datasource
                Dnv.Smo.cargarDsEnIframe(cod, idSmo);
            } else {
                cod = Dnv.Smo.getCodLdForIframe(idSmo);
                if (cod) Dnv.Smo.cargarLdEnIframe(cod, idSmo);
            }
        },
        setLocalData: function(idSmo, obj) {
            console.log("[SMO HTML5] setLocalData llamado por " + idSmo + " para el fichero " + obj.nameData);
            Dnv.Smo.onLocalDataActualizado(obj.nameData, obj.data);
            Dnv.monitor.writeFile(Dnv.Cloud._STATIC_PATH + obj.nameData, obj.data);
        },
        getCurrentStream: function(idSmo, obj) {
            console.log("[SMO HTML5] getCurrentStream " + idSmo);
            Dnv.Smo.sendToIframe(idSmo, "SMO.setCurrentStream", Dnv.controlCalendarios.getStreamActual());

        },
        finAviso: function(idAviso) {
            console.log("[AVISOS][SMO HTML5] Fin de aviso: " + idAviso);
            document.getElementById(idAviso).style.opacity = 0;
            Dnv.avisos.currentAviso = undefined;
        }
    };

    window.onmessage = function(e) {

        if (!e.data.idSmo && !Dnv.controlInteractividad.isInInteractivoHTML5()) {
            console.warn("[MOTOR]: Recibido mensaje de SMO desconocido, lo ignoramos: " + e.origin + "(" + e.data.idSmo + "): " + JSON.stringify(e.data) + " " + (typeof e.data));
            return;
        } else if (!e.data.idSmo && Dnv.controlInteractividad.isInInteractivoHTML5()) {
            console.log("[MOTOR]: Recibido mensaje de SMO: " + e.origin + "(" + e.data.idSmo + "): " + JSON.stringify(e.data) + " " + (typeof e.data));
            e.data.idSmo = "INTERACTIVOHTML5";
        }
        if (e.data.idSmo && e.data.target && e.data.target.indexOf('Dnv.smoCallbacks.') === 0) { // Por seguridad solo dejamos llamar a los callbacks
            var targets = e.data.target.split('.');

            var fn = window;
            var obj = window;
            for (var i = 0; i < targets.length; i++) {
                obj = fn;
                fn = obj[targets[i]];
                if (fn === undefined) {
                    console.error("La petición hace referencia a una función inexistente: " + e.data.target);
                    return;
                }
            }
            fn.call(obj, e.data.idSmo, e.data.objData); // conservamos el valor de this

        } else {
            console.error('[SMO HTML5] Target inesperado ' + e.data.target);
        }

    };

})();