# -*- coding: utf-8 -*-

""" Use torchMoji to predict emojis from a single text input
"""

from __future__ import print_function, division, unicode_literals
import example_helper
import json
import csv
import argparse
import unidecode

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

'''
# Finer gradient emotions
EMOTIONS = "funny unamused frustrated sad delight \
pensive :ok_hand happy love :smirk \
excited :notes surprise :100 tired \
happy very_happy :raised_hands supportive annoyance \
embarassed request unhappy happy :heartbeat \
:neutral_face :information_desk_person disappointed :see_no_evil :tired_face \
:v :sunglasses rage :thumbsup :cry \
:sleepy :yum :triumph :hand :mask \
:clap :eyes :gun :persevere :smiling_imp \
:sweat :broken_heart :yellow_heart :musical_note :speak_no_evil \
:wink :skull :confounded smile stuck_out_tongue_winking_eye \
angry no_good muscle facepunch purple_heart \
sparkling_heart blue_heart grimacing sparkles".split(' ')
'''

EMOTIONS = "positive negative negative negative positive \
negative positive positive positive positive \
excited positive surprise positive negative \
positive positive negative positive negative \
negative positive negative positive positive \
negative positive negative positive negative \
negative positive negative positive negative \
negative positive negative negative negative \
positive positive negative negative positive \
negative negative negative positive positive \
positive negative negative positive positive \
negative negative positive positive positive \
positive positive positive positive".split(' ')

def top_elements(array, k):
    ind = np.argpartition(array, -k)[-k:]
    return ind[np.argsort(array[ind])][::-1]

'''
Return true if the sentence is positive, false if negative
'''
def positive_or_negative(emotions):
    feelings = 0
    print(f'emotion in function: {emotions}')
    for emotion in emotions:
        if emotion == 'positive':
            feelings += 1
        elif emotion == 'negative':
            feelings -= 1
    return 'positive' if feelings > 0 else 'negative'

if __name__ == "__main__":
    argparser = argparse.ArgumentParser()
    argparser.add_argument('--text', type=str, required=True, help="Input text to emojize")
    argparser.add_argument('--maxlen', type=int, default=30, help="Max length of input text")
    args = argparser.parse_args()

    # Load dictionary for tokenizing
    with open(VOCAB_PATH, 'r') as f:
        vocabulary = json.load(f)
    #print(f'vocabulary: {vocabulary}')

    with open('negative_words_parsed.txt', 'r', encoding='utf-8', errors='ignore') as negative_words_list:
        negative_words = list(negative_words_list)
        negative_words = [negative_word.rstrip('\n').lower() for negative_word in negative_words if negative_word != '\n']

    with open('positive_words_parsed.txt', 'r') as positive_words_list:
        positive_words = list(positive_words_list)
        positive_words = [positive_word.rstrip('\n').lower() for positive_word in positive_words if positive_word != '\n']

    st = SentenceTokenizer(vocabulary, args.maxlen)

    # Loading model
    model = torchmoji_emojis(PRETRAINED_PATH)

    # Running predictions
    # Determines the important words in the sentence
    tokenized, _, _ = st.tokenize_sentences([args.text])
    # Get sentence probability
    prob = model(tokenized)[0]

    # Top emotion id
    emotion_ids = top_elements(prob, 5)
    print(f'top five emotion ids: {emotion_ids}')

    # map to emotions
    emotions = map(lambda x: EMOTIONS[x], emotion_ids)
    emotions = list(emotions)
    print(f'emotions: {emotions}')
    user_feelings = positive_or_negative(emotions)
    print(f'user_feelings: {user_feelings}')

    # Find the words that are contributing to the feeling
    user_positive_words = []
    user_negative_words = []
    if user_feelings == 'positive':
        for word in args.text.split(' '):
            for positive_word in positive_words:
                if word == positive_word:
                    user_positive_words.append(word) 
        json_to_bot = {user_feelings: user_positive_words}
    elif user_feelings == 'negative':
        for word in args.text.split(' '):
            for negative_word in negative_words:
                if word == negative_word:
                    user_negative_words.append(word)
        json_to_bot = {user_feelings: user_negative_words}
    print(f'json to bot: {json_to_bot}')

