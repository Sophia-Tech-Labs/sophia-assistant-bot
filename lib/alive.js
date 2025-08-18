const axios = require('axios')

const keepAlive = () => {
 const myUrl = process.env.RENDER_EXTERNAL_URL
 if (myUrl) {
   setInterval(() => {
     axios.get(myUrl).catch(() => {})
   }, 10 * 60 * 1000)
 }
};
module.exports = keepAlive