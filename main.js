
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
var sphereRotation = [0,0,0];
var spherePosition = [-4,0,0];

var cubeRotation = [0,0,0];
var cubePosition = [-1,0,0];

var cylinderRotation = [0,0,0];
var cylinderPosition = [1.1,0,0];

var coneRotation = [0,0,0];
var conePosition = [0,0,0];

var time = [0, 0, 0];


/* OBJECT POSITIONS
 */

var rock1Position = [0, -5, 0];

var rock2Position = [-1.5, -5.5, 0];

var leftSeaweedBase = [-0.8, -4.5, 0];
var leftSeaweedRotation = [0,0,0];
var centreSeaweedBase = [-0, -4, 0];
var centreSeaweedRotation = [0,0,0];
var rightSeaweedBase = [0.8, -4.5, 0];
var rightSeaweedRotation = [0,0,0];

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


function render(timestamp) 
{
    
    let i;
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
		// That is the new position equals the current position + the rate of of change of that position (often a velocity or speed), times the change in time
		// We can do this with angles or positions, the whole x,y,z position or just one dimension. It is up to us!
		dt = (timestamp - prevTime) / 1000.0;
		prevTime = timestamp;
	}

	time[1] = time[1] + 30*dt;
	
	// Ground box
	gPush();
	{
		gTranslate(0, -5, 1);
		gPush(); // ground box CS
		{
			gPush(); // ground box CS
			{
				gScale(6, 1, 1);
				setColor(vec4(0, 0, 0, 1.0));
				// draw ground box
				drawCube();
			}
			gPop(); // ground box object -> CS, M = T(0,-5,0)

			gTranslate(-0.8, 1.25, 0);
			gPush(); // rock 1 CS
			{
				setColor(vec4(0.5, 0.5, 0.5, 1.0));
				gScale(0.25, 0.25, 1);

				// draw rock 1
				drawSphere();
			}
			gPop(); // rock 1 object -> CS, M = T(0,-5,0)T(0,1.5,0)
		}	
		gPop();	// Rock1CS -> groundboxCS, M = T(0,-5,0)
		
		gPush(); // Ground box CS
		{
			gTranslate(0, 1.5, 0);
			gPush(); // rock 2 CS
			{
				setColor(vec4(0.5, 0.5, 0.5, 1.0));
				gScale(0.5, 0.5, 1);
				drawSphere();
			}
			gPop(); // rock 2 object -> CS

			gPush(); // rock 2 CS
			{
				leftSeaweedRotation[1] = 7 * Math.cos(time[1] / 20);
				
				gTranslate(-0.4, 0.34, 0);
				gRotate(leftSeaweedRotation[1], 0, 0, 1);
				gPush(); // first seaweed section
				{
					gTranslate(0, 0.25, 0);
					gScale(0.1, 0.25, 1);
					setColor(vec4(0.0, 1.0, 0.0, 1.0));
					drawSphere();
				}
				gPop(); // first seaweed object -> CS
				
				for(let j = 0; j < 9; j++)
				{
					gTranslate(0, 0.5, 0);
					gRotate(leftSeaweedRotation[1], 0, 0, 1);
					gPush(); // seaweed section
					{
						gTranslate(0, 0.25, 0);
						gScale(0.1, 0.25, 1);
						setColor(vec4(0.0, 1.0, 0.0, 1.0));
						drawSphere();
					}
					gPop(); // seaweed object -> CS
				}
			}
			gPop(); // back to rock2 CS
			
			gPush();
			{
				centreSeaweedRotation[1] = 7 * Math.cos(time[1] / 20);
				gTranslate(0, 0.5, 0);
				gRotate(leftSeaweedRotation[1], 0, 0, 1);
				gPush(); // centre first seaweed section
				{
					gTranslate(0, 0.25, 0);
					gScale(0.1, 0.25, 1);
					setColor(vec4(0.0, 1.0, 0.0, 1.0));
					drawSphere();
				}
				gPop(); // C1S object -> CS

				for(let k = 0; k < 9; k++)
				{
					gTranslate(0, 0.5, 0);
					gRotate(leftSeaweedRotation[1], 0, 0, 1);
					gPush(); // seaweed section
					{
						gTranslate(0, 0.25, 0);
						gScale(0.1, 0.25, 1);
						setColor(vec4(0.0, 1.0, 0.0, 1.0));
						drawSphere();
					}
					gPop(); // seaweed object -> CS
				}
			}
			gPop();	// back to rock 1 CS

			gPush(); // rock 2 CS
			{
				leftSeaweedRotation[1] = 7 * Math.cos(time[1] / 20);

				gTranslate(0.4, 0.34, 0);
				gRotate(leftSeaweedRotation[1], 0, 0, 1);
				gPush(); // first seaweed section
				{
					gTranslate(0, 0.25, 0);
					gScale(0.1, 0.25, 1);
					setColor(vec4(0.0, 1.0, 0.0, 1.0));
					drawSphere();
				}
				gPop(); // first seaweed object -> CS

				for(let l = 0; l < 9; l++)
				{
					gTranslate(0, 0.5, 0);
					gRotate(leftSeaweedRotation[1], 0, 0, 1);
					gPush(); // seaweed section
					{
						gTranslate(0, 0.25, 0);
						gScale(0.1, 0.25, 1);
						setColor(vec4(0.0, 1.0, 0.0, 1.0));
						drawSphere();
					}
					gPop(); // seaweed object -> CS
				}
			}
			gPop(); // back to rock2 CS
			
			/* Fish time */
			gPush(); 
			{
				gRotate(-time[1] , 0, 1, 0);
				gTranslate(3, 0.75, 1);
				gTranslate(0, 0.5* Math.cos(time[1] / 19), 0);
				gPush(); 
				{
					gRotate(180, 1, 0, 0);
					gScale(0.5, 0.5, 2);
					setColor(vec4(1.0, 0.0, 0.0, 1.0));
					drawCone();
				}
				gPop(); // back to fish CS
				
				gPush(); // fish CS
				{
					gTranslate(0, 0, -1);
					var tailRotation = 30 * Math.cos(time[1] / 6 );
					
					gRotate(tailRotation, 0, 1, 0);
					gPush();
					{
						gRotate(30, 1, 0, 0);
						gTranslate(0, 0, -0.5);
						gScale(0.2, 0.2, 1);
						gRotate(180, 1, 0, 0);
						drawCone();
					}
					gPop(); // back to tail CS

					gPush();
					{
						gRotate(-30, 1, 0, 0);
						gTranslate(0, 0, -0.5);
						gScale(0.2, 0.2, 1);
						gRotate(180, 1, 0, 0);
						drawCone();
					}
					gPop(); // back to tail CS
				}
				gPop();// back to fish CS
				
				gPush(); // fish CS
				{
					gTranslate(0, 0, 1);
					gPush(); // fish head CS
					{
						gTranslate(0, 0, 0.25);
						gScale(0.5, 0.5, 0.5);
						setColor(vec4(0.5, 0.5, 0.5, 1.0));
						drawCone();
					}
					gPop(); // fish head object -> CS
					
					gPush(); // fish head
					{
						gTranslate(0.3, 0.2, 0.25);
						gPush(); // eye CS
						{
							gScale(0.1, 0.1, 0.1);
							setColor(vec4(1, 1, 1, 1.0));
							drawSphere();
						}
						gPop(); // back to eye CS
						
						gTranslate(0, 0, 0.1);
						gScale(0.05, 0.05, 0.05);
						setColor(vec4(0, 0, 0, 1.0));
						drawSphere();
					}
					gPop(); // back to fish head CS

					gPush(); // fish head CS
					{
						gTranslate(-0.3, 0.2, 0.25);
						gPush(); // eye CS
						{
							gScale(0.1, 0.1, 0.1);
							setColor(vec4(1, 1, 1, 1.0));
							drawSphere();
						}
						gPop(); // back to eye CS
						
						gTranslate(0, 0, 0.1);
						gScale(0.05, 0.05, 0.05);
						setColor(vec4(0, 0, 0, 1.0));
						drawSphere();
					}
					gPop(); // back to fish head CS
				}
				gPop(); // back to fish CS
			}
			gPop(); // back to rock2 CS
		}
		gPop(); // back to ground box CS
		
		gPush();
		{
			gTranslate(3, 6, 0);
			gRotate(-30, 0, 1, 0);
			gTranslate(0.6*Math.cos(time[1]/35), 0.6*Math.cos(time[1]/35), 0);
			gPush(); // diver CS
			{
				gPush(); // diver CS
				{
					setColor(vec4(0.7, 0.45, 0.9, 1.0));
					gScale(0.5, 0.8, 0.4);
					drawCube()
				}
				gPop(); // diver body object -> diver CS

				/* Draw Left Leg */
				gPush(); // diver CS
				{
					gTranslate(-0.3, -0.8, 0);
					gRotate(15*Math.cos(time[1]/30) + 20, 1, 0, 0);
					gPush(); // left thigh CS
					{
						gTranslate(0, -0.5, 0);
						gScale(0.15, 0.5, 0.15);
						drawCube();
					}
					gPop(); // left thigh object -> CS

					gTranslate(0, -1, 0);
					gRotate(15*Math.cos(time[1]/30) + 20, 1, 0, 0);
					gPush(); // left calf CS
					{
						gTranslate(0, -0.5, 0);
						gScale(0.15, 0.5, 0.15);
						drawCube();
					}
					gPop(); // left calf object -> CS

					gTranslate(0, -1, 0);
					gRotate(15*Math.cos(time[1]/30) + 20, 1, 0, 0);
					gPush(); // left foot CS
					{
						gTranslate(0, 0, 0.15);
						gScale(0.15, 0.1, 0.4);
						drawCube();
					}
					gPop(); // left foot object -> CS
				}
				gPop(); // back to diver CS

				/* Draw Right Leg */
				gPush(); // diver CS
				{
					gTranslate(0.3, -0.8, 0);
					gRotate(15*Math.sin(time[1]/30) + 20, 1, 0, 0);
					gPush(); // left thigh CS
					{
						gTranslate(0, -0.5, 0);
						gScale(0.15, 0.5, 0.15);
						drawCube();
					}
					gPop(); // left thigh object -> CS

					gTranslate(0, -1, 0);
					gRotate(15*Math.sin(time[1]/30) + 20, 1, 0, 0);
					gPush(); // left calf CS
					{
						gTranslate(0, -0.5, 0);
						gScale(0.15, 0.5, 0.15);
						drawCube();
					}
					gPop(); // left calf object -> CS

					gTranslate(0, -1, 0);
					gRotate(15*Math.sin(time[1]/30) + 20, 1, 0, 0);
					gPush(); // left foot CS
					{
						gTranslate(0, 0, 0.15);
						gScale(0.15, 0.1, 0.4);
						drawCube();
					}
					gPop(); // left foot object -> CS
				}
				gPop(); // back to diver CS
				
				gTranslate(0, 0.8, 0);
				gPush(); // head CS
				{
					gTranslate(0, 0.3, 0);
					gScale(0.3, 0.3, 0.3);
					drawSphere();
				}
				gPop(); // head object -> CS
			}
			gPop(); // back to diver CS
		}
		gPop(); // back to box CS
	}
	gPop(); // box CS -> world CS
    
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
