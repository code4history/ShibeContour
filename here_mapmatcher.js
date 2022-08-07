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

const main = async () => {
  //const datetime = "2022-07-16 09_53_11"
  //const datetime = "2022-07-17 07_57_39"
  const datetime = "2022-07-18 09_43_23"
  const props = await getProps()

  const token_data = await getToken(props)
  console.log(token_data)

  const body = await fs.readFile(`gps/${datetime}.gpx`, {encoding: "UTF-8"})
  const headers = {
    "Authorization": `Bearer ${token_data.access_token}`,
    "Cache-Control": "no-cache",
    "Content-Type": "application/octet-stream"
  }

  const response = await fetch("https://routematching.hereapi.com/v8/match/routelinks?routeMatch=1&mode=fastest;pedestrian;traffic:disabled", {
    method: 'post',
    body,
    headers
  })
  const respond = await response.json()

  await fs.writeFile(`match/${datetime}.json`, JSON.stringify(respond, null, 1))
}

main()



















