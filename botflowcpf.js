const makeWaSocket = require('@adiwajshing/baileys').default
const { delay, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const P = require('pino')
const { unlink, existsSync, mkdirSync } = require('fs')
const ZDGPath = './ZDGSessions/'
const ZDGAuth = 'ZDG_auth_info.json'

const Btn1 = {
   id: 'btn1',
   displayText: 'SÃO PAULO',
}

const Btn2 = {
   id: 'btn2',
   displayText: 'PALMEIRAS',
}

const Confirm1 = {
    id: 'confirm1',
   displayText: 'PROSSEGUIR',
}

const Confirm2 = {
    id: 'confirm2',
   displayText: 'CANCELAR',
}

const ConfirmCPF = {
    id: 'confirmCPF',
    displayText: 'CONFIRMAR',
}

const CancelCPF = {
    id: 'cancelCPF',
    displayText: 'CANCELAR',
}

const btnConfirm = [
    { index: 1, quickReplyButton: Confirm1 },
    { index: 2, quickReplyButton: Confirm2 },
]

const btnConfirmCPF = [
    { index: 1, quickReplyButton: ConfirmCPF },
    { index: 2, quickReplyButton: CancelCPF },
]

const btnMD1 = [
   { index: 1, quickReplyButton: Btn1 },
   { index: 2, quickReplyButton: Btn2 },
]

const ZDGGroupCheck = (jid) => {
   const regexp = new RegExp(/^\d{18}@g.us$/)
   return regexp.test(jid)
}

const ZDGUpdate = (ZDGsock) => {
   ZDGsock.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr){
         console.log('© BOT-ZDG - Qrcode: ', qr);
      };
      if (connection === 'close') {
         const ZDGReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
         if (ZDGReconnect) ZDGConnection()
         console.log(`© BOT-ZDG - CONEXÃO FECHADA! RAZÃO: ` + DisconnectReason.loggedOut.toString());
         if (ZDGReconnect === false) {
            const removeAuth = ZDGPath + ZDGAuth
            unlink(removeAuth, err => {
               if (err) throw err
            })
         }
      }
      if (connection === 'open'){
         console.log('© BOT-ZDG - CONECTADO')
      }
   })
}

const ZDGConnection = async () => {
   const { version } = await fetchLatestBaileysVersion()
   if (!existsSync(ZDGPath)) {
      mkdirSync(ZDGPath, { recursive: true });
   }
   const { saveState, state } = useSingleFileAuthState(ZDGPath + ZDGAuth)
   const config = {
      auth: state,
      logger: P({ level: 'error' }),
      printQRInTerminal: true,
      version,
      connectTimeoutMs: 60_000,
      async getMessage(key) {
         return { conversation: 'botzg' };
      },
   }
   const ZDGsock = makeWaSocket(config);
   ZDGUpdate(ZDGsock.ev);
   ZDGsock.ev.on('creds.update', saveState);

   const ZDGSendMessage = async (jid, msg) => {
      await ZDGsock.presenceSubscribe(jid)
      await delay(1500)
      await ZDGsock.sendPresenceUpdate('composing', jid)
      await delay(1000)
      await ZDGsock.sendPresenceUpdate('paused', jid)
      return await ZDGsock.sendMessage(jid, msg)
   }

   function isBlank(str) {
      return (!str || /^\s*$/.test(str));
   }

   ZDGsock.ev.on('messages.upsert', async ({ messages, type }) => {
   const msg = messages[0]
   const jid = msg.key.remoteJid
   const user = msg.pushName;
   const conversation = msg.message.conversation;

      if (!ZDGGroupCheck(jid) && !msg.key.fromMe && jid !== 'status@broadcast') {
         console.log("© BOT-ZDG - MENSAGEM : ", msg)
         ZDGsock.sendReadReceipt(jid, msg.key.participant, [msg.key.id])
         
         if(isBlank(conversation)){ //se a propriedade conversation esta em branco:
            if (msg.message.templateButtonReplyMessage.selectedId === 'confirm1'){

                ZDGSendMessage(jid, { text: user + ', Informe seu CPF' })
                .then(result => {
                    console.log('RESULT: ', result)
                            
                })
                .catch(err => console.log('ERROR: ', err))
            }

            if (msg.message.templateButtonReplyMessage.selectedId === 'confirm2') {     
               ZDGSendMessage(jid, { text: user + ' muito obrigado pelo seu contato.\n Escolha uma opção!\n3- Não quero mais receber mensagens\n4- Estou ocupado, nos falamos depois.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }

            //botao sim do cpf
            if (msg.message.templateButtonReplyMessage.selectedId === "confirmCPF") {  
                ZDGSendMessage(jid, { text: 'Fazendo requisicao na api' })
                   .then(result => {
                      console.log('RESULT: ', result)
                      console.log('btn SIM cpf: ' +cpf)
                   })
                   .catch(err => console.log('ERROR: ', err))
            } 
             //botao nao do cpf
            if(msg.message.templateButtonReplyMessage.selectedId === "cancelCPF") {
                ZDGSendMessage(jid, { text: 'Por favor, digite seu cpf novamente' })
                   .then(result => {
                      console.log('RESULT: ', result)
                      console.log('btn NAO cpf: ' +cpf)
                   })
                   .catch(err => console.log('ERROR: ', err))
            }

         }

         else if(conversation){   
            if (msg.message.conversation.length === 11) { //validar cpf com REGEX
                const btnCPF = {
                   text: user+', por favor confime o CPF:\n'+msg.message.conversation,
                   //footer: '© Play Serviços',
                   templateButtons: btnConfirmCPF
                }
                ZDGSendMessage(jid, btnCPF)
                   .then(result => {
                      console.log('RESULT: ', result)
                      cpf = msg.message.conversation
                      console.log('cpf: ' +cpf)
                   })
                   .catch(err => console.log('ERROR: ', err))  
            } 

            /*if (msg.message.conversation.toLowerCase() === '1') {     
               ZDGSendMessage(jid, { text: user + ', obrigado pela sua resposta.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            if (msg.message.conversation.toLowerCase() === '2') {     
               ZDGSendMessage(jid, { text: user + ', você pode saber mais sobre a comunidade no link https://zapdasgalaxias.com.br' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            if (msg.message.conversation.toLowerCase() === '3') {     
               ZDGSendMessage(jid, { text: user + ', vou remover o seu contato da nossa lista de clientes.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            if (msg.message.conversation.toLowerCase() === '4') {     
               ZDGSendMessage(jid, { text: user + ', já já eu te chamo de novo.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }*/

            if (msg.message.conversation.length !== 11 && msg.message.conversation.toLowerCase() !== '1' && msg.message.conversation.toLowerCase() !== '2' && msg.message.conversation.toLowerCase() !== '3' && msg.message.conversation.toLowerCase() !== '4') {     
               const btnImage = {
                  caption: '\nOlá *'+  user +  '*, Bem-vindo ao Bot Play\nPara prosseguir, *aceite* os *Termos de Uso* e *Política de Privacidade* \n',
                  footer: '✅ Play Serviços',
                  image: {
                     url: './assets/icone.png',
                  },
                  templateButtons: btnConfirm
               }
               ZDGSendMessage(jid, btnImage)
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }  
         }

      }
   })
}

ZDGConnection()