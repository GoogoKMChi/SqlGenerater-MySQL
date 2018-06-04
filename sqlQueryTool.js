var Table = /** @class */ (function () {
    function Table() {
        this.fields = this.sqlString = this.tableName = this.condition = '';
        this.blankSpace = ' ';
        this._andorValid = true;
    }
    /**
     * 设置表名
     * @param tableName 要选择的表名称
     */
    Table.prototype.table = function (tableName) {
        this.tableName = '`' + tableName + '`';
        return this;
    };
    Table.prototype.where = function (condition) {
        return this.whereBuilder(condition, 'AND');
    };
    Table.prototype.whereor = function (condition) {
        return this.whereBuilder(condition, 'OR');
    };
    /**
     * where 构造器
     * @param condition 要处理的条件，string或object，如果是string则直接返回，如果是object则进行处理
     * @param method 可选参数,condition处理时的关系，为AND或OR，默认为AND
     */
    Table.prototype.whereBuilder = function (condition, method) {
        if (method === void 0) { method = 'AND'; }
        this._andorValid = true;
        // 级联设置where的话后新加入的条件整体用（）独立包围
        var alreadySet = false;
        if (this.condition !== '') {
            this.condition += '(';
            alreadySet = true;
        }
        if (typeof condition === 'string') {
            // 传入sql字符串的话直接设置condition
            this.condition += condition;
        }
        else if (typeof condition === 'object') {
            // 将数组中的条件拼接起来
            var concatenation = [];
            for (var unit in condition) {
                if (typeof condition[unit] !== 'object') {
                    concatenation.push('`' + unit + '` =' + this.blankSpace + '\'' + condition[unit] + '\'');
                }
                else if (typeof condition[unit] === 'object') {
                    try {
                        var expression = this.generateConditionExpression(condition[unit][0], condition[unit][1]);
                        concatenation.push('`' + unit + '`' + this.blankSpace + expression);
                    }
                    catch (err) {
                        console.error(err.message);
                    }
                }
            }
            this.condition += concatenation.join(this.blankSpace + method + this.blankSpace);
        }
        this.condition += alreadySet ? ')' : '';
        return this;
    };
    Table.prototype.and = function () {
        this._andorValid = false;
        this.condition = '(' + this.condition + ')' + this.blankSpace + ' AND ';
        return this;
    };
    Table.prototype.or = function () {
        this._andorValid = false;
        this.condition = '(' + this.condition + ')' + this.blankSpace + ' OR ';
        return this;
    };
    /**
     * 生成limit限制
     * @param limit1 若只选一个参数，则表示offset从0开始选取limit1行的数据
     * @param limit2 可选，如果选择第二个参数，则限定从offset limit1开始limit2行的数据（offset从0开始）
     */
    Table.prototype.limit = function (limit1, limit2) {
        return this;
    };
    /**
     * 生成select语句
     * @param field 可选参数，值可以为string或Array<string>
     * field为空的话则选择全部（*），如果不为空则选择填写的字段
     */
    Table.prototype.select = function (field) {
        try {
            //验证下必要信息
            this.sqlUnitVerifier();
            // 如果有选择字段则拼接，否则选择全部
            if (field) {
                if (typeof field === 'string') {
                    this.fields = field;
                }
                else if (typeof field === 'object') {
                    this.fields = '\'' + field.join('\',\'') + '\'';
                }
            }
            else {
                this.fields = '*';
            }
            var sqlArr = ['SELECT', this.fields, 'FROM', this.tableName, 'WHERE', this.condition];
            this.reset();
            return sqlArr.join(this.blankSpace);
        }
        catch (err) {
            this.reset();
            console.error(err.message);
        }
    };
    /**
     * 生成insert语句
     * @param data object或Array，传入object返回value（value1，value2），Array返回value(?,?,?)
     */
    Table.prototype.insert = function (data) {
        if (data) {
            try {
                //验证下必要信息
                this.sqlUnitVerifier();
                if (typeof data === 'string') {
                    if (data.indexOf(',') !== -1)
                        data = data.split(',');
                    else
                        data = data.split(' ');
                }
                var key = [];
                var value = [];
                var isArray = Array.isArray(data);
                for (var i in data) {
                    key.push('`' + isArray ? data[i] : i + '`');
                    value.push(isArray ? '?' : ('\'' + data[i] + '\''));
                }
                var sqlArr = ['INSERT INTO', this.tableName, '(' + key.join(',') + ')', 'VALUES', '(' + value.join(',') + ')'];
                this.reset();
                return sqlArr.join(this.blankSpace);
            }
            catch (err) {
                this.reset();
                console.error(err.message);
            }
        }
        else {
            this.reset();
            console.error('insert expect at least one parameter');
        }
    };
    /**
     * 生成update语句
     * @param data
     * @param full 可选，默认false，生成`key`=?的形式
     */
    Table.prototype.update = function (data) {
        if (data) {
            try {
                //验证下必要信息
                this.sqlUnitVerifier();
                if (typeof data === 'string') {
                    if (data.indexOf(',') !== -1)
                        data = data.split(',');
                    else
                        data = data.split(' ');
                }
                var setValue = [];
                var isArray = Array.isArray(data);
                for (var i in data) {
                    setValue.push('`' + (isArray ? data[i] : i) + '`=' + (!isArray ? '\'' + data[i] + '\'' : '?'));
                }
                var sqlArr = ['UPDATE', this.tableName, 'SET', setValue.join(','), 'WHERE', this.condition];
                this.reset();
                return sqlArr.join(this.blankSpace);
            }
            catch (err) {
                this.reset();
                console.error(err.message);
            }
        }
        else {
            this.reset();
            console.error('update expect at least one parameter');
        }
    };
    /**
     * 生成删除语句
     */
    Table.prototype.delete = function () {
        try {
            //验证下必要信息
            this.sqlUnitVerifier();
            var sqlArr = ['DELETE FROM', this.tableName, 'WHERE', this.condition];
            this.reset();
            return sqlArr.join(this.blankSpace);
        }
        catch (err) {
            this.reset();
            console.error(err.message);
        }
    };
    /**
     * sql元验证
     */
    Table.prototype.sqlUnitVerifier = function () {
        if (this.tableName === '') {
            throw new Error('please set table that used');
        }
        if (!this._andorValid) {
            throw new Error('condition can not end with and() or or()');
        }
        // 如果没有填写任何where条件的话自动将condition设置为恒真
        if (this.condition === '')
            this.condition = 'true';
    };
    /**
     * 生成条件表达式
     * @param value 表达式的右值
     * @param type 表达式运算法则类型
     */
    Table.prototype.generateConditionExpression = function (value, type) {
        if (typeof value !== 'string') {
            throw new Error('expression value only accept string');
        }
        type = type.toUpperCase();
        var expression;
        switch (type) {
            case '>':
            case '>=':
            case '<':
            case '<=':
            case '=':
            case '!=':
                expression = type + this.blankSpace + '\'' + value + '\'';
                break;
            case 'BETWEEN':
                expression = type + this.blankSpace + this.generateConditionExpressionBeteen(value);
                break;
            case 'LIKE':
                expression = type + this.blankSpace + '\'%' + value + '%\'';
                break;
            case 'RLIKE':
                expression = 'LIKE' + this.blankSpace + '\'' + value + '%\'';
                break;
            case 'LLIKE':
                expression = 'LIKE' + this.blankSpace + '%\'' + value + '\'';
                break;
            case 'NOT LIKE':
            case 'NOTLIKE':
                expression = 'NOT LIKE' + this.blankSpace + '\'' + value + '\'';
                break;
            case 'NOTIN':
            case 'NOT IN':
                expression = 'NOT IN' + this.blankSpace + '(' + '\'' + value.split(',').join('\',\'') + '\'' + ')';
                break;
            case 'IN':
                expression = type + this.blankSpace + '(' + '\'' + value.split(',').join('\',\'') + '\'' + ')';
                break;
            default:
                expression = '=' + this.blankSpace + '\'' + value + '\'';
        }
        return expression;
    };
    /**
     * 验证加处理BETWEEN的参数
     * @param value
     */
    Table.prototype.generateConditionExpressionBeteen = function (value) {
        var params = value.split(',');
        if (params.length !== 2) {
            throw new Error('between param not valid.like \'1,2\'');
        }
        return '\'' + params[0] + '\' AND \'' + params[1] + '\'';
    };
    // 清空记录
    Table.prototype.reset = function () {
        this.fields = this.sqlString = this.tableName = this.condition = '';
    };
    return Table;
}());
var test = new Table();
test.table('123').where({
    a: 3, b: '2', c: ['3', 'not in'], d: ['3,6,9', 'in'], e: ['ac', 'like']
}).select();
test.table('user').insert({
    name: 'kmc',
    age: '18',
    account: 'googokmchi'
});
test.table('user').insert({
    name: 'cmk',
    age: '81',
    account: 'ihcmkogoog'
});
test.table('user').insert(['name', 'age', 'account']);
test.table('updated').where({
    number: ['1,4', 'between']
}).update({
    name: 'whatever',
    sex: 'who knows'
});
//# sourceMappingURL=sqlQueryTool.js.map