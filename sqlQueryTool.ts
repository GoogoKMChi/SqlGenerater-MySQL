class Table {
    // �������ɵ�sql���
    private sqlString: string
    // Ҫ��ȡ���ֶΣ�Ĭ��ȫ����*��
    private fields: string
    // ����������
    private condition: string
    // limti�޶�
    private conditionLimit: string
    // Ҫ�����ı���
    private tableName: string
    // ƴ��ʱ�õĿո�ָ��ַ�
    private blankSpace: string
    // ��֤ʹ��and��or����ʱwhere��whereor�����ĺϷ���(��֤��ʽ��and��or�����������һ�ε���)
    private _andorValid: boolean
    // Join�ַ���
    private joinSql: string

    constructor() {
        this.fields = this.sqlString = this.tableName = this.condition = this.joinSql = ''
        this.blankSpace = ' '
        this._andorValid = true
    }

    /**
     * ���ñ���
     * @param tableName Ҫѡ��ı�����
     */
    public table(tableName: string): Table {
        this.tableName = '`' + tableName + '`'
        return this
    }

    /**
     * where AND
     * ���������ӵ����
     * @param condition
     */
    public where(condition: string, full?: boolean): Table
    public where(condition: object, full?: boolean): Table
    public where(condition: any, full: boolean): Table {
        return this.whereBuilder(condition, 'AND', full)
    }
    /**
     * where OR
     * ���ɻ����ӵ����
     * @param condition
     */
    public whereor(condition: string, full?: boolean): Table
    public whereor(condition: object, full?: boolean): Table
    public whereor(condition: any, full?: boolean): Table {
        return this.whereBuilder(condition, 'OR', full)
    }
    /**
     * where ������
     * @param condition Ҫ�����������string��object�������string��ֱ�ӷ��أ������object����д���
     * @param method ��ѡ����,condition����ʱ�Ĺ�ϵ��ΪAND��OR��Ĭ��ΪAND
     */
    private whereBuilder(condition: any, method = 'AND', full = false): Table {
        this._andorValid = true
        // ��������where�Ļ����¼�������������ã���������Χ
        let alreadySet = false
        if (this.condition !== '') {
            this.condition += '('
            alreadySet = true
        }
        if (typeof condition === 'string') {
            if (full) {
                // ����sql�ַ����Ļ�ֱ������condition
                this.condition += condition
                this.condition += alreadySet ? ')' : ''
                return this
            } else {
                // �Դ�����ַ��������и����
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
            // �������е�����ƴ������
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
     * ����limit����
     * @param limit1 ��ֻѡһ�����������ʾoffset��0��ʼѡȡlimit1�е�����
     * @param limit2 ��ѡ�����ѡ��ڶ������������޶���offset limit1��ʼlimit2�е����ݣ�offset��0��ʼ��
     */
    public limit(limit1: number, limit2?: number): Table {
        return this
    }

    /**
     * ����select���
     * @param field ��ѡ������ֵ����Ϊstring��Array<string>
     * fieldΪ�յĻ���ѡ��ȫ����*���������Ϊ����ѡ����д���ֶ�
     */
    public select(field?: string | string[]): string {
        try {
            //��֤�±�Ҫ��Ϣ
            this.sqlUnitVerifier()
            // �����ѡ���ֶ���ƴ�ӣ�����ѡ��ȫ��
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
     * �򵥼���join
     * @param sql
     */
    public join(sql: string): Table {
        this.joinSql = sql
        return this
    }

    /**
     * ����insert���
     * @param data object��Array������object����value��value1��value2����Array����value(?,?,?)
     */
    public insert(data: object | Array<string> | string): string {
        if (data) {
            try {
                //��֤�±�Ҫ��Ϣ
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
     * ����update���
     * @param data
     * @param full ��ѡ��Ĭ��false������`key`=?����ʽ
     */
    public update(data: object | Array<string> | string): string {
        if (data) {
            try {
                //��֤�±�Ҫ��Ϣ
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
     * ����ɾ�����
     */
    public delete(): string {
        try {
            //��֤�±�Ҫ��Ϣ
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
     * sqlԪ��֤
     */
    private sqlUnitVerifier(): void {
        if (this.tableName === '') {
            throw new Error('please set table that used')
        }
        if (!this._andorValid) {
            throw new Error('condition can not end with and() or or()')
        }
        // ���û����д�κ�where�����Ļ��Զ���condition����Ϊ����
        if (this.condition === '') this.condition = 'true'
    }

    /**
     * �����������ʽ
     * @param value ���ʽ����ֵ
     * @param type ���ʽ���㷨������
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
     * ��֤�Ӵ���BETWEEN�Ĳ���
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
    // ��ռ�¼
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