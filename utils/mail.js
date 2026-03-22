import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (option) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Event Management",
      link: "https://eventManagement.com",
    },
  });
  const emailTextual = mailGenerator.generatePlaintext(option.mailgenContent);
  const emailHtml = mailGenerator.generate(option.mailgenContent);
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });
  const mail = {
    from: "mail.eventmanagement@example.com",
    to: option.email,
    subject: option.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error(
      "Email service failed siliently, Make sure that you have provided your mailtrap credentials in .env file",
    );
    console.error("Email ", error);
  }
};

const emailVerificationMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to our website!",
      action: {
        instructions:
          "To verify your email please click on the following button",
        button: {
          color: "#4bd487ff",
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? just reply to this email, we'd love to help",
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "We got a request to reset password of your current account!",
      action: {
        instructions: "To reset your password click on the following button",
        button: {
          color: "#d92727ff",
          text: "Reset password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? just reply to this email, we'd love to help",
    },
  };
};

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
};
