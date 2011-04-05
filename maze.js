/*
 ****************************************************
 * maze.js
 *
 * Author: <brandon.blodget@gmail.com>
 *
 * Copyright 2011 Brandon Blodget.  
 * All rights reserved.
 *
 * This script defines an API for drawing a
 * MicroMouse maze and controlling a mouse
 * inside the generated maze.
 * It requires an html5 capable web browser.
 *
 ****************************************************
 */


// The MicroMouse object.  This is the only variable
// we export to the global namespace.  The API is
// made available through this object.
var mouse;
if (!mouse) {
	mouse = {};
}

// start closure
(function () {

/*
 ****************************************************
 * Global variables to this closure
 ****************************************************
 */

// Note: For the maze the top left cell is
// (0,0)

var cWidth;	// the width of the maze in cells
var cHeight;	// the height of the maze in cells
var canvas; // the html5 canvas we draw on
var ctx;	// the canvas context
var pWidth;	// the width of maze in pixels
var pHeight; // the height of the maze in pixels
var pCellWidth; // width of a cell in pixels
var pCellHeight;	// height of a cell in pixels
var maze;		// data structure the reps the maze
var memMazeValue;	// mouses memory of cell values
var memMazeWall;	// mouses memory of the walls

var memMouseX;		// mouse x pos in cells
var memMouseY;		// mouse y pos in cells
var memMouseDir; 	// "N", "E", "S", or "W"

var cMouseX;	// mouse x pos in cells
var cMouseY;	// mouse y pos in cells
var pMouseX;	// mouse x pos in pixels
var pMouseY;	// mouse y pos in pixels
var tpMouseX;	// target x pos in pixels
var tpMouseY;	// target y pos in pixels
var mouseDir; 	// "N", "E", "S", or "W"
var aMouseDir;	// the angle direction of mouse
var taMouseDir;	// the target angle direction of mouse
var mRadius;	// mouse radius.
var turnDir;	// "R"ight, "L"eft, "N"one.

var driver; 	// user code that drives the mouse
var running;	// boolean. True if mouse is running
var timer_id;	// id of the running timer.

var stepMode;	// true if we are in stepping mode.

var ssButton;	// the start stop button

// constants
var turnAmount = 10;	// speed at which the mouse turns
var incAmount = 5;		// speed at which the mouse move
var outOfBounds = 401;   // constant for out of bound values


/*
 ****************************************************
 * Public API Functions
 ****************************************************
 */

// Creates a new maze and draws it to the
// canvas with the Id=maze
// ss_button: jQuery start/stop button
// maze_sel: string of selected maze.
if (typeof mouse.newMaze !== 'function') {
mouse.newMaze = function(ss_button,maze_sel) {
	ssButton = ss_button;
	setRunning(false);


	// default maze size is 16x16 cells
	cWidth = 16;	
	cHeight = 16;	

	canvas = document.getElementById("maze");
	ctx = canvas.getContext("2d");

	pWidth = canvas.width;
	pHeight = canvas.height;

	pCellWidth = pWidth/cWidth;
	pCellHeight = pHeight/cHeight;

	// init mouse starting mostion
	// bottom left square
	setHomePosition();

	// compute mouse radius
	if (pCellWidth > pCellHeight) {
		mRadius = Math.floor(pCellHeight/2) - 5;
	} else {
		mRadius = Math.floor(pCellWidth/2) - 5;
	}

	memInit();
	mouse.loadMaze(maze_sel);
};
}

if (typeof mouse.fwd !== 'function') {
mouse.fwd = function(cells) {
	var num = cells || 1;
	var i;

	for (i=0; i<num; i++) {
		switch (mouseDir) {
			case "N" : 
				if (maze[cMouseY][cMouseX].indexOf("N") !== -1) {
					cMouseY = cMouseY - 1;
				}
				break;
			case "E" : 
				if (maze[cMouseY][cMouseX].indexOf("E") !== -1) {
					cMouseX = cMouseX + 1; 
				}
				break;
			case "S" : 
				if (maze[cMouseY][cMouseX].indexOf("S") !== -1) {
					cMouseY = cMouseY + 1;
				}
				break;
			case "W" : 
				if (maze[cMouseY][cMouseX].indexOf("W") !== -1) {
					cMouseX = cMouseX - 1;
				}
				break;
		}
	}
	tpMouseX = cell2px();
	tpMouseY = cell2py();
	memMouseX = cMouseX;
	memMouseY = cMouseY;
};
}

if (typeof mouse.back !== 'function') {
mouse.back = function(cells) {
	var num = cells || 1;
	var i;

	for (i=0; i<num; i++) {
		switch (mouseDir) {
			case "N" : 
				if (maze[cMouseY][cMouseX].indexOf("S") !== -1) {
					cMouseY = cMouseY + 1;
				}
				break;
			case "E" : 
				if (maze[cMouseY][cMouseX].indexOf("W") !== -1) {
					cMouseX = cMouseX - 1; 
				}
				break;
			case "S" : 
				if (maze[cMouseY][cMouseX].indexOf("N") !== -1) {
					cMouseY = cMouseY - 1;
				}
				break;
			case "W" : 
				if (maze[cMouseY][cMouseX].indexOf("E") !== -1) {
					cMouseX = cMouseX + 1;
				}
				break;
		}
	}
	tpMouseX = cell2px();
	tpMouseY = cell2py();
	memMouseX = cMouseX;
	memMouseY = cMouseY;
};
}

if (typeof mouse.right !== 'function') {
mouse.right = function(turns) {
	var num = turns || 1;
	var i;

	turnDir = "R";
	taMouseDir = taMouseDir + (90*num);

	for (i=0; i<num; i++) {
		switch (mouseDir) {
			case "N" : 
				mouseDir = "E"; break;
			case "E" : 
				mouseDir = "S"; break;
			case "S" : 
				mouseDir = "W"; break;
			case "W" : 
				mouseDir = "N"; break;
		}
	}
	//memMouseX = cMouseX;
	//memMouseY = cMouseY;
	memMouseDir = mouseDir;
};
}

if (typeof mouse.left !== 'function') {
mouse.left = function(turns) {
	var num = turns || 1;
	var i;

	turnDir = "L";
	taMouseDir = taMouseDir - (90*num);

	for (i=0; i<num; i++) {
		switch (mouseDir) {
			case "N" : 
				mouseDir = "W"; break;
			case "E" : 
				mouseDir = "N"; break;
			case "S" : 
				mouseDir = "E"; break;
			case "W" : 
				mouseDir = "S"; break;
		}
	}
	memMouseDir = mouseDir;
};
}

if (typeof mouse.isPathLeft !== 'function') {
mouse.isPathLeft = function() {
	var goodDir = maze[cMouseY][cMouseX];

		switch (mouseDir) {
			case "N" : 
				if (goodDir.indexOf("W") === -1) {
					return false;
				}
				break;
			case "E" : 
				if (goodDir.indexOf("N") === -1) {
					return false;
				}
				break;
			case "S" : 
				if (goodDir.indexOf("E") === -1) {
					return false;
				}
				break;
			case "W" : 
				if (goodDir.indexOf("S") === -1) {
					return false;
				}
				break;
		}
		return true;
};
}

if (typeof mouse.isWallLeft !== 'function') {
mouse.isWallLeft = function() {
	return !(mouse.isPathLeft());
};
}

if (typeof mouse.isPathRight !== 'function') {
mouse.isPathRight = function() {
	var goodDir = maze[cMouseY][cMouseX];

		switch (mouseDir) {
			case "N" : 
				if (goodDir.indexOf("E") === -1) {
					return false;
				}
				break;
			case "E" : 
				if (goodDir.indexOf("S") === -1) {
					return false;
				}
				break;
			case "S" : 
				if (goodDir.indexOf("W") === -1) {
					return false;
				}
				break;
			case "W" : 
				if (goodDir.indexOf("N") === -1) {
					return false;
				}
				break;
		}
		return true;
};
}

if (typeof mouse.isWallRight !== 'function') {
mouse.isWallRight = function() {
	return !(mouse.isPathRight());
};
}

if (typeof mouse.isPathFwd !== 'function') {
mouse.isPathFwd = function() {
	var goodDir = maze[cMouseY][cMouseX];

		switch (mouseDir) {
			case "N" : 
				if (goodDir.indexOf("N") === -1) {
					return false;
				}
				break;
			case "E" : 
				if (goodDir.indexOf("E") === -1) {
					return false;
				}
				break;
			case "S" : 
				if (goodDir.indexOf("S") === -1) {
					return false;
				}
				break;
			case "W" : 
				if (goodDir.indexOf("W") === -1) {
					return false;
				}
				break;
		}
		return true;
};
}

if (typeof mouse.isWallFwd !== 'function') {
mouse.isWallFwd = function() {
	return !(mouse.isPathFwd());
};
}

if (typeof mouse.isPathBack !== 'function') {
mouse.isPathBack = function() {
	var goodDir = maze[cMouseY][cMouseX];

		switch (mouseDir) {
			case "N" : 
				if (goodDir.indexOf("S") === -1) {
					return false;
				}
				break;
			case "E" : 
				if (goodDir.indexOf("W") === -1) {
					return false;
				}
				break;
			case "S" : 
				if (goodDir.indexOf("N") === -1) {
					return false;
				}
				break;
			case "W" : 
				if (goodDir.indexOf("E") === -1) {
					return false;
				}
				break;
		}
		return true;
};
}

if (typeof mouse.isWallBack !== 'function') {
mouse.isWallBack = function() {
	return !(mouse.isPathBack());
};
}

if (typeof mouse.start !== 'function') {
mouse.start = function() {
	stepMode = false;
	if (driver && !running) {
		timer_id = setInterval(update,20);
		setRunning(true);
	}
};
}

if (typeof mouse.stop !== 'function') {
mouse.stop = function() {
	stepMode = true;
};
}

if (typeof mouse.step !== 'function') {
mouse.step = function() {
	stepMode = true;
	if (driver && !running) {
		timer_id = setInterval(update,20);
		setRunning(true);
	}
};
}

if (typeof mouse.loadDriver !== 'function') {
mouse.loadDriver = function(driverp) {
	driver = driverp;
	memInit();
	if (driver.load) {
		driver.load();
	}
	mouse.home();
};
}

if (typeof mouse.loadMaze !== 'function') {
mouse.loadMaze = function(maze_sel) {
	var maze_json = "mazes_json/" + maze_sel + ".json";

	// change menu selection
	$("#maze_sel").val(maze_sel).attr('selected','selected');

	$.getJSON(maze_json, function(json) {
		maze = json;
		drawMaze();
		drawMouse();
	});

};
}

if (typeof mouse.x !== 'function') {
mouse.x = function() {
	return cMouseX;
};
}

if (typeof mouse.y !== 'function') {
mouse.y = function() {
	return cMouseY;
};
}

if (typeof mouse.heading !== 'function') {
mouse.heading = function() {
	return mouseDir;
};
}

if (typeof mouse.home !== 'function') {
mouse.home = function() {
	mouse.stop();
	eraseMouse();
	setHomePosition();
	clearTimer();
	drawMouse();
};
}

if (typeof mouse.isHome !== 'function') {
mouse.isHome = function() {
	if (cMouseX === 0 &&
		cMouseY === 15 &&
		mouseDir === "N") {

		return true;
	} else {
		return false;
	}
};
}

if (typeof mouse.isGoal !== 'function') {
mouse.isGoal = function() {
   if ((cMouseX === 7 || cMouseX === 8) &&
       (cMouseY === 7 || cMouseY === 8)) {

		return true;
	} else {
		return false;
	}
};
}

// Mouse memory functions

if (typeof mouse.memSetPathLeft !== 'function') {
mouse.memSetPathLeft = function(setPath) {
	var paths = memMazeWall[memMouseY][memMouseX];

	if (setPath) {
		switch(memMouseDir) {
			case "N" :
				if (paths.indexOf("W") === -1) {
					paths = paths + "W";
				}
				break;
			case "E" :
				if (paths.indexOf("N") === -1) {
					paths = paths + "N";
				}
				break;
			case "S" :
				if (paths.indexOf("E") === -1) {
					paths = paths + "E";
				}
				break;
			case "W" :
				if (paths.indexOf("S") === -1) {
					paths = paths + "S";
				}
				break;
		}
	} else {
		switch(memMouseDir) {
			case "N" : paths.replace("W", ""); break;
			case "E" : paths.replace("N", ""); break;
			case "S" : paths.replace("E", ""); break;
			case "W" : paths.replace("S", ""); break;
		}
	}
	memMazeWall[memMouseY][memMouseX] = paths;
};
}

if (typeof mouse.memSetPathRight !== 'function') {
mouse.memSetPathRight = function(setPath) {
	var paths = memMazeWall[memMouseY][memMouseX];

	if (setPath) {
		switch(memMouseDir) {
			case "N" :
				if (paths.indexOf("E") === -1) {
					paths = paths + "E";
				}
				break;
			case "E" :
				if (paths.indexOf("S") === -1) {
					paths = paths + "S";
				}
				break;
			case "S" :
				if (paths.indexOf("W") === -1) {
					paths = paths + "W";
				}
				break;
			case "W" :
				if (paths.indexOf("N") === -1) {
					paths = paths + "N";
				}
				break;
		}
	} else {
		switch(memMouseDir) {
			case "N" : paths.replace("E", ""); break;
			case "E" : paths.replace("S", ""); break;
			case "S" : paths.replace("W", ""); break;
			case "W" : paths.replace("N", ""); break;
		}
	}
	memMazeWall[memMouseY][memMouseX] = paths;
};
}

if (typeof mouse.memSetPathFwd !== 'function') {
mouse.memSetPathFwd = function(setPath) {
	var paths = memMazeWall[memMouseY][memMouseX];

	if (setPath) {
		switch(memMouseDir) {
			case "N" :
				if (paths.indexOf("N") === -1) {
					paths = paths + "N";
				}
				break;
			case "E" :
				if (paths.indexOf("E") === -1) {
					paths = paths + "E";
				}
				break;
			case "S" :
				if (paths.indexOf("S") === -1) {
					paths = paths + "S";
				}
				break;
			case "W" :
				if (paths.indexOf("W") === -1) {
					paths = paths + "W";
				}
				break;
		}
	} else {
		switch(memMouseDir) {
			case "N" : paths.replace("N", ""); break;
			case "E" : paths.replace("E", ""); break;
			case "S" : paths.replace("S", ""); break;
			case "W" : paths.replace("W", ""); break;
		}
	}
	memMazeWall[memMouseY][memMouseX] = paths;
};
}

if (typeof mouse.memSetPathBack !== 'function') {
mouse.memSetPathBack = function(setPath) {
	var paths = memMazeWall[memMouseY][memMouseX];

	if (setPath) {
		switch(memMouseDir) {
			case "N" :
				if (paths.indexOf("S") === -1) {
					paths = paths + "S";
				}
				break;
			case "E" :
				if (paths.indexOf("W") === -1) {
					paths = paths + "W";
				}
				break;
			case "S" :
				if (paths.indexOf("N") === -1) {
					paths = paths + "N";
				}
				break;
			case "W" :
				if (paths.indexOf("E") === -1) {
					paths = paths + "E";
				}
				break;
		}
	} else {
		switch(memMouseDir) {
			case "N" : paths.replace("S", ""); break;
			case "E" : paths.replace("W", ""); break;
			case "S" : paths.replace("N", ""); break;
			case "W" : paths.replace("E", ""); break;
		}
	}
	memMazeWall[memMouseY][memMouseX] = paths;
};
}

//memIsPathLeft(): 

if (typeof mouse.memIsPathLeft !== 'function') {
mouse.memIsPathLeft = function() {
	var walls = memMazeWall[memMouseY][memMouseX];

	switch(memMouseDir) {
		case "N" :
			if (walls.indexOf("W") !== -1) {
				return true;
			}
			break;
		case "E" :
			if (walls.indexOf("N") !== -1) {
				return true;
			}
			break;
		case "S" :
			if (walls.indexOf("E") !== -1) {
				return true;
			}
			break;
		case "W" :
			if (walls.indexOf("S") !== -1) {
				return true;
			}
			break;
	}
	return false;
};
}

//memIsPathRight(): 
//memIsPathFwd(): 
//memIsPathBack(): 
//memSetValue(value): 
//memSetValueLeft(value): 
//memSetValueRight(value): 
//memSetValueFwd(value): 
//memSetValueBack(value): 
//memGetValue(): 
//memGetValueLeft(): 
//memGetValueRight(): 
//memGetValueFwd(): 
//memGetValueBack(): 
//memClearWalls(): 
//memClearValues(): 
//memClearAll(): 
//memSetPosAt(x,y,heading):


if (typeof mouse.setValue !== 'function') {
mouse.setValue = function(x,y,value) {
	memMazeValue[y][x] = value;
};
}

if (typeof mouse.value !== 'function') {
mouse.value = function(x,y) {
	return memMazeValue;
};
}

if (typeof mouse.setValueCurr !== 'function') {
mouse.setValueCurr = function(value) {
	memMazeValue[cMouseY][cMouseX] = value;
};
}

if (typeof mouse.valueCurr !== 'function') {
mouse.valueCurr = function() {
	return memMazeValue[cMouseY][cMouseX];
};
}

if (typeof mouse.valueLeft !== 'function') {
mouse.valueLeft = function() {
	var x=0;
	var y=0;
	switch (mouseDir) {
		case "N" : y = cMouseY; x = cMouseX-1; break;
		case "E" : y = cMouseY-1; x = cMouseX; break;
		case "S" : y = cMouseY; x = cMouseX+1; break;
		case "W" : y = cMouseY+1; x = cMouseX; break;
	}
	if (x>=0 && x<cWidth &&
	    y>=0 && y<cHeight) {

		return memMazeValue[y][x];
	} else {
		return outOfBounds; 
	}
};
}

if (typeof mouse.valueRight !== 'function') {
mouse.valueRight = function() {
	var x=0;
	var y=0;
	switch (mouseDir) {
		case "N" : y = cMouseY; x = cMouseX+1; break;
		case "E" : y = cMouseY+1; x = cMouseX; break;
		case "S" : y = cMouseY; x = cMouseX-1; break;
		case "W" : y = cMouseY-1; x = cMouseX; break;
	}
	if (x>=0 && x<cWidth &&
	    y>=0 && y<cHeight) {

		return memMazeValue[y][x];
	} else {
		return outOfBounds; 
	}
};
}

if (typeof mouse.valueFwd !== 'function') {
mouse.valueFwd = function() {
	var x=0;
	var y=0;
	switch (mouseDir) {
		case "N" : y = cMouseY-1; x = cMouseX; break;
		case "E" : y = cMouseY; x = cMouseX+1; break;
		case "S" : y = cMouseY+1; x = cMouseX; break;
		case "W" : y = cMouseY; x = cMouseX-1; break;
	}
	if (x>=0 && x<cWidth &&
	    y>=0 && y<cHeight) {

		return memMazeValue[y][x];
	} else {
		return outOfBounds; 
	}
};
}

if (typeof mouse.valueBack !== 'function') {
mouse.valueBack = function() {
	var x=0;
	var y=0;
	switch (mouseDir) {
		case "N" : y = cMouseY+1; x = cMouseX; break;
		case "E" : y = cMouseY; x = cMouseX-1; break;
		case "S" : y = cMouseY-1; x = cMouseX; break;
		case "W" : y = cMouseY; x = cMouseX+1; break;
	}
	if (x>=0 && x<cWidth &&
	    y>=0 && y<cHeight) {

		return memMazeValue[y][x];
	} else {
		return outOfBounds; 
	}
};
}


// FIXME: needs to be generalized.  Right now it is hardcoded
// for a 16x16 maze.
if (typeof mouse.setValueFlood !== 'function') {
mouse.setValueFlood = function() {
	var x, y;
	var row_start;
	var val;
	var str="";

	// Quad 1: top left 
	str = "Quad 1\n";
	row_start = 14;
	for (y=0;y<8;y++) {
		val = row_start;
		for (x=0;x<8;x++) {
			memMazeValue[y][x] = val;
			str = str + val + " ";
			val--;
		}
		row_start--;
		str = str + "\n";
	}
	console.log(str);

	// Quad 2: top right 
	str = "Quad 2\n";
	row_start = 7;
	for (y=0;y<8;y++) {
		val = row_start;
		for (x=8;x<16;x++) {
			memMazeValue[y][x] = val;
			str = str + val + " ";
			val++;
		}
		row_start--;
		str = str + "\n";
	}
	console.log(str);

	// Quad 3: bottom left 
	str = "Quad 3\n";
	row_start = 7;
	for (y=8;y<16;y++) {
		val = row_start;
		for (x=0;x<8;x++) {
			memMazeValue[y][x] = val;
			str = str + val + " ";
			val--;
		}
		row_start++;
		str = str + "\n";
	}
	console.log(str);
	
	// Quad 4: bottom right 
	str = "Quad 4\n";
	row_start = 0;
	for (y=8;y<16;y++) {
		val = row_start;
		for (x=8;x<16;x++) {
			memMazeValue[y][x] = val;
			str = str + val + " ";
			val++;
		}
		row_start++;
		str = str + "\n";
	}
	console.log(str);

};
}

/*
 ****************************************************
 * Private Functions
 ****************************************************
 */

function drawMaze() {
	var x;
	var y;
	var px;
	var py;
	var code;

	// clear canvas
	canvas.width = canvas.width;

	for (y=0;y<cHeight;y++) {
		for (x=0;x<cWidth;x++) {
			code = maze[y][x];
			px = x * pCellWidth;
			py = y * pCellHeight;

			// north wall
			ctx.beginPath();
			ctx.moveTo(px,py);
			ctx.lineTo(px+pCellWidth,py);
			if (code.indexOf("N") !== -1) {
				ctx.strokeStyle="white";
			} else {
				ctx.strokeStyle="blue";
			}
			ctx.stroke();

			// east wall
			ctx.beginPath();
			ctx.moveTo(px+pCellWidth,py);
			ctx.lineTo(px+pCellWidth,py+pCellHeight);
			if (code.indexOf("E") !== -1) {
				ctx.strokeStyle="white";
			} else {
				ctx.strokeStyle="blue";
			}
			ctx.stroke();

			// south wall
			ctx.beginPath();
			ctx.moveTo(px+pCellWidth,py+pCellHeight);
			ctx.lineTo(px,py+pCellHeight);
			if (code.indexOf("S") !== -1) {
				ctx.strokeStyle="white";
			} else {
				ctx.strokeStyle="blue";
			}
			ctx.stroke();

			// west wall
			ctx.beginPath();
			ctx.moveTo(px,py+pCellHeight);
			ctx.lineTo(px,py);
			if (code.indexOf("W") !== -1) {
				ctx.strokeStyle="white";
			} else {
				ctx.strokeStyle="blue";
			}
			ctx.stroke();
		}
	}
}

function rads(degrees) {
	return (Math.PI/180)*degrees;
}

function eraseMouse() {
	var px, py;

	px = pMouseX - (pCellWidth-2)/2;
	py = pMouseY - (pCellHeight-2)/2;

	ctx.clearRect(px,py,pCellWidth-3, pCellHeight-3);
	//ctx.strokeStyle = "#000";
	//ctx.stroke();

}


function drawMouse() {
	var r;	// radius

	ctx.beginPath();
	ctx.arc(pMouseX,pMouseY,mRadius,rads(aMouseDir),
		rads(aMouseDir+360),false); // Outer circle
	ctx.lineTo(pMouseX,pMouseY);
	/*
	ctx.moveTo(110,75);
	ctx.arc(75,75,35,0,Math.PI,false);   // Mouth (clockwise)
	ctx.moveTo(65,65);
	ctx.arc(60,65,5,0,Math.PI*2,true);  // Left eye
	ctx.moveTo(95,65);
	ctx.arc(90,65,5,0,Math.PI*2,true);  // Right eye
	*/
	ctx.closePath();
	ctx.strokeStyle = "#000";
	ctx.stroke();
}

function clearTimer() {
	if (running && timer_id) {
		clearInterval(timer_id);
		setRunning(false);
	}
}

function setRunning(isRunning) {
	if (isRunning) {
		running = true;
		ssButton.html('Stop');

	} else {
		running = false;
		ssButton.html('Start');
	}
}

function update() {
	var dirDiff;
	var xDiff;
	var yDiff;

	// if we are all up to date then run the
	// next user command.
	if (pMouseX === tpMouseX &&
		pMouseY === tpMouseY &&
		aMouseDir === taMouseDir) {

		driver.next();

		if (stepMode) {
			clearTimer();
			return;
		}

	}

	eraseMouse();

	// turn first then move
	dirDiff = Math.abs(aMouseDir - taMouseDir);
	if (dirDiff > turnAmount) {
		if (turnDir === "R") {
			aMouseDir+=turnAmount;
		} else {
			aMouseDir-=turnAmount;
		}
		drawMouse();
		return;
	} else {
		if (aMouseDir !== taMouseDir) {
			aMouseDir = taMouseDir;
			drawMouse();
			return;
		}
	}

	xDiff = Math.abs(pMouseX - tpMouseX);
	if (xDiff > incAmount) {
		if (pMouseX < tpMouseX) {
			pMouseX+=incAmount;
		} else {
			pMouseX-=incAmount;
		}
	} else {
		if (pMouseX !== tpMouseX) {
			pMouseX = tpMouseX;
		}
	}

	yDiff = Math.abs(pMouseY - tpMouseY);
	if (yDiff > incAmount) {
		if (pMouseY < tpMouseY) {
			pMouseY+=incAmount;
		} else {
			pMouseY-=incAmount;
		}
	} else {
		if (pMouseY !== tpMouseY) {
			pMouseY = tpMouseY;
		}
	}


	drawMouse();
}

function cell2px() {
	return ((cMouseX * pCellWidth) + (pCellWidth/2));
}

function cell2py() {
	return ((cMouseY * pCellHeight) + (pCellHeight/2));
}

function head2angle() {
	switch(mouseDir) {
		case "N" : return -90;
		case "E" : return 0;
		case "S" : return 90;
		case "W" : return 180;
	}
	return 0;
}

/* Home position is the lower left cell.
 * This cell is (0,15)
 */
function setHomePosition() {
	cMouseX = 0;
	cMouseY = cHeight - 1;
	mouseDir = "N";
	pMouseX = cell2px();
	pMouseY = cell2py();
	tpMouseX = pMouseX;
	tpMouseY = pMouseY;
	aMouseDir = head2angle();
	taMouseDir = head2angle();
	turnDir = "N";
	stepMode = false;
	memMouseX = cMouseX;
	memMouseY = cMouseY;
	memMouseDir = mouseDir;
}

function memInit() {
	var x, y;
	memMazeValue = [];
	memMazeWall = [];
	for (y=0;y<cHeight;y++) {
		memMazeValue[y] = [];
		memMazeWall[y] = [];
		for (x=0;x<cWidth;x++) {
			memMazeValue[y][x] = 0;
			memMazeWall[y][x] = "";
		}
	}
}

}());


