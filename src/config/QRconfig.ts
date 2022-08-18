//TODO cambiar nombre a este archivo.

import { Funcionalidad, logFactory, NivelLog } from "../Utils/logger";
import { cfg } from "./cfg";
import QRCode from 'qrcode';
import { deviceProperties } from "../Utils/deviceProperties";



const log = logFactory(Funcionalidad.settings);

export async function QRconfigure(url: string, validez: Date): Promise<void> {
	log("QR configure");
	checkValidez(validez);
	await createQRCode(url);

    // cuando caduque
	window.setTimeout(() => createQRCode(url), (validez.getTime() - new Date().getTime())); // TODO quitar cuando se active
	locateItems();
	return;
}

function checkValidez(validez: Date) {
	if (new Date() > validez) throw new Error("Fecha inválida");
}
async function createQRCode(url: string) { // TODO test en sssp2
    await QRCode.toDataURL(<HTMLCanvasElement>document.getElementById("qrcode"), url)
}


function locateItems() {
    let docAncho = deviceProperties.getWidth();
    let docAlto = deviceProperties.getHeight();
    if (docAlto === 0 && docAncho === 1920) {
        docAlto = 1080;
    } else if (docAlto === 0 && docAncho === 1080) {
        docAlto = 1920;
    }
    let cfgWrapperAncho = docAncho;
    let cfgWrapperAlto = docAlto;
    let ratio;
    let cfgWrapperMargenLeft: number;
    let cfgWrapperMargenTop: number;

    function calcularDimensiones() {
        /*
        * En LG, según arranca, aunque la orientación nativa sea vertical,
        * las dimensiones que pinta son horizontales.
        */
        docAncho = deviceProperties.getWidth();
        docAlto = deviceProperties.getHeight();
        if (docAlto === 0 && docAncho === 1920) {
            docAlto = 1080;
        } else if (docAlto === 0 && docAncho === 1080) {
            docAlto = 1920;
        }
        cfgWrapperAncho = docAncho;
        cfgWrapperAlto = docAlto;
        // Forzamos a un aspect ratio de 16:9
        if (deviceProperties.getOrientacion() === deviceProperties.orientacion.PORTRAIT) {
    
            if (docAncho / 9 * 16 >= docAlto) { // Stretch horizontal
                ratio = cfgWrapperAlto / docAlto;
                cfgWrapperAncho = docAlto / 16 * 9 * ratio;
                cfgWrapperAlto = docAlto * ratio;
            } else { // strech vertical
                ratio = cfgWrapperAncho / docAncho;
                cfgWrapperAlto = docAncho / 9 * 16 * ratio;
                cfgWrapperAncho = docAncho * ratio;
            }
        } else {
            if (docAncho / 16 * 9 >= docAlto) { // Stretch horizontal
                ratio = cfgWrapperAlto / docAlto;
                cfgWrapperAncho = docAlto / 9 * 16 * ratio;
                cfgWrapperAlto = docAlto * ratio;
            } else { // strech vertical
                ratio = cfgWrapperAncho / docAncho;
                cfgWrapperAlto = docAncho / 16 * 9 * ratio;
                cfgWrapperAncho = docAncho * ratio;
            }
        }
        cfgWrapperMargenLeft = (docAncho - cfgWrapperAncho) / 2;
        cfgWrapperMargenTop = (docAlto - cfgWrapperAlto) / 2;
    }
    function _locate() {
        function locateItemsVertical() {
            const divCode = document.getElementById('divCode')!;
            const codeText = document.getElementById("codeText")!;

            const posX = (cfgWrapperAncho / 2) - (divCode.offsetWidth / 2);
            //var posY = docAlto * 0.16 - document.getElementById('divInfo').offsetHeight;
            const posY = cfgWrapperAlto * 0.16;

            if ((cfgWrapperAncho < 1800 && deviceProperties.getOrientacion() !== deviceProperties.orientacion.PORTRAIT) ||
                    (cfgWrapperAncho < 710 && deviceProperties.getOrientacion() === deviceProperties.orientacion.PORTRAIT)) {
                codeText.style.fontSize = "48px";
                //} else if ((cfgWrapperAncho < 1800 && deviceProperties.getOrientacion() != deviceProperties.orientacion.PORTRAIT) ||
                //        (cfgWrapperAncho < 710 && deviceProperties.getOrientacion() == deviceProperties.orientacion.PORTRAIT)) {
                //    codeText.style.fontSize = "12px";
            } else {
                codeText.style.fontSize = "96px";
            }

            divCode.style.left = posX + "px";
            divCode.style.top = posY + "px";

            divCode.style.width = (cfgWrapperAncho * 0.5) + "px";
            divCode.style.height = (cfgWrapperAlto * 0.104) + "px";


            // TODO hace falta???

            // const qrCode = document.getElementById("qrcode")!
            // if (qrCode.innerHTML !== "") {
            //     qrCode.style.top = (cfgWrapperAlto * 0.61) + "px";
            //     //qrCode.style.left = (cfgWrapperAncho * 0.104) + "px";
            //     qrCode.style.left = (cfgWrapperAncho * 0.30) + "px";
            //     const tam = calculeQRSize();
            //     qrCode.style.height = tam + "px"
            //     qrCode.style.width = tam + "px"

            //     redimensionarQRCode(calculeQRSize()); // Redibuja con otro tamaño
            // }
        }

        function locateItemsHorizontal() {

            const divCode = document.getElementById('divCode')!;
            const codeText = document.getElementById("codeText")!;

            let posX = cfgWrapperAncho * 0.25;
            let posY = cfgWrapperAlto * 0.5;

            if ((cfgWrapperAncho < 1800 && deviceProperties.getOrientacion() !== deviceProperties.orientacion.PORTRAIT) ||
                    (cfgWrapperAncho < 710 && deviceProperties.getOrientacion() === deviceProperties.orientacion.PORTRAIT)) {
                codeText.style.fontSize = "48px";
                //} else if ((cfgWrapperAncho < 1800 && deviceProperties.getOrientacion() != deviceProperties.orientacion.PORTRAIT) ||
                //        (cfgWrapperAncho < 710 && deviceProperties.getOrientacion() == deviceProperties.orientacion.PORTRAIT)) {
                //    codeText.style.fontSize = "12px";
            } else {
                codeText.style.fontSize = "96px";
            }
            posX = cfgWrapperAncho * 0.1145;
            divCode.style.width = (cfgWrapperAncho * 0.28) + "px";
            divCode.style.height = (cfgWrapperAlto * 0.185) + "px";

            posY = (cfgWrapperAlto - divCode.offsetHeight) * .5;
            divCode.style.left = posX + "px";
            divCode.style.top = posY + "px";

        // TODO hace falta???
        //     if (qrCode.innerHTML != "") {
        //         qrCode.style.top = (cfgWrapperAlto * 0.4) + "px";
        //         qrCode.style.left = (cfgWrapperAncho * 0.5156) + "px";
        //         var tam = calculeQRSize();
        //         qrCode.style.height = tam + "px"
        //         qrCode.style.width = tam + "px"

        //         redimensionarQRCode(calculeQRSize()); // Redibuja con otro tamaño
        //     }
        // }
        calcularDimensiones();
        const divCfg = document.getElementById("configure")!;
        divCfg.style.width = cfgWrapperAncho + "px";
        divCfg.style.height = cfgWrapperAlto + "px";
        divCfg.style.position = "absolute";
        divCfg.style.top = cfgWrapperMargenTop + "px";
        divCfg.style.left = cfgWrapperMargenLeft + "px";

        if (deviceProperties.getOrientacion() === deviceProperties.orientacion.LANDSCAPE) {
            $('#configure').removeClass('vertical');
            $('#configure').addClass('horizontal');
            locateItemsHorizontal();
        } else {
            $('#configure').removeClass('horizontal');
            $('#configure').addClass('vertical');
            locateItemsVertical();
        }
    }
    /*
    * [CAR] Por alguna razon a veces el codigo se posiciona mal en la primera llamada
    * pero se reposiciona bien cuando init llama de nuevo, asi que hacemos una segunda
    * De todas formas, habiendo un fondo fijo, quiza mereceria la pena posicionar en el css en lugar de aqui
    * Lastima que SSSP2 parece que no soporte las unidades de viewport y que calc() no debe estar bien implementado
    */
    try {
        _locate();
    } catch (e) {
        console.error("No se pudieron posicionar bien los elementos. " + e);
        setTimeout(_locate, 1000);
    }
    setTimeout(_locate, 100);
}
}