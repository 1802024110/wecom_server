// @ts-ignore
import {RequestInit} from "node/globals";
import {env} from "hono/adapter";

const baseUrl = "https://qyapi.weixin.qq.com"

export function my_fetch(input: string | URL | globalThis.Request,
                         init?: RequestInit,){
    return fetch(baseUrl+input,init)
}