require('dotenv').config();
const express = require('express');
const io = require('socket.io');
const path = require('path');
const request = require('request');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000;
const compression = require('compression');
const minify = require('express-minify');
const uglifyEs = require('uglify-es');

const app = express();

if (app.settings.env !== "development") {
    const enforce = require('express-sslify');
    app.use(enforce.HTTPS({trustProtoHeader: true}));
}

app.use(compression());
app.use(minify({uglifyJsModule: uglifyEs,}));


let ENusers = [];
let KOusers = [];

let EditingUsers = new Array(16).fill(0);

let server = app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600 }))
    .use(bodyParser.json()) // support json encoded bodies
    .use(bodyParser.urlencoded({ extended: true })) // support encoded bodies
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/main', {URL: process.env.URL, SCORE:process.env.SCORE}))
    .get('/en/', (req, res) => res.render('pages/index', { REGION : "en" , URL: process.env.URL, SCORE:process.env.SCORE, DATE: ""}))
    .get('/en/:date/', (req, res) => res.render('pages/index', { REGION : "en" , URL: process.env.URL, SCORE:process.env.SCORE, DATE: req.params.date}))
//    .get('/ko/', (req, res) => res.render('pages/index', { REGION : "ko" , URL: URL}))
//     .post('/api/', function(req, res) {
//
//         request.post({
//             url:     keys.URL,
//             body:    req.body,
//             json: true
//         }, function(error, response, body){
//             if (body) {
//                 console.log(body);
//                 res.send(JSON.stringify(body));
//             }
//             else
//                 res.send(error);
//         });
//
//     })
    .get('*', (req, res) => res.redirect("/"))
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

let sio = io.listen(server);

const io_english = sio.of('/en');
// const io_korean = sio.of('/ko');

io_english.on('connection', function(socket){

    // Increase user number
    ENusers.push(socket.id);

    // Init people & broadcast entering.
    socket.emit('init', ENusers, EditingUsers);
    socket.broadcast.emit('enter', socket.id);
    console.log('[EN] user '+ socket.id  +' connected');

    // On Disconnect
    socket.on('disconnect', function(){
        console.log('[EN] user ' +  socket.id + ' disconnected');
        ENusers = removeFromArray(ENusers, socket.id);

        let i = EditingUsers.indexOf(socket.id);
        if (i > -1) {
            EditingUsers[i] = 0;
        }

        socket.broadcast.emit('exit', socket.id, i);
    });

    socket.on('startWriting', function(index){
        if (index < EditingUsers.length) {
            EditingUsers[index] = socket.id;
            socket.broadcast.emit('startWriting', socket.id, index);
        } else if (index >= EditingUsers.length) {
            socket.broadcast.emit('startWriting', socket.id, index);
        }
    });

    socket.on('cancelWriting', function(index){
        socket.broadcast.emit('cancelWriting', socket.id, index);
        EditingUsers = removeAndReplaceArrayEl(EditingUsers, socket.id, 0);
    });

    socket.on('finishWriting', function(index, isInsert){
        socket.broadcast.emit('finishWriting', socket.id, index, isInsert);
        EditingUsers = removeAndReplaceArrayEl(EditingUsers, socket.id, 0);
    });

});







function removeFromArray(arr, el) {
    let index = arr.indexOf(el);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

function removeAndReplaceArrayEl(arr, el, replaceTo) {
    let index = arr.indexOf(el);
    if (index > -1) {
        arr[index] = replaceTo;
    }
    return arr;
}

function getIpFromReq (req) { // get the client's IP address
    let bareIP = ":" + ((req.connection.socket && req.connection.socket.remoteAddress)
        || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "");
    return (bareIP.match(/:([^:]+)$/) || [])[1] || "127.0.0.1";
}
