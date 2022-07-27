/*Admooh*/
Dnv.SSP.Admooh = {};
Dnv.SSP.Admooh.Ad = {};
Dnv.SSP.Admooh.Enable = false;
Dnv.SSP.Admooh.Interval;
Dnv.SSP.Admooh.Timeout;
Dnv.SSP.Admooh.Playlist = [];
Dnv.SSP.Admooh.PlInterval;
Dnv.SSP.Admooh.VastSolicitado;
Dnv.SSP.Admooh.Cfg;
Dnv.SSP.Admooh.Mask = 20000000;
Dnv.SSP.Admooh.Int = 1;
Dnv.SSP.Admooh.lastPrint = "00000000-0000-0000-0000-000000000000";
Dnv.SSP.Admooh.IsEnabled = function IsEnabled() {
    var enabled = Dnv.cfg.getCfgString("SSP_adMooH_enabled", "True");
    if (enabled == "true" || enabled == "True") {
        return true;
    } else {
        return false;
    }
}
Dnv.SSP.Admooh.Play = function() {
    //Configuracion_adMooH
    /*
{"config": {"tokenApp": "a26413ee-5bce-4d21-924c-dbf1b1304cea","url": "https://api-agent.admooh.com/agent/","key":"b26dad9865254ab1bbcd42271d6c71d0","logstashEnabled": "True"},"campanya": {"id_campanya": "1695","empresa": "195","usuario": "395","id_insercion": "5294","objid_insercion": "4027174"}}
 */
    console.info(".SSP.Admooh Iniciamos admooh porque se detecta que hay capa");
    if (Dnv.SSP.Admooh.IsEnabled()) {
        console.info(".SSP.Admooh Admooh está habilitado");
        try {

            Dnv.SSP.Admooh.Cfg = JSON.parse(Dnv.cfg.getCfgString("Configuracion_adMooH", ""));
        } catch (e) {
            Dnv.SSP.Admooh.Enable = false;
            Dnv.monitor.writeLogFile(".SSP. No hay configuración Admooh");
            return;
        }
        if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro() || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") == ";;" || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") == "0") {
            if (!Dnv.SSP.Admooh.Interval) {
                Dnv.SSP.Admooh.Interval = setInterval(Dnv.SSP.Admooh.Ping, 10000);
                Dnv.SSP.Admooh.PlInterval = setInterval(Dnv.SSP.Admooh.GetPlayList, Dnv.cfg.getCfgInt("SegundosTimer", 30) * 1000);
            }
        }
        Dnv.SSP.Admooh.Enable = true;
    } else {
        console.info(".SSP.Admooh Admooh NO está habilitado");
    }
};

Dnv.SSP.Admooh.getRecursoClassFromAd = function getRecursoClassFromAd() {
    if (Dnv.SSP.Admooh.IsEnabled()) {
        if (Dnv.SSP.Admooh.Ad.mediaFile != undefined && Dnv.SSP.Admooh.Ad.mediaFile !== "" && Dnv.SSP.Admooh.Ad.mediaFile !== null) {


            var arr = Dnv.Pl.lastPlaylist.getRecursos();
            var idioma = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0];
            var arrKeys = Object.keys(arr);
            for (var i = 0; i < arrKeys.length; i++) {
                if (arr[arrKeys[i]] !== undefined) {
                    if (arr[arrKeys[i]][idioma] !== undefined) {

                        if (arr[arrKeys[i]][idioma].getRemoteUrl() == Dnv.SSP.Admooh.Ad.mediaFile) {
                            return arr[arrKeys[i]][idioma];
                        }
                    }
                } else {
                    console.info("Dnv.SSP.Admooh.getRecursoClassFromAd() -> Dispongo de un recurso " + arrKeys[i])
                }
            }
        } else {
            try {
                clearTimeout(Dnv.SPP.Admooh.Timeout);
            } catch (e) {

            }
            if (!Dnv.sincronizacion.isConectado() || (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro())) {
                Dnv.SSP.Admooh.Timeout = setTimeout(function() { Dnv.SSP.Admooh.GetVast(); }, 1000);
            }

        }
    }
    return null;
}


Dnv.SSP.Admooh.ParsePlayList = function ParsePlayList(arr) {
    console.info(".SSP.ParsePlaylistAdmooh() Empezamos a parsear playlist de admoooh con un length" + arr.length);
    var recursos = {};
    var idioma = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0];
    arr.forEach((item, index) => {
        item.creatives.forEach(creative => {
            var type = "";

            if (creative.url.indexOf("mp4") != -1) {
                type = "video";
            } else if (creative.url.indexOf("jpg") != -1 || creative.url.indexOf("png") != -1) {
                type = "image";
            }

            if (type != "") {
                Dnv.monitor.writeLogFile("PLAYLIST .SSP.Admooh: Recurso " + Dnv.SSP.Admooh.Cfg.config.url + creative.url);
                var Clase = null;
                switch (type) {
                    case "image":
                        Clase = Dnv.Pl.Imagen;
                        break;
                    case "video":
                        Clase = Dnv.Pl.Video;
                        break;
                    case "html5":
                        Clase = Dnv.Pl.Html5;
                        break;
                }
                if (Clase !== null) {
                    var metadatos = {};
                    var remoteU;


                    metadatos.filename = creative.url.split("/")[2];
                    metadatos.codigo = (Dnv.SSP.Admooh.Mask + item.advertisementId) + "" + index;
                    metadatos.remoteURL = Dnv.SSP.Admooh.Cfg.config.url + creative.url;
                    metadatos.uuid = creative.url.split("/")[2].split(".")[0];
                    metadatos.size = 0;
                    metadatos.duracion = item.durationInSec;
                    Dnv.Pl.SSPRecursos.push(metadatos.codigo);
                    console.info("SSP.Admooh Agrego recurso -->" + metadatos.codigo);
                    switch (type) {
                        case "image":
                            metadatos.tipo_objeto = 204;
                            break;
                        case "video":
                            metadatos.tipo_objeto = 205;
                            break;
                        case "html5":
                            metadatos.tipo_objeto = 218;
                            break;
                    }
                    var datasourceRecurso = 0;

                    // en el array "recursos" hay una entrada por cada vinculo, y estas a su vez tienen tantas entradas como idiomas tenga el recurso
                    var vinculo = metadatos.codigo;
                    if (!recursos[vinculo]) {
                        recursos[vinculo] = {};
                    }
                    recursos[vinculo][idioma] = new Clase(
                        parseInt(metadatos.codigo, 10),
                        metadatos.filename,
                        metadatos.filename.split(".")[0],
                        metadatos.tipo_objeto,
                        parseInt(metadatos.codigo, 10),
                        metadatos,
                        datasourceRecurso,
                        Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0],
                        "1",
                        "1",
                        0,
                        Math.floor(metadatos.duracion),
                        true,
                        "6"
                    );
                }
            } else {
                console.info(".SSP.Admooh ParsePlayList() No tengo tipo de recurso-->" + JSON.stringify(creative));
            }

        });
    });

    /*{
        "advertisementId": 3957,
        "startDate": "2021-10-21T00:00:00Z",
        "endDate": "2021-11-21T23:59:59Z",
        "durationInSec": 15,
        "creatives": [
            {
                "externalId": null,
                "url": "files/advertisements/a9f5d1b5693240c69d3f97cf89f986ba.1.mp4",
                "width": 1920,
                "height": 1080
            }
        ]
    }*/
    if (Dnv.Pl.lastPlaylist) {
        var pl = new Dnv.Pl.Playlist(Dnv.Pl.lastPlaylist.getCanales(), Dnv.Pl.lastPlaylist.getPlayer(), Dnv.Pl.lastPlaylist.getPlantillas(), Dnv.Pl.lastPlaylist.getStreams(), Object.assign(Dnv.Pl.lastPlaylist.getRecursos(), recursos));
    } else {
        var pl = null;
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

                recursosPlaylist.push({ localUrl: Dnv.Cloud.downloader.getLocalUrl(recurso.getMetadatos()["remoteURL"]), filenameOriginal: recurso.getFilename(), hashcode: recurso.getFilename(), tipo: Dnv.Pl.lastPlaylistRecursosTipos.FICHERO });
                recursosDownload.push(recurso);
            }
        }

        for (var k = 0; k < recursosDownload.length; k++) {
            var recurso = recursosDownload[k];
            var descomprimir = false;
            if (recurso.getTipo() == Dnv.Pl.Recurso.tipos.TIPO_HTML5) descomprimir = true;
            Dnv.monitor.writeLogFile("[PLAYLIST]: Añadido a descargar " + recurso.getFilename() + " (" + recurso.getSize() + ")");
            Dnv.Cloud.downloader.descargarRecurso(recurso.getMetadatos()["remoteURL"], recurso.getHashcode(), descomprimir, false, recurso.getSize(), recurso.getCodigo());
        }
    }
    if (Dnv.Pl.lastPlaylistRecursos) {
        Dnv.Pl.lastPlaylistRecursos = Dnv.Pl.lastPlaylistRecursos.concat(recursosPlaylist);
    } else {
        Dnv.Pl.lastPlaylistRecursos = recursosPlaylist;
    }
}
Dnv.SSP.Admooh.GetPlayList = function GetPlayList() {
    var url = Dnv.SSP.Admooh.Cfg.config.url + "v1/displays/" + Dnv.SSP.Admooh.Cfg.config.tokenApp + "/advertisements"

    var client = new XMLHttpRequest();
    client.onreadystatechange = function() {
        if (this.readyState === this.DONE) {
            if (this.status === 200) {
                file = JSON.parse(this.responseText);
                Dnv.SSP.Admooh.ParsePlayList(file);
                Dnv.SSP.Admooh.Playlist = file;
                Dnv.sincronizacion.sendPlayListAdmooh();

            }
        }
    };
    client.onerror = function() {
        Dnv.monitor.writeLogFile(".SSP.Admooh Error al solicitar PlayList");
        setTimeout(function() {
            Dnv.SSP.Admooh.GetVast();
        }, 30000);
    };

    client.timeout = 5000;
    client.ontimeout = function() {
        Dnv.monitor.writeLogFile(".SSP.Admooh Timeout al solicitar Playlist");

    }
    client.open("GET", url);
    client.setRequestHeader("Ocp-Apim-Subscription-Key", Dnv.SSP.Admooh.Cfg.config.key);
    client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    // client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
    client.send();

}



Dnv.SSP.Admooh.Ping = function() {
    if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro() || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") == ";;" || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") == "0") {
        var url = Dnv.SSP.Admooh.Cfg.config.url + "displays/ping?token=" + Dnv.SSP.Admooh.Cfg.config.tokenApp;
        var client = new XMLHttpRequest();
        client.onreadystatechange = function() {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {
                    Dnv.monitor.writeLogFile(".SSP.Admooh  Enviado PING satisfactoriamente");
                }
            }
        };
        client.onerror = function() {

        };
        client.timeout = 5000;
        client.ontimeout = function() {
            Dnv.monitor.writeLogFile(".SSP.Admooh Timeout al hacer ping");
        };

        client.open("POST", url);
        client.setRequestHeader("Ocp-Apim-Subscription-Key", Dnv.SSP.Admooh.Cfg.config.key);
        client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        // client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
        client.send();
    } else {
        clearInterval(Dnv.SSP.Admooh.Interval);
    }

};
Dnv.SSP.Admooh.GetVast = function() {
    var url = Dnv.SSP.Admooh.Cfg.config.url + "displays?tokenApp=" + Dnv.SSP.Admooh.Cfg.config.tokenApp + "&duration=" + 15 + "&lastPrintId=" + Dnv.SSP.Admooh.lastPrint;
    /*Obtenemos primera parte File*/
    var file;
    var client = new XMLHttpRequest();
    client.onreadystatechange = function() {
        if (this.readyState === this.DONE) {
            if (this.status === 200) {
                file = JSON.parse(this.responseText);
                if (file != null) {
                    Dnv.SSP.Admooh.Ad.mediaFile = Dnv.SSP.Admooh.Cfg.config.url + file.fileUri;
                    Dnv.SSP.Admooh.Ad.Codigo = file.advertisementId;
                    Dnv.SSP.Admooh.Ad.printId = file.printId;
                    Dnv.sincronizacion.sendVastAdmooh();
                } else {
                    if (!Dnv.sincronizacion.isConectado() || (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro())) {
                        Dnv.SSP.Admooh.lastPrint = "00000000-0000-0000-0000-000000000000";
                        setTimeout(Dnv.SSP.Admooh.GetVast, 30000);
                    }

                }
            }
        }
    };
    client.onerror = function() {
        Dnv.monitor.writeLogFile(".SSP.Admooh Error al solicitar VAST");
        setTimeout(function() {
            Dnv.SSP.Admooh.GetVast();
        }, 30000);
    };

    client.timeout = 5000;
    client.ontimeout = function() {
        Dnv.monitor.writeLogFile(".SSP.Admooh Timeout al solicitar VAST");
        setTimeout(function() {
            Dnv.SSP.Admooh.GetVast();
        }, 30000);
    }
    client.open("GET", url);
    client.setRequestHeader("Ocp-Apim-Subscription-Key", Dnv.SSP.Admooh.Cfg.config.key);
    client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    // client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
    client.send();

};