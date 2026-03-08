// Функция для определения проблемных браузеров
function isProblematicBrowser() {
    const ua = navigator.userAgent;
    return ua.includes("Edg") || // Edge
           ua.includes("YaBrowser") || // Яндекс.Браузер
           /iPhone|iPad|iPod/i.test(navigator.userAgent); // iOS
}

// Генерируем ID локально
function generatePeerId() {
    return Math.random().toString(36).substring(2, 10) + 
           Math.random().toString(36).substring(2, 10);
}

let peer = null;
let currentConnection = null;
let initAttempts = 0;

// Функция инициализации Peer с повторными попытками
function initPeer() {
    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = true;
    startBtn.textContent = 'Initializing...';
    
    // Настройки для Peer - для ВСЕХ браузеров используем JSON
    const peerOptions = {
        serialization: 'json', // JSON для всех!
        config: {
            'iceServers': [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        }
    };

    console.log('Initializing Peer with JSON serialization');
    
    try {
        peer = new Peer(generatePeerId(), peerOptions);

        // Таймаут на случай, если Peer не отвечает
        const timeout = setTimeout(() => {
            if (!peer._open) {
                console.log('Peer initialization timeout, retrying...');
                startBtn.disabled = false;
                startBtn.textContent = 'Try Again';
                alert('Connection timeout. Please try again.');
            }
        }, 10000);

        peer.on('open', (id) => {
            clearTimeout(timeout);
            console.log('Peer opened with ID:', id);
            
            document.getElementById('myId').innerText = id;
            
            // Скрываем кнопку Start, показываем ID и QR
            document.getElementById('startSection').style.display = 'none';
            document.getElementById('idSection').style.display = 'block';
            
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

        peer.on('error', (err) => {
            clearTimeout(timeout);
            console.error('Peer error:', err);
            startBtn.disabled = false;
            startBtn.textContent = 'Start atoms';
            alert('Failed to initialize: ' + err.type);
        });

        peer.on('connection', (connection) => {
            currentConnection = connection;
            setupChat(connection);
        });
        
    } catch (e) {
        console.error('Exception:', e);
        startBtn.disabled = false;
        startBtn.textContent = 'Start atoms';
        alert('Error initializing: ' + e.message);
    }
}

// Обработчик кнопки Start
document.getElementById('startBtn').addEventListener('click', () => {
    initPeer();
});

document.getElementById('connectBtn').addEventListener('click', () => {
    const peerId = document.getElementById('peerIdInput').value.trim();
    if (!peerId) return alert('enter peer id');
    if (!peer) {
        alert('Please generate your ID first by clicking Start');
        return;
    }
    
    console.log('Connecting to peer:', peerId);
    
    // Для ВСЕХ браузеров используем JSON
    const connOptions = { serialization: 'json' };
    const conn = peer.connect(peerId, connOptions);
    
    currentConnection = conn;
    setupChat(conn);
});

// Остальная часть кода (setupChat, addMessage) без изменений
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
