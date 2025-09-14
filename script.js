// ====== تهيئة Firebase ======
const firebaseConfig = {
  databaseURL: "https://smartlockapp-e22e7-default-rtdb.firebaseio.com/"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ====== الترجمات ======
const translations = {
  ar: {
    enterBoth: "الرجاء إدخال رقم الصندوق ورمز الدخول.",
    codeVerified: "تم التحقق بنجاح!",
    codeInvalid: "رقم الصندوق أو الرمز غير صحيح.",
    retryAfter: "يمكنك المحاولة مرة أخرى بعد {{sec}} ثانية.",
    resetTitle: "إعادة تعيين رمز الدخول",
    boxLabel: "رقم الصندوق:",
    emailLabel: "البريد الإلكتروني:",
    confirmBtn: "تأكيد",
    placeholderBox: "أدخل رقم الصندوق",
    placeholderEmail: "أدخل بريدك الإلكتروني",
    resetSuccess: "تم إرسال رمز الدخول بنجاح!",
    resetError: "رقم الصندوق أو البريد الإلكتروني غير صحيح.",
    codeVerifyError: "حدث خطأ أثناء التحقق من الرمز.",
    submitSuccess: "تم إرسال بيانات المستأجر بنجاح!"
  },
  en: {
    enterBoth: "Please enter box number and access code.",
    codeVerified: "Verified successfully!",
    codeInvalid: "Box number or code is invalid.",
    retryAfter: "You can try again after {{sec}} seconds.",
    resetTitle: "Reset Access Code",
    boxLabel: "Box Number:",
    emailLabel: "Email:",
    confirmBtn: "Confirm",
    placeholderBox: "Enter box number",
    placeholderEmail: "Enter your email",
    resetSuccess: "Access code sent successfully!",
    resetError: "Box number or email is incorrect.",
    codeVerifyError: "An error occurred while verifying the code.",
    submitSuccess: "Tenant data submitted successfully!"
  }
};

// ====== اللغة والاتجاه ======
let currentLanguage = localStorage.getItem("language") || "ar";

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document
    .querySelectorAll("[data-ar], [data-en], [data-ar-placeholder], [data-en-placeholder]")
    .forEach(el => {
      if (el.tagName === "INPUT") {
        const ph = el.getAttribute(`data-${lang}-placeholder`);
        if (ph) el.placeholder = ph;
      }
      const txt = el.getAttribute(`data-${lang}`);
      if (txt) el.textContent = txt;
    });
}

function toggleLang() {
  setLanguage(currentLanguage === "ar" ? "en" : "ar");
  applyResetLang();
}

function applyResetLang() {
  const t = translations[currentLanguage];
  const title = document.getElementById("title");
  if (title) title.textContent = t.resetTitle;
  const boxLabel = document.getElementById("boxLabel");
  if (boxLabel) boxLabel.textContent = t.boxLabel;
  const emailLabel = document.getElementById("emailLabel");
  if (emailLabel) emailLabel.textContent = t.emailLabel;
  const confirmBtn = document.getElementById("confirmResetButton");
  if (confirmBtn) confirmBtn.textContent = t.confirmBtn;
  const boxInput = document.getElementById("boxNumberReset");
  if (boxInput) boxInput.placeholder = t.placeholderBox;
  const emailInput = document.getElementById("emailReset");
  if (emailInput) emailInput.placeholder = t.placeholderEmail;
}

// ====== دالة موحّدة للإشعار ======
function showNotification(keyOrMsg, type = "success", data = {}) {
  const t = translations[currentLanguage];
  let message = t[keyOrMsg] || keyOrMsg;
  Object.keys(data).forEach(k => {
    message = message.replace(`{{${k}}}`, data[k]);
  });
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  const icon = type === "success" ? "✅" : "❌";
  notification.innerHTML = `<span class="notification-icon">${icon}</span>
                            <span class="notification-message">${message}</span>`;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add("show"), 100);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// ====== عدّاد محاولات ======
let failedAttempts = 0;

// ====== بعد تحميل الصفحة ======
document.addEventListener("DOMContentLoaded", () => {
  setLanguage(currentLanguage);

  // زر الدخول لعرض نموذج المستأجر
  const btnLogin = document.getElementById("btn-login");
  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      const loginContainer = document.getElementById("loginContainer");
      const tenantContainer = document.getElementById("tenantContainer");
      if (loginContainer) loginContainer.style.display = "none";
      if (tenantContainer) tenantContainer.style.display = "block";
    });
  }

  // نموذج إرسال بيانات المستأجر
  const tenantForm = document.getElementById("tenantForm");
  if (tenantForm) {
    tenantForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const tenantData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        boxNumber: document.getElementById("boxNumber").value,
        checkin: document.getElementById("checkin").value,
        checkout: document.getElementById("checkout").value
      };

      firebase.database().ref("tenants").push(tenantData)
        .then(() => {
          showNotification("submitSuccess", "success");
          localStorage.setItem("tenantData", JSON.stringify(tenantData));
          tenantForm.reset();
          setTimeout(() => window.location.href = "index.html", 3000);
        })
        .catch((error) => {
          showNotification("حدث خطأ: " + error.message, "error");
        });
    });
  }

  // زر فتح القفل
  const unlockBtn = document.getElementById("btn-to-code-entry");
  if (unlockBtn) {
    unlockBtn.addEventListener("click", () => {
      window.location.href = "code_entry.html";
    });
  }

  // التحقق من الكود
  const codeForm = document.getElementById("codeForm");
  if (codeForm) {
    codeForm.addEventListener("submit", e => {
      e.preventDefault();
      verifyAccessCode();
    });
  }

  const resetBtn = document.getElementById("confirmResetButton");
  if (resetBtn) {
    applyResetLang();
    resetBtn.addEventListener("click", handleReset);
  }
});

// ====== دالة التحقق من الكود ======
function verifyAccessCode() {
  const box = document.getElementById("boxNumberCode")?.value.trim();
  const code = document.getElementById("code")?.value.trim();
  const msgEl = document.getElementById("codeMessage");
  const t = translations[currentLanguage];

  if (!box || !code) return showNotification("enterBoth", "error");

  database.ref("accessCodes/" + code).once("value")
    .then(snap => {
      if (snap.exists() && snap.val().boxNumber === box) {
        if (msgEl) msgEl.textContent = t.codeVerified;
        document.getElementById("unlockButton").style.display = "block";
      } else {
        failedAttempts++;
        if (msgEl) msgEl.textContent = t.codeInvalid;
        if (failedAttempts >= 2) {
          document.getElementById("boxNumberCode").disabled = true;
          document.getElementById("code").disabled = true;
          document.getElementById("verifyCodeButton").disabled = true;
          document.getElementById("resetCodeButton").style.display = "block";

          const waitSec = 30;
          showNotification("retryAfter", "error", { sec: waitSec });

          setTimeout(() => {
            failedAttempts = 0;
            document.getElementById("boxNumberCode").disabled = false;
            document.getElementById("code").disabled = false;
            document.getElementById("verifyCodeButton").disabled = false;
            document.getElementById("resetCodeButton").style.display = "none";
          }, waitSec * 1000);
        }
      }
    })
    .catch(() => showNotification("codeVerifyError", "error"));
}

// ====== دالة إعادة تعيين الكود ======
function handleReset() {
  const box = document.getElementById("boxNumberReset")?.value.trim();
  const email = document.getElementById("emailReset")?.value.trim();
  const t = translations[currentLanguage];

  if (!box || !email) return showNotification("resetError", "error");

  database.ref("boxes/" + box).once("value")
    .then(snap => {
      if (snap.exists() && snap.val().email === email) {
        showNotification("resetSuccess", "success");
      } else {
        showNotification("resetError", "error");
      }
    })
    .catch(() => showNotification("resetError", "error"));
}
