import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendOtpEmail = async (toEmail, otp) => {
    const mailOptions = {
        from: `"FlowFinance" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Your Password Reset OTP",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #4F46E5; margin-bottom: 8px;">FlowFinance</h2>
                <p style="color: #475569; font-size: 15px;">You requested a password reset code. Use the OTP below to complete the verification:</p>
                <div style="background: #f1f5f9; padding: 14px; text-align: center; border-radius: 6px; margin: 20px 0;">
                    <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 13px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
        `,
    };

    return await transporter.sendMail(mailOptions);
};