
"use strict";

/*
 * Esta clase (y la clase de prueba) es practicamente un copypaste de la implementacion de Java.
 * Esta adaptada para que funcione en JavaScript pero se notarán cosas raras.
 *
 * - Variables llamadas como "cal", "auxCal"... no hacen referencia a la clase Cal (calendarios de Deneva)
 *   sino a la clase Calendar de Java, usada para hacer calculos de fechas.
 * - JavaScript no soporta sobrecarga de funciones, asi que la emulo en getNextBloque y getBloques
 * - Tengo JavaDoc delante de algunos metodos...
 *
 * Es una clase complicada, pero hay un archivo calendarios_test con una bateria de pruebas para ella.
 */

var Dnv = Dnv || {};

Dnv.Calendarios = Dnv.Calendarios || {};

//RAG: crear clase y lógica para valores forzados.
var valorForzadoMonitor = -1; //-1 no hay valor forzado, 0 apagado, 1 encendido


Dnv.Calendarios.FechaInvalidaException = function FechaInvalidaException(message) {
    this.name = 'FechaInvalidaException';
    this.message = message || '';
}
Dnv.Calendarios.FechaInvalidaException.prototype = Object.create(Error.prototype);
Dnv.Calendarios.FechaInvalidaException.prototype.constructor = Dnv.Calendarios.FechaInvalidaException;

Dnv.Calendarios.Bloque = function (codigo, fechaInicio, fechaFin, valor, objectId, objIdDispositivo) {

    return {
        getCodigo: function () { return codigo; },
        getFechaInicio: function () { return fechaInicio; },
        getFechaFin: function () { return fechaFin; },
        getValor: function () { return valor; },
        getObjectId: function () { return objectId; },
        getObjId: function () { return objectId; },
        getObjIdDispositivo: function () { return objIdDispositivo; },
        /**
        * Calcular si el bloque está activo en esta fecha, es decir si
        * la fecha esta en el intervalo (cerrado) definido por Inicio y Fin (Inicio <= fecha <= Fin)
        * @param fecha La fecha a comprobar. Seguramente querremos que los milisegundos esten a 0
        * @return
        */
        isActivo: function (fecha) {
            return (fechaInicio.getTime() <= fecha.getTime()) && (fecha.getTime() <= fechaFin.getTime());
        },
        toString: function () {
            return "Bloque#" + codigo + " = " + valor + " (" + fechaInicio + " - " + fechaFin + ")";
        }
    };
};

Dnv.Calendarios.Bloque.tipos = {
    TIPO_DISPOSITIVO_ESPECIFICO: 0,
    TIPO_DIA_ESPECIFICO: 1,
    TIPO_DIA_DE_LA_SEMANA: 2,
    TIPO_TODOS_LOS_DIAS: 3,
    TIPO_POR_DEFECTO: 4,
    TIPO_PRECACHEADO: 5,
    TIPO_X_FESTIVO_DISP_ESPECIFICO: 997,
    TIPO_X_FESTIVO_DIA_ESPECIFICO: 998,
    TIPO_X_FESTIVO_RECURRENTE: 999
};

Dnv.Calendarios.Bloque.ordenTipos = [
    Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO,
	Dnv.Calendarios.Bloque.tipos.TIPO_DIA_ESPECIFICO,
    Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO,
    Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO,
    Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_RECURRENTE,
	Dnv.Calendarios.Bloque.tipos.TIPO_DIA_DE_LA_SEMANA,
	Dnv.Calendarios.Bloque.tipos.TIPO_TODOS_LOS_DIAS,
	Dnv.Calendarios.Bloque.tipos.TIPO_POR_DEFECTO
];

Dnv.Calendarios.BloqueManager = function (calFestivos) {
    var _bloquesDispositivo = [];
    var _bloquesDiaEspecifico = [];
    var _bloquesDiaSemana = [];
    var _bloquesDiaGenerico = [];
    var _bloquesPorDefecto = [];
    var _bloquesFestivoDispEspecifico = [];
    var _bloquesFestivoDiaEspecifico = [];
    var _bloquesFestivoRecurrente = [];
    var _calFestivos = calFestivos;

    var _MAX_DATE_VALUE = 8640000000000000; // Valor máximo con que se puede construir una fecha en JavaScript

    var _addBloque = function addBloque(tipo, bloque) {

        switch (tipo) {
            case Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO:
                _bloquesDispositivo.push(bloque); break;
            case Dnv.Calendarios.Bloque.tipos.TIPO_DIA_ESPECIFICO:
                _bloquesDiaEspecifico.push(bloque); break;
            case Dnv.Calendarios.Bloque.tipos.TIPO_DIA_DE_LA_SEMANA:
                if (bloque.getFechaInicio().getFullYear() != 1900 || bloque.getFechaFin().getFullYear() != 1900 ||
                        bloque.getFechaInicio().getMonth() != 0 || bloque.getFechaFin().getMonth() != 0) {
                    throw new Dnv.Calendarios.FechaInvalidaException("Las fechas de este bloque son incorrectas para este tipo " + bloque);

                } else if (bloque.getFechaInicio().getDate() > 9 || bloque.getFechaFin().getDate() > 9) {
                    throw new Dnv.Calendarios.FechaInvalidaException("Las fechas de este bloque son incorrectas para este tipo " + bloque);
                } else if (bloque.getFechaInicio().getDate() > 7 || bloque.getFechaFin().getDate() > 7) {
                    /*
                    * Este bloque festivo no es el tipo por defecto del calendario de festivos,
                    * con lo que se comportara como si fuera de TIPO_[DISP|DIA]_ESPECIFICO pero con
                    * menos prioridad.
                    * 
                    * Asi que copiamos los bloques del calendario de festivos
                    * de TIPO_DISP_ESPECIFICO y TIPO_DIA_ESPECIFICO a nuevos
                    * tipos TIPO_X_FESTIVOS_DISP_ESPECIFICO y TIPO_X_FESTIVOS_DIA_ESPECIFICO
                    * que nos inventamos, dando a los bloques el valor del bloque.
                    * 
                    * El calendario de festivos solo tiene TIPO_DISP_ESPECIFICO y TIPO_DIA_ESPECIFICO
                    */
                    _aplicarBloqueFestivoNoRecurrente(bloque, Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO);
                    _aplicarBloqueFestivoNoRecurrente(bloque, Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO);


                    if ((bloque.getFechaInicio().getDate() == 8 &&
                                _calFestivos.getDefaultValue() == Dnv.Calendarios.Cal.festivos.FESTIVOS_FESTIVO_COMERCIAL) ||
                            (bloque.getFechaInicio().getDate() == 9 &&
                                _calFestivos.getDefaultValue() == Dnv.Calendarios.Cal.festivos.FESTIVOS_FESTIVO_NO_COMERCIAL)) {
                        /*
                        * Este bloque festivo es el tipo por defecto del calendario de festivos
                        * con lo que se comportara como si fuera de TIPO_TODOS_LOS_DIAS pero con
                        * más prioridad.
                        */
                        _bloquesFestivoRecurrente.push(bloque);
                    }
                } else {
                    _bloquesDiaSemana.push(bloque);
                }
                break;
            case Dnv.Calendarios.Bloque.tipos.TIPO_TODOS_LOS_DIAS:
                if (bloque.getFechaInicio().getFullYear() != 2000 || bloque.getFechaFin().getFullYear() != 2000 ||
						bloque.getFechaInicio().getMonth() != 0 || bloque.getFechaFin().getMonth() != 0 ||
						bloque.getFechaInicio().getDate() != 1 || bloque.getFechaFin().getDate() != 1) {
                    throw new Dnv.Calendarios.FechaInvalidaException("Las fechas de este bloque son incorrectas para este tipo " + bloque);
                } else {
                    _bloquesDiaGenerico.push(bloque);
                }
                break;
            case Dnv.Calendarios.Bloque.tipos.TIPO_POR_DEFECTO:
                // Este tipo de bloques no se usa realmente
                console.warn("BLOQUES: Ignorando bloque " + bloque.getCodigo() + " de tipo por defecto");
            case Dnv.Calendarios.Bloque.tipos.TIPO_PRECACHEADO:
                // Este tipo de bloques se usa solo para que haya más canales en la playlist
                break;

            default: console.error("BLOQUES: Ignorando bloque " + bloque.getCodigo() + " de tipo desconocido " + tipo);
        }
    };

    /**
    * Aplicar un {@link Bloque} para dias festivos al grupo de bloques de dias
    * <p>Para aplicarlo, se coge el bloque y se aplica para todos los dias que
    * señale el calendario de festivos.</p>
    * <p>El proceso se hara con dos tipos de bloques
    * <ul>
    * <li>los de {@link #TIPO_X_FESTIVO_DISP_ESPECIFICO} que se copian de los
    * bloques de dispositivos especificos del calendario de festivos a
    * {@link #mBloquesFestivoDispEspecifico}</li>
    * <li>los de {@link #TIPO_X_FESTIVO_DIA_ESPECIFICO} que se copian de los
    * bloques de dias especificos del calendario de festivos a
    * {@link #mBloquesFestivoDiaEspecifico}</li>
    * </p>
    * @param bloque El {@link Bloque} a importar
    * @param tipo
    */
    var _aplicarBloqueFestivoNoRecurrente = function _aplicarBloqueFestivoNoRecurrente(bloque, tipo) {
        //assert tipo == TIPO_X_FESTIVO_DISP_ESPECIFICO || tipo == TIPO_X_FESTIVO_DIA_ESPECIFICO;
        if (tipo !== Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO && tipo !== Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO) {
            console.error("BLOQUES: Tipo de bloque incorrecto");
            return;
        }

        var tipoOrigen;
        var destino;
        switch (tipo) {
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO:
                tipoOrigen = Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO;
                destino = _bloquesFestivoDispEspecifico;
                break;
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO:
                tipoOrigen = Dnv.Calendarios.Bloque.tipos.TIPO_DIA_ESPECIFICO;
                destino = _bloquesFestivoDiaEspecifico;
                break;
            default:
                //throw new RuntimeException("Tipo desconocido");
                console.error("BLOQUES: Tipo Desconocido");
                return;
        }

        var bmCalFestivos = _calFestivos.getBloqueManager();
        var bloques = bmCalFestivos.getBloques(tipoOrigen);
        for (var i = 0; i < bloques.length; i++) {
            var bloqueFestivo = bloques[i];
            if ((bloque.getFechaInicio().getDate() == 8 &&
						bloqueFestivo.getValor() == Dnv.Calendarios.Cal.festivos.FESTIVOS_FESTIVO_COMERCIAL) ||
					(bloque.getFechaInicio().getDate() == 9 &&
						bloqueFestivo.getValor() == Dnv.Calendarios.Cal.festivos.FESTIVOS_FESTIVO_NO_COMERCIAL)) {
                var bFI = bloque.getFechaInicio();
                var bFF = bloque.getFechaFin();

                /*
                * El bloque festivo puede ser de varios dias
                */
                var cal = new Date();
                cal.setTime(bloqueFestivo.getFechaInicio().getTime());

                if (cal.getHours() !== 0 || cal.getMinutes() !== 0 || cal.getSeconds() !== 0 || cal.getMilliseconds() !== 0) {
                    console.error("BLOQUES: La hora de inicio del bloque es incorrecta: " + cal);
                }


                var fechaFin = bloqueFestivo.getFechaFin();
                if (fechaFin.getHours() !== 23 || fechaFin.getMinutes() !== 59 || fechaFin.getSeconds() !== 59) {
                    console.error("BLOQUES: La hora de fin del bloque es incorrecta " + fechaFin);
                }
                if (fechaFin.getMilliseconds() !== 999) { // En las pruebas no lo tengo ajustado a 999...
                    console.warn("BLOQUES: Los milisegundos de la hora de fin del bloque no están ajustados a 999 " + fechaFin);
                }
                //delete fechaFin;

                cal.setHours(bFI.getHours());
                cal.setMinutes(bFI.getMinutes());
                cal.setSeconds(bFI.getSeconds());
                //cal.set(Calendar.MILLISECOND, 0);
                cal.setMilliseconds(bFI.getTime() % 1000);

                while (cal.getTime() <= bloqueFestivo.getFechaFin().getTime()) {
                    var fi = new Date(cal.getTime());

                    cal.setHours(bFF.getHours());
                    cal.setMinutes(bFF.getMinutes());
                    cal.setSeconds(bFF.getSeconds());
                    //cal.set(Calendar.MILLISECOND, 999);
                    cal.setMilliseconds(bFF.getTime() % 1000);
                    var ff = new Date(cal.getTime());

                    /*
                    * Miramos si en esa fecha se aplica el bloque, no sea que el
                    * bloque festivo de dia tenga uno de dispositivo por encima. 
                    */
                    if (tipoOrigen == Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO ||
							bloqueFestivo == bmCalFestivos.getBloqueParaFecha(fi)) {

                        // Cuidado: esto implica que habra bloques con codigos duplicados
                        var aux = new Dnv.Calendarios.Bloque(
								bloque.getCodigo(), fi, ff,
								bloque.getValor(), bloque.getObjId(),
								bloque.getObjIdDispositivo());
                        destino.push(aux);
                    }

                    /*
                    * Volvemos a poner las horas de inicio aqui para comprobar
                    * la condicion del while con los datos correctos
                    */
                    cal.setHours(bFI.getHours());
                    cal.setMinutes(bFI.getMinutes());
                    cal.setSeconds(bFI.getSeconds());
                    //cal.set(Calendar.MILLISECOND, 0);
                    cal.setMilliseconds(bFI.getTime() % 1000);

                    //cal.set(Calendar.DAY_OF_YEAR, 1);
                    cal.setTime(cal.getTime() + 1 * 24 * 60 * 60 * 1000);
                }
            }
        }
    };

    var _getCalendar = function _getCalendar(fecha) {
        /*
        * En JS no hay Calendar, devolvemos una copia de Date
        * Esta función NO devuelve un objeto de tipo Cal (calendario de Deneva)
        * Simplemente existe porque esta clase es un port casi literal de la implementacion Amdroid y ahi lo necesitaba
        * En cualquier caso, se usa cuando se espera trabajar con una copia de la fecha
        */
        var cal = new Date();
        cal.setTime(fecha.getTime());
        return cal;
    };

    // En JS Date.getDay devuelve el dia de a semana del 0-6 donde 0 = Domingo y 6=Sabado
    var MONDAY = 1;
    var TUESDAY = 2;
    var WEDNESDAY = 3;
    var THURSDAY = 4;
    var FRIDAY = 5;
    var SATURDAY = 6;
    var SUNDAY = 0;


    /**
    * Calcular la fecha/hora real a la que hace referencia <code>fecha</code>
    * <p>Para {@link #TIPO_DISPOSITIVO_ESPECIFICO}, {@link #TIPO_DIA_ESPECIFICO}.
    * {@link #TIPO_X_FESTIVO_DISP_ESPECIFICO} y {@link #TIPO_X_FESTIVO_DIA_ESPECIFICO}
    * es la misma fecha. En cambio, para {@link #TIPO_DIA_DE_LA_SEMANA}, 01/Enero/1900
    * hará referencia al lunes anterior/posterior a <code>fechaBase</code> y si
    * es {@link #TIPO_X_FESTIVO_RECURRENTE} o {@link #TIPO_TODOS_LOS_DIAS}
    * será el dia de <code>fechaBase</code> (o el anterior o el posterior, en
    * funcion de la hora de <code>fechaBase</code> y del valor de <code>anteriorABase</code>)
    * con la hora de <code>fechaBase</code> señalada.</p>
    * 
    * <p>Para simplificar los lugares donde usamos este método, devolvemos un {@link Calendar}</p>
    * 
    * @param tipoCalendario
    * @param fecha
    * @param fechaBase
    * @param anteriorABase Para los tipos recurrentes: <code>true</code> si buscamos el dia [de la semana] anterior o el posterior a <code>fechaBase</code>
    * @param permitirIgual Para los tipos recurrentes: <code>true</code> si permitimos devolver un valor igual a <code>fechaBase</code> o <code>false</code> si debe ser estrictamente anterior o posterior
    * @return 
    */
    var _getFechaReal = function _getFechaReal(tipoCalendario, fecha, fechaBase, anteriorABase, permitirIgual) {

        var cal;
        switch (tipoCalendario) {
            case Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO:
            case Dnv.Calendarios.Bloque.tipos.TIPO_DIA_ESPECIFICO:
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO:
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO:
                return _getCalendar(fecha);
            case Dnv.Calendarios.Bloque.tipos.TIPO_DIA_DE_LA_SEMANA:
                var dsem;

                switch (fecha.getDate()) {
                    case 1: dsem = MONDAY; break;
                    case 2: dsem = TUESDAY; break;
                    case 3: dsem = WEDNESDAY; break;
                    case 4: dsem = THURSDAY; break;
                    case 5: dsem = FRIDAY; break;
                    case 6: dsem = SATURDAY; break;
                    case 7: dsem = SUNDAY; break;
                    case 8: // Festivos comerciales
                    case 9: // Festivos no comerciales
                        throw new Error("Combinación no esperada. El tipo de calendario 'dia de la semana' no deberia usar el día "+dsem);
                        //Log.w(TAG, "Los bloques de dias festivos aún no están implementados");
                        //return null;
                    default:
                        console.error("BLOQUES: Este tipo de bloque no esta soportado");
                        return null;
                }
                /*
                * TODO: Ellos no tienen implementados los dias festivos comerciales/nocomerciales
                * 	los comerciales son el dia 8 y los no comerciales el 9 
                */


                /*
                * Seteamos al dia de la semana, si el dia es posterior a hoy y anterior=true, cogemos
                * hoy, hacemos un add de -1 semana y volvermos a setear el dia de la semana
                * 
                * Si el dia es anterior y anterior=false, lo mismo con add de +1 semana
                */


                var desplazarADiaSemana = function desplazarADiaSemana(fecha, diaSem, retroceder) {
                    var diferenciaDias;

                    if (retroceder) { // Retrocedemos
                        if (fecha.getDay() < diaSem) {
                            diferenciaDias = 7 - (diaSem - fecha.getDay());
                        } else if (fecha.getDay() > diaSem) {
                            diferenciaDias = fecha.getDay() - diaSem;
                        } else {
                            diferenciaDias = 7;
                        }

                        diferenciaDias = -diferenciaDias; // Retroceso
                    } else {
                        if (fecha.getDay() < diaSem) {
                            diferenciaDias = diaSem - fecha.getDay();
                        } else if (fecha.getDay() > diaSem) {
                            diferenciaDias = 7 - (fecha.getDay() - diaSem);
                        } else {
                            diferenciaDias = 7;
                        }
                    }

                    var time = fecha.getTime();
                    //console.log("Desde "+fecha);
                    fecha.setTime(fecha.getTime() + diferenciaDias * 24 * 60 * 60 * 1000);
                    //console.log("A "+fecha);
                    return fecha;
                };

                cal = _getCalendar(fechaBase);

                cal.setHours(fecha.getHours());
                cal.setMinutes(fecha.getMinutes());
                cal.setSeconds(fecha.getSeconds());


                if (!(dsem == cal.getDay() && (
                            (!anteriorABase && cal.getTime() > fechaBase.getTime()) ||
                            (permitirIgual && !anteriorABase && cal.getTime() >= fechaBase.getTime()) ||
                            (anteriorABase && cal.getTime() < fechaBase.getTime()) ||
                            (permitirIgual && anteriorABase && cal.getTime() <= fechaBase.getTime())
                        ))) {

                    /*
                    * Desplazamos cal al dia de la semana, a menos que ya estemos en él y ya
                    * estemos en el pasado/futuro (en funcion de anteriorABase) respecto a fechaBase.
                    * Es decir, si queremos ir a un sabado anteriorABase las 12:00, y fechaBase es un
                    * sábado a las 14:00, no entraremos (cal ya estaria en el mismo sabado que fechaBase,
                    * pero a las 12, con lo que es un sábado anteriorABase)
                    */
                    cal = desplazarADiaSemana(cal, dsem, anteriorABase);
                }

                if (permitirIgual && anteriorABase && cal.getTime() > fechaBase.getTime()) console.error("BLOQUES: Mal calculado");
                else if (permitirIgual && !anteriorABase && cal.getTime() < fechaBase.getTime()) console.error("BLOQUES: Mal calculado");
                else if (!permitirIgual && anteriorABase && cal.getTime() >= fechaBase.getTime()) console.error("BLOQUES: Mal calculado");
                else if (!permitirIgual && !anteriorABase && cal.getTime() <= fechaBase.getTime()) console.error("BLOQUES: Mal calculado");

                return cal;

            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_RECURRENTE:
            case Dnv.Calendarios.Bloque.tipos.TIPO_TODOS_LOS_DIAS:
                cal = _getCalendar(fechaBase);

                cal.setHours(fecha.getHours(), fecha.getMinutes(), fecha.getSeconds(), fecha.getMilliseconds());

                if (permitirIgual) {
                    if (cal.getTime() > fechaBase.getTime() && anteriorABase) {
                        cal.setTime(cal.getTime() - 24 * 60 * 60 * 1000); // Retrocedemos un dia
                    } else if (cal.getTime() < fechaBase.getTime() && !anteriorABase) {
                        cal.setTime(cal.getTime() + 24 * 60 * 60 * 1000); // Avanzamos un dia
                    }

                    if (anteriorABase) {
                        if (cal.getTime() > fechaBase.getTime()) console.error("BLOQUES: no se cumple el assert"); // aceptamos igual a
                    } else {
                        if (cal.getTime() < fechaBase.getTime()) console.error("BLOQUES: no se cumple el assert"); // aceptamos igual a
                    }
                } else {

                    if (cal.getTime() >= fechaBase.getTime() && anteriorABase) {
                        cal.setTime(cal.getTime() - 7 * 24 * 60 * 60 * 1000); // Retrocedemos una semana
                    } else if (cal.getTime() <= fechaBase.getTime() && !anteriorABase) {
                        cal.setTime(cal.getTime() + 7 * 24 * 60 * 60 * 1000); // Avanzamos una semana
                    }

                    if (anteriorABase) {
                        if (cal.getTime() >= fechaBase.getTime()) console.error("BLOQUES: no se cumple el assert"); // aceptamos igual a
                    } else {
                        if (cal.getTime() <= fechaBase.getTime()) console.error("BLOQUES: no se cumple el assert"); // aceptamos igual a
                    }
                }
                //Log.d(TAG, fecha+"->"+cal.getTime());
                return cal;
            default:
                throw new Error("BLOQUES: No se ha implementado el calculo de 'ahora' para este tipo de calendario");
        }
    };

    var _getBloqueParaFecha = function _getBloqueParaFecha(fecha) {

        /*
        * Mirar por orden los bloques: 
        * 		dispositivo especifico
        * 		dia concreto
        * 		X dia festivo especifico
        *		X dia festivo recurrente 
        * 		dia semana
        * 		todos los dias
        * 		default (estaba en la DB, pero no parece un grupo de bloques real)
        */

        var fechaDate = fecha;
        //fechaCal.set(Calendar.MILLISECOND, 0); // Evitar que los milisegundos causen problemas


        // TIPO_DISPOSITIVO_ESPECIFICO
        for (var i = 0; i < _bloquesDispositivo.length; i++) {
            var bloque = _bloquesDispositivo[i];
            if (bloque.isActivo(fecha)) return bloque;
        }


        // TIPO_DIA_ESPECIFICO
        for (var i = 0; i < _bloquesDiaEspecifico.length; i++) {
            var bloque = _bloquesDiaEspecifico[i];
            if (bloque.isActivo(fecha)) return bloque;
        }


        // TIPO_X_FESTIVO_DISP_ESPECIFICO
        for (var i = 0; i < _bloquesFestivoDispEspecifico.length; i++) {
            var bloque = _bloquesFestivoDispEspecifico[i];
            if (bloque.isActivo(fecha)) return bloque;
        }


        // TIPO_X_FESTIVO_DIA_ESPECIFICO
        for (var i = 0; i < _bloquesFestivoDiaEspecifico.length; i++) {
            var bloque = _bloquesFestivoDiaEspecifico[i];
            if (bloque.isActivo(fecha)) return bloque;
        }

        // TIPO_X_FESTIVO_RECURRENTE
        /*
        * Si el tipo por defecto del calendario de festivos no es laborable, habra
        * bloques de tipo festivo recurrente. Pero estos solo serán aplicables si
        * no hay un bloque para esa fecha en el calendario de festivos.
        *  
        */
        if (_calFestivos && _calFestivos.getDefaultValue() != Dnv.Calendarios.Cal.festivos.FESTIVOS_LABORABLE &&
                _calFestivos.getBloqueManager().getBloqueParaFecha(fecha) == null) {
            var dia = 0;
            if (_calFestivos.getDefaultValue() == Dnv.Calendarios.Cal.festivos.FESTIVOS_FESTIVO_COMERCIAL) {
                dia = 8;
            } else if (_calFestivos.getDefaultValue() == Dnv.Calendarios.Cal.festivos.FESTIVOS_FESTIVO_NO_COMERCIAL) {
                dia = 9;
            } else {
                console.error("BLOQUES: Valor desconocido para el calendario de festivos: " + _calFestivos.getDefaultValue());
            }

            var auxCal = _getCalendar(fecha);
            auxCal.setFullYear(1900);
            auxCal.setMonth(0); // Enero
            auxCal.setDate(dia);

            for (var i = 0; i < _bloquesFestivoRecurrente.length; i++) {
                var bloque = _bloquesFestivoRecurrente[i];
                if (bloque.isActivo(auxCal)) {

                    return bloque;
                }
            }
        }

        // TIPO_DIA_DE_LA_SEMANA

        // El año, el mes y el dia son irrelevantes ahora
        // El dia de la semana esta codificado como el dia (1900/01/01 -> Lunes, 1900/01/02 -> Martes)

        var dia = 0;
        switch (fecha.getDay()) {
            case MONDAY: dia = 1; break;
            case TUESDAY: dia = 2; break;
            case WEDNESDAY: dia = 3; break;
            case THURSDAY: dia = 4; break;
            case FRIDAY: dia = 5; break;
            case SATURDAY: dia = 6; break;
            case SUNDAY: dia = 7; break;
        }

        // TODO: Implementar Festivo Comercial (8) y No Comercial (9) cuando ellos lo hagan

        var auxCal = _getCalendar(fecha);
        auxCal.setFullYear(1900);
        auxCal.setMonth(0); // Enero
        auxCal.setDate(dia);

        var festivo = new Date(1900, 0, 8, 0, 0, 0); // 0 es enero
        for (var i = 0; i < _bloquesDiaSemana.length; i++) {
            var bloque = _bloquesDiaSemana[i];
            if (festivo.getTime() <= bloque.getFechaFin().getTime()) {
                //Log.w(TAG, "Los bloques de dias festivos aún no están implementados");
                //throw new Exception("Bloque festivo mal asignado");
                console.error("BLOQUES: Bloque festivo mal asignado");
                continue;
            }
            if (bloque.isActivo(auxCal)) {
                return bloque;
            }
        }

        // TIPO_TODOS_LOS_DIAS

        var auxCal = _getCalendar(fecha);
        auxCal.setFullYear(2000);
        auxCal.setMonth(0); // Enero
        auxCal.setDate(1);

        for (var i = 0; i < _bloquesDiaGenerico.length; i++) {
            var bloque = _bloquesDiaGenerico[i];
            if (bloque.isActivo(auxCal)) {
                return bloque;
            }
        }

        if (_bloquesPorDefecto.length !== 0) {
            // Normalmente estará vacio y no entrará nunca aquí
            console.error("BLOQUES: Condicion inesperada, Bloques Por Defecto no esta vacio");
            //return mBloquesPorDefecto.first();
            //return mBloquesPorDefecto.get(0);
            return _bloquesPorDefecto[0];
        }

        return null;


        /*

        var i;
        var fecha = new Date(2000, 0, 1, fecha.getHours(), fecha.getMinutes(), fecha.getSeconds(), fecha.getMilliseconds());

        for (i = 0; i < _bloquesDiaGenerico.length; i++) {
        var bloque = _bloquesDiaGenerico[i];
        if (bloque.isActivo(fecha)) return bloque;
        /*var fechaInicioBloque = _getFechaReal(Dnv.Calendarios.Bloque.tipos.TIPO_TODOS_LOS_DIAS, bloque.getFechaInicio(), true, true);
        var fechaFinBloque = _getFechaReal(Dnv.Calendarios.Bloque.tipos.TIPO_TODOS_LOS_DIAS, bloque.getFechaFin(), false, true);
        if (fechaInicioBloque.getTime() < fecha.getTime() && fecha.getTime() < fechaFinBloque.getTime()) {
        return bloque;
        }* /
        }
        return null;*/
    };

    var _getBloqueActual = function _getBloqueActual() { return _getBloqueParaFecha(new Date()); };

    var _getTipoBloque = function _getTipoBloque(bloque) {

        if (_bloquesDispositivo.indexOf(bloque) >= 0) return Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO;
        else if (_bloquesDiaEspecifico.indexOf(bloque) >= 0) return Dnv.Calendarios.Bloque.tipos.TIPO_DIA_ESPECIFICO;
        else if (_bloquesFestivoDispEspecifico.indexOf(bloque) >= 0) return Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO;
        else if (_bloquesFestivoDiaEspecifico.indexOf(bloque) >= 0) return Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO;
        else if (_bloquesFestivoRecurrente.indexOf(bloque) >= 0) return Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_RECURRENTE;
        else if (_bloquesDiaSemana.indexOf(bloque) >= 0) return Dnv.Calendarios.Bloque.tipos.TIPO_DIA_DE_LA_SEMANA;
        else if (_bloquesDiaGenerico.indexOf(bloque) >= 0) return Dnv.Calendarios.Bloque.tipos.TIPO_TODOS_LOS_DIAS;
        else {
            console.error("BLOQUES: El bloque no esta dentro de los grupos esperados");
            return -1;
        }
    };


    /**
    * Obtener la fecha de finalización del valor actual
    * @param valorPorDefecto El valor del calendario cuando no hay {@link Bloque}s
    * @return Un {@link Date} con la fecha/hora o <code>null</code> si no habia bloques con este valor
    */
    var _getFechaFinValorActual = function _getFechaFinValorActual(valorPorDefecto) {
        return _getFechaFinValorParaFecha(new Date(), valorPorDefecto);
    }

    var _getFechaFinValorParaFecha = function _getFechaFinValorParaFecha(fecha, valorPorDefecto) {

        var bloqueParaFecha = _getBloqueParaFecha(fecha);
        var bloques = new Array();

        /* 
        * Buscar el actual, buscar si entre ahora o el final hay algun bloque de tipo superior
        * - Si lo hay procesar ese (recursion)
        * - Si no lo hay, mirar que bloque/valor hay en el minuto siguiente a nuestro bloque
        * 		- Si hay bloque con el mismo, procesarlo (recursion)
        * 		- Si no hay bloque y defaultValue es el nuestro, buscar el siguiente distinto valor
        * 		  		Listar los de valor distinto...
        * 
        * 		- Si es distinto hemos localizado la fecha
        * 	
        * 
        */

        var fechaFin = null;

        if (_bloquesPorDefecto.length !== 0) {
            console.error("BLOQUES: Condicion inesperada, Bloques Por Defecto no esta vacio");
        }

        if (!bloqueParaFecha) {
            // Buscar bloque siguiente de distinto valor

            fechaFin = _getFechaFinDelValorDelBloque(fecha, 4, null, valorPorDefecto);

        } else {

            fechaFin = _getFechaFinDelValorDelBloque(fecha, _getTipoBloque(bloqueParaFecha), bloqueParaFecha, valorPorDefecto);
        }

        return fechaFin;
    };


    var _getFechaFinDelValorDelBloque = function _getFechaFinDelValorDelBloque(fecha, tipoBloque, bloque, valorPorDefecto) {
        var TIPO_DESCONOCIDO = -2;
        var fechaInicioRecurrencia = null; // fechaInicioRecurrencia la usamos para no recorrer infinitamente el calendario


        while (true) {
            //console.log(fecha + " " + tipoBloque + ", Bloque " + (bloque != null ? bloque.getFechaInicio() : bloque) + ", " + valorPorDefecto);
            // Tener por separado los valores para el casi en que el bloque no exista 
            var valorBloque;
            var fechaRealFinBloque;
            if (bloque == null) { // No hay bloque
                valorBloque = valorPorDefecto;
                fechaRealFinBloque = new Date(_MAX_DATE_VALUE); // Infinito
                tipoBloque = Dnv.Calendarios.Bloque.tipos.TIPO_POR_DEFECTO;
            } else {
                valorBloque = bloque.getValor();
                fechaRealFinBloque = _getFechaReal(tipoBloque, bloque.getFechaFin(), fecha, false, true);
            }

            // Buscar bloques con prioridad superior
            //Date resultado;
            var cal;
            var bloqueSuperior = null; // Bloque que se encuentra por encima del actual. Si hay varios, el más cercano, en caso de empates gana el de mayor prioridad
            var tipoBloqueSuperior = TIPO_DESCONOCIDO;

            // Fechas reales de los bloques
            var bsFechaRealInicio = null; // Bloque superior
            var itemFechaRealInicio, itemFechaRealFin;

            //for(int i = ORDEN_TIPOS.indexOf(tipoBloque) - 1; i >= 0; i--) {
            for (var i = Dnv.Calendarios.Bloque.ordenTipos.indexOf(tipoBloque) - 1; i >= 0; i--) {
                var tipo = Dnv.Calendarios.Bloque.ordenTipos[i];
                var bloques = _getBloques(tipo);
                for (var j = 0; j < bloques.length; j++) {
                    var item = bloques[j];
                    itemFechaRealInicio = _getFechaReal(tipo, item.getFechaInicio(), fecha, false, true);
                    //itemFechaRealFin = getFechaReal(tipo, item.getFechaFin(), fecha, false, true);
                    itemFechaRealFin = _getFechaReal(tipo, item.getFechaFin(), itemFechaRealInicio, false, true);


                    var auxFechaCal = new Date();
                    auxFechaCal.setTime(fecha.getTime());
                    while (tipo == Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_RECURRENTE &&
							_calFestivos.getBloqueManager().getBloqueParaFecha(itemFechaRealInicio) != null) {
                        /*
                        * Si hay bloques festivos recurrentes es que el valor por
                        * defecto del calendario de festivos no es laborable.
                        * Pero en este dia hay un bloque en el calendario de
                        * festivos que impide que se aplique el valor por defecto,
                        * por lo que ignoramos este dia y buscamos el correspondiente
                        * a un dia posterior. 
                        */
                        //auxFechaCal.add(Calendar.DAY_OF_YEAR, 1);
                        auxFechaCal.setTime(auxFechaCal.getTime() + 24 * 60 * 60 * 1000); // Avanzamos de dia

                        itemFechaRealInicio = _getFechaReal(tipo, item.getFechaInicio(), auxFechaCal, false, true);
                        //itemFechaRealFin = _getFechaReal(tipo, item.getFechaFin(), auxFechaCal, false, true);
                        itemFechaRealFin = _getFechaReal(tipo, item.getFechaFin(), itemFechaRealInicio, false, true);
                    }

                    if (itemFechaRealFin.getTime() > fecha.getTime() && // Innecesario para tipos 0 e 1
							itemFechaRealInicio.getTime() < fechaRealFinBloque.getTime() &&
							itemFechaRealInicio.getTime() < itemFechaRealFin.getTime() // Cubrirme las espaldas para los tipos 2 y 3
					) {


                        if (bloqueSuperior == null || itemFechaRealInicio.getTime() < bsFechaRealInicio.getTime() ||
								(bsFechaRealInicio.getTime() == itemFechaRealInicio.getTime() &&
										Dnv.Calendarios.Bloque.ordenTipos.indexOf(tipoBloqueSuperior) >= 0 &&
										Dnv.Calendarios.Bloque.ordenTipos.indexOf(tipo) < Dnv.Calendarios.Bloque.ordenTipos.indexOf(tipoBloqueSuperior))) {

                            bloqueSuperior = item;
                            bsFechaRealInicio = itemFechaRealInicio;
                            tipoBloqueSuperior = tipo;
                        }

                    }
                }
            }

            if (bloqueSuperior != null) {
                if (bloqueSuperior.getValor() == valorBloque) {
                    //console.log("Hemos encontrado un bloque superior con un valor igual que empieza en " + bsFechaRealInicio + ", lo seguimos");
                    //resultado = getFechaFinDelValorDelBloque(bsFechaRealInicio, tipoBloqueSuperior, bloqueSuperior, valorPorDefecto, null);
                    fecha = bsFechaRealInicio;
                    tipoBloque = tipoBloqueSuperior;
                    bloque = bloqueSuperior;
                    //valorPorDefecto
                    fechaInicioRecurrencia = null;
                    continue;

                } else { // Cambio de valor

                    //console.log("Hemos encontrado un bloque superior con un valor distinto que empieza en " + bsFechaRealInicio);
                    cal = _getCalendar(bsFechaRealInicio);
                    //cal.add(Calendar.SECOND, -1);
                    cal.setTime(cal.getTime() - 1000);
                    //resultado = cal.getTime();
                    return cal;
                }
            } else {

                /*
                * No hay bloques superiores, buscar si a continuación de este
                * bloque hay alguno aplicable
                */
                cal = _getCalendar(fechaRealFinBloque);
                //cal.add(Calendar.SECOND, 1); // TODO: Con un milisegundo debería valer
                cal.setTime(cal.getTime() + 1000);
                var sgteBloque = _getBloqueParaFecha(cal);
                var sgteBloqueTipo = TIPO_DESCONOCIDO;
                var sgteBloqueFechaRealInicio = null;

                if (sgteBloque != null) {
                    sgteBloqueTipo = _getTipoBloque(sgteBloque);
                    sgteBloqueFechaRealInicio = cal;
                } else if (sgteBloque == null && valorBloque == valorPorDefecto) {
                    /* 
                    * No hay bloque consecutivo, pero como el valor por defecto es el mismo que el del
                    * bloque actual, buscamos uno no consecutivo
                    */
                    sgteBloque = _getNextBloque(fechaRealFinBloque);
                    if (sgteBloque != null) {
                        sgteBloqueTipo = _getTipoBloque(sgteBloque);
                        sgteBloqueFechaRealInicio = _getFechaReal(sgteBloqueTipo, sgteBloque.getFechaInicio(), fechaRealFinBloque, false, true);
                    }
                }





                if (sgteBloque != null) {

                    if (sgteBloque.getValor() == valorBloque) {
                        /*
                        * Hay un bloque despues, con el mismo valor
                        */

                        //console.log("Hemos encontrado un bloque despues con un valor igual que empieza en " + sgteBloqueFechaRealInicio + ", lo seguimos");
                        var auxCal;

                        /*
                        * Nos aseguramos de no recorrer más de una semana con solo bloques no recurrentes (TIPO_DIA_DE_LA_SEMANA, TIPO_TODOS_LOS_DIAS)
                        */

                        var recurrenciaExcedida = false;
                        if (fechaInicioRecurrencia != null) {
                            auxCal = _getCalendar(fechaInicioRecurrencia);
                            //auxCal.add(Calendar.WEEK_OF_YEAR, 1);
                            auxCal.setTime(auxCal.getTime() + 7 * 24 * 60 * 60 * 1000);
                            if (sgteBloqueFechaRealInicio.getTime() > auxCal.getTime()) {
                                recurrenciaExcedida = true;
                            }
                        } else {
                            if (tipoBloque == Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_RECURRENTE ||
										tipoBloque == Dnv.Calendarios.Bloque.tipos.TIPO_DIA_DE_LA_SEMANA ||
										tipoBloque == Dnv.Calendarios.Bloque.tipos.TIPO_TODOS_LOS_DIAS) {
                                // Inicializamos
                                fechaInicioRecurrencia = fecha;
                            }

                        }
                        if (recurrenciaExcedida) {
                            /*
                            * Miramos si quedan no recurrentes con distinto valor, si quedan
                            * devolvemos el más cercano, y si no infinito
                            */
                            var sgteBDisp = _getNextBloqueConValorDistinto(sgteBloqueFechaRealInicio, Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO, valorBloque);
                            var sgteBDia = _getNextBloqueConValorDistinto(sgteBloqueFechaRealInicio, Dnv.Calendarios.Bloque.tipos.TIPO_DIA_ESPECIFICO, valorBloque);
                            var sgteBDispFestivo = _getNextBloqueConValorDistinto(sgteBloqueFechaRealInicio, Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO, valorBloque);
                            var sgteBDiaFestivo = _getNextBloqueConValorDistinto(sgteBloqueFechaRealInicio, Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO, valorBloque);
                            /*
                            * De los bloques que existen, nos quedamos con el mas cercano en el tiempo
                            * Si hay empate, gana el prioritario  
                            */
                            var tipoSgteNoRecurrente = TIPO_DESCONOCIDO;
                            var sgteBNoRecurrente = null;
                            if (sgteBDisp != null) {
                                sgteBNoRecurrente = sgteBDisp;
                                tipoSgteNoRecurrente = Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO;
                            }
                            if (sgteBDia != null && (sgteBNoRecurrente == null || sgteBDia.getFechaInicio().getTime() < sgteBNoRecurrente.getFechaInicio().getTime())) {
                                sgteBNoRecurrente = sgteBDia;
                                tipoSgteNoRecurrente = Dnv.Calendarios.Bloque.tipos.TIPO_DIA_ESPECIFICO;
                            }
                            if (sgteBDispFestivo != null && (sgteBNoRecurrente == null || sgteBDispFestivo.getFechaInicio().getTime() < sgteBNoRecurrente.getFechaInicio().getTime())) {
                                sgteBNoRecurrente = sgteBDispFestivo;
                                tipoSgteNoRecurrente = Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO;
                            }
                            if (sgteBDiaFestivo != null && (sgteBNoRecurrente == null || sgteBDiaFestivo.getFechaInicio().getTime() < sgteBNoRecurrente.getFechaInicio().getTime())) {
                                sgteBNoRecurrente = sgteBDiaFestivo;
                                tipoSgteNoRecurrente = Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO;
                            }

                            if (sgteBNoRecurrente != null) {
                                //console.log("Hemos recorrido una semana entera solo con bloques recurrentes, devolvemos la fecha de inicio del más cercano no recurrente");
                                cal = _getCalendar(_getFechaReal(tipoSgteNoRecurrente, sgteBNoRecurrente.getFechaInicio(), fecha, false, true));
                                //cal.add(Calendar.SECOND, -1);
                                cal.setTime(cal.getTime() - 1000);
                                //resultado = cal.getTime();
                                return cal;
                            } else {
                                //resultado = new Date(Long.MAX_VALUE);
                                return new Date(_MAX_DATE_VALUE);
                            }
                        } else {

                            //console.log("sBFRI " + sgteBloqueFechaRealInicio + " - fIR " + fechaInicioRecurrencia);
                            //resultado = getFechaFinDelValorDelBloque(sgteBloqueFechaRealInicio, sgteBloqueTipo, sgteBloque, valorPorDefecto, fechaInicioRecurrencia);
                            fecha = sgteBloqueFechaRealInicio;
                            tipoBloque = sgteBloqueTipo;
                            bloque = sgteBloque;
                            //valorPorDefecto
                            //fechaInicioRecurrencia;
                            continue;


                        }



                    } else {

                        // No uso fechaRealFinBloque por que en si estamos en el valor por defecto seria infinito...

                        cal = _getCalendar(sgteBloqueFechaRealInicio);
                        //cal.add(Calendar.SECOND, -1);
                        cal.setTime(cal.getTime() - 1000);

                        //console.log("Hemos encontrado un bloque despues con un valor distinto, por lo que el valor actual acaba en " + cal);
                        //resultado = cal.getTime();
                        return cal;
                    }

                } else { // No hay siguiente bloque o el valor por defecto es distinto
                    if (valorPorDefecto == valorBloque) {
                        // No hay siguiente bloque
                        //resultado = new Date(Long.MAX_VALUE);
                        return new Date(_MAX_DATE_VALUE);

                    } else {
                        //resultado = fechaRealFinBloque;
                        return fechaRealFinBloque;
                    }

                }

            }

        }

    };

    var _getNextBloque1 = function _getNextBloque1(fecha) {
        var b = null;
        var fechaRealBloque = null;
        var fechaRealItem;
        for (var i = 0; i < Dnv.Calendarios.Bloque.ordenTipos.length; i++) {
            var tipo = Dnv.Calendarios.Bloque.ordenTipos[i];
            var item = _getNextBloque(fecha, tipo);
            if (item != null) {
                fechaRealItem = _getFechaReal(tipo, item.getFechaInicio(), fecha, false, false);
                if (b == null || fechaRealBloque.getTime() > fechaRealItem.getTime()) {
                    b = item;
                    fechaRealBloque = fechaRealItem;
                }
            }

        }
        return b;
    };


    var _getNextBloque2 = function _getNextBloque2(fecha, tipo) {
        switch (tipo) {
            case Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO:
            case Dnv.Calendarios.Bloque.tipos.TIPO_DIA_ESPECIFICO:
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO:
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO:

                var bloques = _getBloques(tipo);
                for (var i = 0; i < bloques.length; i++) {
                    var item = bloques[i];
                    if (fecha.getTime() <= item.getFechaInicio().getTime()) {
                        return item;
                    }
                }
                return null;

            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_RECURRENTE:
            case Dnv.Calendarios.Bloque.tipos.TIPO_DIA_DE_LA_SEMANA:
            case Dnv.Calendarios.Bloque.tipos.TIPO_TODOS_LOS_DIAS:
                var fechaRealItem = null;
                var fechaRealBloque = null;
                var b = null;

                var bloques = _getBloques(tipo);
                for (var i = 0; i < bloques.length; i++) {
                    var item = bloques[i];
                    fechaRealItem = _getFechaReal(tipo, item.getFechaInicio(), fecha, false, false);
                    if (b == null) {
                        fechaRealBloque = fechaRealItem;
                        b = item;
                    } else if (fechaRealBloque.getTime() > fechaRealItem.getTime()) {
                        /*
                        * Hemos recibido los bloques ordenados por fecha simbolica de inicio
                        * Si hemos entrado aqui es porque este tiene una fecha real anterior
                        * al primero de la lista y por tanto es el siguiente (en lugar del primero)
                        * 
                        */
                        //return item;
                        fechaRealBloque = fechaRealItem;
                        b = item;
                        break;
                    }
                }
                if (b != null && tipo == Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_RECURRENTE &&
					_calFestivos.getBloqueManager().getBloqueParaFecha(fechaRealBloque) != null) {
                    /*
                    * Hemos encontrado un bloque festivo recurrente pero para ese dia,
                    * al tener el calendario de festivos un bloque, ese bloque no
                    * es aplicable asi que buscamos para el dia siguiente
                    * 
                    * TODO: Hacer el cálculo de forma iterativa para evitar una recursión
                    * excesiva y posibles StackOverflowError
                    *  
                    */
                    var auxCal = _getCalendar(fechaRealBloque);
                    //auxCal.add(Calendar.DAY_OF_YEAR, 1);
                    auxCal.setHours(23);
                    auxCal.setMinutes(59);
                    auxCal.setSeconds(59);
                    auxCal.setMilliseconds(999);
                    return _getNextBloque(auxCal, tipo);
                } else {
                    return b; // El siguiente bloque o null (si no habia bloques)
                }
        }
        return null;
    }

    var _getNextBloque = function _getNextBloque(fecha, tipo) {
        // Maneamos la sobrecarga de funciones
        if (tipo !== undefined) return _getNextBloque2(fecha, tipo);
        else return _getNextBloque1(fecha, tipo);
    }


    var _getNextBloqueConValorDistinto = function _getNextBloqueConValorDistinto(fecha, tipo, valor) {

        switch (tipo) {
            case Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO:
            case Dnv.Calendarios.Bloque.tipos.TIPO_DIA_ESPECIFICO:
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO:
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO:


                var bloques = _getBloques(tipo);
                for (var i = 0; i < bloques.length; i++) {
                    var item = bloques[i];
                    if ((fecha.getTime() <= item.getFechaInicio().getTime()) && (item.getValor() != valor)) {
                        return item;
                    }
                }
                return null;
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_RECURRENTE:
            case Dnv.Calendarios.Bloque.tipos.TIPO_DIA_DE_LA_SEMANA:
            case Dnv.Calendarios.Bloque.tipos.TIPO_TODOS_LOS_DIAS:
                var fechaRealItem = null;
                var fechaRealBloque = null;
                var b = null;

                var bloques = _getBloques(tipo);
                for (var i = 0; i < bloques.length; i++) {
                    var item = bloques[i];
                    fechaRealItem = _getFechaReal(tipo, item.getFechaInicio(), fecha, false, false);
                    if ((b == null) && (item.getValor() != valor)) {
                        fechaRealBloque = fechaRealItem;
                        b = item;
                    } else if ((fechaRealBloque.getTime() > fechaRealItem.getTime()) && (item.getValor() != valor)) {
                        /*
                        * Hemos recibido los bloques ordenados por fecha simbolica de inicio
                        * Si hemos entrado aqui es porque este tiene una fecha real anterior
                        * al primero de la lista y por tanto es el siguiente (en lugar del primero)
                        * 
                        */
                        //return item;
                        fechaRealBloque = fechaRealItem;
                        b = item;
                        break;
                    }
                }

                if (b != null && tipo == Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_RECURRENTE &&
					mCalFestivos.getBloqueManager().getBloqueParaFecha(fechaRealBloque) != null) {
                    /*
                    * Hemos encontrado un bloque festivo recurrente pero para ese dia,
                    * al tener el calendario de festivos un bloque, ese bloque no
                    * es aplicable asi que buscamos para el dia siguiente
                    */
                    /* 
                    * Todo: hay posibles casos de casos de StackOverflowError (demasiada recursión)
                    *  
                    */
                    var auxCal = _getCalendar(fechaRealBloque);
                    //auxCal.add(Calendar.DAY_OF_YEAR, 1);
                    auxCal.setHours(23);
                    auxCal.setMinutes(59);
                    auxCal.setSeconds(59);
                    auxCal.setMilliseconds(999);
                    return _getNextBloqueConValorDistinto(auxCal, tipo, valor);
                } else {
                    return b; // El siguiente bloque o null (si no habia bloques)
                }
        }
        return null;
    };


    var _getBloques = function _getBloques(tipo) {
        // Como JS no soporta sobrecarga de funciones, lo emulamos
        if (tipo === undefined) return _getAllBloques();
        else return _getBloquesConTipo(tipo);
    }

    /**
    * Devolver los bloques almacenados.
    * <p><b>Los bloques correspondientes a dias festivos se han modificado</b>, de forma
    * que no son los mismos que se añadieron.</p>
    * @return
    */
    var _getAllBloques = function _getAllBloques() {
        /*
        * No tiene sentido usar TreeMap por que el comparador
        * no manejara bien las fechas de semanas to dias genericos
        */
        var bloques = new Array();
        return bloques.concat(_bloquesDispositivo, _bloquesDiaEspecifico,
            _bloquesFestivoDispEspecifico, _bloquesFestivoDiaEspecifico, _bloquesFestivoRecurrente,
            _bloquesDiaSemana, _bloquesDiaGenerico, _bloquesPorDefecto);
    }

    /**
    * Devolver los bloques almacenados del tipo especificado.
    * <p><b>Los bloques correspondientes a dias festivos no estan en {@link #TIPO_DIA_DE_LA_SEMANA}
    * sino que estan, modificados, en {@link #TIPO_X_FESTIVO_DIA_ESPECIFICO} y
    * {@link #TIPO_X_FESTIVO_RECURRENTE}.</b></p>
    * @param tipo
    * @return
    */
    var _getBloquesConTipo = function _getBloquesConTipo(tipo) {
        switch (tipo) {
            case Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO: return _bloquesDispositivo;
            case Dnv.Calendarios.Bloque.tipos.TIPO_DIA_ESPECIFICO: return _bloquesDiaEspecifico;
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO: return _bloquesFestivoDispEspecifico;
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO: return _bloquesFestivoDiaEspecifico;
            case Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_RECURRENTE: return _bloquesFestivoRecurrente;
            case Dnv.Calendarios.Bloque.tipos.TIPO_DIA_DE_LA_SEMANA: return _bloquesDiaSemana;
            case Dnv.Calendarios.Bloque.tipos.TIPO_TODOS_LOS_DIAS: return _bloquesDiaGenerico;
            case Dnv.Calendarios.Bloque.tipos.TIPO_POR_DEFECTO: return _bloquesPorDefecto;
            default:
                console.error("BLOQUES: No existe ese tipo de bloque.");
                //throw new RuntimeException("No existe ese tipo de bloque.");
                return new Array();
        }

    }

    return {
        addBloque: _addBloque,
        getBloqueParaFecha: _getBloqueParaFecha,
        getBloqueActual: _getBloqueActual,
        getFechaFinValorActual: _getFechaFinValorActual,
        getFechaFinValorParaFecha: _getFechaFinValorParaFecha,
        getBloques: _getBloques
    };
};

Dnv.Calendarios.Cal = function (codigo, tipo, objIdDispositivo, defaultValue, estado, bloqueManager) {
    /*
    this._codigo = codigo;
    this._filename = filename;
    this._hashcode = hashcode;
    this._vinculo = vinculo;
    */


    return {
        getCodigo: function () { return codigo; },
        getTipo: function () { return tipo; },
        getObjIdDispositivo: function () { return objIdDispositivo; },
        getDefaultValue: function () { return defaultValue; },
        getEstado: function () { return estado; },
        getBloqueManager: function () { return bloqueManager; },
        getValueFecha: function getValueFecha(fecha) {
            if (estado == Dnv.Calendarios.Cal.estados.ESTADO_AUTOMATICO) {
                var b;
                if (fecha != null) {
                    b = bloqueManager.getBloqueParaFecha(fecha);
                } else {
                    b = bloqueManagers.getBloqueActual();
                }
                if (b != null) {
                    //Log.d(TAG, String.format("Cal [tipo %d]: Encontrado bloque %d", mTipo, b.getCodigo()));
                    return b.getValor();
                } else {
                    //Log.d(TAG, String.format("Cal [tipo %d]: No se ha encontrado bloque, cargar valor por defecto", mTipo));
                    return defaultValue;
                }
            }
            return defaultValue;
        },
        getCurrentValue: function () {
            if (Dnv.Pl.valoresForzados.hasValorForzado(tipo)) {
                return Dnv.Pl.valoresForzados.getValorForzado(tipo);
            }

            if (this.getTipo() == Dnv.Calendarios.Cal.tipos.ENCENDIDO) {
                if (valorForzadoMonitor != -1) return valorForzadoMonitor;
            }

            return this.getValueFecha(new Date());
        },
        isDisponible: function () {
            var remote = this.getRemoteUrl();
            if (Dnv.Cloud.isFileSystemAvailable()) {
                if (Dnv.Cloud.downloader.isRecursoDisponible(remote, hashcode)) {
                    return true;
                } else {
                    console.warn("PRESENTADOR: Recurso " + filename + " no disponible: " + remote + " " + hashcode);
                    //console.warn("PRESENTADOR: debug "+window.localStorage['recursosDisponibles'].length+" "+Object.keys(Dnv.Cloud.downloader._debugGetRecursosDisponibles()).length+" "+Dnv.Cloud.downloader._debugGetRecursosDisponibles()[remote]);
                    return false;
                }
            }
            return true;
        }
    };
};

// Tabla calendarios_tipos
Dnv.Calendarios.Cal.tipos = {
    ENCENDIDO: 1,
    VOLUMEN: 2,
    CONTRASTE: 3,
    BRILLO: 4,
    ATENUACION: 5,
    VIGENCIA: 100,
    HORARIO_DE_EMISION: 101,
    FESTIVOS: 200,
    HORARIO_COMERCIAL: 201,
    CANAL: 300,
    CANAL_INTERACTIVO: 301,
    CANAL_AUDIO: 302,
    DESCARGA: 400,
    SUBIDA: 401,
    COSTES: 500,
    EVENTOS: 550,
    DAYPARTS: 600,
    ESTADOS: 700,
    AVISOS: 800,
    TIEMPO_ENTRE_ANUNCIOS: 900,
    PORCENTAJE_DE_PUBLICIDAD: 1000,
    ANCHO_DE_BANDA: 1001,
    CARGA_DE_CONTENIDOS: 1100,
    MENSAJE_POR_DEFECTO: 1200,
    PROGRAMACION_TDT: 1300,
    PROGRAMACION_STREAMING: 1600

};
Dnv.Calendarios.Cal.festivos = { // Corresponde a Dnv.Pl.Cal.festivos
    FESTIVOS_LABORABLE: 0,
    FESTIVOS_FESTIVO_COMERCIAL: 1,
    FESTIVOS_FESTIVO_NO_COMERCIAL: 2
};

// Tabla calendarios_estados
Dnv.Calendarios.Cal.estados = {
    ESTADO_AUTOMATICO: 0,
    ESTADO_MANUAL: 1
};

