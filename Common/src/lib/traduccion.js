
"use strict";
var Dnv = Dnv || {};

Dnv.traduccion = (function () {

    var stringsTraduccion = {
        "en": {
            "menu-info": "INFO",
            "menu-update": "UPDATE",
            "menu-reconfigure": "RECONFIGURE",
            "menu-reboot": "REBOOT",
            "menu-exit": "EXIT",
            "usb_playlist_cargando": "Loading contents from USB...",
            "usb_playlist_ok": "The contents has been loaded correctly from USB",
            "usb_playlist_error": "The contents has not been loaded correctly from USB",
            "usb_insertado": "USB drive detected...",
            "no_usb_warning_wrapper": "The USB memory is not connected. Please connect it and wait.",
            "submenu-reconfigurar-pregunta": "Do you want to reconfigure the device?",
            "submenu-reconfigurar-servidor": "Edit the server address if necessary. Otherwise press skip",
            "cancelar": "Cancel",
            "saltar": "Skip",
            "aplicar": "Apply",
            "submenu-actualizar-pregunta": "Do you want to update the device?",
            "submenu-info-configuracion": "CONFIGURATION",
            "submenu-info-objectid": "ObjectID",
            "submenu-info-coddispositivo": "Device Code",
            "submenu-info-versionplayer": "Player version",
            "submenu-info-versionfirmware": "Firmware version",
            "submenu-info-status": "STATUS",
            "submenu-info-licencia": "Next License Check",
            "submenu-info-playlistupdate": "Last Playlist Update",
            "submenu-info-playlisttimestamp": "Last Playlist Timestamp",
            "submenu-info-configurationupdate": "Last Configuration Update",
            "submenu-info-configurationtimestamp": "Last Configuration Timestamp",
            "unknown": "Unknown",
            "submenu-info-info": "INFO",
            "submenu-info-server": "SERVER",
            "submenu-info-player": "PLAYER",
            "submenu-info-empresa": "COMPANY",
            "submenu-info-network": "NETWORK",
            "submenu-info-ip": "IP",
            "submenu-info-gateway": "Gateway",
            "submenu-info-netmask": "Netmask",
            "submenu-ntp-server": "NTP Server",
            "submenu-info-dns": "DNS",
            "submenu-info-conectivity": "CONECTIVITY",
            "submenu-info-configuration": "Configuration",
            "submenu-info-playlist": "Playlist",
            "submenu-info-licence": "License",
            "submenu-info-alarmas": "Alarms",
            "submenu-debug-pause": "Pause",
            "submenu-debug-resume": "Resume",
            "submenu-debug-salir": "Exit"
        },
        "es": {
            "menu-info": "INFORMACIÓN",
            "menu-update": "ACTUALIZAR",
            "menu-reconfigure": "RECONFIGURAR",
            "menu-reboot": "REINICIAR",
            "menu-exit": "SALIR",
            "usb_playlist_ok": "Contenidos cargados correctamente desde USB",
            "usb_playlist_error": "No se han podido cargar correctamente los contenidos desde USB",
            "usb_playlist_cargando": "Cargando contenidos desde USB...",
            "usb_insertado": "Memoria USB detectada...",
            "no_usb_warning_wrapper": "La memoria USB no se encuentra conectada. Por favor, conéctela y espere.",
            "submenu-reconfigurar-pregunta": "¿Desea reconfigurar el dispositivo?",
            "submenu-reconfigurar-servidor": "Escriba abajo la dirección IP del servidor si desea cambiarla",
            "cancelar": "Cancelar",
            "saltar": "Saltar",
            "aplicar": "Aplicar",
            "submenu-actualizar-pregunta": "¿Desea actualizar el dispositivo?",
            "submenu-info-configuracion": "CONFIGURACIÓN",
            "submenu-info-objectid": "ObjectID",
            "submenu-info-coddispositivo": "Código de dispositivo",
            "submenu-info-versionplayer": "Versión Player",
            "submenu-info-versionfirmware": "Versión Firmware",
            "submenu-info-status": "ESTADO",
            "submenu-info-licencia": "Próxima comprobación licencia",
            "submenu-info-playlistupdate": "Última Actualización Playlist",
            "submenu-info-playlisttimestamp": "Timestamp Playlist",
            "submenu-info-configurationupdate": "Última Actualización Configuración",
            "submenu-info-configurationtimestamp": "Timestamp Configuración",
            "unknown": "Desconocido",
            "submenu-info-info": "INFORMACIÓN",
            "submenu-info-server": "SERVIDOR",
            "submenu-info-player": "PLAYER",
            "submenu-info-empresa": "EMPRESA",
            "submenu-info-network": "RED",
            "submenu-info-ip": "IP",
            "submenu-info-gateway": "Puerta de enlace",
            "submenu-info-netmask": "Máscara de subred",
            "submenu-ntp-server": "Servidor NTP",
            "submenu-info-dns": "DNS",
            "submenu-info-conectivity": "CONECTIVIDAD",
            "submenu-info-configuration": "Configuración",
            "submenu-info-playlist": "Playlist",
            "submenu-info-licence": "Licencia",
            "submenu-info-alarmas": "Alarmas",
            "submenu-debug-pause": "Pausar",
            "submenu-debug-resume": "Resumir",
            "submenu-debug-salir": "Salir"

        }
    };

    return {
        traducirInterfaz: function (padre) {
            var padre = padre || document;
            var elementos = padre.getElementsByTagName("span");


            var language = navigator.language;
            if (language.indexOf("-") !== -1) { // Simplificamos el idioma ("es-ES" -> "es")
                language = language.substring(0, language.indexOf("-"));
            }
            if (stringsTraduccion[language] === undefined) {
                language = "en";
            }

            var traducciones = stringsTraduccion[language];
            for (var i = 0; i < elementos.length; i++) {
                var elemento = elementos[i];
                var id = elemento.getAttribute("string-traduccion");
                if (id !== undefined && traducciones[id] !== undefined) {
                    elementos[i].textContent = traducciones[id];
                }

            }
        }
    };


})();