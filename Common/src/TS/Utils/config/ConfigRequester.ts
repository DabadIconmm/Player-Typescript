import { ObjectID, PID } from "./../comun";
import { config } from "./interfaces";

// # IFDEF NODE
// import CryptoJS = require("crypto-js");
import * as CryptoJS from "crypto-js"
import { debeLoguearFallosDeRed } from "../../Network/servidor";
import { SystemInfo } from "../../SystemInfo/systemInfo";
import { formatearFecha, formatearFechaUTCDia } from "../utiles";
import { http, HTTPError } from "../../Network/http";
import { cfg } from "./config";
import { stringToTimestamp } from "../utiles";

import { CasosUso, logExport, NivelLog } from "./../logger";
// # ENDIF

function log(str: string, verbosity?: NivelLog){
	logExport(str, CasosUso.settings, verbosity )
}


type configResponse = { doc: Document | null; timestamp?: string };
export class ConfigRequester {
	private static defaultWsBaseUrl: string | null = null; // TODO hacer setting de esto
	public static urlWebCfgServiceInicial: string | undefined; // TODO hacer setting de esto
	public static CFG_CARGADA_EVENT = "CFG_CARGADA_EVENT";

	private static errHandler(e: string) {
		if (debeLoguearFallosDeRed()) {
			// TODO cambiar al config?
			log(
				"[SERVIDOR] Error al pedir configuracion: " + e,
				
				NivelLog.error
			);
		}
		SystemInfo.setEstadoConectividadConfiguracion("Error");
	}

	public static async request(): Promise<config | null> {
		async function pedirConfigAlServidor(id: PID): Promise<configResponse> {
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
				let url: string;
				const urlCfg = cfg.get("URLConfigMaster", "");
				if (urlCfg) {
					url = urlCfg;
					if (url.length === url.lastIndexOf("/") + 1) {
						//Quitamos la / final por si la han metido en el setting
						url = url.substring(0, url.lastIndexOf("/"));
					}
				} else {
					url =
						cfg.get("protocolServer", "http://") +
						cfg.get("IPMaster", cfg.get("ipServer")) +
						"/wsdenevarequest/api/cfg";
					// Si encuentra IPMaster ipserver nunca deberia de lanzar una
					// excepcion si no existiera porque no se ejecuta hasta que se necesita
				}

				const objId = cfg.getInt("MyOwnCode", 0);

				const token = CryptoJS.SHA256(id + ";" + formatearFechaUTCDia(new Date())).toString(
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

				if (!objId)
					throw new Error(
						"[SERVIDOR] ObjectID no válido, no podemos pedir config a WSRequest."
					);

				const headers = {
					"X-Pid": id,
					"X-Token": token,
					"If-Modified-Since": fechaHTTP,
				};
				
				const res = await http.get(`${url}/${objId}`, {
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
				const urlFallback =
					ConfigRequester.urlWebCfgServiceInicial ??
					cfg.getDefaultWcfServerAddress() + "/Servicios/WebConfig";

				const url =
					cfg.get("ConfigClientEndPointAddressWeb", urlFallback) +
					"/GetConfiguracion";

				log(
					"urlWebCfgServiceInicial " + urlFallback,
					
					NivelLog.verbose
				);
				log("url " + url,  NivelLog.debug);
				if (!id) {
					throw new Error(
						"[SERVIDOR] No pedimos configuración, PID =" + id
					);
				}

				const xml = `<GetConfiguracion xmlns="http://tempuri.org/">\
                        <ID>${id}</ID><byObjId>false</byObjId>\
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
				"[SERVIDOR] Pedimos url de configuración inicial, PID = " + pid,
				
				NivelLog.info
			);

			ConfigRequester.defaultWsBaseUrl =
				ConfigRequester.defaultWsBaseUrl ??
				cfg.get("protocolServer", "http://") + cfg.get("ipServer");

			const url =
				ConfigRequester.defaultWsBaseUrl +
				"/WSResources/RemoteResources.asmx/GetMetadatoDispoPadre?EID=" +
				eid +
				"&PID=" +
				pid +
				"&NomMetadato=IPPublic";

			try {
				log(
					"Pidiendo url de configuracion inicial",
					
					NivelLog.info
				);
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
				const doc = <Document>res.data;
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
				const protocol = cfg.get("protocolServer");
				if (protocol === "https://")
					return `${cfg.get(
						"ipServer"
					)}${replaced}/Servicios/WebConfig`;

				return `${protocol}${replaced}:8090/Servicios/WebConfig`;
			} catch (error) {
				const e = <HTTPError>error;
				if (
					e.status === "500" &&
					e.response?.toString().indexOf(
						"System.InvalidOperationException:" // TODO funciona?
					)
				) {
					log(
						"[SERVIDOR] El servidor no implementa el método para la url inicial, usamos el por defecto..." +
							e,
						
						NivelLog.error
					);
					return (
						cfg.getDefaultWcfServerAddress() +
						"/Servicios/WebConfig"
					);
				}
				ConfigRequester.errHandler(e.toString());
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
			if (!cfg.getInt("configPID", 0)) {
				log(
					"[CONFIGURACION] Nos ha llegado una respuesta de configuracion, pero no tenemos ID... Puede que acaben de reconfigurarnos, descartamos la configuración",
					
					NivelLog.warn
				);
				return null;
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

		const pid: PID = cfg.get("configPID", undefined);
		if (pid === undefined) {
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
			if (!pid)
				throw new Error("No estamos configurados y no tenemos PID");

			ConfigRequester.urlWebCfgServiceInicial = 
				await inicializarUrlCfg(pid, cfg.getInt("configEID", 0));
		}

		/*
		 * timeStamp sera undefined si no se usa WSDenevaRequest
		 */

		try {
			const config = await pedirConfigAlServidor(pid);
			return parseConfigXML(config.doc, config.timestamp);
		} catch (error) {
			const e = <Error>error;
			this.errHandler(e.toString());
			e.message = "Error pidiendo configuracion: " + e.message
			throw e;
		}
	}
}
