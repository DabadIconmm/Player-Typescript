"use strict";

var Dnv = Dnv || {};

Dnv.Menuboard = Dnv.Menuboard || {};

Dnv.Menuboard.enabled = false;

Dnv.Menuboard.precios = [];
Dnv.Menuboard.servidorIP = "192.168.128.251";
Dnv.Menuboard.servidorPuerto = 8008;
Dnv.Menuboard.tiempoRefrescoPrecios = 60;
Dnv.Menuboard.servidorIPcompleta = "";

Dnv.Menuboard.ipRequest = "";

Dnv.Menuboard.sinPrecios = false;
Dnv.Menuboard.noExisteAlgunPrecio = false;
Dnv.Menuboard.noTenemosConexion = false;

Dnv.Menuboard.sinPreciosLast = false;
Dnv.Menuboard.noExisteAlgunPrecioLast = false;
Dnv.Menuboard.noTenemosConexionLast = false;

//evento que se lanza cuando han cambiado los precios
Dnv.Menuboard.PRECIOS_CAMBIADOS = "preciosCambiados";

Dnv.Menuboard.XML = 0;

Dnv.Menuboard.init = function () {

    if (Dnv.cfg.getCfgBoolean("Menuboard_PlayerHTML5_Enabled", false)) {

        Dnv.Menuboard.enabled = true;

        console.info("[MENUBOARD] Activado");
        Dnv.Menuboard.servidorIP = Dnv.cfg.getCfgString("Menuboard_PlayerHTML5_IPServidor", "192.168.128.251");
        Dnv.Menuboard.servidorPuerto = Dnv.cfg.getCfgInt("Menuboard_PlayerHTML5_PuertoServidor", 8008);
        Dnv.Menuboard.tiempoRefrescoPrecios = Dnv.cfg.getCfgInt("Menuboard_PlayerHTML5_TiempoRefrescoPrecios", 60);
        Dnv.Menuboard.servidorIPcompleta = Dnv.cfg.getCfgString("Menuboard_PlayerHTML5_IPServidorCompleta", "");

        if (Dnv.Menuboard.servidorIPcompleta == "") {
            Dnv.Menuboard.ipRequest = "http://" + Dnv.Menuboard.servidorIP + ":" + Dnv.Menuboard.servidorPuerto + "/GetPrices";
            console.info("[MENUBOARD] Servidor del menuboard configurado (composicion) en: " + Dnv.Menuboard.ipRequest);
        } else {
            Dnv.Menuboard.ipRequest = Dnv.Menuboard.servidorIPcompleta;
            console.info("[MENUBOARD] Servidor del menuboard configurado (completa) en: " + Dnv.Menuboard.ipRequest);
        }

        Dnv.Menuboard.obtenerPrecios();

        window.addEventListener(Dnv.Menuboard.PRECIOS_CAMBIADOS, function () {

            console.log("[MENUBOARD] Pintando nuevos precios (evento actualizacion precios)");

            var iframes = document.getElementsByTagName("iframe");
            var i;
            for (i = 0; i < iframes.length; i++) {
                iframes[i].style.opacity = 0;
                var iframe = (iframes[i].contentWindow || iframes[i].contentDocument);
                if (iframe.document) iframe = iframe.document;
                Dnv.Menuboard.pintarPrecios(iframe);
                iframes[i].style.opacity = 1;
            }

            console.log("[MENUBOARD] Pintados nuevos precios (evento actualizacion precios)");

        });

        window.addEventListener(Dnv.NEW_PLAYLIST_EVENT, function (evt) {
            var precios = document.getElementById("precios");
            if (precios) {
                var childPrecios = precios.children;
                var lenghtPrecios = childPrecios.length;
                if (lenghtPrecios != 0) {
                    for (var p = lenghtPrecios - 1; p >= 0; p--) {
                        if (childPrecios[p] && childPrecios[p].style.left != "-10000px") {
                            childPrecios[p].parentNode.removeChild(childPrecios[p]);
                        }
                    }
                }
            }
        });

        setInterval(function () { Dnv.Menuboard.obtenerPrecios(); }, Dnv.Menuboard.tiempoRefrescoPrecios * 1000);

        setInterval(function () {
            if (Dnv.Menuboard.noTenemosConexion && !Dnv.Menuboard.noTenemosConexionLast && !Dnv.presentador.isPantallaApagada()) {
                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "[MENUBOARD] No tenemos conexion con el servidor de precios");
                Dnv.Menuboard.noTenemosConexionLast = true;
            }
            if (Dnv.Menuboard.noExisteAlgunPrecio && !Dnv.Menuboard.noExisteAlgunPrecioLast && !Dnv.presentador.isPantallaApagada()) {
                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "[MENUBOARD] No existe precio para algun sku");
                Dnv.Menuboard.noExisteAlgunPrecioLast = true;
            }
            if (Dnv.Menuboard.sinPrecios && !Dnv.Menuboard.sinPreciosLast && !Dnv.presentador.isPantallaApagada()) {
                Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.ERROR, "[MENUBOARD] No tenemos precios");
                Dnv.Menuboard.sinPreciosLast = true;
            }
        }, 30 * 1000);

    } else {
        console.info("[MENUBOARD] Desactivado");
    }

};

//pinta los precios
Dnv.Menuboard.pintarPrecios = function (iframe) {

    Dnv.Menuboard.noExisteAlgunPrecio = false;

    iframe.body.style.background = "";
    iframe.body.style.overflow = "hidden";

    var inputs = iframe.getElementsByTagName("input");

    for (var j = 0; j < inputs.length; j++) {
        var sku = inputs[j].getAttribute("sku");
        if (sku != null) {
            var precio = Dnv.Menuboard.obtenerPrecio(sku);
            inputs[j].value = precio;
            //console.info("[MENUBOARD] Precio pintado del sku: " + sku + " : " + precio);
        }
    }

    var noAvailable = iframe.getElementsByClassName("nodisponible");

    for (var k = 0; k < noAvailable.length; k++) {
        var sku = noAvailable[k].getAttribute("sku");
        var lang = noAvailable[k].getAttribute("lang");
        if (sku != null && lang != null) {
            if (Dnv.Pl.lastPlaylist.getPlayer().getSalida().getIdiomas()[0] == lang) {
                var disponible = Dnv.Menuboard.estaDisponible(sku);
                if (!disponible) {
                    noAvailable[k].style.opacity = 1;
                } else {
                    noAvailable[k].style.opacity = 0;
                }
                //console.info("[MENUBOARD] Disponiblidad pintada del sku: " + sku + " : " + disponible);
            }
        }
    }

}

//devuelve el precio de un sku
Dnv.Menuboard.obtenerPrecio = function (sku) {
    var sinprecio = "-";
    var precios = Dnv.Menuboard.precios;

    for (var i = 0; i < precios.length; i++) {
        if (precios[i].id == sku) {
            var precio = precios[i].price;
            //console.log("[MENUBOARD] Obtenido precio del sku: " + sku + " : " + precio);
            return precio
        }
    }

    Dnv.Menuboard.noExisteAlgunPrecio = true;
    //console.warn("[MENUBOARD] No existe precio para el sku: " + sku);
    Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "[MENUBOARD] No existe precio para el sku: " + sku);
    return sinprecio
};

//devuelve si un sku esta disponible o no
Dnv.Menuboard.estaDisponible = function (sku) {
    var sindisponibilidad = false;
    var precios = Dnv.Menuboard.precios;

    for (var i = 0; i < precios.length; i++) {
        if (precios[i].id == sku) {
            var disponibilidad = precios[i].available;
            if (disponibilidad.toLowerCase() == "false".toLowerCase()) {
                disponibilidad = false;
            } else disponibilidad = true;

            //console.log("[MENUBOARD] Obtenida disponiblidad del sku: " + sku + " : " + precios[i].available);
            return disponibilidad
        }
    }

    //console.warn("[MENUBOARD] No existe disponiblidad para el sku: " + sku);
    Dnv.alarmas.enviarAlarma(Dnv.alarmas.estados.WARNING, "[MENUBOARD] No existe disponiblidad para el sku: " + sku);
    return sindisponibilidad
};

//obtiene los precios del servidor
Dnv.Menuboard.obtenerPrecios = function obtenerPrecios() {

    Dnv.Menuboard.noTenemosConexion = false;

    function procesarPrecios(data, xml) {
        var datosXml;

        if (xml == 0) {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(data, "text/xml");
            datosXml = parser.parseFromString(xmlDoc.documentElement.textContent, "text/xml");
            console.log("[MENUBOARD] Precios procedentes de TPV.exe");
        } else {
            datosXml = data;
            console.log("[MENUBOARD] Precios procedentes de WebService externo");
        }

        var items = datosXml.getElementsByTagName("item");

        function addZeroes(num) {
            var numPunt = num.replace(",", ".");
            var n = Number(numPunt).toFixed(2);
            return n.replace(".", ",");
        }

        var precios = [];
        for (var i = 0; i < items.length; i++) {

            var availableXML;
            if (items[i].getElementsByTagName("available").length != 0) {
                availableXML = items[i].getElementsByTagName("available")[0].childNodes[0].nodeValue;
            } else {
                availableXML = "True";
            }

            var item = { id: items[i].getElementsByTagName("id")[0].childNodes[0].nodeValue,
                desc: items[i].getElementsByTagName("desc")[0].childNodes[0].nodeValue,
                price: addZeroes(items[i].getElementsByTagName("price")[0].childNodes[0].nodeValue),
                available: availableXML
            }
            precios.push(item);
        }

        if (Dnv.Menuboard.precios.length == 0 && precios.length == 0) {

            if (window.localStorage["menuboard"] != undefined) {
                Dnv.Menuboard.sinPrecios = false;
                Dnv.Menuboard.precios = JSON.parse(window.localStorage["menuboard"]);

                var event = new Event(Dnv.Menuboard.PRECIOS_CAMBIADOS);
                window.dispatchEvent(event);
                console.info("[MENUBOARD] EVENTO PRECIOS_CAMBIADOS Lanzado");
            } else {
                Dnv.Menuboard.sinPrecios = true;
            }

            console.error("[MENUBOARD] Los precios han venido vacios (1)");
        } else if (precios.length == 0) {
            Dnv.Menuboard.sinPrecios = false;
            console.error("[MENUBOARD] Los precios han venido vacios (2)");
        } else {
            Dnv.Menuboard.sinPrecios = false;

            if (JSON.stringify(Dnv.Menuboard.precios) != JSON.stringify(precios)) {

                //guardo los precios en local storage
                window.localStorage["menuboard"] = JSON.stringify(precios);

                Dnv.Menuboard.precios = precios;

                var event = new Event(Dnv.Menuboard.PRECIOS_CAMBIADOS);
                window.dispatchEvent(event);
                console.info("[MENUBOARD] EVENTO PRECIOS_CAMBIADOS Lanzado");

            } else {
                console.log("[MENUBOARD] Los precios no han cambiado");
            }

            precios = null;

        }

    }

    function errHandler(e) {

        console.error("[MENUBOARD] Error al pedir precios: " + e);

        Dnv.Menuboard.noTenemosConexion = true;

        if (Dnv.Menuboard.precios.length == 0) {
            try {
                console.warn("[MENUBOARD] Precios obtenidos de local storage");
                //para que no se queden sin precios los que ya hay instalados y no tienen conexión
                try {
                    Dnv.Menuboard.precios = JSON.parse(window.localStorage["menuboard"]);

                    var event = new Event(Dnv.Menuboard.PRECIOS_CAMBIADOS);
                    window.dispatchEvent(event);
                    console.info("[MENUBOARD] EVENTO PRECIOS_CAMBIADOS Lanzado");
                } catch (e) {
                    procesarPrecios(window.localStorage["menuboard"], 0);
                    console.info("[MENUBOARD] Precios obtenidos de forma antigua");
                }
            } catch (e) {
                Dnv.Menuboard.sinPrecios = true;
                console.error("[MENUBOARD] No hay precios en local storage");
            }
        }
    }

    function handler() {
        if (this.readyState === this.DONE) {
            if (this.status === 200) {

                var respuesta = this.responseXML;
                var typeXML = 0;
                if (respuesta == null) {
                    respuesta = this.responseText;
                    typeXML = 0;
                } else {
                    typeXML = 1;
                }

                console.log("[MENUBOARD] Precios obtenidos");

                procesarPrecios(respuesta, typeXML);

            } else {
                errHandler(this.status);
            }
        }
    }

    var client = new XMLHttpRequest();
    client.onreadystatechange = handler;
    client.onerror = errHandler;
    client.timeout = 4500;
    client.ontimeout = errHandler;
    //client.open("GET", Dnv.Menuboard.ipRequest + "?_=" + new Date().getTime());
    client.open("GET", Dnv.Menuboard.ipRequest);
    client.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    client.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
    client.send();

};