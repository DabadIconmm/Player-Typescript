
"use strict";

var Dnv = Dnv || {};

Dnv.deviceOrientation = {
    PORTRAIT: 1,
    LANDSCAPE: 2
}

var ORIENTATION_CHANGED = "ORIENTATION_CHANGED";
var RESIZE = "RESIZE";
var CSS_ROTATION_CHANGED = "CSS_ROTATION_CHANGED";


//SINGLETON - revisar la implementación...
Dnv.deviceProperties = (function () {

    var instance;

    var _orientation = 0;
    var _aspectRatio = 1;
    var _rotadoCss = false;

    $('document').ready(function () {
        _orientation = _calculateOrientation();
        _aspectRatio = _calculateRatio();
    });

    window.onresize = function (event) {
        var newOr = _calculateOrientation()
        if (_orientation != newOr) {
            _orientation = newOr;
            this.dispatchEvent(new CustomEvent(ORIENTATION_CHANGED, { 'detail': { 'orientation': _orientation} }));
        }
        _aspectRatio = _calculateRatio();
        this.dispatchEvent(new CustomEvent(RESIZE, { 'detail': { 'aspectRatio': _aspectRatio} }));
    };

    /* No va en SSSP2
    $(window).on("orientationchange", function () {
    _orientation = _calculateOrientation();
    _aspectRatio = _calculateRatio();
    this.dispatchEvent(new Event(ORIENTATION_CHANGED, { 'orientation': _orientation }));
    this.dispatchEvent(new Event(RESIZE, { 'aspectRatio': _aspectRatio }));
    });*/
    
    function _setClassOrientation(isPortrait) {
        var div = document.getElementById("wrapperRotacion");
        // En SSSP2 no hay wrapper de rotación... son aplicaciones distintas la horizontal y la vertical
        if (div && div.classList) {
            if (isPortrait) {
                div.classList.add("vertical");
                div.classList.remove("horizontal");
            } else {
                div.classList.add("horizontal");
                div.classList.remove("vertical");
            }
        }
    }

    /*
    *
    * Al principio usabamos document.documentElement.clientWidth
    * pero no va bien con la rotacion de webOS2
    */

    /*function _getWidth() {
    // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
    // unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
    return Math.max(
    elem.body[ "scroll" + name ], doc[ "scroll" + name ],
    elem.body[ "offset" + name ], doc[ "offset" + name ],
    doc[ "client" + name ]
    );*/

    function _calculateOrientation() {
        var div = document.getElementById("wrapperRotacion");
        var _or; // offsetWidth lo hace bien, excepto la altura en samsung
        if (_rotadoCss) {
            _or = Dnv.deviceOrientation.PORTRAIT;
        } else if (div && div.clientWidth < div.clientHeight) {
            _or = Dnv.deviceOrientation.PORTRAIT;
        } else if (!div && document.documentElement.clientWidth < document.documentElement.clientHeight) {
            _or = Dnv.deviceOrientation.PORTRAIT;
        } else {
            _or = Dnv.deviceOrientation.LANDSCAPE;
        }
        _setClassOrientation(_or === Dnv.deviceOrientation.PORTRAIT);
        return _or;
    }

    function _calculateRatio() {
        var div = document.getElementById("wrapperRotacion");
        if (div) {
            return div.clientWidth / div.clientHeight;
        }
        return document.documentElement.clientWidth / document.documentElement.clientHeight;
    }

    window.addEventListener("RESOLUTION_CHANGED", function (e) {
        console.log("Evento RESOLUTION_CHANGED: " + e);
        _orientation = _calculateOrientation();
        _aspectRatio = _calculateRatio();
        window.dispatchEvent(new Event(ORIENTATION_CHANGED, { 'orientation': _orientation }));
        window.dispatchEvent(new Event(RESIZE, { 'aspectRatio': _aspectRatio }));
    });

    window.addEventListener(CSS_ROTATION_CHANGED, function (e) {
        // Con la rotacion css (webos2), el ancho y alto del documento permanecen igual, asi que ajustamos a mano...
        console.log("Evento CSS_ROTATION_CHANGED: " + e);
        _orientation = (e.detail.vertical ? 1 : 2);
        _aspectRatio = _calculateRatio();

        _rotadoCss = e.detail.vertical;

        if (e.detail.rotadoNativamente) {
            _rotadoCss = false;
        } else {
            _rotadoCss = e.detail.vertical;
        }

        if (e.detail.vertical) _aspectRatio = 1 / _aspectRatio;

        _setClassOrientation(e.detail.vertical);

        window.dispatchEvent(new Event(ORIENTATION_CHANGED, { 'orientation': _orientation }));
        window.dispatchEvent(new Event(RESIZE, { 'aspectRatio': _aspectRatio }));
    });

    return {

        getInstance: function () {
            if (!instance) {
                instance = this;
            }
            return instance;
        },

        getOrientation: function () {
            if (_orientation === 0) _calculateOrientation();
            return _orientation;
        },

        isCssRotado: function () {
            return _rotadoCss;
        },
        getAspectRatio: function () {
            if (_aspectRatio === 1) _calculateRatio();
            return _aspectRatio;
        },

        getWidth: function () {
            var div = document.getElementById("wrapperRotacion");
            //console.log("[DEVICE PROPERTIES] getWidth _rotadoCss " + _rotadoCss + " _orientation " + _orientation + " div.offsetWidth " + div.offsetWidth + " document.documentElement.offsetWidth " + document.documentElement.offsetWidth);
            if (_rotadoCss) {
                if (div) {
                    return div.offsetWidth;
                }

                //var anchoDoc = $(document).height();
                //if (anchoDoc > 1080) anchoDoc = document.documentElement.offsetWidth; // En webOS2, es offsetWidth, no offsetHeight
                //return anchoDoc;

                return document.documentElement.offsetWidth; // En webOS2, es offsetWidth, no offsetHeight
            } else {
                if (div) {
                    return div.offsetWidth;
                }

                //var anchoDoc = $(document).width();
                //if (anchoDoc > 1920) anchoDoc = document.documentElement.offsetWidth;
                //return anchoDoc;
                return document.documentElement.offsetWidth; // En webOS2, es offsetWidth, no offsetHeight
            }

        },

        getHeight: function () {
            var div = document.getElementById("wrapperRotacion");
            //console.log("[DEVICE PROPERTIES] getHeight _rotadoCss " + _rotadoCss + " _orientation " + _orientation + " div.offsetHeight " + div.offsetHeight + " document.documentElement.offsetHeight " + document.documentElement.offsetHeight);
            if (_rotadoCss) {
                if (div && div.offsetHeight > 0) {
                    return div.offsetHeight;
                }
                //var altoDoc = $(document).height();
                //if (altoDoc > 1080) altoDoc = document.documentElement.offsetWidth; // En webOS2, es offsetWidth, no offsetHeight
                if (document.documentElement.offsetHeight > 0) {
                    return document.documentElement.offsetHeight;
                }
                console.warn("[DEVICE PROPERTIES] No tenemos un valor de altura creible, usamos 1920px");
                return 1920; // Y las verticales rotadas nativamente? Y las UltraStretch?
            } else {
                if (div && div.offsetHeight > 0) {
                    return div.offsetHeight;
                }

                //var altoDoc = $(document).height();
                //if (altoDoc > 1080) altoDoc = document.documentElement.offsetHeight;
                //return altoDoc;
                if (document.documentElement.offsetHeight > 0) {
                    return document.documentElement.offsetHeight;
                }
                console.warn("[DEVICE PROPERTIES] No tenemos un valor de altura creible, usamos 1080px");
                return 1080; // Y las verticales rotadas nativamente? Y las UltraStretch?
            }

        }
    }

})();