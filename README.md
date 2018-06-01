# SqlGenerater-MySQL
一个nodejs的MySQL的sql语句生成器，链式操作，根据自己的习惯刚开始写，持续维护ing
## 用法
<pre><code>
let table = new Table() // new 一个对象即可，重复使用
table.table('tableName').where({
    field:'value',
    field2:2,
    field3:['1,2,3','notin'],
    field4:['something','like'],
    field5:['others','rlike'],
    field6:['5','!=']
}).and()
.where('`field9` BETWEEN 1 AND 3').or()
.where({
    field8:321
}).select(['name','age','account'])
===================================================
会生成字符串
SELECT 'name','age','account' 
FROM `tableName` 
WHERE (
		(`field` = 'value' AND `field2` = '2' AND `field3` NOT IN ('1','2','3') AND `field4` LIKE '%something%' AND `field5` LIKE 'others%' AND `field6` != '5')
			AND 
		(`field9` BETWEEN 1 AND 3)
	  ) OR (`field8` = '321')
</code></pre>

