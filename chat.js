import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

const db = getDatabase();
const auth = getAuth();
const messagesRef = ref(db, "messages");

document.getElementById("send-button").addEventListener("click", sendMessage);
document.getElementById("chat-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

function sendMessage() {
    const inputField = document.getElementById("chat-input");
    const message = inputField.value.trim();
    if (message === "") return;

    const user = auth.currentUser; // Get current user
    if (!user) return;

    push(messagesRef, {
        uid: user.uid, // Store sender’s UID
        text: message,
        timestamp: Date.now(),
    });

    inputField.value = "";
}

// Listen for new messages and display them
onChildAdded(messagesRef, (snapshot) => {
    const messageData = snapshot.val();
    const messageDiv = document.createElement("div");

    const user = auth.currentUser; // Get current user

    // Check if the message was sent by the current user
    if (user && messageData.uid === user.uid) {
        messageDiv.className = "sent";
    } else {
        messageDiv.className = "received";
    }
    const userName = () => {
        switch (messageData.uid) {
            case user.uid:
                return "";
            case "YO3FULhvr6byMCyua4y3zmqSU722":
                return "Yashdeep (Safari Local)";
            case "nb2MydftGefZcnAUmqJWqjIuN1z1":
                return "Yashdeep (Chrome Local)";
            case "NAxqq1NlrAYU6EHxV7OvMMhPGJZ2":
                return "Yashdeep (Chrome Web)";
            case "IUXXhOTqe5YdLS4NZusoEtud8a43":
                return "Yashdeep (Safari Web)";
            case "iykv5HTJU8QqWtzvxN4DHyZRyfc2":
                return "Yashdeep (Phone)";
            default:
                return "Unknown (" + messageData.uid + ")";
        }
    }

    // Format timestamp to a readable date and time
    const messageTime = new Date(messageData.timestamp);
    const formattedTime = messageTime.toLocaleString(); // Uses local date/time format

    messageDiv.innerHTML = `
        <div class="message-user-id">${userName()}</div>
        ${messageData.text}
        <div class="message-time">${formattedTime}</div>
        `;
    const chatArea = document.getElementById("chat-area");
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
});
