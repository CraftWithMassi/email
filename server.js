
const express = require('express');
const axios = require('axios');
require("dotenv").config();
const geoip = require('geoip-lite');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;


const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP detection
app.set('trust proxy', true);

const pixelGif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);


async function sendToTelegram(text) {
    if (!TELEGRAM_TOKEN || !CHAT_ID) {
        console.error("Telegram credentials are missing. Check your .env file.");
        return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

    try {
        const response = await axios.post(url, {
            chat_id: CHAT_ID,
            text,
            parse_mode: "HTML"
        });
        console.log("Telegram message sent successfully");
        return response.data;
    } catch (err) {
        console.error("Failed to send Telegram message:", err.response?.data || err.message);
        throw err;
    }
}


app.get('/pixel.gif', async (req, res) => {
    // Get client IP (works better with trust proxy setting)
    const userIp = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || 'Unknown';
    const geo = geoip.lookup(userIp);

    const trackingData = {
        timestamp: new Date().toISOString(),
        ip: userIp,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer') || 'Direct/Unknown',
        campaign: req.query.campaign || 'default',
        userId: req.query.user_id || 'anonymous',
        language: req.get('Accept-Language'),
        host: req.get('Host'),
        url: req.originalUrl,
        encoding: req.get('Accept-Encoding'),
        country: geo ? geo.country : 'Unknown',
        region: geo ? geo.region : 'Unknown',
        city: geo ? geo.city : 'Unknown',
        timezone: geo ? geo.timezone : 'Unknown',
    };

    const msg = `
📩 <b>New Pixel Hit</b>

🕒 <b>Time:</b> ${trackingData.timestamp}
🧍 <b>User:</b> ${trackingData.userId}
🎯 <b>Campaign:</b> ${trackingData.campaign}

🌍 <b>IP:</b> ${trackingData.ip}
🏙️ <b>City:</b> ${trackingData.city}
🗺️ <b>Region:</b> ${trackingData.region}
🇨🇺 <b>Country:</b> ${trackingData.country}

🔗 <b>Referer:</b> ${trackingData.referer}
📱 <b>User Agent:</b> ${trackingData.userAgent}
`;

    // Send to Telegram (don't block response if it fails)
    try {
        await sendToTelegram(msg);
    } catch (err) {
        // Log error but don't fail the pixel request
        console.error("Telegram notification failed, but pixel served:", err.message);
    }
   
    // Serve the pixel
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.send(pixelGif);
});

//HEALTH CHECK ROUTE
app.get('/', (req, res) => {
    res.send('Tracking pixel server is running successfully!');
});

app.listen(PORT, () => {
    console.log(`---------------------------------`);
    console.log(`Tracking server is running.`);
    console.log(`Access it at: http://localhost:${PORT}`);
    console.log(`Pixel endpoint: http://localhost:${PORT}/pixel.gif`);
    console.log(`---------------------------------`);
});
