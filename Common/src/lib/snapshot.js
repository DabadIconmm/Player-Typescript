"use strict";

var Dnv = Dnv || {};

Dnv.snapshot = (function () {

    var SERVER_URL = ""; //IPMASTER
    var SERVER_PORT = "8090";
    var OBJID = 0;
    var segundosTimer;
    var timerEnabled = false;
    var timerCapture;

    //--- settings
    //SegundosTimerRemoteSnapshot
    //RemoteSnapshotEnabled
    //RemoteBigSnapshotEnabled

    var onGetRemoteSnapshotRequestError = function () {
        //console.error("[SNAPSHOT]: onGetRemoteSnapshotRequestError");
        /*if (timerEnabled) {
        clearInterval(timerCapture);
        timerCapture = setInterval(requestRemoteSnapshot, segundosTimer * 1000);
        }*/
    };

    var onGetRemoteSnapshotRequestSuccess = function (result) {
        console.log("[SNAPSHOT]: onGetRemoteSnapshotRequestSuccess. Respuesta: " + result);

        /*if (timerEnabled) {
        clearInterval(timerCapture);
        timerCapture = setInterval(requestRemoteSnapshot, segundosTimer * 1000);
        }*/

        if (result == "true") {
            //captura y subida del fichero
            if (Dnv.takeAndSendSnapshot) {
                Dnv.takeAndSendSnapshot(onUploadSnapShotSuccess, onUploadSnapShotError);
            } else { // Browser
                console.warn("Este player no soporta subida de capturas de pantalla");
            }
        }
    };

    var onUploadSnapShotSuccess = function () {
        console.log("[SNAPSHOT]: onUploadSnapShotSuccess");
    };

    var onUploadSnapShotError = function () {
        console.error("[SNAPSHOT]: onUploadSnapShotError");
    };

    var requestRemoteSnapshot = function () {
        Dnv.snapshot.checkRemoteSnapshotRequest(onGetRemoteSnapshotRequestSuccess, onGetRemoteSnapshotRequestError);
    };

    return {

        startTimerSnapshot: function startTimerSnapshot(successCb, errorCb) {

            if (Dnv.cfg.getCfgBoolean("RemoteSnapshotEnabled") == false) {
                console.warn("[SNAPSHOT]: RemoteSnapshotEnabled = false. No iniciamos los timers.");
                timerEnabled = false;
                return;
            }

            //configuramos
            SERVER_URL = Dnv.cfg.getCfgString("IPMaster", Dnv.deviceInfo.ipServer());

            segundosTimer = Dnv.cfg.getCfgInt("SegundosTimerRemoteSnapshot", 30);
            timerEnabled = true;

            console.log("[SNAPSHOT]: iniciamos timer (" + segundosTimer + "s)... ");


            if (timerCapture) clearTimeout(timerCapture);

            function fecthSnapshot() {

                requestRemoteSnapshot();

                if (Dnv.cfg.getCfgBoolean("Manager_ModoDeterminista_Enabled", false)) {
                    timerCapture = setTimeout(fecthSnapshot, Dnv.utiles.getIntervalPeticionDeterminista(Dnv.cfg.getCfgInt("MyOwnCode", 0), segundosTimer));
                } else {
                    timerCapture = setTimeout(fecthSnapshot,segundosTimer*1000);
                }
            }

            timerCapture = setTimeout(fecthSnapshot, segundosTimer * 1000);

            //timerCapture = setInterval(requestRemoteSnapshot, segundosTimer * 1000);

            //requestRemoteSnapshot(); No inmediatamente, para dar tiempo a cargar playlist y tener objid de salida
        },

        stopTimerSnapshot: function stopTimerSnapshot() {
            console.warn("[SNAPSHOT]: detenemos timer.");
            clearTimeout(timerCapture);
            timerCapture = null;
            timerEnabled = false;
        },

        checkRemoteSnapshotRequest: function checkRemoteSnapshotRequest(callback, errorCallback) {

            function errHandler(e) {
                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.error("[SNAPSHOT]: Error al pedir a RemoteSnapshotRequest: " + e);
                    //console.trace();
                }
                if (errorCallback) errorCallback(e);
            }

            function handler() {
                if (this.readyState === this.DONE) {

                    if (this.status === 200) {
                        //console.log("[SNAPSHOT]: Respuesta a la peticion de RemoteSnapshotRequest: " + this.responseXML);

                        if (this.responseXML) {
                            var res;
                            try {
                                res = this.responseXML.getElementsByTagName("RemoteSnapshotRequestResult")[0].childNodes[0].nodeValue;
                                if (callback) callback(res);
                            } catch (e) {
                                errHandler("[SNAPSHOT]: Error en la respuesta del servidor a la petición de RemoteSnapshotRequest: " + e + " " + e.filename + ":" + e.lineno + " " + e.message);
                                //errHandler("[SNAPSHOT]: No se recibió RemoteSnapshotRequest");
                            }
                        } else {
                            errHandler("[SNAPSHOT]: Respuesta no válida del servidor a la petición de RemoteSnapshotRequest: (" + this.responseXML + ")");
                        }
                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                    }
                }
            }

            try {
                OBJID = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getCodigo();
            } catch (e) {
                errHandler("[SNAPSHOT]: No podemos obtener el codigo de la salida. ")
                return;
            }

            //clearInterval(timerCapture);

            var client = new XMLHttpRequest();
            client.onreadystatechange = handler;
            client.onerror = errHandler;
            client.timeout = 10000;
            client.ontimeout = function () { errHandler("Timed out en la petición a RemoteSnapshotRequest!!!"); };

            //client.open("POST", "http://" + SERVER_URL + ":8090/Servicios/RemoteSnapshotRequest");
            var url = Dnv.cfg.getCfgString("FileTransferClientEndPointAddressWeb", Dnv.cfg.getDefaultWcfServerAddress() + "/Servicios/WebFileTransfer") + "/RemoteSnapshotRequest"
            client.open("POST", url);
            var xml = '<RemoteSnapshotRequest xmlns="http://tempuri.org/" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><objId>' + OBJID + '</objId></RemoteSnapshotRequest>';

            client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

            console.log("[SNAPSHOT] Pedimos a " + url + " con ObjectID " + OBJID.toString());

            client.send(xml);
        }
    };
})();