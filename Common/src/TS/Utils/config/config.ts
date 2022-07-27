import { fs, log } from "../../DI";
import { ConfigRequester } from "./ConfigRequester";
import { CasosUso, NivelLog } from "../logger";
import { config, IConfig } from "./interfaces";
import { stringToTimestamp } from "../utiles";

const settings = {
	CFG_PREFIX: "cfg_",
	INTERNAL_CFG_PREFIX: "internal_cfg_",
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

	//TODO tests
	private setDefault<T extends number | string | boolean | undefined>(
		nombre: string,
		valor: T
	) {
		if (valor === undefined)
			throw new Error(
				`Setting ${nombre} no encontrado y no hay valor por defecto.`
			);
		this.settings[nombre] = valor.toString();
		log(
			`config.get. Devolvemos el valor por defecto para ${nombre}: ${valor}`,
			CasosUso.settings
		);
	}
	public get(nombre: string, defecto?: string): string {
		const ret = this.settings[nombre] ?? this.internal[nombre];
		if (ret) return ret;

		this.setDefault(nombre, defecto);
		return defecto!;
	}
	public tryGet(nombre: string) : string | null { // Como get pero nunca throws sino que devuelve null si no encuentra el valor
		return this.settings[nombre] ?? this.internal[nombre] ?? null;
	}
	public getBool(nombre: string, defecto?: boolean): boolean {
		// Esta funcion está plagada de trampas, cosas de javascript. Ojito cambiandola.
		const str: string = this.settings[nombre] ?? this.internal[nombre];
		if (str !== undefined)
			return str.toLowerCase() === "true" || str === "1";

		this.setDefault(nombre, defecto);
		return defecto!;
	}
	public getInt(nombre: string, defecto?: number) {
		const str: string = this.settings[nombre] ?? this.internal[nombre];
		if (str !== undefined) return Number(str);

		this.setDefault(nombre, defecto);
		return defecto!;
	}


	//TODO estas roñas quitarlas de aqui y meterlas en las clases que las necesitan
	public getDefaultWcfServerAddress() {
		const protocol = this.get("protocolServer", "http://");
		// let ret = protocol + this.get("IPMaster", Dnv.deviceInfo.ipServer()); //TODO
		let ret = protocol + this.get("IPMaster", "acceso.denevacuatro.com");
		if (protocol === "http://") ret += ":8090";
		return ret;
	}
	public getConfigTimeStamp() {
		const time = 0;
		try {
			const timeString = this.get("configLastUpdated");
			const numero = stringToTimestamp(timeString.replace("T", " "))
				.getTime();
			return numero;
		} catch (e) {
			return time;
		}
	}

	//#endregion

	public set(nombre: string, value: string) {
		this.internal[nombre] = value;
	}
}

export class ConfigNode extends CommonConfig implements IConfig {
	private async cargar(): Promise<void> {
		log("Comenzando carga de settings", CasosUso.settings);

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

			return;
		} catch (error) {
			log(
				"no se pudo cargar los settings" + JSON.stringify(error),
				CasosUso.settings,
				NivelLog.fatal
			);
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
		return;
	}
	constructor() {
		super();
		const crear = async () => {
			try {
				await this.cargar();
				window.dispatchEvent(
					new CustomEvent(ConfigRequester.CFG_CARGADA_EVENT, {
						detail: {},
					})
				);
			} catch (msg) {
				// Si no podemos cargar de disco
				//(quizas no se ha configurado por primera vez)
				log(JSON.stringify(msg), CasosUso.settings, NivelLog.warn);
				log(
					"Error cargando config de disco, fallback llamada al servidor",
					CasosUso.settings,
					NivelLog.warn
				);
				try {
					const config = await ConfigRequester.request();

					if (config !== null) {
						this.settings = config;
						this.backup().catch((err) =>
							log(
								`No se pudo guardar en disco: ${err}`,
								CasosUso.settings,
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
						CasosUso.settings,
						NivelLog.fatal
					);
				}
			}
		};
		crear();
	}
}
