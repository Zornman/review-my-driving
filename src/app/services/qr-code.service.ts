import { Injectable } from '@angular/core';
import { QRCodeToDataURLOptions } from 'qrcode';
import { AuthService } from './auth.service';

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
        try {

            const options: QRCodeToDataURLOptions = {
                width: 3000, // Set the desired width in pixels
                errorCorrectionLevel: 'H', // High error correction level
              };

            return await this.QRCode.toDataURL(url, options); // Returns a Base64 data URL
        } catch (err) {
            console.error('Error generating QR code:', err);
            throw err;
        }
    }
}