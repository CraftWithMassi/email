
// 1. IMPORT REQUIRED MODULES
// We need 'express' to create the web server and 'fs' to write to our log file.
const express = require('express');
const fs = require('fs');
const path = require('path');
const geoip = require('geoip-lite')

// 2. INITIALIZE THE EXPRESS APP
// This creates our server application.
const app = express();
const PORT = 3000; // The port our server will listen on.

// 3. DEFINE THE 1x1 PIXEL IMAGE
// This is the raw binary data for a 1x1 transparent GIF.
// Storing it as a Buffer is efficient.
const pixelGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

// 4. CREATE THE TRACKING ENDPOINT
// This is the URL that will receive the requests from the email clients.
// We will use '/pixel.gif' as the path.
app.get('/pixel.gif', (req, res) => {

     // --- Perform Geolocation Lookup ---
     const userIp = req.ip || req.connection.remoteAddress;
     const geo = geoip.lookup(userIp);

     const trackingData = {
     
     timestamp: new Date().toISOString(),
     ip: userIp,
     userAgent: req.get('User-Agent'),
     referer: req.get('Referer') || 'Direct/Unknown',
     campaign: req.query.campaign || 'default',
     userId: req.query.user_id || 'anonymous',

     language: req.get('Accept-Language'), // e.g., "en-US,en;q=0.9"
     host: req.get('Host'), // The domain your pixel was called from, e.g., "yourdomain.com"
     url: req.originalUrl, // The full URL with query params, e.g., "/pixel.gif?campaign=..."
     encoding: req.get('Accept-Encoding'), // e.g., "gzip, deflate, br"
    
     // --- Add Geolocation Data ---
     country: geo ? geo.country : 'Unknown',
     region: geo ? geo.region : 'Unknown',
     city: geo ? geo.city : 'Unknown',
     timezone: geo ? geo.timezone : 'Unknown',
    };

    // Convert the data object to a nicely formatted JSON string for our log
    const logEntry = JSON.stringify(trackingData) + '\n';

    // Define the path for our log file
    const logFilePath = path.join(__dirname, 'track.log');

    // Append the new data to the log file. If it doesn't exist, it will be created.
    fs.appendFile(logFilePath, logEntry, (err) => {
        // If there's an error writing the file, log it to the console.
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
    console.log(logEntry);

    // --- Part B: SERVE THE PIXEL ---

    // Set the HTTP header to tell the browser this is a GIF image.
    res.setHeader('Content-Type', 'image/gif');
    // Set cache control headers to ensure the pixel is not cached, so every request is logged.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    // Send the 1x1 pixel data back to the client.
    res.send(pixelGif);
});

// 5. CREATE A "HEALTH CHECK" ROUTE (Optional but Recommended)
// This lets us easily check if our server is running.
app.get('/', (req, res) => {
    res.send('Tracking pixel server is running successfully!');
});

// 6. START THE SERVER
// This command starts the server and makes it listen for incoming requests.
app.listen(PORT, () => {
    console.log(`---------------------------------`);
    console.log(`Tracking server is running.`);
    console.log(`Access it at: http://localhost:${PORT}`);
    console.log(`Pixel endpoint: http://localhost:${PORT}/pixel.gif`);
    console.log(`---------------------------------`);
});