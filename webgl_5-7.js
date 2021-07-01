var gl;
var canvas;
var shadersProgram;

// shader pointers
var vertexPositionAttributePointer;
var vertexColorAttributePointer;
var modelUniformPointer;
var perspectiveViewUniformPointer;

// shader buffers
var vertexBuffer;
// var colorBuffer;
var indexBuffer;

function createGLContext(inCanvas) {
    let outContext = null;
    outContext = inCanvas.getContext("webgl");
    if (!outContext)
        outContext = inCanvas.getContext("experimental-webgl");
    if (!outContext)
        alert("WebGL rendering context creation error.");

    return outContext;
}

function createCompileShader(shaderType, shaderSource) {
    let outShader = gl.createShader(shaderType);
    gl.shaderSource(outShader, shaderSource);
    gl.compileShader(outShader);
    if (!gl.getShaderParameter(outShader, gl.COMPILE_STATUS)) {
        alert("Shader compilation error. " + gl.getShaderInfoLog(outShader));
        gl.deleteShader(outShader);
        outShader = null;
    }
    return outShader;
}

function initShaders() {
    let vertexShaderSource = document.getElementById("vShader").textContent;
    let fragmentShaderSource = document.getElementById("fShader").textContent;
    let vertexShader = createCompileShader(gl.VERTEX_SHADER, vertexShaderSource);
    let fragmentShader = createCompileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    shadersProgram = gl.createProgram();
    gl.attachShader(shadersProgram, vertexShader);
    gl.attachShader(shadersProgram, fragmentShader);
    gl.linkProgram(shadersProgram);
    if (!gl.getProgramParameter(shadersProgram, gl.LINK_STATUS)) {
        alert("Shaders linking error.");
    }
    gl.useProgram(shadersProgram);
    vertexPositionAttributePointer = gl.getAttribLocation(shadersProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttributePointer);
    vertexColorAttributePointer = gl.getAttribLocation(shadersProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttributePointer);

	perspectiveViewUniformPointer = gl.getUniformLocation(shadersProgram,"uPerspectiveViewTransform")
    modelUniformPointer = gl.getUniformLocation(shadersProgram, "uModelTransform");
}

function initBuffers() {
    // each group of 4 makes a face of the cube
    // each vertex appears in 3 faces
    let cubeVerticies = new Float32Array([
        // face 0
        -1.0, -1.0, -1.0, 1.0, // (00)
        -1.0, 1.0, -1.0, 1.0, // (01)
        -1.0, 1.0, 1.0, 1.0, // (02)
        -1.0, -1.0, 1.0, 1.0, // (03)
        // face 1
        -1.0, 1.0, -1.0, 1.0, // (10)
        1.0, 1.0, -1.0, 1.0, // (11)
        -1.0, 1.0, 1.0, 1.0, // (12)
        1.0, 1.0, 1.0, 1.0, // (13)
        // face 2
        1.0, 1.0, -1.0, 1.0, // (20)
        1.0, -1.0, 1.0, 1.0, // (21)
        1.0, 1.0, 1.0, 1.0, // (22)
        1.0, -1.0, -1.0, 1.0, // (23)
        // face 3
        -1.0, -1.0, -1.0, 1.0, // (30)
        -1.0, 1.0, -1.0, 1.0, // (31)
        1.0, 1.0, -1.0, 1.0, // (32)
        1.0, -1.0, -1.0, 1.0, // (33)
        // face 4
        -1.0, -1.0, -1.0, 1.0, // (40)
        -1.0, -1.0, 1.0, 1.0, // (41)
        1.0, -1.0, 1.0, 1.0, // (42)
        1.0, -1.0, -1.0, 1.0, // (43)
        // face 5
        1.0, -1.0, 1.0, 1.0, // (50)
        -1.0, 1.0, 1.0, 1.0, // (51)
        -1.0, -1.0, 1.0, 1.0, // (52)
        1.0, 1.0, 1.0, 1.0, // (53)
    ]);

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVerticies, gl.STATIC_DRAW);
    vertexBuffer.itemSize = 4;
    vertexBuffer.itemCount = 24;

    // // face N -> (R, G, B)
    // // each face has the same color
    // let cubeColors = new Float32Array([
    //     // face 0 -> (0, 255, 0) or #00FF00
    //     0.00, 1.00, 0.00, 1.0,
    //     0.00, 1.00, 0.00, 1.0,
    //     0.00, 1.00, 0.00, 1.0,
    //     0.00, 1.00, 0.00, 1.0,
    //     // face 1 -> (119, 179, 0) or #77b300
    //     0.47, 0.70, 0.0, 1.0,
    //     0.47, 0.70, 0.0, 1.0,
    //     0.47, 0.70, 0.0, 1.0,
    //     0.47, 0.70, 0.0, 1.0,
    //     // face 2 -> (0, 128, 21) or #008015
    //     0.00, 0.50, 0.08, 1.0,
    //     0.00, 0.50, 0.08, 1.0,
    //     0.00, 0.50, 0.08, 1.0,
    //     0.00, 0.50, 0.08, 1.0,
    //     // face 3 -> (0, 204, 102) or #00CC66
    //     0.00, 0.80, 0.40, 1.0,
    //     0.00, 0.80, 0.40, 1.0,
    //     0.00, 0.80, 0.40, 1.0,
    //     0.00, 0.80, 0.40, 1.0,
    //     // face 4 -> (187, 255, 51) or #BBFF33
    //     0.74, 1.00, 0.20, 1.0,
    //     0.74, 1.00, 0.20, 1.0,
    //     0.74, 1.00, 0.20, 1.0,
    //     0.74, 1.00, 0.20, 1.0,
    //     // face 5 -> (128, 255, 102) or #80FF66
    //     0.50, 1.00, 0.40, 1.0,
    //     0.50, 1.00, 0.40, 1.0,
    //     0.50, 1.00, 0.40, 1.0,
    //     0.50, 1.00, 0.40, 1.0,
    // ]);
    // colorBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
    // colorBuffer.itemSize = 4;
    // colorBuffer.itemCount = 24;

    // face indexes
    // 0, 1, 2, // face 0
    // 2, 0, 3,
    // 0, 1, 3, // face 1
    // 3, 2, 0,
    // 0, 2, 3, // face 2
    // 3, 1, 2,
    // 1, 2, 3, // face 3
    // 3, 0, 1,
    // 1, 2, 3, // face 4
    // 3, 0, 1,
    // 1, 3, 0, // face 5
    // 0, 2, 1,
    // real index = face index + (N * 3), where N = face
    let indexMatrix = new Uint16Array([
         0,  1,  2, // face 0
         2,  0,  3,
         4,  5,  7, // face 1 (+ 4)
         7,  6,  4,
         8, 10, 11, // face 2 (+ 8)
        11,  9, 10,
        13, 14, 15, // face 3 (+ 12)
        15, 12, 13,
        17, 18, 19, // face 4 (+ 16)
        19, 16, 17,
        21, 23, 20, // face 5 (+ 20)
        20, 22, 21,

    ]);
    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexMatrix, gl.STATIC_DRAW);
    indexBuffer.itemCount = 36;
}

function drawScene() {
    // init the randomizer with a the same seed on each draw
    // so we get the same face colors for each box every time
    initRandomizer(32);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // first set up our camera
    let fov = parseFloat(document.getElementById("fov").value)
    // convert from degrees to rads
    fov = fov * Math.PI / 180.0

    // if fov is zero or not a number set it to 90 degrees
    if (isNaN(fov) || fov <= 0) {
        fov = Math.PI / 2;
    }

    let viewDistance = parseFloat(document.getElementById("distance").value)
    // default value if textbox is not valid
    if (isNaN(viewDistance)) {
        viewDistance = 25.0;
    }

    // a vector of 3 values for the camera's position
    let cameraPos;

    let cameraLocationForm = document.getElementById("cameraLocation");

    // we will be using a RadioNodeList so older browsers might not work
    // see: https://developer.mozilla.org/en-US/docs/Web/API/RadioNodeList
    switch(cameraLocationForm.elements["choice"].value) {
    // radio button values are abbreviations
    // example: lft -> Left Front Top
    case "lft":
            cameraPos = [-viewDistance, -viewDistance, viewDistance];
            break;
    case "lfb":
            cameraPos = [-viewDistance, -viewDistance, -viewDistance];
            break;
    case "lbt":
            cameraPos = [-viewDistance, viewDistance, viewDistance];
            break;
    case "lbb":
            cameraPos = [-viewDistance, viewDistance, -viewDistance];
            break;
    case "rft":
            cameraPos = [viewDistance, -viewDistance, viewDistance];
            break;
    case "rfb":
            cameraPos = [viewDistance, -viewDistance, -viewDistance];
            break;
    case "rbt":
            cameraPos = [viewDistance, viewDistance, viewDistance];
            break;
    case "rbb":
            cameraPos = [viewDistance, viewDistance, -viewDistance];
            break;
    default:
            cameraPos = [viewDistance, viewDistance, viewDistance];
            console.log("Something wrong with cameraLocation?");
            break;
    }


    let viewMatrix = new Float32Array(16);
    let perspectiveMatrix = new Float32Array(16);
    let perspectiveViewMatrix = new Float32Array(16);

	glMatrix.mat4.identity(perspectiveViewMatrix);

    // (static) lookAt(out, eye, center, up) → {mat4}
	glMatrix.mat4.lookAt(viewMatrix, cameraPos, [0, 0, 0], [0, 0, 1]);

	// perspective(out, fovy, aspect, near, far)
	glMatrix.mat4.perspective(perspectiveMatrix, fov, 1, 0.01, 4 * viewDistance);

    // get product of view and perspective matricies
	glMatrix.mat4.multiply(perspectiveViewMatrix, perspectiveMatrix, viewMatrix);

    gl.uniformMatrix4fv(perspectiveViewUniformPointer, false, perspectiveViewMatrix);

    // begin drawing table

    let tableLegPositions = [
        [ 9,  9, 10],
        [ 9, -9, 10],
        [-9,  9, 10],
        [-9, -9, 10],
    ]

    let tableLegColors = [
        [1.0, 0.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],
        [1.0, 1.0, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
    ]

    // using the same scale for each leg
    // and a different position and color
    // draw the legs using drawBox()
    for (let i = 0; i < tableLegPositions.length; i++) {
        pos = tableLegPositions[i];
        color = tableLegColors[i];
        scale = [1, 1, 10];
        drawBox(pos, scale, color);
    }

    // table top
    drawBox([0, 0, 21], [10, 10, 1], [0.2, 0.8, 1.0, 1]);

    // floor
    // drawBox([0, 0,  0], [30, 30, 0], [0.6, 0.6, 0.6, 1]);

    // begin drawing stool

    let stoolLegPositions = [
        [ 14.5,  4.5, 5],
        [ 14.5, -4.5, 5],
        [  5.5,  4.5, 5],
        [  5.5, -4.5, 5],
    ]

    let stoolLegColors = [
        [0.0, 0.0, 1.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
    ]

    // using the same scale for each leg
    // and a different position and color
    // draw the legs using drawBox()
    for (let i = 0; i < stoolLegPositions.length; i++) {
        pos = stoolLegPositions[i];
        color = stoolLegColors[i];
        scale = [0.5, 0.5, 5];
        drawBox(pos, scale, color);
    }

    // stool top
    drawBox([10, 0, 10.5], [5, 5, 0.5], [0.0, 0.0, 1.0, 1]);
    // stool back [now it's a chair :) ]
    drawBox([14.5, 0, 16], [0.5, 5, 5], [0.0, 0.0, 1.0, 1]);

}

/**
 * Draw a box
 *
 * position: the position of the box as [x, y, z]
 * scale: the scaling applied to the box (original box is 2x2x2)
 * color: a color to base the face colors off
 */
function drawBox(position, scale, color) {
    let scalingMatrix = new Float32Array(16);
    let translationMatrix = new Float32Array(16);
    let finalMatrix = new Float32Array(16);

    glMatrix.mat4.fromScaling(scalingMatrix, scale);
    glMatrix.mat4.fromTranslation(translationMatrix, position);
    glMatrix.mat4.multiply(finalMatrix, translationMatrix, scalingMatrix);

    gl.uniformMatrix4fv(modelUniformPointer, false, finalMatrix);

    // one base color for each of the 24 verticies
    let cubeColors = new Array(24);

    // count of verticies, used to tell when we need to change to a new shade
    // when we switch to a new face of the box
    let vertexCount = 0;
    // shade of first face
    shade = shadeOf(color);

    for (let i = 0; i < 24; i++) {
        if (vertexCount == 4) {
            shade = shadeOf(color);
            vertexCount = 0;
        }
        vertexCount++;

        cubeColors[i] = shade;
    }

    // convert Array of colors to flat Float32Array
    let colorsFlat = new Float32Array(cubeColors.flat());

    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorsFlat, gl.STATIC_DRAW);
    colorBuffer.itemSize = 4;
    colorBuffer.itemCount = 24;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttributePointer, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(vertexColorAttributePointer, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawElements(gl.TRIANGLES, indexBuffer.itemCount, gl.UNSIGNED_SHORT, 0);
}

/**
 * Return a different shade of color
 * 
 * More accuratly return a slightly different color.
 *
 * color: the color
 * changeWeight: how much to change the color
 */
function shadeOf(color, changeWeight=0.38) {

    let shade = Array(4);

    // copy alpha from color to shade
    shade[3] = color[3];

    // color.length - 1 so as to not affect the alpha
    for (let i = 0; i < color.length - 1; i++) {
        let change = random() * changeWeight;
        shade[i] = color[i] + change - 0.05;

        // clip values to [0, 1]
        if (shade[i] < 0) {
            shade[i] = 0;
        } else if (shade[i] > 1) {
            shade[i] = 1;
        }

    }

    return shade;
}

/**
 * Init the random function with a seed.
 * The random function returns a random number between 0 and 1.
 *
 * The generator is a simple xorshift.
 * Code adapted from: https://www.udacity.com/blog/2021/04/javascript-random-numbers.html
 *
 * It uses a global variable called random that is assigned to the function
 * in order to make it callable in a global scope 
 * and a global called seed to keep track of the current seed.
 */
var random;
var seed;

function initRandomizer(seed=82) {
    random_func = function xorShift() {
        seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5;
        return (seed % 100) / 100;
    }

    random = random_func;
}

function main() {
    minDimension = Math.min(window.innerHeight, window.innerWidth);
    canvas = document.getElementById("sceneCanvas");
    canvas.width = 0.75 * minDimension;
    canvas.height = 0.75 * minDimension;
    gl = WebGLDebugUtils.makeDebugContext(createGLContext(canvas));
    initShaders();
    initBuffers();
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.enable(gl.DEPTH_TEST); // ΝΕΟ.4
    drawScene();
}
