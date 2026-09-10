const fs = require('fs');
const path = require('path');

const replacement = `var colorFunction = SUPPORTED_COLOR_FUNCTIONS[value.name];
            if (typeof colorFunction === 'undefined') {
                try {
                    if (typeof document !== 'undefined') {
                        var _canvas = document.createElement('canvas');
                        _canvas.width = 1; _canvas.height = 1;
                        var _ctx = _canvas.getContext('2d');
                        if (_ctx) {
                            var _vals = (value.values || []).map(function(v) { return v ? (v.value != null ? v.value : (v.number != null ? v.number : '')) : ''; });
                            var _str = value.name + '(' + _vals.join(' ') + ')';
                            _ctx.fillStyle = _str;
                            var _comp = _ctx.fillStyle;
                            var _packFn = typeof pack !== 'undefined' ? pack : (typeof exports !== 'undefined' ? exports.pack : null);
                            if (_packFn && _comp && _comp.indexOf('#') === 0) {
                                var _hex = _comp.slice(1);
                                if (_hex.length === 6) {
                                    return _packFn(parseInt(_hex.slice(0, 2), 16), parseInt(_hex.slice(2, 4), 16), parseInt(_hex.slice(4, 6), 16), 1);
                                }
                            } else if (_packFn && _comp && _comp.indexOf('rgb') === 0) {
                                var _m = _comp.match(/[0-9.]+/g);
                                if (_m && _m.length >= 3) {
                                    return _packFn(parseFloat(_m[0]), parseFloat(_m[1]), parseFloat(_m[2]), _m[3] ? parseFloat(_m[3]) : 1);
                                }
                            }
                        }
                    }
                } catch(e) {}
                return 0;
            }
            return colorFunction(context, value.values);`;

const target = 'throw new Error("Attempting to parse an unsupported color function \\\"" + value.name + "\\\"");';

const root = path.join(__dirname, '..');
const files = [
    path.join(root, 'node_modules', 'html2canvas', 'dist', 'html2canvas.esm.js'),
    path.join(root, 'node_modules', 'html2canvas', 'dist', 'html2canvas.js'),
    path.join(root, 'node_modules', 'html2canvas', 'dist', 'lib', 'css', 'types', 'color.js'),
];

let count = 0;
for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        const prevRegex = /var colorFunction = SUPPORTED_COLOR_FUNCTIONS\[value\.name\];[\s\S]*?return colorFunction\(context, value\.values\);/;
        if (prevRegex.test(content)) {
            content = content.replace(prevRegex, replacement);
            fs.writeFileSync(file, content, 'utf8');
            console.log('Patched cleanly in:', file);
            count++;
        } else if (content.includes(target)) {
            content = content.replace(target, 'return 0;');
            fs.writeFileSync(file, content, 'utf8');
            console.log('Patched target in:', file);
            count++;
        } else {
            console.log('Already patched or not found in:', file);
        }
    }
}
console.log('Total files patched:', count);
