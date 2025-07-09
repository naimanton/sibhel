"use strict";
(function () {
  try {
    const qw = console.log;
    const products_string = window["generated_products_string"];
    class ClientAPI {
      constructor(products) {
        this.elements = {
          info_td: document.getElementById("info-td"),
          botsend: document.getElementById("botsend"),
          sale_input: document.getElementById("sale-input"),
          change_calc: document.getElementById("change-calc"),
          change_calc_sum: document.getElementById("change-calc-sum"),
          change_calc_sale: document.getElementById("change-calc-sale"),
          change_calc_payment: document.getElementById("change-calc-payment"),
          change_calc_cash: document.getElementById("change-calc-cash"),
          change_calc_card: document.getElementById("change-calc-card"),
          change_calc_wished: document.getElementById("change-calc-wished"),
          change_calc_res: document.getElementById("change-calc-res"),
          display_change_calc: document.getElementById("display-change-calc"),
          sum_tr: document.getElementById("sum-tr"),
          add_row_button: document.getElementById("add-row-button"),
          product_input: document.getElementById("product-input"),
          // products_datalist: document.getElementById("products-datalist"),
          products_select: document.getElementById("products-select"),
          amount_input: document.getElementById("amount-input"),
          order_table: document.getElementById("order-table"),
          inputs_tr: document.getElementById("inputs-tr"),
          sum_amount_td: document.getElementById("sum-amount-td"),
          sum_coins_td: document.getElementById("sum-coins-td"),
          sum_price_td: document.getElementById("sum-price-td"),
          display_codes_button: document.getElementById("display-codes-button"),
          clear_all_button: document.getElementById("clear-all-button"),
          copy_textarea: document.getElementById("copy-textarea"),
          admin_panel: document.getElementById("admin-panel"),
          products_string_textarea: document.getElementById("products-string-textarea"),
          products_string_fetch_input_password: document.getElementById("products-string-fetch-input-password"),
          products_string_fetch_input_submit: document.getElementById("products-string-fetch-input-submit"),
          products_string_fetch_input_submit_1: document.getElementById("products-string-fetch-input-submit-1"),
          siheca_submit: document.getElementById("siheca-submit"),
          products_string_init_input_submit: document.getElementById("products-string-init-input-submit"),
  
        }
        this.sale = 0.9
        this.siheca = {
          timer: null,
          timeRemain: 90
        };
        this.placeLastProductsUpdatingDay.call(this);
        this._addProductsUpdateListener.call(this);
        this._handleLocalOrder.call(this)
        this.elements.products_select.insertAdjacentHTML(
          "beforeend",
          this._generateOptionsFromObjectProducts(products)
        )
        this._addProductsStringSubmitListener.call(this);
        this._addAdminPanelOpeningListener.call(this);
        this._addSihecaListener.call(this);
        this._addProductInputListener.call(this);
        this._addDisplayChangeCalcClickListener.call(this);
        window.addEventListener('storage', (e) => {
          if (e.key !== 'order_sum') return;
          document.location.pathname = document.location.pathname;
        });
        this.elements.change_calc_sale.addEventListener('input', this._calculateCashChange.bind(this));
        this.elements.change_calc_cash.addEventListener('input', this._calculateCashChange.bind(this));
        this.elements.change_calc_card.addEventListener('input', this._calculateCashChange.bind(this));
        this.elements.change_calc_wished.addEventListener('input', this._calculateCashChange.bind(this));
        this.elements.sale_input.addEventListener('keydown', (e) => {
          if (e.repeat) return;
          if (e.key === 'Enter') {
            alert("Новая скидка применяется к последующим позициям. Она не изменяет позиции добавленные ранее.");
            this.sale = 1 - +this.elements.sale_input.value / 100;
          }
        });
        this.elements.botsend.addEventListener('click', this.sendByBot.bind(this));
        
      }
      sendByBot() {
        if (!confirm('Внимательно проверьте заказ перед отправкой. Отправить заказ?')) return;
        this.postFetchObject(
          '/saveOrder', 
          {order: this._orderToGoogleTable.call(this), login: 'M11121'},
          (r) => alert(JSON.parse(r).message)
        )
      }
      _calculateCashChange() {
          this.elements.change_calc_payment.value = (
            +this.elements.change_calc_sum.value - 
            +this.elements.change_calc_sum.value * 
            +this.elements.change_calc_sale.value / 100
          ) || '';
          this.elements.change_calc_res.value = (
            +this.elements.change_calc_cash.value - 
            +this.elements.change_calc_wished.value + 
            +this.elements.change_calc_card.value - 
            +this.elements.change_calc_payment.value
          ) || '';
      }
      _addSihecaListener() {
        this.elements.siheca_submit.addEventListener(
          "click",
          this.handleSihecaFetching.bind(this)  
        )
      }
      _addProductInputListener() {
        this.elements.product_input.addEventListener("input", () => {
          this._clearProductsSelect.call(this);
          this.elements.products_select.innerHTML = (
            this._generateFilteredOptionsFromObjectProducts.call(
              this,
              products,
              this.elements.product_input.value
            )
          );
        });
      }
      _addProductsStringSubmitListener() {
        const callback = () => {
          let confirmation = confirm("Обновить продукт?");
          if (!confirmation) return;
          this.postFetchObject(
            "/update_products_string",
            {
              data: this.elements.products_string_textarea.value,
              password: this.elements.products_string_fetch_input_password.value,
            },
            (result) => {
              alert(result);
            }
          );
        };
        this.elements.products_string_fetch_input_submit.addEventListener(
          "click", 
          callback
        );
        this.elements.products_string_fetch_input_submit_1.addEventListener(
          "click", 
          callback
        );
      }
      _handleLocalOrder() {
        let local_order = localStorage.getItem("order") 
        if (local_order === null) {
          this.order = {}
          this.order_sum = {
            amount: 0,
            coins: 0,
            price: 0
          }
        }
        else {
          this.order = JSON.parse( local_order )
          this.order_sum = JSON.parse(localStorage.getItem("order_sum"))
          let order_rows = this._generateHTMLorderFromLocalStorage.call(this)
          this.elements.inputs_tr.insertAdjacentHTML("afterend", order_rows)
          this._addRemoveListeners.call(this)
          this.elements.sum_amount_td.innerHTML = this.order_sum.amount
          this.elements.sum_coins_td.innerHTML = "<i>" + this.order_sum.coins.toFixed(2) + "</i>";
          this.elements.sum_price_td.innerHTML = "<i><u>" + this.order_sum.price.toFixed(2) + "</u></i>";
          this.elements.change_calc_sum.value = this.order_sum.price.toFixed(2);
          this._calculateCashChange.call(this);
        }
      }
      _clearAll() {
        let answer = confirm("Удалить весь заказ и начать новый?")
        if (!answer) return
        for (let id in this.order) {
          let tr = document.getElementById("tr-" + id)
          tr.remove()
        }
        this.elements.sum_amount_td.innerHTML = 0
        this.elements.sum_coins_td.innerHTML = "<i>0</i>"
        this.elements.sum_price_td.innerHTML = "<i><u>0</u></i>"
        this.elements.change_calc_sum.value = 0;
        this._calculateCashChange.call(this);
        
        this.elements.copy_textarea.value = ""
        localStorage.removeItem("order");
        localStorage.removeItem("order_sum");
        this.order = {}
        this.order_sum = {
          amount: 0,
          coins: 0,
          price: 0
        }
      }
      _addRemoveListeners() {
        for (let id in this.order) {
          let tr = document.getElementById("tr-" + id)
          tr.addEventListener("click", this._removeProductFromOrder.bind(this, id))
        }
      }
      _generateHTMLorderFromLocalStorage() {
        let html = ""
        for (let id in this.order) {
          let explanation = {
            coins: "",
            price: "",
          };
          if (this.order[id].amount > 1) {
            explanation = {
              coins: `${this.order[id].amount} * ${this.order[id].coins}<br>= `,
              price: `${this.order[id].amount} * ${this.order[id].price}<br>= `,
            }; 
          }
          html += `
            <tr class="product-tr" id="tr-${id}">
              <td>${id}</td>
              <td>${this.order[id].name}</td>
              <td align="right">${this.order[id].amount}</td>
              <td align="right">${explanation.coins}<i>${(+this.order[id].coins * +this.order[id].amount).toFixed(2)}</i></td>
              <td align="right">${explanation.price}<i>${(+this.order[id].price * +this.order[id].amount).toFixed(2)}</i></td>
            </tr>
          `
        }
        return html
      }
      _removeProductFromOrder(id) {
        let answer = confirm("Удалить \"" + this.order[id].name + "\" из заказа?")
        if(!answer) return 

        this.order_sum.amount -= this.order[id].amount
        this.order_sum.coins -= +(this.order[id].coins * this.order[id].amount).toFixed(2)
        this.order_sum.price -= +(this.order[id].price * this.order[id].amount).toFixed(2)

        this.elements.sum_amount_td.innerHTML = this.order_sum.amount
        this.elements.sum_coins_td.innerHTML = "<i>" + this.order_sum.coins.toFixed(2) + "</i>";
        this.elements.sum_price_td.innerHTML = "<i><u>" + this.order_sum.price.toFixed(2) + "</u></i>";
        this.elements.change_calc_sum.value = this.order_sum.price.toFixed(2);
        this._calculateCashChange.call(this);
        
        

        delete this.order[id]
        localStorage.setItem("order", JSON.stringify(this.order) )
        localStorage.setItem("order_sum", JSON.stringify(this.order_sum))

        let tr = document.getElementById("tr-" + id)
        tr.remove()

      }
      _generateOptionsFromObjectProducts(products) {
        let options = ""
        for (let product in products) {
          options += `<option value="${product}">${products[product].name}</option>`
        }
        return options
      }
      _generateFilteredOptionsFromObjectProducts(products, filter) {
        let options = ""
        if (["", " "].includes(filter)) {
          for (let product in products) {
            options += `<option value="${product}">${products[product].name}</option>`
          }
        }
        else {
          for (let product in products) {
            if (products[product].name.toLowerCase().includes(filter.toLowerCase())) {
              options += `<option value="${product}">${products[product].name}</option>`
            }
          }
        }
        return options;
      }
      _clearProductsSelect() {
        this.elements.products_select.innerHTML = "";
      }
      _clearInputs() {
        this.elements.amount_input.value = 1
        this.elements.copy_textarea.value = ""
      }
      _addNewRow(e){
        let id = this.elements.products_select.selectedOptions[0].value;
        let vals = this._validateValues.call(this, id)
        if (vals === undefined) return;

        /* create new or update existing order ID*/
        if (this.order[id]) {
          alert(
            "Продукт " + '"' + products[id].name + '"' + " уже добавлен в заказ. "+
            "Если необходимо изменить его количество, удалите его и добавьте, указав верное количество."
          );
          return
        }
        else this.order[id] = vals;

        /* change sum */
        this.order_sum.amount += vals.amount
        this.order_sum.coins += vals.coins * vals.amount
        this.order_sum.price += vals.price * vals.amount

        this.elements.sum_amount_td.innerHTML = this.order_sum.amount
        this.elements.sum_coins_td.innerHTML = "<i>" + this.order_sum.coins.toFixed(2) + "</i>";
        this.elements.sum_price_td.innerHTML = "<i><u>" + this.order_sum.price.toFixed(2) + "</u></i>";
        this.elements.change_calc_sum.value = this.order_sum.price.toFixed(2);
        this._calculateCashChange.call(this);
        
        


        /* update localStorage */
        localStorage.setItem("order", JSON.stringify(this.order))
        localStorage.setItem("order_sum", JSON.stringify(this.order_sum))

        /* visualize */
        let tr_html = this._generateHTMLrow.call(this, vals, id)
        this.elements.inputs_tr.insertAdjacentHTML("afterend", tr_html)

        /* handle removing */
        let tr = document.getElementById("tr-" + id)
        tr.addEventListener("click", this._removeProductFromOrder.bind(this, id))

        this._clearInputs.call(this)
        this.elements.product_input.focus()
      }
      _validateValues(id) {
        let vals = {}
        if (!products[id]) {
          alert("Выберите продукт из списка!")
          this._clearInputs.call(this)
          return
        }
        vals.amount = Math.abs( 
          Math.round(
            this.elements.amount_input.value
          )
        )
        vals.name = products[id].name
        vals.coins = products[id].coins
        vals.price = +(products[id].price * this.sale).toFixed(2)
        return vals
      }
      _generateHTMLrow(vals, id) {
        let explanation = {
          coins: "",
          price: "",
        };
        if (vals.amount > 1) {
          explanation = {
            coins: `${vals.amount} * ${vals.coins}<br>= `,
            price: `${vals.amount} * ${vals.price}<br>= `,
          }; 
        }
        let tr = `
          <tr class="product-tr" id="tr-${id}">
            <td>${id}</td>
            <td>${vals.name}</td>
            <td align="right">${vals.amount}</td>
            <td align="right">${explanation.coins}<i>${(+vals.coins * +vals.amount).toFixed(2)}</i></td>
            <td align="right">${explanation.price}<i>${(+vals.price * +vals.amount).toFixed(2)}</i></td>
          </tr>
        `
        return tr
      }
      _orderToGoogleTable() {
        let res = `Код\tПродукт\tКоличество\tБаллы\tЦена\n`
        for (let id in this.order) {
          res += id + 
            "\t" + 
            this.order[id].name + 
            "\t" + 
            this.order[id].amount + 
            "\t" +
            this.order[id].coins +
            "\t" +
            this.order[id].price +
            "\n"
        }
        res += "Итог:" + 
          "\t\t" + 
          this.order_sum.amount +
          "\t" +
          this.order_sum.coins.toFixed(2) +
          "\t" +
          this.order_sum.price.toFixed(2)

        return res
      }
      _displayCodes() {
        this.elements.copy_textarea.value = this._orderToGoogleTable.call(this)
        this.elements.copy_textarea.select()
        document.execCommand("copy")
      }
      _addProductsUpdateListener() {
        this.elements.products_string_init_input_submit.addEventListener("click", () => {
          let new_raw_products_string = this.elements.products_string_textarea.value;
          this.elements.products_string_textarea.value = "Загрузка...";
          setTimeout(
            () => {
              let new_clear = this._cleanProductsString.call(this, new_raw_products_string);
              let compared = this._handleProductsStringsComparing.call(this, products_string, new_clear);
              let comparing_table = this._comparingResultToTable.call(this, compared, "products_comparing");
              document.body.insertAdjacentHTML("beforeend", comparing_table);
              this.elements.products_string_textarea.value = new_clear;
            },
            3000
          )
        })
      }
      _addAdminPanelOpeningListener() {
        this.elements.copy_textarea.addEventListener("keydown", (e) => {
          if (e.key === 'Enter' && this.elements.copy_textarea.value === "!") {
            this.elements.admin_panel.style.display = "table";

          }
        });
      }
      _cleanProductsString(str) { 
        let t = "\t", n = "\n";
        let result = ``;
        var json = JSON.parse(str);
        for (let line of json) {
          if (+line.balance < 1) continue;
          result += ("" + line.product.code).replace("\t", "") + "\t" +
            ("" + line.product.name).replace("\t", "") + "\t" +
            ("" + line.point).replace("\t", "") + "\t" +
            ("" + line.price).replace("\t", "") + "\t" +
            ("" + line.balance).replace("\t", "") + "\n"
        }
        return result;
      }
      _handleProductsStringsComparing(old_str, new_str) {
        let t = "\t", n = "\n";
        let old_splitted = old_str.split(n);
        let new_splitted = new_str.split(n);
        let new_splitted_read_only = new_splitted.slice();
        let new_splitted_codes = new_splitted.map( (item) => item.split(t)[0] );
        let products = {
          new_: [],
          same: [],
          changed: [],
          deleted: []
        };
        for (let line of old_splitted) {
          if (new_splitted.includes(line)) {
            products.same.push({line, status: "same"});
            new_splitted[new_splitted.indexOf(line)] = null;
            continue;
          }
          let line_splitted = line.split(t);
          if (new_splitted_codes.includes(line_splitted[0])) {
            let index = new_splitted_codes.indexOf(line_splitted[0]);
            let same_code_new_line_spl = new_splitted_read_only[index].split(t);
            if (
              same_code_new_line_spl[1] === line_splitted[1] &&
              same_code_new_line_spl[2] === line_splitted[2] &&
              same_code_new_line_spl[3] === line_splitted[3]
            ) {
              products.same.push({line, status: "same"});
              new_splitted[index] = null;
              continue;
            }
            products.changed.push({
              line: new_splitted_read_only[index], 
              status: "changed"
            })
            products.changed.push({line, status: "old"});
            new_splitted[index] = null;
            continue;
          }
          products.deleted.push({line, status: "deleted"});
        }
        if (new_splitted.includes("")) {
          new_splitted.splice(new_splitted.indexOf(""), 1);
        }
        new_splitted.forEach(
          (item) => {
            if (item !== null) {
              products.new_.push({line: item, status: "new"})
            }
          }
        );
        let result = [].concat(
          products.new_,
          products.changed,
          products.deleted,
          products.same
        ); 
        return result
      }
      _comparingResultToTable(compared, table_id) {
        let html = `
        <table id="${table_id}">
            <tr class="comparing-same-tr">
              <td>№</td>
              <td>Код</td>
              <td>Наименование</td>
              <td>Баллы</td>
              <td>Стоимость</td>
            </tr>
        `;
        let i = 0;
        for (let row of compared) {
          let line_splitted = row.line.split("\t");
          if (line_splitted[0] === "") continue;
          let id;
          if (!["deleted", "old"].includes(row.status)) {
            i++;
            id = i;
          }
          else {
            id = "";
          }
          html += `
            <tr class="comparing-${row.status}-tr">
              <td>${id}</td>
              <td>${line_splitted[0]}</td>
              <td>${line_splitted[1]}</td>
              <td>${line_splitted[2]}</td>
              <td>${line_splitted[3]}</td>
            </tr>
          `;
        }
        html += "</table>";
        return html;
      }
      postFetchObject(url, request, callback) {
        let config = {
          method: 'POST',
          body: JSON.stringify(request)
        }
        fetch(url, config).then(p => p.text().then( r => callback(r) ));
      }
      placeLastProductsUpdatingDay() {
        this.elements.info_td.insertAdjacentHTML(
          'afterbegin', 
          "Крайнее обновление каталога товаров было совершено: " + 
          window['last_products_updating_day']
        );
      }
      formatSQLDate(date) {
        const spl = date.split("-");
        return spl[2] + "." + spl[1] + "." + spl[0];
      }
      startSihecaTimer() {
        this.siheca.timer = setInterval(
          () => {
            this.elements.products_string_textarea.value = (
              "Запрос каталога... " + this.siheca.timeRemain + " сек."
            )
            this.siheca.timeRemain--;
            if (this.siheca.timeRemain < 1) {
              this.stopSihecaTimer.call(this);
              alert("Запрос занял слишком много времени и вероятно не удался.");
            }
          },
          1000
        );
      }
      stopSihecaTimer() {
        clearInterval(this.siheca.timer);
        this.siheca.timeRemain = 90;
      }
      handleSihecaFetching() {
        this.elements.siheca_submit.disabled = true;
        let confirmation = confirm("Запросить каталог автоматически?");
        if (!confirmation) return;
        this.elements.products_string_textarea.value = "Запрос каталога...";
        this.startSihecaTimer.call(this);
        this.postFetchObject(
          "/siheca",
          {
            password: this.elements.products_string_fetch_input_password.value,
          },
          (result) => {
            this.stopSihecaTimer.call(this);
            result = JSON.parse(result);
            alert(result.message);
            this.elements.siheca_submit.disabled = false;
            if (!result.productsString) {
              return;
            }
            let new_products_string = result.productsString;
            this.elements.products_string_textarea.value = "Загрузка...";
            setTimeout(
              () => {
                let compared = this._handleProductsStringsComparing.call(this, products_string, new_products_string);
                let comparing_table = this._comparingResultToTable.call(this, compared, "products_comparing");
                document.body.insertAdjacentHTML("beforeend", comparing_table);
                this.elements.products_string_textarea.value = new_products_string;
              },
              3000
            )
          }
        );
      }
      _addDisplayChangeCalcClickListener() {
       this.elements.display_change_calc.addEventListener('click', () => {
         this.elements.change_calc.style.display = "block";
       }); 
      }
      static _convertGoogleTableStringToObject(str) {
        let rows = str.split("\n");
        let products = {}
        for (let row of rows) {
          let vals = row.split("\t");
          if (+vals[4] <= 0) continue
          products[ vals[0] ] = {
            name: vals[1],
            coins: vals[2],
            price: vals[3],
          }
        }
        return products
      }
    }
    
    document.body.style.display = "none";
    const products = ClientAPI._convertGoogleTableStringToObject(products_string);
    // console.log(JSON.stringify(products))
    delete products[""];

    let api = new ClientAPI(products)

    api.elements.add_row_button.addEventListener("click", api._addNewRow.bind(api) )
    api.elements.product_input.addEventListener("keydown", (e) => {
      if (e.repeat || e.key != "Enter") return; 
      api._addNewRow.call(api)
    })
    api.elements.amount_input.addEventListener("keydown", (e) => {
      if (e.repeat || e.key != "Enter") return; 
      api._addNewRow.call(api)
    })
    api.elements.display_codes_button.addEventListener("click", api._displayCodes.bind(api))
    api.elements.clear_all_button.addEventListener("click", api._clearAll.bind(api))
    document.body.style.display = "block";
  }
  catch (er) {
    alert(er.stack);
  }
}) ();