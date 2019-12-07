const restify = require('restify');

const server = restify.createServer({
  name: 'Chat server',
  version: '1.0.0',
});

server.get('/*', restify.plugins.serveStatic({
  directory: './chat-webview',
  default: 'index.html'
}))

server.listen(process.env.PORT || 8083, () => {
  console.log(`Restify Chat Webview running on port ${process.env.PORT || 8083}`);
});
