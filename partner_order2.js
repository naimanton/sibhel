const qw = console.log;
const products_string = window['generated_products_string'];

class ClientAPI {
  construct(products) {
    this.elements = {
      noteTextarea: document.querySelector("#noteTextarea"),
      tdR: document.querySelector("#tdR"),
      order_table: document.querySelector("#order-table"),
      clear_all: document.querySelector("#clear-all"),
      copy: document.querySelector("#copy"),
      copy_textarea: document.querySelector("#copy-textarea"),
      info_tr: document.querySelector("#info-tr"),
      // panel_tr: document.querySelector("#panel-tr"),
      // head_tr: document.querySelector("#head-tr"),
      coins_sum: document.querySelector("#coins-sum"),
      price_sum: document.querySelector("#price-sum"),
      amount_sum: document.querySelector("#amount-sum"),
      info_td: document.querySelector("#info-td"),
      authSubmit: document.querySelector("#authSubmit"),
      loginInput: document.querySelector("#loginInput"),
      passwordInput: document.querySelector("#passwordInput"),
      remove_place: document.querySelector("#remove-place"),
      clear_remains: document.querySelector("#clear-remains"),
      port: document.querySelector("#port"),
      tbody_order: document.querySelector("#tbody-order"),
      coins_head: document.querySelector("#coins-head"),
      price_head: document.querySelector("#price-head"),
      amount_head: document.querySelector("#amount-head"),
      discount_input: document.querySelector("#discount-input"),
      botsend: document.querySelector("#botsend"),
      toggleGSorting: document.querySelector("#toggleGSorting"),
      localClear: document.querySelector("#localClear"),
      doFunc: document.querySelector("#doFunc"),
      funcSelect: document.querySelector("#funcSelect"),
      altOrderInputEventHandling: document.querySelector("#altOrderInputEventHandling"),
      searchByName: document.querySelector("#searchByName"),
      searchByNameButton: document.querySelector("#searchByNameButton"),
      placeAll: document.querySelector("#placeAll"),
      // toggleRemainsMethod: document.querySelector("#toggleRemainsMethod"),
      commasInsteadOfDotsCheckbox: document.querySelector("#commasInsteadOfDotsCheckbox"),
    };
    this.siheca = {
      timeRemain: 120,
      timer: null
    };
    this.rebyanco = {
      timeRemain: 40,
      timer: null
    };
    this.mRemains = {};
    this.focused = {};
    try {
      document.addEventListener('keydown', e => {
        if (e.target.className !== 'amount-input') {
            return;
        }
        if (e.key === 'ArrowLeft') {
            var prevTr = e.target.parentElement.parentElement.previousElementSibling; 
            if (prevTr === null) return;
            var rect = prevTr.getBoundingClientRect();
            document.scrollingElement.scrollBy(0, -(rect.height+2));
            this.colorizeFocusedTr.call(this, prevTr)
            prevTr.children[6].children[0].focus();
        }
        if (e.key === 'ArrowRight') {
            var nextTr = e.target.parentElement.parentElement.nextElementSibling;
            if (nextTr === null) return;
            var rect = nextTr.getBoundingClientRect();
            document.scrollingElement.scrollBy(0, rect.height+2);
            this.colorizeFocusedTr.call(this, nextTr)
            nextTr.children[6].children[0].focus();
               
        }
      })
      this.elements.doFunc.addEventListener('click', () => {
        attempt(() => {
          if (this.elements.funcSelect.value == '0') {
            if (!confirm('Это используется в случае непредвиденных ошибок и позволяет перенести заказ в старую версию сайта. В случае если на старой версии сайта уже набит заказ, он полностью заменится. Перенести?')) return;
            this.portAmountsInOldLocalOrder.call(this);
            return;  
          }
          if (this.elements.funcSelect.value == '1') {
            if (!confirm('Это используется при нарушении работы программы и не требуется для обновления M-остатков. Стереть M-остатки из памяти?')){
              return;
            }
            this.mRemains = {};
            localStorage.removeItem('mRemains');
            localStorage.removeItem('mRemainsLogin');
            localStorage.removeItem('mRemainsTime');
            this.elements.loginInput.value = '';
            this.removeProductTrsFromOrderTable.call(this);
            this.placeCatalogInOrderTable.call(this, discount);
            return;  
          }
          if (this.elements.funcSelect.value == '2') {
            if (!confirm('Сбросить всю локальную информацию (старой и новой версий сайта)? (это не влияет на отправленные заказы)')) return;
            localStorage.clear();
            document.location.href = document.location.href; 
            return;  
          }
          if (this.elements.funcSelect.value == '3') {
            var confirmed = true;
            if (sum.amount !== 0) {
                alert('Заказ будет внесен поверх уже внесенного!!!\n\nЭто означает, что если внесенный заказ не имеет отношения к вносимому произойдет ошибочное объединение.');
                confirmed = confirm("Внести заказ, объединив с уже внесенным?");
            }
            if (!confirmed) return;
            this.reverseOrder.call(this);
          }
        })
      });
      this.elements.authSubmit.disabled = true;
      this.elements.authSubmit.value = 'Недоступно во время обновления каталога';
      let local_discount = localStorage.getItem('discount');
      if (local_discount !== null) {
        discount = fi(+local_discount);
      }
      if (offGSorting === null || +offGSorting !== 1) {
        this.elements.toggleGSorting.checked = true;
      }
      this.elements.toggleGSorting.addEventListener('input', () => {
        attempt( ()=> {
          if (offGSorting === null || +offGSorting !== 1) {
            localStorage.setItem('order2_offGSorting', 1)
          }
          else {
            localStorage.setItem('order2_offGSorting', 0)
          }
          document.location.href = document.location.href;
        })
      });
      if (altOrderInputEventHandlingMethod !== null && +altOrderInputEventHandlingMethod === 1) {
        this.elements.altOrderInputEventHandling.checked = true;
      }
      this.elements.altOrderInputEventHandling.addEventListener('input', () =>{
        attempt( ()=> {
          if (altOrderInputEventHandlingMethod !== null && +altOrderInputEventHandlingMethod === 1) {
           localStorage.setItem('altOrderInputEventHandlingMethod', 0); 
          }
          else {
           localStorage.setItem('altOrderInputEventHandlingMethod', 1); 
          }
          document.location.href = document.location.href;
        })
      });
      if ( commasInsteadOfDots !== null && +commasInsteadOfDots === 1) {
        this.elements.commasInsteadOfDotsCheckbox.checked = true;
      }
      this.elements.commasInsteadOfDotsCheckbox.addEventListener('input', () =>{
        attempt( ()=> {
          if (commasInsteadOfDots !== null && +commasInsteadOfDots === 1) {
           localStorage.setItem('commasInsteadOfDots', 0); 
          }
          else {
           localStorage.setItem('commasInsteadOfDots', 1); 
          }
          document.location.href = document.location.href;
        })
      });
      this.elements.discount_input.value = discount;
      this.autoUpdateCatalog.call(this);
      this.handleLocalOrder.call(this);
      this.fixLocalOrder.call(this);
      this.placeCatalogInOrderTable.call(this, discount, this.mRemains);
      
      this.elements.searchByName.addEventListener('keydown', (e) => {
        attempt( (e) => {
          if (e.key !== 'Enter' || e.repeat) return;
            this.removeProductTrsFromOrderTable.call(this);
            if (this.elements.searchByName.value.length > 1) {
              this.animateBackgroundColor.call(this, this.elements.searchByName, "#c6e1f1")
              this.placeCatalogInOrderTable.call(this, discount, this.mRemains, this.elements.searchByName.value);
            }
            else {
              this.placeCatalogInOrderTable.call(this, discount, this.mRemains);
            }
        }, e); 
      });
      this.elements.searchByNameButton.addEventListener('click', () => {
        attempt( () => {
            this.removeProductTrsFromOrderTable.call(this);
            if (this.elements.searchByName.value.length > 1) {
              this.animateBackgroundColor.call(this, this.elements.searchByName, "#c6e1f1")
              this.placeCatalogInOrderTable.call(this, discount, this.mRemains, this.elements.searchByName.value);
            }
            else {
              this.placeCatalogInOrderTable.call(this, discount, this.mRemains);
            }
        });
      });
      this.elements.placeAll.addEventListener('click', () => {
        attempt( () => {
          this.removeProductTrsFromOrderTable.call(this);
          this.placeCatalogInOrderTable.call(this, discount, this.mRemains);
          this.elements.searchByName.select();
        });
      });
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.repeat) return;
        if (e.target === document.body || e.target.className === 'amount-input') {
          this.elements.searchByName.select();
        }
      })
      this.elements.authSubmit.addEventListener('click', () => {
        attempt( () => {
          if (this.elements.loginInput.value.length < 6) {
            alert("Неверный логин.");
            return;
          }
          if (this.elements.passwordInput.value == '') {
            alert("Введите пароль.");
            return;
          }
          this.elements.authSubmit.disabled = true;
          if (false /* this.elements.toggleRemainsMethod.checked */) {
        	this.startRebyancoTimer.call(this);
        	this.postFetchObject(
            '/remains', 
            {
              login: this.elements.loginInput.value,
              password: this.elements.passwordInput.value
            }, 
            (result) => {
              attempt ( (result) => {
                result = JSON.parse(result);
                alert(result.message);
                this.stopRebyancoTimer.call(this);
                if (!result.remains) {
                  this.elements.authSubmit.disabled = false;
                  return;
                }
                this.mRemains = this.cookRebyancoRemains.call(this, result.remains);
                localStorage.setItem('mRemains', JSON.stringify(this.mRemains));
                localStorage.setItem('mRemainsLogin', this.elements.loginInput.value);
                localStorage.setItem('mRemainsTime', this.getUTCWithShift(1000*60*60*6));
                this.removeProductTrsFromOrderTable.call(this);
                this.placeCatalogInOrderTable.call(this, discount, this.mRemains);
                this.elements.authSubmit.value = this.elements.loginInput.value;
                this.elements.passwordInput.value = '';
                alert("M-остатки размещены и сохранены.");
              }, result);
            }
          )	
        }
        else {
          this.startSihecaTimer.call(this);
          this.postFetchObject(
            '/siheca2', 
            {
              login: this.elements.loginInput.value,
              password: this.elements.passwordInput.value
            }, 
            (result) => {
              attempt ( (result) => {
                result = JSON.parse(result);
                alert(result.message);
                this.stopSihecaTimer.call(this);
                if (!result.productsString) {
                  this.elements.authSubmit.disabled = false;
                  return;
                }
                this.mRemains = this.cookSelfRemains.call(this, result.productsString);
                localStorage.setItem('mRemains', JSON.stringify(this.mRemains));
                localStorage.setItem('mRemainsLogin', this.elements.loginInput.value);
                localStorage.setItem('mRemainsTime', this.getUTCWithShift(1000*60*60*6));
                this.removeProductTrsFromOrderTable.call(this);
                this.placeCatalogInOrderTable.call(this, discount, this.mRemains);
                this.elements.authSubmit.value = this.elements.loginInput.value;
                this.elements.passwordInput.value = '';
                alert("M-остатки размещены и сохранены.");
              }, result);
            }
          )
        }
      });
      });
      this.elements.tbody_order.addEventListener('input', (e) => {
        attempt((e) => {
          this[orderInputEventHandlingMethod].call(this, e);
        }, e );
      });
      this.elements.tbody_order.addEventListener('click', (e) => {
        attempt((e) => this.handleOrderClickEvent.call(this, e), e );
      });
      this.elements.clear_all.addEventListener('click', () => {
        attempt(() => this.clearAll.call(this) ); 
      });
      this.elements.copy.addEventListener('click', () => {
       attempt( () => this.displayCodes.call(this) );
      });
      this.elements.remove_place.addEventListener('click', () => {
        attempt ( () => {
          this.removeProductTrsFromOrderTable.call(this);
          this.placeCatalogInOrderTable.call(this, discount, this.mRemains);
        });
      });
      this.elements.botsend.addEventListener('click', this.sendByBot.bind(this));
      this.elements.discount_input.addEventListener('change', (e) => {
        attempt( (e) => {
          discount = fi(+this.elements.discount_input.value % 100);
          this.elements.discount_input.value = discount;
          this.removeProductTrsFromOrderTable.call(this);
          this.placeCatalogInOrderTable.call(this, discount, this.mRemains);
          sum.price = this.recalculateSum.call(this).price;
          localStorage.setItem('sum2', JSON.stringify(sum));
          localStorage.setItem('discount', discount);
          // this.elements.price_sum.innerText = fi(sum.price);
          sumCellHandler(sum.price);
          alert('Перерасчет выполнен.');
        }, e);
      });
      document.addEventListener('keydown', e => {
        if (e.repeat || e.key !== 'Home') return;
        this.elements.searchByName.select();
        this.elements.searchByName.focus();
      });
      this.elements.price_sum.addEventListener('click', () => {
          attempt(this.reactOnSumClick.bind(this));
      })
      document.body.style.display = "block";
      return this;
    }  
    catch(er) {
      document.body.style.display = "block";
      disableAllInputs('port', 'localClear');
      alert('Непредвиденная ошибка.');
      alert(er.stack);
      console.log(er);
    }
  }
  reverseOrder() {
    this.elements.placeAll.dispatchEvent(new Event('click', {bubbles: true}));
		function handleInput(input, value) {
			input.value = +input.value + +value;
      input.dispatchEvent(new Event('input', {bubbles: true}))
		}
		var textarea = this.elements.copy_textarea; 
		if (textarea.value == '') {
			alert('Вставьте заказ-таблицу в поле!');
			return;
		}
		if (textarea.value.includes('Обратное внесение заказа')) {
			alert('Поле содержит результат прошлого внесения заказа! Вставьте заказ-таблицу в поле!');
			return;
		}
		var splByN = textarea.value.split('\n');
		var sorted = { same: {}, no: {}, nSame: {}, isAllSame: true };
		for (var line of splByN) {
			if (line.includes('Итог') || line.includes('Код')) continue;
			var [code, name, amount, coins, price] = line.split('\t');
			var lineOb = {name, amount, coins, price};
			var productOb = products[+code];
			if (productOb === undefined) {
        sorted.isAllSame = false;
				sorted.no[code] = lineOb;
				continue;
			}
			if (productOb.name == name && productOb.coins == coins.replace(',', '.') /*&& productOb.price == price*/) {
				sorted.same[code] = lineOb;
				continue;
			}
      sorted.isAllSame = false;
			sorted.nSame[code] = lineOb;
		}
		var productInfoTrs = document.querySelectorAll('.product-info-tr');
		for (var tr of productInfoTrs) {
			var code = tr.children[0].innerText; 
			if (sorted.same[code] === undefined) continue;
			handleInput(tr.children[6].children[0], sorted.same[code].amount);
		}
    this.elements.placeAll.dispatchEvent(new Event('click', {bubbles: true}));
		if (sorted.isAllSame) {
			alert('Сравните денежную сумму внесенного заказа! Всем позициям заказа найдены точные соответствия наименования и баллов. Цены могут отличаться.');
			return;
		}
		var reportText = 'Обратное внесение заказа. Пропущенные позиции:\n\n';
    var nSameOrder = '', noOrder = ''
		for (var k in sorted.no) {
			var {name, amount, coins, price} = sorted.no[k]; 
			noOrder += k + ' - ' + name + '\n----------\n' + amount + ' шт. - ' + coins + ' бал. - ' + price + ' т.\n--------------------\n'; 
		}
		for (var k in sorted.nSame) {
			var {name, amount, coins, price} = sorted.nSame[k]; 
			nSameOrder += k + ' - ' + name + '\n----------\n' + amount + ' шт. - ' + coins + ' бал. - ' + price + ' т.\n--------------------\n'; 
		}
    
		reportText += '- код был найден, но что-то отличается:\n\n' + 
			nSameOrder + '\n' + ' - код не был найден:\n\n' + noOrder;

		textarea.value = reportText;
		alert('Некоторые позиции пропущены - не найдены точные соответствия кодов, наименований или баллов.\n\nДетали указаны в поле вставки заказа-таблицы.'); 
	}
  reactOnSumClick() {
      var action = prompt(
          'Введите число, которое соответствует нужному пункту:\n\n1) Покинуть меню\n2) Указать лимит (сейчас: ' + limitVal + ')\n\n' +
          'Для изменения отображения ячейки суммы выберите один из следующих пунктов:\n\n' +
          '3) Отображать сумму по выбраным позициям\n' +
          '4) Отображать разность лимита и суммы выбранных позиций'
      );
      if (action == 1) return;
      if (action == 2) {
          var limit = prompt('Введите лимит (0 для снятия лимита): ');
          if (!isFinite(limit)) {
              alert('Ошибка. Лимит должен быть числом. Попробуйте еще раз');
              return;
          }
          if (limit === null) {
            return;
          }
          if (limit == 0) {
            localStorage.setItem('order2_isSumLimited', 0);
            localStorage.setItem('order2_limitVal', null);
            localStorage.setItem('order2_sumCellHandlingMinusMode', 0);
          }
          else {
            localStorage.setItem('order2_isSumLimited', 1);
            localStorage.setItem('order2_limitVal', limit);
          }
          document.location.href = document.location.href; 
          return;
      }
      if (action == 3) {
          localStorage.setItem('order2_sumCellHandlingMinusMode', 0);
          document.location.href = document.location.href; 
          return;
      }
      if (action == 4) {
          if (!isSumLimited) {
              alert('Сначала укажите лимит!');
              return;
          }
          localStorage.setItem('order2_sumCellHandlingMinusMode', 1);
          document.location.href = document.location.href; 
          return;
      }
      
  }
  cookRebyancoRemains(remains) {
		var result = {};
		var notFound = [];
		for (var line of remains) {
			var code = '';
			for (var c in products) {
				if (c === line[0]) {
					code = c;
					break;
				}
				if (products[c].name === line[1]) {
					code = c;
					break;
				}
			}
			if (code === '') {
				notFound.push(line);
				continue;
			}
			result[code] = line[2];
		}
		if (notFound.length > 0) {
			console.log(notFound)
		}
		return result;
	}
  autoUpdateCatalog() {
    // let url = 'https://cdn.glitch.global/a3684bc5-4628-411e-86a7-63fef2606aa3/loadcube.gif?v=1681060892076';
    let url = 'https://cdn.glitch.global/a3684bc5-4628-411e-86a7-63fef2606aa3/shload.gif?v=1668443657161'
    this.elements.info_td.innerHTML = `<img src="${url}" width="30" height="30">` +
      'Фоновое обновление каталога... (менее 2 минут)';
    
    fetch('/updateProd').then(p => p.json().then( r => {
      if (r.message === 'OK' || r.message === 'limit' || r.message === 'alreadyWorking') {
        if (r.message === 'OK') {
          alert('Каталог на сервере обновлен. Страница будет перезагружена.');
          document.location.href = document.location.href;
          return;
        }
        this.elements.info_td.innerHTML = "";
        this.placeLastProductsUpdatingDay.call(this, r.lpud);
        this.elements.authSubmit.value = 'Запросить M-остатки';
        this.elements.authSubmit.disabled = false;
        return;
      }
      this.elements.info_td.innerHTML = "ПРИ ОБНОВЛЕНИИ КАТАЛОГА ПРОИЗОШЛА ОШИБКА!<hr>";
      this.placeLastProductsUpdatingDay.call(this);
      this.elements.authSubmit.value = 'Запросить M-остатки';
      this.elements.authSubmit.disabled = false;
    }));
  }
  getUTCWithShift(shift=0) {
    let isoSpl = (new Date).toISOString().split("T");
    let dateSpl = isoSpl[0].split("-");
    let timeSpl = isoSpl[1].split(":");
    let UTCDate = new Date(dateSpl[0], dateSpl[1], dateSpl[2], timeSpl[0], timeSpl[1]);
    let shifted = new Date(+UTCDate + shift);
    let mins = shifted.getMinutes();
    let dat = shifted.getDate();
    let mon = shifted.getMonth();
    if (mins.length === 1) {
      mins = '0'+mins;
    }
    if (dat.length === 1) {
      dat = '0'+dat;
    }
    if (mon === 0) {
      mon = 12;
    }
    if (mon.length === 1) {
      mon = '0'+mon;
    }
    return (
      dat + "." +
      shifted.getMonth() + "." +
      shifted.getFullYear() + " - " +
      shifted.getHours() + ":" +
      mins
    );
  }
  sendByBot() {
    if (!confirm('Укажите логин и внимательно проверьте заказ перед отправкой. Отправить заказ?')) return;
    this.elements.botsend.disabled = true;
    this.elements.botsend.value = "Ожидайте (менее минуты)";
    this.postFetchObject(
      '/saveOrder', 
      {order: this.orderToGoogleTable.call(this), login: this.elements.loginInput.value, note: this.elements.noteTextarea.value},
      (r) => {
        alert(JSON.parse(r).message);
        this.elements.botsend.disabled = false;
        this.elements.botsend.value = "Отправить";
      }
    )
  }
  fixLocalOrder() {
    const newAmounts = {};
    const deleted = [];
    for (let code in amounts) {
      if (g_sorted_codes.includes(code)) {
        newAmounts[code] = amounts[code];
        continue;
      };
      deleted.push(code);
    }
   
    amounts = newAmounts;
    var oldSum = sum;
    sum = this.recalculateSum.call(this);
    localStorage.setItem('order2', JSON.stringify(amounts));
    localStorage.setItem('sum2', JSON.stringify(sum));
    this.elements.coins_sum.innerText = fi(sum.coins);
    // this.elements.price_sum.innerText = fi(sum.price);
    sumCellHandler(sum.price);
    this.elements.amount_sum.innerText = fi(sum.amount);
    if (this.eqSums.call(this, oldSum, sum)) return;
    let message = 'Внимание! Цена или баллы некоторых позиций заказа изменились после обновления каталога. Суммы по заказу также изменены.';
    alert(message);
  }
  eqSums(sum0, sum1) {
    if (
      sum0.coins == sum1.coins &&
      sum0.price == sum1.price
    ) return true;
    return false;
  }
  recalculateSum() {
    const newSum = {
      coins: 0,
      price: 0,
      amount: 0,
    };
    for (let code in amounts) {
      if (amounts[code] === 0) continue;
      newSum.coins = fi(newSum.coins + +(products[code].coins) * amounts[code]);
      newSum.amount += amounts[code];
      newSum.price = fi(
        newSum.price + 
        (+(products[code].price) - (+(products[code].price) * (discount * +products[code].factor)/100)) *
        amounts[code]
      );
    }
    return newSum;
  }
  handleLocalOrder() {
    if (localStorage.getItem('order2') === null) {
      localStorage.setItem('order2', JSON.stringify(amounts));
      localStorage.setItem('sum2', JSON.stringify(sum));
    }
    else {
      sum = JSON.parse(localStorage.getItem('sum2'));
      amounts = JSON.parse(localStorage.getItem('order2'));
      this.elements.coins_sum.innerText = fi(sum.coins);
      // this.elements.price_sum.innerText = fi(sum.price);
      sumCellHandler(sum.price);
      this.elements.amount_sum.innerText = sum.amount;
    }
    let localMRemains = localStorage.getItem('mRemains');
    this.elements.loginInput.value = localStorage.getItem('mRemainsLogin') || '';
    if (localMRemains !== null) {
      this.mRemains = JSON.parse(localMRemains);
      alert('M-остатки загружены из памяти и могут быть не актуальны.');
    }
  }
  handleBackTrColorWhenUnfocused(tr, value) {
    if (tr !== this.focused.tr) return;
    var color = notEmptyTrColor;
    if (value === 0) {
      color = 'white'
    }
    this.focused.oldBackColor = color;
  }
  handleOrderInputEvent(e) {
    const tr = e.composedPath()[2];
    const tr_children = tr.children;
    const code = tr_children[0].innerText;
    const value = Math.abs(+(e.target.value));
    e.target.value = value || '';
    
    const amountDiff = fi(value - +(amounts[code]), 0);
    const coinsDiff = fi(+(tr_children[4].innerText) * amountDiff); 
    const priceDiff = fi(+(tr_children[5].innerText) * amountDiff);
    sum.coins = fi(sum.coins + coinsDiff);
    sum.price = fi(sum.price + priceDiff);
    sum.amount = fi(sum.amount + amountDiff);
    
    amounts[code] = value;
    let tr_price = +tr_children[5].innerText;
    tr_children[6].title = `${value} * ${tr_price} = ${fi(value * tr_price)}`;
    
    localStorage.setItem('order2', JSON.stringify(amounts));
    localStorage.setItem('sum2', JSON.stringify(sum));
    
    this.elements.coins_sum.innerText = fi(sum.coins);
    // this.elements.price_sum.innerText = fi(sum.price);
    sumCellHandler(sum.price);
    this.elements.amount_sum.innerText = fi(sum.amount);
    this.animateBackgroundColor.call(this, e.target, "#c6e1f1");
    // if (value !== 0) {
    //   tr.style.backgroundColor = notEmptyTrColor;
    // }
    // else {
    //   tr.style.backgroundColor = '';
    // }
    
    ((value !== 0) && (tr.style.backgroundColor = notEmptyTrColor)) || (tr.style.backgroundColor = '');
    this.handleBackTrColorWhenUnfocused.call(this, tr, value);
  }
  handleOrderInputEventAlt(e) {
    const tr = e.composedPath()[2];
    const tr_children = tr.children;
    const code = tr_children[0].innerText;
    const value = Math.abs(+(e.target.value));
    e.target.value = value || '';
    
    amounts[code] = value;
    
    sum = this.recalculateSum();
    
    let tr_price = +tr_children[5].innerText;
    tr_children[6].title = `${value} * ${tr_price} = ${fi(value * tr_price)}`;
    
    localStorage.setItem('order2', JSON.stringify(amounts));
    localStorage.setItem('sum2', JSON.stringify(sum));
    
    this.elements.coins_sum.innerText = fi(sum.coins);
    // this.elements.price_sum.innerText = fi(sum.price);
    sumCellHandler(sum.price);
    this.elements.amount_sum.innerText = fi(sum.amount);
    this.animateBackgroundColor.call(this, e.target, "#c6e1f1");
    // if (value !== 0) {
    //   tr.style.backgroundColor = notEmptyTrColor;
    // }
    // else {
    //   tr.style.backgroundColor = '';
    // }
    
    ((value !== 0) && (tr.style.backgroundColor = notEmptyTrColor)) || (tr.style.backgroundColor = '');
    this.handleBackTrColorWhenUnfocused.call(this, tr, value);
    
  }
  handleOrderClickEvent(e) {
    if ( !(e.target instanceof HTMLTableCellElement) ) return;
    let path = e.composedPath();
    path[1].children[6].children[0].focus();
    this.colorizeFocusedTr.call(this, path[1]);
  }
  colorizeFocusedTr(tr) {
    if (this.focused.tr !== undefined) {
        this.focused.tr.style.backgroundColor = this.focused.oldBackColor;
    }
    this.focused.oldBackColor = tr.style.backgroundColor;
    this.focused.tr = tr;
    tr.style.backgroundColor = '#c8fbf8';
  }
  clearAll() {
    if (!confirm('Стереть все позиции?')) return; 
    this._clearAll.call(this);
  }
  _clearAll() {
    amounts = ClientAPI.initAmountsObject(products)
    sum = {
      coins: 0,
      price: 0,
      amount: 0
    }
    localStorage.setItem('order2', JSON.stringify(amounts));
    localStorage.setItem('sum2', JSON.stringify(sum));
    
    
    document.location.href = document.location.href; 
    // const trs = this.elements.order_table.querySelectorAll('tr');
    // for (let i = 3; i < trs.length; i++) {
    //   trs[i].children[6].children[0].value = '';
    //   trs[i].style.backgroundColor = '';
    // }
    // this.elements.coins_sum.innerText = '0.00';
    // this.elements.price_sum.innerText = '0.00';
    // this.elements.amount_sum.innerText = '0';
    // this.elements.copy_textarea.value = '';
  }
  orderToGoogleTable(commasInsteadOfDots) {
    var handleNumDelim = n => n; 
     if ( commasInsteadOfDots !== null && +commasInsteadOfDots === 1) {
        handleNumDelim = n => (""+n).replace('.', ',');
      }
    let res = `Код\tПродукт\tКоличество\tБаллы\tЦена\n`
    for (let code of g_sorted_codes) {
      if (amounts[code] === 0) continue;
      res += code + 
        "\t" + 
        products[code].name + 
        "\t" + 
        amounts[code] + 
        "\t" +
        handleNumDelim(products[code].coins) +
        "\t" +
        handleNumDelim(products[code].price - (products[code].price * (discount * +products[code].factor)/100)) +
        "\n"
    }
    res += "Итог:" + 
      "\t\t" + 
      sum.amount +
      "\t" +
      handleNumDelim(fi(sum.coins)) +
      "\t" +
      handleNumDelim(fi(sum.price))

    return res
  }
  displayCodes() {
    this.elements.copy_textarea.value = this.orderToGoogleTable.call(this, commasInsteadOfDots)
    this.elements.copy_textarea.select()
    document.execCommand("copy");
  }
  animateBackgroundColor(node, hex) {
    node.style.backgroundColor = hex;
    setTimeout(() => node.style.backgroundColor = "white", 200);
  }
  removeProductTrsFromOrderTable() {
    const trs = this.elements.tbody_order.querySelectorAll('tr');
    for (let i = 0; i < trs.length; i++) {
      trs[i].remove();
    }
  }
  cookSelfRemains(ps) {
    const remains = {};
    const rowSplitted = ps.split('\n');
    for (let position of rowSplitted) {
      let splitted = position.split("\t");
      remains[splitted[0]] = splitted[4];
    }
    return remains;
  }
  postFetchObject(url, request, callback) {
    let config = {
      method: 'POST',
      body: JSON.stringify(request)
    }
    fetch(url, config).then(p => p.text().then( r => callback(r) ));
  }
  isPartsOfName(partsString, name) {
    // if (partsString.length < 2) return false;
    var splitted = partsString.split(' ');
    for (var part of splitted) {
      if (!(name.toLowerCase().includes(part.toLowerCase()))) {
        return false;
      } 
    }
    return true;
  }
  placeCatalogInOrderTable(discount, mRemains={}, namePart='') {
    let noneSym = '-';
    if (Object.values(mRemains).length !== 0) {
      noneSym = 0;
    }
    let s_sorted_codes = [];
    for (let code of g_sorted_codes) {
      if (!(this.isPartsOfName(namePart, products[code].name))) {
        continue;
      }
      if (amounts[code] === 0) continue;
      if (amounts[code] === undefined) {
        amounts[code] = 0;
        continue;
      }
      s_sorted_codes.push(code);
    }
    for (let code of g_sorted_codes) {
      if (!(this.isPartsOfName(namePart, products[code].name))) {
        continue;
      }
      if (s_sorted_codes.includes(code)) continue;
      if (products[code].rRemain <= '0') continue;
      s_sorted_codes.push(code);
    }
    for (let code of g_sorted_codes) {
      if (!(this.isPartsOfName(namePart, products[code].name))) {
        continue;
      }
      if (s_sorted_codes.includes(code)) continue;
      s_sorted_codes.push(code);
    }
    for (let code of s_sorted_codes) {
      let tr_color = '';
      let trTextColor = ''
      let factor_color = '';
      let remain_color = '';
      if (products[code].rRemain < 200) {
        remain_color = '#ffd400';
      }
      if (products[code].rRemain < 10) {
        remain_color = lowAmountColor;
      }
      if (products[code].rRemain <= 0) {
        trTextColor = zeroAmountTextColor;
      }
      if (amounts[code] !== 0) {
        tr_color = notEmptyTrColor;
      }
      if (+products[code].factor !== 1) {
        factor_color = '#79E16B';
      }
      let mRemain;
      if (+mRemains[code] !== undefined) {
        mRemain = +mRemains[code];
      }
      const discountPrice = fi(products[code].price - (products[code].price * (discount * +products[code].factor)/100));
      this.elements.tbody_order.insertAdjacentHTML(
        "beforeend",
        `<tr style="color: ${trTextColor}; background-color: ${tr_color};" class="product-info-tr">
          <td>
              ${code}
          </td>
          <td>${products[code].name}</td>
          <td style="background-color: ${remain_color};" title="Остаток РЦ">${products[code].rRemain}</td>
          <td title="Остаток личный">${mRemains[code] === undefined ? noneSym : mRemains[code]}</td>
          <td title="При полной стоимости 1 балл = ${(products[code].price/products[code].coins).toFixed(2)}">
            ${products[code].coins}
          </td>
          <td style="background-color: ${factor_color};" title="Полная стоимость: ${products[code].price}">
            ${discountPrice}
          </td>
          <td title="${amounts[code]} * ${discountPrice} = ${fi(amounts[code] * discountPrice)}">
            <input value="${amounts[code] || ""}" type="number" class="amount-input">
          </td>
        </tr>`
      );
    }
    localStorage.setItem('order2', JSON.stringify(amounts));
  }
  placeLastProductsUpdatingDay(lpud) {
    this.elements.info_td.insertAdjacentHTML(
      'beforeend', 
      "M-остатки обновлялись на устройстве: " + (localStorage.getItem('mRemainsTime') || "-") + "<hr>" +
      "Крайнее обновление каталога товаров было совершено: " + 
      (lpud || window['last_products_updating_day'])
    );
  }
  formatSQLDate(date) {
    const spl = date.split("-");
    return spl[2] + "." + spl[1] + "." + spl[0];
  }
  startSihecaTimer() {
    this.siheca.timer = setInterval(
      () => {
        this.elements.authSubmit.value = (
          this.siheca.timeRemain + " сек."
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
  startRebyancoTimer() {
    this.rebyanco.timer = setInterval(
      () => {
        this.elements.authSubmit.value = (
          this.siheca.timeRemain + " сек."
        )
        this.siheca.timeRemain--;
        if (this.siheca.timeRemain < 1) {
          this.stopRebyancoTimer.call(this);
          alert("Запрос занял слишком много времени и вероятно не удался.");
        }
      },
      1000
    );
  }
  stopSihecaTimer() {
    clearInterval(this.siheca.timer);
    this.siheca.timeRemain = 120;
  }
  stopRebyancoTimer() {
    clearInterval(this.rebyanco.timer);
    this.rebyanco.timeRemain = 40;
  }
  portAmountsInOldLocalOrder() {
    let oldStyleOrder = {};
    for (let code of g_sorted_codes) {
      if (amounts[code] === 0) continue;
      oldStyleOrder[code] = {
        amount: amounts[code],
        name: products[code].name,
        coins: products[code].coins,
        price: fi(products[code].price * 0.9),
      }
    }
    localStorage.setItem('order', JSON.stringify(oldStyleOrder));
    localStorage.setItem('order_sum', localStorage.getItem('sum2'));
  }
  static _convertTableStringToObject2(str) {
    let rows = str.split("\n");
    let products = {}
    for (let row of rows) {
      let vals = row.split("\t");
      products[ vals[0] ] = {
        name: vals[1],
        coins: vals[2],
        price: vals[3],
        rRemain: vals[4],
        factor: vals[5],
      }
    }
    return products
  }
  static sortCodesByCoins(products) {
    let codesAr = [];
    for (let code in products) {
      codesAr.push(code);
    }
    codesAr.sort( 
      (a,b) => +products[b].coins/+products[b].price - +products[a].coins/+products[a].price 
    );

    return codesAr;
  }
  static initAmountsObject(products) {
    let amounts = {};
    for (let code in products) {
      amounts[code] = 0;
    }
    return amounts;
  }
  static productsToCodes(products) {
    let array = [];
    for (let code in products) {
      array.push(code);
    }
    return array;
  }
}
document.body.style.display = "none";
function disableAllInputs(...args) {
  for (let i of allInputs) {
    if (args.includes(i.id)) continue;
    i.disabled = true;
  }
}
function attempt(callback, ...args) {
  try { callback(...args) }
  catch (er) {
    alert('Ошибка.');
    alert(er.stack);
    console.log(er.stack);
  }
}
function fi(n, m=2) {
  return +(n.toFixed(m));
}
const products = ClientAPI._convertTableStringToObject2(products_string);
delete products[""];
var g_sorted_codes;
var offGSorting = localStorage.getItem('order2_offGSorting');
if (offGSorting === null || +offGSorting !== 1) {
  g_sorted_codes = ClientAPI.sortCodesByCoins(products);
}
else {
  g_sorted_codes = ClientAPI.productsToCodes(products); 
}
var orderInputEventHandlingMethod;
var altOrderInputEventHandlingMethod = localStorage.getItem('altOrderInputEventHandlingMethod');
if (altOrderInputEventHandlingMethod === null || +altOrderInputEventHandlingMethod !== 1) {
  orderInputEventHandlingMethod = 'handleOrderInputEvent';
}
else {
  orderInputEventHandlingMethod = 'handleOrderInputEventAlt';
}
var commasInsteadOfDots = localStorage.getItem('commasInsteadOfDots');
let sum = {
  coins: 0,
  price: 0,
  amount: 0
};
const notEmptyTrColor = '#c7ffaf'; 
const lowAmountColor = '#fc7c7c';
const zeroAmountTextColor = '#adadad';
let discount = 10;
let amounts = ClientAPI.initAmountsObject(products);
let search_url = 'https://kz.siberianhealth.com/ru/shop/search/?searchString=';
var isSumLimited;
var limitVal;
if (localStorage.getItem('order2_isSumLimited') == 1) {
    isSumLimited = true;
    limitVal = localStorage.getItem('order2_limitVal');
}
else {
    isSumLimited = false;
    limitVal = 'не указан';
}
const allInputs = document.querySelectorAll("input");
var sumCellHandling = {
    simple(v) {
        api.elements.price_sum.innerText = fi(v);
        if (!isSumLimited) return;
        if (limitVal - v < 0) {
            api.elements.price_sum.style.backgroundColor = lowAmountColor;
        }
        else {
            api.elements.price_sum.style.backgroundColor = '#ffffcc';
        }
    },
    minus(v) {
        api.elements.price_sum.innerText = 'Л: ' + fi(limitVal - v);
        if (limitVal - v < 0) {
            api.elements.price_sum.style.backgroundColor = lowAmountColor;
        }
        else {
            api.elements.price_sum.style.backgroundColor = '#ffffcc';
        }  
    },
};
var sumCellHandler;
if (localStorage.getItem('order2_sumCellHandlingMinusMode') == 1) {
    sumCellHandler = sumCellHandling.minus;
}
else {
    sumCellHandler = sumCellHandling.simple;
}
var localFollowings = localStorage.getItem('followings2');
if (localFollowings === null) {
	localFollowings = "{}";
	localStorage.setItem('followings2', localFollowings);
}
localFollowings = JSON.parse(localFollowings);
let api = new ClientAPI()
api = api.construct(products);