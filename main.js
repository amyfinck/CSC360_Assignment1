
var canvas;
var gl;

var program;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;

var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = false;
var controller;

// These are used to store the current state of objects.
// In animation it is often useful to think of an object as having some DOF
// Then the animation is simply evolving those DOF over time.

var time = [0, 0, 0]; // TODO remove


/* OBJECT POSITIONS */ 
 // TODO update

var groundBoxPosition = [0, -5, 0];
var groundBoxScale = [6, 1, 6];

var rock1Position = [-0.8, 1.25, 0];
var rock1Scale = [0.25, 0.25, 0.25];

var rock2Position = [0, 1.5, 0];
var rock2Scale = [0.5, 0.5, 0.5];

var leftSeaweedPosition = [-0.5, 0, 0];
var leftSeaweedRotation = [0,0,0];
var centreSeaweedPosition = [0, 0.5, 0];
var centreSeaweedRotation = [0,0,0];
var rightSeaweedPosition = [0.5, 0, 0];
var rightSeaweedRotation = [0,0,0];

var fishPosition = [2.5, 0.9, 1];
var fishRotation = [0, 0, 0];

var bubbleLocations = [];
var timeSinceLastBubble = 0;
var nextBubble = 0;

let drawBubbleStart = 0;
let drawBubbleEnd = 0;
let numberBubbles = 0;
let numberBubblesDrawn = 0;
let bubbleTime = 0;

// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse);
	
	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(20,program);
    Cone.init(20,program);
    Sphere.init(36, program, 1);

	// Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // Lighting Uniforms
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );


    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true;
            resetTimerFlag = true;
            window.requestAnimFrame(render);
        }
        //console.log(animFlag);
		
		controller = new CameraController(canvas);
		controller.onchange = function(xRot,yRot) {
			RX = xRot;
			RY = yRot;
			window.requestAnimFrame(render); };
    };

    render(0);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();   
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a sphere centered at the origin with variable radius.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
	setMV();
	Sphere.draw();
}


// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

function drawSeaweed(timestamp, seaweedRotation)
{
	let phaseShift = 0;
	gPush(); // first seaweed section
	{
		gTranslate(0, 0.25, 0);
		gScale(0.1, 0.25, 0.1);
		setColor(vec4(0.0, 0.5, 0.0, 1.0));
		drawSphere();
	}
	gPop(); // first seaweed object -> CS

	for(let j = 0; j < 9; j++)
	{
		gTranslate(0, 0.5, 0);
		phaseShift -= 55;
		seaweedRotation[2] = 16 * Math.cos(0.02 * (timestamp / 25  + phaseShift));
		gRotate(seaweedRotation[2], 0, 0, 1);
		gPush(); // seaweed section
		{
			gTranslate(0, 0.25, 0);
			gScale(0.1, 0.25, 0.1);
			setColor(vec4(0.0, 0.5, 0.0, 1.0));
			drawSphere();
		}
		gPop(); // seaweed object -> CS
	}
}

function drawEye()
{
	gPush();
	{
		gScale(0.1, 0.1, 0.1);
		setColor(vec4(1, 1, 1, 1.0));
		drawSphere();
	}
	gPop();

	gTranslate(0, 0, 0.1);
	gScale(0.05, 0.05, 0.05);
	setColor(vec4(0, 0, 0, 1.0));
	drawSphere();
}

function getWorldCoordinates(localx, localy, localz, modelViewMatrix)
{
	const localCoordinates = { x: localx, y: localy, z: localz }; // Adjust as needed

	// Apply the model-view matrix to transform to world coordinates
	return {
		x: modelViewMatrix[0][0] * localCoordinates.x + modelViewMatrix[0][1] * localCoordinates.y + modelViewMatrix[0][2] * localCoordinates.z + modelViewMatrix[0][3],
		y: modelViewMatrix[1][0] * localCoordinates.x + modelViewMatrix[1][1] * localCoordinates.y + modelViewMatrix[1][2] * localCoordinates.z + modelViewMatrix[1][3],
		z: modelViewMatrix[2][0] * localCoordinates.x + modelViewMatrix[2][1] * localCoordinates.y + modelViewMatrix[2][2] * localCoordinates.z + modelViewMatrix[2][3]
	};
}


function render(timestamp) 
{
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    eye = vec3(0,0,10);
    MS = []; // Initialize modeling matrix stack
	
	// initialize the modeling matrix to identity
    modelMatrix = mat4();
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);
   
    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
	
    // set all the matrices
    setAllMatrices();
    
	if( animFlag )
    {
		// dt is the change in time or delta time from the last frame to this one
		// in animation typically we have some property or degree of freedom we want to evolve over time
		// For example imagine x is the position of a thing.
		// To get the new position of a thing we do something called integration
		// the simpelst form of this looks like:
		// x_new = x + v*dt
		// That is the new position equals the current position + the rate of change of that position (often a velocity or speed), times the change in time
		// We can do this with angles or positions, the whole x,y,z position or just one dimension. It is up to us!
		dt = (timestamp - prevTime) / 1000.0;
		prevTime = timestamp;
	}

	// Ground box
	gPush();
	{
		gTranslate(groundBoxPosition[0], groundBoxPosition[1], groundBoxPosition[2]);
		gPush(); // ground box
		{
			gPush();
			{
				gScale(groundBoxScale[0], groundBoxScale[1], groundBoxScale[2]);
				setColor(vec4(0.1, 0.1, 0.1, 1.0));
				drawCube();
			}
			gPop();

			gTranslate(rock1Position[0], rock1Position[1], rock1Position[2]);
			gPush(); // rock 1
			{
				setColor(vec4(0.5, 0.5, 0.5, 1.0));
				gScale(rock1Scale[0], rock1Scale[1], rock1Scale[2]);
				drawSphere();
			}
			gPop(); // rock 1
		}	
		gPop();	// ground box
		
		gPush(); // ground box
		{
			gTranslate(rock2Position[0], rock2Position[1], rock2Position[2]);
			gPush(); // rock 2
			{
				setColor(vec4(0.5, 0.5, 0.5, 1.0));
				gScale(rock2Scale[0], rock2Scale[1], rock2Scale[2]);
				drawSphere();
			}
			gPop(); // rock 2

			gPush(); // left seaweed
			{
				gTranslate(leftSeaweedPosition[0], leftSeaweedPosition[1], leftSeaweedPosition[2]);
				drawSeaweed(timestamp, leftSeaweedRotation);
			}
			gPop(); // left seaweed
			
			gPush(); // centre seaweed
			{
				gTranslate(centreSeaweedPosition[0], centreSeaweedPosition[1], centreSeaweedPosition[2]);
				drawSeaweed(timestamp, centreSeaweedRotation);
			}
			gPop();	// centre seaweed
			
			gPush(); // right seaweed
			{
				gTranslate(rightSeaweedPosition[0], rightSeaweedPosition[1], rightSeaweedPosition[2]);
				drawSeaweed(timestamp, rightSeaweedRotation);
			}
			gPop(); // right seaweed
			
			gPush(); // fish
			{
				fishRotation[1] = -timestamp / 30
				gRotate(fishRotation[1], 0, 1, 0);
				
				gTranslate(2.5, 0.9, 1);
				gTranslate(0, 0.5 * Math.cos(timestamp / (Math.PI * 280)), 0);
				
				gPush(); // fish body
				{
					gRotate(180, 1, 0, 0);
					gScale(0.5, 0.5, 2);
					setColor(vec4(1.0, 0.0, 0.0, 1.0));
					drawCone();
				}
				gPop(); // fish body
				
				gPush(); // fish tail
				{
					gTranslate(0, 0, -1);
					var tailRotation = 30 * Math.cos(timestamp / 180 );
					
					gRotate(tailRotation, 0, 1, 0);
					gPush();
					{
						gRotate(30, 1, 0, 0);
						gTranslate(0, 0, -0.5);
						gScale(0.2, 0.2, 1);
						gRotate(180, 1, 0, 0);
						drawCone();
					}
					gPop();

					gPush();
					{
						gRotate(-30, 1, 0, 0);
						gTranslate(0, 0, -0.5);
						gScale(0.2, 0.2, 1);
						gRotate(180, 1, 0, 0);
						drawCone();
					}
					gPop();
				}
				gPop(); // fish tail
				
				gPush(); // fish head
				{
					gTranslate(0, 0, 1);
					gPush();
					{
						gTranslate(0, 0, 0.25);
						gScale(0.5, 0.5, 0.5);
						setColor(vec4(0.5, 0.5, 0.5, 1.0));
						drawCone();
					}
					gPop();
					
					gPush();
					{
						gTranslate(0.3, 0.2, 0.25);
						drawEye();
					}
					gPop();

					gPush();
					{
						gTranslate(-0.3, 0.2, 0.25);
						drawEye();
					}
					gPop();
				}
				gPop(); // fish head
			}
			gPop(); // fish
		}
		gPop(); // ground box
		
		gPush(); // ground box
		{
			gTranslate(4, 5, 0);
			gRotate(-30, 0, 1, 0);
			gTranslate(0.6*Math.cos(timestamp/(Math.PI * 360)), 0.6*Math.cos(timestamp/(Math.PI * 360)), 0);
			gPush(); // diver
			{
				gPush(); // diver body
				{
					setColor(vec4(0.7, 0.45, 0.9, 1.0));
					gScale(0.5, 0.8, 0.3);
					drawCube()
				}
				gPop(); // diver body

				gPush(); // diver left leg
				{
					gTranslate(-0.3, -0.8, 0);
					gRotate(15*Math.cos(timestamp/900) + 40, 1, 0, 0);
					gPush(); // left thigh CS
					{
						gTranslate(0, -0.5, 0);
						gScale(0.1, 0.5, 0.1);
						drawCube();
					}
					gPop();

					gTranslate(0, -1, 0);
					gRotate(15*Math.cos(timestamp/900) + 40, 1, 0, 0);
					gPush();
					{
						gTranslate(0, -0.5, 0);
						gScale(0.1, 0.5, 0.1);
						drawCube();
					}
					gPop();

					gTranslate(0, -1, 0);
					gPush();
					{
						gTranslate(0, 0, 0.15);
						gScale(0.1, 0.1, 0.4);
						drawCube();
					}
					gPop();
				}
				gPop(); // diver left leg

				gPush(); // diver right leg
				{
					gTranslate(0.3, -0.8, 0);
					gRotate(15*Math.sin(timestamp/900) + 40, 1, 0, 0);
					gPush();
					{
						gTranslate(0, -0.5, 0);
						gScale(0.1, 0.5, 0.1);
						drawCube();
					}
					gPop();

					gTranslate(0, -1, 0);
					gRotate(15*Math.sin(timestamp/900) + 40, 1, 0, 0);
					gPush();
					{
						gTranslate(0, -0.5, 0);
						gScale(0.1, 0.5, 0.1);
						drawCube();
					}
					gPop();

					gTranslate(0, -1, 0);
					gPush();
					{
						gTranslate(0, 0, 0.15);
						gScale(0.1, 0.1, 0.4);
						drawCube();
					}
					gPop();
				}
				gPop(); // diver right leg
				
				gTranslate(0, 0.8, 0);
				
				gPush(); // diver head
				{
					gTranslate(0, 0.3, 0);
					gScale(0.3, 0.3, 0.3);
					drawSphere();
					
					if(bubbleTime >= drawBubbleStart && timeSinceLastBubble > 0.4)
					{
						// save location of diver's head to add a bubble
						bubbleLocations.push(getWorldCoordinates(0, 0.3, 0, modelViewMatrix));
						timeSinceLastBubble = 0;
						numberBubblesDrawn += 1;
					}
					if(numberBubblesDrawn === numberBubbles)
					{
						// bubble group over, prepare for next group
						bubbleTime = 0;
						numberBubblesDrawn = 0;
						numberBubbles = Math.random() < 0.5 ? 4 : Math.random() < 0.75 ? 3 : 5; // 50% chance of 4, 25% chance of 3, 25% chance of 5
						drawBubbleStart = Math.random() * 3 + 3; // random interval of 100 - 200 frames until next bubble
					}
					bubbleTime += dt;
					timeSinceLastBubble += dt;
				}
				gPop(); // diver head
			}
			gPop(); // back to diver CS
		}
		gPop(); // ground box
	}
	gPop(); // world
	
	gPush();
	{
		for(let i = 0; i < bubbleLocations.length; i++) 
		{
			gPush();
			{
				let x = bubbleLocations[i].x;
				let y = bubbleLocations[i].y;
				let z = bubbleLocations[i].z;

				gTranslate(x, y, z + 16);
				gScale(0.1, 0.1, 0.1);
				gScale(0.1* Math.cos(timestamp/300) + 1 , 0.1*Math.sin(timestamp/300) + 1, 1, 0);

				setColor(vec4(1.0, 1.0, 1.0, 1.0));
				drawSphere();

				bubbleLocations[i].y += dt;

				if (bubbleLocations[i].y >= 10)
				{
					bubbleLocations.splice(i, 1);
				}
			}
			gPop();
		}
	}
	gPop();

    if( animFlag )
        window.requestAnimFrame(render);
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
	var controller = this;
	this.onchange = null;
	this.xRot = 0;
	this.yRot = 0;
	this.scaleFactor = 3.0;
	this.dragging = false;
	this.curX = 0;
	this.curY = 0;
	
	// Assign a mouse down handler to the HTML element.
	element.onmousedown = function(ev) {
		controller.dragging = true;
		controller.curX = ev.clientX;
		controller.curY = ev.clientY;
	};
	
	// Assign a mouse up handler to the HTML element.
	element.onmouseup = function(ev) {
		controller.dragging = false;
	};
	
	// Assign a mouse move handler to the HTML element.
	element.onmousemove = function(ev) {
		if (controller.dragging) {
			// Determine how far we have moved since the last mouse move
			// event.
			var curX = ev.clientX;
			var curY = ev.clientY;
			var deltaX = (controller.curX - curX) / controller.scaleFactor;
			var deltaY = (controller.curY - curY) / controller.scaleFactor;
			controller.curX = curX;
			controller.curY = curY;
			// Update the X and Y rotation angles based on the mouse motion.
			controller.yRot = (controller.yRot + deltaX) % 360;
			controller.xRot = (controller.xRot + deltaY);
			// Clamp the X rotation to prevent the camera from going upside
			// down.
			if (controller.xRot < -90) {
				controller.xRot = -90;
			} else if (controller.xRot > 90) {
				controller.xRot = 90;
			}
			// Send the onchange event to any listener.
			if (controller.onchange != null) {
				controller.onchange(controller.xRot, controller.yRot);
			}
		}
	};
}
