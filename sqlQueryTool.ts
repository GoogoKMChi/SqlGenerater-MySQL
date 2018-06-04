class Table {
    // 最终生成的sql语句
    private sqlString: string
    // 要获取的字段，默认全部（*）
    private fields: string
    // 搜索的条件
    private condition: string
    // limti限定
    private conditionLimit: string
    // 要操作的表名
    private tableName: string
    // 拼接时用的空格分割字符
    private blankSpace: string
    // 保证使用and或or方法时where或whereor方法的合法性(保证链式中and和or方法不是最后一次调用)
    private _andorValid: boolean
    // Join字符串
    private joinSql: string

    constructor() {
        this.fields = this.sqlString = this.tableName = this.condition = this.joinSql = ''
        this.blankSpace = ' '
        this._andorValid = true
    }

    /**
     * 设置表名
     * @param tableName 要选择的表名称
     */
    public table(tableName: string): Table {
        this.tableName = '`' + tableName + '`'
        return this
    }

    /**
     * where AND
     * 生成且链接的语句
     * @param condition
     */
    public where(condition: string, full?: boolean): Table
    public where(condition: object, full?: boolean): Table
    public where(condition: any, full: boolean): Table {
        return this.whereBuilder(condition, 'AND', full)
    }
    /**
     * where OR
     * 生成或链接的语句
     * @param condition
     */
    public whereor(condition: string, full?: boolean): Table
    public whereor(condition: object, full?: boolean): Table
    public whereor(condition: any, full?: boolean): Table {
        return this.whereBuilder(condition, 'OR', full)
    }
    /**
     * where 构造器
     * @param condition 要处理的条件，string或object，如果是string则直接返回，如果是object则进行处理
     * @param method 可选参数,condition处理时的关系，为AND或OR，默认为AND
     */
    private whereBuilder(condition: any, method = 'AND', full = false): Table {
        this._andorValid = true
        // 级联设置where的话后新加入的条件整体用（）独立包围
        let alreadySet = false
        if (this.condition !== '') {
            this.condition += '('
            alreadySet = true
        }
        if (typeof condition === 'string') {
            if (full) {
                // 传入sql字符串的话直接设置condition
                this.condition += condition
                this.condition += alreadySet ? ')' : ''
                return this
            } else {
                // 对传入的字符串进行切割并处理
                let tmpConditionArr = []
                let transCondition = {}
                tmpConditionArr = condition.split(',')
                tmpConditionArr.forEach(item => {
                    let combin = item.split(' ')
                    if (combin.length === 1) {
                        transCondition[combin[0]] = ['=']
                    } else {
                        transCondition[combin[0]] = [combin[1]]
                    }
                })
                condition = transCondition
            }
        }
        if (typeof condition === 'object') {
            // 将数组中的条件拼接起来
            let concatenation = []
            for (let unit in condition) {
                if (typeof condition[unit] !== 'object') {
                    concatenation.push('`' + unit + '` =' + this.blankSpace + '\'' + (full ? condition[unit] : '?') + '\'')
                } else if (Array.isArray(condition[unit])) {
                    try {
                        let value = ''
                        let type = ''
                        if (condition[unit].length === 1) {
                            value = '?'
                            type = condition[unit][0]
                        } else if (condition[unit].length === 2){
                            value = condition[unit][0]
                            type = condition[unit][1]
                        }
                        let expression = this.generateConditionExpression(value, type)
                        concatenation.push('`' + unit + '`' + this.blankSpace + expression)
                    } catch (err) {
                        console.error(err.message)
                    }
                }
            }
            this.condition += concatenation.join(this.blankSpace + method + this.blankSpace)
        }
        this.condition += alreadySet ? ')' : ''
        return this
    }

    public and(): Table {
        this._andorValid = false
        this.condition = '(' + this.condition + ')' + this.blankSpace + ' AND '
        return this
    }

    public or(): Table {
        this._andorValid = false
        this.condition = '(' + this.condition + ')' + this.blankSpace + ' OR '
        return this
    }

    /**
     * 生成limit限制
     * @param limit1 若只选一个参数，则表示offset从0开始选取limit1行的数据
     * @param limit2 可选，如果选择第二个参数，则限定从offset limit1开始limit2行的数据（offset从0开始）
     */
    public limit(limit1: number, limit2?: number): Table {
        return this
    }

    /**
     * 生成select语句
     * @param field 可选参数，值可以为string或Array<string>
     * field为空的话则选择全部（*），如果不为空则选择填写的字段
     */
    public select(field?: string | string[]): string {
        try {
            //验证下必要信息
            this.sqlUnitVerifier()
            // 如果有选择字段则拼接，否则选择全部
            if (field) {
                if (typeof field === 'string') {
                    this.fields = field
                } else if (typeof field === 'object') {
                    this.fields = '\'' + field.join('\',\'') + '\''
                }
            } else {
                this.fields = '*'
            }
            let sqlArr = ['SELECT', this.fields, 'FROM', this.tableName, this.joinSql, 'WHERE', this.condition]
            this.reset()
            return sqlArr.join(this.blankSpace)
        } catch (err) {
            this.reset()
            console.error(err.message)
        }
    }

    /**
     * 简单加入join
     * @param sql
     */
    public join(sql: string): Table {
        this.joinSql = sql
        return this
    }

    /**
     * 生成insert语句
     * @param data object或Array，传入object返回value（value1，value2），Array返回value(?,?,?)
     */
    public insert(data: object | Array<string> | string): string {
        if (data) {
            try {
                //验证下必要信息
                this.sqlUnitVerifier()
                if (typeof data === 'string') {
                    if (data.indexOf(',') !== -1)
                        data = data.split(',')
                    else data = data.split(' ')
                }
                let key = []
                let value = []
                let isArray = Array.isArray(data)
                for (let i in data) {
                    key.push('`' + isArray ? data[i] : i + '`')
                    value.push(isArray ? '?' : ('\'' + data[i] + '\''))
                }
                let sqlArr = ['INSERT INTO', this.tableName, '(' + key.join(',') + ')', 'VALUES', '(' + value.join(',') + ')']
                this.reset()
                return sqlArr.join(this.blankSpace)
            } catch (err) {
                this.reset()
                console.error(err.message)
            }
        } else {
            this.reset()
            console.error('insert expect at least one parameter')
        }
    }

    /**
     * 生成update语句
     * @param data
     * @param full 可选，默认false，生成`key`=?的形式
     */
    public update(data: object | Array<string> | string): string {
        if (data) {
            try {
                //验证下必要信息
                this.sqlUnitVerifier()
                if (typeof data === 'string') {
                    if (data.indexOf(',') !== -1)
                        data = data.split(',')
                    else data = data.split(' ')
                }
                let setValue = []
                let isArray = Array.isArray(data)
                for (let i in data) {
                    setValue.push('`' + (isArray ? data[i] : i) + '`=' + (!isArray ? '\'' + data[i] + '\'' : '?'))
                }
                let sqlArr = ['UPDATE', this.tableName, 'SET', setValue.join(','), 'WHERE', this.condition]
                this.reset()
                return sqlArr.join(this.blankSpace)
            } catch (err) {
                this.reset()
                console.error(err.message)
            }
        } else {
            this.reset()
            console.error('update expect at least one parameter')
        }
    }
    /**
     * 生成删除语句
     */
    public delete(): string {
        try {
            //验证下必要信息
            this.sqlUnitVerifier()
            let sqlArr = ['DELETE FROM', this.tableName, 'WHERE', this.condition]
            this.reset()
            return sqlArr.join(this.blankSpace)
        } catch (err) {
            this.reset()
            console.error(err.message)
        }
    }
    /**
     * sql元验证
     */
    private sqlUnitVerifier(): void {
        if (this.tableName === '') {
            throw new Error('please set table that used')
        }
        if (!this._andorValid) {
            throw new Error('condition can not end with and() or or()')
        }
        // 如果没有填写任何where条件的话自动将condition设置为恒真
        if (this.condition === '') this.condition = 'true'
    }

    /**
     * 生成条件表达式
     * @param value 表达式的右值
     * @param type 表达式运算法则类型
     */
    private generateConditionExpression(value: string, type: string): string {
        if (typeof value !== 'string') {
            throw new Error('expression value only accept string')
        }
        type = type.toUpperCase()
        let expression: string
        switch (type) {
            case '>':
            case '>=':
            case '<':
            case '<=':
            case '=':
            case '!=':
                expression = type + this.blankSpace + '\'' + value + '\''
                break
            case 'BETWEEN':
                expression = type + this.blankSpace + this.generateConditionExpressionBeteen(value)
                break
            case 'LIKE':
                expression = type + this.blankSpace + '\'%' + value + '%\''
                break
            case 'RLIKE':
                expression = 'LIKE' + this.blankSpace + '\'' + value + '%\''
                break
            case 'LLIKE':
                expression = 'LIKE' + this.blankSpace + '%\'' + value + '\''
                break
            case 'NOT LIKE':
            case 'NOTLIKE':
                expression = 'NOT LIKE' + this.blankSpace + '\'' + value + '\''
                break
            case 'NOTIN':
            case 'NOT IN':
                expression = 'NOT IN' + this.blankSpace + '(' + '\'' + value.split(',').join('\',\'') + '\'' + ')'
                break
            case 'IN':
                expression = type + this.blankSpace + '(' + '\'' + value.split(',').join('\',\'') + '\'' + ')'
                break
            default:
                expression = '=' + this.blankSpace + '\'' + value + '\''
        }
        return expression
    }
    /**
     * 验证加处理BETWEEN的参数
     * @param value
     */
    private generateConditionExpressionBeteen(value: string): string {
        let params = value.split(',')
        if (params.length !== 2) {
            //throw new Error('between param not valid.like \'1,2\'')
            return '\'?\' AND \'?\''
        }
        return '\'' + params[0] + '\' AND \'' + params[1] + '\''
    }
    // 清空记录
    private reset(): void {
        this.fields = this.sqlString = this.tableName = this.condition = this.joinSql = ''
    }
}

let test = new Table()
test.table('123').where({
    a: 3, b: '2', c: ['3', 'not in'], d: ['3,6,9', 'in'], e: ['ac', 'like']
}).select()
test.table('user').insert({
    name: 'kmc',
    age: '18',
    account: 'googokmchi'
})
test.table('user').insert({
    name: 'cmk',
    age: '81',
    account: 'ihcmkogoog'
})
test.table('user').insert(['name', 'age', 'account'])
test.table('updated').where({
    number: ['1,4', 'between']
}).update({
    name: 'whatever',
    sex: 'who knows'
    })
test.table('123').where({
    a: 3, b: '2', c: ['not in'], d: ['3,6,9', 'in'], e: ['ac', 'like']
}).select()
test.table('123').where({
    a: 3, b: '2', c: ['not in'], d: ['3,6,9', 'in'], e: ['ac', 'like']
},true).select()