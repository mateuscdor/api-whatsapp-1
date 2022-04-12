const axios = require('axios')
const url = 'https://api.playservicos.com.br:3002/'
const username = 'claudioplayservicos@gmail.com'
const password = 'claudio123@'
const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64')

const makeWaSocket = require('@adiwajshing/baileys').default
const { delay, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const P = require('pino')
const { unlink, existsSync, mkdirSync } = require('fs')
const ZDGPath = './ZDGSessions/'
const ZDGAuth = 'ZDG_auth_info.json'

//BOTÕES - Cancelou os termos
const op3 = {
   id: 'op3',
   displayText: '❌ Não quero mais receber mensagens.',
}
const op4 = {
   id: 'op4',
   displayText: '🕖 Estou ocupado, nos falamos depois.',
}

//BOTÕES - Primeira mensagem
const btnProsseguir = {
   id: 'confirmTerms',
   displayText: '✅ ACEITAR TERMOS',
}
const btnCancelar = {
   id: 'cancelTerms',
   displayText: '❌ CANCELAR',
}

//DECLARAÇÃO DOS BOTÕES
//BOTÕES - Confirmação do CPF
const ConfirmCPF = {
   id: 'confirmCPF',
   displayText: '✅ ESTE É MEU CPF',
}
const CancelCPF = {
   id: 'cancelCPF',
   displayText: '↩️ DIGITAR NOVAMENTE',
}
const Buy = {
   id: 'buyTitle',
   displayText: '🤑 COMPRAR TÍTULO',
}
const Cancel = {
   id: 'cancelTitle',
   displayText: '❌ CANCELAR COMPRA',
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
const btnComprarTitulo = [
   { index: 1, quickReplyButton: Buy },
   { index: 2, quickReplyButton: Cancel },
]

//CHECA SE A MENSAGEM É DE ALGUM GRUPO
const ZDGGroupCheck = (jid) => {
   const regexp = new RegExp(/^\d{18}@g.us$/)
   return regexp.test(jid)
}

const ZDGUpdate = (ZDGsock) => {
   //ESTABELECE CONEXÃO COM O WHATSAPP
   ZDGsock.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) {
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
      if (connection === 'open') {
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


      async function getBuscarEtapas(){
         return axios
            .get(`${url}parceiros/etapas?praca_id=3`, { headers: { 'Authorization': `Basic ${token}` }, })
            .then(response => {
               console.log(response.data.etapas[0])

               return `\nDescrição: ${response.data.etapas[0].descricao}\nDia do sorteio: ${response.data.etapas[0].sorteio}\nDia do sorteio: ${response.data.etapas[0].sorteio}`
                  
            })
            .catch(error => console.log(error.request))
      }
      async function getBuscaTitulo(){
         return axios
            .get(`${url}parceiros/certificados?praca_id=3`, { headers: { 'Authorization': `Basic ${token}` }, })
            .then(response => {
               return response.data
            })
            .catch(error => console.log(error.request))
      }      

      async function postValidarCliente(cpf, numero) {
         const data = {
            "cpf": `${cpf}`,
            "telefone": `${numero}`,
            "email": "",
            "cep": "",
            "tipo": 2,
         }
         return axios
            .post(`${url}parceiros/validacoes?praca_id=3`, data, { headers: { 'Authorization': `Basic ${token}` }, })
            .then(response => {
               return response.data.existe;
            })
            .catch(error => console.log())
      }

      if (!ZDGGroupCheck(jid) && !msg.key.fromMe && jid !== 'status@broadcast') {
         console.log("© BOT-ZDG - MENSAGEM : ", msg)
         ZDGsock.sendReadReceipt(jid, msg.key.participant, [msg.key.id])

         //REQUISIÇÕES SEM USO MANUAL
         if (isBlank(conversation)) {
            //ONCORDOU COM OS TERMOS - informe o cpf
            if (msg.message.templateButtonReplyMessage.selectedId === 'confirmTerms') {

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

            //APÓS CONFIRMAR TERMOS DE USO
            //confirmou o cpf
            if (msg.message.templateButtonReplyMessage.selectedId === 'confirmCPF') {
               ZDGSendMessage(jid, { text: 'Fazendo requisicao na api' })
                  .then(async result => {
                     console.log('RESULT: ', result)
                  })
                  .catch(err => console.log('ERROR: ', err))
            }
            //cpf não confirmado
            if (msg.message.templateButtonReplyMessage.selectedId === 'cancelCPF') {
               ZDGSendMessage(jid, { text: 'Por favor, digite seu cpf novamente' })
                  .then(result => {
                     console.log('RESULT: ', result)
                     console.log('btn NAO cpf: ' + cpf)
                  })
                  .catch(err => console.log('ERROR: ', err))
            }

            //OPÇÕES DE CANCELAMENTO DOS TERMOS
            //opção não enviar mais mensagens
            if (msg.message.templateButtonReplyMessage.selectedId === 'op3') {
               ZDGSendMessage(jid, { text: 'Implementado até aqui.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            //opção estou ocupado
            if (msg.message.templateButtonReplyMessage.selectedId === 'op4') {
               ZDGSendMessage(jid, { text: 'Implementado até aqui.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
         }

         //REQUISIÇÕES RECEBIDAS MANUALMENTE
         else if (conversation) {
            //MENSAGEM INICIAL
            if (msg.message.conversation.length !== 11 && msg.message.conversation.toLowerCase() !== '1' && msg.message.conversation.toLowerCase() !== '2' && msg.message.conversation.toLowerCase() !== '3' && msg.message.conversation.toLowerCase() !== '4') {
               //if(conversation){
               const btnImage = {
                  caption: '\nOlá ' + user + ', Aqui é o Bot Play Servicos\n\nPara prosseguir, aceite os *Termos de Uso* e *Política de Privacidade* \n',
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
            //DIGITOU O CPF
            if (msg.message.conversation.length === 11) { //VALIDAR COM REGEX               
               const comprarTitulo = { 
                  text: `✅ UM CADASTRO COM SEU CPF FOI ENCONTRADO!
                  \n\nAqui estão alguns títulos disponíveis para você realizar uma compra!
                  \nImplementar Api da Play -------`,
                  templateButtons: btnComprarTitulo
               }               
               
               ZDGSendMessage(jid, { text: '🤖 _*BUSCANDO INFORMAÇÕES*_ 🤖' })
                  .then(async result => {
                     console.log('RESULT: ', result);
                     
                     //TRANSFORMAR O Jid em um número acessivel para a api              
                     let formatacaoJid = msg.key.remoteJid.replace(/[^0-9]/g, '')
                     formatacaoJid.substring
                     numero = formatacaoJid.substring(0,4)+9+ formatacaoJid.substring(4)
                     console.log(numero)
                     
                     let cpf = conversation;  
                     
                     //SE encontrar o usuário .... SENÃO encontrar.
                     if (await postValidarCliente(cpf, numero)) {
                        ZDGSendMessage(jid, {text: await getBuscarEtapas() })
                           .then(async result => {
                              console.log('RESULT: ', result)
                           }) 
                           .catch(err => console.log('ERROR: ', err))
                     } else {
                        ZDGSendMessage(jid, { text: '❌ Cadastro não encontrado.\n\nPor favor, digite o CPF novamente' }) //DIGITE NOVAMENTE
                           .then(result => {
                              console.log('RESULT: ', result)
                           }) .catch(err => console.log('ERROR: ', err))
                     }
                     //await getCPF(cpf, numero) //extraio o cpf
                  }) .catch(err => console.log('ERROR: ', err))
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

module.exports = ZDGConnection()
