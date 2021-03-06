**Unmaintained**: (2018-11-22) 2co has recently changed their API, and the new API is very different and vast. I don't need most of the things in the API, so it doesn't make sense for me to maintain a SDK for their API. While the code here works as of today, the API itself only works partially, and expect the API to be EOL'd soon.


2co-client
===

A thin node.js client for the 2checkout API.

In production use, running the payment system at [Errorception](http://errorception.com/).

## Installation

```
$ npm install 2co-client
```

## Usage

```javascript
var client = require("2co-client")(options);

client.sales.list(function(err, salesInformation) {
	// As you'd expect	
});
```

## Initialization

```
var client = require("2co-client")(options);
```

`options` is an object that can contain the following properties:
* `username` Your 2checkout API user's username
* `password` Your 2checkout API user's password
* `secret` Your 2checkout secret
* `logFile` (optional) The path to a file that this module should output logs to. Requests and responses are logged here.
* `test` Enables demo mode. Bypasses INS and return data checks, and makes them always return true.

## Methods

The methods provided by the client mirror the API endpoints as specified in the [2co Advanced User Guide [PDF]](https://www.2checkout.com/documentation/Advanced_User_Guide.pdf). It will be helpful to keep a copy of the user guide handy when using this module.

All methods take a callback as the last argument, in the typical node.js style. Some methods might take an optional first argument, which is expected to be an object. This object is used as the payload to be sent to the API.

Errors will either be a JS Exception object if there was a problem with the network layer, or will be an array of objects if the API returned a 400/500 series error.

A listing of API methods follows.

### `client.account`

* `client.account.companyInfo`: Retrieves your account's company information details. GETs `/acct/detail_company_info`.
* `client.account.contactInfo`: Retrieve your account's contact information details. GETs `/acct/detail_contact_info`.
* `client.account.pendingPayment`: Get a detailed estimate of the current pending payment. GETs `/acct/detail_pending_payment`.
* `client.account.listPayments`: Get a list of past payments. GETs `/acct/list_payments`.

### `client.sales`

* `client.sales.details`: Retrieve information about a specific sale or invoice. GETs `/sales/detail_sale`.

* `client.sales.list`: Retrieve a summary of all sales or only those matching a variety of sale attributes. GETs `/sales/list_sales`.

* `client.sales.refundInvoice`: Attempts to issue a full or partial refund on an invoice. POSTs to `/sales/refund_invoice`.

* `client.sales.refundLineitem`: Attempt to issue a full or partial refund on an invoice. POSTs to `/sales/refund_lineitem`.

* `client.sales.stopLineitemRecurring`: Attempt to stop a recurring line item for a specified sale. POSTs to `/sales/refund_lineitem_recurring`.

* `client.sales.markShipped`: Attempt to mark an order as shipped and will attempt to reauthorize sale if specified in call. POSTs to `/sales/mark_shipped`.

* `client.sales.createComment`: Add a comment to a specified sale. POSTs to `/sales/create_comment`.

### `client.products`

* `client.products.details`: Retrieve the details for a single product. GETs `/products/detail_product`.

* `client.products.list`: Retrieve list of all products in account. GETs `/products/list_products`.

* `client.products.create`: Create a new product. POSTs to `/products/create_product`.

* `client.products.update`: Update a product. POSTs to `/products/update_product`.

* `client.products.del`: Deletes a product. POSTs to `/products/delete_product`.

* `client.products.options.details`: Retrieve the details for a single option. GETs `/products/detail_options`.

* `client.products.options.list`: Retrieve list of all options in account. GETs `/products/list_products`.

* `client.products.options.create`: Create a new product option. POSTs to `/products/create_option`.

* `client.products.options.update`: Updates a product option. POSTs to `/products/update_option`.

* `client.products.options.del`: Deletes a product option. POSTs to `/products/delete_option`.

* `client.products.coupons.details`: Retrieve the details for a single coupon. GETs `/products/detail_coupon`.

* `client.products.coupons.list`: Retrieve list of all coupons in the account. GETs `/products/list_coupons`.

* `client.products.coupons.create`: Creates a new coupon. POSTs to `/products/create_coupon`.

* `client.products.coupons.update`: Updates a coupon. POSTs to `/products/update_coupon`.

* `client.products.coupons.del`: Deletes a coupon. POSTs to `/products/delete_coupon`.

## Additional methods

The following methods simplify some of the chores of working with the API.

### `client.canTrustINS`

Checks if the INS data returned by 2checkout is valid and not tampered with. You must pass `options.secret` when creating the client for this to work correctly. Will always return true if `options.test` is true. You must pass it the body of the HTTP POST you received, as a JSON object of key-value pairs. If you are using Express along with the `bodyParser`, the `req.body` already contains object as expected.

### `client.canTrustReturnData`

Checks if the return data from the purchase process by 2checkout is valid. You must pass `options.secret` when creating the client for this to work correctly. Will always return true if `options.test` is true. You must pass it the query string as a JSON object of key-value pairs. If you are using Express, the `req.query` already contains the object as expected.


## License

MIT
