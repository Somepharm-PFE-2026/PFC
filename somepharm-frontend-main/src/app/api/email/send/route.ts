import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { recipient, variables, config } = await request.json();

        // Validate variables
        if (!recipient || !variables || !config) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Replace variables in subject and body
        let subject = config.welcomeEmailSubject;
        let body = config.welcomeEmailBody;

        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, value as string);
            body = body.replace(regex, value as string);
        });

        // Add NOM_ENTREPRISE and URL_CONNEXION if not in variables
        const globalVars: any = {
            NOM_ENTREPRISE: config.entrepriseNom || 'SomePharm',
            URL_CONNEXION: config.urlConnexion || 'http://localhost:3000/login'
        };

        Object.entries(globalVars).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, value as string);
            body = body.replace(regex, value as string);
        });

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort || 587,
            secure: config.smtpSecure,
            auth: {
                user: config.smtpUser,
                pass: config.smtpPass
            }
        });

        // Send Email
        const info = await transporter.sendMail({
            from: `"SomePharm IT" <${config.smtpUser}>`,
            to: recipient,
            subject: subject,
            text: body, // Plain text version
            html: body.replace(/\n/g, '<br/>') // Basic HTML conversion
        });

        return NextResponse.json({
            action: "WELCOME_EMAIL_SENT",
            status: "SUCCESS",
            messageId: info.messageId,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Email sending error:', error);
        return NextResponse.json({ 
            status: "ERROR", 
            message: error.message 
        }, { status: 500 });
    }
}
