const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require("lodash");
const request = require("request");
const https = require("https");
const Swal = require("sweetalert2");
const mongoose = require("mongoose");
const { forEach } = require("lodash");
var nodemailer = require('nodemailer');
const app = express();



mongoose.connect("mongodb+srv://<YOUR_URL>/counselorSchema");
// mongoose.connect("mongodb://localhost:27017/counselorSchema");

const counselorSchema = mongoose.Schema({
    Name: {type: String, required: true},
    Email: {type: String, required: true},
    Contact: {type: Number, required: true},
    Gender: {type: String, required: true},
    Experience: {type: Number, required: true},
    Age: {type: Number, required: true},
    Position: {type: String, required: true},
    Rating: {type: Number}
  });

  
const blogSchema = mongoose.Schema({
    title: String,
    content: String
  });
  
  const Blog = new mongoose.model("Blog", blogSchema);


const Counselor = new mongoose.model("Counselor", counselorSchema);

  
const SlotsSchema = new mongoose.Schema({
    Day:{type:String, rquired: true},
    Time:{type:String, required:true},
    CounselorInformation: {type: counselorSchema, required:true}
});

const Slot = new mongoose.model("Slot", SlotsSchema);

const available = [];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res){
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/CounselorForm", function(req,res){
    res.sendFile(__dirname + "/views/CounselorRegistration.html");
})

app.post("/", function(req, res){
    var firstName = req.body.first;
    var lastName = req.body.last;
    var email = req.body.email;
    console.log(firstName, lastName, email);
    const data = {
        members: [
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: firstName,
                    LNAME: lastName,
                }
            }
        ]
    };

    const jsonData = JSON.stringify(data);

    const url = "https://us5.api.mailchimp.com/3.0/lists/<YOUR-UNIQUE-ID>";
    const options = {
        method: "POST",
        auth: "M2S:<YOUR-API-KEY>"
    };

    const request = https.request(url, options, function(response){
        console.log(response.statusCode);
        if(response.statusCode === 200){
                 
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: '<YOUR-EMAIL>',
                    pass: '<YOUR-PASSWORD>'
                }
            });
                        
            var mailOptions = {
                from: '<YOUR-EMAIL>',
                to: email,
                subject: 'Confirmation Email for your subscription!',
                text: `Hello! This is a confirmation email to confirm your subscription with mind2soul. Hope you have a healthy and fit mind & soul. Thankyou for subscribing.`
            };
            
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

            res.sendFile(__dirname + "/views/success.html");
        }
        else{
            res.sendFile(__dirname + "/views/failure.html");
        }
        
        response.on("data", function(data){
            console.log(JSON.parse(data));
        });
    });
    
    request.write(jsonData);
    request.end();
});

app.post("/CounselorForm", function(req, res){
    const newcounselor = new Counselor({
        Name: req.body.fullname,
        Email: req.body.email,
        Contact: req.body.contact,
        Gender: req.body.radiogroup1,
        Experience: req.body.experience,
        Age: req.body.age,
        Position: req.body.position,
        Rating: req.body.rating,
    });
    newcounselor.save();
    
    const newslot = req.body.day;

    if(typeof(newslot) == "object"){
        for(var i=0; i<newslot.length; i++){
            const temp = new Slot({
                Day: newslot[i],
                Time: "10-11 AM",
                CounselorInformation: newcounselor
            });
            temp.save();
            available.push(temp);
        }
    }
    else{
        const temp = new Slot({
            Day: newslot,
            Time: "10-11 AM",
            CounselorInformation: newcounselor
        });
        temp.save();
        available.push(temp);
    }
    
    res.sendFile(__dirname + "/views/success.html");
});


app.get("/BookCounselor", function(req, res){

    Slot.find(function(err, available){
        
        if(!err){
            if(available.length == 0){
                res.sendFile(__dirname + "/views/failure2.html");
            }
            else{
                res.render("BookCounselor", {
                    availableslot: available
                });
            }
        }
    });
});

app.post("/BookCounselor", function(req, response){
    console.log(req.body.radiogroup2);
    Slot.deleteOne({_id: req.body.radiogroup2}, function(err){
        if(!err){
            console.log("Success!");
            response.sendFile(__dirname + "/views/success2.html");
        }
        else{
            response.sendFile(__dirname + "/views/failure.html");
        }
    });
});

app.get("/Compose", function(req, res){
    Blog.find(function(err, blogs){
        if(!err){
          res.render("compose", {
            posts: blogs
          });
        }
    })
});


app.post("/Compose", function(req, res){
    const post = new Blog({
      title: req.body.composeVal,
      content: req.body.postTitle
    });
    
    post.save(function(err){
      if(!err){
        res.sendFile(__dirname + "/views/success3.html");
      }
    });
  });


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
