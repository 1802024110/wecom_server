import {Context} from "hono";
import {sendTextMessageApi} from "../api/message";

/** 发送文字消息
 * @url /sendTextMessage
 * @method POST
 * @content-type application/json
 * @param {string} content 文字内容不能超过2048字节
 * @param {string} agentid 企业应用的id，整型。可在应用的设置页面查看
 * @param {string} touser 用户ID列表（消息接收者，多个接收者用‘|’分隔.默认所有人）
 * @param {string} toparty 部门ID列表，多个接收者用‘|’分隔。当touser为@all时忽略本参数
 * @param {string} totag 标签ID列表，多个接收者用‘|’分隔。当touser为@all时忽略本参数
 * @param {string} safe 表示是否是保密消息，0表示否，1表示是，默认0
* */
export async function sendTextMessage(c:Context) {
    // 获取请求body的json
    const body:any = await c.req.raw.json()
    const content = body.content
    const agentid = body.agentid
    const touser = body.touser
    const toparty = body.toparty
    const totag = body.totag
    const safe = body.safe

    console.log("content", content)

    // 检查前两个参数是否存在
    if (!content || !agentid) {
        return c.text("缺少参数")
    }
    // 发送消息
    const res = await sendTextMessageApi(content, agentid, touser, toparty, totag, safe)
    // 返回结果
    return c.json(res)
}