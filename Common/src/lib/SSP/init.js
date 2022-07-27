Dnv.SSP = {};

Dnv.SSP.IsDisponible = function (capa) {
    if (capa.getContent() == "3") {
        //Hivestack
        var rec = Dnv.SSP.Hivestack.getRecursoClassFromAd();
        if (rec == null) {
            if (Dnv.SSP.Hivestack.Ad.mediaFile == undefined) {
                //No tengo Vast lo pido
                Dnv.SSP.Hivestack.getVast();
                console.log(".SSP.isDisponible() No tenemos recurso de Hivestack, pedimos vast")
                Dnv.monitor.writeLogFile(".SSP.isDisponible() No tenemos recurso de Hivestack, pedimos vast", LogLevel.Info);
            }
            return false;
        } else {
            capa.setRecurso(rec); //Setteamos el recurso de Hivestack.
            return true;
        }
    } else if (capa.getContent() == "6") {
        //admooh
        var rec = Dnv.SSP.Admooh.getRecursoClassFromAd();
        if (rec == null) {
            if (Dnv.SSP.Admooh.Ad.mediaFile == undefined) {
                //No tengo Vast lo pido
                Dnv.SSP.Admooh.getVast();
                console.log(".SSP.isDisponible() No tenemos recurso de Admooh, pedimos vast")
                Dnv.monitor.writeLogFile(".SSP.isDisponible() No tenemos recurso de Admooh, pedimos vast", LogLevel.Info);
            }
            return false;
        } else {
            capa.setRecurso(Dnv.SSP.Admooh.getRecursoClassFromAd());
            return true;
        }

    } else if (capa.getContent() == "7") {
        //PlaceExchange
        var rec = Dnv.SSP.PlaceExchange.getRecursoClassFromAd();
        if (rec == null) {
            if (Dnv.SSP.PlaceExchange.Ad.mediaFile == undefined) {
                //No tengo Vast lo pido
                Dnv.SSP.PlaceExchange.getVast();
                console.log(".SSP.isDisponible() No tenemos recurso de PlaceExchange, pedimos vast")
                Dnv.monitor.writeLogFile(".SSP.isDisponible() No tenemos recurso de PlaceExchange, pedimos vast", LogLevel.Info);
            }
            return false;
        } else {
            this.setRecurso(rec);
            return true;
        }
    } else if (Dnv.Pl.lastPlaylist.getPlayer().getSalida().getInsercion(true)) {
        return true;
    } else {
        console.log("[Playlist.Capa()] isDisponible Slide no disponible debido a que no hay inserciones para el hueco");
        Dnv.secuenciador.resetLoopAgrupado();
        return false;
    }
}
/*Engine
Dnv.SSP.EngineNoSlide.isValidSSPContent = function (Content) {
    
    switch (Content) {
        case "2":
            return true;
            break;
        case "3": //slide hivestack
            try {
                var ActivoHivestack = Dnv.cfg.getCfgString("SSP_Hivestack_enabled", "false");
                if (ActivoHivestack == "true" || ActivoHivestack == "True") {

                var d = new Date().getTime();  
                try {
                    var vast;
                    if (Dnv.SSP.Hivestack.Ad.mediaFile != undefined) {
                        vast = Dnv.SSP.Hivestack.Ad; //No es realmente el vast es el objeto JSON generado internamente que contiene el mediaFile.

                        try {
                            vast.mediaFile = vast.mediaFile.replace(/ /g, "");
                        } catch (e) { // Quiere decir que mediaFile noe xiste por lo que el vast no es correcto... por lo que devolvemos false

                            Dnv.monitor.writeLogFile("[Dnv.SSP.Engine] isValidSSP()  Problemas al comprobar el vast --> " + vast);
                            return false;
                        }

                        if (!vast.mediaFile || !Dnv.Cloud.downloader.getLocalUrlHivestack(vast.mediaFile)) {
                            Dnv.monitor.writeLogFile("[Dnv.SSP.Engine] isValidSSP() No dispongo de media file -->" + vast.mediaFile + " o no se ha descargado el recurso" + Dnv.Cloud.downloader.getLocalUrlHivestack(vast.mediaFile));
                            return false;
                        }
                        var d2 = new Date().getTime();
                        Dnv.monitor.writeLogFile(".SSP.Hivestack isValidSSPContent He tardado " + (d2 - d) + " en buscar en validar recurso  de hivestack");
                        return true;
                    } else {
                        Dnv.SSP.Hivestack.getVast();
                        return false;
                    }

                } catch (e) {
                    Dnv.monitor.writeLogFile("[Dnv.SSP.Engine] isValidSSP() Error en isDisponible por content :" + e);
                    return false;
                }

                } else {
                    return false;
                }
            } catch (e) {
                console.error("[Dnv.SSP.Engine] isValidSSP() Error  con el setting de Hivestack enabled");
            }
            break;
        case "6":
            if (Dnv.SSP.Admooh.Enable) {
                var vast;
                var vast = Dnv.SSP.Admooh.Ad;
                if (vast.Codigo != undefined) {
                    if (!vast.Codigo || Dnv.Cloud.downloader.getLocalUrlAdmooh(vast.Codigo) == null) {
                        Dnv.monitor.writeLogFile("[Dnv.SSP.Engine] isValidSSP(Admooh) No dispongo de media file -->" + vast.mediaFile + " o no se ha descargado el recurso");
                        return false;
                    }
                    return true;
                } else {
                    Dnv.monitor.writeLogFile("[Dnv.SSP.Engine] isValidSSP(Admooh) el codigo del vast es undefined -->" + JSON.stringify(vast));
                    return false;
                }


            } else {
                if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro() || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") == ";;" || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") == "0") {
                    Dnv.monitor.writeLogFile("[Dnv.SSP.Engine] isValidSSP(Admooh) No se ha lanzado Admooh lo inicio");
                    Dnv.SSP.Admooh.Play();
                    return false;
                } else {
                    Dnv.SSP.Admooh.Enable = true;
                    return true;
                }
            }

            break;
            case "7":
                try{
                    if (Dnv.SSP.PlaceExchange.Enable) {
                        if (Dnv.SSP.PlaceExchange.Ad.mediaFile != undefined) {
                            var rec = Dnv.SSP.PlaceExchange.getRecursoClassFromAd();
                            if(rec != null){
                                return true;
                            }else{
                                return false;
                            }
                        } else {
                            if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro() || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") == ";;" || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") == "0") {
                                Dnv.SSP.PlaceExchange.getVast();
                            }
                         
                            return false;
                        }
                    }else{
                        return false;
                    }
                }catch(e){
                    Dnv.monitor.writeLogFile("[Dnv.SSP.Engine] Error al tratar con el vast de PlaceExchange -->" +e,LogLevel.Error);
                }
              
            break;
        default:
            Dnv.monitor.writeLogFile("[Dnv.SSP.Engine] isValidSSP() No Deberia entrar porque me ha llegado un SSP no implementado");
            return false;
            break;
    }
}*/

