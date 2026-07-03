var fs = new ActiveXObject('Scripting.FileSystemObject');
var file = fs.OpenTextFile('cart.js', 1);
var code = file.ReadAll();
file.Close();
try {
    new Function(code);
    WScript.Echo('Syntax OK');
} catch(e) {
    WScript.Echo('Syntax Error: ' + e.message);
}
