const fileInput = document.getElementById("fileInput");
const dropArea = document.getElementById("drop-area");
const linkContainer = document.getElementById("link-container");
const offerText = document.getElementById("offerText");
const answerText = document.getElementById("answerText");
const downloadContainer = document.getElementById("download-container");
const downloadLink = document.getElementById("downloadLink");

let peerConnection;
let dataChannel;

// Handle File Selection
dropArea.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", handleFileSelect);

dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.style.borderColor = "blue";
});

dropArea.addEventListener("dragleave", () => {
    dropArea.style.borderColor = "#aaa";
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.style.borderColor = "#aaa";
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) await createPeerConnection(file);
}

async function handleFile(file) {
    await createPeerConnection(file);
}

async function createPeerConnection(file) {
    peerConnection = new RTCPeerConnection();
    dataChannel = peerConnection.createDataChannel("fileTransfer");

    dataChannel.onopen = () => sendFile(file);

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) return;
        offerText.value = btoa(JSON.stringify(peerConnection.localDescription));
        linkContainer.style.display = "block";
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
}

async function sendFile(file) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
        dataChannel.send(reader.result);
        alert("File sent successfully!");
    };
}

async function connectPeer() {
    const offer = JSON.parse(atob(answerText.value));
    
    peerConnection = new RTCPeerConnection();
    
    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        dataChannel.onmessage = (event) => {
            saveFile(event.data);
        };
    };

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    alert("Connected! Receiving file...");
}

function saveFile(data) {
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    
    downloadLink.href = url;
    downloadLink.style.display = "block";
    downloadContainer.style.display = "block";
}

function copyOffer() {
    offerText.select();
    document.execCommand("copy");
    alert("Code copied!");
}