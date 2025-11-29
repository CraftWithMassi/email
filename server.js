
const express = require('express');
const axios = require('axios');
require("dotenv").config();
const geoip = require('geoip-lite');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;


const app = express();
const PORT = process.env.PORT || 3000;

const pixelGif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);


async function sendToTelegram(text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: CHAT_ID,
            text,
            parse_mode: "HTML"
        });
    } catch (err) {
        console.error("Failed to send Telegram message:", err.message);
    }
}


app.get('/pixel.gif', async (req, res) => {
    const userIp = req.ip || req.connection.remoteAddress;
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

 
    sendToTelegram(msg);

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
