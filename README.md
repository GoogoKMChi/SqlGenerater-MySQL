# SqlGenerater-MySQL
一个nodejs的MySQL的sql语句生成器，链式操作，根据自己的习惯刚开始写，持续维护ing
## select用法
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

## insert 用法
<pre><code>
insert(object,full?)
===========================
test.table('user').insert({
    name: 'kmc',
    age: '18',
    account:'googokmchi'
})

会生成
INSERT INTO `user` (`name`,`age`,`account`) VALUES (?,?,?)
===========================
test.table('user').insert({
    name: 'cmk',
    age: '81',
    account: 'ihcmkogoog'
}, true)

会生成
INSERT INTO `user` (`name`,`age`,`account`) VALUES ('kmc','18','googokmchi')
</code></pre>

## update用法
<pre><code>
test.table('updated').where({
    number: ['1,4', 'between']
}).update({
    name: 'whatever',
    sex: 'who knows'
})

会生成
UPDATE `updated` 
SET `name`=?,`sex`=? 
WHERE `number` BETWEEN '1' AND '4'
</code></pre>