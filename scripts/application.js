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

// palette selection
var paletteSelector = document.getElementById("palette-selector");
paletteSelector.addEventListener("change", paletteChange, true);
var selectedPalette = 0;
var pixels, points, hue;

// zoom variables
var ratio = canvas.height / canvas.width;
var width = 3.5;
var height = ratio * width;
var coordLeft = -2.5;
var coordRight = coordLeft + width;
var coordBottom = -1;
var coordTop = coordBottom + height;

var currentImage;
var maxIteration = 1000;

var log2 = Math.log(2);

function reset() {
    width = 3.5;
    height = ratio * width;
    coordLeft = -2.5;
    coordRight = coordLeft + width;
    coordBottom = -1;
    coordTop = coordBottom + height;
    maxIteration = 1000;
    drawFractal();
}

function calculateFractal() {
    var t0 = performance.now();

    pixels = [];
    points = [];
    var histogram = Array(maxIteration + 1).fill(0);

    for (var py = -1; py <= canvas.height; py++) {
        var rowPixels = [];
        var rowPoints = [];
        for (var px = -1; px <= canvas.width; px++) {
            var worldCoord = pixelToWorld({x: px, y: py});
            var x = worldCoord.x;
            var y = worldCoord.y;
            var cx = 0.0;
            var cy = 0.0;

            var iteration = maxIteration;
            var p = Math.sqrt((x-0.25)*(x-0.25) + y*y);
            if (x >= p - 2*p*p + 0.25 ||
                (x+1)*(x+1) + y*y >= 1/16.0) {
                //escape time algorithm
                iteration = 0;
                var tmpX, tmpY;
                while (iteration < maxIteration && cx*cx + cy*cy < (1 << 16)) {
                    tmpX = cx;
                    tmpY = cy;
                    cx = cx*cx - cy*cy + x;
                    cy = 2*tmpX*cy + y;
                    if (cx == tmpX && cy == tmpY) {
                        break;
                    }
                    iteration++;
                }
            }
            rowPixels.push(iteration);
            rowPoints.push({x: cx, y: cy});
            histogram[iteration]++;
        }
        pixels.push(rowPixels);
        points.push(rowPoints)
    }

    // Histogram coloring
    var total = 0.0;
    hue = Array(maxIteration + 1).fill(0);
    for (var i = 0; i < histogram.length; i++) {
        total += histogram[i];
        for (var j = 0; j < i; j++) {
            hue[i] += histogram[j];
        }
    }

    for (var i = 0; i < histogram.length; i++) {
        hue[i] = Math.max(hue[i] / total, 0.000000001);
    }

    var t1 = performance.now();
    console.log("Calculating fractal took " + (t1 - t0) + " milliseconds.");
}

function showFractal() {
    var t0 = performance.now();

    canvas.width = canvas.width;
    for (var py = 1; py <= canvas.height; py++) {
        for (var px = 1; px <= canvas.width; px++) {
            if (pixels[py][px] != maxIteration) {
                // Smooth coloring (to avoid bands of color)
                var x = points[py][px].x;
                var y = points[py][px].y;
                var iter = pixels[py][px] + 1 - Math.log(Math.log(Math.sqrt(x*x + y*y))) / log2;

                var color = linearInterpolation(hue[Math.floor(iter)], hue[Math.floor(iter + 1)], iter%1);
                ctx.fillStyle = colorToRGBA(palettes[selectedPalette](color));
                ctx.fillRect(px - 1, py - 1, 1, 1);
            } else {
                ctx.fillStyle = colorToRGBA(palettes[selectedPalette](0));
                ctx.fillRect(px - 1, py - 1, 1, 1);
            }
        }
    }

    currentImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var t1 = performance.now();
    console.log("Displaying fractal took " + (t1 - t0) + " milliseconds.");
}

function drawFractal() {
    calculateFractal();
    showFractal();
}

/*function escapeTimeAlgorithm(cx, cy) {
    var iteration = 0;
    var x = 0.0;
    var y = 0.0;
    var tmpX, tmpY;
    while (iteration < maxIteration && x*x + y*y < (1 << 16)) {
        tmpX = x;
        tmpY = y;
        x = x*x - y*y + cx;
        y = 2*tmpX*y + cy;
        if (x == tmpX && y == tmpY) {
            return maxIteration;
        }
        iteration++;
    }
    return iteration;
}*/

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
    height = ratio * width;
    coordLeft = rect.x;
    coordRight = coordLeft + width;
    coordBottom = rect.y;
    coordTop = coordBottom + height;
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
    var h = rect.height * height / canvas.height;
    return {
        x: topLeft.x,
        y: topLeft.y - h,
        width: rect.width * width / canvas.width,
        height: h
    };
}

function pixelToWorld(coords) {
    return {x: coordLeft + (coords.x / canvas.width) * width,
            y: coordTop - (coords.y / canvas.height) * height};
}

var palettes = [
    // HSL
    function (val) {
        if (val == 0) {
            return [0, 0, 0];
        } else {
            return hslToRgb(val, 1, 0.5);
        }
    },
    // Black to green to white
    function (val) {
        val = logistic(val);
        if (val < 0.5) {
            // black to green
            return [0, Math.floor(val * 2 * 255), 0];
        } else {
            // green to white
            var rb = Math.floor((val - 0.5) * 2 * 255);
            return [rb, 255, rb];
        }
    }
];

function paletteChange() {
    selectedPalette = parseInt(paletteSelector.value);
    showFractal();
}

function logistic(val) {
    return 1 / (1 + Math.exp(-4*(val - 0.5)));
}

function interpolateColors(c1, c2, frac) {
    return [
        Math.floor(c1[0] * (1 - frac) + c2[0] * frac),
        Math.floor(c1[1] * (1 - frac) + c2[1] * frac),
        Math.floor(c1[2] * (1 - frac) + c2[2] * frac),
    ];
}

function linearInterpolation(v1, v2, frac) {
    return v1 * (1 - frac) + v2 * frac;
}

function colorToRGBA(palette) {
    return "rgba(" + palette[0] + ", " + palette[1] + ", " + palette[2] + ", 1)";
}

function avgColor(pixels, y, x) {
    var c1 = palette(pixels[y-1][x-1]);
    var c2 = palette(pixels[y-1][x]);
    var c3 = palette(pixels[y-1][x+1]);
    var c4 = palette(pixels[y][x-1]);
    var c5 = palette(pixels[y][x]);
    var c6 = palette(pixels[y][x+1]);
    var c7 = palette(pixels[y+1][x-1]);
    var c8 = palette(pixels[y+1][x]);
    var c9 = palette(pixels[y+1][x+1]);

    return [Math.floor((c1[0]+c2[0]+c3[0]+c4[0]+c5[0]+c6[0]+c7[0]+c8[0]+c9[0]) / 9.0),
            Math.floor((c1[1]+c2[1]+c3[1]+c4[1]+c5[1]+c6[1]+c7[1]+c8[1]+c9[1]) / 9.0),
            Math.floor((c1[2]+c2[2]+c3[2]+c4[2]+c5[2]+c6[2]+c7[2]+c8[2]+c9[2]) / 9.0)];
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

drawFractal();
