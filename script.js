const fileInput = document.getElementById("fileInput");
const dropArea = document.getElementById("drop-area");
const linkContainer = document.getElementById("link-container");
const fileLink = document.getElementById("fileLink");
const qrCodeDiv = document.getElementById("qrCode");
const downloadContainer = document.getElementById("download-container");
const downloadLink = document.getElementById("downloadLink");

let peerConnection;
let dataChannel;

// **Handle File Selection**
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

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) handleFile(file);
}

// **WebRTC File Transfer**
function handleFile(file) {
    peerConnection = new RTCPeerConnection();
    dataChannel = peerConnection.createDataChannel("fileTransfer");

    dataChannel.onopen = () => {
        console.log("Connection Open: Sending file");
        sendFile(file);
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) return;
        const offer = peerConnection.localDescription.sdp;
        const fileShareLink = `${window.location.href}?offer=${btoa(offer)}`;

        fileLink.value = fileShareLink;
        linkContainer.style.display = "block";
        new QRCode(qrCodeDiv, fileShareLink);
    };

    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer));
}

function sendFile(file) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
        dataChannel.send(reader.result);
        alert("File sent successfully!");
    };
}

// **Receiving Files**
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("offer")) {
    const offer = atob(urlParams.get("offer"));
    acceptFileTransfer(offer);
}

function acceptFileTransfer(offer) {
    peerConnection = new RTCPeerConnection();

    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        dataChannel.onmessage = (event) => {
            saveFile(event.data);
        };
    };

    peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: offer }))
        .then(() => peerConnection.createAnswer())
        .then(answer => peerConnection.setLocalDescription(answer));
}

function saveFile(data) {
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    
    downloadLink.href = url;
    downloadLink.style.display = "block";
    downloadContainer.style.display = "block";
}

// **Copy Link**
function copyLink() {
    fileLink.select();
    document.execCommand("copy");
    alert("Link copied!");
}