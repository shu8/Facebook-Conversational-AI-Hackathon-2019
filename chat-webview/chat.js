const API_URL = location.href.indexOf('herokuapp.com') > -1 ? 'https://facebook-hackathon-2019-team16.herokuapp.com/api/' : 'https://519a1d7c.ngrok.io/api/'; //'http://127.0.0.1:8080/api/';
const SOCKET_URL = location.href.indexOf('herokuapp.com') > -1 ? 'https://facebook-hackathon-2019-team16.herokuapp.com/' : 'https://519a1d7c.ngrok.io'; //'http://127.0.0.1:8080/';
const APP_ID = '747332649107723';

function getUserDetails(psid) {
  $.get(`${API_URL}get-user-messenger-details?psid=${psid}`, response => {
    if (response.error || !response.details.length) return {};
    return response.details;
  });
}

function displayPreviousMessages() {
  $.get(`${API_URL}messages?sender_psid=${window.chat.sender.psid}&recipient_psid=${window.chat.recipient.psid}`, response => {
    if (!response.messages.length) return;
    response.messages.forEach(m =>
      addMessage(m.message, m.sender_psid.toString() === window.chat.sender.psid, new Date(m.timestamp))
    );
  });
}

function chosenRecipient(user) {
  window.chat.recipient.psid = user.user_psid;
  $('#friendsModal').modal('hide');

  // Recipient
  getUserDetails(user.user_psid, details => {
    $('#recipient-name').text(`${details.firstName} ${details.lastName}`);
    $('#recipient-avatar').html(`<img src="${details.avatar}">`);
    window.chat.recipient = {
      ...window.chat.recipient,
      firstName: details.firstName,
      lastName: details.lastName,
      avatar: details.avatar,
    };
  });

  // Sender
  getUserDetails(window.chat.sender.psid, details => {
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

function newMessageSendHandler(force = false) {
  const message = $('#user-message').val();
  window.chat.socket.emit('send_message', {
    force,
    recipientPsid: window.chat.recipient.psid,
    message,
    senderAvatar: 'https://via.placeholder.com/150.png',
  }, data => {
    if (data.error) {
      window.alert('There was an error', data.error);
      return;
    }

    if (data.rejected) {
      // TODO handle rejection
      $('#confirmModal').modal({ show: true });
      return;
    }

    $('#user-message').val('');
    addMessage(message, true, data.timestamp);
  });
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
        text: `${user.user_first_name} ${user.user_last_name}`,
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

  const $messages = $('#chat-messages');
  $messages.append($container);
  $messages.scrollTop($messages[0].scrollHeight);
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

(() => {
  // TODO do we need a name?
  MessengerExtensions.getContext(APP_ID, thread_context => {
    console.log(thread_context);
    window.chat.sender.psid = window.chat.sender.psid || thread_context.psid;
  }, err => {
    console.log('Error getting user ID from MessengerExtensions: error code', err);
  });

  window.chat.sender = { psid: window.chat.sender.psid || window.location.hash.substring(1) };
  window.chat.recipient = { psid: window.chat.recipient.psid || undefined };
  if (!window.chat.recipient.psid) chooseRecipient();
  if (!window.chat.sender.psid) return window.alert('Error getting current user!');

  $('#user-message').keypress(function (e) {
    if (e.which == 13) {
      newMessageSendHandler();
      return false;
    }
  });

  $('#send-message').click(newMessageSendHandler);

  $('#send-message-confirm').click(function () {
    newMessageSendHandler(true);
    $('#confirmModal').modal('hide');
  });

  $('#send-message-stop').click(function () {
    $('#confirmModal').modal('hide');
  });
})(window.chat = { sender: {}, recipient: {}} || window.chat);
