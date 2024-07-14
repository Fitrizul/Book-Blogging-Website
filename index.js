import axios from "axios";
import bodyParser from "body-parser";
import express from "express";
import pg from "pg";

const app = express();
const port = 3000;
const API_URL = "https://openlibrary.org/search.json?";

const db = new pg.Client({
    user : "postgres",
    host : "localhost",
    database : "bookLibrary",
    password : "fitri11",
    port : 5432,
  });
  
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let books = [];

async function checkBook(){
    const result = await db.query("SELECT * FROM books");
    books = result.rows;
    return books;
}

async function checkBookRating(){
  const result = await db.query("SELECT * FROM books ORDER BY rating DESC");
  books = result.rows;
  return books;
}

async function checkBookTitle(){
  const result = await db.query("SELECT * FROM books ORDER BY book_title");
  books = result.rows;
  return books;
}

app.get("/", async (req, res) => {
    const books = await checkBook();
    res.render("index.ejs", { books : books});

});

app.get("/title", async (req, res) => {
  const books = await checkBookTitle();
  res.render("index.ejs", { books : books});

});

app.get("/rating", async (req, res) => {
  const books = await checkBookRating();
  res.render("index.ejs", { books : books});

});

app.post("/search", async (req, res) => {
    
    let books = [];

    try {
        const title = req.body.title;
        const result = await axios.get(API_URL + "title="+ title);  

        for(let i = 0; i < 10; i++) {
            books.push(result.data.docs[i]);
        }

        res.render("search.ejs", { books: books });

    } catch (error) {
        console.log("Error: " + error.message);
    }

});

app.post("/addForm", (req, res) => {
    
    const { title, author, isbn, yearPublish } = req.body;

    const bookAdd = {
        title: title,
        author: author,
        isbn: isbn,
        yearPublish: yearPublish
    };
    
    res.render("add.ejs", { book: bookAdd });

});

app.post("/add", async (req, res) => {
    
    try {

        const { title, author, isbn, yearPublish, review, rating } = req.body;

        const bookDetail = {
          title: title,
          author: author,
          isbn: isbn,
          yearPublish: yearPublish,
          review : review,
          rating : rating
        };

        await db.query("INSERT INTO books (book_title, book_author, book_isbn, book_publishyear, review, rating) VALUES ($1, $2, $3, $4, $5, $6)",
                       [title, author, isbn, yearPublish, review, rating]);
        
        res.redirect("/");
        


      
    } catch (error) {
        console.log("Error adding book data:", error.message);
    }

});

app.post("/editForm", async (req, res) => {
    
  try{

    const id = req.body.bookid;
    const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);
    let book = [];
    book = result.rows[0];

    res.render("edit.ejs", {book : book});
  }
  catch (error) {
    console.log(error.message);
}

});

app.post("/edit", async (req, res) => {

    const id = req.body.updatedBookId;
    const review = req.body.updatedBookReview;
    const rating = req.body.updatedBookRating;
  
    try{
      await db.query("UPDATE books SET review = ($1), rating = ($2) where id = $3", [review, rating, id]);
      res.redirect("/");
    }
    catch(error){
      console.log(error.message);
    }
  });

app.post("/delete", async (req, res) => {

    const id = req.body.bookid;
  
    try{
      await db.query("DELETE FROM books WHERE id = $1", [id]);
      res.redirect("/");
    }
    catch(err){
      console.log(err);
    }
  });

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });