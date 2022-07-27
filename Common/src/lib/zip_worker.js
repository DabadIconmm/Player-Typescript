
"use strict";

/*
 * Este worker comprime un array de ArrayBuffers en un fichero zip.
 * Los ArrayBuffers seran los contenidos de ficheros
 *
 * No se leen directamente desde el worker poque no he encontrado una forma de hacerlo
 * desde webOS.
 * - Los imports de cordoba necesitan el hilo principal
 * - El XHR no deja leer de local por problemas de CORS.
 * 
 * El zip de logs no se sube directamente porque webOS envía de forma diferente desde el worker
 * que desde el hilo principal y hay un problema de CORS que implica que tengamos que modificar el servidor.
 * 
 */


var isConsoleDefined;
try {
    if (console === undefined) {
        isConsoleDefined = false;
    } else {
        isConsoleDefined = true;
    }
} catch (e) {
    isConsoleDefined = false;
}
var console = console || {};

//if(console === undefined) {

if (!isConsoleDefined) {

    var podemosReferenciarWindow = true;
    try {
        var a = window;
    } catch (e) { // WTF Samsung? ReferenceError: Can't find variable: window
        podemosReferenciarWindow = false;
    }

    if (podemosReferenciarWindow && window && window.self && window.self.console) {
        console = window.self.console;
    } else {
        console = {
            log: function () {
                postMessage({
                    isConsole: true,
                    level: "log",
                    msg: arguments[0]/*,
					args: JSON.stringify(arguments)*/
                });
            },
            warn: function () {
                var stack = new Error().stack;
                var msg = (stack ? arguments[0] + "[TRACE:\n" + stack + "]" : arguments[0])
                postMessage({
                    isConsole: true,
                    level: "warn",
                    msg: msg/*,
					args: arguments*/
                });
            },
            error: function () {
                var stack = new Error().stack;
                var msg = (stack ? arguments[0] + "[TRACE:\n" + stack + "]" : arguments[0])
                postMessage({
                    isConsole: true,
                    level: "error",
                    msg: msg/*,
					args: arguments*/
                });
            }
        };
    }
}

self.onerror = function (message) {
    console.error('worker error');
    //return true;
};


function strToUi8a(str) {
	var uint=new Uint8Array(str.length);
	for(var i=0,j=str.length;i<j;++i){
	  uint[i]=str.charCodeAt(i);
	}
	return uint;
}

var window = window || self; // Para que jszip-utils no se queje

importScripts('external/jszip.js');
importScripts('external/jszip-utils.js');

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
                    errHandler("Error HTTP: " + this.status+ " - " + this.statusText);
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
            console.log("[UPLOAD_ZIP] Error al enviar el zip de logs: " + e);
            if (errorCallback) errorCallback();
        };
        var xhr = new XMLHttpRequest;

        xhr.onreadystatechange = handler;
        xhr.onerror = errHandler;
        xhr.timeout = 60000;
        xhr.ontimeout = function () { errHandler("[UPLOAD_ZIP] Timed out al enviar logs!!!"); };

        console.log("Enviando " + filename + " a " + url + " " + datos.length);
        xhr.open("POST", url);
        xhr.setRequestHeader('Content-Type', 'application/zip');
        xhr.setRequestHeader("FileName", filename);

        xhr.send(datos);

    } catch (e) {
        console.error("[UPLOAD_ZIP] No se pudo enviar el fichero de log " + e);
        //Dnv.monitor.writeLogFile("[UPLOAD_ZIP] No se pudo enviar el fichero de log " + e, LogLevel.Error);
        if (errorCallback) errorCallback();
    }
};

    
function _uploadAuditoriaZip(datosBase64, filename, endpointUrl, successCallback, errorCallback) {
    // datos es base64
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
        if (errorCallback) errorCallback();
    }
};

function enviarLogs(filenames, fileContents, zipFilename, uploadUrl) {


    var zip = new JSZip();
    for (var i = 0; i < filenames.length; i++) {
        zip.file(filenames[i], fileContents[i]); 
    }

    var content = zip.generate({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6} });
    //_uploadLogsZip(content, zipFilename, uploadUrl);

    self.postMessage({ // TODO: Apaño hasta que deje de haber problemas de CORS y podamos enviar desde el worker
        isLogZipResponse: true,
        datos: content.buffer,
        filename: zipFilename,
        url: uploadUrl
    }, [content.buffer]);
    /*
    _uploadLogsZip(content, zipFilename, uploadUrl);
    */
}

function enviarAuditoria(filenames, fileContents, zipFilename, uploadUrl, successCallback, errorCallback) {


    var zip = new JSZip();
    for (var i = 0; i < filenames.length; i++) {
        zip.file(filenames[i], fileContents[i]);
    }

    var content = zip.generate({ type: "base64", compression: "DEFLATE", compressionOptions: { level: 6} });
    _uploadAuditoriaZip(content, zipFilename, uploadUrl, successCallback, errorCallback);


}


self.onmessage = function (e) {
    console.log("Mensaje recibido");

    var datos = e.data;

    if (datos.comando == "envio_logs") {
        var filenames = datos.filenames; // ["2015-11-09.log", "2015-11-09.log", "2015-11-09.log"]
        var fileContents = datos.fileContents; // [arrayBuffer, arrayBuffer, arrayBuffer]
        //var rutaFicheros = datos.rutaFicheros; // "file:///mtd_down/common/DenevaSSSP/logs/"
        var zipFilename = datos.zipFilename;
        var uploadUrl = datos.uploadUrl; // "http://192.168.13.49/DenevaCuatro/main/extFunction/UploadLogZipFile.aspx";

        enviarLogs(filenames, fileContents, zipFilename, uploadUrl);
    } else if (datos.comando == "envio_auditoria") {

        var filenames = datos.filenames; // ["2015-11-09.log", "2015-11-09.log", "2015-11-09.log"]
        var fileContents = datos.fileContents; // [arrayBuffer, arrayBuffer, arrayBuffer]
        //var rutaFicheros = datos.rutaFicherosAuditoria; // "file:///mtd_down/common/DenevaSSSP/logs/"
        var zipFilename = datos.zipFilename;
        var uploadUrl = datos.uploadUrl; // "http://192.168.13.49/DenevaCuatro/main/extFunction/UploadLogZipFile.aspx";

        var callbackId = datos.callbackId;
        enviarAuditoria(filenames, fileContents, zipFilename, uploadUrl,
            function exitoEnvioAuditoria() {
                self.postMessage({ // TODO: Apaño hasta que deje de haber problemas de CORS y podamos enviar desde el worker
                    isAuditoriaResponse: true,
                    callbackId: callbackId,
                    exito: true//,
                    //msg: uploadUrl
                });
            }
        );

    } else {
        console.error("[ZIP_WORKER] Mensaje desconocido " + JSON.stringify(datos));
    }


};

