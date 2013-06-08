var request = require("request"),
	fs = require("fs"),
	hash = require("node_hash"),
	events = require("events");

var accountMethods = {
	companyInfo: {path: "/acct/detail_company_info", method: "get", pick: "vendor_company_info"},
	contactInfo: {path: "/acct/detail_contact_info", method: "get", pick: "vendor_contact_info"},
	pendingPayment: {path: "/acct/detail_pending_payment", method: "get", pick: "payment"},
	listPayments: {path: "/acct/list_payments", method: "get", pick: "payments"}
};

var salesMethods = {
	details: {path: "/sales/detail_sale", method: "get", pick: "sale"},
	list: {path: "/sales/list_sales", method: "get", pick: ["page_info", "sale_summary"]},
	refundInvoice: {path: "/sales/refund_invoice", method: "post"},
	refundLineitem: {path: "/sales/refund_lineitem", method: "post"},
	stopLineitemRecurring: {path: "/sales/stop_lineitem_recurring", method: "post"},
	markShipped: {path: "/sales/mark_shipped", method: "post"},
	createComment: {path: "/sales/create_comment", method: "post"}
};

var productMethods = {
	details: {path: "/products/detail_product", method: "get", pick: "product"},
	list: {path: "/products/list_products", method: "get", pick: ["page_info", "products"]},
	create: {path: "/products/create_product", method: "post"},
	update: {path: "/products/update_product", method: "post"},
	del: {path: "/products/delete_product", method: "post"}
};

var productOptionsMethods = {
	details: {path: "/products/detail_option", method: "get", pick: "option"},
	list: {path: "/products/list_option", method: "get", pick: ["page_info", "options"]},
	create: {path: "/products/create_option", method: "post"},
	update: {path: "/products/update_option", method: "post"},
	del: {path: "/products/delete_option", method: "post"}
};

var productCouponMethods = {
	details: {path: "/products/detail_coupon", method: "get", pick: "coupon"},
	list: {path: "/products/list_coupons", method: "get", pick: "coupon"},
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

		var reqOptions = {
			url: "https://www.2checkout.com/api" + methodDetails.path,
			method: methodDetails.method,
			qs: (methodDetails.method=="get"?options:undefined),
			form: (methodDetails.method=="post"?options:undefined),
			headers: {Accept: "application/json"},
			auth: {username: options2co.username, password: options2co.password}
		};

		console.log(
			"[2co]",
			"[" + new Date() + "]",
			"[" + options2co.username + "]",
			reqOptions.method.toUpperCase(),
			reqOptions.url,
			reqOptions.qs || reqOptions.form || null
		);

		if(options2co.logFile) {
			fs.appendFile(
				options2co.logFile,
				"[" + new Date() + "] [api-request] [" + options2co.username + "] " + reqOptions.method.toUpperCase() + " " + reqOptions.url + " " + (reqOptions.qs || reqOptions.form || ""),
				function() {}
			);
		}

		request(reqOptions, function(err, res) {
			if(err) return done(err);

			try {
				if(options2co.logFile) {
					fs.appendFile(
						options2co.logFile,
						"[" + new Date() + "] [api-response] [" + options2co.username + "] " + res.body,
						function() {}
					);
				}

				var response = JSON.parse(res.body);

				if(response.errors) return done(response.errors);

				var returnData = [null];
				if(methodDetails.pick) {
					((methodDetails.pick instanceof Array)?methodDetails.pick:[methodDetails.pick]).forEach(function(field) {
						returnData.push(response[field]);
					});
				}
				returnData.push(response);
				done.apply(null, returnData);
			} catch(e) {
				done(e);
			}
		});
	};
}

function buildObject(methodsHash, options) {
	return Object.keys(methodsHash).reduce(function(obj, methodName) {
		obj[methodName] = createMethod(methodsHash[methodName], options);
		return obj;
	}, {});
}


module.exports = function(options) {
	var client = {
		account: buildObject(accountMethods, options),
		sales: buildObject(salesMethods, options),
		products: buildObject(productMethods, options)
	};

	client.products.options = buildObject(productOptionsMethods, options);
	client.products.coupons = buildObject(productCouponMethods, options);

	client.canTrustINS = function(data) {
		if(options.logFile) {
			fs.appendFile(
				options.logFile,
				"[" + new Date() + "] [INS] " + JSON.stringify(data),
				function() {}
			);
		}

		return hash.md5(
			data.sale_id + "" + data.vendor_id + data.invoice_id + options.secret
		).toUpperCase() == data.md5_hash;
	};

	client.canTrustReturnData = function(data) {
		if(options.logFile) {
			fs.appendFile(
				options.logFile,
				"[" + new Date() + "] [return] " + JSON.stringify(data),
				function() {}
			);
		}

		if(options.test) return true;

		// Consider using data.demo above, to eliminate the need for options.test. However, what happens if
		// the MitM sets data.demo to truthy in production requests? They would be treated as valid requests!

		return hash.md5(
			options.secret + data.sid + data.order_number + data.total
		).toUpperCase() == data.key;
	}

	return client;
}
