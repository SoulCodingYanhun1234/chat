[
    "Nomen: Nomen是一个开发者，开发了这个聊天AI应用\nNomen是一个代码萌新",
    `world.projectName
    **info**
    *属性*     属性值类型：string     默认值：无
    地图名称，对应项目设置中的名称。
    该属性是只读的，如需修改地图名称，请在编辑器菜单底部 [项目-编辑资料-地图名称] 进行修改。`,
    `world.onTick()
    **info**
    *事件*
    这是世界的计时事件，每64毫秒触发一次，Tick计数加1。
    监听此事件可以让世界以64毫秒为间隔循环执行代码。
    
    在理想情况下，每Tick为64毫秒。若网络发生延迟，可能会有变化。
    
    onTick: Box3EventChannel<Box3TickEvent>
    nextTick: Box3EventFuture<Box3TickEvent>
    返回值 Box3TickEvent:{ tick, prevTick, elapsedTimeMS, skip }

    名称	类型	说明
tick	number	事件发生时间
prevTick	number	上一个已处理的时刻
elapsedTimeMS	number	两个时刻之间的时间间隔(毫秒)
skip	boolean	是否因为延迟而跳过了某些 Tick

**examples**
// 监听此事件，会在控制台持续输出 tick 计数
world.onTick(({ tick }) => {
    console.log('tick ' + tick);
});

// 当玩家进入地图
world.onPlayerJoin(({ entity }) => {

     // 每Tick的间隔向控制台输出提示
     const token = world.onTick(() => {
         console.log("tick !")
     });

     // 2秒后，结束事件
     setTimeout(() => {
          console.log('cancel tick handler');
          token.cancel();  // 不再记录tick事件
     }, 2000);
});`,
`
world.currentTick
**info**
*属性*     属性值类型：number     默认值：0
世界当前的Tick计数。`,
`world.say()
**info**
*方法*
向所有玩家广播一条消息。

参数 message
名称	类型	说明
message	string	要广播的消息

**examples**
简单示例
/* 玩家进入地图时，向所有玩家发送消息 */
world.onPlayerJoin(({ entity }) => {
    world.say(\`\${entity.player.name}进入了地图\`);
})

循环喊话
/* 每隔 15 秒广播一条消息，并循环切换内容 */
let seasonDuration = 1000 * 15  // 单位是毫秒：1秒 = 1000 毫秒

async function seasonChange(){
    while(true){
        world.say('春季来临')
        await sleep(seasonDuration)
        world.say('夏季来临')
        await sleep(seasonDuration)
        world.say('秋季来临')
        await sleep(seasonDuration)
        world.say('冬季来临')
        await sleep(seasonDuration)
    }
}

seasonChange() // 调用方法

高级计时器
function startTimer(){
    const start = new Date().getTime()    // 记录开始计时前的时间。
    const step = 1000 * 1                 // 每隔多少秒，喊一次话。单位是毫秒(1秒 = 1000毫秒)
    const end = 1000 * 5                  // 计时多少秒后结束计时。单位是毫秒(1秒 = 1000毫秒)
    world.say('======开始计时======');
    const interval = setInterval(()=> {
        const current = new Date().getTime()   // 计时过程中的时间
        const duration = current - start       // 计时累计时长。单位是毫秒(1秒 = 1000毫秒)
        if (duration > end) {                  // 如果时长超过结束时间
            world.say('======计时结束======');  // 广播一条消息
            clearInterval(interval);           // 结束计时器
            return;
        }
        world.say(\`计时 \${Math.round(duration/1000)} 秒\`);  
    }, step);
}

startTimer()  // 调用方法`,
`world.onChat()
**info**
*事件*
当玩家在聊天窗口说话时触发

onChat: Box3EventChannel<Box3ChatEvent>
nextChat: Box3EventFuture<Box3ChatEvent>
返回值 Box3ChatEvent:{ entity, message, tick }
名称	类型	说明
entity	Box3Entity	发起聊天的实体
message	string	聊天事件中说话的内容
tick	number	聊天事件发生时间

**examples**
聊天命令1
// 当玩家发送'grow'文字的时候放大1.2倍，当玩家发送'shrink'文字的时候缩小1.2倍
world.onChat(({ entity, message }) => {
    if (message === 'grow') {
        entity.player.scale *= 1.2;
    } else if (message === 'shrink') {
        entity.player.scale /= 1.2;
    }
})

聊天命令2
// 在聊天窗口回复 '1', 开启飞行功能。
world.onChat(({ entity:user, message }) => {
    if(message === '1'){
        user.player.canFly = true;
        user.player.directMessage(\`====开启飞行功能====\`)
    }else if (message === '2') {
        user.player.canFly = false;
        user.player.directMessage(\`====关闭飞行功能====\`)
    }
});

让实体与你打招呼
// 在聊天窗口回复 '1', 世界中的所有实体会与你打招呼
world.onChat(({ entity, message })=>{
    if(message==='1'){ //如果玩家输入是 1
        //让所有实体对TA说欢迎
        let allEntities = world.querySelectorAll('*');
        for(let e of allEntities){
            if(e.isPlayer){continue} //如果实体是玩家, 就跳过
            e.say(\`欢迎 \${entity.player.name}\`)
        }
    }else if(message==='2'){ //如果玩家输入是 2
        //让位置在(60,0,60)~(70,120,70)之间的实体对你说欢迎
        let foundEntities = world.searchBox(new Box3Bounds3(
            new Box3Vector3(60, 0, 60),
            new Box3Vector3(70, 120, 70),
        ))
        for(let e of foundEntities){
            if(e.isPlayer){continue} //如果实体是玩家, 就跳过
            e.say(\`你好 \${entity.player.name}\`)
        }
    }
})

利用聊天命令复活
world.onPlayerJoin(({ entity })=>{
    entity.enableDamage = true
});

world.onChat(({ entity, message }) => {
    switch (message) {
        case 'die':
            if (entity.player.dead) { // 如果在说话时已经死亡则跳过
                entity.player.directMessage('你目前已经躺下了。');
                return;
            }
            entity.hurt(entity.maxHp)
            break;
        case 'revive':
            if (!entity.player.dead) { // 在说话时，是否已经死亡
                entity.player.directMessage('你目前还很健康');
                return;
            }
            entity.hp = entity.maxHp
            entity.player.directMessage('原地满血复活！');
            break;
        default:
            break;
    }
})`,
`world.onPlayerJoin()
**info**
*事件*
当玩家加入地图时触发

onPlayerJoin: Box3EventChannel<Box3EntityEvent>
nextPlayerJoin: Box3EventFuture<Box3EntityEvent>
返回值 Box3EntityEvent:{ entity, tick }
名称	类型	说明
entity	Box3Entity	创建的实体
tick	number	事件发生时间

**examples**
简单示例
// 玩家进入地图时，向TA发送一条私信。
world.onPlayerJoin(({ entity }) => {
    entity.player.directMessage(\`你好，\${entity.player.name}\`);
});

所有玩家飞行
// 玩家进入地图时，开启飞行功能
world.onPlayerJoin(({ entity }) => {
    entity.player.canFly = true;
});

特定玩家进入地图提醒
const TEST_PLAYER = ['吉吉喵', '搬砖喵', '测试喵', '文档喵']

world.onPlayerJoin(({ entity }) => {
    if (!TEST_PLAYER.includes(entity.player.name)) return; // 如果玩家名称不在列表里，则跳过后续脚本。
    world.say(\`\${entity.player.name} 出现了！\`);
})`
]