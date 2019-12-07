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

EMOTIONS = "funny unamused frustrated sad delight \
pensive :ok_hand happy love :smirk \
excited :notes surprise :100 tired \
happy very_happy :raised_hands :two_hearts :expressionless \
:sweat_smile :pray confused :kissing_heart :heartbeat \
:neutral_face :information_desk_person disappointed :see_no_evil :tired_face \
:v :sunglasses rage :thumbsup :cry \
:sleepy :yum :triumph :hand :mask \
:clap :eyes :gun :persevere :smiling_imp \
:sweat :broken_heart :yellow_heart :musical_note :speak_no_evil \
:wink :skull :confounded smile stuck_out_tongue_winking_eye \
angry no_good muscle facepunch purple_heart \
sparkling_heart blue_heart grimacing sparkles".split(' ')

def top_elements(array, k):
    ind = np.argpartition(array, -k)[-k:]
    return ind[np.argsort(array[ind])][::-1]

if __name__ == "__main__":
    # argparser = argparse.ArgumentParser()
    # argparser.add_argument('--text', type=str, required=True, help="Input text to emojize")
    # argparser.add_argument('--maxlen', type=int, default=30, help="Max length of input text")
    # args = argparser.parse_args()

    OUTPUT_PATH = 'test_sentences.csv'

    with open('preprocessed-twitter-tweets/processedNeutral.csv', 'r') as f:
        reader = csv.reader(f)
        test_sentences = list(reader)

    for sentence in test_sentences[0]:
        if len(sentence) == 0:
            sentence = 'i'

    print(f'test_sentences length: {len(test_sentences[0])}')

    # Tokenizing using dictionary
    with open(VOCAB_PATH, 'r') as f:
        vocabulary = json.load(f)

    #st = SentenceTokenizer(vocabulary, args.maxlen)
    st = SentenceTokenizer(vocabulary, 500)

    # Loading model
    model = torchmoji_emojis(PRETRAINED_PATH)
    # Running predictions
    # Determines the important words in the sentence
    #tokenized, _, _ = st.tokenize_sentences([args.text])
    tokenized, _, _ = st.tokenize_sentences(test_sentences[0])
    #print(f'tokenized words: {tokenized}')
    # Get sentence probability
    #prob = model(tokenized)[0]
    print(f'tokenized: {tokenized}')
    prob = model(tokenized)

    for prob in [prob]:
        # Find top emojis for each sentence. Emoji ids (0-63)
        # correspond to the mapping in emoji_overview.png
        # at the root of the torchMoji repo.
        #print(f'prob:{prob}')
        print('Writing results to {}'.format(OUTPUT_PATH))
        scores = []
        print(f'prob: {prob}')
        for i, t in enumerate(test_sentences[0]):
            t_tokens = tokenized[i]
            t_score = [t]
            t_prob = prob[i]
            ind_top = top_elements(t_prob, 5)
            t_score.append(sum(t_prob[ind_top]))
            t_score.extend(ind_top)
            t_score.extend([t_prob[ind] for ind in ind_top])
            scores.append(t_score)
            #print(t_score)

        with open(OUTPUT_PATH, 'w') as csvfile:
            writer = csv.writer(csvfile, delimiter=str(','), lineterminator='\n')
            writer.writerow(['Text', 'Top5%',
                            'Emoji_1', 'Emoji_2', 'Emoji_3', 'Emoji_4', 'Emoji_5',
                            'Pct_1', 'Pct_2', 'Pct_3', 'Pct_4', 'Pct_5'])
            for i, row in enumerate(scores):
                try:
                    writer.writerow(row)
                except:
                    print("Exception at row {}!".format(i))

    '''
    Single sentence mapping
    # Top emotion id
    emotion_ids = top_elements(prob, 5)
    print(f'top five emotion ids: {emotion_ids}')

    # map to emotions
    emotions = map(lambda x: EMOTIONS[x], emotion_ids)
    print(f'emojis: {list(emotions)}')
    #print(emotion.emojize("{} {}".format(args.text,' '.join(emojis)), use_aliases=True))
    '''

