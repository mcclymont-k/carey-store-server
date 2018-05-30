const express = require('express')
const request = require('request')
const squareConnect = require('square-connect')
const cors = require('cors')
const randomize = require('randomatic')
const bodyParser = require('body-parser')

const app = express()
app.use(cors())
app.use(bodyParser())


const defaultClient = squareConnect.ApiClient.instance;
let oauth2 = defaultClient.authentications['oauth2']
oauth2.accessToken = process.env.SQUARE_UP_ACCESS_TOKEN

let dataBody = {}
let locationsId = 1
let itemList = {}
let categoryList = {}
let checkoutData = {
  idempotency_key: 0,
  ask_for_shipping_address: true,
  merchant_support_email: 'mcclymont.kieran@gmail.com',
  order: {
    reference_id: '4',
    line_items: []
  }
}

app.get('/items', (req, res) => res.send(itemList))
app.get('/categoryList', (req, res) => res.send(categoryList))
app.post('/checkout', (req, res) => {
  dataBody = req.body
  checkoutData.order.line_items = dataBody
  res.send('done')
})
app.get('/checkout', (req, res) => {
  let checkoutRequest = new squareConnect.CreateCheckoutRequest()
  let idempotency_key = randomize('Aa0', 6)
  checkoutRequest.idempotency_key = idempotency_key
  checkoutRequest.order = checkoutData.order
  let apiInstance = new squareConnect.CheckoutApi()
  apiInstance.createCheckout(locationsId, checkoutRequest)
  .then(function(data) {
    let URL = data.checkout.checkout_page_url
    res.redirect(URL)
  }, function(error) {
    console.error(error);
  });
})

request('https://connect.squareup.com/v2/catalog/list',
  {'auth': {
    'bearer': process.env.SQUARE_UP_ACCESS_TOKEN
  }},
    (error, response, body) => {
      catalogData = JSON.parse(body)
      itemList = catalogData.objects.filter(object => object.type == "ITEM")
  })

  request('https://connect.squareup.com/v2/catalog/list',
    {'auth': {
      'bearer': process.env.SQUARE_UP_ACCESS_TOKEN
    }},
      (error, response, body) => {
        catalogData = JSON.parse(body)
        categoryList = catalogData.objects.filter(object => object.type == "CATEGORY")
    })

  let locationsApiRequest = new squareConnect.LocationsApi();
  locationsApiRequest.listLocations().then(function(data) {
    locationsId = data.locations[0].id;
  }, function(error) {
    console.error(error);
  });


module.exports = app;
app.listen(process.env.PORT || 8081)
