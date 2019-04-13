var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var RideSchema = new mongoose.Schema({
   pickup:String,
   destination:String,
   fare:Number
});

RideSchema.plugin(passportLocalMongoose);

var UserSchema = new mongoose.Schema({
    firstname : String,
    surname : String,
    username : String ,
    password : String,
    number : Number,
    Rides: [RideSchema]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);