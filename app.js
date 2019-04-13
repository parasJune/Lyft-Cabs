var express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    User =  require("./models/user"),
    sendmail = require('sendmail')({silent: true}),
    bodyParser = require("body-parser"),
    distance = require('google-distance-matrix'),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose");
    
mongoose.set('useCreateIndex', true);    
//mongoose.connect("mongodb://localhost:27017/cabs",{useNewUrlParser : true});
mongoose.connect("mongodb://Paras:PARAS123@ds139576.mlab.com:39576/lyftcabs",{useNewUrlParser : true});
var app = express();
app.set("view engine","ejs");
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended:true}));
app.use(require("express-session")({
    secret:"Paras",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    
    next();
})

//Routes
app.get("/",function(req,res){
   res.render("home"); 
});


//Sign up
app.get("/register",function(req,res){
    res.render("signup");
})

//handling request
app.post("/register",function(req,res){
    User.register(new User({firstname:req.body.firstname,surname:req.body.surname,username:req.body.username,number:req.body.number}),req.body.password,function(err,user){
        if(err){
            console.log(err);
            return res.render("signup");
        }
        passport.authenticate("local")(req,res,function(){
            res.render("Signin");
        })
        
    })
})

// var origins = ['227 A/C Sector C Indrapuri Bhopal'];
// var destinations = ['Piplani petrol pump Bhopal'];
 

//Sign in

app.get("/login",function(req, res) {
    res.render("Signin")
})

app.post("/login",passport.authenticate("local",{
    successRedirect:"/",
    failureRedirect:"/login",
    
}),function(req,res){
    
})





app.get("/book",function(req, res) {
    
    console.log(req.user)
    
    res.render("Book")
});


distance.key('AIzaSyASDBmsHq8FJYVKwFrkiuxAgDRuO-CnW3Y');
app.post("/book",isLoggedIn,function(req, res) {
    console.log(req.user)
    var origins = req.body.pickup;
    var destinations = req.body.destination;
    distance.matrix([origins], [destinations], function (err, distances) {
        if (err) {
            return console.log(err);
        }
        if(!distances) {
            return console.log('no distances');
        }
        if (distances.status == 'OK') {
                    var origin = distances.origin_addresses[0];
                    var destination = distances.destination_addresses[0];
                    if (distances.rows[0].elements[0].status == 'OK') {
                        var distance = distances.rows[0].elements[0].distance.text;
                        console.log('Distance from ' + origin + ' to ' + destination + ' is ' + distance);
                        var duration = distances.rows[0].elements[0].duration.text
                        var fare;
                        if(req.body.vehicle == "bike")
                            fare = parseInt(parseFloat(distance)*7+15);
                        if(req.body.vehicle == "micro")
                            fare = parseInt(parseFloat(distance)*12+25);
                        if(req.body.vehicle == "mini")
                            fare = parseInt(parseFloat(distance)*15+30);
                        if(req.body.vehicle == "sedan")
                            fare = parseInt(parseFloat(distance)*20+40);
                        res.render("BookingConfirmation",{duration:duration,distance : distance,fare:fare,vehicle:req.body.vehicle,pickup:origin,destination:destination});
                        
                    } 
                    else {
                        console.log(destination + ' is not reachable by land from ' + origin);
                    }
        }
    })
})
app.post("/confirmed",function(req, res) {
    req.user.Rides.push({pickup:req.body.pickup,destination:req.body.destination,fare:req.body.fare});
    req.user.save()
    var SendOtp = require('sendotp');
    var sendOtp = new SendOtp('270368AlPgqlIaa5ca21fd5',"Your Ride is booked from  "+req.body.pickup+" to "+req.body.destination+"  Please share the OTP:{{otp}} with the driver before starting the ride");
    sendOtp.send(req.user.number, "LYFTCABS", function (error, data) {
        console.log(data);
})
    res.render("Booked")
})

app.get("/ride",isLoggedIn,function(req, res) {
    console.log(req.user.Rides)
    res.render("Rides",{rides:req.user.Rides,firstname:req.user.firstname})
})

app.get("/profile",isLoggedIn,function(req, res) {
    res.render("Profile",{firstname:req.user.firstname,surname:req.user.surname,number:req.user.number,username:req.user.username})
})
//About Us
app.get("/contactus",function(req, res) {
    res.render("Contactus")
})




function isLoggedIn(req,res,next) {
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect("/login")
}

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
})

app.get("/plans",function(req, res) {
    res.render("plans")
})
app.listen(process.env.PORT,process.env.IP,function(){
    console.log("Server is started !!!");
});