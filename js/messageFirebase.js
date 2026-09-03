import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqQkPTlZp73kwGwzBWcMF-S3LWmDQkF98",
  authDomain: "undangan-aries.firebaseapp.com",
  projectId: "undangan-aries",
  storageBucket: "undangan-aries.firebasestorage.app",
  messagingSenderId: "30109755066",
  appId: "1:30109755066:web:c76dc69c7f8cccf8638483",
  measurementId: "G-6BSVNE5D84",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messagesRef = collection(db, "undangan1");
const form = document.getElementById("messageForm");
const nameInput = document.getElementById("messageName");
const messageInput = document.getElementById("messageText");
const messageStatus = document.getElementById("messageStatus");
const messageList = document.getElementById("messageList");
const guestName = new URLSearchParams(window.location.search).get("to");

if (guestName) nameInput.value = guestName;

function relativeTime(timestamp) {
  if (!timestamp) return "baru saja";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp.toMillis()) / 1000));
  const units = [[31536000, "tahun"], [2592000, "bulan"], [604800, "minggu"], [86400, "hari"], [3600, "jam"], [60, "menit"]];
  for (const [unitSeconds, label] of units) {
    if (seconds >= unitSeconds) return `${Math.floor(seconds / unitSeconds)} ${label} lalu`;
  }
  return "baru saja";
}

function createCard(message, isReply = false) {
  const card = document.createElement("article");
  card.className = `message-card${isReply ? " message-reply" : ""}`;
  if (message.createdAt) card.dataset.timestamp = message.createdAt.toMillis();

  const header = document.createElement("div");
  header.className = "message-card-header";
  const author = document.createElement("strong");
  author.className = "work-sans";
  author.textContent = message.name || "Tamu";
  const authorInfo = document.createElement("div");
  authorInfo.className = "message-author-info";
  authorInfo.appendChild(author);
  if (message.attendance === "hadir" || message.attendance === "tidak_hadir") {
    const attendance = document.createElement("span");
    attendance.className = `message-attendance ${message.attendance === "hadir" ? "is-present" : "is-absent"}`;
    attendance.textContent = message.attendance === "hadir" ? "Hadir" : "Tidak hadir";
    authorInfo.appendChild(attendance);
  }
  const time = document.createElement("time");
  time.className = "work-sans";
  time.textContent = relativeTime(message.createdAt);
  header.append(authorInfo, time);

  const text = document.createElement("p");
  text.className = "work-sans";
  text.textContent = message.message || "";
  card.append(header, text);

  if (!isReply) {
    const button = document.createElement("button");
    button.className = "reply-toggle work-sans";
    button.type = "button";
    button.innerHTML = '<i class="bi bi-reply-fill"></i> Balas';
    button.addEventListener("click", () => addReplyForm(card, message.id));
    card.appendChild(button);
  }
  return card;
}

function addReplyForm(card, replyTo) {
  if (card.querySelector(".reply-form")) return;
  const replyForm = document.createElement("form");
  replyForm.className = "reply-form";
  replyForm.innerHTML = '<input name="name" maxlength="60" placeholder="Nama Anda" required><textarea name="message" maxlength="500" rows="2" placeholder="Tulis balasan..." required></textarea><button class="message-submit work-sans" type="submit"><i class="bi bi-send-fill"></i> Kirim Balasan</button>';
  replyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = replyForm.querySelector("button");
    button.disabled = true;
    try {
      await addDoc(messagesRef, { name: replyForm.elements.name.value.trim(), message: replyForm.elements.message.value.trim(), replyTo, createdAt: serverTimestamp() });
      replyForm.remove();
    } catch (error) {
      button.disabled = false;
      messageStatus.textContent = "Balasan belum terkirim. Coba lagi.";
      console.error(error);
    }
  });
  card.appendChild(replyForm);
}

function renderMessages(snapshot) {
  const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const roots = messages.filter((message) => !message.replyTo);
  const replies = messages.filter((message) => message.replyTo);
  messageList.replaceChildren();
  if (!roots.length) {
    const empty = document.createElement("p");
    empty.className = "message-empty work-sans";
    empty.textContent = "Belum ada pesan. Jadilah yang pertama mengirim ucapan.";
    messageList.appendChild(empty);
    return;
  }
  roots.forEach((message) => {
    const card = createCard(message);
    replies.filter((reply) => reply.replyTo === message.id).forEach((reply) => card.appendChild(createCard(reply, true)));
    messageList.appendChild(card);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  const attendance = form.elements.attendance.value;
  button.disabled = true;
  messageStatus.textContent = "Mengirim pesan...";
  try {
    await addDoc(messagesRef, { name: nameInput.value.trim(), message: messageInput.value.trim(), attendance, replyTo: null, createdAt: serverTimestamp() });
    nameInput.value = "";
    messageInput.value = "";
    messageStatus.textContent = "Pesan berhasil dikirim.";
  } catch (error) {
    messageStatus.textContent = "Pesan belum terkirim. Coba lagi.";
    console.error(error);
  } finally {
    button.disabled = false;
  }
});

onSnapshot(query(messagesRef, orderBy("createdAt", "desc")), renderMessages, (error) => {
  messageList.innerHTML = '<p class="message-empty work-sans">Pesan belum dapat dimuat.</p>';
  messageStatus.textContent = "Pastikan koneksi dan aturan Firebase sudah aktif.";
  console.error(error);
});

setInterval(() => {
  messageList.querySelectorAll(".message-card[data-timestamp]").forEach((card) => {
    card.querySelector("time").textContent = relativeTime({ toMillis: () => Number(card.dataset.timestamp) });
  });
}, 60000);
