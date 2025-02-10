const express = require("express"); 
const path = require("path");
const cookieParser = require("cookie-parser"); 
const { connectToMongoDB } = require("./connect");
const { restrictToLoggedinUserOnly, checkAuth } = require("./middlewares/auth");
const URL = require("./models/url");

const urlRoute = require("./routes/url");
const staticRoute = require("./routes/staticRouter");
const userRoute = require("./routes/user");

const app = express();
const PORT = 8000;

connectToMongoDB("mongodb://localhost:27017/short-url").then(() =>
  console.log("DB connected successfully..!")
);

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/url", restrictToLoggedinUserOnly,urlRoute);
app.use("/user", userRoute);
app.use("/", checkAuth, staticRoute);
app.get("/land",(req,res)=>{
  res.render("landing.ejs");
});

app.get("/url/:shortId", async (req, res) => {
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate(
    {
      shortId,
    },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now(),
        }, 
      },
    }
  );
  res.redirect(entry.redirectURL);
});

app.get('/url/delete/:shortId', async (req, res) => {
  const shortId = req.params.shortId;
  const ShortedID1 = await URL.findOne({ shortId: shortId });

  if (ShortedID1) {
    await URL.deleteOne({ shortId: shortId });
    //console.log(`Deleted:`, ShortedID1);
  } else {
    //console.log(`URL with shortId ${shortId} not found.`);
  }
  
  res.redirect("/");
});

app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));