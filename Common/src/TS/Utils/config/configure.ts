//TODO cambiar nombre a este archivo.

import { CasosUso, logExport, NivelLog } from "../logger";

function log(str: string, verbosity?: NivelLog){
	logExport(str, CasosUso.settings, verbosity )
}

function configure(){
    log("hola", NivelLog.verbose)
}