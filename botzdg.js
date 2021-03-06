const makeWaSocket = require('@adiwajshing/baileys').default
const { delay, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const { unlink, existsSync, mkdirSync, readFileSync } = require('fs')
const P = require('pino')
const ZDGPath = './ZDGSessions/'
const ZDGAuth = 'auth_info.json'

const ZDGLocation = {
   location: {
      degreesLatitude: 24.121231,
      degreesLongitude: 55.1121221
   }
}
const ZDGurlBtn1 = {
   url: 'http://zapdasgalaxias.com.br/',
   displayText: 'ð¨âð Pedrinho da NASA Â© BOT-ZDG ð¨âð',
}
const ZDGurlBtn2 = {
   url: 'http://zapdasgalaxias.com.br/',
   displayText: 'ð¨âð Pedrinho da NASA Â© BOT-ZDG ð¨âð',
}
const apostaSP = {
   url: 'http://www.saopaulofc.net/',
   displayText: 'â½ SÃO PAULO â½',
}
const apostaPAL = {
   url: 'https://www.palmeiras.com.br/',
   displayText: 'â½ PALMEIRAS â½',
}
const ZDGreplyBtn1 = {
   id: 'sim',
   displayText: 'SIM',
}
const ZDGreplyBtn2 = {
   id: 'nao',
   displayText: 'NÃO',
}
const callButton = {
   displayText: 'Ligar agora âï¸',
   phoneNumber: '+55 35 9 8875-4197',
}
const apostaBtn = [
   { index: 0, urlButton: apostaSP },
   { index: 1, urlButton: apostaPAL },
]
const ZDGbtnMD = [
   //{ index: 0, urlButton: ZDGurlBtn1 },
   //{ index: 1, urlButton: ZDGurlBtn2 },
   //{ index: 2, callButton },
   { index: 3, quickReplyButton: ZDGreplyBtn1 },
   { index: 4, quickReplyButton: ZDGreplyBtn2 },
]

const buttonsCPF = [
   { index: 3, quickReplyButton: ZDGreplyBtn1 },
   { index: 4, quickReplyButton: ZDGreplyBtn2 },
]
const buttons = [
   { buttonId: 'zdg1', buttonText: { displayText: 'â­ Comunidad ZDG â­' }, type: 1 },
   { buttonId: 'zdg2', buttonText: { displayText: 'â¶ï¸ YouTube â¶ï¸' }, type: 1 },
   { buttonId: 'zdg3', buttonText: { displayText: 'ð¨âð Pedrinho da NASA ð¨âð' }, type: 1 },
]

const ZDGGroupCheck = (jid) => {
   const regexp = new RegExp(/^\d{18}@g.us$/)
   return regexp.test(jid)
}

const ZDGUpdate = (ZDGsock) => {
   ZDGsock.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) {
         console.log('Â© BOT-ZDG - Qrcode: ', qr);
      };
      if (connection === 'close') {
         const ZDGReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
         if (ZDGReconnect) ZDGConnection()
         console.log(`Â© BOT-ZDG - CONEXÃO FECHADA! RAZÃO: ` + DisconnectReason.loggedOut.toString());
         if (ZDGReconnect === false) {
            const removeAuth = ZDGPath + ZDGAuth
            unlink(removeAuth, err => {
               if (err) throw err
            })
         }
      }
      if (connection === 'open') {
         console.log('Â© BOT-ZDG - CONECTADO')
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
      await delay(2000)
      await ZDGsock.sendPresenceUpdate('composing', jid)
      await delay(1500)
      await ZDGsock.sendPresenceUpdate('paused', jid)
      return await ZDGsock.sendMessage(jid, msg)
   }

   var cpf;
   var nome;
   var email

   ZDGsock.ev.on('messages.upsert', async ({ messages, type }) => {
      const msg = messages[0]
      const ZDGUsuario = msg.pushName;
      const jid = msg.key.remoteJid

      if (!msg.key.fromMe && jid !== 'status@broadcast' && !ZDGGroupCheck(jid)) {
         console.log("Â© BOT-ZDG - MENSAGEM : ", msg)

         ZDGsock.sendReadReceipt(jid, msg.key.participant, [msg.key.id])

         // mensagem inicial
         if (msg.message.conversation.toLowerCase() === 'oi') {
            ZDGSendMessage(jid, { text: 'OlÃ¡, ' + ZDGUsuario + '! VocÃª estÃ¡ conversando com um *RobÃ´*.\nPor favor digite seu CPF' })
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         //digite o CPF - confirme atravÃ©s de botÃµes
         if (msg.message.conversation.length === 11) { //validar cpf com REGEX
            const ZDGbtnCpf = {
               text: '*'+msg.message.conversation+'*\n\nEste CPF estÃ¡ correto?',
               //footer: 'Â© Play ServiÃ§os',
               templateButtons: ZDGbtnMD
            }
            ZDGSendMessage(jid, ZDGbtnCpf)
               .then(result => {
                  console.log('RESULT: ', result)
                  cpf = msg.message.conversation
                  console.log('cpf: ' +cpf)
               })
               .catch(err => console.log('ERROR: ', err))
            
         } //botao sim do cpf
         else if (msg.message.templateButtonReplyMessage.selectedId === "sim") {  
            ZDGSendMessage(jid, { text: 'Fazendo requisicao na api' })
               .then(result => {
                  console.log('RESULT: ', result)
                  console.log('cpf: ' +cpf)
               })
               .catch(err => console.log('ERROR: ', err))

         } 
         //botao nao do cpf
         else if(msg.message.templateButtonReplyMessage.selectedId === "nao") {
            ZDGSendMessage(jid, { text: 'Por favor, digite seu cpf novamente' })
               .then(result => {
                  console.log('RESULT: ', result)
                  console.log('cpf: ' +cpf)
               })
               .catch(err => console.log('ERROR: ', err))
         }

         // apostar SP x PAL
         if (msg.message.conversation.toLowerCase() === 'apostar') {
            const ZDGImagem = {
               // opicional
               caption: '```--- APOSTE NO SEU TIME ---```',
               // opicional
               footer: 'Â© PlayServicos',
               image: {
                  url: './assets/aposta.jpg',
                  //url: 'https://zapdasgalaxias.com.br/wp-content/uploads/elementor/thumbs/icone-2-pdi31v9k8vtxs105ykbgfpwsyu37k4387us769we0w.png'
               },
               templateButtons: apostaBtn
            } //dentro da imagem
            ZDGSendMessage(jid, ZDGImagem)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // localizaÃ§Ã£o
         if (msg.message.conversation.toLowerCase() === 'localzdg') {
            ZDGSendMessage(jid, ZDGLocation)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // link
         if (msg.message.conversation.toLowerCase() === 'linkzdg') {
            ZDGSendMessage(jid, {
               forward: {
                  key: { fromMe: true },
                  message: {
                     extendedTextMessage: {
                        text: 'https://zapdasgalaxias.com.br/',
                        matchedText: 'https://zapdasgalaxias.com.br/',
                        canonicalUrl: 'https://zapdasgalaxias.com.br/',
                        title: 'Comunidade ZDG - ZAP das GalÃ¡xias',
                        description: 'Â© Pedrinho da NASA',
                        // opicional
                        jpegThumbnail: readFileSync('./assets/icone.png')
                     }
                  }
               }
            })
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // lista
         if (msg.message.conversation.toLowerCase() === 'listazdg') {
            const sections = [
               {
                  title: 'ZDG #1',
                  rows: [
                     { title: 'Coluna #1', description: 'DescriÃ§Ã£o #1', rowId: 'zdg1' },
                     { title: 'Coluna #2', description: 'DescriÃ§Ã£o #2', rowId: 'zdg2' },
                     { title: 'Coluna #3', description: 'DescriÃ§Ã£o #3', rowId: 'zdg3' },
                  ],
               },
               {
                  title: 'ZDG #2',
                  rows: [
                     { title: 'Coluna #1', description: 'DescriÃ§Ã£o #1', rowId: 'zdg3' },
                     { title: 'Coluna #2', description: 'DescriÃ§Ã£o #2', rowId: 'zdg5' },
                     { title: 'Coluna #3', description: 'DescriÃ§Ã£o #3', rowId: 'zdg6' },
                     { title: 'Coluna #4', description: 'DescriÃ§Ã£o #4', rowId: 'zdg7' },
                  ],
               },
               {
                  title: 'ZDG #3',
                  rows: [
                     { title: 'Coluna 01', description: 'DescriÃ§Ã£o #1', rowId: 'zdg8' },
                     { title: 'Coluna 02', description: 'DescriÃ§Ã£o #2', rowId: 'zdg9' },
                  ],
               },
            ]

            const sendList = {
               title: 'ð *ZDG TÃ­tulo* ð\n',
               text: 'Clique no botÃ£o\n',
               buttonText: 'Clique aqui',
               footer: 'Â©BOT-ZDG\nComunidade ZDG: https://zapdasgalaxias.com.br/',
               sections: sections
            }

            ZDGSendMessage(jid, sendList)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // botÃµes
         if (msg.message.conversation.toLowerCase() === 'botaozdg') {
            const buttonsMessage = {
               text: '*ZDG TÃ­tulo do BotÃ£o*\n\nZDG DescriÃ§Ã£o do BotÃ£o',
               footer: 'Â© BOT-ZDG',
               buttons: buttons,
               headerType: 1
            }
            ZDGSendMessage(jid, buttonsMessage)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // botÃµes md
         if (msg.message.conversation.toLowerCase() === 'botaomdzdg') {
            const ZDGLayout = {
               text: '*ZDG TÃ­tulo do BotÃ£o*\n\nZDG DescriÃ§Ã£o do BotÃ£o',
               footer: 'Â© BOT-ZDG',
               templateButtons: ZDGbtnMD
            }
            ZDGSendMessage(jid, ZDGLayout)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // imagem
         if (msg.message.conversation.toLowerCase() === 'imagemzdg') {
            const ZDGImagem = {
               // opicional
               caption: '```ZAP DAS GALÃXIAS```',
               image: {
                  //url: './assets/icone.png',
                  url: 'https://zapdasgalaxias.com.br/wp-content/uploads/elementor/thumbs/icone-2-pdi31v9k8vtxs105ykbgfpwsyu37k4387us769we0w.png'
               }
            }
            ZDGSendMessage(jid, ZDGImagem)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // imagem + botÃµes
         if (msg.message.conversation.toLowerCase() === 'imagembotaozdg') {
            const ZDGImagem = {
               // opicional
               caption: '```ZAP DAS GALÃXIAS```\n\nPedrinho da NASA',
               // opicional
               footer: 'Â© BOT-ZDG',
               image: {
                  url: './assets/icone.png',
                  //url: 'https://zapdasgalaxias.com.br/wp-content/uploads/elementor/thumbs/icone-2-pdi31v9k8vtxs105ykbgfpwsyu37k4387us769we0w.png'
               },
               buttons: buttons
            }
            ZDGSendMessage(jid, ZDGImagem)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // vÃ­deo
         if (msg.message.conversation.toLowerCase() === 'videozdg') {
            const sendVideo = {
               // opicional
               caption: '```ZAP DAS GALÃXIAS```',
               video: {
                  url: './assets/zdg.mp4',
               },
               mimetype: 'video/mp4',
               gifPlayback: true
            }
            ZDGSendMessage(jid, sendVideo)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // vÃ­deo + botÃµes
         if (msg.message.conversation.toLowerCase() === 'videobotaozdg') {
            const templateVideo = {
               // opicional
               caption: '```ZAP DAS GALÃXIAS```\n\nPedrinho da NASA',
               // opicional
               footer: 'Â© BOT-ZDG',
               video: {
                  url: './assets/zdg.mp4',
               },
               mimetype: 'video/mp4',
               gifPlayback: true,
               buttons: buttons
            }
            ZDGSendMessage(jid, templateVideo)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // vÃ­deo + botÃµes MD
         if (msg.message.conversation.toLowerCase() === 'videobotaomdzdg') {
            const templateVideo = {
               // opicional
               caption: '```ZAP DAS GALÃXIAS```\n\nPedrinho da NASA',
               // opicional
               footer: 'Â© BOT-ZDG',
               video: {
                  url: './assets/zdg.mp4',
               },
               mimetype: 'video/mp4',
               gifPlayback: true,
               templateButtons: ZDGbtnMD
            }
            ZDGSendMessage(jid, templateVideo)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // pdf
         if (msg.message.conversation.toLowerCase() === 'pdfzdg') {
            const sendDoc = {
               fileName: 'zdg.pdf',
               mimetype: 'application/pdf',
               document: {
                  url: './assets/zdg.pdf'
                  // url: 'https://zapdasgalaxias.com.br/exemplo.pdf'
               }
            }
            ZDGSendMessage(jid, sendDoc)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // pdf + botÃµes
         if (msg.message.conversation.toLowerCase() === 'pdfbotaozdg') {
            const templateDoc = {
               // opicional
               caption: '```ZAP DAS GALÃXIAS```\n\nPedrinho da NASA',
               // opicional
               footer: 'Â© BOT-ZDG',
               fileName: 'zdg.pdf',
               mimetype: 'application/pdf',
               document: {
                  url: './assets/zdg.pdf'
                  // url: 'https://zapdasgalaxias.com.br/exemplo.pdf'
               },
               buttons: buttons
            }
            ZDGSendMessage(jid, templateDoc)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // pdf + botÃµes MD
         if (msg.message.conversation.toLowerCase() === 'pdfbotaomdzdg') {
            const templateDoc = {
               // opicional
               caption: '```ZAP DAS GALÃXIAS```\n\nPedrinho da NASA',
               // opicional
               footer: 'Â© BOT-ZDG',
               fileName: 'zdg.pdf',
               mimetype: 'application/pdf',
               document: {
                  url: './assets/zdg.pdf'
                  // url: 'https://zapdasgalaxias.com.br/exemplo.pdf'
               },
               templateButtons: ZDGbtnMD
            }
            ZDGSendMessage(jid, templateDoc)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // contatos
         if (msg.message.conversation.toLowerCase() === 'contatozdg') {
            const contact = {
               fullName: 'Pedrinho da NASA',
               waid: '5535988754197',
               phoneNumber: '+55 35 9 8875-4197'
            }
            const vcard =
               'BEGIN:VCARD\n' +
               'VERSION:3.0\n' +
               'FN:' +
               contact.fullName +
               '\n' +
               'item1.TEL;waid=' +
               contact.waid +
               ':' +
               contact.phoneNumber +
               '\n' +
               'item1.X-ABLabel:Celular\n' +
               'END:VCARD'

            ZDGSendMessage(jid, {
               contacts: {
                  displayName: contact.fullName,
                  contacts: [{ vcard, displayName: contact.fullName }]
               }
            })
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // lista de contatos
         if (msg.message.conversation.toLowerCase() === 'contatolistazdg') {
            const contactList = [
               {
                  fullName: 'Pedrinho da NASA #1',
                  waid: '5535988754197',
                  phoneNumber: '+55 35 9 8875-4197',
               },
               {
                  fullName: 'Pedrinho da NASA #2',
                  waid: '5535988754197',
                  phoneNumber: '+55 35 9 8875-4197',
               },
               {
                  fullName: 'Pedrinho da NASA #3',
                  waid: '5535988754197',
                  phoneNumber: '+55 35 9 8875-4197',
               },
            ]

            const contacts = Array.from(contactList, c => {
               return {
                  displayName: c.fullName,
                  vcard:
                     'BEGIN:VCARD\n' +
                     'VERSION:3.0\n' +
                     'FN:' +
                     c.fullName +
                     '\n' +
                     'item1.TEL;waid=' +
                     c.waid +
                     ':' +
                     c.phoneNumber +
                     '\n' +
                     'item1.X-ABLabel:Celular\n' +
                     'END:VCARD',
               }
            })

            ZDGSendMessage(jid, {
               contacts: {
                  displayName: `${contacts.length} contatos`,
                  contacts: contacts
               }
            })
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }
      }
   })

}

ZDGConnection()