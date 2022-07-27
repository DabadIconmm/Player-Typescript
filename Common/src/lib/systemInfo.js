"use strict";


var Dnv = Dnv || {};


Dnv.systemInfo = (function () {
    // Se manda cada 24horas, y lo suyo seria en cada cambio de ip tambien...
    var _timer;
    //var SERVER_URL = ""; //IPMASTER
    //var timerEnabled = false;
    var SEGUNDOS_TIMER = 24 * 60 * 60;


    var MBS_MINIMOS_LIBRES = 400;
    // Tiene prioridad sobre el setting PorcentajeMinimoEspacioLibre, porque el setting es 5 por defecto
    var PORCENTAJE_MINIMO_LIBRE = 10;

    function getSystemInfo(sucessCb) {
        function buildSystemInfo() {
            var playerVersion = "Player HTML5 (" + Dnv.version + ")";

            var flashVersion = "";
            var flashPlugin = Dnv.utiles.getFlashPlugin(); // (typeof navigator.plugins == "undefined" || navigator.plugins.length == 0) ? !!(new ActiveXObject("ShockwaveFlash.ShockwaveFlash")) : navigator.plugins["Shockwave Flash"];
            if (flashPlugin) { // "Shockwave Flash 17.0 r0" A traves de un objeto Object podriamos sacar datos de versión mas detallados
                flashVersion = flashPlugin.description + " " + flashPlugin.filename;
            }

            var teamViewer = "-";
            if (Dnv.deviceInfo.teamViewer) teamViewer = Dnv.deviceInfo.teamViewer();

            var ram = "-";
            if (Dnv.deviceInfo.ram && Dnv.deviceInfo.ram() != "") ram = Dnv.utiles.floatToInt(Dnv.deviceInfo.ram() / (1024 * 1024)) + " MB";

            var systemInfo = "";
            systemInfo += '<?xml version="1.0"?>';
            systemInfo += '<systemInfo xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\n';
            systemInfo += '\n';
            systemInfo += '<!-- Dispositivo -->\n';
            systemInfo += '<NombrePC>' + (Dnv.deviceInfo.hostName ? Dnv.deviceInfo.hostName() : Dnv.deviceInfo.modelName()) + ' ' + Dnv.deviceInfo.serialNumber() + '</NombrePC>\n';
            systemInfo += '<OSVersion>' + (Dnv.deviceInfo.osVersion ? Dnv.deviceInfo.osVersion() : Dnv.deviceInfo.modelName() + ' ' + Dnv.deviceInfo.firmwareVersion()) + '</OSVersion>\n';
            systemInfo += '<ProcessorDescription><![CDATA[' + Dnv.deviceInfo.cpu() + ']]></ProcessorDescription>\n';
            systemInfo += '<MemoriaRam>' + ram + '</MemoriaRam>\n';
            systemInfo += '<TarjetaGrafica><![CDATA[' + (Dnv.deviceInfo.graphicCard ? Dnv.deviceInfo.graphicCard() : "-") + ']]></TarjetaGrafica>\n';
            systemInfo += '\n';
            systemInfo += '\n';
            systemInfo += '<!-- Pantalla -->\n';
            systemInfo += '<NumScreens>1</NumScreens>\n';
            systemInfo += '<PrimaryScreenName></PrimaryScreenName>\n';
            systemInfo += '<PrimaryScreenWidth>' + Dnv.deviceProperties.getWidth() + '</PrimaryScreenWidth>\n';
            systemInfo += '<PrimaryScreenHeight>' + Dnv.deviceProperties.getHeight() + '</PrimaryScreenHeight>\n';
            systemInfo += '\n';
            systemInfo += '\n';
            systemInfo += '<!-- Almacenamiento -->\n';
            systemInfo += '<SystemDriveLabel></SystemDriveLabel>\n';
            systemInfo += '<SystemDriveLetter></SystemDriveLetter>\n';

            // Los datos vienen en bytes 
            var espacioTotal = Dnv.utiles.floatToInt(Dnv.deviceInfo.totalStorage() / (1024 * 1024)) + " MB";
            var espacioLibre = Dnv.utiles.floatToInt(Dnv.deviceInfo.freeStorage() / (1024 * 1024)) + " MB";
            systemInfo += '<SysteDriveTotalSpace>' + espacioTotal + '</SysteDriveTotalSpace>\n';
            systemInfo += '<SystemDriveFreeSpace>' + espacioLibre + '</SystemDriveFreeSpace>\n';
            var porcent = (new String(Dnv.deviceInfo.freeStorage() / Dnv.deviceInfo.totalStorage() * 100)).replace(".", ",");
            systemInfo += '<SystemDrivePercentFreeSpace>' + porcent + '</SystemDrivePercentFreeSpace>\n';
            systemInfo += '<SystemDriveFormat>' + (Dnv.deviceInfo.driveFormat ? Dnv.deviceInfo.driveFormat() : "-") + '</SystemDriveFormat>\n';

            systemInfo += '<ResourcesDriveFreeSpace>' + espacioLibre + '</ResourcesDriveFreeSpace>\n';
            systemInfo += '<SystemDriveLetterList />\n';
            systemInfo += '<SystemDriveLabelList />\n';
            systemInfo += '<SystemDriveTotalSpaceList />\n';
            systemInfo += '<SystemDriveFreeSpaceList />\n';
            systemInfo += '<SystemDrivePercentFreeSpaceList />\n';
            systemInfo += '<SystemDriveFormatList />\n';

            systemInfo += '\n';
            systemInfo += '\n';

            var valor;
            systemInfo += '<!-- Red -->\n';
            valor = Dnv.deviceInfo.activeMacAddress();
            systemInfo += '<MacAddress>' + (valor ? valor : "-") + '</MacAddress>\n';
            valor = Dnv.deviceInfo.activeNetworkInterfaceName();
            systemInfo += '<NetworkInterfaceName>' + (valor ? valor : "-") + '</NetworkInterfaceName>\n';
            valor = Dnv.deviceInfo.activeNetworkInterfaceType();
            systemInfo += '<NetworkInterfaceType>' + (valor ? valor : "-") + '</NetworkInterfaceType>\n';
            valor = Dnv.deviceInfo.activeIpAddress();
            systemInfo += '<NetworkInterfaceIP>' + (valor ? valor : "-") + '</NetworkInterfaceIP>\n';

            systemInfo += '<NetworkInterfaceSpeed>-</NetworkInterfaceSpeed>\n';
            valor = Dnv.deviceInfo.activeGatewayAddress();
            systemInfo += '<NetworkInterfaceGateway>' + (valor ? valor : "-") + '</NetworkInterfaceGateway>\n';
            valor = Dnv.deviceInfo.activeDns1Address();
            systemInfo += '<NetworkInterfaceDNS1>' + (valor ? valor : "-") + '</NetworkInterfaceDNS1>\n';
            valor = Dnv.deviceInfo.activeDns2Address();
            systemInfo += '<NetworkInterfaceDNS2>' + (valor ? valor : "-") + '</NetworkInterfaceDNS2>\n';
            valor = Dnv.deviceInfo.activeNetworkMask();
            systemInfo += '<NetworkInterfaceMask>' + (valor ? valor : "-") + '</NetworkInterfaceMask>\n';
            systemInfo += '\n';
            systemInfo += '\n';
            systemInfo += '<!-- Versiones y datos varios-->\n';
            systemInfo += '<IEVersion>' + navigator.userAgent + '</IEVersion>\n';
            systemInfo += '<WMPVersion>-</WMPVersion>\n';
            systemInfo += '<FlashVersion>' + flashVersion + '</FlashVersion>\n';
            systemInfo += '<SalidaPantallaVersion>' + playerVersion + '</SalidaPantallaVersion>\n';
            systemInfo += '<SalidaAudioVersion>' + playerVersion + '</SalidaAudioVersion>\n';
            systemInfo += '<ManagerVersion>' + playerVersion + '</ManagerVersion>\n';
            systemInfo += '<DenevaCloudVersion>' + playerVersion + '</DenevaCloudVersion>\n';
            systemInfo += '<AlarmasVersion>' + playerVersion + '</AlarmasVersion>\n';
            systemInfo += '<DenevaServiceVersion>' + playerVersion + '</DenevaServiceVersion>\n';
            systemInfo += '<AvisosVersion>' + playerVersion + '</AvisosVersion>\n';
            systemInfo += '<CloudP2PVersion>-</CloudP2PVersion>\n';
            systemInfo += '<CloudHttpVersion>' + playerVersion + '</CloudHttpVersion>\n';
            systemInfo += '<TDTSyncVersion>' + playerVersion + '</TDTSyncVersion>\n';
            systemInfo += '<DenevaUpdateVersion>' + playerVersion + '</DenevaUpdateVersion>\n';
            systemInfo += '<LicencesServerVersion>' + playerVersion + '</LicencesServerVersion>\n';
            systemInfo += '<PlayerTesterVersion>-</PlayerTesterVersion>\n';
            systemInfo += '<AssistantVersion>-</AssistantVersion>\n';
            systemInfo += '<SoporteVersion>-</SoporteVersion>\n';
            systemInfo += '<SoporteServidorVersion>-</SoporteServidorVersion>\n';
            systemInfo += '<Controles></Controles>\n';
            systemInfo += '<Dlls></Dlls>\n';
            systemInfo += '<ScreenShotServiceVersion>-</ScreenShotServiceVersion>\n';
            systemInfo += '<TranscodingServiceVersion>-</TranscodingServiceVersion>\n';
            systemInfo += '<CaptureFlashVersion>-</CaptureFlashVersion>\n';
            systemInfo += '<FFmpegVersion>-</FFmpegVersion>\n';
            systemInfo += '<VolSalia1>-</VolSalia1>\n';
            systemInfo += '<VolSalia2>-</VolSalia2>\n';
            systemInfo += '<VolSalia3>-</VolSalia3>\n';
            systemInfo += '<VolManual>-</VolManual>\n';
            systemInfo += '<VLCVersion>-</VLCVersion>\n';
            systemInfo += '<FlashVideoLoader>-</FlashVideoLoader>\n';
            systemInfo += '<ObjID>' + Dnv.cfg.getObjectId() + '</ObjID>\n';
            systemInfo += '<CodDispositivo>' + Dnv.cfg.getCfgInt("info_code", 0) + '</CodDispositivo>\n';
            systemInfo += '<ParcheDescargado>0</ParcheDescargado>\n';
            systemInfo += '<FechasLastDescargado>-</FechasLastDescargado>\n';
            systemInfo += '<FechasLastInstalado>-</FechasLastInstalado>\n';
            systemInfo += '<VersionPlayer>' + playerVersion + '</VersionPlayer>\n';
            systemInfo += '<IdentificadorPlayer>-</IdentificadorPlayer>\n';
            systemInfo += '<TeamViewer>' + teamViewer + '</TeamViewer>\n';
            systemInfo += '<ParcheInstaladoVersion>' + version + '</ParcheInstaladoVersion>\n';
            systemInfo += '<ParcheDescargadoVersion>-</ParcheDescargadoVersion>\n';
            systemInfo += '\n';
            systemInfo += '\n';
            systemInfo += '<DU_UltimoPaqueteDescargadoVersion>-</DU_UltimoPaqueteDescargadoVersion>\n';
            systemInfo += '<DU_FechaUltimoPaqueteDescargado>-</DU_FechaUltimoPaqueteDescargado>\n';
            systemInfo += '<DU_UltimoPaqueteInstaladoVersion>' + playerVersion + '</DU_UltimoPaqueteInstaladoVersion>\n';
            systemInfo += '<DU_FechaUltimoPaqueteInstalado>-</DU_FechaUltimoPaqueteInstalado>\n';
            systemInfo += '\n';
            systemInfo += '\n';
            systemInfo += '<!-- Codecs (la seccion de android añade los tipos soportados) -->\n';
            systemInfo += '<Codecs></Codecs>\n';
            systemInfo += '<CodecPaks></CodecPaks>\n';
            systemInfo += '\n';
            systemInfo += '\n';
            systemInfo += '<!-- Zona Horaria -->\n';
            var tzOffset = -new Date().getTimezoneOffset(); // CEST (UTC+2) viene como -120, con lo que lo cambiamos de signo
            // El - del negativo ya esta incluido en formatearMinutos
            systemInfo += '<ZonaHoraria>(' + (tzOffset >= 0 ? "+" : "") + Dnv.utiles.formatearMinutos(tzOffset) + ')</ZonaHoraria>\n'; // TODO: podemos usar librerias para una detección más precisa https://bitbucket.org/pellepim/jstimezonedetect
            // Convendría hacer una seccion SoC
            systemInfo += '<SoC>\n'
            if (Dnv.date_helper_lg) {
                systemInfo += '<webOS>\n'
                systemInfo += '<ZonaHorariaLg>' + (JSON.stringify(Dnv.date_helper_lg.getLgTimezone())) + '</ZonaHorariaLg>\n';
                systemInfo += '<NtpActivado>' + (JSON.stringify(Dnv.date_helper_lg.getLgNtpActivado())) + '</NtpActivado>\n';
                systemInfo += '<ServidoresNtp>' + (JSON.stringify(Dnv.date_helper_lg.getLgServidorNtp())) + '</ServidoresNtp>\n';
                systemInfo += '<ServerProperty>' + (JSON.stringify(Dnv.deviceInfo.lgServerProperty())) + '</ServerProperty>\n';
                systemInfo += '</webOS>\n'
            }

            if (Main.info.engine === "TIZEN") {
                systemInfo += '<tizen>\n'
                systemInfo += '<UrlApplication>' + (Dnv.deviceInfo.urlApplication()) + '</UrlApplication>\n';
                if (Dnv.date_helper_tizen) {
                    systemInfo += '<ZonaHorariaTizen>' + (JSON.stringify(Dnv.date_helper_tizen.getTizenTimezone())) + '</ZonaHorariaTizen>\n';
                    systemInfo += '<NtpActivado>' + (JSON.stringify(Dnv.date_helper_tizen.getTizenNtpActivado())) + '</NtpActivado>\n';
                    systemInfo += '<ServidoresNtp>' + (JSON.stringify(Dnv.date_helper_tizen.getTizenServidorNtp())) + '</ServidoresNtp>\n';
                }
                systemInfo += '</tizen>\n'
            }
            systemInfo += '</SoC>\n';
            systemInfo += '\n';
            systemInfo += '\n';
            // CAR: Lo siguiente parece especifico de Windows/.NET Android no lo envía
            //systemInfo += '<CurrentCulture>-</CurrentCulture>\n';
            //systemInfo += '<CurrentUICulture>-</CurrentUICulture>\n'; 
            //systemInfo += '<DateFormat>-</DateFormat>\n';
            systemInfo += '</systemInfo>\n';
            return systemInfo;
        }

        if (sucessCb) {
            Dnv.deviceInfo.update(function () { sucessCb(buildSystemInfo()); });
        }
    };

    function escapeXml(xml) {
        return xml.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&apos;');
    };
    function sendSystemInfo(systemInfo, successCb, errorCb) {

        function errHandler(e) {
            if (Dnv.utiles.debeLoguearFallosDeRed()) {
                console.error("[SYSTEMINFO]: Error al enviar el SystemInfo: " + e);
            }
            if (errorCb) errorCb(e);
        }

        function handler() {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {

                    //console.log("[SNAPSHOT]: Respuesta a la peticion de RemoteSnapshotRequest: " + this.responseXML);

                    if (this.responseXML) {
                        var res;
                        try {
                            res = this.responseXML.getElementsByTagName("SetSystemInfoResult")[0].childNodes[0].nodeValue;
                            if (successCb) successCb(res);
                        } catch (e) {
                            errHandler("[SYSTEMINFO]: Error en la respuesta del servidor al SystemInfo: " + e + " " + e.filename + ":" + e.lineno + " " + e.message);
                            //errHandler("[SNAPSHOT]: No se recibió RemoteSnapshotRequest");
                        }
                    } else {
                        errHandler("[SYSTEMINFO]: Respuesta no válida del servidor a la petición de SystemInfo: (" + this.responseXML + ")");
                    }
                } else {
                    errHandler("Error HTTP: " + this.statusText);
                }
            }
        }

        var objId = Dnv.cfg.getObjectId();

        //clearInterval(_timer);

        var client = new XMLHttpRequest();
        client.onreadystatechange = handler;
        client.onerror = errHandler;
        client.timeout = 45000;
        client.ontimeout = function () { errHandler("Timed out en el envio de SystemInfo!!!"); };

        //client.open("POST", "http://" + SERVER_URL + ":8090/Servicios/RemoteSnapshotRequest");
        // FIXME

        var url = Dnv.cfg.getCfgString("LogsClientEndPointAddressWeb", Dnv.cfg.getDefaultWcfServerAddress() + "/Servicios/WebLogs") + "/SetSystemInfo";
        client.open("POST", url);
        var xml = '<SetSystemInfo xmlns="http://tempuri.org/" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><ObjectId>' + objId + '</ObjectId><SystemInfo>' + escapeXml(systemInfo) + '</SystemInfo></SetSystemInfo>';

        client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

        console.log("[SYSTEMINFO] Enviamos a " + url + " con ObjectID " + objId.toString());

        client.send(xml);
    };

    function getAndSendSystemInfo() {
        getSystemInfo(sendSystemInfo);
    };


    var _estadoConectividadPid = undefined;
    var _estadoConectividadConfiguracion = undefined;
    var _estadoConectividadPlaylist = undefined;
    var _estadoConectividadLicencia = undefined;
    var _estadoConectividadAlarmas = undefined;
    var _timestampLastPidOk = new Date().getTime();
    var _timestampLastPlaylistOk = new Date().getTime();
    //var _timestampLastComandosRecibidosOk = null;
    function _logIfErroresConexion(msg) { // FIXME: _timestampLastPidOk no se actualiza porque no hay petición de PID
        var limite = 30 * 60 * 1000; // 30 min
        var ahora = new Date().getTime();
        if (_timestampLastPidOk && (ahora - _timestampLastPidOk) < limite &&
                _timestampLastPlaylistOk && (ahora - _timestampLastPlaylistOk) > limite) {
            Dnv.servidor.logInServerLog(msg);
        }
    }

    var _ultimoEstadoConectividad = undefined;
    var _conectividadCallbacks = [];
    function _onPosibleCambioConectividad() {
        var estado = Dnv.systemInfo.isConConexionAlServidor();
        if (_ultimoEstadoConectividad !== estado) {
            _ultimoEstadoConectividad = estado;
            for (var i = 0; i < _conectividadCallbacks.length; i++) {
                _conectividadCallbacks[i](estado);
            }
        }
    };

    return {
        startTimerSystemInfo: function startTimerSystenInfo(successCb, errorCb) {

            //SERVER_URL = Dnv.cfg.getCfgString("IPMaster", "");

            //timerEnabled = true;
            if (_timer) clearTimeout(_timer);
            _timer = null;
            /*if (timerEnabled)*/_timer = setInterval(getAndSendSystemInfo, SEGUNDOS_TIMER * 1000);

            console.log("[SYSTEMINFO]: iniciamos timer (" + SEGUNDOS_TIMER + "s)... ");
            getAndSendSystemInfo();
        },
        // Cuando la IP (u otro dato) de la máquina cambie, deberiamos actualizar manualmente la información del servidor...
        updateAndSend: function updateAndSend() {
            getAndSendSystemInfo();
        },
        stopTimerSystemInfo: function stopTimerSystemInfo() {
            console.error("[SYSTEMINFO]: detenemos timer.");
            if (_timer) clearInterval(_timer);
            _timer = null;
            //timerEnabled = false;
        },
        //DEBUGGetAndSend: function () { getSystemInfo(function (si) { console.log("vamos a enviar " + sendSystemInfo); sendSystemInfo(si) }); }
        getEstadoConectividadPid: function () { return _estadoConectividadPid; },
        setEstadoConectividadPid: function (value) {
            _estadoConectividadPid = value;
            if (value === "OK") _timestampLastPidOk = new Date().getTime();
            _onPosibleCambioConectividad();
        },

        getEstadoConectividadConfiguracion: function () { return _estadoConectividadConfiguracion; },
        setEstadoConectividadConfiguracion: function (value) {
            _estadoConectividadConfiguracion = value;
            if (value !== "OK") _logIfErroresConexion("cfg_" + value);
            _onPosibleCambioConectividad();
        },
        getEstadoConectividadPlaylist: function () { return _estadoConectividadPlaylist; },
        setEstadoConectividadPlaylist: function (value) {
            _estadoConectividadPlaylist = value;
            if (value !== "OK") _logIfErroresConexion("playlist_" + value);
            else _timestampLastPlaylistOk = new Date().getTime();
            _onPosibleCambioConectividad();
        },
        getEstadoConectividadLicencia: function () { return _estadoConectividadLicencia; },
        setEstadoConectividadLicencia: function (value) {
            _estadoConectividadLicencia = value;
            if (value !== "OK") _logIfErroresConexion("licencia_" + value);
            _onPosibleCambioConectividad();
        },
        getEstadoConectividadAlarmas: function () { return _estadoConectividadAlarmas; },
        setEstadoConectividadAlarmas: function (value) {
            _estadoConectividadAlarmas = value;
            if (value !== "OK") _logIfErroresConexion("alarmas_" + value);
            _onPosibleCambioConectividad();
        },
        isConConexionAlServidor: function () {
            if (
                    // No se usa Dnv.systemInfo.getEstadoConectividadPid() === undefined || Dnv.systemInfo.getEstadoConectividadPid() === "OK" ||
                    Dnv.systemInfo.getEstadoConectividadConfiguracion() === undefined || Dnv.systemInfo.getEstadoConectividadConfiguracion() === "OK" ||
                    Dnv.systemInfo.getEstadoConectividadPlaylist() === undefined || Dnv.systemInfo.getEstadoConectividadPlaylist() === "OK" ||
                    // Últimamente la peticion de licencias es cada 8 horas, por tanto no es fiable como indicador de conectividad
                    // Dnv.systemInfo.getEstadoConectividadLicencia() === undefined || Dnv.systemInfo.getEstadoConectividadLicencia() === "OK" ||
                    Dnv.systemInfo.getEstadoConectividadAlarmas() === undefined || Dnv.systemInfo.getEstadoConectividadAlarmas() === "OK") {
                // O bien no tenemos la informacion de algun elemento, o hay alguno online...
                return true;
            }
            // Parece que no hay conexión con el top master
            return false;
        },
        addCambioEstadoConexionServidorCallback: function (callback) {
            _conectividadCallbacks.push(callback);

        },
        isConPocoEspacioEnDisco: function (callback) {
            Dnv.deviceInfo.update(function onDeviceInfoActualizado() {
                // Los datos vienen en B, los pasamos a MBs
                var espacioTotal = Dnv.deviceInfo.totalStorage() / (1024 * 1024);
                var espacioLibre = Dnv.deviceInfo.freeStorage() / (1024 * 1024);
                var porcent = espacioLibre / espacioTotal * 100;
                var porcentMinimo = Dnv.cfg.getCfgInt("PorcentajeMinimoEspacioLibre", PORCENTAJE_MINIMO_LIBRE);
                if (porcentMinimo < PORCENTAJE_MINIMO_LIBRE) { // Por defecto suele ser 5... que es un valor demasiado bajo para los SoC
                    porcentMinimo = PORCENTAJE_MINIMO_LIBRE;
                }

                if (espacioLibre < MBS_MINIMOS_LIBRES || porcent < porcentMinimo) {
                    if (callback) callback(true, espacioLibre, porcent);
                } else {
                    if (callback) callback(false, espacioLibre, porcent);
                }
            });

        }
    };
})();