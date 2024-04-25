/*仅负责搬运自用
#蜜雪冰城_万达智慧商业_爱奇艺_吾爱破解_百度贴吧_BiliBili_喜马拉雅_腾讯视频_NGA玩家社区_阿里云盘任务_夸克网盘_柠季*/


/*
------------------------------------------
@Author: Sliverkiss
@Date: 2023.11.30 19:08:18
@Description: 蜜雪冰城 每日签到、访问雪王铺
------------------------------------------

2024.03.29 重构代码，支持多账号，增加雪王铺任务。更改ck格式,需要清空变量重新获取.

重写：打开蜜雪冰城小程序，进入我的页面.

[Script]
http-response ^https:\/\/mxsa\.mxbc\.net\/api\/v1\/customer\/info script-path=https://gist.githubusercontent.com/Sliverkiss/865c82e42a5730bb696f6700ebb94cee/raw/mxbc.js, requires-body=true, timeout=60, tag=蜜雪冰城获取token

[MITM]
hostname = mxsa.mxbc.net

⚠️【免责声明】
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。
*/
const $ = new Env("蜜雪冰城");
const ckName = "mxbc_data";
const userCookie = $.toObj($.isNode() ? process.env[ckName] : $.getdata(ckName)) || [];
//notify
const notify = $.isNode() ? require('./sendNotify') : '';
$.notifyMsg = []
//debug
$.is_debug = ($.isNode() ? process.env.IS_DEDUG : $.getdata('is_debug')) || 'false';
$.doFlag = { "true": "✅", "false": "⛔️" };

//------------------------------------------
const baseUrl = "https://mxsa.mxbc.net"
const _headers = {
    "app": "mxbc",
    "appchannel": "xiaomi",
    "appversion": "3.0.3",
    "Access-Token": "",
    "Host": "mxsa.mxbc.net",
    "User-Agent": "okhttp/4.4.1"
};
const fetch = async (o) => {
    try {
        if (typeof o === 'string') o = { url: o };
        if (o?.url?.startsWith("/") || o?.url?.startsWith(":")) o.url = baseUrl + o.url
        const res = await Request({ ...o, headers: o.headers || _headers, url: o.url })
        debug(res, o?.url?.replace(/\/+$/, '').substring(o?.url?.lastIndexOf('/') + 1));
        //if (!(res?.code == 0 || res?.code == 5020||res?.)) throw new Error(res?.msg || `用户需要去登录`);
        return res;
    } catch (e) {
        $.ckStatus = false;
        $.log(`⛔️ 请求发起失败！${e}`);
    }
}
//------------------------------------------
async function main() {
    try {
        //check accounts
        if (!userCookie?.length) throw new Error("no available accounts found");
        $.log(`⚙️ a total of ${userCookie?.length ?? 0} accounts were identified during this operation.`);
        let index = 0;
        //doTask of userList
        for (let user of userCookie) {
            //init of user
            $.log(`\n🚀 user:${user?.userName || ++index} start work\n`),
                $.notifyMsg = [],
                $.ckStatus = true,
                $.title = "",
                $.avatar = "",
                _headers["Access-Token"] = user.token;
            //task 
            let { point: pointF } = await getUserInfo() ?? {};
            await signin() ?? '';
            if ($.ckStatus) {
                let loginUrl = await getLoginUrl();
                await getActivityToken(loginUrl);
                await activityIndex();
                let { userName, point: pointE } = await getUserInfo();
                $.title = `本次运行共获得${pointE - 0 - pointF}雪王币`
                DoubleLog(`「${userName}」当前余额为${pointE}雪王币`);
            } else {
                DoubleLog(`⛔️ 「${user.userName ?? `账号${index}`}」check ck error!`)
            }
            //notify
            await sendMsg($.notifyMsg.join("\n"));
        }
    } catch (e) {
        throw e
    }
}
//签到
async function signin() {
    try {
        let timestamp = ts13();
        const options = {
            url: `/api/v1/customer/signin`,
            params: {
                "appId": "d82be6bbc1da11eb9dd000163e122ecb",
                "t": timestamp,
                "sign": getSHA256withRSA('appId=d82be6bbc1da11eb9dd000163e122ecb&t=' + timestamp)
            }
        };
        //post方法
        let res = await fetch(options);
        if (!(res?.code == 0 || res?.code == 5020)) throw new Error(`失败!${res?.msg}`)
        let signMsg = res?.msg || `成功！获得${res?.data?.ruleValuePoint}币`;
        $.log(`${$.doFlag[res?.code == 0]} 签到:${signMsg}`);
        return signMsg;
    } catch (e) {
        $.ckStatus = false;
        $.log(`⛔️ 签到:${e}`);
    }
}
//查询用户信息
async function getUserInfo() {
    try {
        let timestamp = ts13();
        const options = {
            url: `/api/v1/customer/info`,
            params: {
                "appId": "d82be6bbc1da11eb9dd000163e122ecb",
                "t": timestamp,
                "sign": getSHA256withRSA('appId=d82be6bbc1da11eb9dd000163e122ecb&t=' + timestamp)
            }
        };
        //post方法
        let res = await fetch(options);
        if (!(res?.code == 0 || res?.code == 5020)) throw new Error(`失败!${res?.msg}`)
        return {
            userName: res?.data?.mobilePhone,
            level: res?.data?.customerLevel,
            levelName: res?.data?.customerLevelVo?.levelName,
            point: res?.data?.customerPoint
        }

    } catch (e) {
        $.ckStatus = false;
        $.log(`❌签到执行失败！原因为${e}`);
    }
}
//获取页面跳转url
async function getLoginUrl() {
    try {
        let timestamp = ts13();
        const options = {
            url: `/api/v1/duiba/getLoginUrl`,
            params: {
                "appId": "d82be6bbc1da11eb9dd000163e122ecb",
                "t": timestamp,
                "sign": getSHA256withRSA('appId=d82be6bbc1da11eb9dd000163e122ecb&t=' + timestamp)
            }
        };
        //post方法
        let res = await fetch(options);
        return res?.data?.loginUrl;
    } catch (e) {
        $.log(`❌签到执行失败！原因为${e}`);
    }
}
//获取活动token
async function getActivityToken(url) {
    try {
        const opts = {
            url: url,
            followRedirect: false,
            resultType: "all",
            headers: {
                'Accept-Encoding': `gzip, deflate, br`,
                'Connection': `keep-alive`,
                'Cookie': "",
                'Accept': `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`,
                'Host': `76177.activity-12.m.duiba.com.cn`,
                'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)mxsa_mxbc`,
                'Accept-Language': `zh-CN,zh-Hans;q=0.9`
            }
        }
        let res = await fetch(opts);
        let headers = ObjectKeys2LowerCase(res?.headers) ?? {};
        //对青龙进行兼容
        let session = Array.isArray(headers['set-cookie']) ? [...new Set(headers['set-cookie'])].join("") : headers['set-cookie'];
        let [wdata4, w_ts, _ac, wdata3, dcustom] = session?.match(/(wdata4|w_ts|_ac|wdata3|dcustom)=.+?;/g) ?? [];
        if (!wdata4) throw new Error(`token不存在`);
        $.session = wdata4 + w_ts + _ac + wdata3 + dcustom;
        $.log(`✅ 获取活动token成功！`)
    } catch (e) {
        $.log(`⛔️ 获取活动token失败！${e}`);
    }
}
//访问雪王铺
async function activityIndex() {
    try {
        const opts = {
            url: "https://76177.activity-12.m.duiba.com.cn/chome/index",
            params: {
                from: "login",
                spm: "76177.1.1.1"
            },
            headers: {
                'Cookie': $.session,
                'Host': `76177.activity-12.m.duiba.com.cn`,
                'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)mxsa_mxbc`,
            }
        }
        let res = await fetch(opts);
        if (res.match(/请重新登陆/)) throw new Error(`不存在可用session`);
        $.log(`✅ 访问雪王铺:调用成功!`);
    } catch (e) {
        $.log(`⛔️ 访问雪王铺:调用失败!${e}`);
    }
}
//会员抽奖

//获取Cookie
async function getCookie() {
    try {
        if ($request && $request.method === 'OPTIONS') return;

        const header = ObjectKeys2LowerCase($request.headers) ?? {};
        const body = $.toObj($response.body);
        const token = header['access-token'];
        if (!(token && body)) throw new Error("get token error,the value is empty");

        const newData = {
            "userId": body?.data?.mobilePhone,
            "token": token,
            "userName": body?.data?.mobilePhone,
        }

        const index = userCookie.findIndex(e => e.userId == newData.userId);
        userCookie[index] ? userCookie[index] = newData : userCookie.push(newData);

        $.setjson(userCookie, ckName);
        $.msg($.name, `🎉${newData.userName}更新token成功!`, ``);

    } catch (e) {
        throw e;
    }
}

//13位时间戳
function ts13() { return Math.round(new Date().getTime()).toString(); }

function getSHA256withRSA(content) {
    var privateKeyString = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCtypUdHZJKlQ9L
L6lIJSphnhqjke7HclgWuWDRWvzov30du235cCm13mqJ3zziqLCwstdQkuXo9sOP
Ih94t6nzBHTuqYA1whrUnQrKfv9X4/h3QVkzwT+xWflE+KubJZoe+daLKkDeZjVW
nUku8ov0E5vwADACfntEhAwiSZUALX9UgNDTPbj5ESeII+VztZ/KOFsRHMTfDb1G
IR/dAc1mL5uYbh0h2Fa/fxRPgf7eJOeWGiygesl3CWj0Ue13qwX9PcG7klJXfToI
576MY+A7027a0aZ49QhKnysMGhTdtFCksYG0lwPz3bIR16NvlxNLKanc2h+ILTFQ
bMW/Y3DRAgMBAAECggEBAJGTfX6rE6zX2bzASsu9HhgxKN1VU6/L70/xrtEPp4SL
SpHKO9/S/Y1zpsigr86pQYBx/nxm4KFZewx9p+El7/06AX0djOD7HCB2/+AJq3iC
5NF4cvEwclrsJCqLJqxKPiSuYPGnzji9YvaPwArMb0Ff36KVdaHRMw58kfFys5Y2
HvDqh4x+sgMUS7kSEQT4YDzCDPlAoEFgF9rlXnh0UVS6pZtvq3cR7pR4A9hvDgX9
wU6zn1dGdy4MEXIpckuZkhwbqDLmfoHHeJc5RIjRP7WIRh2CodjetgPFE+SV7Sdj
ECmvYJbet4YLg+Qil0OKR9s9S1BbObgcbC9WxUcrTgECgYEA/Yj8BDfxcsPK5ebE
9N2teBFUJuDcHEuM1xp4/tFisoFH90JZJMkVbO19rddAMmdYLTGivWTyPVsM1+9s
tq/NwsFJWHRUiMK7dttGiXuZry+xvq/SAZoitgI8tXdDXMw7368vatr0g6m7ucBK
jZWxSHjK9/KVquVr7BoXFm+YxaECgYEAr3sgVNbr5ovx17YriTqe1FLTLMD5gPrz
ugJj7nypDYY59hLlkrA/TtWbfzE+vfrN3oRIz5OMi9iFk3KXFVJMjGg+M5eO9Y8m
14e791/q1jUuuUH4mc6HttNRNh7TdLg/OGKivE+56LEyFPir45zw/dqwQM3jiwIz
yPz/+bzmfTECgYATxrOhwJtc0FjrReznDMOTMgbWYYPJ0TrTLIVzmvGP6vWqG8rI
S8cYEA5VmQyw4c7G97AyBcW/c3K1BT/9oAj0wA7wj2JoqIfm5YPDBZkfSSEcNqqy
5Ur/13zUytC+VE/3SrrwItQf0QWLn6wxDxQdCw8J+CokgnDAoehbH6lTAQKBgQCE
67T/zpR9279i8CBmIDszBVHkcoALzQtU+H6NpWvATM4WsRWoWUx7AJ56Z+joqtPK
G1WztkYdn/L+TyxWADLvn/6Nwd2N79MyKyScKtGNVFeCCJCwoJp4R/UaE5uErBNn
OH+gOJvPwHj5HavGC5kYENC1Jb+YCiEDu3CB0S6d4QKBgQDGYGEFMZYWqO6+LrfQ
ZNDBLCI2G4+UFP+8ZEuBKy5NkDVqXQhHRbqr9S/OkFu+kEjHLuYSpQsclh6XSDks
5x/hQJNQszLPJoxvGECvz5TN2lJhuyCupS50aGKGqTxKYtiPHpWa8jZyjmanMKnE
dOGyw/X4SFyodv8AEloqd81yGg==
-----END PRIVATE KEY-----
`
    const { KEYUTIL, KJUR, hextob64u } = $.Jsrsasign;
    const key = KEYUTIL.getKey(privateKeyString)
    const signature = new KJUR.crypto.Signature({ alg: 'SHA256withRSA' })
    signature.init(key)
    signature.updateString(content)
    const originSign = signature.sign()
    const sign64u = hextob64u(originSign)
    return sign64u
}

//加载模块
async function loadModule() {
    //Jsrsasign模块
    $.Jsrsasign = await loadJsrsasign();
    return $.Jsrsasign ? true : false;

}
//加载CryptoJS模块
async function loadCryptoJS() {
    let code = ($.isNode() ? require('crypto-js') : $.getdata('CryptoJS_code')) || '';
    //node环境
    if ($.isNode()) return code;
    //ios环境
    if (code && Object.keys(code).length) {
        console.log(`✅ ${$.name}: 缓存中存在CryptoJS代码, 跳过下载`)
        eval(code)
        return createCryptoJS();
    }
    console.log(`🚀 ${$.name}: 开始下载CryptoJS代码`)
    return new Promise(async (resolve) => {
        $.getScript(
            'https://cdn.jsdelivr.net/gh/Yuheng0101/X@main/Utils/CryptoJS.js'
        ).then((fn) => {
            $.setdata(fn, 'CryptoJS_code')
            eval(fn)
            const CryptoJS = createCryptoJS();
            console.log(`✅ CryptoJS加载成功, 请继续`)
            resolve(CryptoJS)
        })
    })
}
//加载Jsrsasign模块
async function loadJsrsasign() {
    let code = ($.isNode() ? require('jsrsasign') : $.getdata('Jsrsasign_code')) || '';
    //node环境
    if ($.isNode()) return code;
    //ios环境
    if (code && Object.keys(code).length) {
        console.log(`✅ ${$.name}: 缓存中存在Jsrsasign代码, 跳过下载`)
        const CryptoJS = await loadCryptoJS();
        eval(code)
        return { KEYUTIL, KJUR, hextob64u };
    }
    console.log(`🚀 ${$.name}: 开始下载Jsrsasign代码`)
    try {
        const CryptoJS = await loadCryptoJS();
        const _partFun = await $.getScript(
            'https://cdn.jsdelivr.net/gh/Yuheng0101/X@main/Utils/jsrsasign-part.js'
        )
        const _function = `${_partFun};`
        $.setdata(_function, 'Jsrsasign_code')
        eval(_function)
        console.log(`loadJsrsasign success`)
        return { KEYUTIL, KJUR, hextob64u }
    } catch (e) {
        console.log(e)
        throw new Error('loadJsrsasign error')
    }
}

//主程序执行入口
!(async () => {
    try {
        if (typeof $request != "undefined") {
            await getCookie();
        } else {
            await loadModule();
            await main();
        }
    } catch (e) {
        throw e;
    }
})()
    .catch((e) => { $.logErr(e), $.msg($.name, `⛔️ script run error!`, e.message || e) })
    .finally(async () => {
        $.done({ ok: 1 });
    });

/** ---------------------------------固定不动区域----------------------------------------- */
//prettier-ignore
async function sendMsg(a) { a && ($.isNode() ? await notify.sendNotify($.name, a) : $.msg($.name, $.title || "", a, { "media-url": $.avatar })) }
function DoubleLog(o) { o && ($.log(`${o}`), $.notifyMsg.push(`${o}`)) };
function debug(g, e = "debug") { "true" === $.is_debug && ($.log(`\n-----------${e}------------\n`), $.log("string" == typeof g ? g : $.toStr(g) || `debug error => t=${g}`), $.log(`\n-----------${e}------------\n`)) }
//From xream's ObjectKeys2LowerCase
function ObjectKeys2LowerCase(obj) { return !obj ? {} : Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])) };
//From sliverkiss's Request
async function Request(t) { "string" == typeof t && (t = { url: t }); try { if (!t?.url) throw new Error("[发送请求] 缺少 url 参数"); let { url: o, type: e, headers: r = {}, body: s, params: a, dataType: n = "form", resultType: u = "data" } = t; const p = e ? e?.toLowerCase() : "body" in t ? "post" : "get", c = o.concat("post" === p ? "?" + $.queryStr(a) : ""), i = t.timeout ? $.isSurge() ? t.timeout / 1e3 : t.timeout : 1e4; "json" === n && (r["Content-Type"] = "application/json;charset=UTF-8"); const y = s && "form" == n ? $.queryStr(s) : $.toStr(s), l = { ...t, ...t?.opts ? t.opts : {}, url: c, headers: r, ..."post" === p && { body: y }, ..."get" === p && a && { params: a }, timeout: i }, m = $.http[p.toLowerCase()](l).then((t => "data" == u ? $.toObj(t.body) || t.body : $.toObj(t) || t)).catch((t => $.log(`❌请求发起失败！原因为：${t}`))); return Promise.race([new Promise(((t, o) => setTimeout((() => o("当前请求已超时")), i))), m]) } catch (t) { console.log(`❌请求发起失败！原因为：${t}`) } }
//From chavyleung's Env.js
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise(((e, r) => { s.call(this, t, ((t, s, a) => { t ? r(t) : e(s) })) })) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; if (this.getdata(t)) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise((e => { this.get({ url: t }, ((t, s, r) => e(r))) })) } runScript(t, e) { return new Promise((s => { let r = this.getdata("@chavy_boxjs_userCfgs.httpapi"); r = r ? r.replace(/\n/g, "").trim() : r; let a = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); a = a ? 1 * a : 20, a = e && e.timeout ? e.timeout : a; const [i, o] = r.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: a }, headers: { "X-Key": i, Accept: "*/*" }, timeout: a }; this.post(n, ((t, e, r) => s(r))) })).catch((t => this.logErr(t))) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e); if (!s && !r) return {}; { const r = s ? t : e; try { return JSON.parse(this.fs.readFileSync(r)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e), a = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, a) : r ? this.fs.writeFileSync(e, a) : this.fs.writeFileSync(t, a) } } lodash_get(t, e, s = void 0) { const r = e.replace(/\[(\d+)\]/g, ".$1").split("."); let a = t; for (const t of r) if (a = Object(a)[t], void 0 === a) return s; return a } lodash_set(t, e, s) { return Object(t) !== t || (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce(((t, s, r) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[r + 1]) >> 0 == +e[r + 1] ? [] : {}), t)[e[e.length - 1]] = s), t } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, r] = /^@(.*?)\.(.*?)$/.exec(t), a = s ? this.getval(s) : ""; if (a) try { const t = JSON.parse(a); e = t ? this.lodash_get(t, r, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, r, a] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(r), o = r ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, a, t), s = this.setval(JSON.stringify(e), r) } catch (e) { const i = {}; this.lodash_set(i, a, t), s = this.setval(JSON.stringify(i), r) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, ((t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) })); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", ((t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } })).then((t => { const { statusCode: r, statusCode: a, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: r, statusCode: a, headers: i, rawBody: o, body: n }, n) }), (t => { const { message: r, response: a } = t; e(r, a, a && s.decode(a.rawBody, this.encoding)) })) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, ((t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) })); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let r = require("iconv-lite"); this.initGotEnv(t); const { url: a, ...i } = t; this.got[s](a, i).then((t => { const { statusCode: s, statusCode: a, headers: i, rawBody: o } = t, n = r.decode(o, this.encoding); e(null, { status: s, statusCode: a, headers: i, rawBody: o, body: n }, n) }), (t => { const { message: s, response: a } = t; e(s, a, a && r.decode(a.rawBody, this.encoding)) })) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let r = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in r) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? r[e] : ("00" + r[e]).substr(("" + r[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let r = t[s]; null != r && "" !== r && ("object" == typeof r && (r = JSON.stringify(r)), e += `${s}=${r}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", r = "", a) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: return { url: t.url || t.openUrl || t["open-url"] }; case "Loon": return { openUrl: t.openUrl || t.url || t["open-url"], mediaUrl: t.mediaUrl || t["media-url"] }; case "Quantumult X": return { "open-url": t["open-url"] || t.url || t.openUrl, "media-url": t["media-url"] || t.mediaUrl, "update-pasteboard": t["update-pasteboard"] || t.updatePasteboard }; case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, r, i(a)); break; case "Quantumult X": $notify(e, s, r, i(a)); case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), r && t.push(r), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, t.stack) } } wait(t) { return new Promise((e => setTimeout(e, t))) } done(t = {}) { const e = ((new Date).getTime() - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }

/**
 * 脚本名称：万达智慧商业
 * 活动规则：完成每日任务
 * 脚本说明：添加重写进入"万达智慧商业"小程序-"我的"界面，即可获取 Token，支持多账号，兼容 NE / Node.js 环境。
 * 环境变量：wdzhsy_token / CODESERVER_ADDRESS、CODESERVER_FUN
 * 更新时间：2024-04-17 10:52
 * 图标地址：https://raw.githubusercontent.com/leiyiyan/resource/main/icons/wdzhsy.png*/

------------------ Surge 配置 ------------------

[MITM]
hostname = %APPEND% www.wandawic.com

[Script]
万达智慧商业² = type=http-response,pattern=^https?:\/\/www\.wandawic\.com\/api\/foreground\/loginregister\/queryUser,requires-body=1,max-size=0,binary-body-mode=0,timeout=30,script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/wdzhsy/wdzhsy.js,script-update-interval=0

万达智慧商业 = type=cron,cronexp=30 9 * * *,timeout=60,script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/wdzhsy/wdzhsy.js,script-update-interval=0

------------------- Loon 配置 -------------------

[MITM]
hostname = www.wandawic.com

[Script]
http-response ^https?:\/\/www\.wandawic\.com\/api\/foreground\/loginregister\/queryUser tag=万达智慧商业²,script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/wdzhsy/wdzhsy.js,requires-body=1

cron "30 9 * * *" script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/wdzhsy/wdzhsy.js,tag=万达智慧商业,enable=true

--------------- Quantumult X 配置 ---------------

[MITM]
hostname = www.wandawic.com

[rewrite_local]
^https?:\/\/www\.wandawic\.com\/api\/foreground\/loginregister\/queryUser url script-response-body https://raw.githubusercontent.com/leiyiyan/resource/main/script/wdzhsy/wdzhsy.js

[task_local]
30 9 * * * https://raw.githubusercontent.com/leiyiyan/resource/main/script/wdzhsy/wdzhsy.js, tag=万达智慧商业, img-url=https://raw.githubusercontent.com/leiyiyan/resource/main/icons/wdzhsy.png, enabled=true

------------------ Stash 配置 ------------------

cron:
  script:
    - name: 万达智慧商业
      cron: '30 9 * * *'
      timeout: 10

http:
  mitm:
    - "www.wandawic.com"
  script:
    - match: ^https?:\/\/www\.wandawic\.com\/api\/foreground\/loginregister\/queryUser
      name: 万达智慧商业
      type: response
      require-body: true

script-providers:
  万达智慧商业:
    url: https://raw.githubusercontent.com/leiyiyan/resource/main/script/wdzhsy/wdzhsy.js
    interval: 86400

 */

    const $ = new Env('万达智慧商业');
    $.is_debug = getEnv('is_debug') || 'false';  // 调试模式
    $.userInfo = getEnv('wdzhsy_token') || '';  // Token
    $.userArr = $.toObj($.userInfo) || [];  // 用户数组
    $.appid = 'wx8e4763f7ed741710';  // 小程序 appId
    $.messages = [];
    
    
    // 主函数
    async function main() {
      // 获取微信 Code
      await getWxCode();
      for (let i = 0; i < $.codeList.length; i++) {
        await getToken($.codeList[i]);  // 获取 Token
      }
    
      if ($.userArr.length) {
        $.log(`✅ 找到:${$.userArr.length}个Token变量`);
        for (let i = 0; i < $.userArr.length; i++) {
          $.log(`----- 账号 [${i + 1}] 开始执行 -----`);
          // 初始化
          $.is_login = true;
          $.token = $.userArr[i]['token'];
          $.headers = {
            'Referer': 'https://servicewechat.com/wx8e4763f7ed741710/112/page-frame.html',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.48(0x1800302b) NetType/4G Language/zh_CN',
            'content-type': 'application/json',
            'wic-member-token': $.token
          }
    
          // 获取用户信息, 不打印日志
          await getUserInfo();
          await $.wait(2000);
          // 无效 token 跳出
          if (!$.is_login) continue;  
          
          // 获取任务列表
          await getTask();
          await $.wait(2000);
          // 获取用户信息, 打印日志
          await getUserInfo(true);
        }
        $.log(`----- 所有账号执行完成 -----`);
      } else {
        throw new Error('⛔️ 未找到Token变量');
      }
    }
    
    // 获取 Token
    async function getToken(code) {
      // 构造请求
      const options = {
        url: `https://www.wandawic.com/api/foreground/loginregister/loginByCode`,
        headers: {
          'content-type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.48(0x1800302b) NetType/4G Language/zh_CN',
          'Referer': 'https://servicewechat.com/wx8e4763f7ed741710/112/page-frame.html',
          'wic-member-token': ''
        },
        body: $.toStr({
          time: getDateTime(),
          channelCode: "ch_xcx",
          data: {
            code,
            tryAutoLogin: false,
            flag: "Y"
          }
        })
      }
    
      // 发起请求
      const result = await Request(options);
      if (result?.code == '200' && result?.data) {
        const { token } = result?.data;
        const { userId } = result?.data?.userInfo;
        // 把新的 Token 添加到 $.userArr
        token && userId && $.userArr.push({ "userId": userId, "token": token });
        $.log(`✅ 获取:1个Token变量 `);
      } else {
        $.log(`⛔️ 获取Token失败: ${$.toStr(result)}`);
      }
    }
    
    
    // 获取任务列表
    async function getTask() {
      let msg = ''
      // 构造请求
      const options = {
        url: `https://www.wandawic.com/wact-web/wd/yypt/task/ebTaskList`,
        headers: $.headers,
        body: $.toStr({
          time: getDateTime2(),
          data: {
            taskType: "daily"
          },
          channelCode: "ch_xcx",
          token: $.token
        })
      }
    
      // 发起请求
      const result = await Request(options);
      if (result?.code == '200' && result?.data) {
        let task_list = result?.data?.productList;
        for (let i = 0; i < task_list.length; i++) {
          // 任务名称、奖励、是否完成、任务进度
          const { taskName, prizePrice, isFinish, taskPeriodTimes } = task_list[i];
          // 当前任务进度
          let currentCount = 0;
          // 任务总进度
          let totalCount = 0;
          const taskPeriodTime = JSON.parse(taskPeriodTimes)
          if(taskPeriodTime?.d) {
            currentCount = taskPeriodTime?.d.split('/')[0];
            totalCount = taskPeriodTime?.d.split('/')[1];
          } else if(taskPeriodTime?.m) {
            currentCount = taskPeriodTime?.m.split('/')[0];
            totalCount = taskPeriodTime?.m.split('/')[1];
          }
          switch (isFinish) {
            case 'y':  // 任务已完成
              msg += `✅ 任务:${taskName},已完成\n`;
              break;
            case 'n':  // 任务未完成
              for(let j = 0; j < totalCount - currentCount; j++) {
                // 随机获取一个商铺 ID
                const shopId = await getShops();
                switch (taskName) {
                  case '浏览看铺':
                    await doTask(taskName, shopId, j + 1, totalCount, prizePrice, "SCEN_SACN", 'scanshop');
                    break;
                  case '收藏意向铺位':
                    // 收藏意向铺位
                    await storeUp(taskName, shopId, j + 1, totalCount, prizePrice);
                    await $.wait(2000);
                    // 取消收藏意向铺位
                    await cancelStoreUp(taskName, shopId);
                    break;
                  case '转发分享':
                    await doTask(taskName, shopId, j + 1, totalCount, prizePrice, "SCEN_SHARE", 'shareshop');
                    break;
                  case '预约、咨询':
                    await doTask(taskName, shopId, j + 1, totalCount, prizePrice, "SCEN_CONSULT", 'phoneshop');
                    break;
                }
                await $.wait(2000);
              }
            await $.wait(2000);
          }
        }
      } else {
        msg += `⛔️ 获取任务列表失败\n`;
        $.log($.toStr(result));
      }
      $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
    }
    
    
    // 完成任务
    async function doTask(taskName, shopId, currentCount, totalCount, prizePrice, taskTemplateId, actionType) {
      let msg = '';
      // 构造请求
      let opt = {
        url: `https://www.wandawic.com/wact-web/wd/yypt/task/doTask`,
        headers: $.headers,
        body: $.toStr({
          time: getDateTime(),
          traceId: getUUID(32),
          channelCode: "ch_xcx",
          data: {
            taskTemplateId,
            actionType,
            targetId: shopId
          },
          token: $.token
        })
      };
    
      // 发起请求
      var result = await Request(opt);
      if (result?.code == '200') {
        msg += `✅ 任务:${taskName},进度: ${currentCount}/${totalCount},获得${prizePrice}万商分\n`;
      } else {
        $.log(`⛔️ 完成任务${taskName}失败: ${result?.message}`);
      }
      $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
    }
    // 收藏意向铺位
    async function storeUp(taskName, shopId, currentCount, totalCount, prizePrice) {
      let msg = '';
      // 构造请求
      let opt = {
        url: `https://www.wandawic.com/api/foreground/store/storeUp`,
        headers: $.headers,
        body: $.toStr({
          time: getDateTime(),
          traceId: getUUID(32),
          channelCode: "ch_xcx",
          data: {
            collectType: "2",
            collectObject: shopId
          },
          token: $.token
        })
      };
    
      // 发起请求
      var result = await Request(opt);
      if (result?.code == '200') {
        msg += `✅ 任务:${taskName},进度: ${currentCount}/${totalCount},获得${prizePrice}万商分\n`;
      } else {
        $.log(`⛔️ 完成任务${taskName}失败: ${result?.message}`);
      }
      $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
    }
    // 取消收藏意向铺位
    async function cancelStoreUp(taskName, shopId) {
      let msg = '';
      // 构造请求
      let opt = {
        url: `https://www.wandawic.com/api/foreground/store/cancelStoreUp`,
        headers: $.headers,
        body: $.toStr({
          time: getDateTime(),
          traceId: getUUID(32),
          channelCode: "ch_xcx",
          data: {
            collectType: "2",
            collectObject: shopId
          },
          token: $.token
        })
      };
    
      // 发起请求
      var result = await Request(opt);
      if (result?.code == '200') {
        msg += `✅ 任务:${taskName},取消店铺收藏\n`;
      } else {
        $.log(`⛔️ 完成任务${taskName}失败: ${result?.message}`);
      }
      $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
    }
    
    
    // 获取用户信息
    async function getUserInfo(isShowMsg = false) {
      let msg = '';
      // 构造请求
      let opt = {
        url: `https://www.wandawic.com/api/foreground/loginregister/queryUser`,
        headers: $.headers,
        body: $.toStr({
          time: getDateTime(),
          channelCode: "ch_xcx",
          token: $.token
        })
      };
    
      // 发起请求
      var result = await Request(opt);
      if (result?.code == '200' && result?.data) {
        const { desePhone, balance } = result?.data;
        if(isShowMsg) {
          msg += `✅ 账号:${desePhone},帐户共计:${balance}万商分\n`;
        }
      } else if (result?.code == '401') {
        $.is_login = false;  // Token 失效
        msg += `⛔️ ${result?.message} \n`;
        $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
      } else {
        $.log(`查询用户信息失败 `);
      }
      if(isShowMsg) {
        $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
      }
    }
    // 随机获取一个商铺 ID
    async function getShops() {
      let msg = '';
      // 构造请求
      let opt = {
        url: `https://www.wandawic.com/api/foreground/shops/queryShops`,
        headers: $.headers,
        body: $.toStr({
          time: getDateTime(),
          traceId: getUUID(32),
          channelCode: "ch_xcx",
          data: {
            current: 1,
            size: 999,
            thisUnitType: "1"
          },
          token: $.token
        })
      };
    
      // 发起请求
      var result = await Request(opt);
      if (result?.code == '200' && result?.data) {
        const { total, records } = result?.data;
        const random = Math.floor(Math.random() * total)
        const shopId = records[random].id;
        msg += `✅ 从${total}个商铺中随机获取一个商铺ID:${shopId}\n`;
        return shopId;
      } else {
        $.log(`查询商户列表失败 `);
      }
      $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
    }
    
    // 脚本执行入口
    !(async () => {
      if (typeof $request !== `undefined`) {
        GetCookie();
      } else {
        await main();  // 主函数
      }
    })()
      .catch((e) => $.messages.push(e.message || e) && $.logErr(e))
      .finally(async () => {
        await sendMsg($.messages.join('\n').trimStart().trimEnd());  // 推送通知
        $.done();
      })
    
    
    
    // 获取用户数据
    function GetCookie() {
      try {
        let msg = '';
        debug($response.body);
        const header = ObjectKeys2LowerCase($request.headers);
        const token = header['wic-member-token'];
        const body = $.toObj($response.body);
        const { userId } = body['data'];
        if (token && userId) {
          // 使用 find() 方法找到与 member_id 匹配的对象，以新增/更新用户 token
          const user = $.userArr.find(user => user.userId === userId);
          if (user) {
            if (user.token == token) return;
            msg += `更新用户 [${userId}] Token: ${token}\n`;
            user.token = token;
          } else {
            msg += `新增用户 [${userId}] Token: ${token}\n`;
            $.userArr.push({ "userId": userId, "token": token });
          }
          // 写入数据持久化
          $.setdata($.toStr($.userArr), 'wdzhsy_token');
          $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
        }
      } catch (e) {
        $.log("⛔️ 签到数据获取失败"), $.log(e);
      }
    }
    
    
    // 获取环境变量
    function getEnv(...keys) {
      for (let key of keys) {
        var value = $.isNode() ? process.env[key] || process.env[key.toUpperCase()] || process.env[key.toLowerCase()] || $.getdata(key) : $.getdata(key);
        if (value) return value;
      }
    }
    
    
    // 获取微信 Code
    async function getWxCode() {
      try {
        $.codeList = [];
        $.codeServer = getEnv("CODESERVER_ADDRESS", "@codeServer.address");
        $.codeFuc = getEnv("CODESERVER_FUN", "@codeServer.fun");
        if (!$.codeServer) return $.log(`⛔️ 提示:未配置微信CodeServer\n`);
    
        $.codeList = ($.codeFuc
          ? (eval($.codeFuc), await WxCode($.appid))
          : (await Request(`${$.codeServer}/?wxappid=${$.appid}`))?.split("|"))
          .filter(item => item.length === 32);
        $.log(`✅ 获取:${$.codeList.length}个微信Code`);
      } catch (e) {
        $.logErr(`⛔️ 获取微信Code失败！`);
      }
    }
    
    
    /**
     * 请求函数二次封装
     * @param {(object|string)} options - 构造请求内容，可传入对象或 Url
     * @returns {(object|string)} - 根据 options['respType'] 传入的 {status|headers|rawBody} 返回对象或字符串，默认为 body
     */
    async function Request(options) {
      try {
        options = options.url ? options : { url: options };
        const _method = options?._method || ('body' in options ? 'post' : 'get');
        const _respType = options?._respType || 'body';
        const _timeout = options?._timeout || 15e3;
        const _http = [
          new Promise((_, reject) => setTimeout(() => reject(`⛔️ 请求超时: ${options['url']}`), _timeout)),
          new Promise((resolve, reject) => {
            debug(options, '[Request]');
            $[_method.toLowerCase()](options, (error, response, data) => {
              debug(response, '[response]');
              error && $.log($.toStr(error));
              if (_respType !== 'all') {
                resolve($.toObj(response?.[_respType], response?.[_respType]));
              } else {
                resolve(response);
              }
            })
          })
        ];
        return await Promise.race(_http);
      } catch (err) {
        $.logErr(err);
      }
    }
    
    
    // 发送消息
    async function sendMsg(message) {
      if (!message) return;
      try {
        if ($.isNode()) {
          try {
            var notify = require('./sendNotify');
          } catch (e) {
            var notify = require('./utils/sendNotify');
          }
          await notify.sendNotify($.name, message);
        } else {
          $.msg($.name, '', message);
        }
      } catch (e) {
        $.log(`\n\n----- ${$.name} -----\n${message}`);
      }
    }
    
    
    /**
     * DEBUG
     * @param {*} content - 传入内容
     * @param {*} title - 标题
     */
    function debug(content, title = "debug") {
      let start = `\n----- ${title} -----\n`;
      let end = `\n----- ${$.time('HH:mm:ss')} -----\n`;
      if ($.is_debug === 'true') {
        if (typeof content == "string") {
          $.log(start + content + end);
        } else if (typeof content == "object") {
          $.log(start + $.toStr(content) + end);
        }
      }
    }
    function getUUID(size) {
      let result = []
      let hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']
    
      for (let n = 0; n < size; n++) {
        result.push(hexRef[Math.floor(Math.random() * 16)])
      }
      return result.join('')
    }
    // 获取当前日期时间
    function getDateTime() {
      const date = new Date();
      // 获取年、月、日、时、分、秒
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
      // 拼接字符串
      const formattedDate = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}S`;
      return formattedDate;
    }
    // 获取当前日期时间
    function getDateTime2() {
      const date = new Date();
      // 获取年、月、日、时、分、秒
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1);
      const day = String(date.getDate());
      const hours = String(date.getHours());
      const minutes = String(date.getMinutes());
      const seconds = String(date.getSeconds());
    
      // 拼接字符串
      const formattedDate = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    
      return formattedDate;
    }
    
    //转换为小写
    function ObjectKeys2LowerCase(obj) { return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])) };
    
    // prettier-ignore
    function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, r) => { s.call(this, t, (t, s, a) => { t ? r(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null, ...s) { try { return JSON.stringify(t, ...s) } catch { return e } } getjson(t, e) { let s = e; const r = this.getdata(t); if (r) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, r) => e(r)) }) } runScript(t, e) { return new Promise(s => { let r = this.getdata("@chavy_boxjs_userCfgs.httpapi"); r = r ? r.replace(/\n/g, "").trim() : r; let a = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); a = a ? 1 * a : 20, a = e && e.timeout ? e.timeout : a; const [i, o] = r.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: a }, headers: { "X-Key": i, Accept: "*/*" }, timeout: a }; this.post(n, (t, e, r) => s(r)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e); if (!s && !r) return {}; { const r = s ? t : e; try { return JSON.parse(this.fs.readFileSync(r)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e), a = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, a) : r ? this.fs.writeFileSync(e, a) : this.fs.writeFileSync(t, a) } } lodash_get(t, e, s) { const r = e.replace(/\[(\d+)\]/g, ".$1").split("."); let a = t; for (const t of r) if (a = Object(a)[t], void 0 === a) return s; return a } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, r) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[r + 1]) >> 0 == +e[r + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, r] = /^@(.*?)\.(.*?)$/.exec(t), a = s ? this.getval(s) : ""; if (a) try { const t = JSON.parse(a); e = t ? this.lodash_get(t, r, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, r, a] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(r), o = r ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, a, t), s = this.setval(JSON.stringify(e), r) } catch (e) { const i = {}; this.lodash_set(i, a, t), s = this.setval(JSON.stringify(i), r) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) }); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: r, statusCode: a, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: r, statusCode: a, headers: i, rawBody: o, body: n }, n) }, t => { const { message: r, response: a } = t; e(r, a, a && s.decode(a.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) }); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let r = require("iconv-lite"); this.initGotEnv(t); const { url: a, ...i } = t; this.got[s](a, i).then(t => { const { statusCode: s, statusCode: a, headers: i, rawBody: o } = t, n = r.decode(o, this.encoding); e(null, { status: s, statusCode: a, headers: i, rawBody: o, body: n }, n) }, t => { const { message: s, response: a } = t; e(s, a, a && r.decode(a.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let r = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in r) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? r[e] : ("00" + r[e]).substr(("" + r[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let r = t[s]; null != r && "" !== r && ("object" == typeof r && (r = JSON.stringify(r)), e += `${s}=${r}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", r = "", a) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } case "Loon": { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } case "Quantumult X": { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, r = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": r } } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, r, i(a)); break; case "Quantumult X": $notify(e, s, r, i(a)); break; case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), r && t.push(r), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, e, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, e, void 0 !== t.message ? t.message : t, t.stack) } } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }
    
# 此远程订阅用于解决QX任务脚本的cookie获取，仅适用于QX 1.0.10及更高版本，您可在使用后手动将其禁用，以避免无意义的MITM。

hostname = passport.iqiyi.com, www.52pojie.cn, tiebac.baidu.com, c.tieba.baidu.com, app.bilibili.com, m.bilibili.com, xmc.ximalaya.com, ngabbs.com, iacc.rec.qq.com
# 爱奇艺 cookie
^https?:\/\/passport\.iqiyi\.com\/apis\/user\/ url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/iQIYI.js

# 吾爱破解 cookie
^https?:\/\/www\.52pojie\.cn\/home\.php\? url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/52pojie.js

# 百度贴吧 cookie
^https?:\/\/tiebac\.baidu\.com\/c\/u\/follow\/getFoldedMessageUserInfo url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/TieBa.js
^https?:\/\/c\.tieba\.baidu\.com\/c\/u\/follow\/getFoldedMessageUserInfo url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/TieBa.js

# BiliBili cookie
^https?:\/\/app\.bilibili\.com\/x\/resource\/fingerprint\? url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/BiliBili.js
^https?:\/\/m.bilibili.com/$ url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/BiliBili.js

# 喜马拉雅 cookie
^https?:\/\/xmc\.ximalaya\.com\/xmlymain-login-web\/login\/ url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/xmlySign.js

# 腾讯视频 cookie
^https?:\/\/iacc\.rec\.qq\.com url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/videoqq.js

# NGA玩家社区Cookie
^https?:\/\/ngabbs.com\/nuke.php$ url script-request-body https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/nga.js

/**************************************
脚本名称：阿里云盘任务 感谢zqzess、lowking、leiyiyan、mounuo提供的巨大帮助
脚本作者：@Sliverkiss
更新日期：2024-01-24 13:13:56

2024.04.19 
- 移除头像显示,以兼容surge及ios 16系统无法显示通知的bug
- 优化通知格式,多账号分别通知,以兼容surge通知长度限制
- 移除备份奖励任务,减少不必要的性能损耗
- 增加周五会员日任务

------------------------------------------
脚本兼容：NE/Node环境

*************************
【 签到脚本使用教程 】:
*************************
单账号&&多账号：
1.将获取ck脚本拉取到本地
2.打开阿里云盘，若提示获取ck成功，则可以使用该脚本
3.获取成功后，关闭获取ck脚本，避免产生不必要的mitm

QuantumultX配置如下：*/

[task_local]
0 7,11,17 * * * https://gist.githubusercontent.com/Sliverkiss/33800a98dcd029ba09f8b6fc6f0f5162/raw/aliyun.js, tag=阿里云签到, img-url=https://raw.githubusercontent.com/fmz200/wool_scripts/main/icons/apps/AliYunDrive.png, enabled=true

[rewrite_local]
^https:\/\/(auth|aliyundrive)\.alipan\.com\/v2\/account\/token url script-request-body https://gist.githubusercontent.com/Sliverkiss/33800a98dcd029ba09f8b6fc6f0f5162/raw/aliyun.js

[MITM]
hostname = auth.alipan.com,auth.aliyundrive.com

/*⚠️免责声明
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。
******************************************/


// env.js 全局
const $ = new Env("阿里云盘任务");
const ckName = "aliyun_data";
//-------------------- 一般不动变量区域 -------------------------------------
const Notify = 1;//0为关闭通知,1为打开通知,默认为1
const notify = $.isNode() ? require('./sendNotify') : '';
let envSplitor = ["@"]; //多账号分隔符
let userCookie = ($.isNode() ? process.env[ckName] : $.getdata(ckName)) || [];
let userList = [];
let userIdx = 0;
let userCount = 0;
//调试
$.is_debug = ($.isNode() ? process.env.IS_DEDUG : $.getdata('is_debug')) || 'false';
//是否自动领取奖励
$.is_reward = ($.isNode() ? process.env.IS_DEDUG : $.getdata('aliyun_reward')) || 'true';
// 为通知准备的空数组
$.notifyMsg = [];
// 上传空文件列表
$.uploadFileList = [];
//bark推送
$.barkKey = ($.isNode() ? process.env["bark_key"] : $.getdata("bark_key")) || '';
//---------------------- 自定义变量区域 -----------------------------------

//脚本入口函数main()
async function main() {
    await getNotice();
    console.log('\n================== 任务 ==================\n');
    for (let user of userList) {
        try {
            console.log(`🔷账号${user.ADrivreInfo.name} >> Start work`)
            console.log(`随机延迟${user.getRandomTime()}ms`);
            //刷新token
            await user.getAuthorizationKey();
            if (user.ckStatus) {
                //签到
                let { signInCount } = await user.signCheckin();
                //周五会员日
                await user.vipFriday();
                //补签卡任务
                await user.finishCardTask();
                //刷新数据
                await user.getHomeWidgets();
                //随机休眠
                await $.wait(user.getRandomTime());
                //完成时光间备份任务
                await user.finishDeviceRoomTask();
                //完成备份奖励任务
                await user.uploadBackupTask();
                //领取好运瓶
                await user.bottleTask();
                //随机休眠
                await $.wait(user.getRandomTime());
                //领取签到/备份奖励
                await user.getAllReward(signInCount);
            } else {
                //将ck过期消息存入消息数组
                $.notifyMsg.push(`❌ 账号${user.ADrivreInfo.name} >> Check ck error!`)
            }
        } catch (e) {
            $.notifyMsg.push(`❌账号${user.ADrivreInfo.name} >> ${e}`);
        } finally {
            //任务分段通知
            $.name = `阿里云盘任务(${user.index}/${userCount})`;
            $.barkKey
                ? await BarkNotify($, $.barkKey, $.name, $.notifyMsg.join('\n')) //推送Bark通知
                : await SendMsg($.notifyMsg.join('\n'));//带上总结推送通知
            $.notifyMsg = [];
        }
    }
}

class UserInfo {
    constructor(str) {
        this.index = ++userIdx;
        this.ADrivreInfo = str;
        this.ckStatus = true;
        this.bottleStatus = true;
    }
    getRandomTime() {
        return randomInt(1000, 3000)
    }
    //请求二次封装
    Request(options, method) {
        typeof (method) === 'undefined' ? ('body' in options ? method = 'post' : method = 'get') : method = method;
        return new Promise((resolve, reject) => {
            $.http[method.toLowerCase()](options)
                .then((response) => {
                    let res = response.body;
                    res = $.toObj(res) || res;
                    resolve(res);
                })
                .catch((err) => reject(err));
        });
    };
    //一键领取签到/备份奖励
    async getAllReward(signInCount) {
        try {
            //是否开启自动领取奖励
            if ($.is_reward == 'false') {
                //判断是否到达月底
                let isLastDay = getGoneDay() == getLastDay();
                console.log(isLastDay);
                $.log(`❌未开启自动领取任务，奖励将会积攒到月底一键清空`);
                $.log(`当前日期: ${getGoneDay()} => ` + (isLastDay ?
                    `已到达 ${getLastDay()} 开始领取奖励！`
                    : `未到达 ${getLastDay()} 跳过领取奖励！`))
                //到达月底,一键清空奖励
                if (isLastDay) {
                    for (let i = 1; i <= getCountDays(); i++) {
                        //签到奖励
                        await this.getSignReword(signInCount);
                        //备份奖励
                        await this.getTaskReword(signInCount);
                    }
                }
            } else {
                $.log(`✅已开启自动领取 => 开始领取签到/备份奖励...\n`);
                //签到奖励
                let signMsg = await this.getSignReword(signInCount);
                $.log(`签到: ${signMsg}`);
                //备份奖励
                let backMsg = await this.getTaskReword(signInCount);
                $.log(`备份: ${backMsg}`);
            }
        } catch (e) {
            $.log(`❌一键领取签到/备份奖励失败！原因为:${e}`)
        }
    }
    //获取accessToken
    async getAuthorizationKey() {
        try {
            const options = {
                url: `https://auth.aliyundrive.com/v2/account/token`,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh_token: this.ADrivreInfo.refresh_token,
                    grant_type: 'refresh_token'
                })
            };
            //post方法
            let res = await this.Request(options);
            debug(res);
            let { avatar, nick_name, device_id, refresh_token, access_token } = res;
            //缓存用户信息(avatar=>头像，nick_name=>用户名)
            //$.avatar = avatar;
            $.nick_name = nick_name;
            $.device_id = device_id;
            //获取accessKey鉴权
            let accessKey = 'Bearer ' + access_token;
            debug(accessKey, "鉴权")
            this.authorization = accessKey;
            let index = userCookie.findIndex(e => (e.name == nick_name && e.device_id == device_id));
            userCookie[index].refresh_token = refresh_token;
            //刷新token
            if ($.setjson(userCookie, ckName)) {
                $.log(`${nick_name}刷新阿里网盘refresh_token成功 🎉`)
            } else {
                DoubleLog(`${nick_name}刷新阿里网盘refresh_token失败‼️`, '', '')
                this.ckStatus = false;
            }
            //accessKey
            return accessKey;
        } catch (e) {
            $.log(`❌获取accessToken失败！原因为:${e}`)
        }
    }
    //查询签到日历
    async signCheckin() {
        console.log(`⏰ 开始执行签到任务\n`)
        try {
            const options = {
                url: "https://member.aliyundrive.com/v2/activity/sign_in_list",
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': this.authorization,
                },
                body: JSON.stringify({})
            }
            //post方法
            let { message, result } = await this.Request(options);
            //
            if (message) {
                DoubleLog(`❌签到失败!${message}`);
                return;
            }
            let { isSignIn, isReward, signInCount, signInInfos } = result;
            //获取今天签到信息
            let signInRes = signInInfos.find(e => Number(e.day) == Number(signInCount));
            let { subtitle, rewards } = signInRes;
            debug(rewards, "签到信息");
            //打印
            if (rewards.length > 0) {
                $.log(`签到天数:${signInCount} => ${subtitle}`)
                DoubleLog(`用户: ${$.nick_name}`)
                //DoubleLog(`自动领取: ${$.is_reward == 'false' ? '月底一键清空' : '每日自动领取'}`)
                //今日奖励详情
                $.signReward = rewards[0].name;
                $.backUpReward = rewards[1].name;
                $.log(`\n查询签到日历 => 第${signInCount}天可领取奖励如下:\n签到奖励: ${$.signReward}\n备份奖励: ${$.backUpReward}\n`)
                $.log(`✅ 已完成执行签到任务\n`);
            }
            //打印通知
            DoubleLog(`签到: ${(isSignIn ? `签到成功·第${signInCount}天` : `今日已签到`)}｜${$.is_reward == 'false' ? '月底清空' : '每日领取'}`);
            return { signInCount };
        } catch (e) {
            $.log(`❌查询签到日历失败！原因为:${e}`)
        }
    }
    //获取签到信息
    async getSignInfo() {
        try {
            const options = {
                url: `https://member.aliyundrive.com/v2/activity/sign_in_info`,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.authorization,
                    'x-device-id': this.ADrivreInfo.device_id,
                },
                body: JSON.stringify({}),
            };
            //post方法
            let res = await this.Request(options);
            debug(res, "获取签到信息");
        } catch (e) {
            $.log(`❌获取签到信息失败！原因为:${e}`)
        }
    }
    //周五会员日任务
    async vipFriday() {
        try {
            $.log(`⏰ 开始执行周五会员日任务\n`);
            if (!isTodayFriday()) return $.log(`❌ 周五会员日:未到达指定时间 => 跳过执行任务`);
            if (await this.getVipInfo()) {
                await this.getVipReward();
            } else {
                $.log("❌ 周五会员日:领取奖励失败 => 当前用户并非会员\n");
                $.notifyMsg.push(`会员: 失败,当前用户并非会员`)
            }
        } catch (e) {
            $.log(`❌周五会员日任务失败！原因为:${e}`)
        }
    }
    //获取会员信息
    async getVipInfo() {
        try {
            const options = {
                url: `https://member.aliyundrive.com/v2/activity/vip_day_info`,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.authorization,
                    'x-device-id': this.ADrivreInfo.device_id,
                },
                body: JSON.stringify({}),
            };
            //post方法
            let res = await this.Request(options);
            debug(res, "获取会员信息");
            return res?.result?.isVip;
        } catch (e) {
            $.log(`❌获取签到信息失败！原因为:${e}`)
        }
    }
    //获取会员奖励
    async getVipReward() {
        try {
            const options = {
                url: `https://member.aliyundrive.com/v2/activity/vip_day_reward`,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.authorization,
                    'x-device-id': this.ADrivreInfo.device_id,
                },
                body: JSON.stringify({}),
            };
            //post方法
            let res = await this.Request(options);
            debug(res, "获取会员奖励");
            $.log(`周五会员日 => ${res?.message || "领取本周五奖励成功"}\n`)
            $.notifyMsg.push(`会员: ${res?.message || "领取奖励成功!"}`)
        } catch (e) {
            $.log(`❌获取签到信息失败！原因为:${e}`)
        }
    }
    //刷新阿里云主界面数据
    async getHomeWidgets() {
        try {
            const options = {
                url: `https://api.alipan.com/apps/v2/users/home/widgets`,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.authorization,
                    'x-device-id': this.ADrivreInfo.device_id,
                },
                body: JSON.stringify({}),
            };
            //post方法
            let res = await this.Request(options);
            $.log(`刷新阿里云界面信息`)
            debug(res, "获取home信息");
        } catch (e) {
            $.log(`❌获取home信息失败！原因为:${e}`)
        }
    }
    //备份任务 自动上传10个文件
    async uploadBackupTask() {
        this.albumsId = await this.getAlbumsInfo();
        for (let i = 1; i <= 10; i++) {
            await this.uploadFileToAlbums(this.albumsId);
        }
    }
    // 领取签到奖励
    async getSignReword(signInCount) {
        try {
            const options = {
                url: `https://member.aliyundrive.com/v1/activity/sign_in_reward`,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.authorization,
                },
                body: JSON.stringify({ signInDay: signInCount }),
            };
            //post方法
            let { result, message } = await this.Request(options);
            //打印领取详情
            $.log(`领取第${signInCount}天签到奖励 => 🎉${result.description || result.name}领取成功!`);
            return result.description ? result.description : result.name;
        } catch (e) {
            $.log(`❌领取签到奖励失败！原因为:${e}`)
        }
    }
    //领取备份奖励
    async getTaskReword(signInCount) {
        try {
            const options = {
                url: `https://member.aliyundrive.com/v2/activity/sign_in_task_reward?_rx-s=mobile`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({ "signInDay": signInCount })
            };
            //post方法
            let { result, message } = await this.Request(options);
            //打印领取详情
            $.log((result && !message) ? `领取备份奖励 => 🎉${result.description}领取成功!` : `领取备份奖励 => ❌${message}`);
            return (result && !message) ? result.description : message;
        } catch (e) {
            $.log(`❌领取备份奖励失败！原因为:${e}`)
        }
    }
    //备份设备列表
    async getDeviceList() {
        try {
            const options = {
                url: `https://api.alipan.com/adrive/v2/backup/device_applet_list_summary`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                    'x-device-id': this.ADrivreInfo.device_id,
                },
                body: JSON.stringify({})
            };
            //post方法
            let { deviceItems } = await this.Request(options) ?? [];
            $.log(
                Array.isArray(deviceItems) && deviceItems.length > 0
                    ? `✅ 成功获取到 ${deviceItems.length} 台设备\n`
                    : `❌ 获取设备列表失败: 你账号下没有设备\n`);
            debug(deviceItems, "备份设备列表");
            return deviceItems;
        } catch (e) {
            $.log(`❌查询备份设备列表失败！原因为:${e}`)
        }
    }

    // 上传文件到相册/完成照片备份任务
    async uploadFileToAlbums(albumsId, deviceId = this.ADrivreInfo.device_id, deviceModel = 'iPhone 13') {
        try {
            //获取相册信息
            //    this.albumsId = await this.getAlbumsInfo();
            //创建上传文件
            let res = await this.createFile(albumsId, deviceId, deviceModel);
            if (res?.file_id && res?.upload_id && res?.upload_url) {
                let { file_id, upload_id, upload_url } = res;
                //开始上传文件
                await this.toUploadFile(upload_url, deviceId);
                //完成上传文件
                await this.completeUpload(this.albumsId, deviceId, file_id, upload_id);
                //返回创建文件id
                return file_id;
            }
            return false;
        } catch (e) {
            $.log(`❌上传文件到相册/完成照片备份任务失败！原因为:${e}`)
        }
    }
    //完成快传任务
    async finishQuickShare() {
        try {
            this.albumsId = await this.getAlbumsInfo();
            let file_id = await this.getAlbumsList();
            //若文件id不存在，跳过快传任务
            if (!file_id) {
                $.log(`容量不足,跳过快传任务`);
                return false;
            }
            const options = {
                url: `https://api.aliyundrive.com/adrive/v1/share/create`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({
                    drive_file_list: [{
                        drive_id: this.albumsId,
                        file_id
                    }]
                })
            };
            let res = await this.Request(options);
            debug(res, "完成快传任务");
            return true;
        } catch (e) {
            $.log(`❌完成快传任务失败！原因为:${e}`)
        }
    }
    //获取相册文件列表
    async getAlbumsList() {
        try {
            this.albumsId = await this.getAlbumsInfo();
            const options = {
                url: `https://api.alipan.com/adrive/v2/backup/device/file_list`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({
                    "deviceType": "iOS",
                    "deviceId": this.ADrivreInfo.device_id,
                    "driveId": this.albumsId,
                    "backupView": "album",
                    "parentFileId": "root",
                    "limit": 1
                })
            };
            let res = await this.Request(options);
            //判断相册列表是否存在文件 
            if (res?.items?.[0]?.file_id) {
                return res?.items?.[0]?.file_id;
            } else {
                return await this.uploadFileToAlbums(this.albumsId);
            }
        } catch (e) {
            $.log(`❌获取相册文件列表失败！原因为:${e}`)
        }
    }
    //获取相册信息
    async getAlbumsInfo() {
        try {
            const options = {
                url: `https://api.aliyundrive.com/adrive/v1/user/albums_info`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({})
            };
            let { data } = await this.Request(options);
            return data?.driveId;
        } catch (e) {
            $.log(`❌获取相册信息失败！原因为:${e}`)
        }
    }
    //创建上传文件
    async createFile(albumsId, deviceId, deviceModel) {
        try {
            const options = {
                url: `https://api.aliyundrive.com/adrive/v1/biz/albums/file/create`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                    'x-device-id': deviceId
                },
                body: JSON.stringify({
                    drive_id: albumsId,
                    part_info_list: [
                        {
                            part_number: 1
                        }
                    ],
                    parent_file_id: 'root',
                    name: Math.floor(Math.random() * 100000000) + '.jpg',
                    type: 'file',
                    check_name_mode: 'auto_rename',
                    size: Math.floor(Math.random() * 30000),
                    create_scene: 'auto_autobackup',
                    device_name: deviceModel,
                    hidden: false,
                    content_type: 'image/jpeg'
                })
            };
            let { file_id, upload_id, part_info_list } = await this.Request(options);
            //判断相册空间是否充足
            if (part_info_list?.length > 0) {
                let upload_url = part_info_list[0]?.upload_url;
                return { file_id, upload_id, upload_url }
            }
            //空间不足，创建文件失败
            return $.log(`相册空间容量不足,跳过上传备份文件`);
        } catch (e) {
            $.log(`❌创建上传文件失败！原因为:${e}`)
        }
    }
    //开始上传文件
    async toUploadFile(upload_url, deviceId) {
        try {
            const options = {
                url: upload_url,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
                    'Origin': 'https://www.aliyundrive.com',
                    'Referer': 'https://www.aliyundrive.com',
                    "deviceId": deviceId
                },
                body: JSON.stringify({})
            };
            let res = await this.Request(options);
            debug(res);
        } catch (e) {
            $.log(`❌开始上传文件失败！原因为:${e}`)
        }
    }
    //完成上传文件
    async completeUpload(albumsId, deviceId, file_id, upload_id) {
        try {
            const options = {
                url: `https://api.aliyundrive.com/v2/file/complete`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                    "deviceId": deviceId
                },
                body: JSON.stringify({
                    drive_id: albumsId,
                    upload_id: upload_id,
                    file_id: file_id
                })
            };
            let res = await this.Request(options);
            debug(res);
            $.uploadFileList.push(file_id);
        } catch (e) {
            $.log(`❌完成上传文件失败！原因为:${e}`)
        }
    }
    //批量清空上传空文件
    async removeFiles(uploadFileList) {
        $.log(`开始批量清除上传空文件...`)
        let albumId = await this.getAlbumsInfo();
        for (let item of uploadFileList) {
            await this.removeFile(albumId, item);
        }
    }
    //删除上传文件
    async removeFile(albumsId, file_id) {
        try {
            const options = {
                url: `https://api.alipan.com/adrive/v4/batch`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({
                    "requests": [
                        {
                            "body": {
                                "drive_id": albumsId,
                                "file_id": file_id
                            },
                            "id": file_id,
                            "method": "POST",
                            "url": "\/file\/delete"
                        }
                    ],
                    "resource": "file"
                })
            };
            let res = await this.Request(options);
            debug(res);
        } catch (e) {
            $.log(`❌删除上传文件失败！原因为:${e}`)
        }
    }
    //完成时光间备份任务
    async finishDeviceRoomTask() {
        try {
            //获取相册信息
            this.albumsId = await this.getAlbumsInfo();
            //获取设备列表
            let deviceList = await this.getDeviceList();
            //获取时空间可领取奖励列表
            let items = await this.getListDevice();
            //debug(deviceList);
            $.log(`⏰ 开始执行时光设备间备份任务\n`);
            let { rewardCountToday, rewardTotalSize } = await this.getDeviceRoomInfo();
            if (rewardCountToday >= 5) {
                DoubleLog(`时光: 今日领取奖励已达到上限`);
                return $.log(`今日时光间领取奖励已达到上限，跳过任务\n`)
            }
            for (let e of deviceList) {
                if (items) {
                    let deviceItem = items.find(u => u.id == e.deviceId) ?? [];
                    //若设备无可领取奖励，执行上传任务
                    if (!deviceItem.canCollectEnergy) {
                        //每个设备上传两次空文件
                        for (let i = 1; i <= 2; i++) {
                            await this.uploadFileToAlbums(this.albumsId, e.deviceId, e.deviceModel);
                            $.log(`${e.deviceModel} 完成第${i}次上传任务`);
                        }
                    }
                    //随机休眠
                    await $.wait(this.getRandomTime());
                    //领取时光间奖励
                    await this.getEnergyReword(e);
                } else {
                    $.log(`❌获取时空间设备列表失败！`);
                }
            }
            let res = await this.getDeviceRoomInfo();
            DoubleLog(`时光: 领取(${res?.rewardCountToday}/5)次，获得${((res.rewardTotalSize - rewardTotalSize) / 1024).toFixed(2)}G`);
        } catch (e) {
            $.log(`❌完成时光间备份任务失败！原因为:${e}`)
        }
    }
    //获取时光间信息
    async getDeviceRoomInfo() {
        try {
            const options = {
                url: `https://member.aliyundrive.com/v1/deviceRoom/rewardInfoToday`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({})
            };
            //post方法
            let { result, message } = await this.Request(options);
            return { rewardTotalSize: result?.rewardTotalSize, rewardCountToday: result?.rewardCountToday };
        } catch (e) {
            $.log(`❌获取时光间信息失败！原因为:${e}`)
        }
    }
    //获取时空间可领取奖励设备列表
    async getListDevice() {
        try {
            const options = {
                url: `https://user.aliyundrive.com/v1/deviceRoom/listDevice`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({})
            };
            //post方法
            let { items } = await this.Request(options) ?? [];
            if (Array.isArray(items) && items.length > 0) {
                return items;
            }
            return false;
        } catch (e) {
            $.log(`❌查询是空间奖励列表失败！原因为:${e}`)
        }
    }
    //领取时光间奖励
    async getEnergyReword(e) {
        try {
            const options = {
                url: `https://member.aliyundrive.com/v1/deviceRoom/rewardEnergy`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({
                    "deviceId": e.deviceId
                })
            };
            //post方法
            let { result, message } = await this.Request(options);
            $.log(`${e.deviceModel}:` + ((result && !message) ? `领取${result?.size}MB成功!` : `今日已领取或暂无备份奖励`) + "\n");

        } catch (e) {
            $.log(`❌领取时光间奖励失败！原因为:${e}`)
        }
    }
    //执行好运瓶任务
    async bottleTask() {
        $.log(`⏰ 开始执行好运瓶任务\n`);
        let index = 1;
        do {
            await this.bottleFish();
        } while (this.bottleStatus && index++ <= 5);
    }
    //领取好运瓶
    async bottleFish() {
        try {
            const options = {
                url: `https://api.aliyundrive.com/adrive/v1/bottle/fish`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({})
            };
            //{"bottleId":1726268665825546200,"bottleName":"你的名字","shareId":"EG9LdVtcxdw"}
            //{"code":"TooManyRequests","message":"TooManyRequests","requestId":"0a0070d417055857275284776ea12f","display_message":"今天接瓶子次数已用完，明天再来~"}
            let { bottleName, display_message } = await this.Request(options);
            if (display_message) {
                DoubleLog(`好运: 今日接瓶子次数已用完`);
                this.bottleStatus = false;
            } else {
                $.log(`好运瓶[${bottleName}]领取成功！\n`)
            }
        } catch (e) {
            $.log(`❌领取好运瓶失败！原因为:${e}`)
            this.bottleStatus = false;
        }
    }
    //完成补签卡任务
    async finishCardTask() {
        try {
            console.log(`⏰ 开始执行补签卡任务\n`)
            //翻牌子
            for (let i = 1; i <= 3; i++) {
                await this.flipCard(i)
            }
            //获取任务详情
            const cardDetail = await this.getCardTaskDetail();
            let { period, tasks } = cardDetail;
            //过滤已完成任务
            tasks = tasks.filter(e => e.status == 'unfinished');
            debug(tasks, '未完成任务列表');
            if (!tasks) {
                $.log(`✅补签卡所有任务已完成`);
            } else {
                for (let task of tasks) {
                    switch (task.taskName) {
                        case '当周使用好运瓶翻3次':
                            console.log(`⏰ 开始执行任务: ${task.taskName}`)
                            if (task.status != 'finished') {
                                await this.bottleTask();
                            }
                            console.log(`✅ 成功完成任务: ${task.taskName}`)
                            break
                        case '当周使用快传发送文件给好友':
                            console.log(`⏰ 开始执行任务: ${task.taskName}`)
                            if (task.status != 'finished') {
                                $.quickShareStatus = await this.finishQuickShare();
                            }
                            console.log($.quickShareStatus ? `✅ 成功完成任务: ${task.taskName}` : `❌容量不足，完成快传任务失败`)
                            break;
                        case '当周备份照片满20张':
                            console.log(`⏰ 开始执行任务: ${task.taskName}`)
                            if (task.status != 'finished') {
                                this.albumsId = await this.getAlbumsInfo();
                                for (let i = 0; i < 20; i++) {
                                    $.uploadStatus = await this.uploadFileToAlbums(this.albumsId);
                                    //相册空间容量不足，跳过任务
                                    if (!$.uploadStatus) break;
                                }
                            }
                            //存在文件id
                            console.log($.uploadStatus ? `✅ 成功完成任务: ${task.taskName}` : `❌容量不足，完成备份照片任务失败`)
                            break;
                        default:
                            console.log(`❌ 不支持当前任务: ${task.taskName}`)
                            break;
                    }
                }
            }
            //领取补签卡奖励
            await this.receiveCard();
        } catch (e) {
            $.log(`❌完成补签卡任务失败！原因为:${e}`)
        }
    }
    //翻转补签卡任务牌
    async flipCard(position) {
        try {
            const options = {
                url: `https://member.aliyundrive.com/v2/activity/complement_task?_rx-s=mobile`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({ position })
            };
            let res = await this.Request(options);
            debug(res, "翻转补签卡任务牌");
        } catch (e) {
            $.log(`❌翻转补签卡任务牌失败！原因为:${e}`)
        }
    }
    //获取补签卡任务详情
    async getCardTaskDetail() {
        try {
            const options = {
                url: `https://member.aliyundrive.com/v2/activity/complement_task_detail?_rx-s=mobile`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({})
            };
            let res = await this.Request(options);
            debug(res, "获取补签卡任务详情");
            return res?.result;
        } catch (e) {
            $.log(`❌获取补签卡任务详情失败！原因为:${e}`)
        }
    }
    //领取补签卡
    async receiveCard() {
        try {
            const { period, tasks } = await this.getCardTaskDetail()
            //查询完成任务编号
            let task = tasks.find(e => e.status == 'finished');
            //不存在完成任务，跳过领取
            if (!task) return $.log(`未完成补签卡任务，领取奖励失败`);
            const options = {
                url: `https://member.aliyundrive.com/v2/activity/complement_task_reward?_rx-s=mobile`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: this.authorization,
                },
                body: JSON.stringify({
                    period,
                    taskId: task?.taskId
                })
            };
            let res = await this.Request(options);
            debug(res, "领取补签卡任务奖励");
            DoubleLog(`补签: ` + (res.message || "任务已完成，成功领取1张补签卡"))
            // return res?.result;
        } catch (e) {
            $.log(`❌领取补签卡失败！原因为:${e}`)
        }
    }

}


//获取Cookie
async function getCookie() {
    if ($request && $request.method != 'OPTIONS') {
        try {
            const body = JSON.parse($request.body);
            let refresh_token = body.refresh_token;
            //不存在token时
            if (!refresh_token) {
                return $.msg($.name, "", "❌获取token失败！请稍后再试～")
            }
            //获取响应体
            let { nick_name, avatar, device_id } = await getRespBody(refresh_token) ?? {};
            //是否存在多账号数据
            if ((Array.isArray(userCookie)) && userCookie.length == 0) {
                userCookie.push({ "name": nick_name, "refresh_token": refresh_token, "device_id": device_id });
                $.setjson(userCookie, ckName);
                $.msg($.name, `🎉${nick_name}获取token成功!`, "", { 'media-url': avatar });
            } else {
                userCookie = eval('(' + userCookie + ')');
                let index = userCookie.findIndex(e => (e.name == nick_name && e.device_id == device_id));
                if (userCookie[index]) {
                    userCookie[index].refresh_token = refresh_token;
                    $.setjson(userCookie, ckName);
                    $.msg($.name, `🎉${nick_name}更新token成功!`, "", { 'media-url': avatar });
                } else {
                    userCookie.push({ "name": nick_name, "refresh_token": refresh_token, "device_id": device_id });
                    $.setjson(userCookie, ckName);
                    $.msg($.name, `🎉${nick_name}获取token成功!`, ``, { 'media-url': avatar });
                }
            }
        } catch (e) {
            $.msg($.name, "❌获取阿里云盘refresh_token失败！请检查boxjs格式是否正确", e)
        }
    }
}
//判断今天是否为周五
function isTodayFriday() {
    // 创建一个新的 Date 对象表示当前日期和时间
    const today = new Date();
    // 检查今天是否为星期五
    return today.getDay() === 5;
}

async function getRespBody(refresh_token) {
    //获取用户名作为标识键
    const options = {
        url: `https://auth.aliyundrive.com/v2/account/token`,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            refresh_token: refresh_token,
            grant_type: 'refresh_token'
        })
    };
    return new Promise(resolve => {
        $.post(options, async (error, response, data) => {
            try {
                let result = JSON.parse(data);
                resolve(result);
            } catch (error) {
                $.log(error);
                resolve();
            }
        });
    });
}

//远程通知
async function getNotice() {
    const urls = [
        "https://raw.githubusercontent.com/Sliverkiss/GoodNight/main/notice.json",
        "https://raw.githubusercontent.com/Sliverkiss/GoodNight/main/tip.json"
    ];
    try {
        const responses = await Promise.all(urls.map(url => httpRequest({ url })));
        responses.map(result => console.log(result?.notice || "获取通知失败"));
    } catch (error) {
        console.log(`❌获取通知时发生错误：${error}`);
    }
}


//主程序执行入口
!(async () => {
    //没有设置变量,执行Cookie获取
    if (typeof $request != "undefined") {
        await getCookie();
        return;
    }
    //未检测到ck，退出
    if (!(await checkEnv())) { throw new Error(`❌未检测到ck，请添加环境变量`) };
    if (userList.length > 0) {
        await main();
    }
})()
    .catch((e) => $.notifyMsg.push(e.message || e))//捕获登录函数等抛出的异常, 并把原因添加到全局变量(通知)
    .finally(() => {
        $.done(); //调用Surge、QX内部特有的函数, 用于退出脚本执行
    });

/** --------------------------------辅助函数区域------------------------------------------- */

// 当天
function getGoneDay(n = 0, yearFlag = true) {
    let myDate = new Date();
    myDate.setDate(myDate.getDate() - n);
    let month = myDate.getMonth() + 1;
    let day = myDate.getDate();
    let result =
        "" +
        (yearFlag ? myDate.getFullYear() : "") +
        "/" +
        month +
        "/" +
        (day < 10 ? "0" + day : day);
    return result;
}

//计算天数差
function diffDate(date1, date2) {
    let day = Math.floor(Math.abs(date1 - date2) / 1000 / 60 / 60 / 24 + 0.5);
    return day;
}

// 月底最后一天
function getLastDay() {
    let nowDate = new Date();
    nowDate.setMonth(nowDate.getMonth() + 1);
    nowDate.setDate(0);
    let lastMonthDay = nowDate.toLocaleDateString();
    return lastMonthDay;
}

// 当月有几天
function getCountDays() {
    var curDate = new Date();
    var curMonth = curDate.getMonth();
    curDate.setMonth(curMonth + 1);
    curDate.setDate(0);
    return curDate.getDate();
}


// 双平台log输出
function DoubleLog(data) {
    if ($.isNode()) {
        if (data) {
            console.log(`${data}`);
            $.notifyMsg.push(`${data}`);
        }
    } else {
        console.log(`${data}`);
        $.notifyMsg.push(`${data}`);
    }
}

// DEBUG
function debug(text, title = 'debug') {
    if ($.is_debug === 'true') {
        if (typeof text == "string") {
            console.log(`\n-----------${title}------------\n`);
            console.log(text);
            console.log(`\n-----------${title}------------\n`);
        } else if (typeof text == "object") {
            console.log(`\n-----------${title}------------\n`);
            console.log($.toStr(text));
            console.log(`\n-----------${title}------------\n`);
        }
    }
}


//检查变量
async function checkEnv() {
    if ((Array.isArray(userCookie)) && userCookie.length == 0) {
        console.log("未找到CK");
        return;
    } else {
        userCookie = eval('(' + userCookie + ')');
        for (let n of userCookie) n && userList.push(new UserInfo(n));
        userCount = userList.length;
    }
    return console.log(`共找到${userCount}个账号`), true;//true == !0
}

/**
 * 随机整数生成
 */
function randomInt(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}
// 发送消息
async function SendMsg(message) {
    if (!message) return;
    if (Notify > 0) {
        if ($.isNode()) {
            await notify.sendNotify($.name, message)
        } else {
            //$.msg($.name, $.signMsg, message, { 'media-url': $.avatar })
            $.msg($.name, $.signMsg, message)
        }
    } else {
        console.log(message)
    }
}

/** ---------------------------------固定不动区域----------------------------------------- */
// prettier-ignore

//请求函数函数二次封装
function httpRequest(options, method) { typeof (method) === 'undefined' ? ('body' in options ? method = 'post' : method = 'get') : method = method; return new Promise((resolve) => { $[method](options, (err, resp, data) => { try { if (err) { console.log(`${method}请求失败`); $.logErr(err) } else { if (data) { typeof JSON.parse(data) == 'object' ? data = JSON.parse(data) : data = data; resolve(data) } else { console.log(`请求api返回数据为空，请检查自身原因`) } } } catch (e) { $.logErr(e, resp) } finally { resolve() } }) }) }
//Bark APP notify
async function BarkNotify(c, k, t, b) { for (let i = 0; i < 3; i++) { console.log(`🔷Bark notify >> Start push (${i + 1})`); const s = await new Promise((n) => { c.post({ url: 'https://api.day.app/push', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, body: b, device_key: k, ext_params: { group: t } }) }, (e, r, d) => r && r.status == 200 ? n(1) : n(d || e)) }); if (s === 1) { console.log('✅Push success!'); break } else { console.log(`❌Push failed! >> ${s.message || s}`) } } };
//From chavyleung's Env.js
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, a) => { s.call(this, t, (t, s, r) => { t ? a(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const a = this.getdata(t); if (a) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, a) => e(a)) }) } runScript(t, e) { return new Promise(s => { let a = this.getdata("@chavy_boxjs_userCfgs.httpapi"); a = a ? a.replace(/\n/g, "").trim() : a; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [i, o] = a.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": i, Accept: "*/*" }, timeout: r }; this.post(n, (t, e, a) => s(a)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a = !s && this.fs.existsSync(e); if (!s && !a) return {}; { const a = s ? t : e; try { return JSON.parse(this.fs.readFileSync(a)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : a ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const a = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of a) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, a) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[a + 1]) >> 0 == +e[a + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, a] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, a, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, a, r] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(a), o = a ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), a) } catch (e) { const i = {}; this.lodash_set(i, r, t), s = this.setval(JSON.stringify(i), a) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, a) => { !t && s && (s.body = a, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a) }); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: a, statusCode: r, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: a, statusCode: r, headers: i, rawBody: o, body: n }, n) }, t => { const { message: a, response: r } = t; e(a, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, a) => { !t && s && (s.body = a, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a) }); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let a = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...i } = t; this.got[s](r, i).then(t => { const { statusCode: s, statusCode: r, headers: i, rawBody: o } = t, n = a.decode(o, this.encoding); e(null, { status: s, statusCode: r, headers: i, rawBody: o, body: n }, n) }, t => { const { message: s, response: r } = t; e(s, r, r && a.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let a = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in a) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? a[e] : ("00" + a[e]).substr(("" + a[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let a = t[s]; null != a && "" !== a && ("object" == typeof a && (a = JSON.stringify(a)), e += `${s}=${a}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", a = "", r) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } case "Loon": { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } case "Quantumult X": { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, a = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": a } } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, a, i(r)); break; case "Quantumult X": $notify(e, s, a, i(r)); break; case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), a && t.push(a), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, t.stack) } } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }

/*
------------------------------------------
@Author: Sliverkiss
@Date: 2023.10.20 08:34:33
@Description:夸克网盘 空间签到、福利空间签到、低碳空间任务
------------------------------------------
cron 8,18 * * *
const $ = new Env("夸克网盘")

2024.04.18 
- 修复获取ck失败、无法触发等问题。更换获取ck方式，支持多账号。
- 增加福利空间、低碳空间等任务。
- 之前填写过数据的，需要清除boxjs缓存，通过脚本重新获取。

脚本说明：
1.在运行脚本之前，需要将获取ck脚本添加到本地
2.浏览器访问https://pan.quark.cn/ 并登录，如果找不到登录入口，就切换到pc端。登录成功后，提示获取ck成功则可以使用该脚本。
3.打开夸克浏览器app，点击右下角三条杠->福利中心，手动完成一次签到，获取相关任务信息。如果签到没有提示，就把红包领了，第二天再重新获取一次。
4.在福利界面内点击进入低碳空间，手动完成一次签到，获取相关任务信息。

[Script]
http-response ^https:\/\/drive-pc\.quark\.cn\/1\/clouddrive\/file\/sort script-path=https://gist.githubusercontent.com/Sliverkiss/1589f69e675019b0b685a57a89de9ea5/raw/quarkV2.js, requires-body=true, timeout=60, tag=夸克网盘获取token

http-request ^https:\/\/coral2\.quark\.cn\/quark\/(carbon|welfare)\/(v1|v2)\/signIn script-path=https://gist.githubusercontent.com/Sliverkiss/1589f69e675019b0b685a57a89de9ea5/raw/quarkV2.js, requires-body=true, timeout=60, tag=夸克网盘收录任务

[MITM]
hostname = coral2.quark.cn,drive-pc.quark.cn

⚠️【免责声明】
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。
*/
const $ = new Env("夸克网盘");
const ckName = "quark_data";
const userCookie = $.toObj($.isNode() ? process.env[ckName] : $.getdata(ckName)) || [];
//用户多账号配置
$.userIdx = 0, $.userList = [], $.notifyMsg = [];
//notify
const notify = $.isNode() ? require('./sendNotify') : '';
//debug
$.is_debug = ($.isNode() ? process.env.IS_DEDUG : $.getdata('is_debug')) || 'false';
//当前获取ck用户
$.quark_user = ($.isNode() ? process.env["quark_user"] : $.getdata('quark_user')) || '';
//------------------------------------------
async function main() {
    //并发执行所有用户
    for (let user of $.userList) {
        $.notifyMsg = [], $.title = "";
        try {
            //task ;
            await user.signin();
            if (user.ckStatus) {
                //----—空间签到任务----—
                //查询用户信息
                await user.getUserInfo();
                //查询签到信息
                await user.getSignInfo();
                //----—福利空间任务----—
                if (user.welfare) {
                    let signMsg = await user.welfareSignin();
                    //查询金币余额
                    let coin = await user.getCoin();
                    $.notifyMsg.push(`福利空间: ${signMsg}｜${coin}金币`)
                } else {
                    $.log(`[${user.userName || user.index}][ERROR] 未获取福利空间签到数据，跳过任务\n`);
                    $.notifyMsg.push(`福利空间: 未获取签到数据,跳过任务`)
                }
                //----—低碳空间任务----—
                if (user.carbon) {
                    let signMsg = await user.carbonSignin();
                    //查询可收集能量列表
                    let receiveList = await user.getReceiveEngeryList() ?? [];
                    for (let receive of receiveList) {
                        await user.receiveEngery(receive.recordId);
                    }
                    let coin = await user.carbonCoin();
                    $.notifyMsg.push(`低碳空间: ${signMsg}｜${(coin - 0) / 100}g`);
                    //查询出行情况
                    await user.carbonTravelQuery();
                    //出行
                    await user.carbonTravel();
                } else {
                    $.log(`[${user.userName || user.index}][ERROR] 未获取低碳空间签到数据，跳过任务\n`);
                    $.notifyMsg.push(`低碳空间: 未获取签到数据,跳过任务`)
                }
            } else {
                DoubleLog(`⛔️ 「${user.userName ?? `账号${index}`}」check ck error!`)
            }
            $.name = `夸克网盘任务(${user.index}/${userCookie.length})`;
            //notify
            await sendMsg($.notifyMsg.join("\n"), { $media: user.avatar });
        }
        catch (e) {
            throw e
        }
    }
}
//用户
class UserInfo {
    constructor(user) {
        //默认属性
        this.index = ++$.userIdx;
        this.kps = user.kps;
        this.welfare = user.welfare;
        this.carbon = "" || user.carbon;
        this.token = "" || user.token || user;
        this.userId = "" || user.userId;
        this.userName = user.userName;
        this.avatar = user.avatar;
        this.ckStatus = true;
        //请求封装
        this.baseUrl = `https://drive-m.quark.cn`;
        this.headers = {
            "Cookie": this.token,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
        };
        this.fetch = async (o) => {
            try {
                if (typeof o === 'string') o = { url: o };
                if (o?.url?.startsWith("/") || o?.url?.startsWith(":")) o.url = this.baseUrl + o.url
                const res = await Request({ ...o, headers: o.headers || this.headers, url: o.url })
                debug(res, o?.url?.replace(/\/+$/, '').substring(o?.url?.lastIndexOf('/') + 1));
                if (res?.code == 401) throw new Error(res?.message || `用户需要去登录`);
                return res;
            } catch (e) {
                this.ckStatus = false;
                $.log(`[${this.userName || this.index}][ERROR] 请求发起失败!${e}\n`);
            }
        }
    }
    //查询当前用户
    async getUserInfo() {
        try {
            let res = await this.fetch("https://pan.quark.cn/account/info?fr=h5&platform=others");
            //this.avatar = res?.data?.avatarUri;
            this.userName = res?.data?.nickname;
            $.notifyMsg.push(`当前用户: ${this.userName ?? `账号${this.index}`}`)
        } catch (e) {
            this.ckStatus = false;
            $.log(`[${this.userName || this.index}][ERROR] 查询用户信息失败: ${e}\n`);
        }
    }
    //查询空间签到信息
    async getSignInfo() {
        try {
            let opts = {
                url: "https://drive-m.quark.cn/1/clouddrive/capacity/growth/info",
                params: { "pr": "ucpro", "fr": "pc", "uc_param_str": "" }
            }
            let res = await this.fetch(opts);
            let { sign_daily, sign_daily_reward } = res?.data?.cap_sign ?? {}
            let signMsg = sign_daily
                ? `今日获得${sign_daily_reward / (1024 * 1024)}MB`
                : res?.message || `今日未签到`
            $.log(`[${this.userName || this.index}][INFO] ${signMsg}\n`)
            $.notifyMsg.push(`签到任务: ${signMsg}`);

        } catch (e) {
            this.ckStatus = false;
            $.log(`[${this.userName || this.index}][ERROR] 查询积分余额: ${e}\n`);
        }
    }
    //每日签到
    async signin() {
        try {
            let opts = {
                url: "https://drive-m.quark.cn/1/clouddrive/capacity/growth/sign",
                params: { "pr": "ucpro", "fr": "pc", "uc_param_str": "" },
                type: "post",
                dataType: "json",
                body: { "sign_cyclic": true }
            }
            let res = await this.fetch(opts);
            let signMsg = res?.data?.sign_daily_reward
                ? `签到成功!`
                : "" + res?.message;
            $.log(`[${this.userName || this.index}][INFO] 空间签到: ${signMsg}\n`)
        } catch (e) {
            this.ckStatus = false;
            $.log(`[${this.userName || this.index}][ERROR] 空间签到: ${e}\n`);
        }
    }
    //福利空间签到
    async welfareSignin() {
        try {
            let opts = {
                url: `https://coral2.quark.cn/quark/welfare/v2/signIn?${this.welfare.params}`,
            }
            let res = await this.fetch(opts);
            let signMsg = res?.msg || `获得${res?.data?.prizes?.[0]?.rewardItem?.name}`;
            $.log(`[${this.userName || this.index}][INFO] 福利空间: ${signMsg}\n`);
            return signMsg;
        } catch (e) {
            this.ckStatus = false;
            $.log(`[${this.userName || this.index}][ERROR] 福利空间签到: ${e}\n`);
        }
    }
    //福利空间查询金币
    async getCoin() {
        try {
            let opts = {
                url: "https://coral2.quark.cn/quark/welfare/v2/queryCoinRecordList",
                params: {
                    "pr": "ucpro", "fr": "pc", "uc_param_str": "",
                    "appId": "quark_welfare_center_task",
                    "actId": "quark_welfare_center",
                    "page": 1,
                    "size": 10,
                    "kps": this.kps,
                },
            }
            let res = await this.fetch(opts);
            $.log(`[${this.userName || this.index}][INFO] 福利空间金币信息查询成功！\n`);
            $.log(`[${this.userName || this.index}][INFO] 当前余额: ${res?.data?.extra?.incomeAmount}金币\n`);
            return res?.data?.extra?.incomeAmount;
        } catch (e) {
            this.ckStatus = false;
            $.log(`[${this.userName || this.index}][ERROR] 福利空间查询金币信息: ${e}\n`);
        }
    }
    //低碳空间签到
    async carbonSignin() {
        try {
            let opts = {
                url: `https://coral2.quark.cn/quark/carbon/v1/signIn?${this.carbon.params}`,
                type: "post",
                body: this.carbon.body
            }
            let res = await this.fetch(opts);
            let signMsg = res?.msg || res?.data?.prizes?.[0]?.rewardItem?.name;
            $.log(`[${this.userName || this.index}][INFO] 低碳签到: ${signMsg}\n`);
            return signMsg;
        } catch (e) {
            this.ckStatus = false;
            $.log(`[${this.userName || this.index}][ERROR] 低碳签到: ${e}\n`);
        }
    }
    //低碳空间查询排放能量
    async carbonCoin() {
        try {
            let opts = {
                url: "https://coral2.quark.cn/quark/carbon/v1/home",
                params: {
                    "appId": "quark_carbon_account_task",
                    "kps": this.kps,
                },
            }
            let res = await this.fetch(opts);
            return res?.data?.userEnergyData.amount;
        } catch (e) {
            this.ckStatus = false;
            $.log(`[${this.userName || this.index}][ERROR] 低碳签到: ${e}\n`);
        }
    }
    //低碳空间查询当前旅行情况

    //低碳空间查询旅行地点
    async carbonTravelQuery() {
        try {
            let opts = {
                url: "https://coral2.quark.cn/quark/carbon/v1/travel/query",
                params: {
                    "pr": "ucpro", "fr": "pc", "uc_param_str": "",
                    "appId": "quark_carbon_account_travel",
                    "kps": this.kps
                },
            }
            let res = await this.fetch(opts);
            let categoryList = res?.data?.categoryList;
            let ArrayList = []
            if (categoryList?.length) {
                //数据脱敏
                ArrayList = categoryList.map(e => {
                    return { name: e.name, category: e.category, value: e.vitality };
                }).sort((a, b) => b.value - a.value);
                $.log(`[${this.userName || this.index}][INFO] 查询出行地点成功!\n`);
            }
            return ArrayList;
        } catch (e) {
            this.ckStatus = false;
            $.log(`[${this.userName || this.index}][ERROR] 低碳出行: ${e}\n`);
        }
    }
    //低碳空间出行
    async carbonTravel(category = "") {
        try {
            let opts = {
                url: "https://coral2.quark.cn/quark/carbon/v1/travel/travel",
                params: { "pr": "ucpro", "fr": "pc", "uc_param_str": "" },
                type: "post",
                body: {
                    "appId": "quark_carbon_account_travel",
                    "kps": this.kps,
                    "category": category || "wetlandprotection"
                }
            }
            let res = await this.fetch(opts);
            let travelMsg = `低碳出行: ${res?.msg || res?.data?.destination?.destinationShowName || "出行成功"}`
            $.log(`[${this.userName || this.index}][INFO] ${travelMsg}\n`);
            $.notifyMsg.push(travelMsg);
        } catch (e) {
            this.ckStatus = false;
            $.log(`[${this.userName || this.index}][ERROR] 低碳出行: ${e}\n`);
        }
    }
    //低碳空间查询可收集能量列表
    async getReceiveEngeryList() {
        try {
            let opts = {
                url: "https://coral2.quark.cn/quark/carbon/v1/home",
                params: {
                    "pr": "ucpro", "fr": "pc", "uc_param_str": "",
                    "appId": "quark_carbon_account_task",
                    "kps": this.kps
                },
            }
            let res = await this.fetch(opts);
            return res?.data?.receiveEnergyList;
        } catch (e) {
            this.ckStatus = false;
            $.log(`[${this.userName || this.index}][ERROR] 低碳出行查询能量列表: ${e}\n`);
        }
    }
    //低碳空间收集能量
    async receiveEngery(recordId) {
        try {
            let opts = {
                url: "https://coral2.quark.cn/quark/carbon/v1/receiveEnergy",
                params: { "pr": "ucpro", "fr": "pc", "uc_param_str": "" },
                type: "post",
                body: {
                    "appId": "quark_carbon_account_task",
                    "kps": this.kps,
                    "recordIds": recordId
                }
            }
            let res = await this.fetch(opts);
            $.log(`[${this.userName || this.index}][INFO] 收集能量成功!获得${res?.data[0]?.amount / 100}g\n`);
        } catch (e) {
            this.ckStatus = false;
            $.log(`[${this.userName || this.index}][ERROR] 低碳空间收集能量: ${e}\n`);
        }
    }
}

// 获取Cookie
async function getCookie() {
    try {
        if ($request && $request.method === 'OPTIONS') return;
        //surge用户防智障措施
        const _header = ObjectKeys2LowerCase($request.headers) ?? "";
        if (!$request.headers) throw new Error(`错误的运行方式，请切换到cron环境`);
        // 获取扫码ck信息
        if ($request.url.match(/clouddrive\/file\/sort/)) {
            let token = _header.cookie;
            let userName = await getUserInfo(token);
            if (!userName || !token) throw new Error("获取用户信息失败,数据缺失");
            const index = userCookie.findIndex(e => e.userName == userName);
            let newData = {
                "userId": userName,
                "userName": userName,
                "token": token
            }
            if (userCookie[index]) {
                userCookie[index] = {
                    ...userCookie[index],
                    userId: newData.userId,
                    userName: newData.userName,
                    token: newData.token
                }
            } else {
                userCookie.push(newData);
            }
            $.setdata(userName, "quark_user");
            $.msg($.name, `🎉${newData.userName}更新token成功!`, `当前获取ck信息对象:${$.quark_user || "未选择"} => ${newData.userName}`);
        } else {
            $.quark_user = $.getdata('quark_user') || '';
            // 查询当前获取ck对象
            const index = userCookie.findIndex(e => e.userName == $.quark_user);
            // 检查用户是否存在
            if (!$.quark_user || index == -1) throw new Error("未查询到当前用户，请先扫码登录获取token");;
            const isWelfare = $request.url.match(/welfare/);
            // 获取 URL 查询参数或请求体信息
            const { kps } = isWelfare ? getQueries($request.url) : UrlToJson($request.body);
            // 检查 kps 是否存在
            if (!kps) throw new Error("获取用户信息失败,kps不存在");
            // 确定任务类型并将数据添加到 userCookie 数组
            const spaceKey = isWelfare ? 'welfare' : 'carbon';

            userCookie[index].kps = kps;
            userCookie[index][spaceKey] = { params: $request.url.split("?")[1], body: $request.body };
            $.msg($.name, `🎉${$.quark_user}收录${spaceKey}任务成功!`, ``);
        }
        //数据持久化 
        $.setjson(userCookie, ckName);
    } catch (e) {
        throw e;
    }
}

//查询当前用户
async function getUserInfo(token) {
    try {
        let opts = {
            url: "https://pan.quark.cn/account/info?fr=h5&platform=others",
            headers: {
                "Cookie": token,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
            }
        };
        let res = await Request(opts);
        return res?.data?.nickname;
    } catch (e) {
        this.ckStatus = false;
        $.log(`[${this.userName || this.index}][ERROR] 查询用户信息失败:${e}\n`);
    }
}

//分割参数
function getQueries(t) {
    const [, e] = t.split("?");
    return e ? e.split("&").reduce((t, e) => {
        var [r, e] = e.split("=");
        return t[r] = e, t
    }, {}) : {}
};
//body转化成json
function UrlToJson(data) { let tempArr = data.split(`&`); let obj = {}; for (let item of tempArr) { let itemInfo = item.split(`=`); let _key = itemInfo[0]; let _value = decodeURIComponent(itemInfo[1]); obj[`${_key}`] = _value }; return obj };

//主程序执行入口
!(async () => {
    try {
        if (typeof $request != "undefined") {
            await getCookie();
        } else {
            await checkEnv();
            await main();
        }
    } catch (e) {
        throw e;
    }
})()
    .catch((e) => { $.logErr(e), $.msg($.name, `⛔️ script run error!`, e.message || e) })
    .finally(async () => {
        $.done({ ok: 1 });
    });

/** ---------------------------------固定不动区域----------------------------------------- */
//prettier-ignore
async function sendMsg(a, e) { a && ($.isNode() ? await notify.sendNotify($.name, a) : $.msg($.name, $.title || "", a, e)) }
function DoubleLog(o) { o && ($.log(`${o}`), $.notifyMsg.push(`${o}`)) };
async function checkEnv() { try { if (!userCookie?.length) throw new Error("no available accounts found"); $.log(`\n[INFO]检测到 ${userCookie?.length ?? 0} 个账号\n`), $.userList.push(...userCookie.map((o => new UserInfo(o))).filter(Boolean)) } catch (o) { throw o } }
function debug(g, e = "debug") { "true" === $.is_debug && ($.log(`\n-----------${e}------------\n`), $.log("string" == typeof g ? g : $.toStr(g) || `debug error => t=${g}`), $.log(`\n-----------${e}------------\n`)) }
//From xream's ObjectKeys2LowerCase
function ObjectKeys2LowerCase(obj) { return !obj ? {} : Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])) };
//From sliverkiss's Request
async function Request(t) { "string" == typeof t && (t = { url: t }); try { if (!t?.url) throw new Error("[URL][ERROR]缺少 url 参数"); let { url: o, type: e, headers: r = {}, body: s, params: a, dataType: n = "form", resultType: u = "data" } = t; const p = e ? e?.toLowerCase() : "body" in t ? "post" : "get", c = o.concat("post" === p ? "?" + $.queryStr(a) : ""), i = t.timeout ? $.isSurge() ? t.timeout / 1e3 : t.timeout : 1e4; "json" === n && (r["Content-Type"] = "application/json;charset=UTF-8"); const y = "string" == typeof s ? s : (s && "form" == n ? $.queryStr(s) : $.toStr(s)), l = { ...t, ...t?.opts ? t.opts : {}, url: c, headers: r, ..."post" === p && { body: y }, ..."get" === p && a && { params: a }, timeout: i }, m = $.http[p.toLowerCase()](l).then((t => "data" == u ? $.toObj(t.body) || t.body : $.toObj(t) || t)).catch((t => $.log(`[${p.toUpperCase()}][ERROR]${t}\n`))); return Promise.race([new Promise(((t, o) => setTimeout((() => o("当前请求已超时")), i))), m]) } catch (t) { console.log(`[${p.toUpperCase()}][ERROR]${t}\n`) } }
//From chavyleung's Env.js
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise(((e, i) => { s.call(this, t, ((t, s, o) => { t ? i(t) : e(s) })) })) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.logLevels = { debug: 0, info: 1, warn: 2, error: 3 }, this.logLevelPrefixs = { debug: "[DEBUG] ", info: "[INFO] ", warn: "[WARN] ", error: "[ERROR] " }, this.logLevel = "info", this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null, ...s) { try { return JSON.stringify(t, ...s) } catch { return e } } getjson(t, e) { let s = e; if (this.getdata(t)) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise((e => { this.get({ url: t }, ((t, s, i) => e(i))) })) } runScript(t, e) { return new Promise((s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let o = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); o = o ? 1 * o : 20, o = e && e.timeout ? e.timeout : o; const [r, a] = i.split("@"), n = { url: `http://${a}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: o }, headers: { "X-Key": r, Accept: "*/*" }, timeout: o }; this.post(n, ((t, e, i) => s(i))) })).catch((t => this.logErr(t))) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), o = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, o) : i ? this.fs.writeFileSync(e, o) : this.fs.writeFileSync(t, o) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let o = t; for (const t of i) if (o = Object(o)[t], void 0 === o) return s; return o } lodash_set(t, e, s) { return Object(t) !== t || (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce(((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}), t)[e[e.length - 1]] = s), t } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), o = s ? this.getval(s) : ""; if (o) try { const t = JSON.parse(o); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, o] = /^@(.*?)\.(.*?)$/.exec(e), r = this.getval(i), a = i ? "null" === r ? null : r || "{}" : "{}"; try { const e = JSON.parse(a); this.lodash_set(e, o, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const r = {}; this.lodash_set(r, o, t), s = this.setval(JSON.stringify(r), i) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.cookie && void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, ((t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) })); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: i, headers: o, body: r, bodyBytes: a } = t; e(null, { status: s, statusCode: i, headers: o, body: r, bodyBytes: a }, r, a) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", ((t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } })).then((t => { const { statusCode: i, statusCode: o, headers: r, rawBody: a } = t, n = s.decode(a, this.encoding); e(null, { status: i, statusCode: o, headers: r, rawBody: a, body: n }, n) }), (t => { const { message: i, response: o } = t; e(i, o, o && s.decode(o.rawBody, this.encoding)) })); break } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, ((t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) })); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: i, headers: o, body: r, bodyBytes: a } = t; e(null, { status: s, statusCode: i, headers: o, body: r, bodyBytes: a }, r, a) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let i = require("iconv-lite"); this.initGotEnv(t); const { url: o, ...r } = t; this.got[s](o, r).then((t => { const { statusCode: s, statusCode: o, headers: r, rawBody: a } = t, n = i.decode(a, this.encoding); e(null, { status: s, statusCode: o, headers: r, rawBody: a, body: n }, n) }), (t => { const { message: s, response: o } = t; e(s, o, o && i.decode(o.rawBody, this.encoding)) })); break } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let i = t[s]; null != i && "" !== i && ("object" == typeof i && (i = JSON.stringify(i)), e += `${s}=${i}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", i = "", o = {}) { const r = t => { const { $open: e, $copy: s, $media: i, $mediaMime: o } = t; switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { const r = {}; let a = t.openUrl || t.url || t["open-url"] || e; a && Object.assign(r, { action: "open-url", url: a }); let n = t["update-pasteboard"] || t.updatePasteboard || s; if (n && Object.assign(r, { action: "clipboard", text: n }), i) { let t, e, s; if (i.startsWith("http")) t = i; else if (i.startsWith("data:")) { const [t] = i.split(";"), [, o] = i.split(","); e = o, s = t.replace("data:", "") } else { e = i, s = (t => { const e = { JVBERi0: "application/pdf", R0lGODdh: "image/gif", R0lGODlh: "image/gif", iVBORw0KGgo: "image/png", "/9j/": "image/jpg" }; for (var s in e) if (0 === t.indexOf(s)) return e[s]; return null })(i) } Object.assign(r, { "media-url": t, "media-base64": e, "media-base64-mime": o ?? s }) } return Object.assign(r, { "auto-dismiss": t["auto-dismiss"], sound: t.sound }), r } case "Loon": { const s = {}; let o = t.openUrl || t.url || t["open-url"] || e; o && Object.assign(s, { openUrl: o }); let r = t.mediaUrl || t["media-url"]; return i?.startsWith("http") && (r = i), r && Object.assign(s, { mediaUrl: r }), console.log(JSON.stringify(s)), s } case "Quantumult X": { const o = {}; let r = t["open-url"] || t.url || t.openUrl || e; r && Object.assign(o, { "open-url": r }); let a = t["media-url"] || t.mediaUrl; i?.startsWith("http") && (a = i), a && Object.assign(o, { "media-url": a }); let n = t["update-pasteboard"] || t.updatePasteboard || s; return n && Object.assign(o, { "update-pasteboard": n }), console.log(JSON.stringify(o)), o } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, i, r(o)); break; case "Quantumult X": $notify(e, s, i, r(o)); break; case "Node.js": break }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } debug(...t) { this.logLevels[this.logLevel] <= this.logLevels.debug && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.debug}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } info(...t) { this.logLevels[this.logLevel] <= this.logLevels.info && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.info}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } warn(...t) { this.logLevels[this.logLevel] <= this.logLevels.warn && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.warn}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } error(...t) { this.logLevels[this.logLevel] <= this.logLevels.error && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.error}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.map((t => t ?? String(t))).join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, e, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, e, void 0 !== t.message ? t.message : t, t.stack); break } } wait(t) { return new Promise((e => setTimeout(e, t))) } done(t = {}) { const e = ((new Date).getTime() - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }

/**
 * 脚本名称：柠季
 * 活动规则：每日签到
 * 脚本说明：添加重写进入"柠季"小程序-顶部轮播图-4月签到界面，即可获取 Token，支持多账号，兼容🐉青龙。
 * 环境变量：ningji_data=[{"cardId": "抓包响应体cardId","campaignId":"抓包请求头campaignId","token": "抓包* 抓包请求头x-token"}]
 * 更新时间：2024-04-09 10:30
 * 图标地址：https://raw.githubusercontent.com/leiyiyan/resource/main/icons/ningji.png

------------------ Surge 配置 ------------------

[MITM]
hostname = %APPEND% pos.meituan.com

[Script]
柠季Token = type=http-response,pattern=^https?:\/\/pos\.meituan\.com\/api\/v1\/crm\/frontend\/campaign\/display,requires-body=1,max-size=0,binary-body-mode=0,timeout=30,script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js,script-update-interval=0

柠季 = type=cron,cronexp=30 9 * * *,timeout=60,script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js,script-update-interval=0

------------------- Loon 配置 -------------------

[MITM]
hostname = pos.meituan.com

[Script]
http-response ^https?:\/\/pos\.meituan\.com\/api\/v1\/crm\/frontend\/campaign\/display tag=柠季²,script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js,requires-body=1

cron "30 9 * * *" script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js,tag=柠季,enable=true

--------------- Quantumult X 配置 ---------------

[MITM]
hostname = pos.meituan.com

[rewrite_local]
^https?:\/\/pos\.meituan\.com\/api\/v1\/crm\/frontend\/campaign\/display url script-response-body https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js

[task_local]
30 9 * * * https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js, tag=柠季, img-url=https://raw.githubusercontent.com/leiyiyan/resource/main/icons/ningji.png, enabled=true

 */

const $ = new Env('柠季');
$.is_debug = getEnv('is_debug') || 'false';  // 调试模式
$.userInfo = getEnv('ningji_data') || '';  // Token
$.userArr = $.toObj($.userInfo) || [];  // 用户数组
$.appid = 'wx177c513cc05c325d';  // 小程序 appId
$.tenantid = '10159618'
$.orgid = '429605'
$.csecversionname = '5.60.58'
$.csecversion = '1.4.0'
$.messages = [];


// 主函数
async function main() {
  if ($.userArr.length) {
    $.log(`✅ 找到: ${$.userArr.length} 个账号`);
    for (let i = 0; i < $.userArr.length; i++) {
      $.log(`----- 账号 [${i + 1}] 开始执行 -----`);
      // 初始化
      $.is_login = true;
      $.token = $.userArr[i]['token'];
      $.cardId = $.userArr[i]['cardId'];
      $.campaignId = $.userArr[i]['campaignId'];
      $.headers = {
        'referer': `https://servicewechat.com/${$.appid}/169/page-frame.html`,
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.46(0x18002e2c) NetType/WIFI Language/zh_CN',
        'content-type': 'application/json',
        'x-token': $.token,
        'orgid': $.orgid,
        'poitype': '1',
        'tenantid': $.tenantid,
        'poiid': '0'
      }

      // 获取用户信息, 不打印日志
      await getUserInfo();
      await $.wait(1000);
      // 无效 token 跳出
      if (!$.is_login) continue;  
      
      // 签到
      await signin();
      await $.wait(1000);
      // 获取用户信息, 打印日志
      await getUserInfo(true);
    }
    $.log(`----- 所有账号执行完成 -----`);
  } else {
    throw new Error('⛔️ 未找到账号');
  }
}

// 签到
async function signin() {
  let msg = '';
  // 构造请求
  let opt = {
    url: `https://pos.meituan.com/api/v1/crm/frontend/campaign/sign-in/participate`,
    headers: $.headers,
    params: {
      yodaReady: 'wx',
      csecappid: $.appid,
      csecplatform: '3',
      csecversionname: $.csecversionname,
      csecversion: $.csecversion
    },
    body: $.toStr({
      campaignId: $.campaignId,
      cardId: $.cardId,
      couponDisplayScene: 44,
      styleVersion: 2
    })
  };

  // 发起请求
  var result = await Request(opt);
  if (result?.code == 0 && result?.issuedCouponDisplayInfos && result?.issuedPointAmount) {
    const { issuedPointAmount, issuedCouponDisplayInfos } = result;
    
    msg += `✅ 签到:获得${issuedPointAmount}积分 ${issuedCouponDisplayInfos[0]?.displayData?.name?.value || ''}\n`;
  } else if (result?.code == 90600 || result?.code == 500) {
    msg += `⛔️ 签到:${result?.msg}\n`;
  } else {
    msg += `⛔️ 签到信息失败\n`;
    $.log($.toStr(result));
  }
  $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
}


// 获取用户信息
async function getUserInfo(isShowMsg = false) {
  let msg = '';
  // 构造请求
  let opt = {
    url: `https://rms.meituan.com/api/v1/rmsmina/c/comp/member/memberinfo`,
    headers: $.headers,
    params: {
      mtShopId: '',
      yodaReady: 'wx',
      csecappid: $.appid,
      csecplatform: '3',
      csecversionname: $.csecversionname,
      csecversion: $.csecversion
    },
    body: $.toStr({
      cardId: $.cardId,
      showNickName: "true",
      showAvatarUrl: "true",
      showMemberGrade: "true",
      showAssertList: "[1,2,3]",
      showCardTitle: "true",
      showProgressBar: "true",
      showMemberCodeUrl: "true"
    })
  };

  // 发起请求
  var result = await Request(opt);
  if (result?.code == 200 && result?.data) {
    const { nickName, assets } = result?.data;
    if(isShowMsg) {
      msg += `✅ 账号: ${nickName}`;
      for(let item of assets) {
        msg += `,${item.name}:${item.value}`;
      }
    }
  } else if (result?.code == 400) {
    $.is_login = false;  // Token 失效
    msg += `⛔️ ${result?.message} \n`;
  } else {
    msg += `⛔️ 获取用户信息失败\n`;
    $.log($.toStr(result));
  }
  if(isShowMsg) {
    $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
  }
}


// 脚本执行入口
!(async () => {
  if (typeof $request !== `undefined`) {
    GetCookie();
  } else {
    await main();  // 主函数
  }
})()
  .catch((e) => $.messages.push(e.message || e) && $.logErr(e))
  .finally(async () => {
    await sendMsg($.messages.join('\n').trimStart().trimEnd());  // 推送通知
    $.done();
  })



// 获取用户数据
function GetCookie() {
  try {
    let msg = '';
    debug($response.body);
    const header = ObjectKeys2LowerCase($request.headers);
    const token = header['x-token'];
    const campaignId = header['campaignid'];
    const body = $.toObj($response.body);
    const { cardId } = body?.data?.userInfo?.cardInfo;
    if (token && cardId) {
      const user = $.userArr.find(user => user.cardId === cardId);
      if (user) {
        msg += `更新用户 [${cardId}] Token: ${token}\n`;
        user.token = token;
        user.campaignId = campaignId;
      } else {
        msg += `新增用户 [${cardId}] Token: ${token}\n`;
        $.userArr.push({ "cardId": cardId, "campaignId": campaignId, "token": token });
      }
      // 写入数据持久化
      $.setdata($.toStr($.userArr), 'ningji_data');
      $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
    }
  } catch (e) {
    $.log("⛔️ 获取Cookie失败"), $.log(e);
  }
}


// 获取环境变量
function getEnv(...keys) {
  for (let key of keys) {
    var value = $.isNode() ? process.env[key] || process.env[key.toUpperCase()] || process.env[key.toLowerCase()] || $.getdata(key) : $.getdata(key);
    if (value) return value;
  }
}



/**
 * 请求函数二次封装
 * @param {(object|string)} options - 构造请求内容，可传入对象或 Url
 * @returns {(object|string)} - 根据 options['respType'] 传入的 {status|headers|rawBody} 返回对象或字符串，默认为 body
 */
async function Request(options) {
  try {
    options = options.url ? options : { url: options };
    const _method = options?._method || ('body' in options ? 'post' : 'get');
    const _respType = options?._respType || 'body';
    const _timeout = options?._timeout || 15e3;
    const _http = [
      new Promise((_, reject) => setTimeout(() => reject(`⛔️ 请求超时: ${options['url']}`), _timeout)),
      new Promise((resolve, reject) => {
        debug(options, '[Request]');
        $[_method.toLowerCase()](options, (error, response, data) => {
          debug(response, '[response]');
          error && $.log($.toStr(error));
          if (_respType !== 'all') {
            resolve($.toObj(response?.[_respType], response?.[_respType]));
          } else {
            resolve(response);
          }
        })
      })
    ];
    return await Promise.race(_http);
  } catch (err) {
    $.logErr(err);
  }
}


// 发送消息
async function sendMsg(message) {
  if (!message) return;
  try {
    if ($.isNode()) {
      try {
        var notify = require('./sendNotify');
      } catch (e) {
        var notify = require('./utils/sendNotify');
      }
      await notify.sendNotify($.name, message);
    } else {
      $.msg($.name, '', message);
    }
  } catch (e) {
    $.log(`\n\n----- ${$.name} -----\n${message}`);
  }
}


/**
 * DEBUG
 * @param {*} content - 传入内容
 * @param {*} title - 标题
 */
function debug(content, title = "debug") {
  let start = `\n----- ${title} -----\n`;
  let end = `\n----- ${$.time('HH:mm:ss')} -----\n`;
  if ($.is_debug === 'true') {
    if (typeof content == "string") {
      $.log(start + content + end);
    } else if (typeof content == "object") {
      $.log(start + $.toStr(content) + end);
    }
  }
}

//转换为小写
function ObjectKeys2LowerCase(obj) { return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])) };

// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, r) => { s.call(this, t, (t, s, a) => { t ? r(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null, ...s) { try { return JSON.stringify(t, ...s) } catch { return e } } getjson(t, e) { let s = e; const r = this.getdata(t); if (r) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, r) => e(r)) }) } runScript(t, e) { return new Promise(s => { let r = this.getdata("@chavy_boxjs_userCfgs.httpapi"); r = r ? r.replace(/\n/g, "").trim() : r; let a = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); a = a ? 1 * a : 20, a = e && e.timeout ? e.timeout : a; const [i, o] = r.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: a }, headers: { "X-Key": i, Accept: "*/*" }, timeout: a }; this.post(n, (t, e, r) => s(r)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e); if (!s && !r) return {}; { const r = s ? t : e; try { return JSON.parse(this.fs.readFileSync(r)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e), a = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, a) : r ? this.fs.writeFileSync(e, a) : this.fs.writeFileSync(t, a) } } lodash_get(t, e, s) { const r = e.replace(/\[(\d+)\]/g, ".$1").split("."); let a = t; for (const t of r) if (a = Object(a)[t], void 0 === a) return s; return a } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, r) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[r + 1]) >> 0 == +e[r + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, r] = /^@(.*?)\.(.*?)$/.exec(t), a = s ? this.getval(s) : ""; if (a) try { const t = JSON.parse(a); e = t ? this.lodash_get(t, r, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, r, a] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(r), o = r ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, a, t), s = this.setval(JSON.stringify(e), r) } catch (e) { const i = {}; this.lodash_set(i, a, t), s = this.setval(JSON.stringify(i), r) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) }); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: r, statusCode: a, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: r, statusCode: a, headers: i, rawBody: o, body: n }, n) }, t => { const { message: r, response: a } = t; e(r, a, a && s.decode(a.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) }); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let r = require("iconv-lite"); this.initGotEnv(t); const { url: a, ...i } = t; this.got[s](a, i).then(t => { const { statusCode: s, statusCode: a, headers: i, rawBody: o } = t, n = r.decode(o, this.encoding); e(null, { status: s, statusCode: a, headers: i, rawBody: o, body: n }, n) }, t => { const { message: s, response: a } = t; e(s, a, a && r.decode(a.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let r = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in r) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? r[e] : ("00" + r[e]).substr(("" + r[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let r = t[s]; null != r && "" !== r && ("object" == typeof r && (r = JSON.stringify(r)), e += `${s}=${r}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", r = "", a) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } case "Loon": { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } case "Quantumult X": { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, r = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": r } } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, r, i(a)); break; case "Quantumult X": $notify(e, s, r, i(a)); break; case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), r && t.push(r), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, e, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, e, void 0 !== t.message ? t.message : t, t.stack) } } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }
