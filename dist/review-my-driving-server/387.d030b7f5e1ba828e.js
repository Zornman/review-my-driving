"use strict";exports.id=387,exports.ids=[387],exports.modules={9387:(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{OrderConfirmationComponent:()=>OrderConfirmationComponent});var _angular_core__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__(4580),_services_auth_service__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__(5766),_angular_router__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__(8134),_services_mongo_service__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__(8245),_services_email_service__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__(5581);let OrderConfirmationComponent=(()=>{class OrderConfirmationComponent2{authService;route;dbService;emailService;user;orderID;constructor(authService,route,dbService,emailService){this.authService=authService,this.route=route,this.dbService=dbService,this.emailService=emailService}ngOnInit(){this.authService.getUser().subscribe(user=>{this.user=user,this.user&&(this.orderID=this.route.snapshot.paramMap.get("id"),this.sendEmailConfirmation(),this.insertOrderHistoryRecord())})}insertOrderHistoryRecord(){const data={userID:this.user?.uid,orderID:this.orderID,dateOrdered:(new Date).toDateString(),emailOrderConfirm:!0,emailOrderShipped:!1,emailOrderCanceled:!1,emailOrderCreated:!1};this.dbService.insertUserOrderHistoryRecord(data).subscribe({next:response=>{},error:error=>{console.error("Error sending order to database:",error)}})}sendEmailConfirmation(){this.emailService.sendOrderConfirmationEmail({orderID:this.orderID}).subscribe({next:response=>{},error:error=>{console.error("Error sending order email:",error)}})}static \u0275fac=function(__ngFactoryType__){return new(__ngFactoryType__||OrderConfirmationComponent2)(_angular_core__WEBPACK_IMPORTED_MODULE_3__.rXU(_services_auth_service__WEBPACK_IMPORTED_MODULE_0__.u),_angular_core__WEBPACK_IMPORTED_MODULE_3__.rXU(_angular_router__WEBPACK_IMPORTED_MODULE_4__.nX),_angular_core__WEBPACK_IMPORTED_MODULE_3__.rXU(_services_mongo_service__WEBPACK_IMPORTED_MODULE_1__.g),_angular_core__WEBPACK_IMPORTED_MODULE_3__.rXU(_services_email_service__WEBPACK_IMPORTED_MODULE_2__._))};static \u0275cmp=_angular_core__WEBPACK_IMPORTED_MODULE_3__.VBU({type:OrderConfirmationComponent2,selectors:[["app-order-confirmation"]],decls:13,vars:1,consts:[[1,"container"],[1,"row"],[1,"col-12","col-center"],[1,"align-middle"]],template:function(rf,ctx){1&rf&&(_angular_core__WEBPACK_IMPORTED_MODULE_3__.j41(0,"div",0)(1,"div",1)(2,"div",2)(3,"span",3)(4,"h1"),_angular_core__WEBPACK_IMPORTED_MODULE_3__.EFF(5),_angular_core__WEBPACK_IMPORTED_MODULE_3__.k0s(),_angular_core__WEBPACK_IMPORTED_MODULE_3__.nrm(6,"br"),_angular_core__WEBPACK_IMPORTED_MODULE_3__.j41(7,"h2"),_angular_core__WEBPACK_IMPORTED_MODULE_3__.EFF(8,"Thank you for your purchase!"),_angular_core__WEBPACK_IMPORTED_MODULE_3__.k0s()()(),_angular_core__WEBPACK_IMPORTED_MODULE_3__.j41(9,"div",2)(10,"span",3)(11,"p"),_angular_core__WEBPACK_IMPORTED_MODULE_3__.EFF(12," Please have patience while waiting for your order. Each order includes customized products that can take longer than usual to ship. We promise you, it'll be worth the wait! "),_angular_core__WEBPACK_IMPORTED_MODULE_3__.k0s()()()()()),2&rf&&(_angular_core__WEBPACK_IMPORTED_MODULE_3__.R7$(5),_angular_core__WEBPACK_IMPORTED_MODULE_3__.SpI("Order Confirmed! #",ctx.orderID,""))},encapsulation:2})}return OrderConfirmationComponent2})()}};