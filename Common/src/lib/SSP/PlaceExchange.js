/*PlaceExchange*/
Dnv.SSP.PlaceExchange = {};
Dnv.SSP.PlaceExchange.Ad = {};
Dnv.SSP.PlaceExchange.TimeoutPeticionPl;
Dnv.SSP.PlaceExchange.IntervalPl;
Dnv.SSP.PlaceExchange.Token = "";
Dnv.SSP.PlaceExchange.IsEnabled = function IsEnabled() {
    var enabled = Dnv.cfg.getCfgString("SSP_placeExchange_enabled");
    if (enabled == "true" || enabled == "True") {
        return true;
    } else {
        return false;
    }
}
Dnv.SSP.PlaceExchange.getRecursoClassFromAd = function () {
    if (Dnv.SSP.PlaceExchange.IsEnabled()) {

    var d = new Date().getTime();
    var arr = Dnv.Pl.lastPlaylist.getRecursos();
    var idioma = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0];
    var arrKeys = Object.keys(arr);

    for (var i = 0; i < arrKeys.length; i++) {
        if (arr[arrKeys[i]] !== undefined) {
            if (arr[arrKeys[i]][idioma] !== undefined) {
                if (arr[arrKeys[i]][idioma].getRemoteUrl() == Dnv.SSP.PlaceExchange.Ad.mediaFile) {
                    return arr[arrKeys[i]][idioma];
                }
            }
        } else {
            console.info("Dnv.SSP.PlaceExchange.getRecursoClassFromAd() -> Dispongo de un recurso " + arrKeys[i])
        }
        }

    }
    return null;
}
Dnv.SSP.PlaceExchange.Impresion = function (start) {
    try {
        var url = Dnv.SSP.PlaceExchange.Ad.impression.replace("[DURATION]", Dnv.SSP.PlaceExchange.Ad.duracion).replace("[START]", start);
        var client = new XMLHttpRequest();
        client.onreadystatechange = function () {
            if (this.readyState === this.DONE) {
                if (this.status === 200 || this.status === 204) {
                    Dnv.monitor.sendLogRabbit(".SSP.PlaceExchange() Confirmamos impresion de PlaceExchange");
                    if (this.responseText != "") {
                        try {
                            Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Enviada impresion de PlaceExchange" + this.responseText);
                            
                        } catch (e) {

                        }
                    }
                }
            }
        }
        client.onerror = function (e) {
            Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Error al enviar impresion de PlaceExchange", LogLevel.Error);
            Dnv.monitor.sendLogRabbit(".SSP.PlaceExchange() Error al confirmar impresion de PlaceExchange");
        };
        client.timeout = 5000;
        client.ontimeout = function () {
            Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Timeout a enviar impresion del VAST");
            Dnv.monitor.sendLogRabbit(".SSP.PlaceExchange() Timeout al confirmar impresion de PlaceExchange");
        };
        client.open("GET", url);
        client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        client.setRequestHeader('Content-Type', 'application/json');
        Dnv.monitor.writeLogFile("Dnv.SSP.PlaceExchange() Envio impresion del vast --> " + url);
        client.send();
    } catch (e) {

    }
}
Dnv.SSP.PlaceExchange.Play = function () {
  
    if (Dnv.SSP.PlaceExchange.IsEnabled()) {
        try {
            if (Dnv.SSP.PlaceExchange.Enable != true) {
                Dnv.SSP.PlaceExchange.Config = JSON.parse(Dnv.cfg.getCfgString("Configuracion_placeExchange", ''));
                Dnv.SSP.PlaceExchange.GetToken();
                Dnv.SSP.PlaceExchange.IntervalPl = setInterval(Dnv.SSP.PlaceExchange.GetPlayList, Dnv.cfg.getCfgInt("SegundosTimer", 30) * 1000);
                Dnv.SSP.PlaceExchange.getVast();
                Dnv.SSP.PlaceExchange.Enable = true;
            }

        } catch (e) {
            Dnv.monitor.writeLogFile("[Dnv.SSP.PlaceExchange.Play] Error: No hemos obtenido configuracion correcta de PlaceExchange", LogLevel.Error);
            Dnv.SSP.PlaceExchange.Enable = false;
        }
    }
}
Dnv.SSP.PlaceExchange.ParsePlayList = function (json) {
    try {
        Dnv.monitor.writeLogFile("[PLAYLIST PLACEEXCHANGE] .SSP. : Parseando playlist");
        var dtime = new Date().getTime();
        Dnv.SSP.PlaceExchange.PlayList = json;
        var recursos = {};

        for (var i = 0; i < json.length; i++) {
            var element = json[i];
     
            for (var k = 0; k < element.creative.snapshots.length; k++) {

                var recurso = element.creative.snapshots[k];
                if (recurso.h == Dnv.Pl.lastPlaylist.getPlayer().getSalida().getResolucion().getAlto() && recurso.w == Dnv.Pl.lastPlaylist.getPlayer().getSalida().getResolucion().getAncho()) {
                    var Clase = null;
                    switch (recurso.mime.split("/")[0]) {
                        case "image": Clase = Dnv.Pl.Imagen; break;
                        case "video": Clase = Dnv.Pl.Video; break;
                        case "html5": Clase = Dnv.Pl.Html5; break;
                    }
                    if (Clase != null) {
                        var metadatos = {};
                        metadatos.filename = recurso.curl;
                        metadatos.codigo = element.ts;
                        metadatos.remoteURL = recurso.curl;
                        metadatos.uuid = element.creative.id
                        metadatos.size = 0;
                        metadatos.duracion = 0;
                        Dnv.Pl.SSPRecursos.push(metadatos.codigo);

                        switch (recurso.mime.split("/")[0]) {
                            case "image": metadatos.tipo_objeto = 204; break;
                            case "video": metadatos.tipo_objeto = 205; break;
                            case "html5": metadatos.tipo_objeto = 218; break;
                        }

                        var datasourceRecurso = 0;

                        var idioma = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0];

                        // en el array "recursos" hay una entrada por cada vinculo, y estas a su vez tienen tantas entradas como idiomas tenga el recurso
                        var vinculo = parseInt(metadatos.codigo, 10);
                        if (!recursos[vinculo]) {
                            recursos[vinculo] = {};
                        }


                        recursos[vinculo][idioma] = new Clase(
                            metadatos.codigo,
                            metadatos.filename,
                            metadatos.codigo,
                            metadatos.tipo_objeto,
                            metadatos.codigo,
                            metadatos,
                            datasourceRecurso,
                            Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0],
                            "1",
                            "1",
                            0,
                            0,
                            true,
                            "7"
                        )
                    }
                }
            }

        }
        if (Dnv.Pl.lastPlaylist) {
            var pl = new Dnv.Pl.Playlist(Dnv.Pl.lastPlaylist.getCanales(), Dnv.Pl.lastPlaylist.getPlayer(), Dnv.Pl.lastPlaylist.getPlantillas(), Dnv.Pl.lastPlaylist.getStreams(), Object.assign(Dnv.Pl.lastPlaylist.getRecursos(), recursos));
        }
        function ordenarRecursos(a, b) {
            if (a.getSize() < b.getSize()) return -1;
            if (a.getSize() > b.getSize()) return 1;
            return 0;
        }
        var recursosDownload = [];
        var recursosPlaylist = [];
        var idiomasSalida = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas();
        if (Dnv.Cloud.isFileSystemAvailable()) {
            for (var key_recurso in recursos) {
                //if (!isNaN(key_recurso)) {
                for (var l = 0; l < idiomasSalida.length; l++) {

                    var recurso = recursos[key_recurso][idiomasSalida[l]];

                    if (!recursos[key_recurso]) {
                        continue;
                    } else if (!recursos[key_recurso].hasOwnProperty(idiomasSalida[l])) {
                        recurso = recursos[key_recurso][Object.keys(recursos[key_recurso])[0]];
                    }

                    recursosPlaylist.push({ localUrl: Dnv.Cloud.downloader.getLocalUrl(recurso.getMetadatos()["remoteURL"]), filenameOriginal: recurso.getFilename(), hashcode: recurso.getMetadatos()["uuid"], tipo: Dnv.Pl.lastPlaylistRecursosTipos.FICHERO });
                    recursosDownload.push(recurso);
                    //if (!Dnv.Cloud.downloader.isRecursoDisponible(recurso.getRemoteUrl(), recurso.getHashcode()) || usb) {
                    //    var descomprimir = false;
                    //    if (recurso.getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) descomprimir = true;
                    //    Dnv.Cloud.downloader.descargarRecurso(recurso.getRemoteUrl(), recurso.getHashcode(), descomprimir, usb);
                    //}
                    //}
                }
            }

            recursosDownload.sort(ordenarRecursos);

            for (var k = 0; k < recursosDownload.length; k++) {
                var recurso = recursosDownload[k];
                var descomprimir = false;
                if (recurso.getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) descomprimir = true;
                console.info("[PLAYLIST PlaceExchange]: Añadido a descargar " + recurso.getFilename() + " (" + recurso.getSize() + ")");
                Dnv.Cloud.downloader.descargarRecurso(recurso.getMetadatos()["remoteURL"], recurso.getHashcode(), descomprimir, false, recurso.getSize(), recurso.getCodigo());
                //Dnv.Cloud.downloader.descargarRecursoHivestack(recurso.getMetadatos()["remoteURL"], recurso.getHashcode(), descomprimir, usb, recurso.getSize(), recurso.getCodigo());
            }
        }
        if (Dnv.Pl.lastPlaylistRecursos) {
            Dnv.Pl.lastPlaylistRecursos = Dnv.Pl.lastPlaylistRecursos.concat(recursosPlaylist);
        } else {
            Dnv.Pl.lastPlaylistRecursos = recursosPlaylist;
        }

        var dtime2 = new Date().getTime();
        Dnv.monitor.sendLogRabbit(".SSP.PlaceExchange() PlayList PlaceExchange parseada correctamente");
        console.info(".SSP.PlaceExchange  He tardado " + (dtime2 - dtime) + " en parsear y agregar los recursos de placeExchange");
    } catch (e) {
        console.error("[.SSP.PlaceExchange] Error al parsear playlist de PlaceExchange" + e);
    }

}
Dnv.SSP.PlaceExchange.GetPlayList = function () {
    try {

        var url = Dnv.SSP.PlaceExchange.Config.config.url + "/v3/orgs/" + Dnv.SSP.PlaceExchange.Config.config.orgid + "/adapprovals";

        var client = new XMLHttpRequest();
        client.onreadystatechange = function () {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {
                    if (this.responseText != "") {
                        try {
                            console.log(".SSP.PlaceExchange() Playlist recibida: " + this.responseText)
                            Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Playlist recibida: " + this.responseText, LogLevel.Info);
                            Dnv.SSP.PlaceExchange.ParsePlayList(JSON.parse(this.responseText));
                            Dnv.sincronizacion.sendVastPlaceExchange();
                        } catch (e) {
                            Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Error al pedir playlist ", LogLevel.Error);
                        }
                    }
                }
            }
        }
        client.onerror = function (e) {
            Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Error al solicitar Playlist de PlaceExchange pruebo a pedir token de nuevo", LogLevel.Error);
            try {
                clearTimeout(Dnv.SSP.PlaceExchange.TimeoutPeticionPl);
            } catch (e) {

            }
            Dnv.SSP.PlaceExchange.TimeoutPeticionPl = setTimeout(Dnv.SSP.PlaceExchange.GetToken, 1000);
            // Dnv.monitor.writeLogFile("[Dnv.SSP.PlaceExchange.getVast] Error: No hemos obtenido Vast de PlaceExchange", LogLevel.Error);
        };
        client.timeout = 5000;
        client.ontimeout = function () {
            Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Error al solicitar Playlist de PlaceExchange pruebo a pedir token de nuevo");
            try {
                clearTimeout(Dnv.SSP.PlaceExchange.TimeoutPeticionPl);
            } catch (e) {

            }
            Dnv.SSP.PlaceExchange.TimeoutPeticionPl = setTimeout(Dnv.SSP.PlaceExchange.GetToken, 1000);
        };

        client.open("GET", url);
        client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        client.setRequestHeader('Content-Type', 'application/json');
        client.setRequestHeader('Authorization', 'Bearer ' + Dnv.SSP.PlaceExchange.Token);
        Dnv.monitor.writeLogFile("Dnv.SSP.PlaceExchange() Solicito PlayList de PlaceExchange con bearer " + Dnv.SSP.PlaceExchange.Token);
        client.send();
    } catch (e) {
        Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Error al solicitar Playlist de PlaceExchange faltará config?");
    }
}
Dnv.SSP.PlaceExchange.GetToken = function () {
    try {
        var url = Dnv.SSP.PlaceExchange.Config.config.url + "/v3/token";
        var body = '{"username":"' + Dnv.SSP.PlaceExchange.Config.config.user + '","password":"' + Dnv.SSP.PlaceExchange.Config.config.password + '"}';
        var client = new XMLHttpRequest();
        client.onreadystatechange = function () {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {
                    if (this.responseText != "") {
                        console.log(".SSP.PlaceExchange() Token recibido: " + this.responseText)
                        Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Token recibido: " + this.responseText, LogLevel.Info);
                        try {
                            Dnv.SSP.PlaceExchange.Token = JSON.parse(this.responseText).access_token;
                            Dnv.SSP.PlaceExchange.GetPlayList();
                        } catch (e) {

                        }
                    }
                }
            }
        }
        client.onerror = function (e) {
            Dnv.monitor.writeLogFile("Dnv.SSP.PlaceExchange() Error al solicitar Bearer lo vuelvo a intentar" + e, LogLevel.Error);
            try {
                clearTimeout(Dnv.SSP.PlaceExchange.TimeoutPeticionPl);
            } catch (e) {

            }
            Dnv.SSP.PlaceExchange.TimeoutPeticionPl = setTimeout(Dnv.SSP.PlaceExchange.GetToken, 1000);
            // Dnv.monitor.writeLogFile("[Dnv.SSP.PlaceExchange.getVast] Error: No hemos obtenido Vast de PlaceExchange", LogLevel.Error);
        };
        client.timeout = 5000;
        client.ontimeout = function () {

        };

        client.open("POST", url);
        client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        client.setRequestHeader('Content-Type', 'application/json');

        client.send(body);
    } catch (e) {

    }
}
Dnv.SSP.PlaceExchange.getVast = function getVast() {
    try {
        var obConfig = Dnv.SSP.PlaceExchange.Config;

        var url = obConfig["config"]["url"] + "/v3/orgs/" + obConfig["config"]["orgid"] + "/adunits/" + obConfig["config"]["macro"] + "/adrequests?format=vast2";
        Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Solicito VAST-->" + url);
        var client = new XMLHttpRequest();
        client.onreadystatechange = function () {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {
                    if (this.responseXML) { // FIXME cambiar cuando se llame a GetNew
                        console.log(".SSP.PlaceExchange() VAST recibido: " + this.responseXML)
                        Dnv.monitor.writeLogFile(".SSP.PlaceExchange() VAST recibido: " + this.responseXML, LogLevel.Info);
                        var vastElement
                        try {
                            if (this.responseXML.getElementsByTagName("Ad").length != 0) {
                                vastElement = this.responseXML.getElementsByTagName("Ad")[0];
                                var mediaFile = vastElement.getElementsByTagName("MediaFile")[0].textContent.replace(/[\n\r]+/g, '').replace(/ /g, "");
                                var help = false;
                                help = true;
                                var ad = {};
                                ad.impression = vastElement.getElementsByTagName("Impression")[0].textContent;
                                ad.codigo = mediaFile.split("/")[mediaFile.split("/").length - 2];
                               
                                var MediaFile = vastElement.getElementsByTagName("MediaFile");
                                for (var i = 0; i < MediaFile.length; i++) {
                                    if (MediaFile[i].getAttribute("width") == Dnv.Pl.lastPlaylist.getPlayer().getSalida().getResolucion().getAncho() && MediaFile[i].getAttribute("height") == Dnv.Pl.lastPlaylist.getPlayer().getSalida().getResolucion().getAlto()) {
                                        ad.uuid = MediaFile[i].textContent.replace(/[\n\r]+/g, '').replace(/ /g, "");
                                        ad.mediaFile = MediaFile[i].textContent;
                                        ad.typeOfContent = MediaFile[i].getAttribute("type");
                                    }
                                }
                                    //Dnv.Pl.lastPlaylist.getPlayer().getSalida().getResolucion().getAlto()
                                ad.duracion = vastElement.getElementsByTagName("Duration")[0].textContent.replace(/[\n\r]+/g, '').replace(/ /g, "");
                              
                               
                                switch (ad.typeOfContent.split("/")[0]) {
                                    case "image": ad.tipo_objeto = 204; break;
                                    case "video": ad.tipo_objeto = 205; break;
                                }
                                Dnv.SSP.PlaceExchange.Ad = ad;
                                var enviar = true;
                                try {
                                    enviar = Dnv.sincronizacion.isConectado();
                                } catch (e) {
                                    Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Error al enviar VAST PlaceExchange" + e);
                                }
                                if (enviar) {
                                    Dnv.monitor.writeLogFile(".SSP.PlaceExchange Envio VAST");
                                    Dnv.sincronizacion.sendVastPlaceExchange();
                                } else {
                                    Dnv.monitor.writeLogFile(".SSP.PlaceExchange No estoy conectado!! no envio VAST");
                                }
                                Dnv.SSP.PlaceExchange.VastSolicitado = true;

                                if (!help) {
                                    Dnv.monitor.writeLogFile(".SSP.PlaceExchange No se ha encontrado el recurso en la playlist!!" + vastElement.getElementsByTagName("MediaFile")[0].textContent.replace(/ /g, "").trim());
                                }
                            } else {
                                Dnv.SSP.PlaceExchange.VastSolicitado = false;
                            }

                        } catch (e) {
                            Dnv.monitor.writeLogFile(".SSP.PlaceExchange() Error al enviar VAST PlaceExchange" + e);


                        }


                    } else if (this.responseText === "null") {

                    } else { //ni playlist ni nulo, no es válido.

                    }
                } else if (client.status === 404) {


                } else {


                }
            }
        };
        client.onerror = function (e) {
            Dnv.monitor.writeLogFile("[Dnv.SSP.PlaceExchange.getVast] Error: No hemos obtenido Vast de PlaceExchange", LogLevel.Error);
        };
        client.timeout = 5000;
        client.ontimeout = function () {
            Dnv.monitor.writeLogFile("[Dnv.SSP.PlaceExchange.getVast Timeout] Error: No hemos obtenido Vast de PlaceExchange", LogLevel.Error);
        };

        client.open("GET", url);
        client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
        client.send();
    } catch (e) {

    }
};
Dnv.SSP.PlaceExchange.VastSolicitado = false;
Dnv.SSP.PlaceExchange.VastSolicitadoInterval = false;
Dnv.SSP.PlaceExchange.Enable = false;
Dnv.SSP.PlaceExchange.Config = {};