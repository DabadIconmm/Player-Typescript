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
    setNivelVerbosity(verbosity: NivelLog): void;
}

// TODO usar pino (para node)
export class ConsoleLogger implements ILogger{ // Console logger
	private verbosity: NivelLog = NivelLog.debug;
	private default = NivelLog.info;
	public log(msg: string, caso: CasosUso | string, nivel: NivelLog = this.default){
		if (nivel < this.verbosity) return;
        
		switch (nivel) {
		case NivelLog.verbose: console.debug(`${new Date()} [verbose] de ${caso}: ${msg}`); break;
		case NivelLog.debug: console.log(`${new Date()} [debug] de ${caso}: ${msg}`); break;
		case NivelLog.info: console.info(`${new Date()} [info] de  ${caso}: ${msg}`); break;
		case NivelLog.warn: console.warn(`${new Date()} [warn0] de  ${caso}:  ${msg}`); break;
		case NivelLog.error: console.error(`${new Date()} [error] de ${caso}: ${msg}`); break;
		}
	}
	public setNivelVerbosity(verbosity: NivelLog): void {
		this.verbosity = verbosity;       
	}
}
