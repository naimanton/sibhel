class Rebyanco { // Remains by analog code
  constructor(https, config) {
    this.https = https;
    this.config = config;
    this.errors = {
      noLoginInputNameRegExpMatch: new Error("Атрибут name не был извлечен со страницы входа"),
      loginFailed: new Error("Ответ на авторизацию не 302"),
      getLoginPageFailed: new Error("Страница авторизации не ответила"),
      remainsPageIsNotOk: new Error("Страница остатков не ответила"),
      remainsParsing: new Error("Ошибка считывания остатков"),
    };
    this.instantRedirectCode = 302;
  }
  request({ url, method, headers, body }) {
    return new Promise((resolve, reject) => {
      const request = this.https.request(url, { method, headers }, (response) => {
        response.setEncoding("utf8");
        if (!(response.statusMessage === "OK")) {
          resolve({
            data: null,
            response
          });
        }
        let data = "";
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          resolve({
            data,
            response
          });
        });
      });
      request.write(body);
      request.on('error', (e) => {
        reject(e);
      });
      request.end();
    });
  }
  async run() {
    await this.login.call(this);
    const remainsPage = await this.getRemainsPage.call(
      this, this.getVisualDate(this.getDateForTimezone(7))
    );
    if (remainsPage.data === null) {
      throw this.remainsPageIsNotOk;
    }
    return this.parseRemainsPage.call(this, remainsPage.data);
  }
  async login() {
    const loginPage = await this.getLoginPage.call(this);
    if (loginPage.data === null) {
      throw this.errors.getLoginPageFailed;
    }
    const loginInputName = this.extractLoginInputName.call(this, loginPage.data);
    await this.hookLoggedInCookie.call(this, loginInputName);
    Object.assign(this.config.headers, { cookie: this.cookie });
  }
  async getLoginPage() {
    return await this.request.call(this, {
      url: "https://ru.siberianhealth.com/ru/login/",
      method: "GET",
      headers: this.config.headers,
      body: ""
    });
  }
  extractLoginInputName(loginPageData) {
    const loginInputNameRegExp = /name="login[\d]+"/;
    const loginInputNameMatchResults = loginPageData.match(loginInputNameRegExp);
    if (loginInputNameMatchResults === null) {
      throw this.errors.noLoginInputNameRegExpMatch;
    }
    const rawLoginInputName = loginInputNameMatchResults[0];
    const loginInputName = 
      rawLoginInputName
      .replace("name=\"", "")
      .replace("\"", "");
    return loginInputName;
  }
  async hookLoggedInCookie(loginInputName) {
    const logInResult = await this.request.call(this, {
      url: "https://ru.siberianhealth.com/ru/login/",
      method: "POST",
      headers: this.config.headers,
      body: loginInputName +
        "=" +
        this.config.login +
        "&password=" +
        this.config.password +
        "&act=login"
    });
    if (logInResult.response.statusCode !== this.instantRedirectCode) {
      throw this.errors.loginFailed;
    }
    this.cookie = logInResult.response.headers["set-cookie"];
  }
  async getRemainsPage(date) {
    return await this.request.call(this, {
      url: "https://kz.siberianhealth.com/ru/store/saldo/index/analog/",
      method: 'POST',
      headers: this.config.headers,
      body: 'type=all&date=' + date,
    });
  }
  parseRemainsPage(html) {
    const regexp = /<td align="center">(.+)<\/td>\n\s+<td align="left">(.+)<\/td>\n\s+<td align="center">(.+)<\/td>/g;
    const match = [...html.matchAll(regexp)];
    if (match.length < 1) {
    	throw this.errors.remainsParsing;
    }
    const result = [];
    for (let line of match) {
    	result.push([
    		line[1], line[2], line[3]
    	]);
    }
    return result;
  }
  getDateForTimezone(tzHours) {
    var date = new Date();
    return new Date(+date.getTimezoneOffset() * 60 * 1000 + +date) + (tzHours * 3600 * 1000);
  }
  getVisualDate(ms) {
    var date = new Date(ms);
    var day = date.getDate();
    var month = date.getMonth();
    if (day.length < 2) {
      day = '0' + day;
    }
    if (month === 0) {
      month = 12;
    }
    if (month.length < 2) {
      month = '0' + month;
    }
    return  day + '.' + month + '.' + date.getFullYear();  
  }
}
module.exports = Rebyanco;