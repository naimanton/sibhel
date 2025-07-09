class Siheca {
  constructor(https, config) {
    this.linkVersion = 1;
    this.links = [
      {
        loginPage: "https://ru.siberianhealth.com/ru/login/",
        showcaseNew: "https://kz.siberianhealth.com/ru/store/header/order/showcase/new/",
        showcaseSeller: "https://kz.siberianhealth.com/ru/store/header/order/showcase/seller/",
        showcaseSearch: "https://kz.siberianhealth.com/ru/store/header/order/showcase/search/",
      },
      {
        loginPage: "https://store.siberianhealth.com/kz-ru/login/",
        showcaseNew: "https://store.siberianhealth.com/kz-ru/header/order/showcase/new/",
        showcaseSeller: "https://store.siberianhealth.com/kz-ru/header/order/showcase/seller/",
        showcaseSearch: "https://store.siberianhealth.com/kz-ru/header/order/showcase/search/",
      },
    ]
    this.https = https;
    this.config = config;
    this.errors = {
      noLoginInputNameRegExpMatch: new Error("Атрибут name не был извлечен со страницы входа"),
      loginFailed: new Error("Ответ на авторизацию не 302"),
      getLoginPageFailed: new Error("Страница авторизации не ответила"),
      sellerWasNotChosen: new Error("Ответ на выбор поставщика не 302"),
      fullCatalogWasNotGot: new Error("Запрос каталога не вернул данные"),
      cartIdWasNotExtractred: new Error("Не удалось извлечь cartId"),
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
    await this.getCatalog.call(this);
    return this.cookCatalog.call(this);
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
      url: this.links[this.linkVersion].loginPage,
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
      url: this.links[this.linkVersion].loginPage,
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
  async getCatalog() {
    let newShowcase = await this.getNewShowcase.call(this);
    if (newShowcase.response.statusCode === this.instantRedirectCode) {
      const showcaseSeller = await this.chooseSeller.call(this);
      if (showcaseSeller.response.statusCode !== this.instantRedirectCode) {
        throw this.errors.sellerWasNotChosen;
      }
      newShowcase = await this.getNewShowcase.call(this);
    }
    const cartId = this.extractCartId.call(this, newShowcase.data);
    const fullCatalog = await this.requestFullCatalog.call(this, cartId);
    if (fullCatalog.data === null) {
      throw this.errors.fullCatalogWasNotGot;
    }
    this.fullCatalog = JSON.parse(fullCatalog.data);
  }
  async getNewShowcase() {
    return await this.request.call(this, {
      url: this.links[this.linkVersion].showcaseNew,
      method: "GET",
      headers: this.config.headers,
      body: ""
    });
  }
  async chooseSeller() {
    return await this.request.call(this, {
      url: this.links[this.linkVersion].showcaseSeller,
      method: "POST",
      headers: this.config.headers,
      body: "seller=" + this.config.seller
    });
  }
  extractCartId(newShowcaseData) {
    const cartIdRegExp = /cart: {"id":\d+/;
    const cartIdRegExpMatchResults = newShowcaseData.match(cartIdRegExp);
    if (cartIdRegExpMatchResults === null) {
      throw this.errors.cartIdWasNotExtractred;
    }
    const rawCartId = cartIdRegExpMatchResults[0];
    const cartId = rawCartId.replace("cart: {\"id\":", "");
    return +cartId;
  }
  async requestFullCatalog(cartId) {
    return await this.request.call(this, {
      url: this.links[this.linkVersion].showcaseSearch,
      method: "POST",
      headers: this.config.headers,
      body: "searchType=category&category=0&name=&code=&days=0&cartId=" + cartId
    });
  }
  cookCatalog() {
    let converted = ``;
    let balanceKey = 'balance';
    if (this.config.balanceBuyer) {
      balanceKey = 'balanceBuyer';
    }
    for (let position of this.fullCatalog) {
      // if (position.balance < 1) {
      //   continue;
      // }
      converted += (
        ("" + position.product.code).replace("\t", "") + "\t" +
        ("" + position.product.name).replace("\t", "").replace("`", "") + "\t" +
        ("" + position.point).replace("\t", "") + "\t" +
        ("" + position.price).replace("\t", "") + "\t" +
        ("" + position[balanceKey]).replace("\t", "") + "\t" +
        ("" + position.product.discountFactor).replace("\t", "") + "\n"
      );
    }
    return converted;
  }
}
module.exports = Siheca;