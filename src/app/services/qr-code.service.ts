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

    /**
     * Generate QR codes with business information embedded in the URL
     * @param numberOfCodes - Number of QR codes to generate
     * @param businessId - ID of the business
     * @returns Promise with array of QR code data including uniqueId and base64 encoded QR code
     */
    async generateBusinessQRCodes(numberOfCodes: number, businessId: string): Promise<Array<{ assetId: string; qrCode: string }>> {
    try {
        const qrCodesData: Array<{ assetId: string; qrCode: string }> = [];

        for (let i = 0; i < numberOfCodes; i++) {
            const assetId = `QR${Date.now()}${i + 1}`; // Generate a unique ID for each QR code
            const businessQRUrl = `${this.baseURL}home?businessId=${encodeURIComponent(businessId)}&assetId=${encodeURIComponent(assetId)}`; // Embed businessId and assetId in the URL
            const qrCode = await this.createQRCode(businessQRUrl); // Generate the QR code
            qrCodesData.push({ assetId, qrCode });
        }

        return qrCodesData;
    } catch (error) {
        console.error('Error generating business QR codes:', error);
        throw error;
    }
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