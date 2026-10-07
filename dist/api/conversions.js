const crypto = require('crypto');

const META_PIXEL_ID = process.env.META_PIXEL_ID || '979841341182458';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'EAAT9k03bEqsBSgjVoa82Fet3Yiurus5KtnXVbjnPh6eVD42uNpHjz4uJsZAgZCRYrg4jcPZBZCIXZBPbNrCdrMzKryYhF0c07LSM2qmkIBvJ2OpsgIigbbcBVLFByCi6d8ZALAg87QREmel4XtaTh75xWR60eKdNYeYjvkTdCZAp4jZCk0dGoJiFVJAxneHXYAZDZD';

function sha256(val) {
  if (!val) return null;
  return crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      eventName = 'Lead',
      eventId,
      value = 0,
      currency = 'EUR',
      name = '',
      phone = '',
      sourceUrl = '',
      fbp,
      fbc,
      testEventCode
    } = body;

    const rawIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '';
    const clientUserAgent = req.headers['user-agent'] || '';

    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.slice(2);
    if (/^9\d{8}$/.test(cleanPhone)) cleanPhone = '351' + cleanPhone;

    const nameParts = String(name).trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const userData = {
      client_user_agent: clientUserAgent,
      ...(clientIp ? { client_ip_address: clientIp } : {})
    };

    if (cleanPhone) {
      userData.ph = [sha256(cleanPhone)];
    }
    if (firstName) {
      userData.fn = [sha256(firstName)];
    }
    if (lastName) {
      userData.ln = [sha256(lastName)];
    }
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;

    const eventPayload = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: sourceUrl || req.headers['referer'] || '',
      action_source: 'website',
      user_data: userData,
      custom_data: {
        value: Number(value) || 0,
        currency: currency || 'EUR'
      }
    };

    const requestBody = {
      data: [eventPayload],
      access_token: META_ACCESS_TOKEN
    };

    if (testEventCode) {
      requestBody.test_event_code = testEventCode;
    }

    const metaResponse = await fetch(`https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error('Meta CAPI error response:', metaResult);
      return res.status(metaResponse.status).json({ success: false, error: metaResult });
    }

    return res.status(200).json({ success: true, result: metaResult });
  } catch (err) {
    console.error('Error processing conversions event:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
