const API_URL = location.href.indexOf('herokuapp.com') > -1 ? 'https://facebook-hackathon-2019-team16.herokuapp.com/api/' : 'http://127.0.0.1:8080/api/';
const SOCKET_URL = location.href.indexOf('herokuapp.com') > -1 ? 'https://facebook-hackathon-2019-team16.herokuapp.com/' : 'http://127.0.0.1:8080/';

function chooseRecipient() {
  $('#friendsModal').modal({ show: true });
  const $friendsList = $('#friendsList');
  $.get(`${API_URL}users`, response => {
    if (!response.users.length) return $friendsList.text('You have no friends!');

    const $list = $('<ul/>');
    response.users.forEach(user => {
      if (user.user_psid.toString() === window.chat.senderPsid) return;
      $list.append($('<li/>', {
        'class': 'friend-option',
        // TODO make this a name
        text: user.user_psid,
        click: () => {
          chat.recipientPsid = user.user_psid;
          $('#friendsModal').modal('hide');
        },
      }));
    });
    $friendsList.append($list);
  });
}

function addMessage(message, isSender, timestamp) {
  $('#chat-messages').append($('<div/>', {
    'class': `message ${isSender ? 'sender' : 'recipient'}`,
    text: message,
  }));
}

((chat) => {
  chat.recipientPsid = chat.recipientPsid || undefined;
  chat.senderPsid = chat.senderPsid || window.location.hash.substring(1);
  if (!chat.recipientPsid) chooseRecipient();

  const socket = io(`${SOCKET_URL}?psid=${chat.senderPsid}&first_name=asd&last_name=qwe`);
  socket.on('connect', () => {
    console.log('socket connected');
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected');
  });

  socket.on('message', data => {
    console.log('NEW message', data);
    addMessage(data.message, false, data.timestamp);
  });

  $('#send-message').click(function () {
    const message = $('#user-message').val();
    socket.emit('send_message', {
      force: false,
      recipientPsid: chat.recipientPsid,
      message,
      senderAvatar: 'https://via.placeholder.com/150.png',
    }, data => {
        if (data.error) {
          // TODO handle error
          return;
        }

        if (data.rejected) {
          // TODO handle rejection
          return;
        }

        addMessage(message, true, data.timestamp);
    });
  });
})(chat = {} || window.chat);
