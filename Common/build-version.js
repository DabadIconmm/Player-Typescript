
//var buildVersion = process.argv[2];

try {
    if (!process.argv[2]) {
        throw new Error("No se ha pasado el achivo de version");
    }
    console.log("Nos ejecutamos en " + process.cwd());
    console.log("Archivo " + process.argv[2]);

    var fs = require('fs');
    console.log(" existe " + fs.existsSync(process.argv[2])); 

    fs.chmodSync(process.argv[2], 0o644);

    var replace = require('replace-in-file');
    //<FileUpdate Files="Common\lib\version.js" Regex="version = &quot;(\d+)\.(\d+)(\.\d+)?\.(\d+)(\-.+)?&quot;" ReplacementText="version = &quot;$1.$2$3.$([System.DateTime]::Now.ToString('yyMMddHHmmss'))$5&quot;" />
    var getFecha = function getFecha(fecha) {
        fecha = fecha || new Date();
        var dd = fecha.getDate();
        var mm = fecha.getMonth() + 1; //January is 0!
        var hh = fecha.getHours();
        var MM = fecha.getMinutes();
        var ss = fecha.getSeconds();

        var yy = fecha.getFullYear() % 100;
        var yyyy = fecha.getFullYear();
        if (dd < 10) dd = '0' + dd
        if (mm < 10) mm = '0' + mm
        if (hh < 10) hh = '0' + hh
        if (MM < 10) MM = '0' + MM
        if (ss < 10) ss = '0' + ss

        //return dd + '-' + mm + '-' + yyyy + ' ' + hh + ':' + MM + ':' + ss;
        return "" + yy + mm + dd + hh + MM + ss;

    };

    /*
     * En strings como:
     * 
     * version = "2.28.220119183520";
     * version = "2.28.11.220119183520";
     * version = "2.28.220119183520-test";
     * version = "2.28.11.220119183520-test";
     * 
     * Se sustituye la fecha por la fecha y hora de hoy
     */  
    
    
    const options = {
        files: process.argv[2], //'src/lib/version.js',
        from: /version = \"(\d+)\.(\d+)(\.\d+)?\.(\d+)(\-.+)?\"/g,
        to: "version = \"$1.$2$3." + getFecha() + "$5\"",
        allowEmptyPaths: false,
    };
    let changedFiles = replace.sync(options);
    
    console.log('Rellenando version en ' + JSON.stringify(changedFiles));
} catch (error) {
    console.error('No se pudo rellenar la version. Error occurred:', error);
    throw error;
}