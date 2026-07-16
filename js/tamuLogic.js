const params = new URLSearchParams(window.location.search);
const namaTamu = params.get("to");

const tujuan = document.getElementById("namaTamu");

tujuan.textContent = namaTamu;
