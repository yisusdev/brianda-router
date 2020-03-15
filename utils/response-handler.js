/**
 * @description Response handler module to build a standard response.
 * @type {{success, failure}}
 */
const ResponseHandler = (() => {

  /**
   * @description Function to build a response
   * @param statusCode Status code to set on response
   * @param data If exist data to send
   * @param headers Headers to response
   * @private
   */
  const _buildResponse = (statusCode, data, headers = {}) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
    ...headers
},
  body: JSON.stringify(data)
});

return {
  response: _buildResponse
};
})();

module.exports = ResponseHandler;