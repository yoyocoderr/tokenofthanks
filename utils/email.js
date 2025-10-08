const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT) || 587;
  // Support both service-based and host/port configuration
  if (process.env.EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured, skipping email send');
      return { success: false, message: 'Email not configured' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Token of Thanks" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  tokenReceived: (data) => ({
    subject: 'You received tokens of gratitude! 🎉',
    html: `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #6C63FF 0%, #9D8CFF 100%); padding: 20px; border-radius: 15px; color: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎉 You received ${data.amount} tokens!</h1>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 10px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>From:</strong> ${data.senderName}</p>
          <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>Message:</strong> "${data.message}"</p>
          <p style="margin: 0; font-size: 16px;"><strong>Your new balance:</strong> ${data.newBalance} tokens</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Thank you for spreading kindness! 💜</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">Token of Thanks - Gratitude, Made Effortless</p>
        </div>
      </div>
    `
  }),

  welcome: (data) => ({
    subject: 'Welcome to Token of Thanks! 🌟',
    html: `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #6C63FF 0%, #9D8CFF 100%); padding: 20px; border-radius: 15px; color: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Welcome to Token of Thanks! 🌟</h1>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 10px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${data.firstName},</p>
          <p style="margin: 0 0 15px 0; font-size: 16px;">Welcome to the community of gratitude! You now have <strong>${data.tokenBalance} tokens</strong> to start spreading kindness.</p>
          <p style="margin: 0; font-size: 16px;">Start by sending tokens to someone who has made a difference in your life!</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Gratitude, Made Effortless 💜</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">Token of Thanks</p>
        </div>
      </div>
    `
  }),

  rewardRedeemed: (data) => ({
    subject: 'Reward Redeemed Successfully! 🎁',
    html: `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #6C63FF 0%, #9D8CFF 100%); padding: 20px; border-radius: 15px; color: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎁 Reward Redeemed!</h1>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 10px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>Reward:</strong> ${data.rewardName}</p>
          <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>Tokens spent:</strong> ${data.tokensSpent}</p>
          <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>New balance:</strong> ${data.newBalance}</p>
          ${data.redemptionCode ? `<p style="margin: 0; font-size: 16px;"><strong>Redemption code:</strong> ${data.redemptionCode}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Enjoy your reward! 💜</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">Token of Thanks</p>
        </div>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
}; 