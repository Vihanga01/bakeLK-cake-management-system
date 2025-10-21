const nodemailer = require('nodemailer');

// Expect GMAIL credentials in env (use Gmail App Password)
const MAIL_USER = process.env.MAIL_USER || 'bakelkcake@gmail.com';
const MAIL_PASS = process.env.MAIL_PASS;

let transporter;
if (MAIL_USER && MAIL_PASS) {
	// Use explicit Gmail SMTP to avoid "Missing credentials for PLAIN" issues
	transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: { user: MAIL_USER, pass: MAIL_PASS },
	});
} else {
	transporter = null;
}

async function sendOrderConfirmationEmail({ toEmail, customerName, orderId, items, paymentMethod }) {
	const itemsRows = items.map(i => `
		<tr>
			<td style="padding:8px 12px;border-bottom:1px solid #eee">${i.name}</td>
			<td style="padding:8px 12px;border-bottom:1px solid #eee">${i.quantity}</td>
			<td style="padding:8px 12px;border-bottom:1px solid #eee">$${(i.price * i.quantity).toFixed(2)}</td>
		</tr>
	`).join('');

	const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);

	const html = `
		<div style="font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;padding:16px;background:#f8fafc">
			<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 18px rgba(2,6,23,0.06);padding:20px">
				<h2 style="margin:0 0 4px;color:#16a34a">Thank you for your order, ${customerName}!</h2>
				<p style="margin:0 0 12px;color:#475569">Your Bake.lk order was received successfully.</p>
				<p style="margin:0 0 18px;color:#334155"><b>Order ID:</b> ${orderId}</p>
				<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:12px">
					<thead>
						<tr>
							<th align="left" style="padding:8px 12px;border-bottom:2px solid #e2e8f0;color:#0f172a">Item</th>
							<th align="left" style="padding:8px 12px;border-bottom:2px solid #e2e8f0;color:#0f172a">Qty</th>
							<th align="left" style="padding:8px 12px;border-bottom:2px solid #e2e8f0;color:#0f172a">Total</th>
						</tr>
					</thead>
					<tbody>
						${itemsRows}
					</tbody>
				</table>
				<p style="margin:0;color:#0f172a"><b>Subtotal:</b> $${subtotal.toFixed(2)}</p>
				<p style="margin:4px 0 0;color:#0f172a"><b>Payment Method:</b> ${paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}</p>
				<hr style="margin:18px 0;border:none;border-top:1px solid #e2e8f0" />
				<p style="margin:0;color:#475569">If you have any questions, reply to this email.</p>
				<p style="margin:2px 0 0;color:#16a34a;font-weight:600">Bake.lk</p>
			</div>
		</div>
	`;

    if (!transporter) {
        console.error('Email not sent: MAIL_USER/MAIL_PASS missing. Set Backend/.env and restart.');
        return;
    }

    await transporter.sendMail({
        from: `Bake.lk <${MAIL_USER}>`,
		to: toEmail,
		subject: `Bake.lk - Order Confirmation #${orderId}`,
		html,
	});
}

module.exports = { sendOrderConfirmationEmail };


