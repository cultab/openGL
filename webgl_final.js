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
var skyboxTexture;
var floorTexture;

// timing
var numberOfFrames = 0;
var previousTime = Date.now();
var currentTime;

// control
var mouseDown = false;
var deltaFresh = false;
var lastMouseX = null;
var lastMouseY = null; 
var currMouseX = null;
var currMouseY = null;
var deltaMouseX = 0;
var deltaMouseY = 0;

var mouseWheelAngle = 0;
// the above but in rads
var mouseWheelRads;
var mouseWheelChanged = false;

// easter egg things
var fallBackTimes = 0;
var fallBackRotationAngle = 0;
// the above but in rads
var fallBackRotationRads;
// keep track of how far away the chair back has slid
var fallBackPosition = [30.5, 0, 0.5];
var broke = false;

// contains canvas
var rect;
// angle and height of camera
var totalAngle = 0.0;
var totalHeight = 1.0;
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
        0.0,  1.0,
        1.0,  1.0,
        1.0,  0.0,
        0.0,  0.0,
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

	skyboxTexture = gl.createTexture();
	preprocessTextureImage("sky.jpg", skyboxTexture);

	floorTexture = gl.createTexture();
	preprocessTextureImage("light-wood3.jpg", floorTexture);
}

function preprocessTextureImage(imageURL, textureObject) {
	let imageObject = new Image();
    imageObject.onload = () => {
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
            console.log("Texture \"", imageURL, "\" mipmapped!");
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            console.log("Texture \"", imageURL, "\" could not be mipmapped as it's size is not a power of 2!");
        }
    };
	imageObject.src = imageURL;	
}

function isPowerOf2(value) {
    // console.log(value, (value & (value - 1)) == 0);
    return (value & (value - 1)) == 0;
}

/**
 * Use a texture unit for a texture.
 *
 * unit: the texture unit to use
 * texture the texture to use
 */
function useTextureUnitForTexture(unit, texture) {
	gl.activeTexture(gl.TEXTURE0 + unit);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(samplerPointer, unit);
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.vertexAttribPointer(textureCoordinatesAttributePointer, textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // #########################################
    // # Setup all the variables we will need. #
    // #########################################

    // first set up our camera
    let fov = parseFloat(document.getElementById("fov").value);
    // convert from degrees to rads
    fov = fov * Math.PI / 180.0;

    // if fov is zero or not a number set it to 90 degrees
    if (isNaN(fov) || fov <= 0) {
        fov = Math.PI / 2;
    }

    let viewDistance = parseFloat(document.getElementById("distance").value);
    // default value if textbox is not valid
    if (isNaN(viewDistance)) {
        viewDistance = 30.0;
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

    // only rotate if the animation is enabled 
    // and we are not using the mouse to move the camera
    if (!mouseDown && requestID) {
        totalAngle += rotationSpeed;
        // unwind camera rotation if angle is more than 1 full rotation
        if (totalAngle >= 2 * Math.PI) {
            console.log("Unwinding by 360deg..");
            totalAngle -= 2 * Math.PI;
        }
    }

    // apply mouse movement to camera
	if (mouseDown && deltaFresh){
		let x = deltaMouseX * Math.PI / 180.0
		totalAngle += x;
		let y = -deltaMouseY * Math.PI / 180.0
		totalHeight += y;
		deltaFresh = false;
	}

	// const c = Math.cos(totalAngle);
	// const s = Math.sin(totalHeight);

    cameraPos = [cameraPos[0] * 1 , cameraPos[1] * 1, cameraPos[2] * totalHeight]

    // #######################################
    // # Do all the linear algebra and draw. #
    // #######################################

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
    glMatrix.mat4.perspective(perspectiveMatrix, fov, aspect, 0.01, 600);

    // get product of view and perspective matricies
	glMatrix.mat4.multiply(perspectiveViewMatrix, perspectiveMatrix, viewMatrix);
    // also take into account rotation
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

    // begin drawing stool

    const stoolLegPositions = [
        [ 14.5,  4.5, 5],
        [ 14.5, -4.5, 5],
        [  5.5,  4.5, 5],
        [  5.5, -4.5, 5],
    ];

    // the point where the chair's back legs touch the floor
    const fallBackPoint = [15, 0, 0];

    // use texture unit 2 for chair legs
    useTextureUnitForTexture(2, chairLegTexture);

    for (let i = 0; i < stoolLegPositions.length; i++) {
        let pos = stoolLegPositions[i];
        let scale = [0.5, 0.5, 5];
        drawBox(pos, scale, mouseWheelRads, fallBackPoint);
    }

    // chair
    useTextureUnitForTexture(3, chairTexture);

    // stool top
    drawBox([10, 0, 10.5], [5, 5, 0.5], mouseWheelRads, fallBackPoint);

    if (fallBackTimes < 4) {
        // stool back [now it's a chair :) ]
        drawBox([14.5, 0, 16], [0.5, 5, 5], mouseWheelRads, fallBackPoint);
    } else {
        // now it's a chair again >:|
        fallBackRotationRads = fallBackRotationAngle * Math.PI / 180.0;
        // [30.5, 0, 0.5]
        // if the animation is enabled, animate the sliding and rotating
        if (requestID) {
            drawBox(fallBackPosition, [5, 5, 0.5], fallBackRotationRads, fallBackPosition, [0,0,1]);
            if (fallBackPosition[0] < 45) {
                fallBackRotationAngle += 2;
                fallBackPosition[0] += 0.5;
            }
        // else jump to the end
        } else {
            if (fallBackPosition[0] < 45) {
                fallBackRotationAngle += 2 * 29;
                fallBackPosition[0] += 0.5 * 29;
            }
            fallBackRotationRads = fallBackRotationAngle * Math.PI / 180.0;
            drawBox(fallBackPosition, [5, 5, 0.5], fallBackRotationRads, fallBackPosition, [0,0,1]);
        }

    }

    // skybox
    useTextureUnitForTexture(4, skyboxTexture);
    drawBox([0, 0, 0], [200, 200, 200]);

    // floor
    // enable polygon offset so that we don't get z-fighting
    // between the table/chair legs and the floor
	gl.enable(gl.POLYGON_OFFSET_FILL);
	gl.polygonOffset(-1.0,-1.0);

    useTextureUnitForTexture(5, floorTexture);
    // use a box with zero volume for the floor
    drawBox([0, 0, 0], [50, 50, 0]);

    // disable polygon offset
	gl.disable(gl.POLYGON_OFFSET_FILL);

    if (fallBackTimes == 4 && !broke) {
        // alert("Nice, you broke it :|");
        broke = true;
    }

}

/**
 * Draw a box
 *
 * position: the position of the box as [x, y, z]
 * scale: the scaling applied to the box (original box is 2x2x2)
 *
 */
function drawBox(position, scale, rotation=0, rotationPoint=[0,0,0], rotationAxis=[0,1,0]) {
    let scalingMatrix = new Float32Array(16);
    let translationMatrix = new Float32Array(16);
    let finalMatrix = new Float32Array(16);

    glMatrix.mat4.identity(finalMatrix);
    glMatrix.mat4.fromScaling(scalingMatrix, scale);
    glMatrix.mat4.fromTranslation(translationMatrix, position);

    // get rotation around point transformation
    let rotationMatrix = fromAxisRotationAroundPoint(rotation, rotationPoint, rotationAxis);
    // last
    glMatrix.mat4.multiply(finalMatrix, finalMatrix, rotationMatrix);

    // second
    glMatrix.mat4.multiply(finalMatrix, finalMatrix, translationMatrix);

    // first
    glMatrix.mat4.multiply(finalMatrix, finalMatrix, scalingMatrix);

    gl.uniformMatrix4fv(modelUniformPointer, false, finalMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttributePointer, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // finally, draw
    gl.drawElements(gl.TRIANGLES, indexBuffer.itemCount, gl.UNSIGNED_SHORT, 0);
}

/*
 * Return the transformation needed to rotate around a specific point.
 *
 * rotation: the angle in rads to rotate
 * point: the point around which to rotate
 *
 */

function fromAxisRotationAroundPoint(rotation, point, axis) {
    let rotationMatrix = new Float32Array(16);
    let backMatrix = new Float32Array(16);
    let moveMatrix = new Float32Array(16);
    let finalMatrix = new Float32Array(16);

    glMatrix.mat4.identity(finalMatrix);

    // used to get back to the original position
    let inverseOfPoint = [-point[0], -point[1], -point[2]];

    glMatrix.mat4.fromTranslation(backMatrix, point)
    // hard code rotation axis
    glMatrix.mat4.fromRotation(rotationMatrix, rotation, axis);
    glMatrix.mat4.fromTranslation(moveMatrix, inverseOfPoint)

    // last step, now move back to original position
    glMatrix.mat4.multiply(finalMatrix, finalMatrix, backMatrix);

    // apply the rotation
    glMatrix.mat4.multiply(finalMatrix, finalMatrix, rotationMatrix);

    // first step, move to the point around we want to rotate
    glMatrix.mat4.multiply(finalMatrix, finalMatrix, moveMatrix);

    return finalMatrix;
}

function handleMouseDown(event) {
	mouseDown = true;
	lastMouseX = event.clientX - rect.left;
	lastMouseY = rect.bottom - event.clientY;
	deltaMouseX = 0;
	deltaMouseY = 0;
	deltaFresh = true;
}

function handleMouseUp(event) {
    event; // here to stop the language server from complaining about it being unused
	mouseDown = false;
}

function handleMouseMove(event) {
	currMouseX = event.clientX - rect.left;
	currMouseY = rect.bottom - event.clientY;
	document.getElementById("mouseX").innerHTML = Math.floor(currMouseX);
	document.getElementById("mouseY").innerHTML = Math.floor(currMouseY);

	if (mouseDown)
	{
		deltaMouseX = currMouseX - lastMouseX;
		deltaMouseY = currMouseY - lastMouseY;
		deltaFresh = true;
	}

	if (!requestID && mouseDown) {
		drawScene();
	}

	lastMouseX = currMouseX;
	lastMouseY = currMouseY;
}

function handleMouseWheel(event) {
    // define how much each wheel turn changes the value ot mouseWheelAngle
    const step = 5;

    if (event.deltaY > 0) {
		mouseWheelAngle += step;
    }
    else {
		mouseWheelAngle -= step;
    }

    // mouseWheelAngle is in degrees

    // if the chair has fallen all the way back,
    // stop it from falling through the floor
    // also keep track if the user actually managed to
    // move the chair with his input
    if (mouseWheelAngle > 90) {
        mouseWheelAngle = 90;
        mouseWheelChanged = false;
    } else if (mouseWheelAngle < 0) {
        mouseWheelAngle = 0
        mouseWheelChanged = false;
    } else {
        mouseWheelChanged = true;
    }

    if (mouseWheelAngle == 90 && mouseWheelChanged) {
        fallBackTimes += 1;
    }

    // console.log(fallBackTimes);

    // convert to rads
    mouseWheelRads = mouseWheelAngle * Math.PI / 180.0

	if (!requestID) {
		drawScene();
	}
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
    setTimeout(() => { drawScene(); }, 1000);

    // setup callbacks for mouse control
	canvas.onmousedown = handleMouseDown;
	window.onmouseup = handleMouseUp;
	canvas.onmousemove = handleMouseMove;
	canvas.onwheel = handleMouseWheel;

	rect = canvas.getBoundingClientRect();

    // startAnimation();
}

function startAnimation() {
    if (requestID == 0)
        requestID = window.requestAnimationFrame(animationStep);
}

function animationStep() {
    drawScene();

	numberOfFrames++;
	currentTime = Date.now();

	if (currentTime - previousTime >= 1000)
	{
		document.getElementById("fps").innerHTML = numberOfFrames;
		numberOfFrames = 0;
		previousTime = currentTime;
	}

    requestID = window.requestAnimationFrame(animationStep);
}

function stopAnimation() {
    window.cancelAnimationFrame(requestID);
    requestID = 0;
}
