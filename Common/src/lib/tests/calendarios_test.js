
"use strict";

/*
 * Adaptación de la clase de Unit Test usada para Android
 * Es un copypaste con replaces y funciones de ayuda añadidas

 Lista de replaces hechos a la clase Java (por si vuelven a hacer falta)
        se come parametros
        (private|public) [A-Za-z]+ ([a-zA-Z0-9]+)\(([A-Za-z\[\]]+ [a-zA-Z0-9]+(, )*)*\)( throws [a-zA-Z]+)? {
        testContainer.\2 = function \2\(\3\) {

        ^(\t+)(final )?(long|int|Bloque|Date|Cal|BloqueManager|String) 
        \1var 

        new Date\(
        getDate\(

        ^\t\}$
        \t\};

        new Bloque\[\] \{ \}
        \[\]

        Long\.MAX_VALUE
        MAX_DATE_VALUE

 */

var AssertionFailedException = function AssertionFailedException(message) {
    var e = Error.call(this);
    this.name = 'AssertionFailedException';
    this.message = message || '';
    this.stacktrace = e.stack;
    this.stack = e.stack;
};
AssertionFailedException.prototype = Object.create(Error.prototype, {
    constructor: {
      value: AssertionFailedException,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
AssertionFailedException.prototype.constructor = AssertionFailedException;


function assertNull(variable) {
    if(variable !== null) {
        console.error("Aserción incorrecta. Se esperaba null pero se obtuvo "+variable);
        throw new AssertionFailedException("Aserción incorrecta. Se esperaba null pero se obtuvo "+variable);
    }
}
function assertEquals(expected, actual) {
    if(actual instanceof Date && expected instanceof Date) {
        if(expected.getTime() == actual.getTime()) {
            return;
        }
    }
    if(expected !== actual) {
        console.error("Aserción incorrecta. Se esperaba "+expected+" pero se obtuvo "+actual+".");
        throw new AssertionFailedException("Aserción incorrecta. Se esperaba "+expected+" pero se obtuvo "+actual+".");
    }
}

function getFunctionName(fun) { // Existe fun.name pero no es estandar
  var ret = fun.toString();
  ret = ret.substr('function '.length);
  ret = ret.substr(0, ret.indexOf('('));
  return ret;
}

function runTest(fun) {

    try {
        fun();
        console.info("OK "+getFunctionName(fun));
        return true;
    } catch (e) {
        console.error("ERROR "+getFunctionName(fun)+": "+e +" "+(e.stack?e.stack:""));
        return false;
    }
}

var MAX_DATE_VALUE = 8640000000000000;

// Defino constantes que las pruebas esperan que existan
// TODO: estoy modificando las clases a probar... no me gusta la idea
var BloqueManager = Dnv.Calendarios.BloqueManager;
var Bloque = Dnv.Calendarios.Bloque;
BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO = Dnv.Calendarios.Bloque.tipos.TIPO_DISPOSITIVO_ESPECIFICO;
BloqueManager.TIPO_DIA_ESPECIFICO = Dnv.Calendarios.Bloque.tipos.TIPO_DIA_ESPECIFICO;
BloqueManager.TIPO_X_FESTIVO_DISP_ESPECIFICO = Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DISP_ESPECIFICO;
BloqueManager.TIPO_X_FESTIVO_DIA_ESPECIFICO = Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_DIA_ESPECIFICO;
BloqueManager.TIPO_X_FESTIVO_RECURRENTE = Dnv.Calendarios.Bloque.tipos.TIPO_X_FESTIVO_RECURRENTE;
BloqueManager.TIPO_DIA_DE_LA_SEMANA = Dnv.Calendarios.Bloque.tipos.TIPO_DIA_DE_LA_SEMANA;
BloqueManager.TIPO_TODOS_LOS_DIAS = Dnv.Calendarios.Bloque.tipos.TIPO_TODOS_LOS_DIAS;
BloqueManager.TIPO_POR_DEFECTO = Dnv.Calendarios.Bloque.tipos.TIPO_POR_DEFECTO;
var Cal = Dnv.Calendarios.Cal;
Cal.TIPO_FESTIVOS = 200;

Cal.ESTADO_AUTOMATICO = 0;
Cal.ESTADO_MANUAL = 1;

Cal.FESTIVOS_LABORABLE = 0;
Cal.FESTIVOS_FESTIVO_COMERCIAL = 1;
Cal.FESTIVOS_FESTIVO_NO_COMERCIAL = 2;

function getDate(yearOrMsecs, month, day, hour, min, sec, msec) {
    // Construimos un Date recibiendo los parametros en el formato del constructor de Java
    
    if(yearOrMsecs !== undefined && month === undefined) {
        return new Date(yearOrMsecs);
    }

    var d = new Date(0);
    if(yearOrMsecs !== undefined) d.setFullYear(yearOrMsecs + 1900);
    if(month !== undefined) d.setMonth(month);
    if(day !== undefined) d.setDate(day);
    if(hour !== undefined) d.setHours(hour);
    if(min !== undefined) d.setMinutes(min);
    if(sec !== undefined) d.setSeconds(sec);
    if(msec !== undefined) d.setMilliseconds(msec);
    return d;
}


/*
 * Defino un objeto testContainer, que tendra las pruebas unitarias en propiedades que empiezan por "test"
 * Despues de definirlas, las recorreré ejecutandolas con runTest()
 */


var testContainer = {};

	/**
	 * Helper para obtener un calendario de festivos con los valores pedidos.
	 * @param defaultValue El valor por defecto, su valor sera uno de los siguientes:
	 * {@link Cal#FESTIVOS_LABORABLE}, {@link Cal#FESTIVOS_FESTIVO_NO_COMERCIAL}
	 * o {@link Cal#FESTIVOS_FESTIVO_COMERCIAL}
	 * @param bloquesDiaEsp Un array de {@link Bloque}s de {@link BloqueManager#TIPO_DIA_ESPECIFICO} 
	 * @return
	 */
	var getCalFestivos2 = function getCalFestivos2(defaultValue, bloquesDiaEsp) {
		return getCalFestivos3(defaultValue, [], bloquesDiaEsp);
	};

	/**
	 * Helper para obtener un calendario de festivos con los valores pedidos.
	 * @param defaultValue El valor por defecto, su valor sera uno de los siguientes:
	 * {@link Cal#FESTIVOS_LABORABLE}, {@link Cal#FESTIVOS_FESTIVO_NO_COMERCIAL}
	 * o {@link Cal#FESTIVOS_FESTIVO_COMERCIAL}
	 * @param bloques Un array de {@link Bloque}s de {@link BloqueManager#TIPO_DIA_ESPECIFICO} 
	 * @return
	 */
	var getCalFestivos3 = function getCalFestivos3(defaultValue, bloquesDispEsp, bloquesDiaEsp) {
		var bm = new BloqueManager(null);
        for(var i = 0; i < bloquesDispEsp.length; i++) {
            var bloque = bloquesDispEsp[i];
			try {
				bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, bloque);
			} catch (e) {
				throw e;
			}
		}
        for(var i = 0; i < bloquesDiaEsp.length; i++) {
            var bloque = bloquesDiaEsp[i];
			try {
				bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, bloque);
			} catch (e) {
				throw e;
			}
		}
		try {
			//return new Cal(null, 0, Cal.TIPO_FESTIVOS, 0, defaultValue, Cal.ESTADO_AUTOMATICO, bm, null);
			return new Cal(0, Cal.TIPO_FESTIVOS, 0, defaultValue, Cal.ESTADO_AUTOMATICO, bm);
		} catch (e) {
			throw e;
		}
	};

    
	var getCalFestivos = function getCalFestivos(arg1, arg2, arg3) {
        // JS no soporta sobrecarga
        if(arg3 === undefined) return getCalFestivos2(arg1, arg2);
        else return getCalFestivos3(arg1, arg2, arg3);
    }
	
	/**
	 * Devolvemos la fecha asegurandonos de que acaba en 999ms
	 * @param fecha
	 * @return
	 */
	var getFechaFinal = function getFechaFinal(fecha) {
		var ms = fecha.getTime();
		return getDate(ms + (999 - ms%1000));
	};
	
	
	/*
	 * ------------------------------------------
	 * DispEsp 
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto          0
	 * 
	 */
	testContainer.testBMManual = function testBMManual() {
		var bm = new BloqueManager(null);
		
		assertNull(bm.getBloqueActual());
		var fecha = getDate(112, 1, 9, 14, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
	};


	/*
	 * ------------------------------------------
	 * DispEsp    | 1 |
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 1 )
	 * 
	 */
	testContainer.testBMDispEsp = function testBMDispEsp() {
		var bm = new BloqueManager(null);
		var inicio, fin;
		inicio = getDate(112, 1, 9, 12, 0, 0); // Febrero
		fin = getDate(112, 1, 9, 12, 59, 59);
		var b = new Bloque(0, inicio, fin, 1, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO,	b);

		var fecha;

		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 11, 59, 59);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 12, 0, 0);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(inicio, bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(fin, bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(inicio, bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(fin, bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 12, 59, 59);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(inicio, bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(fin, bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 13, 0, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
		
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
		
	};

	
    /*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp    | 1 |
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 1 )
	 * 
	 */
	testContainer.testBMDiaEsp = function testBMDiaEsp() {
		var bm = new BloqueManager(null);
		var b;
		var inicio, fin;
		inicio = getDate(112, 1, 9, 12, 0, 0); // Febrero
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;

		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 11, 59, 59);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 12, 0, 0);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(inicio, bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(fin, bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(inicio, bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(fin, bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 12, 59, 59);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(inicio, bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(fin, bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 13, 0, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
		
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
		
	};
	
    /*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaSem     | 1 |
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 1 )
	 * 
	 */
	testContainer.testBMDiaSem = function testBMDiaSem() {
		var bm = new BloqueManager(null);
		var b;
		var inicio, fin;
		inicio = getDate(0, 0, 4, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 4, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;

		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 2, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 11, 59, 59);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 2, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 12, 0, 0);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 12, 59, 59);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 13, 0, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 16, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 16, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		
	};
    /*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen     | 1 |
	 * ------------------------------------------
	 * Defecto             0 ( 1 )
	 * 
	 */
	testContainer.testBMDiaGen = function testBMDiaGen() {
		var bm = new BloqueManager(null);
		var b;
		var inicio, fin;
		inicio = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;

		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 11, 59, 59);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 12, 0, 0);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 12, 59, 59);
		assertEquals(b, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 13, 0, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		
	};

	/*
	 * ------------------------------------------
	 * DispEsp   | 1 |       | 1 |
	 * ------------------------------------------
	 * DiaEsp 
	 * ------------------------------------------
	 * DiaSem          | 1 |
	 * ------------------------------------------
	 * DiaGen             
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMEscalonadoDiscontinuo1 = function testBMEscalonadoDiscontinuo1() {
		var bm = new BloqueManager(null);
		var b1, b2, b3;
		var inicio1, fin1;
		var inicio2, fin2;
		var inicio3, fin3;
		inicio1 = getDate(112, 1, 9, 12, 0, 0);
		fin1 = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio1, fin1, 1, 0, 0));
		
		inicio2 = getDate(112, 1, 9, 16, 0, 0);
		fin2 = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio2, fin2, 1, 0, 0));
		
		inicio3 = getDate(0, 0, 4, 14, 0, 0); // enero de 1900
		fin3 = getDate(0, 0, 4, 14, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b3 = new Bloque(0, inicio3, fin3, 1, 0, 0));
		

		var fecha;

		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 2, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DispE		
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(inicio1, bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(fin1, bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 0 entre DispE y DiaSem
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 13, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DiaSem
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 14, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 14, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 0 entre DiaSem y DispE 
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 de DispE
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(inicio2, bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(fin2, bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 16, 13, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
	};

	/*
	 * ------------------------------------------
	 * DispEsp   
	 * ------------------------------------------
	 * DiaEsp 
	 * ------------------------------------------
	 * DiaSem          | 1 |
	 * ------------------------------------------
	 * DiaGen    | 1 |       | 1 |         
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMEscalonadoDiscontinuo2 = function testBMEscalonadoDiscontinuo2() {
		var bm = new BloqueManager(null);
		var b1, b2, b3;
		var inicio1, fin1;
		var inicio2, fin2;
		var inicio3, fin3;
		
		inicio1 = getDate(0, 0, 4, 14, 0, 0); // enero de 1900
		fin1 = getDate(0, 0, 4, 14, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b1 = new Bloque(0, inicio1, fin1, 1, 0, 0));
		
		inicio2 = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin2 = getDate(100, 0, 1, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio2, fin2, 1, 0, 0));
		
		inicio3 = getDate(100, 0, 1, 16, 0, 0); // 1 de enero de 2000
		fin3 = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b3 = new Bloque(0, inicio3, fin3, 1, 0, 0));
		


		var fecha;

		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DiaGen
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 0 entre DiaGen y DiaSem
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 13, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DiaSem
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 14, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 14, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 0 entre DiaSem y DiaGen 
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 de DiaGen
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
	};

	/*
	 * ------------------------------------------
	 * DispEsp   | 1 |       | 1 |
	 * ------------------------------------------
	 * DiaEsp       | 1 | | 1 |
	 * ------------------------------------------
	 * DiaSem          | 1 |
	 * ------------------------------------------
	 * DiaGen             
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */
	testContainer.testBMEscalonado1 = function testBMEscalonado1() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 14, 15, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 14, 45, 0);
		fin = getDate(112, 1, 9, 16, 15, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(0, 0, 4, 14, 0, 0); // enero de 1900
		fin = getDate(0, 0, 4, 14, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b5 = new Bloque(0, inicio, fin, 1, 0, 0));
		

		var fecha;

		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 2, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DispEsp
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispGen
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 16, 13, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
		
		// 2 semanas antes
		
		// 0 inicial
		fecha = getDate(112, 0, 26, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 19, 15, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 13, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 sem 
		fecha = getDate(112, 0, 26, 14, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 14, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 14, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 0, 26, 15, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 15, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 2, 13, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
		
	};

	/*
	 * ------------------------------------------
	 * DispEsp   | 1 |             | 1 |
	 * ------------------------------------------
	 * DiaEsp       | 1 |       | 1 |
	 * ------------------------------------------
	 * DiaSem          | 1 | | 1 |
	 * ------------------------------------------
	 * DiaGen             | 1 |        
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMEscalonado2 = function testBMEscalonado2() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5, b6, b7;
		var inicio, fin;
		

		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 17, 45, 0);
		fin = getDate(112, 1, 9, 18, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 13, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 16, 45, 0);
		fin = getDate(112, 1, 9, 17, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(0, 0, 4, 13, 45, 0);
		fin = getDate(0, 0, 4, 14, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b5 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(0, 0, 4, 15, 45, 0);
		fin = getDate(0, 0, 4, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b6 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 14, 45, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b7 = new Bloque(0, inicio, fin, 1, 0, 0));
		

		var fecha;

		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem1
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem2
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b6, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp2
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 18, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
				
		// 0 final
		fecha = getDate(112, 1, 9, 19, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 19, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 14, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		

		
		
		// 2 dias antes
		
		// 0 inicial
		fecha = getDate(112, 1, 7, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 6, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 14, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 14, 45, 0);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 14, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 15, 30, 0);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 14, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 15, 59, 59);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 14, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 inicial
		fecha = getDate(112, 1, 7, 16, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 8, 14, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
		
		// 2 semanas antes
		
		// 0 inicial
		fecha = getDate(112, 0, 26, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 19, 15, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 13, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 sem1 
		fecha = getDate(112, 0, 26, 14, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 13, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 0, 26, 15, 30, 0);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 14, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 sem1 
		fecha = getDate(112, 0, 26, 16, 30, 0);
		assertEquals(b6, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 14, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 0, 26, 18, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 27, 14, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
	};
	
	/*
	 * ------------------------------------------
	 * DispEsp   
	 * ------------------------------------------
	 * DiaEsp         | 1 |
	 * ------------------------------------------
	 * DiaSem      | 1 | | 1 |
	 * ------------------------------------------
	 * DiaGen   | 1 |       | 1 |            
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMEscalonado3 = function testBMEscalonado3() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 13, 45, 0);
		fin = getDate(112, 1, 9, 14, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(0, 0, 4, 12, 45, 0);
		fin = getDate(0, 0, 4, 13, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(0, 0, 4, 14, 45, 0);
		fin = getDate(0, 0, 4, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 15, 45, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b5 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem2
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispGen2
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
	
	};
	

	/*
	 * ------------------------------------------
	 * DispEsp   | 1 |                   | 1 |
	 * ------------------------------------------
	 * DiaEsp        | 1 |           | 1 |
	 * ------------------------------------------
	 * DiaSem            | 1 |   | 1 |
	 * ------------------------------------------
	 * DiaGen                | 1 |        
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMEscalonadoContinuo1 = function testBMEscalonadoContinuo1() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5, b6, b7;
		var inicio, fin;
		

		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 18, 0, 0);
		fin = getDate(112, 1, 9, 18, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 13, 0, 0);
		fin = getDate(112, 1, 9, 13, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 17, 0, 0);
		fin = getDate(112, 1, 9, 17, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(0, 0, 4, 14, 0, 0);
		fin = getDate(0, 0, 4, 14, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b5 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(0, 0, 4, 16, 0, 0);
		fin = getDate(0, 0, 4, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b6 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 15, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b7 = new Bloque(0, inicio, fin, 1, 0, 0));
		

		var fecha;

		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem1
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem2
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b6, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp2
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 18, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 18, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
				
		// 0 final
		fecha = getDate(112, 1, 9, 19, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 19, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 14, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		

		
		
		// 2 dias antes
		
		// 0 inicial
		fecha = getDate(112, 1, 7, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 6, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 14, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 15, 0, 0);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 15, 30, 0);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 14, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 15, 59, 59);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 inicial
		fecha = getDate(112, 1, 7, 16, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 8, 14, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
		
		// 2 semanas antes
		
		// 0 inicial
		fecha = getDate(112, 0, 26, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 19, 15, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 13, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 sem1 
		fecha = getDate(112, 0, 26, 14, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 0, 26, 15, 30, 0);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 14, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 sem1 
		fecha = getDate(112, 0, 26, 16, 30, 0);
		assertEquals(b6, bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 14, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 0, 26, 18, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 27, 14, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
	};
	

	/*
	 * ------------------------------------------
	 * DispEsp     | 1 | | 1 |
	 * ------------------------------------------
	 * DiaEsp         | 1 |
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen   | 1 |       | 1 |            
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMNube1 = function testBMNube1() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 14, 44, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 15, 15, 0);
		fin = getDate(112, 1, 9, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 14, 30, 0);
		fin = getDate(112, 1, 9, 15, 30, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 15, 45, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b5 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 15, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen2
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	};
		
		
		
	/*
	 * ------------------------------------------
	 * DispEsp     | 1 | | 1 |
	 * ------------------------------------------
	 * DiaEsp         | 1 |
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen   |        1       |            
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMNube2 = function testBMNube2() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 14, 44, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 15, 15, 0);
		fin = getDate(112, 1, 9, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 14, 30, 0);
		fin = getDate(112, 1, 9, 15, 30, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 15, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	};
		
		
		
	/*
	 * ------------------------------------------
	 * DispEsp     | 1 | | 1 |
	 * ------------------------------------------
	 * DiaEsp         |    1    |
	 * ------------------------------------------
	 * DiaSem   
	 * ------------------------------------------
	 * DiaGen   |        1        |            
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMNube3 = function testBMNube3() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 14, 44, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 15, 15, 0);
		fin = getDate(112, 1, 9, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 14, 30, 0);
		fin = getDate(112, 1, 9, 16, 14, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 15, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 16, 10, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	};

	
	/*
	 * ------------------------------------------
	 * DispEsp     | 1 | | 0 |
	 * ------------------------------------------
	 * DiaEsp         |    1    |
	 * ------------------------------------------
	 * DiaSem   
	 * ------------------------------------------
	 * DiaGen   |        1        |            
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMNube4 = function testBMNube4() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 14, 44, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 15, 15, 0);
		fin = getDate(112, 1, 9, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(112, 1, 9, 14, 30, 0);
		fin = getDate(112, 1, 9, 16, 14, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 14, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 14, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 15, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 14, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 16, 10, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	};

	
	/*
	 * ------------------------------------------
	 * DispEsp     | 1 | | 1 |
	 * ------------------------------------------
	 * DiaEsp         | 1 |
	 * ------------------------------------------
	 * DiaSem           | 0 |
	 * ------------------------------------------
	 * DiaGen   |        1       |            
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */
	

	testContainer.testBMNube5 = function testBMNube5() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 14, 44, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 15, 15, 0);
		fin = getDate(112, 1, 9, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 14, 30, 0);
		fin = getDate(112, 1, 9, 15, 34, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(0, 0, 4, 15, 0, 0); // enero de 1900
		fin = getDate(0, 0, 4, 15, 44, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b4 = new Bloque(0, inicio, fin, 0, 0, 0));

		inicio = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b5 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 15, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		

		
		// 2 dias antes
		
		// 0 inicial
		fecha = getDate(112, 1, 7, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 6, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 12, 45, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 15, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 16, 45, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 7, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 8, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
		
		// 2 semanas antes
		
		// 0 inicial
		fecha = getDate(112, 0, 26, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 25, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 sem1 
		fecha = getDate(112, 0, 26, 12, 45, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 0, 26, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 14, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 sem1 
		fecha = getDate(112, 0, 26, 15, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 0, 26, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 15, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 sem1 
		fecha = getDate(112, 0, 26, 16, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 0, 26, 15, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 0, 26, 18, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 27, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
	};
		
		
	
	
	/*
	 * ------------------------------------------
	 * DispEsp     | 1 | | 1 |
	 * ------------------------------------------
	 * DiaEsp         | 1 |
	 * ------------------------------------------
	 * DiaSem           |   0   |
	 * ------------------------------------------
	 * DiaGen   |        1       |            
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMNube6 = function testBMNube6() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 14, 44, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 15, 15, 0);
		fin = getDate(112, 1, 9, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 14, 30, 0);
		fin = getDate(112, 1, 9, 15, 34, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(0, 0, 4, 15, 0, 0); // enero de 1900
		fin = getDate(0, 0, 4, 16, 44, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b4 = new Bloque(0, inicio, fin, 0, 0, 0));

		inicio = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b5 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 15, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DispSem1
		fecha = getDate(112, 1, 9, 16, 40, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 16, 50, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		

		
		// 2 dias antes
		
		// 0 inicial
		fecha = getDate(112, 1, 7, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 6, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 12, 45, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 15, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 16, 45, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 7, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 8, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
		
		// 2 semanas antes
		
		// 0 inicial
		fecha = getDate(112, 0, 26, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 25, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 sem1 
		fecha = getDate(112, 0, 26, 12, 45, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 0, 26, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 14, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 sem1 
		fecha = getDate(112, 0, 26, 15, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 0, 26, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 sem1 
		fecha = getDate(112, 0, 26, 16, 50, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 0, 26, 16, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 0, 26, 18, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 27, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
	};
		
	

	/*
	 * ------------------------------------------
	 * DispEsp     | 1 | | 1 |
	 * ------------------------------------------
	 * DiaEsp         | 1 |
	 * ------------------------------------------
	 * DiaSem           |    0   |
	 * ------------------------------------------
	 * DiaGen   |        1       |            
	 * ------------------------------------------
	 * Defecto                0 ( 2 )
	 * 
	 */

	testContainer.testBMNube7 = function testBMNube7() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 14, 44, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 15, 15, 0);
		fin = getDate(112, 1, 9, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 14, 30, 0);
		fin = getDate(112, 1, 9, 15, 34, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(0, 0, 4, 15, 0, 0); // enero de 1900
		fin = getDate(0, 0, 4, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b4 = new Bloque(0, inicio, fin, 0, 0, 0));

		inicio = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b5 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 15, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DiaSem1
		fecha = getDate(112, 1, 9, 16, 0, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 2)); // Si el por defecto fuera 2

		// 0 DiaSem1
		fecha = getDate(112, 1, 9, 16, 40, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 2));


		// 0 DiaSem1
		fecha = getDate(112, 1, 9, 16, 59, 59);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 2));

		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 16, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 9, 17, 00, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		

		
		// 2 dias antes
		
		// 0 inicial
		fecha = getDate(112, 1, 7, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 6, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 12, 45, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 15, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 16, 45, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 7, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 8, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
		
		// 2 semanas antes
		
		// 0 inicial
		fecha = getDate(112, 0, 26, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 25, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 sem1 
		fecha = getDate(112, 0, 26, 12, 45, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 0, 26, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 14, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 sem1 
		fecha = getDate(112, 0, 26, 15, 0, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 0, 26, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 27, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 2)); // Si el por defecto fuera 2

		// 0 sem1 
		fecha = getDate(112, 0, 26, 15, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 0, 26, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 27, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 2));

		// 0 sem1 
		fecha = getDate(112, 0, 26, 16, 59, 59);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 0, 26, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 27, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 0, 26, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 2));

		// 0 final
		fecha = getDate(112, 0, 26, 18, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 0, 26, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 0, 26, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(112, 0, 27, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
	};
		
	/*
	 * ------------------------------------------
	 * DispEsp     | 1 | | 1 |
	 * ------------------------------------------
	 * DiaEsp         | 1 |
	 * ------------------------------------------
	 * DiaSem           
	 * ------------------------------------------
	 * DiaGen   |   1   | 0 | 1 |           
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMNube8 = function testBMNube8() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5, b6;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 14, 44, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 15, 15, 0);
		fin = getDate(112, 1, 9, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 14, 30, 0);
		fin = getDate(112, 1, 9, 15, 34, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 14, 34, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 14, 35, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 15, 44, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b5 = new Bloque(0, inicio, fin, 0, 0, 0));

		inicio = getDate(100, 0, 1, 15, 45, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b6 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 15, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen3
		fecha = getDate(112, 1, 9, 16, 0, 0);
		assertEquals(b6, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		

		
		// 2 dias antes
		
		// 0 inicial
		fecha = getDate(112, 1, 7, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 6, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 gen1 
		fecha = getDate(112, 1, 7, 12, 45, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 14, 34, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 gen2 
		fecha = getDate(112, 1, 7, 15, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 14, 35, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 15, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 15, 44, 59), bm.getFechaFinValorParaFecha(fecha, 2)); // Si por defecto fuera 2

		// 1 gen1 
		fecha = getDate(112, 1, 7, 16, 50, 0);
		assertEquals(b6, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 7, 15, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 7, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 7, 17, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 7, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 8, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		
		
	};
		


	/*
	 * Variacion del caso anterior
	 * 
	 * -----------------------------------------------------------
	 * DispEsp             
	 * -----------------------------------------------------------
	 * DiaEsp      
	 * -----------------------------------------------------------
	 * DiaSem                           
	 * -----------------------------------------------------------
	 * DiaGen | 0 |  | 1 |  | 1 | 0 | 1 | 0 |  | 1 | 1 | 0 | 0 |
	 * -----------------------------------------------------------
	 * Defecto                0 ( 2 )
	 * 
	 */

	testContainer.testBMConsecutivo1 = function testBMConsecutivo1() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5, b6, b7, b8, b9, b10;
		var inicio, fin;
		

		inicio = getDate(100, 0, 1, 12, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 12, 44, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b1 = new Bloque(0, inicio, fin, 0, 0, 0));

		inicio = getDate(100, 0, 1, 13, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 13, 44, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 14, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 14, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b3 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 15, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b4 = new Bloque(0, inicio, fin, 0, 0, 0));

		inicio = getDate(100, 0, 1, 16, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b5 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 17, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 17, 44, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b6 = new Bloque(0, inicio, fin, 0, 0, 0));

		inicio = getDate(100, 0, 1, 18, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 18, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b7 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 19, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 19, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b8 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 20, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 20, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b9 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(100, 0, 1, 21, 0, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 21, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b10 = new Bloque(0, inicio, fin, 0, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 20, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 8, 22, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 2));

		// 0 DiaGen1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 8, 20, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 44, 59), bm.getFechaFinValorParaFecha(fecha, 2));

		// 0 Hueco1
		fecha = getDate(112, 1, 9, 12, 55, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 12, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 2));

		// 1 DiaGen2
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(112, 1, 9, 13, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 Hueco2
		fecha = getDate(112, 1, 9, 13, 55, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 13, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen3
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 14, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 14, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DiaGen4
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 15, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen5
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DiaGen6
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertEquals(b6, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 17, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 17, 44, 59), bm.getFechaFinValorParaFecha(fecha, 2));

		// 0 Hueco3
		fecha = getDate(112, 1, 9, 17, 55, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 17, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 9, 17, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(112, 1, 9, 17, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DiaGen7
		fecha = getDate(112, 1, 9, 18, 30, 0);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 17, 45, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 9, 18, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(112, 1, 9, 19, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen8
		fecha = getDate(112, 1, 9, 19, 30, 0);
		assertEquals(b8, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 19, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 19, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen9
		fecha = getDate(112, 1, 9, 20, 30, 0);
		assertEquals(b9, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 20, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 21, 59, 59), bm.getFechaFinValorParaFecha(fecha, 2));

		// 1 DiaGen10
		fecha = getDate(112, 1, 9, 21, 30, 0);
		assertEquals(b10, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 20, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 21, 59, 59), bm.getFechaFinValorParaFecha(fecha, 2));
		
		// 0 final
		fecha = getDate(112, 1, 9, 22, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 20, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 9, 22, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(112, 1, 10, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 2));
				
	};
		


	/*
	 * ------------------------------------------
	 * DispEsp     | 1 |           |   1   |
	 * ------------------------------------------
	 * DiaEsp      |   1   |       | 1 |
	 * ------------------------------------------
	 * DiaSem   
	 * ------------------------------------------
	 * DiaGen               
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */
	testContainer.testBMCoincidentes1 = function testBMCoincidentes1() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 29, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 29, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 0, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 15, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 29, 59);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));


		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 45, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 59, 59);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 0, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 15, 59, 59);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 0, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 15, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 29, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 45, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 59, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 22, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 20, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 9, 22, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
	};
				


	/*
	 * ------------------------------------------
	 * DispEsp      | 1 |   |   1   |
	 * ------------------------------------------
	 * DiaEsp   |   1   |       | 1 |
	 * ------------------------------------------
	 * DiaSem   
	 * ------------------------------------------
	 * DiaGen               
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */
	testContainer.testBMCoincidentes2 = function testBMCoincidentes2() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 30, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 16, 30, 0);
		fin = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 15, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 29, 59);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));


		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 45, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 59, 59);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 0, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 15, 59, 59);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 0, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 15, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 29, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 45, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 59, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 22, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 20, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 9, 22, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
	};
				
	/*
	 * ------------------------------------------
	 * DispEsp     | 1 |           |  1  |
	 * ------------------------------------------
	 * DiaEsp      |   0   |       | 0 |
	 * ------------------------------------------
	 * DiaSem   
	 * ------------------------------------------
	 * DiaGen               
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */
	
	testContainer.testBMCoincidentes3 = function testBMCoincidentes3() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 29, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 29, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 0, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 0, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 15, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 29, 59);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 45, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 59, 59);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 0, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 15, 59, 59);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 0, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 15, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 29, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 45, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 59, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 22, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 20, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 9, 22, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
	};

	/*
	 * ------------------------------------------
	 * DispEsp     | 0 |           |  0  |
	 * ------------------------------------------
	 * DiaEsp      |   1   |       | 1 |
	 * ------------------------------------------
	 * DiaSem   
	 * ------------------------------------------
	 * DiaGen               
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */
	testContainer.testBMCoincidentes4 = function testBMCoincidentes4() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 29, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 0, 0, 0));

		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 29, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DispEsp1
		fecha = getDate(112, 1, 9, 12, 0, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DispEsp1
		fecha = getDate(112, 1, 9, 12, 15, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DispEsp1
		fecha = getDate(112, 1, 9, 12, 29, 59);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 45, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 59, 59);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 0, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 15, 59, 59);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 0, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 15, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 29, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 45, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 59, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 22, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
	};

			
	/*
	 * ------------------------------------------
	 * DispEsp      | 0 |     |  0  |
	 * ------------------------------------------
	 * DiaEsp   |   1   |       | 1 |
	 * ------------------------------------------
	 * DiaSem   
	 * ------------------------------------------
	 * DiaGen               
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */
	testContainer.testBMCoincidentes5 = function testBMCoincidentes5() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 30, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 0, 0, 0));

		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 16, 30, 0);
		fin = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 15, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 29, 59);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));


		// 0 DispEsp1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DispEsp1
		fecha = getDate(112, 1, 9, 12, 45, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DispEsp1
		fecha = getDate(112, 1, 9, 12, 59, 59);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 0, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 12 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 15, 59, 59);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 DispEsp2
		fecha = getDate(112, 1, 9, 16, 0, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DispEsp2
		fecha = getDate(112, 1, 9, 16, 15, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DispEsp2
		fecha = getDate(112, 1, 9, 16, 29, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DispEsp2
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DispEsp2
		fecha = getDate(112, 1, 9, 16, 45, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DispEsp2
		fecha = getDate(112, 1, 9, 16, 59, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 22, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 9, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
	};

	/*
	 * ------------------------------------------
	 * DispEsp      | 1 |     |  1  |
	 * ------------------------------------------
	 * DiaEsp   |   0   |       | 0 |
	 * ------------------------------------------
	 * DiaSem   
	 * ------------------------------------------
	 * DiaGen               
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */
	testContainer.testBMCoincidentes6 = function testBMCoincidentes6() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 30, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(112, 1, 9, 16, 30, 0);
		fin = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 0, 0, 0));

		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 15, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DiaEsp1
		fecha = getDate(112, 1, 9, 12, 29, 59);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));


		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 45, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 59, 59);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 0, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 0 intermedio
		fecha = getDate(112, 1, 9, 15, 59, 59);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 13, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 15, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
	
		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 0, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 15, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 29, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 45, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 59, 59);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 16, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 final
		fecha = getDate(112, 1, 9, 22, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 12, 30, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
//		assertEquals(getDate(112, 1, 9, 17, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 2));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	
	};
		

	/*
	 * ------------------------------------------
	 * DispEsp     | 1 |           |  1  |
	 * ------------------------------------------
	 * DiaEsp      |   0   |       | 0 |
	 * ------------------------------------------
	 * DiaSem     |     1    |   |     1    |   
	 * ------------------------------------------
	 * DiaGen               
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	testContainer.testBMCoincidentes7 = function testBMCoincidentes7() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5, b6;
		var inicio, fin;
		
		inicio = getDate(112, 1, 9, 12, 30, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));
	
		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 12, 30, 0);
		fin = getDate(112, 1, 9, 13, 29, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(112, 1, 9, 16, 0, 0);
		fin = getDate(112, 1, 9, 16, 29, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(0, 0, 4, 12, 0, 0);
		fin = getDate(0, 0, 4, 13, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b5 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(0, 0, 4, 15, 30, 0);
		fin = getDate(0, 0, 4, 17, 29, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b6 = new Bloque(0, inicio, fin, 1, 0, 0));
	
		var fecha;
		
		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem1
		fecha = getDate(112, 1, 9, 12, 0, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem1
		fecha = getDate(112, 1, 9, 12, 29, 59);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 59, 59);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		

		// 0 DiaEsp1
		fecha = getDate(112, 1, 9, 13, 0, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 13, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 0 DiaEsp1
		fecha = getDate(112, 1, 9, 13, 29, 59);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(0, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 13, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 13, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem1
		fecha = getDate(112, 1, 9, 13, 59, 59);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 13, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));


		// 1 DiaSem2
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b6, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 17, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 0, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 17, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 17, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem2
		fecha = getDate(112, 1, 9, 17, 0, 0);
		assertEquals(b6, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 17, 29, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		
		
	};

	
	
	/*
	 * ------------------------------------------
	 * DispEsp           | 1 |     |  1  |
	 * ------------------------------------------
	 * DiaEsp        |   0   |       | 0 |
	 * ------------------------------------------
	 * DiaSem     |     1    |   |     1    | 
	 * ------------------------------------------
	 * DiaGen               
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	/*
	 * ------------------------------------------
	 * DispEsp     | 1 |         |  1  |
	 * ------------------------------------------
	 * DiaEsp      |   1   |       | 1 |
	 * ------------------------------------------
	 * DiaSem     | 1 |             | 1 |
	 * ------------------------------------------
	 * DiaGen               
	 * ------------------------------------------
	 * Defecto                0
	 * 
	 */

	/*
	 * ------------------------------------------
	 * DispEsp     | 0 |                | 0 |
	 * ------------------------------------------
	 * DiaEsp         |      0      |
	 * ------------------------------------------
	 * DiaSem   
	 * ------------------------------------------
	 * DiaGen   |        0        |            
	 * ------------------------------------------
	 * Defecto                1
	 * 
	 */

	/*
	 * ------------------------------------------
	 * DispEsp  
	 * ------------------------------------------
	 * DiaEsp   
	 * ------------------------------------------
	 * DiaSem   |               1               |
	 * ------------------------------------------
	 * DiaGen               
	 * ------------------------------------------
	 * Defecto                  0
	 * 
	 */
	testContainer.testBMContinuo1 = function testBMContinuo1() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(0, 0, 1, 0, 0, 0);
		fin = getDate(0, 0, 7, 23, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 DiaSem1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	};
	/*
	 * ------------------------------------------
	 * DispEsp  
	 * ------------------------------------------
	 * DiaEsp   
	 * ------------------------------------------
	 * DiaSem   
	 * ------------------------------------------
	 * DiaGen   |               1               |            
	 * ------------------------------------------
	 * Defecto                  0
	 * 
	 */
	testContainer.testBMContinuo2 = function testBMContinuo2() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;
		
		inicio = getDate(100, 0, 1, 0, 0, 0);
		fin = getDate(100, 0, 1, 23, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b1 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		// 0 DiaGen1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	};
	
	
	/*
	 * ------------------------------------------
	 * DispEsp  
	 * ------------------------------------------
	 * DiaEsp   
	 * ------------------------------------------
	 * DiaSem   |               1               |
	 * ------------------------------------------
	 * DiaGen   |               0               |
	 * ------------------------------------------
	 * Defecto                  1
	 * 
	 */
	testContainer.testBMContinuo3 = function testBMContinuo3() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;

		inicio = getDate(0, 0, 1, 0, 0, 0);
		fin = getDate(0, 0, 7, 23, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b1 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 0, 0, 0);
		fin = getDate(100, 0, 1, 23, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 0, 0, 0));

		var fecha;
		
		// 0 DiaSem1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
	};

	
	/*
	 * ------------------------------------------
	 * DispEsp  
	 * ------------------------------------------
	 * DiaEsp   
	 * ------------------------------------------
	 * DiaSem   |               1               |
	 * ------------------------------------------
	 * DiaGen       |           0           |
	 * ------------------------------------------
	 * Defecto                  1
	 * 
	 */
	testContainer.testBMContinuo4 = function testBMContinuo4() {
		var bm = new BloqueManager(null);
		var b1, b2, b3, b4, b5;
		var inicio, fin;

		inicio = getDate(0, 0, 1, 0, 0, 0);
		fin = getDate(0, 0, 7, 23, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b1 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 8, 0, 0);
		fin = getDate(100, 0, 1, 20, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 0, 0, 0));

		var fecha;
		
		// 0 DiaSem1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
	};

	/*
	 * 
	 * Hacer pruebas con bloques que duren varios dias, 
	 * ¿ y que den la vuelta... ? No
	 * 
	 * ------------------------------------------
	 * DispEsp  
	 * ------------------------------------------
	 * DiaEsp   
	 * ------------------------------------------
	 * DiaSem   |               1               |
	 * ------------------------------------------
	 * DiaGen  
	 * ------------------------------------------
	 * Defecto                  1
	 *  
	 * 
	 * 
	 * 
	 */

	/*
	 * Probar con un bloque en una fecha lejana
	 * 
	 * Esto forzara mucha recursion (ya no)
	 * 
	 * 
	 * 
	 * ------------------------------------------
	 * DispEsp                          | 0 |
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaSem         
	 * ------------------------------------------
	 * DiaGen               | 1 |
	 * ------------------------------------------
	 * Defecto             1
	 * 
	 */
	testContainer.testBMLejos1 = function testBMLejos1() {
		var bm = new BloqueManager(null);
		var inicio, fin;
		inicio = getDate(112, 2, 9, 12, 0, 0); // 1 mes por delante
		fin = getDate(112, 2, 9, 12, 59, 59);
		var b1, b2;
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO,	b1 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(100, 0, 1, 12, 0, 0); 
		fin = getDate(100, 0, 1, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		

		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
		//assertNull(bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(112, 2, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 1));
		//assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		

		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		//assertNull(bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(112, 2, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
		//assertNull(bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(112, 2, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 1));
		//assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		
		
	};

	testContainer.testBMLejos2 = function testBMLejos2() {
		var bm = new BloqueManager(null);
		var inicio, fin;
		inicio = getDate(122, 2, 9, 12, 0, 0); // una decada por delante
		fin = getDate(122, 2, 9, 12, 59, 59);
		var b1, b2;
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO,	b1 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(100, 0, 1, 12, 0, 0); 
		fin = getDate(100, 0, 1, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		

		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
		//assertNull(bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(122, 2, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 1));
		//assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		

		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		//assertNull(bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(122, 2, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
		//assertNull(bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(122, 2, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 1));
		//assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		
		
	};


	testContainer.testBMLejos3 = function testBMLejos3() {
		var bm = new BloqueManager(null);
		var inicio, fin;
		inicio = getDate(122, 2, 9, 12, 0, 0); // una decada por delante
		fin = getDate(122, 2, 9, 12, 59, 59);
		var b1, b2;
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO,	b1 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(0, 0, 4, 12, 0, 0); 
		fin = getDate(0, 0, 4, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		

		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
		//assertNull(bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(122, 2, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 1));
		//assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		

		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		//assertNull(bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(122, 2, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 1));

		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
		//assertNull(bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(122, 2, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 1));
		//assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 1));
		
		
	};
	
	


	testContainer.testBMLejos4 = function testBMLejos4() {
		var bm = new BloqueManager(null);
		var inicio, fin;
		inicio = getDate(122, 2, 9, 12, 0, 0); // una decada por delante
		fin = getDate(122, 2, 9, 12, 59, 59);
		var b1, b2;
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO,	b1 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(100, 0, 1, 0, 0, 0); 
		fin = getDate(100, 0, 1, 23, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		

		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		//assertNull(bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(122, 2, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 1));
		
		
	};

	/*
	 * Probar con un bloque en una fecha lejana y muchos bloques de hora
	 * 
	 * ------------------------------------------
	 * DispEsp                          | 0 |
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaSem         
	 * ------------------------------------------
	 * DiaGen  | 1 | 1 | 1 | 1 | 1 |
	 * ------------------------------------------
	 * Defecto             1
	 * 
	 */

	testContainer.testBMConsecutivoLejos1 = function testBMConsecutivoLejos1() {
		var bm = new BloqueManager(null);
		var inicio, fin;
		var b1, b2;
		inicio = getDate(122, 2, 9, 12, 0, 0); // una decada por delante
		fin = getDate(122, 2, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO,	b1 = new Bloque(0, inicio, fin, 0, 0, 0));
		
		inicio = getDate(100, 0, 1, 0, 0, 0); 
		fin = getDate(100, 0, 1, 1, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 2, 0, 0); 
		fin = getDate(100, 0, 1, 2, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 3, 0, 0); 
		fin = getDate(100, 0, 1, 3, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 4, 0, 0); 
		fin = getDate(100, 0, 1, 4, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 5, 0, 0); 
		fin = getDate(100, 0, 1, 5, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 6, 0, 0); 
		fin = getDate(100, 0, 1, 6, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 7, 0, 0); 
		fin = getDate(100, 0, 1, 7, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 8, 0, 0); 
		fin = getDate(100, 0, 1, 8, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 9, 0, 0); 
		fin = getDate(100, 0, 1, 9, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 10, 0, 0); 
		fin = getDate(100, 0, 1, 10, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 11, 0, 0); 
		fin = getDate(100, 0, 1, 11, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(100, 0, 1, 12, 0, 0); 
		fin = getDate(100, 0, 1, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b2 = new Bloque(0, inicio, fin, 1, 0, 0));

		var fecha;
		
		

		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		//assertNull(bm.getFechaInicioValorParaFecha(fecha, 1));
		assertEquals(getDate(122, 2, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 1));
		
		
	};
	
	/*
	 * Tests teniendo en cuenta los calendarios de festivos
	 */
	

	/*
	 * ------------------------------------------
	 * DispEsp 
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto          0
	 * __________________________________________
	 * Festivos             L
	 * 
	 */
	testContainer.testBMFestivosLVacio = function testBMFestivosLVacio() {
		var calFestivosVacio = getCalFestivos(Cal.FESTIVOS_LABORABLE, []);
		var bm = new BloqueManager(calFestivosVacio);
		
		assertNull(bm.getBloqueActual());
		var fecha = getDate(112, 1, 9, 14, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	};

	/*
	 * ------------------------------------------
	 * DispEsp 
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto          0
	 * __________________________________________
	 * Festivos             FC
	 * 
	 */
	testContainer.testBMFestivosFCVacio = function testBMFestivosFCVacio() {
		var calFestivosVacio = getCalFestivos(Cal.FESTIVOS_FESTIVO_COMERCIAL, []);
		var bm = new BloqueManager(calFestivosVacio);
		
		assertNull(bm.getBloqueActual());
		var fecha = getDate(112, 1, 9, 14, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	};

	/*
	 * ------------------------------------------
	 * DispEsp 
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto          0
	 * __________________________________________
	 * Festivos             FNC
	 * 
	 */
	testContainer.testBMFestivosFNCVacio = function testBMFestivosFNCVacio() {
		var calFestivosVacio = getCalFestivos(Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, []);
		var bm = new BloqueManager(calFestivosVacio);
		
		assertNull(bm.getBloqueActual());
		var fecha = getDate(112, 1, 9, 14, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(fecha, 0));
	};


	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp    | FC 1 |   | FNC 1 |
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 1 )
	 * __________________________________________
	 * Festivos             L
	 * 
	 */
	testContainer.testBMDiaFestEspLaborable = function testBMDiaFestEspLaborable() {
		
		var calFestivosVacio = getCalFestivos(Cal.FESTIVOS_LABORABLE, []);
		/*Cal calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE, new Bloque[] {
				new Bloque(0, inicio, fin, 1, 0, 0)
		});*/
		
		
		var bm = new BloqueManager(calFestivosVacio);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(0, inicio, fin, 1, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(0, inicio, fin, 1, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));
		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 1));
		
	};

	
	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp    | FC 123 |   | FNC 123 |
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________
	 * Festivos     |           FC            |
	 * 
	 */
	testContainer.testBMDiaFestEspFC = function testBMDiaFestEspFC() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE, [
				new Bloque(0, getDate(112, 1, 1, 0, 0, 0), getDate(112, 1, 1, 23, 59, 59),
						Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 1, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
	};


	
	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp       | FC 123 | | FNC 123 |
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________
	 * FestivosDispEsp |          FC           |
	 * FestivosDiaEsp  |          FNC          |
	 * 
	 */
	testContainer.testBMDiaFestEspApilados = function testBMDiaFestEspApilados() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE,
				[ // Dispositivo Especifico
						new Bloque(0, getDate(112, 1, 1, 0, 0, 0),
									  getDate(112, 1, 1, 23, 59, 59),
									  Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
				],
				[ // Dia Especifico
						new Bloque(0, getDate(112, 1, 1, 0, 0, 0),
									  getDate(112, 1, 1, 23, 59, 59),
									  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 1, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
	};

	
	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp    | FC 123 |   | FNC 123 |
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________
	 * Festivos     |        FNC              |
	 * 
	 */
	testContainer.testBMDiaFestEspFNC = function testBMDiaFestEspFNC() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE, [
				new Bloque(0, getDate(112, 1, 1, 0, 0, 0), getDate(112, 1, 1, 23, 59, 59),
						Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 17, 0, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));

//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), 0));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
	};


	
	/*
	 * Valor por defecto del calendario de festivos: Festivo Comercial
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp          
	 * ------------------------------------------
	 * DiaFestRec         |FC 123|
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________
	 * Festivos                FC
	 * 
	 */
	testContainer.testBMDiaFestRecFC = function testBMDiaFestRecFC() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_FESTIVO_COMERCIAL, []);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 10, 1, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));

		assertEquals(getDate(112, 0, 31, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 59, 59), 0));
		assertEquals(getDate(112, 0, 31, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 0, 0), 0));
		assertEquals(getDate(112, 0, 31, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 1, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), 0));

		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		
		

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), valor));
		
	};


	
	/*
	 * Valor por defecto del calendario de festivos: Festivo No Comercial
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp          
	 * ------------------------------------------
	 * DiaFestRec         |FNC 123|
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________
	 * Festivos                FNC
	 * 
	 */
	testContainer.testBMDiaFestRecFNC = function testBMDiaFestRecFNC() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, []);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 9, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 12, 59, 59);
		var b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 10, 1, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));
		

		assertEquals(getDate(112, 0, 31, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 59, 59), 0));
		assertEquals(getDate(112, 0, 31, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 0, 0), 0));
		assertEquals(getDate(112, 0, 31, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 1, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), 0));

		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), valor));
		
	};

	

	
	/*
	 * Valor por defecto del calendario de festivos: Festivo Comercial
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp          
	 * ------------------------------------------
	 * DiaFestRec |         FC 123              | // Dura todo el dia
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________
	 * Festivos                FC
	 * 
	 */
	testContainer.testBMDiaFestRecFCCompleto = function testBMDiaFestRecFCCompleto() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_FESTIVO_COMERCIAL, []);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 0, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 23, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 0, 30, 29, 59, 59)).getCodigo());
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 0, 31, 0, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 0, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 0, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 23, 59, 59)).getValor());
		
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 1, 0, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 0, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 0, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 23, 59, 59)).getValor());

		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 2, 0, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 0, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 0, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 23, 59, 59)).getValor());
		

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 0, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 23, 59, 59), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 0, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 23, 59, 59), 0));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 23, 59, 59), 0));
		
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 23, 59, 59), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 23, 59, 59), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 23, 59, 59), valor));
		
	};

	/*
	 * Valor por defecto del calendario de festivos: Festivo No Comercial
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp          
	 * ------------------------------------------
	 * DiaFestRec |         FNC 123              | // Dura todo el dia
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________
	 * Festivos                FNC
	 * 
	 */
	testContainer.testBMDiaFestRecFNCCompleto = function testBMDiaFestRecFNCCompleto() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, []);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 9, 0, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 23, 59, 59);
		var b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 0, 30, 29, 59, 59)).getCodigo());
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 0, 31, 0, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 0, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 0, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 23, 59, 59)).getValor());
		
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 1, 0, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 0, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 0, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 23, 59, 59)).getValor());

		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 2, 0, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 0, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 0, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 23, 59, 59)).getValor());
		
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 0, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 23, 59, 59), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 0, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 23, 59, 59), 0));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 23, 59, 59), 0));
		
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 23, 59, 59), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 23, 59, 59), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 23, 59, 59), valor));
		
	};
	
	
	
	
	/*
	 * Valor por defecto del calendario de festivos: Festivo Comercial
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp          |FNC 123|
	 * ------------------------------------------
	 * DiaFestRec |FC 123|              |FC 123|
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________
	 * Festivos                FC       |  L   |
	 * 
	 */
	testContainer.testBMDiaFestRecFCConsecutivo = function testBMDiaFestRecFCConsecutivo() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_FESTIVO_COMERCIAL, [
				new Bloque(0, getDate(112, 1, 1, 0, 0, 0), getDate(112, 1, 1, 23, 59, 59),
						Cal.FESTIVOS_LABORABLE, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 17, 0, 0)));
		
		// Dia laborable
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));
		

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 17, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));

		assertEquals(getDate(112, 0, 31, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 59, 59), 0));
		assertEquals(getDate(112, 0, 31, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 0, 0), 0));
		assertEquals(getDate(112, 0, 31, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));

		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		
		

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), valor));
		
	};

	
	
	
	

	/*
	 * 
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp
	 * ------------------------------------------
	 * DiaFestRec |FC 123| |FC 123| |FC 123| // mismo dia y dias distintos
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________
	 * Festivos              FC
	 * 
	 */
	testContainer.testBMDiaFestRecFCConsecutivo2 = function testBMDiaFestRecFCConsecutivo2() {
		var valor = 123;
		var codFC1 = 12;
		var codFC2 = 34;
		var codFC3 = 56;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_FESTIVO_COMERCIAL, []);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC1, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 8, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 16, 59, 59);
		b = new Bloque(codFC2, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		inicio = getDate(0, 0, 8, 18, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 18, 59, 59);
		b = new Bloque(codFC3, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 15, 59, 59)));
		assertEquals(codFC2, bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 17, 59, 59)));
		assertEquals(codFC3, bm.getBloqueParaFecha(getDate(112, 0, 31, 18, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 18, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 18, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 18, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 19, 0, 0)));
		
		
		assertEquals(getDate(112, 1, 1, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 17, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 59, 59), 0));

		assertEquals(getDate(112, 1, 1, 17, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 18, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 18, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 18, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 18, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 19, 0, 0), 0));
		
		

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 18, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 18, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 19, 0, 0), valor));
		
	};

	/*
	 * 
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp
	 * ------------------------------------------
	 * DiaFestRec |FC 123| |FC 123| |FC 123| // dias distintos
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________
	 * Festivos   |  L   | |  L   |     FC
	 * 
	 */
	testContainer.testBMDiaFestRecFCConsecutivo3 = function testBMDiaFestRecFCConsecutivo3() {
		var valor = 123;
		var codFC1 = 12;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_FESTIVO_COMERCIAL, [
				new Bloque(0, getDate(112, 1, 1, 0, 0, 0), getDate(112, 1, 1, 23, 59, 59),
						Cal.FESTIVOS_LABORABLE, 0, 0),
				new Bloque(0, getDate(112, 1, 2, 0, 0, 0), getDate(112, 1, 2, 23, 59, 59),
						Cal.FESTIVOS_LABORABLE, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC1, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)));
		
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)));
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)).getValor());
		
		
		assertEquals(getDate(112, 0, 31, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), 0));
		

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 13, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), valor));
		
	};

	/*
	 * 
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp
	 * ------------------------------------------
	 * DiaFestRec |FC123| |FC123| |FC123| |FC123| // 2 bloques diarios
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________
	 * Festivos          FC       |      L      |
	 * 
	 */
	testContainer.testBMDiaFestRecFCConsecutivo4 = function testBMDiaFestRecFCConsecutivo4() {
		var valor = 123;
		var codFC1 = 12;
		var codFC2 = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_FESTIVO_COMERCIAL, [
				new Bloque(0, getDate(112, 1, 2, 0, 0, 0), getDate(112, 1, 2, 23, 59, 59),
						Cal.FESTIVOS_LABORABLE, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC1, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 8, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 16, 59, 59);
		b = new Bloque(codFC2, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		

		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertEquals(codFC2, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));
		
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)));

		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 11, 59, 59)));
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 15, 59, 59)));
		assertEquals(codFC2, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 17, 0, 0)));

		
		
		assertEquals(getDate(112, 1, 1, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 59, 59), 0));

		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 59, 59), 0));

		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 59, 59), 0));

		

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 31, 17, 0, 0), valor));

		
	};

	

	
	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp           |FC123| |FNC123|  // Escala temporal en horas
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________ // Escala temporal en dias
	 * FestivosDispEsp         |     FC    |
	 * FestivosDiaEsp  |  FNC  |     FNC   |  FNC  |
	 * 
	 */
	testContainer.testBMDiaFestEspApilados2 = function testBMDiaFestEspApilados2() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE,
				[ // Dispositivo Especifico
						new Bloque(0, getDate(112, 1, 2, 0, 0, 0),
									  getDate(112, 1, 2, 23, 59, 59),
									  Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
				],
				[ // Dia Especifico
						new Bloque(0, getDate(112, 1, 1, 0, 0, 0),
									  getDate(112, 1, 1, 23, 59, 59),
									  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
						new Bloque(0, getDate(112, 1, 2, 0, 0, 0),
								  getDate(112, 1, 2, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
						new Bloque(0, getDate(112, 1, 3, 0, 0, 0),
								  getDate(112, 1, 3, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 30, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 30, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 17, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), valor));
	};


	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp           |FC123| |FNC123|  // Escala temporal en horas
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________ // Escala temporal en dias
	 * FestivosDispEsp |  FNC  |     FNC   |  FNC  |
	 * FestivosDiaEsp          |     FC    |
	 * 
	 */
	testContainer.testBMDiaFestEspApilados3 = function testBMDiaFestEspApilados3() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE,
				[ // Dispositivo Especifico
						new Bloque(0, getDate(112, 1, 1, 0, 0, 0),
								  getDate(112, 1, 1, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
						new Bloque(0, getDate(112, 1, 2, 0, 0, 0),
								  getDate(112, 1, 2, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
						new Bloque(0, getDate(112, 1, 3, 0, 0, 0),
								  getDate(112, 1, 3, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0)
				],
				[ // Dia Especifico
						new Bloque(0, getDate(112, 1, 2, 0, 0, 0),
								  getDate(112, 1, 2, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 30, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 17, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), 0));

		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), valor));
	};
	
	

	/*
	 * 
	 * 
	 * ------------------------------------------
	 * DispEsp   |       123        | // Multiples dias
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto            0 ( 123 )
	 * __________________________________________
	 * Festivos            L
	 * 
	 */
	testContainer.testBMDispEspMultidia = function testBMDispEspMultidia() {
		var valor = 123;
		var bm = new BloqueManager(null);
		var inicio, fin;
		inicio = getDate(112, 1, 3, 12, 0, 0); // Febrero
		fin = getDate(112, 1, 19, 12, 59, 59);
		var b = new Bloque(0, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO,	b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 11, 59, 59)));
		
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 1)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 59, 59)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 3, 13, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 4, 10, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 5, 10, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 14, 10, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 18, 10, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 19, 11, 59, 59)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 19, 12, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 19, 12, 0, 1)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 19, 12, 59, 59)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 19, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 20, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 21, 12, 0, 0)));
		
		
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 10, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 10, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 9, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 13, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 18, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 12, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 13, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 22, 12, 0, 0), 0));

		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 10, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 10, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 9, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 13, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 18, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 13, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 22, 12, 0, 0), valor));
		
	};
	

	/*
	 * 
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp     |       123        | // Multiples dias
	 * ------------------------------------------
	 * DiaFestEsp
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto            0 ( 123 )
	 * __________________________________________
	 * Festivos            L
	 * 
	 */
	testContainer.testBMDiaEspMultidia = function testBMDiaEspMultidia() {
		var valor = 123;
		var bm = new BloqueManager(null);
		var inicio, fin;
		inicio = getDate(112, 1, 3, 12, 0, 0); // Febrero
		fin = getDate(112, 1, 19, 12, 59, 59);
		var b = new Bloque(0, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO,	b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 11, 59, 59)));
		
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 1)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 59, 59)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 3, 13, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 4, 10, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 5, 10, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 14, 10, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 18, 10, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 19, 11, 59, 59)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 19, 12, 0, 0)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 19, 12, 0, 1)));
		assertEquals(b, bm.getBloqueParaFecha(getDate(112, 1, 19, 12, 59, 59)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 19, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 20, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 21, 12, 0, 0)));
		
		
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 10, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 10, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 9, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 13, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 18, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 19, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 12, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 13, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 22, 12, 0, 0), 0));

		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 10, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 10, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 9, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 13, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 18, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 19, 13, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 22, 12, 0, 0), valor));
		
	};


	
	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp           |FC123| |FNC123|  // Escala temporal en horas
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________ // Escala temporal en dias
	 * FestivosDispEsp       |    FC    |
	 * FestivosDiaEsp  |          FNC           |
	 * 
	 */
	testContainer.testBMDiaFestEspMultidiaApilados1 = function testBMDiaFestEspMultidiaApilados1() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE,
				[ // Dispositivo Especifico
						new Bloque(0, getDate(112, 1, 2, 0, 0, 0),
									  getDate(112, 1, 2, 23, 59, 59),
									  Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
				],
				[ // Dia Especifico
						new Bloque(0, getDate(112, 1, 1, 0, 0, 0),
								  getDate(112, 1, 3, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 30, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 30, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 17, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), valor));
	};

	
	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp           |FC123| |FNC123|  // Escala temporal en horas
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________ // Escala temporal en dias
	 * FestivosDispEsp |          FNC           |
	 * FestivosDiaEsp        |    FC    |
	 * 
	 */
	testContainer.testBMDiaFestEspMultidiaApilados2 = function testBMDiaFestEspMultidiaApilados2() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE,
				[ // Dispositivo Especifico
						new Bloque(0, getDate(112, 1, 1, 0, 0, 0),
								  getDate(112, 1, 3, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0)
				],
				[ // Dia Especifico
						new Bloque(0, getDate(112, 1, 2, 0, 0, 0),
								  getDate(112, 1, 2, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 30, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 17, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 30, 0), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), valor));
	};


	
	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp           |FC123| |FNC123|  // Escala temporal en horas
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________ // Escala temporal en dias
	 * FestivosDispEsp       |    FC    |         // 2 dias
	 * FestivosDiaEsp  |          FNC           | // 4 dias
	 * 
	 */
	testContainer.testBMDiaFestEspMultidiaApilados3 = function testBMDiaFestEspMultidiaApilados3() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE,
				[ // Dispositivo Especifico
						new Bloque(0, getDate(112, 1, 2, 0, 0, 0),
									  getDate(112, 1, 3, 23, 59, 59),
									  Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
				],
				[ // Dia Especifico
						new Bloque(0, getDate(112, 1, 1, 0, 0, 0),
								  getDate(112, 1, 4, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 30, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 30, 0)));


		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 30, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 17, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 4, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 17, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 17, 0, 0), valor));
	};


	
	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp           |FC123| |FNC123|  // Escala temporal en horas
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________ // Escala temporal en dias
	 * FestivosDispEsp |          FNC           | // 4 dias
	 * FestivosDiaEsp        |    FC    |         // 2 dias
	 * 
	 */
	testContainer.testBMDiaFestEspMultidiaApilados4 = function testBMDiaFestEspMultidiaApilados4() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE,
				[ // Dispositivo Especifico
						new Bloque(0, getDate(112, 1, 1, 0, 0, 0),
								  getDate(112, 1, 4, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
				],
				[ // Dia Especifico
						new Bloque(0, getDate(112, 1, 2, 0, 0, 0),
								  getDate(112, 1, 3, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 17, 0, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 30, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 17, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), 0));

		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 4, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 17, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 17, 0, 0), valor));
	};

	
	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp           |FC123| |FNC123|  // Escala temporal en horas
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________ // Escala temporal en dias
	 * FestivosDispEsp       |    FC    |         // 2 dias
	 * FestivosDiaEsp              |   FNC    |   // 2 dias
	 * 
	 */
	testContainer.testBMDiaFestEspMultidiaApilados5 = function testBMDiaFestEspMultidiaApilados5() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE,
				[ // Dispositivo Especifico
						new Bloque(0, getDate(112, 1, 2, 0, 0, 0),
									  getDate(112, 1, 3, 23, 59, 59),
									  Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
				],
				[ // Dia Especifico
						new Bloque(0, getDate(112, 1, 3, 0, 0, 0),
								  getDate(112, 1, 4, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));


		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 30, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 30, 0)));


		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 30, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 17, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 4, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 17, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 17, 0, 0), valor));
	};


	
	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp       |FC123| |FNC123|  // Escala temporal en horas
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________ // Escala temporal en dias
	 * FestivosDispEsp       |    FC    |         // 2 dias
	 * FestivosDiaEsp  |    FNC    |              // 2 dias
	 * 
	 */
	testContainer.testBMDiaFestEspMultidiaApilados6 = function testBMDiaFestEspMultidiaApilados6() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE,
				[ // Dispositivo Especifico
						new Bloque(0, getDate(112, 1, 2, 0, 0, 0),
									  getDate(112, 1, 3, 23, 59, 59),
									  Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
				],
				[ // Dia Especifico
						new Bloque(0, getDate(112, 1, 1, 0, 0, 0),
								  getDate(112, 1, 2, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 30, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 30, 0)));


		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 30, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 15, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 17, 0, 0)));

		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 15, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 17, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 17, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 17, 0, 0), valor));
	};


	
	
	
	/*
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp           |FC 123| |FC 123|
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto            0 ( 123 )
	 * __________________________________________
	 * Festivos      L    |    FC   |   FC   |       // FC de varios dias
	 * 
	 */
	testContainer.testBMDiaFestRecFCMultidia1 = function testBMDiaFestRecFCMultidia1() {
		var valor = 123;
		var codFC1 = 12;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE, [
				new Bloque(0, getDate(112, 1, 2, 0, 0, 0), getDate(112, 1, 2, 23, 59, 59),
						Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0),
				new Bloque(0, getDate(112, 1, 3, 0, 0, 0), getDate(112, 1, 3, 23, 59, 59),
						Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC1, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 13, 0, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 11, 59, 59)));
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 13, 0, 0)));

		
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 13, 0, 0), 0));
		

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), valor));

	};
	
	/*
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp           |FC 123|
	 * ------------------------------------------
	 * DiaFestRec
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto            0 ( 123 )
	 * __________________________________________
	 * Festivos      L    |    FC      |       // FC de varios dias
	 * 
	 */
	testContainer.testBMDiaFestRecFCMultidia2 = function testBMDiaFestRecFCMultidia2() {
		var valor = 123;
		var codFC1 = 12;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE, [
				new Bloque(0, getDate(112, 1, 2, 0, 0, 0), getDate(112, 1, 3, 23, 59, 59),
						Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC1, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 13, 0, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 11, 59, 59)));
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 13, 0, 0)));

		
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 2, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 13, 0, 0), 0));
		

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), valor));

	};
	

	/*
	 * 
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp
	 * ------------------------------------------
	 * DiaFestRec   |FC 123|    |FC 123|
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto            0 ( 123 )
	 * __________________________________________
	 * Festivos      FC      |    L      |       // L de varios dias
	 * 
	 */
	testContainer.testBMDiaFestRecFCMultidia3 = function testBMDiaFestRecFCMultidia3() {
		var valor = 123;
		var codFC1 = 12;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_FESTIVO_COMERCIAL, [
				new Bloque(0, getDate(112, 1, 2, 0, 0, 0), getDate(112, 1, 3, 23, 59, 59),
						Cal.FESTIVOS_LABORABLE, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC1, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		

		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 11, 59, 59)));
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 13, 0, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 11, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 59, 59)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 13, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 11, 59, 59)));
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 13, 0, 0)));
		
		
		assertEquals(getDate(112, 1, 1, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), 0));
		
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 5, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 13, 0, 0), 0));
		

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), valor));

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 15, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 16, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), valor));

	};


	/*
	 * 
	 * 
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp
	 * ------------------------------------------
	 * DiaFestRec         |FC 123|                // Dia entero
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto            0 ( 123 )
	 * __________________________________________
	 * Festivos      L    |    FC      |       // FC de varios dias
	 * 
	 */
	testContainer.testBMDiaFestRecFCMultidia4 = function testBMDiaFestRecFCMultidia4() {
		var valor = 123;
		var codFC1 = 12;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE, [
				new Bloque(0, getDate(112, 1, 2, 0, 0, 0), getDate(112, 1, 4, 23, 59, 59),
						Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 0, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 23, 59, 59);
		var b = new Bloque(codFC1, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		

		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 10, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 0, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 23, 59, 59)));
		
		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 2, 0, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 0, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 0, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 23, 59, 59)).getValor());

		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 3, 0, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 0, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 0, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 23, 59, 59)).getValor());

		assertEquals(codFC1, bm.getBloqueParaFecha(getDate(112, 1, 4, 0, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 0, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 0, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 23, 59, 59)).getValor());
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 0, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 0, 0, 1)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 23, 59, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 6, 0, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 6, 12, 0, 0)));

		
		assertEquals(getDate(112, 1, 1, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 10, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 0, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 23, 59, 59), 0));
		
		assertEquals(getDate(112, 1, 1, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 0, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 0, 0, 1), 0));
		assertEquals(getDate(112, 1, 1, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 23, 59, 59), 0));
		
		assertEquals(getDate(112, 1, 4, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 1), 0));
		assertEquals(getDate(112, 1, 4, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 23, 59, 59), 0));
		
		assertEquals(getDate(112, 1, 4, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 0, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 0, 0, 1), 0));
		assertEquals(getDate(112, 1, 4, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 23, 59, 59), 0));
		
		assertEquals(getDate(112, 1, 4, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 0, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 0, 0, 1), 0));
		assertEquals(getDate(112, 1, 4, 23, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 23, 59, 59), 0));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 0, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 23, 59, 59), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 6, 0, 0, 0), 0));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 6, 10, 0, 0), 0));
		

		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 10, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 23, 59, 59), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 0, 0, 1), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 23, 59, 59), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 0, 0, 1), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 23, 59, 59), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 0, 0, 1), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 23, 59, 59), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 0, 0, 1), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 23, 59, 59), valor));
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 23, 59, 59), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 6, 0, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, 6, 10, 0, 0), valor));
		
	};


	/*
	 * ------------------------------------------
	 * DispEsp
	 * ------------------------------------------
	 * DiaEsp
	 * ------------------------------------------
	 * DiaFestEsp        |FC123|  |FNC123|        // Escala temporal en horas
	 * ------------------------------------------
	 * DiaFestRec                 |FNC123|
	 * ------------------------------------------
	 * DiaSem 
	 * ------------------------------------------
	 * DiaGen 
	 * ------------------------------------------
	 * Defecto             0 ( 123 )
	 * __________________________________________ // Escala temporal en dias
	 * FestivosDispEsp      | FC  |   | FC  |     // Bloques de 3 dias
	 * FestivosDiaEsp  | FNC |   | FNC |          // Bloques de 3 dias
	 * FestivosDefecto             FNC
	 */
	testContainer.testBMDiaFestEspMultidiaApilados7 = function testBMDiaFestEspMultidiaApilados7() {
		var valor = 123;
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_FESTIVO_NO_COMERCIAL,
				[ // Dispositivo Especifico
						new Bloque(0, getDate(112, 1, 3, 0, 0, 0),
									  getDate(112, 1, 5, 23, 59, 59),
									  Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0),
						new Bloque(0, getDate(112, 1, 7, 0, 0, 0),
								  getDate(112, 1, 9, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_COMERCIAL, 0, 0)
				],
				[ // Dia Especifico
						new Bloque(0, getDate(112, 1, 1, 0, 0, 0),
								  getDate(112, 1, 3, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
						new Bloque(0, getDate(112, 1, 5, 0, 0, 0),
								  getDate(112, 1, 7, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
		]);
		
		
		var bm = new BloqueManager(calFestivos);
		var inicio, fin;
		inicio = getDate(0, 0, 8, 12, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 8, 12, 59, 59);
		var b = new Bloque(codFC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);

		inicio = getDate(0, 0, 9, 16, 0, 0); // Enero de 1900, 1 lunes, 2 martes... No soportados 8 festivo comercial, 9 festivo no conercial
		fin = getDate(0, 0, 9, 16, 59, 59);
		b = new Bloque(codFNC, inicio, fin, valor, 0, 0);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b);
		

		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 0, 31, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 0, 31, 17, 0, 0)));
		
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 1, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 1, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 2, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 2, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 3, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 3, 16, 30, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 4, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 4, 16, 30, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 5, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 5, 16, 30, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 6, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 6, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 6, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 6, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 6, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 6, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 6, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 6, 17, 0, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 7, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 7, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 7, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 7, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 7, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 7, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 7, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 7, 16, 30, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 8, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 8, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 8, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 8, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 8, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 8, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 8, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 8, 16, 30, 0)));

		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 9, 11, 59, 59)));
		assertEquals(codFC, bm.getBloqueParaFecha(getDate(112, 1, 9, 12, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 9, 12, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 9, 12, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 9, 12, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 9, 13, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 9, 16, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 9, 16, 30, 0)));
		
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 10, 12, 0, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 10, 12, 30, 0)));
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 10, 15, 59, 59)));
		assertEquals(codFNC, bm.getBloqueParaFecha(getDate(112, 1, 10, 16, 0, 0)).getCodigo());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 10, 16, 0, 0)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 10, 16, 0, 1)).getValor());
		assertEquals(valor, bm.getBloqueParaFecha(getDate(112, 1, 10, 16, 59, 59)).getValor());
		assertNull(bm.getBloqueParaFecha(getDate(112, 1, 10, 17, 0, 0)));


		
//		assertNull(bm.getFechaInicioValorParaFecha(fecha, 0));
		// FNC Recurrente
		assertEquals(getDate(112, 0, 31, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 59, 59), 0));
		assertEquals(getDate(112, 0, 31, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 59, 59), 0));
		assertEquals(getDate(112, 0, 31, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 15, 59, 59), 0));
		assertEquals(getDate(112, 0, 31, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 16, 0, 0), 0));
		assertEquals(getDate(112, 0, 31, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 17, 0, 0), 0));
		
		// FNC Dia Especifico
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 1, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 1, 17, 0, 0), 0));
		
		// FNC Dia Especifico
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 2, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 2, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 2, 17, 0, 0), 0));

		// FC Disp Especifico
		assertEquals(getDate(112, 1, 3, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 3, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 3, 17, 0, 0), 0));

		// FC Disp Especifico
		assertEquals(getDate(112, 1, 4, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 4, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 4, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 5, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 5, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 4, 17, 0, 0), 0));
		
		// FC Disp Especifico
		assertEquals(getDate(112, 1, 5, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 5, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 5, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 6, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 6, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 5, 17, 0, 0), 0));
		
		// FNC Dia Especifico
		assertEquals(getDate(112, 1, 6, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 6, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 6, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 6, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 6, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 6, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 6, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 6, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 6, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 6, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 7, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 6, 17, 0, 0), 0));

		// FC Disp Especifico
		assertEquals(getDate(112, 1, 7, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 7, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 7, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 7, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 7, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 7, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 8, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 7, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 8, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 7, 17, 0, 0), 0));

		// FC Disp Especifico
		assertEquals(getDate(112, 1, 8, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 8, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 8, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 8, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 8, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 8, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 8, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 8, 17, 0, 0), 0));
		
		// FC Disp Especifico
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 9, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 9, 12, 0, 0), 0));
		assertEquals(getDate(112, 1, 9, 12, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 9, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 10, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 9, 13, 0, 0), 0));
		assertEquals(getDate(112, 1, 10, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 9, 17, 0, 0), 0));

		// FNC Recurrente
		assertEquals(getDate(112, 1, 10, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 10, 11, 59, 59), 0));
		assertEquals(getDate(112, 1, 10, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 10, 12, 59, 59), 0));
		assertEquals(getDate(112, 1, 10, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 10, 15, 59, 59), 0));
		assertEquals(getDate(112, 1, 10, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 10, 16, 0, 0), 0));
		assertEquals(getDate(112, 1, 10, 16, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 10, 16, 59, 59), 0));
		assertEquals(getDate(112, 1, 11, 15, 59, 59), bm.getFechaFinValorParaFecha(getDate(112, 1, 10, 17, 0, 0), 0));
		
		
		
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 11, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 12, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 16, 0, 0), valor));
		assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 0, 31, 17, 0, 0), valor));
		
		for (var dia = 1; dia < 11; dia++) {
			assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, dia, 11, 0, 0), valor));
			assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, dia, 12, 0, 0), valor));
			assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, dia, 16, 0, 0), valor));
			assertEquals(getDate(MAX_DATE_VALUE), bm.getFechaFinValorParaFecha(getDate(112, 1, dia, 17, 0, 0), valor));
		}
	};



	/*
	 * ------------------------------------------
	 * DispEsp   | 1 |               | 1 |
	 * ------------------------------------------
	 * DiaEsp      | 1 |           | 1 |
	 * ------------------------------------------
	 * DiaFestEsp     |FNC1|    |FNC1|        
	 * ------------------------------------------
	 * DiaFestRec     
	 * ------------------------------------------
	 * DiaSem            | 1 | | 1 |
	 * ------------------------------------------
	 * DiaGen               | 1 |        
	 * ------------------------------------------
	 * Defecto                0
	 * __________________________________________ 
	 * FestivosDispEsp
	 * FestivosDiaEsp  |      FNC          |
	 * FestivosDefecto         L
	 * 
	 */

	testContainer.testBMEscalonadoFestivos1 = function testBMEscalonadoFestivos1() {
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_LABORABLE,
				[], // Dispositivo Especifico
				[ // Dia Especifico
						new Bloque(0, getDate(112, 1, 9, 0, 0, 0),
								  getDate(112, 1, 9, 23, 59, 59),
								  Cal.FESTIVOS_FESTIVO_NO_COMERCIAL, 0, 0),
		]);
		
		var bm = new BloqueManager(calFestivos);
		var b1, b2, b3, b4, b5, b6, b7;
		var inicio, fin;
		

		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 19, 45, 0);
		fin = getDate(112, 1, 9, 20, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 13, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 18, 45, 0);
		fin = getDate(112, 1, 9, 19, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		inicio = getDate(0, 0, 9, 13, 45, 0);
		fin = getDate(0, 0, 9, 14, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, new Bloque(codFNC, inicio, fin, 1, 0, 0));

		inicio = getDate(0, 0, 9, 17, 45, 0);
		fin = getDate(0, 0, 9, 18, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, new Bloque(codFNC, inicio, fin, 1, 0, 0));
		
		inicio = getDate(0, 0, 4, 14, 45, 0);
		fin = getDate(0, 0, 4, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b5 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(0, 0, 4, 16, 45, 0);
		fin = getDate(0, 0, 4, 17, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b6 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 15, 45, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b7 = new Bloque(0, inicio, fin, 1, 0, 0));
		

		var fecha;

		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 FNC1
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertEquals(codFNC, bm.getBloqueParaFecha(fecha).getCodigo());
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DiaSem1
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem2
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertEquals(b6, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 FNC2
		fecha = getDate(112, 1, 9, 18, 30, 0);
		assertEquals(codFNC, bm.getBloqueParaFecha(fecha).getCodigo());
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DiaEsp2
		fecha = getDate(112, 1, 9, 19, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 20, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
				
		// 0 final
		fecha = getDate(112, 1, 9, 21, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 19, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 15, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
	}	


	/*
	 * ------------------------------------------
	 * DispEsp   | 1 |               | 1 |
	 * ------------------------------------------
	 * DiaEsp      | 1 |           | 1 |
	 * ------------------------------------------
	 * DiaFestEsp        
	 * ------------------------------------------
	 * DiaFestRec     |FNC1|    |FNC1|     
	 * ------------------------------------------
	 * DiaSem            | 1 | | 1 |
	 * ------------------------------------------
	 * DiaGen               | 1 |        
	 * ------------------------------------------
	 * Defecto                0
	 * __________________________________________ 
	 * FestivosDispEsp
	 * FestivosDiaEsp  
	 * FestivosDefecto         FNC
	 * 
	 */

	testContainer.testBMEscalonadoFestivos2 = function testBMEscalonadoFestivos2() {
		var codFC = 12;
		var codFNC = 34;
		
		var calFestivos = getCalFestivos(Cal.FESTIVOS_FESTIVO_NO_COMERCIAL,
				[], // Dispositivo Especifico
				[] // Dia Especifico
		);
		
		var bm = new BloqueManager(calFestivos);
		var b1, b2, b3, b4, b5, b6, b7;
		var inicio, fin;
		

		inicio = getDate(112, 1, 9, 12, 0, 0);
		fin = getDate(112, 1, 9, 12, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b1 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 19, 45, 0);
		fin = getDate(112, 1, 9, 20, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DISPOSITIVO_ESPECIFICO, b2 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 12, 45, 0);
		fin = getDate(112, 1, 9, 13, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b3 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(112, 1, 9, 18, 45, 0);
		fin = getDate(112, 1, 9, 19, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_ESPECIFICO, b4 = new Bloque(0, inicio, fin, 1, 0, 0));

		// FNC
		inicio = getDate(0, 0, 9, 13, 45, 0);
		fin = getDate(0, 0, 9, 14, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, new Bloque(codFNC, inicio, fin, 1, 0, 0));

		// FNC
		inicio = getDate(0, 0, 9, 17, 45, 0);
		fin = getDate(0, 0, 9, 18, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, new Bloque(codFNC, inicio, fin, 1, 0, 0));
		
		inicio = getDate(0, 0, 4, 14, 45, 0);
		fin = getDate(0, 0, 4, 15, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b5 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(0, 0, 4, 16, 45, 0);
		fin = getDate(0, 0, 4, 17, 59, 59);
		bm.addBloque(BloqueManager.TIPO_DIA_DE_LA_SEMANA, b6 = new Bloque(0, inicio, fin, 1, 0, 0));
		
		inicio = getDate(100, 0, 1, 15, 45, 0); // 1 de enero de 2000
		fin = getDate(100, 0, 1, 16, 59, 59);
		bm.addBloque(BloqueManager.TIPO_TODOS_LOS_DIAS, b7 = new Bloque(0, inicio, fin, 1, 0, 0));
		

		var fecha;

		// 0 inicial 
		fecha = getDate(112, 1, 9, 11, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 8, 16, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 11, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DispEsp1
		fecha = getDate(112, 1, 9, 12, 30, 0);
		assertEquals(b1, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaEsp1
		fecha = getDate(112, 1, 9, 13, 30, 0);
		assertEquals(b3, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 FNC1
		fecha = getDate(112, 1, 9, 14, 30, 0);
		assertEquals(codFNC, bm.getBloqueParaFecha(fecha).getCodigo());
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DiaSem1
		fecha = getDate(112, 1, 9, 15, 30, 0);
		assertEquals(b5, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaGen1
		fecha = getDate(112, 1, 9, 16, 30, 0);
		assertEquals(b7, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 DiaSem2
		fecha = getDate(112, 1, 9, 17, 30, 0);
		assertEquals(b6, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));

		// 1 FNC2
		fecha = getDate(112, 1, 9, 18, 30, 0);
		assertEquals(codFNC, bm.getBloqueParaFecha(fecha).getCodigo());
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DiaEsp2
		fecha = getDate(112, 1, 9, 19, 30, 0);
		assertEquals(b4, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
		// 1 DispEsp2
		fecha = getDate(112, 1, 9, 20, 30, 0);
		assertEquals(b2, bm.getBloqueParaFecha(fecha));
		assertEquals(1, bm.getBloqueParaFecha(fecha).getValor());
//		assertEquals(getDate(112, 1, 9, 12, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 9, 20, 59, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
				
		// 0 final
		fecha = getDate(112, 1, 9, 21, 30, 0);
		assertNull(bm.getBloqueParaFecha(fecha));
//		assertEquals(getDate(112, 1, 9, 19, 0, 0), bm.getFechaInicioValorParaFecha(fecha, 0));
		assertEquals(getDate(112, 1, 10, 13, 44, 59), bm.getFechaFinValorParaFecha(fecha, 0));
		
	}	
	
















for(var propiedad in testContainer)	{
    if(propiedad.startsWith("test")) {
        runTest(testContainer[propiedad]);
    }
}
