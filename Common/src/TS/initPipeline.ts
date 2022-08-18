//TODO
/*
- event listener para unhandledRejection
- La estructura deberia recordar a una monad. Function composition?
- arreglar nombres
- los pasos que sean muy especificos se pueden abstraer:
    ejemplo: getConfigID -> getPID -> QRconfigure -> cfg.cargar 
    se pueden abstraer en su propia pipeline, requieren que sea
    secuencial y no afectan a nada más.
- logs
*/

import { cfg } from "./config/cfg";
import { QRconfigure } from "./config/QRconfig";
import { SettingRequester } from "./config/SettingsRequester";
import { NivelLog, logFactory, Funcionalidad } from "./Utils/logger";
const log = logFactory(Funcionalidad.init)
export async function init(){
    if (!cfg.QRConfigurado) await ñapa(primeraVez)
    else cfg.cargar();
    // navigateToIndex();
}

async function primeraVez(): Promise<{
    pid: string;
    eid: number;
}>{
    // Wait for Cloud.isFileSystemAvailable o algo. No hace nada creo porque comenzar no existe. Ajustar pipeline?
	// $('#configure').removeClass('configured');
    await SettingRequester.loadIni();
    const configID = await SettingRequester.getConfigID();
    const PromPID = SettingRequester.getPID(configID.configID);

    QRconfigure(configID.url, configID.validez) // Cargo esto mientras me llega el PID

    const PlayerID = await PromPID;
    await cfg.cargar(PlayerID.pid);
    // await obtenerLicencia()
    return PlayerID;
}

function ñapa(fn: Function){
    try {
        return fn()
    } catch (error) {
        log((<Error>error).toString(), NivelLog.error);
        setImmediate(()=>ñapa(fn))
    }
}