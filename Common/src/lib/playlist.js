/*
 *
reemplazar los callbacks en cada paso de pagina
- antes de reemplazarlo hay que eliminar todo aquello que pudiera hacer saltar el callback...
    - el onended del video
    - el fin de la secuencia
    - los urlnext de los smos <- 
- tambien se aplica a os ids de las secuencias (para que el avanzar se aplique en el siguietnte slide y comience a reproducir)

HECHO - una opcion seria mirar si el objeto sigue en el DOM...

HECHO setTimeout(function () {if (document.getElementsByTagName("object")[0].PercentLoaded() === 0){;}, 5000)}



HECHO guardar y recuperar el estado de reloj maestro del elemento, o bien mirando la playlist

Alternado, multiidioma


class Reescalador
    init(resolucion salida, resolucion browser)
    onCambioResolucionBrowser{
        actualizar ratios,
        recorrer cache actualizando...
        cuidado con los onMostrar y innerhtml = outerhtml
        // quiza fuera mejor que el onMostrar reescalase en cada pasada...
        // O mantener una lista de elementos en el reescalador
    }o usar porcentajes de forma que el navegador reescale por nosotros (para pantalla completa es factible, pero para el resto de modos...)
    al venir el metadato en la playlist, podemos aplicar porcentajes cada vez que creamos el elemento y no actualizar
    escalar(elemento){
        var top, left, height, width;
        if (! elemento.getAttribute("data-top-original")) {
            elemento.setAttribute("data-top-original", elemento.top);
            elemento.setAttribute("data-left-original", elemento.left);
            elemento.setAttribute("data-ancho-original", elemento.width);
            elemento.setAttribute("data-alto-original", elemento.height);
            top = elemento.top;
            elemen, left, height, width
        elemento.style.width = ancho * ratio
        ...
    }
	
    registrarElemento(elemento){
        if (! elemento.getAttribute("data-top-original")) elemento.setAttribute("data-top-original") =
    }
    desregistrarElemento(elemento)

 */
"use strict";

//var BORRAME_MODO_PROPORC = 3;

var Dnv = Dnv || {};
Dnv.Pl = Dnv.Pl || {};

Dnv.NEW_PLAYLIST_EVENT = "new_playlist";

Dnv.CFG_URL_BASE_RECURSOS = null;
Dnv.CFG_URL_DATASOURCES = "/datasources/";
Dnv.CFG_PROXY_DATASOURCES = null;

Dnv.CFG_MARGEN_CARGA_RELOJ_MAESTRO = 10; // Ojo, que sea integer

Dnv._CFG_MUTEAR = false; // Ojo, que sea integer


Dnv.Pl.Configure = function Configure() {
    Dnv.CFG_URL_BASE_RECURSOS = Dnv.cfg.getCfgString("URLDescargaRecursos", Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getCfgString("IPMaster", Dnv.deviceInfo.ipServer()) + "/recursos");

    Dnv.CFG_URL_DATASOURCES = "/datasources/";
    Dnv.CFG_PROXY_DATASOURCES = Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getCfgString("IPMaster", Dnv.deviceInfo.ipServer()) + "/Proxy.aspx";

    Dnv.CFG_MARGEN_CARGA_RELOJ_MAESTRO = 10; // Ojo, que sea integer

    Dnv._CFG_MUTEAR = true; // Ojo, que sea integer
}


Dnv.helpers = Dnv.helpers || {};
Dnv.helpers.flashVersion = (function() {
    var playerVersion = null;

    var SHOCKWAVE_FLASH = "Shockwave Flash";
    var SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash";
    var FLASH_MIME_TYPE = "application/x-shockwave-flash";


    // Basado en https://code.google.com/p/swfobject/source/browse/trunk/swfobject/src/swfobject.js#38

    if (typeof navigator.plugins !== "undefined" && typeof navigator.plugins[SHOCKWAVE_FLASH] === "object") {
        var desc = navigator.plugins[SHOCKWAVE_FLASH].description;
        if (desc && !(typeof navigator.mimeTypes !== "undefined" && navigator.mimeTypes[FLASH_MIME_TYPE] && !navigator.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) {
            desc = desc.replace(/^.*\s+(\S+\s+\S+$)/, "$1");

            playerVersion = [];
            playerVersion[0] = parseInt(desc.replace(/^(.*)\..*$/, "$1"), 10);
            playerVersion[1] = parseInt(desc.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
            playerVersion[2] = /[a-zA-Z]/.test(desc) ? parseInt(desc.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0;

            /*var res = /^(.*)\.(.*)\s[a-zA-Z]+(.*)$/.exec(desc);
            playerVersion = [parseInt(res[1], 10), parseInt(res[2], 10),parseInt(res[3], 10),]*/
        }
    } else if (typeof window.ActiveXObject !== "undefined") {//	if (isIE()) {
        try {
            var a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
            if (a) { // a will return null when ActiveX is disabled
                var desc = a.GetVariable("$version");
                if (desc) {
                    desc = desc.split(" ")[1].split(",");
                    playerVersion = [parseInt(desc[0], 10), parseInt(desc[1], 10), parseInt(desc[2], 10)];
                }
            }
        } catch (e) { }
    }
    if (playerVersion === null) {
        console.warn("PRESENTADOR: Flash no está disponible!");
    } else {
        console.warn("PRESENTADOR: Versión de flash: " + playerVersion);
    }
    return playerVersion;
})();

Dnv.helpers.flashAvailable = Dnv.helpers.flashVersion !== null;

Dnv.helpers.isNumeric = function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


Dnv.helpers.strToBoolean = function strToBoolean(str) {
    str = str.trim();
    if (str === 0 || str === "0" || str.toLowerCase() === "false") {
        return false;
    } else {
        return true;
    }
};

Dnv.helpers.isErrorEventConstructable = function isErrorEventConstructable() {
    if (!window.ErrorEvent)
        return false;

    try {
        new ErrorEvent("error");
        return true;
    } catch (e) {
        return false;
    }
};

/*Dnv.Pl.PlaylistException = (function (message, filename, lineNumber) {
    // Para que instanceof funcione 
    // FIXME, hacer que "blablabla "+objExcepcion funcione para loguear
    var aux = function () {
        console.warn("Creando PlaylistException " + message);
        Error.call(this, message, filename, lineNumber);
    };
    aux.Prototype = Object.create(parent, {});
    aux.Prototype.constructor = aux;
    //aux.name = "PlaylistException";
    //aux.message = message;
    //aux.toString = function () { return this.name + ": " + this.message; };
    return aux;
})();*/

Dnv.Pl.lastPlaylistFromUSB = false;

Dnv.Pl.PlaylistException = function PlaylistException(message) {
    this.name = 'PlaylistException';
    this.message = message || '';
}
Dnv.Pl.PlaylistException.prototype = Object.create(Error.prototype);
Dnv.Pl.PlaylistException.prototype.constructor = Dnv.Pl.PlaylistException;

Dnv.Pl.PlaylistHivestackException = function PlaylistHivestackException(message) {
    this.name = 'PlaylistHivestackException';
    this.message = message || '';
}

Dnv.Pl.PlaylistHivestackException.prototype = Object.create(Error.prototype);
Dnv.Pl.PlaylistHivestackException.prototype.constructor = Dnv.Pl.PlaylistHivestackException;

Dnv.Pl.HivestackUuids;

Dnv.Pl.EstadoActual;

Dnv.Pl.valoresForzados = (function() {


    var CAMBIO_STREAM_EVENT = "CAMBIO_STREAM_EVENT";
    var RESET_STREAM_EVENT = "RESET_STREAM_EVENT";
    var CAMBIO_AUDIO_BOOST_EVENT = "CAMBIO_AUDIO_BOOST_EVENT";
    var CODIGO_STREAMING = "STREAMING";
    var CODIGO_AUDIO_BOOST = "CODIGO_AUDIO_BOOST";

    function _isValorForzadoValido(codigo, valor) {
        if (codigo == Dnv.Calendarios.Cal.tipos.CANAL || codigo == Dnv.Calendarios.Cal.tipos.CANAL_INTERACTIVO) {
            var pl = Dnv.Pl.lastPlaylist;
            if (!pl.getCanales().hasOwnProperty(valor)) {
                console.warn("[VALORES_FORZADOS] Canal desconocido: " + valor);
                return false;
            }
        } else if (codigo == Dnv.Calendarios.Cal.tipos.VOLUMEN) {
            if (!Dnv.helpers.isNumeric(valor) && valor < 0 && valor > 100) {
                console.warn("[VALORES_FORZADOS] Volumen invalido: " + valor);
                return false;
            }

        } else if (codigo == CODIGO_STREAMING) {
            if (valor === undefined || valor.url === undefined ||
                    (valor.mimeType === undefined && (valor.url.indexOf("udp:") === 0 || valor.url.indexOf("rtp:") === 0 || valor.url.indexOf("rtsp:") === 0))) {

                // Ya no deberia entrar aqui por el mimetype undefined
                console.warn("[VALORES_FORZADOS] Streaming invalido: " + JSON.stringify(valor));
                return false;
            }
        }
        return true;
    }

    function _corregirValorForzado(codigo, valor) {
        if (codigo == CODIGO_STREAMING) {
            if (valor.url.indexOf("udp:") === 0 || valor.url.indexOf("rtp:") === 0 || valor.url.indexOf("rtsp:") === 0) {
                valor.url = Dnv.utiles.fixStreamUrl(valor.url);
                if (valor.mimeType === undefined) {
                    valor.mimeType = "video/mp2t";
                }
            }
        }
        return valor;
    }

    var _valores = {};
    var _preValores = {};
    var _haRecibidoComandoRemoteControl = false;
    var _lastComandoRemoteControlTimestamp = 0;

    if (window.localStorage['valoresForzados_' + CODIGO_STREAMING]) {
        _valores[CODIGO_STREAMING] = JSON.parse(window.localStorage['valoresForzados_' + CODIGO_STREAMING]);
    }

    return {
        CAMBIO_STREAM_EVENT: CAMBIO_STREAM_EVENT,
        RESET_STREAM_EVENT: RESET_STREAM_EVENT,
        CAMBIO_AUDIO_BOOST_EVENT: CAMBIO_AUDIO_BOOST_EVENT,
        CODIGO_STREAMING: CODIGO_STREAMING,
        CODIGO_AUDIO_BOOST: CODIGO_AUDIO_BOOST,

        onRemoteControlCommandRecibido: function() {
            _haRecibidoComandoRemoteControl = true;
        },
        hasValorForzado: function(cod) {
            return _valores.hasOwnProperty(cod);
        },
        getValorForzado: function(cod) {
            return _valores[cod];
        },
        setValorForzado: function(cod, valor) {
            valor = _corregirValorForzado(cod, valor);
            if (_isValorForzadoValido(cod, valor)) {
                var anteriorValor = _valores[cod];
                _valores[cod] = valor;
                Dnv.controlCalendarios.onValorForzadoModificado(cod, valor);
                /* onValorForzadoModificado ya causa que se comprueben los calendarios y se avance, en su caso
                if ((cod == Dnv.Calendarios.Cal.tipos.CANAL || cod == Dnv.Calendarios.Cal.tipos.CANAL_INTERACTIVO) &&
                        (anteriorValor != valor)) {
                    Dnv.presentador.avanzarSlideDirectamente();
                }
                */
                if (cod === CODIGO_STREAMING) {
                    window.localStorage['valoresForzados_' + cod] = JSON.stringify(valor);
                }
            }
        },

        deleteValorForzado: function(cod) {
            if (_valores.hasOwnProperty(cod)) {
                var anteriorValor = _valores[cod];
                delete _valores[cod];
                Dnv.controlCalendarios.onValorForzadoModificado(cod, undefined);
                /* onValorForzadoModificado y acausa que se comprueben los calendarios y se avance, en su caso
                if ((cod == Dnv.Calendarios.Cal.tipos.CANAL || cod == Dnv.Calendarios.Cal.tipos.CANAL_INTERACTIVO) &&
                        (anteriorValor != undefined)) {
                    Dnv.presentador.avanzarSlideDirectamente();
                }
                */
            }
            if (cod === CODIGO_STREAMING) {
                delete window.localStorage['valoresForzados_' + cod];
            }
        },

        preSetValorForzado: function(cod, valor) {
            valor = _corregirValorForzado(cod, valor);
            if (_isValorForzadoValido(cod, valor)) {
                _preValores[cod] = valor;
            }
        },
        preDeleteValorForzado: function(cod) {
            if (_preValores.hasOwnProperty(cod)) {
                delete _preValores[cod];

            }

        },
        aplicarPreValores: function() {
            // Hacemos esta llamada porque por avisos nos llegan comandos antiguos, on lo que debemos aplicar solo los nuevos           
            // Hacemos reset y luego sets
            for (var key in _valores) {
                if (_valores.hasOwnProperty(key) && !_preValores.hasOwnProperty(key)) Dnv.Pl.valoresForzados.deleteValorForzado(key);
            }
            for (var key in _preValores) {
                if (_preValores.hasOwnProperty(key)) Dnv.Pl.valoresForzados.setValorForzado(key, _preValores[key]);
            }

            if (_haRecibidoComandoRemoteControl) {
                _haRecibidoComandoRemoteControl = false;
                _lastComandoRemoteControlTimestamp = new Date().getTime();
                var timeout = Dnv.cfg.getCfgInt("RemoteControlTimeOut", 120) * 1000;
                setTimeout(function() {
                    if ((new Date().getTime()) - _lastComandoRemoteControlTimestamp > timeout) {
                        _preValores = {};
                        Dnv.Pl.valoresForzados.aplicarPreValores();
                    }

                }, timeout);
            }
        }

    };
})();

Dnv.Pl.Inserciones = {};
Dnv.Pl.numInsercionesLoop = 1;
Dnv.Pl.lastCampanya = 0;
Dnv.Pl.lastSector = undefined;
Dnv.Pl.insercionesVistasLoop = {};
Dnv.Pl.campanyasActivas = {};
Dnv.Pl.campanyasVistas = {}; // [nivel][campanya]
Dnv.Pl.campanyasFrecuencia = {};
Dnv.Pl.insercionesVistas = {}; // [nivel][campanya][insercion]
Dnv.Pl.insercionesFrecuencia = {};
Dnv.Pl.posicionSecuenciasAlternadas = {};
Dnv.Pl.posicionSecuencia = 0;

Dnv.Pl.Insercion = function(codigo, objID, tipo, denominacion, campanya, id, empresa, fecha_inicio, fecha_final, hora_inicio, hora_fin, content, recurso,
    content_plantilla, tipo_content, orden, vinculo, cliente, circuito, frecuencia, frecuenciaValue, duracion, duracionAuto,
    pasesPorLoop, loopPorPases, aleatorio, metadatos, calendarios, condiciones, condicionesDemograficas, prioridad, estado) {

    if (estado != null) {
        if (estado == 1) {
            Dnv.Pl.campanyasActivas[campanya] = new Date();
        } else if (estado == 6) {
            var nowDate = new Date();
            var tomorrow = new Date(nowDate.getTime() + (24 * 60 * 60 * 1000));
            tomorrow.setHours(0);
            tomorrow.setMinutes(0);
            tomorrow.setSeconds(0);
            tomorrow.setMilliseconds(0);
            Dnv.Pl.campanyasActivas[campanya] = tomorrow;
        } else {
            Dnv.Pl.campanyasActivas[campanya] = new Date(7970745600000);
        }
    }

    var vista = false;
    var ultimoPasePriorizada = false;

    return {
        getCodigo: function() { return codigo; },
        setCodigo: function(cod) { codigo = cod; },
        getObjID: function() { return objID; },
        setObjID: function(obj_id) { objID = obj_id; },
        getTipo: function() { return tipo; },
        getDenominacion: function() { return denominacion; },
        setDenominacion: function(denom) { denominacion = denom; },
        getCampanya: function() { return campanya; },
        setCampanya: function(campanya_id) { campanya = campanya_id; },
        getID: function() { return id; },
        setID: function(id_ins) { id = id_ins; },
        getEmpresa: function() { return empresa; },
        setEmpresa: function(empre) { empresa = empre; },
        getFechaInicio: function() { return fecha_inicio; },
        getFechaFinal: function() { return fecha_final; },
        getHoraInicio: function() { return hora_inicio; },
        getHoraFin: function() { return hora_fin; },
        getContent: function() { return content; },
        getRecurso: function() { return recurso; },
        setRecurso: function(rec) { recurso = rec; },
        getContentPlantilla: function() { return content_plantilla; },
        getTipoContent: function() { return tipo_content; },
        getOrden: function() { return orden; },
        getVinculo: function() { return vinculo; },
        getCliente: function() { return cliente; },
        setCliente: function(client) { cliente = client; },
        getCircuito: function() { return circuito; },
        getFrecuencia: function() { return frecuenciaValue; },
        getDuracion: function() { return duracion; },
        setDuracion: function(dura) { duracion = dura; },
        getDuracionAuto: function() { return duracionAuto; },
        getPasesPorLoop: function() { return pasesPorLoop; },
        getLoopPorPases: function() { return loopPorPases; },
        getAleatorio: function() { return aleatorio; },
        getMetadatos: function() { return metadatos; },
        getCalendarios: function() { return calendarios; },
        getCondiciones: function() {
            return condiciones;
        },
        getCondicionesDemograficas: function() {
            return condicionesDemograficas;
        },
        getCostePorOjo: function() {
            if (metadatos["CostePorOjo"] == "") return 0;
            return metadatos["CostePorOjo"];
        },
        getCostePorPase: function() {
            if (metadatos["CostePorPase"] == "") return 0;
            return metadatos["CostePorPase"];
        },
        getSector: function() {
            if (metadatos["SectorTabla"] == "") return 0;
            return metadatos["SectorTabla"];
        },
        getDuracionImpacto: function() {
            if (metadatos["TiempoImpacto"] == -1) return Dnv.cfg.getCfgInt("MedicionAudiencia_TiempoImpacto", 2);
            return parseInt(metadatos["TiempoImpacto"]);
        },
        getPrioridad: function() {
            return parseInt(prioridad);
        },
        getVista: function() {
            return vista;
        },
        setVista: function() {
            vista = true;
        },
        setNoVista: function() {
            vista = false;
        },
        setStatus: function(time) {
            Dnv.Pl.campanyasActivas[campanya] = time;
        },
        isActiva: function() {
            var date = Dnv.Pl.campanyasActivas[campanya];
            var dateNow = new Date();
            // si la fecha es igual o posterior a la actual, está activa la campaña
            if (date && dateNow >= date) {
                //console.log("[INSERCIONES] Campanya: " + campanya + " activa");
                return true;
            } else {
                //console.log("[INSERCIONES] Campanya: " + campanya + " no activa");
                return false
            }
        },
        getTipoFrecuencia: function() {
            return frecuencia;
        },
        setPriorizada: function(p) {
            ultimoPasePriorizada = p;
        },
        getPriorizada: function() {
            return ultimoPasePriorizada;
        }

    }

};

Dnv.Pl.Insercion.tipoFrecuencia = {
    NO_APLICA: 1,
    SEGUNDOS: 2
};

Dnv.Pl.Recurso = function(codigo, filename, hashcode, tipo, vinculo, metadatos, idioma, isdefault, perfilReproduccion, size, duracion, isSSP, typeOfSSP) {
    /*
    this._codigo = codigo;
    this._filename = filename;
    this._hashcode = hashcode;
    this._vinculo = vinculo;
    */

    return {
        getCodigo: function() { return codigo; },
        getDuracion: function() { return duracion; },
        setDuracion: function(duration) { duracion = duration; },
        getFilename: function() { return filename; },
        getHashcode: function() { return hashcode; },
        getTipo: function() { return tipo; },
        isSSP: function() {
            if (isSSP == undefined || isSSP == null) {
                return false;
            } else {
                return isSSP;
            }
        },
        getTypeOfSSP: function() {
            if (typeOfSSP !== null && typeOfSSP !== undefined) {
                return typeOfSSP;
            } else {
                return null;
            }
        },
        getVinculo: function() { return vinculo; },
        getMetadatos: function() { return metadatos; },
        getRemoteUrl: function() {
            if (this.isSSP()) {
                return metadatos["remoteURL"];
            } else {
                var base = Dnv.cfg.getCfgString("URLDescargaRecursos", Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getCfgString("IPMaster", Dnv.deviceInfo.ipServer()) + "/recursos/");
                return base + "/" + codigo + "_" + encodeURIComponent(filename);
            }

        },
        getLocalUrl: function() {
            if (this.isSSP() && this.getTypeOfSSP() == "3") {
                return Dnv.Cloud.downloader.getLocalUrlHivestack(this.getRemoteUrl());
            } else {
                return Dnv.Cloud.downloader.getLocalUrl(this.getRemoteUrl(), this.getCodigo());
            }

        },
        /*getLocalFilename: function () {
        return Dnv.Cloud.downloader.getLocalUrl(this.getRemoteUrl()).substring("a/b/c".lastIndexOf('/') + 1);
        },*/
        getUrl: function() {
            if (this.isSSP()) {
                return this.getLocalUrl();
            } else {
                var remote = this.getRemoteUrl();
                if (Dnv.Cloud.isFileSystemAvailable() && Dnv.Cloud.downloader.isRecursoDisponible(remote, hashcode)) {
                    return Dnv.Cloud.downloader.getLocalUrl(remote);
                }
            }


            return remote;
        },
        isDisponible: function() {
            var remote = this.getRemoteUrl();
            if (Dnv.Cloud.isFileSystemAvailable()) {
                if (Dnv.Cloud.downloader.isRecursoDisponible(remote, hashcode)) {
                    return true;
                } else {
                    console.log("PRESENTADOR: Recurso " + filename + " no disponible: " + remote + " " + hashcode);
                    //console.warn("PRESENTADOR: debug "+window.localStorage['recursosDisponibles'].length+" "+Object.keys(Dnv.Cloud.downloader._debugGetRecursosDisponibles()).length+" "+Dnv.Cloud.downloader._debugGetRecursosDisponibles()[remote]);
                    return false;
                }
            }
            return false;
        },
        getIdioma: function() { return idioma; },
        getIsDefault: function() { return isdefault; },
        getPerfilReproduccion: function() { return perfilReproduccion; },
        getSize: function() { return size; }

    };
};

Dnv.Pl.Recurso.tipos = {
    TIPO_RECURSO: 200,
    TIPO_FONDO: 201,
    TIPO_TEXTO: 202,
    TIPO_FORMAS: 203,
    TIPO_IMAGEN: 204,
    TIPO_VIDEO: 205,
    TIPO_FLASH: 206,
    TIPO_URL: 207,
    TIPO_AUDIO: 213,
    TIPO_HTML5: 218,
    TIPO_TV: 999,
    TIPO_STREAMING: 998
};


/*
Recurso.prototype.getCodigo = function() {return this._codigo;};
Recurso.prototype.getFilename = function() {return this._filename;};
Recurso.prototype.getHashcode = function() {return this._hashcode;};
Recurso.prototype.getVinculo = function() {return this._vinculo;};
Recurso.prototype.getUrl = function() {return "/recursos/"+this._codigo+"_"+this._filename;};
*/
/*var Image = function (codigo, filename, vinculo) { 
    //this.prototype = Recurso;
    //var that = this;
    
    return {
        prototype: Recurso,
        getHtml: function() { return "<img src=\""+that.getUrl()+"\" />"},

    }
}*/

Dnv.Pl.Imagen = function(codigo, filename, hashcode, tipo, vinculo, metadatos, dataSource, idioma, isdefault, perfilReproduccion, size, duracion, isSSP, typeOfSSP) {
    var parent = Dnv.Pl.Recurso.call(this, codigo, filename, hashcode, tipo, vinculo, metadatos, idioma, isdefault, perfilReproduccion, size, duracion, isSSP, typeOfSSP);
    return Object.create(parent, {
        //getHtml: {value: function() {return "<img src=\""+this.getUrl()+"\" />";}},
    });
};
//Image.prototype = Object.create(Recurso.prototype);
//Image.prototype.getHtml = function() {return "<img src=\""+this.getUrl()+"\" />";};


Dnv.Pl.Video = function(codigo, filename, hashcode, tipo, vinculo, metadatos, dataSource, idioma, isdefault, perfilReproduccion, size, duracion, isSSP, typeOfSSP) {
    var parent = Dnv.Pl.Recurso.call(this, codigo, filename, hashcode, tipo, vinculo, metadatos, idioma, isdefault, perfilReproduccion, size, duracion, isSSP, typeOfSSP);

    return Object.create(parent, {
        //getHtml: {value: function() {return "<video preload autoplay src=\""+this.getUrl()+"\" />";}},
    });
};
//Video.prototype = Object.create(Recurso.prototype);
//Video.prototype.getHtml = function() {return "<video preload autoplay src=\""+this.getUrl()+"\" />";};


Dnv.Pl.Flash = function(codigo, filename, hashcode, tipo, vinculo, metadatos, dataSource, idioma, isdefault, perfilReproduccion, size) {
    var parent = Dnv.Pl.Recurso.call(this, codigo, filename, hashcode, tipo, vinculo, metadatos, idioma, isdefault, perfilReproduccion, size);

    var flash = Object.create(parent, {});
    var isRecursoDisponible = flash.isDisponible;
    flash.isDisponible = function isDisponible() {
        if (!Dnv.helpers.flashAvailable) {
            console.warn("PRESENTADOR: Flash no está disponible!");
            return false;
        } else {
            return isRecursoDisponible.call(this);
        }
        //return Dnv.helpers.flashAvailable && isRecursoDisponible.call(this);
    };
    flash.getFlashVars = function getFlashVars() {
        if (metadatos["FlashVars"]) {
            return metadatos["FlashVars"];
        } else {
            return "";
        }
    };
    flash.getUrlDescompresion = function getUrlDescompresion() {
        return "";
    };
    return flash;
};
//Flash.prototype = Object.create(Recurso.prototype);
//Image.prototype.getHtml = function() {return "<img src=\""+this.getUrl()+"\" />";};

Dnv.Pl.Html5 = function(codigo, filename, hashcode, tipo, vinculo, metadatos, dataSource, idioma, isdefault, perfilReproduccion, size, duracion, isSSP) {
    var parent = Dnv.Pl.Recurso.call(this, codigo, filename, hashcode, tipo, vinculo, metadatos, idioma, isdefault, perfilReproduccion, size, undefined, isSSP);

    var html5 = Object.create(parent, {});
    /*var isRecursoDisponible = html5.isDisponible;
    
    html5.isDisponible = function isDisponible() {
    // TODO: comprobar si esta descomprimido...
    return true;
    **/
    //return Dnv.helpers.flashAvailable && isRecursoDisponible.call(this);
    //};

    //getRemoteUrl: function () { return Dnv.CFG_URL_BASE_RECURSOS + "/recursos/" + codigo + "_" + encodeURIComponent(filename); },
    html5.getIndexUrl = function() {
        var remote = this.getRemoteUrl();
        if (Dnv.Cloud.isFileSystemAvailable() && Dnv.Cloud.downloader.isRecursoDisponible(remote, hashcode)) {
            return Dnv.Cloud.downloader.getLocalUrlDescompresion(remote) + "/index.html";
        }
        throw new Error("El recurso no esta disponible");
        //return remote;
    };
    html5.getUrlDescompresion = function() {
        var ruta = Dnv.Cloud.downloader.getLocalUrlDescompresion(this.getRemoteUrl());
        if (!ruta) {
            if (Dnv.Cloud.downloader.getLocalUrlDescompresionFromHashcode) {
                ruta = Dnv.Cloud.downloader.getLocalUrlDescompresionFromHashcode(this.getHashcode(), this.getFilename());
            } else { // Fallback hasta que se implemente Dnv.Cloud.downloader.getLocalUrlDescompresionFromHashcode
                ruta = this.getRemoteUrl();
            }

        }
        return ruta;
        /*
        var remote = this.getRemoteUrl();
        if (Dnv.Cloud.isFileSystemAvailable() && Dnv.Cloud.downloader.isRecursoDisponible(remote, hashcode)) {
        return Dnv.Cloud.downloader.getLocalUrlDescompresion(remote);
        }
        return null;
        */
    };

    html5.getInterpretarSoloDiseno = function() {
        return metadatos["HTML5OnlyDesign"];
    };

    html5.getDataSource = function() {
        return dataSource;
    };

    html5.getFlashVars = function getFlashVars() {
        if (metadatos["FlashVars"]) {
            return metadatos["FlashVars"];
        } else {
            return "";
        }
    };

    html5.getLocaldata = function getLocaldata() {
        if (metadatos["LocalData"]) {
            return metadatos["LocalData"];
        } else {
            return "";
        }
    };

    return html5;
};




Dnv.Pl.Texto = function(codigo, textos, marquee, idioma, isdefault, perfilReproduccion, size) {
    var parent = Dnv.Pl.Recurso.call(this, codigo, null, null, Dnv.Pl.Recurso.tipos.TIPO_TEXTO, null, null, idioma, isdefault, perfilReproduccion, size);

    //var misTextos =

    var idiomasDisponibles = [];
    for (var i in textos) {
        if (!isNaN(i)) {
            idiomasDisponibles.push(i);
        }
    }

    /*
    *<marquee Codigo="0" Comportamiento="0" Direccion="0" Continua="False" Repeticiones="0" Desplazamiento="4" Retraso="0" Enabled="False"></marquee>
    *
    Public Enum direccion
    Izquierda = 0
    Derecha = 1
    Arriba = 2
    Abajo = 3
    End Enum

    Public Enum MarqueeBehavior
    Desplazar = 0
    Deslizarse = 1
    Alternar = 2
    End Enum
    */


    var texto = Object.create(parent, {});
    texto.getTextos = function getTextos() { return textos; };
    texto.getTexto = function getTexto(codIdioma) {

        if (codIdioma) {
            // Puede devolver undefined si no existe
            return textos[codIdioma];
        } else { // Devolvemos el primero disponible... TODO: usar prioritariamente los idiomas de la salida
            if (idiomasDisponibles.length > 0) {
                return textos[idiomasDisponibles[0]];
            } else {
                return undefined;
            }
        }
    };
    texto.getMarquee = function getMarquee() { return marquee; };
    texto.isDisponible = function isDisponible() { return true; };
    return texto;
};

Dnv.Pl.Streaming = function(codigo, denominacion, url, mimeType, tipoStreaming) {
    var parent = Dnv.Pl.Recurso.call(this, codigo, null, null, Dnv.Pl.Recurso.tipos.TIPO_STREAMING, null, null, null, null, null, null, null);

    // Corregir streams mal dados de alta
    if (url.indexOf("udp:") === 0 || url.indexOf("rtp:") === 0 || url.indexOf("rtsp:") === 0) {
        url = Dnv.utiles.fixStreamUrl(url);
        if (!mimeType) {
            mimeType = "video/mp2t";
        }
    }
    
    var streaming = Object.create(parent, {});
    streaming.getUrlStreaming = function getUrlStreaming() {
        return url;
    };
    streaming.getUrl = streaming.getUrlStreaming;
    streaming.getRemoteUrl = streaming.getUrlStreaming;
    streaming.isDisponible = function isDisponible() { return true; };
    streaming.getMimeType = function getMimeType() { return mimeType; };
    streaming.getTipoStreaming = function getTipoStreaming() { return tipoStreaming; };
    return streaming;
};
Dnv.Pl.Estado = function(codigo, denominacion, canal, isDefault, estadoDePlayer, plantilla) {
    return {
        getCodigo: function() { return codigo; },
        getDenominacion: function() { return denominacion; },
        getCanal: function() { return canal; },
        getIsDefault: function() { return isDefault; },
        getEstadoDePlayer: function() { return estadoDePlayer; },
        getPlantilla: function() { return plantilla; }
    };
};

Dnv.Pl.Aviso = function(codigo, objid, denominacion, tipoAviso, tipoMedio, tipoBase, enabled, comportamiento, fechaInicio, fechaFinal, horaInicio, horaFinal, duracion, dias, repeticiones,
    ambito, prioridad, repeticionesIntervalo, presentaciones) {

    var nextReproduccion = new Date(0);
    var nextPresentacion = 0;
    var numReproducciones = 0;

    return {
        getCodigo: function() { return codigo; },
        getObjid: function() { return objid; },
        getDenominacion: function() { return denominacion },
        getTipoAviso: function() { return tipoAviso; },
        getTipoMedio: function() { return tipoMedio; },
        getTipoBase: function() { return tipoBase; },
        getEnabled: function() { return enabled; },
        getComportamiento: function() { return comportamiento; },
        getFechaInicio: function() { return fechaInicio; },
        getFechaFinal: function() { return fechaFinal; },
        getHoraInicio: function() { return horaInicio; },
        getDuracion: function() { return duracion; },
        getDias: function() { return dias; },
        getRepeticiones: function() { return repeticiones; },
        getAmbito: function() { return ambito; },
        getPrioridad: function() { return prioridad; },
        getRepeticionesIntervalo: function() { return repeticionesIntervalo; },
        getPresentaciones: function() { return presentaciones; },
        setTipoAviso: function(tA) { tipoAviso = tA; },
        setComportamiento: function(c) { comportamiento = c; },
        setFechaInicio: function(fI) { fechaInicio = fI; },
        setFechaFinal: function(fF) { fechaFinal = fF; },
        setHoraInicio: function(hI) { horaInicio = hI; },
        setHoraFinal: function(hF) { horaFinal = hF; },
        setDuracion: function(d) { duracion = d; },
        setDias: function(d) { dias = d; },
        setRepeticiones: function(r) { repeticiones = r; },
        setAmbito: function(a) { ambito = a; },
        setPrioridad: function(p) { prioridad = p; },
        setRepeticionesIntervalo: function(rI) { repeticionesIntervalo = rI; },
        setPresentacion: function(p) { presentaciones = p; },
        setNextReproduccion: function() {
            if (presentaciones.length > 1) {
                nextPresentacion = Dnv.avisos.nextReproduccionIdioma[prioridad][codigo];
                nextPresentacion++;
                if (nextPresentacion >= presentaciones.length) {
                    nextPresentacion = 0;
                    numReproducciones++;
                    Dnv.avisos.nextReproduccion[prioridad][codigo] = new Date().getTime() + (duracion + repeticionesIntervalo) * 1000;
                }
                Dnv.avisos.nextReproduccionIdioma[prioridad][codigo] = nextPresentacion;
            } else {
                numReproducciones++;
                Dnv.avisos.nextReproduccion[prioridad][codigo] = new Date().getTime() + (duracion + repeticionesIntervalo) * 1000;
            }
        },
        isReproducible: function() {
            if (dias == "0") dias = false;
            if (repeticiones != 0 && numReproducciones >= repeticiones) return false;
            if (Dnv.utiles.isInFecha(fechaInicio, fechaFinal, dias, true) &&
                Dnv.utiles.isInHorario(horaInicio, horaFinal) &&
                (new Date().getTime() >= Dnv.avisos.nextReproduccion[prioridad][codigo])
            ) {
                return true;
            } else {
                return false;
            }
        },
        isVigente: function() {
            if (Dnv.utiles.isFechaVigente(fechaFinal) &&
                numReproducciones >= repeticiones
            ) {
                return true
            } else {
                return false
            }
        }
    };
}



Dnv.Pl.Tv = function(codigo, filename, tipo, vinculo, idioma, isdefault, perfilReproduccion, size) {
    var parent = Dnv.Pl.Recurso.call(this, codigo, null, null, Dnv.Pl.Recurso.tipos.TIPO_TV, null, null, idioma, isdefault, perfilReproduccion, size);

    return Object.create(parent, {
        //getHtml: {value: function() {return "<img src=\""+this.getUrl()+"\" />";}},
    });
};

Dnv.Pl.SecuenciaRecurso = function(codigo, recurso, duracion, orden, idioma, isdefault) {
    //var parent = Dnv.Pl.Recurso.call(this, codigo, filename, hashcode, tipo, vinculo);


    return {
        getCodigo: function() { return codigo; },
        getRecurso: function() { return recurso; },
        getDuracion: function() { return duracion; },
        getOrden: function() { return orden; }
    };
};

Dnv.Pl.Secuencia = function(codigo, secuenciasRecursos, descartarIdioma) {
    var parent = Dnv.Pl.Recurso.call(this, codigo, null, null, null, codigo);
    console.log("PRESENTADOR: Creando secuencia " + secuenciasRecursos);

    /*
    * Object.create no permite definir metodos
    return Object.create(parent, {
    getSecuenciasRecursos: function getSecuenciasRecursos() {return secuenciasRecursos;},
    	
    isDisponible: function isDisponible() {
    for(var i = 0; i < secuenciasRecursos.length; i++) {
    if (!secuenciasRecursos[i].getRecurso().isDisponible()) {
    return false;
    }
    }
        	
    return true;
    },
    });
    */

    var secuencia = Object.create(parent, {});
    secuencia.getSecuenciasRecursos = function getSecuenciasRecursos() { return secuenciasRecursos; };
    secuencia.getSecuenciasRecursosDisponibles = function getSecuenciasRecursosDisponibles() {
        var recursosDisponibles = 0;
        var secuenciasRecursosDisponibles = [];
        for (var i = 0; i < secuenciasRecursos.length; i++) {
            if (secuenciasRecursos[i].getRecurso()) {
                if (secuenciasRecursos[i].getRecurso().isDisponible()) {
                    secuenciasRecursosDisponibles[recursosDisponibles] = secuenciasRecursos[i];
                    recursosDisponibles++;
                }

            }
        }
        return secuenciasRecursosDisponibles;
    };
    secuencia.isDisponible = function isDisponible() {
        var recursosDisponibles = 0;
        var secuenciaCompleta = Dnv.cfg.getCfgBoolean("Secuencia_completa", false);
        for (var i = 0; i < secuenciasRecursos.length; i++) {
            if (secuenciasRecursos[i].getRecurso()) {
                if (!secuenciasRecursos[i].getRecurso().isDisponible()) {
                    //console.log("PRESENTADOR: Secuencia " + this.getCodigo() + " no disponible");
                    //return false;
                } else {
                    recursosDisponibles++;
                }
            }
        }
        if (secuenciaCompleta && recursosDisponibles == secuenciasRecursos.length) {
            return true;
        } else if (!secuenciaCompleta && recursosDisponibles > 0) {
            return true;
        } else if (!secuenciasRecursos.length || secuenciasRecursos.length == 0) {
            return true;
        } else {
            return false;
        }


    };
    secuencia.isCompleta = function isCompleta() {
        var recursosDisponibles = 0;
        for (var i = 0; i < secuenciasRecursos.length; i++) {
            if (secuenciasRecursos[i].getRecurso()) {
                if (!secuenciasRecursos[i].getRecurso().isDisponible()) {
                    //console.log("PRESENTADOR: Secuencia " + this.getCodigo() + " no disponible");
                    //return false;
                } else {
                    recursosDisponibles++;
                }
            }
        }
        if (recursosDisponibles == secuenciasRecursos.length) {
            return true;
        } else {
            return false;
        }


    };
    secuencia.isDescartar = function isDescartar() { return descartarIdioma; };
    return secuencia;
};


/*
<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" width="550" height="400" id="movie_name" align="middle">
    <param name="movie" value="movie_name.swf"/>
    <!--[if !IE]>-->
    <object type="application/x-shockwave-flash" data="movie_name.swf" width="550" height="400">
        <param name="movie" value="movie_name.swf"/>
    <!--<![endif]-->
        <a href="http://www.adobe.com/go/getflash">
            <img src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" alt="Get Adobe Flash player"/>
        </a>
    <!--[if !IE]>-->
    </object>
    <!--<![endif]-->
</object>
*/

Dnv.Pl.Capa = function(codigo, recurso, posX, posY, ancho, alto, orden, relojMaestro, tipoCapa, url, auditable, datasource, metadatos, recursoHtml5, idioma, isdefault, descartar, aceleracion, tipoSmo, transparencia, Content) {
    /*
    this._codigo = codigo;
    this._recurso = recurso;
    this._posX = posX;
    this._posY = posY;
    this._ancho = ancho;
    this._alto = alto;
    this._ZIndex = orden;
    this._relojMaestro = relojMaestro;
    */
    return {
        getCodigo: function() { return codigo; },
        getRecurso: function() { return recurso; },
        getRecursoHtml5: function() { return recursoHtml5; },
        getPosX: function() { return posX; },
        getPosY: function() { return posY; },
        getAncho: function() { return ancho; },
        getAlto: function() { return alto; },
        getZIndex: function() { return orden; },
        isRelojMaestro: function() {
            if (recurso !== null) {
                if (this.isHuecoSSP() && recurso.getTipo() == "205") {
                    return true;
                } else {
                    return relojMaestro;
                }
            } else {
                return relojMaestro;
            }


        },
        setRelojMaestro: function() { relojMaestro = true; },
        isHuecoSSP: function() {
            if (this.getContent() == "3") {
                return true;
            } else if (this.getContent() == "6") {
                return true;
            } else if (this.getContent() == "7") {
                return true;
            } else {
                return false;
            }
        },
        setRecurso: function(r) {
            recurso = r;
        },
        IsHueco: function() {
            if (tipoCapa == Dnv.Pl.Capa.tipos.TIPO_HUECO && Dnv.cfg.getCfgInt("TransITProduct", 0) == 0) {
                return true;
            } else {
                return false;
            }
        },
        isDisponible: function() {
            if (tipoCapa == Dnv.Pl.Capa.tipos.TIPO_HUECO && Dnv.cfg.getCfgInt("TransITProduct", 0) == 0) {
                return Dnv.SSP.IsDisponible(this);
            }
            if (tipoCapa == Dnv.Pl.Capa.tipos.TIPO_URL || tipoCapa == Dnv.Pl.Capa.tipos.TIPO_STREAMING) return true;

            if ((tipoCapa == Dnv.Pl.Capa.tipos.TIPO_SMARTOBJECT || tipoCapa == Dnv.Pl.Capa.tipos.TIPO_HTML5) &&
                datasource != 0 && datasource != undefined &&
                (this.getDataSourceUrl() == null || !Dnv.Cloud.downloader.isDataSourceDisponible(datasource))// &&
            /**recurso.getLocaldata() != ""**/) {
                return false;
            }
            return (recurso ? recurso.isDisponible() : true) && (recursoHtml5 ? recursoHtml5.isDisponible() : true);;
        },
        HasStreaming: function() {
            if (tipoCapa == Dnv.Pl.Capa.tipos.TIPO_STREAMING) {
                return true;
            } else {
                return false;
            }

        },
        getTipoCapa: function() { return tipoCapa; },
        getUrl: function() { return url; },
        isAuditable: function() { return auditable; },
        getDataSource: function() { return datasource; },
        setDataSource: function(d) { datasource = d; },
        getDataSourceUrl: function() {
            if (Dnv.Cloud.isFileSystemAvailable() && Dnv.Cloud.isFlashCompatible()) {
                var ruta = Dnv.Cloud.downloader.getRutaDataSource(datasource);
                if (ruta) return ruta
                else return null; /*Dnv.CFG_URL_DATASOURCES+"/"+datasource+".xml";*/
            } else {
                return Dnv.CFG_URL_DATASOURCES + "/" + datasource + ".xml";
            }
        },
        // Es el tipo de objeto, no el tipo de smartobject
        getTipoSmartObject: function() { return tipoSmo; },
        getMetadatos: function() { return metadatos; },
        getIdioma: function() { return idioma; },
        getIsDefault: function() { return isdefault; },
        getDescartar: function() { return descartar; },
        getAceleracion: function() { return aceleracion; },
        getTransparencia: function() {
            if (transparencia == 100) return 1;
            return parseFloat("0." + transparencia.toString());
        },
        getContent: function() {
            if (Content !== null && Content !== undefined) {
                return Content;
            } else {
                return 0; //Aqui habría que agregar el DefaultContent.
            }
        }
    };
};
Dnv.Pl.Capa.tipos = {
    TIPO_FONDO: 1,
    TIPO_TEXTO: 2,
    TIPO_IMAGEN: 3,
    TIPO_VIDEO: 4,
    TIPO_ANIMACION: 5,
    TIPO_SONIDO: 6,
    TIPO_TV: 7,
    TIPO_STREAMING: 8,
    TIPO_URL: 9,
    TIPO_SMARTOBJECT: 10,
    TIPO_SECUENCIA: 11,
    TIPO_HUECO_DE_EMISION: 12,
    TIPO_TEXTO_FLASH: 13,
    TIPO_FUENTE_VIDEO: 14,
    TIPO_TEXTO_VARIABLE: 15,
    TIPO_WEB_SLICE: 16,
    TIPO_HTML5: 17,
    TIPO_HUECO: 18
};

Dnv.Pl.Streaming.tipos = {
    VideoStreamingWMP: 1,
    VideoStreamingVLC: 2,
    VideoStreamingQT: 3,
    AudioStreamingWMP: 4,
    AudioStreamingVLC: 5,
    VideoStreamingSWF: 6,
    VideoStreamingSilverLight: 7,
    VideoStreamingRTMP: 8,
    VideoStreamingDistribuido: 9
};
/*
Capa.prototype.getCodigo = function() {return this._codigo;};
Capa.prototype.getRecurso = function() {return this._recurso;};
Capa.prototype.getPosX = function() {return this._posX;};
Capa.prototype.getPosX = function() {return this._posY;};
Capa.prototype.getAncho = function() {return this._ancho;};
Capa.prototype.getAlto = function() {return this._alto;};
Capa.prototype.getZIndex = function() {return this._ZIndex;};
Capa.prototype.getRelojMaestro = function() {return this._relojMaestro;};
*/

function obtenerCapasIdiomaSlide(capas, slide) {
    var capasIdioma = [];
    var idioma;

    for (var i = 0; i < capas.length; i++) {
        if (capas[i].getIdioma() == Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[Dnv.Pl.lastPlaylistIdiomaActual[slide]]) {
            idioma = i;

            // si el setting esta a true, tienen que estar todos los recursos que conforman la plantilla en el idioma correspondiente para
            // que se muestre
            if (capas[i].getDescartar() && Dnv.cfg.getCfgBoolean("Salida_CheckPlantillaIdiomaCompleto", false)) {
                Dnv.Pl.lastPlaylistIdiomaActual[slide]++;
                if (Dnv.Pl.lastPlaylistIdiomaActual[slide] > (Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas().length - 1)) {
                    Dnv.Pl.lastPlaylistIdiomaActual[slide] = 0;
                }
                obtenerCapasIdiomaSlide(capas, slide);
            }

            capasIdioma.push(capas[i]);
        }
    }

    if (idioma) console.log("[IDIOMAS] Obtenidas capas para el idioma: " + capas[idioma].getIdioma());
    return capasIdioma;
}

function obtenerCapasIdiomaDefecto(capas, slide) {
    var capasIdioma = [];
    try {
        for (var i = 0; i < capas.length; i++) {
            if (capas[i].getIdioma() == Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0]) {
                capasIdioma.push(capas[i]);
            }
        }
    } catch (e) { }
    return capasIdioma;
}


Dnv.Pl.Plantilla = function(codigo, denominacion, resolucion, metadatos, capas, duracion, alternada, maestra, auditar) {
    /*
    this._codigo = codigo;
    this._capas = capas;
    this._duracion = duracion;
    */
    var _playlist;
    return {
        setPlaylist: function (pl) { _playlist = pl; },
        getPlaylist: function () { return _playlist; },
        getCodigo: function () { return codigo; },
        getDenominacion: function () { return denominacion; },
        // TODO: rehacer de forma que baste con pasar el idioma
        // FIXME: Peek no esta implementado asi que esto causa avances de idioma
        getCapas: function (slide, peek) {
            if (slide) {
                return obtenerCapasIdiomaSlide(capas, slide, peek);
            } else {
                return capas;
                //return obtenerCapasIdiomaDefecto(capas, slide);
            }
        },
        HasStreaming: function() {
            var ret = false;
            for (var i = 0; i < capas.length; i++) {
                if (capas[i].HasStreaming()) {
                    ret = true;
                }
            }
            return ret;
        },
        getDuracion: function() {
            for (var i = 0; i < capas.length; i++) {
                if (capas[i].isHuecoSSP()) {
                    if (capas[i].getContent() == "3") {
                        var vast = Dnv.SSP.Hivestack.Ad;
                        var durSSP = parseInt(vast.duracion.split(":")[0]) * 3600 + parseInt(vast.duracion.split(":")[1]) * 60 + parseInt(vast.duracion.split(":")[2]);
                        return durSSP;
                    } else if (capas[i].getContent() == "6") {
                        return 20;
                    } else if (capas[i].getContent() == "7") {
                        var vast = Dnv.SSP.PlaceExchange.Ad;
                        var durSSP = parseInt(vast.duracion.split(":")[0]) * 3600 + parseInt(vast.duracion.split(":")[1]) * 60 + parseInt(vast.duracion.split(":")[2]);
                        return durSSP;
                    } else {
                        return duracion;
                    }
                }
            }
            return duracion;
        },
        // Codigo de la plantilla maestra
        getMaestra: function() { return maestra; },
        getPlantillaMaestra: function() { return _playlist.getPlantillaByVinculo(maestra); },
        hasRelojMaestro: function() {
            for (var i = 0; i < capas.length; i++) {
                if (capas[i].isRelojMaestro()) {
                    return true;
                }
            }
            return false;
        },
        isAlternada: function() { return alternada; },
        getMetadatos: function() { return metadatos; },
        getAncho: function() { return resolucion.getAncho(); }, //metadatos.Ancho;
        getAlto: function() { return resolucion.getAlto(); }, //metadatos.Alto;
        getColorFondo: function() { return metadatos.ColorFondo; },
        HasHuecoSSP: function() {
            var ret = false;
            for (var i = 0; i < capas.length; i++) {
                if (capas[i].isHuecoSSP()) {
                    ret = true;
                }
            }
            return ret;
        },

        GetTypeOfSSP: function() {
            for (var i = 0; i < capas.length; i++) {
                if (capas[i].getContent() !== 0) {
                    return capas[i].getContent();
                }

            }
        },
        HasHuecoPublicitario: function() {
            var ret = false;
            for (var i = 0; i < capas.length; i++) {
                if (capas[i].IsHueco()) {
                    ret = true;
                }
            }
            return ret;
        },
        IsCapsulaAuditada: function() {
            var ret = false;
            if (metadatos.CampaignID) {
                ret = true;
            }
            return ret;
        },
        GetJsonAuditoria: function() { return metadatos.CampaignID; },
        isDisponible: function() { // TODO: habria que cachear esto...
            for (var i = 0; i < capas.length; i++) {
                if (!capas[i].isDisponible()) {
                    return false;
                }
            }
            /* 
             * Esta comprobacion no puede hacerse correctamente porque para conocer la
             * maestra real necesitamos saber el valor de canal ForzarMaestra y
             * el setting Salida_Override_PlantillaMaestra
             */
            if (maestra != 0) {
                var plantillaMaestra = _playlist.getPlantillaByVinculo(maestra);
                if (!plantillaMaestra || !plantillaMaestra.isDisponible()) {
                    return false;
                }
            }

            return true;
        },
        hasVideo: function() {
            // FIXME: Tener en cuenta si la maestra va definida por el canal o por la salida
            var capas = this.getCapas();
            for (var i = 0; i < capas.length; i++) {
                if (capas[i] && capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_VIDEO) {
                    return true;
                } else if (capas[i] && capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_STREAMING) {
                    return true;
                } else if (capas[i] && capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                    var secuenciasRecursos = capas[i].getRecurso().getSecuenciasRecursos();
                    for (var j = 0; j < secuenciasRecursos.length; j++) {
                        if (secuenciasRecursos[j].getRecurso().getTipo() == Dnv.Pl.Recurso.tipos.TIPO_VIDEO) {
                            return true;
                        }
                    }
                }
            }

            console.log("this.getMaestra() : " + this.getMaestra());
            if (this.getMaestra() != 0) {
                console.log("maestra -> : " + maestra);
                //var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByCodigo(this.getMaestra());
                var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByVinculo(this.getMaestra());
                return plantillaMaestra.hasVideo();
            }

            return false;
        },
        getAuditar: function() { return auditar; },
        getResolucion: function() { return resolucion; }
    };
};
/*
Plantilla.prototype.getCodigo = function() {return this._codigo;};
Plantilla.prototype.getCapas = function() {return this._capas;};
Plantilla.prototype.getDuracion = function() {return this._duracion;};
*/
/*
* cabecera: Se uso para alguna demo en el ISE de hace varios años. Era una forma de marcar el primer slide del canal
* para reproducirlo solo en la primera iteracion de este.
*/
Dnv.Pl.Slide = function(codigo, denominacion, plantilla, duracion, orden, ciclos, metadatos, slideTextos, condiciones_temporales, isDefault, condiciones, condicionesDemograficas, externalID, sincronizado) {
    /*
    this._codigo = codigo;
    this._plantilla = plantilla;
    this._duracion = duracion;
    */

    var contadorCiclos = 0;
    var incompatible = false;
    var gapless = false; // Contiene un video que se reproducirá en modo gapless... este video será reloj maestro.
    var inicioGapless = false; // Tendrá una lista de videos Gapless
    var videosGapless = null;
    var posicionVideosGapless = null;
    var videosGaplessInLoop = false;
    var canal = null;
    var isSincronizado = false;

    var fecha_inicio = condiciones_temporales.fecha_inicio;
    var fecha_final = condiciones_temporales.fecha_final;
    var dias = condiciones_temporales.dias;
    var hora_inicio = condiciones_temporales.hora_inicio;
    var hora_final = condiciones_temporales.hora_final;

    //var playerSincronizacion;

    var left = false;
    var right = false;

    var codSincronizacion;

    var habilitado = true;

    var insercionActual;

    if (Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") != ";;" && sincronizado) {
        isSincronizado = true;
        codSincronizacion = codigo;
    }

    if (metadatos["TAG"]) {
        var tags = metadatos["TAG"].split(/[,;]/);
        var l = tags.length;
        for (var i = 0; i < l; i++) {
            var tag = tags[i].trim();
            if (tag.length === 0) {
                tags.splice(i, 1);
                i--;
                l--;
            } else {
                tags[i] = tag;
                if (tag.indexOf("sync_") === 0) {
                    /** AMACHO Se parsea el nuevo atributo de slide Sincronizado, no esto
                    codSincronizacion = tag.substr(5);
                    isSincronizado = true;
                    **/
                } else if (tag === "left") {
                    left = true;
                } else if (tag === "right") {
                    right = true;
                }
            }

        }
    }


    return {
        getCodigo: function() { return codigo; },
        getDenominacion: function() { return denominacion; },
        getPlantilla: function() { return plantilla; },
        getDuracion: function() {
            if (this.HasHuecoSSP()) {
                if (this.hasRelojMaestro()) {
                    return parseInt(duracion);
                } else {
                    return plantilla.getDuracion();


                }
            } else {
                return parseInt(duracion);
            }

        },
        HasStreaming: function(d) {
            return plantilla.HasStreaming();
        },
        setDuracion: function(d) { duracion = d; },
        hasRelojMaestro: function() {
            return plantilla.hasRelojMaestro();

        },
        GetTypeOfSSP: function() {
            return plantilla.GetTypeOfSSP();
        },
        HasHuecoSSP: function() {
            return plantilla.HasHuecoSSP();
        },
        isDisponible: function() {
            return !incompatible && plantilla.isDisponible();

        },
        getOrden: function() { return orden; },
        hasVideo: function() { return plantilla.hasVideo(); },
        setIncompatible: function(value) { incompatible = value; },
        isIncompatible: function() { return incompatible; },
        setGapless: function(value) { gapless = value; },
        isGapless: function() { return gapless; },
        setInicioGapless: function(value) { inicioGapless = value; },
        isInicioGapless: function() { return inicioGapless; },
        setVideosGapless: function(value) { videosGapless = value; },
        getVideosGapless: function() { return videosGapless; },
        // Objeto {x: 0, y: 0, w: 1920, h: 1080}
        setPosicionVideosGapless: function(value) { posicionVideosGapless = value; },
        // Objeto {x: 0, y: 0, w: 1920, h: 1080}
        getPosicionVideosGapless: function() { return posicionVideosGapless; },
        // true false Solo se define para el primer video gapless... habria que mejorar esto
        setVideosGaplessInLoop: function(value) { videosGaplessInLoop = value; },
        getVideosGaplessInLoop: function() { return videosGaplessInLoop; },
        getCondicionesTemporales: function() { return condiciones_temporales },
        getSlideTextos: function() { return slideTextos; },
        getSlideTexto: function(codigoTexto, codigoIdioma) {
            if (slideTextos[codigoTexto]) {
                var resultado;
                resultado = slideTextos[codigoTexto][codigoIdioma]; // Español
                return resultado;
            }

            return undefined;
        },
        HasHuecoPublicitario: function() {
            return plantilla.HasHuecoPublicitario();
        },
        isValidSSPNoExecute: function() {
            var r = new Dnv.SSP.Engine(this);
            return r.isValidSSPNoExecute();
        },
        isValidSSP: function() {
            var r = new Dnv.SSP.Engine(this);
            return r.isValidSSP();
        },
        IsCapsulaAuditada: function() {
            return plantilla.IsCapsulaAuditada();
        },
        GetJsonAuditoria: function() {
            return plantilla.GetJsonAuditoria();
        },
        getMetadatos: function() { return metadatos; },
        setCanal: function(value) { canal = value; },
        getCanal: function() { return canal; },

        isCabecera: function() {
            if (ciclos == 0) {
                return true;
            } else {
                return false;
            }
        },

        getCiclos: function() { return ciclos; },

        getCiclo: function() { return contadorCiclos; },

        // con peekCiclo = true no se aumenta el contador de forma permanente
        nextCiclo: function(peekCiclo) {
            var contador = contadorCiclos;
            if (peekCiclo) return ++contador;
            return ++contadorCiclos;
        },

        isVigente: function() {
            if (Dnv.utiles.isInFecha(fecha_inicio, fecha_final, dias)) {
                if (Dnv.utiles.isInHorario(hora_inicio, hora_final)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },

        isHabilitado: function() {
            return habilitado;
        },

        setHabilitado: function(value) {
            habilitado = value;
        },

        isSincronizado: function() {
            return isSincronizado;
        },
        setSincronizado: function(value) {
            isSincronizado = value;
        },
        getCodSincronizacion: function() {
            return codSincronizacion;
        },
        setCodSincronizacion: function(value) {
            codSincronizacion = value;
        },
        isLeft: function() {
            return left;
        },
        isRight: function() {
            return right;
        },
        getIsDefault: function() {
            return isDefault;
        },
        getCondiciones: function() {
            return condiciones;
        },
        getCondicionesDemograficas: function() {
            return condicionesDemograficas;
        },
        getCostePorOjo: function() {
            if (metadatos["CostePorOjo"] == "" || metadatos["CostePorOjo"] == undefined || metadatos["CostePorOjo"] == null) {
                return 0;
            }
            return metadatos["CostePorOjo"];
        },
        getCostePorPase: function() {
            if (metadatos["CostePorPase"] == "") return 0;
            return metadatos["CostePorPase"];
        },
        getExternalID: function() {
            if (externalID == "") return "0";
            return externalID;
        },
        setInsercionActual: function(insercion) {
            insercionActual = insercion;
        },
        getInsercionActual: function() {
            return insercionActual;
        },
        getGeoFence: function() {
            if (metadatos["GeoFence"] == undefined || metadatos["GeoFence"] == "") return "";
            return metadatos["GeoFence"];
        }
    };
};
/*
Slide.prototype.getCodigo = function() {return this._codigo;};
Slide.prototype.getPlantilla = function() {return this._plantilla;};
Slide.prototype.getDuracion = function() {return this._duracion;};
*/

Dnv.Pl.Canal = function(codigo, denominacion, forzarMaestra, metadatos, slides, tipo, canalesAgrupados, duracionMax, margenMax) {
    /*
    this._codigo = codigo;
    this._slides = slides;
    */
    return {
        getCodigo: function() { return codigo; },
        getDenominacion: function() { return denominacion; },
        isForzarMaestra: function() { return forzarMaestra; },
        getSlides: function() { return slides; },
        getMetadatos: function() { return metadatos; },
        tieneSlidesSincronizados: function() {
            for (var i = 0; i < slides.length; i++) {
                if (slides[i].isSincronizado() /*&& !slides[i].isCabecera()*/) {
                    return true;
                }
            }
            return false;
        },
        getTipoAgrupacion: function() { return tipo; },
        getCanalesAgrupados: function() { return canalesAgrupados; },
        getDuracionMax: function() { return parseInt(duracionMax); },
        getMargenMax: function() { return margenMax }
    };
};

Dnv.Pl.Canal.tipo = {
    TODOS: -1,
    NO_AGRUPADO: 0,
    AGRUPADO: 1,
    AGRUPADO_PASES: 2
};

Dnv.Pl.CanalAgrupado = function(codigo, canal, canalHijo, porcentaje, isDefault, pasesEstablecidos, orden) {

    var pases = 1;
    if (pasesEstablecidos) pases = pasesEstablecidos;
    var maestro = false;

    return {
        getCodigo: function() { return codigo; },
        getCanal: function() { return canal; },
        getCanalHijo: function() { return canalHijo; },
        getPorcentaje: function() { return porcentaje; },
        isDefault: function() { return isDefault; },
        setPases: function(value) { pases = value; },
        getPases: function() { return pases; },
        setMaestro: function(value) { maestro = value; },
        isMaestro: function() { return maestro },
        getOrden: function() { return orden }
    }
}

Dnv.Pl.Resolucion = function(codigo, ancho, alto) {
    return {
        getCodigo: function() { return codigo; },
        getAncho: function() { return ancho; },
        getAlto: function() { return alto; }
    };
};



//Dnv.Calendarios.Bloque

//Dnv.Calendarios.Bloque.tipos

//Dnv.Calendarios.Bloque.ordenTipos

//Dnv.Calendarios.BloqueManager

//Dnv.Calendarios.Cal
// Tabla calendarios_tipos
//Dnv.Calendarios.Cal.tipos


//Dnv.Calendarios.Cal.festivos
// Tabla calendarios_estados
//Dnv.Calendarios.Cal.estados



Dnv.Pl.Player = function(codigo, metadatos, ubicacion, calendarios, salida, entradaMegafonia, estados) {
    /*
    this._codigo = codigo;
    this._slides = slides;
    */


    var isSincronizado = false;
    var codSincronizacion;

    var left = false;
    var right = false;

    if (metadatos["TAG"]) {
        var tags = metadatos["TAG"].split(/[,;]/);
        var l = tags.length;
        for (var i = 0; i < l; i++) {
            var tag = tags[i].trim();
            if (tag.length === 0) {
                tags.splice(i, 1);
                i--;
                l--;
            } else {
                tags[i] = tag;
                if (tag.indexOf("sync_") === 0) {

                    codSincronizacion = tag.substr(5);
                    isSincronizado = true;
                } else if (tag === "left") {
                    left = true;
                } else if (tag === "right") {
                    right = true;
                }
            }

        }
    }



    var preferirFlashAHtml5 = (metadatos["FlashCompatible"] == 1);
    return {
        getCodigo: function() { return codigo; },
        getMetadatos: function() { return metadatos; },
        getCalendarios: function() { return calendarios; },
        getSalida: function() { return salida; },
        getEntradaMegafonia: function() { return entradaMegafonia; },
        prefiereFlashAHtml5: function() { return preferirFlashAHtml5; },

        isSincronizado: function() {
            return isSincronizado;
        },
        getCodSincronizacion: function() {
            return codSincronizacion;
        },

        isLeft: function() {
            return left;
        },
        isRight: function() {
            return right;
        },
        getUbicacion: function() {
            return ubicacion;
        },
        getFactorDeZona: function() {
            return metadatos["FactorDeZona"];
        },
        getEstados: function() {
            return estados;
        }
    };
};

Dnv.Pl.Salida = function(codigo, tipo, playerName, empresa, metadatos, resolucion, pantalla, calendarios, canales, idiomas, dataSource) {
    /*
    this._codigo = codigo;
    this._slides = slides;
    */

    var insercionSincro;
    var maestra = parseInt(metadatos["PlantillaMaestra"], 10);

    var _getCanalActual = function() {

        var cal = calendarios[Dnv.Calendarios.Cal.tipos.CANAL];;
        /*for (var key in calendarios) {
        if (!isNaN(key) && calendarios[key].getTipo() == Dnv.Calendarios.Cal.tipos.CANAL) {
        cal = calendarios[key];
        break;
        }
        }
        */
        var codCanal = cal.getCurrentValue();
        return canales[codCanal];

        /*if (calendariosElements[i].getAttribute('Tipo') == 300) {
        canal = canales[calendariosElements[i].getAttribute('DefaultValue')];
        }*/
    }
    var _getCanalInteractivoActual = function() {

        var cal = calendarios[Dnv.Calendarios.Cal.tipos.CANAL_INTERACTIVO];;
        /*for (var key in calendarios) {
        if (!isNaN(key) && calendarios[key].getTipo() == Dnv.Calendarios.Cal.tipos.CANAL) {
        cal = calendarios[key];
        break;
        }
        }
        */

        var codCanal = cal.getCurrentValue();
        return canales[codCanal];

        /*if (calendariosElements[i].getAttribute('Tipo') == 300) {
        canal = canales[calendariosElements[i].getAttribute('DefaultValue')];
        }*/
    }

    function searchInsercionEnCampanya(numNivel, campanya, priorizadas) {

        if (!Dnv.Pl.Inserciones[numNivel]) return null;
        var inserciones = Dnv.Pl.Inserciones[numNivel][campanya];

        if (inserciones && !(Object.keys(inserciones).length === 0 && inserciones.constructor === Object)) {
            // ordenamos las inserciones que tiene la campaña de menor a mayor numero de veces que se han reproducido
            var codInserciones = Object.keys(Dnv.Pl.insercionesVistas[numNivel][campanya]).sort(function(a, b) {
                if (Dnv.Pl.insercionesVistas[numNivel][campanya][a] == Dnv.Pl.insercionesVistas[numNivel][campanya][b]) {
                    return parseInt(a) - parseInt(b)
                } else {
                    return Dnv.Pl.insercionesVistas[numNivel][campanya][a] - Dnv.Pl.insercionesVistas[numNivel][campanya][b]
                }
            });

            /**
            var codInsercionesFrecuenciaPriorizadas = [];
            
            if (Dnv.Pl.insercionesFrecuencia[campanya]) {
                // ordenar las inserciones con frecuencia fijada en orden de timestamp de proxima reproducción
                var codInsercionesFrecuencia = Object.keys(Dnv.Pl.insercionesFrecuencia[campanya]).sort(function (a, b) {
                    if (Dnv.Pl.insercionesFrecuencia[campanya][a] == Dnv.Pl.insercionesFrecuencia[campanya][b]) {
                        return parseInt(a) - parseInt(b)
                    } else {
                        return Dnv.Pl.insercionesFrecuencia[campanya][a] - Dnv.Pl.insercionesFrecuencia[campanya][b]
                    }
                });

                // si ya ha pasado el timestamp de la insercion, la priorizamos
                for (var p = 0; p < codInsercionesFrecuencia.length; p++) {
                    if (new Date().getTime() > (Dnv.Pl.insercionesFrecuencia[campanya][codInserciones[p]] - (Dnv.cfg.getCfgInt("Inserciones_SegundosMargenFrecuencia", 5) * 1000))) {
                        codInsercionesFrecuenciaPriorizadas.push(parseInt(codInserciones[p]));
                        removeItemOnce(codInserciones, codInserciones[p]);
                    }
                }
            }

            // se colocan en primera posición las priorizadas
            var codInsercionesPriorizadas = codInsercionesFrecuenciaPriorizadas.concat(codInserciones);
            **/

            for (var i = 0; i < codInserciones.length; i++) {
                var insercion = inserciones[codInserciones[i]];
                if (insercion) {
                    if (insercion.getTipoFrecuencia() == Dnv.Pl.Insercion.tipoFrecuencia.SEGUNDOS) {
                        insercion.setPriorizada(true);
                    }

                    // condiciones que debe cumplir la insercion
                    if (Dnv.utiles.isInFecha(insercion.getFechaInicio(), insercion.getFechaFinal()) &&
                        Dnv.utiles.isInHorario(insercion.getHoraInicio(), insercion.getHoraFin()) &&
                        insercion.getRecurso().isDisponible() &&
                        insercion.isActiva() && (insercion.getTipoFrecuencia() == Dnv.Pl.Insercion.tipoFrecuencia.NO_APLICA || priorizadas)
                    ) {
                        // condiciones especificas segun el nivel en el que estemos
                        switch (numNivel) {
                            case -1:
                                if (Dnv.Pl.lastCampanya != insercion.getCampanya()) return insercion;
                                break;
                            case 0:
                                if ((insercion.getSector() == 0 || Dnv.Pl.lastSector != insercion.getSector()) &&
                                    Dnv.Pl.lastCampanya != insercion.getCampanya() &&
                                    !Dnv.Pl.insercionesVistasLoop[insercion.getCampanya()]) {
                                    /**
                                    if (Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCanal().getTipoAgrupacion() == Dnv.Pl.Canal.tipo.NO_AGRUPADO) {
                                        return insercion;
                                    } else if (!Dnv.Pl.insercionesVistasLoop[insercion.getCampanya()]) {
                                        return insercion;
                                    }
                                    **/
                                    return insercion;
                                }
                                break;
                            default:
                                return insercion;
                                break;
                        }
                    }
                }
            }
        }

        return null
    }

    function removeItemOnce(arr, value) {
        var index = arr.indexOf(value);
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    }

    function searchInsercionEnNivel(numNivel) {
        // campañas del nivel correspondiente
        var campanyas = Dnv.Pl.Inserciones[numNivel];

        if (campanyas && !(Object.keys(campanyas).length === 0 && campanyas.constructor === Object)) {
            // ordenamos las campanyas de menor a mayor numero de veces que se han reproducido
            var codCampanyas = Object.keys(Dnv.Pl.campanyasVistas[numNivel]).sort(function(a, b) {
                if (Dnv.Pl.campanyasVistas[numNivel][a] == Dnv.Pl.campanyasVistas[numNivel][b]) {
                    return parseInt(a) - parseInt(b)
                } else {
                    return Dnv.Pl.campanyasVistas[numNivel][a] - Dnv.Pl.campanyasVistas[numNivel][b]
                }
            });

            /**
            // ordenar las campanyas con frecuencia fijada en orden de timestamp de proxima reproducción
            var codCampanyasFrecuencia = Object.keys(Dnv.Pl.campanyasFrecuencia[numNivel]).sort(function (a, b) {
                if (Dnv.Pl.campanyasFrecuencia[numNivel][a] == Dnv.Pl.campanyasFrecuencia[numNivel][b]) {
                    return parseInt(a) - parseInt(b)
                } else {
                    return Dnv.Pl.campanyasFrecuencia[numNivel][a] - Dnv.Pl.campanyasFrecuencia[numNivel][b]
                }
            });

            // si ya ha pasado el timestamp de la campanya, la priorizamos
            var codCampanyasFrecuenciaPriorizadas = [];
            for (var p = 0; p < codCampanyasFrecuencia.length; p++) {
                if (new Date().getTime() > (Dnv.Pl.campanyasFrecuencia[numNivel][codCampanyas[p]] - (Dnv.cfg.getCfgInt("Inserciones_SegundosMargenFrecuencia", 10)*1000))) {
                    codCampanyasFrecuenciaPriorizadas.push(parseInt(codCampanyas[p]));
                    removeItemOnce(codCampanyas, codCampanyas[p]);
                }
            }

            // se colocan en primera posición las priorizadas
            codCampanyasFrecuenciaPriorizadas = codCampanyasFrecuenciaPriorizadas.concat(codCampanyas);
            **/

            // las vamos evaluando en ese orden hasta que una tenga una insercion cumpla las condiciones para mostrarse
            for (var i = 0; i < codCampanyas.length; i++) {
                var insercion = searchInsercionEnCampanya(numNivel, codCampanyas[i]);
                if (insercion && insercion.getTipoFrecuencia() != Dnv.Pl.Insercion.tipoFrecuencia.SEGUNDOS) return insercion;
            }
        }

        return null
    }

    function searchInsercionFrecuencia() {
        // ordenar las campanyas con frecuencia fijada en orden de timestamp de proxima reproducción
        var codCampanyasFrecuencia = Object.keys(Dnv.Pl.campanyasFrecuencia).sort(function(a, b) {
            if (Dnv.Pl.campanyasFrecuencia[a] == Dnv.Pl.campanyasFrecuencia[b]) {
                return parseInt(a) - parseInt(b)
            } else {
                return Dnv.Pl.campanyasFrecuencia[a] - Dnv.Pl.campanyasFrecuencia[b]
            }
        });

        // si ya ha pasado el timestamp de la campanya, la priorizamos
        var codCampanyasFrecuenciaPriorizadas = [];
        for (var prio = 0; prio < codCampanyasFrecuencia.length; prio++) {
            if (new Date().getTime() > (Dnv.Pl.campanyasFrecuencia[parseInt(codCampanyasFrecuencia[prio])] - (Dnv.cfg.getCfgInt("Inserciones_SegundosMargenFrecuencia", 10) * 1000))) {
                codCampanyasFrecuenciaPriorizadas.push(parseInt(codCampanyasFrecuencia[prio]));
            }
        }

        for (var i = 0; i < codCampanyasFrecuenciaPriorizadas.length; i++) {
            var numNivel = 0;
            var insercion = searchInsercionEnCampanya(numNivel, codCampanyasFrecuenciaPriorizadas[i], true);

            if (!insercion) {
                var nextLevel = numNivel;
                var numNiveles = (numNiveles = Object.keys(Dnv.Pl.Inserciones))[numNiveles.length - 1];
                if (numNiveles == "-1") {
                    numNiveles = (numNiveles = Object.keys(Dnv.Pl.Inserciones))[numNiveles.length - 2];
                }
                while (nextLevel <= numNiveles) {
                    nextLevel++;
                    insercion = searchInsercionEnCampanya(nextLevel, codCampanyasFrecuenciaPriorizadas[i], true);
                    if (insercion) break;
                }
            }
            if (!insercion) insercion = searchInsercionEnCampanya(-1, codCampanyasFrecuenciaPriorizadas[i], true);
            if (insercion) return insercion;
        }

        return null
    }


    return {
        getCodigo: function() { return codigo; },
        getMetadatos: function() { return metadatos; },
        getCalendarios: function() { return calendarios; },
        getResolucion: function() { return resolucion; },
        getPantalla: function() { return pantalla; },
        getCanal: function() { return _getCanalActual(); },
        getCanales: function() { return canales; },
        getCanalInteractivo: function() { return _getCanalInteractivoActual(); },
        getPlayerName: function() { return playerName; },
        getEmpresa: function() { return empresa; },
        getMaestra: function() { return maestra; },
        getIdiomas: function() { return idiomas; },
        getDataSource: function() { return dataSource; },
        getInserciones: function() { return Dnv.Pl.Inserciones; },
        getInsercion: function() {
            if (!Dnv.Pl.Inserciones) {
                return null;
            } else if (insercionSincro) {
                return insercionSincro;
            } else if (Dnv.sincronizacion.isModeSync() && !Dnv.sincronizacion.isMaestro()) {
                console.warn("[INSERCIONES] No tenemos inserción sincronizada");
                return null;
            } else {
                return this.getInsercionDisponible();
            }
        },
        getInsercionDisponible: function() {

            var insercion = null;

            // buscar insercion priorizada por frecuencia
            insercion = searchInsercionFrecuencia();

            // buscar insercion de la prioridad que nos corresponde en el loop
            if (!insercion) insercion = searchInsercionEnNivel(Dnv.Pl.numInsercionesLoop);

            // si no hay de la prioridad que nos toca, buscamos entre las que no tienen asignado prioridad (0)
            if (!insercion) insercion = searchInsercionEnNivel(0);

            // si no hay ni de la prioridad correspondiente ni de 0, se buscan las siguientes que tienen prioridad asignada
            if (!insercion) {
                var nextLevel = Dnv.Pl.numInsercionesLoop;
                var numNiveles = (numNiveles = Object.keys(Dnv.Pl.Inserciones))[numNiveles.length - 1];
                if (numNiveles == "-1") {
                    numNiveles = (numNiveles = Object.keys(Dnv.Pl.Inserciones))[numNiveles.length - 2];
                }
                while (nextLevel <= numNiveles) {
                    nextLevel++;
                    insercion = searchInsercionEnNivel(nextLevel);
                    if (insercion) break;
                }
            }

            // si no hay de ningun tipo, buscamos en las de relleno
            if (!insercion) insercion = searchInsercionEnNivel(-1);

            return insercion;

        },
        setInsercionActual: function(insercion) {
            // seteamos ultimo sector mostrado
            Dnv.Pl.lastSector = insercion.getSector();
            // seteamos ultima campanya mostrada no hay
            Dnv.Pl.lastCampanya = insercion.getCampanya();
            // marcamos como vista esta campanya en este loop
            Dnv.Pl.insercionesVistasLoop[insercion.getCampanya()] = true;
            // avanzamos el loop
            // si no estamos en agrupado, el comportamiento es distinto
            if ((Dnv.Pl.numInsercionesLoop > Math.max.apply(Math, Object.keys(Dnv.Pl.Inserciones))) && (Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCanal().getTipoAgrupacion() == Dnv.Pl.Canal.tipo.NO_AGRUPADO)) {
                /**
                if (Math.max.apply(Math, Object.keys(Dnv.Pl.Inserciones)) == 0) {
                    if (Object.keys(Dnv.Pl.insercionesVistasLoop) >= Object.keys(Dnv.Pl.Inserciones[0])) {
                        this.resetLoopInsercionesNoAgrupado();
                    }
                } else {
                    this.resetLoopInsercionesNoAgrupado();
                }
                **/
                this.resetLoopInsercionesNoAgrupado();
            } else {
                Dnv.Pl.numInsercionesLoop++;
            }
            // limpiamos la insercion sincro, ya que ya se ha mostrado
            insercionSincro = null;
            // enviamos inicio de insercion a la API de la medicion de audiencia
            Dnv.audiencia.setCampaign(insercion.getCodigo());
            // marcamos la campaña como vista en el loop "grande" (ponemos el numero de reproduccciones + 1 de la mas vista)
            //Dnv.Pl.campanyasVistas[insercion.getPrioridad()][insercion.getCampanya()] = Math.max(...Object.values(Dnv.Pl.campanyasVistas[insercion.getPrioridad()])) + 1;
            // cambiado para tener compatiblidad con ES5
            Dnv.Pl.campanyasVistas[insercion.getPrioridad()][insercion.getCampanya()] = Math.max.apply(Math, Object.values(Dnv.Pl.campanyasVistas[insercion.getPrioridad()])) + 1;
            // marcamos como vista la insercion
            //Dnv.Pl.insercionesVistas[insercion.getPrioridad()][insercion.getCampanya()][insercion.getCodigo()] = Math.max(...Object.values(Dnv.Pl.insercionesVistas[insercion.getPrioridad()][insercion.getCampanya()])) + 1;
            Dnv.Pl.insercionesVistas[insercion.getPrioridad()][insercion.getCampanya()][insercion.getCodigo()] = Math.max.apply(Math, Object.values(Dnv.Pl.insercionesVistas[insercion.getPrioridad()][insercion.getCampanya()])) + 1;
            // se marca la nueva frecuencia, si la insercion tiene frecuencia fijada
            /**
            if (insercion.getTipoFrecuencia() == Dnv.Pl.Insercion.tipoFrecuencia.SEGUNDOS) {
                var dateNew = new Date().getTime() + (insercion.getFrecuencia() * 1000);
                var dateSum = Dnv.Pl.insercionesFrecuencia[insercion.getPrioridad()][insercion.getCampanya()][insercion.getCodigo()] + (insercion.getFrecuencia() * 1000);

                // si es la primera vez que se muestra se fija, sino se suma el tiempo al timestamp que ya existe
                if (Dnv.Pl.insercionesFrecuencia[insercion.getPrioridad()][insercion.getCampanya()][insercion.getCodigo()] == undefined) {
                    Dnv.Pl.insercionesFrecuencia[insercion.getPrioridad()][insercion.getCampanya()][insercion.getCodigo()] = dateNew;
                } else {
                    Dnv.Pl.insercionesFrecuencia[insercion.getPrioridad()][insercion.getCampanya()][insercion.getCodigo()] = dateSum;
                }

                // si esta insercion es la mas proxima de este nivel, se marca esta campanya como la mas proxima
                if (Dnv.Pl.campanyasFrecuencia[insercion.getPrioridad()][insercion.getCampanya()] == undefined) {                
                    Dnv.Pl.campanyasFrecuencia[insercion.getPrioridad()][insercion.getCampanya()] = dateNew;
                } else if (dateSum < Math.min.apply(Math, Object.values(Dnv.Pl.campanyasFrecuencia[insercion.getPrioridad()][insercion.getCampanya()]))) {
                    Dnv.Pl.campanyasFrecuencia[insercion.getPrioridad()][insercion.getCampanya()] = dateSum;
                }
            } 
            **/
            if (insercion.getTipoFrecuencia() == Dnv.Pl.Insercion.tipoFrecuencia.SEGUNDOS) {
                var dateNew = new Date().getTime() + (insercion.getFrecuencia() * 1000);
                var dateSum = Dnv.Pl.campanyasFrecuencia[insercion.getCampanya()] + (insercion.getFrecuencia() * 1000);

                // si es la primera vez que se muestra se fija, sino se suma el tiempo al timestamp que ya existe
                /**
                if (Dnv.Pl.insercionesFrecuencia[insercion.getCampanya()][insercion.getCodigo()] == undefined) {
                    Dnv.Pl.insercionesFrecuencia[insercion.getCampanya()][insercion.getCodigo()] = dateNew;
                } else {
                    Dnv.Pl.insercionesFrecuencia[insercion.getCampanya()][insercion.getCodigo()] = dateSum;
                }
                **/

                // si esta insercion es la mas proxima de este nivel, se marca esta campanya como la mas proxima
                if (Dnv.Pl.campanyasFrecuencia[insercion.getCampanya()] == 0) {
                    Dnv.Pl.campanyasFrecuencia[insercion.getCampanya()] = dateNew;
                } else /**if (dateSum < Math.min.apply(Math, Object.values(Dnv.Pl.campanyasFrecuencia[insercion.getCampanya()]))) **/ {
                    Dnv.Pl.campanyasFrecuencia[insercion.getCampanya()] = dateSum;
                }
            }
        },
        resetLoopInsercionesNoAgrupado: function() {
            Dnv.Pl.numInsercionesLoop = 1;
            Dnv.Pl.insercionesVistasLoop = {};
        },
        resetLoopInserciones: function() {
            Dnv.Pl.lastSector = undefined;
            Dnv.Pl.lastCampanya = 0;
            Dnv.Pl.numInsercionesLoop = 1;
            Dnv.Pl.insercionesVistasLoop = {};
        },
        cleanInsercionSincro: function() { insercionSincro = null; },
        setInsercionSincro: function(nivel, campanya, insercion) {
            try {
                insercionSincro = Dnv.Pl.Inserciones[nivel][campanya][insercion];
                console.log("[PRESENTACION.PLAYLIST]" + Dnv.Pl.Inserciones[nivel][campanya][insercion].getDenominacion());
                if (!insercionSincro) console.warn("[SINCRONIZACION] No tenemos la insercion " + insercion + " que nos manda el maestro");
            } catch (e) {
                console.warn("[SINCRONIZACION] No tenemos la insercion " + insercion + " que nos manda el maestro");
            }
            return
        },
        setStatusCampanya: function(codCampanya, status) {
            for (var n in Dnv.Pl.Inserciones) {
                var nivel = Dnv.Pl.Inserciones[n];
                for (var c in nivel) {
                    var campanya = nivel[c];
                    for (var i in campanya) {
                        var insercion = campanya[i];
                        if (insercion.getCampanya() == codCampanya) {
                            insercion.setStatus(status);
                            console.info("[INSERCIONES] Campanya: " + codCampanya + " Activa desde: " + status);
                        }
                    }
                }
            }
        }
    };
};

Dnv.Pl.Pantalla = function(codigo, tipo, metadatos, calendarios) {
    /*
    this._codigo = codigo;
    this._slides = slides;
    */
    return {
        getCodigo: function() { return codigo; },
        getMetadatos: function() { return metadatos; },
        getCalendarios: function() { return calendarios; }
    };
};

Dnv.Pl.EntradaMegafonia = function(codigo, metadatos) {
    return {
        getCodigo: function() { return codigo; },
        getMetadatos: function() { return metadatos; }
    };
}

Dnv.Pl.Playlist = function(canales, player, plantillas, streams, recursos) {

    var recursosByHashcode = {};
    for (var vinculo in recursos) {
        if (recursos.hasOwnProperty(vinculo)) {
            var recursoVinculado = recursos[vinculo];
            for (var idioma in recursoVinculado) {
                if (recursoVinculado.hasOwnProperty(idioma)) {
                    var r = recursoVinculado[idioma];
                    recursosByHashcode[r.getHashcode()] = r;
                }
            }
        }
    }
    /*
    this._codigo = codigo;
    this._slides = slides;
    */
    return {
        getCanales: function() { return canales; },
        /* no probado
        getRecursos: function() {
        var recursos = [];
        for(var key_canal in canales) {
        if (key_canal instanceof Number) {
        var canal = canales[key_canal];
                	
        var capas = canal.getPlantilla.getCapas();
        for (var key_capa in capas) {
        if (key_canal instanceof Number) {
        var capa = capas[key_capa];
        recursos.push(capa.getRecurso());
        }
        }
        }
        }
        return recursos;
        },
        */
        getPlayer: function() { return player; },
        getStreams: function() { return streams; },
        getPlantillas: function() { return plantillas; },

        //RAG
        getPlantillaByCodigo: function(codPlantilla) {
            //devuelve la plantilla a partir de su código.

            for (var p in plantillas) {
                if (plantillas.hasOwnProperty(p)) {
                    if (plantillas[p].getCodigo() == codPlantilla) {
                        return (plantillas[p]);
                    }
                }
            }
            console.log("----RAG--- getPlantillaByCodigo - No Encontrado");
            return undefined;
        },

        getPlantillaByVinculo: function(vinculoPlantilla) {
            //devuelve la plantilla a partir de su vinculo.
            if (plantillas.hasOwnProperty(vinculoPlantilla)) {
                return (plantillas[vinculoPlantilla]);
            }
            console.log("----CAR--- getPlantillaByVinculo - No Encontrado");
            return undefined;
        },
        getRecursos: function() { return recursos; },
        getRecursosByHashcode: function() { return recursosByHashcode; }

    };
};

Dnv.Pl.Condiciones = {};

Dnv.Pl.Condiciones.tipo = {
    VARIABLES: "Condicion",
    DEMOGRAFICAS: "CondicionDemografica"
};

Dnv.Pl.Variables = {};

Dnv.Pl.Variable = function(codigo, denominacion, comportamiento, defaultValue, tipoDato, grupo, prioridad, coleccion, tabla, forzada) {

    var valor = defaultValue;

    return {
        getCodigo: function() { return codigo; },
        getDenominacion: function() { return denominacion; },
        getComportamiento: function() { return comportamiento; },
        getDefaultValue: function() { return defaultValue; },
        getTipoDato: function() { return tipoDato; },
        getGrupo: function() { return grupo; },
        getPrioridad: function() { return prioridad; },
        getColeccion: function() { return coleccion; },
        getTabla: function() { return tabla; },
        getForzada: function() { return forzada },
        setValor: function(valorNuevo) { valor = valorNuevo; },
        getValor: function() {
            var valorParseado;
            switch (parseInt(tipoDato)) {
                case Dnv.Pl.Variable.tipo_dato.TIPO_NUMERICO:
                    valorParseado = parseFloat(valor);
                    break;
                case Dnv.Pl.Variable.tipo_dato.TIPO_BOOLEANO:
                    valorParseado = (valor == 'true') || (valor == 1);
                    break;
                case Dnv.Pl.Variable.tipo_dato.TIPO_TEXTO:
                    valorParseado = "'" + valor + "'";
                    break;
                default:
                    valorParseado = valor;
            }
            return valorParseado;
        }
    };

};

Dnv.Pl.Variable.comparador = {
    IGUAL: 1,
    MAYOR: 2,
    MENOR: 3,
    DISTINTO: 4,
    IN: 5
};

Dnv.Pl.Variable.prioridad = {
    NO: 0,
    SI: 1
};

Dnv.Pl.Variable.acumulador = {
    NINGUNO: 0,
    Y: 1,
    O: 2
};


Dnv.Pl.Variable.comportamiento = {
    VALOR_FIJO: 0,
    VALOR_CALCULADO_MANAGER_SERVIDOR: 1,
    VALOR_CALCULADO_MANAGER_BASTION: 2,
    VALOR_CALCULADO_MANAGER_PLAYER: 3,
    VALOR_CALCULADO_SALIDA_PLAYER: 4,
    VALOR_CALCULADO_SALIDA_MANAGER_PLAYER: 5,
    VALOR_EXTERNO: 6,
    VALOR_EXTERNO_MANAGER_NOJERARQUICO: 7
};

Dnv.Pl.Variable.grupo = {
    HORARIO_COMERCIAL: 1,
    RESERVA_SALAS: 2,
    INCIDENCIAS: 3,
    AVISOS: 4,
    AUTOBUSES: 5,
    SU_TURNO: 6,
    SENSORES_TEMPERATURAS: 7,
    MEDICION_AUDIENCIA: 8,
    TRANSPORTE: 9,
    GENERALES: 10,
    ESTADOS: 11,
    SMART_DISPLAY: 12
}

Dnv.Pl.Variable.tipo_dato = {
    TIPO_NUMERICO: 1,
    TIPO_BOOLEANO: 2,
    TIPO_TEXTO: 3,
    TIPO_FECHA: 4,
    TIPO_HORA: 5,
    TIPO_TIEMPO: 6,
    TIPO_IP: 7,
    TIPO_COLECCION: 8,
    TIPO_COLECCION_MULTIPLE: 9,
    TIPO_TAG: 10,
    TIPO_TABLA: 11,
    TIPO_TABLA_MULTIPLE: 12,
    TIPO_TABLA_MULTIPLE_CON_ORDEN: 13,
    TIPO_COLOR: 14,
    TIPO_DATASOURCE: 15,
    TIPO_BITRATE: 16,
    TIPO_TAMANO_EN_DISCO: 17,
    TIPO_TEMPERATURA: 18,
    TIPO_HUMEDAD: 19,
    TIPO_BATERIA: 20,
    TIPO_LUMINOSIDAD: 21,
    TIPO_FUENTE: 22,
    TIPO_TABLA_CON_BUSQUEDA: 23,
    TIPO_TEXTO_ENCRIPTADO: 24,
    TIPO_SECUENCIAL: 25
};

Dnv.Pl.Datasource = function(codigo, denominacion, source, intervalo, caducidad, vinculo, validated, enabled, metodo,
    caducidad_fromlastvalid, login_user, login_pass, access_token) {

    return {
        getCodigo: function() { return codigo; },
        getDenominacion: function() { return denominacion; },
        getSource: function() { return source; },
        getIntervalo: function() { return intervalo; },
        getCaducidad: function() { return caducidad; },
        getVinculo: function() { return vinculo; },
        getValidated: function() { return validated; },
        getEnabled: function() { return enabled; }
    }

}

/*
Canal.prototype.getCodigo = function() {return this._codigo;};
Canal.prototype.getSlides = function() {return this._slides;};
*/

Dnv.Pl.lastPlaylist = undefined;
Dnv.Pl.lastPlaylistDocument = undefined;
Dnv.Pl.lastPlaylistRecursosTipos = { DIRECTORIO: 1, FICHERO: 2, HIVESTACK: 3 };
Dnv.Pl.lastPlaylistRecursos = undefined;

Dnv.Pl.lastPlaylistIdiomaActual = {};
Dnv.Pl.lastPlaylistIdiomaAnterior = {};

Dnv.Pl.parsePlaylist = function(xml, usb, conCambiosCanales) {
    console.log("[PLAYLIST]: Parseando playlist");

    var getChildElement = function getChildElement(parent, name) {
        if (parent === null) {
            console.error("Intentando acceder a hijo " + name + " de un padre nulo\n" + (new Error().stack));

        }

        var childs = parent.childNodes;
        for (var i = 0; i < childs.length; i++) {
            //childs[i] instanceof Element 
            if ((childs[i].nodeType === Node.ELEMENT_NODE) && (childs[i].tagName === name)) {
                return childs[i];
            }
        }
        return null;
    }

    var getChildElements = function getChildElement(parent, name) {
        var childs = parent.childNodes;
        var result = [];
        for (var i = 0; i < childs.length; i++) {
            //childs[i] instanceof Element 
            if ((childs[i].nodeType == Node.ELEMENT_NODE) && (childs[i].tagName === name)) {
                result.push(childs[i]);
            }
        }
        return result;
    }

    var parseMetadatos = function(elemento) {
        /*
        var mdElements = elemento.getElementsByTagName("Metadato");
        for(var i = 0; i < mdElements.length; i++) {
        metadatos[mdElements[i].getAttribute("Nombre")] = mdElements[i].getAttribute("Valor");
        }*/
        //var iterator = document.evaluate("Metadatos/Metadato", elemento, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
        var doc;
        if (elemento.ownerDocument.evaluate) { // Firefox se queja si usamos un document que no es del elemento
            doc = elemento.ownerDocument;
        } else { // IE: Usando wgxpath
            doc = document;
        }
        var iterator = doc.evaluate("Metadatos/Metadato", elemento, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
        var metadatos = {};

        var thisNode = iterator.iterateNext();

        while (thisNode) {
            metadatos[thisNode.getAttribute("Nombre")] = thisNode.getAttribute("Valor")
            thisNode = iterator.iterateNext();
        }
        return metadatos;
    }
    /**
    * Parsea un string que contiene una fecha. Soporta los formatos "yyyy-MM-dd HH:mm:ss",
    * "dd/MM/yyyy HH:mm:ss" y "dd/MM/yyyy". Si <code>esFinal</code> es <code>true</code>,
    * la fecha devuelta se tratara como una fecha final: si <code>fecha</code> incluye la hora,
    * se ajustará a 999 ms; si solo incluye la fecha, se ajustará a 23:59:59.999 
    * @param fecha
    * @param esFinal
    * @return
    * @throws NumberFormatException
    * @throws ParseException
    */
    var parsearFecha = function(string, esFinal) {
        // TODO: Sacar la logica del parseo a una clase aparte para reutilizarla
        var datetimeParts = string.split(' ');
        var dateParts = datetimeParts[0].split('-');
        if (dateParts.length === 1) {
            dateParts = datetimeParts[0].split('/');
            var aux = dateParts[0];
            dateParts[0] = dateParts[2];
            dateParts[2] = aux;
        }
        var timeParts = undefined;
        if (datetimeParts.length === 2) {
            timeParts = datetimeParts[1].split(':');
        } else if (esFinal) {
            timeParts = [23, 59, 59];
        } else {
            timeParts = [0, 0, 0];
        }
        var msecs = (esFinal ? 999 : 0);
        return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], timeParts[2], msecs);
    };

    var parsearBloques = function parsearBloques(bloquesElement) {

    };

    var parsearCalendario = function parsearCalendario(calendarioElement, calFestivos) {

        var tipoCal = parseInt(calendarioElement.getAttribute('Tipo'), 10);
        var bloqueManager = new Dnv.Calendarios.BloqueManager(calFestivos); // No damos soporte al calendario de festivos aún

        var bloquesElements = getChildElements(calendarioElement, "Bloques");
        for (var j = 0; j < bloquesElements.length; j++) {
            var tipo = parseInt(bloquesElements[j].getAttribute('Tipo'), 10);

            var bloqueElements = getChildElements(bloquesElements[j], "Bloque");
            for (var k = 0; k < bloqueElements.length; k++) {
                var bloqueElement = bloqueElements[k];
                try {
                    bloqueManager.addBloque(tipo, new Dnv.Calendarios.Bloque(
                        parseInt(bloqueElement.getAttribute("Codigo"), 10),
                        parsearFecha(bloqueElement.getAttribute("Fecha_Inicio")),
                        parsearFecha(bloqueElement.getAttribute("Fecha_Fin"), true),
                        parseInt(bloqueElement.getAttribute("Valor"), 10),
                        parseInt(bloqueElement.getAttribute("ObjID"), 10),
                        parseInt(bloqueElement.getAttribute("ObjIDDispositivo"), 10)));
                } catch (e) { // Será una Dnv.Calendarios.FechaInvalidaException
                    console.error("[PLAYLIST] Error al parsear el calendario");
                    throw new Dnv.Pl.PlaylistException(e.message);
                }
            }
        }

        var cal = new Dnv.Calendarios.Cal(
            parseInt(calendarioElement.getAttribute('Codigo'), 10),
            parseInt(calendarioElement.getAttribute('Tipo'), 10),
            parseInt(calendarioElement.getAttribute('ObjIDDispositivo'), 10),
            parseInt(calendarioElement.getAttribute('DefaultValue'), 10),
            parseInt(calendarioElement.getAttribute('Estado'), 10),
            bloqueManager);
        return cal;

    };

    var parsearCalendarios = function parsearCalendarios(calendariosElement) {

        var calendarios = {};
        var calFestivos = null;
        var calendariosElements = getChildElements(calendariosElement, "Cal");

        // Primero buscamos el calendario de festivos para asociarle al resto de calendarios

        for (var i = 0; i < calendariosElements.length; i++) {
            var calendarioElement = calendariosElements[i];
            var tipoCal = parseInt(calendariosElements[i].getAttribute('Tipo'), 10);
            if (tipoCal == Dnv.Calendarios.Cal.tipos.FESTIVOS) {
                calFestivos = parsearCalendario(calendarioElement, null);
                break;
            }
        }
        if (!calFestivos) console.warn("PLAYLIST: No hay calendario de festivos");

        for (var i = 0; i < calendariosElements.length; i++) {
            var calendarioElement = calendariosElements[i];
            var cal = parsearCalendario(calendarioElement, calFestivos);

            calendarios[cal.getTipo()] = cal;
            /*if (calendariosElements[i].getAttribute('Tipo') == 300) {
            canal = canales[calendariosElements[i].getAttribute('DefaultValue')];
            }*/
        }
        return calendarios;
    }

    var parsearSlideCapaTextos = function parsearSlideCapaTextos(slideElement) {

        var resultado = {};
        var slideTextosElement = getChildElement(slideElement, "SlideTextos");
        if (slideTextosElement) {
            var textos = getChildElements(slideTextosElement, "SlideCapaTexto");
            for (var i = 0; i < textos.length; i++) {
                var slideCapaTextoElement = textos[i];
                var langs = getChildElements(getChildElement(slideCapaTextoElement, "langs"), "lang");
                var idiomasTextos = {};
                for (var j = 0; j < langs.length; j++) {
                    idiomasTextos[parseInt(langs[j].getAttribute("id"))] = langs[j].innerHTML;
                }
                resultado[parseInt(slideCapaTextoElement.getAttribute("Plantilla_capa_texto"))] = idiomasTextos;
            }
        }
        return resultado;

    }

    var doc;
    if (xml instanceof String) {
        doc = new DOMParser().parseFromString(xml, "text/xml").documentElement;
    } else {
        doc = xml;
    }

    var recursos = {};

    var plElement;
    if (doc instanceof Document) {
        plElement = doc.documentElement;
    } else {
        plElement = doc;
    }

    var metadatosPlayer = getChildElements(getChildElement(getChildElement(plElement, "Player"), "Metadatos"), "Metadato");

    // IDIOMAS

    function parseIdiomas(ent) {
        var cleanArray = function(array, deleteValue) {
            for (var i = 0; i < array.length; i++) {
                if (array[i] == deleteValue) {
                    array.splice(i, 1);
                    i--;
                }
            }
            return array;
        };

        var elemento = ent.getElementsByTagName("Metadato");
        for (var i = 0; i < elemento.length; i++) {
            if (elemento[i].getAttribute("Nombre") == "Idiomas") {
                var idiomas = elemento[i].getAttribute("Valor");
                return cleanArray(idiomas.split(";"), "");
            }
        }
    }

    // METADATOS RECURSOS

    function parsearMetadatoRecurso(metadato, metadatosPlayerP, metadatosSalidaP) {

        // Settings del PLAYER

        var campos = metadato.match(/\[SALIDA\.SETTINGS\.(.*?)\]/gi);
        var valor;

        if (campos) {
            for (var i = 0; i < campos.length; i++) {
                var metadatoPlayer = campos[i].substring(campos[i].lastIndexOf(".") + 1, campos[i].lastIndexOf("]"));
                try {
                    valor = Dnv.cfg.getCfgString(metadatoPlayer, "");
                    if (!valor) {
                        valor = "";
                    }
                    metadato = metadato.replace(campos[i], valor);
                } catch (e) {
                    console.warn("PLAYLIST: No existe el setting: " + metadatoPlayer + " en el player y no se puede pasar al recurso");
                }
            }
        }

        // Metadatos del PLAYER

        campos = metadato.match(/\[PLAYER\.METADATA\.(.*?)\]/gi);
        valor;

        if (campos) {
            for (var i = 0; i < campos.length; i++) {
                var metadatoPlayer = campos[i].substring(campos[i].lastIndexOf(".") + 1, campos[i].lastIndexOf("]"));
                try {
                    valor = metadatosPlayerP[metadatoPlayer];
                    if (!valor) {
                        valor = "";
                    }
                    metadato = metadato.replace(campos[i], valor);
                } catch (e) {
                    console.warn("PLAYLIST: No existe el metadato: " + metadatoPlayer + " en el player y no se puede pasar al recurso");
                }
            }
        }

        // Metadatos de la SALIDA

        campos = metadato.match(/\[SALIDA\.METADATA\.(.*?)\]/gi);

        if (campos) {
            for (var i = 0; i < campos.length; i++) {
                var metadatoSalida = campos[i].substring(campos[i].lastIndexOf(".") + 1, campos[i].lastIndexOf("]"));
                try {
                    valor = metadatosSalidaP[metadatoSalida];
                    if (!valor) {
                        valor = "";
                    }
                    metadato = metadato.replace(campos[i], valor);
                } catch (e) {
                    console.warn("PLAYLIST: No existe el metadato: " + metadatoSalida + " en la salida y no se puede pasar al recurso");
                }
            }
        }

        // Properties de la SALIDA

        campos = metadato.match(/\[SALIDA\.PROPERTIES\.(.*?)\]/gi);

        if (campos) {
            for (var i = 0; i < campos.length; i++) {
                var propertieSalida = campos[i].substring(campos[i].lastIndexOf(".") + 1, campos[i].lastIndexOf("]"));
                try {
                    valor = metadatosSalidaP[propertieSalida];
                    if (propertieSalida == "ObjectID") valor = parseInt(salidaElement.getAttribute("Codigo"));
                    if (!valor) valor = "";
                    metadato = metadato.replace(campos[i], valor);
                } catch (e) {
                    console.warn("PLAYLIST: No existe la propiedad: " + propertieSalida + " en la salida y no se puede pasar al recurso");
                }
            }
        }

        return metadato;

    }

    var playerElement = getChildElement(plElement, "Player");
    var salidaElement = getChildElement(getChildElement(playerElement, "Salidas"), "Salida");
    var idiomasSalida = parseIdiomas(getChildElement(salidaElement, "Metadatos"));

    var metadatosPlayerP = parseMetadatos(playerElement);
    var metadatosSalidaP = parseMetadatos(salidaElement);

    var metadatosPlayerParseados = [];
    for (var property in metadatosPlayerP) {
        if (metadatosPlayerP.hasOwnProperty(property)) {
            metadatosPlayerParseados[property] = parsearMetadatoRecurso(metadatosPlayerP[property], metadatosPlayerP, metadatosSalidaP);
        }
    }
    metadatosPlayerP = metadatosPlayerParseados;

    var metadatosSalidaParseados = [];
    for (var property in metadatosSalidaP) {
        if (metadatosSalidaP.hasOwnProperty(property)) {
            metadatosSalidaParseados[property] = parsearMetadatoRecurso(metadatosSalidaP[property], metadatosPlayerP, metadatosSalidaP);
        }
    }
    metadatosSalidaP = metadatosSalidaParseados;

    var perfilReproduccion = 1;
    for (var i = 0; i < metadatosPlayer.length; i++) {
        if (metadatosPlayer[i].getAttribute('Nombre') == 'Profile') {
            perfilReproduccion = metadatosPlayer[i].getAttribute("Valor");
        }
    }

    console.info("[PLAYLIST] Parseando variables");

    var variableElements = plElement.getElementsByTagName("Variable");
    var nuevasVariables = {};
    for (var k = 0; k < variableElements.length; k++) {
        var variableElement = variableElements[k];
        var variable = new Dnv.Pl.Variable(parseInt(variableElement.getAttribute('Codigo')),
            variableElement.getAttribute('Denominacion'),
            parseInt(variableElement.getAttribute('Comportamiento')),
            variableElement.getAttribute('DefaultValue'),
            parseInt(variableElement.getAttribute('Tipo_Dato')),
            parseInt(variableElement.getAttribute('Grupo')),
            parseInt(variableElement.getAttribute('Prioridad')),
            parseInt(variableElement.getAttribute('Coleccion')),
            parseInt(variableElement.getAttribute('Tabla')),
            parseInt(variableElement.getAttribute('DescargaForzada'))
        );

        //Dnv.Pl.Variables[variable.getCodigo()] = variable;
        nuevasVariables[variable.getCodigo()] = variable;
    }

    console.info("[PLAYLIST] Parseando datasources");

    var datasourceElements = plElement.getElementsByTagName("DataSources");
    for (var k = 0; k < datasourceElements.length; k++) {
        var datasourceElement = datasourceElements[k];

    }

    console.info("[PLAYLIST] Parseando recursos");
    var datasourcesNecesarios = [];
    var recursoElements = plElement.getElementsByTagName("Recurso");
    for (var i = 0; i < recursoElements.length; i++) {
        var element = recursoElements[i];
        console.log("PLAYLIST: Recurso " + element.getAttribute('Filename'));
        var Clase = null;
        switch (parseInt(element.getAttribute('Tipo_Objeto'), 10)) {
            case Dnv.Pl.Recurso.tipos.TIPO_IMAGEN: Clase = Dnv.Pl.Imagen; break;
            case Dnv.Pl.Recurso.tipos.TIPO_VIDEO: Clase = Dnv.Pl.Video; break;
            case Dnv.Pl.Recurso.tipos.TIPO_FLASH: Clase = Dnv.Pl.Flash; break;
            case Dnv.Pl.Recurso.tipos.TIPO_HTML5: Clase = Dnv.Pl.Html5; break;
        }
        /*
        if (Clase == Dnv.Pl.Flash && Dnv.helpers.flashAvailable == false) {
            Clase = null;
        }
        */
        if (Clase !== null) {
            var metadatosElements = element.getElementsByTagName("Metadato");
            var metadatos = {};
            for (var k = 0; k < metadatosElements.length; k++) {
                metadatos[metadatosElements[k].getAttribute('Nombre')] = parsearMetadatoRecurso(metadatosElements[k].getAttribute('Valor'), metadatosPlayerP, metadatosSalidaP);
            }

            //DataSource asociado al recurso
            var datasourceRecurso = metadatos["FlashDatasource"];
            if (datasourceRecurso != undefined) {
                if (datasourceRecurso != 0 && Dnv.Cloud.isFileSystemAvailable() && Dnv.Cloud.downloader.guardarDataSource && datasourcesNecesarios.indexOf(datasourceRecurso) == -1) {
                    console.log("PLAYLIST: Descargando Datasource " + datasourceRecurso);
                    datasourcesNecesarios.push(datasourceRecurso); // Para no pedirlo varias veces
                }
            } else {
                datasourceRecurso = 0;
            }
            var idioma = element.getAttribute('Idioma');

            var anadir = false;

            // solo se procesan los recursos del perfil de reproducción que tiene asigando el player
            //if (element.getAttribute('Profile') == perfilReproduccion /**&& idiomasSalida.indexOf(idioma) != -1**/) {

            // en el array "recursos" hay una entrada por cada vinculo, y estas a su vez tienen tantas entradas como idiomas tenga el recurso
            var vinculo = parseInt(element.getAttribute('Vinculo'), 10);
            if (!recursos[vinculo]) {
                recursos[vinculo] = {};
            }

            // si el recurso es del perfil de la salida, pisa el que ya haya
            // si no hay ningun recurso aún para ese vínculo e idioma, le añade aunque no haya para ese perfil, para no quedarnos sin recurso
            if (element.getAttribute('Profile') == perfilReproduccion) {
                anadir = true;
            } else if (!recursos[vinculo][idioma]) {
                anadir = true;
            }

            if (anadir) {
                recursos[vinculo][idioma] = new Clase(
                    parseInt(element.getAttribute('Codigo'), 10),
                    element.getAttribute('Filename'),
                    element.getAttribute('InfoHash'),
                    parseInt(element.getAttribute('Tipo_Objeto'), 10),
                    parseInt(element.getAttribute('Vinculo'), 10),
                    metadatos,
                    datasourceRecurso,
                    element.getAttribute('Idioma'),
                    element.getAttribute('IsDefault'),
                    element.getAttribute('Profile'),
                    parseInt(element.getAttribute('Size'), 10),
                    parseInt(element.getAttribute('Duracion'), 10)
                );
            }

            //}
        }
    }

    function condicionesSlide(slide, tipo) {
        var condiciones = "";
        var condicionesSlide = slide.getElementsByTagName(tipo);

        for (var k = 0; k < condicionesSlide.length; k++) {
            var cod_variable;
            var variable;
            var comparador;
            var valor;
            var acumulador;
            var condicion = condicionesSlide[k];

            cod_variable = parseInt(condicion.getAttribute('Variable'));
            variable = "{" + cod_variable + "}";

            switch (parseInt(condicion.getAttribute('Acumulador'))) {
                case Dnv.Pl.Variable.acumulador.NINGUNO:
                    acumulador = "";
                    break;
                case Dnv.Pl.Variable.acumulador.Y:
                    acumulador = "&&";
                    break;
                case Dnv.Pl.Variable.acumulador.O:
                    acumulador = "||";
                    break;
            }

            switch (parseInt(condicion.getAttribute('Comparador'))) {
                case Dnv.Pl.Variable.comparador.IGUAL:
                    comparador = "==";
                    break;
                case Dnv.Pl.Variable.comparador.MAYOR:
                    comparador = ">";
                    break;
                case Dnv.Pl.Variable.comparador.MENOR:
                    comparador = "<";
                    break;
                case Dnv.Pl.Variable.comparador.DISTINTO:
                    comparador = "!=";
                    break;
            }

            if (Dnv.Pl.Variable.comparador.IN != parseInt(condicion.getAttribute('Comparador'))) {

                switch (parseInt(nuevasVariables[cod_variable].getTipoDato())) {
                    case Dnv.Pl.Variable.tipo_dato.TIPO_NUMERICO:
                        valor = parseFloat(condicion.getAttribute('Valor'));
                        break;
                    case Dnv.Pl.Variable.tipo_dato.TIPO_BOOLEANO:
                        valor = (condicion.getAttribute('Valor') == 'true') || (condicion.getAttribute('Valor') == 1);
                        break;
                    case Dnv.Pl.Variable.tipo_dato.TIPO_TEXTO:
                        valor = "'" + condicion.getAttribute('Valor').toLowerCase() + "'";
                        break;
                    default:
                        valor = condicion.getAttribute('Valor');
                }

                if (condicionesSlide.length > 1) {
                    condiciones += variable + " " + comparador + " " + valor + " " + acumulador + " ";
                } else {
                    condiciones += variable + " " + comparador + " " + valor;
                }

            } else {
                valor = "(";
                var sub_condiciones = condicion.getAttribute('Valor').split("|");
                sub_condiciones = sub_condiciones.filter(String);
                for (var m = 0; m < sub_condiciones.length; m++) {
                    if (sub_condiciones[m] != "") {
                        if (m != sub_condiciones.length - 1) {
                            valor += variable + " ==" + " '" + sub_condiciones[m].toLowerCase() + "' || ";
                        } else {
                            valor += variable + " ==" + " '" + sub_condiciones[m].toLowerCase() + "'";
                        }
                    }
                }

                valor += ")";

                if (condicionesSlide.length > 1) {
                    condiciones += valor + " " + acumulador + " ";
                } else {
                    condiciones += valor;
                }

            }
        }

        return condiciones;
    };

    console.info("[PLAYLIST] Parseando inserciones");

    Dnv.Pl.Inserciones = {};
    Dnv.Pl.InsercionesRecursos = [];

    var insercionesElements = getChildElement(plElement, "Inserciones").getElementsByTagName("Insercion");
    //for (var i = 0; i < 8; i++) {
    for (var i = 0; i < insercionesElements.length; i++) {
        var element = insercionesElements[i];

        var codigoInsercion = parseInt(element.getAttribute('Codigo'), 10);
        var denominacionInsercion = element.getAttribute('Denominacion');
        var recursosInsercion = recursos[parseInt(element.getAttribute('Recurso'), 10)];
        var campanyaInsercion = parseInt(element.getAttribute('Campanya'), 10);
        var estadoInsercion = parseInt(element.getAttribute('Estado'), 10);
        var codigoRecurso = parseInt(element.getAttribute('Content'), 10);

        console.log("PLAYLIST: Insercion " + denominacionInsercion + " (" + codigoInsercion + ")");

        // metemos la insercion en su nivel correspondiente a su prioridad
        var nivelInsercion = parseInt(element.getAttribute('Prioridad'), 10);

        /*
         * FIXME: No reemplazar elementos globales como Dnv.Pl.Inserciones (o campañas) hasta acabar de parsear la playlist
         * puesto que esta podría ser invalida y nos quedariamos con inserciones de una nueva playlist invalida,
         * mientras el engine usa la vieja playlist válida.
         * Además, habriamos borrado las inserciones que la vieja playlist necesitaría.
         */
        if (!Dnv.Pl.Inserciones[nivelInsercion]) Dnv.Pl.Inserciones[nivelInsercion] = {};

        if (!Dnv.Pl.campanyasVistas[nivelInsercion]) Dnv.Pl.campanyasVistas[nivelInsercion] = {};
        if (!Dnv.Pl.insercionesVistas[nivelInsercion]) Dnv.Pl.insercionesVistas[nivelInsercion] = {};
        //if (!Dnv.Pl.campanyasFrecuencia[nivelInsercion]) Dnv.Pl.campanyasFrecuencia[nivelInsercion] = {};
        //if (!Dnv.Pl.insercionesFrecuencia[nivelInsercion]) Dnv.Pl.insercionesFrecuencia[nivelInsercion] = {};

        // metemos la insercion en un nivel correspondiente por cada campaña
        if (!Dnv.Pl.Inserciones[nivelInsercion][campanyaInsercion]) Dnv.Pl.Inserciones[nivelInsercion][campanyaInsercion] = {};
        if (!Dnv.Pl.insercionesVistas[nivelInsercion][campanyaInsercion]) Dnv.Pl.insercionesVistas[nivelInsercion][campanyaInsercion] = {};
        //if (!Dnv.Pl.insercionesFrecuencia[nivelInsercion][campanyaInsercion]) Dnv.Pl.insercionesFrecuencia[nivelInsercion][campanyaInsercion] = {};

        // si es la primera vez que llega la insercion, se tiene en cuenta el estado de la playlist
        // sino se tiene en cuenta el de rabbit/respuesta pase
        if (Dnv.Pl.campanyasActivas[campanyaInsercion] != undefined) estadoInsercion = null;

        if (Dnv.Pl.campanyasVistas[nivelInsercion][campanyaInsercion] == undefined) Dnv.Pl.campanyasVistas[nivelInsercion][campanyaInsercion] = 0;
        if (Dnv.Pl.insercionesVistas[nivelInsercion][campanyaInsercion][codigoInsercion] == undefined) Dnv.Pl.insercionesVistas[nivelInsercion][campanyaInsercion][codigoInsercion] = 0;

        var nuevaInsercion = (new Dnv.Pl.Insercion(
            codigoInsercion,
            parseInt(element.getAttribute('ObjID'), 10),
            parseInt(element.getAttribute('Tipo'), 10),
            denominacionInsercion,
            campanyaInsercion,
            parseInt(element.getAttribute('ID'), 10),
            parseInt(element.getAttribute('Empresa'), 10),
            Date.parse(Dnv.utiles.stringToTimestamp(element.getAttribute('Fecha_Inicio'))),
            Date.parse(Dnv.utiles.stringToTimestamp(element.getAttribute('Fecha_Final'))),
            Dnv.utiles.parseTimeInMinutes(element.getAttribute('Hora_Inicio')),
            Dnv.utiles.parseTimeInMinutes(element.getAttribute('Hora_Fin')),
            codigoRecurso,
            recursosInsercion[Object.keys(recursosInsercion)[0]], // TODO Multiidioma
            parseInt(element.getAttribute('Content_Plantilla'), 10),
            parseInt(element.getAttribute('Tipo_Content'), 10),
            parseInt(element.getAttribute('Orden'), 10),
            parseInt(element.getAttribute('Vinculo'), 10),
            parseInt(element.getAttribute('Cliente'), 10),
            parseInt(metadatosPlayerP["Circuito"], 10),
            parseInt(element.getAttribute('Frecuencia'), 10),
            parseInt(element.getAttribute('FrecuenciaValue'), 10),
            parseInt(element.getAttribute('Duracion'), 10),
            parseInt(element.getAttribute('DuracionAuto'), 10),
            parseInt(element.getAttribute('PasesPorLoop'), 10),
            parseInt(element.getAttribute('LoopPorPases'), 10),
            element.getAttribute('Aleatorio'),
            parseMetadatos(element),
            parsearCalendarios(getChildElement(element, "Calendarios")),
            condicionesSlide(element, Dnv.Pl.Condiciones.tipo.VARIABLES),
            condicionesSlide(element, Dnv.Pl.Condiciones.tipo.DEMOGRAFICAS),
            nivelInsercion,
            estadoInsercion
        ));

        // FIXME: no hacer esta asignacion aqui, sino cuando se reemplaza la playlist
        Dnv.Pl.Inserciones[nivelInsercion][campanyaInsercion][codigoInsercion] = nuevaInsercion;

        /**
        if (nuevaInsercion.getTipoFrecuencia() == Dnv.Pl.Insercion.tipoFrecuencia.SEGUNDOS) {
            var dateNew = new Date().getTime() + (nuevaInsercion.getFrecuencia() * 1000);
            if (Dnv.Pl.insercionesFrecuencia[nivelInsercion][campanyaInsercion][codigoInsercion] == undefined) Dnv.Pl.insercionesFrecuencia[nivelInsercion][campanyaInsercion][codigoInsercion] = dateNew;
            if (Dnv.Pl.campanyasFrecuencia[nuevaInsercion.getPrioridad()][nuevaInsercion.getCampanya()] == undefined) {
                Dnv.Pl.campanyasFrecuencia[nuevaInsercion.getPrioridad()][nuevaInsercion.getCampanya()] = dateNew;
            } else if (dateNew < Math.min.apply(Math, Object.values(Dnv.Pl.campanyasFrecuencia[nuevaInsercion.getPrioridad()][nuevaInsercion.getCampanya()]))) {
                Dnv.Pl.campanyasFrecuencia[nuevaInsercion.getPrioridad()][nuevaInsercion.getCampanya()] = dateNew;
            }
        }
        **/
        if (nuevaInsercion.getTipoFrecuencia() == Dnv.Pl.Insercion.tipoFrecuencia.SEGUNDOS) {

            // + (nuevaInsercion.getFrecuencia() * 1000);

            // FIXME: no hacer esta asignacion aqui, sino cuando se reemplaza la playlist
            if (!Dnv.Pl.campanyasFrecuencia[campanyaInsercion]) Dnv.Pl.campanyasFrecuencia[campanyaInsercion] = 0;
            //if (!Dnv.Pl.insercionesFrecuencia[campanyaInsercion]) Dnv.Pl.insercionesFrecuencia[campanyaInsercion] = {};
            //if (!Dnv.Pl.insercionesFrecuencia[campanyaInsercion][codigoInsercion]) Dnv.Pl.insercionesFrecuencia[campanyaInsercion][codigoInsercion] = dateNew;
            /**
            if (Dnv.Pl.campanyasFrecuencia[nuevaInsercion.getCampanya()] == undefined) {
                Dnv.Pl.campanyasFrecuencia[nuevaInsercion.getCampanya()] = dateNew;
            } /**else if (dateNew < Math.min.apply(Math, Object.values(Dnv.Pl.campanyasFrecuencia[nuevaInsercion.getCampanya()]))) {
                Dnv.Pl.campanyasFrecuencia[nuevaInsercion.getCampanya()] = dateNew;
            }**/
        }

        Dnv.Pl.InsercionesRecursos.push(codigoRecurso);
    }

    // Parseamos las secuencias recurso
    console.info("[PLAYLIST] Parseando secuencias");
    var secuenciasElements = plElement.getElementsByTagName("Secuencia");
    var secuencias = {}

    for (var i = 0; i < secuenciasElements.length; i++) {

        // se procesan los recursos que conforman la secuencia en cada idioma de la salida
        for (var l = 0; l < idiomasSalida.length; l++) {

            var secuenciaElement = secuenciasElements[i];
            var secuenciaRecursoElements = secuenciaElement.getElementsByTagName("SecuenciaRecurso");
            var sr = [];
            var recurso_secuencia;
            var codigo_recurso_secuencia;
            var descartarSecuencia = false;
            if (secuenciaRecursoElements.length != 0) {
                for (var j = 0; j < secuenciaRecursoElements.length; j++) {
                    var secuenciaRecursoElement = secuenciaRecursoElements[j];

                    codigo_recurso_secuencia = secuenciaRecursoElement.getAttribute('Recurso');
                    if (recursos[codigo_recurso_secuencia]) {
                        recurso_secuencia = recursos[codigo_recurso_secuencia][idiomasSalida[l]];
                    } else {
                        continue;
                    }

                    // si no existe el recurso en el idioma de la salida, se busca el recurso por defecto y se marca como descartable
                    if (!recurso_secuencia) {
                        for (var property in recursos[codigo_recurso_secuencia]) {
                            if (recursos[codigo_recurso_secuencia].hasOwnProperty(property)) {
                                if (recursos[codigo_recurso_secuencia][property].getIsDefault()) {
                                    recurso_secuencia = recursos[codigo_recurso_secuencia][property];
                                    descartarSecuencia = true;
                                }
                            }
                        }
                    }

                    sr.push(new Dnv.Pl.SecuenciaRecurso(
                        secuenciaRecursoElement.getAttribute('Codigo'),
                        recurso_secuencia,
                        parseInt(secuenciaRecursoElement.getAttribute('Duracion'), 10),
                        parseInt(secuenciaRecursoElement.getAttribute('Orden'), 10)));
                }
                sr.sort(function(element1, element2) {
                    return parseInt(element1.getOrden(), 10) - parseInt(element2.getOrden(), 10);
                });
                //secuencias[secuenciaElement.getAttribute('Codigo')] = sr;

                if (!secuencias[secuenciaElement.getAttribute('Codigo')]) {
                    secuencias[secuenciaElement.getAttribute('Codigo')] = {};
                }

                secuencias[secuenciaElement.getAttribute('Codigo')][idiomasSalida[l]] = new Dnv.Pl.Secuencia(
                    parseInt(secuenciaElement.getAttribute('Codigo'), 10), sr, descartarSecuencia
                );
            }
            // TODO: probar
        }

    }

    console.info("[PLAYLIST] Parseando resoluciones");
    var resolucionesElements = getChildElements(getChildElement(plElement, "Resoluciones"), "Resolucion");
    var resoluciones = {};
    for (var i = 0; i < resolucionesElements.length; i++) {
        var cod = parseInt(resolucionesElements[i].getAttribute('Codigo'), 10);
        resoluciones[cod] = new Dnv.Pl.Resolucion(cod,
            parseInt(resolucionesElements[i].getAttribute('Ancho'), 10),
            parseInt(resolucionesElements[i].getAttribute('Alto'), 10));
    }

    console.info("[PLAYLIST] Parseando streams");
    var streams = {};
    var streamingsSeccionElement = getChildElement(plElement, "Streamings");
    if (streamingsSeccionElement !== null) {
        var streamElements = getChildElements(streamingsSeccionElement, "Streaming");
        for (var i = 0; i < streamElements.length; i++) {
            var streamElement = streamElements[i];

            var stream = new Dnv.Pl.Streaming(
                parseInt(streamElement.getAttribute('Codigo'), 10),
                streamElement.getAttribute('Denominacion'),
                streamElement.getAttribute('URL'),
                parseMetadatos(streamElement)["StreamMimeType"],
                streamElement.getAttribute('TipoStreaming')
            );
            streams[parseInt(streamElement.getAttribute('Codigo'), 10)] = stream;
        }
    }

    console.info("[PLAYLIST] Parseando plantillas");
    var plantillas = {};

    // Datasource asociado a la salida

    var datasourceSalida = metadatosSalidaP["FlashDatasource"];
    if (datasourceSalida != undefined) {
        if (datasourceSalida != 0 && Dnv.Cloud.isFileSystemAvailable() && Dnv.Cloud.downloader.guardarDataSource && datasourcesNecesarios.indexOf(datasourceSalida) == -1) {
            console.log("PLAYLIST: Descargando Datasource " + datasourceSalida);
            datasourcesNecesarios.push(datasourceSalida); // Para no pedirlo varias veces
        }
    } else {
        datasourceSalida = 0;
    }


    var plantillasElements = plElement.getElementsByTagName("Plantilla");

    for (var i = 0; i < plantillasElements.length; i++) {

        var element = plantillasElements[i];
        var capas = [];

        var capaElements = element.getElementsByTagName("Capa");

        for (var j = 0; j < capaElements.length; j++) {

            var capaElement = capaElements[j];
            var recursoId = capaElement.getAttribute('Content');
            var descartar_smo = false;
            var recursoHtml5Id = null;
            if (capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_SMARTOBJECT) {
                var smoElement = capaElement.getElementsByTagName("SmartObject")[0];
                recursoId = smoElement.getAttribute('Recurso');
                recursoHtml5Id = smoElement.getAttribute('RecursoHTML5');
            }

            // se comprueba is existe cada recurso de la capa en los distintos idiomas de la salida
            for (var l = 0; l < idiomasSalida.length; l++) {

                var recurso = null;
                var descartar = false;

                if (recursos[recursoId]) {
                    // si no existe el recurso en un idioma de la salida, se coge el de por defecto
                    // una capa se marca para "descartar" cuando ha sido rellenada con un recurso por defecto, no correspodiente al idioma
                    if (!recursos[recursoId].hasOwnProperty(idiomasSalida[l])) {

                        for (var property in recursos[recursoId]) {
                            if (recursos[recursoId].hasOwnProperty(property)) {
                                if (recursos[recursoId][property].getIsDefault()) {
                                    recurso = recursos[recursoId][property];
                                    descartar = true;
                                }
                            }
                        }

                    } else {
                        recurso = recursos[recursoId][idiomasSalida[l]];
                    }
                } else if (capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                    descartar = secuencias[recursoId][idiomasSalida[l]].isDescartar();
                } else if (capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_TEXTO ||
                    capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_FUENTE_VIDEO ||
                    capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_STREAMING ||
                    capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_HUECO ||
                    capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_URL ||
                    capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_TV) {
                    // Capas sin recursos explicitos
                    recurso = null;
                } else if (capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_ANIMACION ||
                    capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_HTML5 ||
                    capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_IMAGEN ||
                    (capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_SMARTOBJECT && recursoId != 0) ||
                    capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_TIPO_SONIDO ||
                    capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_VIDEO) {
                    throw new Dnv.Pl.PlaylistException("Falta el recurso " + recursoId);
                }

                if (recursoHtml5Id !== null && recursoHtml5Id !== "0" && !recursos[recursoHtml5Id]) {
                    // No verificamos idiomas porque los SMO no usan idiomas y solo hay un recurso
                    throw new Dnv.Pl.PlaylistException("Falta el recurso " + recursoHtml5Id);
                }

                var datasource = null;
                var metadatos = null;
                var contenido = null;
                var contenidoHtml5 = null;
                var tipoSmo = null;
                if (capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_SMARTOBJECT) {
                    var smoElement = capaElement.getElementsByTagName("SmartObject")[0];

                    recursoId = smoElement.getAttribute('Recurso');
                    var recursoHtml5Id = smoElement.getAttribute('RecursoHTML5');

                    datasource = smoElement.getAttribute('DataSource');
                    var tipoSmo = parseInt(smoElement.getAttribute('Tipo')); // Es el tipo de objeto

                    //console.log(datasource+" "+Dnv.Cloud.isFileSystemAvailable()+" "+Dnv.Cloud.downloader.guardarDataSource);
                    if (datasource != 0 && Dnv.Cloud.isFileSystemAvailable() && Dnv.Cloud.downloader.guardarDataSource && datasourcesNecesarios.indexOf(datasource) == -1) {
                        console.log("PLAYLIST: Descargando Datasource " + datasource);
                        //Dnv.Cloud.downloader.guardarDataSource(datasource, xml);
                        datasourcesNecesarios.push(datasource); // Para no pedirlo varias veces

                    }

                    var metadatosElements = smoElement.getElementsByTagName("Metadato");
                    var metadatos = {};
                    for (var k = 0; k < metadatosElements.length; k++) {
                        metadatos[metadatosElements[k].getAttribute('Nombre')] = parsearMetadatoRecurso(metadatosElements[k].getAttribute('Valor'), metadatosPlayerP, metadatosSalidaP);
                    }

                    if (recursoHtml5Id != 0 && recursos[recursoHtml5Id]) {
                        contenidoHtml5 = recursos[recursoHtml5Id][idiomasSalida[l]];
                        if (!contenidoHtml5) {
                            contenidoHtml5 = recursos[recursoHtml5Id][Object.keys(recursos[recursoHtml5Id])[0]];
                        }
                    } else {
                        contenidoHtml5 = null;
                    }


                    if (recursoId != 0 && recursos[recursoId]) {
                        contenido = recursos[recursoId][idiomasSalida[l]];
                        if (!contenido) {
                            contenido = recursos[recursoId][Object.keys(recursos[recursoId])[0]];
                        }
                    } else {
                        contenido = null;
                    }

                    // solo no se marca para descartar la primera aparicion del SMO (no se tienen en cuenta idiomas en los SMO)
                    if (descartar_smo) {
                        descartar = true;
                    } else {
                        descartar_smo = true;
                    }

                } else if (capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) { // Secuencia
                    contenido = secuencias[recursoId][idiomasSalida[l]];
                    var recursosSecuencia = contenido.getSecuenciasRecursos();
                    datasource = "";
                    for (var k = 0; k < recursosSecuencia.length; k++) {
                        var recursoSecuencia = recursosSecuencia[k].getRecurso();
                        if (recursoSecuencia.getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5 && recursoSecuencia.getDataSource() != undefined) {
                            datasource += recursoSecuencia.getDataSource() + ";";
                        } else {
                            datasource += ";";
                        }
                    }
                    //Si el datasource solo contiene el caracter ; repetido entonces no hay ningún recurso con datasource en la secuencia
                    if ((datasource.match(/;/g) || []).length == datasource.length) {
                        datasource = undefined;
                    }


                } else if (capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_STREAMING) {
                    var streamingElement = capaElement.getElementsByTagName("Streaming")[0];
                    if (!streamingElement) {
                        contenido = streams[recursoId];
                        if (!contenido) {
                            throw new Dnv.Pl.PlaylistException("La capa " + capaElement.getAttribute('Codigo') + " no tiene elemento Streaming, ni el streaming " + recursoId + " estÃ¡ en la seccion de Streamings");
                        }
                    } else {
                        //metadatosCapa = parseMetadatos(streamingElement);

                        var metadatosElements = streamingElement.getElementsByTagName("Metadato");
                        var metadatos = {};
                        for (var k = 0; k < metadatosElements.length; k++) {
                            metadatos[metadatosElements[k].getAttribute('Nombre')] = parsearMetadatoRecurso(metadatosElements[k].getAttribute('Valor'), metadatosPlayerP, metadatosSalidaP);
                        }
                        contenido = new Dnv.Pl.Streaming(recursoId, streamingElement.getAttribute('Denominacion'), streamingElement.getAttribute('URL'), metadatos["StreamMimeType"], streamingElement.getAttribute('TipoStreaming'));
                    }
                    recurso = contenido;
                } else if (capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_TEXTO) {
                    var textElement = capaElement.getElementsByTagName("Texto")[0];
                    if (textElement.getAttribute("Tipo") === "0") {
                        var langs = textElement.getElementsByTagName("lang");
                        var textos = {};
                        for (var k = 0; k < langs.length; k++) {
                            var langElement = langs[k];
                            if (langElement.innerHTML !== undefined) {
                                textos[parseInt(langElement.getAttribute("id"), 10)] = langElement.innerHTML;
                            } else { // IE
                                var div = document.createElement("div");
                                for (var langNode = 0; langNode < langElement.childNodes.length; langNode++) {
                                    var child = langElement.childNodes[langNode].cloneNode(true);
                                    div.appendChild(child);
                                }
                                textos[parseInt(langElement.getAttribute("id"), 10)] = div.innerHTML;
                            }
                        }
                        //<marquee Codigo="0" Comportamiento="0" Direccion="0" Continua="False" Repeticiones="0" Desplazamiento="4" Retraso="0" Enabled="False"></marquee>
                        //
                        var marqueeElement = textElement.getElementsByTagName("marquee")[0];
                        var marquee = {
                            comportamiento: parseInt(marqueeElement.getAttribute("Comportamiento"), 10),
                            direccion: parseInt(marqueeElement.getAttribute("Direccion"), 10),
                            continua: Dnv.helpers.strToBoolean(marqueeElement.getAttribute("Continua")),
                            repeticiones: parseInt(marqueeElement.getAttribute("Repeticiones"), 10),
                            desplazamiento: parseInt(marqueeElement.getAttribute("Desplazamiento"), 10),
                            retraso: parseInt(marqueeElement.getAttribute("Retraso"), 10),
                            enabled: Dnv.helpers.strToBoolean(marqueeElement.getAttribute("Enabled"))
                        };
                        contenido = new Dnv.Pl.Texto(recursoId, textos, marquee);

                    } else { // Texto avanzado
                        // TODO
                        //contenido = secuencias[recursoId];
                    }
                } else if (capaElement.getAttribute('Tipo_Capa') == Dnv.Pl.Capa.tipos.TIPO_HTML5) {

                    if (recurso.getDataSource) {
                        datasource = recurso.getDataSource();
                    }
                    contenido = recurso;

                } else {
                    contenido = recurso;;
                }

                var def = null;
                if (!recurso) {
                    def = true;
                } else {
                    def = recurso.getIsDefault();
                }

                if (Dnv.cfg.getCfgInt("TransITProduct", 0) > 0 && parseInt(capaElement.getAttribute('Tipo_Capa')) == Dnv.Pl.Capa.tipos.TIPO_HUECO) {

                } else {
                    capas.push(new Dnv.Pl.Capa(
                        parseInt(capaElement.getAttribute('Codigo'), 10),
                        contenido, // FIXME: Validar que existe, indexar por vinculo
                        parseInt(capaElement.getAttribute('X'), 10),
                        parseInt(capaElement.getAttribute('Y'), 10),
                        parseInt(capaElement.getAttribute('Ancho'), 10),
                        parseInt(capaElement.getAttribute('Alto'), 10),
                        parseInt(capaElement.getAttribute('Orden'), 10),
                        (capaElement.getAttribute('RelojMaestro') == "1"),
                        parseInt(capaElement.getAttribute('Tipo_Capa'), 10),
                        parsearMetadatoRecurso(capaElement.getAttribute('URL'), metadatosPlayerP, metadatosSalidaP),
                        (capaElement.getAttribute('Auditar') == "1"),
                        datasource, metadatos,
                        contenidoHtml5, idiomasSalida[l],
                        def, descartar,
                        capaElement.getAttribute('AceleracionV'), tipoSmo,
                        parseInt(capaElement.getAttribute('Transparencia'), 10),
                        capaElement.getAttribute("Content")
                    ));
                    console.log("Añadida capa " + parseInt(capaElement.getAttribute('Codigo'), 10));
                }
            }
        }


        console.log("PLAYLIST: Añadimos plantilla " + element.getAttribute('Codigo') + " " + element.getAttribute('Denominacion'));
        plantillas[element.getAttribute('Vinculo')] = new Dnv.Pl.Plantilla(
            parseInt(element.getAttribute('Codigo'), 10),
            element.getAttribute('Denominacion'),
            resoluciones[parseInt(element.getAttribute('Resolucion'), 10)],
            parseMetadatos(element),
            capas,
            parseInt(element.getAttribute('Duracion'), 10),
            (element.getAttribute('AlternarContenidos') == "1"),
            parseInt(element.getAttribute('PlantillaMaestra'), 10),
            parseInt(element.getAttribute('Auditar'), 10)
        );
    }

    Dnv.Cloud.downloader.setCodsDatasources(datasourcesNecesarios);

    console.info("[PLAYLIST] Parseando canales");
    var canales = {};
    var tipo = Dnv.Pl.Canal.tipo.NO_AGRUPADO;
    var canalesAgrupados = [];
    var canalElements = plElement.getElementsByTagName("Canal");

    function ordenarCanalesAgrupados(a, b) {
        if (a.getOrden() < b.getOrden()) return -1;
        if (a.getOrden() > b.getOrden()) return 1;
        return 0;
    }

    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    for (var i = 0; i < canalElements.length; i++) {
        var element = canalElements[i];

        tipo = element.getAttribute("TipoAgrupacion");
        canalesAgrupados = [];

        var slides = null;

        // canales agrupados
        if (tipo != Dnv.Pl.Canal.tipo.NO_AGRUPADO && tipo != Dnv.Pl.Canal.tipo.TODOS) {
            slides = null;
            var canalesAgrupadosCanal = element.getElementsByTagName("Canal");
            for (var k = 0; k < canalesAgrupadosCanal.length; k++) {
                var canalAgrupado = canalesAgrupadosCanal[k];
                if (canalAgrupado.getAttribute("Orden") == 0) continue;

                var pases = canalAgrupado.getAttribute("Pases");
                if (pases == "-1") {
                    pases = 999999;
                }
                canalesAgrupados.push(new Dnv.Pl.CanalAgrupado(
                    canalAgrupado.getAttribute("Codigo"),
                    canalAgrupado.getAttribute("Canal"),
                    canalAgrupado.getAttribute("CanalHijo"),
                    canalAgrupado.getAttribute("Porcentaje"),
                    canalAgrupado.getAttribute("IsDefault"),
                    pases,
                    canalAgrupado.getAttribute("Orden")
                ));
            }
            canalesAgrupados.sort(ordenarCanalesAgrupados);

        } else {

            slides = [];
            var slideElements = element.getElementsByTagName("Slide");




            for (var j = 0; j < slideElements.length; j++) {
                var slideElement = slideElements[j];
                console.log("PLAYLIST: Slide " + slideElement.getAttribute('Codigo') + " con plantilla " + slideElement.getAttribute('Plantilla'));
                var plantilla = plantillas[slideElement.getAttribute('Plantilla')];
                if (!plantilla) {
                    //throw new Dnv.Pl.PlaylistException("Falta la plantilla " + slideElement.getAttribute('Plantilla') + " a la que hace referencia el slide " + slideElement.getAttribute('Codigo'));
                    console.log("Falta la plantilla " + slideElement.getAttribute('Plantilla') + " a la que hace referencia el slide " + slideElement.getAttribute('Codigo') + ". Omitimos el slide.");
                    continue;
                }



                var ambitoSalida = function ambitoSalida(slide) {

                    var ambitosElement = slide.getElementsByTagName("Condiciones_Ambito");
                    var playerElement = getChildElement(plElement, "Player");
                    var salidaElement = getChildElement(getChildElement(playerElement, "Salidas"), "Salida");
                    var codSalida = parseInt(salidaElement.getAttribute('Codigo'), 10)

                    for (var k = 0; k < ambitosElement.length; k++) {
                        var ambitoElement = ambitosElement[k];

                        var ambitos = ambitoElement.getAttribute('Lista');
                        if (ambitos != null) {
                            var listaAmbitos = ambitos.split(";");
                            for (var m = 0; m < listaAmbitos.length; m++) {
                                if (listaAmbitos[m] == codSalida) {
                                    return true;
                                }
                            }
                        } else {
                            return true;
                        }
                    }

                    return false;

                }

                var ambitoTags = function ambitoTags(slide) {

                    // TAGs de la salida
                    var playerElement = getChildElement(plElement, "Player");
                    var salidaElement = getChildElement(getChildElement(playerElement, "Salidas"), "Salida");
                    var metadatoSalida = parseMetadatos(salidaElement)["TAG"];
                    if (!metadatoSalida) return true;
                    if (metadatoSalida == "") return true;
                    if (metadatoSalida == "*") return true;
                    var tagsSalida = metadatoSalida.split(/[,;]/);
                    // eliminar duplicados
                    tagsSalida = tagsSalida.filter(function(item, pos, self) {
                        return self.indexOf(item) == pos;
                    });

                    // TAGs del slide
                    var metadatoTag = parseMetadatos(slide)["TAG"];
                    if (!metadatoTag) return true;
                    if (metadatoTag == "") return true;
                    var tagsSlide = metadatoTag.split(/[,;]/);
                    // eliminar duplicados
                    tagsSlide = tagsSlide.filter(function(item, pos, self) {
                        return self.indexOf(item) == pos;
                    });

                    // Intersecion de los dos arrays de tags
                    var numElemCommon = tagsSalida.filter(function(n) {
                        return tagsSlide.indexOf(n) !== -1;
                    });
                    numElemCommon = numElemCommon.length;

                    if (Dnv.cfg.getCfgBoolean("Salida_TAGS_CondicionOR", false)) {
                        if (numElemCommon > 0) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        if (tagsSlide.length == numElemCommon) {
                            return true
                        } else {
                            return false
                        }
                    }
                }

                var enAmbito = false;

                if (ambitoSalida(slideElement)) {
                    enAmbito = true;
                } else {
                    console.warn("El slide " + (slideElement.getAttribute('Codigo'), 10) + ": " + slideElement.getAttribute('Denominacion') + ", no está establecido para este ámbito de salida. Omitimos el slide.");
                }

                // TAGs
                var enAmbitoTags = false;

                if (Dnv.cfg.getCfgBoolean("HabilitarFiltroPorTags", false)) {
                    if (ambitoTags(slideElement)) {
                        enAmbitoTags = true;
                    } else {
                        console.warn("El slide " + (slideElement.getAttribute('Codigo'), 10) + ": " + slideElement.getAttribute('Denominacion') + ", no está establecido en los tags para esta salida. Omitimos el slide.");
                    }
                } else {
                    enAmbitoTags = true;
                }

                if (enAmbito && enAmbitoTags) {
                    /**
                    slides.push(new Dnv.Pl.Slide(
                    parseInt(slideElement.getAttribute('Codigo'), 10),
                    slideElement.getAttribute('Denominacion'),
                    plantillas[parseInt(slideElement.getAttribute('Plantilla'), 10)], // FIXME: Validar que existe, indexar por vinculo
                    parseInt(slideElement.getAttribute('Duracion'), 10),
                    parseInt(slideElement.getAttribute('Orden'), 10),
                    // [DEMO] Para demos con DenevaControl. Si ciclos != 1 asumimos que es la cabecera del canal...
                    parseInt(slideElement.getAttribute('Ciclos'), 10), /*parseInt(slideElement.getAttribute('Ciclos'), 10)
                    parseMetadatos(slideElement),
                    { fecha_inicio: Date.parse(slideElement.getAttribute('Fecha_Inicio')), fecha_final: Date.parse(slideElement.getAttribute('Fecha_Final')),
                    dias: slideElement.getAttribute('Dias').split(';'), hora_inicio: Dnv.utiles.parseTimeInMinutes(slideElement.getAttribute('Hora_Inicio')),
                    hora_final: Dnv.utiles.parseTimeInMinutes(slideElement.getAttribute('Hora_Final'))
                    }
                    ));
                    **/
                    // comportamiento alternado
                    if (metadatosSalidaP["ComportamientoIdioma"] == 1) {
                        var slide_anadido = false;
                        var slide_default = true;
                        for (var iS = 0; iS < idiomasSalida.length; iS++) {
                            var capasSlide = plantillas[parseInt(slideElement.getAttribute('Plantilla'), 10)].getCapas();
                            var capasSlideIdioma = [];
                            for (var cI = 0; cI < capasSlide.length; cI++) {
                                if (capasSlide[cI].getIdioma() == idiomasSalida[iS]) {
                                    capasSlideIdioma.push(capasSlide[cI]);
                                };
                            }
                            var numCapas = 0;
                            var numCapasDescartar = 0;
                            //var numCapasDefault = 0;
                            for (var cI = 0; cI < capasSlideIdioma.length; cI++) {
                                numCapas++;
                                if (capasSlideIdioma[cI].getDescartar()) {
                                    numCapasDescartar++;
                                    /**
                                    if (capasSlideIdioma[cI].getIsDefault()) {
                                    numCapasDefault++;
                                    }
                                    **/
                                }
                            }

                            // se descarta todo el slide cuando todos los recursos son los del idioma por defecto (descartables)
                            if ((numCapas == numCapasDescartar) /**&& (numCapasDefault != numCapas)**/) continue;
                            slides.push(new Dnv.Pl.Slide(
                                parseInt(slideElement.getAttribute('Codigo'), 10),
                                slideElement.getAttribute('Denominacion'),
                                plantillas[parseInt(slideElement.getAttribute('Plantilla'), 10)], // FIXME: Validar que existe, indexar por vinculo
                                parseInt(slideElement.getAttribute('Duracion'), 10),
                                parseInt(slideElement.getAttribute('Orden'), 10),
                                // [DEMO] Para demos con DenevaControl. Si ciclos != 1 asumimos que es la cabecera del canal...
                                parseInt(slideElement.getAttribute('Ciclos'), 10), /*parseInt(slideElement.getAttribute('Ciclos'), 10)*/
                                parseMetadatos(slideElement),
                                parsearSlideCapaTextos(slideElement),
                                {
                                    fecha_inicio: Date.parse(Dnv.utiles.stringToTimestamp(slideElement.getAttribute('Fecha_Inicio'))), fecha_final: Date.parse(Dnv.utiles.stringToTimestamp(slideElement.getAttribute('Fecha_Final'))),
                                    dias: slideElement.getAttribute('Dias').split(';'), hora_inicio: Dnv.utiles.parseTimeInMinutes(slideElement.getAttribute('Hora_Inicio')),
                                    hora_final: Dnv.utiles.parseTimeInMinutes(slideElement.getAttribute('Hora_Final'))
                                }, slide_default, condicionesSlide(slideElement, Dnv.Pl.Condiciones.tipo.VARIABLES), condicionesSlide(slideElement, Dnv.Pl.Condiciones.tipo.DEMOGRAFICAS),
                                slideElement.getAttribute('ExternalID'), (slideElement.getAttribute('Sincronizado') == 'True')
                            ));
                            slide_anadido = true;
                            slide_default = false;
                        }
                        // si no se ha añadido un slide, se añade uno para que no nos quedemos sin ese slide por no tener los recursos de él en el idioma de la salida
                        if (!slide_anadido) {
                            slides.push(new Dnv.Pl.Slide(
                                parseInt(slideElement.getAttribute('Codigo'), 10),
                                slideElement.getAttribute('Denominacion'),
                                plantillas[parseInt(slideElement.getAttribute('Plantilla'), 10)], // FIXME: Validar que existe, indexar por vinculo
                                parseInt(slideElement.getAttribute('Duracion'), 10),
                                parseInt(slideElement.getAttribute('Orden'), 10),
                                // [DEMO] Para demos con DenevaControl. Si ciclos != 1 asumimos que es la cabecera del canal...
                                parseInt(slideElement.getAttribute('Ciclos'), 10), /*parseInt(slideElement.getAttribute('Ciclos'), 10)*/
                                parseMetadatos(slideElement),
                                parsearSlideCapaTextos(slideElement),
                                {
                                    fecha_inicio: Date.parse(Dnv.utiles.stringToTimestamp(slideElement.getAttribute('Fecha_Inicio'))), fecha_final: Date.parse(Dnv.utiles.stringToTimestamp(slideElement.getAttribute('Fecha_Final'))),
                                    dias: slideElement.getAttribute('Dias').split(';'), hora_inicio: Dnv.utiles.parseTimeInMinutes(slideElement.getAttribute('Hora_Inicio')),
                                    hora_final: Dnv.utiles.parseTimeInMinutes(slideElement.getAttribute('Hora_Final'))
                                }, true, condicionesSlide(slideElement, Dnv.Pl.Condiciones.tipo.VARIABLES), condicionesSlide(slideElement, Dnv.Pl.Condiciones.tipo.DEMOGRAFICAS),
                                slideElement.getAttribute('ExternalID'), (slideElement.getAttribute('Sincronizado') == 'True')
                            ));
                        }
                    } else {
                        slides.push(new Dnv.Pl.Slide(
                            parseInt(slideElement.getAttribute('Codigo'), 10),
                            slideElement.getAttribute('Denominacion'),
                            plantillas[parseInt(slideElement.getAttribute('Plantilla'), 10)], // FIXME: Validar que existe, indexar por vinculo
                            parseInt(slideElement.getAttribute('Duracion'), 10),
                            parseInt(slideElement.getAttribute('Orden'), 10),
                            // [DEMO] Para demos con DenevaControl. Si ciclos != 1 asumimos que es la cabecera del canal...
                            parseInt(slideElement.getAttribute('Ciclos'), 10), /*parseInt(slideElement.getAttribute('Ciclos'), 10)*/
                            parseMetadatos(slideElement),
                            parsearSlideCapaTextos(slideElement),
                            {
                                fecha_inicio: Date.parse(Dnv.utiles.stringToTimestamp(slideElement.getAttribute('Fecha_Inicio'))), fecha_final: Date.parse(Dnv.utiles.stringToTimestamp(slideElement.getAttribute('Fecha_Final'))),
                                dias: slideElement.getAttribute('Dias').split(';'), hora_inicio: Dnv.utiles.parseTimeInMinutes(slideElement.getAttribute('Hora_Inicio')),
                                hora_final: Dnv.utiles.parseTimeInMinutes(slideElement.getAttribute('Hora_Final'))
                            }, true, condicionesSlide(slideElement, Dnv.Pl.Condiciones.tipo.VARIABLES), condicionesSlide(slideElement, Dnv.Pl.Condiciones.tipo.DEMOGRAFICAS),
                            slideElement.getAttribute('ExternalID'), (slideElement.getAttribute('Sincronizado') == 'True')
                        ));

                    }
                    Dnv.Pl.lastPlaylistIdiomaActual[parseInt(slideElement.getAttribute('Codigo'), 10)] = 0;
                    Dnv.Pl.lastPlaylistIdiomaAnterior[parseInt(slideElement.getAttribute('Codigo'), 10)] = 9999;

                }

            }

            //Comprobamos si hay que habilitar Lemma y Hivestack

            //Si no tiene slides Hivestack detenemos el TimerPlaylistHivestack lo comento porque ya no es útil por el nuevo metodo PLAY en SSP. XAS
            /* if (!Dnv.cfg.getInternalCfgBoolean("HivestackPlayerEnabled", false)) {
                 Main.detenerTimerPlaylistHivestack();
             }*/


            slides.sort(function(element1, element2) {
                return parseInt(element1.getOrden(), 10) - parseInt(element2.getOrden(), 10);
            });

            if (element.getAttribute('Aleatorio') != 0) {
                slides = shuffle(slides);
                console.log("PLAYLIST: Canal " + element.getAttribute('Codigo') + " es aleatorio");
            }
        }

        // canales agrupados . calculo de pases de cada canal
        if (canalesAgrupados.length > 0) {
            var maestro = 0;
            var maximo = 0;

            switch (parseInt(tipo)) {
                case Dnv.Pl.Canal.tipo.AGRUPADO:
                    var porcentajes = [];
                    for (var ag = 0; ag < canalesAgrupados.length; ag++) {
                        porcentajes.push(parseInt(canalesAgrupados[ag].getPorcentaje()));
                        if (canalesAgrupados[ag].getPorcentaje() > maximo) {
                            maximo = canalesAgrupados[ag].getPorcentaje();
                            maestro = ag;
                        }
                    }
                    // se le asgina como "maestro" al canal que mayor porcentaje tiene
                    // para guiar los ciclos
                    canalesAgrupados[maestro].setMaestro(true);

                    var mcd = Dnv.utiles.getMaximoComunDivisor(porcentajes);
                    for (ag = 0; ag < canalesAgrupados.length; ag++) {
                        canalesAgrupados[ag].setPases(canalesAgrupados[ag].getPorcentaje() / mcd);
                    }
                    break;
                case Dnv.Pl.Canal.tipo.AGRUPADO_PASES:
                    var pases = [];
                    for (var ag = 0; ag < canalesAgrupados.length; ag++) {
                        pases.push(parseInt(canalesAgrupados[ag].getPases()));
                        if (canalesAgrupados[ag].getPases() > maximo) {
                            maximo = canalesAgrupados[ag].getPases();
                            maestro = ag;
                        }
                    }
                    // se le asgina como "maestro" al canal que mayor numero de pases tiene
                    // para guiar los ciclos
                    canalesAgrupados[maestro].setMaestro(true);
                    break;
            }
        }

        console.log("PLAYLIST: Añadimos canal " + element.getAttribute('Codigo'));

        var forzarMaestra = element.getAttribute('ForzarMaestra');
        if (forzarMaestra !== null) {
            forzarMaestra = Dnv.helpers.strToBoolean(forzarMaestra)
        } else {
            forzarMaestra = false;
        }

        var canal = new Dnv.Pl.Canal(
            parseInt(element.getAttribute('Codigo'), 10),
            element.getAttribute('Denominacion'),
            forzarMaestra,
            parseMetadatos(element),
            slides,
            tipo,
            canalesAgrupados,
            element.getAttribute('DuracionMax'),
            element.getAttribute('MargenMax')
        );
        canales[parseInt(element.getAttribute('Codigo'), 10)] = canal;

        if (tipo == Dnv.Pl.Canal.tipo.NO_AGRUPADO || tipo == Dnv.Pl.Canal.tipo.TODOS) {
            if (slides) {
                for (var j = 0; j < slides.length; j++) {
                    slides[j].setCanal(canal);
                }
            }
        }
    }

    console.info("[PLAYLIST] Parseando dispositivos");
    var playerElement = getChildElement(plElement, "Player");
    var salidaElement = getChildElement(getChildElement(playerElement, "Salidas"), "Salida");
    var pantallaElement = getChildElement(getChildElement(salidaElement, "Pantallas"), "Pantalla");
    var entradaMegafoniaElement = getChildElement(playerElement, "EntradaMegafonia");

    var calendariosPantalla = parsearCalendarios(getChildElement(pantallaElement, "Calendarios"));

    var pantalla = new Dnv.Pl.Pantalla(
        parseInt(pantallaElement.getAttribute('Codigo'), 10),
        parseInt(pantallaElement.getAttribute('Tipo'), 10),
        parseMetadatos(pantallaElement),
        calendariosPantalla
    );

    var metadatosSalida = parseMetadatos(salidaElement);

    var calendariosSalida = parsearCalendarios(getChildElement(salidaElement, "Calendarios"));
    var _validarCanales = function(cal, canales) {
        console.log("Validar " + cal.getDefaultValue());
        if (canales[cal.getDefaultValue()] === undefined) {
            throw new Dnv.Pl.PlaylistException("El canal " + cal.getDefaultValue() + " no está en la playlist");
        }
        // No incluye los precacheados...
        var bloques = cal.getBloqueManager().getBloques();
        for (var i = 0; i < bloques.length; i++) {
            console.log("Validar " + bloques[i].getValor());
            if (canales[bloques[i].getValor()] === undefined) {
                throw new Dnv.Pl.PlaylistException("El canal " + bloques[i].getValor() + " no está en la playlist");
            }
        }
    };
    _validarCanales(calendariosSalida[Dnv.Calendarios.Cal.tipos.CANAL], canales);
    if (calendariosSalida[Dnv.Calendarios.Cal.tipos.CANAL_INTERACTIVO]) {
        _validarCanales(calendariosSalida[Dnv.Calendarios.Cal.tipos.CANAL_INTERACTIVO], canales);
    }

    console.log("[PLAYLIST]: La resolucion de la salida es " + metadatosSalida["Resolución"]); //FIXME BORRAME

    var salida = new Dnv.Pl.Salida(
        parseInt(salidaElement.getAttribute('Codigo'), 10),
        parseInt(salidaElement.getAttribute('Tipo'), 10),
        salidaElement.getAttribute('Player'),
        salidaElement.getAttribute('Empresa'),
        metadatosSalida,
        resoluciones[parseInt(metadatosSalida["Resolución"], 10)],
        pantalla,
        calendariosSalida,
        canales,
        idiomasSalida,
        datasourceSalida
    );

    console.info("[PLAYLIST] Parseando estados");

    var estados = {};

    // estados que vienen en la playlist
    var estadosElements = plElement.getElementsByTagName("Estado");
    for (var e = 0; e < estadosElements.length; e++) {
        var estado = estadosElements[e];
        // layouts que tiene ese estado
        var layouts = getChildElements(estado, "Layout");
        for (var l = 0; l < layouts.length; l++) {
            var layout = layouts[l];
            // solo los layouts para la resolucion del player
            if (parseInt(layout.getAttribute('Resolucion'), 10) == parseInt(metadatosSalida["Resolución"], 10)) {
                var auditable = 0;
                var capasAvisos = [];
                var layers = getChildElements(layout, "Layer");
                for (var ly = 0; ly < layers.length; ly++) {
                    var layer = layers[ly];
                    // solo los layers que contengan avisos
                    var tipoAviso = parseInt(layer.getAttribute('AvisosTipo'), 10);
                    if (tipoAviso != 0) {
                        // TODO Multidioma
                        var recursoAviso = recursos[parseInt(getChildElements(layer, "SmartObject")[0].getAttribute('RecursoHTML5'), 10)];
                        if (recursoAviso) {
                            recursoAviso = recursoAviso[idiomasSalida[0]];
                        }
                        /**
                        avisos.push(new Dnv.Pl.Aviso(parseInt(layer.getAttribute('Codigo'), 10),
                        parseInt(layer.getAttribute('Tipo_Layer'), 10),
                        parseInt(layer.getAttribute('Content'), 10),
                        parseInt(layer.getAttribute('PosX'), 10),
                        parseInt(layer.getAttribute('PosY'), 10),
                        parseInt(layer.getAttribute('Width'), 10),
                        parseInt(layer.getAttribute('Height'), 10),
                        parseInt(layer.getAttribute('Zorder'), 10),
                        parseInt(layer.getAttribute('Auditar'), 10),
                        parseInt(layer.getAttribute('AvisosTipo'), 10),
                        parseInt(layer.getAttribute('Opacidad'), 10), 
                        recursosInserecursoAvisorcion[Object.keys(recursoAviso)[0]]  
                        ));
                        **/
                        if (parseInt(layer.getAttribute('Auditar'), 10) != 0) auditable = 1;
                        capasAvisos.push(new Dnv.Pl.Capa(parseInt(layer.getAttribute('Codigo'), 10),
                            null, // recurso
                            parseInt(layer.getAttribute('PosX'), 10),
                            parseInt(layer.getAttribute('PosY'), 10),
                            parseInt(layer.getAttribute('Width'), 10),
                            parseInt(layer.getAttribute('Height'), 10),
                            100 + parseInt(layer.getAttribute('Zorder'), 10),
                            0, //reloj maestro
                            Dnv.Pl.Capa.tipos.TIPO_HTML5,
                            null, // url
                            parseInt(layer.getAttribute('Auditar'), 10), // auditable
                            0, // OJO datasource
                            tipoAviso, // metadatos
                            recursoAviso, //recurso HTML5
                            idiomasSalida[0], // TODO multidioma
                            1, // is default
                            0, // descartar
                            1, // aceleracion hardware
                            null, // tipo SMO
                            parseInt(layer.getAttribute('Opacidad'), 10)
                        ));
                    }
                }

                var plantilla = new Dnv.Pl.Plantilla(layout.getAttribute('Codigo'),
                    layout.getAttribute('Denominacion'),
                    resoluciones[parseInt(layout.getAttribute('Resolucion'), 10)],
                    null, //metadatos
                    capasAvisos, //capas
                    null, //duracion
                    null, //alternada
                    null, //maestra
                    auditable //auditar
                );
            }
        }

        var estado = new Dnv.Pl.Estado(parseInt(estado.getAttribute('Codigo'), 10),
            estado.getAttribute('Denominacion'),
            parseInt(estado.getAttribute('Canal'), 10),
            parseInt(estado.getAttribute('IsDefault'), 10),
            parseInt(estado.getAttribute('EstadoDePlayer'), 10),
            plantilla
        );
        if (estado.getIsDefault()) Dnv.Pl.EstadoActual = estado.getCodigo();
        estados[estado.getCodigo()] = estado;
    }

    var calendariosPlayer = parsearCalendarios(getChildElement(playerElement, "Calendarios"));

    var entradaMegafonia = null;
    if (entradaMegafoniaElement && entradaMegafoniaElement.firstChild) {
        entradaMegafonia = new Dnv.Pl.EntradaMegafonia(parseInt(entradaMegafoniaElement.getAttribute('Codigo'), 10), parseMetadatos(entradaMegafoniaElement));
    }

    var player = new Dnv.Pl.Player(
        parseInt(playerElement.getAttribute('Codigo'), 10),
        parseMetadatos(playerElement),
        parseInt(playerElement.getAttribute('Ubicacion'), 10),
        calendariosPlayer,
        salida,
        entradaMegafonia,
        estados
    );


    //Check Recursos SSP
    if (Dnv.Pl.lastPlaylist !== undefined) {
        var recold = Dnv.Pl.lastPlaylist.getRecursos();
        var recoldArr = Object.keys(recold);
        var recN = Object.keys(recursos);
        for (var i = 0; i < recoldArr.length; i++) {
            var handl = false;
            for (var r = 0; r < recN.length; r++) {
                if (recoldArr[i] == recN[r]) {
                    handl = true;
                }
            }
            if (recold[recoldArr[i]][Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0]] != undefined) {
                if (!handl && recold[recoldArr[i]][Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0]].isSSP()) { //Multiidioma falla seguro
                    recursos[recoldArr[i]] = recold[recoldArr[i]];
                }
            }
           
        }
    }


    var pl = new Dnv.Pl.Playlist(canales, player, plantillas, streams, recursos);
    for (var cod in plantillas) {
        if (plantillas.hasOwnProperty(cod)) {
            plantillas[cod].setPlaylist(pl);
        }
    }


    console.info("[PLAYLIST]: Reemplazamos la playlist");
    Dnv.Pl.lastPlaylistDocument = doc;
    Dnv.Pl.lastPlaylist = pl;

    //Para saber si tiene alguna capa de tipo hueco, que SSP hay que inicializar dependiendo del Tipo de hueco
    //if ((Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro()) || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") != ";1;") {
    var cpElement = plElement.getElementsByTagName("Capa");
    for (var jk = 0; jk < cpElement.length; jk++) {
        var cp = cpElement[jk];
        if (cp.getAttribute("Tipo_Capa") == "18" && cp.getAttribute("Content") == "3") {

            console.info("[PLAYLIST] .SSP. Detecto que la capa " + cp.getAttribute("Codigo") + " es de Hivestack");
            if ((Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro()) || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") != ";1;") {
                Dnv.SSP.Hivestack.Play();
            }
            Dnv.SSP.Hivestack.Enable = true;

        } else if (cp.getAttribute("Tipo_Capa") == "18" && cp.getAttribute("Content") == "2") {
            console.log("[PLAYLIST] .SSP. Detecto que la capa " + cp.getAttribute("Codigo") + " es de Lemma");
            Dnv.cfg.setInternalCfgBoolean("LemmaPlayerEnabled", true);
            setTimeout(Dnv.monitor.startLemmaSSP, 1000);

        } else if (cp.getAttribute("Tipo_Capa") == "18" && cp.getAttribute("Content") == "6") {
            //Iniciar cosas admooh
            Dnv.SSP.Admooh.Play();

        } else if (cp.getAttribute("Tipo_Capa") == "18" && cp.getAttribute("Content") == "7") {
            //Iniciar PlaceExchange
            Dnv.SSP.PlaceExchange.Play();
        }
    }
    //}

    // Borramos las variables no existentes, y sobrescribimos con las nuevas
    for (var key in Dnv.Pl.Variables) {
        if (Dnv.Pl.Variables.hasOwnProperty(key) && !nuevasVariables.hasOwnProperty(key)) {
            delete Dnv.Pl.Variables[key]; // JS permite borrar la propiedad que enumeramos en el for in
        }
    }
    for (var key in nuevasVariables) {
        if (nuevasVariables.hasOwnProperty(key)) {
            if (Dnv.Pl.Variables.hasOwnProperty(key)) {
                nuevasVariables[key].setValor(Dnv.Pl.Variables[key].getValor());
            }
            Dnv.Pl.Variables[key] = nuevasVariables[key];
        }
    }





    /**
    if (Main.info.engine != "electron") Dnv.sincronizacion.setMaestro(Dnv.cfg.getCfgString("Sincronizador_IsMaster", ";;") != ";;");
    if (Main.info.engine != "electron") Dnv.sincronizacion.setEsclavo(Dnv.cfg.getCfgString("Sincronizador_IsMaster", ";;") == ";;");
    **/

    Dnv.presentador.setPreferirFlashAHtml5(player.prefiereFlashAHtml5());

    if (Dnv.cfg.getCfgBoolean("GaplessVideoEnabled", true) && Dnv.gaplessVideo && Dnv.gaplessVideo.isSupported()) {
        Dnv.Pl.preprocessGapLessVideo(pl);
    }

    if (conCambiosCanales) {
        if (Dnv.secuenciador) Dnv.secuenciador.resetCanalesAgrupados();
    }

    window.dispatchEvent(new CustomEvent(Dnv.NEW_PLAYLIST_EVENT, { detail: pl }));

    var ordenarRecursos = function ordenarRecursos(a, b) {
        if (a.getSize() < b.getSize()) return -1;
        if (a.getSize() > b.getSize()) return 1;
        return 0;
    }
    console.log("[PLAYLIST]: " + recursos);

    var recursosDownload = [];
    var recursosPlaylist = [];
    if (Dnv.Cloud.isFileSystemAvailable()) {
        for (var key_recurso in recursos) {
            //if (!isNaN(key_recurso)) {
            for (var l = 0; l < idiomasSalida.length; l++) {

                var recurso = recursos[key_recurso][idiomasSalida[l]];

                if (!recursos[key_recurso]) {
                    continue;
                } else if (!recursos[key_recurso].hasOwnProperty(idiomasSalida[l])) {
                    recurso = recursos[key_recurso][Object.keys(recursos[key_recurso])[0]];
                }

                recursosPlaylist.push({ localUrl: recurso.getLocalUrl(), filenameOriginal: recurso.getFilename(), hashcode: recurso.getHashcode(), tipo: Dnv.Pl.lastPlaylistRecursosTipos.FICHERO });
                if (recurso.getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) {
                    recursosPlaylist.push({ localUrl: recurso.getUrlDescompresion(), hashcode: recurso.getHashcode(), tipo: Dnv.Pl.lastPlaylistRecursosTipos.DIRECTORIO });
                }

                recursosDownload.push(recurso);
                //if (!Dnv.Cloud.downloader.isRecursoDisponible(recurso.getRemoteUrl(), recurso.getHashcode()) || usb) {
                //    var descomprimir = false;
                //    if (recurso.getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) descomprimir = true;
                //    Dnv.Cloud.downloader.descargarRecurso(recurso.getRemoteUrl(), recurso.getHashcode(), descomprimir, usb);
                //}
                //}
            }
        }

        recursosDownload.sort(ordenarRecursos);

        for (var k = 0; k < recursosDownload.length; k++) {
            var recurso = recursosDownload[k];
            var descomprimir = false;
            if (recurso.getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) descomprimir = true;
            console.log("[PLAYLIST]: Añadido a descargar " + recurso.getFilename() + " (" + recurso.getSize() + ")");
            Dnv.Cloud.downloader.descargarRecurso(recurso.getRemoteUrl(), recurso.getHashcode(), descomprimir, usb, recurso.getSize(), recurso.getCodigo());
        }
    }
    Dnv.Pl.lastPlaylistRecursos = recursosPlaylist;

    return pl;
}

Dnv.Pl.SSPRecursos = []; //Array con los codigos de los recursos que son SSP

Dnv.Pl.parsePlaylistHivestack = function(json, usb) {
    try {


        Dnv.monitor.writeLogFile("[PLAYLIST HIVESTACK] .SSP. : Parseando playlist");
        var dtime = new Date().getTime();
        Dnv.SSP.Hivestack.PlayList = json;
        if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro()) {
            Dnv.sincronizacion.sendPlayListHivestack();
        }

        var doc = json;
        var recursos = {};

        var plHivestackElement = doc;


        // Creatives


        Dnv.monitor.writeLogFile("[PLAYLIST HIVESTACK] Parseando creatives");


        var recursoElements = doc;
        for (var i = 0; i < recursoElements.length; i++) {
            var element = recursoElements[i];
            Dnv.monitor.writeLogFile("PLAYLIST Hivestack: Recurso " + element.url.replace("/creative", "_creative").substring(element.url.replace("/creative", "_creative").lastIndexOf("/") + 1));
            var Clase = null;
            switch (element.mime_type.split("/")[0]) {
                case "image": Clase = Dnv.Pl.Imagen; break;
                case "video": Clase = Dnv.Pl.Video; break;
                case "html5": Clase = Dnv.Pl.Html5; break;
            }

            if (Clase !== null) {
                var metadatos = {};

                metadatos.filename = element.url.replace("/creative", "_creative").substring(element.url.replace("/creative", "_creative").lastIndexOf("/") + 1);
                metadatos.codigo = element.creative_id.toString() + element.file_size.toString();
                metadatos.remoteURL = element.url;
                metadatos.uuid = element.uuid;
                metadatos.size = element.file_size;
                metadatos.duracion = element.duration;
                Dnv.Pl.SSPRecursos.push(parseInt(metadatos.codigo));

                switch (element.mime_type.split("/")[0]) {
                    case "image": metadatos.tipo_objeto = 204; break;
                    case "video": metadatos.tipo_objeto = 205; break;
                    case "html5": metadatos.tipo_objeto = 218; break;
                }

                //DataSource asociado al recurso
                var datasourceRecurso = 0;

                var idioma = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0];

                // en el array "recursos" hay una entrada por cada vinculo, y estas a su vez tienen tantas entradas como idiomas tenga el recurso
                var vinculo = parseInt(metadatos.codigo, 10);
                if (!recursos[vinculo]) {
                    recursos[vinculo] = {};
                }


                recursos[vinculo][idioma] = new Clase(
                    parseInt(metadatos.codigo, 10),
                    metadatos.filename,
                    metadatos.filename.split("_")[0],
                    metadatos.tipo_objeto,
                    parseInt(metadatos.codigo, 10),
                    metadatos,
                    datasourceRecurso,
                    Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0],
                    "1",
                    "1",
                    element.file_size,
                    Math.floor(metadatos.duracion),
                    true,
                    "3"
                );


                //}
            }
        }

        if (Dnv.Pl.lastPlaylist) {
            var pl = new Dnv.Pl.Playlist(Dnv.Pl.lastPlaylist.getCanales(), Dnv.Pl.lastPlaylist.getPlayer(), Dnv.Pl.lastPlaylist.getPlantillas(), Dnv.Pl.lastPlaylist.getStreams(), Object.assign(Dnv.Pl.lastPlaylist.getRecursos(), recursos));
            Dnv.Pl.lastPlaylistHivestack = pl;
        } else {
            var pl = null;
        }

        Dnv.monitor.writeLogFile("[PLAYLIST]: Reemplazamos la playlist");
        Dnv.Pl.lastPlaylistHivestackDocument = doc;





        //window.dispatchEvent(new CustomEvent(Dnv.NEW_PLAYLIST_EVENT, { detail: pl }));

        var ordenarRecursos = function ordenarRecursos(a, b) {
            if (a.getSize() < b.getSize()) return -1;
            if (a.getSize() > b.getSize()) return 1;
            return 0;
        }
        console.info("[PLAYLIST HIVESTACK]: " + recursos);

        var recursosDownload = [];
        var recursosPlaylist = [];
        var idiomasSalida = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas();
        if (Dnv.Cloud.isFileSystemAvailable()) {
            for (var key_recurso in recursos) {
                //if (!isNaN(key_recurso)) {
                for (var l = 0; l < idiomasSalida.length; l++) {

                    var recurso = recursos[key_recurso][idiomasSalida[l]];

                    if (!recursos[key_recurso]) {
                        continue;
                    } else if (!recursos[key_recurso].hasOwnProperty(idiomasSalida[l])) {
                        recurso = recursos[key_recurso][Object.keys(recursos[key_recurso])[0]];
                    }

                    recursosPlaylist.push({ localUrl: Dnv.Cloud.downloader.getLocalUrl(recurso.getMetadatos()["remoteURL"]), filenameOriginal: recurso.getFilename(), hashcode: recurso.getFilename().split("_")[0], tipo: Dnv.Pl.lastPlaylistRecursosTipos.FICHERO });
                    if (recurso.tipo == Dnv.Pl.Recurso.tipos.TIPO_HTML5) {
                        recursosPlaylist.push({ localUrl: Dnv.Cloud._UNZIP_PATH + recurso.getFilename(), hashcode: recurso.getFilename().split("_")[0], tipo: Dnv.Pl.lastPlaylistRecursosTipos.DIRECTORIO });
                    }

                    recursosDownload.push(recurso);
                    //if (!Dnv.Cloud.downloader.isRecursoDisponible(recurso.getRemoteUrl(), recurso.getHashcode()) || usb) {
                    //    var descomprimir = false;
                    //    if (recurso.getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) descomprimir = true;
                    //    Dnv.Cloud.downloader.descargarRecurso(recurso.getRemoteUrl(), recurso.getHashcode(), descomprimir, usb);
                    //}
                    //}
                }
            }

            recursosDownload.sort(ordenarRecursos);

            for (var k = 0; k < recursosDownload.length; k++) {
                var recurso = recursosDownload[k];
                var descomprimir = false;
                if (recurso.getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) descomprimir = true;
                console.info("[PLAYLIST]: Añadido a descargar " + recurso.getFilename() + " (" + recurso.getSize() + ")");
                Dnv.Cloud.downloader.descargarRecurso(recurso.getMetadatos()["remoteURL"], recurso.getHashcode(), descomprimir, false, recurso.getSize(), recurso.getCodigo());
                //Dnv.Cloud.downloader.descargarRecursoHivestack(recurso.getMetadatos()["remoteURL"], recurso.getHashcode(), descomprimir, usb, recurso.getSize(), recurso.getCodigo());
            }
        }
        if (Dnv.Pl.lastPlaylistRecursos) {
            Dnv.Pl.lastPlaylistRecursos = Dnv.Pl.lastPlaylistRecursos.concat(recursosPlaylist);
        } else {
            Dnv.Pl.lastPlaylistRecursos = recursosPlaylist;
        }
        if (Dnv.monitor.sendLogRabbit && JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", '{"config": {"uuid": "","url": "apps.hivestack.com","logstashEnabled": "True"},"campanya":{"id_campanya": "1322","empresa": "192","usuario": "389","id_insercion": "4107"}}')).config.logstashEnabled == "True") Dnv.monitor.sendLogRabbit("[HIVESTACK SSP]Playlist Hivestack parseada correctamente", "INFO");
        var dtime2 = new Date().getTime();
        console.info(".SSP.Hivestack isValidSSPContent He tardado " + (dtime2 - dtime) + " en buscar en validar recurso  de hivestack");
        return pl;
    } catch (e) {
        console.error("[.SSP.Hivestack] Error al parsear playlist de hivestack" + e);
    }
}



Dnv.Pl.fetchPlaylistUSB = function(xml, hashDNV, callback) {

    var pl;
    var data;
    var player;
    var players;
    var parser = new DOMParser();

    var getChildElement = function getChildElement(parent, name) {
        if (parent === null) {
            console.error("Intentando acceder a hijos de un padre nulo\n" + (new Error().stack));

        }

        var childs = parent.childNodes;
        for (var i = 0; i < childs.length; i++) {
            //childs[i] instanceof Element 
            if ((childs[i].nodeType === Node.ELEMENT_NODE) && (childs[i].tagName === name)) {
                return childs[i];
            }
        }
        return null;
    }

    // viene con un caracter oculto extraño en la primera posicion y hay que quitarlo
    data = xml.substr(1);

    pl = parser.parseFromString(data, "text/xml");
    pl = pl.getElementsByTagName("PlayList")[0];

    // la playlist tiene un formato diferente
    // el elemento <Player> viene dentro de un elemento <Players>
    // cambio al tipo estandar, donde esta en la raiz
    players = pl.getElementsByTagName("Players")[0];
    player = pl.getElementsByTagName("Player")[0];
    pl.removeChild(players);
    pl.appendChild(player);

    // playlist generica. Colocamos nuestro elemento player, pero respetando calendarios que nos vienen
    if (Dnv.encoder.descodificar(hashDNV).split(";")[0] == 0) {

        // secciones de player importado USB
        var playerImportado = getChildElement(pl, "Player");
        var salidaImportado = getChildElement(getChildElement(playerImportado, "Salidas"), "Salida");
        var pantallaImportado = getChildElement(getChildElement(salidaImportado, "Pantallas"), "Pantalla");

        var calendarioPlayerImportado = getChildElement(playerImportado, "Calendarios");
        var calendarioSalidaImportado = getChildElement(salidaImportado, "Calendarios");
        var calendarioPantallaImportado = getChildElement(pantallaImportado, "Calendarios");

        // secciones de player originales
        var playerOriginal = getChildElement(Dnv.Pl.lastPlaylistDocument, "Player");
        var salidaOriginal = getChildElement(getChildElement(playerOriginal, "Salidas"), "Salida");
        var pantallaOriginal = getChildElement(getChildElement(salidaOriginal, "Pantallas"), "Pantalla");

        var calendarioPlayer = getChildElement(playerOriginal, "Calendarios");
        var calendarioSalida = getChildElement(salidaOriginal, "Calendarios");
        var calendarioPantalla = getChildElement(pantallaOriginal, "Calendarios");


        // intercambio de secciones
        // calendarios importados a la original
        playerOriginal.removeChild(calendarioPlayer);
        playerOriginal.appendChild(calendarioPlayerImportado);

        salidaOriginal.removeChild(calendarioSalida);
        salidaOriginal.appendChild(calendarioSalidaImportado);

        pantallaOriginal.removeChild(calendarioPantalla);
        pantallaOriginal.appendChild(calendarioPantallaImportado);


        pl.removeChild(playerImportado);
        pl.appendChild(playerOriginal);

    } else if (Dnv.cfg.getCfgInt("MyOwnCode", 0) != Dnv.encoder.descodificar(hashDNV).split(";")[0]) {
        if (callback) callback(false);
        return;
    }

    try {
        Dnv.Pl.parsePlaylist(pl, true);
        console.info("[PLAYLIST USB] Playlist parseada con EXITO");
        Dnv.cfg.guardarPlEnDisco(new XMLSerializer().serializeToString(pl));
        Dnv.Pl.lastPlaylistFromUSB = true;
        if (callback) callback(true);
    } catch (e) {
        console.error("[PLAYLIST USB] Descartando actualizacion de Playlist: " + e);
        Dnv.monitor.writeLogFile("[PLAYLIST USB] Descartando actualizacion de Playlist: " + e, LogLevel.Error);
        Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Playlist USB invalida: " + e);
        console.error("[PLAYLIST USB] No se pudo parsear la playlist: " + e);
        if (callback) callback(false);
    }

}

Dnv.Pl.fetchPlaylist = function(onSuccessCallback) {
    if (!Dnv.licencias.isLicenciaValida()) {
        console.warn("[PLAYLIST] No pedimos playlist (licencia no válida)");
        return;
    }

    Dnv.monitor.writeLogFile("[PLAYLIST] Pedimos playlist\n");

    Dnv.servidor.getNewPlaylistDic(
        Dnv.Pl.lastPlaylistDocument,
        function exitoCb(doc, timeStamp) {
            // timestamp es undefined si no se usa WSDenevaRequest
            if (doc == "Sin cambios") {
                console.info("[PLAYLIST] WSRequest nos dice que no hay cambios en la playlist");
                Dnv.cfg.setInternalCfgString("timeLastPlaylist", Dnv.utiles.formatearFecha(new Date()));
                return;
            }
            if (doc == undefined || doc.childNodes.length == 0) {
                console.warn("[PLAYLIST] Recibida respuesta vacía, ¿no hay cambios en la playlist?");
                if (!Dnv.Pl.lastPlaylist) {
                    console.warn("[PLAYLIST] Intentamos cargar la playlist de disco");
                    var xml = Dnv.cfg.cargarPlDeDisco();
                    if (xml) {
                        var doc = new DOMParser().parseFromString(xml, "application/xml").documentElement;
                        var pl = Dnv.Pl.parsePlaylist(doc);

                        if (onSuccessCallback) onSuccessCallback(pl);
                    } else {
                        Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "No hay playlist disponible.");
                    }
                }
                return;
            }

            Dnv.cfg.setInternalCfgString("timeLastPlaylist", Dnv.utiles.formatearFecha(new Date()));
            if (timeStamp) {
                Dnv.cfg.setInternalCfgString("playlistLastUpdated", Dnv.utiles.formatearFecha(new Date(Date.parse(timeStamp)), false));
                
            } else {
                Dnv.cfg.setInternalCfgString("playlistLastUpdated", Dnv.utiles.formatearFecha(Dnv.Pl.getMaxTimestamp(doc)));
            }


            console.log("[PLAYLIST] procesamos playlist...");

            var conCambios = false;
            var conCambiosCanales = false;
            if (Dnv.Pl.lastPlaylistDocument) {
                var arrViejasSecciones = Dnv.Pl.lastPlaylistDocument.childNodes;

                // element.children da undefined aunque tenga hijos, usamos childNodes
                var arrNuevasSecciones = doc.childNodes;
                if (arrNuevasSecciones) {
                    for (var i = 0; i < arrNuevasSecciones.length; i++) {
                        var name = arrNuevasSecciones[i].tagName;
                        if (!name) continue;
                        for (var j = 0; j < arrViejasSecciones.length; j++) {
                            if (name === arrViejasSecciones[j].tagName) {
                                // Pese al nombre Dnv.Pl.lastPlaylistDocument puede ser un Element
                                // adoptNode modifica arrViejasSecciones, asi que guardamos el elemento y restauramos el indice
                                console.info("[PLAYLIST]: Hay que actualizar la sección " + name);
                                var elemento = arrNuevasSecciones[i];
                                var viejoElemento = arrViejasSecciones[j];
                                if (name == "Canales") {
                                    // TODO: Bastaria con ver si elemento.children > 0
                                    if (new XMLSerializer().serializeToString(elemento).substring(new XMLSerializer().serializeToString(elemento).indexOf('><') + 1) !=
                                        new XMLSerializer().serializeToString(viejoElemento).substring(new XMLSerializer().serializeToString(viejoElemento).indexOf('><') + 1)) {
                                        conCambiosCanales = true;
                                    }
                                }
                                i--;
                                Dnv.Pl.lastPlaylistDocument.ownerDocument.adoptNode(elemento);
                                Dnv.Pl.lastPlaylistDocument.replaceChild(elemento, viejoElemento);
                                conCambios = true;
                                break;
                            }
                        }

                    }
                    doc = Dnv.Pl.lastPlaylistDocument;
                } else { // Playlist es un elemento vacio, no hay cambios

                }
            } else {
                conCambios = true;
            }
            var pl;
            if (conCambios) {
                try {
                    pl = Dnv.Pl.parsePlaylist(doc, false, conCambiosCanales);
                    Dnv.Pl.lastPlaylistFromUSB = false;
                } catch (e) {
                    if (e instanceof Dnv.Pl.PlaylistException) {
                        console.error("[PLAYLIST] Descartando actualizacion de Playlist: " + e + " " + e.stack);
                        Dnv.monitor.writeLogFile("[PLAYLIST] Descartando actualizacion de Playlist: " + e, LogLevel.Error);
                        Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Playlist invalida: " + e);
                        /*Dnv.alarmas.enviarAlarmas([{
                        remitente: Dnv.alarmas.remitentes.MANAGER,
                        estado: Dnv.alarmas.estados.WARNING,
                        mensaje: "Playlist invalida: "+e
                        },{
                        remitente: Dnv.alarmas.remitentes.SALIDA,
                        estado: Dnv.alarmas.estados.WARNING,
                        mensaje: "Playlist invalida: "+e
                        }]);*/
                        return;
                    } else {
                        console.error("[PLAYLIST] No se pudo parsear la playlist: " + e + " " + e.stack);
                        return;
                    }
                }
                //console.log(pl);
                Dnv.cfg.guardarPlEnDisco(new XMLSerializer().serializeToString(doc));

                //buscamos el mayor timestamp de las secciones

            } else {
                pl = Dnv.Pl.lastPlaylist;
            }
            if (onSuccessCallback) onSuccessCallback(pl);
        }, function errorCb(e) {
            if (e) console.error(e);
            if (!Dnv.Pl.lastPlaylist) {
                console.warn("[PLAYLIST] Intentamos cargar la playlist de disco");
                var xml = Dnv.cfg.cargarPlDeDisco();
                if (!xml) {
                    console.error("[PLAYLIST] No se pudo cargar una playlist de disco");
                    return;
                }
                var doc = new DOMParser().parseFromString(xml, "application/xml").documentElement;
                var pl = Dnv.Pl.parsePlaylist(doc);
                Dnv.cfg.setInternalCfgString("playlistLastUpdated", Dnv.utiles.formatearFecha(Dnv.Pl.getMaxTimestamp(doc)));
                if (onSuccessCallback) onSuccessCallback(pl);
                return;
            } else {
                console.log("[PLAYLIST] Seguimos con la última playlist recibida");
            }

            // TODO: cargarla de disco
            //console.log(pl);
            //if(onSuccessCallback) onSuccessCallback(pl);
        });
}

Dnv.Pl.lastPlaylistHivestack = undefined;
Dnv.Pl.lastPlaylistHivestackDocument = undefined;
Dnv.Pl.lastPlaylistRecursosTipos = { DIRECTORIO: 1, FICHERO: 2 };
Dnv.Pl.lastPlaylistRecursos = undefined;
var PL_HIVESTACK_KEY = "pl_hivestack";

Dnv.Pl.fetchPlaylistHivestack = function(onSuccessCallback) {

    Dnv.monitor.writeLogFile("[PLAYLIST HIVESTACK] Pedimos playlist");

    Dnv.servidor.getNewPlaylistHivestackDic(
        Dnv.SSP.Hivestack.PlayList,
        function exitoCb(doc) {
            if (doc == undefined || doc.length == 0) {
                Dnv.monitor.writeLogFile("[PLAYLIST HIVESTACK] Recibida respuesta vacía");
                //RAG return;

                if (JSON.stringify(doc) !== JSON.stringify(Dnv.SSP.Hivestack.PlayList)) {
                    //Nueva playlist Hivestack.
                    Dnv.SSP.Hivestack.Ad = {};
                    var pl = Dnv.Pl.parsePlaylistHivestack(doc);

                }


                if (onSuccessCallback) onSuccessCallback(pl);


                return;
            }


            Dnv.monitor.writeLogFile("[PLAYLIST HIVESTACK] procesamos playlist...");
            var pl;
            try {
                if (JSON.stringify(doc) !== JSON.stringify(Dnv.SSP.Hivestack.PlayList)) {
                    Dnv.SSP.Hivestack.Ad = {};
                    pl = Dnv.Pl.parsePlaylistHivestack(doc, false, true);
                }



            } catch (e) {

                Dnv.monitor.writeLogFile("[PLAYLIST HIVESTACK] Playlist Hivestack no válida: " + e, LogLevel.Error);

            }


            if (onSuccessCallback) onSuccessCallback(pl);
        }, function errorCb(e) {
            Dnv.monitor.writeLogFile("[ERROR][PLAYLIST HIVESTACK] Seguimos con la última playlist recibida");
        });
}



Dnv.Pl.getMaxTimestamp = function(docPl) {

    var maxTimestamp = new Date("1900-01-01T00:00:00");

    if (!docPl || docPl.childNodes.length == 0) return maxTimestamp;

    var secciones = ['Canales', 'Plantillas', 'Recursos', 'Inserciones', 'RecursosDescargas', 'Resoluciones', 'Idiomas', 'Secuencias', 'Settings', 'Player', 'Variables', 'Estados', 'MensajesMegafonia', 'MensajesTeleindicadores', 'Streamings'];

    for (var i = 0; i < secciones.length; i++) {

        if (docPl.getElementsByTagName(secciones[i]).length > 0) {
            var strFecha = docPl.getElementsByTagName(secciones[i])[0].getAttribute("TimeStamp");
            console.info("[PLAYLIST] La fecha de la sección " + secciones[i] + " es " + strFecha);
            if (strFecha != undefined) {
                var elementos = strFecha.split(' ');
                var elementosFecha = elementos[0].split('/');
                var elementosHora = elementos[1].split(':');
                /* Esta conversion no se hace aqui, porque luego los elementos son parseados por Date
                if (elementosFecha[1].length === 1) elementosFecha[1] = '0' + elementosFecha[1];
                if (elementosFecha[0].length === 1) elementosFecha[0] = '0' + elementosFecha[0];
                if (elementosHora[0].length === 1) elementosHora[0] = '0' + elementosHora[0];
                if (elementosHora[1].length === 1) elementosHora[1] = '0' + elementosHora[1];
                if (elementosHora[2].length === 1) elementosHora[2] = '0' + elementosHora[2];
                */
                var d = new Date(
                    parseInt(elementosFecha[2], 10),
                    parseInt(elementosFecha[1], 10) - 1,
                    parseInt(elementosFecha[0], 10),
                    parseInt(elementosHora[0], 10),
                    parseInt(elementosHora[1], 10),
                    parseInt(elementosHora[2], 10));

                if (d > maxTimestamp) {
                    maxTimestamp = d;
                }
            }
        }
    }
    console.info("[PLAYLIST] La fecha de la playlist es " + maxTimestamp);
    return maxTimestamp;
}


/*
 * Tanto LG como SSSP  implementan videos gapless (seamless en el caso de SSSP)
 * Básicamente hay un objeto video al que se le pasa una lista de videos a reproducir.
 * No podemos avanzar manualmente al siguiente video. Tampoco podemos cambiar de posición
 * el video una vez que ha empezado a reproducirse...
 *  - En SSSP no se puede
 *  - En webOS horizontal a veces parece que no posicionaba bien
 *  - en webOS vertical hay que mosicionar el video 2-3 segundos despues de que haya comenzado a reproducir.
 * webOS no reproduce dos videos a la vez. SSSP depende de si es vertical u horizontal y si es SSSP2 o SSSP3.
 * http://www.samsungdforum.com/B2B/Guide/tut20006/index.html

  Ideas Gapless LG
    Validar version FW?
    Preparsear la playlist e ir marcando slides como invalidas
        Recorrer canal (¿y si es aleatorio?)
            Si plantilla + maestra > 2 videos = slide invalido
            Si plantilla tiene video:
                Si la anterior no tenia video, guardar en variable la posicion y dimension de la capa
                    Marcar como precargable?
                Si el anterior slide tenia video en las mismas dimensiones y posicion, modo gapless
                Si el anterior slide tenia video en otras dimensiones y posicion, reproduccion con gap, si va a ser gapless habra varios segundos de carga


            Tiene que haber un array de plantillas gapless, para validar si estan disponibles antes de empezar a reproducirlas
    


 */
Dnv.Pl.preprocessGapLessVideo = function(pl) {

    /*
    Esto está muy enfocado a LG.
    TODO: hacer algo más genérico... aunque quizás en otras plataformas no sea necesario

    La sincronización funciona creando una "playlist" de videos que le pasamos a la plataforma.


    Sincronización:
    Si sincronizamos de forma que las pantallas reprocuzcan un canal, pero al
    llegar la pantalla maestra un slide determinado , las pantallas esclavas pasan
    a ese slide.

    Esto implica problemas en el modo gapless:
    Puesto que las esclavas no pueden prever cuando van a tener que pasar a modo gapless.
    Además, estas plantillas son individuales, con lo que no serán gapless.

    La pantalla maestra podría ser gapless... pero como tendrá que esperar a las no gapless, la hacemos tambien no gapless

    La cosa tambien es que si al saltar a un slide, ha interrumpido un video gapless... cuando haya acabado el gapless ¿deberia retomarlo?

    Por ello, consideraremos siempre las sincronizadas como no gaples


    */
    var syncMaster = Dnv.sincronizacion.isMaestro();

    function areArraysEquals(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;
        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    function tienenCondicionesTemporalesIguales(slide1, slide2) {
        var cond1 = slide1.getCondicionesTemporales();
        var cond2 = slide2.getCondicionesTemporales();
        if (cond1 === cond2) return true;
        //if (JSON.stringify(cond1) === JSON.stringify(cond2)) return true;

        if (cond1.fecha_inicio === cond2.fecha_inicio &&
            cond1.fecha_final === cond2.fecha_final &&
            areArraysEquals(cond1.dias, cond2.dias) &&
            cond1.hora_inicio === cond2.hora_inicio &&
            cond1.hora_final === cond2.hora_final) {

            return true;
        }
        return false;
    }

    var canales = pl.getCanales();
    for (var key in canales) {
        if (canales[key].getTipoAgrupacion() != 0) {
            console.warn("[PLAYLIST] Existen canales agrupados, no se calcula la existencia de gapless.")
            return;
        }
    }
    for (var key in canales) {
        if (Dnv.helpers.isNumeric(key)) {
            var canal = canales[key];
            var anteriorSlide = null;
            var capaVideoAnteriorSlide = null;
            var videosGapless = null;
            var videosGaplessEnBucle = true;
            var slideInicioGapless = null;

            for (var i = 0; i < canal.getSlides().length; i++) {
                var slide = canal.getSlides()[i];
                // Validar si tiene varios videos
                // TODO: secuencias!!!
                var n = 0;
                var capaVideo = null;
                var slideConSecuenciaDeVideo = false;
                var capas = slide.getPlantilla().getCapas()
                for (var j = 0; j < capas.length; j++) {
                    if (capas[j].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_VIDEO) {
                        n++;
                        capaVideo = capas[j];
                    }
                    if (capas[j].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                        var secuenciaRecursos = capas[j].getRecurso().getSecuenciasRecursos();
                        for (var k = 0; k < secuenciaRecursos.length; k++) {
                            if (secuenciaRecursos[k].getRecurso().getTipo() == Dnv.Pl.Recurso.tipos.TIPO_VIDEO) {
                                slideConSecuenciaDeVideo = true;
                                n++;
                                break; // Solo contamos el primer video
                            }
                        }
                    }
                }
                var codMaestra = slide.getPlantilla().getMaestra();
                if (codMaestra != 0 && !pl.getPlantillaByVinculo(codMaestra)) {
                    console.warn("[PLAYLIST] La plantilla " + slide.getPlantilla().getCodigo() + " hace referencia a una plantilla inexistente");
                    slide.setIncompatible(false);
                    continue;

                }

                var isLeft = pl.getPlayer().isLeft();
                var isRight = pl.getPlayer().isRight();
                if (!((!isLeft && !isRight) || (isLeft && !slide.isRight()) || (isRight != slide.isLeft()))) {
                    console.warn("[PLAYLIST] La plantilla " + slide.getPlantilla().getCodigo() + " no es para nosotros");
                    continue;
                }


                if (codMaestra != 0 && pl.getPlantillaByVinculo(codMaestra)) {
                    // Miramos la plantilla maestra
                    var capas = pl.getPlantillaByVinculo(codMaestra).getCapas();
                    for (var j = 0; j < capas.length; j++) {
                        if (capas[j].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_VIDEO) {
                            n++;
                            capaVideo = capas[j];
                        }
                        if (capas[j].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                            var secuenciaRecursos = capas[j].getRecurso().getSecuenciasRecursos();
                            for (var k = 0; k < secuenciaRecursos.length; k++) {
                                if (secuenciaRecursos[k].getRecurso().getTipo() == Dnv.Pl.Recurso.tipos.TIPO_VIDEO) {
                                    slideConSecuenciaDeVideo = true;
                                    n++;
                                    break; // Solo contamos el primer video
                                }
                            }
                        }
                    }
                }

                if (slideConSecuenciaDeVideo) {
                    // A un slide con secuencia no lo hacemos gapless
                    videosGaplessEnBucle = false;

                    videosGapless = null;
                    capaVideoAnteriorSlide = null;

                    anteriorSlide = slide;
                    continue;
                }

                var resolucion = slide.getPlantilla().getResolucion();
                if (resolucion.getAncho() < resolucion.getAlto() && (!Main.isRotableNativamente || !Main.isRotableNativamente(pl))) {

                    // Las plantillas verticales no son gaples de momento
                    videosGaplessEnBucle = false;

                    videosGapless = null;
                    capaVideoAnteriorSlide = null;

                    anteriorSlide = slide;
                    continue;
                }



                if (slide.isSincronizado()) {
                    if (syncMaster) {
                        if (n > 1) { // Slide con varios videos
                            slide.setIncompatible(true);
                        } else {
                            // A un slide sincronizado no lo hacemos gapless
                            videosGaplessEnBucle = false;

                            videosGapless = null;
                            capaVideoAnteriorSlide = null;

                            anteriorSlide = slide;
                        }
                    } else { // Las pantallas esclavas la ignoran
                        //continue;
                    }
                    continue;
                }



                if (n > 1) { // Slide con varios videos
                    slide.setIncompatible(true);
                    continue;
                } else if (n == 1 && capaVideo.isRelojMaestro()) { // Un video y no es de una secuencia
                    if (capaVideoAnteriorSlide && anteriorSlide &&
                        tienenCondicionesTemporalesIguales(anteriorSlide, slide)) {
                        var capasEnMismaPosicion = (
                            capaVideoAnteriorSlide.getPosX() == capaVideo.getPosX() &&
                            capaVideoAnteriorSlide.getPosY() == capaVideo.getPosY() &&
                            capaVideoAnteriorSlide.getAncho() == capaVideo.getAncho() &&
                            capaVideoAnteriorSlide.getAlto() == capaVideo.getAlto())
                        if (!capasEnMismaPosicion) console.warn("Cambio de posicion para capa de video gapless!!!");

                        //if (capasEnMismaPosicion) {
                        if (!anteriorSlide.isGapless()) { // Este es el segundo video gapless...
                            // Marcamos el anterior slide como comienzo de gapless
                            slideInicioGapless = anteriorSlide;
                            anteriorSlide.setGapless(true);
                            anteriorSlide.setInicioGapless(true);
                            anteriorSlide.setPosicionVideosGapless({
                                x: capaVideoAnteriorSlide.getPosX(),
                                y: capaVideoAnteriorSlide.getPosY(),
                                w: capaVideoAnteriorSlide.getAncho(),
                                h: capaVideoAnteriorSlide.getAlto()
                            });
                            videosGapless = [];
                            anteriorSlide.setVideosGapless(videosGapless)
                            videosGapless.push(capaVideoAnteriorSlide.getRecurso().getUrl());

                            console.log("[GAPLESS] " + anteriorSlide.getDenominacion() + " inicia gapless");
                        }

                        slide.setGapless(true);
                        //slide.setInicioGapless(true);
                        slide.setPosicionVideosGapless({
                            x: capaVideo.getPosX(),
                            y: capaVideo.getPosY(),
                            w: capaVideo.getAncho(),
                            h: capaVideo.getAlto()
                        });
                        videosGapless.push(capaVideo.getRecurso().getUrl());
                        console.log("[GAPLESS] " + slide.getDenominacion() + " es gapless");

                        /*} else {
                        console.warn("Cambio de posicion para capa de video gapless!!!")
                        }*/



                    } else {
                        /*
                        * Este es el primer video gapless.
                        * ¿Asignamos ya el modo gapless? No, porque la carga de un video gapless es más lenta. Por ello, solo definimos como
                        * gapless, si hay un video a continuacion.
                        */

                        console.log("[GAPLESS] " + slide.getDenominacion() + " es puede que inicie gapless");


                        if (canal.getSlides().length == 1) { // El unico slide del canal
                            console.log("[GAPLESS] " + slide.getDenominacion() + " inicia gapless porque es el unico slide del canal");
                            slideInicioGapless = slide;
                            slide.setGapless(true);
                            slide.setInicioGapless(true);
                            slide.setPosicionVideosGapless({
                                x: capaVideo.getPosX(),
                                y: capaVideo.getPosY(),
                                w: capaVideo.getAncho(),
                                h: capaVideo.getAlto()
                            });
                            videosGapless = [];
                            slide.setVideosGapless(videosGapless);
                            // Local, porque cuando ejecutemos esto aun no estará disponible el video
                            videosGapless.push(capaVideo.getRecurso().getLocalUrl());

                            //console.log("[GAPLESS] " + lide.getDenominacion() + " inicia gapless");
                        }
                    }
                    capaVideoAnteriorSlide = capaVideo;
                } else { // Slide sin videos, o con video no reloj maestro
                    if (capaVideo && !capaVideo.isRelojMaestro()) {
                        console.log("[GAPLESS] El video de " + slide.getDenominacion() + " no es reloj maestro, no usamos gapless");
                    }

                    videosGaplessEnBucle = false;
                    videosGapless = null;
                    capaVideoAnteriorSlide = null;
                }
                anteriorSlide = slide;
            }
            if (videosGapless != null && videosGaplessEnBucle && slideInicioGapless) {
                slideInicioGapless.setVideosGaplessInLoop(true);
                /*
                * Todo el canal está en loop ¿que pasa si cambian los contenidos de la playlist?
                *
                * Si la playlist cambia, ¿reproducir el canal entero y cambiar los contenidos cuando paremos?
                */

            }
        }
    }

}
