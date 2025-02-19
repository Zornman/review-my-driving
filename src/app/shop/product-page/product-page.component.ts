import { Component, inject } from '@angular/core';
import { ImageArray, Product, Variant } from '../../shared/models/product';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CarouselComponent } from '../carousel/carousel.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/shopping_cart.service';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { SignUpDialogComponent } from '../../shared/modals/sign-up-dialog/sign-up-dialog.component';
import { QRCodeService } from '../../services/qr-code.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PrintifyService } from '../../services/printify.service';
import { MongoService } from '../../services/mongo.service';

@Component({
  selector: 'app-product-page',
  imports: [ CommonModule, HttpClientModule, FormsModule, CarouselComponent, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule ],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.scss'
})
export class ProductPageComponent {
  private _snackBar = inject(MatSnackBar);
  
  product!: Product;
  product_custom!: Product;
  productDescription!: SafeHtml;
  productImages: ImageArray[] = [];
  productVariants: Variant[] = [];
  loading = true;
  selectedVariant!: number;
  quantity!: number;
  quantities: number[] = Array.from({ length: 10 }, (_, i) => i + 1); // [1, 2, 3, ..., 10]
  user!: User | null;
  imageFile!: string;
  disableAdd: boolean = false;

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private sanitizer: DomSanitizer, 
    private cartService: CartService, 
    private authService: AuthService, 
    private dialog: MatDialog,
    private qrCodeService: QRCodeService,
    private printifyService: PrintifyService,
    private dbService: MongoService
  ) 
  {
    this.authService.getUser().subscribe((user) => {
      this.user = user;
    });
  }

  ngOnInit(): void {
    // Attempt to retrieve the product from the router's state
    const navigation = this.router.getCurrentNavigation();
    this.product = navigation?.extras.state?.['product'] || null;

    // If no product is found in state, handle it (e.g., from direct URL access)
    if (!this.product) {
      this._snackBar.open('Loading product details...');
      const productId = this.route.snapshot.paramMap.get('id');
      if (productId) {
        this.printifyService.getProduct(productId).subscribe({
          next: (response) => {
            this.product = response as Product;
            this.productImages = this.product.images;
            this.productVariants = this.product.variants.filter((variant) => variant.is_enabled);
            this.productDescription = this.sanitizer.bypassSecurityTrustHtml(this.product.description);
            this._snackBar.open('Product details loaded!', 'Ok', { duration: 3000 });
            this._snackBar.dismiss();
          },
          error: (error) => {
            this._snackBar.open('Error loading product details, please try again.', 'Ok', { duration: 3000 });
            this.dbService.insertErrorLog({
              fileName: 'product-page.component.ts',
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
        console.error('No product ID provided.');
      }
    }
  }

  isAddDisabled(): boolean {
    if (this.selectedVariant === undefined || this.quantity === undefined)
      return true;

    return false;
  }

  backToShop() {
    this.router.navigateByUrl('/shop');
  }

  async addToCart() {
    // Make sure the user is logged in before adding the product to the cart
    if (this.user) {
      await this.checkForExistingProduct();
    } else {
      this.openSignUpDialog();
    }
  }

  async checkForExistingProduct() {
    this._snackBar.open("Adding product to your cart...");
    this.disableAdd = true;

    await this.printifyService.getProducts().subscribe({
      next: (response: any) => {
        let products = response.data.map((item: any) => {
          return new Product(item);
        });

        if (this.user) {
          const uid = this.user ? this.user.uid : '';
          products = products.filter((x: Product) => x.title.includes(uid) && x.title.includes(this.product.title));
          if (products.length > 0) {
            this.cartService.addToCart({
              productId: products[0].id,
              variantId: this.selectedVariant,
              quantity: this.quantity,
              product: products[0]
            });
            this._snackBar.open("Product added to cart!", "Ok", { duration: 3000 });
            this.disableAdd = false;
          } else {
            this.createNewProduct();
            this.disableAdd = false;
          }
        }
      },
      error: (error) => {
        this.dbService.insertErrorLog({
          fileName: 'product-page.component.ts',
          method: 'checkForExistingProduct()',
          timestamp: new Date().toString(),
          error: error
        }).subscribe({
          next: (response: any) => {
              console.log(response);
          },
          error: (error: any) => {
          }
        });
        this.disableAdd = false;
      }
    });
  }

  async createNewProduct() {
    let qr_code: string;
    await this.qrCodeService.generateQRCode().then((base64) => {
      qr_code = base64;
      qr_code = qr_code.substring(22, base64.length);
      //console.log(this.user?.uid);
      this.printifyService.createCustomPrintifyProduct({ base64QRCode: qr_code, originalProductId: this.product.id, userID: this.user?.uid }).subscribe({
        next: (response: any) => {
          //console.log(response);
          this.cartService.addToCart({
            productId: response.product.id,
            variantId: this.selectedVariant,
            quantity: this.quantity,
            product: response.product
          });
          this._snackBar.open("Product added to cart!", "Ok", { duration: 3000 });
        },
        error: (error) => {
          this.dbService.insertErrorLog({
            fileName: 'product-page.component.ts',
            method: 'createNewProduct()',
            timestamp: new Date().toString(),
            error: error
          }).subscribe({
            next: (response: any) => {
                console.log(response);
            },
            error: (error: any) => {
            }
          });
        }
      });
    });
  }

  openSignUpDialog(): void {
    this.dialog.open(SignUpDialogComponent, {
      width: '400px', // Optional: Adjust dialog width
      disableClose: true // Optional: Prevent closing the dialog by clicking outside
    });
  }
}
