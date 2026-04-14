import nodemailer from 'nodemailer';

/**
 * Sends email notification about newly opened golfs
 * @param {Array} golfs - Array of newly opened golfs
 */
export async function sendNotification(golfs) {
  if (!process.env.SEND_EMAIL_NOTIFICATIONS || process.env.SEND_EMAIL_NOTIFICATIONS === 'false') {
    console.log('Email notifications disabled');
    return;
  }

  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const golfsList = golfs
      .map(g => `• ${g.name} (${g.region}) - Ouverture: ${g.openingDate}`)
      .join('\n');

    const emailContent = `
Bonjour,

Les golfs suivants viennent d'annoncer leurs dates d'ouverture:

${golfsList}

Consultez la liste complète sur: http://localhost:3000

Cordialement,
Golf Monitor
    `;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `🏌️ ${golfs.length} nouveau(x) golf(s) ouvert(s) au Québec`,
      text: emailContent,
      html: `
        <h2>🏌️ Nouvelles dates d'ouverture de golfs</h2>
        <p>Les golfs suivants viennent d'annoncer leurs dates d'ouverture:</p>
        <ul>
          ${golfs.map(g => `<li><strong>${g.name}</strong> (${g.region}) - <em>${g.openingDate}</em></li>`).join('')}
        </ul>
        <p><a href="http://localhost:3000">Voir la liste complète</a></p>
      `
    });

    console.log(`✓ Email notification sent to ${process.env.NOTIFICATION_EMAIL}`);
  } catch (error) {
    console.error('Failed to send notification:', error.message);
  }
}
