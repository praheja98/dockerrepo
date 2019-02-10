var express = require('express'),
    handlebars = require('express-handlebars').create({ defaultLayout: 'main'});
var mongoose=require('mongoose');
mongoose.connect('mongodb://mongo:27017/docker-node-mongo');

var app = express();
var user = require('./models/user');
var credentials=require('./credentials.js');
var question = require('./models/question.js');
var cookieSession=require('cookie-session');
var counter=0;

var md5=require('md5');

var h=0;
var handlebars = require('express-handlebars').create({
    defaultLayout:'main',
    helpers: {
        debug: function(){
            console.log("Current Context");
            console.log("=================");
            console.log(this);
            return null
        },
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});




app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3018);
app.use(require('body-parser').urlencoded({extended: true}));
app.set('trust proxy',1)
app.use(
    cookieSession({
        secret:'keyboard cat',
        name:'session',
        keys:['key1','key2'],
        cookie:{secure:true}

    }))

app.use(require('cookie-parser')(credentials.cookieSecret));

app.use(express.static(__dirname+'/public'));

function checkLogin(req,res,uname,password) {

    user.findOne({username: uname}, function (err, userdata) {

        if (!userdata) {
            res.render('nouser');
        }

        else if (userdata.password == md5(password)) {
            req.session.username = userdata.username;
            res.redirect(303,'/quiz3');

        }
        else {

            res.render('401');

        }

    })

}

var length;
question.find({},function(err,que){
    length = que.length;
})

app.get('/debuggingtest' , function(req,res) {
    res.render('quiz1');
})

app.get("/clear/ses" , function(req,res) {
    req.session = null;
    res.send("completed");
})


app.post('/processLogin1',function(req,res){
    checkLogin(req,res,req.body.uname.trim(),req.body.pword.trim())

})


app.get('/Register11' , function(req,res) {
    res.render('Register11');
})

app.post('/processReg1',function(req,res) {

    if (req.body.pword.trim() == req.body.pword2.trim()) {

        var newUser = user({
            username: req.body.uname,
            password: md5(req.body.pword),
            type:"student"

        })

        newUser.save();
        res.redirect(303,'/Login11');

    }

    else {
        res.render('401');
    }


});

app.get('/Logout',function(req,res) {
    req.session.username=null;
    res.redirect(303,'/Login11');
})


app.get('/Login11',function(req,res){
    if(req.session.username)
        res.redirect(303,'/quiz3');
   else {
        res.render('Login11');
    }
})

app.get("/getquestions" , function(req,res) {
    question.find({},function(err,ques) {
     res.render('questioncheck' , {question:ques});
    })
})



app.get('/quiz2check' , function(req,res) {
    var correct_answers = 0;
    var answer_description=[];
    var len = req.session.data;
    for(var i=1;i<len+1;i++){
        var j = i.toString();
        answer_description.push(req.session.testing2[j]);
    }
    question.find({},function(err,ques) {
        var counter_index = 0;
        var result = ques;
        console.log("length is " + ques.length);

        result.forEach(function(re,i) {
            console.log("checking i " + i);
            var correctid = re.correctid;
            re.choice.forEach(function(d) {
                if (d.cid === correctid) {
                    console.log(d);
                    description = d.description
                    testCompleted(description);
                }
            })
            if(i == ques.length-1) {
                anotherFunction();
            }
        })
        function testCompleted(desc) {
            if(answer_description[counter_index] === desc)
                correct_answers++;
            req.session.correctanswers = correct_answers;
            counter_index++;
            console.log(correct_answers);

        }
    })
    function anotherFunction() {
        res.send("the correct answers are " + correct_answers);
    }

})

app.post("/quiz2complete" , function(req,res) {
    if(req.session.testing2 == undefined)
        console.log("this is strange")
    else {
        req.session.testing2.push(req.body);
    }
    res.send(req.session.testing2);
})


app.get('/quiz2',function(req,res) {
    res.render('quiz2');
})

app.post('/nextques',function(req,res) {
    var update = false;
    console.log("parul check here");
    console.log(req.body);
    console.log("parul check here 1 ");
    function mix(source, target) {
        for(var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }

    }
    if(req.session.data == undefined)
    {
        req.session.data = 1;
        console.log("checking")
        var da = req.session.data;
        var check = {};
       check[da] = req.body.answer;
       var date = Date.now();
       console.log("debugger 1");
       console.log(req.session.username);
       console.log("debugger 2");
       if(req.session.username) {
           console.log("are you reaching this stage");
           user.findOneAndUpdate({username:req.session.username},
               {$push:{answer:{qid:da,description:req.body.answer,
                       date:date}}},function(err,upd){
               console.log("update was succesfull");
               }
               )

       }
        mix(check,req.session.testing2);
        console.log("check here");
        req.session.data = req.session.data + 1;
        question.find({qid:req.session.data},function(err,ques) {
            res.render('custom',{question:ques});

        })
    }
    else {
        /*
    }
        user.find({'answer':{$elemMatch:{qid:req.body.question}},'username':req.session.username},function(err,re){

        }).then(function(re) {
        */
            console.log("debug1");
            console.log(req.session.testing2);
            console.log("debug 2");
            if(!(req.session.testing2[req.body.question])) {
               // req.session.data = req.session.data + 1;
                var da = req.body.question;
                var check = {};
                check[da] = req.body.answer;
                var date = Date.now();
                console.log("important check");
                console.log(req.session.data);
                console.log("important check 1");
                if (req.session.username) {
                    console.log("are you reaching this stage");
                    mix(check, req.session.testing2);
                    user.findOneAndUpdate({username: req.session.username},
                        {
                            $push: {
                                answer: {
                                    qid: da, description: req.body.answer,
                                    date: date
                                }
                            }
                        }, function (err, upd) {
                            console.log("update was succesfull");
                        }
                    )

                }

                else {

                    mix(check, req.session.testing2);
                    console.log("Done");

                }

            }
            else {
                console.log("checking here yeet");
                update=true;
                var da = req.body.question;
                console.log("important check please");
                console.log(da);
                console.log("important check ends");
                var check = {};
                check[da] = req.body.answer;
                var date = Date.now();
                if (req.session.username) {
                    console.log("are you reaching this stage");

                    /**
                     * Fix this for all users
                     */

                    user.update({'answer.qid':req.body.question,'username':req.session.username},{
                        $set:{
                            "answer.$.description":req.body.answer
                        }
                    },function(err,re) {
                        console.log("update completed 2");
                    })


                }
                mix(check, req.session.testing2);


            }

        if(da == length)
        {
            res.redirect(303,'/quiz2check');

        }
        else {
                if(!update) {
                    req.session.data = req.session.data + 1;
                    console.log("checking here ");
                }
            question.find({qid: req.session.data}, function (err, ques) {
                res.render('custom', {question: ques});
            })
        }
        /*
    })
    */
    }



})

app.get('/sessioninfo',function(req,res) {
res.send(req.session);
})



app.get('/quiz3' , function(req,res) {
    if(req.session.testing2 == undefined) {
        req.session.testing2 = {};
    }
    if(req.session.data == undefined)
        question.find({qid:1},function(err,que) {
            res.render('custom',{question:que})
        })
    else {

        console.log("checking session 1");
        console.log("check data " + req.session.data);
        if(req.session.data < length)
        question.find({qid: req.session.data}, function (err, que) {
            res.render('custom', {question: que});
        })
        else
            res.redirect(303,'/quiz2check');

    }

})



app.get("/checkingans" , function(req,res) {
    user.find({'answer':{$elemMatch:{qid:11}}},function(err,re){

    }).then(function(re) {
        if(re.length) res.send("check" + re.length);
        else
            res.send("not completed");
    })
})



app.get('/createquestions' , function(req,res) {
    q2= new question({
        qid:2,
        moduleCode:1,
        description:"this is the answer",
        correctid:3,
        choice:[
            {
                cid:1,
                description:"this is some sample answer"
            },
            {
                cid:2,
                description:"this is another information"
            },
            {
                cid:3,
                description:"this is random"
            }
        ]
    }).save();

    res.redirect(303,'/questioncreate');


})

app.get('/questioncreate' , function(req,res) {
    question.find({qid:2} , function(err,qu) {

    }).then(function(re) {
        var correctid = re[0].correctid;
        re[0].choice.forEach(function(i,d) {
            if(i.cid == correctid)
                completed(i.description);
        })
        function completed(des) {
            res.send(des);
        }
    })
})



app.get('/Login11',function(req,res){
    if(req.session.username)
        res.redirect(303,'quiz3');
        else
res.render('Login11');
})


app.get("/createquestiontest" , function(req,res) {
    var q2 = question({
        qid:3,
        modulecode:"first",
        description:"this is sample description",
        correctid:3,
        choice:[
            {
                cid:1,
                description:"correct answer"
            },
            {
                cid:2,
                description:"right answer"
            },
            {
                cid:3,
                description:"wrong answer"
            }
        ]
    }).save();
    res.redirect(303,'/justchecking');
})





app.get('/removequestions' , function(req,res) {
    question.remove({},function(err,re) {
        res.send(re);
    })
})

app.get('/' , function(req,res) {
    res.redirect(303,'/quiz3');
})


app.use(function(req,res){
    res.status(404);
    res.render('404');
})

app.use(function(err,req,res,next){
    console.log(err.stack);
    res.status(500);
    res.render('500');
})

app.listen(app.get('port'), function(){
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate');
});
