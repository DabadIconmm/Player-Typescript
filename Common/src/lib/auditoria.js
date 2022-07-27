
"use strict";

var Dnv = Dnv || {};

Dnv.auditoria = (function () {
    // Para optimizar, no escribimos a disco auditoria si no está activada.
    //var auditoriaActivada = Dnv.cfg.getCfgBoolean("AuditoriaZipServiceEnabled", false); Cuando esto se evalua, la cfg aun no se ha inicializado...

    var listaPlantillas = [];
    var listaSecuencias = [];

    var listaMaestro = [];
    var listaSecuenciasMaestro = [];

    var listaAudienciaDelayed = [];
    var escribirADisco = "";

    var estadoPantalla = "1";

    //<Auditoria Campanya="0" Insercion="0" Plantilla="889877" Capa="1451127" ObjectID="4848" Recurso="646039" Tipo_Content="11" Secuencia="31343" Hueco="0" Orden="0" Inicio="18/05/2015 13:55:06" DuracionReal="6" DuracionProgramada="5" ObjIDPantalla="4849" EstadoPantalla="-1" P="0" H="0" M="0" FH="13" P_M="0" H_M="0" M_M="0" TAP="0" TAH="0" TAM="0" TP="0" TM="0" TH="0" H10="0" H20="0" H30="0" H40="0" H50="0" H60="0" H70="0" M10="0" M20="0" M30="0" M40="0" M50="0" M60="0" M70="0" N="0" A="0" S="0" U="0" N_M="0" A_M="0" S_M="0" U_M="0" CM="-1"/>

    var lastAuditado = false;
    var finSlide;

    function consolidarAudiencia() {

        if (listaAudienciaDelayed.length != 0) {
            var audiencia = listaAudienciaDelayed.shift();

            if (Dnv.cfg.getCfgBoolean("MedicionAudienciaHabilitado", false) && Dnv.audiencia.modo != -1) {
                Dnv.audiencia.generateReport(audiencia.getInicio(), new Date(audiencia.getInicio().getTime() + audiencia.getDuracionReal() * 1000),
                    function (report) {
                        audiencia.setAudiencia(report);
                        //console.log("[AUDITORIA] Establecidos datos de audiencia de '" + audiencia.getDescripcion() + "'");
                        escribirADisco = escribirADisco.concat((serializeAuditData(audiencia)));
                        consolidarAudiencia();
                    });
            } else {
                escribirADisco = escribirADisco.concat((serializeAuditData(audiencia)));
                consolidarAudiencia();
            }
        } else {
            //console.log("[AUDITORIA] Escrita a disco: " + escribirADisco);
            console.log("[AUDITORIA] Escrita a disco");
            Dnv.monitor.writeAuditFile(escribirADisco);
            escribirADisco = "";
        }

    }
    var timerAudienciaDelayed = setInterval(function () {
        if (Dnv.cfg.getCfgInt("Salida_Auditoria", 0) == 1) {
            console.log("[AUDITORIA] Inicio de consolidación");
            consolidarAudiencia();
        }
    }, 300000); //300000);

    var auditData = function (Campanya, Insercion, Plantilla, Capa, ObjectID,
        Recurso, Tipo_Content, Secuencia, Hueco, Orden, Inicio, DuracionReal,
        DuracionProgramada, ObjIDSalida, ObjIDPantalla, EstadoPantalla, FH, CM, descripcion,
        P, H, M, PM, HM, MM, TAP, TAH, TAM, TP, TM, TH,
        H10, H20, H30, H40, H50, H60, H70,
        M10, M20, M30, M40, M50, M60, M70,
        N, A, S, U, NM, AM, SM, UM) {

        return {
            getCampanya: function () { return Campanya; },
            getInsercion: function () { return Insercion; },
            getPlantilla: function () { return Plantilla; },
            getCapa: function () { return Capa; },
            getObjectID: function () { return ObjectID; },
            getRecurso: function () { return Recurso; },
            getTipo_Content: function () { return Tipo_Content; },

            getSecuencia: function () { return Secuencia; },
            getHueco: function () { return Hueco; },
            getOrden: function () { return Orden; },
            getInicio: function () { return Inicio; },
            getDuracionReal: function () { return DuracionReal; },
            getDuracionProgramada: function () { return DuracionProgramada; },
            getObjIDSalida: function () { return ObjIDSalida; },
            getObjIDPantalla: function () { return ObjIDPantalla; },
            getEstadoPantalla: function () { return EstadoPantalla; },
            getFH: function () { return FH; },
            getCM: function () { return CM; },

            getP: function () { return P; },
            getH: function () { return H; },
            getM: function () { return M; },
            getPM: function () { return PM; },
            getHM: function () { return HM; },
            getMM: function () { return MM; },
            getTAP: function () { return TAP; },
            getTAH: function () { return TAH; },
            getTAM: function () { return TAM; },
            getTP: function () { return TP; },
            getTM: function () { return TM; },
            getTH: function () { return TH; },
            getH10: function () { return H10 },
            getH20: function () { return H20 },
            getH30: function () { return H30 },
            getH40: function () { return H40 },
            getH50: function () { return H50 },
            getH60: function () { return H60 },
            getH70: function () { return H70 },
            getM10: function () { return M10 },
            getM20: function () { return M20 },
            getM30: function () { return M30 },
            getM40: function () { return M40 },
            getM50: function () { return M50 },
            getM60: function () { return M60 },
            getM70: function () { return M70 },
            getN: function () { return N },
            getA: function () { return A },
            getS: function () { return S },
            getU: function () { return U },
            getNM: function () { return NM },
            getAM: function () { return AM },
            getSM: function () { return SM },
            getUM: function () { return UM },

            setCampanya: function (value) { Campanya = value; },
            setInsercion: function (value) { Insercion = value; },
            setPlantilla: function (value) { Plantilla = value; },
            setCapa: function (value) { Capa = value; },
            setObjectID: function (value) { ObjectID = value; },
            setRecurso: function (value) { Recurso = value; },
            setTipo_Content: function (value) { Tipo_Content = value; },
            setSecuencia: function (value) { Secuencia = value; },
            setHueco: function (value) { Hueco = value; },
            setOrden: function (value) { Orden = value; },
            setInicio: function (value) { Inicio = value; },
            setDuracionReal: function (value) { DuracionReal = value; },
            setDuracionProgramada: function (value) { DuracionProgramada = value; },
            setObjIDSalida: function (value) { ObjIDSalida = value; },
            setObjIDPantalla: function (value) { ObjIDPantalla = value; },
            setEstadoPantalla: function (value) { EstadoPantalla = value; },
            setFH: function (value) { FH = value; },
            setCM: function (value) { CM = value; },

            setP: function (value) { P = value; },
            setH: function (value) { H = value; },
            setM: function (value) { M = value; },
            setPM: function (value) { PM = value; },
            setHM: function (value) { HM = value; },
            setMM: function (value) { MM = value; },
            setTAP: function (value) { TAP = value; },
            setTAH: function (value) { TAH = value; },
            setTAM: function (value) { TAM = value; },
            setTP: function (value) { TP = value; },
            setTM: function (value) { TM = value; },
            setTH: function (value) { TH = value; },
            setH10: function (value) { H10 = value; },
            setH20: function (value) { H20 = value; },
            setH30: function (value) { H30 = value; },
            setH40: function (value) { H40 = value; },
            setH50: function (value) { H50 = value; },
            setH60: function (value) { H60 = value; },
            setH70: function (value) { H70 = value; },
            setM10: function (value) { M10 = value; },
            setM20: function (value) { M20 = value; },
            setM30: function (value) { M30 = value; },
            setM40: function (value) { M40 = value; },
            setM50: function (value) { M50 = value; },
            setM60: function (value) { M60 = value; },
            setM70: function (value) { M70 = value; },
            setN: function (value) { N = value; },
            setA: function (value) { A = value; },
            setS: function (value) { S = value; },
            setU: function (value) { U = value; },
            setNM: function (value) { NM = value; },
            setAM: function (value) { AM = value; },
            setSM: function (value) { SM = value; },
            setUM: function (value) { UM = value; },

            getDescripcion: function () { return descripcion; },

            setAudiencia: function (report) {
                if (report) {
                    P = report.getP();  // Total personas presentes
                    H = report.getH();  // Total hombres presentes
                    M = report.getM(); // Total mujeres presentes
                    FH = report.getFH(); // Franja horaria
                    PM = report.getPM();  // Personas que han mirado
                    HM = report.getHM();  // Total hombres que han mirado
                    MM = report.getMM();  // Total mujeres que han mirado
                    TAP = report.getTAP(); // Tiempo atencion personas
                    TAH = report.getTAH();  // Tiempo de atención de hombres
                    TAM = report.getTAM();  // Tiempo de atención de mujeres
                    TP = report.getTP(); // Tiempo personas (presencia)
                    TH = report.getTH(); //Tiempo hombres (presencia)
                    TM = report.getTM(); //Tiempo mujeres (presenncia)
                    H10 = report.getH10(); //Hombres hasta 10 años
                    M10 = report.getM10(); //Mujeres hasta 10 años
                    H20 = report.getH20();
                    M20 = report.getM20();
                    H30 = report.getH30();
                    M30 = report.getM30();
                    H40 = report.getH40();
                    M40 = report.getM40();
                    H50 = report.getH50();
                    M50 = report.getM50();
                    H60 = report.getH60();
                    M60 = report.getM60();
                    H70 = report.getH70();
                    M70 = report.getM70();
                }
            }

        }
    }

    var serializeAuditData = function serializeAuditData(data) {
        var strAudit = '<Auditoria Campanya="' + data.getCampanya() + '"' +
                ' Insercion="' + data.getInsercion() + '"' +
                ' Plantilla="' + data.getPlantilla() + '"' +
                ' Capa="' + data.getCapa() + '"' +
                ' ObjectID="' + data.getObjIDSalida() + '"' +
                ' Recurso="' + data.getRecurso() + '"' +
                ' Tipo_Content="' + data.getTipo_Content() + '"' +
                ' Secuencia="' + data.getSecuencia() + '"' +
                ' Hueco="' + data.getHueco() + '"' +
                ' Orden="' + data.getOrden() + '"' +
                ' Inicio="' + Dnv.utiles.formatearFecha(data.getInicio(), true).split('-').join('/') + '"' +
                ' DuracionReal="' + Math.round(data.getDuracionReal()) + '"' +
                ' DuracionProgramada="' + data.getDuracionProgramada() + '"' +
                ' ObjIDPantalla="' + data.getObjIDPantalla() + '"' +
                ' EstadoPantalla="' + data.getEstadoPantalla() + '"' +
                ' P="' + data.getP() + '"' +
                ' H="' + data.getH() + '"' +
                ' M="' + data.getM() + '"' +
                ' FH="' + data.getFH() + '"' +
                ' P_M="' + data.getPM() + '"' +
                ' H_M="' + data.getHM() + '"' +
                ' M_M="' + data.getMM() + '"' +
                ' TAP="' + data.getTAP() + '"' +
                ' TAH="' + data.getTAH() + '"' +
                ' TAM="' + data.getTAM() + '"' +
                ' TP="' + data.getTP() + '"' +
                ' TM="' + data.getTM() + '"' +
                ' TH="' + data.getTH() + '"' +
                ' H10="' + data.getH10() + '"' +
                ' H20="' + data.getH20() + '"' +
                ' H30="' + data.getH30() + '"' +
                ' H40="' + data.getH40() + '"' +
                ' H50="' + data.getH50() + '"' +
                ' H60="' + data.getH60() + '"' +
                ' H70="' + data.getH70() + '"' +
                ' M10="' + data.getM10() + '"' +
                ' M20="' + data.getM20() + '"' +
                ' M30="' + data.getM30() + '"' +
                ' M40="' + data.getM40() + '"' +
                ' M50="' + data.getM50() + '"' +
                ' M60="' + data.getM60() + '"' +
                ' M70="' + data.getM70() + '"' +
                ' N="' + data.getN() + '"' +
                ' A="' + data.getA() + '"' +
                ' S="' + data.getS() + '"' +
                ' U="' + data.getU() + '"' +
                ' N_M="' + data.getNM() + '"' +
                ' A_M="' + data.getAM() + '"' +
                ' S_M="' + data.getSM() + '"' +
                ' U_M="' + data.getUM() + '"' +
                ' CM="' + data.getCM() +
                '"/>' + "\n";

        return strAudit;
    }

    return {

        auditarPlantilla: function auditarPlantilla(plantilla) {
            if (!Dnv.cfg.getCfgBoolean("AuditoriaZipServiceEnabled", false)) return;

            //var escribirADisco = "";

            //cerramos auditoría de plantilla y recursos anteriores, si los hay.
            //RAG debug Dnv.monitor.writeAuditFile("auditamos plantilla:" + plantilla.getDenominacion() + ", codigo: " + plantilla.getCodigo());

            var fin = this.getFinSlide();

            for (var i = 0; i < listaPlantillas.length; i++) {

                var duracionReal = Dnv.utiles.secondsDiff(fin, listaPlantillas[i].getInicio());
                listaPlantillas[i].setDuracionReal(duracionReal);
                if (duracionReal < 1) continue; // Nos saltamos la auditoria de plantillas que duraron menos de 1 segundo

                listaAudienciaDelayed.push(listaPlantillas[i]);
                //if (Dnv.cfg.getCfgBoolean("MedicionAudiencia_BigData", true) && listaPlantillas.length-1 == i) Dnv.bigdata.sendAuditoria(listaPlantillas[i].getInicio(), fin, plantilla.getCodigo());
                //escribirADisco = escribirADisco.concat((serializeAuditData(listaPlantillas[i])));
            }

            var listaAdelantadas = [];
            for (var i = 0; i < listaSecuencias.length; i++) {
                if (listaSecuencias[i].getPlantilla() == plantilla.getCodigo()) { //salta antes la auditoria de algunas secuencias que la propia plantilla.
                    //RAG debug  Dnv.monitor.writeAuditFile("Añadimos " + listaSecuencias[i].getDescripcion() + " a adelantadas");
                    listaAdelantadas.push(listaSecuencias[i]);                    //no debemos cerrarlas, sino meterlas en el listado de la siguiente.                    
                } else {
                    if (i == listaSecuencias.length - 1) {
                        //cerramos la duración del recurso anterior.                        
                        var duracionReal = Dnv.utiles.secondsDiff(fin, listaSecuencias[i].getInicio());
                        listaSecuencias[i].setDuracionReal(duracionReal);
                        /* 
                        * Si la plantilla no tiene reloj maestro, la secuencia vuelve a empezar,
                        * pero si en ese momento salta el timer de avance de slide, acabamos teniendo
                        * reproducciones de 0 segundos de un elemento del slide. El servidor mostrara
                        * el pase aunque haya durado unos milisegundos, y encima al usar la duración
                        * programada en lugar de la real, descuadra los tiempos.
                        */
                        if (duracionReal < 1) continue;
                    }
                    listaAudienciaDelayed.push(listaSecuencias[i]);
                    //escribirADisco = escribirADisco.concat(serializeAuditData(listaSecuencias[i]));
                }
            }

            //limpiar listas
            listaPlantillas = [];
            listaSecuencias = [];

            //creamos auditoría para la nueva plantilla
            // FIXME: La duración programada deberia ser la del slide, no la de la plantilla
            var data = new auditData(0, 0, plantilla.getCodigo(), 0, Dnv.cfg.getCfgInt("MyOwnCode", 0),
                    0, 0, 0, 0, 0, new Date(), 0, plantilla.getDuracion(),
                    Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo(),
                    Dnv.Pl.lastPlaylist.getPlayer().getSalida().getPantalla().getCodigo(),
                    estadoPantalla, new Date().getHours(), Dnv.audiencia.modo, "Plantilla " + plantilla.getDenominacion(),
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0);


            listaPlantillas.push(data);

            for (var i = 0; i < listaAdelantadas.length; i++) {
                //RAG debug  Dnv.monitor.writeAuditFile("Añadimos adelantada (" + listaAdelantadas[i].getDescripcion() + ") a listaSecuencias.");
                listaSecuencias.push(listaAdelantadas[i]);
            }
            listaAdelantadas = [];

            //Dnv.monitor.writeAuditFile(escribirADisco);
        },

        auditarRecurso: function auditarRecurso(plantilla, codCapa, tipo_capa, recurso) {
            if (!Dnv.cfg.getCfgBoolean("AuditoriaZipServiceEnabled", false)) return;

            //RAG debug  Dnv.monitor.writeAuditFile("añadimos auditoria de recurso:" + recurso.getFilename());
            // FIXME: La duración programada deberia ser la del slide, ¿o la de la secuencia?, no la de la plantilla
            var data = new auditData(0, 0, plantilla.getCodigo(), codCapa, Dnv.cfg.getCfgInt("MyOwnCode", 0),
                 recurso.getCodigo(), tipo_capa, 0, 0, 0, new Date(), 0, plantilla.getDuracion(),
                 Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo(),
                 Dnv.Pl.lastPlaylist.getPlayer().getSalida().getPantalla().getCodigo(),
                 estadoPantalla, new Date().getHours(), Dnv.audiencia.modo, recurso.getFilename(),
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0);

            listaPlantillas.push(data);
        },

        auditarSecuencia: function auditarSecuencia(secuencia, plantilla, capa, recurso, duracionProgramada) {
            if (!Dnv.cfg.getCfgBoolean("AuditoriaZipServiceEnabled", false)) return;

            //cerramos la duración del recurso anterior.
            //RAG debug  Dnv.monitor.writeAuditFile("auditamos secuencia:" + recurso.getFilename() + ", plantilla: " + plantilla.getDenominacion() + ", recurso: " + recurso.getCodigo());
            var indice = listaSecuencias.length;
            if (indice >= 1) {
                //RAG debug  Dnv.monitor.writeAuditFile("calculamos duracion de secuencia: " + listaSecuencias[indice - 1].getDescripcion());
                listaSecuencias[indice - 1].setDuracionReal(Dnv.utiles.secondsDiff(new Date(), listaSecuencias[indice - 1].getInicio()));
            }

            var data = new auditData(0, 0, plantilla.getCodigo(), capa.getCodigo(), Dnv.cfg.getCfgInt("MyOwnCode", 0),
                 recurso.getCodigo(), capa.getTipoCapa(), secuencia.getCodigo(), 0, 0, new Date(), 0, duracionProgramada,
                 Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo(),
                 Dnv.Pl.lastPlaylist.getPlayer().getSalida().getPantalla().getCodigo(),
                 estadoPantalla, new Date().getHours(), Dnv.audiencia.modo, recurso.getFilename(),
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0);

            listaSecuencias.push(data);
        },


        auditarPlantillaMaestra: function auditarPlantillaMaestra(plantillaMaestra, plantilla) {
            if (!Dnv.cfg.getCfgBoolean("AuditoriaZipServiceEnabled", false)) return;

            //var escribirADisco = "";

            //los contenidos de la maestra se añaden con código de plantilla contenida.
            //se añaden a todas las plantillas aunque la maestra no cambie..

            //cerramos auditoría anterior
            //DEBUG Dnv.monitor.writeAuditFile("Cerramos auditoría maestra anterior.");
            var fin = new Date();

            for (var i = 0; i < listaMaestro.length; i++) {
                var duracionReal = Dnv.utiles.secondsDiff(fin, listaMaestro[i].getInicio());
                listaMaestro[i].setDuracionReal(duracionReal);
                if (duracionReal < 1) continue; // Ver comentario en auditarPlantilla
                try {
                    //RAG debug  Dnv.monitor.writeAuditFile("Descripcion recurso:" + listaMaestro[i].getDescripcion());
                } catch (e) { }
                //Dnv.monitor.writeAuditFile((serializeAuditData(listaMaestro[i])));
                //escribirADisco = escribirADisco.concat((serializeAuditData(listaMaestro[i])));
                listaAudienciaDelayed.push(listaMaestro[i]);
            }

            for (var i = 0; i < listaSecuenciasMaestro.length; i++) {
                if (i == listaSecuenciasMaestro.length - 1) {
                    //cerramos la duración del recurso anterior.
                    var duracionReal = Dnv.utiles.secondsDiff(fin, listaSecuenciasMaestro[i].getInicio());
                    listaSecuenciasMaestro[i].setDuracionReal(duracionReal);
                    if (duracionReal < 1) continue; // Ver comentario en auditarPlantilla
                }
                //Dnv.monitor.writeAuditFile(serializeAuditData(listaSecuenciasMaestro[i]));
                //escribirADisco = escribirADisco.concat(serializeAuditData(listaSecuenciasMaestro[i]));
                listaAudienciaDelayed.push(listaSecuenciasMaestro[i]);
            }

            //limpiar listas
            listaMaestro = [];
            listaSecuenciasMaestro = [];

            if (plantillaMaestra != undefined && plantillaMaestra.getAuditar() > 0) {
                //nueva maestra
                //RAG debug  Dnv.monitor.writeAuditFile("");
                //DEBUG Dnv.monitor.writeAuditFile("Nueva plantilla Maestra: " + plantillaMaestra.getDenominacion());
                //creamos auditoría para la nueva plantilla maestra
                var data = new auditData(0, 0, plantilla.getCodigo(), 0, Dnv.cfg.getCfgInt("MyOwnCode", 0),
                    0, 0, 0, 0, 0, new Date(), 0, plantillaMaestra.getDuracion(),
                    Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo(),
                    Dnv.Pl.lastPlaylist.getPlayer().getSalida().getPantalla().getCodigo(),
                    estadoPantalla, new Date().getHours(), Dnv.audiencia.modo, "Plantilla " + plantillaMaestra.getDenominacion(),
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0);

                listaPlantillas.push(data);
            }
            //Dnv.monitor.writeAuditFile(escribirADisco);
        },

        auditarRecursoMaestra: function auditarRecursoMaestra(plantilla, codCapa, tipo_capa, recurso) {
            if (!Dnv.cfg.getCfgBoolean("AuditoriaZipServiceEnabled", false)) return;

            // FIXME: ¿cual seria la duracion programada de una maestra?
            var data = new auditData(0, 0, plantilla.getCodigo(), codCapa, Dnv.cfg.getCfgInt("MyOwnCode", 0),
                recurso.getCodigo(), tipo_capa, 0, 0, 0, new Date(), 0, plantilla.getDuracion(),
                Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo(),
                Dnv.Pl.lastPlaylist.getPlayer().getSalida().getPantalla().getCodigo(),
                estadoPantalla, new Date().getHours(), Dnv.audiencia.modo, recurso.getFilename(),
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0);

            listaMaestro.push(data);
        },

        auditarSecuenciaMaestra: function auditarSecuenciaMaestra(secuenciaRecursos, plantilla, capa, recurso) {
            if (!Dnv.cfg.getCfgBoolean("AuditoriaZipServiceEnabled", false)) return;

            //cerramos la duración del recurso anterior.
            var indice = listaSecuenciasMaestro.length;
            if (indice >= 1) {
                listaSecuenciasMaestro[indice - 1].setDuracionReal(Dnv.utiles.secondsDiff(new Date(), listaSecuenciasMaestro[indice - 1].getInicio()));
            }

            var data = new auditData(0, 0, plantilla.getCodigo(), capa.getCodigo(), Dnv.cfg.getCfgInt("MyOwnCode", 0),
                recurso.getCodigo(), capa.getTipoCapa(), secuenciaRecursos.getCodigo(), 0, 0, new Date(), 0,
                secuenciaRecursos.getDuracion(),
                Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo(),
                Dnv.Pl.lastPlaylist.getPlayer().getSalida().getPantalla().getCodigo(),
                estadoPantalla, new Date().getHours(), Dnv.audiencia.modo, recurso.getFilename(),
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0);

            listaSecuenciasMaestro.push(data);
        },

        setFinSlide: function (value) {
            finSlide = value;
        },

        getFinSlide: function () {
            return finSlide;
        },

        setLastAuditado: function (value) {
            lastAuditado = value;
        },

        getLastAuditado: function () {
            return lastAuditado
        }

    };

})();
    
