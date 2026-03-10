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
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        },
        serialization: 'json'
    };
    
    peer = new Peer(generatePeerId(), peerOptions);
    
    peer.on('open', (id) => {
        console.log('✅ Connected! ID:', id);
        document.getElementById('myId').innerText = id;
        document.getElementById('startSection').style.display = 'none';
        document.getElementById('idSection').style.display = 'block';
        
        // QR-код
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: id,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#2a2a2a"
        });
        
        startBtn.disabled = false;
        startBtn.textContent = 'Start atoms';
    });
    
    peer.on('error', (err) => {
        console.error('❌ Peer error:', err);
        startBtn.disabled = false;
        startBtn.textContent = 'Try Again';
        alert('Failed: ' + err.type);
    });
    
    peer.on('connection', (connection) => {
        currentConnection = connection;
        setupChat(connection);
    });
}

document.getElementById('startBtn').addEventListener('click', initPeer);

document.getElementById('connectBtn').addEventListener('click', () => {
    const peerId = document.getElementById('peerIdInput').value.trim();
    if (!peerId) return alert('enter peer id');
    if (!peer) return alert('Generate your ID first');
    
    const conn = peer.connect(peerId, { serialization: 'json' });
    setupChat(conn);
});

function setupChat(connection) {
    document.getElementById('chatSection').style.display = 'block';
    const messagesDiv = document.getElementById('chat');
    messagesDiv.innerHTML = '';
    
    connection.on('open', () => addMessage('• connected •', 'system'));
    connection.on('data', (data) => addMessage(data, 'their'));
    connection.on('error', (err) => addMessage(`error: ${err}`, 'system'));
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
        if (e.key === 'Enter') document.getElementById('sendBtn').click();
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
        msgDiv.innerText = text;
    }
    
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
