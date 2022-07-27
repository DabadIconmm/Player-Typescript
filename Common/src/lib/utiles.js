
"use strict";

var Dnv = Dnv || {};

//TODO: Hacer enumeración??
var LogLevel = {
    Debug: 0,
    Info: 1,
    Warn: 2,
    Error: 3,
    Fatal: 4
}

Dnv.utiles = (function () {



    var __flashPlugin;
    try {
        if (typeof navigator.plugins == "undefined" || navigator.plugins.length == 0) {
            if (typeof ActiveXObject != "undefined") {
                __flashPlugin = !!(new ActiveXObject("ShockwaveFlash.ShockwaveFlash"));
            }
        } else {
            __flashPlugin = navigator.plugins["Shockwave Flash"];
        }
    } catch (e) {
        console.error("Error intentando detectar si flash esta disponible: " + e);
    }
    var _supportsFlash = (__flashPlugin ? true : false);




    var _timestampsLastLogs = {};
    var _limite = 30 * 60 * 1000; // 30 min
    function _logSparingly(msg, nivel) {
        // Loguear a disco un mensaje, evitando escribirlo demasiado a menudo
        // TODO: Mejorar el nombre
        if (nivel === undefined) nivel = LogLevel.Info;
        var ahora = new Date().getTime();
        if (_timestampsLastLogs[msg] === undefined || (ahora - _timestampsLastLogs[msg]) > _limite) {
            _timestampsLastLogs[msg] = ahora;
            Dnv.monitor.writeLogFile(msg, nivel);
            //Dnv.servidor.logInServerLog(msg);
        }
    }
    var _fixStreamUrl = function (ruta) {
        // Suelen pasar urls de tipo "udp://@1.2.3.4:5678" para que vlc las parsee como IPv4
        if (ruta.indexOf("udp://@") == 0) {
            ruta = "udp://" + ruta.substring("udp://@".length);
        } else if (ruta.indexOf("rtp://@") == 0) {
            ruta = "rtp://" + ruta.substring("rtp://@".length);
        } else if (ruta.indexOf("rtsp://@") == 0) {
            ruta = "rtsp://" + ruta.substring("rtsp://@".length);
        } else if (ruta.indexOf("rtmp://@") == 0) {
            ruta = "rtmp://" + ruta.substring("rtmp://@".length);
        }
        return ruta;

    };

    var _InfoHasher = function (filename, size) {
        /*
        * Se usa la librería SHA1 porque con CryptoJS no he consegido usar datos binarios.
        * El cálculo es extremadamente lento. Habría que hacerlo asincronamente en un worker, o en nodeJS o algo.
        * O bien usar los MD5 que muchas plataformas pueden generar.
        */
        // var sha256 = CryptoJS.algo.SHA256.create(); sha256.update("Message Part 1"); sha256.update("Message Part 2"); sha256.update("Message Part 3"); var hash = sha256.finalize();

        function getInfoHashPieceLength(filesize) {
            /*
            * Código de MonoTorrent
            public static int RecommendedPieceSize (long totalSize)
            {
            // Check all piece sizes that are multiples of 32kB and
            // choose the smallest piece size which results in a
            // .torrent file smaller than 60kb
            for (int i = 32768; i < 4 * 1024 * 1024; i *= 2) {
            int pieces = (int) (totalSize / i) + 1;
            if ((pieces * 20) < (60 * 1024))
            return i;
            }
		
            // If we get here, we're hashing a massive file, so lets limit
            // to a max of 4MB pieces.
            return 4 * 1024 * 1024;
            }
            */

            for (var i = 32768; i < 4 * 1024 * 1024; i *= 2) {
                var pieces = parseInt((filesize / i) + 1);
                if ((pieces * 20) < (60 * 1024)) {
                    return i;
                }
            }
            return 4 * 1024 * 1024;
        }

        var infoHashPieceLength = getInfoHashPieceLength(size);
        var pieces = Math.ceil(size / infoHashPieceLength);
        var piecesHashes = [];

        var numBytesLeidos = 0;
        //var bytesPendientes = null;

        // No he conseguido usar crypto-js con datos binarios...
        //var hasher = CryptoJS.algo.SHA1.create();
        var hasher = sha1.create();

        // datos deberia ser un ArrayBuffer
        function onDatosLeidos(datos) {
            if (datos.byteLength === 0) return;

            var numDatosLeidos = 0;
            do {
                //var numBytesPendientes = datos.byteLength - numBytesLeidos;
                var numBytesRestantesPieceActual = infoHashPieceLength - (numBytesLeidos % infoHashPieceLength);
                var numDatosALeer;

                if ((datos.byteLength - numDatosLeidos) > numBytesRestantesPieceActual) {
                    numDatosALeer = numBytesRestantesPieceActual;
                } else {
                    numDatosALeer = datos.byteLength - numDatosLeidos;
                }

                hasher.update(datos.slice(numDatosLeidos, numDatosLeidos + numDatosALeer));
                numDatosLeidos += numDatosALeer;
                numBytesLeidos += numDatosALeer;

                //if (datos.byteLength > numDatosLeidos) {
                if (numBytesLeidos % infoHashPieceLength === 0 && numBytesLeidos < size) {
                    piecesHashes.push(hasher.arrayBuffer());
                    hasher = sha1.create();
                }
            } while (datos.byteLength > numDatosLeidos);



            /*
            var numDatosALeer = (infoHashPieceLength - (numDatosLeidos % infoHashPieceLength));
            if (numBytesLeidos + datos.length >= infoHashPieceLength) {
            hasher.update(datos.slice(numBytesLeidos, numBytesLeidos + numBytesALeer));
            numBytesLeidos += numBytesALeer;

            piecesHashes.push(hasher.arrayBuffer());
            hasher = sha1.create();

            if (datos.length + numBytesLeidos > infoHashPieceLength) {
            // Quedan datos por procesar
            hasher.update(datos.slice(datos.length - (infoHashPieceLength - numBytesLeidos)), datos.length);
            }
            numBytesLeidos = datos.length - (infoHashPieceLength - numBytesLeidos);
            } else {
            hasher.update(datos.slice(0, datos.length));
            numBytesLeidos += datos.length;
            }
            } while (numBytesLeidos < datos.length);
            numBytesLeidos += numDatosLeidos;
            */
        }

        var te = new TextEncoder();
        var td = new TextDecoder();
        function stringToBytes(string) {
            return te.encode(string);
        }
        function stringToHexString(string) {
            var u8array = te.encode(string);
            var resultado = '';
            for (var i = 0; i < u8array.length; i++) {
                var hexString = u8array[i].toString(16);
                if (hexString.length % 2) {
                    hexString = '0' + hexString;
                }
                resultado += hexString;
            }
            return resultado;
        }
        function bytesToString(string) {
            return td.decode(string);
        }

        function calcularInfoHash() {
            //piecesHashes.push(hasher.hex().toUpperCase());
            piecesHashes.push(hasher.arrayBuffer());
            hasher = sha1.create();
            var filenamebytes = stringToBytes(filename);
            // Un hash SHA1 son 160 bits
            var debug = "";
            hasher.update("d6:lengthi" + size + "e4:name" + filenamebytes.length + ":" + filename + "12:piece lengthi" + infoHashPieceLength + "e6:pieces" + (pieces * 160 / 8) + ":");
            debug = "d6:lengthi" + size + "e4:name" + filenamebytes.length + ":" + filename + "12:piece lengthi" + infoHashPieceLength + "e6:pieces" + (pieces * 160 / 8) + ":";

            for (var i = 0; i < piecesHashes.length; i++) {
                hasher.update(piecesHashes[i]);
                debug += bytesToString(piecesHashes[i]);
            }
            hasher.update("7:privatei0e9:publisher15:www.deneva.infoe");
            debug += "7:privatei0e9:publisher15:www.deneva.infoe";
            return hasher.hex().toUpperCase();
        }


        return {
            /*inicializar: function (filename, size) {

            },*/
            // datos deberia ser un ArrayBuffer
            pushData: function (datos) {
                onDatosLeidos(datos);
            },
            generarInfoHash: function () {
                return calcularInfoHash();
            }

        };
    };




    return {
        soportaFlash: function () { return _supportsFlash; },
        getFlashPlugin: function () { return __flashPlugin; },
        debeLoguearFallosDeRed: function () {
            if (!Dnv.systemInfo.isConConexionAlServidor()) {
                _logSparingly("No logueamos errores de red debido a que el player parece offline y no queremos inundar los logs", LogLevel.Warn);
                return false;
            }
            return true;
        },
        // dd-mm-yyyy[T]hh:MM:ss
        formatearFecha: function formatearFecha(date, pretty) {

            var dd = date.getDate();
            var mm = date.getMonth() + 1; //January is 0!
            var hh = date.getHours();
            var MM = date.getMinutes();
            var ss = date.getSeconds();

            var yyyy = date.getFullYear();
            if (dd < 10) dd = '0' + dd
            if (mm < 10) mm = '0' + mm
            if (hh < 10) hh = '0' + hh
            if (MM < 10) MM = '0' + MM
            if (ss < 10) ss = '0' + ss

            if (pretty == true) {
                return dd + '-' + mm + '-' + yyyy + ' ' + hh + ':' + MM + ':' + ss;
            } else {
                return dd + '-' + mm + '-' + yyyy + 'T' + hh + ':' + MM + ':' + ss;
            }
        },

        parseXml: function parseXml(txt) {
            var xmlDoc;
            if (window.DOMParser) {
                var parser = new DOMParser();
                xmlDoc = parser.parseFromString(txt, "text/xml");
            } else { // Internet Explorer
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(txt);
            }
            return xmlDoc;
        },

        //yyyy-mm-dd[T]hh:MM:ss
        formatearFechaWCF: function formatearFechaWCF(date, pretty) {

            var dd = date.getDate();
            var mm = date.getMonth() + 1; //January is 0!
            var hh = date.getHours();
            var MM = date.getMinutes();
            var ss = date.getSeconds();

            var yyyy = date.getFullYear();
            if (dd < 10) dd = '0' + dd
            if (mm < 10) mm = '0' + mm
            if (hh < 10) hh = '0' + hh
            if (MM < 10) MM = '0' + MM
            if (ss < 10) ss = '0' + ss

            //return dd + '-' + mm + '-' + yyyy + ' ' + hh + ':' + MM + ':' + ss;
            if (pretty == true) {
                return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + MM + ':' + ss;
            } else {
                return yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + MM + ':' + ss;
            }
        },

        //yyyy-mm-dd[T]hh:MM:ss
        formatearFechaWCFUTC: function formatearFechaWCFUTC(date, pretty) {

            var dd = date.getUTCDate();
            var mm = date.getUTCMonth() + 1; //January is 0!
            var hh = date.getUTCHours();
            var MM = date.getUTCMinutes();
            var ss = date.getUTCSeconds();

            var yyyy = date.getFullYear();
            if (dd < 10) dd = '0' + dd
            if (mm < 10) mm = '0' + mm
            if (hh < 10) hh = '0' + hh
            if (MM < 10) MM = '0' + MM
            if (ss < 10) ss = '0' + ss

            //return dd + '-' + mm + '-' + yyyy + ' ' + hh + ':' + MM + ':' + ss;
            if (pretty == true) {
                return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + MM + ':' + ss;
            } else {
                return yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + MM + ':' + ss;
            }
        },

        //yyyymmdd_hhMMss
        formatearFechaUTC: function formatearFechaUTC(date) {

            var dd = date.getUTCDate();
            var mm = date.getUTCMonth() + 1; //January is 0!
            var hh = date.getUTCHours();
            var MM = date.getUTCMinutes();
            var ss = date.getUTCSeconds();

            var yyyy = date.getUTCFullYear();
            if (dd < 10) dd = '0' + dd
            if (mm < 10) mm = '0' + mm
            if (hh < 10) hh = '0' + hh
            if (MM < 10) MM = '0' + MM
            if (ss < 10) ss = '0' + ss

            //return dd + '-' + mm + '-' + yyyy + ' ' + hh + ':' + MM + ':' + ss;
            return '' + yyyy + mm + dd + '_' + hh + MM + ss;
        },
        //yyyymmdd
        formatearFechaUTCDia: function formatearFechaUTCDia(date) {

            var mm = date.getMonth() + 1;
            var dd = date.getDate();

            return [date.getFullYear(),
            (mm > 9 ? '' : '0') + mm,
            (dd > 9 ? '' : '0') + dd
            ].join('');
        },


        formatearMinutos: function formatearMinutos(minutos) {
            var negativo = (minutos < 0 ? true : false);
            minutos = Math.abs(minutos);
            // ~~ convierte a entero
            var horas = ~ ~(minutos / 60);
            var minutos = minutos % 60;

            if (horas < 10) horas = '0' + horas;
            if (minutos < 10) minutos = '0' + minutos;
            return (negativo ? "-" : "") + horas + ":" + minutos;
        },

        formatearSegundos: function formatearSegundos(segundos) {
            // formatearSegundos(-3723) -> "-01:02:03"
            var negativo = (segundos < 0 ? true : false);
            segundos = Math.abs(segundos);
            // ~~ convierte a entero
            var horas = ~ ~(segundos / 60 / 60);
            var minutos = ~ ~(segundos / 60 % 60);
            var segundos = segundos % 60;

            if (horas < 10) horas = '0' + horas;
            if (minutos < 10) minutos = '0' + minutos;
            if (segundos < 10) segundos = '0' + segundos;
            return (negativo ? "-" : "") + horas + ":" + minutos + ":" + segundos;
        },
        formatearMsecs: function formatearMsecs(msecs) {
            // formatearMsecs(-3723004) -> "-01:02:03.004"
            // ~~ convierte a entero
            var str = this.formatearSegundos(~ ~(msecs / 1000));
            msecs = Math.abs(msecs % 1000);
            var negativo = (msecs < 0 ? true : false);

            if (msecs < 10) msecs = '00' + msecs;
            else if (msecs < 100) msecs = '0' + msecs;
            return str + '.' + msecs;
        },

        //14/05/2015 09:44:36 | 14-05-2015 9:44:36
        stringToTimestamp: function stringToTimestamp(fecha) {
            //formato "14/05/2015 09:44:36" | "14-05-2015 9:44:36"

            if (fecha.indexOf(":") == -1) {
                fecha = fecha + " 00:00:00";
            }

            fecha = fecha.replace("/", "-");
            fecha = fecha.replace("/", "-");

            var dias = fecha.split(" ")[0].split("-");
            var horas = fecha.split(" ")[1].split(":");

            for (var i = 0; i < dias.length - 1; i++) {
                if (dias[i].length == 1) dias[i] = "0" + dias[i];
            }

            for (i = 0; i < horas.length; i++) {
                if (horas[i].length == 1) horas[i] = "0" + horas[i];
            }

            //dd/mm/yyyy
            if (dias[2].length == 4) {
                fecha = dias[0] + "-" + dias[1] + "-" + dias[2] + " " + horas[0] + ":" + horas[1] + ":" + horas[2];
            }

            //yyyy/mm/dd
            if (dias[0].length == 4) {
                fecha = dias[2] + "-" + dias[1] + "-" + dias[0] + " " + horas[0] + ":" + horas[1] + ":" + horas[2];
            }


            var dateArray;
            var isValido = true;

            var reggie = /(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/;
            var dateArray = reggie.exec(fecha);

            var dateObject = new Date(
			dateArray[3],
			dateArray[2] - 1, // Careful, month starts at 0!
			dateArray[1],
			dateArray[4],
			dateArray[5],
			dateArray[6]
		);

            return dateObject;
        },

        formatDateSize: function formatDateSize(value) {
            if (value.toString().length < 2) {
                return "0" + value;
            } else {
                return value;
            }
        },
        // Da un valor incorrecto. No se corrige para evitar que al
        // actualizar no se salte un dia al enviar auditoria
        getDayOfTheYear: function getDayOfTheYear(date) {
            date = date || new Date();
            var start = new Date(date.getFullYear(), 0, 0); // Deberia ser year, 0, 1
            var diff = date - start;
            var oneDay = 1000 * 60 * 60 * 24;
            return Math.ceil(diff / oneDay);
        },
        // Combinar dia del aÃ±o y aÃ±o (p.ej. el ultimo dia de 2019 sria 2019365)
        getDayAndYear: function getDayOfTheYear(date) {
            date = date || new Date();
            return date.getFullYear() * 10000 + Dnv.utiles.getDayOfTheYear(date);
        },


        // objeto Date -> "21/02/2015 01:02:03"
        formatDateTimeEspanol: function formatDateTimeEspanol(date) {
            var f = function (n) { return (n < 10 ? "0" + n : n); };
            return "" + f(date.getDate()) + "/" + f(date.getMonth() + 1) + "/" + f(date.getFullYear()) + " " + f(date.getHours()) + ":" + f(date.getMinutes()) + ":" + f(date.getSeconds());
        },
        // objeto Date -> "21/02/2015"
        formatDateEspanol: function formatDateEspanol(date) {
            var f = function (n) { return (n < 10 ? "0" + n : n); };
            return "" + f(date.getDate()) + "/" + f(date.getMonth() + 1) + "/" + f(date.getFullYear());
        },

        //TODO RAG: A utiles.
        secondsDiff: function secondsDiff(first, second) {
            return (first - second) / 1000
        },


        floatToInt: function floatToInt(n) {
            return ~ ~n;
        },

        isInHorario: function isInHorario(minutosHoraInicio, minutosHoraFinal) {

            var fechaActual = new Date();
            var minutosDiaAhora = fechaActual.getHours() * 60 + fechaActual.getMinutes();

            if (minutosHoraInicio < minutosHoraFinal) {
                if (minutosDiaAhora >= minutosHoraInicio && minutosDiaAhora <= minutosHoraFinal) {
                    return true;
                }
            }

            if (minutosHoraInicio > minutosHoraFinal) {
                if (minutosDiaAhora >= minutosHoraInicio || minutosDiaAhora <= minutosHoraFinal) {
                    return true;
                }
            }

            return false;
        },


        parseTimeInMinutes: function parseTimeInMinutes(time) {

            var minutos = 0;
            var partesTime = time.split(':');

            minutos = minutos + parseInt(partesTime[0]) * 60;
            minutos = minutos + parseInt(partesTime[1]);

            return minutos;

        },

        isFechaVigente: function (fecha) {
            var fechaActual = new Date();
            if (fechaActual.getTime() <= fechaFin) {
                return false
            } else {
                return true
            }
        },

        isInFecha: function isInFecha(fechaInicio, fechaFin, diaSemana, sumarDiaCompleto) {
            var sumaTiempo = 0;
            if (sumarDiaCompleto) sumaTiempo = 86400000;
            var fechaActual = new Date();
            if ((fechaInicio <= fechaActual.getTime()) && (fechaActual.getTime() <= (fechaFin + sumaTiempo))) {
                if (!diaSemana || diaSemana.length === 0 || (diaSemana.length === 1 && diaSemana[0] === "")) {
                    /* 
                    * diaSemana originalmente tendrá el formato "L;M;X" y se transforma a un Array.
                    * Si no hay dias "", con lo que nos llega un array de 1 elemento vacio, se debe
                    * interpretar como dia válido.
                    */
                    return true;
                }
                switch (fechaActual.getDay()) {
                    case 0:
                        if (diaSemana.indexOf('D') != -1 || diaSemana.indexOf('7') != -1) {
                            return true;
                        }
                        break;
                    case 1:
                        if (diaSemana.indexOf('L') != -1 || diaSemana.indexOf('1') != -1) {
                            return true;
                        }
                        break;
                    case 2:
                        if (diaSemana.indexOf('M') != -1 || diaSemana.indexOf('2') != -1) {
                            return true;
                        }
                        break;
                    case 3:
                        if (diaSemana.indexOf('X') != -1 || diaSemana.indexOf('3') != -1) {
                            return true;
                        }
                        break;
                    case 4:
                        if (diaSemana.indexOf('J') != -1 || diaSemana.indexOf('4') != -1) {
                            return true;
                        }
                        break;
                    case 5:
                        if (diaSemana.indexOf('V') != -1 || diaSemana.indexOf('5') != -1) {
                            return true;
                        }
                        break;
                    case 6:
                        if (diaSemana.indexOf('S') != -1 || diaSemana.indexOf('6') != -1) {
                            return true;
                        }
                        break;
                }
                return false;

            } else {
                return false;
            }
        },

        // Obtenet un Date con la hora apsada y el dia 1 de enero del 2000
        getTimePart: function (d) {
            return new Date(2000, 0, 1, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
        },
        // Comprobar si la hora pasada esta entre las horas de inicio y fin
        isInTime: function (d, dateInicial, dateFinal) {
            var t = Dnv.utiles.getTimePart(d).getTime();
            return t >= Dnv.utiles.getTimePart(dateInicial) && t <= Dnv.utiles.getTimePart(dateFinal);
        },

        // PETICIONES DETERMINISTAS
        // devuelve los segundos en que debe realizar la siguiente petición a un servicio
        // en función del objID del player y el intervalo que tenga configurado el servicio
        getIntervalPeticionDeterminista: function getIntervalPeticionDeterminista(objIDPlayer, intervalServicio) {
            var tmpReturn = -1;
            try {
                var tmpVal;
                tmpVal = objIDPlayer % intervalServicio;
                var secondsElapsed;

                secondsElapsed = new Date().getTime();

                if (tmpVal < (secondsElapsed % intervalServicio)) {
                    tmpReturn = intervalServicio - ((secondsElapsed % intervalServicio) - tmpVal);
                } else {
                    tmpReturn = tmpVal - (secondsElapsed % intervalServicio);
                }

                if (tmpReturn <= 0) {
                    tmpReturn = intervalServicio;
                }
            } catch (ex) {
                console.error("[TIMERS-DETERMINISTAS] (getIntervalPeticionDeterminista) Error: " + ex);
                tmpReturn = 1;
            } finally {
                tmpReturn = tmpReturn * 1000;
                console.log("[TIMERS-DETERMINISTAS]: Devuelto interval siguiente petición=" + tmpReturn + " milisegundos. ObjID=" + objIDPlayer + ", IntervalServicio=" + intervalServicio);
            }
            return tmpReturn;
        },

        getMaximoComunDivisor: function (numeros) {

            function gcd_two_numbers(x, y) {
                if ((typeof x !== 'number') || (typeof y !== 'number'))
                    return false;
                x = Math.abs(x);
                y = Math.abs(y);
                while (y) {
                    var t = y;
                    y = x % y;
                    x = t;
                }
                return x;
            }

            if (!Array.isArray(numeros)) return false;
            var len, a, b;
            len = numeros.length;
            if (!len) return null;
            a = numeros[0];
            for (var i = 1; i < len; i++) {
                b = numeros[i];
                a = gcd_two_numbers(a, b);
            }
            return a;

        },
        InfoHasher: _InfoHasher,
        getIndexOfMaxValue: function (arr) {
            if (arr.length === 0) {
                return -1;
            }

            var max = arr[0];
            var maxIndex = 0;

            for (var i = 1; i < arr.length; i++) {
                if (arr[i] > max) {
                    maxIndex = i;
                    max = arr[i];
                }
            }

            return maxIndex;

        },
        fixStreamUrl: _fixStreamUrl
    };
})();
    
