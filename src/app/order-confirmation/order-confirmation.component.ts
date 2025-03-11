import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { User } from 'firebase/auth';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MongoService } from '../services/mongo.service';
import { EmailService } from '../services/email.service';

@Component({
  selector: 'app-order-confirmation',
  imports: [],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss'
})
export class OrderConfirmationComponent implements OnInit {
  user!: User | null;
  orderID!: string | null;

  constructor(private authService: AuthService, private route: ActivatedRoute, private dbService: MongoService, private emailService: EmailService) {
    
  }

  async ngOnInit() {
      this.authService.getUser().subscribe(async (user) => {
        this.user = user;
        if (this.user) {
          this.orderID = this.route.snapshot.paramMap.get('id');
          this.insertOrderHistoryRecord();
          await this.sendEmailConfirmation();
        }
      });
    }

  async insertOrderHistoryRecord() {
    const data = {
      userID: this.user?.uid,
      orderID: this.orderID,
      dateOrdered: new Date().toDateString(),
      emailOrderConfirm: false,
      emailOrderShipped: false,
      emailOrderCanceled: false,
      emailOrderCreated: false
    };

    this.dbService.insertUserOrderHistoryRecord(JSON.stringify(data)).subscribe({
      next: (response: any) => {
        //console.log('Order sent to MongoDB:', response);
      },
      error: (error: any) => {
        console.error('Error sending order to database:', error);
      }
    });
  }

  sendEmailConfirmation() {
    this.emailService.sendOrderConfirmationEmail({orderID: this.orderID}).subscribe({
      next: (response: any) => {
        //console.log('Order sent to MongoDB:', response);
      },
      error: (error: any) => {
        console.error('Error sending order email:', error);
      }
    });
  }
}
