const express = require('express');
const io = require('socket.io');
const path = require('path');
const PORT = process.env.PORT || 5000;

const app = express();

let ENusers = [];
let KOusers = [];

let server = app.use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/en/', (req, res) => res.render('pages/index', { REGION : "en" }))
    .get('/ko/', (req, res) => res.render('pages/index', { REGION : "ko" }))
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

let sio = io.listen(server);

const io_english = sio.of('/en');
const io_korean = sio.of('/ko');

io_english.on('connection', function(socket){

    // Increase user number
    ENusers.push(socket.id);

    // Init people & broadcast entering.
    socket.emit('init', ENusers);
    socket.broadcast.emit('enter', socket.id);
    console.log('[EN] user '+ socket.id  +' connected');

    // On Disconnect
    socket.on('disconnect', function(){
        console.log('[EN] user ' +  socket.id + ' disconnected');
        ENusers = removeFromArray(ENusers, socket.id);
        socket.broadcast.emit('exit', socket.id);
    });
});
















function removeFromArray(arr, el) {
    let index = arr.indexOf(el);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}
