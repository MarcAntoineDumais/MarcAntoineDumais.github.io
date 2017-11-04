// canvas stuff
var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");

// events
canvas.addEventListener("mousedown", mouseDown, true);
canvas.addEventListener("mouseup", mouseUp, true);
canvas.addEventListener("mousemove", mouseMove, true);
document.getElementById("reset").onclick = reset;

var mousePressed = false;
var click;

// zoom variables
var ratio = Big(canvas.height / canvas.width);
var width = Big(3.5);
var height = ratio.times(width);
var coordLeft = Big(-2.5);
var coordRight = coordLeft.plus(width);
var coordBottom = Big(-1);
var coordTop = coordBottom.plus(height);

var currentImage;
var maxIteration = 1000;

drawFractal();

function reset() {
    width = Big(3.5);
    height = ratio.times(width);
    coordLeft = Big(-2.5);
    coordRight = coordLeft.plus(width);
    coordBottom = Big(-1);
    coordTop = coordBottom.plus(height);
    maxIteration = 1000;
    drawFractal();
}

function drawFractal() {
    canvas.width = canvas.width;

    for (var py = 0; py < canvas.height; py++) {
        for (var px = 0; px < canvas.width; px++) {
            var worldCoord = pixelToWorld({x: px, y: py});
            var pos = new Complex(worldCoord);

            var iteration = 0;
            var c = new Complex();
            while (iteration < maxIteration && c.magnitudeSquared().lt(4)) {
                c.square();
                c.add(pos);
                iteration++;
            }
            ctx.fillStyle = palette(iteration);
            ctx.fillRect(px, py, 1, 1);
        }
    }
    currentImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function drawRect(rect) {
    canvas.width = canvas.width;
    ctx.putImageData(currentImage, 0, 0);
    ctx.lineWidth="4";
    ctx.strokeStyle = "rgba(255, 187, 0, 1)";
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.stroke();
}

function zoom(rect) {    
    width = rect.width;
    height = ratio.times(width);
    coordLeft = rect.x;
    coordRight = coordLeft.plus(width);
    coordBottom = rect.y;
    coordTop = coordBottom.plus(height);
    maxIteration = 1000;
    drawFractal();
}

function mouseDown(event) {
    event.preventDefault();
    canvas.focus();

    click = eventToPixel(event);
    mousePressed = true;
}

function mouseUp(event) {
    if (mousePressed) {
        zoom(rectToWorld(clicksToRect(click, eventToPixel(event))));
    }
    mousePressed = false;
}

function mouseMove(event) {
    if (mousePressed) {
        drawRect(clicksToRect(click, eventToPixel(event)));
    }
}

function eventToPixel(event) {
    var rect = canvas.getBoundingClientRect();
    var x = Math.floor((event.clientX-rect.left)/(rect.right-rect.left)*canvas.width);
    var y = Math.floor((event.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);

    return {x: x, y: y};
}

function clicksToRect(click1, click2) {
    var rect = {width: Math.abs(click1.x - click2.x),
                height: Math.abs(click1.y - click2.y)};
    
    if (rect.width * ratio > rect.height) {
        rect.height = rect.width * ratio;
    } else if (rect.width * ratio < rect.height) {
        rect.width = rect.height / ratio;
    }
    
    if (click1.x < click2.x) {
        rect.x = click1.x;
    } else {
        rect.x = click1.x - rect.width;
    }
    
    if (click1.y < click2.y) {
        rect.y = click1.y;
    } else {
        rect.y = click1.y - rect.height;
    }
    
    return rect;
}

function rectToWorld(rect) {
    var topLeft = pixelToWorld(rect);
    var h = height.times(rect.height).div(canvas.height);
    return {
        x: topLeft.x,
        y: topLeft.y.minus(h),
        width: width.times(rect.width).div(canvas.width),
        height: h
    };
}

function pixelToWorld(coords) {
    return {x: coordLeft.plus(Big(coords.x / canvas.width).times(width)),
            y: coordTop.minus(Big(coords.y / canvas.height).times(height))};
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

function Complex(r, i) {
    if (i === undefined) {
        if (r === undefined) {
            this.real = Big(0.0);
            this.imaginary = Big(0.0);
        } else {
            this.real = Big(r.x);
            this.imaginary = Big(r.y);
        }
    } else {
        this.real = Big(r);
        this.imaginary = Big(i);
    }
    this.add = function(other) {
        this.real = this.real.plus(other.real);
        this.imaginary = this.imaginary.plus(other.imaginary);
    };
    this.square = function() {
        var tmp = this.real;
        this.real = this.real.pow(2).minus(this.imaginary.pow(2));
        this.imaginary = this.imaginary.times(tmp.times(2));
    };
    this.magnitudeSquared = function() {
        return this.real.pow(2).plus(this.imaginary.pow(2));
    };
};