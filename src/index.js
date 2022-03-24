import axios from 'axios';
import qs from 'qs';
const defaultTimeout = 8000;
export function WingAxios({
  baseURL = '', // 请求地址的BASEURL
  timeout = defaultTimeout, // TIMEOUT
  withCredentials = false,
  contentType,
  loadingTips = { start: () => {}, finish: () => {}, error: () => {} },
} = {}) {
  let options = { baseURL, timeout, withCredentials };
  if (contentType) options['headers'] = { 'Content-Type': contentType };

  this.options = options;
  this.loadingTips = loadingTips;
}
WingAxios.prototype.create = function () {
  let instance = axios.create(this.options);
  const { start, finish, error } = this.loadingTips;
  // Request interceptor
  instance.interceptors.request.use(
    function (config) {
      const { params, data, url } = config;
      const _params = params || qs.stringify(data) || {};
      config.url = url.replace(/\{\w+\}/gi, (matched) => {
        const key = matched.replace(/\{?\}?/gi, '');
        const value = _params[key];
        return value;
      });
      start && start(config);
      return config;
    },
    function (err) {
      error && error(err);
      return Promise.reject(err);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    function (response) {
      finish && finish(response);
      return response;
    },
    function (err) {
      error && error(err);
      return Promise.reject(err);
    }
  );

  return instance;
};

function toQueryString(query) {
  if (!query) return '';
  let result = [];
  for (const key in query) {
    if (Object.hasOwnProperty.call(query, key)) {
      result.push(`${key}=${query[key]}`);
    }
  }
  return result.length > 0 ? '?' + result.join('&') : '';
}
function isFunction(value) {
  // FIXME:
  return typeof value === 'function';
}
function isObject(value) {
  // FIXME:
  return typeof value === 'object';
}
export function createWingService({
  host = '', // 请求地址的HOST
  baseURL = '', // 请求地址的BASEURL
  timeout = defaultTimeout, // TIMEOUT
  withCredentials = true,
  contentType,
  loadingTips = { start: () => {}, finish: () => {}, error: () => {} },
  apiUrls = {},
  token,
  commonParams = {},
  commonQuery = {},
  onError,
}) {
  const wingAxios = new WingAxios({
    baseURL,
    timeout,
    withCredentials,
    contentType,
    loadingTips,
  });
  let instance = wingAxios.create();
  let apis = {};
  for (let key in apiUrls) {
    // putRepo: 'PUT,/repos/{id}'
    let apiInfo = apiUrls[key].split(',');
    const method = apiInfo[0] ? apiInfo[0].toLowerCase() : 'get';
    apis[key] = (data = {}, isFormPost) => {
      /* ****************************** URL-QUERY ****************************** */
      // 如果是函数(动态数据)，则在每次调用的时候再获取最新的
      let queryString = '';
      if (isFunction(commonQuery)) {
        queryString = toQueryString(commonQuery());
      } else if (isObject(commonQuery)) {
        queryString = toQueryString(commonQuery);
      }
      const url = `${host}${apiInfo[1]}${queryString}`;

      /* ****************************** PARAMS ****************************** */
      // 如果是函数(动态数据)，则在每次调用的时候再获取最新的
      let _commonParams = {};
      if (isFunction(commonParams)) {
        _commonParams = commonParams();
      } else if (isObject(commonParams)) {
        _commonParams = commonParams;
      }
      let params = { ..._commonParams, ...data };
      let arg;
      if (method === 'post') {
        // form提交的时候不做处理
        arg = isFormPost ? data : JSON.stringify(params);
      } else if (method === 'put' || method === 'patch') {
        arg = JSON.stringify(params);
      } else {
        arg = { params };
      }
      /* ****************************** HEADERS-TOKEN ****************************** */
      // 更新instance的headers
      // token属性优先配置
      // 没有指定token属性时再根据tokenName属性获取Cookie中的token
      if (token) {
        // token 可以是token字符串, 也可以是获取token的函数
        if (typeof token === 'string') {
          instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        if (typeof token === 'function') {
          instance.defaults.headers.common['Authorization'] = `Bearer ${token()}`;
        }
      }

      return instance[method](url, arg)
        .then((response) => response.data)
        .catch((error) => onError?.(error));
    };
  }
  return apis;
}
export default WingAxios;
