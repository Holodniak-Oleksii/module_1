let logs = [];

export function log(message, type = "INFO") {
  const logMessage = `[${type}] ${new Date().toLocaleTimeString()} - ${message}`;
  console.log(logMessage);
  logs.push(logMessage);

  const logBox = document.getElementById("logs");
  if (logBox) logBox.value = logs.join("\n");
}

export function downloadLogs() {
  const blob = new Blob([logs.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "logs.txt";
  a.click();
}

export function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.padding = "10px 20px";
  toast.style.marginTop = "10px";
  toast.style.borderRadius = "8px";
  toast.style.color = "white";
  toast.style.fontWeight = "bold";
  toast.style.minWidth = "150px";
  toast.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s, transform 0.3s";

  // кольори для типів повідомлень
  if (type === "error") toast.style.background = "#ef4444";
  else if (type === "success") toast.style.background = "#22c55e";
  else toast.style.background = "#3b82f6";

  container.appendChild(toast);

  // показ
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // приховати після duration
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => container.removeChild(toast), 300);
  }, duration);
}
