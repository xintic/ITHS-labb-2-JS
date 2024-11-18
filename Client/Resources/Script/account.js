const API_URL = "http://localhost:5501";

// Hanterar Light och Dark mode
const toggleMode = () => {
  const body = document.body;
  const newTheme = body.dataset.bsTheme === "dark" ? "light" : "dark";
  body.dataset.bsTheme = newTheme;
  localStorage.setItem("theme", newTheme);
  updateIcon(newTheme);
};

const updateIcon = (theme) => {
  const themeIcon = document.getElementById("themeIcon");
  themeIcon.className =
    theme === "dark" ? "bi bi-moon-stars-fill" : "bi bi-sun-fill";
};

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.dataset.bsTheme = savedTheme;
  document.getElementById("flexSwitchCheckChecked").checked =
    savedTheme === "dark";
  updateIcon(savedTheme);
});

// Login Form
document
  .getElementById("login-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("user-email").value;
    const password = document.getElementById("user-password").value;

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("accessToken", data.accessToken);
        document.getElementById("login-form-button").innerText = "Inloggad!";
        window.location.reload();
      } else {
        document.getElementById("login-form-button").innerText =
          "Fel vid inloggning";
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Växlar logga in-texten om användaren är inloggad eller inte
// Visar även en 403-sida om användaren inte är inloggad och döljer formen för att ändra användare
document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-button");
  const loginText = loginButton.querySelector(".nav-link");
  const adminSection = document.getElementById("administration");
  const forbiddenSection = document.getElementById("forbidden");
  const token = localStorage.getItem("accessToken");

  if (token) {
    if (loginText) {
      loginText.innerHTML = 'Mina sidor <i class="bi bi-person-fill-gear"></i>';
    }
    if (loginButton) {
      loginButton.onclick = () =>
        (window.location.href = "/client/account.html");
    }
    if (adminSection) adminSection.classList.remove("hidden");
    if (forbiddenSection) forbiddenSection.classList.add("hidden");
  } else {
    if (adminSection) adminSection.classList.add("hidden");
    if (forbiddenSection) forbiddenSection.classList.remove("hidden");
  }
});

// Användarfeedback och PATCH-funktion till proxy.js
const updateFeedbackButton = document.getElementById("update-feedback");
const updateFeedbackMessage = document.querySelector(
  "#ModalUpdateMsg .modal-body p"
);

document.getElementById("update-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById("current-password").value;
  const newUsername = document.getElementById("new-username").value;
  const newPassword = document.getElementById("new-password").value;

  try {
    const response = await fetch(`${API_URL}/update-user`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ currentPassword, newUsername, newPassword }),
    });

    const data = await response.json();
    if (response.ok) {
      updateFeedbackButton.classList.remove("btn-danger");
      updateFeedbackButton.classList.add("btn-success");
      updateFeedbackMessage.innerText = "Användare uppdaterad!";
    } else {
      updateFeedbackButton.classList.remove("btn-success");
      updateFeedbackButton.classList.add("btn-danger");
      updateFeedbackMessage.innerText =
        data.message || "Misslyckades med att uppdatera användare";
    }
  } catch (error) {
    console.error("Error:", error);
    updateFeedbackButton.classList.remove("btn-success");
    updateFeedbackButton.classList.add("btn-danger");
    updateFeedbackMessage.innerText = "Något gick fel vid uppdatering";
  }
});

// Användarfeedback och DELETE-funktion till proxy.js
document
  .getElementById("delete-account")
  .addEventListener("click", async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_URL}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem("accessToken");
        window.location.href = "/client/index.html";
      } else {
        alert(data.message || "Något gick fel vid borttagning av konto");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Något gick fel vid borttagning av konto");
    }
  });
