// Генерируем ID локально
function generatePeerId() {
    return Math.random().toString(36).substring(2, 10) + 
           Math.random().toString(36).substring(2, 10);
}

let peer = null;
let currentConnection = null;

const SIGNAL_SERVER = {
    host: 'atoms-signal-production.up.railway.app',
    path: '/',
    secure: true
};

// Функция инициализации Peer
function initPeer() {
    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = true;
    startBtn.textContent = 'Initializing...';
    
    const peerOptions = {
        host: SIGNAL_SERVER.host,
        path: SIGNAL_SERVER.path,
        secure: SIGNAL_SERVER.secure,
        port: 443,
        config: {
            'iceServers': [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        },
        serialization: 'json',
        debug: 2
    };

    console.log('Connecting to signal server:', SIGNAL_SERVER.host);
    
    try {
        peer = new Peer(generatePeerId(), peerOptions);

        const timeout = setTimeout(() => {
            if (!peer || !peer._open) {
                startBtn.disabled = false;
                startBtn.textContent = 'Try Again';
                alert('Connection timeout. Check your internet.');
            }
        }, 10000);

        peer.on('open', (id) => {
            clearTimeout(timeout);
            console.log('✅ Connected! ID:', id);
            
            document.getElementById('myId').innerText = id;
            document.getElementById('startSection').style.display = 'none';
            document.getElementById('idSection').style.display = 'block';
            
            // Генерируем настоящий QR-код
            const qrContainer = document.getElementById('qrcode');
            qrContainer.innerHTML = ''; // очищаем
            
            // Используем библиотеку qrcodejs
            new QRCode(qrContainer, {
                text: id,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#2a2a2a",
                correctLevel: QRCode.CorrectLevel.H
            });
        });

        peer.on('error', (err) => {
            clearTimeout(timeout);
            console.error('❌ Peer error:', err);
            startBtn.disabled = false;
            startBtn.textContent = 'Try Again';
            alert('Failed: ' + err.type);
        });

        peer.on('connection', (connection) => {
            console.log('✅ Incoming connection received');
            currentConnection = connection;
            setupChat(connection);
        });
        
    } catch (e) {
        console.error('Exception:', e);
        startBtn.disabled = false;
        startBtn.textContent = 'Start atoms';
        alert('Error: ' + e.message);
    }
}

// Функция для переключения в режим чата
function enableChatMode() {
    console.log('Enabling chat mode');
    const container = document.getElementById('mainContainer');
    if (container) {
        container.classList.add('chat-active');
        console.log('Chat mode enabled');
    } else {
        console.error('Container not found');
    }
}

// Обработчики кнопок
document.getElementById('startBtn').addEventListener('click', initPeer);

document.getElementById('connectBtn').addEventListener('click', () => {
    const peerId = document.getElementById('peerIdInput').value.trim();
    if (!peerId) return alert('enter peer id');
    if (!peer) {
        alert('Generate your ID first');
        return;
    }
    
    console.log('Connecting to peer:', peerId);
    const conn = peer.connect(peerId, { serialization: 'json' });
    currentConnection = conn;
    setupChat(conn);
});

function setupChat(connection) {
    console.log('Setting up chat with connection');
    
    // Показываем секцию чата
    const chatSection = document.getElementById('chatSection');
    chatSection.style.display = 'block';
    
    // Включаем двухколоночный режим
    enableChatMode();
    
    const messagesDiv = document.getElementById('chat');
    messagesDiv.innerHTML = '';
    
    connection.on('open', () => {
        console.log('✅ Chat connection open');
        addMessage('• connected •', 'system');
    });
    
    connection.on('data', (data) => {
        console.log('📨 Message received:', data);
        addMessage(data, 'their');
    });
    
    connection.on('error', (err) => {
        console.error('❌ Chat error:', err);
        addMessage(`error: ${err}`, 'system');
    });
    
    connection.on('close', () => {
        console.log('🔌 Chat connection closed');
        addMessage('• disconnected •', 'system');
        chatSection.style.display = 'none';
        
        // Убираем двухколоночный режим
        const container = document.getElementById('mainContainer');
        container.classList.remove('chat-active');
    });
    
    // Настройка отправки сообщений
    document.getElementById('sendBtn').onclick = () => {
        const input = document.getElementById('messageInput');
        const msg = input.value.trim();
        if (msg && connection.open) {
            console.log('📤 Sending message:', msg);
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

// Обработчик клика по логотипу
document.addEventListener('DOMContentLoaded', () => {
    const logo = document.getElementById('logo');
    if (logo) {
        logo.addEventListener('click', function() {
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    }
});
