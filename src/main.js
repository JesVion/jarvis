// JARVIS AI Assistant - Iron Man Style
// Using Groq API (free, unlimited) and Web Speech API

// Groq API Configuration - Get free API key from https://console.groq.com
const GROQ_API_KEY = 'gsk_YourGroqAPIKeyHere'; // Replace with your Groq API key
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// DOM Elements
const statusEl = document.getElementById('status');
const responseEl = document.getElementById('response');
const responseContainer = document.getElementById('responseContainer');
const listenBtn = document.getElementById('listenBtn');
const speakBtn = document.getElementById('speakBtn');
const mouthLine = document.querySelector('.mouth-line');

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'en-US';

// Text-to-Speech Setup
const synth = window.speechSynthesis;

// Conversation context
let conversationHistory = [
    { role: 'system', content: `You are JARVIS, Tony Stark's AI assistant from the Marvel universe. 
You are intelligent, witty, helpful, and speak in a sophisticated British-inspired tone.
You refer to the user as "Sir" or "Madam".
You respond to voice commands and help with various tasks.
Keep responses concise but informative.
Always be loyal and helpful.
Introduce yourself as JARVIS, the Just A Rather Very Intelligent System.` }
];

// Initialize JARVIS
function initJARVIS() {
    updateStatus('Systems Online');
    speak('Initializing JARVIS systems. All systems operational, Sir.');
    
    // Check microphone permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('Microphone available');
    }
}

// Update status display
function updateStatus(text) {
    statusEl.textContent = text;
}

// Speak text using Web Speech API
function speak(text) {
    // Stop any ongoing speech
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.volume = 1;
    
    // Try to find a good English voice
    const voices = synth.getVoices();
    const englishVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) 
                      || voices.find(v => v.lang.includes('en-GB'))
                      || voices.find(v => v.lang.includes('en'));
    
    if (englishVoice) {
        utterance.voice = englishVoice;
    }
    
    utterance.onstart = () => {
        mouthLine.classList.add('active');
    };
    
    utterance.onend = () => {
        mouthLine.classList.remove('active');
    };
    
    synth.speak(utterance);
}

// Call Groq API for AI responses
async function getAIResponse(userInput) {
    try {
        conversationHistory.push({ role: 'user', content: userInput });
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: conversationHistory,
                temperature: 0.7,
                max_tokens: 500
            })
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        conversationHistory.push({ role: 'assistant', content: aiResponse });
        
        // Keep conversation history manageable
        if (conversationHistory.length > 10) {
            conversationHistory = [
                conversationHistory[0],
                ...conversationHistory.slice(-9)
            ];
        }
        
        return aiResponse;
        
    } catch (error) {
        console.error('AI Error:', error);
        return getLocalResponse(userInput);
    }
}

// Local command responses (fallback when no API)
function getLocalResponse(input) {
    const command = input.toLowerCase();
    
    const localResponses = {
        'hello': 'Hello, Sir. How may I assist you today?',
        'hi': 'Good day, Sir. JARVIS at your service.',
        'what time': `The current time is ${new Date().toLocaleTimeString()}, Sir.`,
        'what date': `Today's date is ${new Date().toLocaleDateString()}, Sir.`,
        'weather': 'I would need an internet connection to check the weather, Sir. Shall I try?',
        'open browser': 'Opening browser, Sir.',
        'who are you': 'I am JARVIS, Just A Rather Very Intelligent System. Created by Tony Stark to assist him with various tasks.',
        'thank you': 'You are welcome, Sir. Always happy to help.',
        'goodbye': 'Goodbye, Sir. Turning off systems. Call me when you need me.',
        'help': 'I can help you with: telling time, opening browser, searching the web, and general conversation. What would you like, Sir?'
    };
    
    for (const [key, value] of Object.entries(localResponses)) {
        if (command.includes(key)) {
            return value;
        }
    }
    
    return `I understand you said: "${input}". My AI systems are ready to help, Sir. Could you please elaborate?`;
}

// Handle voice commands
async function handleCommand(command) {
    updateStatus('Processing Command');
    responseEl.textContent = `> ${command}\n`;
    
    const aiResponse = await getAIResponse(command);
    
    responseEl.textContent += `\n${aiResponse}`;
    speak(aiResponse);
    
    // Handle specific actions
    if (command.toLowerCase().includes('open browser') || command.toLowerCase().includes('open google')) {
        setTimeout(() => {
            window.open('https://google.com', '_blank');
        }, 2000);
    }
    
    if (command.toLowerCase().includes('search for')) {
        const query = command.toLowerCase().replace('search for', '').trim();
        if (query) {
            setTimeout(() => {
                window.open(`https://google.com/search?q=${encodeURIComponent(query)}`, '_blank');
            }, 2000);
        }
    }
    
    updateStatus('Listening');
}

// Speech Recognition Event Handlers
recognition.onstart = () => {
    updateStatus('Listening...');
    listenBtn.classList.add('listening');
    mouthLine.classList.add('active');
};

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    handleCommand(transcript);
};

recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    updateStatus('Error - Try Again');
    listenBtn.classList.remove('listening');
    mouthLine.classList.remove('active');
    
    if (event.error === 'not-allowed') {
        speak('Microphone access denied, Sir. Please enable microphone permissions.');
    }
};

recognition.onend = () => {
    listenBtn.classList.remove('listening');
    mouthLine.classList.remove('active');
};

// Button Event Listeners
listenBtn.addEventListener('click', () => {
    try {
        recognition.start();
    } catch (e) {
        console.error('Recognition already started');
    }
});

speakBtn.addEventListener('click', () => {
    speak('JARVIS is operational, Sir. How may I assist you?');
});

// Initialize on page load
window.addEventListener('load', () => {
    // Load voices (needed for some browsers)
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = () => {};
    }
    
    initJARVIS();
});

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        synth.cancel();
    }
});
