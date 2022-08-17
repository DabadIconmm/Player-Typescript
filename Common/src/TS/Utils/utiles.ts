
/* eslint-disable */
// @ts-nocheck

import { Funcionalidad, logFactory, NivelLog } from "./logger";

const log = logFactory(Funcionalidad.utiles);

export function formatearFecha(date: Date, pretty: boolean) {

    let dd: string | number = date.getDate();
    let mm: string | number = date.getMonth() + 1; //January is 0!
    let hh: string | number = date.getHours();
    let MM: string | number = date.getMinutes();
    let ss: string | number = date.getSeconds();

    const yyyy = date.getFullYear();
    if (dd < 10) dd = '0' + dd
    if (mm < 10) mm = '0' + mm
    if (hh < 10) hh = '0' + hh
    if (MM < 10) MM = '0' + MM
    if (ss < 10) ss = '0' + ss

    if (pretty === true) {
        return dd + '-' + mm + '-' + yyyy + ' ' + hh + ':' + MM + ':' + ss;
    } 
        return dd + '-' + mm + '-' + yyyy + 'T' + hh + ':' + MM + ':' + ss;
    
}

export function formatearFechaUTCDia(date: Date) {

    const mm = date.getMonth() + 1;
    const dd = date.getDate();

    return [date.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
    ].join('');
}

export function stringToTimestamp(fecha) {
    //formato "14/05/2015 09:44:36" | "14-05-2015 9:44:36"

    if (fecha.indexOf(":") == -1) {
        fecha = fecha + " 00:00:00";
    }

    fecha = fecha.replace("/", "-");
    fecha = fecha.replace("/", "-");

    var dias = fecha.split(" ")[0].split("-");
    var horas = fecha.split(" ")[1].split(":");

    for (var i = 0; i < dias.length - 1; i++) {
        if (dias[i].length == 1) dias[i] = "0" + dias[i];
    }

    for (i = 0; i < horas.length; i++) {
        if (horas[i].length == 1) horas[i] = "0" + horas[i];
    }

    //dd/mm/yyyy
    if (dias[2].length == 4) {
        fecha = dias[0] + "-" + dias[1] + "-" + dias[2] + " " + horas[0] + ":" + horas[1] + ":" + horas[2];
    }

    //yyyy/mm/dd
    if (dias[0].length == 4) {
        fecha = dias[2] + "-" + dias[1] + "-" + dias[0] + " " + horas[0] + ":" + horas[1] + ":" + horas[2];
    }


    var dateArray;
    var reggie = /(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/;
    var dateArray = reggie.exec(fecha);

    var dateObject = new Date(
    dateArray[3],
    dateArray[2] - 1, // Careful, month starts at 0!
    dateArray[1],
    dateArray[4],
    dateArray[5],
    dateArray[6]
);

    return dateObject;
}