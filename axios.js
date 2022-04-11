const ZDGConnection = require("./botflowcpf.js")
const axios = require('axios')
const url = 'https://api.playservicos.com.br:3002/'


const username = 'claudioplayservicos@gmail.com'
const password = 'claudio123@'
const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64')
/*
data = {
    "cpf": "06706368199",
    "telefone": "67996582103",
    "email": "",
    "cep": 79670000,
    "tipo": 4
}
*/

function getLogin() {
    axios
        .get(`${url}v2/parceiros/vendas?praca_id=3&cpf=07126693109&nsu=16362`, { headers: { 'Authorization': `Basic ${token}` }, })
        .then(response => {
            console.log(response.data)
        })
        .catch(error => console.log(error.request))
}
//getLogin()

function validarCliente() {
    axios
        .post(`${url}parceiros/validacoes?praca_id=3`, data, { headers: { 'Authorization': `Basic ${token}` }, })
        .then(response => {
            console.log(response.data)
        })
        .catch(error => console.log(error.request))
}
//validarCliente()

function getCPF() {
    const dataGetCPF = {
        "cpf": `${ZDGConnection.cpf}`,
        "telefone": "",
        "email": "",
        "cep": "",
        "tipo": 2
    }

    axios.post(`${url}parceiros/validacoes?praca_id=3`, dataGetCPF, { headers: { 'Authorization': `Basic ${token}` }, })
        .then(response => {
            console.log(response.data)
        })
        .catch(error => console.log(error.request))
}

getCPF()