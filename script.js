// Функция для определения iOS
function isIOS() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

// Генерируем ID локально
function generatePeerId() {
    return Math.random().toString(36).substring(2, 10) + 
           Math.random().toString(36).substring(2, 10);
}

// Настройки для Peer
const peerOptions = {
    config: {
        'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    }
};

// Если это iOS — включаем JSON сериализацию
if (isIOS()) {
    peerOptions.serialization = 'json';
    console.log('iOS detected, using JSON serialization');
}

const peer = new Peer(generatePeerId(), peerOptions);
let currentConnection = null;

peer.on('open', (id) => {
    document.getElementById('myId').innerText = id;
    
    // Создаём QR-код (упрощённый)
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    qrContainer.appendChild(canvas);
    
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#000000';
    ctx.font = '12px monospace';
    ctx.fillText('ID:', 10, 30);
    
    const shortId = id.match(/.{1,4}/g)?.join(' ') || id;
    ctx.fillText(shortId, 10, 60);
    ctx.fillText('(scan manually)', 10, 90);
});

peer.on('connection', (connection) => {
    currentConnection = connection;
    setupChat(connection);
});

document.getElementById('connectBtn').addEventListener('click', () => {
    const peerId = document.getElementById('peerIdInput').value.trim();
    if (!peerId) return alert('enter peer id');
    
    // Для iOS тоже используем JSON при подключении
    const connOptions = isIOS() ? { serialization: 'json' } : {};
    const conn = peer.connect(peerId, connOptions);
    
    currentConnection = conn;
    setupChat(conn);
});

function setupChat(connection) {
    document.getElementById('chatSection').style.display = 'block';
    const messagesDiv = document.getElementById('chat');
    messagesDiv.innerHTML = '';
    
    connection.on('open', () => {
        addMessage('• connected •', 'system');
    });
    
    connection.on('data', (data) => {
        addMessage(data, 'their');
    });
    
    connection.on('error', (err) => {
        addMessage(`error: ${err}`, 'system');
    });
    
    connection.on('close', () => {
        addMessage('• disconnected •', 'system');
        document.getElementById('chatSection').style.display = 'none';
    });
    
    document.getElementById('sendBtn').onclick = () => {
        const input = document.getElementById('messageInput');
        const msg = input.value.trim();
        if (msg && connection.open) {
            connection.send(msg);
            addMessage(msg, 'mine');
            input.value = '';
        }
    };
    
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('sendBtn').click();
        }
    });
}

function addMessage(text, type) {
    const messagesDiv = document.getElementById('chat');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    
    if (type === 'mine') {
        msgDiv.classList.add('mine');
        msgDiv.innerHTML = `<div>${text}</div><div class="timestamp">you</div>`;
    } else if (type === 'their') {
        msgDiv.classList.add('theirs');
        msgDiv.innerHTML = `<div>${text}</div><div class="timestamp">peer</div>`;
    } else {
        msgDiv.style.textAlign = 'center';
        msgDiv.style.color = '#666';
        msgDiv.style.fontSize = '12px';
        msgDiv.style.margin = '16px 0';
        msgDiv.innerText = text;
    }
    
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
