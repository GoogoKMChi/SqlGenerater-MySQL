** 纯属练习 **
# SqlGenerater-MySQL
一个nodejs的MySQL的sql语句生成器，链式操作，根据自己的习惯刚开始写，持续维护ing

## where和whereor
<pre><code>
test.table('bb').whereor({a:1,b:2}).select()
"SELECT * FROM `bb` WHERE `a` = '1' OR `b` = '2'"

test.table('bb').where({c:2,d:4}).whereor({a:1,b:2}).select()
"SELECT * FROM `bb` WHERE `c` = '2' AND `d` = '4'(`a` = '1' OR `b` = '2')"

test.table('bb').where({c:2,d:4}).or().whereor({a:1,b:2}).select()
"SELECT * FROM `bb` WHERE (`c` = '2' AND `d` = '4')  OR (`a` = '1' OR `b` = '2')"

test.table('bb').where({c:2,d:4}).and().whereor({a:1,b:2}).select()
"SELECT * FROM `bb` WHERE (`c` = '2' AND `d` = '4')  AND (`a` = '1' OR `b` = '2')"

test.table('123').where('a,b notin,c between,d,e,f like').select();
"SELECT * FROM `123` WHERE `a` = '?' AND `b` NOT IN ('?') AND `c` BETWEEN '?' AND '?' AND `d` = '?' AND `e` = '?' AND `f` LIKE '%?%'"

test.table('123').where('a,b notin,c between,d,e,f like',true).select(); // 第二个参数为true，原样返回
"SELECT * FROM `123` WHERE a,b notin,c between,d,e,f like"
</code></pre>
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
insert(object|Array<string>)
===========================

test.table('user').insert({
    name: 'kmc',
    age: '18',
    account:'googokmchi'
})

会生成
INSERT INTO `user` (`name`,`age`,`account`) VALUES ('kmc','18','googokmchi')

===========================

test.table('user').insert(['name','age','account])

会生成
INSERT INTO `user` (`name`,`age`,`account`) VALUES (?,?,?)

===========================

test.table('user').insert('name sex account')

会生成
INSERT INTO `user` (name,sex,account) VALUES (?,?,?)
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
SET `name`='whatever',`sex`='who knows' 
WHERE `number` BETWEEN '1' AND '4'

===========================

test.table('updated').where({
    number: ['1,4', 'between']
}).update(['name,'sex'])

会生成
UPDATE `updated` 
SET `name`=?,`sex`=? 
WHERE `number` BETWEEN '1' AND '4'

===========================

test.table('updated').where({
    number: ['1,4', 'between']
}).update('name value state'); // 或'name,value,state'

会生成
UPDATE `updated` 
SET `name`=?,`value`=?,`states`=? 
WHERE `number` BETWEEN '1' AND '4'

##Join
test.table('aa')
.join('INNER JOIN t_type ON t_blog.typeId=t_type.id')
.where('t_blog.a !=,b >,c,t_type.d like')
.select();

会生成
"SELECT * 
FROM `aa` 
INNER JOIN t_type ON t_blog.typeId=t_type.id //是的怎么输进去的怎么出来了...
WHERE `t_blog.a` != '?' AND `b` > '?' AND `c` = '?' AND `t_type.d` LIKE '%?%'"
</code></pre>
