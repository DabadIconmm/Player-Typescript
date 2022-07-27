
"use strict";
var Dnv = Dnv || {};
var Menu =
{

};

var numItems = 0; 		//numero de elementos
var currentItem = 0; 	//actual
var prevItem = 0; 	    //anterior

var currentSubMenuItem = -1;
var inSubMenu = false;
var inDebug = false;
var navigateKeysEnabled = false;

//Menú
Menu._mostrandoMenu = false;
Menu.showMenu = function () {
    Menu.hideInfoAudiencia();
    Menu._mostrandoMenu = true;
    Menu.onLoad();
}

Menu.hideMenu = function () {
    //document.getElementById("menu").style.display = "none";
    $("#menu").show().fadeOut(1000, function () {
        document.getElementById("menu").innerHTML = "";
    });
    Menu._mostrandoMenu = false;
}
Menu.isMostrandoMenu = function () {
    return Menu._mostrandoMenu;
}

Menu.onLoad = function () {

    if (document.getElementById("menu").innerHTML != "") {
        console.log("[Menu] ya lo estamos mostrando");
        return;
    }

    Dnv.monitor.writeLogFile("[Menu] Mostramos menú");
    console.log("[Menu] Mostramos menú");

    var kEnabled = "KEYS DISABLED";
    if (Dnv.cfg.getKeysEnabled()) {
        kEnabled = "KEYS ENABLED";
        navigateKeysEnabled = true;
    } else {
        navigateKeysEnabled = false;
    }

    document.getElementById("menu").innerHTML =


	"<nav class=\"var_menu\">" +
		"<UL>" +
        "<li class=\"var_nav_title\" id=\"li0\" style=\"display:none;\">" +
			"<img src='assets/logoDNV.PNG' style=\" margin-left:25px; margin-right:25px; margin-top:10px; margin-bottom:13px; max-width:450px;max-height:auto;\">" +
            "<div id='hora' class=\"clock\" ></div>" +
		"</li>" +
		"<li class=\"var_nav\" id=\"li1\" style=\"display:none;\">" +
			"<div class=\"link_bg\" id=\"link_bg1\"></div>" +
			"<div class=\"link_title\">" +
			"   <div class='icon centrado_vertical' id=\"link_title1\"> " +
			"       <i><img class='' src='assets/icons/info-circle_64.png' id='menu_img_1'></i>" +
			"   </div>" +
			"   <a href=\"javascript:avisar(1,true);\" class='centrado_vertical' id=\"a1\"><span string-traduccion=\"menu-info\">INFO</span></a>" +
			"</div>" +
		"</li>" +
    /*"<li class=\"var_nav\" id=\"li2\" style=\"display:none;\">" +
    "<div class=\"link_bg\" id=\"link_bg2\"></div>" +
    "<div class=\"link_title\">" +
    "   <div class='icon centrado_vertical' id=\"link_title2\">" +
    "       <i><img class='' src='assets/icons/play-circle_64.png'></i>" +
    "   </div>" +
    "   <a href=\"javascript:avisar(2,true);\" class='centrado_vertical' id=\"a2\"><span>" + kEnabled + "</span></a>" +
    "</div>" +
    "</li>" +*/
		"<li class=\"var_nav\" id=\"li2\" style=\"display:none;\">" +
			"<div class=\"link_bg\" id=\"link_bg2\"></div>" +
			"<div class=\"link_title\">" +
			"   <div class='icon centrado_vertical' id=\"link_title2\"> " +
			"       <i><img class='' src='assets/icons/wrench_64.png' id='menu_img_2'></i>" +
			"   </div>" +
			"   <a href=\"javascript:avisar(2,true);\" class='centrado_vertical' id=\"a2\"><span string-traduccion=\"menu-update\">UPDATE</span></a>" +
			"</div>" +
		"</li>" +
		"<li class=\"var_nav\" id=\"li3\" style=\"display:none;\">" +
			"<div class=\"link_bg\" id=\"link_bg3\"></div>" +
			"<div class=\"link_title\" >" +
			"   <div class='icon centrado_vertical' id=\"link_title3\"> " +
			"       <i><img class='' src='assets/icons/chain-broken_64.png' id='menu_img_3'></i>" +
			"   </div>" +
			"   <a href=\"javascript:avisar(3,true);\" class='centrado_vertical' id=\"a3\"><span string-traduccion=\"menu-reconfigure\">RECONFIGURE</span></a>" +
			"</div>" +
		"</li>" +
		"<li class=\"var_nav\" id=\"li4\" style=\"display:none;\">" +
			"<div class=\"link_bg\" id=\"link_bg4\"></div>" +
			"<div class=\"link_title\" >" +
			"   <div class='icon centrado_vertical' id=\"link_title4\"> " +
			"       <i><img class='' src='assets/icons/repeat_64.png' id='menu_img_4'></i>" +
			"   </div>" +
			"   <a href=\"javascript:avisar(4,true);\" class='centrado_vertical' id=\"a4\"><span string-traduccion=\"menu-reboot\">REBOOT</span></a>" +
			"</div>" +
		"</li>" +
        "<li class=\"var_nav\" id=\"li5\" style=\"display:none;\">" +
			"<div class=\"link_bg\" id=\"link_bg5\"></div>" +
			"<div class=\"link_title\" >" +
			"   <div class='icon centrado_vertical' id=\"link_title5\"> " +
			"       <i><img class='' src='assets/icons/close_64.png' id='menu_img_5'></i>" +
			"   </div>" +
			"   <a href=\"javascript:avisar(5,true);\" class='centrado_vertical' id=\"a5\"><span string-traduccion=\"menu-exit\">EXIT</span></a>" +
			"</div>" +
		"</li>" +
        "<li class='var_nav_footer'>" +
            "<img id='imgLogo' class='containerLogo' src=\"assets/normal.png\" />" +
        "</li>" +
		"</UL>" +
	"</nav>";

    Dnv.traduccion.traducirInterfaz(document.getElementById("menu"));

    //script para mostrar la hora
    startTime();

    function startTime() {
        try {
            var today = new Date();
            var date = today.toLocaleDateString(navigator.language);
            var h = today.getHours();
            var m = today.getMinutes();
            var s = today.getSeconds();
            h = checkTime(h);
            m = checkTime(m);
            s = checkTime(s);
            document.getElementById('hora').innerHTML =
	        date + " " + h + ":" + m + ":" + s;
            _clockInterval = setTimeout(startTime, 500);
        } catch (e) {
            console.error("[MENU] El menu ya no esta, no actualizamos hora del reloj");
        }
    }
    function checkTime(i) {
        if (i < 10) { i = "0" + i };  // add zero in front of numbers < 10
        return i;
    }

    $("#menu").fadeIn(200);

    //TODO: Sé que hay una manera de cambiar la definición de los estilos, probar más adelante.
    var altura = Dnv.deviceProperties.getHeight();
    if (altura > 1080) altura = 1080;
    // Ojo, Hay pantallas ultra stretch de 600px de altura
    //var itemHeight = $(window).height() / 9;
    var itemHeight = altura / 9;
    //$($(".var_nav_title")[0]).css("height", itemHeight);
    //$($(".var_nav_footer")[0]).css("height", itemHeight);
    for (var i = 0; i < 6; i++) {
        //$($(".var_nav")[i]).css("height", itemHeight);
        $($(".var_nav")[i]).css("height", itemHeight);
        $($(".link_bg")[i]).css("height", itemHeight);
        //$($(".link_title")[i]).css("height", itemHeight);

        var img = document.getElementById("menu_img_" + i);
        if (img /*&& img.offsetHeight > itemHeight * 0.8*/) {
            img.style.height = (0.6 * itemHeight) + "px";
            //img.style.height = "60%";
        }
        var txt = document.getElementById("a" + i);
        if (txt) {

            txt.style.fontSize = (itemHeight * 0.35) + "px";
            /*var parent = txt.parentNode;
            var ratio = 0.8;
            while (txt.offsetHeight >= parent.offsetHeight || txt.offsetWidth >= parent.offsetWidth) {
            txt.style.fontSize = (itemHeight*ratio)+"px";
            ratio -= 0.1*/
        }
    }

    init();
};

Menu.onUnload = function () {
    hideSubMenu();
    hideInfoBoxes();
    Menu.hideMenu();
};

//teclado
Menu.move = function (direction, raise) {
    var prevSubItem = currentSubMenuItem;
    console.log("[MENU] currentItem: " + currentItem + ",  direction: " + direction + ", inSubMenu: " + inSubMenu.toString() + ", currentSubMenuItem: " + currentSubMenuItem.toString());

    if (inSubMenu) {
        switch (direction) {
            case "right":
            case "left":
                if (currentSubMenuItem == 1) {
                    currentSubMenuItem = 0;
                } else {
                    currentSubMenuItem = 1;
                }

                if (currentSubMenuItem != -1) {
                    $("#subMenuButton" + prevSubItem).toggleClass("button_hover");
                }
                $("#subMenuButton" + currentSubMenuItem).toggleClass("button_hover");

                break;
            case "select":
                $("#subMenuButton" + currentSubMenuItem).click();
                break;
            case "up":
                if (inDebug) {
                    scrollDebug("up");
                }
                break;
            case "down":
                if (inDebug) {
                    scrollDebug("down");
                }
                break;
        }
        console.log("[MENU] currentSubMenuItem: " + currentSubMenuItem);
        return;
    }

    switch (direction) {
        case "select":

            if (raise) {
                avisar(currentItem, false);
            }
            return;
            break;

        case "down":
            prevItem = currentItem;

            if (currentItem >= numItems - 1) {
                currentItem = 1;
            } else {
                currentItem += 1;
            }

            hideSubMenu();
            break;

        case "up":
            prevItem = currentItem;

            if (currentItem <= 1) {
                currentItem = numItems - 1;
            } else {
                currentItem -= 1;
            }

            hideSubMenu();
            break;
        default:
            return;
            break;
    }

    changeSelected();
};

var inputSource;

function showPIP() {

    console.log("ShowPIP");

    Dnv.presentador.detenerPresentacion();
    //Main.detenerVideos();

    document.getElementById("wrapper0").innerHTML = "";
    document.getElementById("wrapper1").innerHTML = "";
    document.getElementById("wrapperMaestro0").innerHTML = "";
    document.getElementById("wrapperMaestro1").innerHTML = "";

    document.getElementById("videoDiv").style.width = $(document).width() + "px";
    document.getElementById("videoDiv").style.height = $(document).height() + "px";

    var options = {};
    options.divId = "videoDiv"; // This should match the div tag name in an html page.
    options.videoId = "broadcastvideo";
    options.callback = init;
    options.src = "ext://hdmi:1";

    function successCb(cbObject) {
        // Do something
    }

    function failureCb(cbObject) {
        var errorCode = cbObject.errorCode;
        var errorText = cbObject.errorText;

        console.log("Error Code [" + errorCode + "]: " + errorText);
    }

    inputSource = new InputSource();
    inputSource.initialize(successCb, failureCb, options);
};

function hidePIP() {
    console.log("limpiamos PIP");
    //Dnv.presentador.continuarPresentacion();
    Main.navegarContenidos();
    //Dnv.presentador.avanzarSlide();
    document.getElementById("videoDiv").innerHTML = "";
};


//recibe onclick (mouse) y selected (boton)
function avisar(item, raise) {

    prevItem = currentItem;
    currentItem = item;

    switch (item) { // TODO: seria mejor que item fuera un string... por si reordenamos o insertamos cosas en el menu

        case 1: //"info":
            if (document.getElementById("info").innerHTML == "") {
                createInfoBoxes();
                if (!_infoBoxesInterval) {
                    _infoBoxesInterval = setInterval(rellenarInfoBoxes, 3000);
                }
            } else {
                hideInfoBoxes();
                if (_infoBoxesInterval) {
                    clearInterval(_infoBoxesInterval);
                    _infoBoxesInterval = null;
                }
            }
            hideSubMenu();
            break;
            /*
        case 2: //"keys control":
            var d = document.getElementById("li" + currentItem);

            if (Dnv.cfg.getKeysEnabled()) {
                navigateKeysEnabled = false;
                Dnv.cfg.setKeysEnabled(false);
                d.getElementsByTagName("span")[0].innerHTML = "KEYS DISABLED";
                console.log("[TECLADO] deshabilitamos teclado");
            } else {
                navigateKeysEnabled = true;
                Dnv.cfg.setKeysEnabled(true);
                d.getElementsByTagName("span")[0].innerHTML = "KEYS ENABLED";
                console.log("[TECLADO] habilitamos teclado");
            }

            hideInfoBoxes();
            hideSubMenu();
            break;
            */
        case 2: //"configure":
            showUpdateMenu(item);
            //hideInfoBoxes();
            //hideSubMenu();
            //            if (document.getElementById("videoDiv").innerHTML == "") {
            //                showPIP();
            //            } else {
            //                hidePIP();
            //            }
            //            Menu.onUnload();
            break;

        case 3: //"reconfigure":
            /*var r = confirm("¿Desea RECONFIGURAR?");
            if (r == true) {
                alert("reconfigure");
            }*/
            //                hideInfoBoxes();
            //                Menu.hideMenu();
            //                Dnv.cfg.resetConfig();  //reseteamos la configuración
            //                Main.navigateToConfigure();
            showReconfigureMenu(item);
            //inSubMenu = true;
            //raise = false;
            break;
        case 4: //"reboot":
            hideInfoBoxes();
            hideSubMenu();
            var msg = "[CONFIGURACION] - Reseteamos la aplicación debido a que el usuario lo ha solicitado en el menú";
            console.warn(msg);
            Dnv.monitor.writeLogFile(msg);
            Dnv.monitor.resetApp();
            break;
        case 5: //"exit":
            if (_infoBoxesInterval) {
                clearInterval(_infoBoxesInterval);
                _infoBoxesInterval = null;
            }
            clearTimeout(_clockInterval);
            _clockInterval = null;
            Menu.onUnload();
            break;
    }
    if (raise) {
        Menu.move("select", false);
    }
};

function changeSelected() {
    if (currentItem != 0) {
        $("#li" + currentItem).toggleClass("var_nav_hover");
        $("#link_bg" + currentItem).toggleClass("var_nav_hover_link_bg");
        $("#link_title" + currentItem).toggleClass("link_title_hover_icon");
        $("#a" + currentItem).toggleClass("var_nav_hover_a");
    }

    if (prevItem != 0) {
        $("#li" + prevItem).toggleClass("var_nav_hover");
        $("#link_bg" + prevItem).toggleClass("var_nav_hover_link_bg");
        $("#link_title" + prevItem).toggleClass("link_title_hover_icon");
        $("#a" + prevItem).toggleClass("var_nav_hover_a");
    }
};

function init() {

    numItems = 0;
    currentItem = 0;
    prevItem = 0;

    //_currentSubMenu = 0;
    inSubMenu = false;
    //enabledKeys = false;

    numItems = document.getElementsByTagName("li").length;

    document.getElementById("info").style.display = "block";
    centerMenu();

    for (var i = 0; i < numItems - 1; i++) {
        if (i > 0 && i < numItems - 1) { // El primero es el titulo y el ultimo es el logo de icon
            document.getElementById("li" + i).onmouseover = function (e) { mouseoverHandler(e) }; //mouseoverHandler
        }
        showItem(i);
    }
};

function showItem(index) {
    setTimeout(function () { $("#li" + (index)).fadeIn(500) }, 100 * index);
};

function reconfigureResult(value) {

    if (value && document.getElementById("inputTextIPMaster").value != "") { //Editamos la dirección a la que apunta el config.ini
        var config = ini.parse(fs.readFileSync(path.dirname(process.execPath) + '/config.ini', 'utf-8'));
        config.server = document.getElementById("inputTextIPMaster").value;
        fs.writeFileSync(path.dirname(process.execPath) + '/config.ini', ini.stringify(config));
        Dnv.cfg.setConfigIpServer(config.server); //Editamos la dirección del servidor a la que apunta la variable de deneva
        console.log("FICHERO CONFIG.INI ESCRITO");
        console.log("[MENU] RECONFIGURAMOS");
        $('html').removeClass("configured");
        hideInfoBoxes();
        Menu.hideMenu();
        //Dnv.cfg.resetConfig();  //reseteamos la configuraci n
        //Main.navigateToConfigure();
        inSubMenu = false;
        hideSubMenu();
        Dnv.cfg.setInternalCfgString("IPServerChanged", "true");
        Dnv.monitor.resetApp();
    } else {
        console.log("[MENU] RECONFIGURAMOS");
        $('html').removeClass("configured");
        hideInfoBoxes();
        Menu.hideMenu();
        //Dnv.cfg.resetConfig();  //reseteamos la configuraci n
        //Main.navigateToConfigure();
        inSubMenu = false;
        hideSubMenu();
        document.getElementById("configure").innerHTML =
                "<div id=\"log\" style=\"display:none;background:gray; position:absolute; top: 0px; left: 0px; width: 400px; height: 400px;z-index: 100;\">---</div>" +
                "<div id=\"qrcode\" style=\"position:absolute;\"></div>" +
                "<div id=\"divCode\" style=\"position:absolute;\"\">" +
                "  <h1 class=\"inset-text\" id=\"codeText\"></h1>" +
                "</div>" +
                "<div id=\"divURL\" style=\"position:absolute; \">" +
                "  <h5 class=\"inset-text\" id=\"url\"></h5>" +
                "</div>" +
                "<div id=\"divInfo\" style=\" position:absolute;display:none;\">" +
                "  <h2 class=\"inset-text\" id=\"infoText\" style=\"\"></h2>" +
                "</div>"

        document.getElementById("stylesheet_css").href = "assets/css/configure.css";
        document.getElementById("configure").style.display = "block";

        configure.onLoad();
    }
}

function showReconfigureServer() {
    var config = ini.parse(fs.readFileSync(path.dirname(process.execPath) + '/config.ini', 'utf-8'));

    currentSubMenuItem = -1;
    inSubMenu = false;
    //devolvemos las teclas de navegaci n a su estado anterior.
    Dnv.cfg.setKeysEnabled(navigateKeysEnabled);
    inSubMenu = true;

    //deshabilitamos temporalmente la navegaci n.
    Dnv.cfg.setKeysEnabled(false);

    console.log("[MENU] showSubMenu");
    document.getElementById("subMenu").innerHTML =
			"<div class='containerAlert'> " +
				"<h1 class='titleAlert'><span string-traduccion=\"submenu-reconfigurar-servidor\">Edit the server address if necessary</span></h1> " +
                "<div><input name=\"ipMaster\" type=\"text\" id=\"inputTextIPMaster\" onkeypress=\"if(event.keyCode == 13) return reconfigureResult(true)\" style=\"border-radius:10px;border:2px solid #792B2C;padding: 10px;width: 330px;height: 12px;font-size: 18px;\" autocomplete=\"off\" placeholder=\"" + config.server + "\"></div>" +
                "<div><button id='subMenuButton1' class='button_submenu' onClick='reconfigureResult(false)'><span string-traduccion=\"saltar\">Skip</span></button>" +
				"<button id='subMenuButton0' class='button_submenu' onClick='reconfigureResult(true)'><span string-traduccion=\"aplicar\">Apply</span></button></div>" +
			"</div>";
    Dnv.traduccion.traducirInterfaz(document.getElementById("subMenu"));
    posicionarSubMenu();
    var anchoDocument;
    try {
        anchoDocument = document.getElementById('wrapperRotacion').offsetWidth;
    } catch (e) {
        console.warn("Error al obtener el ancho del wrapper principal:" + e);
        anchoDocument = screen.width;
    }
    var ancho = 500; //Las ventanas de submenu tienen una anchura fija de 500px
    document.getElementById("subMenu").style.left = (anchoDocument / 2) - (ancho / 2) + "px";

    $("#subMenu").fadeIn(300);
    setTimeout(function () {
        var inputTextElement = document.getElementById("inputTextIPMaster");
        inputTextElement.focus();
        inputTextElement.selectionStart = inputTextElement.selectionEnd = inputTextElement.value.length;
    }, 200);
}

function reconfigure(value) {
    if (value) {
        console.log("[MENU] RECONFIGURAMOS");
        $('html').removeClass("configured");
        hideInfoBoxes();
        Menu.hideMenu();
        if (Main.info.engine == "electron") {
            Dnv.cfg.setInternalCfgString("IPServerChanged", "false");
        }
        Dnv.cfg.resetConfig();  //reseteamos la configuraci n
        Main.navigateToConfigure();
    }
    inSubMenu = false;
    hideSubMenu();
}

function updateResult(value) {
    if (value) {
        console.log("[MENU] ");
        hideInfoBoxes();
        Menu.hideMenu();
        Main.upgradeAndRestart();  //buscamos updatess
    }
    inSubMenu = false;
    hideSubMenu();
}

function showReconfigureMenu(item) {
    inSubMenu = true;
    //deshabilitamos temporalmente la navegación.
    Dnv.cfg.setKeysEnabled(false);

    console.log("[MENU] showSubMenu");
    document.getElementById("subMenu").innerHTML =
			"<div class='containerAlert'> " +
				"<h1 class='titleAlert'><span string-traduccion=\"submenu-reconfigurar-pregunta\">Do you want to reconfigure the device?</span></h1> " +
				"<div><button id='subMenuButton1' class='button_submenu' onClick='reconfigure(false)'><span string-traduccion=\"cancelar\">Cancel</span></button>" +
				"<button id='subMenuButton0' class='button_submenu' onClick='reconfigure(true)'><span string-traduccion=\"aplicar\">Apply</span></button></div>" +
			"</div>";
    Dnv.traduccion.traducirInterfaz(document.getElementById("subMenu"));
    posicionarSubMenu();

    $("#subMenu").fadeIn(300);

};

function showUpdateMenu(item) {
    inSubMenu = true;
    //deshabilitamos temporalmente la navegación.
    Dnv.cfg.setKeysEnabled(false);

    console.log("[MENU] showSubMenu");
    document.getElementById("subMenu").innerHTML =
				"<div class='containerAlert'> " +
					"<h1 class='titleAlert'><span string-traduccion=\"submenu-actualizar-pregunta\">Do you want to update the device?</span></h1> " +
					"<div><button id='subMenuButton1' class='button_submenu' onClick='updateResult(false)'><span string-traduccion=\"cancelar\">Cancel</span></button>" +
					"<button id='subMenuButton0' class='button_submenu' onClick='updateResult(true)'><span string-traduccion=\"aplicar\">Apply</button></span></div>" +
				"</div>";

    //    document.getElementById("subMenu").style.left = ($(document).width() - (getCssValue($("#menu").position().left) + getCssValue($("#li" + item).css("width")))) / 2 + getCssValue($("#menu").width()) + "px";
    //    document.getElementById("subMenu").style.top = ($(document).height() / 3) + "px";

    Dnv.traduccion.traducirInterfaz(document.getElementById("subMenu"));
    posicionarSubMenu();

    $("#subMenu").fadeIn(300);
};

function posicionarSubMenu() {
    var left = 0 + getCssValue($("#li0").css("width")) + 20;
    var top = (Dnv.deviceProperties.getHeight() / 3);
    var ancho = document.getElementById("subMenu").offsetWidth;
    if (ancho === 0) ancho = 500;

    if (left + ancho > Dnv.deviceProperties.getWidth()) {
        // No cabe, lo ponemos debajo
        left = 0;
        top = document.getElementById("li1").offsetHeight * 8;
    }
    document.getElementById("subMenu").style.left = left + "px";
    document.getElementById("subMenu").style.top = top + "px";
    /*document.getElementById("subMenu").style.left = getCssValue($("#menu").position().left) + getCssValue($("#li" + item).css("width")) + 20 + "px";
    document.getElementById("subMenu").style.top = ($(document).height() / 3) + "px";*/
}

function centerSubMenu() {

    var ancho;
    try {
        ancho = document.getElementById('wrapperRotacion').offsetWidth;
    } catch (e) {
        console.warn("Error al obtener el ancho del wrapper principal:" + e);
        ancho = screen.width;
        //alto = 120;
    }
    var anchoSubmenu = document.getElementById('subMenu').childNodes[0].offsetWidth;

    if (document.getElementById('menu').innerHTML != "") {
        var anchoMenu = document.getElementById('menu').childNodes[0].offsetWidth;
        document.getElementById("subMenu").style.left = (anchoMenu + 10) + "px";

    } else {

        document.getElementById("subMenu").style.left = ((ancho - anchoSubmenu) / 2) + "px";
    }
    //document.getElementById("subMenu").style.left = 0 + getCssValue($("#li0").css("width")) + 20 + "px";
    //document.getElementById("subMenu").style.top = (Dnv.deviceProperties.getHeight() / 3) + "px";

}

function hideSubMenu() {
    console.log("[MENU] hideSubMenu");
    $("#subMenu").fadeOut(500, function () { document.getElementById("subMenu").innerHTML = ""; });
    currentSubMenuItem = -1;
    inSubMenu = false;

    //devolvemos las teclas de navegación a su estado anterior.
    Dnv.cfg.setKeysEnabled(navigateKeysEnabled);

};

function mouseoverHandler(e) {
    prevItem = currentItem;

    if ($(e.target)[0].tagName == "A") {
        currentItem = parseInt($(e.target)[0].id.replace("a", ""));
    } else {
        currentItem = parseInt($(e.target).parent()[0].id.replace("a", ""));
    }
    console.log("currentItem: " + currentItem);
    changeSelected();
};

var _infoBoxesInterval = null;
var _clockInterval = null;
var _hideInfoBoxesTimeout = null;

function createInfoBoxes() {
    console.log("[MENU] createInfoBoxes");
    inSubMenu = true;
    //deshabilitamos temporalmente la navegación.
    Dnv.cfg.setKeysEnabled(false);

    $("#info").fadeOut(0);
    /*
    $("#menu").animate({ 
    left: "-=" + $("#menu").position().left,
    }, 400, "linear", function() {
    $(this).after($("#info").fadeIn(200, function() {document.getElementById("info").style.display = "block";}));
    });
    */

    //writeFile("TEXTO DE PRUEBA");

    $("#info").fadeIn(200);
    rellenarInfoBoxes();
    if (Main.info.engine == "electron") {
        Dnv.monitor.testPorts();
    }

}

function rellenarInfoBoxes() {
    Dnv.deviceInfo.update(); // Asincrono, puede que en esta pasada no esten disponibles los datos de red...
    var player = "??";
    var empresa = "??";
    var validez = "-";

    try {
        var pl = Dnv.Pl.lastPlaylist;
        if (pl) {
            player = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getPlayerName();
            empresa = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getEmpresa();
        }
        validez = Dnv.cfg.getValidezLicencia();
        if (validez) { // Puede ser 0, NaN...
            validez = Dnv.utiles.formatearFecha(new Date(validez), true)
        } else {
            validez = "expired or not available license";
        }

    } catch (e) {
        console.error("[MENU] Error obteniendo datos " + e.toString());
        Dnv.monitor.writeLogFile("[MENU] Error obteniendo datos " + e.toString(), LogLevel.Error);
    };

    var infoConfig_h = "";
    var infoConfig_v = "";
    var infoConfig = "<div id='infoConfig' class='container'> " +
		"<h1 class='titleInfo'>  <span string-traduccion=\"submenu-info-configuracion\">CONFIGURATION</span>  </h1> " +
		"<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-objectid\">ObjectID</span>: " + Dnv.cfg.getCfgInt("MyOwnCode", 0) + " </h3>" +
		"<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-coddispositivo\">Device Code</span>: " + Dnv.cfg.getCfgInt("info_code", 0) + " </h3>" +
		"<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-versionplayer\">Ver. Player</span>: " + Dnv.version + " </h3>" +
        "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-versionfirmware\">Ver. Firmware</span>: " + Dnv.deviceInfo.firmwareVersion() + " </h3>" +
	    "<h3 class='subtitleInfo'>&nbsp;</h3>" +
        "</div>";

    if (Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.LANDSCAPE) {
        infoConfig_h = infoConfig;
    } else {
        infoConfig_v = infoConfig;
    }

    var status_h = "";
    var status_v = "";
    var status = "<div id='infoStatus' class='container'> " +
			"<h1 class='titleInfo'>  <span string-traduccion=\"submenu-info-status\">STATUS</span>  </h1> " +
            "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-licencia\">Next License Check</span>: " + validez + "</h3>" +
			"<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-playlistupdate\">Last Playlist Update</span>: " + Dnv.cfg.getInternalCfgString("timeLastPlaylist", "--").replace("T", " ") + "</h3>" +
            "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-playlisttimestamp\">Last Playlist Timestamp</span>: " + Dnv.cfg.getInternalCfgString("playlistLastUpdated", "--").replace("T", " ") + "</h3>" +
			"<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-configurationupdate\">Last Configuration Update</span>: " + Dnv.cfg.getInternalCfgString("timeLastConfig", "--").replace("T", " ") + "</h3>" +
            "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-configurationtimestamp\">Last Configuration Timestamp</span>: " + Dnv.cfg.getInternalCfgString("configLastUpdated", "--").replace("T", " ") + "</h3>" +
		"</div>";

    if (Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.LANDSCAPE) {
        status_h = status;
    } else {
        status_v = status;
    }


    var estadoPid = Dnv.systemInfo.getEstadoConectividadPid();
    var estadoConfiguracion = Dnv.systemInfo.getEstadoConectividadConfiguracion();
    var estadoPlaylist = Dnv.systemInfo.getEstadoConectividadPlaylist();
    var estadoLicencia = Dnv.systemInfo.getEstadoConectividadLicencia();
    var estadoAlarmas = Dnv.systemInfo.getEstadoConectividadAlarmas();
    var desconocidoString = "<span string-traduccion=\"unknown\">Unknown</span>";
    if ((typeof estadoPid) === "undefined") {
        estadoPid = desconocidoString;
    }
    if ((typeof estadoConfiguracion) === "undefined") {
        estadoConfiguracion = desconocidoString;
    }
    if ((typeof estadoPlaylist) === "undefined") {
        estadoPlaylist = desconocidoString;
    }
    if ((typeof estadoLicencia) === "undefined") {
        estadoLicencia = desconocidoString;
    }
    if ((typeof estadoAlarmas) === "undefined") {
        estadoAlarmas = desconocidoString;
    }

    if (Main.info.engine == "electron") {
        var interfacesNetworkHTML = "<div style=\"width: 49%;display: inline-block;\">";
    } else {
        var interfacesNetworkHTML = "";
    }


    if (typeof Dnv.deviceInfo.networkVariousInfo === "function") {
        var interfacesNetwork = Dnv.deviceInfo.networkVariousInfo();
        for (var i = 0; i < interfacesNetwork.length; i++) {
            interfacesNetworkHTML += "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-ip\">IP</span>: " + interfacesNetwork[i]._ip + "</h3><h3 class=\"subtitleInfo\"> <span string-traduccion=\"submenu-info-netmask\">Netmask</span>: " + interfacesNetwork[i]._netmask + " </h3>";
        }
    }

    if (typeof Dnv.deviceInfo.ntpServer === "function") {
        var ntpServer = Dnv.deviceInfo.ntpServer();
        interfacesNetworkHTML += "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-ntp-server\">NTP Server</span>: " + ntpServer + " </h3>";
    }

    if (interfacesNetworkHTML == "") {
        interfacesNetworkHTML = "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-ip\">IP</span>: " + Dnv.deviceInfo.ip() + " </h3>" +
                                "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-gateway\">Gateway</span>: " + Dnv.deviceInfo.activeGatewayAddress() + "</h3>" +
					            "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-dns\">DNS</span>: " + Dnv.deviceInfo.activeDns1Address() + " </h3>" +
                                "<h3 class='subtitleInfo'> &nbsp; </h3>";
    } else {
        interfacesNetworkHTML += "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-gateway\">Gateway</span>: " + Dnv.deviceInfo.activeGatewayAddress() + "</h3>" +
					             "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-dns\">DNS</span>: " + Dnv.deviceInfo.activeDns1Address() + " </h3>";
    }
    var botonesDebug = "";
    if (Main.info.engine == "electron") {
        if (_infoBoxesInterval != null) { //Estamos recargando los datos, pintamos los resultados del ping anterior
            interfacesNetworkHTML += "</div><div style=\"width: 50%;display: inline-block\">"
            interfacesNetworkHTML += "<h3 class=\"subtitleInfo\" style=\"text-align:left; margin-left:20px;\"> <span>Ping HTTP</span>:<span id=\"ping-80\" class=\"" + document.getElementById("ping-80").classList[0] + "\">" + document.getElementById("ping-80").innerText + "</span></h3>" +
            "<h3 class=\"subtitleInfo\" style=\"text-align:left; margin-left:20px;\"> <span>Ping HTTPS</span>:<span id=\"ping-443\" class=\"" + document.getElementById("ping-443").classList[0] + "\">" + document.getElementById("ping-443").innerText + "</span></h3>" +
            "<h3 class=\"subtitleInfo\" style=\"text-align:left; margin-left:20px;\"> <span>Ping WSDeneva</span>:<span id=\"ping-8090\" class=\"" + document.getElementById("ping-8090").classList[0] + "\">" + document.getElementById("ping-8090").innerText + "</span></h3>" +
            "<h3 class=\"subtitleInfo\" style=\"text-align:left; margin-left:20px;\"> <span>Ping Alarmas</span>:<span id=\"ping-6007\" class=\"" + document.getElementById("ping-6007").classList[0] + "\">" + document.getElementById("ping-6007").innerText + "</span></h3>" +
            "<h3 class=\"subtitleInfo\" style=\"text-align:left; margin-left:20px;\"> <span>Traceroute</span>:<span id=\"traceroute\" class=\"" + document.getElementById("traceroute").classList[0] + "\">" + document.getElementById("traceroute").innerText + "</span></h3>" +
            "</div>";
            botonesDebug = "<div style=\"position: relative;\">" +
    		"<button id=\"subMenuButton0\" class=\"button_submenu\" onclick=\"showDebugWindow()\" style=\"padding: 2%;right: 0px;margin-right: 200px;position: absolute;\">" +
        	"<span>Debug</span></button>" +
		    "<button id=\"subMenuButton1\" class=\"button_submenu\" onclick=\"exitInfoBoxes()\" style=\"padding: 2%;right: 0px;margin-right: 0px;position: absolute;\">" +
        	"<span string-traduccion=\"submenu-debug-salir\">Salir</span></button></div>";


        } else {
            interfacesNetworkHTML += "</div><div style=\"width: 50%;display: inline-block\">"
            interfacesNetworkHTML += "<h3 class=\"subtitleInfo\" style=\"text-align:left; margin-left:20px;\"> <span>Ping HTTP</span>:<span id=\"ping-80\" class=\"pingInfo\">&nbsp;</span></h3>" +
            "<h3 class=\"subtitleInfo\" style=\"text-align:left; margin-left:20px;\"> <span>Ping HTTPS</span>:<span id=\"ping-443\" class=\"pingInfo\">&nbsp;</span></h3>" +
            "<h3 class=\"subtitleInfo\" style=\"text-align:left; margin-left:20px;\"> <span>Ping WSDeneva</span>:<span id=\"ping-8090\" class=\"pingInfo\">&nbsp;</span></h3>" +
            "<h3 class=\"subtitleInfo\" style=\"text-align:left; margin-left:20px;\"> <span>Ping Alarmas</span>:<span id=\"ping-6007\" class=\"pingInfo\">&nbsp;</span></h3>" +
            "<h3 class=\"subtitleInfo\" style=\"text-align:left; margin-left:20px;\"> <span>Traceroute</span>:<span id=\"traceroute\" class=\"pingInfo\">&nbsp;</span></h3>" +
            "</div>";
            botonesDebug = "<div style=\"position: relative;\">" +
    		"<button id=\"subMenuButton0\" class=\"button_submenu\" onclick=\"showDebugWindow()\" style=\"padding: 2%;right: 0px;margin-right: 200px;position: absolute;\">" +
        	"<span>Debug</span></button>" +
		    "<button id=\"subMenuButton1\" class=\"button_submenu\" onclick=\"exitInfoBoxes()\" style=\"padding: 2%;right: 0px;margin-right: 0px;position: absolute;\">" +
        	"<span string-traduccion=\"submenu-debug-salir\">Salir</span></button></div>";
        }
        if (!inSubMenu) { //Habilitamos la navegacion por los botones
            currentSubMenuItem = -1;
            inSubMenu = false;
            //devolvemos las teclas de navegacion a su estado anterior.
            Dnv.cfg.setKeysEnabled(navigateKeysEnabled);
            inSubMenu = true;

            //deshabilitamos temporalmente la navegacion.
            Dnv.cfg.setKeysEnabled(false);
        }
        
    } else {
        /*
         * Modificar el inSubMenu rompe la navegación con el mando a distancia cuando se muestra el dialogo de informacion
         * Comento esto puesto que fuera de electron no hay ni ping ni traceroute.
         * 
        if (_infoBoxesInterval != null) { //Estamos recargando los datos, pintamos los resultados del ping anterior
            botonesDebug = "<div style=\"position: relative;\">" +
             "<button id=\"subMenuButton0\" class=\"button_submenu\" onclick=\"showDebugWindow()\" style=\"padding: 2%;right: 0px;margin-right: 200px;position: absolute;\">" +
             "<span>Debug</span></button>" +
             "<button id=\"subMenuButton1\" class=\"button_submenu\" onclick=\"exitInfoBoxes()\" style=\"padding: 2%;right: 0px;margin-right: 0px;position: absolute;\">" +
             "<span string-traduccion=\"submenu-debug-salir\">Salir</span></button></div>";


        } else {
            botonesDebug = "<div style=\"position: relative;\">" +
    		"<button id=\"subMenuButton0\" class=\"button_submenu\" onclick=\"showDebugWindow()\" style=\"padding: 2%;right: 0px;margin-right: 200px;position: absolute;\">" +
        	"<span>Debug</span></button>" +
		    "<button id=\"subMenuButton1\" class=\"button_submenu\" onclick=\"exitInfoBoxes()\" style=\"padding: 2%;right: 0px;margin-right: 0px;position: absolute;\">" +
        	"<span string-traduccion=\"submenu-debug-salir\">Salir</span></button></div>";

        }
        if (!inSubMenu) { //Habilitamos la navegacion por los botones
            currentSubMenuItem = -1;
            inSubMenu = false;
            //devolvemos las teclas de navegacion a su estado anterior.
            Dnv.cfg.setKeysEnabled(navigateKeysEnabled);
            inSubMenu = true;

            //deshabilitamos temporalmente la navegacion.
            Dnv.cfg.setKeysEnabled(false);
        }
        */
    }

    //dependiendo de la orientación metemos el div en una tabla u otra.
    document.getElementById("info").innerHTML =
        "<div id='infoPlayer' class='container'> " +
			"<h1 class='titleInfo'>  <span string-traduccion=\"submenu-info-info\">INFO</span>  </h1> " +
			"<h2 class='subtitleInfo'> <span string-traduccion=\"submenu-info-server\">SERVER</span>: " + Dnv.cfg.getCfgString("IPMaster", Dnv.deviceInfo.ipServer()) + " </h2>" +
			"<h2 class='subtitleInfo'> <span string-traduccion=\"submenu-info-player\">PLAYER</span>: " + player + " </h2>" +
			"<h2 class='subtitleInfo'> <span string-traduccion=\"submenu-info-empresa\">COMPANY</span>: " + empresa + "</h2> " +
         "</div> " +
         
         infoConfig +
		"<div id='infoRed' class='container'> " +
			"<h1 class='titleInfo'>  <span string-traduccion=\"submenu-info-network\">NETWORK</span>  </h1> " +
            interfacesNetworkHTML +
		"</div>" +
        status +
		"<div id='infoConnectivity' class='container'> " +
			"<h1 class='titleInfo'>  <span string-traduccion=\"submenu-info-conectivity\">CONECTIVITY</span>  </h1> " +
            //"<h3 class='subtitleInfo'> PID: " + estadoPid + " </h3>" +
			"<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-configuration\">Configuration</span>: " + estadoConfiguracion + " </h3>" +
			"<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-playlist\">Playlist</span>: " + estadoPlaylist + " </h3>" +
			"<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-licence\">License</span>: " + estadoLicencia + " </h3>" +
            "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-alarmas\">Alarms</span>: " + estadoAlarmas + " </h3>" +
            //"<h3 class='subtitleInfo'>&nbsp;</h3>" +
		"</div>"; //+

        /*
		"<table border='0' style='width:100%'>" +
            "<tr>" +
                infoConfig_v +
            "</tr>" +
			"<tr>" +
    //"<col style='width:50%'>" +
    //"<col style='width:50%'>" +
				"<td>" +
					infoConfig_h +
				"</td>" +
				"<td>" +
				    "<div id='infoRed' class='container'> " +
					    "<h1 class='titleInfo'>  <span string-traduccion=\"submenu-info-network\">NETWORK</span>  </h1> " +
					    interfacesNetworkHTML +
					"</div>" +
				"</td>" +
			"</tr>" +
		"</table>" +
		"<table border='0' style='width:100%'>" +
            "<tr>" +
                status_v +
            "</tr>" +
			"<tr>" +
    //"<col style='width:50%'>" +
    //"<col style='width:50%'>" +
				"<td>" +
					status_h +
				"</td>" +
				"<td>" +
				    "<div id='infoConnectivity' class='container'> " +
					    "<h1 class='titleInfo'>  <span string-traduccion=\"submenu-info-conectivity\">CONECTIVITY</span>  </h1> " +
    //"<h3 class='subtitleInfo'> PID: " + estadoPid + " </h3>" +
					    "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-configuration\">Configuration</span>: " + estadoConfiguracion + " </h3>" +
					    "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-playlist\">Playlist</span>: " + estadoPlaylist + " </h3>" +
					    "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-licence\">License</span>: " + estadoLicencia + " </h3>" +
                        "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-alarmas\">Alarms</span>: " + estadoAlarmas + " </h3>" +
                        "<h3 class='subtitleInfo'>&nbsp;</h3>" +
					"</div>" +
				"</td>" +
			"</tr>" +
		"</table>" + botonesDebug;
        */
    var ancho;
    try {
        ancho = document.getElementById('li1').offsetWidth;
        //alto = document.getElementById('li1').offsetWidth;
    } catch (e) {
        console.warn("Error al obtener el ancho del menu: " + e);
        ancho = 500;
        //alto = 120;
    }

    var anchoDoc = Dnv.deviceProperties.getWidth();
    var altoDoc = Dnv.deviceProperties.getHeight();
    var anchoInfo = (anchoDoc - ancho - 40);
    var topInfo = 0;
    if (anchoInfo < 500) { // La información no cabe, la ponemos debajo del menú
        document.getElementById("info").style.left = 0 + "px";
        //document.getElementById("info").style.width = anchoDoc - 40 + "px";
        document.getElementById("info").style.width = anchoDoc + "px";
        document.getElementById("info").style.maxHeight = altoDoc + "px";
        //document.getElementById("info").style.top = document.getElementById('li1').offsetheight * 9;
        document.getElementById("info").style.bottom = 40 + "px";
    } else {
        document.getElementById("info").style.left = (ancho + 10) + "px";
        document.getElementById("info").style.width = anchoInfo + "px";
        document.getElementById("info").style.maxHeight = altoDoc + "px";
        //document.getElementById("info").style.top = (($(document).height() - (document.getElementById("info").offsetHeight)) * .5) + "px";
        document.getElementById("info").style.top = topInfo + "px";

    }

    Dnv.traduccion.traducirInterfaz(document.getElementById("info"));
};

function hideInfoBoxes() {
    console.log("[MENU] hideInfoBoxes");

    $("#info").fadeOut(200, function () {
        document.getElementById("info").innerHTML = "";
        if (document.getElementById("menu").innerHTML != "") {
            centerMenu(true);
        }
    });
    if (_hideInfoBoxesTimeout) {
        clearTimeout(_hideInfoBoxesTimeout);
        _hideInfoBoxesTimeout = null;
    }
};

function exitInfoBoxes() {
    inSubMenu = false;
    if (_infoBoxesInterval) {
        clearInterval(_infoBoxesInterval);
        _infoBoxesInterval = null;
    }
    clearTimeout(_clockInterval);
    _clockInterval = null;
    Menu.onUnload();
}

function getCssValue(val) {
    if (typeof (val) != "undefined") {
        if (typeof (val) == "number") {
            return val;
        } else {
            return parseInt(val.replace(/[^-\d\.]/g, ''));
        }
    } else {
        return 0;
    }
};

function centerMenu(animate) {
    /*
    var posX = ($(document).width() - getCssValue($("#li1").css("width"))) * .5;
    var posY = ($(document).height() - (getCssValue($("#li1").css("height")) + getCssValue($("#li1").css("margin-bottom"))) * numItems) * .5;

    console.log("[MENU] centerMenu posX:" + posX + " posY:" + posY);

    var time = 0;
    if (animate) time = 400;

    $("#menu").animate({
    left: posX + "px"
    }, time);
    $("#menu").animate({
    top: posY + "px"
    }, time);
    */

    var posX = (Dnv.deviceProperties.getWidth() - getCssValue($("#li1").css("width"))) * .5;
    var posY = (Dnv.deviceProperties.getHeight() - (getCssValue($("#li1").css("height")) + getCssValue($("#li1").css("margin-bottom"))) * numItems) * .5;
    //var posY = (Dnv.deviceProperties.getHeight() - document.getElementById("menu").offsetHeight) * .5;

    document.getElementById("menu").style.position = "absolute";
    document.getElementById("menu").style.left = "0px";
    document.getElementById("menu").style.top = "0" + "px";
};

function executeFunctionByName(functionName, context /*, args */) {
    var args = [].slice.call(arguments).splice(2);
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    for (var i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
    }
    return context[func].apply(this, args);
}

function showInfoIP() {
    if (document.getElementById("info").innerHTML != "") {
        hideInfoBoxes();
    }
    if (document.getElementById("subMenu").innerHTML != "") {
        hideSubMenu();
    }
    createInfoBoxes();
    var ancho;
    try {
        ancho = document.getElementById('li1').offsetWidth;
        //alto = document.getElementById('li1').offsetWidth;
    } catch (e) {
        console.warn("Error al obtener el ancho del menu: " + e);
        ancho = 500;
        //alto = 120;
    }

    if (Menu.isMostrandoMenu()) {
        document.getElementById("info").style.left = (ancho + 10) + "px";

    } else {
        document.getElementById("info").style.left = (ancho / 2 + 5) + "px";
    }
    var anchoDoc = Dnv.deviceProperties.getWidth();
    _hideInfoBoxesTimeout = setTimeout(hideInfoBoxes, 30000);

}


function showDebugWindow() { //La idea es cambiar los divs de abajo (las dos tablas)por uno que ocupe toda la linea con el mismo formato que vaya recibiendo logs y los vaya pintando
    var player = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getPlayerName();
    var empresa = Dnv.Pl.lastPlaylist.getPlayer().getSalida().getEmpresa();
    currentSubMenuItem = -1
    Menu._mostrandoMenu = true
    inSubMenu = true;
    inDebug = true;
    //deshabilitamos temporalmente la navegacion.
    Dnv.cfg.setKeysEnabled(false);

    clearInterval(_infoBoxesInterval);
    if (document.getElementById("menu").innerHTML == "") {
        document.getElementById("menu").style.display = "none";
        document.getElementById("menu").innerHTML = "<span/>";
    }

    if (document.getElementById("info").innerHTML == "") {
        $("#info").fadeIn(300);
        //document.getElementById("info").style.display = "block";
        var ancho;
        try {
            ancho = document.getElementById('li1').offsetWidth;
            //alto = document.getElementById('li1').offsetWidth;
        } catch (e) {
            console.warn("Error al obtener el ancho del menu: " + e);
            ancho = 500;
            //alto = 120;
        }

        document.getElementById("info").style.left = (ancho + 10) + "px";
        var anchoDoc = Dnv.deviceProperties.getWidth();

        document.getElementById("info").style.width = (anchoDoc - ancho - 40) + "px";

        //document.getElementById("info").style.top = (($(document).height() - (document.getElementById("info").offsetHeight)) * .5) + "px";
        document.getElementById("info").style.top = 0;
        document.getElementById("info").style.left = (ancho / 2 + 5) + "px";


    }

    document.getElementById("info").innerHTML =
        "<div id='infoPlayer' class='container'> " +
			"<h1 class='titleInfo'>  <span string-traduccion=\"submenu-info-info\">INFO</span>  </h1> " +
        "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-server\">SERVER</span>: " + Dnv.cfg.getCfgString("IPMaster", Dnv.deviceInfo.ipServer()) + " </h3>" +
        "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-ip\">IP</span>: " + Dnv.deviceInfo.ip() + " </h3>" +
			"<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-player\">PLAYER</span>: " + player + " </h3>" +
        "<h3 class='subtitleInfo'> <span string-traduccion=\"submenu-info-empresa\">COMPANY</span>: " + empresa + "</h3> " +

        "</div> " +

        "<div style=\"height: 60%;overflow: hidden;margin-top:1em;\"><div id=\"debugContainer\" class=\"container\" style=\"height: 600px;overflow: hidden; position:relative; border:0px;\">" +
	"<h1 class=\"titleInfo\" style=\"margin-top:0px;margin-bottom:15px;\"><span>DEBUG</span></h1><div id=\"logContainer\" class=\"contenedorLog\"></div> <div style=\"margin-top: 10px; position: relative;\">" +
	"</div></div>" +
	"<button id=\"subMenuButton0\" class=\"button_submenu\" onclick=\"pauseDebug()\" style=\"padding: 2%;position: absolute;margin-right: 0px; right: 200px;\">" +
	"<span string-traduccion=\"submenu-debug-pause\">Pausar</span></button>" +
	"<button id=\"subMenuButton1\" class=\"button_submenu\" onclick=\"closeDebugWindow()\" style=\"padding: 2%;position: absolute;margin-right: 0px; right: 0px;\">" +
	"<span string-traduccion=\"submenu-debug-salir\">Salir</span></button></div></div>";


    if (Dnv.deviceProperties.getOrientation() == Dnv.deviceOrientation.PORTRAIT) { //orientacion vertical
        document.getElementById("debugContainer").style.height = "980px";
        document.getElementById("logContainer").style.height = "92%";
        document.getElementById("logContainer").style.width = "96%";
    }
    Dnv.traduccion.traducirInterfaz(document.getElementById("info"));
    Dnv.monitor.openDebugWindow();
    $("#info").fadeIn(300);

}

function closeDebugWindow() {
    Dnv.monitor.closeDebugWindow();
    inDebug = false;
    inSubMenu = false;
    exitInfoBoxes();
}

function pauseDebug() {
    Dnv.monitor.closeDebugWindow();
    var buttonDebug = document.getElementById("subMenuButton0");
    buttonDebug.setAttribute("onclick", "resumeDebug()");
    buttonDebug.getElementsByTagName("span")[0].setAttribute("string-traduccion", "submenu-debug-resume");
    Dnv.traduccion.traducirInterfaz(document.getElementById("info"));
}


function resumeDebug() {
    Dnv.monitor.openDebugWindow();
    var buttonDebug = document.getElementById("subMenuButton0");
    buttonDebug.setAttribute("onclick", "pauseDebug()");
    buttonDebug.getElementsByTagName("span")[0].setAttribute("string-traduccion", "submenu-debug-pause");
    Dnv.traduccion.traducirInterfaz(document.getElementById("info"));

}

function scrollDebug(direction) {
    var logElement = document.getElementById("logContainer");
    if (logElement.scrollHeight > logElement.clientHeight && document.getElementById("subMenuButton0").getAttribute("onclick") == "resumeDebug()") { // Esta scrollando por abajo y pausado
        if (direction == "up") {
            var logScrollTop = logElement.scrollTop - 100;
        } else {
            var logScrollTop = logElement.scrollTop + 100;
        }


        if (logScrollTop > logElement.scrollHeight - logElement.clientHeight) {
            logScrollTop = logElement.scrollHeight - logElement.clientHeight;
        } else if (logScrollTop < 0) {
            logScrollTop = 0;
        }

        logElement.scrollTop = logScrollTop;
    }

}


// INFO DEBUG AUDIENCIA WIPY
Menu._mostrarInfoAudiencia = false;
Menu._mostrandoInfoAudiencia = false;

Menu.showInfoAudienciaCommand = function () {
    Menu.showInfoAudiencia();
    setTimeout(Menu.hideInfoAudiencia, 300000);
};

Menu.showInfoAudiencia = function showInfoAudiencia(infoSlidePrevio) {
    try {
        Menu.hideMenu();
        Menu._mostrarInfoAudiencia = true;
        Menu._mostrandoInfoAudiencia = true;
        var info_debug = document.getElementById("infoDebug");
        info_debug.style.display = "block";
        var pases;
        var prioridad;
        if (Dnv.secuenciador.getSlideActual().getInsercionActual()) {
            prioridad = Dnv.secuenciador.getSlideActual().getInsercionActual().getPrioridad();
        } else {
            prioridad = "-";
        }
        if (Dnv.secuenciador.getPasesTotales() == 999999) {
            pases = "Ilimitados";
        } else {
            pases = Dnv.secuenciador.getPaseActual() + " de " + Dnv.secuenciador.getPasesTotales()
        }
        if (!infoSlidePrevio) {
            info_debug.innerHTML = '<div class="info_debug_video">' +
                                '<h1 class="titleInfo" id="titleLive">DIRECTO</h1>' +
                                '<img width="640px" src="' + Dnv.audiencia.getVideo() + '?' + new Date().getTime() + '" onerror=this.src=""></img>' +
                            '</div>' +
                            '<div class="info_debug_info">' +
                                '<div class="info_agrupados">' +
                                    '<h1 class="titleInfo">Actual: ' + Dnv.secuenciador.getSlideActual().getDenominacion() + '</h1>' +
                                    '<h2 class="subtitleInfo">Canal: ' + Dnv.secuenciador.getCanalActual().getDenominacion() + '</h2>' +
                                    '<h2 class="subtitleInfo">Pase del canal: ' + pases + '</h2>' +
                                    '<h2 class="subtitleInfo">Prioridad: ' + prioridad + '</h2>' +
                                '</div>' +
                                '<div class="info_agrupados_siguiente">' +
                                    '<h1 class="titleInfo" id="titleNext">Siguiente: ' + Dnv.secuenciador.peekNextSlide().getDenominacion() + '</h1>' +
                                    '<h2 class="subtitleInfo">Canal: ' + Dnv.secuenciador.peekNextSlide().getCanal().getDenominacion() + '</h2>' +
                                '</div>' +
                            '</div>';
        } else {
            info_debug.innerHTML = '<div class="info_debug_video">' +
                                '<h1 class="titleInfo" id="titleLive">DIRECTO</h1>' +
                                '<img width="640px" src="' + Dnv.audiencia.getVideo() + '?' + new Date().getTime() + '" onerror=this.src=""></img>' +
                            '</div>' +
                            '<div class="info_debug_info">' +
                                '<div class="info_agrupados">' +
                                    '<h1 class="titleInfo">Actual: ' + Dnv.secuenciador.getSlideActual().getDenominacion() + '</h1>' +
                                    '<h2 class="subtitleInfo">Canal: ' + Dnv.secuenciador.getCanalActual().getDenominacion() + '</h2>' +
                                    '<h2 class="subtitleInfo">Pase del canal: ' + pases + '</h2>' +
                                    '<h2 class="subtitleInfo">Prioridad: ' + prioridad + '</h2>' +
                                '</div>' +
                                '<div class="info_agrupados_siguiente">' +
                                    '<h1 class="titleInfo" id="titleNext">Siguiente: ' + Dnv.secuenciador.peekNextSlide().getDenominacion() + '</h1>' +
                                    '<h2 class="subtitleInfo">Canal: ' + Dnv.secuenciador.peekNextSlide().getCanal().getDenominacion() + '</h2>' +
                                '</div>' +
                                '<div class="info_paseAnterior">' +
                                    '<h1 class="titleInfo">Anterior: ' + infoSlidePrevio.nombreSlide + '</h1>' +
                                    '<h2 class="subtitleInfo">Total personas: ' + infoSlidePrevio.totalPersonas + '</h2>' +
                                    '<div class="info_debug_celda_audiencia"><img src="assets/icons/icon_man.png" alt="Hombres" height="44" hspace="10">' + infoSlidePrevio.totalHombres + '</div>' +
                                    '<div class="info_debug_celda_audiencia"><img src="assets/icons/icon_man.png" alt="Hombres" height="44"><img src="assets/icons/icon_age.png" alt="Edad media" height="25" hspace="10">' + infoSlidePrevio.totalHombresEdad + '</div>' +
                                    '<div class="info_debug_celda_audiencia"><img src="assets/icons/icon_woman.png" alt="Mujeres" height="42" hspace="10">' + infoSlidePrevio.totalMujeres + '</div>' +
                                    '<div class="info_debug_celda_audiencia"><img src="assets/icons/icon_woman.png" alt="Hombres" height="42"><img src="assets/icons/icon_age.png" alt="Edad media" height="25" hspace="10">' + infoSlidePrevio.totalMujeresEdad + '</div>' +
                                    '<hr>' +
                                    '<h2 class="subtitleInfo">Total personas atendiendo (>' + Dnv.audiencia.tiempoImpacto + 's): ' + infoSlidePrevio.totalPersonasMirando + '</h2>' +
                                    '<div class="info_debug_celda_audiencia"><img src="assets/icons/icon_man.png" alt="Hombres" height="44" hspace="10">' + infoSlidePrevio.totalHombresMirando + '</div>' +
                                    '<div class="info_debug_celda_audiencia"><img src="assets/icons/icon_man.png" alt="Hombres" height="44"><img src="assets/icons/icon_age.png" alt="Edad media" height="25" hspace="10">' + infoSlidePrevio.totalHombresMirandoEdad + '</div>' +
                                    '<div class="info_debug_celda_audiencia"><img src="assets/icons/icon_woman.png" alt="Mujeres" height="42" hspace="10">' + infoSlidePrevio.totalMujeresMirando + '</div>' +
                                    '<div class="info_debug_celda_audiencia"><img src="assets/icons/icon_woman.png" alt="Hombres" height="42"><img src="assets/icons/icon_age.png" alt="Edad media" height="25" hspace="10">' + infoSlidePrevio.totalMujeresMirandoEdad + '</div>' +
                                    //'<h1 class="titleInfo" id="titleCoste"><img src="assets/icons/icon_money.png" height="33" align="left">' + infoSlidePrevio.coste + '</h1>' +
                                '</div>' +
                            '</div>';
        }
    } catch (e) {
        //console.error("[MENU] (showInfoAudiencia) " + e);

        info_debug.innerHTML = '<div class="info_debug_video">' +
                                '<h1 class="titleInfo" id="titleLive">DIRECTO</h1>' +
                                '<img width="640px" src="' + Dnv.audiencia.getVideo() + '?' + new Date().getTime() + '" onerror=this.src=""></img>' +
                            '</div>';

        //Menu.hideInfoAudiencia();
    }
}
Menu.hideInfoAudiencia = function hideInfoAudiencia() {
    Menu._mostrarInfoAudiencia = false;
    Menu._mostrandoInfoAudiencia = false;
    var elm = document.getElementById("infoDebug");
    if (elm) {
        elm.style.display = "none";
        elm.innerHTML = "";
    }
    
}
