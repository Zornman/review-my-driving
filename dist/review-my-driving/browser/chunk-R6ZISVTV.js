import{Ga as ee,Ha as te,Ja as ie,Ka as re,Ma as oe,Na as ne,Oa as ae,Qa as se,Ra as ce,Sa as le,Ta as de,Ua as pe,Va as me,Wa as fe,Xa as ge,Ya as ve,ga as J,ia as K,la as Y,ma as Z,p as G}from"./chunk-O2TTPPOU.js";import{Ea as m,Ia as d,M as F,Mb as I,Nb as z,P as U,Q,Ra as a,Sa as n,Sb as x,Ta as _,Tb as y,W as u,Wb as W,X as f,Xa as S,_a as g,_b as $,ab as C,bc as X,dc as P,fb as O,gb as j,hb as N,ic as ue,ja as q,jc as k,lb as s,mb as R,ob as B,pa as L,pb as T,qa as b,qb as E,ra as c,rb as A,va as l,yb as H,za as h}from"./chunk-F5CHT4SG.js";import{f as v}from"./chunk-25N2FLV6.js";var Se=["carouselTrack"];function be(i,t){if(i&1&&_(0,"img",6),i&2){let e=t.$implicit;d("src",e.src,b)}}var w=class i{constructor(t){this.platformId=t}images;carouselTrack;currentIndex=0;track;ngOnInit(){y(this.platformId)&&(this.track=document.querySelector(".carousel-track"),this.track||console.error("Carousel track not found"))}ngAfterViewInit(){y(this.platformId)&&(this.track=this.carouselTrack.nativeElement,this.track?this.updateCarousel():console.error("Carousel track not found"))}next(){if(y(this.platformId)&&this.track){let t=this.track.children.length;this.currentIndex<t-1&&(this.currentIndex++,this.updateCarousel())}}prev(){y(this.platformId)&&this.track&&this.currentIndex>0&&(this.currentIndex--,this.updateCarousel())}updateCarousel(){if(y(this.platformId)&&this.track&&this.images?.length){let t=this.track.clientWidth;this.track.style.transform=`translateX(-${this.currentIndex*t}px)`}}static \u0275fac=function(e){return new(e||i)(l(q))};static \u0275cmp=h({type:i,selectors:[["app-carousel"]],viewQuery:function(e,o){if(e&1&&O(Se,5),e&2){let r;j(r=N())&&(o.carouselTrack=r.first)}},inputs:{images:"images"},decls:8,vars:1,consts:[["carouselTrack",""],[1,"carousel"],[1,"carousel-track"],["class","carousel-image",3,"src",4,"ngFor","ngForOf"],[1,"carousel-button","prev",3,"click"],[1,"carousel-button","next",3,"click"],[1,"carousel-image",3,"src"]],template:function(e,o){if(e&1){let r=S();a(0,"div",1)(1,"div",2,0),m(3,be,1,1,"img",3),n(),a(4,"button",4),g("click",function(){return u(r),f(o.prev())}),s(5,"\u2039"),n(),a(6,"button",5),g("click",function(){return u(r),f(o.next())}),s(7,"\u203A"),n()()}e&2&&(c(3),d("ngForOf",o.images))},dependencies:[x,I],encapsulation:2})};var D=class i{constructor(t,e){this.dialogRef=t;this.router=e}signUp(){this.router.navigate(["/register"]),this.dialogRef.close()}static \u0275fac=function(e){return new(e||i)(l(ae),l(P))};static \u0275cmp=h({type:i,selectors:[["app-sign-up-dialog"]],decls:10,vars:0,consts:[["mat-dialog-title",""],["align","end"],["mat-button","","mat-dialog-close",""],["mat-button","","color","primary",3,"click"]],template:function(e,o){e&1&&(a(0,"h2",0),s(1,"Sign Up"),n(),a(2,"mat-dialog-content")(3,"span"),s(4,"Please sign in before adding any items to your cart to ensure we can customize them for you!"),n()(),a(5,"mat-dialog-actions",1)(6,"button",2),s(7,"Cancel"),n(),a(8,"button",3),g("click",function(){return o.signUp()}),s(9,"Sign Up"),n()())},dependencies:[me,ce,le,pe,de],encapsulation:2})};var M=class i{constructor(t){this.authService=t;this.loadQRCodeModule(),this.authService.getUser().subscribe(e=>{e&&(this.userID=e.uid)})}baseURL="https://www.reviewmydriving.co/";userID;QRCode;loadQRCodeModule(){return v(this,null,function*(){this.QRCode=(yield import("./chunk-TWOBDT7A.js")).default})}generateQRCode(){return v(this,null,function*(){let t=`${this.baseURL}home?id=${this.userID}`;try{let e={width:3e3,errorCorrectionLevel:"H"};return yield this.QRCode.toDataURL(t,e)}catch(e){throw console.error("Error generating QR code:",e),e}})}static \u0275fac=function(e){return new(e||i)(U(k))};static \u0275prov=F({token:i,factory:i.\u0275fac,providedIn:"root"})};function we(i,t){i&1&&(a(0,"p"),s(1,"Note: Sign up to ensure any QR codes are linked to you."),n())}function De(i,t){if(i&1&&(a(0,"mat-option",18),s(1),n()),i&2){let e=t.$implicit;d("value",e.id),c(),B(" ",e.title.split("/")[0]," - $",(e.price/100).toFixed(2)," ")}}function Me(i,t){if(i&1&&(a(0,"mat-option",18),s(1),n()),i&2){let e=t.$implicit;d("value",e),c(),R(e)}}function Re(i,t){if(i&1&&_(0,"img",19),i&2){let e=C(2);d("src",e.imageFile,b)}}function Te(i,t){if(i&1){let e=S();a(0,"div",5)(1,"div",3)(2,"div",8)(3,"h1"),s(4),n(),_(5,"span",9),m(6,we,2,0,"p",10),n()(),a(7,"div",11)(8,"mat-form-field",12)(9,"mat-label"),s(10,"Choose a variant"),n(),a(11,"mat-select",13),A("valueChange",function(r){u(e);let p=C();return E(p.selectedVariant,r)||(p.selectedVariant=r),f(r)}),m(12,De,2,3,"mat-option",14),n()()(),a(13,"div",11)(14,"mat-form-field",15)(15,"mat-label"),s(16,"Quantity"),n(),a(17,"mat-select",13),A("valueChange",function(r){u(e);let p=C();return E(p.quantity,r)||(p.quantity=r),f(r)}),m(18,Me,2,2,"mat-option",14),n()()(),a(19,"div",11)(20,"button",16),g("click",function(){u(e);let r=C();return f(r.addToCart())}),s(21," Add to Cart "),n(),m(22,Re,1,1,"img",17),n()()}if(i&2){let e=C();c(4),R(e.product.title),c(),d("innerHTML",e.productDescription,L),c(),d("ngIf",!e.user),c(5),T("value",e.selectedVariant),c(),d("ngForOf",e.productVariants),c(5),T("value",e.quantity),c(),d("ngForOf",e.quantities),c(2),d("disabled",e.isAddDisabled()||e.disableAdd),c(2),d("ngIf",e.imageFile)}}function Ee(i,t){i&1&&(a(0,"p"),s(1,"Product not found."),n())}var _e=class i{constructor(t,e,o,r,p,Ae,Ve,Fe,Ue){this.route=t;this.router=e;this.sanitizer=o;this.cartService=r;this.authService=p;this.dialog=Ae;this.qrCodeService=Ve;this.printifyService=Fe;this.dbService=Ue;this.authService.getUser().subscribe(Ce=>{this.user=Ce})}_snackBar=Q(ne);product;product_custom;productDescription;productImages=[];productVariants=[];loading=!0;selectedVariant;quantity;quantities=Array.from({length:10},(t,e)=>e+1);user;imageFile;disableAdd=!1;ngOnInit(){let t=this.router.getCurrentNavigation();if(this.product=t?.extras.state?.product||null,!this.product){this._snackBar.open("Loading product details...");let e=this.route.snapshot.paramMap.get("id");e?this.printifyService.getProduct(e).subscribe({next:o=>{this.product=o,this.productImages=this.product.images,this.productVariants=this.product.variants.filter(r=>r.is_enabled),this.productDescription=this.sanitizer.bypassSecurityTrustHtml(this.product.description),this._snackBar.open("Product details loaded!","Ok",{duration:3e3}),this._snackBar.dismiss()},error:o=>{this._snackBar.open("Error loading product details, please try again.","Ok",{duration:3e3}),this.dbService.insertErrorLog({fileName:"product-page.component.ts",method:"ngOnInit()",timestamp:new Date().toString(),error:o}).subscribe({next:r=>{console.log(r)},error:r=>{}})}}):console.error("No product ID provided.")}}isAddDisabled(){return this.selectedVariant===void 0||this.quantity===void 0}backToShop(){this.router.navigateByUrl("/shop")}addToCart(){return v(this,null,function*(){this.user?yield this.checkForExistingProduct():this.openSignUpDialog()})}checkForExistingProduct(){return v(this,null,function*(){this._snackBar.open("Adding product to your cart..."),this.disableAdd=!0,yield this.printifyService.getProducts().subscribe({next:t=>{let e=t.data.map(o=>new fe(o));if(this.user){let o=this.user?this.user.uid:"";e=e.filter(r=>r.title.includes(o)&&r.title.includes(this.product.title)),e.length>0?(this.cartService.addToCart({productId:e[0].id,variantId:this.selectedVariant,quantity:this.quantity,product:e[0]}),this._snackBar.open("Product added to cart!","Ok",{duration:3e3}),this.disableAdd=!1):this.createNewProduct()}},error:t=>{this.dbService.insertErrorLog({fileName:"product-page.component.ts",method:"checkForExistingProduct()",timestamp:new Date().toString(),error:t}).subscribe({next:e=>{console.log(e)},error:e=>{}}),this.disableAdd=!1}})})}createNewProduct(){return v(this,null,function*(){let t;yield this.qrCodeService.generateQRCode().then(e=>{t=e,t=t.substring(22,e.length),this.printifyService.createCustomPrintifyProduct({base64QRCode:t,originalProductId:this.product.id,userID:this.user?.uid}).subscribe({next:o=>{this.cartService.addToCart({productId:o.product.id,variantId:this.selectedVariant,quantity:this.quantity,product:o.product}),this._snackBar.open("Product added to cart!","Ok",{duration:3e3}),this.disableAdd=!1},error:o=>{this.dbService.insertErrorLog({fileName:"product-page.component.ts",method:"createNewProduct()",timestamp:new Date().toString(),error:o}).subscribe({next:r=>{console.log(r)},error:r=>{}}),this.disableAdd=!1}})})})}openSignUpDialog(){this.dialog.open(D,{width:"400px",disableClose:!0})}static \u0275fac=function(e){return new(e||i)(l(X),l(P),l($),l(ve),l(k),l(se),l(M),l(ge),l(ue))};static \u0275cmp=h({type:i,selectors:[["app-product-page"]],decls:11,vars:2,consts:[["notFound",""],[1,"container"],[1,"row"],[1,"col-xs-12"],[3,"click"],[1,"col-xs-12","col-sm-12","col-md-12","col-lg-6"],[3,"images"],["class","col-xs-12 col-sm-12 col-md-12 col-lg-6",4,"ngIf"],[1,"product-detail"],[3,"innerHTML"],[4,"ngIf"],[1,"col-xs-12","col-center"],["appearance","outline",1,"variant-select"],["required","",3,"valueChange","value"],[3,"value",4,"ngFor","ngForOf"],["appearance","outline",1,"quantity-select"],["mat-raised-button","","color","primary",3,"click","disabled"],[3,"src",4,"ngIf"],[3,"value"],[3,"src"]],template:function(e,o){if(e&1){let r=S();a(0,"div",1)(1,"div",2)(2,"div",3)(3,"p")(4,"a",4),g("click",function(){return u(r),f(o.backToShop())}),s(5,"\u2039 Back"),n()()(),a(6,"div",5),_(7,"app-carousel",6),n(),m(8,Te,23,9,"div",7),n()(),m(9,Ee,2,0,"ng-template",null,0,H)}e&2&&(c(7),d("images",o.productImages),c(),d("ngIf",o.product))},dependencies:[x,I,z,W,G,w,Z,Y,K,te,ee,J,ie,oe,re],encapsulation:2})};export{_e as ProductPageComponent};
