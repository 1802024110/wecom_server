import { Body, Controller, Get, Header, Inject, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { decrypt, encrypt, getSignature } from '@wecom/crypto';
import * as crypto from 'crypto';
import { xml2js } from 'xml-js';
import { WecomService } from './wecom.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { create } from 'xmlbuilder2';
import { log } from 'console';
@ApiTags('企业微信-服务器回调校验')
@Controller('wecom')
export class WecomController {
    constructor(
        private readonly wecomService: WecomService,
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }
    @Get()
    @ApiOperation({ summary: '微信服务器验证接口' })
    callbackValidation(@Query() query: CallbackVerificationParams): string {
        const token = this.configService.get<string>("wecom.token")
        const encodingAESKey = this.configService.get<string>("wecom.encodingAESKey")
        return this.wecomService.validateUrl(query, token, encodingAESKey);
    }

    @Post()
    // @Header('Content-Type', 'application/xml')
    @ApiOperation({ summary: '接收消息' })
    async callbackMessage(@Body() body: ReceiveMessage, @Query() query: CallbackVerificationParams): Promise<string> {
        const encodingAESKey = this.configService.get<string>("wecom.encodingAESKey")
        const plainText = decrypt(encodingAESKey, body.xml.Encrypt).message
        const parsedMessage = xml2js(plainText, { compact: true }) as PlaintextMessage
        const nonce = query.nonce.toString()
        const timestamp = query.timestamp.toString()

        const messageType = parsedMessage.xml.MsgType._cdata
        let msg_encrypt: string
        switch (messageType) {
            case "text":
                const signStr = getSignature(this.configService.get<string>("wecom.token"), timestamp, nonce, body.xml.Encrypt);
                console.log(signStr);
                msg_encrypt = this.wecomService.handleTextMsg(parsedMessage as PlaintextTextMessage, parsedMessage.xml.FromUserName._cdata, parsedMessage.xml.ToUserName._cdata)
                break;
            case "image":
                msg_encrypt = this.wecomService.handleImageMsg(parsedMessage as PlaintextImageMessage)
                break;
            case "voice":
                msg_encrypt = this.wecomService.handleVoiceMsg(parsedMessage as PlaintextVoiceMessage)
                break;
            case "video":
                msg_encrypt = this.wecomService.handleVideoMsg(parsedMessage as PlaintextVideoMessage)
                break;
            case "location":
                msg_encrypt = this.wecomService.handleLocationMsg(parsedMessage as PlaintextLocationMessage)
                break;
            case "link":
                msg_encrypt = this.wecomService.handleLinkMsg(parsedMessage as PlaintextLinkMessage)
                break;
            default:
                msg_encrypt = "未知的消息类型"
                console.log("未知的消息类型:", messageType);
                break;
        }
        // return res
        const token = this.configService.get<string>("wecom.token")
        // const msgSignature = getSignature(token, timestamp, nonce, msg_encrypt)
        const msgSignature = query.msg_signature

        // console.log(query.msg_signature);
        // console.log(msgSignature);

        const res = create()
            .ele('xml')
            .ele('Encrypt').dat(msg_encrypt).up()
            .ele('MsgSignature').dat(msgSignature).up()
            .ele('TimeStamp').txt(timestamp).up()
            .ele('Nonce').dat(nonce).up()
            .end({ headless: true, prettyPrint: true });

        // const res = `<xml>
        // <Encrypt><![CDATA[${msg_encrypt}]]></Encrypt>
        // <MsgSignature><![CDATA[${msgSignature}]]></MsgSignature>
        // <TimeStamp>${timestamp}</TimeStamp>
        // <Nonce><![CDATA[${nonce}]]></Nonce>
        // </xml>`
        // console.log(res);
        // console.log(query);
        // console.log(res);



        return res
    }
}
