
var Dnv = Dnv || {};
Dnv.bigdata = Dnv.bigdata || {};

const Database = require('sqlite3');

Dnv.bigdata.intervalSendData_BigData;
Dnv.bigdata.intervalSendData_Pases;

Dnv.bigdata.db_today;
Dnv.bigdata.db_yesterday;
Dnv.bigdata.insertAparicion;

Dnv.bigdata.db_today_pases;
Dnv.bigdata.db_yesterday_pases;
Dnv.bigdata.insertPaseResumen;
Dnv.bigdata.insertPaseUser;

Dnv.bigdata.sendBigData = function(start, end, onSuccess) {

    function captureDataToDB(start, end, callBack) {
        Dnv.audiencia.getApariciones(start, end, function(apariciones) {
            if (apariciones) {
                apariciones.forEach(function(entry) {
                    Dnv.bigdata.insertAparicion.run(entry.getTime(),
                        entry.getTrackedface_id(),
                        entry.getGender(),
                        entry.getAge(),
                        entry.getDwellTime(),
                        entry.getAttentionTime(),
                        entry.getAFR(),
                        entry.getANG(),
                        entry.getDIS(),
                        entry.getHAP(),
                        entry.getNEU(),
                        entry.getSAD(),
                        entry.getSUR()
                    );
                    console.log("[BIG DATA] (captureDataToDB) Insertada aparición: " + entry.getTime() + ", " + entry.getTrackedface_id());
                });
            }
            if (callBack) callBack();
        });
    }

    function sendData() {
        var ip = Dnv.cfg.getCfgString("WipyIP_BigData", "http://167.114.127.177:8083/api/data");
        //var ip = "http://192.168.3.108:8083/api/data/_bulk";
        var token = Dnv.cfg.getCfgString("WipyTOKEN_BigData", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpcCI6IjE5Mi4xNjguMy4xMDgiLCJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.q_TeM_ejBXz0vFVvstTCzaEe0aYJxdMw4AXyzBoeBhE");
        var objidPlayer = Dnv.cfg.getCfgInt("MyOwnCode", 0);
        var codUbicacion = Dnv.Pl.lastPlaylist.getPlayer().getUbicacion();
        var dateOffset = new Date().getTimezoneOffset() * 60000;

        function addApariciones() {

            if (sinEnviar.length == 0) return;

            var aparicion = sinEnviar.shift();
            aparicion = new Dnv.audiencia.aparicion(aparicion.time,
                aparicion.faceID,
                aparicion.gender,
                aparicion.age,
                aparicion.dwellTime,
                aparicion.attentionTime,
                aparicion.AFR,
                aparicion.ANG,
                aparicion.DIS,
                aparicion.HAP,
                aparicion.NEU,
                aparicion.SAD,
                aparicion.SUR
            );
            apariciones.push({
                "ID": aparicion.getID(),
                "FaceID": aparicion.getTrackedface_id(),
                "Time": aparicion.getTime() - dateOffset,
                "Gender": aparicion.getGender(),
                "Age": aparicion.getAge(),
                "DwellTime": aparicion.getDwellTime(),
                "AttentionTime": aparicion.getAttentionTime(),
                "Impact": aparicion.isImpact(),
                "FH": aparicion.getFH(),
                "DS": aparicion.getDS(),
                "ObjIdPlayer": objidPlayer,
                "CodUbicacion": codUbicacion
            });

            setEnviado(aparicion.getTime(), aparicion.getTrackedface_id());

            addApariciones();

        };

        function send() {

            try {

                addApariciones();
                if (apariciones.length == 0) return;

                console.log("[BIG DATA] Enviando apariciones");

                var xhr = new XMLHttpRequest();
                xhr.open("POST", ip, true);
                xhr._time = new Date().getTime();
                xhr.timeout = 5000;
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                //xhr.setRequestHeader("Connection", "close");
                xhr.onreadystatechange = function(error) {
                    //console.log("[BIG DATA] Cambio de estado en aparicion: " + this._time + ", " + this._faceID + ", " + xhr.readyState + ", " + xhr.status);
                    if (this.readyState === 4 && this.status === 200) {
                        // marcarlas como enviadas las apariciones
                        if (this.status === 200) {
                            //console.log("[BIG DATA] Aparicion aceptada en el servidor: " + this._time + ", " + this._faceID );
                            //setEnviado(this._time, this._faceID);
                        } else if (this.status != 0) {
                            //console.log("[BIG DATA] Error " + this.status + " al enviar aparicion al servidor: " + this._time + ", " + this._faceID);
                        }
                    }
                };
                xhr.onerror = function(e) {
                    console.log("[BIG DATA] Error " + this.statusText + " al enviar apariciones al servidor");
                };
                xhr.ontimeout = function() {
                    console.log("[BIG DATA] Timeout al enviar apariciones al servidor");
                };

                xhr.send(JSON.stringify({
                    "Pass_bulk": [],
                    "Dwell_bulk": apariciones
                })
                );

            } catch (e) {
                console.log("[BIG DATA] Error " + + " al enviar apariciones al servidor");
            }
        }

        var sinEnviar;
        var apariciones = [];

        Dnv.bigdata.db_today.serialize(function() {
            Dnv.bigdata.db_today.run('CREATE TABLE IF NOT EXISTS `apariciones` ( `time` INTEGER, `faceID` INTEGER, `gender` INTEGER, `age` INTEGER, `dwellTime` INTEGER, `attentionTime` INTEGER, ' +
                '`AFR` REAL ,`ANG` REAL,`DIS` REAL,`HAP` REAL,`NEU` REAL,`SAD` REAL,`SUR` REAL, `enviado` INTEGER, PRIMARY KEY(`time`,`faceID`) )');
            Dnv.bigdata.db_today.all('SELECT * FROM apariciones WHERE enviado = 0 LIMIT 50', function(err, rows) {
                sinEnviar = rows;
                send();
            });
        });

    }

    function getAparicion(time, faceID) {
        var aparicion = Dnv.bigdata.db_today.prepare('SELECT * FROM apariciones WHERE time = "' + time + '" AND faceID = "' + faceID + '"').get();
        return aparicion;
    }

    function setEnviado(time, faceID) {
        Dnv.bigdata.db_today.prepare('UPDATE apariciones SET enviado = 1 WHERE time = "' + time + '" AND faceID = "' + faceID + '"').run();
        return true;
    }

    console.log("[BIG DATA] Iniciando captura de datos");

    // se crea la base de datos correspondiente para el día de hoy
    // si ya existe, solo se obtiene
    var cDateToday = new Date();
    var fileNameToday = Dnv.Cloud._BIG_DATA + '/bigdata_' + cDateToday.getFullYear() + '-' + Dnv.utiles.formatDateSize(cDateToday.getMonth() + 1) + '-' + Dnv.utiles.formatDateSize(cDateToday.getDate()) + ".db";
    if (!Dnv.bigdata.db_today || Dnv.bigdata.db_today.filename != fileNameToday) {
        //if (Dnv.bigdata.db_today) Dnv.bigdata.db_today.close();
        Dnv.bigdata.db_today = new Database.Database(fileNameToday);
        Dnv.bigdata.db_today.serialize(function() {
            Dnv.bigdata.db_today.run('CREATE TABLE IF NOT EXISTS `apariciones` ( `time` INTEGER, `faceID` INTEGER, `gender` INTEGER, `age` INTEGER, `dwellTime` INTEGER, `attentionTime` INTEGER, ' +
                '`AFR` REAL ,`ANG` REAL,`DIS` REAL,`HAP` REAL,`NEU` REAL,`SAD` REAL,`SUR` REAL, `enviado` INTEGER, PRIMARY KEY(`time`,`faceID`) )');
            Dnv.bigdata.insertAparicion = Dnv.bigdata.db_today.prepare('REPLACE INTO apariciones VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0)');
            for (var d = 1; d < 2; d++) {
                getPasesNotSended(d);
            }
        });

        // se obtiene la base de datos del dia de ayer para copiar a la de hoy las apariciones no enviadas
        function getPasesNotSended(dayBefore) {
            var cDateYesterday = new Date();
            cDateYesterday.setDate(cDateToday.getDate() - dayBefore);
            var fileNameYesterday = Dnv.Cloud._BIG_DATA + '/bigdata_' + cDateYesterday.getFullYear() + '-' + Dnv.utiles.formatDateSize(cDateYesterday.getMonth() + 1) + '-' + Dnv.utiles.formatDateSize(cDateYesterday.getDate()) + ".db";

            var db_yesterday = new Database.Database(fileNameYesterday);
            db_yesterday.serialize(function() {
                db_yesterday.run('CREATE TABLE IF NOT EXISTS `apariciones` ( `time` INTEGER, `faceID` INTEGER, `gender` INTEGER, `age` INTEGER, `dwellTime` INTEGER, `attentionTime` INTEGER, ' +
                    '`AFR` REAL ,`ANG` REAL,`DIS` REAL,`HAP` REAL,`NEU` REAL,`SAD` REAL,`SUR` REAL, `enviado` INTEGER, PRIMARY KEY(`time`,`faceID`) )');
                db_yesterday.each('SELECT * FROM apariciones WHERE enviado = 0', function(err, aparicion) {
                    Dnv.bigdata.insertAparicion.run(aparicion.time,
                        aparicion.faceID,
                        aparicion.gender,
                        aparicion.age,
                        aparicion.dwellTime,
                        aparicion.attentionTime,
                        aparicion.AFR,
                        aparicion.ANG,
                        aparicion.DIS,
                        aparicion.HAP,
                        aparicion.NEU,
                        aparicion.SAD,
                        aparicion.SUR
                    );
                });
                db_yesterday.run('UPDATE apariciones SET enviado=1 WHERE enviado=0');
            });
            db_yesterday.close();

        }

    }

    captureDataToDB(start, end, function() {
        sendData();
        if (onSuccess) onSuccess();
    });

}

Dnv.bigdata.startPases = function() {

    // se crea la base de datos correspondiente para el día de hoy
    // si ya existe, solo se obtiene
    var cDateToday = new Date();
    var fileNameToday = Dnv.Cloud._BIG_DATA + '/pases_' + cDateToday.getFullYear() + '-' + Dnv.utiles.formatDateSize(cDateToday.getMonth() + 1) + '-' + Dnv.utiles.formatDateSize(cDateToday.getDate()) + ".db";
    if (!Dnv.bigdata.db_today_pases || Dnv.bigdata.db_today_pases.filename != fileNameToday) {
        console.log("[BIG DATA][PASES] Inicializando base de datos de pases");
        //if (Dnv.bigdata.db_today_pases) Dnv.bigdata.db_today_pases.close();

        Dnv.bigdata.db_today_pases = new Database.Database(fileNameToday);
        Dnv.bigdata.db_today_pases.serialize(function() {
            Dnv.bigdata.db_today_pases.prepare('CREATE TABLE IF NOT EXISTS `pases` ( `time` INTEGER, `codigo` INTEGER, `objidInsercion` INTEGER, `codCamp` TEXT, `sector` INTEGER, `circuito` INTEGER, `cliente` INTEGER, `p` INTEGER, `h` INTEGER, `m` INTEGER, `fh` INTEGER, `pm` INTEGER, `hm` INTEGER, `mm` INTEGER, `tap` INTEGER, `tah` INTEGER, `tam` INTEGER, `tp` INTEGER, `tm` INTEGER, `th` INTEGER, `h10` INTEGER, `h20` INTEGER, `h30` INTEGER, `h40` INTEGER, `h50` INTEGER, `h60` INTEGER, `h70` INTEGER, `m10` INTEGER, `m20` INTEGER, `m30` INTEGER, `m40` INTEGER, `m50` INTEGER, `m60` INTEGER, `m70` INTEGER, `afr` INTEGER, `ang` INTEGER, `dis` INTEGER, `hap` INTEGER, `neu` INTEGER, `sad` INTEGER, `sur` INTEGER, `coste` INTEGER, `cumpleObjetivo` INTEGER, `enviado` INTEGER, PRIMARY KEY(`time`,`objidInsercion`) )').run();
            Dnv.bigdata.db_today_pases.prepare('CREATE TABLE IF NOT EXISTS `pasesusuarios` ( `time` INTEGER, `objidInsercion` INTEGER, `codCamp` TEXT, `faceID` INTEGER, `gender` INTEGER, `age` INTEGER, `dwellTime` INTEGER, `attentionTime` INTEGER, `AFR` INTEGER, `ANG` INTEGER, `DIS` INTEGER, `HAP` INTEGER, `NEU` INTEGER, `SAD` INTEGER, `SUR` INTEGER, `coste` INTEGER, `cumpleObjetivo` INTEGER, `impacto` INTEGER, PRIMARY KEY(`time`,`objidInsercion`,`faceID`) )').run();
            Dnv.bigdata.insertPaseResumen = Dnv.bigdata.db_today_pases.prepare('REPLACE INTO pases VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)');
            Dnv.bigdata.insertPaseUser = Dnv.bigdata.db_today_pases.prepare('REPLACE INTO pasesusuarios VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');

            for (var d = 1; d < 15; d++) {
                getPasesNotSended(d);
            }
        });

        // se obtiene la base de datos del dia de ayer para copiar a la de hoy las apariciones no enviadas
        function getPasesNotSended(dayBefore) {
            var cDateYesterday = new Date();
            cDateYesterday.setDate(cDateToday.getDate() - dayBefore);
            var fileNameYesterday = Dnv.Cloud._BIG_DATA + '/pases_' + cDateYesterday.getFullYear() + '-' + Dnv.utiles.formatDateSize(cDateYesterday.getMonth() + 1) + '-' + Dnv.utiles.formatDateSize(cDateYesterday.getDate()) + ".db";

            var db_yesterday_pases = new Database.Database(fileNameYesterday);
            db_yesterday_pases.serialize(function() {
                db_yesterday_pases.run('CREATE TABLE IF NOT EXISTS `pases` ( `time` INTEGER, `codigo` INTEGER, `objidInsercion` INTEGER, `codCamp` TEXT, `sector` INTEGER, `circuito` INTEGER, `cliente` INTEGER, `p` INTEGER, `h` INTEGER, `m` INTEGER, `fh` INTEGER, `pm` INTEGER, `hm` INTEGER, `mm` INTEGER, `tap` INTEGER, `tah` INTEGER, `tam` INTEGER, `tp` INTEGER, `tm` INTEGER, `th` INTEGER, `h10` INTEGER, `h20` INTEGER, `h30` INTEGER, `h40` INTEGER, `h50` INTEGER, `h60` INTEGER, `h70` INTEGER, `m10` INTEGER, `m20` INTEGER, `m30` INTEGER, `m40` INTEGER, `m50` INTEGER, `m60` INTEGER, `m70` INTEGER, `afr` INTEGER, `ang` INTEGER, `dis` INTEGER, `hap` INTEGER, `neu` INTEGER, `sad` INTEGER, `sur` INTEGER, `coste` INTEGER, `cumpleObjetivo` INTEGER, `enviado` INTEGER, PRIMARY KEY(`time`,`objidInsercion`) )');
                db_yesterday_pases.run('CREATE TABLE IF NOT EXISTS `pasesusuarios` ( `time` INTEGER, `objidInsercion` INTEGER, `codCamp` TEXT, `faceID` INTEGER, `gender` INTEGER, `age` INTEGER, `dwellTime` INTEGER, `attentionTime` INTEGER, `AFR` INTEGER, `ANG` INTEGER, `DIS` INTEGER, `HAP` INTEGER, `NEU` INTEGER, `SAD` INTEGER, `SUR` INTEGER, `coste` INTEGER, `cumpleObjetivo` INTEGER, `impacto` INTEGER, PRIMARY KEY(`time`,`objidInsercion`,`faceID`) )');

                db_yesterday_pases.each('SELECT * FROM pases WHERE enviado = 0', function(err, pase) {
                    Dnv.bigdata.insertPaseResumen.run(pase.time,
                        pase.codigo,
                        pase.objidInsercion,
                        pase.codCamp,
                        pase.sector,
                        pase.circuito,
                        pase.cliente,
                        pase.p,
                        pase.h,
                        pase.m,
                        pase.fh,
                        pase.pm,
                        pase.hm,
                        pase.mm,
                        pase.tap,
                        pase.tah,
                        pase.tam,
                        pase.tp,
                        pase.tm,
                        pase.th,
                        pase.h10,
                        pase.h20,
                        pase.h30,
                        pase.h40,
                        pase.h50,
                        pase.h60,
                        pase.h70,
                        pase.m10,
                        pase.m20,
                        pase.m30,
                        pase.m40,
                        pase.m50,
                        pase.m60,
                        pase.m70,
                        pase.afr,
                        pase.ang,
                        pase.dis,
                        pase.hap,
                        pase.neu,
                        pase.sad,
                        pase.sur,
                        pase.coste,
                        pase.cumpleObjetivo
                    );
                    db_yesterday_pases.each('SELECT * FROM pasesusuarios WHERE time = "' + pase.time + '" AND objidInsercion = "' + pase.objidInsercion + '"', function(err, pase_usuario) {
                        if (pase_usuario) {
                            Dnv.bigdata.insertPaseUser.run(pase_usuario.time,
                                pase_usuario.objidInsercion,
                                pase_usuario.codCamp,
                                pase_usuario.faceID,
                                pase_usuario.gender,
                                pase_usuario.age,
                                pase_usuario.dwellTime,
                                pase_usuario.attentionTime,
                                pase_usuario.AFR,
                                pase_usuario.ANG,
                                pase_usuario.DIS,
                                pase_usuario.HAP,
                                pase_usuario.NEU,
                                pase_usuario.SAD,
                                pase_usuario.SUR,
                                pase_usuario.coste,
                                pase_usuario.cumpleObjetivo,
                                pase_usuario.impacto
                            );
                        }
                    });

                });

                db_yesterday_pases.run('UPDATE pases SET enviado=1 WHERE enviado=0');
            });
            db_yesterday_pases.close();
        }

        for (var d = 1; d < 15; d++) {
            getPasesNotSended(d);
        }

    }
}

Dnv.bigdata.sendAuditoria = function(start, end, insercion, onSuccess) {

    Dnv.bigdata.startPases();

    var insercionCopia = {};
    Object.assign(insercionCopia, insercion);

    function captureDataToDB(start, end, insercionCopia, callBack) {
        Dnv.audiencia.generateReport_pases(start, end, function(entry) {

            if (entry) {

                var costePase = 0;
                var cumpleObjetivoDemograficoEImpacto = 0;

                var date = start.getTime();

                entry.getUsers().forEach(function(entry) {
                    var isImpacto = 0;
                    if (entry.getAttentionTime() >= Dnv.audiencia.tiempoImpacto) isImpacto = 1;

                    var costeAparicion = Dnv.audiencia.getCosteAparicion(insercionCopia, entry);
                    if (isImpacto == 1) costePase += costeAparicion;

                    var cumpleObjetivoDemografico = Dnv.audiencia.cumpleObjetivoDemografico(insercionCopia, entry);
                    if (isImpacto == 1) cumpleObjetivoDemograficoEImpacto += cumpleObjetivoDemografico;

                    Dnv.bigdata.insertPaseUser.run(date,
                        insercionCopia.getObjID(),
                        insercionCopia.getCampanya(),
                        entry.getTrackedface_id(),
                        entry.getGender(),
                        entry.getAge(),
                        entry.getDwellTime(),
                        entry.getAttentionTime(),
                        entry.getAFR(),
                        entry.getANG(),
                        entry.getDIS(),
                        entry.getHAP(),
                        entry.getNEU(),
                        entry.getSAD(),
                        entry.getSUR(),
                        costeAparicion,
                        cumpleObjetivoDemografico, // 1 si cumple, 0 si no
                        isImpacto // 1 si lo es, 0 si no
                    );
                });

                costePase += Dnv.audiencia.getCostePase(insercionCopia);

                Dnv.bigdata.insertPaseResumen.run(date,
                    insercionCopia.getCodigo(),
                    insercionCopia.getObjID(),
                    insercionCopia.getCampanya(),
                    insercionCopia.getSector(),
                    insercionCopia.getCircuito(),
                    insercionCopia.getCliente(),
                    entry.getP(),
                    entry.getH(),
                    entry.getM(),
                    entry.getFH(),
                    entry.getPM(),
                    entry.getHM(),
                    entry.getMM(),
                    entry.getTAP(),
                    entry.getTAH(),
                    entry.getTAM(),
                    entry.getTP(),
                    entry.getTM(),
                    entry.getTH(),
                    entry.getH10(),
                    entry.getH20(),
                    entry.getH30(),
                    entry.getH40(),
                    entry.getH50(),
                    entry.getH60(),
                    entry.getH70(),
                    entry.getM10(),
                    entry.getM20(),
                    entry.getM30(),
                    entry.getM40(),
                    entry.getM50(),
                    entry.getM60(),
                    entry.getM70(),
                    entry.getAFR(),
                    entry.getANG(),
                    entry.getDIS(),
                    entry.getHAP(),
                    entry.getNEU(),
                    entry.getSAD(),
                    entry.getSUR(),
                    costePase,
                    cumpleObjetivoDemograficoEImpacto
                );

                if (Menu._mostrarInfoAudiencia) {
                    Menu.showInfoAudiencia({
                        nombreSlide: insercionCopia.getDenominacion(),
                        totalPersonas: entry.getP(),
                        totalHombres: entry.getH(),
                        totalHombresEdad: Math.round(entry.getHEM()),
                        totalMujeres: entry.getM(),
                        totalMujeresEdad: Math.round(entry.getMEM()),
                        totalPersonasMirando: entry.getPM(),
                        totalHombresMirando: entry.getHM(),
                        totalHombresMirandoEdad: Math.round(entry.getHMEM()),
                        totalMujeresMirando: entry.getMM(),
                        totalMujeresMirandoEdad: Math.round(entry.getMMEM()),
                        coste: costePase
                    });
                }

                console.info("[BIG DATA][PASES] Guardado pase en BD para la campaña: " + insercion.getCampanya() + " (" + insercionCopia.getCodigo() + ") Inicio: " + start.getTime() + " Fin: " + end.getTime());

            }
            if (callBack) callBack();
        });
    }

    Dnv.audiencia.tiempoImpacto = insercionCopia.getDuracionImpacto();

    captureDataToDB(start, end, insercionCopia, function() {
        if (onSuccess) onSuccess();
    });

}

Dnv.bigdata.sendPases = function() {

    var ip = Dnv.cfg.getCfgString("WipyIP_Pases", "http://167.114.127.177:8083/api/data/pass")
    var token = Dnv.cfg.getCfgString("WipyTOKEN_Pases", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpcCI6IjE5Mi4xNjguMy4xMDgiLCJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.q_TeM_ejBXz0vFVvstTCzaEe0aYJxdMw4AXyzBoeBhE");
    var objidPlayer = Dnv.cfg.getCfgInt("MyOwnCode", 0);
    var codUbicacion = Dnv.Pl.lastPlaylist.getPlayer().getUbicacion();
    var nivelSocieconomico = Dnv.Pl.lastPlaylist.getPlayer().getMetadatos()["NivelSocioeconomico"];
    var dateOffset = new Date().getTimezoneOffset() * 60000;

    var pases = [];

    Dnv.bigdata.db_today_pases.serialize(function() {

        Dnv.bigdata.db_today_pases.each('SELECT * FROM pases WHERE enviado = 0 LIMIT 10', function(err, pase) {

            var pases_usuarios = [];

            Dnv.bigdata.db_today_pases.each('SELECT * FROM pasesusuarios WHERE time = "' + pase.time + '" AND objidInsercion = "' + pase.objidInsercion + '"', function(err, pase_usuario) {
                pases_usuarios.push(new Dnv.audiencia.aparicion(pase_usuario.time,
                    pase_usuario.faceID,
                    pase_usuario.gender,
                    pase_usuario.age,
                    pase_usuario.dwellTime,
                    pase_usuario.attentionTime,
                    pase_usuario.AFR,
                    pase_usuario.ANG,
                    pase_usuario.DIS,
                    pase_usuario.HAP,
                    pase_usuario.NEU,
                    pase_usuario.SAD,
                    pase_usuario.SUR,
                    pase_usuario.objidInsercion,
                    pase_usuario.codCamp,
                    pase_usuario.coste,
                    pase_usuario.cumpleObjetivo,
                    pase_usuario.impacto));
            }, function() {
                var usuarios = [];
                for (var j = 0; j < pases_usuarios.length; j++) {
                    usuarios.push({
                        "ID": pases_usuarios[j].getID(),
                        "FaceID": pases_usuarios[j].getTrackedface_id(),
                        "Time": pases_usuarios[j].getTime() - dateOffset,
                        "Gender": pases_usuarios[j].getGender(),
                        "Age": pases_usuarios[j].getAge(),
                        "DwellTime": pases_usuarios[j].getDwellTime(),
                        "AttentionTime": pases_usuarios[j].getAttentionTime(),
                        "Impact": pases_usuarios[j].isImpact(),
                        "FH": pases_usuarios[j].getFH(),
                        "DS": pases_usuarios[j].getDS(),
                        "AFR": pases_usuarios[j].getAFR(),
                        "ANG": pases_usuarios[j].getANG(),
                        "DIS": pases_usuarios[j].getDIS(),
                        "HAP": pases_usuarios[j].getHAP(),
                        "NEU": pases_usuarios[j].getNEU(),
                        "SAD": pases_usuarios[j].getSAD(),
                        "SUR": pases_usuarios[j].getSUR(),
                        "Sentimiento": pases_usuarios[j].getPredominantEmotion(),
                        "GrupoEdad": pases_usuarios[j].getAgeGroup(),
                        "Coste": pases_usuarios[j].getCoste(),
                        "CumpleObjetivoDemografico": pases_usuarios[j].getCumpleObjetivoDemografico(),
                        "Impact": pases_usuarios[j].isImpact()
                    });
                }

                var timePase = pase.time - dateOffset;
                pases.push({
                    "Timestamp": timePase,
                    "_id": objidPlayer + "_" + timePase,
                    "C_Camp": parseInt(pase.codCamp),
                    "C_Insercion": pase.codigo,
                    "C_Player": objidPlayer,
                    "C_Ubicacion": codUbicacion,
                    "C_Sector": pase.sector,
                    "C_Circuito": pase.circuito,
                    "C_Cliente": pase.cliente,
                    "p": pase.p,
                    "h": pase.h,
                    "m": pase.m,
                    //"fh": pase.fh,
                    "pm": pase.pm,
                    "hm": pase.hm,
                    "mm": pase.mm,
                    "tap": pase.tap,
                    "tah": pase.tah,
                    "tam": pase.tam,
                    "tp": pase.tp,
                    "tm": pase.tm,
                    "th": pase.th,
                    "h10": pase.h10,
                    "h20": pase.h20,
                    "h30": pase.h30,
                    "h40": pase.h40,
                    "h50": pase.h50,
                    "h60": pase.h60,
                    "h70": pase.h70,
                    "m10": pase.m10,
                    "m20": pase.m20,
                    "m30": pase.m30,
                    "m40": pase.m40,
                    "m50": pase.m50,
                    "m60": pase.m60,
                    "m70": pase.m70,
                    "AFR": pase.afr,
                    "ANG": pase.ang,
                    "DIS": pase.dis,
                    "HAP": pase.hap,
                    "NEU": pase.neu,
                    "SAD": pase.sad,
                    "SUR": pase.sur,
                    "NivelSocioeconomico": nivelSocieconomico,
                    "usuarios": usuarios,
                    "FH": new Date(pase.time).getHours(),
                    "DS": new Date(pase.time).getDay(),
                    "CosteTotal": pase.coste,
                    "NPasesObjetivoEImpacto": pase.cumpleObjetivo
                });
            });
        }, function() {
            setTimeout(function() {
                try {
                    // enviar al rabbit

                    if (pases.length == 0) return;

                    console.log("[BIG DATA][PASES] Enviando pases");

                    var xhr = new XMLHttpRequest();
                    xhr.open("POST", ip, true);
                    xhr.timeout = 5000;
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                    xhr.onreadystatechange = function(error) {
                        if (this.readyState === 4) {
                            if (this.status === 200) {
                                var respuestaJSON = JSON.parse(this.response);
                                var respuestas_pases = respuestaJSON.trans;
                                for (var i = 0; i < respuestas_pases.length; i++) {
                                    var player = parseInt(respuestas_pases[i]._id.split("_")[0]);
                                    var time = parseInt(respuestas_pases[i]._id.split("_")[1]) + dateOffset;
                                    //var codCamp = parseInt(respuestas_pases[i].status_camp.codCamp);
                                    if (player == objidPlayer) {
                                        switch (respuestas_pases[i].status) {
                                            case 200: //aceptado
                                                console.log("[BIG DATA][PASES] Pase aceptado en el servidor: " + time);
                                                setEnviadoPase(time);
                                                break;
                                            case 500: //error
                                                console.error("[BIG DATA][PASES] Pase NO aceptado en el servidor: " + time);
                                                break;
                                            case 503: //duplicado
                                                console.log("[BIG DATA][PASES] Pase duplicado en el servidor: " + time);
                                                setEnviadoPase(time);
                                                break;
                                        }
                                    }
                                }
                            } else if (this.status != 0) {
                                console.log("[BIG DATA][PASES] Error " + this.status + " al enviar pases al servidor");
                            }
                        }
                    };
                    xhr.ontimeout = function() {
                        console.log("[BIG DATA][PASES] Timeout al enviar pases al servidor");
                    };
                    xhr.onerror = function(e) {
                        console.log("[BIG DATA][PASES] Fallo " + this.statusText + " al enviar pases al servidor");
                    };

                    xhr.send(JSON.stringify({
                        "Pass_bulk": pases,
                        "Dwell_bulk": []
                    })
                    );

                } catch (e) {
                    console.log("[BIG DATA][PASES] Error " + e + " al enviar pases al servidor");
                }
            }, 10000);
        });
    });

    function setEnviadoPase(time) {
        Dnv.bigdata.db_today_pases.run('UPDATE pases SET enviado = 1 WHERE time = "' + time + '"');
        return true;
    }

}

Dnv.bigdata.setPasesNoEnviados = function(startPeriod, endPeriod) {

    try {
        var dateOffset = new Date().getTimezoneOffset() * 60000;
        var start = parseInt(startPeriod) - dateOffset;
        var end = parseInt(endPeriod) - dateOffset;

        function updatePases(dayBefore) {
            var cDateToday = new Date();
            var cDateYesterday = new Date();
            cDateYesterday.setDate(cDateToday.getDate() - dayBefore);
            var fileNameYesterday = Dnv.Cloud._BIG_DATA + '/pases_' + cDateYesterday.getFullYear() + '-' + Dnv.utiles.formatDateSize(cDateYesterday.getMonth() + 1) + '-' + Dnv.utiles.formatDateSize(cDateYesterday.getDate()) + ".db";

            var db_yesterday_pases = new Database.Database(fileNameYesterday);
            db_yesterday_pases.serialize(function() {
                db_yesterday_pases.run('CREATE TABLE IF NOT EXISTS `pases` ( `time` INTEGER, `codigo` INTEGER, `objidInsercion` INTEGER, `codCamp` TEXT, `sector` INTEGER, `circuito` INTEGER, `cliente` INTEGER, `p` INTEGER, `h` INTEGER, `m` INTEGER, `fh` INTEGER, `pm` INTEGER, `hm` INTEGER, `mm` INTEGER, `tap` INTEGER, `tah` INTEGER, `tam` INTEGER, `tp` INTEGER, `tm` INTEGER, `th` INTEGER, `h10` INTEGER, `h20` INTEGER, `h30` INTEGER, `h40` INTEGER, `h50` INTEGER, `h60` INTEGER, `h70` INTEGER, `m10` INTEGER, `m20` INTEGER, `m30` INTEGER, `m40` INTEGER, `m50` INTEGER, `m60` INTEGER, `m70` INTEGER, `afr` INTEGER, `ang` INTEGER, `dis` INTEGER, `hap` INTEGER, `neu` INTEGER, `sad` INTEGER, `sur` INTEGER, `coste` INTEGER, `cumpleObjetivo` INTEGER, `enviado` INTEGER, PRIMARY KEY(`time`,`objidInsercion`) )');
                db_yesterday_pases.run('CREATE TABLE IF NOT EXISTS `pasesusuarios` ( `time` INTEGER, `objidInsercion` INTEGER, `codCamp` TEXT, `faceID` INTEGER, `gender` INTEGER, `age` INTEGER, `dwellTime` INTEGER, `attentionTime` INTEGER, `AFR` INTEGER, `ANG` INTEGER, `DIS` INTEGER, `HAP` INTEGER, `NEU` INTEGER, `SAD` INTEGER, `SUR` INTEGER, `coste` INTEGER, `cumpleObjetivo` INTEGER, `impacto` INTEGER, PRIMARY KEY(`time`,`objidInsercion`,`faceID`) )');
                db_yesterday_pases.run('UPDATE pases SET enviado=0 WHERE time > ' + start + ' AND time < ' + end);
            });
            db_yesterday_pases.close();
        }


        var now = new Date().getTime() - dateOffset;
        if (start >= now || end >= now) {
            console.warn("[BIG DATA] No se marcan como no enviados el rango de pases porque el día de hoy está incluido en el rango");
        } else {
            Dnv.bigdata.db_today_pases.serialize(function() {
                Dnv.bigdata.db_today_pases.run('DELETE from pases WHERE time > ' + start + ' AND time < ' + end).run();

                for (var d = 1; d < 15; d++) { updatePases(d); }

                Dnv.monitor.resetApp();
            });

        }

    } catch (e) {
        console.error("[BIG DATA] Error " + e + " al setear pases no enviados en un rango");
    }
}

Dnv.bigdata.start = function() {

    var lastSended;
    var intervalTimeSend_BigData = Dnv.cfg.getCfgInt("MedicionAudiencia_BigData_Intervalo", 150) * 1000; //1200000
    //var intervalTimeSend_BigData = 150 * 1000; //1200000
    var intervalTimeSend_Pases = Dnv.cfg.getCfgInt("MedicionAudiencia_BigData_Intervalo_Pases", 45) * 1000;

    function captureAndSend_BigData() {
        // enviar datos cada x minutos
        var endDate = new Date(lastSended.getTime() + intervalTimeSend_BigData);
        Dnv.bigdata.sendBigData(lastSended, endDate, function() {
            lastSended = endDate;
        });
    }

    if (!lastSended) {
        lastSended = new Date();
    }

    Dnv.bigdata.startPases();

    Dnv.bigdata.intervalSendData_BigData = setInterval(captureAndSend_BigData, intervalTimeSend_BigData);

    Dnv.bigdata.intervalSendData_Pases = setInterval(Dnv.bigdata.sendPases, intervalTimeSend_Pases);

    Dnv.bigdata.startListenCampaigns();

};

Dnv.bigdata.startListenCampaigns = function() {

    var amqp = require('amqp-connection-manager');

    var user = Dnv.cfg.getCfgString("RabbitMQ_User", "administrador");
    var pass = Dnv.cfg.getCfgString("RabbitMQ_Pass", "Iconmm2k8");
    var url = Dnv.cfg.getCfgString("RabbitMQ_ConnectionString", "167.114.127.177");

    var vhost = Dnv.cfg.getCfgString("RabbitMQ_Vhost_Campaigns", "");
    var exchangeName = Dnv.cfg.getCfgString("RabbitMQ_CampaignsExchangeName", "Campaign");

    var topicToBind = Dnv.cfg.getCfgString("TopicGeneral", "");
    var queueName = Dnv.cfg.getCfgString("MyOwnCode", 0) + "-Player";

    var connection = amqp.connect('amqp://' + user + ':' + pass + '@' + url + '/' + vhost);
    connection.on('connect', function() { console.info("[RABBIT][CAMPAIGNS] Conectado"); });
    connection.on('disconnect', function(err) { console.warn("[RABBIT][CAMPAIGNS] Conexion cerrada " + err.message); });

    var handleMessage = function(data) {
        var string = data.content.toString();
        console.log("[RABBIT][CAMPAIGNS] Msg recibido: " + string);

        try {
            var mensaje = JSON.parse(string);
            var status = mensaje.Estado;

            if (status == 1) {
                console.info("[RABBIT][CAMPAIGNS] Activada campanya " + parseInt(mensaje.CodCamp));
                Dnv.Pl.lastPlaylist.getPlayer().getSalida().setStatusCampanya(parseInt(mensaje.CodCamp), new Date());
            } else if (status == 6) {
                var dateOffset = new Date().getTimezoneOffset() * 60000;
                var nowDate = new Date(mensaje.timestamp + dateOffset);
                var tomorrow = new Date(nowDate.getTime() + (24 * 60 * 60 * 1000));
                tomorrow.setHours(00);
                tomorrow.setMinutes(00);
                tomorrow.setSeconds(00);
                tomorrow.setMilliseconds(0);

                console.info("[RABBIT][CAMPAIGNS] Pausada por maximo diario campanya " + parseInt(mensaje.CodCamp) + " hasta: " + tomorrow.toString());
                Dnv.Pl.lastPlaylist.getPlayer().getSalida().setStatusCampanya(parseInt(mensaje.CodCamp), tomorrow);
            } else {
                console.info("[RABBIT][CAMPAIGNS] Pausada campanya " + parseInt(mensaje.CodCamp));
                Dnv.Pl.lastPlaylist.getPlayer().getSalida().setStatusCampanya(parseInt(mensaje.CodCamp), new Date(7970745600000));
            }
        } catch (e) {
            console.warn("[RABBIT][CAMPAIGNS] Msg con formato incorrecto");
        }

        channelWrapper.ack(data);
    }

    var channelWrapper = connection.createChannel({
        json: true,
        setup: function(channel) {
            channel.assertQueue(queueName, { durable: true, autoDelete: true });
            channel.bindQueue(queueName, exchangeName, topicToBind);
            channel.consume(queueName, handleMessage);
        }
    });

}

Dnv.bigdata.stop = function() {

    if (Dnv.bigdata.intervalSendData_BigData) clearInterval(Dnv.bigdata.intervalSendData_BigData);
    if (Dnv.bigdata.intervalSendData_Pases) clearInterval(Dnv.bigdata.intervalSendData_Pases);

    console.log("[BIG DATA] Envio detenido");

};