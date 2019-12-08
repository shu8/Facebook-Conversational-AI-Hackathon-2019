import sys

#get the file that you want to format
word_file = sys.argv[1]


#first pass is to remove any dashes inbetween words that exist 
#for every line in the file
output_file_name = word_file[0:len(word_file)-4]
output_file_pointer = open(f"{output_file_name}_parsed.txt", 'a')
input_file_pointer = open(word_file, 'r') 
for line in input_file_pointer:
    for word in line.split(','):
        #print(word)
        for inner_word in word.split(' – '):
            single_word = inner_word.strip()
            single_word = single_word.split(' ')
            single_word = ''.join(single_word)
            print(single_word)
            #write to the file
            output_file_pointer.write(f"{single_word}\n")
            

output_file_pointer.close()
input_file_pointer.close()

