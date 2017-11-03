//canvas stuff
var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
//canvas.addEventListener("mousedown", mouseDown, true);
//canvas.focus();

var maxIteration = 1000;

draw();

function draw() {
    canvas.width = canvas.width;

    for (var py = 0; py < canvas.height; py++) {
        for (var px = 0; px < canvas.width; px++) {
            // scaled coordinates. x in (-2.5, 1). y in (-1, 1)
            var x = -2.5 + (px / canvas.width) * 3.5;
            var y = 1 - (py / canvas.height) * 2;
            var pos = new Complex(x, y);

            var iteration = 0;
            var c = new Complex();
            while (iteration < maxIteration && c.magnitudeSquared() < 4) {
                c.square();
                c.add(pos);
                iteration++;
            }
            ctx.fillStyle = palette(iteration);
            ctx.fillRect(px, py, 1, 1);
        }
    }
}

function palette(iteration) {
    var val = (maxIteration - iteration) / maxIteration;
    val = 1 / (1 + Math.exp(-6*(val - 0.5)));
    if (val < 0.5) {
        // black to green
        return "rgba(" + 0 + ", " + Math.floor(val * 2 * 255) + ", " + 0 + ", 1)";
    } else {
        // green to white
        var rb = Math.floor((val - 0.5) * 2 * 255)
        return "rgba(" + rb + ", " + 255 + ", " + rb + ", 1)";
    }
}

function Complex(r, i) {
    this.real = r === undefined ? 0.0 : r;
    this.imaginary = i === undefined ? 0.0 : i;
    this.add = function(other) {
        this.real += other.real;
        this.imaginary += other.imaginary;
    };
    this.square = function() {
        var tmp = this.real;
        this.real = this.real * this.real - this.imaginary * this.imaginary;
        this.imaginary *= 2 * tmp;
    };
    this.magnitudeSquared = function() {
        return this.real * this.real + this.imaginary * this.imaginary;
    };
};

/*
function mouseDown(event) {
    event.preventDefault();
    canvas.focus();
    for (var i = 0; i < states.length; i++)
        states[i].mouseDown(event);
}
*/

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
