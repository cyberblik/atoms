const peer = new Peer();

let conn = null;

peer.on('open', (id) => {
    document.getElementById('myId').innerText = id;
    new QRCode(document.getElementById('qrcode'), {
        text: id,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#2a2a2a"
    });
});

peer.on('connection', (connection) => {
    conn = connection;
    setupConnection(conn);
});

document.getElementById('connectBtn').addEventListener('click', () => {
    const peerId = document.getElementById('peerIdInput').value.trim();
    if (!peerId) return alert('enter peer id');
    conn = peer.connect(peerId);
    setupConnection(conn);
});

function setupConnection(connection) {
    document.getElementById('chat').style.display = 'block';
    document.getElementById('chatControls').style.display = 'block';
    
    connection.on('data', (data) => {
        addMessage('Peer: ' + data);
    });
    
    document.getElementById('sendBtn').onclick = () => {
        const msg = document.getElementById('messageInput').value;
        if (msg) {
            connection.send(msg);
            addMessage('You: ' + msg);
            document.getElementById('messageInput').value = '';
        }
    };
    
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('sendBtn').click();
    });
    
    addMessage('• connected •');
}

function addMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.innerText = text;
    document.getElementById('chat').appendChild(msgDiv);
    document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
}
