import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { User } from 'firebase/auth';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MongoService } from '../services/mongo.service';

@Component({
  selector: 'app-order-confirmation',
  imports: [],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss'
})
export class OrderConfirmationComponent implements OnInit {
  user!: User | null;
  orderID!: string | null;

  constructor(private authService: AuthService, private route: ActivatedRoute, private dbService: MongoService) {
    this.authService.getUser().subscribe((user) => {
      this.user = user;
      if (this.user) {
        this.insertOrderHistoryRecord();
      }
    });
  }

  ngOnInit() {
    this.orderID = this.route.snapshot.paramMap.get('id');
  }

  insertOrderHistoryRecord() {
    const data = {
      userID: this.user?.uid,
      orderID: this.orderID,
      dateOrdered: new Date().toDateString()
    };

    this.dbService.insertUserOrderHistoryRecord(data).subscribe({
      next: (response: any) => {
        //console.log('Order sent to MongoDB:', response);
      },
      error: (error: any) => {
        console.error('Error sending order:', error);
      }
    });
  }
}
