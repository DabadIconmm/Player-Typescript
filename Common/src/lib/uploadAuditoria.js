"use strict";


var Dnv = Dnv || {};

//TODO: Sólo escribirá auditoria si el setting Salida_Auditoria == true)

Dnv.auditoriaZip = (function () {

    var timerAuditoria;

    function upload_success(lastDateAuditoriaUploaded) {
        console.info("[AUDITORIA_UPLOAD]: se han subido correctamente los ficheros al servidor.");
        var lastDayUploaded = Dnv.utiles.formatearFechaWCF(lastDateAuditoriaUploaded /*new Date()*/, true);
        Dnv.cfg.setLastDayAuditoriaUploaded(lastDayUploaded);
        console.info("[AUDITORIA_UPLOAD]: Actualizado LastDayAuditoriaUploaded");
    };

    function upload_error() {
        console.warn("[AUDITORIA_UPLOAD]: No se han podido subir los ficheros al servidor.");
    };

    return {

        iniciarTimerSubida: function iniciarTimerSubida() {
            //lee settings y si es necesario inicia timers para subir zip de auditoría
            var enabled = Dnv.cfg.getCfgBoolean("AuditoriaZipServiceEnabled", false);

            if (enabled == true) {
                console.info("[AUDITORIA_UPLOAD] Iniciamos timer subir auditoría (300s).");
                if (!timerAuditoria) {
                    timerAuditoria = setInterval(Dnv.auditoriaZip.subirAuditoria, 300 * 1000); //todo: cambiar a 5 min... //RAG ¿Salida_IntervaloEnvioAuditoria?
                }
            } else {
                console.warn("[AUDITORIA_UPLOAD] No iniciamos el timer, AuditoriaZipServiceEnabled = false");
            }
        },

        detenerTimers: function detenerTimers() {
            if (timerAuditoria) {
                console.info("[AUDITORIA_UPLOAD] Detenemos timer subir auditoría.");
                clearInterval(timerAuditoria);
            }
        },

        subirAuditoria: function subirAuditoria() {
            //guardar último día subido. (setting fuera de config).
            console.info("[AUDITORIA_UPLOAD] Entramos en subirAuditoria");

            // Es el día cuya última auditoria completa se subió, por tanto subiremos auditorías posteriores a ese día 
            var lastDayUploaded = Dnv.cfg.getLastDayAuditoriaUploaded();
            var lastDayUploadedDate;

            if (lastDayUploaded == undefined) {
                //lastDayUploaded = "1900-01-01 00:00:00" 
                //TODO RAG: poner date.now - el máximo de días que se guarden los ficheros (10 dias?)                
                //     CAR: No sería mejor subir todos los disponibles, menos el de hoy, y borrarles después?
                //          Que el successCallback del upload nos devuelva la lista de ficheros subidos con exito, y los borramos
                lastDayUploadedDate = new Date();
                lastDayUploadedDate.setDate(lastDayUploadedDate.getDate() - 10);

                lastDayUploaded = Dnv.utiles.formatearFechaWCF(lastDayUploadedDate, true);
                console.info("[AUDITORIA_UPLOAD] Fijamos valor por DEFECTO de 'lastDayUploaded' a " + lastDayUploaded.toString());
            } else {
                lastDayUploadedDate = Dnv.utiles.stringToTimestamp(lastDayUploaded);
            }

            console.info("[AUDITORIA_UPLOAD] " + lastDayUploaded);

            // CAR: No subiremos la Auditoria de hoy, porque estará incompleta
            var nowDate = new Date();
            var ayer = new Date(nowDate.getTime() - (24 * 60 * 60 * 1000));
            ayer.setHours(23);
            ayer.setMinutes(59);
            ayer.setSeconds(59);
            ayer.setMilliseconds(0);

            /*if (Dnv.utiles.getDayOfTheYear(lastDayUploadedDate) >= Dnv.utiles.getDayOfTheYear(nowDate)) {
            console.log("[AUDITORIA_UPLOAD] Ya están subidos todos los ficheros hasta hoy. Salimos.");
            return;
            }*/
            /**
            if (Dnv.utiles.getDayOfTheYear(lastDayUploadedDate) >= Dnv.utiles.getDayOfTheYear(ayer)) {
                console.info("[AUDITORIA_UPLOAD] Ya están subidos todos los ficheros completos hasta hoy. Salimos. " + lastDayUploaded + ", " + Dnv.utiles.getDayOfTheYear(lastDayUploadedDate) + ", " + Dnv.utiles.getDayOfTheYear(ayer));
                return;
            }
            **/
            if (lastDayUploadedDate.getTime() >= ayer.getTime()) {
                console.info("[AUDITORIA_UPLOAD] Ya están subidos todos los ficheros completos hasta hoy. Salimos. " + lastDayUploaded + ", " + lastDayUploadedDate.getTime() + ", " + ayer.getTime());
                return;
            }

            var horaInicioAuditoriaZip = Dnv.cfg.getCfgString("HoraInicioAuditoriaZip", "").split(":");
            var horaFinAuditoriaZip = Dnv.cfg.getCfgString("HoraFinAuditoriaZip", "").split(":");

            var iniHour = new Date();
            iniHour.setHours(horaInicioAuditoriaZip[0]);
            iniHour.setMinutes(horaInicioAuditoriaZip[1]);

            var endHour = new Date();
            endHour.setHours(horaFinAuditoriaZip[0]);
            endHour.setMinutes(horaFinAuditoriaZip[1]);

            if (nowDate < iniHour || nowDate > endHour) {
                console.info("[AUDITORIA_UPLOAD] No estamos en rango de subida. (" + Dnv.cfg.getCfgString("HoraInicioAuditoriaZip", "") + ", " + Dnv.cfg.getCfgString("HoraFinAuditoriaZip", "") + ")");
                return;
            } else {
                console.info("[AUDITORIA_UPLOAD] Sí estamos en el rango de subida. (" + Dnv.cfg.getCfgString("HoraInicioAuditoriaZip", "") + ", " + Dnv.cfg.getCfgString("HoraFinAuditoriaZip", "") + ")");
            }

            var lastDayItems = lastDayUploaded.split(" ")[0].split("-");
            // [CAR] Por qué UTC para la fecha final? Lo suyo es subir la auditoria de dias anteriores (ficheros ya completados, sin incluir hoy)
            //var iniDay = lastDayItems[0] + "/" + lastDayItems[1] + "/" + lastDayItems[2];
            //var endDay = nowDate.getUTCFullYear() + "/" + (nowDate.getUTCMonth() + 1) + "/" + nowDate.getUTCDate();

            var iniDate = new Date(lastDayItems[0], lastDayItems[1] - 1, lastDayItems[2]);
            var endDate = ayer;

            Dnv.monitor.writeLogFile("[AUDITORIA] Generando y subiendo auditoria para el player " + Dnv.cfg.getCfgInt("MyOwnCode", 0) + " para el rango ( " + iniDate + ", " + +endDate + " )", LogLevel.Info);
            //var inicioGeneracion = Date.now();
            Dnv.uploadZip.generateAndUploadAuditoriaZip("AuditZip_" + Dnv.cfg.getCfgInt("MyOwnCode", 0) + ".zip", iniDate, endDate,
                    function () {
                        upload_success(endDate);
                        //console.log("La generacion tardó: " + ((Date.now() - inicioGeneracion) / 1000)); En LG, 4 archivos: 1 Minuto 15 segs
                    }, upload_error)

            /*
            var files = Dnv.obtenerFicherosPorFecha(iniDay, endDay, "logs/", "xml");

            if (files.length > 0) {
            var fileZipPath = Dnv.createZipFile([files[0]], "AuditZip_" + Dnv.cfg.getCfgInt("MyOwnCode", 0) + ".zip");
            //TODO RAG ¿destino = FileTransferClientEndPointAddress?
            Dnv.uploadZip(fileZipPath, Dnv.cfg.getCfgString("IPMaster", ""), "SetAuditoriaZipSamsung", upload_success, upload_error);
            //Dnv.uploadZip(fileZipPath, "192.168.3.98", "SetAuditoriaZip", upload_success, upload_error);
            } else {
            console.log("[AUDITORIA_UPLOAD] No hay ficheros para subir. último enviado = " + lastDayUploaded);
            }
            */
        }
    }
})();
