
var Dnv = Dnv || {};
Dnv.Variables = Dnv.Variables || {};

Dnv.Variables.sendBigData = 0;

Dnv.Variables.enabled = true;

Dnv.Variables.gpsZones = "";
Dnv.Variables.estadosGeoFences = {}; //Array con las zonas asociadas a slides y suss estados
Dnv.Variables.timeLastState = 0;
Dnv.Variables.intervalChangeGPSZoneState = Dnv.cfg.getCfgInt("CambioEstadoZonaTimeout", 20); //Valor por defecto 20 segundos

Dnv.Variables.CAMBIO_VALOR_RFID = "CAMBIO_VALOR_RFID";
Dnv.Variables.CAMBIO_VALOR_GPIO_0 = "CAMBIO_VALOR_GPIO_0";
Dnv.Variables.CAMBIO_VALOR_HID = "CAMBIO_VALOR_HID ";

Dnv.Variables.RFID = function () {

    window.addEventListener(Dnv.Variables.CAMBIO_VALOR_RFID, function (e) {

        console.log("[VARIABLES][RFID] Tarjeta leida: " + Main.keysDown);

        Dnv.Variables.actualizarValor(1300, Main.keysDown);

        Main.keysDown = "";

        Dnv.Variables.sendBigData = 3;

        Dnv.presentador.avanzarSlide();

        Dnv.Variables.actualizarValor(1300, 0);

    });

}

Dnv.Variables.HID = function () {

    window.addEventListener(Dnv.Variables.CAMBIO_VALOR_HID, function (e) {

        try {

            console.log("[VARIABLES][HID] Valor recibido: " + Main.keysDown);

            var valores = Main.keysDown.split(":");

            Dnv.Variables.actualizarValor(valores[1], valores[2]);

            Main.keysDown = "";

            // big data mirror adidas
            if (valores[2] && valores[1] == 1200) Dnv.Variables.sendBigData = 2;

            if (Dnv.Variables.isPrioritaria(valores[1])) Dnv.presentador.avanzarSlideEvaluandoActual();

        } catch (e) {
            console.error("[VARIABLES][HID] Error: " + e);
        }

    });

}

Dnv.Variables.GPIO_0 = function () {

    window.addEventListener(Dnv.Variables.CAMBIO_VALOR_GPIO_0, function (e) {

        console.log("[VARIABLES][Sensor_Presencia_GPIO_0] Valor recibido: " + e.detail.value);

        Dnv.Variables.actualizarValor(1200, e.detail.value);

        if (e.detail.value == 1) Dnv.Variables.sendBigData = 2;

        Dnv.presentador.avanzarSlide();

    });

}

Dnv.Variables.RMX = function () {

    var lastSongID = 0;

    function writeNowPlayingXML(id, artist, song) {

        if (lastSongID != id) {

            var xml = '<?xml version="1.0" encoding="utf-8"?>\n' +
                '<datasource>\n' +
                '<item id="' + id + '">\n' +
                '<artist><![CDATA[' + artist + ']]></artist>\n' +
                '<song><![CDATA[' + song + ']]></song>\n' +
                '</item>\n' +
                '</datasource>\n';

            Dnv.monitor.writeFile(Dnv.Cloud._STATIC_PATH + "NowPlaying.xml", xml, function (cb) {
                if (cb) {
                    lastSongID = id;
                    Dnv.Smo.onLocalDataActualizado("NowPlaying.xml", xml);
                }
            });

        }

    }

    function conectar() {
        if (!isConnected) {
            client.removeAllListeners('connect');
            client.connect(9874, ip, function () {
                console.log('[VARIABLES][RMX] Conectado');
                isConnected = true;
            });
        }
        setTimeout(conectar, 5000);
    }


    var net = require('net');
    var protobuf = require('protocol-buffers');
    var client = new net.Socket();

    var isConnected = false;

    var ip = Dnv.Pl.lastPlaylist.getPlayer().getEntradaMegafonia().getMetadatos()["IPRMX"];

    var message = protobuf(Dnv.monitor.readFile(Dnv.Cloud._ELECTRON_RUN_PATH + 'rmxd4.proto'));

    conectar();

    client.on('data', function (data) {
        //Deserializo el mensaje recibido:
        var deserializedData = message.Notification.decode(data);
        var type = deserializedData['type'];
        //console.log('[VARIABLES][RMX] type=' + type);

        switch (type) {
            case 0: //Tipo notifNop
                //console.log('[VARIABLES][RMX] Recibido Nop Notification');
                break;
            case 1: //Tipo notifIdle, puede llegar al finalizar un anuncio
                console.log('[VARIABLES][RMX] Recibido Idle Notification');
                Dnv.Variables.actualizarValor(1600, 0);
                Dnv.Variables.actualizarValor(1601, 0);
                // como son prioritarias
                // evaluamos tambien si el slide que estamos mostrando cumple las condiciones, ultimo parametro true
                Dnv.presentador.avanzarSlideEvaluandoActual();
                break;
            case 2: //Tipo notifSong
                var objetoSong = deserializedData['notif_song'];
                console.log("[VARIABLES][RMX] Recibida canción id='" + objetoSong['id'] + "' artist='" + objetoSong['artist'] + "' title='" + objetoSong['title'] + "'");
                writeNowPlayingXML(objetoSong['id'], objetoSong['artist'], objetoSong['title']);

                Dnv.Variables.actualizarValor(1601, 0);
                Dnv.Variables.actualizarValor(1600, objetoSong['id']);
                Dnv.presentador.avanzarSlideEvaluandoActual();
                break;
            case 3: //Tipo notifAdvert
                var objetoAdvert = deserializedData['notif_advert'];
                var id = objetoAdvert['id'];
                console.log("[VARIABLES][RMX] Recibido Anuncio id='" + id + "'");

                Dnv.Variables.actualizarValor(1600, 0);
                Dnv.Variables.actualizarValor(1601, id);
                Dnv.presentador.avanzarSlideEvaluandoActual();
                break;
            default:

                break;
        }
    });

    client.on('close', function () {
        isConnected = false;
        console.log('[VARIABLES][RMX] Conexión cerrada');
    });

    client.on('error', function () {
        console.log('[VARIABLES][RMX] Error en la conexión');
    });

}

Dnv.Variables.GPS = function () {
    console.log("[VARIABLES][GPS] Inicializando");

    var nowLat;
    var nowLon;
    var geoFenceGlobal = [[41.61871,-0.94155],[41.62037,-0.96661],[41.63757,-0.97262],[41.67797,-0.92284],[41.69322,-0.86705],[41.66822,-0.83683],[41.62472,-0.84804],[41.60612,-0.88352],[41.60471,-0.89382]];
    var geoFencePlayer = Dnv.Pl.lastPlaylist.getPlayer().getMetadatos()["GeoFence"];
    var geoFences = {};
    var zonas = {};



    // @point -> punto para comprobar si esta dentro de la zona, de la forma [lat, lon]
    // @zone -> array de puntos que forman la zona en la que queremos comprobar,  de la forma [[lat,lon],[lan,lon]]
    // return -> true si esta dentro, false en caso contrario
    function isInZone(point, zone) {
        var pointToCheck = turf.points([point]);
        var zoneToCheck = turf.polygon([zone]);
        var pointsInside = turf.pointsWithinPolygon(pointToCheck, zoneToCheck);
        if (pointsInside.features.length === 0) return false;
        return true;
    }



    function initGeoFences() {
        if (Dnv.Pl.lastPlaylist) {
            var pl = Dnv.Pl.lastPlaylist;
            var canal = pl.getPlayer().getSalida().getCanal();
            if (canal.getCanalesAgrupados().length == 0) { //Si hay canales agrupados (getCanalesAgrupados().length != 0) no evaluamos slides
                var slides = canal.getSlides();

                for (var i = 0; i < slides.length; i++) {
                    if (slides[i].getGeoFence()) {
                        geoFences[slides[i].getCodigo()] = slides[i].getGeoFence();
                    }
                }
            }

            geoFences[0] = Dnv.Pl.lastPlaylist.getPlayer().getMetadatos()["GeoFence"];
            
            for (var idSlide in geoFences) {
                var Points = geoFences[idSlide].substr(2, geoFences[idSlide].length - 2);
                var arrayPoints = [];
                for (var j = 0; j < Points.split(',[').length; j++) {

                    var latPoint = parseFloat(Points.split(',[')[j].split(',')[0]);
                    var lonPoint = parseFloat(Points.split(',[')[j].split(',')[1].split(']')[0]);
                    console.log("[" + latPoint + "," + lonPoint + "]");
                    arrayPoints.push([latPoint, lonPoint]);
                }
                zonas[idSlide] = { 'geoFence': arrayPoints, 'estado': 0, "timestamp": 0, "rawGeoFence": geoFences[idSlide]}
            }
            var Points = geoFencePlayer.substr(2, geoFencePlayer.length - 2);
            geoFenceGlobal = [];
            for (var j = 0; j < Points.split(',[').length; j++) {

                var latPoint = parseFloat(Points.split(',[')[j].split(',')[0]);
                var lonPoint = parseFloat(Points.split(',[')[j].split(',')[1].split(']')[0]);
                console.log("GeoFencePlayerPoint " + j + ": [" + latPoint + "," + lonPoint + "]");
                geoFenceGlobal.push([latPoint, lonPoint]);
            }


            Dnv.Variables.estadosGeoFences = zonas;
            clearInterval(initGeoFencesInterval);
        }

    }

    var initGeoFencesInterval = setInterval(initGeoFences, 1000);


    
    // modulo de analisis geoespacial
    var turf = require('@turf/turf');

    // parsear los datos que recibimos
    // los datos vienen en formato NMEA
    var GPS = require('gps');
    var gps = new GPS;
    var inZone = false;

    //Modo de obtencion de datos NMEA (serial, tcp)
    var modoGPS = Dnv.cfg.getCfgString("PlayerHTML5_GPS_Modo", "tcp");

    if (modoGPS.toUpperCase() == "SERIAL") {
        // abrir el puerto RS232 para escuchar al GPS
        var SerialPort = require('serialport');
        var puertoRS232 = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getPantalla().getMetadatos()["Puerto COM"];
        if (puertoRS232.indexOf("COM") != -1 && puertoRS232 != "") {
            try { //Los datos del GPS se reciben a través del puerto /dev/ttyACM, normalmente el 0
                if (puertoRS232.replace("COM", "") == "1" || puertoRS232.replace("COM", "") == "2") {
                    puertoRS232 = '/dev/ttyACM' + (parseInt(puertoRS232.charAt(puertoRS232.length - 1)) - 1).toString();
                } else {
                    puertoRS232 = '/dev/pts/' + puertoRS232.replace("COM", "");
                }
            } catch (error) {
                puertoRS232 = '/dev/ttyACM0';
                console.error("[VARIABLES][GPS] No se ha podido leer el puerto COM. Se usa /dev/ttyACM0 por defecto. Error " + e);
            }
        }
        var port = new SerialPort(puertoRS232, {
            baudRate: 9600,
            parity: 'none',
            stopBits: 1,
            dataBits: 8,
            flowControl: false,
            parser: new SerialPort.parsers.Readline({ delimiter: '\r\n' })
        });

        port.on('data', function (data) {
            gps.updatePartial(data);
        });


    } else if (modoGPS.toUpperCase() == "TCP") { // Datos NMEA por puerto TCP
        
        var net = require('net');
        var puertoTCP = Dnv.cfg.getCfgString("PlayerHTML5_GPS_Server_Port", "2497");
        var ipTCP = Dnv.cfg.getCfgString("PlayerHTML5_GPS_Server_IP", "127.0.0.1");
        var clienteGPS = new net.Socket();
        clienteGPS.connect(puertoTCP, ipTCP, function () {
            console.log('[GPS] Socket Connected');
        });

        clienteGPS.on('data', function (data) {
            gps.updatePartial(data);
        });

        clienteGPS.on('close', function () {
            console.log('[GPS] Socket Desconectado');
            Dnv.monitor.writeLogFile('[GPS] Se ha perdido la conexion al GPS, puerto TCP ' + puertoTCP);
            clienteGPS.setTimeout(10000, function () {
                clienteGPS.connect(puertoTCP, ipTCP);
            })
        });
    }
    

    gps.on('data', function () {
        //console.log("[VARIABLES][GPS] Recibido " + gps.state.lat + ", " + gps.state.lon);
        nowLat = gps.state.lat;
        nowLon = gps.state.lon;
        Dnv.Variables.actualizarValor(1902, gps.state.lat); // 1902 Latitud
        Dnv.Variables.actualizarValor(1903, gps.state.lon); // 1903 Longitud
        if (nowLat == null && nowLon == null) {
            nowLat = 0;
            nowLon = 0;
        }
        //console.log("[GPS] (on.data) Posicion actual: " + nowLat + "," + nowLon);
        var position = [nowLat, nowLon];
        
        isInsideZones = "";
        //Primero evaluamos la zona global

        inZone = isInZone(position, geoFenceGlobal);

        if (inZone || geoFenceGlobal == "") { //Solo evaluamos las zonas de los slides si estoy dentro de la zona global
            Dnv.Variables.actualizarValor(1901, 1); //Dentro
            updateGeoFences(position);
            
        } else {
            Dnv.Variables.actualizarValor(1901, 2);  //Fuera de la zona global
            
        }
        
        Dnv.Variables.estadosGeoFences = zonas;
        Dnv.Variables.actualizarValor(1904, Dnv.Variables.gpsZones); //Zonas activas

    });

    function updateGeoFences(position) {
        var dentroDeAlguna = false;
        var timeNow = Math.round(new Date().getTime() / 1000);
        for (var idSlide in zonas) {
            
            inZone = isInZone(position, zonas[idSlide].geoFence); 

            if (inZone) { //Dentro

                if (timeNow - zonas[idSlide].timestamp > Dnv.Variables.intervalChangeGPSZoneState || zonas[idSlide].timestamp == 0) { //Ha pasado el tiempo de refresco por lo tanto se puede actualizar
                    if (zonas[idSlide].estado == 1 || zonas[idSlide].estado == 0) { //Venimos de Entrando (1) o de primera carga (0)
                        zonas[idSlide].estado = 2; //Dentro
                        zonas[idSlide].timestamp = timeNow;
                        Dnv.Variables.gpsZones += zonas[idSlide].rawGeoFence;
                        dentroDeAlguna = true; //Levantamos el flag si estamos dentro de alguna zona
                        console.log("[GPS] (updateGeoFence) Estoy dentro del area del slide: " + idSlide);
                    } else if (zonas[idSlide].estado == 4 || zonas[idSlide].estado == 3) {  //Venimos de fuera (4) y llevabamos tiempo fuera, tambien si estabamos saliendo (3), pero seguimos dentro despues del intervalo
                        zonas[idSlide].estado = 1; //Entrando
                        zonas[idSlide].timestamp = timeNow;
                        console.log("[GPS] (updateGeoFence) Estoy entrando en el area del slide: " + idSlide);
                    }
                    
                } else { //No se cumple el tiempo de actualizacion
                    if (zonas[idSlide].estado == 4) { //Venimos de fuera (4) pero hemos cambiado de estado hace poco
                        zonas[idSlide].estado = 1; //Entrando
                        zonas[idSlide].timestamp = timeNow;
                        console.log("[GPS] (updateGeoFence) Estoy entrando en el area del slide: " + idSlide);
                    }
                }

            } else { //Fuera

                if (timeNow - zonas[idSlide].timestamp > Dnv.Variables.intervalChangeGPSZoneState || zonas[idSlide].timestamp == 0) { //Ha pasado el tiempo de refresco por lo tanto se puede actualizar
                    if (zonas[idSlide].estado == 3 || zonas[idSlide].estado == 0) { //Venimos de Saliendo (3) o de primera carga (0)
                        zonas[idSlide].estado = 4; //Fuera
                        zonas[idSlide].timestamp = timeNow;
                        Dnv.Variables.gpsZones = Dnv.Variables.gpsZones.replace(zonas[idSlide].rawGeoFence, '');
                        console.log("[GPS] (updateGeoFence) Estoy fuera del area del slide: " + idSlide);

                    } else if (zonas[idSlide].estado == 2 || zonas[idSlide].estado == 1) { //Venimos de dentro (2) y llevabamos tiempo dentro , tambien si estabamos entrando (1), pero seguimos fuera despues del intervalo
                        zonas[idSlide].estado = 3; //Saliendo
                        zonas[idSlide].timestamp = timeNow;
                        console.log("[GPS] (updateGeoFence) Estoy saliendo del area del slide: " + idSlide);
                    }

                } else { //No se cumple el tiempo de actualizacion

                    if (zonas[idSlide].estado == 2) { //Venimos de dentro (2) pero llevamos poco tiempo dentro
                        zonas[idSlide].estado = 3; //Saliendo
                        zonas[idSlide].timestamp = timeNow;
                        console.log("[GPS] (updateGeoFence) Estoy saliendo del area del slide: " + idSlide);
                    }

                }

            }
        }
        if (dentroDeAlguna) {//Si estamos dentro de alguna zona actualizamos la variable global
            Dnv.Variables.actualizarValor(1905, 1);
        } else {
            Dnv.Variables.actualizarValor(1905, 0);
        }

    }


    return {
        getNowPosition: function () {
            return [nowLat, nowLon];
        },
        getEstadoGeoFenceSlide: function (idSlide) {
            return Dnv.Variables.estadosGeoFences[idSlide].estado;
        }
    };

}

Dnv.Variables.AUDIENCIA = function () {
    setInterval(function () {
        Dnv.audiencia.updateCurrentAudience(function (updated) {
            if (updated) {
                // numero de hombres
                Dnv.Variables.actualizarValor(804, Dnv.audiencia.realTimeStatistics.getMaleCount());
                // numero de mujeres
                Dnv.Variables.actualizarValor(805, Dnv.audiencia.realTimeStatistics.getFemaleCount());
                // numero total de personas
                Dnv.Variables.actualizarValor(803, Dnv.audiencia.realTimeStatistics.getTotalCount());
                // porcentaje masculino mirando
                Dnv.Variables.actualizarValor(801, Dnv.audiencia.realTimeStatistics.getPercentMale());
                // porcentaje femenino mirando
                Dnv.Variables.actualizarValor(802, Dnv.audiencia.realTimeStatistics.getPercentFemale());
                // ratio hombres mujeres
                Dnv.Variables.actualizarValor(806, Dnv.audiencia.realTimeStatistics.getRatioMaleFemale());
                // medicion audiencia habilitada
                Dnv.Variables.actualizarValor(800, 1);
                // distancia minima observador
                Dnv.Variables.actualizarValor(807, Dnv.audiencia.realTimeStatistics.getMinDistance());
                // observador cercano hombre
                Dnv.Variables.actualizarValor(831, Dnv.audiencia.realTimeStatistics.getMinDistanceGender() == Dnv.audiencia.GENDER_MALE ? 1 : 0);
                // observador cercano mujer
                Dnv.Variables.actualizarValor(832, Dnv.audiencia.realTimeStatistics.getMinDistanceGender() == Dnv.audiencia.GENDER_FEMALE ? 1 : 0);
                // observador cercano niño
                Dnv.Variables.actualizarValor(833, Dnv.audiencia.realTimeStatistics.getMinDistanceAge() == Dnv.audiencia.AGE_CHILD ? 1 : 0);
                // observador cercano joven
                Dnv.Variables.actualizarValor(834, Dnv.audiencia.realTimeStatistics.getMinDistanceAge() == Dnv.audiencia.AGE_YOUNG ? 1 : 0);
                // observador cercano adulto
                Dnv.Variables.actualizarValor(835, Dnv.audiencia.realTimeStatistics.getMinDistanceAge() == Dnv.audiencia.AGE_ADULT ? 1 : 0);
                // observador cercano senior
                Dnv.Variables.actualizarValor(836, Dnv.audiencia.realTimeStatistics.getMinDistanceAge() == Dnv.audiencia.AGE_SENIOR ? 1 : 0);
                // mayoritario niños general
                Dnv.Variables.actualizarValor(810, Dnv.audiencia.realTimeStatistics.getIsPredominantAudienceGeneral(Dnv.audiencia.AGE_CHILD) ? 1 : 0);
                // mayoritario jovenes general
                Dnv.Variables.actualizarValor(811, Dnv.audiencia.realTimeStatistics.getIsPredominantAudienceGeneral(Dnv.audiencia.AGE_YOUNG) ? 1 : 0);
                // mayoritario adultos general
                Dnv.Variables.actualizarValor(812, Dnv.audiencia.realTimeStatistics.getIsPredominantAudienceGeneral(Dnv.audiencia.AGE_ADULT) ? 1 : 0);
                // mayoritario adultos general
                Dnv.Variables.actualizarValor(813, Dnv.audiencia.realTimeStatistics.getIsPredominantAudienceGeneral(Dnv.audiencia.AGE_SENIOR) ? 1 : 0);
                // emocion predominante
                Dnv.Variables.actualizarValor(840, Dnv.audiencia.realTimeStatistics.getPredominantEmotion());
                // numero de niños
                Dnv.Variables.actualizarValor(815, Dnv.audiencia.realTimeStatistics.getChildMaleCount());
                // numero de niñas
                Dnv.Variables.actualizarValor(816, Dnv.audiencia.realTimeStatistics.getChildFemaleCount());
                // numero de hombres jovenes
                Dnv.Variables.actualizarValor(817, Dnv.audiencia.realTimeStatistics.getYoungAdultMaleCount());
                // numero de mujeres jovenes
                Dnv.Variables.actualizarValor(818, Dnv.audiencia.realTimeStatistics.getYoungAdultFemaleCount());
                // numero de hombres adultos
                Dnv.Variables.actualizarValor(819, Dnv.audiencia.realTimeStatistics.getAdultMaleCount());
                // numero de mujeres adultas
                Dnv.Variables.actualizarValor(820, Dnv.audiencia.realTimeStatistics.getAdultFemaleCount());
                // numero de hombres senior
                Dnv.Variables.actualizarValor(821, Dnv.audiencia.realTimeStatistics.getSeniorMaleCount());
                // numero de mujeres senior
                Dnv.Variables.actualizarValor(822, Dnv.audiencia.realTimeStatistics.getSeniorFemaleCount());
                // mayoritario niños 
                Dnv.Variables.actualizarValor(823, Dnv.audiencia.realTimeStatistics.getIsPredominantAudience(Dnv.audiencia.AGE_CHILD, Dnv.audiencia.GENDER_MALE) ? 1 : 0);
                // mayoritario niñas 
                Dnv.Variables.actualizarValor(824, Dnv.audiencia.realTimeStatistics.getIsPredominantAudience(Dnv.audiencia.AGE_CHILD, Dnv.audiencia.GENDER_FEMALE) ? 1 : 0);
                // mayoritario hombres jovenes 
                Dnv.Variables.actualizarValor(825, Dnv.audiencia.realTimeStatistics.getIsPredominantAudience(Dnv.audiencia.AGE_YOUNG, Dnv.audiencia.GENDER_MALE) ? 1 : 0);
                // mayoritario mujeres jovenes 
                Dnv.Variables.actualizarValor(826, Dnv.audiencia.realTimeStatistics.getIsPredominantAudience(Dnv.audiencia.AGE_YOUNG, Dnv.audiencia.GENDER_FEMALE) ? 1 : 0);
                // mayoritario hombres adultos 
                Dnv.Variables.actualizarValor(827, Dnv.audiencia.realTimeStatistics.getIsPredominantAudience(Dnv.audiencia.AGE_ADULT, Dnv.audiencia.GENDER_MALE) ? 1 : 0);
                // mayoritario mujeres adultas 
                Dnv.Variables.actualizarValor(828, Dnv.audiencia.realTimeStatistics.getIsPredominantAudience(Dnv.audiencia.AGE_ADULT, Dnv.audiencia.GENDER_FEMALE) ? 1 : 0);
                // mayoritario hombres senior 
                Dnv.Variables.actualizarValor(829, Dnv.audiencia.realTimeStatistics.getIsPredominantAudience(Dnv.audiencia.AGE_SENIOR, Dnv.audiencia.GENDER_MALE) ? 1 : 0);
                // mayoritario mujeres senior 
                Dnv.Variables.actualizarValor(829, Dnv.audiencia.realTimeStatistics.getIsPredominantAudience(Dnv.audiencia.AGE_SENIOR, Dnv.audiencia.GENDER_FEMALE) ? 1 : 0);

                // como son prioritarias
                // evaluamos tambien si el slide que estamos mostrando cumple las condiciones, ultimo parametro true
                // Dnv.presentador.avanzarSlideEvaluandoActual();
            }
        })
    }, 2000);
}

Dnv.Variables.init = (function () {

    window.addEventListener(Dnv.NEW_PLAYLIST_EVENT, function ready(evt) {

        evt.currentTarget.removeEventListener(evt.type, ready);

        Dnv.Variables.enabled = Dnv.cfg.getCfgBoolean("VariablesAudienciaHabilitado", true);

        if (Dnv.Variables.enabled) {

            console.info("[VARIABLES][HID] Funcionalidad ACTIVADA");
            Dnv.Variables.HID();

            if (Dnv.cfg.getCfgBoolean("PlayerHTML5_RFID", false)) {
                console.info("[VARIABLES][RFID] Funcionalidad ACTIVADA");
                Dnv.Variables.RFID();
            }
            if (Dnv.cfg.getCfgBoolean("PlayerHTML5_Sensor_Presencia", false)) {
                console.info("[VARIABLES][Sensor_Presencia_GPIO_0] Funcionalidad ACTIVADA");
                Dnv.Variables.GPIO_0();
            }
            if (Dnv.Pl.lastPlaylist.getPlayer().getEntradaMegafonia()) {
                console.info("[VARIABLES][RMX] Funcionalidad ACTIVADA");
                Dnv.Variables.RMX();
            }
            if (Dnv.cfg.getCfgBoolean("MedicionAudienciaHabilitado", false) && !Dnv.cfg.getCfgBoolean("MedicionAudiencia_BigData", true)) {
                console.info("[VARIABLES][AUDIENCIA] Funcionalidad ACTIVADA");
                Dnv.Variables.AUDIENCIA();
            }
            if (Dnv.Pl.lastPlaylist.getPlayer().getMetadatos()["GeoFence"] != "" && Dnv.Pl.lastPlaylist.getPlayer().getMetadatos()["GeoFence"] != undefined) {
                console.info("[VARIABLES][GPS] Funcionalidad ACTIVADA");
                Dnv.Variables.GPS();
            }

        }

    });

})();

Dnv.Variables.cumpleCondicionesDemograficas = function (insercion, aparicion) {

    var condiciones = insercion.getCondicionesDemograficas();

    Dnv.Variables.actualizarValor(1800, 0);
    Dnv.Variables.actualizarValor(1801, 0);
    Dnv.Variables.actualizarValor(1802, 0);

    if (aparicion.getGender() == Dnv.audiencia.GENDER_MALE) {
        Dnv.Variables.actualizarValor(1800, 1);
    } else if (aparicion.getGender() == Dnv.audiencia.GENDER_FEMALE) {
        Dnv.Variables.actualizarValor(1801, 1);
    }
    Dnv.Variables.actualizarValor(1802, aparicion.getAge());

    try {

        if (!condiciones) {
            console.log("[VARIABLES] " + insercion.getDenominacion() + "  no tiene condiciones demograficas");
            console.log("[VARIABLES] Condiciones evaluadas para " + insercion.getDenominacion() + " . Resultado: true");
            return true;
        }

        var evaluacion;
        var variables = condiciones.match(/{[\w\d]+}/g).map(function (value) { return value.substring(1, value.length - 1) });

        for (var k = 0; k < variables.length; k++) {
            var valor;
            var variable = Dnv.Pl.Variables[parseInt(variables[k])];
            condiciones = condiciones.replace("{" + variables[k] + "}", variable.getValor());
        }

        evaluacion = eval(condiciones.replace(/(\r\n|\n|\r)/gm, ""));

        console.log("[VARIABLES] Condiciones demograficas evaluadas para " + insercion.getDenominacion() + " . Resultado: " + evaluacion);
        return evaluacion

    } catch (e) {
        console.error("[VARIABLES] Error al evaluar las condiciones demograficas de: " + insercion.getDenominacion() + " " + e);
        return false;
    }
};

Dnv.Variables.calcularCondiciones = function (slide, soloPrioritarias) {

    if (!Dnv.Variables.enabled) return true;

    var condiciones = slide.getCondiciones();

    try {

        if (!condiciones) {
            if (soloPrioritarias) {
                //console.log("[VARIABLES] " + slide.getDenominacion() + " no tiene condiciones, pero solo evaluamos slides con variables prioritarias, por lo tanto se omite");
                //console.log("[VARIABLES] Condiciones evaluadas para " + slide.getDenominacion() + " . Resultado: false");
                return false;
            } else {
                //console.log("[VARIABLES] " + slide.getDenominacion() + "  no tiene condiciones");
                console.log("[VARIABLES] Condiciones evaluadas para " + slide.getDenominacion() + " . Resultado: true");
                return true;
            }
        }

        var prioritarias = false;
        var evaluacion;
        var variables = condiciones.match(/{[\w\d]+}/g).map(function (value) { return value.substring(1, value.length - 1) });

        for (var k = 0; k < variables.length; k++) {
            var valor;
            var variable = Dnv.Pl.Variables[parseInt(variables[k])];
            if (variable.getPrioridad() == 1) {
                prioritarias = true;
            }
            if (variable.getCodigo() == 1900 && Dnv.Variables.estadosGeoFences[0]) { //Si el GPS esta activo (0 != null), el valor de la variable se lee desde el propio array de las geofences
                condiciones = condiciones.replace("{" + variables[k] + "}", Dnv.Variables.estadosGeoFences[slide.getCodigo()].estado);
            } else {
                condiciones = condiciones.replace("{" + variables[k] + "}", variable.getValor());
            }
            
        }

        if (soloPrioritarias) {
            if (prioritarias) {
                evaluacion = eval(condiciones.replace(/(\r\n|\n|\r)/gm, ""));
            } else {
                evaluacion = false;
                //console.log("[VARIABLES] " + slide.getDenominacion() + " no tiene variables prioritarias. Solo evaluamos prioritarias, por lo tanto se omite");
            }
        } else {
            evaluacion = eval(condiciones.replace(/(\r\n|\n|\r)/gm, ""));
        }
        //Si es un slide con GeoFence hablitado comprobamos si se encuentra en su zona 
        if (slide.getGeoFence() != "") {
            console.log("[SLIDE] GeoFence: " + slide.getGeoFence());
            var actualZones = Dnv.Variables.gpsZones;
            var slideZone = slide.getGeoFence().split("[")[1].split("],")[0] + "]";
            if (actualZones.indexOf(slideZone) == -1) {
                evaluacion = false;
            }
        }
        if (evaluacion) console.log("[VARIABLES] Condiciones evaluadas para " + slide.getDenominacion() + " . Resultado: " + evaluacion);
        return evaluacion

    } catch (e) {
        console.error("[VARIABLES] Error al evaluar las condiciones de: " + slide.getDenominacion() + " " + e);
        return false;
    }
};

Dnv.Variables.actualizarValor = function (variable, valor) {

    try {
        var variable = Dnv.Pl.Variables[parseInt(variable)];
        if (variable) {
            variable.setValor(valor);
            Dnv.Pl.Variables[parseInt(variable)] = variable;
            if (variable.getPrioridad() == 1) {
                /*
                * Un cambio de variables prioritarias provocar que se evalue si el slide
                * actual cumple las condiciones y si no, que avance de slide
                */
                if (Dnv.secuenciador.getSlideActual()) {
                    Dnv.presentador.avanzarSlideEvaluandoActual();
                }

            }
        }
    } catch (e) {
        console.error("[VARIABLES] No se ha podido actualizar el valor de: " + variable + " :" + e);
    }

};

Dnv.Variables.isPrioritaria = function (codigo) {
    var variable = Dnv.Pl.Variables[parseInt(codigo)];
    if (variable && variable.getPrioridad() == 1) {
        return true;
    } else {
        return false;
    }
};