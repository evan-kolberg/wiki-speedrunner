from flask import Flask, request
import spacy
import numpy as np
import subprocess
from multiprocessing import Process

app = Flask(__name__)

nlp = spacy.load('en_core_web_md')

def compare(target_phrase, phrases):
    similarities = [nlp(target_phrase).similarity(nlp(phrase)) for phrase in phrases]
    
    most_similar_phrase_index = np.argmax(similarities)
    
    return phrases[most_similar_phrase_index]

@app.route('/compare', methods=['POST'])
def compare_phrases():
    try:
        data = request.get_json()
        target_phrase = data['target_phrase']
        phrases = data['phrases']
        
        most_similar_phrase = compare(target_phrase, phrases)
        
        return {'most_similar_phrase': most_similar_phrase}
    except Exception as e:
        return {'error': str(e)}, 500

def run_server():
    app.run(port=5000)

def run_tests():
    subprocess.run(["npx", "playwright", "test", "main.spec.ts", "--ui"])

if __name__ == '__main__':
    server_process = Process(target=run_server)
    test_process = Process(target=run_tests)

    server_process.start()
    test_process.start()



