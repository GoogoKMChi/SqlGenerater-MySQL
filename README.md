# SqlGenerater-MySQL
一个nodejs的MySQL的sql语句生成器，链式操作，根据自己的习惯刚开始写，持续维护ing
## 用法
`let table = new Table()` 一个对象重复使用

`table.table('tableName').where({field:'value',field2:2,field3:['1,2,3','notin'],
field4:['something','like'],field5:['others','rlike'],field6:['5','!=']}).and().where({
field7:123}).or().where({field8:321}).select(['name','age','account'])`

会生成

SELECT 'name','age','account' FROM \`tableName\` WHERE ((\`field\` = 'value' AND \`field2\` = '2' AND \`field3\` 
NOT IN ('1','2','3') AND \`field4\` LIKE '%something%' AND \`field5\` RLIKE 'others%'
 AND \`field6\` != '%5%')  AND (\`field7\` = '123'))  OR (\`field8\` = '321')