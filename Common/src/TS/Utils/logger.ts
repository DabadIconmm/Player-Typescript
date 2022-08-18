export enum Funcionalidad {
    calendarios,
    alarmas,
    audiencia,
    auditoria,
    avisos,
    playlist,
    settings,
    fileSystem,
    network,
    utiles,
    init
}
export enum NivelLog {
    verbose = 0,
    debug = 1,
    info = 2,
    warn = 3,
    error = 4,
    fatal = 5
}

interface ILogger{ 
    log(msg: string, casos: Funcionalidad | string, nivel: NivelLog): void;
}

// TODO usar pino (para node)

const verbosity: NivelLog = NivelLog.debug;
class ConsoleLogger implements ILogger{ // Console logger
	public log(msg: string, caso: Funcionalidad | string, nivel: NivelLog = NivelLog.info){
		if (nivel < verbosity) return;
        
		switch (nivel) {
		case NivelLog.verbose: console.debug(`${new Date().getSeconds()} [verbose] de ${caso}: ${msg}`); break;
		case NivelLog.debug: console.log(`${new Date().getSeconds()} [dbg ] de ${caso}: ${msg}`); break;
		case NivelLog.info: console.info(`${new Date().getSeconds()} [info] de  ${caso}: ${msg}`); break;
		case NivelLog.warn: console.warn(`${new Date().getSeconds()} [warn] de  ${caso}:  ${msg}`); break;
		case NivelLog.error: console.error(`${new Date().getSeconds()} [err ] de ${caso}: ${msg}`); break;
		}
	}
    constructor(){
        // this.log("log activado", Funcionalidad.alarmas)
    }
}
const log = new ConsoleLogger().log; // Default 
export function logFactory(funcionalidad: Funcionalidad){
    return (msg: string, nivel: NivelLog = NivelLog.info)=>{
        log(msg, funcionalidad, nivel)
    }
}