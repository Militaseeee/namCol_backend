import { transporter } from "../config/transporterNodemailer.js";
import dotenv from 'dotenv';

dotenv.config();

export async function sendResetEmail(userEmail, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"Support 👨‍💻" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Reset Your Password - ÑamCol",
        html: `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
        </style>
      </head>
      <body style="margin:0; padding:0; font-family:'Poppins', sans-serif; background-color:#f9f9f9;">
    
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9; padding:20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1); padding:30px;">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <h1 style="margin:0; font-size:24px; font-weight:600; color:#333; font-family:'Poppins', sans-serif;">
                      Password Reset
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:16px; line-height:1.6; color:#555; font-family:'Poppins', sans-serif; text-align:left;">
                    <p>Hello,</p>
                    <p>You requested to reset your password.</p>
                    <p>Please click the button below. The link will expire in <strong>15 minutes</strong>.</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <a href="${resetLink}" 
                       style="background-color:#FFC042; color:#000; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600; display:inline-block; font-family:'Poppins', sans-serif;">
                       Reset Password
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px; color:#888; text-align:center; padding-top:20px; font-family:'Poppins', sans-serif;">
                    If the button doesn’t work, copy and paste this link into your browser:<br>
                    <a href="${resetLink}" style="color:#FFC042;">${resetLink}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
    
      </body>
    </html>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent: ", info.messageId);
    } catch (error) {
        console.error("❌ Error sending email: ", error);
    }
};