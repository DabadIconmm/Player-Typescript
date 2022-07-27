/*Hivestack*/
Dnv.SSP.Hivestack = {};
Dnv.SSP.Hivestack.VastSolicitado = false;
Dnv.SSP.Hivestack.VastSolicitadoInterval = false;
Dnv.SSP.Hivestack.Enable = false;
Dnv.SSP.Hivestack.Ad = {};
Dnv.SSP.Hivestack.PlayList = {};
Dnv.SSP.Hivestack.config = {};
Dnv.SSP.Hivestack.IsEnabled = function IsEnabled() {
    var ActivoHivestack = Dnv.cfg.getCfgString("SSP_Hivestack_enabled", "false");
    if (ActivoHivestack == "true" || ActivoHivestack == "True") {
        return true;
    } else {
        return false;
    }
}
Dnv.SSP.Hivestack.Play = function () {
    if (Dnv.SSP.Hivestack.IsEnabled()) {
        try {
            var ActivoHivestack = Dnv.cfg.getCfgString("SSP_Hivestack_enabled", "false");
            if (ActivoHivestack == "true" || ActivoHivestack == "True") {
                Dnv.Pl.fetchPlaylistHivestack(function () { Dnv.monitor.writeLogFile("[PLAYLIST] .SSP. PIDO PL Hivestack") });
                Dnv.cfg.setInternalCfgBoolean("HivestackPlayerEnabled", true);
                setTimeout(Main.iniciarTimerPlaylistHivestack, 1000);
            }
        } catch (e) {
            Dnv.monitor.writeLogFile(".SSP.Hivestack  al dar al play!! Hivestack" + e, LogLevel.Error);
        }
    }
};

Dnv.SSP.Hivestack.getRecursoClassFromAd = function getRecursoClassFromAd() {
    if (Dnv.SSP.Hivestack.IsEnabled()) {
        var elementAd = Dnv.SSP.Hivestack.Ad;
        if (elementAd == undefined) {
            Dnv.monitor.writeLogFile("[Dnv.SSP.Hivestac.getRecursoClassFromAd] No tengo VAST", LogLevel.Error);
            return null; //No tengo VAST
        }
        var arr = Dnv.Pl.lastPlaylist.getRecursos();

        if (arr[elementAd.codigo] == undefined) {
            Dnv.monitor.writeLogFile("[Dnv.SSP.Hivestack.getRecursoClassFromAd] No he encontrado el recurso en la playlist por lo que no estará descargado", LogLevel.Error);
            return null;
        }
        return arr[elementAd.codigo][Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0]];
    } else {
        return null;
    }
};


Dnv.SSP.Hivestack.Impresion = function Impresion() {
    var ret = false;
    var url = this.Ad.impression;
    if (this.Ad.impression !== undefined) {


        function errHandler(e) {
            if (client.status === 404 && client.responseText.indexOf("Extremo no encontrado") >= 0) {
                Dnv.monitor.writeLogFile("[Dnv.SSP.Hivestack.Impresion] El servidor no implementa enviar ImpressionHivestack",LogLevel.Error);
            } else {

                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.warn("[Dnv.SSP.Hivestack.Impresion] Error al enviar impresión Hivestack: " + e, LogLevel.Error);
                }
                try {
                    if (errorCallback) errorCallback();
                } catch (e) {

                }

            }

        }

        function handler() {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {
                    Dnv.monitor.writeLogFile("[Dnv.SSP.ImpresionHivestack] Respuesta a la peticion impresión Hivestack: " + this.responseText);
                    Dnv.monitor.writeLogFile("[Dnv.SSP.ImpresionHivestack] Enviamos impresion Hivestack. Recibida respuesta: " + this.responseText);
                    if (Dnv.monitor.sendLogRabbit);
                    Dnv.monitor.sendLogRabbit(".SSP. Enviamos impresion a Hivestack " + Dnv.SSP.Hivestack.Ad.mediaFile + " cuya respuesta es " + this.responseText);
                    if (this.responseText === "null") {
                        errHandler("[Dnv.SSP.ImpresionHivestack] No se recibió Respuesta a la peticion impresión Hivestack");

                    } else {
                        ret = true;
                    }

                } else if (client.status === 404) {
                    Dnv.monitor.writeLogFile("[Dnv.SSP.Hivestack] El servidor no pudo obtener un impresión Hivestack", LogLevel.Error);
                    //Pedimos el vast siguiente si no es un player sincronizado o es maestro
                    if (!Dnv.sincronizacion.isConectado() || (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro())) {
                        var uuid = JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", '{"config": {"uuid": "","url": "apps.hivestack.com","logstashEnabled": "True"},"campanya":{"id_campanya": "1322","empresa": "192","usuario": "389","id_insercion": "4107"}}')).config.uuid;

                        if (uuid == null || uuid == undefined) {
                            Dnv.monitor.writeLogFile("[Dnv.SSP.ImpresionHivestack] Error: No hemos obtenido UUID de Hivestack", LogLevel.Error);
                            return;
                        }

                    }
                } else {
                    errHandler("Error HTTP: " + this.statusText);
                    if (!Dnv.sincronizacion.isConectado() || (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro())) {
                        var uuid = JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", '{"config": {"uuid": "","url": "apps.hivestack.com","logstashEnabled": "True"},"campanya":{"id_campanya": "1322","empresa": "192","usuario": "389","id_insercion": "4107"}}')).config.uuid;

                        if (uuid == null || uuid == undefined) {
                            Dnv.monitor.writeLogFile("[Dnv.SSP.ImpresionHivestack] Error: No hemos obtenido UUID de Hivestack", LogLevel.Error);
                            return;
                        }
                    }
                }
            }
        }



        var client = new XMLHttpRequest();
        client.onreadystatechange = handler;
        client.onerror = errHandler;
        client.timeout = 5000;
        client.ontimeout = function () {
            errHandler("Timed out al obtener impresión Hivestack!!!");
        };
        if (url.includes("[unit_id]")) {
            var uuid = JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", '{"config": {"uuid": "","url": "apps.hivestack.com","logstashEnabled": "True"},"campanya":{"id_campanya": "1322","empresa": "192","usuario": "389","id_insercion": "4107"}}')).config.uuid;

            if (uuid == null || uuid == undefined) {
                Dnv.monitor.writeLogFile("[SERVIDOR] Error: No hemos obtenido UUID de Hivestack", LogLevel.Error);
                return;
            }
            url = url.replace("[unit_id]", uuid);
        }

        client.open("GET", url);

        client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
        client.send();

    } else {
        Dnv.monitor.writeLogFile(".SSP.Impresion Intento hacer una impression sin URL");
    }
    return ret;

};
Dnv.SSP.Hivestack.getVast = function getVast() {
    try {
        var obConfig = JSON.parse(Dnv.cfg.getCfgString("Configuracion_Hivestack", '{"config": {"uuid": "","url": "apps.hivestack.com","logstashEnabled": "True"},"campanya":{"id_campanya": "1322","empresa": "192","usuario": "389","id_insercion": "4107"}}'));
        var url = "https://" + obConfig.config.url + "/nirvana/api/v1/units/" + obConfig.config.uuid + "/schedulevast";
        Dnv.monitor.writeLogFile(".SSP. Solicito  VAST Hivestack -->" + url);

        var client = new XMLHttpRequest();
        var ret = {};
        client.onreadystatechange = function () {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {
                    if (this.responseXML) { // FIXME cambiar cuando se llame a GetNew
                        var vastElement
                        try {
                            if (this.responseXML.getElementsByTagName("Ad").length != 0) {
                                vastElement = this.responseXML.getElementsByTagName("Ad")[0];
                                var help = false;
                                for (var i = 0; i < Dnv.SSP.Hivestack.PlayList.length; i++) {
                                    var rec = Dnv.SSP.Hivestack.PlayList[i];
                                    var url = rec.url.replace(/ /g, "");
                                    Dnv.monitor.writeLogFile(".SSP. Matcheando VAST Hivestack recurso playlist-->" + url);
                                    if (rec.url.replace(/ /g, "") == vastElement.getElementsByTagName("MediaFile")[0].textContent.replace(/ /g, "").trim()) {
                                        help = true;
                                        var ad = {};
                                        ad.impression = vastElement.getElementsByTagName("Impression")[0].textContent.replace(/[\n\r]+/g, '').replace(/ /g, "");
                                        ad.codigo = rec.creative_id.toString() + rec.file_size.toString();
                                        ad.remoteURL = rec.url;
                                        ad.uuid = rec.uuid;
                                        ad.size = rec.file_size;
                                        ad.duration = rec.duration;
                                        ad.error = vastElement.getElementsByTagName("Error")[0].textContent.replace(/[\n\r]+/g, '').replace(/ /g, "");
                                        ad.duracion = vastElement.getElementsByTagName("Duration")[0].textContent;
                                        ad.mediaFile = vastElement.getElementsByTagName("MediaFile")[0].textContent.replace("/creative", "_creative").replace(/[\n\r]+/g, '').replace(/ /g, "");
                                        ad.localFile = Dnv.Cloud.downloader.getLocalUrlHivestack(ad.mediaFile);
                                        ad.typeOfContent = vastElement.getElementsByTagName("MediaFile")[0].getAttribute("type");
                                        switch (ad.typeOfContent.split("/")[0]) {
                                            case "image": ad.tipo_objeto = 204; break;
                                            case "video": ad.tipo_objeto = 205; break;
                                            case "html5": ad.tipo_objeto = 218; break;
                                        }



                                        Dnv.SSP.Hivestack.Ad = ad;
                                        var enviar = true;
                                        try {
                                            enviar = Dnv.sincronizacion.isConectado();
                                        } catch (e) {
                                            Dnv.monitor.writeLogFile(".SSP.Hivestack() Error al enviar VAST Hivestack" + e);
                                        }
                                        if (enviar) {
                                            Dnv.sincronizacion.sendVastHivestack();
                                        } else {
                                            Dnv.monitor.writeLogFile(".SSP. No estoy conectado!! no envio VAST de Hivestack");
                                        }
                                        Dnv.SSP.Hivestack.VastSolicitado = true;

                                    }
                                }
                                if (!help) {
                                    Dnv.monitor.writeLogFile(".SSP. No se ha encontrado el recurso en la playlist!!" + vastElement.getElementsByTagName("MediaFile")[0].textContent.replace(/ /g, "").trim());
                                }
                            } else {
                                Dnv.SSP.Hivestack.VastSolicitado = false;
                            }

                        } catch (e) {
                            Dnv.monitor.writeLogFile(".SSP.Hivestack() Error al enviar VAST Hivestack" + e);
                            errHandler(e);

                        }


                    } else if (this.responseText === "null") {
                        errHandler("[Dnv.SSP.getVastHivestack] No se recibió vast Hivestack");
                    } else { //ni playlist ni nulo, no es válido.
                        errHandler("[Dnv.SSP.getVastHivestack] No se recibió vast Hivestack");
                    }
                } else if (client.status === 400) {
                    console.error("[Dnv.SSP.getVastHivestack][400] Peticion de vast erronea: " + this.responseText);
                } else if (client.status === 404) {
                    Dnv.monitor.writeLogFile("[Dnv.SSP.getVastHivestack][404] El servidor no pudo obtener un vast Hivestack");

                } else {
                    console.error("GetVastHivestack() Error HTTP: " + this.statusText);

                }
            }
        };

        client.onerror = function () {
            if (client.status === 404 && client.responseText.indexOf("Extremo no encontrado") >= 0) {
                Dnv.monitor.writeLogFile("[Dnv.SSP.getVastHivestack] El servidor no implementa getVastHivestack, usamos la petición antigua...");
            } else {

                if (Dnv.utiles.debeLoguearFallosDeRed()) {
                    console.warn("[Dnv.SSP.getVastHivestack] Error al pedir vast Hivestack: " + e);
                }

            }
        };
        client.ontimeout = function () {
            errHandler("[Dnv.SSP.getVastHivestack] Timed out al obtener vast Hivestack!!!");
        };

        client.open("GET", url);
        client.send();
    } catch (e) {
        console.error("[.SSP.Hivestack] getVast() No he pedido VAST debido a que falla algo de la configuración" + e);
    }


}