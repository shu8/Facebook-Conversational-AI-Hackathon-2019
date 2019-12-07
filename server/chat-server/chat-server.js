const io = require('socket.io')(8080);
const sqlite = require('sqlite3');
const fs = require('fs');
const request = require('request');
const restify = require('restify');

const server = restify.createServer({
  name: 'Chat server',
  version: '1.0.0',
});
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.get('/users', (req, res, next) => {
  db.all('SELECT * FROM users', (err, users) => {
    if (err) {
      console.log('Unable to get users from database', err);
      return res.send({ error: true, message: err.toString() });
    }

    res.send({ error: false, users });
  })
});

server.get('/messages', (req, res, next) => {
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
});

server.listen(8081, () => {
  console.log('Restify Chat Server running on port 8081');
});

const db = new sqlite.Database('chat.db', err => {
  if (err) throw new Error('Error opening Chat database: ' + err.toString());
});
console.log('connected to db');

const schema = fs.readFileSync('chat.sql').toString('utf-8');
db.exec(schema, err => {
  if (err) throw new Error('Error initialising database: ' + err.toString());
});
console.log('db initialised');

let clients = [];
const client = psid => clients.find(c => c.psid === psid);

io.on('connection', socket => {
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

  socket.on('disconnect', () => {
    console.log('user disconnected', socket);
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

    // TODO (future) send websocket notification to recipient
    db.run('INSERT INTO messages (sender_psid, recipient_psid, message) VALUES (?, ?, ?)', psid, data.recipientPsid, data.message, err => {
      if (err) {
        // Tell sender there was an error sending
        callback({ error: true, message: err.toString(), rejected });
        return console.log('Error inserting message into db', err);
      }

      // Send message to recipient
      client(data.recipientPsid).send('message', {
        message: data.message,
        senderPsid: psid,
        senderAvatar: data.senderAvatar,
      });
    });
  });
});
