const request = new XMLHttpRequest()
const url = 'http://localhost/db';
request.open("GET", url)
request.send()

request.onload = (e) => {
    reqData = request.response
    tempArr = []
    reqObj = JSON.parse(reqData)
    for(var i in reqObj){
        tempArr.push(i)
        console.log(i)
    }
    for (var i in reqObj){
        document.getElementById("rframe").innerHTML += `<div> ${reqObj[i]["title"]} </div>`
    }
}