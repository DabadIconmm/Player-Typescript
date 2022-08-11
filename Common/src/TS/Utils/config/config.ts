import { ConfigRequester } from "./ConfigRequester";
import { fs } from "../../IO/FileSystem";
import { CasosUso, logExport, NivelLog } from "./../logger";
import { config, IConfig } from "./interfaces";
import { stringToTimestamp } from "../utiles";
function log(str: string, verbosity?: NivelLog){
	logExport(str, CasosUso.network, verbosity )
}

const settings = {
	PL_KEY: "pl",
	BACKUP_TIMESTAMP_KEY: "backup_timestamp",
	BACKUP_FILENAME: "cfg_backup.json",
	CFG_PATH: "TODO",
	INTERNAL_PATH: "TODO",
};

class CommonConfig {
	protected settings: config = {};
	protected internal: config = {};

	//#region getters
	private setDefault<T extends number | string | boolean | undefined>(
		nombre: string, 
		valor: T
	) {
		if (valor === undefined)
			throw new Error(
				`Setting ${nombre} no encontrado y no hay valor por defecto.`
			);
		this.settings[nombre] = valor.toString();
		log(`config.get. Devolvemos el valor por defecto para ${nombre}: ${valor}`);
	}
	public get(nombre: string, defecto?: string): string {
		const ret = this.settings[nombre] ?? this.internal[nombre];
		if (ret) return ret;

		this.setDefault(nombre, defecto);
		return defecto!;
	}
	public tryGet(nombre: string): string | null {
		// Como get pero nunca throws sino que devuelve null si no encuentra el valor
		return this.settings[nombre] ?? this.internal[nombre] ?? null;
	}
	public getBool(nombre: string, defecto?: boolean): boolean {
		// Esta funcion está plagada de trampas, cosas de javascript. Ojito cambiandola.
		const str: string = this.settings[nombre] ?? this.internal[nombre];
		if (str !== undefined){
			const lower = str.toLowerCase()
			if (lower === "true" || str === "1") return true;
			if (lower === "false" || str === "0") return false;
			throw new Error("El valor no es booleano, era " + str);
		}
		
		this.setDefault(nombre, defecto);
		return defecto!;
	}
	public getInt(nombre: string, defecto?: number) {
		const str: string = this.settings[nombre] ?? this.internal[nombre];
		if (str !== undefined) {
			const ret = Number(str);
			if (isNaN(ret)) throw new Error("El valor no es un numero, era " + str);
			return ret;
		}

		this.setDefault(nombre, defecto);
		return defecto!;
	}

	//TODO estas roñas quitarlas de aqui y meterlas en las clases que las necesitan
	public getDefaultWcfServerAddress() { // Deberia ir en alguna clase de conexion al servidor
		const protocol = this.get("protocolServer", "http://");
		// let ret = protocol + this.get("IPMaster", Dnv.deviceInfo.ipServer()); //TODO
		let ret = protocol + this.get("IPMaster", "acceso.denevacuatro.com");
		if (protocol === "http://") ret += ":8090";
		return ret;
	}

	//#endregion

	public set(nombre: string, value: string) {
		this.internal[nombre] = value;
	}
}

class ConfigNode extends CommonConfig implements IConfig {
	public async cargar(): Promise<void> {
		log("Comenzando carga de settings");

		try {
			const res = fs.read(settings.CFG_PATH);

			const local = JSON.parse(localStorage.getItem("cfg") ?? "");
			const disk = JSON.parse(await res);

			if (!local && !disk)
				throw new Error("No se han encontrado los settings en disco");

			if (
				local[settings.BACKUP_TIMESTAMP_KEY] >
				disk[settings.BACKUP_TIMESTAMP_KEY]
			)
				this.settings = local;
			else this.settings = disk;

			window.dispatchEvent(
				new CustomEvent(ConfigRequester.CFG_CARGADA_EVENT, {
					detail: {},
				})
			);
			return;
		} catch (error) {
			log(
				"no se pudo cargar los settings" + JSON.stringify(error),
				NivelLog.error
			);
			// Si no podemos cargar de disco
			//(quizas no se ha configurado por primera vez)
			log(
				"Error cargando config de disco, fallback llamada al servidor",
				NivelLog.warn
			);
			try {
				const config = await ConfigRequester.request();

				if (config !== null) {
					this.settings = config;
					this.backup().catch((err) =>
						log(
							`No se pudo guardar en disco: ${err}`,
							NivelLog.error
						)
					);
					window.dispatchEvent(
						new CustomEvent(ConfigRequester.CFG_CARGADA_EVENT, {
							detail: {},
						})
					);
				}
			} catch (error) {
				log(
					`ERROR: No se pudo cargar la configuracion del disco ni del servidor.
						${error}`,
					NivelLog.fatal
				);
			}
		}
	}
	public async backup(): Promise<void> {
		async function saveToDisk(cfg: string, ruta: string) {
			const respuesta = fs.write(ruta, cfg);
			respuesta.catch((error) => {
				throw new Error(
					"config.backup() no se pudo guardar los settings\n" +
						JSON.stringify(error)
				);
			});
			await respuesta;
			return;
		}

		this.settings[settings.BACKUP_TIMESTAMP_KEY] = new Date().toString();
		const _settings = JSON.stringify(this.settings);
		const _internal = JSON.stringify(this.internal);

		const prom1 = saveToDisk(_settings, settings.CFG_PATH);
		const prom2 = saveToDisk(_internal, settings.INTERNAL_PATH);

		localStorage.setItem("cfg", _settings);
		localStorage.setItem("internal", _internal);

		await prom1;
		await prom2;
		return;
	}

	public async reset(): Promise<void> {
		const task = fs.delete(settings.CFG_PATH);
		localStorage.removeItem("cfg");
		await task;
	}
	constructor() {
		super();
	}
}

export const cfg = new ConfigNode