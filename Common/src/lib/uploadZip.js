
"use strict";

var Dnv = Dnv || {};


Dnv.uploadZip = (function () {

    function _uploadLogsZip(datos, filename, url, successCallback, errorCallback) {
        // datos es uint8array
        try {
            //sube el fichero 'filePath' al metodo 'webMethod' de IDNVService en la ip 'destino'

            var handler = function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        console.log("[UPLOAD_ZIP] Zip enviado, estado: [" + this.status + " " + this.statusText + "]");
                        if (successCallback) successCallback();
                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                    }
                }
            };

            if (filename.lastIndexOf(".zip") === filename.length - 4) {
                // Se manda sin extension
                filename = filename.substring(filename, filename.length - 4);
            }

            /*
            * El manejo de errores salta varias veces.
            * Uno del client.onerror, otro de respuesta nula   
            */
            var errorManejado = false;
            var errHandler = function errHandler(e) {
                if (errorManejado) return; // No lo manejamos 2 veces

                errorManejado = true;
                console.error("[UPLOAD_ZIP] Error al enviar el zip de logs: " + e);
                if (errorCallback) errorCallback();
            };
            var xhr = new XMLHttpRequest;

            xhr.onreadystatechange = handler;
            xhr.onerror = errHandler;
            xhr.timeout = 30000;
            xhr.ontimeout = function () { errHandler("[UPLOAD_ZIP] Timed out al enviar logs!!!"); };

            xhr.open("POST", url);
            xhr.setRequestHeader('Content-Type', 'application/zip');
            xhr.setRequestHeader("FileName", filename);
            xhr.send(datos);

        } catch (e) {
            console.error("[UPLOAD_ZIP] No se pudo enviar el fichero de log " + e);
            Dnv.monitor.writeLogFile("[UPLOAD_ZIP] No se pudo enviar el fichero de log " + e, LogLevel.Error);
            if (errorCallback) errorCallback();
        }
    };

    function _uploadAuditoriaZip(datosBase64, filename, endpointUrl, successCallback, errorCallback) {
        // datos es uint8array
        try {
            //sube el fichero 'filePath' al metodo 'webMethod' de IDNVService en la ip 'destino'

            var handler = function handler() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        console.log("[UPLOAD_ZIP] Zip enviado, estado: [" + this.status + " " + this.statusText + "]");
                        if (successCallback) successCallback();
                    } else {
                        errHandler("Error HTTP: " + this.statusText);
                    }
                }
            };
            /*
            * El manejo de errores salta varias veces.
            * Uno del client.onerror, otro de respuesta nula   
            */
            var errorManejado = false;
            var errHandler = function errHandler(e) {
                //console.log(this.readyState);
                if (errorManejado) return; // No lo manejamos 2 veces

                errorManejado = true;
                console.error("[UPLOAD_ZIP] Error al enviar el zip de auditoria: " + e);
                if (errorCallback) errorCallback();
            };

            var url = endpointUrl + "/SetAuditoriaZip";
            var xml = '<SetAuditoriaZip ' +
                    'xmlns="http://tempuri.org/" ' +
                    'xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" ' +
                    'xmlns:i="http://www.w3.org/2001/XMLSchema-instance" >' +
                    '<filename>' + filename + '</filename>' +
		            '<file>' + datosBase64 + '</file>' +
                '</SetAuditoriaZip>';

            var xhr = new XMLHttpRequest;

            xhr.onreadystatechange = handler;
            xhr.onerror = errHandler;
            xhr.timeout = 30000;
            xhr.ontimeout = function () { errHandler("[UPLOAD_ZIP] Timed out al enviar auditoria!!!"); };

            xhr.open("POST", url);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader('Content-Type', 'text/xml');
            xhr.send(xml);

        } catch (e) {
            console.error("[UPLOAD_ZIP] No se pudo enviar el fichero de auditoria " + e);
            Dnv.monitor.writeLogFile("[UPLOAD_ZIP] No se pudo enviar el fichero de auditoria " + e, LogLevel.Error);
            if (errorCallback) errorCallback();
        }
    };

    var callbacksAuditoria = {};

    function _generateAndUploadAuditoriaZip(filename, iniDate, endDate, successCallback, errorCallback) {

        var url = Dnv.cfg.getCfgString("FileTransferClientEndPointAddressWeb", Dnv.cfg.getDefaultWcfServerAddress() + "/Servicios/WebFileTransfer");

        Dnv.monitor.obtenerFicherosPorFecha(Dnv.Cloud._AUDITORIA_PATH, "xml", iniDate, endDate, function exitoListado(ficheros) {

            console.log("[PROCESAR_COMANDO] Número de ficheros: " + ficheros.length);
            if (ficheros.length == 0) {
                console.warn("[PROCESAR_COMANDO] No hay ficheros que subir en este rango de fechas.");
                if (successCallback) successCallback();
                return;
            }


            /*Dnv.monitor.createZipFile(Dnv.Cloud._AUDITORIA_PATH, ficheros, "base64", function zipCreadoCb(zipBase64) {
            console.log("[PROCESAR_COMANDO] Archivo creado.");
            _uploadAuditoriaZip(zipBase64, filename, url, successCallback, errorCallback);
            }, errorCallback);*/
            _readFiles(Dnv.Cloud._AUDITORIA_PATH, ficheros, function callback(resultado) {
                // Le pasamos el trabajo de comprimir y enviar al worker
                var filenames = [];
                var fileContents = []; // Son arraybuffers que seran transferable
                var tamano = 0;
                for (var i = 0; i < resultado.length; i++) {
                    // Apaño para webOS3 y sistemas que no permitan espacios en el nombre
                    var fichero = resultado[i].filename;
                    if (fichero.indexOf("AuditoriaLog_2") === 0 || fichero.indexOf("AuditoriaLog_1") === 0) {
                        // El 1 es para los players que tienen una fecha de 1970
                        fichero = fichero.replace("AuditoriaLog_2", "AuditoriaLog 2").replace("AuditoriaLog_1", "AuditoriaLog 1");
                    }
                    filenames.push(fichero);
                    fileContents.push(resultado[i].content);
                    tamano += resultado[i].content.byteLength
                }
                console.log("Enviando " + resultado.length + " archivos (" + tamano + ") bytes al worker");

                var callbackId = new Date().getTime();
                callbacksAuditoria[callbackId] = { exito: successCallback, error: errorCallback };

                worker.postMessage({
                    comando: "envio_auditoria",
                    callbackId: callbackId,
                    filenames: filenames,
                    fileContents: fileContents,
                    zipFilename: filename,
                    //rutaFicheros: "file://" + Dnv.Cloud._LOGS_PATH,
                    uploadUrl: url
                }, fileContents); // Decimos que objetos son Transferable


            });

        });
    };


    function _generateAndUploadLogZip(filename, iniDate, endDate, url) {
        // no metemos , successCallback, errorCallback por no complicar la comunicacion con el worker


        //var url = "http://" + parametros[6] + "/UploadLogZipFile.aspx";
        Dnv.monitor.obtenerFicherosPorFecha(Dnv.Cloud._LOGS_PATH, "log", iniDate, endDate, function exitoListado(ficheros) {

            console.log("[PROCESAR_COMANDO] Número de ficheros: " + ficheros.length);
            if (ficheros.length == 0) {
                console.warn("[PROCESAR_COMANDO] No hay ficheros que subir en este rango de fechas.");

                return;
            }


            _readFiles(Dnv.Cloud._LOGS_PATH, ficheros, function callback(resultado) {
                // Le pasamos el trabajo de comprimir y enviar al worker
                var filenames = [];
                var fileContents = []; // Son arraybuffers que seran transferable
                var tamano = 0;
                for (var i = 0; i < resultado.length; i++) {
                    filenames.push(resultado[i].filename);
                    fileContents.push(resultado[i].content);
                    tamano += resultado[i].content.byteLength
                }
                console.log("Enviando " + resultado.length + " archivos (" + tamano + ") bytes al worker");
                worker.postMessage({
                    comando: "envio_logs",
                    filenames: filenames,
                    fileContents: fileContents,
                    zipFilename: filename,
                    //rutaFicheros: "file://" + Dnv.Cloud._LOGS_PATH,
                    uploadUrl: url
                }, fileContents); // Decimos que objetos son Transferable


            });

            /*Dnv.monitor.createZipFile(Dnv.Cloud._LOGS_PATH, ficheros, "uint8array", function zipCreadoCb(zipUint8) {
            console.log("[PROCESAR_COMANDO] Archivo creado.");
            Dnv.uploadZip.uploadLogsZip(zipUint8, finalName, url);
            });*/
        });
    };

    function _strToUi8a(str) {
        var uint = new Uint8Array(str.length);
        for (var i = 0, j = str.length; i < j; ++i) {
            uint[i] = str.charCodeAt(i);
        }
        return uint;
    }

    //function _zipFilesAndUpload(path, files /*, successCb, errorCb*/) {
    function _readFiles(rutaFicheros, ficheros, callback) {
        // No metemos callbacks porque el trabajo lo hara un worker, y asi simplificamos

        // Para no leer todos los archivos a la vez, que quizás penalice el rendimiento, hago una cola de archivos para leer y leo uno detras de otro
        var cola = [];

        for (var i = 0; i < ficheros.length; i++) {
            console.log("Se procesara " + ficheros[i]);
            cola.push(ficheros[i]);
        }
        var item;
        var resultado = [];
        function f() {
            var item = cola.pop();
            if (item) {
                console.log("[ZIP] Leyendo " + item);
                Dnv.monitor.readBinaryFileAsync(rutaFicheros + item, function exitoCb(datos) {
                    console.log("[ZIP] Leido " + item);
                    resultado.push({ filename: item, content: datos });
                    f();
                }, function errorCb(msg) {
                    console.error("No se pudo leer " + rutaFicheros + item);
                    resultado.push({ filename: item, content: _strToUi8a("No se pudo leer el archivo " + rutaFicheros + item + ". " + (msg ? msg.toString() : "")).buffer });
                    //zip.file(item, );
                    f();
                });
            } else {
                if (callback) console.log("Enviamos los datos de " + resultado.length + " objetos");
                else console.error("No hay callback!!!!!!");
                if (callback) callback(resultado);
            }
        }
        f();
    }


    var worker = new Worker("lib/zip_worker.js");

    worker.onMessage = function alarmasWorkerMessageHandler(oEvent) {
        if (oEvent.data.isConsole) {
            console.log("[UPLOAD_ZIP] Mensaje de worker " + oEvent.data.level + " " + oEvent.data.msg);
            console[oEvent.data.level](oEvent.data.msg);
        } else if (oEvent.data.isLogZipResponse) {
            // TODO: Esto es un apaño temporal, lo suyo sería enviar desde el worker, pero el envio da problemas de CORS...
            _uploadLogsZip(new Uint8Array(oEvent.data.datos), oEvent.data.filename, oEvent.data.url);

        } else if (oEvent.data.isAuditoriaResponse) {
            var callbacks = callbacksAuditoria[oEvent.data.callbackId];
            console.log("callback[" + oEvent.data.callbackId + "] ->" + callbacks);
            if (callbacks) {
                if (oEvent.data.exito && callbacks.exito) {
                    callbacks.exito();
                } else if (!oEvent.data.exito && callbacks.error) {
                    callbacks.error();
                }
            }
            //_uploadLogsZip(new Uint8Array(oEvent.data.datos), oEvent.data.filename, oEvent.data.url);

        } else {
            console.log("[UPLOAD_ZIP] Worker said : " + oEvent.data);
        }
    };
    worker.onmessage = worker.onMessage; // LG (comprobar en samsung tambien que este es el correcto)
    worker.onerror = function onerror(e) {
        console.error("[UPLOAD_ZIP]  WORKER ERROR: " + e.message + " " + e.filename + " " + e.lineno);
    };

    return {
        uploadLogsZip: function (datos, filename, url, successCallback, errorCallback) { _uploadLogsZip(datos, filename, url, successCallback, errorCallback); },
        generateAndUploadAuditoriaZip: function (filename, iniDate, endDate, successCallback, errorCallback) { _generateAndUploadAuditoriaZip(filename, iniDate, endDate, successCallback, errorCallback); },

        generateAndUploadLogsZip: function (filename, iniDate, endDate, url) { _generateAndUploadLogZip(filename, iniDate, endDate, url); }

    };

})();




