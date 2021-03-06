var language;
var platform;

var GUID  = "8DC39460D49A4F1091EBE3F61D004997";
var EXTDS = "http://rucoecom.danfoss.com/ExtDS/jDS.asmx"
//var GUID = "37A1DB2E0CD5435F89E55CAC71FFC5F3";
//var EXTDS = "http://localhost/ExtDS/jDS.asmx"
function dancfgr() {
    //XML данные
    this.xml = {};
    //Набор настроек
    this.settings = [];
    //Текущие настройки
    this.setting = [];
    //Заголовки
    this.titles = [];
    //Поля таблицы данных
    this.header = [];
    //Все данные
    this.data = [];
    //Отфильтрованные данные
    this.fdata = [];
    //Контролы
    this.controls = [];
    //Текущая группа контролов
    this.group = 1;
    //Готовность иходных данных
    this.controlsIsReady = false;
    //Представления
    this.views = [];
    //Текущее представление
    this.view = [];
    //Фильтры
    this.filters = [];
    //база данных
    this.ldb;
    //флаг доступности базы
    this.isDBExist = false;
    //Пути к данным в XML файле по умолчанию
    //Данные, фильтры, контролы, представления
    this.settingsPath = 'body settings';
    this.titlesPath = 'body titles';
    this.headerPath = 'body headers';
    this.dataPath = 'body data';
    this.controlsPath = 'body controls';
    this.filtersPath = 'body filters';
    this.viewsPath = 'body views';
    //Контейнеры в текущем DOM документе по умолчанию для вывода контолов и представлений
    this.controlsContainer = 'divControls';
    this.titleContainer = 'divTitle';
    this.dataContainer = 'divData';
    
    //Имя класса контрола
    this.clsControl = 'clsControl';
    //Инициализация конфигуратора
    this.init = function (response) {
        //Распарсить xml
        this.xml = $.parseXML(response);
        //Загрузить настройки
        //this.settings.length = 0;
        this.readSettings(this.xml, this.settings);
        //Заголовки
        this.readTitles(this.xml, this.titles);
        //Загрузить заголовок таблицы
        this.readHeader(this.xml, this.header);
        //Загрузить контролы из xml
        this.readControls(this.xml, this.controls);
        //Загрузить данные таблицы
        this.readData(this.xml, this.data);
        //Загрузить фильтры
        this.readFilters(this.xml, this.filters);
        //Прочитать контент вывода (views)
        this.readViews(this.xml, this.views);
        //Выбрать view
        this.selectView(this.views, this.setting, this.view);
        //Вывести главные контейнеры
        this.writeContainers(this.setting, this.views);
        //Вывести заголовок
        this.writeTitle(this.titles, "header", this.titleContainer + "1");
        this.writeTitle(this.titles, "header", this.titleContainer + "2");
        this.writeTitle(this.titles, "header", this.titleContainer + "3");
        //Вывести в html
        this.writeControls(this.controls);
        //Заполнить контролы
        this.fillControls(this.controls, this.data);
        //Скрыть контейнер вывода результата
        $('#' + this.dataContainer).hide();
        //Вывести контент вывода
        this.writeView(this.view, this.header);
        //проинициализировать локальную базу данных
        this.isDBExist = this.db_initialize();
        //загрузить сохраненные данные для фильтров
        this.db_loadControls();
        //загрузить сохраненные данные для фильтров
        this.db_loadPersonalData();
        //Забиндить клик по контролам
        this.bindEvents(this.controls);
    };

    //инициализация локальной базы данных SQL Lite
    this.db_initialize = function () {
        try {
            if (window.openDatabase) {
                ldb = window.openDatabase("danfoss", "1.0", "Local", 1024 * 1024);
                ldb.transaction(function (tx) {
                    //tx.executeSql('DELETE FROM Controls', []);
                    //tx.executeSql('DROP TABLE IF EXISTS Controls', []);
                    //tx.executeSql('DELETE FROM UserData', []);
                    //tx.executeSql('DROP TABLE IF EXISTS UserData', []);
                    tx.executeSql('CREATE TABLE IF NOT EXISTS Controls(id TEXT, value TEXT)', []);
                    tx.executeSql('CREATE TABLE IF NOT EXISTS UserData(username TEXT, phone TEXT, email TEXT)', []);
                },
                                function (er) {  });
                return true;
            }
            else
                return false;
        } catch (ex) {
            return false;
        }
    };

    //сохранение всех селекторов в базу
    this.db_saveContols = function () {
        $this = this;
        if (this.isDBExist == true) {
            ldb.transaction(function (tx) {
                tx.executeSql("SELECT * FROM Controls", [], function (tx, rs) {
                    for (j = 0; j < $this.controls.length; j++)
                        if ($this.controls[j].type == "select") {
                            var nF = true;
                            for (var i = 0; i < rs.rows.length; i++) {
                                r = rs.rows.item(i);
                                if ($this.controls[j].id == r['id']) {
                                    nF = false;
                                    tx.executeSql("UPDATE Controls SET value=? WHERE id = ?", [$this.controls[j].value, $this.controls[j].id]);
                                }
                            }
                            if (nF == true) tx.executeSql("INSERT INTO Controls (id, value) VALUES (? , ?)", [$this.controls[j].id, $this.controls[j].value]);
                        }
                }, errorSQL);
            });
        }
    };

    //загрузка всех селекторов из базы
    this.db_loadControls = function () {
        if (this.isDBExist == true) {
            $this = this;
            ldb.transaction(function (tx) {
                tx.executeSql('SELECT * FROM Controls', [], function (tx, rs) {
                    var isF = false;
                    //e = $('#divData');
                    //alert(rs.rows.length);
                    for (var i = 0; i < rs.rows.length; i++) {
                        r = rs.rows.item(i);
                        //e.html(e.html() + 'id: ' + r['id'] + ', value: ' + r['value'] + '<br />');
                        for (var j = 0; j < $this.controls.length; j++) {
                            if ($this.controls[j].type == "select" && $this.controls[j].id == r['id']) {
                                $this.controls[j].value = r['value'];
                                $('#' + $this.controls[j].id)[0].value = $this.controls[j].value;
                                $('#' + $this.controls[j].id).selectmenu("refresh");
                                isF = true;
                            }
                        }
                    }
                    if (isF) $this.updateData();
                }, errorSQL);
            });
        }
    };

    //сохранение персональных данных о клиенте
    this.db_savePersonalData = function () {
        $this = this;
        if (this.isDBExist == true) {
            ldb.transaction(function (tx) {
                tx.executeSql("SELECT * FROM UserData", [], function (tx, rs) {
                    if (rs.rows.length > 0) 
                        tx.executeSql("UPDATE UserData SET username=?, phone=?, email=?", [$("#query_results").find("#username")[0].value, $("#query_results").find("#phonenumber")[0].value, $("#query_results").find("#emailaddres")[0].value]);
                    else 
                        tx.executeSql("INSERT INTO UserData (username, phone, email) VALUES (? , ? , ?)", [$("#query_results").find("#username")[0].value, $("#query_results").find("#phonenumber")[0].value, $("#query_results").find("#emailaddres")[0].value]);
                }, errorSQL);
            });
        }
    };

    //загрузка персональных данных о клиенте
    this.db_loadPersonalData = function () {
        if (this.isDBExist == true) {
            $this = this;
            ldb.transaction(function (tx) {
                tx.executeSql('SELECT * FROM UserData', [], function (tx, rs) {
                    if (rs.rows.length > 0) {
                        r = rs.rows.item(0);
                        $("#query_results").find("#username").val(r['username']);
                        $("#query_results").find("#phonenumber").val(r['phone']);
                        $("#query_results").find("#emailaddres").val(r['email']);
                    }
                }, errorSQL);
            });
        }
    };
    //Обновить данные
    this.updateData = function () {
        //Обновить контролы
        this.updateControls(this.controls);
        //Перезалить контролы отличные от выбранного отфильтрованным набором значений
        this.refillControls(this.controls, this.data);
        //Сохранить контролы в базе
        this.db_saveContols();
        //Обновить контролы повторно (после расчета)
        this.updateControls(this.controls);
        //Когда все контролы готовы приступить к фильтрации и выводы данных
        if (this.controlsIsReady == true) {
            //Обновить фильтры
            this.updateFilters(this.filters, this.controls);
            //Профильтровать данные
            this.filterData(this.data, this.filters, this.fdata);
            //Вывести результат
            this.updateView(this.view, this.header, this.fdata);
            //Показать div
            $('#' + this.dataContainer).show("fast");
        }
        else { $('#' + this.dataContainer).hide(); }
    };
    //////////////////////////////////////////////
    //          Работа с XML и общие функции    //   
    //////////////////////////////////////////////
    //Функция преобразования узла с атрибутами XML в данные
    this.nodeAttrToData = function (xml, selector, data) {
        //Пройдемся по всем узлам
        $(xml).find(selector).children().each(function (i) {
            n = this.attributes.length;
            data[i] = new Array();
            for (j = 0; j < n; j++) {
                attr = this.attributes[j]
                data[i][attr.name] = attr.value;
            }
        });
    };
    //Преобразование данных без атрибутов в таблицу
    this.nodeContentToData = function (xml, selector, data) {
        $(xml).find(selector).children().each(function (i) {
            data[i] = new Array();
            $(this).children().each(function (j) {
                data[i][this.nodeName] = $(this).text();
            });
        });
    };
    //Получить узел с атрибутами, а так же с дочерными элементами CDATA
    this.readNode = function (xml, selector, data) {
        $(xml).find(selector).children().each(function (i) {
            n = this.attributes.length;
            data[i] = new Array();
            for (j = 0; j < n; j++) {
                attr = this.attributes[j];
                data[i][attr.name] = attr.value;
            }
            if (this.childNodes.length == 1) {
                data[i].text = $(this).text();
            }
            $(this).children().each(function () {
                data[i][this.nodeName] = $(this).text();
            });
        });
    }
    //Сделать из таблицы массив
    this.selectColumn = function (table, array, columnName) {
        for (i = 0; i < table.length; i++) {
            array.push(table[i][columnName]);
        }
    };
    //Выбрать значения из одного столбца при заданном значении другого
    this.selectColumnWhere = function (table, array, columnName, fieldName, fieldValue) {
        if (fieldValue == '*') {
            selectColumn(table, array, columnName);
        }
        else {
            for (i = 0; i < table.length; i++) {
                if (table[i][fieldName] == fieldValue) {
                    array.push(data[i][columnName]);
                }
            }
        }
    };
    //Сортировать массив данных
    this.sortStrArray = function (arr, type) {
        if (type == 'numeric') {
            var sortArr = this.parseFloatArray(arr);
            sortArr.sort(function compareNumeric(a, b) {
                if (a > b) return 1;
                if (a < b) return -1;
            });
            sortArr = this.toStringArray(sortArr);
            return sortArr;
        }
        if (type == 'string') {
            arr.sort(function compareString(a, b) {
                if (a > b) return 1;
                if (a < b) return -1;
            });
           return arr;
        }
    };
    //Выбрать из массива уникальные значения
    this.selectDistinct = function (datain, dataout) {
        var isOk = true;
        if (datain.length > 0) {
            dataout.push(datain[0]);
        }
        for (var i = 1; i < datain.length; i++) {
            isOk = true;
            for (var j = 0; j < dataout.length; j++) {
                if (dataout[j] == datain[i]) {
                    isOk = false;
                }
            }
            if (isOk == true) dataout.push(datain[i]);
        }
    };
    //Выбрать набор массивов уникальной выборки из таблицы при заданных значениях полей
    this.selectDistinctArrays = function (table, fields, arrays) {
        var _arr = new Array();
        for (i = 0; i < fields.length; i++) {
            _arr[fields[i].id] = new Array();
            arrays[fields[i].id] = new Array();
        }
        for (i = 0; i < table.length; i++) {
            for (j = 0; j < fields.length; j++) {
                isOk = true;

                if (fields[j].refill == "1") {
                    for (k = 0; k < fields.length; k++) {
                        if (fields[j].id != fields[k].id) {
                            if (!((table[i][fields[k].id] == fields[k].value) || fields[k].value == '*' || fields[k].value == undefined || fields[k].value == "")) {
                                isOk = false;
                            }
                        }
                    }
                }

                if (isOk == true) {
                    _arr[fields[j].id].push(table[i][fields[j].id]);
                }
            }
        }
        for (i = 0; i < fields.length; i++) {
            var datain = _arr[fields[i].id];
            var dataout = new Array();
            this.selectDistinct(datain, dataout);
            arrays[fields[i].id] = dataout;
        }
    };
    //Найти ближайшее число к заданному в массиве
    this.findValue = function (arr, val, type) {
        var k, dVal, dValMin, valCloseLeft, valCloseRight;
        k = 0;
        dValMin = Math.abs(arr[k] - val);
        valCloseLeft = arr[0];
        valCloseRight = arr[1];
        for (var i = 1; i < arr.length; i++) {
            dVal = Math.abs(arr[i] - val);
            //Поиск минимального
            if (type == 'close' && dVal < dValMin) {
                dValMin = dVal;
                k = i;
            }
            //Поиск ближайшего большего
            if (type == 'more') {
                if (val > arr[arr.length - 1]) { return arr[arr.length - 1]; }
                if ((arr[i - 1] < val && arr[i] > val) || arr[i] == val) {
                    return arr[i];
                }
            }
        }
        return arr[k];
    };
    //Конвертировать массив строк в массив чисел
    this.parseFloatArray = function (arrIn) {
        var arrOut = new Array();
        for (var i = 0; i < arrIn.length; i++) {
            arrOut[i] = parseFloat(arrIn[i]);
        }
        return arrOut;
    };
    //Массив чисел в строку
    this.toStringArray = function (numArr) {
        for (var i = 0; i < numArr.length; i++) {
            numArr[i] = numArr[i].toString();
        }
        return numArr;
    }
    //Фунция преобразования родительского узла в данные
    this.nodeParentToData = function (parentNode, data) {
        //Пройдемся по всем узлам    
        for (i = 0; i < parentNode.childNodes.length; i++) {
            //Ссылка на узел
            node = parentNode.childNodes[i];
            data[i] = new Array();
            for (j = 0; j < node.childNodes.length; j++) {
                childNode = node.childNodes[j];
                data[i][childNode.nodeName] = childNode.text;
            }
        }
    };
    //Загрузить аттрибуты в массив
    this.attrsToArray = function (attrs, arr) {
        arr = new Array();
        for (i = 0; i < attrs.length; i++) {
            arr[attrs[i].name] = attrs[i].value;
        }
    };
    //Получить элемент массива по id
    this.getById = function (arr, id) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].id == id) return arr[i];
        }
        return null;
    };
    /////////////////////////////////////
    //          Настройки              //
    /////////////////////////////////////
    this.readSettings = function (xml, settings) {
        this.nodeAttrToData(xml, this.settingsPath, settings);
        for (i = 0; i < settings.length; i++) {
            if (settings[i]['default'] == '1') {
                this.setting = settings[i];
            }
        }
    };
    /////////////////////////////////////
    //          Контейнеры             //
    /////////////////////////////////////
    this.writeContainers = function (setting, views) {
        var view = this.getById(views, setting.viewBody);
        if (view != null) {
            $('body').append(view.body);

        }
    };
    /////////////////////////////////////
    //          Заголовки              //
    /////////////////////////////////////
    this.readTitles = function (xml, titles) {
        this.readNode(xml, this.titlesPath, titles);
    };
    /////////////////////////////////////
    //          Работа с данными       //
    /////////////////////////////////////
    //Получить полу по ID
    this.getFieldById = function (fields, id) {
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].id == id) {
                return fields[i];
            }
        }
    };
    //Загрузить подсказку
    this.readHint = function (xml, elements, path) {
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].hint == '1') {
                elements[i].hintBody = $(xml).find(path + ' #' + elements[i].id + ' hint').text();
            }
        }
    };
    //Загрузить шапку таблицы из xml
    this.readHeader = function (xml, header) {
        //Получить заголовок таблицы    
        this.nodeAttrToData(xml, this.headerPath, header);
        //Подсказка к результатам
        this.readHint(xml, header, this.headerPath);
    };
    //Загрузить таблицу из xml
    this.readData = function (xml, data) {
        this.nodeContentToData(xml, this.dataPath, data);
    };
    //////////////////////////////////////
    //          Работа с контролами     //
    //////////////////////////////////////
    //Получить ссылку на контрол по его id
    this.getControlById = function (controls, id) {
        for (var i = 0; i < controls.length; i++) {
            if (controls[i].id == id) {
                return controls[i];
            }
        }
        return null;
    }
    //Загрузить контролы из узла xml
    this.readControls = function (xml, controls) {
        //Массив всех контролов
        var _controls = new Array();
        //Загрузить контролы из xml
        this.nodeAttrToData(xml, this.controlsPath, _controls);
        //Прочесть дополнительные данные контрола и выбрать одну группу
        for (i = 0; i < _controls.length; i++) {
            //По умолчанию значение всех контролов в начале равно "*" (для всех)
            _controls[i].value = '*';
            //Если для контрола есть подсказка, то извлеч ее
            if (_controls[i].hint == '1') {
                _controls[i].hintBody = $(xml).find(this.controlsPath + ' #' + _controls[i].id + ' hint').text();
            }
            //Выбрать контролы одной группы
            if (_controls[i]['group'] == this.group)
                controls.push(_controls[i]);
        }
    };
    //Получить тело контрола из его типа
    this.createControlByType = function (id, type) {
        var isRichType = new Boolean();
        var ctrlProp = new Array();
        if (type.indexOf(':') > 0) { isRichType = true; }
        if (isRichType == true) {
            ctrlProp = type.split(':');
            //Создать input элемент
            if (ctrlProp[0] == 'input') {
                var inpType = ctrlProp[1];
                //Выбрать тип элемента
                ctrlBody = new $('<input>').attr('id', id).attr('type', inpType);
            }
        }
        return ctrlBody;
    };
    //Вывести подсказку
    //this.writeHint = function (id, type, $body, $title, $container) {
    //    var $ctrlHintIcon = $('<img>').attr('id', 'img' + id + type).attr('src', 'images/hint.gif').addClass('clsHintImg').attr('divHint', 'divHintBody_' + id + type);
    //    //Значок подсказки вставляем после описания контрола
    //    $title.after($ctrlHintIcon);
    //    //Тело подсказки вставляем после контрола и скрываем его
    //    $('<div></div>').attr('id', 'divHintBody_' + id + type).addClass('clsHintBody').append($body).appendTo($container).hide();
    //}
    //Вывести контролы в html
    this.writeControls = function (controls) {
        //Ссылка на главный контейнер
        var $ctrlMainContainer = $('#' + this.controlsContainer);
        var $controlContainer = $("<center></center>").appendTo($ctrlMainContainer);
        //филд сет нужен что бы сделать колонки с полями и примечаниями

        for (i = 0; i < controls.length; i++) {
            //Если контрол не является вспомогательным
            if (controls[i].ref == undefined) {
                //Ссылки на дочерный контейнер и таблица выравнивания
                var $fs = $('<fieldset></fieldset>').addClass("ui-grid-c").appendTo($controlContainer);
                var $td0 = $('<div style="width:0%"></div>').addClass("ui-block-a").append("&nbsp;").appendTo($fs);
                var $td1 = $('<div style="white-space:nowrap;width:84%;margin:7px"></div>').addClass("ui-block-b").appendTo($fs);
                var $td2 = $('<div style="white-space:nowrap;width:11%;position:relative;top:5px;"></div>').addClass("ui-block-c").appendTo($fs);

                //Создать конотрол, его описание, подсказку и тело подсказки 
                var $ctrlElement = $('<' + controls[i].type + '>').addClass(this.clsControl).attr('data-theme', 'c').attr('id', controls[i].id).appendTo($td1);

                //Если для контрола есть подсказка, то вставить ее
                if (controls[i].hint == '1') {
                    var $hint = $('<a href="#popup"></a>').attr("data-placeholder", "false").attr("data-rel", "dialog").attr("data-transition", "none").attr("data-theme", "e").attr("data-icon", 'info').attr("data-iconpos", 'notext').attr("data-mini", 'false').attr("data-inline", 'true').attr('data-transition', 'none').attr('data-role', 'button').text("Примечание").attr("value", controls[i].hintBody).appendTo($td2);
                    $hint.bind("click", function () {
                        $("#popupdata").empty().append(this.value).unbind("click").bind("click", function () { $('#btnOne').click(); });
                        $("#popupheader").text("");
                    });
                }
            }
            else {
                //Вставить вспомогательный контрол
                //var $ctrlRefElement = this.createControlByType(controls[i].id, controls[i].type);
                //$('#' + controls[i].ref).before($ctrlRefElement);
            }
        }
    };
    //Забиндить реакцию пользователя
    this.bindControls = function (controls) {
        $this = this;
        //Выбор значения (выпадающий список)
        $("." + this.clsControl).change(function () {
            $this.updateData();
        });        
        //Поиск значений в другом контроле
        for (var i = 0; i < controls.length; i++) {
            if (controls[i].ref != undefined) {
                $('#' + controls[i].id).bind('keyup change', function () {
                    var val = parseFloat($(this).val());
                    var controlId = $(this).attr('id');
                    var control = $this.getControlById(controls, controlId);
                    var refControl = $this.getControlById(controls, control.ref);
                    var arr = $this.parseFloatArray(refControl.options);
                    var refVal = $this.findValue(arr, val, control.findType);
                    refControl.value = refVal;
                    //$('#' + $this.controls[j].id).selectmenu("refresh");
                    $('#' + refControl.id).val(refVal);
                    $this.updateData();
                });
            }
        }
    };
    //Подсказки
    //this.bindHints = function () {
    //    //Клик по хинту
    //    $('.clsHintImg').live('click', function () {
    //        var $divHintBody = $('#' + $(this).attr('divHint'));
    //        $divHintBody.slideToggle();
    //    });
    //};
    //Заполнить выпадающий список
    this.fillSelect = function (control, sort, type) {
        var selectId = control.id;
        var options  = control.options;
        var $select = $('#' + selectId);
        var _options = new Array();
        if (sort == true) {
            _options = this.sortStrArray(options, type);
        }
        else {
            _options.push(options);
        }
        //Очистить содержимое
        $select.empty();
        //Звездочки для всей выборки 
        $('<option value=\'*\'></option>').attr('data-placeholder', 'true').appendTo($select).text(control.title);
        for (j = 0; j < options.length; j++) {
            $('<option></option>').appendTo($select).text(options[j]);
        }
    };

    //Заполнить хедер страниы
    this.writeTitle = function (titles, name, div) {
        for (var i = 0; i < titles.length; i++) {
            //Выбрать только поля основных контролов
            if (titles[i].type == name) {
                var $ctrlMainContainer = $('#' + div);
                var $ctrlTitle = $('<h4>' + titles[i].text + '</h4>');
                //Вставить, созданные элементы
                $('<div></div>').append($ctrlTitle).appendTo($ctrlMainContainer);
            }
        }
    };
    //Заполнить контролы значениями
    this.fillControls = function (controls, data) {
        //Массив уникальных значений для каждого поля
        var values = new Array();
        var fileds = new Array();
        //Выбрать уникальные значения для всех полей        
        for (var i = 0; i < controls.length; i++) {
            //Выбрать только поля основных контролов
            if (controls[i].ref == undefined) {
                    fileds.push(controls[i]);
            }
        }
        //Выбрать уникальные значения из всей таблицы в зависимости от выбранных значений (как join left)
        this.selectDistinctArrays(data, fileds, values);
        for (var j = 0; j < controls.length; j++) {
            if (controls[j].type == 'select') {
                controls[j].options = values[controls[j].id];
                var isSort = controls[j].sort == '1' ? true : false;
                this.fillSelect(controls[j], isSort, controls[j].valueType);
            }
        }
    };
    //Перезалить данные контролов исходя из выбранных
    this.refillControls = function (controls, data) {
        this.fillControls(controls, data);
        for (var i = 0; i < controls.length; i++) {
            if (controls[i].type == 'select') {
                $('#' + controls[i].id).val(controls[i].value);
                $('#' + controls[i].id).selectmenu("refresh");
            }
        }
    };
    //Получить значения каждого контрола
    this.updateControls = function (controls) {
        this.controlsIsReady = true;
        ctrlFocusId = $('.' + this.clsControl + ':focus').attr('id');
        for (i = 0; i < controls.length; i++) {
            //Прочитать значение контрола
            controls[i]['value'] = $('#' + controls[i].id).val();
            //Если в каком-то контроле невыбрано значение, то контролы не готовы
            if (controls[i]['value'] == "*") {
                $this.controlsIsReady = false;
            }
            //Все контролы по умолчанию невыбраны, сделать выбранным контрол с фокусом
            controls[i]['choosen'] = false;
            if (controls[i]['id'] == ctrlFocusId) {
                controls[i]['choosen'] = true;
            }
            //try to save controls into the danfoss base
        }
    };
    //////////////////////////////////////
    //          Работа с отображением   //
    //////////////////////////////////////
    //Загрузить отображение
    this.readViews = function (xml, views, fileds) {
        $(xml).find(this.viewsPath).children().each(function (i) {
            $thisView = $(this);
            views[i] = new Array();
            views[i].id = $thisView.attr('id');
            views[i].type = $thisView.attr('type');
            views[i].def = $thisView.attr('def');
            if (views[i].def != '1') {
                views[i].body = $thisView.text();
            }
            else {
                views[i].body = this.createView(views[i].type, fileds);
            }
        });
    };
    //Выбрать отображение
    this.selectView = function (views, setting, view) {
        _defaultView = new Array();
        for (i = 0; i < views.length; i++) {
            if (setting.view == views[i].id) {
                this.view = views[i];
                setting.viewtype = this.view.type;
                break;
            }
            if (views[i].defaultView == '1') {
                _defaultView = views[i].defaultView;
            }
        }
        if (this.view.id == undefined) {
            this.view = _defaultView;
        }
    };

    this.offline = function () {
        $("#btnStock").hide();
        $("#infoStock").show();
    }
    this.online = function () {
        $("#btnStock").show();
        $("#infoStock").hide();
    }

    this.getUrlString = function (obj)
    {
        var str = Object.keys(obj).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
        }).join('&');
        return str;
    }

    //      Отрисовка шаблона данных    //
    //Создать отображение
    this.writeView = function (view, fields) {
        if (view.type == 'template') {

            $this = this;

            $('<div></div>').append($this.view.body).appendTo('#' + $this.dataContainer);

            //if (platform == "1") //iOS
            //{
                var jsonRequestParams = {
                    method: 'authP',
                    param: 'guid=' + GUID +
                        '&jsoncallback='
                };
                getDanfossData(jsonRequestParams, $this);

            //} else {
            //    $.get(EXTDS + '/authP', function (data) {
            //        $.getJSON(EXTDS + '/authP?jsoncallback=?', { guid: GUID }, function (data) {
            //            $this.online();
            //        }).error(function () {
            //            $this.offline();
            //        });
            //    }).error(function (re, error) {
            //        $this.offline();
            //    });
            //}

            for (i = 0; i < $this.views.length; i++) {
                if ($this.views[i].id == "viewResult") {
                    $("#query_results").append($this.views[i].body);
                }
            }

            $("#btnStock").live("click", function () {

                $("#query_results").hide();
                $("#results_loader").show();

                $("#divOrder").trigger('collapse');

                if (platform == "1") //iOS
                {
                    var jsonRequestParams = {
                        method: 'stockP',
                        param: 'material=' + $("#viewV_seriesID").text() +
                            '&lang=' + language +
                            '&guid=' + GUID +
                            '&jsoncallback='
                    };
                    getDanfossData(jsonRequestParams, $this);
                }
                else { //Android ((( теряется контекст, поэтому оставлен старый метод получения данных
                    $.getJSON(EXTDS + '/stockP?jsoncallback=?', { material: $("#viewV_seriesID").text(), guid: GUID, lang: language }, function (data) {
                        $("#results_loader").hide();
                        $("#query_results").show();
                        $("#query_results").find('#viewR_material').text(data.Material);
                        $("#query_results").find('#viewR_price').text(data.Price);
                        $("#query_results").find('#viewR_status').text(data.Status);
                        $("#query_results").find('#viewR_status').css("color", data.Color)
                    });
                }

            }).error(function () { });

            $("#btnOrder").live("click", function () {

                $('#btnOrder').addClass('ui-disabled');
                $this.db_savePersonalData();

                if (platform == "1") //iOS
                {
                    var jsonRequestParams = {
                        method: 'checkP',
                        param: 'qty=' + $("#query_results").find("#slider")[0].value +
                            '&name=' + $("#query_results").find("#username")[0].value +
                            '&tel=' + $("#query_results").find("#phonenumber")[0].value +
                            '&mail=' + $("#query_results").find("#emailaddres")[0].value +
                            '&lang=' + language +
                            '&guid=' + GUID
                    };
                    getDanfossData(jsonRequestParams, $this);
                }
                else { //Android ((( теряется контекст, поэтому оставлен старый метод получения данных
                    $.getJSON(EXTDS + '/checkP?jsoncallback=?', {
                        qty: $("#query_results").find("#slider")[0].value,
                        name: $("#query_results").find("#username")[0].value,
                        tel: $("#query_results").find("#phonenumber")[0].value,
                        mail: $("#query_results").find("#emailaddres")[0].value,
                        guid: GUID,
                        lang: language
                    }, function (data) {
                        if (data[1] != "0") {
                            $('#btnOrder').removeClass('ui-disabled');
                            if (language == "ru") {
                                $("#popupdata").empty().append("<h4>Пожалуйста укажите необходимое кол-во и заполните ваши контактные данные</h4>").append(data[0]).unbind("click").bind("click", function () { $('#btnTwo').click(); });
                                $("#popupheader").empty().append("<font>Ошибка!</font>").css("color", "#EE4433");
                            } else {
                                $("#popupdata").empty().append("<h4>Please select the quantity and fill your personal contact information.</h4>").append(data[0]).unbind("click").bind("click", function () { $('#btnTwo').click(); });
                                $("#popupheader").empty().append("<font>Warning!</font>").css("color", "#EE4433");
                            }

                            $("#btnPopup").click();
                        }
                        else {
                            $.getJSON(EXTDS + '/orderP?jsoncallback=?', { power: $("#viewV_power").text(), uses: $('#uses')[0].value, material: $("#viewV_seriesID").text(), type: "1", qty: $("#query_results").find("#slider")[0].value, name: $("#query_results").find("#username")[0].value, tel: $("#query_results").find("#phonenumber")[0].value, mail: $("#query_results").find("#emailaddres")[0].value, guid: GUID }, function (data) {
                                $("#btnThree").click();
                                $('#btnOrder').removeClass('ui-disabled');
                            });
                        }
                    });
                }

            }).error(function () { });
        }
        if (view.type == 'div') {
            this.writeViewDiv(fields);
        }
    };
    //Создать отображение DIV
    this.writeViewDiv = function (fields) {
        for (var i = 0; i < fields.length; i++) 
        {
            //Индификатор поля
            var id = fields[i].ref;
            //Контейнер для одного поля
            var $div = $('<div></div>').attr('id', 'divView_' + id);
            //Заголовок поля
            var $spanT = $('<span>').attr('id', 'viewT_' + id);
            //Значение поля
            var $spanV = $('<span>').attr('id', 'viewV_' + id).addClass('clsViewValue');
            //Вставить заголовок и значение в контенер, а контейнер в главный контейнер
            $div.append($spanT).append($spanV).appendTo('#' + this.dataContainer);
            //Вставить подсказки, если есть
            //if (fields[i].hint == '1') {
            //    this.writeHint(fields[i].ref, 'view', fields[i].hintBody, $spanT, $div);
            //}
        }
    };
    //Обновить представление
    this.updateView = function (view, fields, data) {
        if (view.type == 'template') {
            this.updateViewDiv(fields, data);
        }
        else if (view.type == 'div') {
            this.updateViewDiv(fields, data);
        }
        else if (view.type == 'table') {
            this.updateViewTable(fields, data);
        }
    };
    //Отрисовка таблицы
    this.updateViewTable = function (view, headData, bodyData) {
        $('#tblData thead').children().empty();
        //Вставить заголовок
        for (i = 0; i < headData.length; i++) {
            if (headData[i]['visible'] == 1) {
                $('#tblData thead tr').append('<th>' + headData[i]['title'] + '</th>');
            }
        }
        body = $("#tblData tbody");
        //Очищаем тело таблицы
        $(body).empty();
        for (i = 0; i < bodyData.length; i++) {
            //Ссылка на вставленную строку
            var tr = $('<tr></tr>').appendTo(body);
            for (j = 0; j < headData.length; j++) {
                if (headData[j]['visible'] == 1) {
                    name = headData[j]['name'];
                    tr.append('<td>' + bodyData[i][name] + '</td>');
                }
            }
        }
    };
    //Отрисовка единичного набора данных в произвольных тэгах с tag.id == data.id
    this.updateViewDiv = function (fields, data) {
        $divData = $('#' + this.dataContainer);
        for (i = 0; i < fields.length; i++) {
            $divData.find('#viewT_' + fields[i].ref).text(fields[i].title);
            $divData.find('#viewV_' + fields[i].ref).text(data[0][fields[i].ref]);
        }
    };
    //////////////////////////////////////
    //          Работа с фильтрами      //
    //////////////////////////////////////
    //Загрузить фильтры из xml
    this.readFilters = function (xml, filters) {
        var _filters = new Array();
        this.nodeAttrToData(xml, this.filtersPath, filters);
        //Выбрать фильтры только одной группы
        for (i = 0; i < _filters.length; i++) {
            if (cfg.group == _filters[i]['group']) {
                filters.push(_filters[i]);
            }
        }
    };
    //Обновить фильтры в соответствии со значениями в контролах
    this.updateFilters = function (filters, controls) {
        for (i = 0; i < filters.length; i++) {
            //Проверить фильтры с одной переменной сравнения
            if (filters[i]['type'] == 'equal' || filters[i]['type'].indexOf('more') == 0 || filters[i]['type'].indexOf('less') == 0) {
                for (j = 0; j < controls.length; j++) {
                    if (controls[i]['id'] == filters[i]['c1']) {
                        filters[i]['v1'] = controls[i]['value'];
                    }
                }
            }
            else if (filters[i]['type'].indexOf(between) == 0) {
                for (j = 0; j < controls.length; j++) {
                    if (controls[i]['id'] == filters[i]['c1']) {
                        filters[i]['v1'] = controls[i]['value'];
                    }
                    if (controls[i]['id'] == filters[i]['c2']) {
                        filters[i]['v2'] = controls[i]['value'];
                    }
                }
            }
        }
    };
    //Проверить валидность значения контрола и соответствующего ему фильтра
    this.validValue = function (value, filter) {
        var v = parseFloat(value);
        var v1 = parseFloat(filter.v1);
        var v2 = parseFloat(filter.v2);
        if (filter.v1 == '*') {
            return true;
        }
        else if (filter.type == 'equal' && value == filter.v1) {
            return true;
        }
        else if (filter.type == 'more:off' && v > v1) {
            return true;
        }
        else if (filter.type == 'more:on' && v >= v1) {
            return true;
        }
        else if (filter.type == 'less:off' && v < v1) {
            return true;
        }
        else if (filter.type == 'less:on' && v <= v1) {
            return true;
        }
        else if (filter.type == 'between:off' && (v > v1 && v < v2)) {
            return true;
        }
        else if (filter.type == 'between:on' && (v > v1 && v < v2)) {
            return true;
        }
        else { return false; }
    };
    //Профильтровать данные
    this.filterData = function (dataIn, filters, dataOut) {
        //Очистить выходные данные
        dataOut.length = 0;
        //Отфильтровать данные по встроенным фильтрам в контролы
        var n = dataIn.length;
        var m = filters.length;
        for (i = 0; i < n; i++) {
            isOk = true;
            for (j = 0; j < m; j++) {
                if (this.validValue(dataIn[i][filters[j]['field']], filters[j]) == false) {
                    isOk = false;
                    break;
                }
            }
            if (isOk == true) {
                dataOut.push(dataIn[i]);
            }
        }

    };
    //////////////////////////////
    //      События             //
    //////////////////////////////
    //Обработка реакции пользователя
    this.bindEvents = function (controls) {
        this.bindControls(controls);
        //this.bindHints();
    };

}

function errorSQL(er) {
    //alert(er.message); 
}

