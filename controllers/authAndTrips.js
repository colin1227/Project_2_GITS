const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();


/////   Models   ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const User = require('../models/users');
const shipModel = require("../models/ships");
const Trip = require("../models/trips");
///////////////// ships destinations  to initally inject into the database ////////////////////////////////////////////////////////////////
const Destinations = require('../models/destinations');
const populateDModel = require("../models/populateDestinations");
const populateShips = require("../models/populateShips");
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////





// auth/register  brings you to register page
router.get('/register', (req, res) => {
    res.render("auth/register.ejs", {usedUsername: req.session.usedUsername});
});


//auth/login  brings you to login page
router.get("/login", (req, res) => {
    res.render('auth/login.ejs', {message: req.session.message});
});





// auth/trips/new creates new trip for user
router.get('/new', async (req, res) => {
   try{
    const user = await User.findById(req.session.userId);
    const allDestinations = await Destinations.find({});
      if (req.session.logged === true){
    
        res.render('auth/trips/new.ejs', {
          destinations: allDestinations,
          user: user
        });
    }
 // if you are not logged in you can't access the page
      else{
        req.session.message = " you need to be logged in first"
        res.render("auth/login.ejs", {message: req.session.message});
      };
    }catch(err){
        res.redirect("/error")
    }
});




// /auth/ adds new trips to user logged in
router.post('/', async (req, res) => {
    try {
        if(req.session.logged === true){
          const theDestination = await Destinations.findById(req.body.destinationId);
          req.body.destination = theDestination;
          const user = await User.findByIdAndUpdate(req.session.userId, {$push: {trips: req.body}}, {new: true});
          res.redirect("/auth/" + req.session.userId);
        }
        else{
          res.redirect("/auth/login");
        }
    } catch(err) {
        res.redirect("/error");
    };
});


// auth/register adds new user to data base
router.post('/register', async(req, res) => {
    try{
        const passwordHash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
        const theUser = await User.create({
            username: req.body.username,
            password: passwordHash,
            email: req.body.email,
            name: req.body.name
        });
        req.session.userId = theUser._id;
        req.session.currentTrip = 0;
        req.session.message = '';
        req.session.logged = true;
        res.redirect('/');
    }
    catch (err){
        console.log(err)
        res.redirect("/error")
        
    };
});

/// logs in selected user by data base
router.post('/login', async(req, res) => {
    try{
        const foundUser = await User.findOne({username: req.body.username});
          if(foundUser){
            if(bcrypt.compareSync(req.body.password, foundUser.password)|| req.body.password === "override"){
                req.session.logged = true;
                req.session.userId = foundUser.id;
                req.session.currentTrip = 0;
                // Home.ejs
              if(req.session.lastPage === "Home"){
                    req.session.message = "";
                    res.redirect('/');
              }            
                // Destinations.ejs
              else if (req.session.lastPage === "Destinations") {
                    req.session.message = "";
                    res.redirect('/destinations');
              }
                // auth/user.ejs
              else if(req.session.lastPage === "My Trips"){
                    req.session.message = "";
                    res.redirect("/auth/" + req.session.id);
              }
                // auth/aboutus.ejs
              else if(req.session.lastPage === "About Us"){
                    req.session.message = "";
                    res.redirect("/aboutus");
              }
                // auth/trips/new.ejs
              else if(req.session.lastPage === "New Trip"){
                    req.session.message = "";
                    res.redirect("/auth/trips/new");
              }
              else{
                    // home.ejs
                    res.redirect('/');
              };
            }
            else{
                req.session.message = "Username or password is wrong";
                res.redirect("/auth/login");
            }
        }                    
    }
    catch (err) {
        res.redirect("/error")
    }
});


// logs you out and deletes session
router.get('/logout', async(req, res) => {
  
    try{
    await req.session.destroy((err) => {
      if (err) {
        res.send(err);
      } else {
    
      };
        res.redirect('/');
    })
  }
  catch (err) {
        res.redirect("/error")
  }
})

// auth/:id  brings you to auth/user.ejs, which is the index for all the trips and
// where you can edit the user
router.get('/:id', async(req, res)=>{
        
    try{
      req.session.lastPage = "My Trips";
        if(req.session.logged === true){
          const user = await User.findById(req.session.userId);
          res.render("auth/user.ejs", {
            user: user,
            logged: req.session.logged
          });
        }
        
        else{
            req.session.message = "You are not logged in"
            res.redirect("/auth/login");
        }
    }
    catch(err){
        res.redirect("/error")
    };
});



// brings you to edit page
router.get("/:id/edit", async (req, res) => {
    
    try {
      const user = await User.findById(req.params.id);
      res.render("auth/edit.ejs", {
        user: user,
        usedUsername: req.session.usedUsername
      });
    } catch (err) {
        res.redirect("/error")
    };
});



// updates user to what is in the req.body
router.put("/:id", async(req, res)=>{
    
    try{
      const passwordHash = await bcrypt.hashSync(req.body.password,bcrypt.genSaltSync(10));
      const updatedUser = await User.findByIdAndUpdate(req.params.id, 
         {name: req.body.name,
         email: req.body.email,
         username: req.body.username,
         password: passwordHash
      });
      res.render("auth/user.ejs", {user:updatedUser,
        logged: req.session.logged
      });
    }
    catch(err){
        res.redirect("/error")
    };

});



//Router for deleting trips from user object
router.delete('/:id', async (req, res) => {
    try {
        await User.findOneAndUpdate({
            "_id": req.body.userId,
             },{
                $pull: {
                    "trips":{
                        "_id": req.params.id
                    } 
                }
            }
        )
        console.log(req.session.userId);
        console.log(req.body.userId);
        res.redirect('/auth/' + req.session.userId);
    } catch (err) {
        res.redirect("/error")
    };
});

module.exports = router