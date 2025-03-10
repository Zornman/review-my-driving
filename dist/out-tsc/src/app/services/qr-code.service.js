import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
let QRCodeService = class QRCodeService {
    authService;
    baseURL = 'https://www.reviewmydriving.co/';
    userID;
    QRCode;
    constructor(authService) {
        this.authService = authService;
        this.loadQRCodeModule();
        this.authService.getUser().subscribe((user) => {
            if (user)
                this.userID = user.uid;
        });
    }
    async loadQRCodeModule() {
        this.QRCode = (await import('qrcode')).default;
    }
    async generateQRCode() {
        const url = `${this.baseURL}home?id=${this.userID}`;
        try {
            const options = {
                width: 3000, // Set the desired width in pixels
                errorCorrectionLevel: 'H', // High error correction level
            };
            return await this.QRCode.toDataURL(url, options); // Returns a Base64 data URL
        }
        catch (err) {
            console.error('Error generating QR code:', err);
            throw err;
        }
    }
};
QRCodeService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], QRCodeService);
export { QRCodeService };
