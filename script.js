let peerConnection;
let dataChannel;
let receivedChunks = [];
let fileName = "received_file";

document.getElementById("generateOffer").addEventListener("click", createPeerConnection);
document.getElementById("fileInput").addEventListener("change", handleFileSelect);

async function createPeerConnection() {
    peerConnection = new RTCPeerConnection();
    dataChannel = peerConnection.createDataChannel("fileTransfer");

    dataChannel.onopen = () => {
        console.log("Data channel open!");
        document.getElementById("status").innerText = "Connected! Ready to send file.";
    };

    dataChannel.onclose = () => console.log("Data channel closed!");

    peerConnection.onicecandidate = (event) => {
        if (!event.candidate) {
            document.getElementById("offerText").value = btoa(JSON.stringify(peerConnection.localDescription));
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
}

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    fileName = file.name;
    const reader = new FileReader();

    reader.onload = async (event) => {
        const buffer = event.target.result;
        const chunkSize = 16 * 1024;
        let offset = 0;

        dataChannel.send(JSON.stringify({ fileName }));

        while (offset < buffer.byteLength) {
            const chunk = buffer.slice(offset, offset + chunkSize);
            dataChannel.send(chunk);
            offset += chunkSize;
            await new Promise((resolve) => setTimeout(resolve, 10));
        }

        dataChannel.send("END_OF_FILE");
        alert("File sent successfully!");
    };

    reader.readAsArrayBuffer(file);
}

async function connectPeer() {
    const offerText = document.getElementById("answerText").value.trim();
    if (!offerText) {
        alert("Please enter the code!");
        return;
    }

    const offer = JSON.parse(atob(offerText));

    peerConnection = new RTCPeerConnection();

    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;

        dataChannel.onopen = () => {
            console.log("Data channel opened!");
            document.getElementById("status").innerText = "Connected, file receiving...";
        };

        dataChannel.onmessage = receiveFile;
    };

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    peerConnection.onicecandidate = (event) => {
        if (!event.candidate) {
            console.log("ICE Candidate set.");
        }
    };
}

function receiveFile(event) {
    if (typeof event.data === "string") {
        if (event.data === "END_OF_FILE") {
            saveFile();
        } else {
            try {
                const metadata = JSON.parse(event.data);
                if (metadata.fileName) {
                    fileName = metadata.fileName;
                }
            } catch (error) {
                console.error("Error parsing metadata:", error);
            }
        }
    } else {
        receivedChunks.push(event.data);
    }
}

function saveFile() {
    const blob = new Blob(receivedChunks);
    const url = URL.createObjectURL(blob);

    const downloadLink = document.getElementById("downloadLink");
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.getElementById("download-container").style.display = "block";

    document.getElementById("status").innerText = "File received! Download ready.";
}

function copyOffer() {
    const offerText = document.getElementById("offerText");
    offerText.select();
    document.execCommand("copy");
    alert("Code copied!");
}