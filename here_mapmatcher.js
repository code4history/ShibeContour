import properties from "properties"
import hmacSHA256 from 'crypto-js/hmac-sha256.js'
import Base64 from 'crypto-js/enc-base64.js'
import fetch from 'node-fetch'
import {promises as fs} from "node:fs"

const getProps = async () => {
  return new Promise((res) => {
    properties.parse("./credentials.properties", {path: true},  function (error, data) {
      res(data)
    })
  })
}

const getToken = async (props) => {
  const nonce = `${performance.now()}`
  const timestamp = Math.floor((new Date()).getTime() / 1000)

  const parameters = [
    "grant_type=client_credentials",
    `oauth_consumer_key=${props["here.access.key.id"]}`,
    `oauth_nonce=${nonce}`,
    "oauth_signature_method=HMAC-SHA256",
    `oauth_timestamp=${timestamp}`,
    "oauth_version=1.0"
  ].join("&")
  const encoding_params = encodeURIComponent(parameters)
  const base_string = `POST&${encodeURIComponent(props["here.token.endpoint.url"])}&${encoding_params}`
  console.log(base_string)
  const signing_key = `${props["here.access.key.secret"]}&`

  const hmac_digest = encodeURIComponent(Base64.stringify(hmacSHA256(base_string, signing_key)))

  const headers = {
    "Authorization": `OAuth oauth_consumer_key="${props["here.access.key.id"]}",oauth_nonce="${nonce}",oauth_signature="${hmac_digest}",oauth_signature_method="HMAC-SHA256",oauth_timestamp="${timestamp}",oauth_version="1.0"`,
    "Cache-Control": "no-cache",
    "Content-Type": "application/x-www-form-urlencoded"
  }
  const body = `grant_type=client_credentials`

  const response = await fetch(props["here.token.endpoint.url"], {
    method: 'post',
    body,
    headers
  })
  return response.json()
}

const main_query = async () => {
  const props = await getProps()
  const body = await fs.readFile("gps/8DD83AC3-8B5A-4108-9CC0-2B78CF9936EC.kml", {encoding: "UTF-8"})
  const headers = {
    "Cache-Control": "no-cache",
    "Content-Type": "application/octet-stream"
  }
  const api_key = props["here.api_key"]
  //const api_key = props["here.access.key.id"]
  //const api_key = props["here.client.id"]
  const url = `https://routematching.hereapi.com/v8/calculateroute.json?routeMatch=1&mode=fastest;car;traffic:disabled&app_id=${api_key}&app_code=${props["here.access.key.secret"]}`
  console.log(url)

  const response = await fetch(url, {
    method: 'post',
    body,
    headers
  })
  const respond = await response.json()
  console.log(respond)

  //https://routematching.hereapi.com/2/calculateroute.json?routeMatch=1&mode=fastest;car;traffic:disabled&attributes=SPEED_LIMITS_FCn(FROM_REF_SPEED_LIMIT,TO_REF_SPEED_LIMIT),LINK_ATTRIBUTE_FCn(ISO_COUNTRY_CODE)&app_id=BTp1kLd1IpptcQe2Ir3h&app_code=zMDPaKTAFR2g3wF3h4ok7w
}

const main_oauth = async () => {
  const props = await getProps()

  const token_data = await getToken(props)
  console.log(token_data)

  const body = await fs.readFile("gps/8DD83AC3-8B5A-4108-9CC0-2B78CF9936EC.kml", {encoding: "UTF-8"})
  const headers = {
    "Authorization": `Bearer ${token_data.access_token}`,
    "Cache-Control": "no-cache",
    "Content-Type": "application/octet-stream"
  }
  const api_key = props["here.api_key"]
  //const api_key = props["here.access.key.id"]
  //const api_key = props["here.client.id"]

  const response = await fetch(`https://routematching.hereapi.com/v8/calculateroute.json?routeMatch=1&mode=fastest;car;traffic:disabled&apiKey=${api_key}`, {
    method: 'post',
    body,
    headers
  })
  const respond = await response.json()
  console.log(respond)

  //GET /maptile/2.1/maptile/newest/normal.day/13/4400/2686/256/png8
  //Host: 1.base.maps.ls.hereapi.com
  //Authorization: Bearer eyJhbGceOyJSAMPLEiIsImN0eSISAMPLEt7VTFIllwIM0cKNCjN2WCCTqlwEEmk-t3gx1BpqUFoeBSAMPLEvhj8nl-RBGcyoljY...
  //Cache-Control: no-cache

  //https://fleet.api.here.com/2/calculateroute.json?routeMatch=1&mode=fastest;car;traffic:disabled&app_id=BTp1kLd1IpptcQe2Ir3h&app_code=zMDPaKTAFR2g3wF3h4ok7w
}

//main_query()
main_oauth()



















