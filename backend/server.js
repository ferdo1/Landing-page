require('dotenv').config();

   console.log('EMAIL_USER:', process.env.EMAIL_USER);
   console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
   console.log('OWNER_EMAIL:', process.env.OWNER_EMAIL);

   const express = require('express');
   const nodemailer = require('nodemailer');
   const cors = require('cors');
   const path = require('path');

   const app = express();

   // Middleware
   app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:5500'] }));
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.use(express.static(path.join(__dirname, '..', 'frontend')));

   // Email configuration
   const transporter = nodemailer.createTransport({
     host: 'smtp.gmail.com',
     port: 587,
     secure: false,
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS,
     },
     connectionTimeout: 10000,
     greetingTimeout: 10000,
     socketTimeout: 10000,
   });

   // Verify transporter configuration
   transporter.verify((error, success) => {
     if (error) {
       console.error('Transporter verification failed:', error);
     } else {
       console.log('Transporter is ready to send emails');
     }
   });

   // Serve the frontend
   app.get('/', (req, res) => {
     res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
   });

   // Handle form submission
   app.post('/api/submit', async (req, res) => {
     const { name, email } = req.body;

     if (!email) {
       return res.status(400).json({ error: 'Email is required' });
     }

     try {
       // Send email to page owner
       const ownerMailOptions = {
         from: `"Social Media Kit" <${process.env.EMAIL_USER}>`,
         to: process.env.OWNER_EMAIL,
         subject: 'New Social Media Kit Request',
         text: `New submission:\nName: ${name || 'Not provided'}\nEmail: ${email}`,
       };

       const ownerMailInfo = await transporter.sendMail(ownerMailOptions);
       console.log('Owner email sent:', ownerMailInfo.messageId);

       // Send kit to user
       const userMailOptions = {
         from: `"Social Media Kit" <${process.env.EMAIL_USER}>`,
         to: email,
         subject: 'Your 30-Day Social Media Content Kit',
         text: `Thank you, ${name || 'User'}, for requesting the 30-Day Social Media Content Kit!\n\n` +
               `You'll receive the kit shortly. If you have any questions, contact us at ${process.env.EMAIL_USER}.`,
         // attachments: [{ path: path.join(__dirname, '..', 'frontend', 'kit.pdf') }]
       };

       const userMailInfo = await transporter.sendMail(userMailOptions);
       console.log('User email sent:', userMailInfo.messageId);

       res.status(200).json({ message: 'Success! Kit request submitted, and emails sent.' });
     } catch (error) {
       console.error('Error sending email:', error);
       res.status(500).json({ error: 'Failed to process request' });
     }
   });

   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => {
     console.log(`Server running on http://localhost:${PORT}`);
   });