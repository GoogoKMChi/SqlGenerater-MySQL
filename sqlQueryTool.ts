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

    constructor() {
        this.fields = this.sqlString = this.tableName = this.condition = ''
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
    public where(condition: string): Table
    public where(condition: object): Table
    public where(condition: any): Table {
        return this.whereBuilder(condition, 'AND')
    }
    /**
     * where OR
     * ���ɻ����ӵ����
     * @param condition
     */
    public whereor(condition: string): Table
    public whereor(condition: object): Table
    public whereor(condition: any): Table {
        return this.whereBuilder(condition, 'OR')
    }
    /**
     * where ������
     * @param condition Ҫ�����������string��object�������string��ֱ�ӷ��أ������object����д���
     * @param method ��ѡ����,condition����ʱ�Ĺ�ϵ��ΪAND��OR��Ĭ��ΪAND
     */
    private whereBuilder(condition: any, method = 'AND'): Table {
        this._andorValid = true
        // ��������where�Ļ����¼�������������ã���������Χ
        let alreadySet = false
        if (this.condition !== '') {
            this.condition += '('
            alreadySet = true
        }
        if (typeof condition === 'string') {
            // ����sql�ַ����Ļ�ֱ������condition
            this.condition += condition
        } else if (typeof condition === 'object') {
            // �������е�����ƴ������
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
            let sqlArr = ['SELECT', this.fields, 'FROM', this.tableName, 'WHERE', this.condition]
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
    private generateConditionExpressionBeteen(value: string): string {
        let params = value.split(',')
        if (params.length !== 2) {
            throw new Error('between param not valid.like \'1,2\'')
        }
        return '\'' + params[0] + '\' AND \'' + params[1] + '\''
    }
    // ��ռ�¼
    private reset(): void {
        this.fields = this.sqlString = this.tableName = this.condition = ''
    }
}

let test = new Table()
test.table('123').where({
    a: 3, b: '2', c: ['3', 'not in'], d: ['3,6,9', 'in'], e: ['ac', 'like']
}).select()
