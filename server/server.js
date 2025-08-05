// ~/mern-email-backup/server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// --- In-memory storage for MVP ---
// In a production app, use environment variables or a secure vault.
let graphApiToken = '';
let mongoClient = null;
let BackupModel = null;

// --- Mongoose Schema ---
const backupSchema = new mongoose.Schema({
    graphId: { type: String, required: true, unique: true, index: true },
    subject: String,
    receivedDateTime: Date,
    body: {
        contentType: String,
        content: String,
    },
    from: {
        emailAddress: {
            name: String,
            address: String,
        },
    },
    attachments: [{
        name: String,
        contentType: String,
        size: Number,
        contentBytes: String, // Storing as base64 string
    }],
}, { timestamps: true });


// --- API Endpoints ---

// 1. Initial Setup
app.post('/api/setup', async (req, res) => {
    const { token, mongoUri } = req.body;
    if (!token || !mongoUri) {
        return res.status(400).json({ message: 'Graph API token and MongoDB URI are required.' });
    }

    graphApiToken = token;

    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(mongoUri);
            console.log('MongoDB connected successfully.');
        }
        BackupModel = mongoose.model('Backup', backupSchema);
        res.status(200).json({ message: 'Configuration successful.' });
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        res.status(500).json({ message: 'Failed to connect to MongoDB.', error: error.message });
    }
});

// 2. Fetch Emails with Attachment Status
app.get('/api/emails', async (req, res) => {
    if (!graphApiToken || !BackupModel) {
        return res.status(400).json({ message: 'App not configured. Please provide tokens on the setup page.' });
    }

    try {
        let allMessages = [];
        let nextLink = `https://graph.microsoft.com/v1.0/me/messages?$filter=hasAttachments eq true&$select=id,subject,receivedDateTime`;

        // Handle pagination from Graph API
        while (nextLink) {
            const response = await axios.get(nextLink, {
                headers: { 'Authorization': `Bearer ${graphApiToken}` }
            });
            allMessages.push(...response.data.value);
            nextLink = response.data['@odata.nextLink'];
        }

        // Check backup status for each email
        const emailStatusPromises = allMessages.map(async (msg, index) => {
            const backup = await BackupModel.findOne({ graphId: msg.id });
            return {
                '#': index + 1,
                id: msg.id,
                Title: msg.subject,
                Date: msg.receivedDateTime,
                BackedUp: !!backup,
            };
        });

        const emailsWithStatus = await Promise.all(emailStatusPromises);
        res.json(emailsWithStatus);

    } catch (error) {
        console.error('Error fetching emails:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Failed to fetch emails from Microsoft Graph.' });
    }
});

// 3. Backup a single email or multiple emails
app.post('/api/backup', async (req, res) => {
    const { emailIds } = req.body;
    if (!Array.isArray(emailIds) || emailIds.length === 0) {
        return res.status(400).json({ message: 'Email IDs must be a non-empty array.' });
    }

    const backupResults = [];

    for (const emailId of emailIds) {
        try {
            // Fetch full email details
            const msgRes = await axios.get(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
                headers: { 'Authorization': `Bearer ${graphApiToken}` }
            });

            // Fetch attachments
            const attachmentsRes = await axios.get(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/attachments`, {
                headers: { 'Authorization': `Bearer ${graphApiToken}` }
            });

            const emailData = msgRes.data;
            const attachmentsData = attachmentsRes.data.value;

            const backupData = {
                graphId: emailData.id,
                subject: emailData.subject,
                receivedDateTime: emailData.receivedDateTime,
                body: emailData.body,
                from: emailData.from,
                attachments: attachmentsData.map(att => ({
                    name: att.name,
                    contentType: att.contentType,
                    size: att.size,
                    contentBytes: att.contentBytes, // Base64 content
                })),
            };

            // Use findOneAndUpdate with upsert to avoid duplicates
            await BackupModel.findOneAndUpdate({ graphId: emailId }, backupData, { upsert: true, new: true });
            backupResults.push({ id: emailId, status: 'success' });

        } catch (error) {
            console.error(`Error backing up email ${emailId}:`, error.message);
            backupResults.push({ id: emailId, status: 'error', message: error.message });
        }
    }
    res.status(200).json({ message: 'Backup process completed.', results: backupResults });
});

// 4. Get a backed-up email's full data for modal view
app.get('/api/emails/:id', async (req, res) => {
    try {
        const backup = await BackupModel.findOne({ graphId: req.params.id });
        if (!backup) {
            return res.status(404).json({ message: 'Backup not found.' });
        }
        res.json(backup);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching backup from DB.', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Add a start script to your server/package.json
// "scripts": { "start": "node server.js" }