Dnv.SSP.AdsMovil = {};
Dnv.SSP.AdsMovil.Ad = {};
Dnv.SSP.AdsMovil.Play = function Play() {
    try {
        Dnv.SSP.Admooh.Cfg = JSON.parse(Dnv.cfg.getCfgString("SSP_AdsMovil_enabled", ""));
    } catch (e) {
        Dnv.SSP.Admooh.Enable = false;
        Dnv.monitor.writeLogFile(".SSP. No hay configuración Admooh");
        return;
    }
    if (Dnv.sincronizacion.isConectado() && Dnv.sincronizacion.isMaestro() || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") == ";;" || Dnv.cfg.getCfgString("Salida_Sincronizada", ";;") == "0") {
        if (!Dnv.SSP.Admooh.Interval) {
            Dnv.SSP.Admooh.Interval = setInterval(Dnv.SSP.Admooh.Ping, 10000);
        }
        if (!Dnv.SSP.Admooh.VastSolicitado) {
            Dnv.SSP.Admooh.GetVast();
        }
    }
    Dnv.SSP.Admooh.Enable = true;
}

Dnv.SSP.AdsMovil.GetVast = function GetVast() {

}

Dnv.SSP.AdsMovil.GetPlayList = function GetPlayList() {

}
Dnv.SSP.AdsMovil.GetRecursoFromAd = function GetRecursoFromAd() {

}