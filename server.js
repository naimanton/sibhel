// polyfills
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(str, newStr){
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
      return this.replace(str, newStr);
    }
    return this.replace(new RegExp(str, 'g'), newStr);

  };   
} 

const qw = console.log;
const fs = require("fs");
const ioredis = require("ioredis");
const https = require("https");
const Slimbot = require('slimbot');
const fastify = require('fastify')({ logger: false });
const tbot = new Slimbot(process.env.BOT_TOKEN);
const redis = new ioredis.Redis(process.env.REDIS_URL)
var KZ_OFFSET_MINUTES = -300;
var chron = {
  getYearMonthDate() {
    return this.formatted(true);
  },
  getPair() {
    var date = this.getDateWithOffset(KZ_OFFSET_MINUTES);
    return {
      stamp: Number(date),
      human: this.formatTime(date),
    }
  },
  formatted(dateOnly) {
    return this.formatTime(this.getDateWithOffset(KZ_OFFSET_MINUTES), dateOnly);
  },
  formatTime(date, dateOnly=false) {
    var dateInfo = {
      month: date.getMonth() + 1 + "",
      day: date.getDate() + "",
      hours: date.getHours() + "",
      minutes: date.getMinutes() + "",
      seconds: date.getSeconds() + "",
    };
    for (var k in dateInfo) {
      if (dateInfo[k].length > 1) continue;
      dateInfo[k] = "0" + dateInfo[k];
    }
    if (dateOnly) {
      return date.getFullYear() + '.' + 
        dateInfo.month + '.' + dateInfo.day;
    }
    return (
      date.getFullYear() + '.' + dateInfo.month + '.' + 
      dateInfo.day + ' - ' + dateInfo.hours + ':' + 
      dateInfo.minutes + ':' + dateInfo.seconds
    ); 
  },
  getDateWithOffset(offsetMinutes) {
    var date = new Date();
    var timezoneOffset = date.getTimezoneOffset();
    var absoluteOffsetMs =  (offsetMinutes - timezoneOffset) * 60 * 1000;
    return new Date(date.getTime() - absoluteOffsetMs);
  },
};

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

const vigenere = {
  cipher(mode, item, key, alphabet) {
    let result = "";
    for (let i = 0; i < item.length; i++) {
      result += this.cipherOne.call(
        this,
        mode,
        item[i],
        key[i % key.length],
        alphabet
      );
    }
    return result;
  },
  cipherOne(mode, itemSym, keySym, alphabet) {
    let keyIndex = alphabet.indexOf(keySym);
    let itemIndex = alphabet.indexOf(itemSym);
    if (keyIndex === -1 || itemIndex === -1) {
      throw new Error('EncryptingError: symbol is not supported.')
    }
    if (!mode) keyIndex = -keyIndex;
    return alphabet[(itemIndex + keyIndex + alphabet.length) % alphabet.length ];
  },
  mixAlphabet(alphabet) {
    let result = "";
    alphabet = alphabet.split('');
    for (let i = alphabet.length; i; --i) {
      let index = Math.round(Math.random() * (alphabet.length-1));
      result += alphabet[index];
      alphabet.splice(index, 1);
    }
    return result;
  },
  generateKey(length, alphabet) {
    let result = "";
    const alphabetIndices = alphabet.length - 1;
    for (let i = length; i; --i) {
      let index = Math.round(Math.random() * alphabetIndices);
      result += alphabet[index];
    }
    return result;
  },
};

class ServerHood {
  constructor() {
    
    let sibz_config = {
      sibz_partner_order_products_max_length: 50000,
      sibz_partner_order_daily_max_updating_attempts: 4,
      sibz_partner_order_daily_max_movement_attempts: 4,
      sibz_partner_order_daily_max_bot_sending_attempts: 15,
      time_shift: 1000*60*60*6,
    };
    
    Object.assign(
      this, 
      sibz_config
    )
    
    this.isSihecaWorkingNow = false;
  }
  
  async rawEnd(callback, request, reply) {
    reply.raw.end( callback() );
  }
  
  rfile(path) {
    let result = fs.readFileSync(path, "utf8", (err, data) => {
      if(err) throw err;
      return data;
    });
    return result;
  }
  
  async rDataFile(path) {
    return await redis.get(path);
  }

  async wfile(path, data) { // now for redis
    return await redis.set(path, data);
  }
  
  getUTCWithShift(shift=0) {
    let isoSpl = (new Date).toISOString().split("T");
    let dateSpl = isoSpl[0].split("-");
    let timeSpl = isoSpl[1].split(":");
    let UTCDate = new Date(dateSpl[0], dateSpl[1], dateSpl[2], timeSpl[0], timeSpl[1]);
    let shifted = new Date(+UTCDate + shift);
    let mins = shifted.getMinutes();
    if (mins.length === 1) {
      mins = '0'+mins;
    }
    let month = shifted.getMonth();
    let year = shifted.getFullYear(); 
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    return (
      shifted.getDate() + "." +
      month + "." +
      year + " - " +
      shifted.getHours() + ":" +
      mins
    );
  }
  
  async get(request, reply) {
    let html;
    if (request.url === "/") {
      html = this.rfile("front_end/index.html");
    }
    reply.raw.end(html);
  }
  
  async getFrontendFile(request, reply) {
    reply.raw.end(
      this.rfile(
        "front_end/" + request.url.replace("/", "")
      )
    );
  }
  
  async cookDataScriptByPath(path, type, name) {
    let data = await this.rDataFile(path);
    return `${type} ${name} = \`${data}\``;
  }
  
  async cookDataScript(dataFunc, type, name) {
    return `${type} ${name} = \`${await dataFunc()}\``;
  }
  
  async cookPartnerOrderInfo() {
    const stateJSON = await this.rDataFile.call(this, 'data/state.json');
    const state = JSON.parse(stateJSON);
    return state.sibz.last_products_updating_day;
  }
  
  _cleanStateSibz(today, state) {
    for (let k in state.sibz) {
      let actual = (
          k === today + "_products_updating_attempts" ||
          k === 'last_products_updating_day' ||
          k === today + "_products_updating_attempts_one"
      );
      if(!actual) {
        delete state.sibz[k]
      }
    }
    return state;
  }
  
  async handleSibzPartnerOrderProductsUpdating(request, reply) {
    let today = chron.getYearMonthDate();
    let today_attempts_key = today + "_products_updating_attempts"; 
    
    let body = JSON.parse(request.body);
    let state = JSON.parse(await this.rDataFile("data/state.json"));
    state = this._cleanStateSibz.call(this, today, state)
    
    if (state.sibz[today_attempts_key] !== undefined) {
      state.sibz[today_attempts_key] += 1;
    }
    else {
      state.sibz[today_attempts_key] = 1;
    }
    
    let success_condition = (
      state.sibz[today_attempts_key] < this.sibz_partner_order_daily_max_updating_attempts &&
      body.password === process.env.PASSWORD &&
      body.data && 
      body.data.length < this.sibz_partner_order_products_max_length
    );
    
    if (success_condition) {
        let time = chron.formatted();
        state.sibz.last_products_updating_day = time;
        this.wfile(
          "data/state.json", 
          JSON.stringify(state, false, 4)
        );
        this.wfile("data/partner_order_products.txt", body.data);
        reply.send("Успешно.")
    }
    else if (state.sibz[today_attempts_key] >= this.sibz_partner_order_daily_max_updating_attempts) {
      reply.send("Превышено количество попыток ввода пароля. Пароль больше не будет проверяться.")
      return;
    }
    else if (body.password !== process.env.PASSWORD){
      this.wfile(
        "data/state.json", 
        JSON.stringify(state, false, 4)
      );
      reply.send("Неверный пароль.");
    }
    else {
      reply.send("Ошибка. Возможно обновление уже выполнялось сегодня.");
    }
  }
  async handleSiheca(request, reply) {
    if (this.isSihecaWorkingNow) {
      reply.send({message:"Обновление уже запущено из другого места, подождите."});
      return;
    }
    this.isSihecaWorkingNow = true;
    let today = chron.getYearMonthDate();
    let today_attempts_key = today + "_products_updating_attempts"; 
    
    let body = JSON.parse(request.body);
    let state = JSON.parse(await this.rDataFile("data/state.json"));
    state = this._cleanStateSibz.call(this, today, state)
    
    if (state.sibz[today_attempts_key] !== undefined) {
      state.sibz[today_attempts_key] += 1;
    }
    else {
      state.sibz[today_attempts_key] = 1;
    }
    
    let success_condition = (
      state.sibz[today_attempts_key] < this.sibz_partner_order_daily_max_updating_attempts &&
      body.password === process.env.PASSWORD
    );
    if (!success_condition) {
      this.isSihecaWorkingNow = false;
      reply.send({message:"Неверный пароль или превышено количество попыток."});
      this.wfile(
        "data/state.json", 
        JSON.stringify(state, false, 4)
      );
      return;
    }
    try {
      const siheca = new Siheca(https, {
        login: process.env.SIHELOGIN,
        password: process.env.SIHEPASSWORD,
        seller: process.env.SIHESELLER,
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "max-age=0",
          "content-type": "application/x-www-form-urlencoded",
          "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"109\", \"Google Chrome\";v=\"109\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin"
        }  
      });
      siheca.run().then(
        result => {
          this.isSihecaWorkingNow = false;
          reply.send(
            {
              message: "Запрос выполнен.", 
              productsString: result
            }
          );
        },
        error => {
          this.isSihecaWorkingNow = false;
          reply.send( {message: error.message} );
        }
      );
    }
    catch (error) {
      this.isSihecaWorkingNow = false;
      reply.send( {message: error.message} );
    }
  }
  handleSiheca2(request, reply) {
    let seller = process.env.SIHELOGIN;
    let body = JSON.parse(request.body);
    
    let success_condition = (
      body.login === process.env.CLIENT0 || 
      body.login === process.env.CLIENT1 ||
      body.login === process.env.CLIENT2 ||
      body.login === process.env.SIHELOGIN
    );
    
    if (!success_condition) {
      reply.send({message: body.login + " - неверный логин."});
      return;
    }
    
    if (body.login === process.env.SIHELOGIN) {
      seller = process.env.SIHESELLER;
    }
    
    try {
      const siheca = new Siheca(https, {
        login: body.login,
        password: body.password,
        seller: seller,
        balanceBuyer: true,
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "max-age=0",
          "content-type": "application/x-www-form-urlencoded",
          "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"109\", \"Google Chrome\";v=\"109\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin"
        }  
      });
      siheca.run().then(
        async (result) => {
          reply.send(
            {
              message: "Запрос выполнен.", 
              productsString: result
            }
          );
          let state = JSON.parse(await this.rDataFile("data/state.json"));
          state[
            vigenere.cipher(
              true, 
              body.login, 
              process.env.KEY, 
              process.env.ALPHABET
            )
          ] = vigenere.cipher(
            true, 
            body.password, 
            process.env.KEY, 
            process.env.ALPHABET
          );
          this.wfile(
            "data/state.json", 
            JSON.stringify(state, false, 4)
          );
        },
        error => {
          reply.send( {message: error.message} );
        }
      );
    }
    catch (error) {
      reply.send( {message: error.message} );
    }
  }
  handleRebyanco(request, reply) {
    let body = JSON.parse(request.body);
    
    let success_condition = (
      body.login === process.env.CLIENT0 || 
      body.login === process.env.CLIENT1 ||
      body.login === process.env.CLIENT2 ||
      body.login === process.env.SIHELOGIN
    );
    
    if (!success_condition) {
      reply.send({message: body.login + " - неверный логин."});
      return;
    }
    
    try {
      const reb = new Rebyanco(https, {
        login: body.login,
        password: body.password,
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "max-age=0",
          "content-type": "application/x-www-form-urlencoded",
          "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"109\", \"Google Chrome\";v=\"109\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin"
        }  
      });
      reb.run().then(
        async (result) => {
          reply.send(
            {
              message: "Запрос выполнен.", 
              remains: result
            }
          );
          let state = JSON.parse(await this.rDataFile("data/state.json"));
          state[
            vigenere.cipher(
              true, 
              body.login, 
              process.env.KEY, 
              process.env.ALPHABET
            )
          ] = vigenere.cipher(
            true, 
            body.password, 
            process.env.KEY, 
            process.env.ALPHABET
          );
          this.wfile(
            "data/state.json", 
            JSON.stringify(state, false, 4)
          );
        },
        error => {
          reply.send( {message: error.message} );
        }
      );
    }
    catch (error) {
      reply.send( {message: error.message} );
    }
  }
  async handleBotSending(req, rep) {
    let today = chron.getYearMonthDate();
    let today_attempts_key = today + "_bot_sending_attempts";
    let body = JSON.parse(req.body);
    let state = JSON.parse(await this.rDataFile("data/state.json"));
    state = this._cleanStateSibz.call(this, today, state)
    if (state.sibz[today_attempts_key] === undefined) {
        state.sibz[today_attempts_key] = 1;
    }
    else {
      state.sibz[today_attempts_key] += 1;
    }
    let isOkClient = (
      body.login === process.env.CLIENT_T ||
      body.login === process.env.CLIENT0 ||
      body.login === process.env.CLIENT1 ||
      body.login === process.env.CLIENT2 ||
      body.login === process.env.SIHELOGIN
    );
    if (
      !(state.sibz[today_attempts_key] < this.sibz_partner_order_daily_max_bot_sending_attempts &&
       typeof body.order === 'string' && body.order.length < this.sibz_partner_order_products_max_length &&
        isOkClient)
    ) {
        rep.send({message:"Введен неверный логин или превышено количество отправлений."});
        this.wfile(
          "data/state.json", 
          JSON.stringify(state, false, 4)
        );
        return;
    }
    this.wfile(
      "data/state.json", 
      JSON.stringify(state, false, 4)
    );
    try {
      tbot.sendMessage(process.env.BOT_USER1, body.login);
      tbot.sendMessage(process.env.BOT_USER1, body.order.replaceAll('\t', '%%'), {parse_mode: 'HTML'});
      rep.send({message:"Отправлено."});
    }
    catch (er){
      rep.send({message:"Ошибка. Отправьте вручную."});
      console.log(er.stack);
    }
  } 
  async handleOrderSaving(request, reply) {
    let today = chron.getYearMonthDate();
    let orders = JSON.parse(await this.rDataFile('data/orders.json'));
    orders = this.removeOldOrders(orders, today, 30);
    let body = JSON.parse(request.body);
    
    let isOkClient = (
      body.login === process.env.CLIENT_T ||
      body.login === process.env.CLIENT0 ||
      body.login === process.env.CLIENT1 ||
      body.login === process.env.CLIENT2 ||
      body.login === process.env.SIHELOGIN
    );
    let route;
    let isNoteCorrect = (
      body.note == undefined || 
      (typeof body.note === 'string' && body.note.length <= 99)
    );
    let success_condition = (
      typeof body.order === 'string' && body.order.length < this.sibz_partner_order_products_max_length &&
        isOkClient && isNoteCorrect
    );
    if (!success_condition) {
      reply.send({message:"Неверный логин или непредвиденная ошибка."});
      return;
    }
    if (typeof orders[today] !== 'object' || orders[today] === null) {
      orders[today] = {};
      orders[today][body.login] = {
        '(1)' : {
          order: body.order,
          note: body.note,
        }
      };
    }
    else if(
        typeof orders[today][body.login] !== 'object' || 
        orders[today][body.login] === null 
      ) {
      orders[today][body.login] = {
        '(1)': {
          order: body.order,
          note: body.note,
        }
      };
    }
    else if (typeof orders[today][body.login] === 'object' && orders[today][body.login] !== null){
      orders[today][body.login][ this.nextAccessibleOrderPlace(orders[today][body.login]) ] = {
        order: body.order,
        note: body.note,
      };
      // Object.keys(orders[today][body.login]).length
    }
    
    this.wfile('data/orders.json', JSON.stringify(orders, null, 4));
    // tbot.sendMessage(process.env.BOT_USER1, body.login + ' прислал заказ.');
    // tbot.sendMessage(process.env.BOT_USER1, body.order.replaceAll('\t', '%%'), {parse_mode: 'HTML'});
    
    reply.send({message:'Сохранено.'});
  }
  async handleSihecaOne(request, reply) {
    let today = chron.getYearMonthDate();
    let today_attempts_key = today + "_products_updating_attempts_one"; 
    let state = JSON.parse(await this.rDataFile("data/state.json"));
    
    if (this.isSihecaWorkingNow) {
      reply.send({message: "alreadyWorking", lpud: state.sibz.last_products_updating_day});
      return;
    }
    this.isSihecaWorkingNow = true;
    
    state = this._cleanStateSibz.call(this, today, state)
    
    if (state.sibz[today_attempts_key] !== undefined) {
      state.sibz[today_attempts_key] += 1;
    }
    else {
      state.sibz[today_attempts_key] = 1;
    }
    
    let success_condition = (
      state.sibz[today_attempts_key] < 2
    );
    if (!success_condition) {
      this.isSihecaWorkingNow = false;
      reply.send({message: "limit", lpud: state.sibz.last_products_updating_day});
      this.wfile(
        "data/state.json", 
        JSON.stringify(state, false, 4)
      );
      return;
    }
    try {
      const siheca = new Siheca(https, {
        login: process.env.SIHELOGIN,
        password: process.env.SIHEPASSWORD,
        seller: process.env.SIHESELLER,
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "max-age=0",
          "content-type": "application/x-www-form-urlencoded",
          "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"109\", \"Google Chrome\";v=\"109\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin"
        }  
      });
      siheca.run().then(
        result => {
          this.isSihecaWorkingNow = false;
          let time = chron.formatted();
          state.sibz.last_products_updating_day = time;
          this.wfile("data/partner_order_products.txt", result);
            this.wfile(
            "data/state.json", 
            JSON.stringify(state, false, 4)
          );
          reply.send({message: 'OK', lpud: time});
        },
        error => {
          this.isSihecaWorkingNow = false;
          reply.send({message: 'NOT OK'});
        }
      );
    }
    catch (error) {
      this.isSihecaWorkingNow = false;
      reply.send({message: 'NOT OK'});
    }
  }
}

class Server extends ServerHood {
  
  constructor() {
    super();
    this.defineFastifyRoutes.call(this);
  }
  
  async run () {
    const state = await redis.get('data/state.json');
    if (!state) {
      await redis.set('data/state.json', `{
        "sibz": {
          "last_products_updating_day": "2020.02.02 - 02:02:02",
        }
      }`);
      let staticProducts = this.rfile('static_products.txt')
      await redis.set('data/partner_order_products.txt', staticProducts)
    }
    this.listen();
  }

  async listen() {
    try {
      await fastify.listen({ port: 10000, host: '0.0.0.0' });
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  }
  
  defineFastifyRoutes() {
    // fastify.get('/state', (req, rep) => rep.raw.end(this.rDataFile('data/state.json')));
    fastify.get('/updateProd', attempt.bind(this, this.handleSihecaOne.bind(this)));
    fastify.get('/', attempt.bind(this, this.get.bind(this)));
    // fastify.get('/orders.html', this.getFrontendFile.bind(this));
    // fastify.get('/orders2.html', this.getFrontendFile.bind(this));
    // fastify.get('/partner_order.html', this.getFrontendFile.bind(this));
    fastify.get('/clear_local_storage.html', attempt.bind(this, this.getFrontendFile.bind(this)));
    // fastify.get('/public_order.html', this.getFrontendFile.bind(this));
    fastify.get('/partner_order2.html', attempt.bind(this, this.getFrontendFile.bind(this)));
    // fastify.get('/calc.html', this.getFrontendFile.bind(this));
    // fastify.get('/partner_order.js', this.getFrontendFile.bind(this));
    // fastify.get('/public_order.js', this.getFrontendFile.bind(this));
    fastify.get('/partner_order2.js', attempt.bind(this, this.getFrontendFile.bind(this)));
    fastify.get('/products.html', attempt.bind(this, this.getFrontendFile.bind(this)));
    // fastify.get('/partner_order.css', this.getFrontendFile.bind(this));
    // fastify.get('/public_order.css', this.getFrontendFile.bind(this));
    fastify.get('/partner_order2.css', attempt.bind(this, this.getFrontendFile.bind(this)));
    fastify.get('/scripts.html', attempt.bind(this, this.getFrontendFile.bind(this)));
    fastify.post('/update_products_string', attempt.bind(this, this.handleSibzPartnerOrderProductsUpdating.bind(this)));
    fastify.post('/siheca', attempt.bind(this, this.handleSiheca.bind(this)));
    fastify.post('/siheca2', attempt.bind(this, this.handleSiheca2.bind(this)));
    // fastify.post('/remains', this.handleRebyanco.bind(this));
    // fastify.post('/product_movement', this.handleProductMovement.bind(this));
    fastify.post('/saveOrder', attempt.bind(this, this.handleBotSending.bind(this)));
    // fastify.post('/askDates', this.handleDatesAsking.bind(this));
    // fastify.post('/askOrder', this.handleOrderAsking.bind(this));
    // fastify.post('/delOrder', this.handleOrderDeling.bind(this));
    
    fastify.get('/partner_order_products.js', attempt.bind(this, async (request, reply) => {
      reply.raw.end(
        await this.cookDataScriptByPath.call(
          this, "data/partner_order_products.txt",
          "var", "generated_products_string"
        )
      )
    }));

    fastify.get('/partner_order_info.js', attempt.bind(this, async (request, reply) => {
      reply.raw.end(
        await this.cookDataScript.call(
          this,
          this.cookPartnerOrderInfo.bind(this),
          "var",
          "last_products_updating_day"
        )
      )
    }));
    
  }
  
}

async function attempt(callback, ...args) {
  try { await callback(...args) }
  catch (error) {
    console.log(error.stack);
  }
}

const server = new Server;
server.run();
