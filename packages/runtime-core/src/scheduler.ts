
let queue = []
export function queueJob (job) {

  // 多次操作state触发同一个effect，只触发一次
  if (!queue.includes(job)) {
    queue.push(job)
    queueFlush()
  }
}

let isFlushPending = false;
function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true;
    // 微任务，等主线程同步任务执行完之后，才会执行过这个微任务例如多次修改值
    // state.name = 'my'
    // state.name = 'equicy'
    // state.name = 'my'
    Promise.resolve().then(FlushJobs)
  }
}

function FlushJobs() {
  isFlushPending = false

  // 清空时候，需要根据调用的顺序一次刷新， 保证先刷新父，后刷新子
  queue.sort((a,b) => a.id - a.id)

  for (let i = 0; i < queue.length; i++) {
    const job = queue[i];
    job()
  }

  queue.length = 0
}