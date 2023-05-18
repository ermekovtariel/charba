import {defaultTo, equals, prop} from "ramda"
import request, {postFile} from "./request"
import {sortStrings, capitalizeFirstLetter, minmax, deletePropFromObject} from "./utils"
import ColorHash from "color-hash"

const colorHash = new ColorHash({saturation: 1})

class API {
	constructor() {
		this.token = window.localStorage.getItem("token") || window.sessionStorage.getItem("token")
		/*this.token &&
			request.interceptors.request.use(config => {
				config.headers.authorization = `Token ${this.token}`
				return config
			})*/
		this.token && (request.defaults.headers.common.Authorization = `Token ${this.token}`)

		const collectionSections = [
			"keywords",
			"brands",
			"categories",
			"products",
			"sellers",
			"categories",
			"product_keyword",
		]

		collectionSections.forEach(sectionName => {
			console.log(sectionName)
			this[`getParsersCollections${capitalizeFirstLetter(sectionName)}`] = async ({
				limit,
				offset,
			} = {}) => {
				const response = await request({
					url: `/parsers/collections/${sectionName}/`,
					method: "get",
					params: {
						limit,
						offset,
					},
				})
				return response.data
			}

			this[`createParsersCollections${capitalizeFirstLetter(sectionName)}`] = async ({
				name,
				items,
			}) => {
				const response = await request({
					url: `/parsers/collections/${sectionName}/`,
					method: "post",
					data: {
						name,
						items,
					},
				})
				return response.data
			}

			this[`getExactParsersCollections${capitalizeFirstLetter(sectionName)}`] = async ({
				id,
				limit,
				offset = 0,
			}) => {
				const response = await request({
					url: `/parsers/collections/${sectionName}/${id}/${
						sectionName === "product_keyword" ? "products/" : ""
					}`,
					method: "get",
					params: {
						limit,
						offset,
					},
				})
				return response.data
			}

			this[`updateParsersCollections${capitalizeFirstLetter(sectionName)}`] = async ({
				id,
				name,
				items,
			}) => {
				const response = await request({
					url: `/parsers/collections/${sectionName}/${id}/`,
					method: "patch",
					data: {
						name,
						items,
					},
				})
				return response.data
			}

			this[`deleteParsersCollections${capitalizeFirstLetter(sectionName)}`] = async ({
				id,
			}) => {
				const response = await request({
					url: `/parsers/collections/${sectionName}/${id}/`,
					method: "delete",
				})
				return response.data
			}

			this[`deleteAllItemsInParsersCollection${capitalizeFirstLetter(sectionName)}`] =
				async ({id}) => {
					const response = await request({
						url: `/parsers/collections/${sectionName}/${id}/clear_items/`,
						method: "post",
					})
					return response.data
				}

			this[`deleteItemsInParsersCollection${capitalizeFirstLetter(sectionName)}`] = async ({
				id,
				items,
			}) => {
				const response = await request({
					url: `/parsers/collections/${sectionName}/${id}/remove_items/`,
					method: "post",
					data: {
						items,
					},
				})
				return response.data
			}

			this[`addToParsersCollections${capitalizeFirstLetter(sectionName)}`] = async ({
				id,
				items,
			}) => {
				const response = await request({
					url: `/parsers/collections/${sectionName}/${id}/add_items/`,
					method: "post",
					data: {
						items,
					},
				})
				return response.data
			}
		})
	}

	async isAuth() {
		const storedToken =
			window.localStorage.getItem("token") || window.sessionStorage.getItem("token")
		const isLsTookenExists = Boolean(storedToken)
		!this.token && isLsTookenExists && (this.token = storedToken)
		if (isLsTookenExists) {
			try {
				await this.getProfile()
				return true
			} catch (err) {
				console.log(err)
				if (err?.response?.status === 401) {
					this.resetToken()
					return false
				} else {
					return true
				}
			}
		} else {
			this.resetToken()
			return false
		}
	}

	getToken() {
		return this.token
	}

	resetToken() {
		window.localStorage.removeItem("token")
		window.sessionStorage.removeItem("token")
		this.token = null
		request.defaults.headers.common.Authorization = undefined
	}

	setToken({token, isSession}) {
		window[isSession ? "sessionStorage" : "localStorage"].setItem("token", token)
		window[isSession ? "localStorage" : "sessionStorage"].removeItem("token")
		this.token = token
		request.defaults.headers.common.Authorization = `Token ${this.token}`
	}

	async signIn({phone, password}) {
		const response = await request({
			url: "/auth/login/",
			method: "post",
			data: {
				phone,
				password,
			},
		})

		return response.data
	}

	async signUp({code, email, password, phone, name, social_login_id}) {
		const response = await request({
			url: "/auth/registration/",
			method: "post",
			data: {
				email,
				password,
				phone,
				name,
				code,
				social_login_id,
			},
		})

		return response.data
	}

	async sendSms({phone}) {
		const response = await request({
			url: "/auth/registration/send_sms/",
			method: "post",
			data: {
				phone,
			},
		})

		return response.data
	}

	async refreshToken() {
		const response = await request({
			url: "/auth/profile/refresh_token/",
			method: "post",
		})

		return response.data
	}

	async resendConfirmation({email}) {
		const response = await request({
			url: "/auth/resend/",
			method: "post",
			data: {
				email,
			},
		})

		return response.data
	}

	async socialSignUp({code, provider, redirect_url}) {
		const response = await request({
			url: "/auth/social/signup/",
			method: "post",
			data: {
				code,
				provider,
				redirect_url,
			},
		})

		return response.data
	}

	async socialSignIn({code, provider, redirect_url}) {
		const response = await request({
			url: "/auth/social/login/",
			method: "post",
			data: {
				code,
				provider,
				redirect_url,
			},
		})

		return response.data
	}

	async resetPassword({email, key, password}) {
		const response = await request({
			url: "/auth/reset/",
			method: "post",
			data: {
				email,
				key,
				password,
			},
		})

		return response.data
	}

	async confirmResetPassword({key, password}) {
		const response = await request({
			url: "/auth/confirm_reset/",
			method: "post",
			data: {
				key,
				password,
			},
		})

		return response.data
	}

	async getBrandInfo({id}) {
		const response = await request({
			url: `/brands/${id}/info/`,
			method: "get",
		})
		return response.data
	}

	async getBrandCategories({id}) {
		const response = await request({
			url: `/categories/tree?brand_ids=${id}/`,
			method: "get",
		})
		return response.data
	}

	async getBrandGraph({id, brand_ids, category_ids, gtype, date_from, date_to}) {
		const response = await request({
			url: `/brands/${id}/graph/`,
			method: "post",
			data: {
				brand_ids: [...brand_ids, id],
				category_ids: category_ids,
				gtype: gtype,
				date_from: date_from,
				date_to: date_to,
			},
		})
		return response.data
	}

	async searchBrands({name}) {
		const response = await request({
			url: `/brands/search/`,
			method: "post",
			data: {
				name: name,
			},
		})
		return response.data
	}

	async searchCategories({brand_ids, name}) {
		const response = await request({
			url: `/categories/search/`,
			method: "post",
			data: {
				name: name,
				brand_ids: brand_ids,
				with_parents: true,
			},
		})
		return response.data
	}

	async getBrandSaledByCategories({id, category_ids, date_from, date_to, parent_id}) {
		const response = await request({
			url: `/brands/${id}/structure/categories/`,
			method: "post",
			data: {
				category_ids: category_ids,
				date_from: date_from,
				date_to: date_to,
				parent_id: parent_id,
			},
		})
		return response.data
	}

	async getBrandSaledByOther({id, gtype, category_ids, date_from, date_to}) {
		const response = await request({
			url: `/brands/${id}/structure/other/`,
			method: "post",
			data: {
				category_ids: category_ids,
				date_from: date_from,
				date_to: date_to,
				gtype: gtype,
			},
		})
		return response.data
	}

	async getBrandProducts({id, category_ids, date_from, date_to, page, per_page}) {
		const response = await request({
			url: `/brands/${id}/products/`,
			method: "post",
			data: {
				category_ids: category_ids,
				date_from: date_from,
				date_to: date_to,
				page: page,
				per_page: per_page,
			},
		})
		return response.data
	}

	async getBrandStocks({id, category_ids, brand_ids}) {
		const response = await request({
			url: `/brands/${id}/stocks/`,
			method: "post",
			data: {
				category_ids: category_ids,
				brand_ids: [...brand_ids, id],
			},
		})
		return response.data
	}

	async getProductInfo({id}) {
		const response = await request({
			url: `/parsers/products/${id}/`,
			method: "get",
		})
		let colorNameRepeats = {}
		if (response.data.color_items && response.data.color_items.length > 0) {
			response.data.color_items.forEach(item => {
				const itemName = capitalizeFirstLetter(item.name)
				item.name = itemName
				const repeats = colorNameRepeats[itemName]
				if (repeats !== undefined) {
					//already exist
					item.name = `${itemName} ${repeats + 2}`
					colorNameRepeats[itemName] = repeats + 1
				} else {
					colorNameRepeats[itemName] = 0
				}

				if (item.color) {
					if (item.color.every(c => c >= 245)) {
						item.color = [200, 200, 200]
					}
					item.color = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`
				} else {
					item.color = colorHash.hex(item.name.split("").reverse().join(""))
				}
			})
			response.data.color_items.sort((a, b) => sortStrings(a.name, b.name))
		} else if (response.data.color_items.length === 0) {
			response.data.color_items = [
				{
					name: id,
					id: id,
					color: colorHash.hex(String(id).split("").reverse().join("")),
				},
			]
		}
		return response.data
	}
	async getProductInfoByProduct_ids({id}) {
		const response = await request({
			url: `/parsers/products/${id}/`,
			method: "get",
		})
		return {...response.data, imgs: response.data.images}
	}
	async getProductCardByProduct_ids({id}) {
		const response = await request({
			url: `/parsers/products/${id}/card/`,
			method: "get",
		})

		return response.data
	}
	async getProductCardByProductIds_inKeywords({id, object}) {
		const response = await request({
			url: `/parsers/products/${id}/card/in_keywords/`,
			method: "post",
			data: object,
		})

		return response
	}
	async getGrouping({object}) {
		const response = await request({
			url: `/parsers/keywords/grouping/`,
			method: "post",
			data: object,
		})

		return response.data
	}
	async exportGroupingExcel({object}) {
		const response = await request({
			url: `/parsers/keywords/grouping/export/`,
			method: "post",
			data: object,
		})

		return response.data
	}
	async getIdsByWords(searchReq) {
		const response = await request({
			url: `/wb_dynamic/keywords_ids/`,
			method: "post",
			data: {
				keywords: [searchReq],
			},
		})

		return response
	}

	async getProductGraph({id, colors, gtype, date_from, date_to}) {
		const response = await request({
			url: `/products/${id}/graphs/`,
			method: "post",
			data: {
				colors: [...colors, id],
				gtype: gtype,
				date_from: date_from,
				date_to: date_to,
			},
		})
		return response.data
	}

	async getProductPositions({id, geo, date_from, date_to}) {
		const response = await request({
			url: `/products/${id}/positions/`,
			method: "post",
			data: {
				geo: geo,
				date_from: date_from,
				date_to: date_to,
			},
		})
		return response.data
	}

	async getProductSales({id, gtype, vtype, date_from, date_to, colors}) {
		const response = await request({
			url: `/products/${id}/structure/sales/`,
			method: "post",
			data: {
				colors: [...colors, id],
				vtype: vtype,
				gtype: gtype,
				date_from: date_from,
				date_to: date_to,
			},
		})
		return response.data
	}

	async getProductQuanity({id, gtype, colors}) {
		const response = await request({
			url: `/products/${id}/structure/quantity/`,
			method: "post",
			data: {
				colors: [...colors, id],
				gtype: gtype,
			},
		})
		return response.data
	}

	async getRegions() {
		const response = await request({
			url: `/regions/`,
			method: "get",
		})
		return response.data
	}

	async exportReportFilter({
		orders_share__lt,
		sale_percent__gt,
		available_for_sale__gt,
		category_ids,
		brand_ids,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/analytics/items/filter/export/`,
			method: "GET",
			params: {
				orders_share__lt,
				sale_percent__gt,
				available_for_sale__gt,
				category_ids,
				brand_ids,
				limit,
				offset,
			},
		})
		return response.data
	}
	async getIncomePlanReportByProduct({
		report_id,
		ordering,
		search,
		offset,
		limit,
		wb_api_key_ids,
		date_from,
		date_to,
		period = 30,
	}) {
		const response = await request({
			url: `/analytics/income_plan/report_by_product/`,
			method: "GET",
			params: {
				report_id,
				wb_api_key_ids,
				search,
				ordering,
				date_from,
				limit,
				date_to,
				period,
				offset,
			},
		})
		return response.data
	}
	async exportIncomePlanReportByProduct({
		report_id,
		ordering,
		offset,
		limit,
		wb_api_key_ids,
		date_from,
		date_to,
		period = 30,
	}) {
		const response = await request({
			url: `/analytics/income_plan/report_by_product/export/`,
			method: "GET",
			params: {
				report_id,
				wb_api_key_ids,
				ordering,
				date_from,
				limit,
				date_to,
				period,
				offset,
			},
		})
		return response.data
	}
	async getIncomePlanReportByBarcode({
		report_id,
		ordering,
		offset,
		search,
		limit,
		wb_api_key_ids,
		date_from,
		date_to,
		period = 30,
	}) {
		const response = await request({
			url: `/analytics/income_plan/report_by_barcode/`,
			method: "GET",
			params: {
				report_id,
				wb_api_key_ids,
				ordering,
				search,
				date_from,
				limit,
				date_to,
				period,
				offset,
			},
		})
		return response.data
	}
	async exportIncomePlanReportByBarcode({
		report_id,
		ordering,
		offset,
		limit,
		wb_api_key_ids,
		date_from,
		date_to,
		period = 30,
	}) {
		const response = await request({
			url: `/analytics/income_plan/report_by_barcode/export/`,
			method: "GET",
			params: {
				report_id,
				wb_api_key_ids,
				ordering,
				date_from,
				limit,
				date_to,
				period,
				offset,
			},
		})
		return response.data
	}

	async getUnitReportByProduct({
		report_id,
		ordering,
		offset,
		search,
		limit,
		wb_api_key_ids,
		date_from,
		date_to,
		period = 30,
	}) {
		const response = await request({
			url: `/analytics/unit/report_by_product/`,
			method: "GET",
			params: {
				report_id,
				wb_api_key_ids,
				ordering,
				search,
				date_from,
				limit,
				date_to,
				period,
				offset,
			},
		})
		return response.data
	}
	async exportUnitReportByProduct({
		report_id,
		ordering,
		offset,
		limit,
		wb_api_key_ids,
		date_from,
		date_to,
		period = 30,
	}) {
		const response = await request({
			url: `/analytics/unit/report_by_product/export/`,
			method: "GET",
			params: {
				report_id,
				wb_api_key_ids,
				ordering,
				date_from,
				limit,
				date_to,
				period,
				offset,
			},
		})
		return response.data
	}
	async getUnitReportByBarcode({
		report_id,
		ordering,
		search,
		offset,
		limit,
		wb_api_key_ids,
		date_from,
		date_to,
		period = 30,
	}) {
		const response = await request({
			url: `/analytics/unit/report_by_barcode/`,
			method: "GET",
			params: {
				report_id,
				wb_api_key_ids,
				search,
				ordering,
				date_from,
				limit,
				date_to,
				period,
				offset,
			},
		})
		return response.data
	}
	async exportUnitReportByBarcode({
		report_id,
		ordering,
		offset,
		limit,
		wb_api_key_ids,
		date_from,
		date_to,
		period = 30,
	}) {
		const response = await request({
			url: `/analytics/unit/report_by_barcode/export/`,
			method: "GET",
			params: {
				report_id,
				wb_api_key_ids,
				ordering,
				date_from,
				limit,
				date_to,
				period,
				offset,
			},
		})
		return response.data
	}
	async getReportByProduct({
		report_id,
		ordering,
		offset,
		limit,
		wb_api_key_ids,
		date_from,
		date_to,
		period = 30,
		search,
	}) {
		const response = await request({
			url: `/analytics/report_by_product/`,
			method: "GET",
			params: {
				report_id__in: report_id,
				wb_api_key_ids,
				ordering,
				date_from,
				limit,
				date_to,
				period,
				offset,
				search,
			},
		})
		return response.data
	}
	async exportReportByProduct({
		offset,
		ordering,
		limit,
		wb_api_key_ids,
		report_id,
		date_from,
		date_to,
		period = 30,
	}) {
		const response = await request({
			url: `/analytics/report_by_product/export/`,
			method: "GET",
			params: {
				wb_api_key_ids,
				ordering,
				report_id,
				date_from,
				limit,
				date_to,
				period,
				offset,
			},
		})
		return response.data
	}
	async getAbcReportByProduct({
		wb_api_key_ids,
		report_id,
		ordering,
		date_from,
		date_to,
		period = 30,
		search,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/analytics/abc/report_by_product/`,
			method: "GET",
			params: {
				wb_api_key_ids,
				report_id,
				date_from,
				ordering,
				date_to,
				period,
				search,
				limit,
				offset,
			},
		})
		return response.data
	}
	async exportAbcReportByProduct({
		wb_api_key_ids,
		report_id,
		ordering,
		date_from,
		date_to,
		period = 30,
		search,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/analytics/abc/report_by_product/export/`,
			method: "GET",
			params: {
				wb_api_key_ids,
				report_id,
				date_from,
				ordering,
				date_to,
				period,
				search,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getAbcReportByBarcode({
		wb_api_key_ids,
		report_id,
		date_from,
		ordering,
		date_to,
		period = 30,
		search,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/analytics/abc/report_by_barcode/`,
			method: "GET",
			params: {
				wb_api_key_ids,
				report_id,
				ordering,
				date_from,
				date_to,
				period,
				search,
				limit,
				offset,
			},
		})
		return response.data
	}
	async exportAbcReportByBarcode({
		wb_api_key_ids,
		report_id,
		date_from,
		ordering,
		date_to,
		period = 30,
		search,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/analytics/abc/report_by_barcode/export/`,
			method: "GET",
			params: {
				wb_api_key_ids,
				report_id,
				ordering,
				date_from,
				date_to,
				period,
				search,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getReportByBarcode({
		offset,
		search,
		limit,
		ordering,
		wb_api_key_ids,
		report_id,
		date_from,
		date_to,
		period = 30,
	}) {
		const response = await request({
			url: `/analytics/report_by_barcode/`,
			method: "GET",
			params: {
				wb_api_key_ids,
				report_id__in: report_id,
				ordering,
				search,
				date_from,
				date_to,
				period,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportReportByBarcode({
		offset,
		ordering,
		limit,
		wb_api_key_ids,
		report_id,
		date_from,
		date_to,
		period = 30,
	}) {
		const response = await request({
			url: `/analytics/report_by_barcode/export/`,
			method: "GET",
			params: {
				wb_api_key_ids,
				ordering,
				report_id,
				date_from,
				limit,
				date_to,
				period,
				offset,
			},
		})
		return response.data
	}

	async getReportSummary({wb_api_key_ids, limit, offset, date_from, date_to, period}) {
		const response = await request({
			url: `/analytics/report_summary/`,
			method: "GET",
			params: {
				wb_api_key_ids,
				date_from,
				date_to,
				period,
				limit,
				offset,
			},
		})
		return response.data
	}

	async postAnalyticsReportCharge({report_id, income, other, additional, storage}) {
		const response = await request({
			url: `/analytics/report_charge/`,
			method: "post",
			data: {
				report_id,
				income,
				other,
				additional,
				storage,
			},
			// params: {
			// 	wb_api_key_ids,
			// 	date_from,
			// 	date_to,
			// 	period,
			// },
		})
		return response.data
	}

	async getFilteredItems({
		limit = 10,
		offset = 0,
		item_ids,
		warehouse_ids,
		brand_ids,
		orders_share__gt,
		orders_share__lt,
		sale_percent__lt,
		sale_percent__gt,
		available_for_sale__gt,
		available_for_sale__lt,
	}) {
		const response = await request({
			url: `/analytics/items/filter/`,
			method: "GET",
			params: {
				limit,
				offset,
				warehouse_ids,
				brand_ids,
				orders_share__gt,
				orders_share__lt,
				sale_percent__lt,
				sale_percent__gt,
				available_for_sale__lt,
				available_for_sale__gt,
			},
		})
		return response.data
	}

	async getKeywordSummary({
		limit = 25,
		offset = 0,
		name__icontains,

		last_week30__exact,
		last_week30__range,
		last_week30__lt,
		last_week30__lte,
		last_week30__gt,
		last_week30__gte,

		products__exact,
		products__range,
		products__lt,
		products__lte,
		products__gt,
		products__gte,

		diff_frequency30__exact,
		diff_frequency30__range,
		diff_frequency30__lt,
		diff_frequency30__lte,
		diff_frequency30__gt,
		diff_frequency30__gte,

		diff_percent30__exact,
		diff_percent30__range,
		diff_percent30__lt,
		diff_percent30__lte,
		diff_percent30__gt,
		diff_percent30__gte,

		diff_percent60__exact,
		diff_percent60__range,
		diff_percent60__lt,
		diff_percent60__lte,
		diff_percent60__gt,
		diff_percent60__gte,

		diff_percent90__exact,
		diff_percent90__range,
		diff_percent90__lt,
		diff_percent90__lte,
		diff_percent90__gt,
		diff_percent90__gte,
		ordering = "-last_week30",
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords_summary/`,
			method: "GET",
			params: {
				limit,
				offset,
				name__icontains,
				last_week30__exact,
				last_week30__range,
				last_week30__lt,
				last_week30__lte,
				last_week30__gt,
				last_week30__gte,

				products__exact,
				products__range,
				products__lt,
				products__lte,
				products__gt,
				products__gte,

				diff_frequency30__exact,
				diff_frequency30__range,
				diff_frequency30__lt,
				diff_frequency30__lte,
				diff_frequency30__gt,
				diff_frequency30__gte,

				diff_percent30__exact,
				diff_percent30__range,
				diff_percent30__lt,
				diff_percent30__lte,
				diff_percent30__gt,
				diff_percent30__gte,

				diff_percent60__exact,
				diff_percent60__range,
				diff_percent60__lt,
				diff_percent60__lte,
				diff_percent60__gt,
				diff_percent60__gte,

				diff_percent90__exact,
				diff_percent90__range,
				diff_percent90__lt,
				diff_percent90__lte,
				diff_percent90__gt,
				diff_percent90__gte,
				ordering,
			},
		})
		return response.data
	}
	async getKeywordSummaryExport({
		limit = 25,
		offset = 0,
		name__icontains,

		last_week30__exact,
		last_week30__range,
		last_week30__lt,
		last_week30__lte,
		last_week30__gt,
		last_week30__gte,

		products__exact,
		products__range,
		products__lt,
		products__lte,
		products__gt,
		products__gte,

		diff_frequency30__exact,
		diff_frequency30__range,
		diff_frequency30__lt,
		diff_frequency30__lte,
		diff_frequency30__gt,
		diff_frequency30__gte,

		diff_percent30__exact,
		diff_percent30__range,
		diff_percent30__lt,
		diff_percent30__lte,
		diff_percent30__gt,
		diff_percent30__gte,

		diff_percent60__exact,
		diff_percent60__range,
		diff_percent60__lt,
		diff_percent60__lte,
		diff_percent60__gt,
		diff_percent60__gte,

		diff_percent90__exact,
		diff_percent90__range,
		diff_percent90__lt,
		diff_percent90__lte,
		diff_percent90__gt,
		diff_percent90__gte,
		ordering = "-last_week30",
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords_summary/export/`,
			method: "GET",
			params: {
				limit,
				offset,
				name__icontains,

				last_week30__exact,
				last_week30__range,
				last_week30__lt,
				last_week30__lte,
				last_week30__gt,
				last_week30__gte,

				products__exact,
				products__range,
				products__lt,
				products__lte,
				products__gt,
				products__gte,

				diff_frequency30__exact,
				diff_frequency30__range,
				diff_frequency30__lt,
				diff_frequency30__lte,
				diff_frequency30__gt,
				diff_frequency30__gte,

				diff_percent30__exact,
				diff_percent30__range,
				diff_percent30__lt,
				diff_percent30__lte,
				diff_percent30__gt,
				diff_percent30__gte,

				diff_percent60__exact,
				diff_percent60__range,
				diff_percent60__lt,
				diff_percent60__lte,
				diff_percent60__gt,
				diff_percent60__gte,

				diff_percent90__exact,
				diff_percent90__range,
				diff_percent90__lt,
				diff_percent90__lte,
				diff_percent90__gt,
				diff_percent90__gte,
				ordering,
			},
		})
		return response.data
	}
	async getKeywordSummaryToMonitoring({
		limit,
		offset,
		name__icontains,

		last_week30__exact,
		last_week30__range,
		last_week30__lt,
		last_week30__lte,
		last_week30__gt,
		last_week30__gte,

		products__exact,
		products__range,
		products__lt,
		products__lte,
		products__gt,
		products__gte,

		diff_frequency30__exact,
		diff_frequency30__range,
		diff_frequency30__lt,
		diff_frequency30__lte,
		diff_frequency30__gt,
		diff_frequency30__gte,

		diff_percent30__exact,
		diff_percent30__range,
		diff_percent30__lt,
		diff_percent30__lte,
		diff_percent30__gt,
		diff_percent30__gte,

		diff_percent60__exact,
		diff_percent60__range,
		diff_percent60__lt,
		diff_percent60__lte,
		diff_percent60__gt,
		diff_percent60__gte,

		diff_percent90__exact,
		diff_percent90__range,
		diff_percent90__lt,
		diff_percent90__lte,
		diff_percent90__gt,
		diff_percent90__gte,
		ordering = "-last_week30",
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords_summary/export/`,
			method: "GET",
			params: {
				limit,
				offset,
				name__icontains,

				last_week30__exact,
				last_week30__range,
				last_week30__lt,
				last_week30__lte,
				last_week30__gt,
				last_week30__gte,

				products__exact,
				products__range,
				products__lt,
				products__lte,
				products__gt,
				products__gte,

				diff_frequency30__exact,
				diff_frequency30__range,
				diff_frequency30__lt,
				diff_frequency30__lte,
				diff_frequency30__gt,
				diff_frequency30__gte,

				diff_percent30__exact,
				diff_percent30__range,
				diff_percent30__lt,
				diff_percent30__lte,
				diff_percent30__gt,
				diff_percent30__gte,

				diff_percent60__exact,
				diff_percent60__range,
				diff_percent60__lt,
				diff_percent60__lte,
				diff_percent60__gt,
				diff_percent60__gte,

				diff_percent90__exact,
				diff_percent90__range,
				diff_percent90__lt,
				diff_percent90__lte,
				diff_percent90__gt,
				diff_percent90__gte,
				ordering,
			},
		})
		return response.data
	}

	async getBrandsList() {
		const response = await request({
			url: "/analytics/brands/",
			method: "GET",
		})
		return response.data
	}

	async getSummary() {
		const response = await request({
			url: "/analytics/summary/",
			method: "GET",
		})
		return response.data
	}

	async postSettingAbcAnalitics(data) {
		const response = await request({
			url: "/analytics/settings/",
			method: "post",
			data,
		})
		return response.data
	}

	async getOrders({brand_ids, warehouse_ids, item_ids, offset, limit}) {
		const response = await request({
			url: "/analytics/summary/orders/",
			method: "GET",
			params: {
				brand_ids,
				warehouse_ids,
				item_ids,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getSales({brand_ids, warehouse_ids, item_ids, offset, limit}) {
		const response = await request({
			url: "/analytics/summary/sales/",
			method: "GET",
			params: {
				brand_ids,
				warehouse_ids,
				item_ids,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getReturns({brand_ids, warehouse_ids, item_ids, offset, limit}) {
		const response = await request({
			url: "/analytics/summary/returns/",
			method: "GET",
			params: {
				brand_ids,
				warehouse_ids,
				item_ids,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getItemsPopular({brand_ids, item_ids, offset, limit}) {
		const response = await request({
			url: "/analytics/items/popular/",
			method: "GET",
			params: {
				brand_ids,
				item_ids,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getItemsOld({brand_ids, item_ids, offset, limit}) {
		const response = await request({
			url: "/analytics/items/old/",
			method: "GET",
			params: {
				brand_ids,
				item_ids,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getItemsRansom({brand_ids, item_ids, ransom__lt, ransom__gt, offset, limit}) {
		const response = await request({
			url: "/analytics/items/ransom/",
			method: "GET",
			params: {
				brand_ids,
				item_ids,
				ransom__lt,
				ransom__gt,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getBrandActual({id, brand_id__in, extra_fields}) {
		const response = await request({
			url: `/parsers/brands/${id ? id + "/" : ""}`,
			method: "GET",
			params: {
				brand_id__in,
				is_actual: false,
				extra_fields,
			},
		})
		return response.data
	}

	async getSellerActual({id, seller_id__in}) {
		const response = await request({
			url: `/parsers/sellers/${id ? id : ""}`,
			method: "GET",
			params: {
				seller_id__in,
				is_actual: false,
			},
		})
		return response.data
	}

	async getCategoriesActual({id, category_id__in, extra_fields}) {
		const response = await request({
			url: `/parsers/categories/${id ? id : ""}`,
			method: "GET",
			params: {
				category_id__in,
				is_actual: false,
				extra_fields,
			},
		})
		return response.data
	}

	async getItemsLost({brand_ids, item_ids, offset, limit}) {
		const response = await request({
			url: "/analytics/items/lost/",
			method: "GET",
			params: {
				brand_ids,
				item_ids,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getExportPopularItems({brand_ids, item_ids, limit, offset}) {
		const response = await request({
			url: "/analytics/items/popular/export/",
			method: "GET",
			params: {
				brand_ids,
				item_ids,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getExportOldItems({brand_ids, item_ids, limit, offset}) {
		const response = await request({
			url: "/analytics/items/old/export/",
			method: "GET",
			params: {
				brand_ids,
				item_ids,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getExportRansomItems({brand_ids, item_ids, ransom__lt, ransom__gt, limit, offset}) {
		const response = await request({
			url: "/analytics/items/ransom/export/",
			method: "GET",
			params: {
				brand_ids,
				item_ids,
				ransom__lt,
				ransom__gt,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getExportLostItems({brand_ids, item_ids, limit, offset}) {
		const response = await request({
			url: "/analytics/items/lost/export/",
			method: "GET",
			params: {
				brand_ids,
				item_ids,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getParsersBrands({
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		name__in,
		period,
		likes__gt,
		likes__lt,
		incomes_30,
		orders_sum,
		orders_volume,
		quantity_sum_per_day,
		orders_sum_per_day,
		orders_avg_per_day,
		supplier,
		categories,
		ransom,
		reviews_sum,
		quantity_sum,
		discount_avg,
		price_avg,
		date_from, // за период YYYY_MM_DD
		date_to,
		wb,
		is_new,
		limit,
		offset,
		search,
		name,
		warehouse_id__in,
		ordering,
	}) {
		const response = await request({
			url: "/parsers/brands/",
			method: "get",
			params: {
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				name__in,
				period,
				likes__lt,
				likes__gt,
				orders_sum,
				orders_volume,
				quantity_sum_per_day,
				orders_sum_per_day,
				orders_avg_per_day,
				supplier,
				categories,
				ransom,
				reviews_sum,
				quantity_sum,
				discount_avg,
				price_avg,
				date_to,
				date_from,
				is_new,
				wb,
				name,
				warehouse_id__in,
				incomes_30,
				search,
				limit,
				offset,
				ordering,
				actual: true,
			},
		})
		return response.data
	}

	async getBrandsDynamic({
		brand_ids,
		seller_ids,
		category_ids,
		collection_id,
		wb_search,
		search,
		wb_catalog_url,
		alias,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"discount_dynamic",
			"orders_failed",
			"orders_failed_dynamic",
			"proceeds_failed",
			"proceeds_failed_dynamic",
			"old_price",
			"old_price_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			"sellers",
			"ransom",
			"ransom_dynamic",
			"vendor_codes",
			"rating",
			"reviews",
			"vendor_codes_dynamic",
			"rating_dynamic",
			"reviews_dynamic",
			"sales_percent",
		].join(),
	}) {
		const response = await request({
			url: "/wb_dynamic/brands/",
			method: "get",
			params: {
				brand_ids,
				collection_id,
				seller_ids,
				category_ids,
				wb_search,
				search,
				wb_catalog_url,
				alias,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})

		return response.data
	}
	async getCategoryBrands({
		brand_ids,
		seller_ids,
		category_ids,
		collection_id,
		wb_search,
		search,
		wb_catalog_url,
		alias,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"discount_dynamic",
			"orders_failed",
			"orders_failed_dynamic",
			"proceeds_failed",
			"proceeds_failed_dynamic",
			"old_price",
			"old_price_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			"sellers",
			"ransom",
			"ransom_dynamic",
			"vendor_codes",
			"rating",
			"reviews",
			"vendor_codes_dynamic",
			"rating_dynamic",
			"reviews_dynamic",
			"sales_percent",
		].join(),
	}) {
		const response = await request({
			url: "/wb_dynamic/category_brands/",
			method: "get",
			params: {
				brand_ids,
				collection_id,
				seller_ids,
				category_ids,
				wb_search,
				search,
				wb_catalog_url,
				alias,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}
	async exportCategoryBrands({
		brand_ids,
		seller_ids,
		category_ids,
		collection_id,
		wb_search,
		search,
		wb_catalog_url,
		alias,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"discount_dynamic",
			"orders_failed",
			"orders_failed_dynamic",
			"proceeds_failed",
			"proceeds_failed_dynamic",
			"old_price",
			"old_price_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			"sellers",
			"ransom",
			"ransom_dynamic",
			"vendor_codes",
			"rating",
			"reviews",
			"vendor_codes_dynamic",
			"rating_dynamic",
			"reviews_dynamic",
			"sales_percent",
		].join(),
	}) {
		const response = await request({
			url: "/wb_dynamic/category_brands/export/",
			method: "get",
			params: {
				brand_ids,
				collection_id,
				seller_ids,
				category_ids,
				wb_search,
				search,
				wb_catalog_url,
				alias,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}

	async exportBrandsDynamic({
		brand_ids,
		seller_ids,
		category_ids,
		wb_search,
		search,
		wb_catalog_url,
		collection_id,
		alias,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"discount_dynamic",
			"orders_failed",
			"orders_failed_dynamic",
			"proceeds_failed",
			"proceeds_failed_dynamic",
			"old_price",
			"old_price_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			"ransom",
			"ransom_dynamic",
		].join(),
	}) {
		const response = await request({
			url: "/wb_dynamic/brands/export/",
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				category_ids,
				collection_id,
				wb_search,
				search,
				wb_catalog_url,
				alias,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}

	async exportBrandsDynamicById({
		id,
		seller_ids,
		category_ids,
		wb_search,
		search,
		wb_catalog_url,
		alias,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"discount_dynamic",
			"orders_failed",
			"orders_failed_dynamic",
			"proceeds_failed",
			"proceeds_failed_dynamic",
			"old_price",
			"old_price_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			"ransom",
			"ransom_dynamic",
		].join(),
	}) {
		const response = await request({
			url: `/wb_dynamic/brands/${id}/export/`,
			method: "get",
			params: {
				brand_ids: id,
				seller_ids,
				category_ids,
				wb_search,
				search,
				wb_catalog_url,
				alias,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}

	async getGeneralCategoriesDynamic({
		product_ids,
		brand_ids,
		seller_ids,
		category_ids,
		collection_id,
		parent_id,
		down_parent_id,
		up_parent_id,
		level,
		wb_search,
		search,
		wb_catalog_url,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			// "vendor_codes",
			// "vendor_codes_dynamic",
			// "brands_count",
			// "brands_count_dynamic",
			// "sellers_count",
			// "sellers_count_dynamic",
			// "price",
			// "price_dynamic",
			// "old_price",
			// "discount",
			// "discount_dynamic",
			// "proceeds",
			// "proceeds_dynamic",
			// "orders",
			// "orders_dynamic",
			// "ransom",
			// "sales_proceeds",
			// "sales_proceeds_dynamic",
			// "sales",
			// "sales_dynamic",
			// "quantity",
			// "quantity_dynamic",
			// "in_stock_percent",
			// "in_stock_days",
			// "out_of_stock_days",
			// "in_stock_orders_avg",
			// "in_stock_proceeds",
			// "lost_proceeds",
			// "product_with_orders",
			// "product_with_orders_dynamic",
			"product_with_orders_and_quantity",
			// "product_with_orders_and_quantity_dynamic",
			// "brands_with_orders",
			// "brands_with_orders_dynamic",
			// "sellers_with_orders",
			// "sellers_with_orders_dynamic",
			"category_name",
			"vendor_codes_dynamic",
			"brands_with_orders_dynamic",
			"product_with_orders_dynamic",
			"product_with_orders_and_quantity_dynamic",
			"brands_count_dynamic",
			"sellers_count_dynamic",
			"sellers_with_orders_dynamic",
			"price_dynamic",
			"discount_dynamic",
			"proceeds_dynamic",
			"orders_dynamic",
			"quantity_dynamic",
			"sales_dynamic",
			"sales_proceeds_dynamic",
			"vendor_codes",
			"brands_with_orders",
			"product_with_orders",
			"brands_count",
			"sellers_count",
			"sellers_with_orders",
			"price",
			"discount",
			"proceeds",
			"orders",
			"quantity",
			"lost_proceeds",
			"sales",
			"sales_percent",
			"sales_proceeds",
			// "in_stock_orders_avg",
			// "in_stock_proceeds",
		].join(),
	}) {
		const response = await request({
			url: "/wb_dynamic/general_categories/",
			method: "get",
			params: {
				product_ids,
				brand_ids,
				seller_ids,
				collection_id,
				category_ids,
				parent_id,
				down_parent_id,
				up_parent_id,
				level,
				wb_search,
				search,
				wb_catalog_url,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}

	async getPriceStepsForBrand({
		product_ids,
		brand_ids,
		seller_ids,
		category_ids,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		price__gte,
		price__lte,
		price__gt = 1,
		price__lt = 1,
		chunks = 1,
		extra_fields = [
			"category_name",
			"vendor_codes_dynamic",
			"brands_with_orders_dynamic",
			"product_with_orders_dynamic",
			"product_with_orders_and_quantity_dynamic",
			"brands_count_dynamic",
			"sellers_count_dynamic",
			"sellers_with_orders_dynamic",
			"price_dynamic",
			"discount_dynamic",
			"proceeds_dynamic",
			"orders_dynamic",
			"quantity_dynamic",
			"sales_dynamic",
			"sales_proceeds_dynamic",
			"vendor_codes",
			"brands_with_orders",
			"product_with_orders",
			"brands_count",
			"sellers_count",
			"sellers_with_orders",
			"price",
			"discount",
			"proceeds",
			"orders",
			"quantity",
			"lost_proceeds",
			"sales",
			"sales_percent",
			"sales_proceeds",
			// "in_stock_orders_avg",
			// "in_stock_proceeds",
		].join(),
	}) {
		const response = await request({
			url: "/wb_dynamic/price_steps_dynamic/",
			method: "get",
			params: {
				product_ids,
				brand_ids,
				seller_ids,
				category_ids,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				price__gte,
				price__lte,
				price__gt,
				price__lt,
				chunks,
				extra_fields,
			},
		})
		return response.data
	}
	async getPriceStepsForSeach({
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		wb_search,
		price__gte = 1,
		price__lte = 1,
		chunks = 1,
		city,
		extra_fields = [
			"category_name",
			"vendor_codes_dynamic",
			"brands_with_orders_dynamic",
			"product_with_orders_dynamic",
			"product_with_orders_and_quantity_dynamic",
			"brands_count_dynamic",
			"sellers_count_dynamic",
			"sellers_with_orders_dynamic",
			"price_dynamic",
			"discount_dynamic",
			"proceeds_dynamic",
			"orders_dynamic",
			"quantity_dynamic",
			"sales_dynamic",
			"sales_proceeds_dynamic",
			"vendor_codes",
			"brands_with_orders",
			"product_with_orders",
			"brands_count",
			"sellers_count",
			"sellers_with_orders",
			"price",
			"discount",
			"proceeds",
			"orders",
			"quantity",
			"lost_proceeds",
			"sales",
			"sales_percent",
			"sales_proceeds",
			// "in_stock_orders_avg",
			// "in_stock_proceeds",
		].join(),
	}) {
		const response = await request({
			url: "/api/wb_dynamic/price_steps_search/",
			method: "get",
			params: {
				price__gte,
				price__lte,
				chunks,
				wb_search,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}

	async getPriceSteps({
		product_ids,
		brand_ids,
		seller_ids,
		category_ids,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		price__gte,
		price__lte,
		price__gt = 1,
		price__lt = 1,
		chunks = 1,
		extra_fields = [
			"category_name",
			"vendor_codes_dynamic",
			"brands_with_orders_dynamic",
			"product_with_orders_dynamic",
			"product_with_orders_and_quantity_dynamic",
			"brands_count_dynamic",
			"sellers_count_dynamic",
			"sellers_with_orders_dynamic",
			"price_dynamic",
			"discount_dynamic",
			"proceeds_dynamic",
			"orders_dynamic",
			"quantity_dynamic",
			"sales_dynamic",
			"sales_proceeds_dynamic",
			"vendor_codes",
			"brands_with_orders",
			"product_with_orders",
			"brands_count",
			"sellers_count",
			"sellers_with_orders",
			"price",
			"discount",
			"proceeds",
			"orders",
			"quantity",
			"lost_proceeds",
			"sales",
			"sales_percent",
			"sales_proceeds",
			// "in_stock_orders_avg",
			// "in_stock_proceeds",
		].join(),
	}) {
		const response = await request({
			url: "/wb_dynamic/price_steps/",
			method: "get",
			params: {
				product_ids,
				brand_ids,
				seller_ids,
				category_ids,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				price__gte,
				price__lte,
				price__gt,
				price__lt,
				chunks,
				extra_fields,
			},
		})
		return response.data
	}

	async exportGeneralCategoriesDynamic({
		category_ids,
		parent_id,
		collection_id,
		level,
		wb_search,
		wb_catalog_url,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"brands_count",
			"category_id",
			"create_date",
			"discount",
			"discount_avg",
			"discount_sum",
			"full_name",
			"group_count",
			"has_child",
			"id",
			"income",
			"income_failed",
			"level",
			"name",
			"old_price_avg",
			"old_price_sum",
			"orders",
			"orders_failed",
			"orders_failed_summary",
			"orders_summary",
			"parent_id",
			"price_avg",
			"price_sum",
			"proceeds",
			"proceeds_failed",
			"proceeds_failed_summary",
			"proceeds_summary",
			// "product_with_orders",
			// "product_with_orders_and_quantity",
			"promo_discount_avg",
			"promo_discount_sum",
			"quantity",
			"ransom_summary",
			"sales_proceeds_summary",
			"sales_summary",
			"sellers_count",
			"url_type",
			"vendor_codes",
			"product_with_orders",
			// "product_with_orders_dynamic",
			"product_with_orders_and_quantity",
			// "product_with_orders_and_quantity_dynamic",
			"brands_with_orders",
			// "brands_with_orders_dynamic",
			"sellers_with_orders",
			// "sellers_with_orders_dynamic",
		].join(),
	}) {
		const response = await request({
			url: "/wb_dynamic/general_categories/export/",
			method: "get",
			params: {
				category_ids,
				collection_id,
				parent_id,
				level,
				wb_search,
				wb_catalog_url,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}

	async exportGeneralCategoriesDynamicById({
		id,
		category_ids,
		parent_id,
		level,
		wb_search,
		wb_catalog_url,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"product_with_orders_dynamic",
			"product_with_orders_and_quantity_dynamic",
			"brands_with_orders_dynamic",
			"sellers_with_orders_dynamic",
		].join(),
	}) {
		const response = await request({
			url: `/wb_dynamic/general_categories/${id}/export/`,
			method: "get",
			params: {
				category_ids,
				parent_id,
				level,
				wb_search,
				wb_catalog_url,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}

	async getProducts({
		id__in,
		brand_id__in,

		discount__gte, // Общий % скидки без учета СПП
		discount__lte,

		price__gte, // Цена реализации
		price__lte,

		date_from, // за период YYYY-MM-DD
		date_to,

		rating__gte, //Рейтинг
		rating__lte,

		reviews_sum__gte, //{min,max} Количество отзывов
		reviews_sum__lte,

		orders_volume__gte, //{min,max} объем входящих заказов
		orders_volume__lte,

		orders_sum__gte, //{min,max} кол-во заказаных товаров
		orders_sum__lte,

		ransom__gte, //{min,max} Доля выкупа
		ransom__lte,

		orders_sum_per_day__gte, //{min,max} Заказов в день при наличии
		orders_sum_per_day__lte,

		orders_avg_per_day__gte, //{min,max} Скорость заказов в день при наличии
		orders_avg_per_day__lte,

		days_on_site__gte, //{min,max} Дней на сайте
		days_on_site__lte,

		out_of_stock_30_percent__gte, //{min,max} % времени не в наличии за последние 30 дней
		out_of_stock_30_percent__lte,

		quantity_sum__gte, //{min,max} Товарные остатки
		quantity_sum__lte,

		tag_link,

		limit,
		offset,
	}) {
		const response = await request({
			url: "parsers/products/",
			method: "get",
			params: {
				id__in,
				brand_id__in,

				discount__gte, // Общий % скидки без учета СПП
				discount__lte,

				price__gte, // Цена реализации
				price__lte,

				date_from, // За период YYYY-MM-DD
				date_to,

				rating__gte, // Рейтинг
				rating__lte,

				...Object.fromEntries(
					[
						["reviews_sum", minmax(reviews_sum__gte, reviews_sum__lte)],
						["orders_volume", minmax(orders_volume__gte, orders_volume__lte)],
						["orders_sum", minmax(orders_sum__gte, orders_sum__lte)],
						["ransom", minmax(ransom__gte, ransom__lte)],
						[
							"orders_sum_per_day",
							minmax(orders_sum_per_day__gte, orders_sum_per_day__lte),
						],
						[
							"orders_avg_per_day",
							minmax(orders_avg_per_day__gte, orders_avg_per_day__lte),
						],
						["days_on_site_day", minmax(days_on_site__gte, days_on_site__lte)],
						[
							"out_of_stock_30_percent_day",
							minmax(out_of_stock_30_percent__gte, out_of_stock_30_percent__lte),
						],
						["quantity_sum", minmax(quantity_sum__gte, quantity_sum__lte)],
					].filter(pair => pair[1] !== null)
				),

				tag_link,

				limit,
				offset,
			},
		})
		return response.data
	}

	async getProfile() {
		const response = await request({
			url: "/auth/profile/",
			method: "get",
		})
		return response.data
	}

	async updateProfile({email, phone, name, old_password, new_password1, new_password2}) {
		const response = await request({
			url: "/auth/profile/",
			method: "patch",
			data: {
				email,
				phone,
				name,
				old_password,
				new_password1,
				new_password2,
			},
		})
		return response.data
	}

	async getApiKeys() {
		const response = await request({
			url: "/company/api_keys/",
			method: "get",
		})
		return response.data
	}

	async createApiKey({name, api_key, is_new}) {
		const response = await request({
			url: "/company/api_keys/",
			method: "post",
			data: {
				name,
				api_key,
				is_new,
			},
		})
		return response.data
	}

	async updateApiKey({name, api_key, is_new, id}) {
		const response = await request({
			url: `/company/api_keys/${id}/`,
			method: "patch",
			data: {
				name,
				api_key,
				is_new,
			},
		})
		return response.data
	}

	async deleteApiKey({id}) {
		const response = await request({
			url: `/company/api_keys/${id}/`,
			method: "delete",
		})
		return response.data
	}

	async getCompanyUsers() {
		const response = await request({
			url: "/company/users/",
			method: "get",
		})
		return response.data
	}
	async postDemoTariff() {
		const response = await request({
			url: "/company/users/activate_demo/",
			method: "POST",
		})
		return response.data
	}

	async createCompanyUser({email, password, phone, name, role, api_keys, is_active}) {
		const response = await request({
			url: `/company/users/`,
			method: "post",
			data: {
				email,
				password,
				phone,
				name,
				role,
				api_keys,
				is_active,
			},
		})
		return response.data
	}

	async updateCompanyUser({id, email, password, phone, name, role, api_keys, is_active}) {
		const response = await request({
			url: `/company/users/${id}/`,
			method: "patch",
			data: {
				email,
				password,
				phone,
				name,
				role,
				api_keys,
				is_active,
			},
		})
		return response.data
	}

	async deleteCompanyUser({id}) {
		const response = await request({
			url: `/company/users/${id}/`,
			method: "delete",
		})
		return response.data
	}

	async getOperationReport({date_from, date_to, brand_ids, category_ids}) {
		const response = await request({
			url: `/analytics/operation_report/`,
			method: "GET",
			params: {
				date_from,
				date_to,
				brand_ids,
				category_ids,
			},
		})
		return response.data
	}
	async getTopKeywordsDynamic({date_from, date_to, product_id}) {
		const response = await request({
			url: `wb_dynamic/products/${product_id}/top_keywords/`,
			method: "GET",
			params: {
				date_from,
				date_to,
			},
		})
		return response.data
	}

	async getReportByDates({date_from, date_to, brand_ids, category_ids, limit, offset}) {
		const response = await request({
			url: `/analytics/operation_report/by_dates/`,
			method: "GET",
			params: {
				date_from,
				date_to,
				brand_ids,
				category_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportReportByDates({date_from, date_to, brand_ids, category_ids, limit, offset}) {
		const response = await request({
			url: `/analytics/operation_report/by_dates/export/`,
			method: "GET",
			params: {
				date_from,
				date_to,
				brand_ids,
				category_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportReportByItems({date_from, date_to, brand_ids, category_ids, qtype, offset, limit}) {
		const response = await request({
			url: `/analytics/operation_report/by_items/export/`,
			method: "GET",
			params: {
				date_from,
				date_to,
				brand_ids,
				category_ids,
				qtype,
				offset,
				limit,
			},
		})
		return response.data
	}

	async getOperationReportPaidIncome({date_from, date_to, brand_ids, category_ids}) {
		const response = await request({
			url: `/analytics/paid_income/`,
			method: "GET",
			params: {
				date_from,
				date_to,
				brand_ids,
				category_ids,
			},
		})
		return response.data
	}

	async getReportByItems({date_from, date_to, qtype, brand_ids, category_ids, limit, offset}) {
		const response = await request({
			url: `/analytics/operation_report/by_items/`,
			method: "GET",
			params: {
				date_from,
				date_to,
				qtype,
				brand_ids,
				category_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getCategories() {
		const response = await request({
			url: `/analytics/categories/`,
			method: "get",
		})
		return response.data
	}

	async getBrands() {
		const response = await request({
			url: `/analytics/brands/`,
			method: "get",
		})
		return response.data
	}

	async exportReportByCategory({date_from, date_to, brand_ids, category_ids}) {
		const response = await request({
			url: `/analytics/orders/by_category/export/`,
			method: "GET",
			params: {
				date_from,
				date_to,
				brand_ids,
				category_ids,
			},
		})
		return response.data
	}

	async getAnalyticsOrdersByCategory({date_from, date_to, category_ids, brand_ids}) {
		const response = await request({
			url: `/analytics/orders/by_category/`,
			method: "get",
			params: {
				date_from,
				date_to,
				category_ids,
				brand_ids,
			},
		})
		return response.data
	}

	async getExternalCategoriesTreeById({id}) {
		const response = await request({
			url: `/analytics/external_categories/${id}/tree/`,
			method: "get",
		})
		return response.data
	}

	async getItemsFilter({
		limit, //limit
		offset, //offset
		date_gt,
		date_lt,
		ids, //ids
		external_ids, //wb id
		warehouse_ids, //склады
		brand_ids, //бренды
		category_ids, //категории
		external_category_ids, //wb категории
		color_ids, //Группы цветов
		size_ids, //размеры
		date__gt, //дата больше чем
		date__lt, //дата меньше чем
		is_new, //показать только новые
		can_end_up__gt, //могут закончится больше чем
		can_end_up__lt, //могут закончится меньше чем
		days_on_site__gt, //дней на сайте больше чем
		days_on_site__lt, //дней на сайте меньше чем
		turnover__gt, //оборачиваемость больше чем
		turnover__lt, //оборачиваемость меньше чем
		price_with_discount__lt, //цена со скидкой меньше чем
		price_with_discount__gt, //цена со скидкой больше чем
		discount__lt, //скидка меньше чем
		discount__gt, //скидка больше чем
		orders_sum__gt, //Объем входящих заказов больше чем
		orders_sum__lt, //Объем входящих заказов меньше чем
		orders_amount__lt, //Количество заказанных товаров меньше чем
		orders_amount__gt, //Количество заказанных товаров больше чем
		sale_percent__lt, //процент выкупаемости меньше чем
		sale_percent__gt, //процент выкупаемости больше чем
		sale_amount__lt, //Количество выкупленных товаров меньше чем
		sale_amount__gt, //Количество выкупленных товаров больше чем
		sale_sum__gt, //Объем выкупленных заказов больше чем
		sale_sum__lt, //Объем выкупленных заказов меньше чем
		return_percent__lt, //процент возврата меньше чем
		return_percent__gt, //процент возврата больше чем
		percent_of_val_income__lt, //процент валовой прибыли меньше чем
		percent_of_val_income__gt, //процент валовой прибыли больше чем
		logistics_outcome__lt, //расходы на логистику меньше чем
		logistics_outcome__gt, //расходы на логистику больше чем
		storage_outcome__lt, //Расходы на хранение меньше чем
		storage_outcome__gt, //Расходы на хранение больше чем
		reviews_count__lt, //кол-во отзывов меньше чем
		reviews_count__gt, //кол-во отзывов больше чем
		rating__lt, //рейтинг меньше чем
		rating__gt, //рейтинг больше чем
		available_for_sale__lt, //доступно для продажи меньше чем
		available_for_sale__gt, //доступно для продажи больше чем
		orders_share__lt, //доля заказов меньше чем
		orders_share__gt, //доля заказов больше чем
		orders_speed_in_stock__lt, //Скорость заказанных товаров при наличии меньше чем
		orders_speed_in_stock__gt, //Скорость заказанных товаров при наличии больше чем
		sales_speed_in_stock__lt, //Скорость выкупленных товаров при наличии меньше чем
		sales_speed_in_stock__gt, //Скорость выкупленных товаров при наличии больше чем
	}) {
		const response = await request({
			url: "/analytics/items/filter/",
			method: "get",
			params: {
				limit,
				offset,
				date_gt,
				date_lt,
				ids,
				external_ids,
				warehouse_ids,
				brand_ids,
				category_ids,
				external_category_ids,
				color_ids,
				size_ids,
				date__gt,
				date__lt,
				is_new,
				can_end_up__gt,
				can_end_up__lt,
				days_on_site__gt,
				days_on_site__lt,
				turnover__gt,
				turnover__lt,
				price_with_discount__lt,
				price_with_discount__gt,
				discount__lt,
				discount__gt,
				orders_sum__gt,
				orders_sum__lt,
				orders_amount__lt,
				orders_amount__gt,
				sale_percent__lt,
				sale_percent__gt,
				sale_amount__lt,
				sale_amount__gt,
				sale_sum__gt,
				sale_sum__lt,
				return_percent__lt,
				return_percent__gt,
				percent_of_val_income__lt,
				percent_of_val_income__gt,
				logistics_outcome__lt,
				logistics_outcome__gt,
				storage_outcome__lt,
				storage_outcome__gt,
				reviews_count__lt,
				reviews_count__gt,
				rating__lt,
				rating__gt,
				available_for_sale__lt,
				available_for_sale__gt,
				orders_share__lt,
				orders_share__gt,
				orders_speed_in_stock__lt,
				orders_speed_in_stock__gt,
				sales_speed_in_stock__lt,
				sales_speed_in_stock__gt,
			},
		})
		return response.data
	}

	async getAnalyticsSavedFilters({search, limit, offset}) {
		const response = await request({
			url: "/analytics/items/filter/saved/",
			method: "get",
			params: {
				search,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportReportOrdersBySize({date_from, date_to, category_ids, brand_ids, limit, offset}) {
		const response = await request({
			url: `/analytics/orders/by_size/export/`,
			method: "GET",
			params: {
				date_from,
				date_to,
				category_ids,
				brand_ids,
				limit,
				offset,
			},
		})
		return response.data
	}
	async saveAnalyticsFilter({name, data}) {
		const response = await request({
			url: "/analytics/items/filter/saved/",
			method: "put",
			data: {
				name,
				data,
			},
		})
		return response.data
	}

	async renameAnalyticsSavedFilters({id, name}) {
		const response = await request({
			url: `/analytics/items/filter/saved/${id}/`,
			method: "post",
			data: {
				name,
			},
		})
		return response.data
	}

	async deleteAnalyticsSavedFilters({id}) {
		const response = await request({
			url: `/analytics/items/filter/saved/${id}/`,
			method: "delete",
		})
		return response.data
	}

	async getAnalyticsOrdersBySize({date_from, date_to, category_ids, brand_ids, limit, offset}) {
		const response = await request({
			url: `/analytics/orders/by_size/`,
			method: "get",
			params: {
				date_from,
				date_to,
				category_ids,
				brand_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportReportOrdersByWarehouse({
		date_from,
		date_to,
		category_ids,
		brand_ids,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/analytics/orders/by_warehouse/export/`,
			method: "GET",
			params: {
				date_from,
				date_to,
				category_ids,
				brand_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getAnalyticsOrdersByWarehouse({
		date_from,
		date_to,
		category_ids,
		brand_ids,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/analytics/orders/by_warehouse/`,
			method: "get",
			params: {
				date_from,
				date_to,
				category_ids,
				brand_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportReportOrdersByRegion({date_from, date_to, category_ids, brand_ids, limit, offset}) {
		const response = await request({
			url: `/analytics/orders/by_region/export/`,
			method: "GET",
			params: {
				date_from,
				date_to,
				category_ids,
				brand_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getAnalyticsOrdersByRegion({date_from, date_to, category_ids, brand_ids, limit, offset}) {
		const response = await request({
			url: `/analytics/orders/by_region/`,
			method: "get",
			params: {
				date_from,
				date_to,
				category_ids,
				brand_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getAnalyticsOrdersBy_Warehouse({
		date_from,
		date_to,
		category_ids,
		brand_ids,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/analytics/orders/by_warehouse/`,
			method: "get",
			params: {
				date_from,
				date_to,
				category_ids,
				brand_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getAnalyticsOrdersByColors({date_from, date_to, category_ids, brand_ids, limit, offset}) {
		const response = await request({
			url: `/analytics/orders/by_color/`,
			method: "get",
			params: {
				date_from,
				date_to,
				category_ids,
				brand_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getAnalyticsOrdersBy_Region({
		date_from,
		date_to,
		category_ids,
		brand_ids,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/analytics/orders/by_region/`,
			method: "get",
			params: {
				date_from,
				date_to,
				category_ids,
				brand_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportReportOrdersByColors({date_from, date_to, category_ids, brand_ids, limit, offset}) {
		const response = await request({
			url: `/analytics/orders/by_color/export/`,
			method: "get",
			params: {
				date_from,
				date_to,
				category_ids,
				brand_ids,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getColors() {
		const response = await request({
			url: `/analytics/colors/`,
			method: "get",
		})
		return response.data
	}

	async getCatalogs() {
		const response = await request({
			url: `/analytics/catalogs/`,
			method: "get",
		})
		return response.data
	}

	async getProductById({id, date_from, date_to}) {
		const response = await request({
			url: `/parsers/products/${id}/`,
			method: "get",
			params: {
				date_from,
				date_to,
			},
		})
		return response.data
	}
	async getSubjectIds({search, limit, offset}) {
		const response = await request({
			url: `/parsers/subjects/`,
			method: "get",
			params: {
				search,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getProductRelative({id, date_from, date_to, period}) {
		const response = await request({
			url: `/parsers/products/${id}/relative/`,
			method: "get",
			params: {
				date_from,
				date_to,
				period,
			},
		})
		return response.data
	}

	async getProductColorDynamic({
		item,
		date_from,
		date_to,
		period,
		extra_fields,
		limit,
		offset,
		ordering,
	}) {
		const response = await request({
			url: "/wb_dynamic/product_colors/",
			method: "get",
			params: {
				item,
				date_from,
				date_to,
				period,
				extra_fields,
				limit,
				offset,
				ordering,
			},
		})
		return response.data
	}

	async exportProductColorDynamic({
		item,
		date_from,
		date_to,
		period,
		extra_fields,
		limit,
		offset,
	}) {
		const response = await request({
			url: "/wb_dynamic/product_colors/export/",
			method: "get",
			params: {
				item,
				date_from,
				date_to,
				period,
				extra_fields,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getSimilarProducts({product_ids, date_from, date_to, extra_fields, limit, offset}) {
		const response = await request({
			url: `/wb_dynamic/product_similar/`,
			method: "get",
			params: {
				product_ids,
				date_from,
				date_to,
				extra_fields,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getSimilarProductsScope({id, date_from, date_to, extra_fields, limit, offset}) {
		const response = await request({
			url: `/parsers/products/${id}/similar/scope/`,
			method: "get",
			params: {
				date_from,
				date_to,
				extra_fields,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportSimilarProducts({product_ids, date_from, date_to, extra_fields, limit, offset}) {
		const response = await request({
			url: `/wb_dynamic/product_similar/export/`,
			method: "get",
			params: {
				product_ids,
				date_from,
				date_to,
				extra_fields,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getAlsoBuyProducts({
		product_ids,
		date_from,
		date_to,
		extra_fields,
		limit,
		offset,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/product_also_buy/`,
			method: "get",
			params: {
				product_ids,
				date_from,
				date_to,
				extra_fields,
				limit,
				offset,
				ordering,
			},
		})
		return response.data
	}

	async getAlsoBuyProductsScope({id, date_from, date_to, extra_fields, limit, offset, ordering}) {
		const response = await request({
			url: `/parsers/products/${id}/also_buy/scope/`,
			method: "get",
			params: {
				date_from,
				date_to,
				extra_fields,
				limit,
				offset,
				ordering,
			},
		})
		return response.data
	}

	async exportAlsoBuyProducts({product_ids, date_from, date_to, extra_fields, limit, offset}) {
		const response = await request({
			url: `/wb_dynamic/product_also_buy/export/`,
			method: "get",
			params: {
				product_ids,
				date_from,
				date_to,
				extra_fields,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getSearchTagsProducts({id, date_from, date_to}) {
		const response = await request({
			url: `/parsers/products/${id}/search_tags/`,
			method: "get",
			params: {
				date_from,
				date_to,
			},
		})
		return response.data
	}

	// async getTagLinkProducts({ id__in, limit, offset, tag_link }) {
	// 	const response = await request({
	// 		url: `/parsers/products/`,
	// 		method: "get",
	// 		params: {
	// 			tag_link,
	// 			limit,
	// 			offset,
	// 			id__in,
	// 		},
	// 	})
	// 	return response.data
	// }

	// async getTagLinkProductsNext({ limit, offset, tag_link }) {
	// 	const response = await request({
	// 		url: `/parsers/products/`,
	// 		method: "get",
	// 		params: {
	// 			limit,
	// 			offset,
	// 			tag_link,
	// 		},
	// 	})
	// 	return response.data
	// }

	// async getProducts({ id__in }) {
	// 	const response = await request({
	// 		url: `/parsers/products/`,
	// 		method: "get",
	// 		params: {
	// 			id__in,
	// 		},
	// 	})
	// 	return response.data
	// }

	async getBrandCard({brandId, date_from, date_to, period, orders_volume}) {
		const response = await request({
			url: `/parsers/brands/${brandId}/`,
			method: "get",
			params: {
				date_from,
				date_to,
				period,
				orders_volume,
			},
		})
		return response.data
	}

	async getBrandCategoriesSeo({brandId, period, date_from, date_to}) {
		const response = await request({
			url: `/parsers/brands_seo/${brandId}/categories/`,
			method: "get",
			params: {
				period,
				date_from,
				date_to,
			},
		})
		return response.data
	}

	async getBrandWarehousesDynamic({brand_ids, period, date_from, date_to}) {
		const response = await request({
			url: `/parsers/warehouses_dynamic/`,
			method: "get",
			params: {
				brand_ids,
				period,
				date_from,
				date_to,
			},
		})
		return response.data
	}

	async getParsersWarehouses({search, limit, offset}) {
		const response = await request({
			url: "/parsers/warehouses/",
			method: "get",
			params: {
				search,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getBrandWarehousesById({warehouse_id, period, date_from, date_to}) {
		const response = await request({
			url: `/parsers/warehouses/${warehouse_id}/`,
			method: "get",
			params: {
				period,
				date_from,
				date_to,
			},
		})
		return response.data
	}

	async searchBrandsByName({
		//deprecated
		products__id__in,
		products__id,
		products__id__isnull,
		products__name__in,
		products__name,
		products__name__isnull,
		name__in,
		name,
		likes__in,
		likes,
		likes__range,
		likes__gte,
		likes__lte,
		likes__gt,
		likes__lt,
		likes__isnull,
		warehouse_id__in,
		search,
		limit,
		offset,
		date_from,
		date_to,
		extra_fields,
	}) {
		const response = await request({
			url: "/parsers/brands/search/",
			method: "get",
			params: {
				products__id__in,
				products__id,
				products__id__isnull,
				products__name__in,
				products__name,
				products__name__isnull,
				name__in,
				name,
				likes__in,
				likes,
				likes__range,
				likes__gte,
				likes__lte,
				likes__gt,
				likes__lt,
				likes__isnull,
				warehouse_id__in,
				search,
				limit,
				offset,
				date_from,
				date_to,
				extra_fields,
			},
		})
		return response.data
	}

	async getCategoriesDynamic({
		brand_ids,
		parent_id,
		seller_ids,
		category_ids,
		wb_search,
		wb_catalog_url,
		city,
		date_from,
		date_to,
		extra_fields = [
			"vendor_codes",
			"vendor_codes_dynamic",
			"brands_count",
			"brands_count_dynamic",
			"sellers_count",
			"sellers_count_dynamic",
			"price",
			"price_dynamic",
			"old_price",
			"discount",
			"discount_dynamic",
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"ransom",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			"sales",
			"sales_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_percent",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"product_with_orders",
			"product_with_orders_dynamic",
			"product_with_orders_and_quantity",
			"product_with_orders_and_quantity_dynamic",
			"brands_with_orders",
			"brands_with_orders_dynamic",
			"sellers_with_orders",
			"sellers_with_orders_dynamic",
		].join(),
		level,
		has_child,
		period,
		ordering,
		limit,
		offset,
	}) {
		const response = await request({
			url: "/wb_dynamic/categories/",
			method: "get",
			params: {
				brand_ids,
				parent_id,
				seller_ids,
				category_ids,
				wb_search,
				wb_catalog_url,
				city,
				date_from,
				date_to,
				extra_fields,
				level,
				has_child,
				period,
				ordering,
				limit,
				offset,
			},
		})
		return response.data
	}
	async getCategoriesTrand({
		collection_id,
		period,
		date_from,
		date_to,
		product_ids,
		brand_ids,
		seller_ids,
		category_ids,
		parent_id,
		down_parent_id,
		up_parent_id,
		wb_search,
		wb_catalog_url,
		city,
		level,
		limit,
		offset,
		ordering,
		extra_fields,
	}) {
		const response = await request({
			url: "/wb_dynamic/categories_trend/",
			method: "get",
			params: {
				collection_id,
				product_ids,
				period,
				date_from,
				date_to,
				brand_ids,
				seller_ids,
				category_ids,
				parent_id,
				down_parent_id,
				up_parent_id,
				wb_search,
				wb_catalog_url,
				city,
				level,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}

	async getBrandsTrend({
		period,
		date_from,
		date_to,
		brand_ids,
		limit,
		offset,
		ordering,
		extra_fields,
	}) {
		const response = await request({
			url: "/wb_dynamic/brands_trend/",
			method: "get",
			params: {
				period,
				date_from,
				date_to,
				brand_ids,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})

		return response.data
	}

	async getSellersTrend({
		period,
		date_from,
		date_to,
		seller_ids,
		limit,
		offset,
		ordering,
		extra_fields,
	}) {
		const response = await request({
			url: "/wb_dynamic/sellers_trend/",
			method: "get",
			params: {
				period,
				date_from,
				date_to,
				seller_ids,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})

		return response.data
	}

	async getProductsTrend({
		period,
		date_from,
		date_to,
		product_ids,
		limit,
		offset,
		ordering,
		extra_fields,
	}) {
		const response = await request({
			url: "/wb_dynamic/products_trend/",
			method: "get",
			params: {
				period,
				date_from,
				date_to,
				product_ids,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})

		return response.data
	}

	async exportCategoriesDynamic({
		brand_ids,
		parent_id,
		seller_ids,
		category_ids,
		collection_id,
		wb_search,
		wb_catalog_url,
		city,
		date_from,
		date_to,
		extra_fields = [
			"vendor_codes",
			"vendor_codes_dynamic",
			"brands_count",
			"brands_count_dynamic",
			"sellers_count",
			"sellers_count_dynamic",
			"price",
			"price_dynamic",
			"old_price",
			"discount",
			"discount_dynamic",
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"ransom",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			"sales",
			"sales_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_percent",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"product_with_orders",
			"product_with_orders_dynamic",
			"product_with_orders_and_quantity",
			"product_with_orders_and_quantity_dynamic",
			"brands_with_orders",
			"brands_with_orders_dynamic",
			"sellers_with_orders",
			"sellers_with_orders_dynamic",
		].join(),
		level,
		has_child,
		period,
		ordering,
		limit,
		offset,
	}) {
		const response = await request({
			url: "/wb_dynamic/categories/export/",
			method: "get",
			params: {
				brand_ids,
				parent_id,
				seller_ids,
				category_ids,
				collection_id,
				wb_search,
				wb_catalog_url,
				city,
				date_from,
				date_to,
				extra_fields,
				level,
				has_child,
				period,
				ordering,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportCategoriesDynamicById({
		id,
		brand_ids,
		parent_id,
		seller_ids,
		category_ids,
		wb_search,
		wb_catalog_url,
		city,
		date_from,
		date_to,
		extra_fields = [
			"vendor_codes",
			"vendor_codes_dynamic",
			"brands_count",
			"brands_count_dynamic",
			"sellers_count",
			"sellers_count_dynamic",
			"price",
			"price_dynamic",
			"old_price",
			"discount",
			"discount_dynamic",
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"ransom",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			"sales",
			"sales_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_percent",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"product_with_orders",
			"product_with_orders_dynamic",
			"product_with_orders_and_quantity",
			"product_with_orders_and_quantity_dynamic",
			"brands_with_orders",
			"brands_with_orders_dynamic",
			"sellers_with_orders",
			"sellers_with_orders_dynamic",
		].join(),
		level,
		has_child,
		period,
		ordering,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/wb_dynamic/categories/${id}/export/`,
			method: "get",
			params: {
				brand_ids,
				parent_id,
				seller_ids,
				category_ids,
				wb_search,
				wb_catalog_url,
				city,
				date_from,
				date_to,
				extra_fields,
				level,
				has_child,
				period,
				ordering,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getCategoriesDynamicById({
		id,
		brand_ids,
		parent_id,
		seller_ids,
		category_ids,
		wb_search,
		wb_catalog_url,
		city,
		date_from,
		date_to,
		extra_fields,
		level,
		has_child,
		period,
		ordering,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/wb_dynamic/categories/${id}/`,
			method: "get",
			params: {
				id,
				brand_ids,
				parent_id,
				seller_ids,
				category_ids,
				wb_search,
				wb_catalog_url,
				city,
				date_from,
				date_to,
				extra_fields,
				level,
				has_child,
				period,
				ordering,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getParsersCategories({
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		parent_id,
		search,
		level,
		has_child,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/parsers/categories/`,
			method: "get",
			params: {
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				parent_id,
				search,
				level,
				has_child,
				limit,
				offset,
			},
		})
		return response.data
	}
	async getParsersCategoriesCompare({
		source_product_id,
		period,
		target_product_id,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/parsers/categories_compare/`,
			method: "get",
			params: {
				period,
				source_product_id,
				target_product_id,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getParsersCategoriesExact({
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		id,
	}) {
		const response = await request({
			url: `/parsers/categories/${id}/`,
			method: "get",
			params: {
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
			},
		})
		return response.data
	}

	async getParsersCategoriesSearch({
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		search,
		is_deleted = false,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/parsers/categories/search/`,
			method: "get",
			params: {
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				search,
				is_deleted,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getProductPositionDynamic({id, period, date_from, date_to, limit, offset}) {
		const response = await request({
			url: `/parsers/products/${id}/position_dynamic/`,
			method: "get",
			params: {
				period,
				date_from,
				date_to,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getAnalyticsCollections() {
		const response = await request({
			url: "/analytics/collections/",
			method: "get",
		})
		return response.data
	}

	async getAnalyticsExactCollection({id}) {
		const response = await request({
			url: `/analytics/collections/${id}/`,
			method: "get",
		})
		return response.data
	}

	async createAnalyticsCollection({name, items}) {
		const response = await request({
			url: `/analytics/collections/`,
			method: "post",
			data: {
				name,
				items, // list of int | id своих товаров
			},
		})
		return response.data
	}

	async deleteAnalyticsCollection({id}) {
		const response = await request({
			url: `/analytics/collections/${id}/`,
			method: "DELETE",
		})
		return response.data
	}

	async removeProductsAnalyticsCollection({id, items}) {
		const response = await request({
			url: `/analytics/collections/${id}/remove_items/`,
			method: "POST",
			data: {
				items,
			},
		})
		return response.data
	}

	async removeAllProductsAnalyticsCollection({id}) {
		const response = await request({
			url: `/analytics/collections/${id}/clear_items/`,
			method: "POST",
		})
		return response.data
	}

	async addProductsAnalyticsCollection({id, items}) {
		const response = await request({
			url: `/analytics/collections/${id}/add_items/`,
			method: "POST",
			data: {
				items,
			},
		})
		return response.data
	}
	// TODO ????
	async updateAnalyticsCollection({id, name, items}) {
		const response = await request({
			url: `/analytics/collections/${id}/`,
			method: "PATCH",
			data: {
				name,
				items,
			},
		})
		return response.data
	}

	async getProductsColorSizeDynamic({
		id,
		item,
		date_from,
		date_to,
		period,
		extra_fields,
		limit,
		offset,
		product_ids,
		size_ids,
	}) {
		const response = await request({
			url: `/wb_dynamic/product_color_sizes/`,
			method: "get",
			params: {
				item,
				date_from,
				date_to,
				period,
				extra_fields,
				limit,
				offset,
				product_ids,
				size_ids,
			},
		})
		return response.data
	}
	async getOrderAndSales({wb_api_key_ids, limit, offset, date_from, date_to, period}) {
		const response = await request({
			url: `/analytics/order_and_sales/`,
			method: "get",
			params: {
				wb_api_key_ids,
				date_from,
				date_to,
				period,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportProductsColorSizeDynamic({
		id,
		item,
		date_from,
		date_to,
		period,
		extra_fields,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/wb_dynamic/product_color_sizes/export/`,
			method: "get",
			params: {
				item,
				date_from,
				date_to,
				period,
				extra_fields,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getProductsColorWarehouseDynamic({
		id,
		item,
		date_from,
		date_to,
		period,
		extra_fields,
		limit,
		offset,
		warehouse_ids,
		product_ids,
	}) {
		const response = await request({
			url: `/wb_dynamic/product_color_warehouses/`,
			method: "get",
			params: {
				item,
				date_from,
				date_to,
				period,
				extra_fields,
				limit,
				offset,
				warehouse_ids,
				product_ids,
			},
		})
		return response.data
	}

	async exportProductsColorWarehouseDynamic({
		id,
		item,
		date_from,
		date_to,
		period,
		extra_fields,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/wb_dynamic/product_color_warehouses/export/`,
			method: "get",
			params: {
				item,
				date_from,
				date_to,
				period,
				extra_fields,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportbrandsWarehouseDynamic({
		brand_ids,
		seller_ids,
		product_ids,
		date_from,
		date_to,
		period,
		extra_fields,
		offset,
		limit,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/warehouses/export/`,
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				product_ids,
				date_from,
				date_to,
				period,
				extra_fields,
				offset,
				limit,
				ordering,
			},
		})
		return response.data
	}
	async getWarehousesDynamic({
		// id,
		brand_ids,
		seller_ids,
		product_ids,
		date_from,
		date_to,
		period,
		extra_fields,
		offset,
		limit,
		ordering,
	}) {
		const response = await request({
			// url: `/parsers/brands/${id}/warehouse_dynamic/`,
			url: `/wb_dynamic/warehouses/`,
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				product_ids,
				date_from,
				date_to,
				period,
				extra_fields,
				offset,
				limit,
				ordering,
			},
		})
		return response.data
	}
	async exportWarehousesDynamic({
		// id,
		brand_ids,
		seller_ids,
		product_ids,
		date_from,
		date_to,
		period,
		extra_fields,
		offset,
		limit,
		ordering,
	}) {
		const response = await request({
			// url: `/parsers/brands/${id}/warehouse_dynamic/`,
			url: `/wb_dynamic/warehouses/export/`,
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				product_ids,
				date_from,
				date_to,
				period,
				extra_fields,
				offset,
				limit,
				ordering,
			},
		})
		return response.data
	}

	// ------ Динамика товаров --------
	async getProductsDynamic({
		short_price_sigment,
		product_ids,
		brand_ids,
		seller_ids,
		category_ids,
		city,
		wb_search,
		wb_catalog_url,
		collection_id,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		wb_adsearch,
		pages_max,
		price__gte,
		price__gt,
		price__lt,
		price__lte,
		extra_fields = [
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"sales_percent",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"lost_proceeds_dynamic",
			"lost_orders",
			"lost_orders_dynamic",
			"discount",
			"discount_dynamic",
			"orders_failed",
			"orders_failed_dynamic",
			"proceeds_failed",
			"proceeds_failed_dynamic",
			// "old_price",
			// "old_price_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			// "ransom",
			// "ransom_dynamic",
			"reviews",
			"rating_dynamic",
			"reviews_dynamic",
			"rating",
			"last_price",
		].join(),
	}) {
		const response = await request({
			url: `/wb_dynamic/products/`,
			method: "get",
			params: {
				short_price_sigment,
				product_ids,
				brand_ids,
				collection_id,
				city,
				seller_ids,
				category_ids,
				wb_search,
				wb_catalog_url,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				wb_adsearch,
				pages_max,
				extra_fields,
				price__gte,
				price__lte,
				price__gt,
				price__lt,
			},
		})
		return response.data
	}
	async getKeyWordCPM({keyword, extra_fields, product_id, category_id, city}) {
		const response = await request({
			url: `/monitoring/position_cpm/`,
			method: "get",
			params: {
				city,
				keyword,
				product_id,
				category_id,
				city,
				extra_fields,
			},
		})
		return response.data
	}
	async getMonitoringCPP({limit = 10000, offset}) {
		const response = await request({
			url: `/monitoring/wb_user_product_spp_history/`,
			method: "get",
			params: {
				limit,
				offset,
			},
		})
		return response.data
	}
	async postMonitoringCPP({
		product_id,
		is_decreased = true,
		is_increased = true,
		is_unchanged = true,
	}) {
		const response = await request({
			url: `/monitoring/spp_user_notification/`,
			method: "post",
			data: {
				product_id,
				is_decreased,
				is_increased,
				is_unchanged,
			},
		})
		return response.data
	}
	async getMonitoringCheckBoxes({product_id}) {
		const response = await request({
			url: `/monitoring/spp_user_notification/${product_id}`,
			method: "GET",
		})
		return response.data
	}
	async deleteMonitoringCPP({product_id}) {
		const response = await request({
			url: `/monitoring/spp_user_notification/${product_id}/`,
			method: "delete",
		})
		return response.data
	}

	async exportProductsDynamic({
		product_ids,
		brand_ids,
		seller_ids,
		category_ids,
		wb_search,
		city,
		short_price_sigment = false,
		wb_catalog_url,
		collection_id,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		price__gte,
		price__lte,
		extra_fields = [
			"proceeds",
			"orders",
			"price",
			"quantity",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"orders_failed",
			"proceeds_failed",
			"old_price",
			"sales",
			"sales_proceeds",
		].join(),
	}) {
		const response = await request({
			url: "/wb_dynamic/products/export/",
			method: "get",
			params: {
				product_ids,
				brand_ids,
				short_price_sigment,
				seller_ids,
				category_ids,
				collection_id,
				city,
				wb_search,
				wb_catalog_url,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				price__gte,
				price__lte,
				extra_fields,
			},
		})
		return response.data
	}

	async exportProductsDynamicById({
		product_ids,
		brand_ids,
		seller_ids,
		wb_search,
		wb_catalog_url,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"discount_dynamic",
			"orders_failed",
			"orders_failed_dynamic",
			"proceeds_failed",
			"proceeds_failed_dynamic",
			"old_price",
			"old_price_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			"ransom",
			"ransom_dynamic",
		].join(),
	}) {
		const response = await request({
			url: `/wb_dynamic/products/${product_ids}/export/`,
			method: "get",
			params: {
				product_ids,
				brand_ids,
				seller_ids,
				wb_search,
				wb_catalog_url,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}

	// async getParsersCollections() {
	// 	const response = await request({
	// 		url: "parsers/collections/",
	// 		method: "get",
	// 	})
	// 	return response.data
	// }

	async getParsersCollections({limit, offset}) {
		const response = await request({
			url: "parsers/collections/",
			method: "get",
			params: {
				limit,
				offset,
			},
		})
		return response.data
	}

	async createParsersCollection({name, items}) {
		const response = await request({
			url: `/parsers/collections/`,
			method: "post",
			data: {
				name,
				items, // list of int | id своих товаров
			},
		})
		return response.data
	}

	async deleteParsersCollection({id}) {
		const response = await request({
			url: `/parsers/collections/${id}/`,
			method: "delete",
		})
		return response.data
	}

	async addProductsToParsersCollection({id, items}) {
		const response = await request({
			url: `/parsers/collections/${id}/add_items/`,
			method: "post",
			data: {
				items,
			},
		})
		return response.data
	}

	async getBrandsSummary({
		on_site_date__gte,
		on_site_date__lte,
		date_from,
		date_to,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		orders__gte,
		orders__lte,
		proceeds__gte,
		proceeds__lte,
		quantity__gte,
		quantity__lte,
		returns__gte,
		returns__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		incomes__gte,
		incomes__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__gte,
		sales_percent__lte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		price__gte,
		price__lte,
		old_price__gte,
		old_price__lte,
		discount__gte,
		discount__lte,
		basic_discount__gte,
		basic_discount__lte,
		promo_discount__gte,
		promo_discount__lte,
		orders_failed__gte,
		orders_failed__lte,
		proceeds_failed__gte,
		proceeds_failed__lte,
		vendor_codes__gte,
		vendor_codes__lte,
		position__gte,
		position__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		sellers__gte,
		sellers__lte,
		reviews__gte,
		reviews__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
		sellers_with_orders__gte,
		sellers_with_orders__lte,
		products_with_orders__gte,
		products_with_orders__lte,
		avg_percent_articles_with_orders__gte,
		avg_percent_articles_with_orders__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_proceeds_per_article_with_orders__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article__lte,
		avg_orders_per_article_with_orders__gte,
		avg_orders_per_article_with_orders__lte,
		limit,
		offset,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/brands_summary/`,
			method: "get",
			params: {
				on_site_date__gte,
				on_site_date__lte,
				date_from,
				date_to,
				sales__gte,
				sales__lte,
				sales_percent__gte,
				sales_percent__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				orders__gte,
				orders__lte,
				proceeds__gte,
				proceeds__lte,
				quantity__gte,
				quantity__lte,
				returns__gte,
				returns__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				incomes__gte,
				incomes__lte,
				ransom__gte,
				ransom__lte,
				price__gte,
				price__lte,
				old_price__gte,
				old_price__lte,
				discount__gte,
				discount__lte,
				basic_discount__gte,
				basic_discount__lte,
				promo_discount__gte,
				promo_discount__lte,
				orders_failed__gte,
				orders_failed__lte,
				proceeds_failed__gte,
				proceeds_failed__lte,
				vendor_codes__gte,
				vendor_codes__lte,
				position__gte,
				position__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				sellers__gte,
				sellers__lte,
				reviews__gte,
				reviews__lte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
				sellers_with_orders__gte,
				sellers_with_orders__lte,
				products_with_orders__gte,
				products_with_orders__lte,
				avg_percent_articles_with_orders__gte,
				avg_percent_articles_with_orders__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_proceeds_per_article_with_orders__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article__lte,
				avg_orders_per_article_with_orders__gte,
				avg_orders_per_article_with_orders__lte,
				limit,
				offset,
				ordering,
			},
		})
		return response.data
	}
	async exportBrandAnalyzer({
		on_site_date__gte,
		on_site_date__lte,
		date_from,
		date_to,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		orders__gte,
		orders__lte,
		proceeds__gte,
		proceeds__lte,
		quantity__gte,
		quantity__lte,
		returns__gte,
		returns__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		incomes__gte,
		incomes__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__gte,
		sales_percent__lte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		price__gte,
		price__lte,
		old_price__gte,
		old_price__lte,
		discount__gte,
		discount__lte,
		basic_discount__gte,
		basic_discount__lte,
		promo_discount__gte,
		promo_discount__lte,
		orders_failed__gte,
		orders_failed__lte,
		proceeds_failed__gte,
		proceeds_failed__lte,
		vendor_codes__gte,
		vendor_codes__lte,
		position__gte,
		position__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		sellers__gte,
		sellers__lte,
		reviews__gte,
		reviews__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
		sellers_with_orders__gte,
		sellers_with_orders__lte,
		products_with_orders__gte,
		products_with_orders__lte,
		avg_percent_articles_with_orders__gte,
		avg_percent_articles_with_orders__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_proceeds_per_article_with_orders__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article__lte,
		avg_orders_per_article_with_orders__gte,
		avg_orders_per_article_with_orders__lte,
		limit,
		offset,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/brands_summary/export/`,
			method: "get",
			params: {
				on_site_date__gte,
				on_site_date__lte,
				date_from,
				date_to,
				sales__gte,
				sales__lte,
				sales_percent__gte,
				sales_percent__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				orders__gte,
				orders__lte,
				proceeds__gte,
				proceeds__lte,
				quantity__gte,
				quantity__lte,
				returns__gte,
				returns__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				incomes__gte,
				incomes__lte,
				ransom__gte,
				ransom__lte,
				price__gte,
				price__lte,
				old_price__gte,
				old_price__lte,
				discount__gte,
				discount__lte,
				basic_discount__gte,
				basic_discount__lte,
				promo_discount__gte,
				promo_discount__lte,
				orders_failed__gte,
				orders_failed__lte,
				proceeds_failed__gte,
				proceeds_failed__lte,
				vendor_codes__gte,
				vendor_codes__lte,
				position__gte,
				position__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				sellers__gte,
				sellers__lte,
				reviews__gte,
				reviews__lte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
				sellers_with_orders__gte,
				sellers_with_orders__lte,
				products_with_orders__gte,
				products_with_orders__lte,
				avg_percent_articles_with_orders__gte,
				avg_percent_articles_with_orders__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_proceeds_per_article_with_orders__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article__lte,
				avg_orders_per_article_with_orders__gte,
				avg_orders_per_article_with_orders__lte,
				limit,
				offset,
				ordering,
			},
		})
		return response.data
	}
	async getBrandsSummaryCount({
		on_site_date__gte,
		on_site_date__lte,
		date_from,
		date_to,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		orders__gte,
		orders__lte,
		proceeds__gte,
		proceeds__lte,
		quantity__gte,
		quantity__lte,
		returns__gte,
		returns__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		incomes__gte,
		incomes__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__gte,
		sales_percent__lte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		price__gte,
		price__lte,
		old_price__gte,
		old_price__lte,
		discount__gte,
		discount__lte,
		basic_discount__gte,
		basic_discount__lte,
		promo_discount__gte,
		promo_discount__lte,
		orders_failed__gte,
		orders_failed__lte,
		proceeds_failed__gte,
		proceeds_failed__lte,
		vendor_codes__gte,
		vendor_codes__lte,
		position__gte,
		position__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		sellers__gte,
		sellers__lte,
		reviews__gte,
		reviews__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
		sellers_with_orders__gte,
		sellers_with_orders__lte,
		products_with_orders__gte,
		products_with_orders__lte,
		avg_percent_articles_with_orders__gte,
		avg_percent_articles_with_orders__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_proceeds_per_article_with_orders__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article__lte,
		avg_orders_per_article_with_orders__gte,
		avg_orders_per_article_with_orders__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/brands_summary/count`,
			method: "get",
			params: {
				on_site_date__gte,
				on_site_date__lte,
				date_from,
				date_to,
				sales__gte,
				sales__lte,
				sales_percent__gte,
				sales_percent__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				orders__gte,
				orders__lte,
				proceeds__gte,
				proceeds__lte,
				quantity__gte,
				quantity__lte,
				returns__gte,
				returns__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				incomes__gte,
				incomes__lte,
				ransom__gte,
				ransom__lte,
				price__gte,
				price__lte,
				old_price__gte,
				old_price__lte,
				discount__gte,
				discount__lte,
				basic_discount__gte,
				basic_discount__lte,
				promo_discount__gte,
				promo_discount__lte,
				orders_failed__gte,
				orders_failed__lte,
				proceeds_failed__gte,
				proceeds_failed__lte,
				vendor_codes__gte,
				vendor_codes__lte,
				position__gte,
				position__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				sellers__gte,
				sellers__lte,
				reviews__gte,
				reviews__lte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
				sellers_with_orders__gte,
				sellers_with_orders__lte,
				products_with_orders__gte,
				products_with_orders__lte,
				avg_percent_articles_with_orders__gte,
				avg_percent_articles_with_orders__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_proceeds_per_article_with_orders__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article__lte,
				avg_orders_per_article_with_orders__gte,
				avg_orders_per_article_with_orders__lte,
			},
		})
		return response.data
	}

	async exportBrandsSummary({
		brand_id__in,
		seller_id__in,
		category_id__in,
		warehouse_id__in,
		is_new,
		is_fbs,
		likes__gte,
		likes__lte,
		quantity__gte,
		quantity__lte,
		sellers__gte,
		sellers__lte,
		products__gte,
		products__lte,
		orders__gte,
		orders__lte,
		position__gte,
		position__lte,
		reviews__gte,
		reviews__lte,
		proceeds__gte,
		proceeds__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		price__gte,
		price__lte,
		discount__gte,
		discount__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__get,
		sales_percent__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		incomes__gte,
		incomes__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_product_count_percent__gte,
		dynamic_product_count_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_reviews_percent__gte,
		dynamic_reviews_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
		sellers_with_orders__gte,
		sellers_with_orders__lte,
		products_with_orders__gte,
		products_with_orders__lte,
		avg_percent_articles_with_orders__gte,
		avg_percent_articles_with_orders__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_proceeds_per_article_with_orders__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article__lte,
		avg_orders_per_article_with_orders__gte,
		avg_orders_per_article_with_orders__lte,
		limit,
		offset,
		ordering,
	}) {
		const response = await request({
			url: `/parsers/brands_summary/export/`,
			method: "get",
			params: {
				brand_id__in,
				seller_id__in,
				category_id__in,
				warehouse_id__in,
				is_new,
				is_fbs,
				likes__gte,
				likes__lte,
				quantity__gte,
				quantity__lte,
				sellers__gte,
				sellers__lte,
				products__gte,
				products__lte,
				orders__gte,
				orders__lte,
				position__gte,
				position__lte,
				reviews__gte,
				reviews__lte,
				proceeds__gte,
				proceeds__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				price__gte,
				price__lte,
				discount__gte,
				discount__lte,
				ransom__gte,
				ransom__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				incomes__gte,
				incomes__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_product_count_percent__gte,
				dynamic_product_count_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_reviews_percent__gte,
				dynamic_reviews_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
				sellers_with_orders__gte,
				sellers_with_orders__lte,
				products_with_orders__gte,
				products_with_orders__lte,
				avg_percent_articles_with_orders__gte,
				avg_percent_articles_with_orders__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_proceeds_per_article_with_orders__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article__lte,
				avg_orders_per_article_with_orders__gte,
				avg_orders_per_article_with_orders__lte,
				limit,
				offset,
				ordering,
			},
		})
		return response.data
	}

	async getProductsSummary({
		on_site_date__gte,
		on_site_date__lte,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		date_from,
		date_to,
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		orders__gte,
		orders__lte,
		proceeds__gte,
		proceeds__lte,
		quantity__gte,
		quantity__lte,
		returns__gte,
		returns__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		incomes__gte,
		incomes__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__gte,
		sales_percent__lte,
		price__gte,
		price__lte,
		old_price__gte,
		old_price__lte,
		discount__gte,
		discount__lte,
		basic_discount__gte,
		basic_discount__lte,
		promo_discount__gte,
		promo_discount__lte,
		orders_failed__gte,
		orders_failed__lte,
		proceeds_failed__gte,
		proceeds_failed__lte,
		vendor_codes__gte,
		vendor_codes__lte,
		position__gte,
		position__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		sellers__gte,
		sellers__lte,
		reviews__gte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		reviews__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
		sellers_with_orders__gte,
		sellers_with_orders__lte,
		products_with_orders__gte,
		products_with_orders__lte,
		avg_percent_articles_with_orders__gte,
		avg_percent_articles_with_orders__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_proceeds_per_article_with_orders__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article__lte,
		avg_orders_per_article_with_orders__gte,
		avg_orders_per_article_with_orders__lte,
		limit,
		offset,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/products_summary/`,
			method: "get",
			params: {
				on_site_date__gte,
				on_site_date__lte,
				date_from,
				date_to,
				sales__gte,
				sales__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				orders__gte,
				orders__lte,
				proceeds__gte,
				proceeds__lte,
				quantity__gte,
				quantity__lte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				returns__gte,
				returns__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				incomes__gte,
				incomes__lte,
				ransom__gte,
				ransom__lte,
				sales_percent__gte,
				sales_percent__lte,
				price__gte,
				price__lte,
				old_price__gte,
				old_price__lte,
				discount__gte,
				discount__lte,
				basic_discount__gte,
				basic_discount__lte,
				promo_discount__gte,
				promo_discount__lte,
				orders_failed__gte,
				orders_failed__lte,
				proceeds_failed__gte,
				proceeds_failed__lte,
				vendor_codes__gte,
				vendor_codes__lte,
				position__gte,
				position__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				sellers__gte,
				sellers__lte,
				reviews__gte,
				reviews__lte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
				sellers_with_orders__gte,
				sellers_with_orders__lte,
				products_with_orders__gte,
				products_with_orders__lte,
				avg_percent_articles_with_orders__gte,
				avg_percent_articles_with_orders__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_proceeds_per_article_with_orders__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article__lte,
				avg_orders_per_article_with_orders__gte,
				avg_orders_per_article_with_orders__lte,
				limit,
				offset,
				ordering,
			},
		})
		return response.data
	}
	async exportProductsSummary({
		on_site_date__gte,
		on_site_date__lte,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		date_from,
		date_to,
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		orders__gte,
		orders__lte,
		proceeds__gte,
		proceeds__lte,
		quantity__gte,
		quantity__lte,
		returns__gte,
		returns__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		incomes__gte,
		incomes__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__gte,
		sales_percent__lte,
		price__gte,
		price__lte,
		old_price__gte,
		old_price__lte,
		discount__gte,
		discount__lte,
		basic_discount__gte,
		basic_discount__lte,
		promo_discount__gte,
		promo_discount__lte,
		orders_failed__gte,
		orders_failed__lte,
		proceeds_failed__gte,
		proceeds_failed__lte,
		vendor_codes__gte,
		vendor_codes__lte,
		position__gte,
		position__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		sellers__gte,
		sellers__lte,
		reviews__gte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		reviews__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
		sellers_with_orders__gte,
		sellers_with_orders__lte,
		products_with_orders__gte,
		products_with_orders__lte,
		avg_percent_articles_with_orders__gte,
		avg_percent_articles_with_orders__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_proceeds_per_article_with_orders__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article__lte,
		avg_orders_per_article_with_orders__gte,
		avg_orders_per_article_with_orders__lte,
		limit,
		offset,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/products_summary/export/`,
			method: "get",
			params: {
				on_site_date__gte,
				on_site_date__lte,
				date_from,
				date_to,
				sales__gte,
				sales__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				orders__gte,
				orders__lte,
				proceeds__gte,
				proceeds__lte,
				quantity__gte,
				quantity__lte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				returns__gte,
				returns__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				incomes__gte,
				incomes__lte,
				ransom__gte,
				ransom__lte,
				sales_percent__gte,
				sales_percent__lte,
				price__gte,
				price__lte,
				old_price__gte,
				old_price__lte,
				discount__gte,
				discount__lte,
				basic_discount__gte,
				basic_discount__lte,
				promo_discount__gte,
				promo_discount__lte,
				orders_failed__gte,
				orders_failed__lte,
				proceeds_failed__gte,
				proceeds_failed__lte,
				vendor_codes__gte,
				vendor_codes__lte,
				position__gte,
				position__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				sellers__gte,
				sellers__lte,
				reviews__gte,
				reviews__lte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
				sellers_with_orders__gte,
				sellers_with_orders__lte,
				products_with_orders__gte,
				products_with_orders__lte,
				avg_percent_articles_with_orders__gte,
				avg_percent_articles_with_orders__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_proceeds_per_article_with_orders__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article__lte,
				avg_orders_per_article_with_orders__gte,
				avg_orders_per_article_with_orders__lte,
				limit,
				offset,
				ordering,
			},
		})
		return response.data
	}

	async getProductsSummaryCount({
		on_site_date__gte,
		on_site_date__lte,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		date_from,
		date_to,
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		orders__gte,
		orders__lte,
		proceeds__gte,
		proceeds__lte,
		quantity__gte,
		quantity__lte,
		returns__gte,
		returns__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		incomes__gte,
		incomes__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__gte,
		sales_percent__lte,
		price__gte,
		price__lte,
		old_price__gte,
		old_price__lte,
		discount__gte,
		discount__lte,
		basic_discount__gte,
		basic_discount__lte,
		promo_discount__gte,
		promo_discount__lte,
		orders_failed__gte,
		orders_failed__lte,
		proceeds_failed__gte,
		proceeds_failed__lte,
		vendor_codes__gte,
		vendor_codes__lte,
		position__gte,
		position__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		sellers__gte,
		sellers__lte,
		reviews__gte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		reviews__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
		sellers_with_orders__gte,
		sellers_with_orders__lte,
		products_with_orders__gte,
		products_with_orders__lte,
		avg_percent_articles_with_orders__gte,
		avg_percent_articles_with_orders__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_proceeds_per_article_with_orders__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article__lte,
		avg_orders_per_article_with_orders__gte,
		avg_orders_per_article_with_orders__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/products_summary/count/`,
			method: "get",
			params: {
				on_site_date__gte,
				on_site_date__lte,
				date_from,
				date_to,
				sales__gte,
				sales__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				orders__gte,
				orders__lte,
				proceeds__gte,
				proceeds__lte,
				quantity__gte,
				quantity__lte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				returns__gte,
				returns__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				incomes__gte,
				incomes__lte,
				ransom__gte,
				ransom__lte,
				sales_percent__gte,
				sales_percent__lte,
				price__gte,
				price__lte,
				old_price__gte,
				old_price__lte,
				discount__gte,
				discount__lte,
				basic_discount__gte,
				basic_discount__lte,
				promo_discount__gte,
				promo_discount__lte,
				orders_failed__gte,
				orders_failed__lte,
				proceeds_failed__gte,
				proceeds_failed__lte,
				vendor_codes__gte,
				vendor_codes__lte,
				position__gte,
				position__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				sellers__gte,
				sellers__lte,
				reviews__gte,
				reviews__lte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
				sellers_with_orders__gte,
				sellers_with_orders__lte,
				products_with_orders__gte,
				products_with_orders__lte,
				avg_percent_articles_with_orders__gte,
				avg_percent_articles_with_orders__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_proceeds_per_article_with_orders__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article__lte,
				avg_orders_per_article_with_orders__gte,
				avg_orders_per_article_with_orders__lte,
			},
		})
		return response.data
	}

	async getUserData({type, ordering, limit, offset}) {
		const response = await request({
			url: "company/user_data/",
			method: "get",
			params: {
				type,
				ordering,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getUserDataById({id}) {
		const response = await request({
			url: `/company/user_data/${id}/`,
			method: "get",
		})
		return response.data
	}

	async saveUserData({data, type}) {
		const response = await request({
			url: "company/user_data/",
			method: "post",
			data: {
				data,
				type,
			},
		})
		return response.data
	}

	async patchUserData({id, data}) {
		const response = await request({
			url: `/company/user_data/${id}/`,
			method: "patch",
			data: {
				data,
			},
		})
		return response.data
	}

	async deleteUserData({id}) {
		const response = await request({
			url: `/company/user_data/${id}/`,
			method: "delete",
		})
		return response.data
	}

	async getBrandColorGroupDynamic({
		brand_ids,
		seller_ids,
		product_ids,
		date_from,
		date_to,
		extra_fields,
		offset,
		limit,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/brand_colors/`,
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				product_ids,
				date_from,
				date_to,
				extra_fields,
				offset,
				limit,
				ordering,
			},
		})
		return response.data
	}

	async getBrandSizeDynamic({
		brand_ids,
		product_ids,
		date_from,
		date_to,
		extra_fields,
		offset,
		limit,
		ordering,
		period,
	}) {
		const response = await request({
			url: `/wb_dynamic/sizes/`,
			method: "get",
			params: {
				brand_ids,
				product_ids,
				date_from,
				date_to,
				extra_fields,
				offset,
				limit,
				ordering,
				period,
			},
		})
		return response.data
	}
	async getCheckingKeywords({product_id, period, is_in, product_id_in, ordering, offset, limit}) {
		const response = await request({
			url: `/parsers/checking_keywords/`,
			method: "get",
			params: {
				product_id,
				product_id_in,
				is_in,
				ordering,
				period,
				offset,
				limit,
			},
		})
		return response.data
	}
	async getCheckingKeywordsExport({
		product_id,
		product_id_in,
		ordering,
		period,
		offset,
		limit,
		is_in,
	}) {
		const response = await request({
			url: `/parsers/checking_keywords/export/`,
			method: "get",
			params: {
				product_id,
				product_id_in,
				is_in,
				ordering,
				period,
				offset,
				limit,
			},
		})
		return response.data
	}
	async postCheckedWordsMonitoring({
		product_id,
		collection_id,
		period,
		is_in,
		product_id_in,
		ordering,
		offset,
		limit,
	}) {
		const response = await request({
			url: `/parsers/checking_keywords/to_monitoring/`,
			method: "post",
			params: {
				product_id,
				collection_id,
				product_id_in,
				is_in,
				ordering,
				period,
				offset,
				limit,
			},
		})
		return response.data
	}

	async exportBrandColorGroupDynamic({
		brand_ids,
		seller_id,
		date_from,
		date_to,
		extra_fields,
		offset,
		limit,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/brand_colors/export/`,
			method: "get",
			params: {
				brand_ids,
				seller_id,
				date_from,
				date_to,
				extra_fields,
				offset,
				limit,
				ordering,
			},
		})
		return response.data
	}

	async exportBrandSizeDynamic({
		brand_ids,
		date_from,
		date_to,
		extra_fields,
		offset,
		limit,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/sizes/export/`,
			method: "get",
			params: {
				brand_ids,
				date_from,
				date_to,
				extra_fields,
				offset,
				limit,
				ordering,
			},
		})
		return response.data
	}

	async exportWarehouseDynamic({
		brand_ids,
		product_ids,
		date_from,
		date_to,
		period,
		extra_fields,
		offset,
		limit,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/warehouses/export/`,
			method: "get",
			params: {
				brand_ids,
				product_ids,
				date_from,
				date_to,
				period,
				extra_fields,
				offset,
				limit,
				ordering,
			},
		})
		return response.data
	}

	async getParsersSellers({
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		is_new,
		search,
		limit,
		offset,
		ordering,
	}) {
		const response = await request({
			url: "/parsers/sellers/",
			method: "get",
			params: {
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				is_new,
				search,
				limit,
				offset,
				ordering,
				// actual:true
			},
		})
		return response.data
	}

	async getSellerById({id, date_from, date_to, period}) {
		const response = await request({
			url: `/parsers/sellers/${id}/`,
			method: "get",
			params: {
				date_from,
				date_to,
				period,
			},
		})
		return response.data
	}

	async getAnalyticsProductCost({wb_api_key_ids, identifier, report_id}) {
		const response = await request({
			url: `/analytics/product_cost/`,
			method: "get",
			params: {
				wb_api_key_ids,
				identifier,
				report_id,
			},
		})
		return response.data
	}
	async exportAnalyticsProductCost({identifier, report_id}) {
		const response = await request({
			url: `/analytics/product_cost/export/`,
			method: "get",
			params: {
				identifier,
				report_id,
			},
		})
		return response.data
	}
	async postAnalyticsProductCost({wb_api_key_id, identifier, data, report_id}) {
		const response = await request({
			url: `/analytics/product_cost/`,
			method: "post",
			data: {
				wb_api_key_id,
				identifier,
				report_id,
				data,
			},
		})
		return response.data
	}
	async postExcelAnalyticsProductCost({formData}) {
		const token = window.localStorage.getItem("token") || window.sessionStorage.getItem("token")
		const response = await postFile({
			url: `/analytics/product_cost_validator/`,
			data: formData,
			method: "post",
			headers: {
				"Content-Type": "multipart/form-data",
				Authorization: `Token ${token}`,
			},
		})
		return response.data
	}
	async getIncomeTaxRate({wb_api_key_ids, report_id}) {
		const response = await request({
			url: `/analytics/settings/`,
			method: "get",
			params: {
				wb_api_key_ids,
				report_id,
			},
		})
		return response.data
	}
	async postIncomeTaxRate({wb_api_key_id, tax, report_id}) {
		const response = await request({
			url: `/analytics/settings/`,
			method: "post",
			data: {
				wb_api_key_id,
				report_id,
				tax,
			},
		})
		return response.data
	}

	async getSellersSummary({
		on_site_date__gte,
		on_site_date__lte,

		date_from,
		date_to,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		orders__gte,
		orders__lte,
		proceeds__gte,
		proceeds__lte,
		quantity__gte,
		quantity__lte,
		returns__gte,
		returns__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		incomes__gte,
		incomes__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__gte,
		sales_percent__lte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		price__gte,
		price__lte,
		old_price__gte,
		old_price__lte,
		discount__gte,
		discount__lte,
		basic_discount__gte,
		basic_discount__lte,
		promo_discount__gte,
		promo_discount__lte,
		orders_failed__gte,
		orders_failed__lte,
		proceeds_failed__gte,
		proceeds_failed__lte,
		vendor_codes__gte,
		vendor_codes__lte,
		position__gte,
		position__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		sellers__gte,
		sellers__lte,
		reviews__gte,
		reviews__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
		brands__gte,
		brands__lte,
		limit,
		offset,
		ordering,

		brands_with_orders__gte,
		brands_with_orders__lte,
		avg_orders_per_article_with_orders__gte,
		avg_orders_per_article_with_orders__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_proceeds_per_article_with_orders__lte,
		products_with_orders__gte,
		products_with_orders__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article__lte,
		avg_percent_articles_with_orders__gte,
		avg_percent_articles_with_orders__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/sellers_summary/`,
			method: "get",
			params: {
				on_site_date__gte,
				on_site_date__lte,
				date_from,
				date_to,
				sales_percent__gte,
				sales_percent__lte,
				brands__gte,
				brands__lte,
				sales__gte,
				sales__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				orders__gte,
				orders__lte,
				proceeds__gte,
				proceeds__lte,
				quantity__gte,
				quantity__lte,
				returns__gte,
				returns__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				incomes__gte,
				incomes__lte,
				ransom__gte,
				ransom__lte,
				price__gte,
				price__lte,
				old_price__gte,
				old_price__lte,
				discount__gte,
				discount__lte,
				basic_discount__gte,
				basic_discount__lte,
				promo_discount__gte,
				promo_discount__lte,
				orders_failed__gte,
				orders_failed__lte,
				proceeds_failed__gte,
				proceeds_failed__lte,
				vendor_codes__gte,
				vendor_codes__lte,
				position__gte,
				position__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				sellers__gte,
				sellers__lte,
				reviews__gte,
				reviews__lte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
				limit,
				offset,
				ordering,
				brands_with_orders__gte,
				brands_with_orders__lte,
				avg_orders_per_article_with_orders__gte,
				avg_orders_per_article_with_orders__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_proceeds_per_article_with_orders__lte,
				products_with_orders__gte,
				products_with_orders__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article__lte,
				avg_percent_articles_with_orders__gte,
				avg_percent_articles_with_orders__lte,
			},
		})
		return response.data
	}
	async exportSellerAnalyzer({
		on_site_date__gte,
		on_site_date__lte,
		date_from,
		date_to,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		orders__gte,
		orders__lte,
		proceeds__gte,
		proceeds__lte,
		quantity__gte,
		quantity__lte,
		returns__gte,
		returns__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		incomes__gte,
		incomes__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__gte,
		sales_percent__lte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		price__gte,
		price__lte,
		old_price__gte,
		old_price__lte,
		discount__gte,
		discount__lte,
		basic_discount__gte,
		basic_discount__lte,
		promo_discount__gte,
		promo_discount__lte,
		orders_failed__gte,
		orders_failed__lte,
		proceeds_failed__gte,
		proceeds_failed__lte,
		vendor_codes__gte,
		vendor_codes__lte,
		position__gte,
		position__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		sellers__gte,
		sellers__lte,
		reviews__gte,
		reviews__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
		brands__gte,
		brands__lte,
		limit,
		offset,
		ordering,
		brands_with_orders__gte,
		brands_with_orders__lte,
		avg_orders_per_article_with_orders__gte,
		avg_orders_per_article_with_orders__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_proceeds_per_article_with_orders__lte,
		products_with_orders__gte,
		products_with_orders__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article__lte,
		avg_percent_articles_with_orders__gte,
		avg_percent_articles_with_orders__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/sellers_summary/export/`,
			method: "get",
			params: {
				on_site_date__gte,
				on_site_date__lte,
				date_from,
				date_to,
				sales_percent__gte,
				sales_percent__lte,
				brands__gte,
				brands__lte,
				sales__gte,
				sales__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				orders__gte,
				orders__lte,
				proceeds__gte,
				proceeds__lte,
				quantity__gte,
				quantity__lte,
				returns__gte,
				returns__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				incomes__gte,
				incomes__lte,
				ransom__gte,
				ransom__lte,
				price__gte,
				price__lte,
				old_price__gte,
				old_price__lte,
				discount__gte,
				discount__lte,
				basic_discount__gte,
				basic_discount__lte,
				promo_discount__gte,
				promo_discount__lte,
				orders_failed__gte,
				orders_failed__lte,
				proceeds_failed__gte,
				proceeds_failed__lte,
				vendor_codes__gte,
				vendor_codes__lte,
				position__gte,
				position__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				sellers__gte,
				sellers__lte,
				reviews__gte,
				reviews__lte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
				limit,
				offset,
				ordering,
				brands_with_orders__gte,
				brands_with_orders__lte,
				avg_orders_per_article_with_orders__gte,
				avg_orders_per_article_with_orders__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_proceeds_per_article_with_orders__lte,
				products_with_orders__gte,
				products_with_orders__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article__lte,
				avg_percent_articles_with_orders__gte,
				avg_percent_articles_with_orders__lte,
			},
		})
		return response.data
	}
	async getSellersSummaryCount({
		brands_with_orders__gte,
		brands_with_orders__lte,
		on_site_date__gte,
		on_site_date__lte,
		date_from,
		date_to,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		brand_id__in,
		category_id__in,
		seller_id__in,
		product_id__in,
		orders__gte,
		orders__lte,
		proceeds__gte,
		proceeds__lte,
		quantity__gte,
		quantity__lte,
		returns__gte,
		returns__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		incomes__gte,
		incomes__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__gte,
		sales_percent__lte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		price__gte,
		price__lte,
		old_price__gte,
		old_price__lte,
		discount__gte,
		discount__lte,
		basic_discount__gte,
		basic_discount__lte,
		promo_discount__gte,
		promo_discount__lte,
		orders_failed__gte,
		orders_failed__lte,
		proceeds_failed__gte,
		proceeds_failed__lte,
		vendor_codes__gte,
		vendor_codes__lte,
		position__gte,
		position__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		sellers__gte,
		sellers__lte,
		reviews__gte,
		reviews__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
		brands__gte,
		brands__lte,
		avg_orders_per_article_with_orders__gte,
		avg_orders_per_article_with_orders__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_proceeds_per_article_with_orders__lte,
		products_with_orders__gte,
		products_with_orders__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article__lte,
		avg_percent_articles_with_orders__gte,
		avg_percent_articles_with_orders__lte,
		// sales_percent__gte,
		// sales_percent__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/sellers_summary/count/`,
			method: "get",
			params: {
				brands_with_orders__gte,
				brands_with_orders__lte,
				brands__gte,
				brands__lte,
				date_from,
				date_to,
				on_site_date__gte,
				on_site_date__lte,
				sales_percent__gte,
				sales_percent__lte,
				sales__gte,
				sales__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				brand_id__in,
				category_id__in,
				seller_id__in,
				product_id__in,
				orders__gte,
				orders__lte,
				proceeds__gte,
				proceeds__lte,
				quantity__gte,
				quantity__lte,
				returns__gte,
				returns__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				incomes__gte,
				incomes__lte,
				ransom__gte,
				ransom__lte,
				price__gte,
				price__lte,
				old_price__gte,
				old_price__lte,
				discount__gte,
				discount__lte,
				basic_discount__gte,
				basic_discount__lte,
				promo_discount__gte,
				promo_discount__lte,
				orders_failed__gte,
				orders_failed__lte,
				proceeds_failed__gte,
				proceeds_failed__lte,
				vendor_codes__gte,
				vendor_codes__lte,
				position__gte,
				position__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				sellers__gte,
				sellers__lte,
				reviews__gte,
				reviews__lte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
				avg_orders_per_article_with_orders__gte,
				avg_orders_per_article_with_orders__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_proceeds_per_article_with_orders__lte,
				products_with_orders__gte,
				products_with_orders__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article__lte,
				avg_percent_articles_with_orders__gte,
				avg_percent_articles_with_orders__lte,
				// sales_percent__gte,
				// sales_percent__lte,
			},
		})
		return response.data
	}

	async getSellerColorGroupDynamic({
		brand_ids,
		seller_ids,
		product_ids,
		date_from,
		date_to,
		extra_fields,
		offset,
		limit,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/seller_colors/`,
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				product_ids,
				date_from,
				date_to,
				extra_fields,
				offset,
				limit,
				ordering,
			},
		})
		return response.data
	}
	async exportSellerColorGroupDynamic({
		brand_ids,
		seller_ids,
		product_ids,
		date_from,
		date_to,
		extra_fields,
		offset,
		limit,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/seller_colors/export/`,
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				product_ids,
				date_from,
				date_to,
				extra_fields,
				offset,
				limit,
				ordering,
			},
		})
		return response.data
	}

	async getCategoriesSummary({
		on_site_date__gte,
		on_site_date__lte,
		date_from,
		date_to,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		level,
		parent_id,
		down_parent_id,
		up_parent_id,
		sellers__lte,
		sellers__gte,
		sellers_with_orders__lte,
		sellers_with_orders__gte,
		avg_percent_sellers_with_orders__lte,
		avg_percent_sellers_with_orders__gte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		brands__lte,
		brands__gte,
		brands_with_orders__lte,
		brands_with_orders__gte,
		avg_percent_brands_with_orders__lte,
		avg_percent_brands_with_orders__gte,
		products_with_orders__lte,
		products_with_orders__gte,
		avg_percent_articles_with_orders__lte,
		avg_percent_articles_with_orders__gte,
		avg_proceeds_per_article__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article_with_orders__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_orders_per_article__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article_with_orders__lte,
		avg_orders_per_article_with_orders__gte,
		vendor_codes__lte,
		vendor_codes__gte,
		avg_proceeds__lte,
		avg_proceeds__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		brand_id__in,
		brand_id,
		category_id__in,
		category_id,
		seller_id__in,
		seller_id,
		product_id__in,
		product_id,
		orders__lte,
		orders__gte,
		proceeds__lte,
		proceeds__gte,
		quantity__lte,
		quantity__gte,
		returns__lte,
		returns__gte,
		lost_proceeds__lte,
		lost_proceeds__gte,
		incomes__lte,
		incomes__gte,
		ransom__lte,
		ransom__gte,
		sales_percent__gte,
		sales_percent__lte,
		price__lte,
		price__gte,
		old_price__lte,
		old_price__gte,
		discount__lte,
		discount__gte,
		basic_discount__lte,
		basic_discount__gte,
		promo_discount__lte,
		promo_discount__gte,
		orders_failed__lte,
		orders_failed__gte,
		incomes_failed__lte,
		incomes_failed__gte,
		proceeds_failed__lte,
		proceeds_failed__gte,
		position__lte,
		position__gte,
		returns_percent__lte,
		returns_percent__gte,
		reviews,
		reviewsо,
		lost_proceeds_share,
		dynamic_proceeds_percent__lte,
		dynamic_proceeds_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_price_percent__lte,
		dynamic_price_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_quantity_percent__lte,
		dynamic_quantity_percent__gte,
		limit,
		offset,
		ordering,
		in_stock_orders_avg__gte,
		in_stock_orders_avg__lte,
		in_stock_proceeds__gte,
		in_stock_proceeds__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/categories_summary/`,
			method: "get",
			params: {
				sales_percent__gte,
				sales_percent__lte,
				on_site_date__gte,
				on_site_date__lte,
				date_from,
				date_to,
				sales__gte,
				sales__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				level,
				parent_id,
				down_parent_id,
				up_parent_id,
				sellers__lte,
				sellers__gte,
				sellers_with_orders__lte,
				sellers_with_orders__gte,
				avg_percent_sellers_with_orders__lte,
				avg_percent_sellers_with_orders__gte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				brands__lte,
				brands__gte,
				brands_with_orders__lte,
				brands_with_orders__gte,
				avg_percent_brands_with_orders__lte,
				avg_percent_brands_with_orders__gte,
				products_with_orders__lte,
				products_with_orders__gte,
				avg_percent_articles_with_orders__lte,
				avg_percent_articles_with_orders__gte,
				avg_proceeds_per_article__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article_with_orders__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_orders_per_article__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article_with_orders__lte,
				avg_orders_per_article_with_orders__gte,
				vendor_codes__lte,
				vendor_codes__gte,
				avg_proceeds__lte,
				avg_proceeds__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				brand_id__in,
				brand_id,
				category_id__in,
				category_id,
				seller_id__in,
				seller_id,
				product_id__in,
				product_id,
				orders__lte,
				orders__gte,
				proceeds__lte,
				proceeds__gte,
				quantity__lte,
				quantity__gte,
				returns__lte,
				returns__gte,
				lost_proceeds__lte,
				lost_proceeds__gte,
				incomes__lte,
				incomes__gte,
				ransom__lte,
				ransom__gte,
				price__lte,
				price__gte,
				old_price__lte,
				old_price__gte,
				discount__lte,
				discount__gte,
				basic_discount__lte,
				basic_discount__gte,
				promo_discount__lte,
				promo_discount__gte,
				orders_failed__lte,
				orders_failed__gte,
				incomes_failed__lte,
				incomes_failed__gte,
				proceeds_failed__lte,
				proceeds_failed__gte,
				position__lte,
				position__gte,
				returns_percent__lte,
				returns_percent__gte,
				reviews,
				reviewsо,
				lost_proceeds_share,
				dynamic_proceeds_percent__lte,
				dynamic_proceeds_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_price_percent__lte,
				dynamic_price_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_quantity_percent__lte,
				dynamic_quantity_percent__gte,
				limit,
				offset,
				ordering,
				in_stock_orders_avg__gte,
				in_stock_orders_avg__lte,
				in_stock_proceeds__gte,
				in_stock_proceeds__lte,
			},
		})
		return response.data
	}
	async exportCategoriesSummary({
		on_site_date__gte,
		on_site_date__lte,
		date_from,
		date_to,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		level,
		parent_id,
		down_parent_id,
		up_parent_id,
		sellers__lte,
		sellers__gte,
		sellers_with_orders__lte,
		sellers_with_orders__gte,
		avg_percent_sellers_with_orders__lte,
		avg_percent_sellers_with_orders__gte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		brands__lte,
		brands__gte,
		brands_with_orders__lte,
		brands_with_orders__gte,
		avg_percent_brands_with_orders__lte,
		avg_percent_brands_with_orders__gte,
		products_with_orders__lte,
		products_with_orders__gte,
		avg_percent_articles_with_orders__lte,
		avg_percent_articles_with_orders__gte,
		avg_proceeds_per_article__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article_with_orders__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_orders_per_article__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article_with_orders__lte,
		avg_orders_per_article_with_orders__gte,
		vendor_codes__lte,
		vendor_codes__gte,
		avg_proceeds__lte,
		avg_proceeds__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		brand_id__in,
		brand_id,
		category_id__in,
		category_id,
		seller_id__in,
		seller_id,
		product_id__in,
		product_id,
		orders__lte,
		orders__gte,
		proceeds__lte,
		proceeds__gte,
		quantity__lte,
		quantity__gte,
		returns__lte,
		returns__gte,
		lost_proceeds__lte,
		lost_proceeds__gte,
		incomes__lte,
		incomes__gte,
		ransom__lte,
		ransom__gte,
		sales_percent__gte,
		sales_percent__lte,
		price__lte,
		price__gte,
		old_price__lte,
		old_price__gte,
		discount__lte,
		discount__gte,
		basic_discount__lte,
		basic_discount__gte,
		promo_discount__lte,
		promo_discount__gte,
		orders_failed__lte,
		orders_failed__gte,
		incomes_failed__lte,
		incomes_failed__gte,
		proceeds_failed__lte,
		proceeds_failed__gte,
		position__lte,
		position__gte,
		returns_percent__lte,
		returns_percent__gte,
		reviews,
		reviewsо,
		lost_proceeds_share,
		dynamic_proceeds_percent__lte,
		dynamic_proceeds_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_price_percent__lte,
		dynamic_price_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_quantity_percent__lte,
		dynamic_quantity_percent__gte,
		limit,
		offset,
		ordering,
		in_stock_orders_avg__gte,
		in_stock_orders_avg__lte,
		in_stock_proceeds__gte,
		in_stock_proceeds__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/categories_summary/export/`,
			method: "get",
			params: {
				sales_percent__gte,
				sales_percent__lte,
				on_site_date__gte,
				on_site_date__lte,
				date_from,
				date_to,
				sales__gte,
				sales__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				level,
				parent_id,
				down_parent_id,
				up_parent_id,
				sellers__lte,
				sellers__gte,
				sellers_with_orders__lte,
				sellers_with_orders__gte,
				avg_percent_sellers_with_orders__lte,
				avg_percent_sellers_with_orders__gte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				brands__lte,
				brands__gte,
				brands_with_orders__lte,
				brands_with_orders__gte,
				avg_percent_brands_with_orders__lte,
				avg_percent_brands_with_orders__gte,
				products_with_orders__lte,
				products_with_orders__gte,
				avg_percent_articles_with_orders__lte,
				avg_percent_articles_with_orders__gte,
				avg_proceeds_per_article__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article_with_orders__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_orders_per_article__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article_with_orders__lte,
				avg_orders_per_article_with_orders__gte,
				vendor_codes__lte,
				vendor_codes__gte,
				avg_proceeds__lte,
				avg_proceeds__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				brand_id__in,
				brand_id,
				category_id__in,
				category_id,
				seller_id__in,
				seller_id,
				product_id__in,
				product_id,
				orders__lte,
				orders__gte,
				proceeds__lte,
				proceeds__gte,
				quantity__lte,
				quantity__gte,
				returns__lte,
				returns__gte,
				lost_proceeds__lte,
				lost_proceeds__gte,
				incomes__lte,
				incomes__gte,
				ransom__lte,
				ransom__gte,
				price__lte,
				price__gte,
				old_price__lte,
				old_price__gte,
				discount__lte,
				discount__gte,
				basic_discount__lte,
				basic_discount__gte,
				promo_discount__lte,
				promo_discount__gte,
				orders_failed__lte,
				orders_failed__gte,
				incomes_failed__lte,
				incomes_failed__gte,
				proceeds_failed__lte,
				proceeds_failed__gte,
				position__lte,
				position__gte,
				returns_percent__lte,
				returns_percent__gte,
				reviews,
				reviewsо,
				lost_proceeds_share,
				dynamic_proceeds_percent__lte,
				dynamic_proceeds_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_price_percent__lte,
				dynamic_price_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_quantity_percent__lte,
				dynamic_quantity_percent__gte,
				limit,
				offset,
				ordering,
				in_stock_orders_avg__gte,
				in_stock_orders_avg__lte,
				in_stock_proceeds__gte,
				in_stock_proceeds__lte,
			},
		})
		return response.data
	}
	async getCategoriesSummaryCount({
		on_site_date__gte,
		on_site_date__lte,
		in_stock_orders_avg__gte,
		in_stock_orders_avg__lte,
		in_stock_proceeds__gte,
		in_stock_proceeds__lte,
		date_from,
		date_to,
		sales__gte,
		sales__lte,
		sales_proceeds__gte,
		sales_proceeds__lte,
		level,
		parent_id,
		down_parent_id,
		up_parent_id,
		sellers__lte,
		sellers__gte,
		sellers_with_orders__lte,
		sellers_with_orders__gte,
		avg_percent_sellers_with_orders__lte,
		avg_percent_sellers_with_orders__gte,
		dynamic_sales_percent__lte,
		dynamic_sales_percent__gte,
		brands__lte,
		brands__gte,
		brands_with_orders__lte,
		brands_with_orders__gte,
		avg_percent_brands_with_orders__lte,
		avg_percent_brands_with_orders__gte,
		products_with_orders__lte,
		products_with_orders__gte,
		avg_percent_articles_with_orders__lte,
		avg_percent_articles_with_orders__gte,
		avg_proceeds_per_article__lte,
		avg_proceeds_per_article__gte,
		avg_proceeds_per_article_with_orders__lte,
		avg_proceeds_per_article_with_orders__gte,
		avg_orders_per_article__lte,
		avg_orders_per_article__gte,
		avg_orders_per_article_with_orders__lte,
		avg_orders_per_article_with_orders__gte,
		vendor_codes__lte,
		vendor_codes__gte,
		avg_proceeds__lte,
		avg_proceeds__gte,
		dynamic_vendor_codes_percent__lte,
		dynamic_vendor_codes_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		brand_id__in,
		brand_id,
		category_id__in,
		category_id,
		seller_id__in,
		seller_id,
		product_id__in,
		product_id,
		orders__lte,
		orders__gte,
		proceeds__lte,
		proceeds__gte,
		quantity__lte,
		quantity__gte,
		returns__lte,
		returns__gte,
		lost_proceeds__lte,
		lost_proceeds__gte,
		incomes__lte,
		incomes__gte,
		ransom__lte,
		ransom__gte,
		price__lte,
		price__gte,
		old_price__lte,
		old_price__gte,
		discount__lte,
		discount__gte,
		basic_discount__lte,
		basic_discount__gte,
		promo_discount__lte,
		promo_discount__gte,
		orders_failed__lte,
		orders_failed__gte,
		incomes_failed__lte,
		incomes_failed__gte,
		proceeds_failed__lte,
		proceeds_failed__gte,
		position__lte,
		position__gte,
		returns_percent__lte,
		returns_percent__gte,
		reviews,
		reviewsо,
		lost_proceeds_share,
		dynamic_proceeds_percent__lte,
		dynamic_proceeds_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_price_percent__lte,
		dynamic_price_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_quantity_percent__lte,
		dynamic_quantity_percent__gte,
		sales_percent__gte,
		sales_percent__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/categories_summary/count/`,
			method: "get",
			params: {
				sales_percent__lte,
				sales_percent__gte,
				on_site_date__gte,
				on_site_date__lte,
				in_stock_orders_avg__gte,
				in_stock_orders_avg__lte,
				in_stock_proceeds__gte,
				in_stock_proceeds__lte,
				date_from,
				date_to,
				sales__gte,
				sales__lte,
				sales_proceeds__gte,
				sales_proceeds__lte,
				level,
				parent_id,
				down_parent_id,
				up_parent_id,
				sellers__lte,
				sellers__gte,
				sellers_with_orders__lte,
				sellers_with_orders__gte,
				avg_percent_sellers_with_orders__lte,
				avg_percent_sellers_with_orders__gte,
				dynamic_sales_percent__lte,
				dynamic_sales_percent__gte,
				brands__lte,
				brands__gte,
				brands_with_orders__lte,
				brands_with_orders__gte,
				avg_percent_brands_with_orders__lte,
				avg_percent_brands_with_orders__gte,
				products_with_orders__lte,
				products_with_orders__gte,
				avg_percent_articles_with_orders__lte,
				avg_percent_articles_with_orders__gte,
				avg_proceeds_per_article__lte,
				avg_proceeds_per_article__gte,
				avg_proceeds_per_article_with_orders__lte,
				avg_proceeds_per_article_with_orders__gte,
				avg_orders_per_article__lte,
				avg_orders_per_article__gte,
				avg_orders_per_article_with_orders__lte,
				avg_orders_per_article_with_orders__gte,
				vendor_codes__lte,
				vendor_codes__gte,
				avg_proceeds__lte,
				avg_proceeds__gte,
				dynamic_vendor_codes_percent__lte,
				dynamic_vendor_codes_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				brand_id__in,
				brand_id,
				category_id__in,
				category_id,
				seller_id__in,
				seller_id,
				product_id__in,
				product_id,
				orders__lte,
				orders__gte,
				proceeds__lte,
				proceeds__gte,
				quantity__lte,
				quantity__gte,
				returns__lte,
				returns__gte,
				lost_proceeds__lte,
				lost_proceeds__gte,
				incomes__lte,
				incomes__gte,
				ransom__lte,
				ransom__gte,
				price__lte,
				price__gte,
				old_price__lte,
				old_price__gte,
				discount__lte,
				discount__gte,
				basic_discount__lte,
				basic_discount__gte,
				promo_discount__lte,
				promo_discount__gte,
				orders_failed__lte,
				orders_failed__gte,
				incomes_failed__lte,
				incomes_failed__gte,
				proceeds_failed__lte,
				proceeds_failed__gte,
				position__lte,
				position__gte,
				returns_percent__lte,
				returns_percent__gte,
				reviews,
				reviewsо,
				lost_proceeds_share,
				dynamic_proceeds_percent__lte,
				dynamic_proceeds_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_price_percent__lte,
				dynamic_price_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_quantity_percent__lte,
				dynamic_quantity_percent__gte,
			},
		})
		return response.data
	}

	async getSellersSummaryScope({
		seller_id__in,
		brand_id__in,
		category_id__in,
		is_new,
		brands__gte,
		brands__lte,
		products__gte,
		products__lte,
		orders__gte,
		orders__lte,
		incomes__gte,
		incomes__lte,
		reviews__gte,
		reviews__lte,
		proceeds__gte,
		proceeds__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		position__gte,
		position__lte,
		likes__gte,
		likes__lte,
		quantity__gte,
		quantity__lte,
		price__gte,
		price__lte,
		discount__gte,
		discount__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__get,
		sales_percent__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_product_count_percent__gte,
		dynamic_product_count_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_reviews_percent__gte,
		dynamic_reviews_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
	}) {
		const response = await request({
			url: `/parsers/sellers_summary/scope/`,
			method: "get",
			params: {
				seller_id__in,
				brand_id__in,
				category_id__in,
				is_new,
				brands__gte,
				brands__lte,
				products__gte,
				products__lte,
				orders__gte,
				orders__lte,
				incomes__gte,
				incomes__lte,
				reviews__gte,
				reviews__lte,
				proceeds__gte,
				proceeds__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				position__gte,
				position__lte,
				likes__gte,
				likes__lte,
				quantity__gte,
				quantity__lte,
				price__gte,
				price__lte,
				discount__gte,
				discount__lte,
				ransom__gte,
				ransom__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_product_count_percent__gte,
				dynamic_product_count_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_reviews_percent__gte,
				dynamic_reviews_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
			},
		})
		return response.data
	}

	async getExactSellersSummary({id}) {
		const response = await request({
			url: `/parsers/sellers_summary/${id}/`,
			method: "get",
		})
		return response.data
	}

	async exportSellersSummary({
		seller_id__in,
		brand_id__in,
		category_id__in,
		is_new,
		ordering,
		brands__gte,
		brands__lte,
		products__gte,
		products__lte,
		orders__gte,
		orders__lte,
		incomes__gte,
		incomes__lte,
		reviews__gte,
		reviews__lte,
		proceeds__gte,
		proceeds__lte,
		avg_proceeds__gte,
		avg_proceeds__lte,
		position__gte,
		position__lte,
		likes__gte,
		likes__lte,
		quantity__gte,
		quantity__lte,
		price__gte,
		price__lte,
		discount__gte,
		discount__lte,
		ransom__gte,
		ransom__lte,
		sales_percent__get,
		sales_percent__lte,
		lost_proceeds__gte,
		lost_proceeds__lte,
		lost_proceeds_share__gte,
		lost_proceeds_share__lte,
		dynamic_proceeds_percent__gte,
		dynamic_proceeds_percent__lte,
		dynamic_product_count_percent__gte,
		dynamic_product_count_percent__lte,
		dynamic_orders_percent__gte,
		dynamic_orders_percent__lte,
		dynamic_price_percent__gte,
		dynamic_price_percent__lte,
		dynamic_avg_proceeds_percent__gte,
		dynamic_avg_proceeds_percent__lte,
		dynamic_lost_proceeds_percent__gte,
		dynamic_lost_proceeds_percent__lte,
		dynamic_reviews_percent__gte,
		dynamic_reviews_percent__lte,
		dynamic_quantity_percent__gte,
		dynamic_quantity_percent__lte,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/parsers/sellers_summary/export/`,
			method: "get",
			params: {
				sales_percent__get,
				sales_percent__lte,
				seller_id__in,
				brand_id__in,
				category_id__in,
				is_new,
				ordering,
				brands__gte,
				brands__lte,
				products__gte,
				products__lte,
				orders__gte,
				orders__lte,
				incomes__gte,
				incomes__lte,
				reviews__gte,
				reviews__lte,
				proceeds__gte,
				proceeds__lte,
				avg_proceeds__gte,
				avg_proceeds__lte,
				position__gte,
				position__lte,
				likes__gte,
				likes__lte,
				quantity__gte,
				quantity__lte,
				price__gte,
				price__lte,
				discount__gte,
				discount__lte,
				ransom__gte,
				ransom__lte,
				lost_proceeds__gte,
				lost_proceeds__lte,
				lost_proceeds_share__gte,
				lost_proceeds_share__lte,
				dynamic_proceeds_percent__gte,
				dynamic_proceeds_percent__lte,
				dynamic_product_count_percent__gte,
				dynamic_product_count_percent__lte,
				dynamic_orders_percent__gte,
				dynamic_orders_percent__lte,
				dynamic_price_percent__gte,
				dynamic_price_percent__lte,
				dynamic_avg_proceeds_percent__gte,
				dynamic_avg_proceeds_percent__lte,
				dynamic_lost_proceeds_percent__gte,
				dynamic_lost_proceeds_percent__lte,
				dynamic_reviews_percent__gte,
				dynamic_reviews_percent__lte,
				dynamic_quantity_percent__gte,
				dynamic_quantity_percent__lte,
				limit,
				offset,
			},
		})
		return response.data
	}

	async exportSellerDynamic({
		seller_ids,
		brand_ids,
		search,
		wb_search,
		wb_catalog_url,
		period,
		date_from,
		date_to,
		extra_fields = [
			"vendor_codes",
			"vendor_codes_dynamic",
			//"rating",
			//"rating_dynamic",
			//"reviews",
			//"reviews_dynamic",
			"categories",
			"discount_price",
			"price",
			"orders",
			"quantity",
			"sales",
			"ransom",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"discount_dynamic",
			"orders_dynamic",
			"orders_proceeds_dynamic",
			"quantity_dynamic",
			"price_dynamic",
			"sales_dynamic",
			"proceeds_dynamic",
			"ransom_dynamic",
		].join(),
		limit,
		offset,
	}) {
		const response = await request({
			url: `/parsers/sellers_dynamic/export/`,
			method: "get",
			params: {
				seller_ids,
				brand_ids,
				search,
				wb_search,
				wb_catalog_url,
				period,
				date_from,
				date_to,
				extra_fields,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getSellersDynamic({
		brand_ids,
		seller_ids,
		category_ids,
		collection_id,
		wb_search,
		search,
		wb_catalog_url,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"discount_dynamic",
			"orders_failed",
			"orders_failed_dynamic",
			"proceeds_failed",
			"proceeds_failed_dynamic",
			// "old_price",
			// "old_price_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			// "ransom",
			// "ransom_dynamic",
			"vendor_codes",
			"vendor_codes_dynamic",
			"reviews",
			"rating",
			"rating_dynamic",
			"reviews_dynamic",
			"sales_percent",
			// "sales_percent_dynamic",
			"categories",
		].join(),
	}) {
		const response = await request({
			url: `/wb_dynamic/sellers/`,
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				category_ids,
				collection_id,
				wb_search,
				search,
				wb_catalog_url,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}
	async getCategorySellers({
		brand_ids,
		seller_ids,
		category_ids,
		collection_id,
		wb_search,
		search,
		wb_catalog_url,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"discount_dynamic",
			"orders_failed",
			"orders_failed_dynamic",
			"proceeds_failed",
			"proceeds_failed_dynamic",
			// "old_price",
			// "old_price_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			// "ransom",
			// "ransom_dynamic",
			"vendor_codes",
			"vendor_codes_dynamic",
			"reviews",
			"rating",
			"rating_dynamic",
			"reviews_dynamic",
			"sales_percent",
			// "sales_percent_dynamic",
			"categories",
		].join(),
	}) {
		const response = await request({
			url: `/wb_dynamic/category_sellers/`,
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				category_ids,
				collection_id,
				wb_search,
				search,
				wb_catalog_url,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}
	async exportCategorySellers({
		brand_ids,
		seller_ids,
		category_ids,
		collection_id,
		wb_search,
		search,
		wb_catalog_url,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"discount_dynamic",
			"orders_failed",
			"orders_failed_dynamic",
			"proceeds_failed",
			"proceeds_failed_dynamic",
			// "old_price",
			// "old_price_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			// "ransom",
			// "ransom_dynamic",
			"vendor_codes",
			"vendor_codes_dynamic",
			"reviews",
			"rating",
			"rating_dynamic",
			"reviews_dynamic",
			"sales_percent",
			// "sales_percent_dynamic",
			"categories",
		].join(),
	}) {
		const response = await request({
			url: `/wb_dynamic/category_sellers/export/`,
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				category_ids,
				collection_id,
				wb_search,
				search,
				wb_catalog_url,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}

	async exportSellersDynamic({
		brand_ids,
		seller_ids,
		category_ids,
		wb_search,
		search,
		wb_catalog_url,
		collection_id,
		city,
		date_from,
		date_to,
		period,
		limit,
		offset,
		ordering,
		extra_fields = [
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"discount_dynamic",
			"orders_failed",
			"orders_failed_dynamic",
			"proceeds_failed",
			"proceeds_failed_dynamic",
			"old_price",
			"old_price_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			"ransom",
			"ransom_dynamic",
			"vendor_codes",
			"vendor_codes_dynamic",
			"reviews",
			"rating",
			"rating_dynamic",
			"reviews_dynamic",
		].join(),
	}) {
		const response = await request({
			url: `/wb_dynamic/sellers/export/`,
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				category_ids,
				wb_search,
				search,
				wb_catalog_url,
				collection_id,
				city,
				date_from,
				date_to,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
			},
		})
		return response.data
	}

	async exportSellerDynamicById({
		id = "",
		seller_ids,
		extra_fields,
		period,
		date_from,
		date_to,
		limit,
		offset,
	}) {
		const response = await request({
			url: `/wb_dynamic/sellers/${id}/export/`,
			method: "get",
			params: {
				seller_ids,
				extra_fields,
				period,
				date_from,
				date_to,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getSellerCategoriesDynamic({
		category_id,
		seller_id,
		category_ids,
		brand_ids,
		level,
		has_child,
		date_from,
		date_to,
		extra_fields = [
			"vendor_codes",
			"vendor_codes_dynamic",
			//"rating",
			//"rating_dynamic",
			//"reviews",
			//"reviews_dynamic",
			//"categories",
			"proceeds",
			"orders",
			"price",
			"quantity",
			"sales",
			"ransom",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"discount",
			"orders_share",
			"proceeds_failed",
			"old_price",
			"sales_proceeds",
			"discount_dynamic",
			"orders_dynamic",
			"orders_proceeds_dynamic",
			"quantity_dynamic",
			"price_dynamic",
			"sales_dynamic",
			"sales_proceeds_dynamic",
			"proceeds_dynamic",
			"ransom_dynamic",
		].join(),
		limit,
		offset,
	}) {
		const response = await request({
			url: `/parsers/sellers/${seller_id}/categories_dynamic/${category_id ?? ""}/`,
			method: "get",
			params: {
				category_ids,
				brand_ids,
				level,
				has_child,
				date_from,
				date_to,
				extra_fields,
				limit,
				offset,
			},
		})
		return response.data
	}

	async getProductsDynamicScope({
		date_from,
		date_to,
		product_ids,
		brand_ids,
		seller_ids,
		period,
	}) {
		const response = await request({
			url: `/parsers/products_dynamic/scope/`,
			method: "get",
			params: {
				date_from,
				date_to,
				product_ids,
				brand_ids,
				seller_ids,
				period,
			},
		})
		return response.data
	}

	async getBrandDynamicScope({brand_ids, ordering, seller_ids, date_from, date_to, period}) {
		const response = await request({
			url: `/parsers/brands_dynamic/scope/`,
			method: "get",
			params: {
				brand_ids,
				seller_ids,
				date_from,
				date_to,
				period,
				ordering,
			},
		})
		return response.data
	}

	async getProductDynamicScope({product_ids, date_from, date_to, period}) {
		const response = await request({
			url: `/parsers/products_dynamic/scope/`,
			method: "get",
			params: {
				product_ids,
				date_from,
				date_to,
				period,
			},
		})
		return response.data
	}

	async getCategoriesDynamicScope({brand_ids, date_from, date_to}) {
		const response = await request({
			url: `/parsers/categories_dynamic/scope/`,
			method: "get",
			params: {
				brand_ids,
				date_from,
				date_to,
			},
		})
		return response.data
	}

	async getBrandColorGroupDynamicScope({brand_ids, seller_ids, date_from, date_to, id}) {
		const response = await request({
			url: `/parsers/brands/${id}/color_group_dynamic/scope/`,
			method: "get",
			params: {
				seller_ids,
				brand_ids,
				date_from,
				date_to,
			},
		})
		return response.data
	}

	async getBrandSizeDynamicScope({brand_ids, date_from, date_to, id}) {
		const response = await request({
			url: `/parsers/brands/${id}/size_dynamic/scope/`,
			method: "get",
			params: {
				brand_ids,
				date_from,
				date_to,
			},
		})
		return response.data
	}

	async getProductHistoryDynamic({date_from, date_to, product_ids, period}) {
		const response = await request({
			url: `/parsers/product_history_dynamic/`,
			method: "get",
			params: {
				date_from,
				date_to,
				product_ids,
				period,
			},
		})
		return response.data
	}

	async getProductColorDynamicScope({id, date_from, date_to}) {
		const response = await request({
			url: `/parsers/products/${id}/color_dynamic/scope/`,
			method: "get",
			params: {
				date_from,
				date_to,
			},
		})
		return response.data
	}

	async getProductsColorSizeDynamicScope({id, date_from, date_to}) {
		const response = await request({
			url: `/parsers/products/${id}/color_size_dynamic/scope/`,
			method: "get",
			params: {
				date_from,
				date_to,
			},
		})
		return response.data
	}

	async getProductsColorWarehouseDynamicScope({id, date_from, date_to}) {
		const response = await request({
			url: `/parsers/products/${id}/color_warehouse_dynamic/scope/`,
			method: "get",
			params: {
				date_from,
				date_to,
			},
		})
		return response.data
	}

	async getProductPositionDynamicScope({id, date_from, date_to}) {
		const response = await request({
			url: `/parsers/products/${id}/position_dynamic/scope/`,
			method: "get",
			params: {
				date_from,
				date_to,
			},
		})
		return response.data
	}

	async searchProductById({product_ids, date_from, date_to, period}) {
		const response = await request({
			url: "/parsers/products_dynamic/",
			method: "get",
			params: {
				product_ids,
				date_from,
				date_to,
				period,
			},
		})
		return response.data
	}

	async SearchBrandByAlias({brand_ids, date_from, date_to, period, search, alias}) {
		const response = await request({
			url: "parsers/brands_dynamic/",
			method: "get",
			params: {
				brand_ids,
				alias,
				search,
				date_from,
				date_to,
				period,
			},
		})
		return response.data
	}

	async searchSellersByName({seller_ids, search, period}) {
		const response = await request({
			url: `/parsers/sellers_dynamic/`,
			method: "get",
			params: {
				seller_ids,
				search,
				period,
			},
		})
		return response.data
	}
	async getPartnersStatus() {
		const response = await request({
			url: `/partners/`,
			method: "get",
		})
		return response.data
	}
	async getPartnerAwards({purchase__date__gte, purchase__date__lte, purchase__date__lt}) {
		const response = await request({
			url: `/partner_awards/`,
			method: "get",
			params: {
				purchase__date__gte,
				purchase__date__lte,
				purchase__date__lt,
			},
		})
		return response.data
	}
	async getPartnerAwardsDynamic({
		create_date__gte,
		create_date__lte,
		purchase__date__gte,
		purchase__date__lt,
		purchase__date__lte,
	}) {
		const response = await request({
			url: `/partner_awards_dynamic/`,
			method: "get",
			params: {
				create_date__gte,
				create_date__lte,
				purchase__date__gte,
				purchase__date__lt,
				purchase__date__lte,
			},
		})
		return response.data
	}
	async getProductWarehouseDynamic({
		item,
		id,
		date_from,
		date_to,
		period,
		extra_fields,
		offset,
		limit,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/product_warehouses/`,
			method: "get",
			params: {
				item,
				date_from,
				date_to,
				period,
				extra_fields,
				offset,
				limit,
				ordering,
			},
		})
		return response.data
	}

	async getProductWarehouseDynamicScope({
		id,
		date_from,
		date_to,
		period,
		extra_fields,
		offset,
		limit,
		ordering,
	}) {
		const response = await request({
			url: `/parsers/products/${id}/warehouse_dynamic/scope/`,
			method: "get",
			params: {
				date_from,
				date_to,
				period,
				extra_fields,
				offset,
				limit,
				ordering,
			},
		})
		return response.data
	}

	async exportSellerCategoriesDynamic({
		date_from,
		date_to,
		id,
		category_ids,
		extra_fields = [
			"vendor_codes",
			"vendor_codes_dynamic",
			"rating",
			"reviews",
			"categories",
			"sellers",
			"proceeds",
			"proceeds_dynamic",
			"orders",
			"orders_dynamic",
			"price",
			"price_dynamic",
			"quantity",
			"quantity_dynamic",
			"sales",
			"sales_dynamic",
			"sales_proceeds",
			"sales_proceeds_dynamic",
			"ransom",
			"ransom_dynamic",
			"discount",
			"discount_dynamic",
			"in_stock_days",
			"out_of_stock_days",
			"in_stock_percent",
			"in_stock_orders_avg",
			"in_stock_proceeds",
			"lost_proceeds",
			"orders_share",
			"old_price",
		].join(),
		limit,
		offset,
	}) {
		const response = await request({
			url: `/parsers/sellers/${id}/categories_dynamic/export/`,
			params: {
				date_from,
				date_to,
				category_ids,
				extra_fields,
				limit,
				offset,
			},
		})
		return response.data
	}
	async getSellersDynamicScope({date_from, date_to, brand_ids, seller_ids, period}) {
		const response = await request({
			url: `/parsers/sellers_dynamic/scope/`,
			method: "get",
			params: {
				date_from,
				date_to,
				seller_ids,
				period,
				brand_ids,
			},
		})
		return response.data
	}

	async getKeywords({keyword}) {
		const response = await request({
			url: `/monitoring/keyword_collector/`,
			method: "get",
			params: {
				keyword,
			},
		})

		return response.data
	}

	async exportKeywords({keyword}) {
		const response = await request({
			url: `/monitoring/keyword_collector/export/`,
			method: "get",
			params: {
				keyword,
			},
		})
		return response.data
	}

	async getPoritions({product_id, phrase, pages_max /*limit, offset, ordering*/}) {
		const response = await request({
			url: `/monitoring/positions/`,
			method: "get",
			params: {
				product_id,
				phrase,
				pages_max,
			},
		})
		return response.data
	}

	async getBanners() {
		const response = await request({
			url: "/banners/",
			method: "get",
		})

		return response.data
	}

	async getCompanyTariff() {
		const response = await request({
			url: "/company/tariff_plan/",
			method: "get",
		})

		return response.data
	}

	async getProductKeywords({
		date_from,
		date_to,
		product_ids,
		keyword_ids,
		extra_fields,
		limit,
		period,
		offset,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/product_keywords/`,
			method: "get",
			params: {
				date_from,
				date_to,
				product_ids,
				keyword_ids,
				extra_fields,
				limit,
				period,
				offset,
				ordering,
			},
			timeout: 50000,
		})
		return response.data
	}
	async getProductKeywordsByProductId({
		date_from,
		date_to,
		product_id,
		keyword_ids,
		extra_fields,
		limit,
		search,
		period,
		offset,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/products/${product_id}/keywords/`,
			method: "get",
			params: {
				date_from,
				date_to,
				keyword_ids,
				extra_fields,
				search,
				limit,
				period,
				offset,
				ordering,
			},
			timeout: 50000,
		})
		return response.data
	}
	async postToMonitoringProductKeywords({
		date_from,
		date_to,
		product_ids,
		keyword_ids,
		extra_fields,
		limit,
		period,
		offset,
		ordering,
		collection_id,
	}) {
		const response = await request({
			url: `/wb_dynamic/product_keywords/to_monitoring/`,
			method: "post",
			params: {
				collection_id,
				date_from,
				date_to,
				product_ids,
				keyword_ids,
				extra_fields,
				limit,
				period,
				offset,
				ordering,
			},
		})
		return response.data
	}
	async becomepPartner() {
		const response = await request({
			url: `/company/convert_to_partner/`,
			method: "post",
		})
		return response.data
	}
	async exportProductKeywords({
		date_from,
		date_to,
		product_ids,
		keyword_ids,
		extra_fields,
		limit,
		period,
		offset,
		ordering,
	}) {
		const response = await request({
			url: `/wb_dynamic/product_keywords/export/`,
			method: "get",
			params: {
				date_from,
				date_to,
				product_ids,
				keyword_ids,
				extra_fields,
				limit,
				period,
				offset,
				ordering,
			},
		})
		return response.data
	}

	async getDinamicKeywordsFrazes({
		wb_search,
		subject_ids,
		brand_ids,
		category_ids,
		stop_product_ids,
		products__gte,
		products__lte,
		seller_ids,
		city,
		period = 7,
		limit,
		product_ids,
		offset,
		ordering,
		extra_fields,
		frequency__gte,
		frequency__lte,
		percent_products__gte,
		percent_products__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords/`,
			method: "get",
			params: {
				seller_ids,
				subject_ids,
				brand_ids,
				category_ids,
				stop_product_ids,
				products__gte,
				products__lte,
				wb_search,
				city,
				product_ids,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
				frequency__gte,
				frequency__lte,
				percent_products__gte,
				percent_products__lte,
			},
		})
		return response.data
	}
	async getWbParsers({keyword_ids__in, keyword_ids, limit, offset}) {
		const response = await request({
			url: `/parsers/keywords/`,
			method: "get",
			params: {
				keyword_ids__in,
				keyword_ids,
				limit,
				offset,
			},
		})
		return response.data
	}
	async getDinamicKeywordsFrazesCount({
		wb_search,
		brand_ids,
		subject_ids,
		category_ids,
		stop_product_ids,
		products__gte,
		products__lte,
		seller_ids,
		city,
		period = 7,
		limit,
		product_ids,
		offset,
		ordering,
		extra_fields,
		frequency__gte,
		frequency__lte,
		percent_products__gte,
		percent_products__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords/count/`,
			method: "get",
			params: {
				seller_ids,
				brand_ids,
				subject_ids,
				category_ids,
				stop_product_ids,
				products__gte,
				products__lte,
				wb_search,
				city,
				product_ids,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
				frequency__gte,
				frequency__lte,
				percent_products__gte,
				percent_products__lte,
			},
		})
		return response.data
	}
	async addAllMonitoringDinamicKeywordsFrazes({
		wb_search,
		brand_ids,
		category_ids,
		stop_product_ids,
		date_from,
		date_to,
		seller_ids,
		city,
		collection_id,
		period,
		limit,
		product_ids,
		offset,
		ordering,
		extra_fields,
		products__gte,
		products__lte,
		frequency__gte,
		frequency__lte,
		percent_products__gte,
		percent_products__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords/to_monitoring/`,
			method: "post",
			params: {
				seller_ids,
				brand_ids,
				category_ids,
				stop_product_ids,
				date_from,
				date_to,
				collection_id,
				wb_search,
				city,
				product_ids,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
				products__gte,
				products__lte,
				frequency__gte,
				frequency__lte,
				percent_products__gte,
				percent_products__lte,
			},
		})
		return response.data
	}

	async exportKeywordsFrazes({
		wb_search,
		brand_ids,
		subject_ids,
		category_ids,
		stop_product_ids,
		seller_ids,
		city,
		period,
		limit,
		product_ids,
		offset,
		ordering,
		extra_fields,
		frequency__gte,
		frequency__lte,
		percent_products__gte,
		percent_products__lte,
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords/export/`,
			method: "get",
			params: {
				seller_ids,
				subject_ids,
				brand_ids,
				category_ids,
				stop_product_ids,
				wb_search,
				city,
				product_ids,
				period,
				limit,
				offset,
				ordering,
				extra_fields,
				frequency__gte,
				frequency__lte,
				percent_products__gte,
				percent_products__lte,
			},
		})
		return response.data
	}

	async getProductKeywordsStatByData({
		keyword_ids,
		stop_words,
		date_from,
		date_to,
		search,
		ordering,
		period,
		limit,
		offset,
		extra_fields,
		collection_id,
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords_stat/analyze/?limit=${limit ?? 50}&offset=${offset ?? 0}`,
			method: "post",
			data: {
				collection_id,
				stop_words,
				keyword_ids,
				date_from,
				date_to,
				search,
				ordering,
				period,
				// limit,
				// offset,
				extra_fields,
			},
		})
		return response.data
	}
	async getProductKeywordsStat({
		keyword_ids,
		stop_words,
		date_from,
		date_to,
		search,
		ordering,
		period,
		limit,
		offset,
		extra_fields,
		collection_id,
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords_stat/`,
			method: "get",
			params: {
				collection_id,
				stop_words,
				keyword_ids,
				date_from,
				date_to,
				search,
				ordering,
				period,
				limit,
				offset,
				extra_fields,
			},
		})
		return response.data
	}
	async postProductKeywordsStat({
		keyword_ids,
		stop_words,
		date_from,
		date_to,
		search,
		ordering,
		period,
		limit,
		offset,
		extra_fields,
		collection_id,
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords_stat/?limit=${limit}&offset=${offset}`,
			method: "post",
			params: {
				collection_id,
				stop_words,
				keyword_ids,
				date_from,
				date_to,
				search,
				ordering,
				period,
				// limit,
				// offset,
				extra_fields,
			},
		})
		return response.data
	}
	async postAllToMonitoring({
		keyword_ids,
		date_from,
		date_to,
		search,
		ordering,
		period,
		limit,
		offset,
		extra_fields,
		collection_id,
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords_stat/to_monitoring/`,
			method: "post",
			params: {
				collection_id,
				keyword_ids,
				date_from,
				date_to,
				search,
				ordering,
				period,
				limit,
				offset,
				extra_fields,
			},
		})
		return response.data
	}
	async getProductKeywordsStatExport({
		keyword_ids,
		date_from,
		stop_words,
		date_to,
		search,
		ordering,
		period,
		limit,
		offset,
		extra_fields,
		collection_id,
	}) {
		const response = await request({
			url: `/wb_dynamic/keywords_stat/export/`,
			method: "get",
			params: {
				collection_id,
				keyword_ids,
				stop_words,
				date_from,
				date_to,
				search,
				ordering,
				period,
				limit,
				offset,
				extra_fields,
			},
		})
		return response.data
	}

	// async getNewProductKeywords({
	// 	keyword_ids,
	// 	date_from,
	// 	date_to,
	// 	search,
	// 	ordering,
	// 	period,
	// 	limit,
	// 	offset,
	// 	extra_fields,
	// }) {
	// 	const response = await request({
	// 		url: `/wb_dynamic/keywords/`,
	// 		method: "get",
	// 		params: {
	// 			keyword_ids,
	// 			date_from,
	// 			date_to,
	// 			search,
	// 			ordering,
	// 			period,
	// 			limit,
	// 			offset,
	// 			extra_fields,
	// 		},
	// 	})
	// 	return response.data
	// }

	async getTariffs() {
		const response = await request({
			url: "/tariff/plans/",
			method: "get",
		})

		return response.data
	}

	async getTransactions({limit, offset}) {
		const response = await request({
			url: "/billing/transactions/",
			method: "get",
			params: {
				limit,
				offset,
			},
		})

		return response.data
	}

	async getTransactionsById({id}) {
		const response = await request({
			url: `/billing/transactions/${id}/`,
			method: "get",
		})
		return response.data
	}

	async getPaymentFormData({sum}) {
		const response = await request({
			url: "/billing/refill/",
			method: "post",
			data: {
				sum,
			},
		})
		return response.data
	}

	async buyTariff({plan}) {
		const response = await request({
			url: "/company/purchase/",
			method: "post",
			data: {
				plan,
			},
		})
		return response.data
	}

	async getPromocodeInfo({promocode}) {
		const response = await request({
			url: `/promo_code_checker/?promo_code=${promocode}`,
			method: "get",
		})

		return response.data
	}
	async getPromocodes({limit, ordering, offset}) {
		const response = await request({
			url: `/promo_codes/`,
			method: "get",
			params: {
				limit,
				ordering,
				offset,
			},
		})

		return response.data
	}

	async buyTariffv2({plan, period, promocode}) {
		const response = await request({
			url: "/company/v2/purchase/",
			method: "post",
			data: deletePropFromObject(
				{
					plan,
					period,
					promo_code: promocode,
				},
				promocode ? "" : "promo_code"
			),
		})
		return response.data
	}

	async calcTariffPurchase({plan, period, promocode}) {
		const response = await request({
			url: "/company/v2/purchase_calc/",
			method: "post",
			data: deletePropFromObject(
				{
					plan,
					period,
					promo_code: promocode,
				},
				promocode ? "" : "promo_code"
			),
		})
		return response.data
	}

	async exportReviews({id, stars}) {
		const response = await request({
			url: `/parsers/products/${id}/feedbacks/export/?mark__in=${stars}`,
			method: "get",
		})
		return response.data
	}
	async createChatGptNewChat({name}) {
		const response = await request({
			url: `/monitoring/chatgpt_chat/`,
			method: "post",
			data: {
				name,
			},
		})
		return response.data
	}
	async getChatGptChats() {
		const response = await request({
			url: `/monitoring/chatgpt_chat/`,
			method: "get",
		})
		return response.data
	}

	async deleteChatGptChat({id}) {
		const response = await request({
			url: `/monitoring/chatgpt_chat/${id}/`,
			method: "delete",
		})
		return response.data
	}
	async editChatGptChat({id, data}) {
		const response = await request({
			url: `/monitoring/chatgpt_chat/${id}/`,
			method: "patch",
			data,
		})
		return response.data
	}
	async sendMessageToChatGPT(id, message) {
		const response = await request({
			url: `/monitoring/chatgpt_chat/${id}/text/`,
			method: "post",
			data: {
				text: message,
			},
		})
		return response.data
	}
	async getMessageToChatGPT(id, textId) {
		const response = await request({
			url: `/monitoring/chatgpt_chat/${id}/text/${textId}/`,
			method: "get",
		})
		return response.data
	}
	async getMessagesByChayId(id) {
		const response = await request({
			url: `/monitoring/chatgpt_chat/${id}/text/`,
			method: "get",
		})
		return response.data
	}
	async getChatLimit() {
		const response = await request({
			url: `/monitoring/chatgpt_chat/limits/`,
			method: "get",
		})
		return response.data
	}
	async getKeywordStatByPeriod({period = 365, id, extra_fields = "dynamic"}) {
		const response = await request({
			url: "/wb_dynamic/keywords_stat/",
			method: "get",
			params: {
				period,
				keyword_ids: id,
				extra_fields,
			},
		})

		return response.data
	}
}

export default API
