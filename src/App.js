import mongoose from "mongoose";
import _ from "lodash";
import got from "got";
import * as spypro from "./util/spypro";
import * as dmm from "./util/dmm";
import puppeteer from "puppeteer";
import * as updateItem from "./util/updateSpypro";
import fs from 'fs';
const crawlNewest = true;

(async () => {
  // dmm.spyDmm(crawlNewest)
  //await updateItem.updateHistoryForTrending();
  console.log('XXx')
  //await dmm.openBrowser()
  while(true){
    try {
      await Promise.all([
        // spypro.crawlSpypro(crawlNewest),
        dmm.spyDmm(crawlNewest)
      ])
    } catch(e){
      console.log(e);
    }
    // console.log('START CRAWL HISTORY')
    // await updateItem.updateHistoryForTrending(true);
    // console.log('DONEEEE')
    // await updateItem.updateHistoryForTrending(false); 
    // try {
    //   await Promise.all([
    //     // spypro.crawlSpypro(false),
    //     dmm.spyDmm(false)
    //   ])
    // } catch(e){

    // }
  }
 
})()


// 

//dmm.openBrowser();
//

const initBrowser = async () => {
  try {
    let browser = await puppeteer.launch({
      defaultViewport: null,
      headless: false,
    });
    const page = await browser.newPage();

    await page.goto("https://nationaltoday.com/march-holidays/");
    console.log("start crawl");
    const data = await page.evaluate(() => {
      const arr = [];
      const listHeaders = document.querySelectorAll(".row-header.row-days");
      console.log('length: ', listHeaders.length)
      for (let i = 0; i < listHeaders.length; i++) {
        if (listHeaders[i]) {
          const obj = {
            date: listHeaders[i].querySelector("span.event-date a").innerHTML,
            weekday: listHeaders[i].querySelector("span.event-day").innerText,
            events: [],
          };
          let found = true;
          let nextEl = listHeaders[i].nextSibling
          while (found) {
            if (!nextEl) {
              found = false;
              break;
            }
            const className = nextEl.className;
            if (className == "row-data row-days") {
              const imgEl = nextEl.querySelector('td.img a div').style.backgroundImage;
              const arr = imgEl.split("\"");
              const tagListEl = nextEl.querySelectorAll('.ga-tax-tag');
              const tagArr = [];
              for(let j = 0; j <tagListEl.length; j++){
                tagArr.push(tagListEl[j].innerText)
              }
              obj.events.push({
                name: nextEl.querySelector("td.title a").innerText,
                category: nextEl.querySelector('td.category').innerText,
                image: arr[1],
                tags: tagArr
              });
              nextEl = nextEl.nextSibling
            } else {
              arr.push(obj)
              found = false;
            }
          }
        }
      }
      return arr;
    });
    console.log(data);
    await fs.writeFileSync('test.json', JSON.stringify(data))
    await browser.close()
    process.exit(1)
  } catch (e) {
    console.log(e);
  }
};

// initBrowser();

const user = "Khang";
const pass = "jz249UioMe5T1jIveITl7x2iphh4qfWDs6sGmYYTdw0tutAOVQegsmfbED5IMWcJ";
mongoose.connect(
  `mongodb://${user}:${pass}@68.183.224.221/spy?authSource=admin`,
  { useNewUrlParser: true, autoIndex: false }
);
//mongoose.connect(`mongodb://localhost/spy`, { useNewUrlParser: true, autoIndex: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("CONNECT DB SS" + process.env.DATABASE_MONGO);
});
