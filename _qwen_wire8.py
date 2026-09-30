"""接线第八部分：修 Simulator WS 回调（on 派发的是已解析对象；刷新函数为 loadAll）。幂等。"""
import io, os, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
SRC = 'D:/新建文件夹/java/javacode/nautix-frontend/src'

def rd(p):
    with open(os.path.join(SRC, p), encoding='utf-8') as f:
        return f.read()

def wr(p, t):
    with open(os.path.join(SRC, p), 'w', encoding='utf-8', newline='\n') as f:
        f.write(t)

t = rd('views/simulator/Simulator.vue')
old = """wsOn('message', (ev: MessageEvent) => {
  try {
    const msg = JSON.parse(String(ev.data)) as WebSocketMessage
    if (msg.type === 'runtime') void reload()
  } catch {
    /* 非 JSON 帧忽略 */
  }
})"""
new = """wsOn('message', (data: unknown) => {
  // hook 已对 JSON 帧做过解析，这里直接按消息体类型分发
  const msg = data as WebSocketMessage | null
  if (msg && typeof msg === 'object' && msg.type === 'runtime') void loadAll()
})"""
assert old in t, 'ws block not found'
t = t.replace(old, new)
wr('views/simulator/Simulator.vue', t)
print('fix Simulator ws callback -> loadAll + parsed payload')
print('PART-H DONE')
