const exp = require("express")
const fb = require("formidable")
const fs = require("fs")
const app = exp()
const url = require("url")
const FlakeId = require("flakeid")
const port = 8081

const flake = new FlakeId()

const testobj = {
    videos:{
        0:{
            title:"TestTitle",
            vUrl:"TestURL",
            tNail:"TestThumbNail"
        },
        1:{
            titl:"TestTitle2",
            vUrl:"TestURL2",
            tNail:"TestThumbNail2"
        }
    }
}

app.engine('html', require("ejs").renderFile)

app.get("/watch", (req, res) => {
    fs.readFile("siteData/data.json", (error, data) => {
        var q = url.parse(req.url, true)
        var qdata = q.query
        if(qdata.v != null && qdata.v != ""){
            try {
                res.status(200)
                // This works
                var test = JSON.parse(data)
                // var testtest = test.videos[qdata.v].title
                var req_media = test.videos[qdata.v]
                // res.write(JSON.stringify(req_media, null, 4))
                res.render(__dirname+"/views/watch.html", {title:req_media.title, url:req_media.vUrl})
            } catch (error) {
                res.status(404)
                res.write(`404 Not Found\n ${error}`)
                res.end()
            }
        }
    })
})

app.use('/public', exp.static('public'))

app.get('/db', (req, res) => {
    fs.readFile("siteData/data.json", (error, data) => {
        var temp = JSON.parse(data)
        var temp2 = JSON.stringify(temp.videos, null, 4)
        res.end(temp2)
    })
    
})


// I have no idea how this works. This is... borrowed code-
app.get('/video/:name', function(req, res) {
    const path = `videos/${req.params.name}`
    const stat = fs.statSync(path)
    const fileSize = stat.size
    const range = req.headers.range
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] 
        ? parseInt(parts[1], 10)
        : fileSize-1
      const chunksize = (end-start)+1
      const file = fs.createReadStream(path, {start, end})
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      }
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      }
      res.writeHead(200, head)
      fs.createReadStream(path).pipe(res)
    }
  });

app.get("/upload", (req, res) => {
    res.render(`${__dirname}/views/upload.html`)
})

app.get("/", (req, res) => {
    fs.readFile("siteData/data.json", (err, data) => {
        var html = new String()
        var fileData = JSON.parse(data)
        for(video in fileData.videos){
            html += `<a href=\"/watch?v=${video}\">${fileData.videos[`${video}`].title}</a><br>`
        }
        html += "<br><br><a href=\"/upload\">Upload A Video</a>"
        res.write(html)
        res.end()
    })
})

app.post("/post", (req, res) => {
    var form = new fb.IncomingForm();
    
    form.parse(req, (err, field, file) => {
        var newName = file.filetoupload.name
        newName = newName.replace(/\s/g, '-')
        var oldpath = file.filetoupload.path;
        var newpath = `videos/${newName}`
        fs.rename(oldpath, newpath, (err) => {
            if (err) throw err

            fs.readFile("siteData/data.json", (err, data) => {
                var fileData = JSON.parse(data)
                var ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress 
                var videoID = flake.gen()
                fileData.videos[`${videoID}`] = {}
                var videoData = fileData.videos[`${videoID}`]
                videoData.title = field.titlein
                videoData.vUrl = `video/${newName}`
                fs.writeFile("siteData/data.json", JSON.stringify(fileData, null, 4), (err) =>{
                    if (err) throw err
                })
                fs.appendFile("log/log.txt", `${ip} posted ${videoID}\n\n`, (err) => {
                    if (err) throw err
                })
            })
            res.redirect("/")
            res.end()
        })
    })
})

app.listen(port, () => {
    console.log(`Listening on ${port}`)
})