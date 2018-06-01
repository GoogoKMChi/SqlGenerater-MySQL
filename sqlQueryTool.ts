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

    constructor() {
        this.fields = this.sqlString = this.tableName = this.condition = ''
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
    public where(condition: string): Table
    public where(condition: object): Table
    public where(condition: any): Table {
        return this.whereBuilder(condition, 'AND')
    }
    /**
     * where OR
     * 生成或链接的语句
     * @param condition
     */
    public whereor(condition: string): Table
    public whereor(condition: object): Table
    public whereor(condition: any): Table {
        return this.whereBuilder(condition, 'OR')
    }
    /**
     * where 构造器
     * @param condition 要处理的条件，string或object，如果是string则直接返回，如果是object则进行处理
     * @param method 可选参数,condition处理时的关系，为AND或OR，默认为AND
     */
    private whereBuilder(condition: any, method = 'AND'): Table {
        this._andorValid = true
        // 级联设置where的话后新加入的条件整体用（）独立包围
        let alreadySet = false
        if (this.condition !== '') {
            this.condition += '('
            alreadySet = true
        }
        if (typeof condition === 'string') {
            // 传入sql字符串的话直接设置condition
            this.condition += condition
        } else if (typeof condition === 'object') {
            // 将数组中的条件拼接起来
            let concatenation = []
            for (let unit in condition) {
                if (typeof condition[unit] !== 'object') {
                    concatenation.push('`' + unit + '` =' + this.blankSpace + '\'' + condition[unit] + '\'')
                } else if (typeof condition[unit] === 'object') {
                    try {
                        let expression = this.generateConditionExpression(condition[unit][0], condition[unit][1])
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
            let sqlArr = ['SELECT', this.fields, 'FROM', this.tableName, 'WHERE', this.condition]
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
    private generateConditionExpressionBeteen(value: string): string {
        let params = value.split(',')
        if (params.length !== 2) {
            throw new Error('between param not valid.like \'1,2\'')
        }
        return '\'' + params[0] + '\' AND \'' + params[1] + '\''
    }
    // 清空记录
    private reset(): void {
        this.fields = this.sqlString = this.tableName = this.condition = ''
    }
}

let test = new Table()
test.table('123').where({
    a: 3, b: '2', c: ['3', 'not in'], d: ['3,6,9', 'in'], e: ['ac', 'like']
}).select()
