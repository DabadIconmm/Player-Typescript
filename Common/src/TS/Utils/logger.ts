export enum CasosUso {
    calendarios,
    alarmas,
    audiencia,
    auditoria,
    avisos,
    playlist,
    settings,
    fileSystem
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
    log(msg: string, casos: CasosUso | string, nivel: NivelLog): void;
}

// TODO usar pino (para node)

const verbosity: NivelLog = NivelLog.debug;
class ConsoleLogger implements ILogger{ // Console logger
	public log(msg: string, caso: CasosUso | string, nivel: NivelLog = NivelLog.info){
		if (nivel < verbosity) return;
        
		switch (nivel) {
		case NivelLog.verbose: console.debug(`${new Date()} [verbose] de ${caso}: ${msg}`); break;
		case NivelLog.debug: console.log(`${new Date()} [debug] de ${caso}: ${msg}`); break;
		case NivelLog.info: console.info(`${new Date()} [info] de  ${caso}: ${msg}`); break;
		case NivelLog.warn: console.warn(`${new Date()} [warn0] de  ${caso}:  ${msg}`); break;
		case NivelLog.error: console.error(`${new Date()} [error] de ${caso}: ${msg}`); break;
		}
	}
    constructor(){
        this.log("log activado", CasosUso.alarmas)
    }
}

// Ver ejemplos de uso si se va a hacer un archivo nuevo. 
// TODO: Hay una mejor manera?
export const logExport = new ConsoleLogger().log; 