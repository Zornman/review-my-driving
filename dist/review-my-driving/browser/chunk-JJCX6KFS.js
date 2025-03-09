import{a as f}from"./chunk-CDKV5PPQ.js";import{Ra as t,Sa as o,Ta as c,bc as p,ic as u,jc as v,lb as n,nb as l,ra as d,va as i,za as m}from"./chunk-F5CHT4SG.js";import"./chunk-25N2FLV6.js";var h=class a{constructor(e,r,s,S){this.authService=e;this.route=r;this.dbService=s;this.emailService=S}user;orderID;ngOnInit(){this.authService.getUser().subscribe(e=>{this.user=e,this.user&&(this.orderID=this.route.snapshot.paramMap.get("id"),this.sendEmailConfirmation(),this.insertOrderHistoryRecord())})}insertOrderHistoryRecord(){let e={userID:this.user?.uid,orderID:this.orderID,dateOrdered:new Date().toDateString(),emailOrderConfirm:!0,emailOrderShipped:!1,emailOrderCanceled:!1,emailOrderCreated:!1};this.dbService.insertUserOrderHistoryRecord(e).subscribe({next:r=>{},error:r=>{console.error("Error sending order to database:",r)}})}sendEmailConfirmation(){this.emailService.sendOrderConfirmationEmail({orderID:this.orderID}).subscribe({next:e=>{},error:e=>{console.error("Error sending order email:",e)}})}static \u0275fac=function(r){return new(r||a)(i(v),i(p),i(u),i(f))};static \u0275cmp=m({type:a,selectors:[["app-order-confirmation"]],decls:13,vars:1,consts:[[1,"container"],[1,"row"],[1,"col-12","col-center"],[1,"align-middle"]],template:function(r,s){r&1&&(t(0,"div",0)(1,"div",1)(2,"div",2)(3,"span",3)(4,"h1"),n(5),o(),c(6,"br"),t(7,"h2"),n(8,"Thank you for your purchase!"),o()()(),t(9,"div",2)(10,"span",3)(11,"p"),n(12," Please have patience while waiting for your order. Each order includes customized products that can take longer than usual to ship. We promise you, it'll be worth the wait! "),o()()()()()),r&2&&(d(5),l("Order Confirmed! #",s.orderID,""))},encapsulation:2})};export{h as OrderConfirmationComponent};
