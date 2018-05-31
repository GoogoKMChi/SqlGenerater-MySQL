class Table {
    // 最终生成的sql语句
    private sqlString: string
    // 要获取的字段，默认全部（*）
    private fields: string
    // 搜索的条件
    private condition: string
    // 要操作的表名
    private tableName: string
    // 拼接时用的空格分割字符
    private blankSpace: string

    constructor() {
        this.fields = this.sqlString = this.tableName = this.condition = ''
        this.blankSpace = ' '
    }

    // 设置表名
    public table(tableName: string): Table {
        this.tableName = '`' + tableName + '`'
        return this
    }

    // where AND
    public where(condition: string): Table
    public where(condition: object): Table
    public where(condition: any): Table {
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
            this.condition += concatenation.join(' AND ')
        }
        this.condition += alreadySet ? ')' : ''
        return this
    }

    public and(): Table {
        this.condition = '(' + this.condition + ')' + this.blankSpace + ' AND '
        return this
    }

    public or(): Table {
        this.condition = '(' + this.condition + ')' + this.blankSpace + ' OR '
        return this
    }

    // 生成select语句
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

    // sql元验证
    private sqlUnitVerifier(): void {
        if (this.tableName === '') {
            throw new Error('please set table that used')
        }
        if (this.condition === '') this.condition = 'true'
    }

    // 生成条件表达式
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
            case 'BETWEEN':
                expression = type + this.blankSpace + '\'' + value + '\''
            case 'LIKE':
                expression = type + this.blankSpace + '\'%' + value + '%\''
                break
            case 'RLIKE':
                expression = type + this.blankSpace + '\'' + value + '%\''
                break
            case 'LLIKE':
                expression = type + this.blankSpace + '%\'' + value + '\''
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

    // 清空记录
    private reset(): void {
        this.fields = this.sqlString = this.tableName = this.condition = ''
    }
}

let test = new Table()
test.table('123').where({
    a: 3, b: '2', c: ['3', 'not in'], d: ['3,6,9', 'in'], e: ['ac', 'like']
}).select()
