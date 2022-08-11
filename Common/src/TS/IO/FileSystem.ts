import { logExport } from "../Utils/logger";
import { encodings } from "../Utils/comun";
import { CasosUso, NivelLog } from "../Utils/logger";

function log(str: string, verbosity?: NivelLog){
	logExport(str, CasosUso.fileSystem, verbosity )
}


type FileOpts = encodings | null; 
type writeable =  string | Buffer | Array<unknown> | DataView | Record<string, unknown>
export interface IFileSystem {
    
    read(ruta: string, encoding: FileOpts): Promise<Buffer | string>; // si encoding es null debería devolver un buffer
    write(ruta: string, mensaje: writeable, encoding?: FileOpts ): Promise<void>;
	delete(ruta: string): Promise<void>;
}



class fsNode implements IFileSystem {
	private fs = require("fs") ;
	public read<T = FileOpts extends null ? Promise<Buffer> : Promise<string>>(ruta: string, enc: FileOpts = encodings.utf): Promise<T> { // si encoding es null debería devolver un Buffer
        
		log("comenzando ", NivelLog.verbose);
		return new Promise<T>((resolve, reject)=>{
			this.fs.readFile(ruta,{encoding: enc},(err: Error, data: T)=>{
				if (err) reject(err);
				log("operación OK", NivelLog.verbose);
				resolve(data);                
			});
		});
	}

	public write(ruta: string, mensaje: writeable, enc = encodings.utf): Promise<void> {
		log("comenzando ", NivelLog.verbose);
		return new Promise((resolve, reject) => {
			this.fs.writeFile(ruta, mensaje, {encoding: enc}, ((err: Error)=>{
				if (err) reject(err);
				log("operación OK", NivelLog.verbose);
				resolve();
			})
			);
		});
	}
	public delete(ruta: string): Promise<void> {
		log(`borrando ${ruta}`, NivelLog.verbose);
		return new Promise((resolve, reject) => {
			this.fs.rm(ruta, ((err: Error)=>{
				if (err) reject(err);
				log("operación OK", NivelLog.verbose);
				resolve();
			}))
		});
	}
}

export const fs = new fsNode();