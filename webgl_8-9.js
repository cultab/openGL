"use strict";
var gl;
var canvas;
var shadersProgram;

// shader pointers
var vertexPositionAttributePointer;
var modelUniformPointer;
var perspectiveViewUniformPointer;
var textureCoordinatesAttributePointer;
var samplerPointer;

// shader buffers
var vertexBuffer;
var indexBuffer;
var textureBuffer;

// textures
var tableTexture;
var tableLegTexture;
var chairTexture;
var chairLegTexture;

// angle of camera
var totalAngle = 0.0;
// used for animating
var requestID = 0;

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

	perspectiveViewUniformPointer = gl.getUniformLocation(shadersProgram,"uPerspectiveViewTransform")
    modelUniformPointer = gl.getUniformLocation(shadersProgram, "uModelTransform");

	textureCoordinatesAttributePointer = gl.getAttribLocation(shadersProgram, "aTextureCoordinates");
	gl.enableVertexAttribArray(textureCoordinatesAttributePointer);
    // vertex buffer
    // gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // gl.vertexAttribPointer(vertexPositionAttributePointer, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	samplerPointer = gl.getUniformLocation(shadersProgram, "uSampler");
}

function initBuffers() {
    // each group of 4 makes a face of the cube
    // each vertex appears in 3 faces
    const cubeVerticies = new Float32Array([
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
    // real index = face index + (N * 4), where N = face
    const indexMatrix = new Uint16Array([
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

	textureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    // front, left, back etc are from the perspective you would have sitting in the chair
    const textureCoordinates = [
        // face 0 (front)
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // face 1 (right)
        0.0,  1.0,
        0.0,  0.0,
        1.0,  1.0,
        1.0,  0.0,
        // face 2 (back)
        0.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        // face 3 (bottom)
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // face 4 (left)
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // face 5 (top)
        0.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
    ];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),gl.STATIC_DRAW); 
	textureBuffer.itemSize = 2;
	
	tableTexture = gl.createTexture();
	preprocessTextureImage("dark-wood.jpg", tableTexture);

	tableLegTexture = gl.createTexture();
	preprocessTextureImage("orange-wood.jpg", tableLegTexture);

	chairTexture = gl.createTexture();
	preprocessTextureImage("knit2.jpg", chairTexture);

	chairLegTexture = gl.createTexture();
	preprocessTextureImage("light-wood1.jpg", chairLegTexture);
}

function preprocessTextureImage(imageURL, textureObject) {
	let imageObject = new Image();
	imageObject.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, textureObject);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageObject);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        if (isPowerOf2(imageObject.width) && isPowerOf2(imageObject.height)) {
            // this code block is from https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
            // it's used to test textures without having to resize then to powers of 2
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            console.log("Texture \"", imageURL, "\" could not be mipmapped as it's size is not a power of 2!")
        }
    };
	imageObject.src = imageURL;	
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

/**
 * Use a texture unit for a texture.
 *
 * unit: the texture unit to use
 * texture the texture to use
 */
function useTextureUnitForTexture(unit, texture) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(samplerPointer, unit);
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.vertexAttribPointer(textureCoordinatesAttributePointer, textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
}
function drawScene() {
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

    let rotationSpeed = parseFloat(document.getElementById("rotationSpeed").value);
    if (isNaN(rotationSpeed)) {
        rotationSpeed = 0.01;
    }

    totalAngle += rotationSpeed;

    // unwind camera rotation if angle is more than 1 full rotation
	if (totalAngle >= 2 * Math.PI) {
		console.log("Unwinding by 360deg..");
		totalAngle -= 2 * Math.PI;
	}

    let viewMatrix = new Float32Array(16);
    let perspectiveMatrix = new Float32Array(16);
    let perspectiveViewMatrix = new Float32Array(16);
    let rotationZMatrix = new Float32Array(16);

	glMatrix.mat4.fromZRotation(rotationZMatrix, totalAngle);

	glMatrix.mat4.identity(perspectiveViewMatrix);

    // (static) lookAt(out, eye, center, up) → {mat4}
	glMatrix.mat4.lookAt(viewMatrix, cameraPos, [0, 0, 0], [0, 0, 1]);

    // instead of ascpect = 1, calculate it using the canvas's actual dimentions
    const aspect = canvas.clientWidth / canvas.clientHeight;
	// perspective(out, fovy, aspect, near, far)
	glMatrix.mat4.perspective(perspectiveMatrix, fov, aspect, 0.01, 4 * viewDistance);

    // get product of view and perspective matricies
	glMatrix.mat4.multiply(perspectiveViewMatrix, perspectiveMatrix, viewMatrix);
    // now also get rotation into account
	glMatrix.mat4.multiply(perspectiveViewMatrix, perspectiveViewMatrix, rotationZMatrix);

    gl.uniformMatrix4fv(perspectiveViewUniformPointer, false, perspectiveViewMatrix);

    // begin drawing table

    const tableLegPositions = [
        [ 9,  9, 10],
        [ 9, -9, 10],
        [-9,  9, 10],
        [-9, -9, 10],
    ];

    // use texture unit 0 for table legs
    useTextureUnitForTexture(0, tableLegTexture);

    // using the same scale and a different position for each leg
    // draw the legs using drawBox()
    for (let i = 0; i < tableLegPositions.length; i++) {
        let pos = tableLegPositions[i];
        let scale = [1, 1, 10];
        drawBox(pos, scale);
    }

    // use texture unit 1 for tabletop
    useTextureUnitForTexture(1, tableTexture);

    // table top
    drawBox([0, 0, 21], [10, 10, 1]);

    // floor
    // drawBox([0, 0,  0], [30, 30, 0], [0.6, 0.6, 0.6, 1]);

    // begin drawing stool

    const stoolLegPositions = [
        [ 14.5,  4.5, 5],
        [ 14.5, -4.5, 5],
        [  5.5,  4.5, 5],
        [  5.5, -4.5, 5],
    ];

    // use texture unit 2 for chair legs
    useTextureUnitForTexture(2, chairLegTexture);

    for (let i = 0; i < stoolLegPositions.length; i++) {
        let pos = stoolLegPositions[i];
        let scale = [0.5, 0.5, 5];
        drawBox(pos, scale);
    }

    // use texture unit 3 for chair
    useTextureUnitForTexture(3, chairTexture);

    // stool top
    drawBox([10, 0, 10.5], [5, 5, 0.5]);
    // stool back [now it's a chair :) ]
    drawBox([14.5, 0, 16], [0.5, 5, 5]);
}


/**
 * Draw a box
 *
 * position: the position of the box as [x, y, z]
 * scale: the scaling applied to the box (original box is 2x2x2)
 *
 */
function drawBox(position, scale) {
    let scalingMatrix = new Float32Array(16);
    let translationMatrix = new Float32Array(16);
    let finalMatrix = new Float32Array(16);

    glMatrix.mat4.fromScaling(scalingMatrix, scale);
    glMatrix.mat4.fromTranslation(translationMatrix, position);
    glMatrix.mat4.multiply(finalMatrix, translationMatrix, scalingMatrix);

    gl.uniformMatrix4fv(modelUniformPointer, false, finalMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttributePointer, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // finally, draw
    gl.drawElements(gl.TRIANGLES, indexBuffer.itemCount, gl.UNSIGNED_SHORT, 0);
}

function main() {
    const minDimension = Math.min(window.innerHeight, window.innerWidth);
    canvas = document.getElementById("sceneCanvas");
    canvas.width = 0.75 * minDimension;
    canvas.height = 0.75 * minDimension;
    gl = WebGLDebugUtils.makeDebugContext(createGLContext(canvas));
    initShaders();
    initBuffers();
    gl.clearColor(0.5, 0.5, 0.5, 1.0); // gray color
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.enable(gl.DEPTH_TEST);
    drawScene();
    // draw again after the images have (hopefully) loaded :wq
    setTimeout(() => { drawScene(); }, 500);
}

function startAnimation() {
    if (requestID == 0)
        requestID = window.requestAnimationFrame(animationStep);
}

function animationStep() {
    drawScene();
    requestID = window.requestAnimationFrame(animationStep);
}

function stopAnimation() {
    window.cancelAnimationFrame(requestID);
    requestID = 0;
}
