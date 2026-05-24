export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    submitter_name, submitter_email, team, client_project,
    description, urgency, target_date, path, routed_to
  } = req.body;

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@tagww.com';
  const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'cpo@tagww.com';

  const urgencyLabel = urgency === 'urgent' ? '🔴 Urgent' : '🟢 Standard';
  const dateStr = target_date ? new Date(target_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }) : 'No date set';

  // Email to submitter
  const confirmationEmail = {
    from: FROM_EMAIL,
    to: submitter_email,
    subject: `Request received — routed to ${routed_to}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
        <div style="border-bottom:3px solid #F5E003;padding-bottom:16px;margin-bottom:24px">
          <strong style="font-size:20px;letter-spacing:-0.5px">tag</strong>
          <span style="margin-left:12px;font-size:12px;color:#888">Products &amp; Solutions</span>
        </div>
        <h2 style="font-size:18px;margin:0 0 8px">Your request has been received</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 20px">Hi ${submitter_name}, your request has been logged and routed to <strong>${routed_to}</strong>. They'll be in touch shortly.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
          <tr style="background:#f9f9f8"><td style="padding:10px 12px;color:#888;width:140px">Path</td><td style="padding:10px 12px">${path}</td></tr>
          <tr><td style="padding:10px 12px;color:#888">Routed to</td><td style="padding:10px 12px"><strong>${routed_to}</strong></td></tr>
          <tr style="background:#f9f9f8"><td style="padding:10px 12px;color:#888">Team</td><td style="padding:10px 12px">${team}</td></tr>
          ${client_project ? `<tr><td style="padding:10px 12px;color:#888">Client / project</td><td style="padding:10px 12px">${client_project}</td></tr>` : ''}
          <tr style="background:#f9f9f8"><td style="padding:10px 12px;color:#888">Urgency</td><td style="padding:10px 12px">${urgencyLabel}</td></tr>
          <tr><td style="padding:10px 12px;color:#888">Target date</td><td style="padding:10px 12px">${dateStr}</td></tr>
          <tr style="background:#f9f9f8"><td style="padding:10px 12px;color:#888;vertical-align:top">Description</td><td style="padding:10px 12px">${description}</td></tr>
        </table>
        <p style="font-size:12px;color:#aaa">Tag Products &amp; Solutions · Internal use only</p>
      </div>
    `
  };

  // Email to routed contact
  const routingEmail = {
    from: FROM_EMAIL,
    to: CONTACT_EMAIL,
    subject: `[${urgencyLabel}] New request from ${submitter_name} — ${team}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
        <div style="border-bottom:3px solid #F5E003;padding-bottom:16px;margin-bottom:24px">
          <strong style="font-size:20px;letter-spacing:-0.5px">tag</strong>
          <span style="margin-left:12px;font-size:12px;color:#888">Products &amp; Solutions</span>
        </div>
        <div style="background:#FEF9E7;border-left:3px solid #F5E003;padding:12px 16px;border-radius:4px;margin-bottom:20px">
          <strong style="font-size:14px">New request routed to you: ${routed_to}</strong>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
          <tr style="background:#f9f9f8"><td style="padding:10px 12px;color:#888;width:140px">From</td><td style="padding:10px 12px"><strong>${submitter_name}</strong> &lt;${submitter_email}&gt;</td></tr>
          <tr><td style="padding:10px 12px;color:#888">Team</td><td style="padding:10px 12px">${team}</td></tr>
          <tr style="background:#f9f9f8"><td style="padding:10px 12px;color:#888">Path</td><td style="padding:10px 12px">${path}</td></tr>
          ${client_project ? `<tr><td style="padding:10px 12px;color:#888">Client / project</td><td style="padding:10px 12px">${client_project}</td></tr>` : ''}
          <tr style="background:#f9f9f8"><td style="padding:10px 12px;color:#888">Urgency</td><td style="padding:10px 12px"><strong>${urgencyLabel}</strong></td></tr>
          <tr><td style="padding:10px 12px;color:#888">Target date</td><td style="padding:10px 12px">${dateStr}</td></tr>
          <tr style="background:#f9f9f8"><td style="padding:10px 12px;color:#888;vertical-align:top">Description</td><td style="padding:10px 12px">${description}</td></tr>
        </table>
        <p style="font-size:12px;color:#aaa">View all requests in the <a href="${process.env.VERCEL_URL ? 'https://'+process.env.VERCEL_URL : ''}/dashboard.html" style="color:#111">submissions dashboard</a>.</p>
      </div>
    `
  };

  try {
    await Promise.all([
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmationEmail)
      }),
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(routingEmail)
      })
    ]);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Email error:', e);
    res.status(500).json({ error: 'Email failed' });
  }
}
