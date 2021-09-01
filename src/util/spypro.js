import puppeteer from "puppeteer";
import mongoose from "mongoose";
import * as midItem from "../middle/MidItem";
import moment from "moment";
import * as midConfig from "../middle/MidConfig";
import _ from "lodash";
import * as util from "../util/index";
import got from "got";

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const SORTBY = {
  TRENDING: "growth",
  TIME: "published_date",
  LIKE: "likes",
};

export const crawlSpypro = async (fromBegin) => {
  const NUMBER_PAGE = fromBegin? 150 : 50;
  let browser = await puppeteer.launch({
    userDataDir: "./dataChrome",
    defaultViewport: null,
    headless: true,
    args: ["--proxy-server=socks5://45.32.101.156:28982", '--no-sandbox'],
  });
  let continueCrawl = true
  while (continueCrawl) {
    const config = await midConfig.getConfig(1);
    let toDate = config.crawlToDate;
    let fromDate = moment(toDate).subtract(1, "days");
    let pageCount = 1;
   
    
    for (let pageTime = 0; pageTime < NUMBER_PAGE; pageTime++) {
      let link = `https://tools.spypro.io/search?sortBy=${SORTBY.TIME}&page=${pageCount}`;
      if(!fromBegin){
        link =  `https://tools.spypro.io/search?sortBy=${SORTBY.LIKE}&page=${pageCount}&date=${
          moment(
            fromDate
          ).format("MM/DD/YYYY")} 00:00:00 - ${moment(toDate).format(
            "MM/DD/YYYY"
          )
        } 23:59:59`;
        console.log('CRAWL DATE: ', toDate);
      }
      await sleep(1000);
      let page = await browser.newPage();
      // --- Disable load image for performance --- //
      page.setRequestInterception(true);
      page.on("request", (request) => {
        if (request.resourceType() === "image") request.abort();
        else request.continue();
      });

      await page.goto(link
        ,
        {
          waitUntil: "load",
          // Remove the timeout
          timeout: 0,
        }
      );
      const url = await page.url();
      if (url.includes('login')) {
        console.log('Dang nhap Spypro:');
        try {
          await page.waitFor('a.auth-google');
          await page.click('a.auth-google');
          await sleep(1000);
          console.log('DONe LOGIN');
        } catch(err){
          console.log('loi login: ', err)
        }
        
      }
      // if ((await page.$(".postlist h5")) !== null) {
      //   console.log("HET ITEM");
      //   break;
      // }
      // await page.waitFor(".card-text.update-time");
      let itemNumber = 0;
      for (let time = 0; time < 1; time++) {
        pageCount++;
        await sleep(500);
        let { data, number } = await page.evaluate((itemNumber) => {
          const final = [];
          const cards = document.querySelectorAll("li.col");
          for (let i = itemNumber; i < cards.length; i++) {
            let card = cards[i];
            // Author
            const author = card.querySelector(".author_name")?.innerText.trim();
            // store link
            let store = card.querySelector(".view_ga a")?.href;
            if (store?.includes("tools.spypro.io")) store = null;
            // GA
            let aList = card.querySelectorAll(
              ".view_ga.mb-1.mt-1.d-block:not(.view_store) a"
            );
            const ga = [];
            for (let j = 0; j < aList.length; j++) {
              ga.push(aList[j]?.innerText);
            }
            // pixel
            const pixelElement = card.querySelectorAll(".view_pixel a");
            const pixel = [];
            for (let j = 0; j < pixelElement.length; j++) {
              pixel.push(pixelElement[j].href.split("pixel/")[1].split("?")[0]);
            }
            // -- Reaction
            // Angry
            const angry =
              card.querySelector(".reaction_type.angry")?.innerText || 0;
            // Wow
            const wow =
              card.querySelector(".reaction_type.wow")?.innerText || 0;
            // haha
            const haha =
              card.querySelector(".reaction_type.haha")?.innerText || 0;
            // love
            const love =
              card.querySelector(".reaction_type.love")?.innerText || 0;
            // like
            const like =
              card.querySelector(".reaction_type.like")?.innerText || 0;
            // user-view
            const userView = card
              .querySelector(".views.text-white")
              ?.innerText.trim();
            // platform
            const platform = card.querySelector(".ads.platform_icon")
              ?.innerText;
            // image
            const imageUrl = card.querySelector(".pinthis")?.dataset?.pinMedia;
            // comment
            let comment = card
              .querySelector(".fa-comment")
              ?.parentNode?.innerText.split("\n")[1] || "0";
            comment = comment.toLowerCase();
            let react = card
              .querySelector(".fa-thumbs-up")
              ?.parentNode?.innerText.split("\n")[1] || "0";
            react = react.toLowerCase();
            // share
            let share = card
              .querySelector(".fa-share")
              .parentNode?.innerText.split("\n")[1] || "0";
            share = share.toLowerCase();
            // ID
            const id = card.querySelector(".post_info")?.dataset.postId;
            // Time
            const postTime = card.querySelector(".span_published_time")
              ?.innerText;

            // Get title and content
            const modal = document.querySelector(`div[data-post_id="${id}"]`);
            let content = "";
            let title = "";
            if (modal) {
              title = modal.querySelector(".productTitle")?.innerText;
              const contentEl = modal.querySelector(".post_content");
              if (contentEl.childNodes[3].nodeValue)
                content = contentEl.childNodes[3].nodeValue
                  ?.trim()
                  .replace("\n", " ");
              else if (contentEl.childNodes[4].nodeValue)
                content = contentEl.childNodes[4].nodeValue
                  ?.trim()
                  .replace("\n", " ");
              else if (contentEl.childNodes[5].nodeValue)
                content = contentEl.childNodes[5].nodeValue
                  ?.trim()
                  .replace("\n", " ");
            }

            final.push({
              id,
              react: react.includes("k") ? react.split("k")[0] * 1000 : react,
              author,
              store,
              ga,
              pixel,
              angry,
              wow,
              haha,
              love,
              like,
              userView,
              platform,
              imageUrl,
              comment: comment.includes("k")
                ? comment.split("k")[0] * 1000
                : comment,
              share: share.includes("k") ? share.split("k")[0] * 1000 : share,
              title,
              content,
              postTime,
            });
          }
          window.scrollTo(0, document.body.scrollHeight);
          itemNumber = cards.length;
          return { data: final, number: cards.length };
        }, itemNumber);
        itemNumber = number;
        // for (let o = 0; o < data.length; o++) {
        //   let item = data[o];
        //   try {
        //     const check = await midItem.checkSpyproExist(item.id);
        //     if (!check) {
        //       const result = await got(item.imageUrl);
        //       console.log('START UP FILE ' + o + ' OLD: ' + item.imageUrl);
        //       const newUrl = await util.upfile(result.rawBody);
        //       data[o] = { ...item, imageUrl: newUrl };
        //     }
        //   } catch (e) {
        //     console.log(e);
        //   }
        //   await sleep(100);
        // }
        data = await Promise.all(
          data.map((item) => {
            return new Promise(async (resolve, reject) => {
              try {
                if(!item.imageUrl){
                  console.log('KO CO ANHR')
                  return resolve({});
                } 
                const check = await midItem.checkSpyproExist(item.id);
                if (!check) {
                  console.log('VAN CON SPYPRO')
                  const result = await got(item.imageUrl);
                  const newUrl = await util.upfile(result.rawBody);
                  resolve({ ...item, imageUrl: newUrl });
                }
                resolve(item);
              } catch (e) {
                console.log(e);
                resolve(item);
              }
            });
          })
        );
        await midItem.insertManySpypro(
          data.map((item) => {
            if(!item.postTime) return {};
            let oldTime = item.postTime;
            let year = 0;
            let month = 0;
            let day = 0;
            let hour = 0;
            let min = 0;
            if (oldTime.includes("y")) {
              year = oldTime.split("y")[0];
            }
            if (oldTime.includes("m,")) {
              month = oldTime.split("m,")[0].split(" ").pop();
            }
            if (oldTime.includes("d")) {
              day = oldTime.split("d")[0].split(" ").pop();
            }
            if (oldTime.includes("h")) {
              hour = oldTime.split("h")[0].split(" ").pop();
            }
            if (oldTime.includes("min")) {
              min = oldTime.split("min")[0].split(" ").pop();
            }
            const now = moment(Date.now())
              .subtract(year, "years")
              .subtract(month, "months")
              .subtract(day, "days")
              .subtract(hour, "hours")
              .subtract(min, "minutes");
            return {
              ...item,
              postTime: now,
              platform: _.capitalize(item.platform),
            };
          })
        );
      }
      await sleep(500);
      console.log("PAGE: " + pageCount);
      if (!fromBegin) await midConfig.updateConfig(pageCount);
      await page.close();
    }
    if (!fromBegin) await midConfig.updateSpyproDate({ crawlToDate: fromDate });
    continueCrawl = false;
  }
  browser.close()
  // login
};
