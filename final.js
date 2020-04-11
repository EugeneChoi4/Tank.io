
var express = require('express')
var app = express();
var path = require('path')
var hbs = require('hbs');
var server =  require('http').createServer(app);
var io = require('socket.io').listen(server); 
var mysql = require('mysql');
var sqlParams = {
  connectionLimit : 10,
  user            : 'site_echoifinal',
  password        : 'Zmr7NXkMWgfPKkfTDFjfjZSb',
  host            : 'mysql1.csl.tjhsst.edu',
  port            : 3306,
  database        : 'site_echoifinal'
}
var pool  = mysql.createPool(sqlParams);

server.listen(process.env.PORT || 8080 );

app.set('view engine', 'hbs');
app.use('/js', express.static(path.join(__dirname, 'js')))
app.use('/css', express.static(path.join(__dirname, 'css')))
app.use(express.static('public'))


app.get('/', function (req, res, next) {
    res.render('form');
});
var username;
app.get('/game', function (req, res, next) {
    if('name' in req.query){
        username = req.query.name
        res.render('game');
    }
    else{
        res.redirect('https://echoifinal.sites.tjhsst.edu/s')
    }
});
app.get('/worker', function(req, res, next){
   pool.query("CALL leader(?, ?)", [req.query.name, req.query.points], function (error, results, fields) {
        if (error) throw error;
        var printData = "";
        for(i = 0; i < results[0].length; i++){
             printData += results[0][i]["username"] +" : " +  results[0][i]["score"] + " points<br><br>"
        }
        res.send(printData);
    }); 
});

const gameState = {
  players: {}, //key = socket.id, values = x, y, width, height
  bullets: {}   //key = socket.id, values = x, y
}

io.on('connection', function(socket){                  // called when a new socket connection is made
    console.log('new socket connection');
    socket.on('disconnect', function(){     //player has disconnected
        console.log('a player has disconnected');   
        delete gameState.players[socket.id]
    })
    socket.on('newPlayer', function(){      //new player has joined
        gameState.players[socket.id] = {
        x: Math.floor(Math.random() * 500),
        y: Math.floor(Math.random() * 500),
        width: 24,
        height: 24,
        name: username
    }})
    var interval;
    socket.on('action', function(action){
        const player = gameState.players[socket.id]
        const canvasWidth = 1300;
        const canvasHeight = 700;
        if (action.left && player.x > 0) {
            player.x -= 4
        }
        if (action.right && player.x < canvasWidth - player.width) {
            player.x += 4
        }
        if (action.up && player.y > 0) {
            player.y -= 4
        }
        if (action.down && player.y < canvasHeight - player.height) {
            player.y += 4
        }
        if(action.click && !interval){
            var angle = Math.atan((action.coord.y-(player.y+player.height/2))/(action.coord.x -(player.x+player.width/2)))
            var dx = Math.cos(angle)
            var dy = Math.sin(angle)
            if(player.x+player.width/2 > action.coord.x){
                dx*=-1
                dy*=-1
            }
            gameState.bullets[socket.id] = {x:player.x+player.width/2+player.width*dx, y:player.y+player.height/2+player.height*dy};
            var startTime = new Date().getTime();
            var xincr = 10*dx
            var yincr = 10*dy;
            interval = setInterval(function(){
                const curr = gameState.bullets[socket.id];
                for(id in gameState.players){
                    var user = gameState.players[id]
                    if(curr.x >= user.x && curr.x <= user.x+user.width && curr.y >= user.y && curr.y <= user.y+user.height){
                        gameState.players[socket.id].width+=10;
                        gameState.players[socket.id].height+=10;
                        io.sockets.emit('leader', gameState.players[socket.id].width-24, gameState.players[socket.id].name)
                        clearInterval(interval);
                        interval = null;
                        delete gameState.bullets[socket.id];
                        delete gameState.players[id];
                    }
                }
                if(curr.x < canvasWidth && curr.x > 0 && curr.y < canvasHeight && curr.y > 0){
                    curr.x+=xincr;
                    curr.y+=yincr;
                }
                else{
                    if(curr.x <=0 || curr.x >= canvasWidth){
                        xincr*=-1;
                    }
                    else{
                        yincr*=-1;
                    }
                    curr.x+=xincr;
                    curr.y+=yincr;
                }
                if(new Date().getTime() - startTime > 5000){
                    clearInterval(interval);
                    interval = null
                    delete gameState.bullets[socket.id]
                }
            }, 1000/60);   
        }
    })

});
setInterval(function(){
  io.sockets.emit('state', gameState);
}, 1000 / 60);