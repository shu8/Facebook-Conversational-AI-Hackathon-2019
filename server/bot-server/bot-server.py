from flask import Flask, request, jsonify
server = Flask(__name__)

PAGE_ACCESS_TOKEN = 'EAAKnsfEUQQsBAAZCk3lnCSz4WtfVhi5BiMKwcs1aajfu79r6KA20byyPvMz4ZCPik0aEBlsRDSpx7X4eoGDOgSEyEYj2aoXI6T6noxKsRve79J7coU48ua20ZA4EOhntn5Bog3BGkj76uCayvx4NEuNt1QGZApvFbjZCdZBZCAOrwZDZD'
VERIFY_TOKEN = 'hackathon' # XXX change in prod

FB_SUBSCRIBE_MODE = 'subscribe'

@server.route('/', methods=['GET', 'POST'])
def receive_message():
    return "Test"

@server.route('/webhook', methods=['GET'])
def verify_webhook():
    modeReceived = request.args.get('hub.mode')
    verifyTokenReceived = request.args.get('hub.verify_token')
    if modeReceived and verifyTokenReceived:
        if modeReceived == FB_SUBSCRIBE_MODE and verifyTokenReceived == VERIFY_TOKEN:
            print('webhook verified')
            return request.args.get('hub.challenge'), 200

        return jsonify({'error': True, 'message': 'Invalid verify token'}), 403


@server.route('/webhook', methods=['POST'])
def receive_webhook():
    json = request.get_json()
    if json.get('object') == 'page':
        for entry in json.get('entry'):
            print(entry)
        return 'EVENT_RECEIVED', 200
    return 'NOT FOUND', 404

server.run()
