import { Injectable } from '@angular/core';
import { QRCodeToDataURLOptions } from 'qrcode';
import { AuthService } from './auth.service';
import { v4 as uuidv4 } from 'uuid'; // Import the uuid library

@Injectable({
    providedIn: 'root'
})
export class QRCodeService {
    baseURL: string = 'https://www.reviewmydriving.co/';
    userID!: string;
    QRCode!: any;

    constructor(private authService: AuthService) {
        this.loadQRCodeModule();
        this.authService.getUser().subscribe((user) => {
            if (user)
                this.userID = user.uid;
        });
    }

    private async loadQRCodeModule() {
        this.QRCode = (await import('qrcode')).default;
    }

    async generateQRCode(): Promise<string> {
        const url = `${this.baseURL}home?id=${this.userID}`;
        
        return this.createQRCode(url); // Returns a Base64 data URL
    }

    async generateQRCodeSamples(number_of_samples: number): Promise<{ uniqueId: string; qrCode: string }[]> {
        const qrCodes: { uniqueId: string; qrCode: string }[] = [];
    
        for (let i = 0; i < number_of_samples; i++) {
            const uniqueId = `QR${Date.now()}${i + 1}`; // Generate a unique ID
            const url = `${this.baseURL}home?uniqueId=${uniqueId}`; // Embed the uniqueId in the URL
            const qrCode = await this.createQRCode(url); // Generate the QR code
            qrCodes.push({ uniqueId, qrCode });
        }
    
        return qrCodes; // Return an array of objects containing uniqueId and QR code
    }

    private async createQRCode(url: string): Promise<string> {
        try {
            const options: QRCodeToDataURLOptions = {
                width: 3000, // Set the desired width in pixels
                errorCorrectionLevel: 'H', // High error correction level
            };
            return await this.QRCode.toDataURL(url, options); // Returns a Base64 data URL
        } catch (err) {
            console.error('Error creating QR code:', err);
            throw err;
        }
    }
}