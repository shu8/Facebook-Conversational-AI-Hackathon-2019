# -*- coding: utf-8 -*-

""" Use torchMoji to predict emojis from a single text input
"""

from __future__ import print_function, division, unicode_literals
import example_helper
import json
import csv
import argparse

import numpy as np
import emoji

from torchmoji.sentence_tokenizer import SentenceTokenizer
from torchmoji.model_def import torchmoji_emojis
from torchmoji.global_variables import PRETRAINED_PATH, VOCAB_PATH

# Emoji map in emoji_overview.png
EMOJIS = ":joy: :unamused: :weary: :sob: :heart_eyes: \
:pensive: :ok_hand: :blush: :heart: :smirk: \
:grin: :notes: :flushed: :100: :sleeping: \
:relieved: :relaxed: :raised_hands: :two_hearts: :expressionless: \
:sweat_smile: :pray: :confused: :kissing_heart: :heartbeat: \
:neutral_face: :information_desk_person: :disappointed: :see_no_evil: :tired_face: \
:v: :sunglasses: :rage: :thumbsup: :cry: \
:sleepy: :yum: :triumph: :hand: :mask: \
:clap: :eyes: :gun: :persevere: :smiling_imp: \
:sweat: :broken_heart: :yellow_heart: :musical_note: :speak_no_evil: \
:wink: :skull: :confounded: :smile: :stuck_out_tongue_winking_eye: \
:angry: :no_good: :muscle: :facepunch: :purple_heart: \
:sparkling_heart: :blue_heart: :grimacing: :sparkles:".split(' ')

def top_elements(array, k):
    ind = np.argpartition(array, -k)[-k:]
    return ind[np.argsort(array[ind])][::-1]

def text_to_emoji(text, maxlen):
    # Tokenizing using dictionary
    with open(VOCAB_PATH, 'r') as f:
        vocabulary = json.load(f)

    st = SentenceTokenizer(vocabulary, maxlen)

    # Loading model
    model = torchmoji_emojis(PRETRAINED_PATH)
    # Running predictions
    tokenized, _, _ = st.tokenize_sentences([text])
    # Get sentence probability
    prob = model(tokenized)[0]

    # Top emoji id
    emoji_ids = top_elements(prob, 5)

    # map to emojis
    emojis = map(lambda x: EMOJIS[x], emoji_ids)

    print(emoji.emojize("{} {}".format(text,' '.join(emojis)), use_aliases=True))
