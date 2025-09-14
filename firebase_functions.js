const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mrtdk37@gmail.com",
    pass: "Rxrx@1313"
  }
});

exports.sendTenantEmail = functions.database.ref("/tenants/{tenantId}")
  .onCreate((snapshot, context) => {
    const tenantData = snapshot.val();
    const mailOptions = {
      from: "mrtdk37@gmail.com",
      to: "mrtdj2020@gmail.com",
      subject: "بيانات مستأجر جديد",
      text: `
        اسم المستأجر: ${tenantData.name}
        رقم الهاتف: ${tenantData.phone}
        البريد الإلكتروني: ${tenantData.email}
        تاريخ الوصول: ${tenantData.checkin}
        تاريخ المغادرة: ${tenantData.checkout}
      `
    };

    return transporter.sendMail(mailOptions)
      .then(() => console.log("📩 تم إرسال البريد بنجاح!"))
      .catch(error => console.error("❌ خطأ في إرسال البريد:", error));
  });
