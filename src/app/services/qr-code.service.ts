import { Injectable } from '@angular/core';
import QRCode, { QRCodeToDataURLOptions } from 'qrcode';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class QRCodeService {
    baseURL: string = 'https://www.reviewmydriving.co/';
    userID!: string;

    constructor(private authService: AuthService) {
        this.authService.getUser().subscribe((user) => {
            if (user)
                this.userID = user.uid;
        });
    }

    async generateQRCode(): Promise<string> {
        const url = `${this.baseURL}home?id=${this.userID}`;
        try {

            const options: QRCodeToDataURLOptions = {
                width: 3000, // Set the desired width in pixels
                errorCorrectionLevel: 'H', // High error correction level
              };

            return await QRCode.toDataURL(url, options); // Returns a Base64 data URL
        } catch (err) {
            console.error('Error generating QR code:', err);
            throw err;
        }
    }
}