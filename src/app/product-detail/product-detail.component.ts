import { Component, OnInit, Input } from '@angular/core';
import { Options } from 'ng5-slider';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { NgbRatingConfig } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from "@angular/router";
import { AppService } from '../directive/app.service';
import { Action } from '../directive/app.constants';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { Helper } from '../directive/helper';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';
@Component({
  selector: 'product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  providers: [NgbRatingConfig]
})
export class ProductDetailComponent implements OnInit {
  //@Input() productDetails: any[];



  productDetail: any;
  reletedProduct: Array<any> = [];
  reviews: Array<any> = [];
  auth: any;

  qty: any = 1;
  review = {
    description: '',
    rate: 0
  }
  // minValue: number = 22;
  // maxValue: number = 77;
  options: Options = {
    floor: 0,
    ceil: 100,
    step: 1

  };

  currentJustify = 'center';
  customOptions: OwlOptions = {
    loop: false,
    pullDrag: false,
    dots: false,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      740: {
        items: 3
      },
      940: {
        items: 4
      }
    },
    nav: false
  }
  productId: any;
  galleryImages: Array<any> = [];
  constructor(
    config: NgbRatingConfig,
    private route: ActivatedRoute,
    public router: Router,
    private appService: AppService,
    private cookieService: CookieService,
    private spinnerService: Ng4LoadingSpinnerService,
    private Helper: Helper,
    private toastr: ToastrService,
  ) {
    config.max = 5;
    // config.readonly = true;
    this.route.queryParams.subscribe(params => {
      console.log(params)
      this.productId = params.productId;

      let userData = JSON.parse(localStorage.getItem('userData'));
      if (userData) {
        this.auth = true
      } else {
        this.auth = false
      }
      // this.auth = this.cookieService.get('auth');
      // console.log(this.auth);
      // console.log(params.get("id"))
    })
  }

  ngOnInit() {
    this.getProductDetails()
  }
  getProductDetails() {
    this.spinnerService.show();
    let action = Action.PRODUCT;

    this.appService.getMethod(action + this.productId + '?lang=en')
      .subscribe(data => {
        data.images.map((image) => {
          this.galleryImages.push({ 'small': image.imageUrl, 'medium': image.imageUrl, 'big': image.imageUrl })
        })
        this.productDetail = data;
      }, error => {
        // this.router.navigate(['/error']);
      });
    this.getRelatedProduct()
    this.getReview();
  }
  getRelatedProduct() {
    let action = Action.PRODUCTS;
    this.appService.getMethod(action + this.productId + '/related')
      .subscribe(data => {
        console.log(data);
        this.productDetail = data;
        this.spinnerService.hide();
      }, error => {
        this.spinnerService.hide();
      });

  }
  handleChange(event, color, productID, option) {
    // console.log(event);
    let action = Action.PRODUCTS + productID + '/variant';
    let param = { "options": [{ "option": option.id, "value": color.id }] }
    this.appService.postMethod(action, param)
      .subscribe(data => {
        console.log(data);
        this.productDetail.finalPrice = data.finalPrice;
      }, error => {
      });
  }
  addToCart(product) {
    this.spinnerService.show();
    let action = Action.CART;
    let param = { "product": product.id, "quantity": this.qty, "attributes": [{ "id": 3 }] }
    if (this.cookieService.get('shopizer-cart-id')) {
      let id = this.cookieService.get('shopizer-cart-id');
      this.appService.putMethod(action, id, param)
        .subscribe(data => {
          this.spinnerService.hide();
          this.Helper.showMiniCart(1);
        }, error => {
          this.spinnerService.hide();
        });
    } else {
      this.appService.postMethod(action, param)
        .subscribe(data => {
          console.log(data);
          this.cookieService.set('shopizer-cart-id', data.code);
          this.spinnerService.hide();
          this.Helper.showMiniCart(1);
        }, error => {
          this.spinnerService.hide();
        });
    }
  }
  qtyUpdate(status) {
    if (status == 1) {
      this.qty = this.qty + 1;
    } else {
      if (this.qty > 0) {
        this.qty = this.qty - 1;
      }
    }
  }
  getReview() {
    let action = Action.PRODUCTS + this.productId + '/reviews';
    this.appService.getMethod(action)
      .subscribe(data => {
        console.log(data);
        this.reviews = data;
      }, error => {
        this.spinnerService.hide();
      });
  }
  ratingComponentClick(clickObj: any): void {

    this.review.rate = clickObj.rating;

  }
  onSubmitReview(productID) {
    this.spinnerService.show();
    let userData = JSON.parse(localStorage.getItem('userData'));
    let action = Action.AUTH + Action.PRODUCTS + productID + '/reviews'
    let param = { "customerId": userData.id, "date": moment().format('YYYY-MM-DD'), "description": this.review.description, 'language': 'en', 'productId': productID, 'rating': this.review.rate }
    this.appService.postMethod(action, param)
      .subscribe(data => {
        this.toastr.success('Your review has been posted', 'Well done!');
        this.review = {
          description: '',
          rate: 0
        }
        this.spinnerService.hide();
        this.getReview()
      }, error => {
        this.review = {
          description: '',
          rate: 0
        }
        this.spinnerService.hide();
        this.toastr.error("A review already exist for this customer and product", "")
      });
  }


}
