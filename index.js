const restify = require('restify');
const socketio = require('socket.io');
const sqlite = require('sqlite3');
const request = require('request');
const fs = require('fs');

const server = restify.createServer({
  name: 'Hackathon server',
  version: '1.0.0',
  socketio: true,
});
const io = socketio.listen(server.server);
const PAGE_ACCESS_TOKEN = 'EAAKnsfEUQQsBAAZCk3lnCSz4WtfVhi5BiMKwcs1aajfu79r6KA20byyPvMz4ZCPik0aEBlsRDSpx7X4eoGDOgSEyEYj2aoXI6T6noxKsRve79J7coU48ua20ZA4EOhntn5Bog3BGkj76uCayvx4NEuNt1QGZApvFbjZCdZBZCAOrwZDZD';

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(
  function crossOrigin(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);

server.get('/api/get-user-messenger-details', (req, res, next) => {
  request(
    {
      url: `https://graph.facebook.com/${req.query.psid}?fields=first_name,last_name,profile_pic&access_token=${PAGE_ACCESS_TOKEN}`,
      json: true,
    }, (err, resp, body) => {
      if (err) return res.send({ error: true, message: err.toString() });
      res.send({
        error: false,
        details: {
          firstName: body.first_name,
          lastName: body.last_name,
          avatar: body.profile_pic,
        },
      });
  });
});

server.get('/api/users', (req, res, next) => {
  db.all('SELECT * FROM users', (err, users) => {
    if (err) {
      console.log('Unable to get users from database', err);
      return res.send({ error: true, message: err.toString() });
    }

    res.send({ error: false, users });
  });
  next();
});

server.get('/api/messages', (req, res, next) => {
  if (!req.query.sender_psid || !req.query.recipient_psid) {
    return res.send({ error: true, message: 'Sender and Recipient PSIDs not specified ' });
  }

  db.all('SELECT * FROM messages WHERE sender_psid = ? AND recipient_psid = ?', req.query.sender_psid, req.query.recipient_psid, (err, messages) => {
    if (err) {
      console.log('Unable to get messages from database', err);
      return res.send({ error: true, message: err.toString() });
    }

    res.send({ error: false, messages });
  });
  next();
});

const db = new sqlite.Database('./chat.db', err => {
  if (err) throw new Error('Error opening Chat database: ' + err.toString());
});
console.log('connected to db');

const schema = fs.readFileSync('chat.sql').toString('utf-8');
db.exec(schema, err => {
  if (err) throw new Error('Error initialising database: ' + err.toString());
});
console.log('db initialised');

let clients = [];
function client(psid) {
  const c = clients.find(c => c.psid === psid.toString());
  return c ? c.socket : undefined;
}

io.sockets.on('connection', socket => {
  // `?psid=[blah]&first_name=[blah]&last_name=[blah]` should be appended to socket URL in client
  // Client should request https://graph.facebook.com/<PSID>?fields=first_name,last_name,profile_pic&access_token=<PAGE_ACCESS_TOKEN> to get details
  const psid = socket.handshake.query.psid;
  const firstName = socket.handshake.query.first_name;
  const lastName = socket.handshake.query.last_name;

  if (!psid) return socket.disconnect();

  console.log('user connected:', psid);
  db.run('INSERT OR IGNORE INTO users (user_psid, user_first_name, user_last_name) VALUES (?, ?, ?)', psid, firstName, lastName, err => {
    if (err) throw new Error('Error adding user to users table: ' + err.toString());
  });
  clients.push({ psid, socket });
  console.log(clients.map(c => c.psid));

  socket.on('disconnect', () => {
    console.log('user disconnected');
    clients = clients.filter(c => c.psid !== psid);
  });

  socket.on('send_message', (data, callback) => {
    // data = { force, recipientPsid, message, senderAvatar }
    console.log('user sent message', data);
    let rejected = false;

    if (!data.force) {
      // TODO check data.message, set rejected to true if needed
    }

    // Call callback in non-rejected state later -- only want to send if db insertion succeeds
    // Tell sender it was rejected
    if (rejected) return callback({ error: false, rejected });

    // TODO (future) send messenger websocket notification to recipient
    const timestamp = new Date().getTime();
    db.run('INSERT INTO messages (sender_psid, recipient_psid, message) VALUES (?, ?, ?)', psid, data.recipientPsid, data.message, err => {
      if (err) {
        // Tell sender there was an error sending
        callback({ error: true, message: err.toString(), rejected });
        return console.log('Error inserting message into db', err);
      }
      callback({ error: false, rejected: false, timestamp });

      // Send message to recipient
      const recipient = client(data.recipientPsid);
      if (recipient) {
        recipient.emit('message', {
          message: data.message,
          senderPsid: psid,
          senderAvatar: data.senderAvatar,
          timestamp,
        });
      } else {
        console.log('No recipient!', data.recipientPsid);
      }
    });
  });
});

server.get('/*', restify.plugins.serveStatic({
  directory: './chat-webview',
  default: 'index.html'
}));

server.listen(process.env.PORT || 8080, () => {
  console.log(`Restify API, Websocket and Webview Server running on port ${process.env.PORT || 8080}`);
});
