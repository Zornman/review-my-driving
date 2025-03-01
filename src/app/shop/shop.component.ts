import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Product } from '../shared/models/product';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { PrintifyService } from '../services/printify.service';
import { MongoService } from '../services/mongo.service';

@Component({
  selector: 'app-shop',
  imports: [ HttpClientModule, CommonModule, MatCardModule, MatButtonModule, RouterModule ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss'
})
export class ShopComponent implements OnInit {
  products: Product[] = [];
  showReadMore: boolean = true;

  constructor(private router: Router, private printifyService: PrintifyService, private dbService: MongoService) {}

  ngOnInit(): void {

    let cachedProducts = localStorage?.getItem('products');

    if (!cachedProducts) {
      this.printifyService.getProducts().subscribe({
        next: (response: any) => {
          this.products = response.data.map((item: any) => {
              return new Product(item);
          });
  
          this.products = this.products.filter(x => x.visible);
          localStorage.setItem('products', JSON.stringify(this.products));
        },
        error: (error) => {
          this.dbService.insertErrorLog({
            fileName: 'shop.component.ts',
            method: 'ngOnInit()',
            timestamp: new Date().toString(),
            error: error
          }).subscribe({
            next: (response: any) => {
                console.log(response);
            },
            error: (error: any) => {
            }
          });
        },
      });
    } else {
      this.products = JSON.parse(cachedProducts);
    }
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/product', product.id]);
  }
}
