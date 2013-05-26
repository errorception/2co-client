var request = require("request"),
	hash = require("node_hash"),
	events = require("events");

var accountMethods = {
	companyInfo: {path: "/acct/detail_company_info", method: "get"},
	contactInfo: {path: "/acct/detail_contact_info", method: "get"},
	pendingPayment: {path: "/acct/detail_pending_payment", method: "get"},
	listPayments: {path: "/acct/list_payments", method: "get"}
};

var salesMethods = {
	details: {path: "/sales/detail_sale", method: "get"},
	list: {path: "/sales/list_sales", method: "get"},
	refundInvoice: {path: "/sales/refund_invoice", method: "post"},
	refundLineitem: {path: "/sales/refund_lineitem", method: "post"},
	stopLineitemRecurring: {path: "/sales/stop_lineitem_recurring", method: "post"},
	markShipped: {path: "/sales/mark_shipped", method: "post"},
	createComment: {path: "/sales/create_comment", method: "post"}
};

var productMethods = {
	details: {path: "/products/detail_product", method: "get"},
	list: {path: "/products/list_products", method: "get"},
	create: {path: "/products/create_product", method: "post"},
	update: {path: "/products/update_product", method: "post"},
	del: {path: "/products/delete_product", method: "post"}
};

var productOptionsMethods = {
	details: {path: "/products/detail_option", method: "get"},
	list: {path: "/products/list_option", method: "get"},
	create: {path: "/products/create_option", method: "post"},
	update: {path: "/products/update_option", method: "post"},
	del: {path: "/products/delete_option", method: "post"}
};

var productCouponMethods = {
	details: {path: "/products/detail_coupon", method: "get"},
	list: {path: "/products/list_coupons", method: "get"},
	create: {path: "/products/create_coupon", method: "post"},
	update: {path: "/products/update_coupon", method: "post"},
	del: {path: "/products/delete_coupon", method: "post"}
};

function createMethod(methodDetails, options2co) {
	return function(options, done) {
		if(typeof options !== "object") {
			done = options;
			options = {};
		}

		done = done || function(){};

		request({
			url: "https://www.2checkout.com/api" + methodDetails.path,
			method: methodDetails.method,
			qs: (methodDetails.method=="get"?options:undefined),
			form: (methodDetails.method=="post"?options:undefined),
			headers: {Accept: "application/json"},
			auth: {username: options2co.username, password: options2co.password}
		}, function(err, res) {
			if(err) return done(err);

			var response = JSON.parse(res.body);
			if(response.errors) return done(response.errors);
			done(null, response);
		});
	};
}

function buildObject(methodsHash, options) {
	return Object.keys(methodsHash).reduce(function(obj, methodName) {
		obj[methodName] = createMethod(methodsHash[methodName], options);
		return obj;
	}, {});
}

function eventEmitterize(client, options) {
	events.EventEmitter.call(client);

	client.notification = function(req, res, next) {
		var body;
		try {
			body = JSON.parse(res.body);
			if(options.secretWord && process.env["NODE_ENV"] !== "test") {
				if(hash.md5((req.body.sale_id + "" + req.body.vendor_id + req.body.invoice_id + options.secretWord).toUpperCase()) == body.md5_hash) {
					client.emit(body.message_type, body);
				} else {
					client.emit("error", new Error("MD5 hash didn't match. Notification was probably spoofed."));
				}
			} else {
				client.emit(body.message_type, body);
			}
			res.statusCode = 200;
		} catch(e) {
			client.emit("error", e);
			if(next) next(e);
			res.statusCode = 500;
		}
		res.end("");
	}
}

module.exports = function(options) {
	var client = {
		account: buildObject(accountMethods, options),
		sales: buildObject(salesMethods, options),
		products: buildObject(productMethods, options)
	};

	client.products.options = buildObject(productOptionsMethods, options);
	client.products.coupons = buildObject(productCouponMethods, options);

	eventEmitterize(client, options);

	return client;
}
