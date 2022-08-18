import { ConfigID, EID, ObjectID, PID } from "../Utils/types";
import { config } from "./interfaces";

// # IFDEF NODE
// import CryptoJS = require("crypto-js");
// # ENDIF
import * as CryptoJS from "crypto-js"
import { debeLoguearFallosDeRed, network } from "../Network/servidor";
import { SystemInfo } from "../SystemInfo/systemInfo";
import { formatearFecha, formatearFechaUTCDia } from "../Utils/utiles";
import { http, HTTPError } from "../Network/http";
import { cfg } from "./cfg";
import { stringToTimestamp } from "../Utils/utiles";

import { Funcionalidad, logFactory, NivelLog } from "../Utils/logger";

const log = logFactory(Funcionalidad.settings);

type configResponse = { doc: Document | null; timestamp?: string };
export class SettingRequester {
	private static errHandler(e: string) {
		if (debeLoguearFallosDeRed()) {
			// TODO cambiar al config?
			log(
				"Error al pedir configuracion: " + e,
				
				NivelLog.error
			);
		}
		SystemInfo.setEstadoConectividadConfiguracion("Error");
	}

	public static async request(PlayerID: PID): Promise<config | null> {
		if (!PlayerID) throw new Error("No tenemos PID!");
		async function pedirConfigAlServidor(PlayerID: PID): Promise<configResponse> {
			const response: configResponse = await (cfg.getBool(
				"Manager_WebRequest_Enabled",
				false
			)
				? WS_DenevaRequest()
				: WCF_Request());

			if (!response)
				throw new Error("sin respuesta del servidor pidiendo config");
			log("Respuesta OK",  NivelLog.info);
			SystemInfo.setEstadoConectividadConfiguracion("OK");
			log(
				"Respuesta de configuracion: " + response,
				
				NivelLog.debug
			);
			return response;

			async function WS_DenevaRequest() { 
				// REST
				const token = CryptoJS.SHA256(PlayerID + ";" + formatearFechaUTCDia(new Date())).toString(
					CryptoJS.enc.Hex
				);

				let fecha;
				try {
					const timeString = cfg.get("configLastUpdated");
					const numero = stringToTimestamp(
						timeString.replace("T", " ")
					).getTime();
					fecha = numero;
				} catch (e) {
					fecha = 0;
				}
				const fechaHTTP = new Date(fecha).toUTCString();
				const headers = {
					"X-Pid": PlayerID,
					"X-Token": token,
					"If-Modified-Since": fechaHTTP,
				};
				
				const url = network.endpoints.getCfgREST(cfg.getInt("MyOwnCode"))
				const res = await http.get(url, {
					headers: headers,
				});
				if (res.status === 304) return <configResponse>{ doc: null };

				const timestamp = res.header["Last-Modified"] ?? undefined;
				return <configResponse>{
					doc: res.data,
					timestamp: timestamp,
				};
			}

			async function WCF_Request() {
				const url = network.endpoints.getCfgWCF();
				log("Pidiendo configuracion a " + url,  NivelLog.debug);
				const xml = `<GetConfiguracion xmlns="http://tempuri.org/">\
                        <ID>${PlayerID}</ID><byObjId>false</byObjId>\
                        <lastConfigTimestamp>${cfg.get(
							"configLastUpdated",
							"1900-01-01 00:00:00"
						)}</lastConfigTimestamp>\
                        <replicador>false</replicador>\
                        <newMode>true</newMode></GetConfiguracion>`;
				const headers = {
					"X-Requested-With": "XMLHttpRequest",
					"Content-Type": "text/xml; charset=UTF-8",
				};

				log("Pidiendo configuracion [WCF]");
				const response = await http.post(url, {
					data: xml,
					headers: headers,
				});
				const doc: configResponse = {
					doc: <Document>response.data ?? null,
				};
				return doc;
			}
		}

		async function inicializarUrlCfg(
			pid: PID,
			eid: number
		): Promise<string> {
			log(
				"Pedimos url de configuración inicial, PID = " + pid,
				NivelLog.info
			);

			const url = network.endpoints.getUrlCfg(eid, pid)

			try {
				const res = await http.get(url, {
					headers: {
						"X-Requested-With": "XMLHttpRequest",
						"Content-Type": "text/xml; charset=UTF-8",
					},
				});
				SystemInfo.setEstadoConectividadConfiguracion("OK");
				log(
					"Respuesta de direccion de configuracion " + res.data,					
					NivelLog.debug
				);
				// TODO puedo hacer esto sin parsearlo antes?
				const doc = <Document> res.data; 
				const response = doc.documentElement.textContent;
				if (
					!response ||
					response.indexOf(";;ERROR;;") >= 0 ||
					doc.documentElement?.tagName !== "string"
				) {
					throw new Error("Respuesta erronea: " + response);
				}
				const replaced = response.replace(
					"[IPMASTER]",
					cfg.get("ipServer")
				);
				if (network.protocol === "https://")
					return `${network.ip}${replaced}/Servicios/WebConfig`;

				return `${network.protocol}${replaced}:8090/Servicios/WebConfig`;
			} catch (error) {
				const e = <HTTPError>error;
				if (
					e.status === "500" &&
					e.response?.toString().indexOf(
						"System.InvalidOperationException:" // TODO funciona?
					)
				) {
					log(
						"El servidor no implementa el método para la url inicial, usamos el por defecto..." +
							e,
						
						NivelLog.error
					);
					return (
						network.UrlWCF + "/Servicios/WebConfig"
					);
				}
				SettingRequester.errHandler(e.toString());
				throw new Error("Error pidiendo la url de configuracion.");
			}
		}

		function parseConfigXML(
			xml: Document | null,
			timeStamp: string | undefined
		): config | null {
			if (xml === null) {
				log(
					"[CONFIGUARCION] La configuracion devuelta por WSRequest no tiene cambios",
					
					NivelLog.info
				);
				return null;
			}
			if (!PlayerID) {
				throw new Error(
					"[CONFIGURACION] Nos ha llegado una respuesta de configuracion pero no tenemos PID.",
					);
			}
			let xmlElements = xml.getElementsByTagName("XML");
			if (xmlElements.length === 0)
				xmlElements = xml.getElementsByTagNameNS(
					"http://schemas.datacontract.org/2004/07/Deneva.WCFServices",
					"XML"
				);
			if (xmlElements.length > 0 || timeStamp) {
				const doc = timeStamp
					? xml
					: new DOMParser().parseFromString(
							xmlElements[0].textContent!,
							"text/xml"
					);

				const lastUpdated = xml.getElementsByTagName("LastUpdated");
				let updateNow: string | null;
				if (timeStamp) {
					updateNow = formatearFecha(
						new Date(Date.parse(timeStamp)),
						false
					);
				} else {
					if (lastUpdated.length !== 0) {
						updateNow = lastUpdated[0].textContent;
					} else {
						updateNow = xml.getElementsByTagNameNS(
							"http://schemas.datacontract.org/2004/07/Deneva.WCFServices",
							"LastUpdated"
						)[0].textContent;
					}
				}
				if (updateNow === null)
					throw new Error(
						"No hemos recibido hora de update del servidor"
					);
				cfg.set("configLastUpdated", updateNow);

				const newSettings: config = {};

				const iterator = document.evaluate(
					"/configuration/userSettings/*/setting",
					doc,
					null,
					XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
					null
				);
				for (
					let current = <Element>iterator.iterateNext();
					current !== null;
					iterator.iterateNext()
				) {
					newSettings[current.getAttribute("name")!] =
						current.getElementsByTagName("value")[0].textContent!;
				}
				return newSettings;
			} else if (cfg.getInt("MyOwnCode", 0) !== 0) {
				// Estamos configurados de antes...
				log(
					"[CONFIGURACION] Estabamos actualizados pero no nos ha llegado una configuracion valida",
					
					NivelLog.warn
				);
				return null;
			} // ?????
			throw new Error(
				"[CONFIGURACION] El servidor devolvió una respuesta de configuracion inesperada (probablemente vacia): " +
					xml
			);
		}

		if (PlayerID === undefined) {
			log(
				"No tenemos PID ¿Es la primera vez que arrancamos?",
				
				NivelLog.warn
				);
				/*
				TODO: Esta cosa no deberia de existir aqui. Debería estar en algun sitio de la pipeline de inicio
				#IFDEF TOSHIBA
				
				var upgradedFirm = DatabaseManager.read("TOSHIBA_UPGRADED_FIRM");
				
				if (upgradedFirm == "true") {
					console.warn("[CONFIG](TOSHIBA) No cargamos cfg de disco porque se esta actualizando el firm.");
				} else {
					that.cargarCfgDeDisco();
				}`
				#ELSE
				*/
		   throw new Error("No estamos configurados y no tenemos PID"); 
		   
		}

		if (
			cfg.getBool("configurado", false) &&
			cfg.getInt("MyOwnCode", 0) !== 0
		) {
			if (!PlayerID)
				throw new Error("No estamos configurados y no tenemos objectID");

			SettingRequester.urlWebCfgServiceInicial = 
				await inicializarUrlCfg(PlayerID, cfg.getInt("configEID", 0));
		}

		/*
		 * timeStamp sera undefined si no se usa WSDenevaRequest
		 */

		try {
			const config = await pedirConfigAlServidor(PlayerID);
			return parseConfigXML(config.doc, config.timestamp);
		} catch (error) {
			const e = <Error>error;
			this.errHandler(e.toString());
			e.message = "Error pidiendo configuracion: " + e.message
			throw e;
		}
	}
	public static async getPID(ConfigID: ConfigID): Promise<{pid: PID, eid: EID}> {
		try {
			const url = network.endpoints.getPlayerID(ConfigID, new Date().getTime().toString())
			const resp = (await http.get(url)).data.toString();
			$("#divInfo").fadeOut(1000);
	
			const res = resp.split("[]");
			
			
			if (res.length > 1 && res[0] !== "ERROR") {
				cfg.QRConfigurado = true;
				const ret = { pid: res[0], eid: parseInt(res[1])};
				log(ret.toString(), NivelLog.debug);
				return ret
			}
			throw new Error("La respuesta del servidor fue incorrecta: " + resp);


		} catch (error) {
			SystemInfo.setEstadoConectividadPid("Error");
			throw error;
		}
	}
	
	public static async getConfigID(): Promise<{
		configID: ConfigID;
		url: string;
		validez: Date;
	}> {

		const url = network.endpoints.getConfigID()
		const resp = (await http.get(url)).data.toString(); 
			
	
		const res = resp.split("[]");
		if (res.length < 3 || res[0] === "ERROR")
			throw new Error("Se recibio un error de GetIDPlayerJS: " + res);


		document.getElementById("codeText")!.innerHTML = res[0];
		return {
			configID: res[0],
			validez: stringToTimestamp(res[1]),
			url: res[2],
		};
	}

	public static async loadIni(){
		// TODO
		// network.ip = ...

	}
}
