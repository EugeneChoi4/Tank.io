var socket = io.connect('https://echoifinal.sites.tjhsst.edu/', { path: '/socket.io/'  });
socket.emit('newPlayer')
 putPoints(0, 'player');

const cvs = document.getElementById('game-canvas');
const ctx = cvs.getContext('2d');
cvs.width = 1300;
cvs.height = 700;

function drawPlayer(player, color){
    ctx.beginPath();
    ctx.rect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
    ctx.font = "20px Arial";
    ctx.fillText(player.name, player.x, player.y+player.height+22);
}
function drawBullet(bullet){
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 15, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
}
socket.on('state', function(gameState){
    ctx.fillStyle = "rgb(100,0,100)";
    ctx.fillRect (0, 0, cvs.width, cvs.height);
    for (let player in gameState.players) {
        if(player == socket.id){
            drawPlayer(gameState.players[player], '#32a86f')
        }
        else{drawPlayer(gameState.players[player], '#a85e32')}
    }
    for(let bullet in gameState.bullets){
        drawBullet(gameState.bullets[bullet])
    }
})
socket.on('leader',function(points, name){
    putPoints(points, name);
})
const action = {
  up: false,
  down: false,
  left: false,
  right: false,
  click: false,
  coord: {x:0, y:0}
};
const keyDownHandler = function(e){
    if (e.keyCode == 68) {
        action.right = true;
    } else if (e.keyCode == 65) {
        action.left = true;
    } else if (e.keyCode == 87) {
        action.up = true;
    } else if (e.keyCode == 83) {
        action.down = true;
    }
};
const keyUpHandler = function(e){
    if (e.keyCode == 68) {
        action.right = false;
    }else if (e.keyCode == 65) {
        action.left = false;
    }else if (e.keyCode == 87) {
        action.up = false;
    }else if (e.keyCode == 83) {
        action.down = false;
    }
};
function getMousePosition(canvas, event) { 
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX-rect.left; 
    var y = event.clientY-rect.top; 
    action.coord.x = x;
    action.coord.y = y;
    action.click = true;
} 
setInterval(function(){
  socket.emit('action', action);
  action.click = false;
}, 1000 / 60);
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
cvs.addEventListener("mousedown", function(e) { getMousePosition(cvs,e); }); 

function putPoints(points, name) {
	 $.ajax({
            url: "worker",                   
            type: "get",                   
            data: "name="+name+"&points="+points,
            success: function(response) {
                r = document.getElementById("leader");
                r.innerHTML = response;
            },
            error: function (stat, err) {
                r = document.getElementById("leader");
                r.innerHTML = 'Oops'
            }       
    });
}