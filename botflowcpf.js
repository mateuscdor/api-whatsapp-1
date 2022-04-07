const makeWaSocket = require('@adiwajshing/baileys').default
const { delay, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const P = require('pino')
const { unlink, existsSync, mkdirSync } = require('fs')
const ZDGPath = './ZDGSessions/'
const ZDGAuth = 'ZDG_auth_info.json'

//BOTÕES - Cancelou os termos
const op3 = {
   id: 'op3',
   displayText: 'Não quero mais receber mensagens.',
}
const op4 = {
   id: 'op4',
   displayText: 'Estou ocupado, nos falamos depois.',
}

//BOTÕES - Primeira mensagem
const btnProsseguir = {
    id: 'confirmTerms',
   displayText: 'PROSSEGUIR',
}
const btnCancelar = {
   id: 'cancelTerms',
   displayText: 'CANCELAR',
}

//DECLARAÇÃO DOS BOTÕES
//BOTÕES - Confirmação do CPF
const ConfirmCPF = {
    id: 'confirmCPF',
    displayText: 'CONFIRMAR',
}
const CancelCPF = {
    id: 'cancelCPF',
    displayText: 'CANCELAR',
}
const btnCancelTerms = [
   { index: 1, quickReplyButton: op3 },
   { index: 2, quickReplyButton: op4 },
]
const btnFirstMessage = [
   { index: 1, quickReplyButton: btnProsseguir },
   { index: 2, quickReplyButton: btnCancelar },
]
const btnConfirmCPF = [
   { index: 1, quickReplyButton: ConfirmCPF },
   { index: 2, quickReplyButton: CancelCPF },
]

//CHECA SE A MENSAGEM É DE ALGUM GRUPO
const ZDGGroupCheck = (jid) => {
   const regexp = new RegExp(/^\d{18}@g.us$/)
   return regexp.test(jid)
}

const ZDGUpdate = (ZDGsock) => {
   //ESTABELECE CONEXÃO COM O WHATSAPP
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
         console.log('© BOT-PLAY - CONECTADO')
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
         
         //REQUISIÇÕES SEM USO MANUAL
         if(isBlank(conversation)){
            //INFORME O CPF - CONCORDOU COM OS TERMOS
            if (msg.message.templateButtonReplyMessage.selectedId === 'confirmTerms'){

                ZDGSendMessage(jid, { text: user + ', Informe seu CPF' })
                .then(result => {
                    console.log('RESULT: ', result)
                            
                })
                .catch(err => console.log('ERROR: ', err))
            }
            //CANCELOU OS TERMOS
            if (msg.message.templateButtonReplyMessage.selectedId === 'cancelTerms') {
               const ZDGLayout = {
                  text: 'Muito obrigado pelo seu contato!\n\nEscolha uma opção:',
                  templateButtons: btnCancelTerms
               }
               ZDGSendMessage(jid, ZDGLayout)
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }

            //OPÇÕES AO CONFIRMAR TERMOS DE USO
            //confirmou o cpf
            if (msg.message.templateButtonReplyMessage.selectedId === 'confirmCPF') {  
                ZDGSendMessage(jid, { text: 'Fazendo requisicao na api' })
                   .then(result => {
                      console.log('RESULT: ', result)

                     //cpf == conversation;
                     console.log(result.key.remoteJid)

                   })
                   .catch(err => console.log('ERROR: ', err))
            } 
            //cpf não confirmado
            if(msg.message.templateButtonReplyMessage.selectedId === 'cancelCPF') {
                ZDGSendMessage(jid, { text: 'Por favor, digite seu cpf novamente' })
                   .then(result => {
                      console.log('RESULT: ', result)
                      console.log('btn NAO cpf: ' +cpf)
                   })
                   .catch(err => console.log('ERROR: ', err))
            }

            //OPÇÕES DE CANCELAMENTO DOS TERMOS
            //opção não enviar mais mensagens
            if(msg.message.templateButtonReplyMessage.selectedId === 'op3'){
               ZDGSendMessage(jid, { text: 'Implementado até aqui.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            //opção estou ocupado
            if(msg.message.templateButtonReplyMessage.selectedId === 'op4'){ 
               ZDGSendMessage(jid, { text: 'Implementado até aqui.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
         }

         //REQUISIÇÕES RECEBIDAS MANUALMENTE
         else if(conversation){   
            //MENSAGEM INICIAL
            if (msg.message.conversation.length !== 11 && msg.message.conversation.toLowerCase() !== '1' && msg.message.conversation.toLowerCase() !== '2' && msg.message.conversation.toLowerCase() !== '3' && msg.message.conversation.toLowerCase() !== '4') {     
               const btnImage = {
                  caption: '\nOlá *'+  user +  '*, Bem-vindo ao Bot Play\nPara prosseguir, *aceite* os *Termos de Uso* e *Política de Privacidade* \n',
                  footer: '✅ Play Serviços',
                  image: {
                     url: './assets/icone.png',
                  },
                  templateButtons: btnFirstMessage
               }
               ZDGSendMessage(jid, btnImage)
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            //usuario digita o CPF
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
            if (msg.message.conversation.toLowerCase() === '1') {     
               ZDGSendMessage(jid, { text: user + ', obrigado pela sua resposta.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            if (msg.message.conversation.toLowerCase() === '2') {     
               ZDGSendMessage(jid, { text: user + ', você pode saber mais sobre a comunidade no link https://zapdasgalaxias.com.br' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
         }
      }
   })
}

ZDGConnection()