const API_URL = location.href.indexOf('herokuapp.com') > -1 ? 'https://facebook-hackathon-2019-team16.herokuapp.com/api/' : 'http://127.0.0.1:8080/api/';
const SOCKET_URL = location.href.indexOf('herokuapp.com') > -1 ? 'https://facebook-hackathon-2019-team16.herokuapp.com/' : 'http://127.0.0.1:8080/';

function getUserDetails(psid) {
  $.get(`${API_URL}get-user-messenger-details?psid=${psid}`, response => {
    if (response.error || !response.details.length) return {};
    return response.details;
  });
}

function displayPreviousMessages() {
  $.get(`${API_URL}messages?sender_psid=${window.chat.sender.psid}&recipient_psid=${window.chat.recipient.psid}`, response => {
    if (!response.messages.length) return;
    response.messages.forEach(m => addMessage(m.message, m.sender_psid.toString() === window.chat.sender.psid, new Date(m.timestamp)));
  });
}

function chosenRecipient(user) {
  window.chat.recipient.psid = user.user_psid;
  $('#friendsModal').modal('hide');

  // Recipient
  getUserDetails(user.user_psid, details => {
    $('#recipient-name').text(`${details.firstName} ${details.lastName}`);
    window.chat.recipient = {
      ...window.chat.recipient,
      firstName: details.firstName,
      lastName: details.lastName,
      avatar: details.avatar,
    };
  });

  // Sender
  getUserDetails(window.chat.sender.psid, details => {
    $('#sender-avatar').text(details.avatar);
    window.chat.sender = {
      ...window.chat.sender,
      firstName: details.firstName,
      lastName: details.lastName,
      avatar: details.avatar,
    };
  });

  displayPreviousMessages();
  connectSocket();
}

function chooseRecipient() {
  $('#friendsModal').modal({ show: true });
  const $friendsList = $('#friendsList');
  $.get(`${API_URL}users`, response => {
    if (!response.users.length) return $friendsList.text('You have no friends!');

    const $list = $('<ul/>');
    response.users.forEach(user => {
      if (user.user_psid.toString() === window.chat.sender.psid) return;
      $list.append($('<li/>', {
        'class': 'friend-option',
        // TODO make this a name
        text: user.user_psid,
        click: () => chosenRecipient(user),
      }));
    });
    $friendsList.append($list);
  });
}

function addMessage(message, isSender, timestamp) {
  const $container = $('<div/>');

  const $avatarDiv = $('<div/>', {
    'class': `user-avatar ${isSender ? 'sender' : 'recipient'}`,
    html: `<img src="${isSender ? window.chat.sender.avatar : window.chat.recipient.avatar}">`,
  });

  const $messageDiv = $('<div/>', {
    'class': `message ${isSender ? 'sender' : 'recipient'}`,
    text: message,
  });

  $container.append($avatarDiv).append($messageDiv);

  $('#chat-messages').append($container);
}

function connectSocket() {
  window.chat.socket = io(`${SOCKET_URL}?psid=${window.chat.sender.psid}&first_name=${window.chat.sender.firstName}&last_name=${window.chat.sender.lastName}`);
  window.chat.socket.on('connect', () => {
    console.log('socket connected');
  });

  window.chat.socket.on('disconnect', () => {
    console.log('socket disconnected');
  });

  window.chat.socket.on('message', data => {
    addMessage(data.message, false, data.timestamp);
  });
}

((chat) => {
  // TODO change this to be actual PSID from messenger
  window.chat.sender = { psid: window.chat.sender.psid || window.location.hash.substring(1) };
  window.chat.recipient = { psid: window.chat.recipient.psid || undefined };
  if (!window.chat.recipient.psid) chooseRecipient();

  $('#send-message').click(function () {
    const message = $('#user-message').val();
    window.chat.socket.emit('send_message', {
      force: false,
      recipientPsid: window.chat.recipient.psid,
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
})(window.chat = { sender: {}, recipient: {}} || window.chat);
