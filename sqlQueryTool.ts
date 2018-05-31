class Table {
    // �������ɵ�sql���
    private sqlString: string
    // Ҫ��ȡ���ֶΣ�Ĭ��ȫ����*��
    private fields: string
    // ����������
    private condition: string
    // Ҫ�����ı���
    private tableName: string
    // ƴ��ʱ�õĿո�ָ��ַ�
    private blankSpace: string

    constructor() {
        this.fields = this.sqlString = this.tableName = this.condition = ''
        this.blankSpace = ' '
    }

    // ���ñ���
    public table(tableName: string): Table {
        this.tableName = '`' + tableName + '`'
        return this
    }

    // where AND
    public where(condition: string): Table
    public where(condition: object): Table
    public where(condition: any): Table {
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

    // ����select���
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

    // sqlԪ��֤
    private sqlUnitVerifier(): void {
        if (this.tableName === '') {
            throw new Error('please set table that used')
        }
        if (this.condition === '') this.condition = 'true'
    }

    // �����������ʽ
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

    // ��ռ�¼
    private reset(): void {
        this.fields = this.sqlString = this.tableName = this.condition = ''
    }
}

let test = new Table()
test.table('123').where({
    a: 3, b: '2', c: ['3', 'not in'], d: ['3,6,9', 'in'], e: ['ac', 'like']
}).select()
