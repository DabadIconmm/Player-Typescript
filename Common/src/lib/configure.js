
"use strict";


var isConfiguring = false;

var devProperties;

var configure = (function () {
    var initTimer;

    var _onLoad = function () {
        var RETRY_INTERVAL = 30 * 1000;
        var MAX_SEGUNDOS_DURACION_CONSULTA_PID = 2 * 60 * 60; // 2 horas

        //TODO: RAG
        var urlServer = Dnv.cfg.getCfgString("WebServiceURL", Dnv.cfg.getConfigProtocolServer() + Dnv.cfg.getConfigIpServer() + "/WSResources/RemoteResources.asmx");
        var docAncho = Dnv.deviceProperties.getWidth();
        var docAlto = Dnv.deviceProperties.getHeight();
        if (docAlto === 0 && docAncho === 1920) {
            docAlto = 1080;
        } else if (docAlto === 0 && docAncho === 1080) {
            docAlto = 1920;
        }
        var cfgWrapperAncho = docAncho;
        var cfgWrapperAlto = docAlto;
        var ratio;
        var cfgWrapperMargenLeft;
        var cfgWrapperMargenTop;
        function calcularDimensiones() {
            /*
            * En LG, según arranca, aunque la orientación nativa sea vertical,
            * las dimensiones que pinta son horizontales.
            */
            docAncho = Dnv.deviceProperties.getWidth();
            docAlto = Dnv.deviceProperties.getHeight();
            if (docAlto === 0 && docAncho === 1920) {
                docAlto = 1080;
            } else if (docAlto === 0 && docAncho === 1080) {
                docAlto = 1920;
            }
            cfgWrapperAncho = docAncho;
            cfgWrapperAlto = docAlto;
            // Forzamos a un aspect ratio de 16:9
            if (Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.PORTRAIT) {

                if (docAncho / 9 * 16 >= docAlto) { // Stretch horizontal
                    ratio = cfgWrapperAlto / docAlto;
                    cfgWrapperAncho = docAlto / 16 * 9 * ratio;
                    cfgWrapperAlto = docAlto * ratio;
                } else { // strech vertical
                    ratio = cfgWrapperAncho / docAncho;
                    cfgWrapperAlto = docAncho / 9 * 16 * ratio;
                    cfgWrapperAncho = docAncho * ratio;
                }
            } else {
                if (docAncho / 16 * 9 >= docAlto) { // Stretch horizontal
                    ratio = cfgWrapperAlto / docAlto;
                    cfgWrapperAncho = docAlto / 9 * 16 * ratio;
                    cfgWrapperAlto = docAlto * ratio;
                } else { // strech vertical
                    ratio = cfgWrapperAncho / docAncho;
                    cfgWrapperAlto = docAncho / 16 * 9 * ratio;
                    cfgWrapperAncho = docAncho * ratio;
                }
            }
            cfgWrapperMargenLeft = (docAncho - cfgWrapperAncho) / 2;
            cfgWrapperMargenTop = (docAlto - cfgWrapperAlto) / 2;
        }
        calcularDimensiones();
        //var cfgWrapperMargenLeft = (docAncho - cfgWrapperAncho) / 2;
        //var cfgWrapperMargenTop = (docAlto - cfgWrapperAlto) / 2;
        isConfiguring = true;

        devProperties = Dnv.deviceProperties.getInstance();
        /*
        devProperties.addEventListener(Dnv.deviceOrientation.ORIENTATION_CHANGED, function (e) {
        locateItems();
        });

        devProperties.addEventListener(Dnv.deviceOrientation.RESIZE, function (e) {
        locateItems();
        });
        */
        function navigateToIndex() {

            document.getElementById("wrappers").style.display = "block";
            document.getElementById("stylesheet_css").href = "";

            document.getElementById("configure").innerHTML = "";
            document.getElementById("configure").style.display = "none";

            Main.navegarContenidos();
            configure.onUnload();
            isConfiguring = false;
        }

        function getIdPlayer(callback, errorCallback) {
            console.log("******* ENTRA EN GETidPLAYER ********");
            var newID = "";
            var caducidad = "";
            var urlCompleta = "";

            function errHandlerID(e) {
                console.error("[CONFIGURE]: Error al pedir GetIDPlayerJS: " + e);
                //console.trace();
                //            $("#infoText").fadeIn(2000);
                //            document.getElementById('infoText').innerHTML = "Error al solicitar ID";
                if (errorCallback) errorCallback();
            }

            function handlerID() {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        console.log("[CONFIGURE]: Respuesta a la peticion de GetIDPlayerJS: " + this.response);
                        try {
                            //if (callback) {
                            if (this.response) {
                                if (callback) callback(this.response);
                            } else {
                                errHandlerID("[CONFIGURE]: No se recibió GetIDPlayerJS");
                            }
                            return;
                            //}
                        } catch (e) {
                            errHandlerID(e);
                        }
                    } else {
                        errHandlerID("Error HTTP: " + this.statusText);
                    }
                }
            }

            var client = new XMLHttpRequest();
            client.onreadystatechange = handlerID;
            client.onerror = errHandlerID;

            console.log("[CONFIGURE]: " + urlServer + "/GetIDPlayerJS&r=" + new Date().getMilliseconds().toString());
            client.open("GET", urlServer + "/GetIDPlayerJS?IdPlayer=&r=" + new Date().getMilliseconds().toString());

            //        $("#infoText").fadeIn(2000);
            //        document.getElementById('infoText').innerHTML = "Solicitando ID...";

            client.send();
        }

        function getPIDByIDPlayerJS(callback, errorCallback) {
            Dnv.servidor.getPIDByIDPlayerJS(callback, errorCallback);
        }

        function onIDError() {
            console.log("[CONFIGURE]: onIDError");
            //document.getElementById('infoText').innerHTML = "No se puede obtener identificador único.";
            if (initTimer !== undefined) clearTimeout(initTimer);
            initTimer = setTimeout(init, RETRY_INTERVAL);
        }

        function onIDSuccess(data) {

            var res = data.split("[]");
            var configID = res[0];

            if (res.length < 3 || configID == "ERROR") {
                onIDError("[CONFIGURE] Se recibio un error de GetIDPlayerJS: " + res)
                return
            }

            var validez = res[1];
            var url = res[2];



            document.getElementById('codeText').innerHTML = configID;
            //document.getElementById('url').innerHTML = "Url " + url;

            createQRCode(url, calculeQRSize());

            locateItems();

            Dnv.cfg.setConfigID(configID);
            Dnv.cfg.setUrlConfigID(url);
            //Dnv.cfg.setValidezCfgID(d.getTime() + (23 * 60 * 1000)); //23h * 60min * 1000ms

            var formattedDate = Dnv.utiles.stringToTimestamp(validez);

            console.log("validez = " + validez + " : " + formattedDate.getTime());

            Dnv.cfg.setValidezCfgID(formattedDate.getTime());
            Dnv.cfg.hacerBackupCfg();
            locateItems();

            if (initTimer !== undefined) clearTimeout(initTimer);
            initTimer = undefined;
            init();
        }

        function onPIDError(e) {
            console.log("[CONFIGURE]: onPIDError");
            //document.getElementById('infoText').innerHTML = "Error al obtener PID.";

            //        $("#infoText").fadeIn(2000);
            //        document.getElementById('infoText').innerHTML = "esperando PID ...";
            
            // FIXME: Traducir
            $("#divInfo").fadeIn(1000);
            document.getElementById('infoText').innerHTML = "Network not detected.\n Please wait or check your connection";

            if (initTimer !== undefined) clearTimeout(initTimer);
            initTimer = setTimeout(init, RETRY_INTERVAL);
        }

        function onPIDSuccess(data) {
            $("#divInfo").fadeOut(1000);

            var res = data.split("[]");
            var PID = res[0];
            var EID = res[1];

            if (res.length > 1 && PID != "ERROR") {
                console.info("[CONFIGURE]: PID " + PID);
                console.info("[CONFIGURE]: EID " + EID);

                Dnv.cfg.setConfigurado(true);
                Dnv.cfg.setConfigPID(PID);
                Dnv.cfg.setConfigEID(EID);

                var cargaCfg = function () {
                    Dnv.cfg.cargarCfg(function exitoCb() {
                        solicitarLicencia();
                        locateItems();
                    }, function errorCb() { // Reintentar
                        setTimeout(cargaCfg, RETRY_INTERVAL);
                    });

                };
                cargaCfg();

                //$("#infoText").fadeIn(2000);
                //document.getElementById('infoText').innerHTML = "Solicitando licencia...";


                //return;
            } else {
                console.log("[CONFIGURE]: Error al obtener datos");
                if (initTimer !== undefined) clearTimeout(initTimer);
                initTimer = setTimeout(init, RETRY_INTERVAL);
            }
        }

        function onLicenciaError(data) {
            console.log("[CONFIGURE]: index onLicenciaError");

            document.getElementById('infoText').innerHTML = data;
            //$("#infoText").fadeIn(1000);
            $("#divInfo").fadeIn(1000);
            setTimeout(solicitarLicencia, 10000);
            locateItems();
        }

        function onLicenciaOK(data) {
            console.log("[CONFIGURE]: index onLicenciaOK");

            setTimeout(Dnv.cfg.cargarCfg, 5000); // Hacer la peticion directamente se come el rendimiento de las animaciones en SSSP2, con lo que el infoText no hace bien el fade
            //Dnv.cfg.cargarCfg();

            animateConfigured();
            setTimeout(function () {
                navigateToIndex();
                $('#configure').addClass("configured");
            }, 10000);
            if (initTimer !== undefined) clearTimeout(initTimer);
            initTimer = undefined;
        }

        function solicitarLicencia() {
            console.log("[CONFIGURE]: solicitarLicencia");
            Dnv.licencias.obtenerLicencia(onLicenciaOK, onLicenciaError);
        }

        function animateConfigured() {

            $('#configure').addClass("configured");
            document.getElementById('infoText').innerHTML = "The player setup has been completed.<br /><br />The player will begin to display contents in a few moments.";
            //document.getElementById('infoText').innerHTML = "La configuración del Player se ha realizado correctamente.<br /><br />En unos segundos comenzaran a mostrarse los contenidos.";

            //var docAncho = Dnv.deviceProperties.getWidth();
            //var docAlto = Dnv.deviceProperties.getHeight();

            //SIZE
            var dwidthFactor;
            var dheightFactor;

            //LOCATION
            var leftPercentage;
            var topPercentage;

            //FONT SIZE
            //var fontSize;

            // [CAR] TODO: Puesto que en vertical queremos la caja centradam quedaria mejor centrar con left y rigth en vez de left y width?
            /*if (Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.PORTRAIT) {
            //dwidthFactor = 0.5885;
            //dheightFactor = 0.3426;
            dwidthFactor = 0.6;
            dheightFactor = 0.5885;
            leftPercentage = 0.2;
            topPercentage = 0.36;
            } else {
            dwidthFactor = 0.5885;
            dheightFactor = 0.3426;
            leftPercentage = 0.25;
            topPercentage = 0.35;
            }*/

            if (Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.PORTRAIT) {
                //dwidthFactor = 0.5885;
                //dheightFactor = 0.3426;
                dwidthFactor = 0.70;
                dheightFactor = 0.36;
                leftPercentage = 0.15;
                topPercentage = 0.30;
            } else {
                dwidthFactor = 0.59;
                dheightFactor = 0.36;
                leftPercentage = 0.29;
                topPercentage = 0.37;
            }

            var dwidth = cfgWrapperAncho * dwidthFactor;
            var dheight = cfgWrapperAlto * dheightFactor;

            /*se hace con css
            document.getElementById("divInfo").style.background = "transparent";

            document.getElementById("divInfo").style.width = dwidth + "px";
            document.getElementById("divInfo").style.height = dheight + "px";
        
            document.getElementById("divInfo").style.left = (cfgWrapperAncho * leftPercentage) + "px"; // 0.278 + "px";
            document.getElementById("divInfo").style.top = (cfgWrapperAlto * topPercentage) + "px"; //0.38 + "px";
            */

            if ((cfgWrapperAncho < 1800 && Dnv.deviceProperties.getOrientation() != Dnv.deviceOrientation.PORTRAIT) ||
                    (cfgWrapperAncho < 710 && Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.PORTRAIT)) {
                document.getElementById("infoText").style.fontSize = "38px";
            } else {
                document.getElementById("infoText").style.fontSize = "56px";
            }

            //$("#divCheck").fadeIn(2000);
            $("#divInfo").fadeIn(1000);
            $("#qrcode").fadeOut(0);
            $("#codeText").fadeOut(0);
            $("#url").fadeOut(0);

            //locateItems();
        }

        function calculeQRSize() {
            //var docAncho = Dnv.deviceProperties.getWidth();
            //var docAlto = Dnv.deviceProperties.getHeight();

            if (Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.LANDSCAPE) {
                return cfgWrapperAlto * 0.323;
                //return docAlto * 0.4;
            } else {
                return cfgWrapperAncho * 0.4;
            }
        }

        function locateItems() {
            function _locate() {
                calcularDimensiones();
                var divCfg = document.getElementById("configure");
                divCfg.style.width = cfgWrapperAncho + "px";
                divCfg.style.height = cfgWrapperAlto + "px";
                divCfg.style.position = "absolute";
                divCfg.style.top = cfgWrapperMargenTop + "px";
                divCfg.style.left = cfgWrapperMargenLeft + "px";

                if (Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.LANDSCAPE) {
                    $('#configure').removeClass('vertical');
                    $('#configure').addClass('horizontal');
                    locateItemsHorizontal();
                } else {
                    $('#configure').removeClass('horizontal');
                    $('#configure').addClass('vertical');
                    locateItemsVertical();
                }
            }
            /*
            * [CAR] Por alguna razon a veces el codigo se posiciona mal en la primera llamada
            * pero se reposiciona bien cuando init llama de nuevo, asi que hacemos una segunda
            * De todas formas, habiendo un fondo fijo, quiza mereceria la pena posicionar en el css en lugar de aqui
            * Lastima que SSSP2 parece que no soporte las unidades de viewport y que calc() no debe estar bien implementado
            */
            try {
                _locate();
            } catch (e) {
                console.error("No se pudieron posicionar bien los elementos. " + e);
                setTimeout(_locate, 1000);
            }
            setTimeout(_locate, 100);
        }
        /* 
        * En webOS, si esta rotado nativamente, al arrancar la pantalla
        * primero esta en horizontal, y luego nos rotan
        */
        window.addEventListener("resize", locateItems);

        function locateItemsVertical() {

            //document.getElementById("divInfo").style.width = $(document).width() / 2 + "px";
            //document.getElementById("divCode").style.fontSize = "12px";

            //var docAncho = Dnv.deviceProperties.getWidth();
            //var docAlto = Dnv.deviceProperties.getHeight();

            var posX = (cfgWrapperAncho / 2) - (document.getElementById('divCode').offsetWidth / 2);
            //var posY = docAlto * 0.16 - document.getElementById('divInfo').offsetHeight;
            var posY = cfgWrapperAlto * 0.16;

            if ((cfgWrapperAncho < 1800 && Dnv.deviceProperties.getOrientation() != Dnv.deviceOrientation.PORTRAIT) ||
                    (cfgWrapperAncho < 710 && Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.PORTRAIT)) {
                document.getElementById("codeText").style.fontSize = "48px";
                //} else if ((cfgWrapperAncho < 1800 && Dnv.deviceProperties.getOrientation() != Dnv.deviceOrientation.PORTRAIT) ||
                //        (cfgWrapperAncho < 710 && Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.PORTRAIT)) {
                //    document.getElementById("codeText").style.fontSize = "12px";
            } else {
                document.getElementById("codeText").style.fontSize = "96px";
            }

            document.getElementById("divCode").style.left = posX + "px";
            document.getElementById("divCode").style.top = posY + "px";

            document.getElementById("divCode").style.width = (cfgWrapperAncho * 0.5) + "px";
            document.getElementById("divCode").style.height = (cfgWrapperAlto * 0.104) + "px";


            if (document.getElementById("qrcode").innerHTML != "") {
                document.getElementById("qrcode").style.top = (cfgWrapperAlto * 0.61) + "px";
                //document.getElementById("qrcode").style.left = (cfgWrapperAncho * 0.104) + "px";
                document.getElementById("qrcode").style.left = (cfgWrapperAncho * 0.30) + "px";
                var tam = calculeQRSize();
                document.getElementById("qrcode").style.height = tam + "px"
                document.getElementById("qrcode").style.width = tam + "px"

                redimensionarQRCode(calculeQRSize()); // Redibuja con otro tamaño
            }
        }

        function locateItemsHorizontal() {


            //var docAncho = cfgWrapperAncho;
            //var docAlto = cfgWrapperAlto;
            /*
            document.getElementById("divInfo").style.width = docAncho / 2 + "px";
        
            var posX = (docAncho - document.getElementById('divInfo').offsetWidth) * 0.5;
            var posY = docAlto * 0.5 - document.getElementById('divInfo').offsetHeight;
            */
            var posX = cfgWrapperAncho * 0.25;
            var posY = cfgWrapperAlto * 0.5;

            if ((cfgWrapperAncho < 1800 && Dnv.deviceProperties.getOrientation() != Dnv.deviceOrientation.PORTRAIT) ||
                    (cfgWrapperAncho < 710 && Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.PORTRAIT)) {
                document.getElementById("codeText").style.fontSize = "48px";
                //} else if ((cfgWrapperAncho < 1800 && Dnv.deviceProperties.getOrientation() != Dnv.deviceOrientation.PORTRAIT) ||
                //        (cfgWrapperAncho < 710 && Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.PORTRAIT)) {
                //    document.getElementById("codeText").style.fontSize = "12px";
            } else {
                document.getElementById("codeText").style.fontSize = "96px";
            }
            posX = cfgWrapperAncho * 0.1145;
            document.getElementById("divCode").style.width = (cfgWrapperAncho * 0.28) + "px";
            document.getElementById("divCode").style.height = (cfgWrapperAlto * 0.185) + "px";

            posY = (cfgWrapperAlto - document.getElementById('divCode').offsetHeight) * .5;
            document.getElementById("divCode").style.left = posX + "px";
            document.getElementById("divCode").style.top = posY + "px";


            if (document.getElementById("qrcode").innerHTML != "") {
                document.getElementById("qrcode").style.top = (cfgWrapperAlto * 0.4) + "px";
                document.getElementById("qrcode").style.left = (cfgWrapperAncho * 0.5156) + "px";
                var tam = calculeQRSize();
                document.getElementById("qrcode").style.height = tam + "px"
                document.getElementById("qrcode").style.width = tam + "px"

                redimensionarQRCode(calculeQRSize()); // Redibuja con otro tamaño
            }
        }

        window.addEventListener(CSS_ROTATION_CHANGED, function (e) {
            if (isConfiguring) locateItems();
        });

        var _inicioConfiguracionTimestamp = null;
        function init() {
            console.log("******* ENTRA EN init del CONFIGURE ********");
            if (initTimer !== undefined) clearTimeout(initTimer);

            console.log("[CONFIGURE]: init");
            Dnv.cfg.cargarCfgDeDisco();

            while (Dnv.Cloud.isFileSystemAvailable() === null) { // Hasta que sepamos si está o no
                console.log("[CONFIGURE]: No sabemos si el FS está disponible");
                setTimeout(comenzar, 3000);
                return;
            }

            if (!Dnv.cfg.getConfigurado()) {
                console.log("[CONFIGURE]: no estamos configurados");
                $('#configure').removeClass('configured');


                var cfgID = Dnv.cfg.getConfigID(); //vemos si tenemos id en disco

                if (typeof cfgID != "undefined" && cfgID != 0) {
                    console.info("[CONFIGURE]: hay cfgID = " + cfgID);

                    var validez = parseFloat(Dnv.cfg.getValidezCfgID());

                    if (validez == 0 || new Date().getTime() > validez) {
                        console.log("[CONFIGURE]: validez caducada");

                        //no es válido, pedir nuevo id
                        Dnv.cfg.setConfigID(0); //borramos UID
                        if (initTimer !== undefined) clearTimeout(initTimer);
                        initTimer = setTimeout(init, RETRY_INTERVAL);
                        return;
                    } else {
                        console.log("[CONFIGURE]: validez ok");
                        document.getElementById('codeText').innerHTML = Dnv.cfg.getConfigID();
                        locateItems();

                        var url = Dnv.cfg.getUrlConfigID();

                        if (typeof url != "undefined" && url != "") {
                            //document.getElementById('url').innerHTML = url;
                            createQRCode(url, calculeQRSize());
                        }

                        locateItems();
                    }
                } else {
                    console.log("[CONFIGURE]: no hay cfgID");
                    Dnv.cfg.setConfigPID(0);
                    Dnv.cfg.setConfigEID(0);
                    getIdPlayer(onIDSuccess, onIDError);
                    return;
                }

                if (_inicioConfiguracionTimestamp === null) {
                    _inicioConfiguracionTimestamp = new Date().getTime();
                } else if (new Date().getTime() - _inicioConfiguracionTimestamp > MAX_SEGUNDOS_DURACION_CONSULTA_PID * 1000) {
                    window.location = "qrcode_sin_respuesta.html";
                }
                //si estamos aquí ya tenemos id válido, comprobar que esté validado en servidor    
                getPIDByIDPlayerJS(onPIDSuccess, onPIDError);

            } else {
                console.log("[CONFIGURE]: config: ya estamos configurados ");
                navigateToIndex();
            }
        }

        var _lastQrUrl;
        var _lastSize;
        function redimensionarQRCode(size) {
            // Redibujamos solo si es necesario, 
            if (_lastSize != size) {
                document.getElementById("qrcode").style.display = "none";
                setTimeout(function () { // lo hacemos "asincronamente" puesto que es lento
                    createQRCode(null, size, true);
                }, 1);

            }
        }

        function createQRCode(url, size, force) { // Si url = null, redibuja la última url

            url = url || _lastQrUrl;
            _lastQrUrl = url;
            _lastSize = size;
            force = force || false;

            if (!url) {
                console.error("[CONFIGURE] Url nula para el qrcode");
                return;
            }

            if (!force && document.getElementById("qrcode").innerHTML != "") return;

            document.getElementById("qrcode").innerHTML = "";
            var qrcode = new QRCode(document.getElementById("qrcode"), {
                width: size,
                height: size
            });

            //qrcode.makeCode(url);

            // [CAR] En SSSP2 el qrcode a veces se dibuja antes de que cargue el fondo. Con esto se disimula, aunque el QRCode tarda un pelin en dibujarse
            document.getElementById("qrcode").style.display = "none";
            qrcode.makeCode(url);
            setTimeout(function () { document.getElementById("qrcode").style.display = "block"; }, 1);


            locateItems();
        }

        init();
    };

    var _onUnload = function () {

    };

    return {
        onLoad: _onLoad,
        onUnload: _onUnload
    };
})();
