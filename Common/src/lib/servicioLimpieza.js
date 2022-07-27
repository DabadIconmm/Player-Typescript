"use strict";

var Dnv = Dnv || {};

Dnv.limpieza = (function () {

    //mantenemos listas separadas en memoria. Si llegan elementos que no existen en el listado, se vuelca el correspondiente a local storage.
    //si el elemento ya existía no se guarda a LS
    //por seguridad se fija un timer cada (8h ??) para que guarde todo.

    var timerEnabled = false;
    var timerLimpieza;
    var timerGuardar;

    //diccionarios--
    var listadoLogs = {};
    var listadoAuditoria = {};
    var listadoDataSources = {};
    var listadoRecursos = {};
    var listadoRecursosDescomprimidos = {};

    var limitarDiasLog = 0;

    //--- settings
    //SegundosTimerLimpieza
    //SegundosTimerGuardarLimpieza
    //DiasLog
    //DiasAuditoria
    //DiasDataSource
    //DiasRecursos
    //LimitarDiasLog

    var _init = function init() {
        console.log("[LIMPIEZA]  cargamos todas las listas de disco..");
        _obtenerTodo();

        console.log("[LIMPIEZA] iniciamos timer guardarLimpieza a " + (Dnv.cfg.getCfgInt("MinutosTimerGuardarLimpieza", 480)) + " minutos");
        timerGuardar = setInterval(_guardarTodo, Dnv.cfg.getCfgInt("MinutosTimerGuardarLimpieza", 480) * 60 * 1000);
    };

    var _guardarTodo = function _guardarTodo() {
        _guardarListado("listadoLogs", listadoLogs);
        _guardarListado("listadoAuditoria", listadoAuditoria);
        _guardarListado("listadoDataSources", listadoDataSources);
        _guardarListado("listadoRecursos", listadoRecursos);
        _guardarListado("listadoRecursosDescomprimidos", listadoRecursosDescomprimidos);
    };

    var _obtenerTodo = function _obtenerTodo() {
        listadoLogs = _getListado("listadoLogs");
        listadoAuditoria = _getListado("listadoAuditoria");
        listadoDataSources = _getListado("listadoDataSources");
        listadoRecursos = _getListado("listadoRecursos");
        listadoRecursosDescomprimidos = _getListado("listadoRecursosDescomprimidos");
    };

    var _borrarTodo = function _borrarTodo() { // FIXME: [CAR] ¿? hace falta un delete, o al menos ponerlo a vacio
        window.localStorage['limpieza_' + "listadoLogs"];
        window.localStorage['limpieza_' + "listadoAuditoria"];
        window.localStorage['limpieza_' + "listadoDataSources"];
        window.localStorage['limpieza_' + "listadoRecursos"];
        window.localStorage['limpieza_' + "listadoRecursosDescomprimidos"];
        _obtenerTodo();
    };

    var _guardarListado = function _guardarListado(nombreListado, listado) {
        var saveData = [];

        window.localStorage['limpieza_' + nombreListado] = JSON.stringify(listado);
    };

    var _getListado = function _getListado(nombreListado) {
        var listado = {};
        var cd = window.localStorage['limpieza_' + nombreListado];
        var cdRaw;

        if (cd !== undefined) {
            listado = JSON.parse(cd);
        }

        return listado;
    };

    var _borrarLogs = function () {

        console.info("[LIMPIEZA] Eliminando archivos logs");
        Dnv.monitor.borrarArchivosDeDirectorio(Dnv.Cloud._LOGS_PATH);
        listadoLogs = {};
    }
    var _eliminarArchivos = function _eliminarArchivos() {
        console.warn("[LIMPIEZA] Eliminando archivos...");
        // Eliminar recursos descomprimidos
        console.info("[LIMPIEZA] Eliminando archivos descomprimidos");
        Dnv.monitor.borrarContenidosDeDirectorio(Dnv.Cloud._UNZIP_PATH); // Archivos y directorios
        listadoRecursosDescomprimidos = {};
        // Eliminar recursos
        console.info("[LIMPIEZA] Eliminando archivos recursos");
        Dnv.monitor.borrarArchivosDeDirectorio(Dnv.Cloud._RECURSOS_PATH); // Solo archivos
        listadoRecursos = {};
        Dnv.Cloud.downloader.limpiarListaRecursosDisponibles();
        // Eliminar datasources
        // [CAR] FIXME: la descarga de datasources parece que puede seguir activa en este punto
        //              asi que puede que cree archivos después de haberlos borrado aqui
        //              o que de error al intentar mover un temporal que acabamos de borrar
        console.info("[LIMPIEZA] Eliminando archivos datasources");
        Dnv.monitor.borrarArchivosDeDirectorio(Dnv.Cloud._DATASOURCES_PATH);
        listadoDataSources = {};
        Dnv.Cloud.downloader.eliminarCacheDataSources();
        // Eliminar auditoria
        console.info("[LIMPIEZA] Eliminando archivos auditoria");
        Dnv.monitor.borrarArchivosDeDirectorio(Dnv.Cloud._AUDITORIA_PATH);
        listadoAuditoria = {};
        // Eliminar logs
        console.info("[LIMPIEZA] Eliminando archivos logs");
        Dnv.monitor.borrarArchivosDeDirectorio(Dnv.Cloud._LOGS_PATH);
        listadoLogs = {};

        /*
        * Temporalmente no borraremos los logs al reconfigurar, porque no es raro querer ver los
        * logs anteriores para ver que causa la reconfiguracion
        */
        //console.warn("[LIMPIEZA] No eliminamos archivos de logs");

        _guardarTodo();
    };
    var _isInPlaylist = function isInPlaylist(ruta, isDirectorio) {

        var recursosPlaylist = Dnv.Pl.lastPlaylistRecursos;
        if (!Dnv.Pl.lastPlaylistRecursos) {
            console.warn("[LIMPIEZA] No hay datos de recursos de playlist");
            return true; // No podemos comprobar si esta en la playlist, no borramos el recurso
        }
        for (var i = 0; i < recursosPlaylist.length; i++) {
            var r = recursosPlaylist[i];
            if ((!isDirectorio && r.tipo === Dnv.Pl.lastPlaylistRecursosTipos.FICHERO) ||
                                        (isDirectorio && r.tipo === Dnv.Pl.lastPlaylistRecursosTipos.DIRECTORIO)) {

                if (!r.localUrl && ruta.indexOf(r.hashcode) !== -1) {
                    // r.localUrl a veces no esta bien inicializado (por ejemplo si el recurso no está descargado aún)
                    return true;
                } else if (r.localUrl === ruta) {
                    return true;
                }
            }
        }
        return false;
    }

    var comprobarArchivos = function () {
        console.info("[LIMPIEZA] Comprobar caducidad de archivos");

        /*
        * Los limitDateXXX son enteros, no objetos Date
        */

        var limitDateLogs = new Date();
        limitDateLogs.setDate(limitDateLogs.getDate() - Dnv.cfg.getCfgInt("DiasLog", 7));
        limitDateLogs = limitDateLogs.getTime();

        var limitDateAudit = new Date();
        limitDateAudit.setDate(limitDateAudit.getDate() - Dnv.cfg.getCfgInt("DiasAuditoria", 7));
        limitDateAudit = limitDateAudit.getTime();

        var limitDateDataSources = new Date();
        limitDateDataSources.setDate(limitDateDataSources.getDate() - Dnv.cfg.getCfgInt("DiasDataSource", 7));
        limitDateDataSources = limitDateDataSources.getTime();

        var limitDateRecursos = new Date();
        limitDateRecursos.setDate(limitDateRecursos.getDate() - Dnv.cfg.getCfgInt("DiasRecursos", 7));
        limitDateRecursos = limitDateRecursos.getTime();

        //si tenemos poco espacio hemos limitado el máximo de días de log y auditoría a guardar.
        //TODO: pensar si nos interesa extender esto para recursos y datasources.
        if (limitarDiasLog > 0) {
            console.warn("[LIMPIEZA] limitamos los días de log y auditoría a " + limitarDiasLog + " a causa del espacio en disco");

            limitDateLogs = Date.now() - (limitarDiasLog * 24 * 60 * 60 * 1000);
            //limitDateLogs.setDate(limitDateLogs.getDate() - limitarDiasLog).getTime();

            limitDateAudit = limitDateLogs
            //limitDateAudit.setDate(limitDateAudit.getDate() - limitarDiasLog).getTime();
        }

        var key;

        //TODO: Hay que borrar tb el índice de la lista.
        var tieneCambios = false;
        for (key in listadoLogs) {
            if (listadoLogs[key] < limitDateLogs) {
                console.info("[LIMPIEZA] Borramos log " + key);
                Dnv.monitor.deleteFile(Dnv.Cloud._LOGS_PATH + key);
                delete listadoLogs[key];
                tieneCambios = true;
            }
        };

        Dnv.monitor.obtenerFicherosPorFecha(Dnv.Cloud._LOGS_PATH, "log", new Date(0), new Date(limitDateLogs), function exitoListado(ficheros) {
            if (ficheros.length > 0) {
                console.warn("Parece que hay archivos de log antiguos que no deberían estar en disco: " + JSON.stringify(ficheros));
                for (var i = 0; i < ficheros.length; i++) {

                    var f = ficheros[i]
                    console.warn("[LIMPIEZA] Borramos log " + f);
                    Dnv.monitor.deleteFile(Dnv.Cloud._LOGS_PATH + f);
                    if (listadoLogs[f]) {
                        delete listadoLogs[f];
                        tieneCambios = true;
                    }
                }

                if (tieneCambios) { // Lo hacemos aquí tambien porque el listado de directorios puede ser asíncrono
                    _guardarListado("listadoLogs", listadoLogs);
                }
            }
        }, function err(obj) { console.error("Error buscando archivos obsoletos de log: " + JSON.stringify(obj)); });

        if (tieneCambios) {
            _guardarListado("listadoLogs", listadoLogs);
        }

        tieneCambios = false;
        for (key in listadoAuditoria) {
            if (listadoAuditoria[key] < limitDateAudit) {
                console.info("[LIMPIEZA] Borramos auditoria " + key);
                Dnv.monitor.deleteFile(Dnv.Cloud._AUDITORIA_PATH + key);
                delete listadoAuditoria[key];
                tieneCambios = true;
            }
        };

        Dnv.monitor.obtenerFicherosPorFecha(Dnv.Cloud._AUDITORIA_PATH, "xml", new Date(0), new Date(limitDateAudit), function exitoListado(ficheros) {
            if (ficheros.length > 0) {
                console.warn("Parece que hay archivos de auditoria antiguos que no deberían estar en disco: " + JSON.stringify(ficheros));
                for (var i = 0; i < ficheros.length; i++) {

                    var f = ficheros[i]
                    console.warn("[LIMPIEZA] Borramos auditoria " + f);
                    Dnv.monitor.deleteFile(Dnv.Cloud._AUDITORIA_PATH + f);
                    if (listadoAuditoria[f]) {
                        delete listadoAuditoria[f];
                    }
                }

                if (tieneCambios) { // Lo hacemos aquí tambien porque el listado de directorios puede ser asíncrono
                    _guardarListado("listadoAuditoria", listadoAuditoria);
                }
            }
        }, function err(obj) { console.error("Error buscando archivos obsoletos de auditoria: " + JSON.stringify(obj)); });

        if (tieneCambios) {
            _guardarListado("listadoAuditoria", listadoAuditoria);
        }

        Dnv.monitor.obtenerFicherosPorFecha(Dnv.Cloud._BIG_DATA, "db", new Date(0), new Date(limitDateAudit), function exitoListado(ficheros) {
            if (ficheros.length > 0) {
                console.warn("Parece que hay archivos de big data antiguos que no deberían estar en disco: " + JSON.stringify(ficheros));
                for (var i = 0; i < ficheros.length; i++) {

                    var f = ficheros[i]
                    console.warn("[LIMPIEZA] Borramos big data " + f);
                    Dnv.monitor.deleteFile(Dnv.Cloud._BIG_DATA + f);
                }
            }
        }, function err(obj) { console.error("Error buscando archivos obsoletos de big data: " + JSON.stringify(obj)); });

        tieneCambios = false;
        for (key in listadoDataSources) {
            if (listadoDataSources[key] < limitDateDataSources) {
                console.info("[LIMPIEZA] Borramos DataSource " + key);
                Dnv.monitor.deleteFile("/DnvPlayer/recursos/datasources/" + key); // TODO: usar una constante
                delete listadoDataSources[key];
                tieneCambios = true;
            }
        };
        if (tieneCambios) {
            _guardarListado("listadoDataSources", listadoDataSources);
        }

        tieneCambios = false;
        for (key in listadoRecursos) {
            if (listadoRecursos[key] < limitDateRecursos && !_isInPlaylist(key, false)) {
                console.info("[LIMPIEZA] Borramos recurso " + key);
                //Dnv.monitor.deleteFile("/recursos/" + key); // FIXME: revisar que "/recursos/" haya que pasarlo
                Dnv.monitor.deleteFile(key);
                Dnv.Cloud.downloader.onRecursoBorrado(key);
                delete listadoRecursos[key];
                tieneCambios = true;
                // TODO: eliminar de la lista de disonibles del cloud
            }
        };
        if (tieneCambios) {
            _guardarListado("listadoRecursos", listadoRecursos);
        }

        tieneCambios = false;
        for (key in listadoRecursosDescomprimidos) {
            if (listadoRecursosDescomprimidos[key] < limitDateRecursos && !_isInPlaylist(key, true)) {
                console.info("[LIMPIEZA] Borramos recurso descomprimido " + key);
                //Dnv.monitor.deleteFile("/recursos/" + key); // FIXME: revisar que "/recursos/" haya que pasarlo
                Dnv.monitor.deleteFile(key);
                delete listadoRecursosDescomprimidos[key];
                tieneCambios = true;
            }
        };
        if (tieneCambios) {
            _guardarListado("listadoRecursosDescomprimidos", listadoRecursosDescomprimidos);
        }

        if (Main.info.engine === "LG") {
            // En principio solo pasa en LG.
            // A veces se quedan restos de copias temporales del backup de configuracion en LG.
            Dnv.monitor.listarArchivos(Dnv.Cloud._PATH, null, function (lista) {
                for (var i = 0; i < lista.length; i++) {
                    if (lista[i].indexOf("cfg_backup.json.tmp") === 0) {
                        console.info("[LIMPIEZA] Borra " + Dnv.Cloud._PATH + "/" + lista[i]);
                        Dnv.monitor.deleteFile(Dnv.Cloud._PATH + "/" + lista[i]);
                    }
                }
            });
        }

        //RAG
        //incluimos aquí una comprobación del espacio disponible en disco.
        if (Dnv.cfg.getCfgBoolean("LimitarDiasLog", true)) {
            Dnv.limpieza.comprobarEspacioDisponible();
        }
    };

    _init();

    function _onTimerLimpieza() {
        comprobarArchivos();
        Dnv.limpieza.intentarLiberarEspacio(); // Solo hace algo si hay poco espacio en disco... 
    }


    return {

        startTimerLimpieza: function startTimerLimpieza(successCb, errorCb) {

            var segundosTimer = Dnv.cfg.getCfgInt("SegundosTimerLimpieza", 120);
            timerEnabled = true;

            clearInterval(timerLimpieza);

            console.log("[LIMPIEZA]: iniciamos timer (" + segundosTimer + "s)... ");
            timerLimpieza = setInterval(_onTimerLimpieza, segundosTimer * 1000);
        },

        stopTimerLimpieza: function stopTimerLimpieza() {
            console.log("[LIMPIEZA]: detenemos timer.");
            clearInterval(timerLimpieza);
            timerEnabled = false;
        },

        //actualizar lastAccess        
        actualizarListadoLogs: function actualizarListadoLogs(nombre) {
            //console.log("[LIMPIEZA]: actualizarListadoLogs " + nombre + ".");
            if (listadoLogs[nombre] === undefined) {
                listadoLogs[nombre] = new Date().getTime();
                _guardarListado("listadoLogs", listadoLogs);
            } else {
                listadoLogs[nombre] = new Date().getTime();
            }
        },

        actualizarListadoAuditoria: function actualizarListadoAuditoria(nombre) {
            console.log("[LIMPIEZA]: actualizarListadoAuditoria " + nombre + ".");
            if (listadoAuditoria == true) {
                listadoAuditoria = {};
                listadoAuditoria[nombre] = new Date().getTime();
                _guardarListado("listadoAuditoria", listadoAuditoria);
            } else if (listadoAuditoria[nombre] === undefined) {
                listadoAuditoria[nombre] = new Date().getTime();
                _guardarListado("listadoAuditoria", listadoAuditoria);
            } else {
                listadoAuditoria[nombre] = new Date().getTime();
            }
        },

        //TODO RAG: 
        actualizarListadoDataSources: function actualizarListadoDataSources(nombre) {
            /*
            * [CAR] Cosas a tener en cuenta:
            * - Cuando implementemos el filtrado, por cada datasource podrá haber varios archivos, según los distintos filtrados
            * - Dnv.Cloud mantiene internamente en memoria un objeto con los datasources ¿limpiarlo tambien?
            * - ¿guardar solo el nombre de archivo? (aplicable tambien a los recursos) puesto que cada plataforma guarda en un sitio,
            *   y la ruta local de acceso creo que cambiaba segun sea un flash o el html normal
            */

            console.log("[LIMPIEZA]: actualizarListadoDataSources " + nombre + ".");
            if (listadoDataSources[nombre] === undefined) {
                listadoDataSources[nombre] = new Date().getTime();
                _guardarListado("listadoDataSources", listadoDataSources);
            } else {
                listadoDataSources[nombre] = new Date().getTime();
            }
        },

        actualizarListadoRecursos: function actualizarListadoRecursos(nombre) {
            console.log("[LIMPIEZA]: actualizarListadoRecursos " + nombre + ".");
            //console.log("[LIMPIEZA]: listado recursos " + JSON.stringify(listadoRecursos) + ".");
            if (listadoRecursos[nombre] === undefined) {
                listadoRecursos[nombre] = new Date().getTime();
                _guardarListado("listadoRecursos", listadoRecursos);
            } else {
                listadoRecursos[nombre] = new Date().getTime();
            }
        },

        actualizarListadoRecursosDescomprimidos: function actualizarListadoRecursosDescomprimidos(nombre) {
            console.log("[LIMPIEZA]: actualizarListadoRecursosDescomprimidos " + nombre + ".");
            if (listadoRecursosDescomprimidos[nombre] === undefined) {
                listadoRecursosDescomprimidos[nombre] = new Date().getTime();
                _guardarListado("listadoRecursosDescomprimidos", listadoRecursosDescomprimidos);
            } else {
                listadoRecursosDescomprimidos[nombre] = new Date().getTime();
            }
        },

        actualizarListadoRecursosFromSlide: function (slide) {
            /*
            * recurso.getFilename no da el nombre de archivo en disco
            * estoy usando el hashcode como nombre de archivo por si hubiera problemas por usar caracteres especiales
            * 
            *
            * FIXME: Además, hay recursos que no vienen en slides, como los de los estados, que habrá que implementar en el futuro
            *        
            *       
            * Quedaria menos acoplado si el servicio de limpieza preguntase directamente al cloud lo que ha descargado y lo que esta activo...
            * Y si fuese el presentador el que nos señalase que esta mostrando en vez de reinterpretar nosotros los slides
            */

            var capas = slide.getPlantilla().getCapas();
            for (var i = 0; i < capas.length; i++) {
                var tipoCapa = capas[i].getTipoCapa();

                switch (tipoCapa) {
                    case Dnv.Pl.Capa.tipos.TIPO_FONDO:
                    case Dnv.Pl.Capa.tipos.TIPO_TEXTO:
                    case Dnv.Pl.Capa.tipos.TIPO_TV:
                    case Dnv.Pl.Capa.tipos.TIPO_STREAMING:
                    case Dnv.Pl.Capa.tipos.TIPO_URL:
                    case Dnv.Pl.Capa.tipos.TIPO_FUENTE_VIDEO:
                        //no tienen recursos en disco.
                        break;
                    case Dnv.Pl.Capa.tipos.TIPO_SECUENCIA:
                        var secuenciasRecursos = capas[i].getRecurso().getSecuenciasRecursos();
                        for (var j = 0; j < secuenciasRecursos.length; j++) {
                            //Dnv.limpieza.actualizarListadoRecursos(secuenciasRecursos[j].getRecurso().getFilename());
                            Dnv.limpieza.actualizarListadoRecursos(secuenciasRecursos[j].getRecurso().getLocalUrl());
                            if (secuenciasRecursos[j].getRecurso().getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) {
                                Dnv.limpieza.actualizarListadoRecursosDescomprimidos(secuenciasRecursos[j].getRecurso().getUrlDescompresion());
                            }
                        }
                        break;

                    default: //TIPO_IMAGEN, TIPO_VIDEO, TIPO_ANIMACION, TIPO_SONIDO, TIPO_SMARTOBJECT, TIPO_TEXTO_FLASH, TIPO_TEXTO_VARIABLE
                        /*
                        * Las capas HTML5 tienen un recurso WGT
                        * Los smartobjects tienen un recurso normal, un recurso html5 o ambos
                        */
                        if (capas[i].getRecurso()) { // Los SMO que solo tienen recurso HTML5 no tienen este
                            if (capas[i].getRecurso().getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) {
                                Dnv.limpieza.actualizarListadoRecursosDescomprimidos(capas[i].getRecurso().getUrlDescompresion());
                            }
                            Dnv.limpieza.actualizarListadoRecursos(capas[i].getRecurso().getLocalUrl());
                        }

                        if (capas[i].getRecursoHtml5()) {
                            Dnv.limpieza.actualizarListadoRecursos(capas[i].getRecursoHtml5().getLocalUrl());
                            Dnv.limpieza.actualizarListadoRecursosDescomprimidos(capas[i].getRecursoHtml5().getUrlDescompresion());
                        }
                        //Dnv.limpieza.actualizarListadoRecursos(capas[i].getRecurso().getFilename());
                        //Dnv.limpieza.actualizarListadoRecursos(capas[i].getRecurso().getLocalUrl());
                }
            }

            //Maestras
            //var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByCodigo(slide.getPlantilla().getMaestra());
            var plantillaMaestra = Dnv.Pl.lastPlaylist.getPlantillaByVinculo(slide.getPlantilla().getMaestra());

            if (plantillaMaestra != undefined) {
                var capas = plantillaMaestra.getCapas();
                for (var i = 0; i < capas.length; i++) {
                    if (capas[i].getTipoCapa() == Dnv.Pl.Capa.tipos.TIPO_SECUENCIA) {
                        var secuenciasRecursos = capas[i].getRecurso().getSecuenciasRecursos();
                        for (var j = 0; j < secuenciasRecursos.length; j++) {
                            //Dnv.limpieza.actualizarListadoRecursos(secuenciasRecursos[j].getRecurso().getFilename);
                            Dnv.limpieza.actualizarListadoRecursos(secuenciasRecursos[j].getRecurso().getLocalUrl());
                            if (secuenciasRecursos[j].getRecurso().getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) {
                                Dnv.limpieza.actualizarListadoRecursosDescomprimidos(secuenciasRecursos[j].getRecurso().getUrlDescompresion());
                            }
                        }
                    } else {
                        //Dnv.limpieza.actualizarListadoRecursos(capas[i].getRecurso().getFilename());
                        if (capas[i].getRecurso()) { // Los SMO que solo tienen recurso HTML5 no tienen este
                            if (capas[i].getRecurso().getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) {
                                Dnv.limpieza.actualizarListadoRecursosDescomprimidos(capas[i].getRecurso().getUrlDescompresion());
                            }
                            Dnv.limpieza.actualizarListadoRecursos(capas[i].getRecurso().getLocalUrl());
                        }

                        if (capas[i].getRecursoHtml5()) {
                            Dnv.limpieza.actualizarListadoRecursos(capas[i].getRecursoHtml5().getLocalUrl());
                            Dnv.limpieza.actualizarListadoRecursosDescomprimidos(capas[i].getRecursoHtml5().getUrlDescompresion());
                        }
                    }
                }
            }
        },

        comprobarEspacioDisponible: function comprobarEspacioDisponible() {
            var espacioTotal = Dnv.monitor.getEspacioTotal(); //KB
            var espacioDisponible = Dnv.monitor.getEspacioDisponible(); //KB

            if (espacioDisponible == -1) {
                console.warn("[LIMPIEZA] No se puede obtener el espacio disponible en disco.");
                return;
            }

            espacioDisponible = espacioDisponible * 1024; //a MB
            espacioTotal = espacioTotal * 1024;

            //TODO RAG: poner unos valores pensados..
            //cambiar alarma por frase parseada en infoEvents.
            if (espacioDisponible < 100) {
                limitarDiasLog = 2;
                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Espacio libre en disco inferior a 100 MB (espacio total = " + espacioTotal + " MB)");
            } else if (espacioDisponible < 200) {
                limitarDiasLog = 3;
                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Espacio libre en disco inferior a 200 MB (espacio total = " + espacioTotal + " MB)");
            } else if (espacioDisponible < 400) {
                limitarDiasLog = 5;
                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Espacio libre en disco inferior a 400 MB (espacio total = " + espacioTotal + " MB)");
            } else if (espacioDisponible < 500) {
                limitarDiasLog = 7;
                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Espacio libre en disco inferior a 500 MB (espacio total = " + espacioTotal + " MB)");
            } else {
                limitarDiasLog = 0;
            }
        },
        eliminarArchivos: function eliminarArchivos() { _eliminarArchivos(); },
        eliminarListados: function eliminarListados() {
            _borrarTodo();
        },
        borrarLogs: _borrarLogs,
        intentarLiberarEspacio: function intentarLiberarEspacio(callback) {

            Dnv.systemInfo.isConPocoEspacioEnDisco(function handlePocoEspacio1(isConPocoEspacio, mbsLibres, porcentLibre) {
                if (!isConPocoEspacio) {
                    if (callback) callback(true);
                    return; // Solucionado
                }

                // Para el infoEvens, la alarma debe incluir "Detectado Porcentaje Espacio Libre"
                console.warn("[LIMPIEZA]: Poco espacio en disco, intentamos liberar espacio (" + porcentLibre + "% (" + mbsLibres + " MB)");
                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Detectado Porcentaje Espacio Libre del " + Dnv.utiles.floatToInt(porcentLibre) + "% (" + mbsLibres + " MB). Se intentará liberar espacio.");

                // Borrar archivos caducados. Dependiendo de la plataforma, será inmediato o no
                limitarDiasLog = 5;
                comprobarArchivos();

                Dnv.systemInfo.isConPocoEspacioEnDisco(function handlePocoEspacio2(isConPocoEspacio, mbsLibres, porcentLibre) {
                    if (!isConPocoEspacio) {
                        Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.OK, "Se liberó espacio: " + Dnv.utiles.floatToInt(porcentLibre) + "% libre (" + mbsLibres + " MB).");
                        console.log("[LIMPIEZA]: Se liberó espacio: " + porcentLibre + "% libre (" + mbsLibres + " MB).");
                        if (callback) callback(true);
                        return; // Solucionado
                    }

                    console.warn("[LIMPIEZA]: Poco espacio en disco, intentamos liberar espacio (" + porcentLibre + "% (" + mbsLibres + " MB). Borraremos recursos no presentes en la playlist.");

                    var recursosPlaylist = Dnv.Pl.lastPlaylistRecursos;
                    if (recursosPlaylist !== undefined) {


                        // Borrar archivos que no están en la playlist

                        var tieneCambios = false;
                        var key;
                        for (key in listadoRecursos) {
                            if (!_isInPlaylist(key, false)) {
                                console.info("[LIMPIEZA] Borramos recurso " + key);
                                //Dnv.monitor.deleteFile("/recursos/" + key); // FIXME: revisar que "/recursos/" haya que pasarlo
                                Dnv.monitor.deleteFile(key);
                                Dnv.Cloud.downloader.onRecursoBorrado(key);
                                delete listadoRecursos[key];
                                tieneCambios = true;
                                // TODO: eliminar de la lista de disonibles del cloud
                            }
                        }
                        if (tieneCambios) {
                            _guardarListado("listadoRecursos", listadoRecursos);
                        }

                        tieneCambios = false;
                        for (key in listadoRecursosDescomprimidos) {
                            if (!_isInPlaylist(key, true)) {
                                console.info("[LIMPIEZA] Borramos recurso descomprimido " + key);
                                //Dnv.monitor.deleteFile("/recursos/" + key); // FIXME: revisar que "/recursos/" haya que pasarlo
                                Dnv.monitor.deleteFile(key);
                                delete listadoRecursosDescomprimidos[key];
                                tieneCambios = true;
                            }
                        }
                        if (tieneCambios) {
                            _guardarListado("listadoRecursosDescomprimidos", listadoRecursosDescomprimidos);
                        }

                    }

                    Dnv.systemInfo.isConPocoEspacioEnDisco(function handlePocoEspacio3(isConPocoEspacio, mbsLibres, porcentLibre) {
                        if (!isConPocoEspacio) {
                            console.info("[LIMPIEZA]: Se liberó espacio: " + porcentLibre + "% libre (" + mbsLibres + " MB).");
                            Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.OK, "Se liberó espacio: " + Dnv.utiles.floatToInt(porcentLibre) + "% libre (" + mbsLibres + " MB).");
                            if (callback) callback(true);
                            return; // Solucionado
                        }

                        console.warn("[LIMPIEZA]: Poco espacio en disco, intentamos liberar espacio (" + porcentLibre + "% (" + mbsLibres + " MB). Borraremos logs de hace varios días.");

                        limitarDiasLog = 2;
                        comprobarArchivos();

                        Dnv.systemInfo.isConPocoEspacioEnDisco(function handlePocoEspacio4(isConPocoEspacio, mbsLibres, porcentLibre) {
                            if (!isConPocoEspacio) {
                                console.info("[LIMPIEZA]: Se liberó espacio: " + porcentLibre + "% libre (" + mbsLibres + " MB).");
                                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.OK, "Se liberó espacio: " + Dnv.utiles.floatToInt(porcentLibre) + "% libre (" + mbsLibres + " MB).");
                                if (callback) callback(true);
                                return; // Solucionado
                            } else {
                                console.warn("[LIMPIEZA]: Poco espacio en disco, intentamos liberar espacio (" + porcentLibre + "% (" + mbsLibres + " MB). No podemos liberar más.");
                                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "Detectado Porcentaje Espacio Libre del " + Dnv.utiles.floatToInt(porcentLibre) + "% (" + mbsLibres + " MB). No se puede liberar más espacio.");
                                if (callback) callback(false);

                            }
                        });

                    });

                });


            });

            /*
            comprobarArchivos();

            if (!Dnv.systemInfo.isConPocoEspacioEnDisco()) return;

            var recursosPlaylist = Dnv.lastPlaylistRecursos;
            if (recursosPlaylist !== undefined) {

            listadoRecursos = _getListado("listadoRecursos");
            listadoRecursosDescomprimidos = _getListado("listadoRecursosDescomprimidos");
            }*/
        }

    };

})();