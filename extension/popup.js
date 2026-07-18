const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('question-input');
const sendBtn = document.getElementById('send-btn');

function addMessage(text, role, citations) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;

    if (citations && citations.length > 0) {
        const cite = document.createElement('div');
        cite.className = 'citation';
        cite.textContent = 'Sources: ' + citations.join(', ');

        div.appendChild(cite);
    }

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addLoading() {
    const div = document.createElement('div');
    div.className = 'loading';
    div.id = 'loading-indicator';
    div.textContent = 'Thinking...';

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeLoading() {
    const el = document.getElementById('loading-indicator');

    if (el) {
        el.remove();
    }
}

function setLoading(loading) {
    sendBtn.disabled = loading;
    inputEl.disabled = loading;

    if (loading) {
        addLoading();
    } else {
        removeLoading();
    }
}

async function sendQuestion(question) {
    addMessage(question, 'user');
    setLoading(true);
    inputEl.value = '';

    try {
        const res = await fetch('http://localhost:8000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Server error (${res.status})`);
        }
        const data = await res.json();
        addMessage(data.answer, 'bot', data.citations);
    } catch (err) {
        addMessage('Error: ' + err.message, 'error');
    } finally {
        setLoading(false);
        inputEl.focus();
    }
}

function handleSubmit() {
    const q = inputEl.value.trim();
    if (q && !sendBtn.disabled) {
        sendQuestion(q);
    }
}

sendBtn.addEventListener('click', handleSubmit);
inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSubmit(); });
